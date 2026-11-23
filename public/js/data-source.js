(function (global) {
  'use strict';

  const MODE_KEY = 'hydrobot.dataMode.v1';
  const LIVE_TEL_KEY = 'hydrobot.live.telemetry.v1';
  const MODES = Object.freeze({ SIMULATED: 'simulated', LIVE: 'live' });
  const METRIC_KEYS = ['temp', 'hum', 'co2', 'wt', 'ph', 'ec', 'res'];

  const listeners = new Set();
  const sensorProviders = new Map();
  let liveTelemetryCache = {};
  let liveHistoryCache = {};
  let liveResourceSeries = [];

  function readSavedMode() {
    try {
      const m = localStorage.getItem(MODE_KEY);
      return m === MODES.LIVE ? MODES.LIVE : MODES.SIMULATED;
    } catch {
      return MODES.SIMULATED;
    }
  }

  function loadPersistedTelemetry() {
    try {
      const raw = localStorage.getItem(LIVE_TEL_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.telemetry && typeof parsed.telemetry === 'object') liveTelemetryCache = parsed.telemetry;
        if (parsed.telemetryHistory && typeof parsed.telemetryHistory === 'object') liveHistoryCache = parsed.telemetryHistory;
        if (Array.isArray(parsed.resourceSeries)) liveResourceSeries = parsed.resourceSeries;
      }
    } catch {}
  }

  function savePersistedTelemetry() {
    try {
      localStorage.setItem(LIVE_TEL_KEY, JSON.stringify({
        telemetry: liveTelemetryCache,
        telemetryHistory: liveHistoryCache,
        resourceSeries: liveResourceSeries,
      }));
    } catch {}
  }

  loadPersistedTelemetry();
  let currentMode = readSavedMode();

  function notify(reason = 'update') {
    listeners.forEach(fn => {
      try { fn(currentMode, reason); } catch (e) { console.error('DataMode listener error:', e); }
    });
  }

  const HydrobotData = {
    MODES,
    METRIC_KEYS,

    getMode() {
      return currentMode;
    },

    isSimulated() {
      return currentMode === MODES.SIMULATED;
    },

    isLive() {
      return currentMode === MODES.LIVE;
    },

    setMode(nextMode) {
      const normalized = nextMode === MODES.LIVE ? MODES.LIVE : MODES.SIMULATED;
      if (normalized === currentMode) return false;
      currentMode = normalized;
      try { localStorage.setItem(MODE_KEY, currentMode); } catch {}
      notify('mode');
      return true;
    },

    subscribe(fn) {
      if (typeof fn === 'function') listeners.add(fn);
      return () => listeners.delete(fn);
    },

    hydrateLiveData({ telemetry, telemetryHistory, resourceSeries } = {}) {
      if (telemetry && typeof telemetry === 'object') {
        liveTelemetryCache = JSON.parse(JSON.stringify(telemetry));
      }
      if (telemetryHistory && typeof telemetryHistory === 'object') {
        liveHistoryCache = JSON.parse(JSON.stringify(telemetryHistory));
      }
      if (Array.isArray(resourceSeries)) {
        liveResourceSeries = resourceSeries
          .filter(p => p && p.date && Number.isFinite(Number(p.water)) && Number.isFinite(Number(p.energy)))
          .map(p => ({ date: String(p.date), water: Number(p.water), energy: Number(p.energy), source: p.source || 'manual' }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }
      savePersistedTelemetry();
      if (currentMode === MODES.LIVE) notify('hydrate');
    },

    exportLiveData() {
      return {
        telemetry: liveTelemetryCache,
        telemetryHistory: liveHistoryCache,
        resourceSeries: liveResourceSeries,
      };
    },

    clearAllLiveData() {
      liveTelemetryCache = {};
      liveHistoryCache = {};
      liveResourceSeries = [];
      savePersistedTelemetry();
      if (currentMode === MODES.LIVE) notify('hydrate');
    },

    /**
     * Integration point for physical sensor gateways (MQTT, Modbus, WebSocket, REST, or Supabase Realtime).
     * Provider may implement:
     *   - getReadings(ghId): { temp, hum, co2, wt, ph, ec, res }
     *   - getMeta(ghId): { at, source, updatedAtByMetric }
     *   - getHistory(ghId, metricKey, range): [{ at, v, source }]
     *   - getResourceSeries(days): [{ date, water, energy }]
     */
    registerSensorProvider(id, provider) {
      if (!id || !provider) return;
      sensorProviders.set(String(id), provider);
      if (currentMode === MODES.LIVE) notify('telemetry');
    },

    unregisterSensorProvider(id) {
      if (sensorProviders.delete(String(id)) && currentMode === MODES.LIVE) {
        notify('telemetry');
      }
    },

    hasConnectedSensorProviders() {
      return sensorProviders.size > 0 || Object.keys(liveTelemetryCache).length > 0;
    },

    ingestSensorReading(ghId, metrics = {}, meta = {}) {
      if (!ghId || !metrics || typeof metrics !== 'object') return false;
      const now = Number(meta.at) || Date.now();
      const entry = liveTelemetryCache[ghId] || (liveTelemetryCache[ghId] = {
        values: {},
        updatedAtByMetric: {},
        lastAt: null,
        source: meta.source || 'sensor',
      });
      let changed = false;
      METRIC_KEYS.forEach(k => {
        if (!(k in metrics)) return;
        const raw = metrics[k];
        if (raw === null || raw === undefined || raw === '') return;
        const numVal = Number(raw);
        if (!Number.isFinite(numVal)) return;
        entry.values[k] = numVal;
        entry.updatedAtByMetric[k] = now;
        entry.lastAt = Math.max(entry.lastAt || 0, now);
        entry.source = meta.source || entry.source || 'sensor';
        const hk = `${ghId}:${k}`;
        const arr = liveHistoryCache[hk] || (liveHistoryCache[hk] = []);
        arr.push({ at: now, v: numVal, source: meta.source || 'sensor' });
        if (arr.length > 500) arr.shift();
        changed = true;
      });
      if (changed) {
        savePersistedTelemetry();
        if (currentMode === MODES.LIVE) notify('telemetry');
      }
      return changed;
    },

    setLiveResourceSeries(series = []) {
      liveResourceSeries = Array.isArray(series)
        ? series
            .filter(p => p && p.date && Number.isFinite(Number(p.water)) && Number.isFinite(Number(p.energy)))
            .map(p => ({ date: String(p.date), water: Number(p.water), energy: Number(p.energy), source: p.source || 'sensor' }))
            .sort((a, b) => a.date.localeCompare(b.date))
        : [];
      savePersistedTelemetry();
      if (currentMode === MODES.LIVE) notify('resources');
    },

    upsertResourcePoint(point) {
      if (!point || !point.date) return false;
      const water = Number(point.water);
      const energy = Number(point.energy);
      if (!Number.isFinite(water) || water < 0 || !Number.isFinite(energy) || energy < 0) return false;
      const nextPt = {
        date: String(point.date),
        water: +water.toFixed(1),
        energy: +energy.toFixed(1),
        source: point.source || 'manual',
      };
      const idx = liveResourceSeries.findIndex(p => p.date === nextPt.date);
      if (idx >= 0) liveResourceSeries[idx] = nextPt;
      else liveResourceSeries.push(nextPt);
      liveResourceSeries.sort((a, b) => a.date.localeCompare(b.date));
      if (liveResourceSeries.length > 365) liveResourceSeries = liveResourceSeries.slice(-365);
      savePersistedTelemetry();
      if (currentMode === MODES.LIVE) notify('resources');
      return true;
    },

    removeResourcePoint(date) {
      const before = liveResourceSeries.length;
      liveResourceSeries = liveResourceSeries.filter(p => p.date !== date);
      if (liveResourceSeries.length !== before) {
        savePersistedTelemetry();
        if (currentMode === MODES.LIVE) notify('resources');
        return true;
      }
      return false;
    },

    getLiveTelemetry(ghId, manualReadingsInput) {
      const values = {};
      const updatedAtByMetric = {};
      let lastAt = null;
      let source = null;

      for (const provider of sensorProviders.values()) {
        try {
          const pVals = provider.getReadings?.(ghId);
          if (pVals && typeof pVals === 'object') {
            const pMeta = provider.getMeta?.(ghId) || {};
            const pAt = Number(pMeta.at) || Date.now();
            METRIC_KEYS.forEach(k => {
              const raw = pVals[k];
              if (raw !== null && raw !== undefined && raw !== '' && Number.isFinite(Number(raw))) {
                const ts = Number(pMeta.updatedAtByMetric?.[k]) || pAt;
                values[k] = Number(raw);
                updatedAtByMetric[k] = ts;
                lastAt = Math.max(lastAt || 0, ts);
                source = pMeta.source || 'sensor';
              }
            });
          }
        } catch (e) {
          console.warn('Live sensor provider read failed:', e);
        }
      }

      const cached = liveTelemetryCache[ghId];
      if (cached && cached.values) {
        METRIC_KEYS.forEach(k => {
          const v = cached.values[k];
          if (v !== null && v !== undefined && Number.isFinite(Number(v))) {
            const ts = cached.updatedAtByMetric?.[k] || cached.lastAt || 0;
            if (!updatedAtByMetric[k] || ts >= updatedAtByMetric[k]) {
              values[k] = Number(v);
              updatedAtByMetric[k] = ts;
              lastAt = Math.max(lastAt || 0, ts);
              source = source || cached.source || 'sensor';
            }
          }
        });
      }

      const toEpochMs = v => {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) return n;
        const p = typeof v === 'string' ? Date.parse(v) : NaN;
        return Number.isFinite(p) && p > 0 ? p : 0;
      };
      const manualList = Array.isArray(manualReadingsInput)
        ? manualReadingsInput
        : manualReadingsInput
          ? [manualReadingsInput]
          : [];
      manualList
        .slice()
        .sort((a, b) => toEpochMs(a?.at) - toEpochMs(b?.at))
        .forEach(mr => {
          const mAt = toEpochMs(mr?.at);
          if (!mr || !mAt) return;
          METRIC_KEYS.forEach(k => {
            const raw = mr[k];
            if (raw !== null && raw !== undefined && raw !== '' && Number.isFinite(Number(raw))) {
              const existingAt = updatedAtByMetric[k] || 0;
              if (!existingAt || mAt >= existingAt) {
                values[k] = Number(raw);
                updatedAtByMetric[k] = mAt;
                lastAt = Math.max(lastAt || 0, mAt);
                source = source && source !== 'manual' ? 'hybrid' : 'manual';
              }
            }
          });
        });

      if (!Object.keys(values).length) return null;
      return { values, updatedAtByMetric, lastAt, source };
    },

    getLiveHistory(ghId, metricKey, range, manualReadings = []) {
      const spanMs = range === '24h' ? 24 * 3600e3 : range === '7d' ? 7 * 864e5 : 30 * 864e5;
      const minAt = Date.now() - spanMs;
      const pts = [];
      const toEpochMs = v => {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) return n;
        const p = typeof v === 'string' ? Date.parse(v) : NaN;
        return Number.isFinite(p) && p > 0 ? p : 0;
      };

      for (const provider of sensorProviders.values()) {
        try {
          const pHist = provider.getHistory?.(ghId, metricKey, range);
          if (Array.isArray(pHist)) {
            pHist.forEach(pt => {
              const ts = toEpochMs(pt?.at);
              if (pt && Number.isFinite(Number(pt.v)) && ts >= minAt) {
                pts.push({ at: ts, v: Number(pt.v), source: pt.source || 'sensor' });
              }
            });
          }
        } catch {}
      }

      const cached = liveHistoryCache[`${ghId}:${metricKey}`] || [];
      cached.forEach(pt => {
        const ts = toEpochMs(pt?.at);
        if (pt && Number.isFinite(Number(pt.v)) && ts >= minAt) {
          pts.push({ at: ts, v: Number(pt.v), source: pt.source || 'sensor' });
        }
      });

      if (Array.isArray(manualReadings)) {
        manualReadings.forEach(mr => {
          const mv = mr?.[metricKey];
          const ts = toEpochMs(mr?.at);
          if (mr && ts >= minAt && mv !== null && mv !== undefined && mv !== '' && Number.isFinite(Number(mv))) {
            pts.push({ at: ts, v: Number(mv), source: 'manual' });
          }
        });
      }

      return pts.sort((a, b) => a.at - b.at);
    },

    getLiveResourceSeries(days) {
      for (const provider of sensorProviders.values()) {
        try {
          const s = provider.getResourceSeries?.(days);
          if (Array.isArray(s) && s.length) return s.slice(-days);
        } catch {}
      }
      return liveResourceSeries.slice(-days);
    },
  };

  global.HydrobotData = HydrobotData;
})(window);

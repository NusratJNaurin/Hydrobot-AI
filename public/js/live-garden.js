(function () {
  'use strict';

  const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes without reporting
  const NO_FLOW_FAULT_MS = 30 * 1000; // 30+ seconds on without flow -> fault

  const COMPONENTS = [
    { id: 'bed-1', label: 'Shelved Grow Rack A', short: 'Rack A', kind: 'bed', ghId: 'gh-c', sensorId: 'sensor-4', system: '3-tier indoor grow rack · LED', crop: 'Butterhead Lettuce' },
    { id: 'bed-2', label: 'Shelved Grow Rack B', short: 'Rack B', kind: 'bed', ghId: 'gh-c', sensorId: 'sensor-4', system: '3-tier indoor grow rack · LED', crop: 'Butterhead Lettuce' },
    { id: 'channel-bed-1', label: 'NFT Channels West', short: 'NFT West', kind: 'bed', ghId: 'gh-a', sensorId: 'sensor-2', system: '5-channel NFT bench', crop: 'Butterhead Lettuce' },
    { id: 'channel-bed-2', label: 'NFT Channels East', short: 'NFT East', kind: 'bed', ghId: 'gh-a', sensorId: 'sensor-2', system: '5-channel NFT bench', crop: 'Butterhead Lettuce' },
    { id: 'tower-1', label: 'Vertical Tower 1', short: 'Tower 1', kind: 'bed', ghId: 'gh-d', sensorId: 'sensor-3', system: '8-tier vertical aeroponic column', crop: 'Greens & Herbs' },
    { id: 'tower-2', label: 'Vertical Tower 2', short: 'Tower 2', kind: 'bed', ghId: 'gh-d', sensorId: 'sensor-3', system: '8-tier vertical aeroponic column', crop: 'Greens & Herbs' },
    { id: 'tower-3', label: 'Vertical Tower 3', short: 'Tower 3', kind: 'bed', ghId: 'gh-d', sensorId: 'sensor-3', system: '8-tier vertical aeroponic column', crop: 'Greens & Herbs' },
    { id: 'tower-4', label: 'Vertical Tower 4', short: 'Tower 4', kind: 'bed', ghId: 'gh-d', sensorId: 'sensor-3', system: '8-tier vertical aeroponic column', crop: 'Greens & Herbs' },
    { id: 'tower-5', label: 'Vertical Tower 5', short: 'Tower 5', kind: 'bed', ghId: 'gh-d', sensorId: 'sensor-3', system: '8-tier vertical aeroponic column', crop: 'Greens & Herbs' },
    { id: 'tower-6', label: 'Vertical Tower 6', short: 'Tower 6', kind: 'bed', ghId: 'gh-d', sensorId: 'sensor-3', system: '8-tier vertical aeroponic column', crop: 'Greens & Herbs' },
    { id: 'tower-7', label: 'Vertical Tower 7', short: 'Tower 7', kind: 'bed', ghId: 'gh-d', sensorId: 'sensor-3', system: '8-tier vertical aeroponic column', crop: 'Greens & Herbs' },
    { id: 'tower-8', label: 'Vertical Tower 8', short: 'Tower 8', kind: 'bed', ghId: 'gh-d', sensorId: 'sensor-3', system: '8-tier vertical aeroponic column', crop: 'Greens & Herbs' },
    { id: 'tank-1', label: 'Main Nutrient Tank', short: 'Tank (1000 L)', kind: 'tank', ghId: 'gh-a', sensorId: 'sensor-1', capacityLiters: 1000 },
    { id: 'pump-1', label: 'Main Circulation Pump', short: 'Pump', kind: 'pump', ghId: 'gh-a', sensorId: 'sensor-2' },
    { id: 'sensor-1', label: 'Reservoir Level & EC', short: 'Sensor 1', kind: 'sensor', ghId: 'gh-a', metric: 'res', secMetric: 'ec', targetId: 'tank-1' },
    { id: 'sensor-2', label: 'NFT Canopy & Flow', short: 'Sensor 2', ghId: 'gh-a', metric: 'temp', secMetric: 'hum', targetId: 'channel-bed-1' },
    { id: 'sensor-3', label: 'Tower pH & Climate', short: 'Sensor 3', ghId: 'gh-d', metric: 'ph', secMetric: 'temp', targetId: 'tower-1' },
    { id: 'sensor-4', label: 'Rack Temp & Humidity', short: 'Sensor 4', ghId: 'gh-c', metric: 'temp', secMetric: 'hum', targetId: 'bed-1' },
  ];

  const compById = id => COMPONENTS.find(c => c.id === id) || null;

  // Simulator state bridged cleanly from app data layer (no direct Supabase calls here)
  const Sim = {
    initialized: false,
    sensorMeta: {
      'sensor-1': { label: 'Reservoir', ghId: 'gh-a', metric: 'res', unit: '%', lastReportedAt: Date.now() - 4000, stalled: false },
      'sensor-2': { label: 'NFT Temp', ghId: 'gh-a', metric: 'temp', unit: '°C', lastReportedAt: Date.now() - 3000, stalled: false },
      'sensor-3': { label: 'Tower pH', ghId: 'gh-d', metric: 'ph', unit: 'pH', lastReportedAt: Date.now() - 5000, stalled: false },
      'sensor-4': { label: 'Rack Temp', ghId: 'gh-c', metric: 'temp', unit: '°C', lastReportedAt: Date.now() - 2000, stalled: false },
    },
    pump: {
      id: 'pump-1',
      state: 'off', // 'off' | 'starting' | 'running' | 'fault'
      flowLpm: 0,
      startedAt: null,
      stopAt: null,
      maxRuntimeMin: 10,
      simulateNoFlowFault: false,
      lastFlowAt: Date.now(),
      lifecycle: 'Idle · Pump off',
      lastCommandAt: null,
      lastCommandBy: '',
    },
    viewMode: '3d', // '3d' | 'list'
    cameraPreset: 'isometric',
    selectedId: null,
    panelOpen: false,
    chartMetric: 'temp',
    lastTickAt: Date.now(),
    sceneCtrl: null,
    sceneLoading: false,
    sceneError: '',
    panelChart: null,
    tickTimer: null,
    simDriftTimer: null,
    startPrimeTimer: null,
  };

  function isSimulatedSource() {
    // True until a real connected gateway / live telemetry feed replaces simulator data
    return !window.LIVE_TELEMETRY_CONNECTED;
  }

  function isSensorOffline(sensorId) {
    const s = Sim.sensorMeta[sensorId];
    if (!s) return true;
    return (Date.now() - s.lastReportedAt) >= OFFLINE_THRESHOLD_MS || Boolean(s.stalled);
  }

  function updatedAgoText(ts) {
    if (!ts) return 'Never';
    const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (sec < 60) return `Updated ${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `Updated ${min}m ago`;
    return `Updated ${Math.floor(min / 60)}h ago`;
  }

  function sensorStatusFor(sensorId) {
    if (isSensorOffline(sensorId)) return 'offline';
    const m = Sim.sensorMeta[sensorId];
    const r = readings(m.ghId);
    const t = targets(m.ghId);
    return metricStatus(r[m.metric], t[m.metric]);
  }

  function overallGardenStatus() {
    if (Sim.pump.state === 'fault') return 'crit';
    let worst = 'ok';
    Object.keys(Sim.sensorMeta).forEach(id => {
      const st = sensorStatusFor(id);
      if (st === 'crit') worst = 'crit';
      else if ((st === 'warn' || st === 'offline') && worst === 'ok') worst = 'warn';
    });
    return worst;
  }

  function isWorkerRestricted() {
    return !can('commands') || (typeof AuthState !== 'undefined' && AuthState.role === 'worker');
  }

  function formatSensorDisplay(sensorId) {
    const m = Sim.sensorMeta[sensorId];
    if (!m) return { text: '—', status: 'offline', offline: true };
    if (isSensorOffline(sensorId)) {
      return { text: 'Offline', raw: null, status: 'offline', offline: true };
    }
    const def = sensorDef(m.metric);
    const val = readings(m.ghId)[m.metric];
    const formatted = def ? num(val, def.dec) : String(val);
    const st = sensorStatusFor(sensorId);
    return { text: formatted, raw: val, unit: def?.unit || m.unit || '', status: st, offline: false };
  }

  function pushStateToScene() {
    const ctrl = Sim.sceneCtrl;
    if (!ctrl) return;

    Object.keys(Sim.sensorMeta).forEach(sensorId => {
      const d = formatSensorDisplay(sensorId);
      if (d.offline) {
        ctrl.setSensorOffline(sensorId, true);
      } else {
        ctrl.setSensorValue(sensorId, d.text, d.status);
      }
    });

    // Only report 'running' when flow is strictly > 0; otherwise 'starting' / 'fault' / 'off'
    const visualPumpState =
      Sim.pump.state === 'running' && Sim.pump.flowLpm > 0
        ? 'running'
        : Sim.pump.state === 'fault'
          ? 'fault'
          : Sim.pump.state === 'starting'
            ? 'starting'
            : 'off';
    ctrl.setPumpState(visualPumpState, 'pump-1');

    if (typeof ctrl.setTankLevel === 'function') {
      const resOffline = isSensorOffline('sensor-1');
      if (!resOffline) {
        ctrl.setTankLevel('tank-1', readings('gh-a').res);
      }
    }
  }

  function simulateDataTick() {
    if (Sim.pump.state === 'starting' && Sim.pump.startedAt) {
      const elapsed = Date.now() - Sim.pump.startedAt;
      if (Sim.pump.flowLpm <= 0 && elapsed >= NO_FLOW_FAULT_MS) {
        Sim.pump.state = 'fault';
        Sim.pump.flowLpm = 0;
        Sim.pump.lifecycle = 'Fault · On for 30s+ with no confirmed flow';
        pushStateToScene();
        updateInPlace();
        toast('Pump fault: no water flow confirmed after 30 seconds.', 'error');
      }
    }

    if (Sim.pump.state === 'running' && Sim.pump.stopAt && Date.now() >= Sim.pump.stopAt) {
      Sim.pump.state = 'off';
      Sim.pump.flowLpm = 0;
      Sim.pump.startedAt = null;
      Sim.pump.stopAt = null;
      Sim.pump.lifecycle = 'Completed · Max runtime reached';
      pushStateToScene();
      updateInPlace();
      toast('Scheduled irrigation cycle completed.');
    }

    // Subtle simulated drift every ~6 seconds on active gauges
    const now = Date.now();
    if (now - Sim.lastTickAt >= 6000) {
      Sim.lastTickAt = now;
      const jitter = (base, amp, min, max, dec) => +clamp(base + (Math.random() - 0.5) * amp, min, max).toFixed(dec);
      CURRENT['gh-a'].temp = jitter(CURRENT['gh-a'].temp, 0.2, 18.5, 24.5, 1);
      CURRENT['gh-a'].hum = Math.round(jitter(CURRENT['gh-a'].hum, 2, 55, 76, 0));
      CURRENT['gh-c'].temp = jitter(CURRENT['gh-c'].temp, 0.25, 20.0, 26.5, 1);
      CURRENT['gh-c'].hum = Math.round(jitter(CURRENT['gh-c'].hum, 2, 52, 74, 0));
      CURRENT['gh-d'].ph = jitter(CURRENT['gh-d'].ph, 0.04, 5.4, 6.6, 2);
      CURRENT['gh-d'].temp = jitter(CURRENT['gh-d'].temp, 0.2, 17.5, 24.0, 1);
      if (Sim.pump.state === 'running') {
        Sim.pump.flowLpm = +jitter(14.2, 0.6, 12.4, 15.8, 1);
      }

      Object.values(Sim.sensorMeta).forEach(m => {
        if (!m.stalled) m.lastReportedAt = now;
      });
      pushStateToScene();
      updateLiveTimestampsOnly();
    }
  }

  function updateLiveTimestampsOnly() {
    const newestTs = Math.max(...Object.values(Sim.sensorMeta).map(s => s.lastReportedAt || 0));
    const topAge = document.querySelector('[data-lg-top-age]');
    if (topAge) topAge.textContent = updatedAgoText(newestTs);

    document.querySelectorAll('[data-lg-sensor-age]').forEach(el => {
      const sid = el.getAttribute('data-lg-sensor-age');
      const m = Sim.sensorMeta[sid];
      if (!m) return;
      el.textContent = isSensorOffline(sid) ? 'Offline (10m+ no data)' : updatedAgoText(m.lastReportedAt);
    });

    const pumpRem = document.querySelector('[data-lg-pump-remaining]');
    if (pumpRem) {
      if (Sim.pump.state === 'running' && Sim.pump.stopAt) {
        const leftSec = Math.max(0, Math.ceil((Sim.pump.stopAt - Date.now()) / 1000));
        const mm = Math.floor(leftSec / 60);
        const ss = String(leftSec % 60).padStart(2, '0');
        pumpRem.textContent = `${mm}m ${ss}s remaining`;
      } else if (Sim.pump.state === 'starting' && Sim.pump.startedAt) {
        const waitSec = Math.floor((Date.now() - Sim.pump.startedAt) / 1000);
        pumpRem.textContent = `Priming (${waitSec}s / 30s watchdog)`;
      } else {
        pumpRem.textContent = '';
      }
    }
  }

  // Data-layer command dispatcher (records to Store and future Supabase equipment_commands via data bridge)
  async function dispatchEquipmentCommand(action, maxRuntimeMin) {
    const cmdId = uid('CMD');
    const by = currentUser().name;
    const isStart = action === 'start';
    const label = isStart
      ? `Irrigation pump: Start watering (max ${maxRuntimeMin} min)`
      : 'Irrigation pump: Stop watering';

    // Record via existing Store command log
    await Store.put('commands', {
      id: cmdId,
      ghId: 'gh-a',
      device: 'pump',
      action,
      maxRuntimeMin: isStart ? maxRuntimeMin : 0,
      label,
      at: Date.now(),
      by,
      status: isSimulatedSource() ? 'simulated_queued' : 'queued',
    });

    // Persist command to Supabase equipment_commands via RLS when authenticated on a real Supabase farm
    const hasValidFarmUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(AuthState?.currentFarmId || '').trim());
    if (typeof sbClient !== 'undefined' && sbClient && AuthState.session && !AuthState.isDemoAuth && hasValidFarmUuid) {
      if (typeof logEquipmentCommand === 'function') {
        await logEquipmentCommand({
          device: 'pump-1',
          command: action,
          maxRuntimeMinutes: isStart ? maxRuntimeMin : 0,
        });
      } else {
        const { error } = await sbClient.from('equipment_commands').insert({
          farm_id: AuthState.currentFarmId,
          device: 'pump-1',
          command: action,
          max_runtime_minutes: isStart ? maxRuntimeMin : 0,
          requested_by: AuthState.user?.id || null,
          status: 'queued',
        });
        if (error) throw error;
      }
    }

    if (Sim.startPrimeTimer) {
      clearTimeout(Sim.startPrimeTimer);
      Sim.startPrimeTimer = null;
    }

    Sim.pump.lastCommandAt = Date.now();
    Sim.pump.lastCommandBy = by;

    if (!isStart) {
      Sim.pump.state = 'off';
      Sim.pump.flowLpm = 0;
      Sim.pump.startedAt = null;
      Sim.pump.stopAt = null;
      Sim.pump.lifecycle = `Stopped by ${by}`;
      pushStateToScene();
      updateInPlace();
      return 'Irrigation pump stopped.';
    }

    // Never animate water simply because someone pressed Start!
    // Enter 'starting' with flowLpm = 0 and wait for flow sensor confirmation (> 0).
    Sim.pump.state = 'starting';
    Sim.pump.flowLpm = 0;
    Sim.pump.startedAt = Date.now();
    Sim.pump.maxRuntimeMin = maxRuntimeMin;
    Sim.pump.stopAt = Date.now() + maxRuntimeMin * 60 * 1000;
    Sim.pump.lifecycle = `Starting... awaiting flow confirmation (max ${maxRuntimeMin} min)`;
    pushStateToScene();
    updateInPlace();

    if (!Sim.pump.simulateNoFlowFault) {
      Sim.startPrimeTimer = setTimeout(() => {
        if (Sim.pump.state !== 'starting') return;
        Sim.pump.flowLpm = 14.2;
        Sim.pump.state = 'running';
        Sim.pump.lastFlowAt = Date.now();
        Sim.pump.lifecycle = `Running · Flow confirmed (14.2 L/min, max ${maxRuntimeMin} min)`;
        pushStateToScene();
        updateInPlace();
      }, 2400);
    }

    return `Start command (${maxRuntimeMin} min max) sent — awaiting flow confirmation.`;
  }

  function openWateringModal(action) {
    if (isWorkerRestricted()) {
      return toast('Equipment controls are disabled for the Farm Worker role.', 'error');
    }
    const isStart = action === 'start';
    openModal({
      title: isStart ? 'Confirm Start Watering' : 'Confirm Stop Watering',
      submitLabel: isStart ? 'Confirm Start Watering' : 'Confirm Stop Watering',
      danger: !isStart,
      body: `
        <div class="notice ${isStart ? '' : 'warn'}">${ic('drop')}<div>
          <b>${isSimulatedSource() ? 'SIMULATED MODE' : 'LIVE CONTROLLER'}:</b>
          ${isStart
            ? 'Water animation in the 3D garden starts only after positive pipe flow (> 0 L/min) is confirmed. If no flow arrives within 30 seconds, the pump enters Fault status.'
            : 'Stopping immediately halts circulation flow across channels, towers, and racks.'}
        </div></div>
        <dl class="kv">
          <dt>Equipment</dt><dd>pump-1 · Main Circulation Pump</dd>
          <dt>Requested by</dt><dd>${esc(currentUser().name)} (${esc(currentUser().role)})</dd>
        </dl>
        ${isStart ? `
          <div class="field">
            <label for="lgMaxRuntime">Maximum running time</label>
            <select id="lgMaxRuntime" name="maxRuntimeMin" class="select">
              <option value="5">5 minutes</option>
              <option value="10" selected>10 minutes (default)</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
            </select>
            <span class="hint">Safety shutoff timer automatically stops watering when elapsed.</span>
          </div>
          <label class="split" style="font-size:.8rem;color:var(--muted);cursor:pointer">
            <input type="checkbox" name="simulateNoFlow" id="lgSimNoFlow" style="width:16px;height:16px">
            Simulate dry-run / zero-flow fault check (triggers red warning after 30s without flow)
          </label>
        ` : ''}
        <label class="split" style="font-weight:600">
          <input type="checkbox" id="lgCmdAck" name="ack" style="width:18px;height:18px">
          I have verified lines and valves are safe for this command.
        </label>
        <p class="err" id="err-ack"></p>
      `,
      validate: d => ({ ack: !d.ack && 'Tick the safety confirmation box to continue.' }),
      submit: async d => {
        Sim.pump.simulateNoFlowFault = Boolean(d.simulateNoFlow);
        const mins = Number(d.maxRuntimeMin) || 10;
        const msg = await dispatchEquipmentCommand(action, mins);
        return msg;
      },
    });
  }

  function alertsForComponent(comp) {
    if (!comp) return [];
    const list = activeAlerts().filter(a => {
      if (comp.kind === 'tank') return a.kind === 'Water level' || a.id.includes(comp.ghId);
      if (comp.kind === 'pump') return a.id.includes('gh-a') || a.kind === 'Water level';
      return a.id.includes(comp.ghId);
    });
    if (comp.kind === 'pump' && Sim.pump.state === 'fault') {
      list.unshift({
        id: 'pump-1-noflow-fault',
        sev: 'crit',
        kind: 'Pump fault',
        icon: 'alert',
        title: 'Pump energized 30+ seconds with zero confirmed flow',
        detail: 'Check suction valve on tank-1 and priming chamber before restarting.',
        age: 1,
        state: 'new',
        synthetic: true,
      });
    }
    return list.slice(0, 4);
  }

  function renderPanelChart(ghId, metricKey) {
    if (Sim.panelChart) {
      Sim.panelChart.destroy();
      Sim.panelChart = null;
    }
    const canvas = document.getElementById('lgPanelChart');
    if (!canvas || !window.Chart) return;

    const pts = history(ghId, metricKey, '24h');
    const def = sensorDef(metricKey);
    const t = targets(ghId)[metricKey];
    const th = { text: cssVar('--muted') || '#53645b', grid: cssVar('--line-2') || '#e8eeea' };
    const accent = cssVar('--accent') || '#0f9d69';

    Sim.panelChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: pts.map(p => new Date(p.at).toLocaleTimeString(undefined, { hour: 'numeric' })),
        datasets: [
          {
            label: `${def.label} (${def.unit || 'val'}) · SIMULATED`,
            data: pts.map(p => p.v),
            borderColor: accent,
            backgroundColor: accent + '20',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Target min',
            data: pts.map(() => t[0]),
            borderColor: th.text,
            borderDash: [4, 4],
            pointRadius: 0,
            borderWidth: 1,
            fill: false,
          },
          {
            label: 'Target max',
            data: pts.map(() => t[1]),
            borderColor: th.text,
            borderDash: [4, 4],
            pointRadius: 0,
            borderWidth: 1,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { boxWidth: 10, color: th.text, font: { size: 11 } } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: th.text, maxTicksLimit: 6, font: { size: 10 } } },
          y: { grid: { color: th.grid }, ticks: { color: th.text, font: { size: 10 } } },
        },
      },
    });
  }

  function renderDrawerContent() {
    const drawer = document.getElementById('lgDrawer');
    if (!drawer) return;

    const comp = Sim.selectedId ? compById(Sim.selectedId) : null;
    if (!comp || !Sim.panelOpen) {
      drawer.classList.remove('open');
      if (Sim.panelChart) {
        Sim.panelChart.destroy();
        Sim.panelChart = null;
      }
      return;
    }
    drawer.classList.add('open');

    const simPill = isSimulatedSource()
      ? '<span class="lg-sim-badge">SIMULATED</span>'
      : '<span class="tag live">LIVE SENSOR</span>';

    let bodyHtml = '';

    if (comp.kind === 'bed') {
      const gh = ghById(comp.ghId);
      const r = readings(comp.ghId);
      const t = targets(comp.ghId);
      const sMeta = Sim.sensorMeta[comp.sensorId];
      const offline = isSensorOffline(comp.sensorId);
      const tempSt = offline ? 'offline' : metricStatus(r.temp, t.temp);
      const humSt = offline ? 'offline' : metricStatus(r.hum, t.hum);
      const overallBedSt = offline ? 'mute' : (tempSt === 'crit' || humSt === 'crit') ? 'crit' : (tempSt === 'warn' || humSt === 'warn') ? 'warn' : 'ok';
      const stLabel = offline ? 'Offline' : tempSt === 'ok' && humSt === 'ok' ? 'Optimal' : (overallBedSt === 'crit' ? 'Critical' : 'Attention');

      const associated = alertsForComponent(comp);
      bodyHtml = `
        <div class="split" style="justify-content:space-between">
          <span class="badge b-${overallBedSt}">${stLabel}</span>
          ${simPill}
        </div>
        <div class="small muted">${esc(comp.system)} · ${esc(comp.crop)} (${esc(gh.name)})</div>
        <div class="lg-metric-grid">
          <div class="lg-metric-box ${offline ? 'offline' : ''}">
            <span>Temperature</span>
            <b style="color:var(--${offline ? 'muted' : tempSt === 'ok' ? 'fg' : tempSt})">${offline ? 'Offline' : `${num(r.temp, 1)} °C`}</b>
            <span class="small">Target ${t.temp[0]}–${t.temp[1]} °C</span>
          </div>
          <div class="lg-metric-box ${offline ? 'offline' : ''}">
            <span>Humidity</span>
            <b style="color:var(--${offline ? 'muted' : humSt === 'ok' ? 'fg' : humSt})">${offline ? 'Offline' : `${num(r.hum, 0)} %`}</b>
            <span class="small">Target ${t.hum[0]}–${t.hum[1]} %</span>
          </div>
          <div class="lg-metric-box">
            <span>Sensor (${esc(comp.sensorId)})</span>
            <b style="font-size:.95rem">${offline ? 'Offline' : stLabel}</b>
            <span class="small" data-lg-sensor-age="${comp.sensorId}">${offline ? 'No report >=10m' : updatedAgoText(sMeta.lastReportedAt)}</span>
          </div>
          <div class="lg-metric-box">
            <span>EC / pH</span>
            <b style="font-size:.95rem">${offline ? '—' : `${num(r.ec, 2)} · ${num(r.ph, 2)}`}</b>
            <span class="small">mS/cm · pH</span>
          </div>
        </div>
        <div>
          <div class="split" style="justify-content:space-between;margin-bottom:6px">
            <h3>24h Sensor History</h3>
            <div class="seg">
              <button type="button" data-lg-chart-metric="temp" aria-pressed="${Sim.chartMetric === 'temp'}">Temp</button>
              <button type="button" data-lg-chart-metric="hum" aria-pressed="${Sim.chartMetric === 'hum'}">Humidity</button>
              <button type="button" data-lg-chart-metric="ph" aria-pressed="${Sim.chartMetric === 'ph'}">pH</button>
            </div>
          </div>
          <div class="chart-box"><canvas id="lgPanelChart" role="img" aria-label="24 hour sensor history"></canvas></div>
        </div>
        <div>
          <h3 style="margin-bottom:6px">Active Alerts (${associated.length})</h3>
          ${renderComponentAlerts(associated)}
        </div>
      `;
    } else if (comp.kind === 'tank') {
      const offline = isSensorOffline('sensor-1');
      const r = readings('gh-a');
      const pct = clamp(Math.round(r.res), 0, 100);
      const liters = Math.round((pct / 100) * comp.capacityLiters);
      const fillCls = pct < 25 ? 'crit' : pct < 45 ? 'warn' : '';
      const sMeta = Sim.sensorMeta['sensor-1'];
      const associated = alertsForComponent(comp);
      bodyHtml = `
        <div class="split" style="justify-content:space-between">
          <span class="badge b-${offline ? 'mute' : pct < 25 ? 'crit' : pct < 45 ? 'warn' : 'ok'}">${offline ? 'Offline' : `${pct}% Full`}</span>
          ${simPill}
        </div>
        <div class="lg-tank-gauge">
          <div class="split" style="justify-content:space-between">
            <b>Water Level</b>
            <span class="mono" style="font-weight:700">${offline ? 'Offline (no current reading)' : `${pct}% (${num(liters)} / ${num(comp.capacityLiters)} L)`}</span>
          </div>
          <div class="lg-tank-bar" role="progressbar" aria-valuenow="${offline ? 0 : pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="lg-tank-fill ${fillCls}" style="width:${offline ? 0 : pct}%"></div>
          </div>
          <div class="split" style="justify-content:space-between;font-size:.75rem;color:var(--muted)">
            <span data-lg-sensor-age="sensor-1">${offline ? 'Offline (>=10m)' : updatedAgoText(sMeta.lastReportedAt)}</span>
            <span>EC ${offline ? '—' : num(r.ec, 2) + ' mS/cm'}</span>
          </div>
        </div>
        <div>
          <h3 style="margin-bottom:6px">Associated Alerts (${associated.length})</h3>
          ${renderComponentAlerts(associated)}
        </div>
      `;
    } else if (comp.kind === 'pump') {
      const p = Sim.pump;
      const restricted = isWorkerRestricted();
      const cmds = Store.all('commands').filter(c => c.device === 'pump').sort((a, b) => b.at - a.at).slice(0, 4);
      const stBadge = p.state === 'running'
        ? '<span class="badge b-ok">Running</span>'
        : p.state === 'starting'
          ? '<span class="badge b-warn">Starting...</span>'
          : p.state === 'fault'
            ? '<span class="badge b-crit">Fault · No Flow</span>'
            : '<span class="badge b-mute">Off</span>';
      const associated = alertsForComponent(comp);
      bodyHtml = `
        <div class="split" style="justify-content:space-between">
          ${stBadge}
          ${simPill}
        </div>
        ${p.state === 'fault' ? `<div class="notice crit">${ic('alert')}<div><b>Flow Fault:</b> Pump remained energized for 30+ seconds without positive flow. Water animation is disabled.</div></div>` : ''}
        <div class="lg-metric-grid">
          <div class="lg-metric-box">
            <span>Flow Rate</span>
            <b>${num(p.flowLpm, 1)} L/min</b>
            <span class="small">${p.flowLpm > 0 ? 'Positive flow confirmed' : 'Zero flow'}</span>
          </div>
          <div class="lg-metric-box">
            <span>Max Runtime</span>
            <b>${p.maxRuntimeMin} min</b>
            <span class="small" data-lg-pump-remaining></span>
          </div>
        </div>
        <div class="lg-lifecycle">
          <b>Command Lifecycle</b>
          <span>${esc(p.lifecycle)}</span>
          ${p.lastCommandAt ? `<span class="small muted">Last action ${updatedAgoText(p.lastCommandAt)} by ${esc(p.lastCommandBy)}</span>` : ''}
        </div>
        <div class="lg-pump-actions">
          <button type="button" class="btn primary" data-lg-pump="start" ${restricted || p.state === 'running' || p.state === 'starting' ? 'disabled' : ''}>
            ${ic('power')}Start Watering
          </button>
          <button type="button" class="btn danger" data-lg-pump="stop" ${restricted || p.state === 'off' ? 'disabled' : ''}>
            ${ic('x')}Stop Watering
          </button>
        </div>
        ${restricted ? `<div class="notice">${ic('info')}<div>Irrigation controls are disabled for the <b>Farm Worker</b> role.</div></div>` : ''}
        ${associated.length ? `<div><h3 style="margin-bottom:6px">Alerts</h3>${renderComponentAlerts(associated)}</div>` : ''}
        ${cmds.length ? `<div><h3 style="margin-bottom:6px">Command Log</h3><div style="display:grid;gap:6px">${cmds.map(c => `<div class="lg-lifecycle"><div class="split" style="justify-content:space-between"><b>${esc(c.label)}</b><span class="small muted">${fmtDT(c.at)}</span></div><span class="small muted">By ${esc(c.by)} · ${esc(c.status)}</span></div>`).join('')}</div></div>` : ''}
      `;
    } else if (comp.kind === 'sensor') {
      const m = Sim.sensorMeta[comp.id];
      const d = formatSensorDisplay(comp.id);
      const secDef = sensorDef(comp.secMetric);
      const secVal = d.offline ? 'Offline' : `${num(readings(comp.ghId)[comp.secMetric], secDef.dec)} ${secDef.unit}`.trim();
      const associated = alertsForComponent(comp);
      bodyHtml = `
        <div class="split" style="justify-content:space-between">
          <span class="badge b-${d.offline ? 'mute' : d.status}">${d.offline ? 'Offline' : d.status === 'ok' ? 'Normal' : d.status === 'warn' ? 'Warning' : 'Critical'}</span>
          ${simPill}
        </div>
        <div class="lg-metric-grid">
          <div class="lg-metric-box ${d.offline ? 'offline' : ''}">
            <span>${esc(sensorDef(comp.metric).label)}</span>
            <b>${d.offline ? 'Offline' : `${d.text} ${d.unit}`.trim()}</b>
            <span class="small" data-lg-sensor-age="${comp.id}">${d.offline ? 'Offline (>=10m)' : updatedAgoText(m.lastReportedAt)}</span>
          </div>
          <div class="lg-metric-box ${d.offline ? 'offline' : ''}">
            <span>${esc(secDef.label)}</span>
            <b>${secVal}</b>
            <span class="small">Secondary probe</span>
          </div>
        </div>
        <div class="toolbar">
          <button type="button" class="btn sm" data-lg-toggle-stall="${comp.id}">
            ${m.stalled ? 'Resume Simulated Feed' : 'Simulate 10m+ Offline'}
          </button>
        </div>
        <div>
          <h3 style="margin-bottom:6px">24h History (${esc(sensorDef(comp.metric).label)})</h3>
          <div class="chart-box"><canvas id="lgPanelChart" role="img" aria-label="24 hour sensor history"></canvas></div>
        </div>
        <div>
          <h3 style="margin-bottom:6px">Open Alerts (${associated.length})</h3>
          ${renderComponentAlerts(associated)}
        </div>
      `;
    }

    drawer.innerHTML = `
      <div class="lg-drawer-head">
        <div>
          <div class="mono small muted">${esc(comp.id)}</div>
          <h2>${esc(comp.label)}</h2>
        </div>
        <button type="button" class="icon-btn" data-lg-close aria-label="Close details panel" style="width:34px;height:34px">${ic('x')}</button>
      </div>
      <div class="lg-drawer-body">${bodyHtml}</div>
    `;

    if (comp.kind === 'bed') {
      renderPanelChart(comp.ghId, Sim.chartMetric);
    } else if (comp.kind === 'sensor') {
      renderPanelChart(comp.ghId, comp.metric);
    } else if (Sim.panelChart) {
      Sim.panelChart.destroy();
      Sim.panelChart = null;
    }
  }

  function renderComponentAlerts(list) {
    if (!list.length) {
      return '<p class="small muted">No open alerts for this component.</p>';
    }
    const allowAck = !isWorkerRestricted() || can('harvest');
    return `<div class="alerts">${list.map(a => `
      <div class="alert ${a.sev} ${a.state === 'acknowledged' ? 'acked' : ''}" style="grid-template-columns:1fr">
        <div class="split" style="justify-content:space-between">
          <b>${esc(a.title)}</b>
          ${badge(a.sev)}
        </div>
        <p>${esc(a.detail)}</p>
        <div class="split" style="justify-content:space-between;margin-top:4px">
          <span class="small muted">${ageText(a.age)}</span>
          ${!a.synthetic && a.state === 'new' && allowAck ? `<button type="button" class="btn sm" data-act="alert-ack" data-id="${esc(a.id)}">Acknowledge</button>` : a.state === 'acknowledged' ? '<span class="small muted">Acknowledged</span>' : ''}
        </div>
      </div>
    `).join('')}</div>`;
  }

  function renderSensorStrip() {
    const strip = document.getElementById('lgSensorStrip');
    if (!strip) return;
    const cards = ['sensor-1', 'sensor-2', 'sensor-3', 'sensor-4'].map(id => {
      const comp = compById(id);
      const d = formatSensorDisplay(id);
      const m = Sim.sensorMeta[id];
      const active = Sim.selectedId === id ? 'active' : '';
      const offCls = d.offline ? 'is-offline' : '';
      return `
        <button type="button" class="lg-sensor-mini ${active} ${offCls}" data-lg-select="${id}">
          <div>
            <div class="small muted">${esc(comp.label)}</div>
            <b class="mono" style="font-size:1.05rem">${d.offline ? 'Offline' : `${d.text} ${d.unit}`.trim()}</b>
            <div class="small muted" data-lg-sensor-age="${id}">${d.offline ? 'No report (>=10m)' : updatedAgoText(m.lastReportedAt)}</div>
          </div>
          <span class="badge b-${d.offline ? 'mute' : d.status}">${d.offline ? 'Offline' : d.status === 'ok' ? 'OK' : d.status === 'warn' ? 'Warn' : 'Crit'}</span>
        </button>
      `;
    }).join('');
    strip.innerHTML = cards;
  }

  function renderTopBar() {
    const row = document.getElementById('lgTopStatus');
    if (!row) return;
    const st = overallGardenStatus();
    const newest = Math.max(...Object.values(Sim.sensorMeta).map(s => s.lastReportedAt || 0));
    const stText = st === 'ok' ? 'Optimal' : st === 'warn' ? 'Attention' : 'Critical';
    const sim = isSimulatedSource();
    const pumpBadge = Sim.pump.state === 'running'
      ? `Pump: Running (${num(Sim.pump.flowLpm, 1)} L/min)`
      : Sim.pump.state === 'starting'
        ? 'Pump: Starting...'
        : Sim.pump.state === 'fault'
          ? 'Pump: Fault (No Flow)'
          : 'Pump: Off';

    row.innerHTML = `
      <span class="badge b-${st}">Garden: ${stText}</span>
      <span class="lg-conn-pill"><span class="lg-pulse-dot" style="background:var(--${sim ? 'info' : 'ok'})"></span>${sim ? 'Simulator Feed' : 'Live Gateway'}</span>
      <span class="lg-sim-badge">${sim ? 'SIMULATED · Demo sensors (not real hardware)' : 'LIVE HARDWARE'}</span>
      <span class="tag">${esc(pumpBadge)}</span>
      <span class="tag" data-lg-top-age>${updatedAgoText(newest)}</span>
    `;

    // Sync view mode & active quick chips
    document.querySelectorAll('[data-lg-select]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-lg-select') === Sim.selectedId);
    });
    document.querySelectorAll('[data-lg-view]').forEach(el => {
      el.setAttribute('aria-pressed', String(el.getAttribute('data-lg-view') === Sim.viewMode));
    });
    document.querySelectorAll('[data-lg-cam]').forEach(el => {
      el.setAttribute('aria-pressed', String(el.getAttribute('data-lg-cam') === Sim.cameraPreset));
    });

    const listEl = document.getElementById('lgListPanel');
    const stageCol = document.getElementById('lgStageCol');
    if (listEl && stageCol) {
      const showList = Sim.viewMode === 'list';
      listEl.classList.toggle('active', showList);
      stageCol.style.display = showList ? 'none' : 'block';
      if (showList) {
        listEl.innerHTML = COMPONENTS.map(c => {
          const isSel = Sim.selectedId === c.id ? 'active' : '';
          let summary = '';
          if (c.kind === 'pump') summary = `State: ${Sim.pump.state} · ${num(Sim.pump.flowLpm, 1)} L/min`;
          else if (c.kind === 'tank') {
            const off = isSensorOffline('sensor-1');
            summary = off ? 'Offline' : `${num(readings('gh-a').res, 0)}% level`;
          } else if (c.kind === 'sensor') {
            const d = formatSensorDisplay(c.id);
            summary = d.offline ? 'Offline' : `${d.text} ${d.unit}`.trim();
          } else {
            const off = isSensorOffline(c.sensorId);
            summary = off ? 'Offline' : `${num(readings(c.ghId).temp, 1)} °C · ${num(readings(c.ghId).hum, 0)}% RH`;
          }
          return `
            <button type="button" class="lg-list-card ${isSel}" data-lg-select="${esc(c.id)}">
              <div class="split" style="justify-content:space-between">
                <b>${esc(c.label)}</b>
                <span class="mono small muted">${esc(c.id)}</span>
              </div>
              <div class="small">${esc(summary)}</div>
            </button>
          `;
        }).join('');
      }
    }
  }

  function updateInPlace() {
    if (!document.getElementById('liveGardenStage')) return;
    renderTopBar();
    renderSensorStrip();
    renderDrawerContent();
    if (typeof renderNav === 'function') renderNav();
    if (typeof renderTop === 'function') renderTop();
  }

  async function mountScene() {
    const container = document.getElementById('liveGardenStage');
    if (!container || Sim.sceneCtrl || Sim.sceneLoading) return;
    Sim.sceneLoading = true;
    Sim.sceneError = '';

    try {
      const mod = await import('/js/garden-scene.js');
      if (!document.getElementById('liveGardenStage')) {
        Sim.sceneLoading = false;
        return;
      }
      const ctrl = mod.mountGarden(container, {
        mobile: window.innerWidth < 768,
        onSelect(sel) {
          if (!sel) {
            Sim.selectedId = null;
            Sim.panelOpen = false;
          } else {
            Sim.selectedId = sel.id;
            Sim.panelOpen = true;
          }
          updateInPlace();
        },
      });
      Sim.sceneCtrl = ctrl;
      await ctrl.ready;
      Sim.sceneLoading = false;
      pushStateToScene();
      if (Sim.selectedId) ctrl.highlightObject(Sim.selectedId);
      updateInPlace();
    } catch (err) {
      Sim.sceneLoading = false;
      Sim.sceneError = err?.message || 'Failed to load 3D garden scene.';
      if (container) {
        container.innerHTML = `<div class="card-b"><div class="notice crit">${ic('alert')}<div><b>Unable to start 3D Live Garden:</b> ${esc(Sim.sceneError)}</div></div></div>`;
      }
    }

    if (!Sim.tickTimer) {
      Sim.tickTimer = setInterval(() => {
        if (!document.getElementById('liveGardenStage')) {
          dispose();
          return;
        }
        simulateDataTick();
        updateLiveTimestampsOnly();
      }, 1000);
    }
  }

  function dispose() {
    if (Sim.tickTimer) {
      clearInterval(Sim.tickTimer);
      Sim.tickTimer = null;
    }
    if (Sim.startPrimeTimer) {
      clearTimeout(Sim.startPrimeTimer);
      Sim.startPrimeTimer = null;
    }
    if (Sim.panelChart) {
      Sim.panelChart.destroy();
      Sim.panelChart = null;
    }
    if (Sim.sceneCtrl) {
      Sim.sceneCtrl.dispose();
      Sim.sceneCtrl = null;
    }
    Sim.sceneLoading = false;
  }

  function selectComponent(id) {
    if (!id) {
      Sim.selectedId = null;
      Sim.panelOpen = false;
      Sim.sceneCtrl?.highlightObject(null);
      updateInPlace();
      return;
    }
    Sim.selectedId = id;
    Sim.panelOpen = true;
    Sim.sceneCtrl?.highlightObject(id);
    updateInPlace();
  }

  function renderView() {
    after(() => {
      mountScene();
      updateInPlace();
    });

    const quickSelectIds = ['bed-1', 'bed-2', 'channel-bed-1', 'channel-bed-2', 'tower-1', 'tower-5', 'tank-1', 'pump-1'];
    return `
      <div class="lg-topband">
        <div>
          <h1>Live Garden</h1>
          <p class="muted" style="margin-top:2px">Interactive 3D digital twin of the Hydrovest Tech garden.</p>
        </div>
        <div class="toolbar">
          <div class="seg" role="group" aria-label="Display mode">
            <button type="button" data-lg-view="3d" aria-pressed="${Sim.viewMode === '3d'}">3D Twin</button>
            <button type="button" data-lg-view="list" aria-pressed="${Sim.viewMode === 'list'}">List View</button>
          </div>
          <button type="button" class="btn sm" data-lg-select="pump-1">${ic('power')}Pump &amp; Watering</button>
        </div>
      </div>

      <div class="lg-status-row" id="lgTopStatus"></div>

      <div class="lg-chips" role="toolbar" aria-label="Select garden component">
        <span class="small muted" style="font-weight:700">Inspect:</span>
        ${quickSelectIds.map(id => {
          const c = compById(id);
          return `<button type="button" class="lg-chip ${Sim.selectedId === id ? 'active' : ''}" data-lg-select="${id}">${esc(c.short)}</button>`;
        }).join('')}
        ${Sim.selectedId ? '<button type="button" class="lg-chip" data-lg-close>Clear</button>' : ''}
      </div>

      <section class="lg-workspace" aria-label="Interactive 3D garden digital twin">
        <div class="lg-stage-col" id="lgStageCol">
          <div class="lg-stage-hud">
            <span class="lg-hud-card lg-hud-hint">${ic('spark')}<span>Click any rack, NFT channel, tower, tank, pump, or sensor</span></span>
            <div class="seg" role="group" aria-label="Camera preset" style="background:var(--card)">
              <button type="button" data-lg-cam="isometric" aria-pressed="${Sim.cameraPreset === 'isometric'}">Isometric</button>
              <button type="button" data-lg-cam="top" aria-pressed="${Sim.cameraPreset === 'top'}">Top-Down</button>
            </div>
          </div>

          <div id="liveGardenStage" class="lg-canvas"></div>

          <div class="lg-stage-foot">
            <div class="lg-legend" aria-label="Indicator legend">
              <span><i style="background:#16a34a"></i>Normal</span>
              <span><i style="background:#d97706"></i>Attention / Starting</span>
              <span><i style="background:#dc2626"></i>Critical / Fault</span>
              <span><i style="background:#64748b"></i>Offline (10m+)</span>
            </div>
            <span class="lg-hud-card lg-hud-hint">Drag to orbit · Pinch/scroll to zoom</span>
          </div>
        </div>

        <div class="lg-list-panel" id="lgListPanel"></div>

        <aside class="lg-drawer ${Sim.panelOpen ? 'open' : ''}" id="lgDrawer" aria-label="Selected component details"></aside>
      </section>

      <section class="lg-sensor-strip" id="lgSensorStrip" aria-label="Live sensor nodes"></section>
    `;
  }

  // Event delegation for Live Garden interactive controls
  document.addEventListener('click', e => {
    const t = e.target;

    const selBtn = t.closest('[data-lg-select]');
    if (selBtn) {
      e.preventDefault();
      selectComponent(selBtn.getAttribute('data-lg-select'));
      return;
    }

    if (t.closest('[data-lg-close]')) {
      e.preventDefault();
      selectComponent(null);
      return;
    }

    const viewBtn = t.closest('[data-lg-view]');
    if (viewBtn) {
      Sim.viewMode = viewBtn.getAttribute('data-lg-view') || '3d';
      updateInPlace();
      return;
    }

    const camBtn = t.closest('[data-lg-cam]');
    if (camBtn) {
      const preset = camBtn.getAttribute('data-lg-cam') || 'isometric';
      Sim.cameraPreset = preset;
      Sim.sceneCtrl?.setCameraPreset?.(preset);
      updateInPlace();
      return;
    }

    const chartBtn = t.closest('[data-lg-chart-metric]');
    if (chartBtn) {
      Sim.chartMetric = chartBtn.getAttribute('data-lg-chart-metric') || 'temp';
      updateInPlace();
      return;
    }

    const pumpBtn = t.closest('[data-lg-pump]');
    if (pumpBtn) {
      openWateringModal(pumpBtn.getAttribute('data-lg-pump'));
      return;
    }

    const stallBtn = t.closest('[data-lg-toggle-stall]');
    if (stallBtn) {
      const sid = stallBtn.getAttribute('data-lg-toggle-stall');
      const m = Sim.sensorMeta[sid];
      if (m) {
        m.stalled = !m.stalled;
        if (!m.stalled) m.lastReportedAt = Date.now();
        pushStateToScene();
        updateInPlace();
      }
      return;
    }
  });

  window.LiveGardenUI = {
    renderView,
    updateInPlace,
    dispose,
    selectComponent,
    isActive: () => Boolean(document.getElementById('liveGardenStage')),
  };
})();

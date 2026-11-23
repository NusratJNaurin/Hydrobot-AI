'use strict';
/* ================= Utilities ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeHttpUrl = raw => {
  if (typeof raw !== 'string') return '';
  try {
    const u = new URL(raw.trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.toString() : '';
  } catch { return ''; }
};
const safeImgSrc = raw => {
  if (typeof raw !== 'string') return '';
  const s = raw.trim();
  if (/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(s)) return s;
  if (/^blob:https?:\/\//i.test(s)) return s;
  if (/^\/assets\/[A-Za-z0-9/_.-]+\.(jpg|jpeg|png|webp)$/i.test(s)) return s;
  return '';
};
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
function validateImageUpload(file) {
  if (!file || !ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPEG, PNG, or WebP images are allowed.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 15 MB or smaller.');
  }
}
const DAY = 864e5;
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const iso = d => { const z = new Date(d); return z.getFullYear() + '-' + String(z.getMonth() + 1).padStart(2, '0') + '-' + String(z.getDate()).padStart(2, '0'); };
const dOff = n => iso(new Date(TODAY.getTime() + n * DAY));
const parseD = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const daysFrom = s => Math.round((parseD(s) - TODAY) / DAY);
const fmtD = s => parseD(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtDL = s => parseD(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtT = t => { const [h, m] = String(t || '00:00').split(':').map(Number); const d = new Date(); d.setHours(h, m); return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); };
const fmtDT = ms => new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const num = (n, d = 0) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const money = n => '$' + num(n, 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const uid = p => p + '-' + (Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 5)).toUpperCase();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

const ICONS = {
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z|M2 21c0-3 1.85-5.36 5.08-6',
  grid: 'M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z',
  cube: 'M12 2l9 5v10l-9 5-9-5V7z|M12 22V12|M21 7l-9 5-9-5',
  sprout: 'M7 20h10|M10 20c5.5-2.5.8-6.4 3-10|M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z|M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z',
  house: 'M3 21V10l9-7 9 7v11|M3 21h18|M9 21v-6h6v6|M3 10h18',
  basket: 'M5 11l2 9h10l2-9|M3 11h18|M9 11l3-7 3 7|M10 15v2|M14 15v2',
  clipboard: 'M9 3h6v3H9z|M8 4.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-2|M9 13l2 2 4-4',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5z|M3 8l9 5 9-5|M12 13v8',
  flask: 'M9 3h6|M10 3v6l-5.5 9.5A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2.5L14 9V3|M7 15h10',
  scan: 'M3 7V5a2 2 0 0 1 2-2h2|M17 3h2a2 2 0 0 1 2 2v2|M21 17v2a2 2 0 0 1-2 2h-2|M7 21H5a2 2 0 0 1-2-2v-2|M12 16c-2.5-1-3.5-3-3-6 3 0 5 1 5.5 3.5|M12 16c1.5-.5 3-1.8 3.5-3.5',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z|M8 9h8|M8 13h5',
  trend: 'M3 17l6-6 4 4 8-8|M14 7h7v7',
  bar: 'M3 3v18h18|M8 17v-6|M13 17V7|M18 17v-4',
  wallet: 'M20 7H5a2 2 0 0 1 0-4h13v4|M3 5v14a2 2 0 0 0 2 2h15V7|M16 14h.01',
  cart: 'M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 7H6|M10 21h.01|M18 21h.01',
  truck: 'M1 4h14v12H1z|M15 9h4l4 4v3h-8z|M5.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z|M18.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9|M10.3 21a1.94 1.94 0 0 0 3.4 0',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z|M21 21l-4.3-4.3',
  menu: 'M4 6h16|M4 12h16|M4 18h16',
  x: 'M18 6 6 18|M6 6l12 12',
  thermo: 'M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z',
  drop: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z',
  wind: 'M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2|M9.6 4.6A2 2 0 1 1 11 8H2|M12.6 19.4A2 2 0 1 0 14 16H2',
  plus: 'M12 5v14|M5 12h14',
  check: 'M20 6 9 17l-5-5',
  chev: 'M9 18l6-6-6-6',
  left: 'M15 18l-6-6 6-6',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z|M12 9v4|M12 17h.01',
  plug: 'M12 22v-5|M9 8V2|M15 8V2|M18 8v5a6 6 0 0 1-12 0V8z',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z|M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  calendar: 'M3 5h18v16H3z|M16 3v4|M8 3v4|M3 10h18',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  gauge: 'M12 14l4-4|M3.3 19a10 10 0 1 1 17.4 0',
  spark: 'M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z|M19 3v4|M21 5h-4',
  edit: 'M12 20h9|M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18|M8 6V4h8v2|M19 6l-1 14H6L5 6',
  power: 'M12 2v10|M18.4 6.6a9 9 0 1 1-12.8 0',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 16v-4|M12 8h.01',
  arrowup: 'M12 19V5|M5 12l7-7 7 7',
  arrowdown: 'M12 5v14|M19 12l-7 7-7-7',
  flag: 'M4 22V4|M4 4h13l-2 4 2 4H4',
  send: 'M22 2 11 13|M22 2l-7 20-4-9-9-4z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M17 8l-5-5-5 5|M12 3v12',
  repeat: 'M17 1l4 4-4 4|M3 11V9a4 4 0 0 1 4-4h14|M7 23l-4-4 4-4|M21 13v2a4 4 0 0 1-4 4H3',
  sun: 'M12 3v1|M12 20v1|M4.22 4.22l.71.71|M18.36 18.36l.71.71|M1 12h1|M22 12h1|M4.22 19.78l.71-.71|M18.36 5.64l.71-.71|M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
};
const ic = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${(ICONS[n] || '').split('|').map(d => `<path d="${d}"/>`).join('')}</svg>`;

/* ================= Reference presets & dynamic catalog ================= */
const DEFAULT_PEOPLE = [
  { id: 'p1', name: 'Diego Alvarez', role: 'Farm Manager' },
  { id: 'p2', name: 'Maria Santos', role: 'Farm Worker' },
  { id: 'p3', name: 'Kwame Mensah', role: 'Farm Worker' },
  { id: 'p4', name: 'Li Wei', role: 'Farm Worker' },
  { id: 'p5', name: 'Priya Nair', role: 'Farm Worker' },
];
const ROLES = {
  'Farm Owner': { name: 'Jeacim Adaya', perms: ['batches', 'targets', 'tasks', 'inventory', 'finance', 'sales', 'commands', 'harvest'] },
  'Farm Manager': { name: 'Diego Alvarez', perms: ['batches', 'targets', 'tasks', 'inventory', 'sales', 'commands', 'harvest', 'financeView'] },
  'Farm Worker': { name: 'Maria Santos', perms: ['harvest'] },
};
const DEFAULT_CROPS = {
  Lettuce: { label: 'Butterhead Lettuce', cycle: 42, price: 6.0, ypp: 0.18, continuous: false, ph: [5.6, 6.2], ec: { Germination: [0.4, 0.8], Seedling: [0.6, 1.0], Vegetative: [0.8, 1.4], Ready: [0.8, 1.2] } },
  Tomato: { label: 'Cherry Tomato', cycle: 80, price: 5.2, ypp: 0.16, continuous: true, ph: [5.8, 6.5], ec: { Germination: [0.8, 1.2], Seedling: [1.2, 1.8], Vegetative: [2.0, 2.8], Flowering: [2.4, 3.2], Fruiting: [2.6, 3.5], Ready: [2.6, 3.5] } },
  Basil: { label: 'Genovese Basil', cycle: 32, price: 22.0, ypp: 0.08, continuous: false, ph: [5.5, 6.5], ec: { Germination: [0.4, 0.8], Seedling: [0.6, 1.0], Vegetative: [1.0, 1.6], Ready: [1.0, 1.6] } },
  Strawberry: { label: 'Albion Strawberry', cycle: 75, price: 11.5, ypp: 0.045, continuous: true, ph: [5.5, 6.2], ec: { Seedling: [0.8, 1.0], Vegetative: [1.0, 1.4], Flowering: [1.2, 1.6], Fruiting: [1.4, 1.8], Ready: [1.4, 1.8] } },
};
const CROPS = DEFAULT_CROPS;
const CROP_PALETTE = ['--c1', '--c2', '--c3', '--c4', '--c5'];
const CROP_COLOR = { Lettuce: '--c1', Tomato: '--c2', Basil: '--c3', Strawberry: '--c4' };
const cropColorVar = key => CROP_COLOR[key] || CROP_PALETTE[Math.abs(hash(String(key || 'crop'))) % CROP_PALETTE.length];
const STAGES = ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Ready', 'Harvested'];
const DEFAULT_GH = [
  { id: 'gh-a', code: 'A', name: 'Greenhouse A', system: 'NFT channels', area: 420, reservoirLiters: 1800, zones: ['A1', 'A2', 'A3'], main: 'Lettuce' },
  { id: 'gh-b', code: 'B', name: 'Greenhouse B', system: 'Dutch buckets', area: 380, reservoirLiters: 1800, zones: ['B1', 'B2'], main: 'Tomato' },
  { id: 'gh-c', code: 'C', name: 'Greenhouse C', system: 'Deep water culture', area: 260, reservoirLiters: 1200, zones: ['C1', 'C2'], main: 'Basil' },
  { id: 'gh-d', code: 'D', name: 'Greenhouse D', system: 'Vertical NFT towers', area: 300, reservoirLiters: 1500, zones: ['D1', 'D2'], main: 'Strawberry' },
];
const GH = DEFAULT_GH;
const SENSORS = [
  { k: 'temp', label: 'Air temperature', unit: '°C', dec: 1, icon: 'thermo', model: 'SHT45 probe' },
  { k: 'hum', label: 'Humidity', unit: '%', dec: 0, icon: 'drop', model: 'SHT45 probe' },
  { k: 'co2', label: 'CO₂', unit: 'ppm', dec: 0, icon: 'wind', model: 'NDIR sensor' },
  { k: 'wt', label: 'Water temperature', unit: '°C', dec: 1, icon: 'thermo', model: 'DS18B20 probe' },
  { k: 'ph', label: 'pH', unit: '', dec: 2, icon: 'flask', model: 'pH electrode' },
  { k: 'ec', label: 'Electrical conductivity', unit: 'mS/cm', dec: 2, icon: 'gauge', model: 'EC probe K1.0' },
  { k: 'res', label: 'Reservoir level', unit: '%', dec: 0, icon: 'box', model: 'Ultrasonic level' },
];
const sensorDef = k => SENSORS.find(s => s.k === k);
const FALLBACK_TARGETS = { temp: [18, 25], hum: [55, 75], co2: [600, 1200], wt: [18, 22], ph: [5.5, 6.5], ec: [0.8, 2.5], res: [40, 100] };
const DEFAULT_TARGETS = {
  'gh-a': { temp: [18, 24], hum: [55, 75], co2: [600, 1200], wt: [18, 22], ph: [5.6, 6.2], ec: [0.8, 1.4], res: [40, 100] },
  'gh-b': { temp: [20, 27], hum: [55, 75], co2: [600, 1200], wt: [18, 23], ph: [5.8, 6.5], ec: [2.4, 3.5], res: [40, 100] },
  'gh-c': { temp: [21, 27], hum: [50, 70], co2: [600, 1200], wt: [18, 22], ph: [5.5, 6.5], ec: [1.0, 1.6], res: [40, 100] },
  'gh-d': { temp: [17, 24], hum: [60, 75], co2: [600, 1100], wt: [17, 21], ph: [5.5, 6.2], ec: [1.4, 1.8], res: [40, 100] },
};
const CURRENT = {
  'gh-a': { temp: 21.4, hum: 64, co2: 880, wt: 19.6, ph: 5.92, ec: 1.15, res: 76 },
  'gh-b': { temp: 28.4, hum: 69, co2: 940, wt: 20.8, ph: 6.21, ec: 2.84, res: 63 },
  'gh-c': { temp: 24.1, hum: 63, co2: 820, wt: 20.2, ph: 6.04, ec: 1.31, res: 71 },
  'gh-d': { temp: 21.0, hum: 68, co2: 760, wt: 19.1, ph: 6.41, ec: 1.36, res: 18 },
};
const READ_AT = { 'gh-a': 2, 'gh-b': 1, 'gh-c': 3, 'gh-d': 2 }; // minutes since last demo reading
const INITIAL_CURRENT = JSON.parse(JSON.stringify(CURRENT));
function restoreSimulatedCurrent() {
  Object.keys(INITIAL_CURRENT).forEach(k => {
    CURRENT[k] = { ...INITIAL_CURRENT[k] };
  });
}
const isLiveMode = () => Boolean(window.HydrobotData && window.HydrobotData.isLive());
const DEVICES = [
  { k: 'pump', label: 'Irrigation pump', action: 'Start a 5-minute irrigation cycle', icon: 'drop' },
  { k: 'fans', label: 'Exhaust fans', action: 'Run exhaust fans at 80% for 20 minutes', icon: 'wind' },
  { k: 'dose', label: 'Nutrient dosing pump', action: 'Dose 50 mL nutrient A + B', icon: 'flask' },
  { k: 'fill', label: 'Reservoir fill valve', action: 'Open fill valve until level reaches 80%', icon: 'box' },
];

function demoBatches() {
  const b = (id, crop, variety, ghId, zone, plants, planted, stage, health, harvest, estKg, obs = []) => ({ id, crop, variety, ghId, zone, plants, plantedOn: dOff(planted), stage, health, expectedHarvest: dOff(harvest), estKg, notes: '', observations: obs, demo: true });
  return [
    b('B-101', 'Lettuce', 'Butterhead "Rex"', 'gh-a', 'A1', 1440, -38, 'Ready', 94, 3, 259, [{ date: dOff(-2), health: 94, note: 'Heads firm, good colour. Ready for harvest window.', by: 'Li Wei' }]),
    b('B-102', 'Lettuce', 'Butterhead "Rex"', 'gh-a', 'A2', 1440, -24, 'Vegetative', 91, 18, 259, [{ date: dOff(-4), health: 91, note: 'Uniform growth. Slight tip burn on 2 channels near inlet.', by: 'Li Wei' }]),
    b('B-103', 'Lettuce', 'Butterhead "Rex"', 'gh-a', 'A3', 1200, -8, 'Seedling', 88, 34, 216, []),
    b('B-201', 'Tomato', 'Cherry "Sakura"', 'gh-b', 'B1', 320, -76, 'Fruiting', 78, 2, 52, [{ date: dOff(-1), health: 78, note: 'Blossom drop on upper trusses, likely heat stress (28°C+ afternoons).', by: 'Kwame Mensah' }]),
    b('B-202', 'Tomato', 'Cherry "Sakura"', 'gh-b', 'B2', 320, -45, 'Flowering', 82, 27, 52, []),
    b('B-301', 'Basil', 'Genovese', 'gh-c', 'C1', 900, -30, 'Ready', 90, 1, 72, [{ date: dOff(-1), health: 90, note: 'Strong aroma, no bolting. Harvest tomorrow.', by: 'Priya Nair' }]),
    b('B-302', 'Basil', 'Genovese', 'gh-c', 'C2', 900, -12, 'Vegetative', 86, 19, 72, []),
    b('B-401', 'Strawberry', 'Albion (day-neutral)', 'gh-d', 'D1', 600, -70, 'Fruiting', 71, 4, 27, [{ date: dOff(-1), health: 71, note: 'Purple-bordered spots on older leaves in rows 3–5. Possible leaf spot; isolate and inspect.', by: 'Maria Santos', flag: 'Suspected leaf spot' }]),
    b('B-402', 'Strawberry', 'Albion (day-neutral)', 'gh-d', 'D2', 600, -40, 'Flowering', 74, 24, 27, []),
  ];
}
function demoTasks() {
  const t = (id, title, ghId, assignee, priority, due, time, status, recurrence = 'none', notes = '') => ({ id, title, ghId, assignee, priority, due: dOff(due), time, status, recurrence, notes, demo: true, createdAt: Date.now() - 3 * DAY });
  return [
    t('T-501', 'Record EC and pH readings', 'gh-b', 'Kwame Mensah', 'High', -1, '16:00', 'Open', 'daily', 'Log manual meter readings until the probe is connected.'),
    t('T-502', 'Refill reservoir D and check float valve', 'gh-d', 'Maria Santos', 'High', 0, '08:30', 'Open', 'none', 'Reservoir at 18%. Check for leaks at tower manifold.'),
    t('T-503', 'Inspect strawberry leaves for spotting, rows 3–5', 'gh-d', 'Maria Santos', 'High', 0, '10:00', 'Open', 'none', 'Bag and remove affected leaves. Photograph samples.'),
    t('T-504', 'Harvest basil, zone C1', 'gh-c', 'Priya Nair', 'Medium', 0, '11:00', 'Open'),
    t('T-505', 'Calibrate pH probe', 'gh-c', 'Li Wei', 'Medium', 0, '13:00', 'Done', 'weekly'),
    t('T-506', 'Prune tomato suckers and open canopy', 'gh-b', 'Kwame Mensah', 'Low', 0, '15:00', 'Open'),
    t('T-507', 'Clean NFT channels after A1 harvest prep', 'gh-a', 'Li Wei', 'Low', 0, '16:30', 'Open'),
    t('T-508', 'Sanitize harvest tools and crates', 'gh-a', 'Priya Nair', 'Medium', 2, '09:00', 'Open', 'weekly'),
    t('T-509', 'Order nutrient B concentrate', 'gh-a', 'Diego Alvarez', 'Medium', 1, '12:00', 'Open'),
  ];
}
function demoInventory() {
  const i = (id, name, category, qty, unit, threshold, supplier, cost) => ({ id, name, category, qty, unit, threshold, supplier, cost, demo: true });
  return [
    i('I-01', 'Butterhead lettuce seed, pelleted', 'Seeds', 4500, 'seeds', 5000, 'GreenLeaf Seeds Co.', 0.04),
    i('I-02', 'Genovese basil seed', 'Seeds', 8000, 'seeds', 3000, 'GreenLeaf Seeds Co.', 0.01),
    i('I-03', 'Albion strawberry plugs', 'Seeds', 140, 'plugs', 100, 'BerryStart Nursery', 0.85),
    i('I-04', 'Nutrient A, calcium nitrate', 'Nutrients', 85, 'kg', 50, 'NutriGrow Supply', 1.9),
    i('I-05', 'Nutrient B, MKP + micronutrients', 'Nutrients', 22, 'kg', 40, 'NutriGrow Supply', 3.4),
    i('I-06', 'pH Down, phosphoric 75%', 'Nutrients', 18, 'L', 10, 'NutriGrow Supply', 6.5),
    i('I-07', 'Rockwool cubes 36 mm', 'Growing media', 6200, 'cubes', 3000, 'HydroTech Parts', 0.06),
    i('I-08', 'Coco coir slabs', 'Growing media', 140, 'slabs', 60, 'HydroTech Parts', 4.2),
    i('I-09', 'Clamshell 250 g', 'Packaging', 1800, 'units', 1000, 'AgroPack Ltd.', 0.14),
    i('I-10', 'Herb sleeves 50 g', 'Packaging', 3500, 'units', 1500, 'AgroPack Ltd.', 0.05),
    i('I-11', 'pH electrode (spare)', 'Equipment', 2, 'units', 1, 'HydroTech Parts', 89),
    i('I-12', 'EC meter, handheld', 'Equipment', 3, 'units', 1, 'HydroTech Parts', 64),
  ];
}
const DEFAULT_CUSTOMERS = ['FreshMart Grocers', 'Bistro Verde', 'Harbor Street Market', 'GreenBox Meal Kits', 'City Food Co-op'];
const CUSTOMERS = DEFAULT_CUSTOMERS;
function demoHarvests() {
  const r = rng(42), out = [];
  const plan = [['Lettuce', 'gh-a', 14, 252, ['A1', 'A2', 'A3']], ['Basil', 'gh-c', 14, 70, ['C1', 'C2']], ['Tomato', 'gh-b', 7, 50, ['B1', 'B2']], ['Strawberry', 'gh-d', 7, 27, ['D1', 'D2']]];
  plan.forEach(([crop, ghId, every, base, zones], pi) => {
    let z = 0;
    for (let d = -180 + pi * 3; d <= -3; d += every) {
      const est = Math.round(base * (0.95 + r() * 0.1));
      const actual = Math.round(est * (0.86 + r() * 0.2));
      const g = r();
      out.push({ crop, ghId, zone: zones[z++ % zones.length], date: dOff(d), estKg: est, actualKg: actual, grade: g < 0.62 ? 'A' : g < 0.9 ? 'B' : 'C', notes: '', demo: true });
    }
  });
  out.sort((a, b) => a.date.localeCompare(b.date));
  out.forEach((h, i) => h.id = 'H-' + (1001 + i));
  return out;
}
function demoOrders(harvests) {
  const r = rng(7), out = [];
  harvests.forEach((h, i) => {
    const kg = Math.round(h.actualKg * (0.93 + r() * 0.05));
    const gradeAdj = h.grade === 'A' ? 1 : h.grade === 'B' ? 0.9 : 0.75;
    const date = iso(parseD(h.date).getTime() + DAY);
    out.push({ id: 'SO-' + (2001 + i), customer: DEFAULT_CUSTOMERS[i % DEFAULT_CUSTOMERS.length], crop: h.crop, kg, pricePerKg: +(DEFAULT_CROPS[h.crop].price * gradeAdj).toFixed(2), date, status: 'Delivered', harvestId: h.id, delivery: { status: 'Delivered', vehicle: i % 2 ? 'Van 2 (refrigerated)' : 'Van 1 (refrigerated)', window: '07:00–10:00' }, demo: true });
  });
  const up = [['FreshMart Grocers', 'Basil', 30, 2, 'Packed', 'Out for delivery'], ['Bistro Verde', 'Tomato', 18, 3, 'Confirmed', 'Scheduled'], ['GreenBox Meal Kits', 'Lettuce', 160, 4, 'Confirmed', 'Scheduled'], ['City Food Co-op', 'Strawberry', 20, 5, 'Confirmed', 'Scheduled'], ['Harbor Street Market', 'Lettuce', 60, 5, 'Draft', 'Not scheduled']];
  up.forEach(([customer, crop, kg, d, status, ds], i) => out.push({ id: 'SO-' + (2101 + i), customer, crop, kg, pricePerKg: DEFAULT_CROPS[crop].price, date: dOff(d), status, delivery: { status: ds, vehicle: ds === 'Not scheduled' ? '' : i % 2 ? 'Van 2 (refrigerated)' : 'Van 1 (refrigerated)', window: '07:00–10:00' }, demo: true }));
  return out;
}
function demoExpenses() {
  const r = rng(99), out = [];
  const cats = [['Energy', 3300, 400], ['Labor', 9800, 300], ['Nutrients', 1150, 200], ['Seeds & plugs', 700, 250], ['Packaging', 780, 160], ['Maintenance', 520, 380]];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1);
    cats.forEach(([cat, base, v], ci) => out.push({ id: `E-${m}-${ci}`, date: iso(d), category: cat, amount: Math.round(base + (r() - 0.4) * v), note: 'Monthly total (sample)', demo: true }));
  }
  return out;
}
function resourceSeries(days) {
  const r = rng(5), arr = [];
  for (let d = -89; d <= 0; d++) {
    const season = Math.sin((d + 40) / 14);
    arr.push({ date: dOff(d), water: Math.round(5200 + season * 260 + (r() - 0.5) * 420), energy: Math.round(410 + season * 22 + (r() - 0.5) * 50) });
  }
  return arr.slice(-days);
}
const DEMO = {};
function buildDemo() {
  DEMO.farm = [{ id: 'meta', name: 'Riverside Hydro Farm', location: 'Valley Sector A', demo: true }];
  DEMO.greenhouses = DEFAULT_GH.map(g => ({ ...g, demo: true }));
  DEMO.team = DEFAULT_PEOPLE.map(p => ({ ...p, demo: true }));
  DEMO.crops = Object.entries(DEFAULT_CROPS).map(([id, c]) => ({ id, ...c, demo: true }));
  DEMO.batches = demoBatches(); DEMO.tasks = demoTasks(); DEMO.inventory = demoInventory();
  DEMO.harvests = demoHarvests(); DEMO.orders = demoOrders(DEMO.harvests); DEMO.expenses = demoExpenses();
  DEMO.movements = [
    { id: 'M-01', itemId: 'I-05', type: 'Out', qty: 6, date: dOff(-2), note: 'Weekly mix, tanks B & D', by: 'Kwame Mensah', demo: true },
    { id: 'M-02', itemId: 'I-01', type: 'Out', qty: 1500, date: dOff(-8), note: 'Sowing batch B-103', by: 'Li Wei', demo: true },
    { id: 'M-03', itemId: 'I-09', type: 'In', qty: 2000, date: dOff(-6), note: 'PO-3381 received', by: 'Diego Alvarez', demo: true },
    { id: 'M-04', itemId: 'I-04', type: 'Out', qty: 9, date: dOff(-2), note: 'Weekly mix, all tanks', by: 'Kwame Mensah', demo: true },
  ];
  DEMO.targets = []; DEMO.alerts = []; DEMO.commands = []; DEMO.readings = [];
}

/* ================= Storage: backend API + shared database + cross-tab real-time sync ================= */
const COLS = ['farm', 'greenhouses', 'team', 'crops', 'batches', 'tasks', 'inventory', 'movements', 'harvests', 'orders', 'expenses', 'targets', 'alerts', 'commands', 'readings'];
const LS_KEY = 'hydrobot.records.v1';
const LS_KEY_LIVE = 'hydrobot.live.records.v1';
const SYNC_CHANNEL = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('hydrobot_sync_v1') : null;
const Store = {
  mode: 'loading',
  db: null,
  simData: {},
  liveData: {},
  rev: { simulated: -1, live: -1 },
  syncError: null,
  error: null,
  pollTimer: null,
  get data() { return isLiveMode() ? this.liveData : this.simData; },
  scopeFarmId() {
    const raw = (typeof AuthState !== 'undefined' && AuthState.currentFarmId) ? AuthState.currentFarmId : (ui.farm || 'riverside');
    const clean = String(raw || 'riverside').trim();
    return /^[A-Za-z0-9_-]{1,64}$/.test(clean) ? clean : 'riverside';
  },
  authHeaders(extra = {}) {
    const h = { ...extra };
    if (typeof AuthState !== 'undefined' && !AuthState.isDemoAuth && AuthState.session?.access_token) {
      h.Authorization = `Bearer ${AuthState.session.access_token}`;
    }
    return h;
  },
  async init() {
    COLS.forEach(c => { this.simData[c] = {}; this.liveData[c] = {}; });
    this.loadLocal();
    this.setupSyncListeners();

    let db = null;
    try { if (window.claude && typeof claude.use === 'function') db = await Promise.race([claude.use('db'), sleep(8000).then(() => null)]); } catch (e) { db = null; }
    if (db) {
      this.db = db; this.mode = 'db';
      await new Promise(resolve => {
        let pending = COLS.length, done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        const timer = setTimeout(() => { this.error = 'The farm database is slow to respond. Showing what has loaded so far.'; finish(); }, 10000);
        COLS.forEach(col => {
          let first = true;
          db.collection(col).onSnapshot(snap => {
            const m = {}; snap.docs.forEach(d => { m[d.id] = d.data(); });
            this.simData[col] = m;
            if (first) { first = false; if (--pending === 0) { clearTimeout(timer); finish(); } }
            else scheduleRender();
          }, err => {
            this.error = 'Lost connection to the farm database (' + err.code + '). Changes may not save.';
            if (first) { first = false; if (--pending === 0) { clearTimeout(timer); finish(); } }
            scheduleRender();
          });
        });
      });
      return;
    }

    const loadedBackend = await this.loadFromBackend();
    this.mode = loadedBackend ? 'backend' : 'local';
    if (loadedBackend) {
      this.startPolling();
    }
  },
  setupSyncListeners() {
    if (this._listenersWired) return;
    this._listenersWired = true;
    window.addEventListener('storage', e => {
      if (e.key === LS_KEY || e.key === LS_KEY_LIVE || e.key === 'hydrobot.dataMode.v1' || e.key === 'hydrobot.live.telemetry.v1') {
        this.loadLocal();
        if (window.HydrobotData && e.key === 'hydrobot.live.telemetry.v1') {
          try {
            const parsed = JSON.parse(e.newValue || '{}');
            window.HydrobotData.hydrateLiveData(parsed);
          } catch {}
        }
        window.LiveGardenUI?.updateInPlace?.();
        scheduleRender();
      }
    });
    if (SYNC_CHANNEL) {
      SYNC_CHANNEL.onmessage = ev => {
        const msg = ev?.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'state_changed') {
          this.loadLocal();
          if (this.mode === 'backend') this.syncIncremental();
          window.LiveGardenUI?.updateInPlace?.();
          scheduleRender();
        } else if (msg.type === 'mode_changed' && window.HydrobotData) {
          if (window.HydrobotData.getMode() !== msg.mode) {
            window.HydrobotData.setMode(msg.mode);
            window.LiveGardenUI?.syncDataMode?.();
            syncDataModeUI();
            scheduleRender();
          }
        }
      };
    }
    if (window.HydrobotData) {
      window.HydrobotData.subscribe((mode, reason) => {
        if (reason !== 'hydrate') {
          window.LiveGardenUI?.updateInPlace?.();
          scheduleRender();
        }
      });
    }
  },
  async fetchModeState(mode, since = -1) {
    const farmId = encodeURIComponent(this.scopeFarmId());
    const qs = `mode=${encodeURIComponent(mode)}&farmId=${farmId}${since >= 0 ? `&since=${since}` : ''}`;
    const res = await fetch(`/api/farm-state?${qs}`, {
      method: 'GET',
      cache: 'no-store',
      headers: this.authHeaders(),
    });
    if (res.status === 404 || res.status === 405) return { unavailable: true };
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(data?.error || `Sync failed (${res.status}).`);
      err.status = res.status;
      err.code = data?.code || 'sync_error';
      throw err;
    }
    return data;
  },
  hasLocalRecords(map) {
    return COLS.some(c => map?.[c] && Object.keys(map[c]).length > 0);
  },
  async loadFromBackend() {
    try {
      const [simRes, liveRes] = await Promise.all([
        this.fetchModeState('simulated'),
        this.fetchModeState('live'),
      ]);
      if (simRes?.unavailable || liveRes?.unavailable) {
        this.syncError = null;
        return false;
      }

      if (simRes && !simRes.unchanged) {
        if (simRes.revision === 0 && this.hasLocalRecords(this.simData)) {
          await this.pushMergeToBackend('simulated', this.simData);
        } else {
          COLS.forEach(c => { this.simData[c] = simRes.collections?.[c] || {}; });
          this.rev.simulated = Number(simRes.revision) || 0;
        }
      }

      if (liveRes && !liveRes.unchanged) {
        if (liveRes.revision === 0 && this.hasLocalRecords(this.liveData)) {
          await this.pushMergeToBackend('live', this.liveData);
        } else {
          COLS.forEach(c => { this.liveData[c] = liveRes.collections?.[c] || {}; });
          this.rev.live = Number(liveRes.revision) || 0;
        }
        if (window.HydrobotData) {
          window.HydrobotData.hydrateLiveData({
            telemetry: liveRes.telemetry || {},
            telemetryHistory: liveRes.telemetryHistory || {},
            resourceSeries: liveRes.resourceSeries || [],
          });
        }
      }

      this.syncError = null;
      this.error = null;
      this.saveLocalSafe();
      return true;
    } catch (e) {
      if (e?.status === 401) {
        this.syncError = null;
        return false;
      }
      console.warn('Backend state load failed, retaining cached state:', e);
      this.syncError = e?.message || 'Unable to connect to farm backend. Changes may not sync across devices.';
      return false;
    }
  },
  async pushMergeToBackend(mode, collections) {
    const res = await fetch('/api/farm-state', {
      method: 'PUT',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ mode, farmId: this.scopeFarmId(), op: 'merge', collections }),
    });
    const out = await res.json().catch(() => null);
    if (!res.ok) throw new Error(out?.error || 'Failed to sync state.');
    this.rev[mode] = Number(out?.revision) || this.rev[mode];
    return out;
  },
  async syncIncremental() {
    if (this.mode !== 'backend' || document.hidden) return;
    if (typeof AuthState !== 'undefined' && !AuthState.isDemoAuth && !AuthState.session) return;
    const activeMode = isLiveMode() ? 'live' : 'simulated';
    try {
      const res = await this.fetchModeState(activeMode, this.rev[activeMode]);
      if (!res || res.unavailable || res.unchanged) return;
      const target = activeMode === 'live' ? this.liveData : this.simData;
      COLS.forEach(c => { target[c] = res.collections?.[c] || {}; });
      this.rev[activeMode] = Number(res.revision) || this.rev[activeMode];
      if (activeMode === 'live' && window.HydrobotData) {
        window.HydrobotData.hydrateLiveData({
          telemetry: res.telemetry || {},
          telemetryHistory: res.telemetryHistory || {},
          resourceSeries: res.resourceSeries || [],
        });
      }
      this.syncError = null;
      this.saveLocalSafe();
      window.LiveGardenUI?.updateInPlace?.();
      scheduleRender();
    } catch (e) {
      if (e?.status !== 401 && e?.status !== 429) {
        this.syncError = e?.message || 'Background sync interrupted.';
      }
    }
  },
  startPolling() {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => { this.syncIncremental(); }, 4000);
  },
  loadLocal() {
    try {
      const rawSim = localStorage.getItem(LS_KEY);
      if (rawSim) { const d = JSON.parse(rawSim); COLS.forEach(c => this.simData[c] = d[c] || {}); }
      const rawLive = localStorage.getItem(LS_KEY_LIVE);
      if (rawLive) { const d = JSON.parse(rawLive); COLS.forEach(c => this.liveData[c] = d[c] || {}); }
    }
    catch (e) { this.error = 'Browser storage is blocked, so changes will last only until you close this page.'; }
  },
  saveLocalSafe() {
    try { this.saveLocal(); } catch {}
  },
  saveLocal() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.simData));
      localStorage.setItem(LS_KEY_LIVE, JSON.stringify(this.liveData));
    }
    catch (e) { throw { code: 'storage_full', message: 'Browser storage is full or blocked.' }; }
  },
  all(col) {
    if (isLiveMode()) {
      return Object.values(this.liveData[col] || {}).filter(d => d && !d._deleted);
    }
    const map = new Map((DEMO[col] || []).map(d => [d.id, d]));
    for (const [id, d] of Object.entries(this.simData[col] || {})) map.set(id, d);
    return [...map.values()].filter(d => !d._deleted);
  },
  get(col, id) { return this.all(col).find(d => d.id === id); },
  async put(col, doc) {
    const activeMode = isLiveMode() ? 'live' : 'simulated';
    const target = isLiveMode() ? this.liveData : this.simData;
    const clean = JSON.parse(JSON.stringify({ ...doc, updatedAt: Date.now(), updatedBy: currentUser().name }));
    const prev = target[col][doc.id];
    target[col] = { ...target[col], [doc.id]: clean };
    try {
      if (this.mode === 'db') {
        await withRetry(() => this.db.collection(col).doc(doc.id).set(clean));
      } else if (this.mode === 'backend') {
        const res = await fetch('/api/farm-state', {
          method: 'PUT',
          headers: this.authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            mode: activeMode,
            farmId: this.scopeFarmId(),
            op: (activeMode === 'live' && clean._deleted) ? 'remove' : 'put',
            col,
            id: clean.id,
            doc: clean,
          }),
        });
        const out = await res.json().catch(() => null);
        if (!res.ok) throw new Error(out?.error || 'Could not save to server.');
        if (out?.revision) this.rev[activeMode] = Number(out.revision);
        this.syncError = null;
        this.saveLocalSafe();
      } else {
        this.saveLocal();
      }
      if (SYNC_CHANNEL) SYNC_CHANNEL.postMessage({ type: 'state_changed', col, id: doc.id, mode: activeMode });
    } catch (e) {
      const copy = { ...target[col] }; if (prev) copy[doc.id] = prev; else delete copy[doc.id]; target[col] = copy;
      throw e;
    }
    window.LiveGardenUI?.updateInPlace?.();
    scheduleRender();
    return clean;
  },
  async remove(col, id) {
    const d = this.get(col, id);
    if (!d) return;
    if (isLiveMode()) {
      const target = this.liveData;
      const prev = target[col][id];
      const copy = { ...target[col] };
      delete copy[id];
      target[col] = copy;
      try {
        if (this.mode === 'db') {
          await withRetry(() => this.db.collection(col).doc(id).set({ ...d, _deleted: true }));
        } else if (this.mode === 'backend') {
          const res = await fetch('/api/farm-state', {
            method: 'PUT',
            headers: this.authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ mode: 'live', farmId: this.scopeFarmId(), op: 'remove', col, id }),
          });
          const out = await res.json().catch(() => null);
          if (!res.ok) throw new Error(out?.error || 'Could not remove record on server.');
          if (out?.revision) this.rev.live = Number(out.revision);
          this.saveLocalSafe();
        } else {
          this.saveLocal();
        }
        if (SYNC_CHANNEL) SYNC_CHANNEL.postMessage({ type: 'state_changed', col, id, mode: 'live' });
      } catch (e) {
        if (prev) target[col] = { ...target[col], [id]: prev };
        throw e;
      }
      window.LiveGardenUI?.updateInPlace?.();
      scheduleRender();
      return;
    }
    await this.put(col, { ...d, _deleted: true });
  },
  async ingestLiveTelemetry(ghId, metrics, meta = {}) {
    if (window.HydrobotData) {
      window.HydrobotData.ingestSensorReading(ghId, metrics, meta);
    }
    if (this.mode === 'backend') {
      const res = await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ farmId: this.scopeFarmId(), ghId, metrics, source: meta.source || 'manual', at: meta.at || Date.now() }),
      });
      const out = await res.json().catch(() => null);
      if (!res.ok) throw new Error(out?.error || 'Could not save telemetry.');
      if (out?.revision) this.rev.live = Number(out.revision);
    }
    if (SYNC_CHANNEL) SYNC_CHANNEL.postMessage({ type: 'state_changed', col: 'telemetry', id: ghId, mode: 'live' });
    window.LiveGardenUI?.updateInPlace?.();
    scheduleRender();
  },
  async saveResourcePoint(op, payload) {
    if (window.HydrobotData) {
      if (op === 'delete') window.HydrobotData.removeResourcePoint(payload.date);
      else window.HydrobotData.upsertResourcePoint(payload);
    }
    if (this.mode === 'backend') {
      const res = await fetch('/api/telemetry/resources', {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ farmId: this.scopeFarmId(), op, ...payload }),
      });
      const out = await res.json().catch(() => null);
      if (!res.ok) throw new Error(out?.error || 'Could not save resource meter log.');
      if (out?.revision) this.rev.live = Number(out.revision);
    }
    if (SYNC_CHANNEL) SYNC_CHANNEL.postMessage({ type: 'state_changed', col: 'resources', id: payload.date, mode: 'live' });
    scheduleRender();
  },
};
async function withRetry(fn) {
  try { return await fn(); }
  catch (e) { if (e && e.code === 'unavailable') { await sleep(400 + Math.random() * 600); return fn(); } throw e; }
}
function errText(e) {
  const c = e && e.code;
  if (c === 'quota_exceeded') return 'The farm database is full. Delete old records, then try again.';
  if (c === 'invalid_argument') return 'Your sharing level does not allow saving changes here. Ask the farm owner for Contributor access.';
  if (c === 'storage_full') return 'This browser could not store the change. Free some space or allow site data, then try again.';
  if (c === 'revoked') return 'Access to this farm was withdrawn. Reload the page to continue.';
  if (e && typeof e.message === 'string' && e.message.trim()) return e.message.trim();
  return 'The change could not be saved. Check your connection and try again.';
}

/* ================= State ================= */
const ui = {
  route: 'dashboard', role: 'Farm Worker', farm: 'hydrovest', trendRange: 30,
  ghMetric: 'temp', ghRange: '24h', plantF: { q: '', gh: '', stage: '' }, taskF: { q: '', gh: '', who: '', pri: '', status: 'Open', when: 'all' },
  invCat: 'All', invQ: '', showResolved: false, calMonth: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), saleF: '',
  nutGh: 'gh-d', chat: [], chatBusy: false, disease: null, sample: null, sampleImages: false, fcRange: 56,
};
const AUTH_ROLE_MAP = { owner: 'Farm Owner', manager: 'Farm Manager', worker: 'Farm Worker' };
function syncUiRoleFromAuth() {
  if (typeof AuthState !== 'undefined' && !AuthState.isDemoAuth) {
    const mapped = AuthState.session ? (AUTH_ROLE_MAP[AuthState.role] || 'Farm Worker') : 'Farm Worker';
    if (ROLES[mapped]) ui.role = mapped;
  }
}
const currentUser = () => {
  if (typeof AuthState !== 'undefined' && AuthState.session && !AuthState.isDemoAuth && AuthState.user) {
    const mappedRole = AUTH_ROLE_MAP[AuthState.role] || 'Farm Worker';
    const name = AuthState.profile?.full_name || AuthState.user.user_metadata?.full_name || AuthState.profile?.email || AuthState.user.email || ROLES[mappedRole]?.name || 'User';
    return { name, role: mappedRole };
  }
  return { name: ROLES[ui.role].name, role: ui.role };
};
const can = p => ROLES[ui.role].perms.includes(p);

/* ================= Derived farm data (100% dynamic) ================= */
const greenhouses = () => Store.all('greenhouses');
const ghById = id => greenhouses().find(g => g.id === id) || null;
const ghName = id => ghById(id)?.name || id || 'Unassigned';
function teamMembers() {
  const map = new Map();
  if (typeof AuthState !== 'undefined' && !AuthState.isDemoAuth && Array.isArray(AuthState.farmMembers)) {
    AuthState.farmMembers
      .filter(m => m.farm_id === AuthState.currentFarmId)
      .forEach((m, idx) => {
        const label = m.full_name || m.email || (m.user_id === AuthState.user?.id ? currentUser().name : `Member ${idx + 1}`);
        const roleLabel = AUTH_ROLE_MAP[m.role] || m.role || 'Farm Worker';
        map.set(String(m.user_id || label), { id: String(m.user_id || label), name: label, role: roleLabel });
      });
  }
  Store.all('team').forEach(p => {
    if (p && p.name) map.set(p.id, { id: p.id, name: p.name, role: p.role || 'Farm Worker' });
  });
  return [...map.values()];
}
function cropsMap() {
  const out = {};
  Store.all('crops').forEach(c => { if (c && c.id) out[c.id] = c; });
  if (!Object.keys(out).length && !isLiveMode()) {
    Object.entries(DEFAULT_CROPS).forEach(([id, c]) => { out[id] = { id, ...c }; });
  }
  return out;
}
function cropDef(key) {
  const custom = Store.get('crops', key);
  if (custom) return custom;
  if (DEFAULT_CROPS[key]) return { id: key, ...DEFAULT_CROPS[key] };
  return {
    id: key || 'Crop',
    label: String(key || 'Crop'),
    cycle: 45,
    price: 6.0,
    ypp: 0.15,
    continuous: false,
    ph: [5.5, 6.5],
    ec: { Germination: [0.6, 1.0], Seedling: [0.8, 1.2], Vegetative: [1.0, 1.8], Flowering: [1.4, 2.2], Fruiting: [1.6, 2.4], Ready: [1.2, 2.0] },
  };
}
function customersList() {
  const set = new Set();
  if (!isLiveMode()) DEFAULT_CUSTOMERS.forEach(c => set.add(c));
  Store.all('orders').forEach(o => { if (o && o.customer) set.add(o.customer); });
  return [...set];
}
const batches = () => Store.all('batches');
const activeBatches = () => batches().filter(b => b.stage !== 'Harvested');
const tasks = () => Store.all('tasks');
const inventory = () => Store.all('inventory');
const harvests = () => Store.all('harvests').sort((a, b) => b.date.localeCompare(a.date));
const orders = () => Store.all('orders').sort((a, b) => b.date.localeCompare(a.date));
function targets(ghId) {
  const t = Store.get('targets', ghId);
  const base = DEFAULT_TARGETS[ghId] || FALLBACK_TARGETS;
  return { ...base, ...(t ? t.ranges : {}) };
}
const readingEpoch = v => { const n = Number(v); if (Number.isFinite(n) && n > 0) return n; const p = typeof v === 'string' ? Date.parse(v) : NaN; return Number.isFinite(p) && p > 0 ? p : 0; };
function manualReadingsForGh(ghId) { return Store.all('readings').filter(r => r.ghId === ghId).sort((a, b) => readingEpoch(b.at) - readingEpoch(a.at)); }
function manualReading(ghId) { return manualReadingsForGh(ghId)[0]; }
function readings(ghId) {
  if (!isLiveMode()) {
    const base = CURRENT[ghId] ? { ...CURRENT[ghId] } : null;
    const mrs = manualReadingsForGh(ghId);
    if (!mrs.length) return base;
    const merged = base ? { ...base } : {};
    mrs.slice().sort((a, b) => readingEpoch(a.at) - readingEpoch(b.at)).forEach(mr => {
      SENSORS.forEach(s => {
        if (mr[s.k] !== null && mr[s.k] !== undefined && Number.isFinite(Number(mr[s.k]))) merged[s.k] = Number(mr[s.k]);
      });
    });
    return Object.keys(merged).length ? merged : null;
  }
  const mrs = manualReadingsForGh(ghId);
  const live = window.HydrobotData?.getLiveTelemetry(ghId, mrs);
  return live ? live.values : null;
}
function readingMeta(ghId, metricKey) {
  if (!isLiveMode()) {
    const age = READ_AT[ghId] ?? 1;
    return { source: 'simulated', ageMin: age, lastAt: Date.now() - age * 60000 };
  }
  const mrs = manualReadingsForGh(ghId);
  const live = window.HydrobotData?.getLiveTelemetry(ghId, mrs);
  if (!live) return null;
  const at = metricKey ? live.updatedAtByMetric?.[metricKey] : live.lastAt;
  return {
    source: live.source || 'sensor',
    lastAt: at || live.lastAt || null,
    ageMin: at ? Math.max(1, Math.round((Date.now() - at) / 60000)) : null,
    updatedAtByMetric: live.updatedAtByMetric || {},
  };
}
function metricStatus(v, range) {
  if (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) || !Array.isArray(range)) return 'nodata';
  const val = Number(v);
  const [lo, hi] = range; if (val >= lo && val <= hi) return 'ok';
  const d = val < lo ? (lo - val) / Math.abs(lo || 1) : (val - hi) / Math.abs(hi || 1);
  return d > 0.15 ? 'crit' : 'warn';
}
function ghStatus(ghId) {
  const r = readings(ghId), t = targets(ghId);
  if (!r) return 'nodata';
  let worst = 'ok', hasAny = false;
  SENSORS.forEach(s => {
    const st = metricStatus(r[s.k], t[s.k]);
    if (st === 'nodata') return;
    hasAny = true;
    if (st === 'crit') worst = 'crit';
    else if (st === 'warn' && worst === 'ok') worst = 'warn';
  });
  return hasAny ? worst : 'nodata';
}
const ST_LABEL = { ok: 'Optimal', warn: 'Attention', crit: 'Critical', nodata: 'No data' };
const badge = st => `<span class="badge b-${st}">${ST_LABEL[st] || 'No data'}</span>`;
const isOverdue = t => t.status !== 'Done' && new Date(parseD(t.due).getTime() + timeMs(t.time)) < new Date();
const timeMs = t => { const [h, m] = String(t || '23:59').split(':').map(Number); return (h * 60 + m) * 60000; };
function readiness(b) {
  const p = parseD(b.plantedOn), e = parseD(b.expectedHarvest);
  if (b.stage === 'Ready') return Math.max(95, Math.round(clamp((TODAY - p) / Math.max(DAY, e - p), 0, 1) * 100));
  return Math.round(clamp((TODAY - p) / Math.max(DAY, e - p), 0, 1) * 100);
}
function ghPlants(ghId) { return activeBatches().filter(b => b.ghId === ghId).reduce((s, b) => s + Number(b.plants), 0); }
function ghCrops(ghId) { return [...new Set(activeBatches().filter(b => b.ghId === ghId).map(b => cropDef(b.crop).label))]; }
function forecastItems(horizon) {
  const out = [];
  activeBatches().forEach(b => {
    const c = cropDef(b.crop); let d = daysFrom(b.expectedHarvest);
    if (d < 0) d = 0;
    if (c.continuous && ['Flowering', 'Fruiting', 'Ready'].includes(b.stage)) {
      for (let x = d; x <= horizon; x += 7) out.push({ batch: b, day: x, date: dOff(x), kg: Number(b.estKg), crop: b.crop });
    } else if (d <= horizon) out.push({ batch: b, day: d, date: dOff(d), kg: Number(b.estKg), crop: b.crop });
  });
  return out.sort((a, b) => a.day - b.day);
}
function kpis() {
  const act = activeBatches();
  const plants = act.reduce((s, b) => s + Number(b.plants), 0);
  const health = plants ? act.reduce((s, b) => s + b.health * b.plants, 0) / plants : 0;
  const f30 = forecastItems(30);
  const rev = f30.reduce((s, i) => s + i.kg * (Number(cropDef(i.crop).price) || 0), 0);
  const open = tasks().filter(t => t.status !== 'Done');
  const ready = act.filter(b => b.stage === 'Ready' || daysFrom(b.expectedHarvest) <= 7);
  const gOn = greenhouses().filter(g => ghPlants(g.id) > 0).length;
  return { plants, health, rev, f30kg: f30.reduce((s, i) => s + i.kg, 0), open, ready, gOn, batches: act.length };
}
function historicalRatio(crop) {
  const hs = harvests().filter(h => h.crop === crop && h.estKg > 0);
  if (!hs.length) return { ratio: 1, cv: 0.15, n: 0 };
  const rs = hs.map(h => h.actualKg / h.estKg);
  const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
  const sd = Math.sqrt(rs.reduce((a, b) => a + (b - mean) ** 2, 0) / rs.length);
  return { ratio: mean, cv: Math.max(0.08, sd / mean), n: rs.length };
}

/* Alerts derived from sensors, inventory, tasks and observations */
function alerts() {
  const list = [];
  const live = isLiveMode();
  greenhouses().forEach(g => {
    const r = readings(g.id), t = targets(g.id);
    if (!r) return;
    const meta = readingMeta(g.id);
    SENSORS.forEach(s => {
      const st = metricStatus(r[s.k], t[s.k]); if (st === 'ok' || st === 'nodata') return;
      const low = Number(r[s.k]) < t[s.k][0];
      let title = `${s.label} ${low ? 'low' : 'high'} in ${g.name}`;
      if (s.k === 'res') title = `Low water level in ${g.name} reservoir`;
      if (s.k === 'temp') title = `Temperature ${low ? 'below' : 'above'} target in ${g.name}`;
      const srcLabel = !live ? 'Demo reading.' : meta?.source === 'manual' ? 'Manual meter reading.' : 'Live sensor reading.';
      const metricAt = meta?.updatedAtByMetric?.[s.k] || meta?.lastAt;
      const age = !live ? (READ_AT[g.id] ?? 1) : (metricAt ? Math.max(1, Math.round((Date.now() - metricAt) / 60000)) : 1);
      list.push({ id: `sensor-${g.id}-${s.k}`, sev: st, kind: s.k === 'res' ? 'Water level' : s.k === 'temp' ? 'Temperature' : 'Sensor', icon: s.icon, title,
        detail: `Reading ${num(r[s.k], s.dec)}${s.unit ? ' ' + s.unit : ''}, target ${t[s.k][0]}–${t[s.k][1]}${s.unit ? ' ' + s.unit : ''}. ${srcLabel}`, link: '#' + g.id, linkLabel: 'Open ' + g.name, age });
    });
  });
  batches().forEach(b => (b.observations || []).forEach((o, i) => {
    if (o.flag && b.stage !== 'Harvested' && daysFrom(o.date) >= -14) list.push({ id: `disease-${b.id}-${i}`, sev: 'crit', kind: 'Suspected disease', icon: 'scan', title: `${o.flag} reported in ${b.id} (${cropDef(b.crop).label})`, detail: `${ghName(b.ghId)}, zone ${b.zone}: “${o.note}” — ${o.by}, ${fmtD(o.date)}.`, action: { act: 'batch', id: b.id, label: 'View batch' }, age: -daysFrom(o.date) * 1440 });
  }));
  inventory().filter(i => Number(i.qty) < Number(i.threshold)).forEach(i => list.push({ id: `inv-${i.id}`, sev: Number(i.qty) < Number(i.threshold) * 0.5 ? 'crit' : 'warn', kind: 'Low inventory', icon: 'box', title: `${i.name} below reorder point`, detail: `${num(i.qty)} ${i.unit} on hand, reorder at ${num(i.threshold)} ${i.unit}. Supplier: ${i.supplier}.`, link: '#inventory', linkLabel: 'Open inventory', age: 600 }));
  tasks().filter(isOverdue).forEach(t => list.push({ id: `task-${t.id}`, sev: t.priority === 'High' ? 'crit' : 'warn', kind: 'Overdue task', icon: 'clipboard', title: `Overdue: ${t.title}`, detail: `Assigned to ${t.assignee}, ${ghName(t.ghId)}. Was due ${fmtD(t.due)} at ${fmtT(t.time)}.`, action: { act: 'task-edit', id: t.id, label: 'Open task' }, age: Math.round((Date.now() - parseD(t.due).getTime() - timeMs(t.time)) / 60000) }));
  const state = Store.data.alerts || {};
  list.forEach(a => { a.state = state[a.id]?.status || 'new'; a.stateBy = state[a.id]?.updatedBy; });
  const sevRank = { crit: 0, warn: 1 };
  return list.sort((a, b) => (a.state === 'acknowledged') - (b.state === 'acknowledged') || sevRank[a.sev] - sevRank[b.sev] || a.age - b.age);
}
const activeAlerts = () => alerts().filter(a => a.state !== 'resolved');
const ageText = m => m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;

/* Sensor history (demo or live) */
function history(ghId, key, range) {
  if (isLiveMode()) {
    const mrs = manualReadingsForGh(ghId);
    return window.HydrobotData ? window.HydrobotData.getLiveHistory(ghId, key, range, mrs) : [];
  }
  const cur = CURRENT[ghId]?.[key];
  if (cur === undefined || cur === null) {
    const mrs = manualReadingsForGh(ghId);
    return window.HydrobotData ? window.HydrobotData.getLiveHistory(ghId, key, range, mrs) : [];
  }
  const r = rng(hash(ghId + key + range)), t = targets(ghId)[key] || FALLBACK_TARGETS[key];
  const n = range === '24h' ? 24 : range === '7d' ? 28 : 30, stepH = range === '24h' ? 1 : range === '7d' ? 6 : 24;
  const mid = (t[0] + t[1]) / 2, amp = (t[1] - t[0]) * 0.22, pts = [];
  for (let i = n - 1; i >= 0; i--) {
    const at = Date.now() - i * stepH * 3600e3;
    const hr = new Date(at).getHours();
    let v = key === 'res' ? cur + i * (range === '24h' ? 1.6 : 0.5) * (ghId === 'gh-d' ? 1 : 0.3) : mid + Math.sin((hr - 9) / 24 * Math.PI * 2) * amp + (r() - 0.5) * amp * 0.6;
    if (key === 'res' && v > 96) v = 96 - r() * 4;
    const w = 1 - i / n; v = v * (1 - w * w) + cur * w * w;
    if (i === 0) v = cur;
    pts.push({ at, v: +v.toFixed(sensorDef(key).dec) });
  }
  return pts;
}
function resourceSeriesForMode(days) {
  if (isLiveMode()) {
    return window.HydrobotData ? window.HydrobotData.getLiveResourceSeries(days) : [];
  }
  return resourceSeries(days);
}

/* ================= Rendering infrastructure ================= */
let charts = [];
let renderQueued = false;
function scheduleRender() { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; render(); }); }
const ROUTES = {
  dashboard: { label: 'Dashboard', icon: 'grid', group: 'Overview', view: () => vDashboard() },
  garden: { label: 'Live Garden', icon: 'cube', group: 'Overview', view: () => window.LiveGardenUI ? window.LiveGardenUI.renderView() : loadingView() },
  plants: { label: 'Plant Management', icon: 'sprout', group: 'Operations', view: () => vPlants() },
  greenhouses: { label: 'Greenhouse Management', icon: 'house', group: 'Operations', view: () => vGreenhouses() },
  harvest: { label: 'Harvest Management', icon: 'basket', group: 'Operations', view: () => vHarvest() },
  tasks: { label: 'Farmer Tasks', icon: 'clipboard', group: 'Operations', view: () => vTasks() },
  inventory: { label: 'Smart Inventory', icon: 'box', group: 'Operations', view: () => vInventory() },
  nutrition: { label: 'Crop Nutrition', icon: 'flask', group: 'AI Intelligence', view: () => vNutrition() },
  disease: { label: 'Disease Detection', icon: 'scan', group: 'AI Intelligence', view: () => vDisease() },
  assistant: { label: 'Farm Assistant', icon: 'chat', group: 'AI Intelligence', view: () => vAssistant() },
  forecast: { label: 'Production Forecast', icon: 'trend', group: 'AI Intelligence', view: () => vForecast() },
  yield: { label: 'Yield Analytics', icon: 'bar', group: 'Business', view: () => vYield() },
  finance: { label: 'Financial Dashboard', icon: 'wallet', group: 'Business', view: () => vFinance() },
  sales: { label: 'Sales', icon: 'cart', group: 'Business', view: () => vSales() },
  logistics: { label: 'Logistics', icon: 'truck', group: 'Business', view: () => vLogistics() },
  alerts: { label: 'Smart Alerts', icon: 'bell', group: 'Monitoring', view: () => vAlerts() },
};
function resolveRoute(key) {
  if (ROUTES[key]) return ROUTES[key];
  const g = ghById(key);
  if (g) return { label: g.name, parent: 'greenhouses', view: () => vGhDetail(g.id) };
  if (/^gh-/.test(String(key || ''))) return { label: 'Greenhouse', parent: 'greenhouses', view: () => vGhDetail(key) };
  return null;
}

/* ================= Custom Mouse Follower & Scroll Animations ================= */
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let cursorX = mouseX, cursorY = mouseY;
let ringX = mouseX, ringY = mouseY;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
function animateCursor() {
  cursorX += (mouseX - cursorX) * 0.25;
  cursorY += (mouseY - cursorY) * 0.25;
  ringX += (mouseX - ringX) * 0.15;
  ringY += (mouseY - ringY) * 0.15;
  const dot = $('#cursorDot'), ring = $('#cursorRing');
  if (dot) dot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
  if (ring) ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
  requestAnimationFrame(animateCursor);
}
requestAnimationFrame(animateCursor);
document.addEventListener('mouseover', e => {
  if (e.target.closest('a, button, input, select, textarea, [role="button"], .click')) {
    $('#cursorRing')?.classList.add('hovered');
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('a, button, input, select, textarea, [role="button"], .click')) {
    $('#cursorRing')?.classList.remove('hovered');
  }
});

const scrollObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-revealed');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function initScrollAnimations() {
  $$('.reveal-on-scroll, .card, .kpi, .gh-card, .auth-card, .hydro-hero').forEach(el => {
    if (!el.classList.contains('reveal-on-scroll')) {
      el.classList.add('reveal-on-scroll');
    }
    scrollObserver.observe(el);
  });
}

/* ================= Supabase Auth & Role Management ================= */
let sbClient = null;
let isSupabaseConfigured = false;
let runtimeConfig = { allowedEmails: '', allowedDomains: '' };

async function loadRuntimeConfigAndInitSupabase() {
  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (res.ok) {
      const cfg = await res.json();
      const url = String(cfg?.supabaseUrl || '').trim();
      const key = String(cfg?.supabaseAnonKey || '').trim();
      runtimeConfig.allowedEmails = String(cfg?.allowedEmails || '').trim();
      runtimeConfig.allowedDomains = String(cfg?.allowedDomains || '').trim();

      if (
        window.supabase &&
        url &&
        url !== 'https://your-project.supabase.co' &&
        key &&
        key !== 'your-anon-key'
      ) {
        sbClient = window.supabase.createClient(url, key, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          }
        });
        isSupabaseConfigured = true;
      }
    }
  } catch (e) {
    console.warn('Failed to load runtime config from /api/config, falling back:', e);
  }

  if (!isSupabaseConfigured && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    const url = String(window.SUPABASE_URL).trim();
    const key = String(window.SUPABASE_ANON_KEY).trim();
    if (url && url !== 'https://your-project.supabase.co' && key && key !== 'your-anon-key' && window.supabase) {
      sbClient = window.supabase.createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        }
      });
      isSupabaseConfigured = true;
    }
  }

  AuthState.isDemoAuth = !isSupabaseConfigured;
  if (AuthState.isDemoAuth) {
    ui.role = 'Farm Owner';
    AuthState.role = 'owner';
    try { const r = localStorage.getItem('hydrobot.role'); if (r && ROLES[r]) ui.role = r; } catch (e) { }
  }
}

const AuthState = {
  session: null,
  user: null,
  profile: null,
  farms: [],
  farmMembers: [],
  equipmentCommands: [],
  currentFarmId: 'riverside',
  role: 'worker', // least privilege until membership resolves
  authView: 'welcome',
  loading: false,
  error: '',
  successMsg: '',
  isDemoAuth: true
};

function resetSensitiveStateOnSignOut(opts = {}) {
  const preserveAuthView = Boolean(opts && opts.preserveAuthView);
  AuthState.session = null;
  AuthState.user = null;
  AuthState.profile = null;
  AuthState.farms = [];
  AuthState.farmMembers = [];
  AuthState.equipmentCommands = [];
  AuthState.role = AuthState.isDemoAuth ? 'owner' : 'worker';
  if (!preserveAuthView) {
    AuthState.authView = 'welcome';
  }
  ui.chat = [];
  ui.disease = null;
  if (!AuthState.isDemoAuth) {
    ui.role = 'Farm Worker';
    COLS.forEach(c => {
      if (Store.simData) Store.simData[c] = {};
      if (Store.liveData) Store.liveData[c] = {};
    });
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_KEY_LIVE);
      localStorage.removeItem('hydrobot.role');
    } catch (e) {}
    window.HydrobotData?.clearAllLiveData?.();
  }
}

function activeFarmName() {
  const meta = Store.get('farm', 'meta');
  const f = AuthState.farms.find(x => x.farmId === AuthState.currentFarmId);
  if (!AuthState.isDemoAuth && isUuid(AuthState.currentFarmId) && f?.name) return meta?.name || f.name;
  if (meta && meta.name) return meta.name;
  if (f && f.name) return f.name;
  if (ui.farm === 'hilltop') return 'Hilltop Annex';
  return isLiveMode() ? 'My Farm' : 'Riverside Hydro Farm';
}

function activeFarmLocation() {
  const meta = Store.get('farm', 'meta');
  const f = AuthState.farms.find(x => x.farmId === AuthState.currentFarmId);
  if (meta && meta.location !== undefined) return meta.location;
  if (f && f.location) return f.location;
  return isLiveMode() ? '' : 'Valley Sector A';
}

function farmSettingsForm() {
  if (!can('targets')) return toast('Editing farm settings is not available for this role.', 'error');
  openModal({
    title: 'Farm settings', submitLabel: 'Save farm details',
    body: `<div class="form-grid">
      <div class="full">${fld('Farm name', `<input id="fm-name" name="name" value="${esc(activeFarmName())}" placeholder="e.g. Valley Hydro Farm">`, 'name')}</div>
      <div class="full">${fld('Location / sector', `<input id="fm-loc" name="location" value="${esc(activeFarmLocation())}" placeholder="e.g. Sector A, Greenhouse Row">`, 'location')}</div>
    </div>`,
    validate: d => ({
      name: d.name.trim().length < 2 && 'Enter a farm name (at least 2 characters).',
    }),
    submit: async d => {
      const name = d.name.trim();
      const location = d.location.trim();
      await Store.put('farm', { id: 'meta', name, location });
      const f = AuthState.farms.find(x => x.farmId === AuthState.currentFarmId);
      if (f) { f.name = name; f.location = location; }
      if (sbClient && !AuthState.isDemoAuth && isUuid(AuthState.currentFarmId)) {
        const { error } = await sbClient.from('farms').update({ name, location }).eq('id', AuthState.currentFarmId);
        if (error) throw error;
      }
      return `Farm updated to "${name}".`;
    }
  });
}

async function initAuth() {
  if (sbClient) {
    const fullUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description') || urlParams.get('error') || hashParams.get('error');
    const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
    const isRecoveryHash = window.location.hash.includes('type=recovery');
    const hasCode = urlParams.has('code') || hashParams.has('code');
    const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
    const tokenType = urlParams.get('type') || hashParams.get('type') || 'signup';
    const hasAccessToken = window.location.hash.includes('access_token=');

    if (errorDescription || errorCode) {
      AuthState.authView = 'verify';
      AuthState.verifyStatus = 'error';
      AuthState.error = decodeURIComponent((errorDescription || 'The confirmation link has expired or is invalid.').replace(/\+/g, ' '));
    } else if (hasCode) {
      AuthState.authView = 'verify';
      AuthState.verifyStatus = 'loading';
      try {
        const { data, error } = await sbClient.auth.exchangeCodeForSession(fullUrl);
        if (error) throw error;
        if (data?.session) {
          AuthState.session = data.session;
          AuthState.user = data.user;
          await loadUserFarms();
          AuthState.verifyStatus = 'success';
          setTimeout(() => {
            AuthState.authView = 'welcome';
            render();
          }, 1800);
        } else {
          throw new Error('Verification did not return an active session.');
        }
      } catch (er) {
        AuthState.verifyStatus = 'error';
        AuthState.error = er?.message || 'Verification failed or link expired.';
      }
    } else if (tokenHash && !isRecoveryHash) {
      AuthState.authView = 'verify';
      AuthState.verifyStatus = 'loading';
      try {
        const { data, error } = await sbClient.auth.verifyOtp({ token_hash: tokenHash, type: tokenType });
        if (error) throw error;
        if (data?.session) {
          AuthState.session = data.session;
          AuthState.user = data.user;
          await loadUserFarms();
        }
        AuthState.verifyStatus = 'success';
        setTimeout(() => {
          AuthState.authView = data?.session ? 'welcome' : 'signin';
          render();
        }, 1800);
      } catch (er) {
        AuthState.verifyStatus = 'error';
        AuthState.error = er?.message || 'The confirmation link has expired or is invalid.';
      }
    } else if (hasAccessToken && !isRecoveryHash) {
      AuthState.authView = 'verify';
      AuthState.verifyStatus = 'success';
      setTimeout(() => {
        AuthState.authView = 'welcome';
        render();
      }, 1500);
    }

    const { data: { session } } = await sbClient.auth.getSession();
    if (session && !AuthState.session) {
      AuthState.session = session;
      AuthState.user = session?.user || null;
    }
    if (isRecoveryHash) AuthState.authView = 'reset';
    if (AuthState.session && AuthState.authView !== 'reset' && AuthState.authView !== 'verify') {
      await loadUserFarms();
    }
    if (fullUrl.includes('code=') || fullUrl.includes('access_token=') || fullUrl.includes('refresh_token=')) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }

    sbClient.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        resetSensitiveStateOnSignOut();
      } else if (!nextSession) {
        const keepCurrentAuthView = ['verify', 'reset', 'signin', 'signup', 'forgot'].includes(AuthState.authView);
        resetSensitiveStateOnSignOut({ preserveAuthView: keepCurrentAuthView });
      } else {
        AuthState.session = nextSession;
        AuthState.user = nextSession?.user || null;
        if (event === 'PASSWORD_RECOVERY') {
          AuthState.authView = 'reset';
        } else if (AuthState.authView !== 'reset' && AuthState.authView !== 'verify') {
          await loadUserFarms();
        }
      }
      render();
    });
  } else {
    AuthState.session = null;
    AuthState.user = null;
  }
}

async function loadUserProfile() {
  if (!sbClient || !AuthState.user) return null;
  try {
    const { data, error } = await sbClient.from('profiles').select('*');
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    AuthState.profile = rows.find(p => p.id === AuthState.user.id) || rows[0] || null;
  } catch (e) {
    console.warn('profiles RLS query skipped:', e?.message || e);
    AuthState.profile = null;
  }
  return AuthState.profile;
}

async function loadEquipmentCommands() {
  if (!sbClient || !AuthState.user || AuthState.isDemoAuth) return [];
  try {
    const { data, error } = await sbClient
      .from('equipment_commands')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);
    if (error) throw error;
    AuthState.equipmentCommands = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('equipment_commands RLS query skipped:', e?.message || e);
    AuthState.equipmentCommands = [];
  }
  return AuthState.equipmentCommands;
}

function isUuid(val) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || '').trim());
}

async function logEquipmentCommand({ device, command, maxRuntimeMinutes = 0 }) {
  if (!sbClient || !AuthState.session || AuthState.isDemoAuth || !isUuid(AuthState.currentFarmId)) {
    return { skipped: true };
  }
  const { data, error } = await sbClient
    .from('equipment_commands')
    .insert({
      farm_id: AuthState.currentFarmId,
      device,
      command,
      max_runtime_minutes: maxRuntimeMinutes,
      requested_by: AuthState.user?.id || null,
      status: 'queued',
    })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (data) AuthState.equipmentCommands = [data, ...AuthState.equipmentCommands].slice(0, 25);
  else await loadEquipmentCommands();
  return { data };
}

let eqCmdChannel = null;
function subscribeEquipmentCommandsRealtime() {
  if (!sbClient || AuthState.isDemoAuth || !isUuid(AuthState.currentFarmId)) return;
  try {
    if (eqCmdChannel) { sbClient.removeChannel(eqCmdChannel); eqCmdChannel = null; }
    eqCmdChannel = sbClient
      .channel(`eq-cmd-${AuthState.currentFarmId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'equipment_commands',
        filter: `farm_id=eq.${AuthState.currentFarmId}`,
      }, async () => {
        await loadEquipmentCommands();
        scheduleRender();
      })
      .subscribe();
  } catch (e) {
    console.warn('equipment_commands realtime skipped:', e?.message || e);
  }
}

async function loadUserFarms() {
  if (!sbClient || !AuthState.user) return;
  try {
    const [, farmsRes, membersRes] = await Promise.all([
      loadUserProfile(),
      sbClient.from('farms').select('id, name, location'),
      sbClient.from('farm_members').select('farm_id, user_id, role'),
    ]);
    if (farmsRes.error) throw farmsRes.error;
    if (membersRes.error) throw membersRes.error;
    AuthState.error = '';
    const farmsRows = Array.isArray(farmsRes.data) ? farmsRes.data : [];
    const memberRows = Array.isArray(membersRes.data) ? membersRes.data : [];
    AuthState.farmMembers = memberRows;
    const myRolesByFarm = new Map(
      memberRows
        .filter(m => m.user_id === AuthState.user.id)
        .map(m => [m.farm_id, m.role])
    );
    AuthState.farms = farmsRows.map(f => ({
      farmId: f.id,
      name: f.name,
      location: f.location,
      role: myRolesByFarm.get(f.id) || 'worker',
    }));
    if (AuthState.farms.length === 0) {
      AuthState.farms = [{ farmId: 'riverside', name: isLiveMode() ? 'My Farm' : 'Riverside Hydro Farm', location: '', role: 'owner' }];
      AuthState.currentFarmId = 'riverside';
      AuthState.role = 'owner';
      ui.role = 'Farm Owner';
      ui.farm = 'riverside';
    } else {
      const selected = AuthState.farms.find(f => f.farmId === AuthState.currentFarmId) || AuthState.farms[0];
      AuthState.currentFarmId = selected.farmId;
      AuthState.role = selected.role || 'worker';
      ui.farm = AuthState.currentFarmId;
      syncUiRoleFromAuth();
    }
    if (AuthState.authView === 'create_farm' || AuthState.authView === 'signin' || AuthState.authView === 'signup') {
      AuthState.authView = 'welcome';
    }
    await loadEquipmentCommands();
    subscribeEquipmentCommandsRealtime();
    if (Store.mode === 'backend') {
      await Store.loadFromBackend();
    }
  } catch (e) {
    console.warn('Failed to load user farms from Supabase:', e);
    AuthState.farms = [{ farmId: 'riverside', name: isLiveMode() ? 'My Farm' : 'Riverside Hydro Farm', location: '', role: 'owner' }];
    AuthState.currentFarmId = 'riverside';
    AuthState.role = 'owner';
    ui.role = 'Farm Owner';
    ui.farm = 'riverside';
    AuthState.authView = 'welcome';
    AuthState.error = e?.message || 'Unable to load your farm memberships from Supabase.';
  }
}

function renderAuthScreen() {
  if (AuthState.authView === 'signin') return renderSignIn();
  if (AuthState.authView === 'signup') return renderSignUp();
  if (AuthState.authView === 'forgot') return renderForgot();
  if (AuthState.authView === 'reset') return renderReset();
  if (AuthState.authView === 'verify') return renderVerifyEmail();
  return renderWelcome();
}

function hydrobotLogoHtml(extraClass = '') {
  return `
    <a href="#" class="hb-brand ${extraClass}" data-act="auth-nav" data-view="welcome" aria-label="Hydrobot AI home">
      <span class="hb-brand-mark" aria-hidden="true">
        <svg class="ico" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>
      </span>
      <span class="hb-brand-text">Hydrobot <span>AI</span></span>
    </a>
  `;
}

function renderWelcome() {
  return `
    <div class="hb-welcome">
      <div class="hb-bg" aria-hidden="true">
        <img src="/assets/images/hero_hydrovest_farm_1794817767084.jpg" alt="" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('is-broken')">
        <div class="hb-scrim"></div>
      </div>

      <div class="hb-shell">
        <header class="hb-topbar" aria-label="Hydrobot AI navigation">
          ${hydrobotLogoHtml()}
          <button type="button" class="hb-signin-link" data-act="auth-nav" data-view="signin">Sign in</button>
        </header>

        <section class="hb-hero" aria-labelledby="hb-hero-title">
          <div class="hb-hero-content">
            <p class="hb-eyebrow">Smart Greenhouse Intelligence</p>
            <h1 class="hb-hero-title" id="hb-hero-title">Intelligent Hydroponic Farming.</h1>
            <p class="hb-hero-desc">Real-time climate telemetry, crop lifecycle tracking, and AI-guided yield intelligence in one quiet workspace.</p>
            <div class="hb-cta-wrap">
              <button type="button" class="hb-start-btn" data-act="auth-nav" data-view="signin">
                <span>Get Started</span>
                ${ic('chev')}
              </button>
            </div>
          </div>
        </section>

        <footer class="hb-foot">
          <p class="hb-foot-cap">Climate Telemetry · 3D Live Garden · AI Crop Diagnostics</p>
          <p class="hb-foot-brand">Hydrobot AI</p>
        </footer>
      </div>
    </div>
  `;
}

function renderAuthTabs(active) {
  return `
    <div class="hb-auth-tabs" role="tablist" aria-label="Authentication mode">
      <button type="button" role="tab" aria-selected="${active === 'signin' ? 'true' : 'false'}" class="hb-auth-tab ${active === 'signin' ? 'is-active' : ''}" data-act="auth-nav" data-view="signin">Sign in</button>
      <button type="button" role="tab" aria-selected="${active === 'signup' ? 'true' : 'false'}" class="hb-auth-tab ${active === 'signup' ? 'is-active' : ''}" data-act="auth-nav" data-view="signup">Create account</button>
    </div>
  `;
}

function renderSignIn() {
  return `
    <div class="auth-wrapper reveal-on-scroll">
      <div class="hb-auth-header">${hydrobotLogoHtml()}</div>
      <div class="auth-card">
        ${renderAuthTabs('signin')}
        <h2>Welcome back</h2>
        <p>Sign in to access your farm operations and telemetry dashboard.</p>
        ${AuthState.isDemoAuth ? `<div class="notice warn" style="margin-bottom:16px">${ic('info')}<div><b>Local preview mode:</b> Supabase is not configured in this environment.</div></div>` : ''}
        ${AuthState.error ? `<div class="alert-box">${ic('alert')}<div>${esc(AuthState.error)}</div></div>` : ''}
        ${AuthState.successMsg ? `<div class="success-box">${esc(AuthState.successMsg)}</div>` : ''}
        <form id="signInForm">
          <div class="form-group">
            <label for="siEmail">Email address</label>
            <input type="email" id="siEmail" class="form-control" required placeholder="farmer@example.com" autocomplete="email">
          </div>
          <div class="form-group">
            <label for="siPwd">Password</label>
            <div class="pwd-wrap">
              <input type="password" id="siPwd" class="form-control" required placeholder="••••••••" autocomplete="current-password">
              <button type="button" class="pwd-toggle" data-act="toggle-pwd" data-target="siPwd">Show</button>
            </div>
          </div>
          <div class="auth-meta-row">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox"> Remember me</label>
            <a href="#" data-act="auth-nav" data-view="forgot" style="color:var(--accent-ink);font-weight:700;text-decoration:none">Forgot password?</a>
          </div>
          <button type="submit" class="btn-primary" ${AuthState.loading ? 'disabled' : ''}>${AuthState.loading ? '<span class="spinner"></span> Signing in…' : 'Sign in'}</button>
        </form>
        <div class="auth-links">
          Don't have an account? <a href="#" data-act="auth-nav" data-view="signup">Create account</a> · <a href="#" data-act="auth-nav" data-view="welcome">Home</a>
        </div>
      </div>
    </div>
  `;
}

function renderSignUp() {
  return `
    <div class="auth-wrapper reveal-on-scroll">
      <div class="hb-auth-header">${hydrobotLogoHtml()}</div>
      <div class="auth-card">
        ${renderAuthTabs('signup')}
        <h2>Create an account</h2>
        <p>Authorized team members can register with an approved email address.</p>
        ${AuthState.isDemoAuth ? `<div class="alert-box">${ic('alert')}<div>Registration requires an active Supabase configuration. Public sign-up is disabled in local preview mode.</div></div>` : ''}
        ${AuthState.error ? `<div class="alert-box">${ic('alert')}<div>${esc(AuthState.error)}</div></div>` : ''}
        ${AuthState.successMsg ? `<div class="success-box">${esc(AuthState.successMsg)}</div>` : ''}
        <form id="signUpForm">
          <div class="form-group">
            <label for="suName">Full name</label>
            <input type="text" id="suName" class="form-control" required placeholder="Jordan Reyes" autocomplete="name">
          </div>
          <div class="form-group">
            <label for="suEmail">Email address</label>
            <input type="email" id="suEmail" class="form-control" required placeholder="farmer@example.com" autocomplete="email">
          </div>
          <div class="form-group">
            <label for="suPwd">Password</label>
            <div class="pwd-wrap">
              <input type="password" id="suPwd" class="form-control" required placeholder="••••••••" autocomplete="new-password">
              <button type="button" class="pwd-toggle" data-act="toggle-pwd" data-target="suPwd">Show</button>
            </div>
            <ul class="pwd-rules" id="pwdRules">
              <li id="ruleLen">• At least 8 characters</li>
            </ul>
          </div>
          <div class="form-group">
            <label for="suPwdConfirm">Confirm password</label>
            <input type="password" id="suPwdConfirm" class="form-control" required placeholder="••••••••" autocomplete="new-password">
          </div>
          <button type="submit" class="btn-primary" ${AuthState.loading || AuthState.isDemoAuth ? 'disabled' : ''}>${AuthState.loading ? '<span class="spinner"></span> Creating account…' : 'Create account'}</button>
        </form>
        <div class="auth-links">
          Already have an account? <a href="#" data-act="auth-nav" data-view="signin">Sign in</a> · <a href="#" data-act="auth-nav" data-view="welcome">Home</a>
        </div>
      </div>
    </div>
  `;
}

function renderForgot() {
  return `
    <div class="auth-wrapper reveal-on-scroll">
      <div class="hb-auth-header">${hydrobotLogoHtml()}</div>
      <div class="auth-card">
        <h2>Reset password</h2>
        <p>Enter your email and we'll send you a password recovery link.</p>
        ${AuthState.error ? `<div class="alert-box">${ic('alert')}<div>${esc(AuthState.error)}</div></div>` : ''}
        ${AuthState.successMsg ? `<div class="success-box">${esc(AuthState.successMsg)}</div>` : ''}
        <form id="forgotForm">
          <div class="form-group">
            <label for="fgEmail">Email address</label>
            <input type="email" id="fgEmail" class="form-control" required placeholder="farmer@example.com" autocomplete="email">
          </div>
          <button type="submit" class="btn-primary" ${AuthState.loading ? 'disabled' : ''}>${AuthState.loading ? '<span class="spinner"></span> Sending link…' : 'Send reset instructions'}</button>
        </form>
        <div class="auth-links">
          Remembered your password? <a href="#" data-act="auth-nav" data-view="signin">Sign in</a>
        </div>
      </div>
    </div>
  `;
}

function renderVerifyEmail() {
  const st = AuthState.verifyStatus || 'loading';
  return `
    <div class="auth-wrapper reveal-on-scroll">
      <div class="hb-auth-header">${hydrobotLogoHtml()}</div>
      <div class="auth-card" style="text-align:center">
        ${st === 'loading' ? `
          <div style="margin-bottom:14px"><span class="spinner" style="width:36px;height:36px;border-width:3px;color:var(--accent)"></span></div>
          <h2>Verifying your email...</h2>
          <p>Please wait while we confirm your account session.</p>
        ` : st === 'success' ? `
          <div class="hb-verify-badge is-ok" aria-hidden="true">${ic('check')}</div>
          <h2>Email verified successfully</h2>
          <p>Your account is confirmed. Redirecting you to your farm workspace...</p>
        ` : `
          <div class="hb-verify-badge is-err" aria-hidden="true">${ic('alert')}</div>
          <h2>Verification link expired or invalid</h2>
          <div class="alert-box" style="text-align:left;margin-top:12px">${ic('alert')}<div>${esc(AuthState.error || 'The confirmation link has expired or is invalid.')}</div></div>
          ${AuthState.successMsg ? `<div class="success-box" style="text-align:left">${esc(AuthState.successMsg)}</div>` : ''}
          <p style="margin:12px 0 18px">Confirmation links expire after a short window or single use. Enter your registered email to request a new link.</p>
          <form id="resendVerifyForm" style="text-align:left">
            <div class="form-group">
              <label for="rvEmail">Registered email address</label>
              <input type="email" id="rvEmail" class="form-control" required placeholder="farmer@example.com" autocomplete="email">
            </div>
            <button type="submit" class="btn-primary" ${AuthState.loading ? 'disabled' : ''}>${AuthState.loading ? '<span class="spinner"></span> Sending confirmation…' : 'Resend confirmation email'}</button>
          </form>
          <div class="auth-links">
            <a href="#" data-act="auth-nav" data-view="signin">Back to Sign in</a> · <a href="#" data-act="auth-nav" data-view="welcome">Home</a>
          </div>
        `}
      </div>
    </div>
  `;
}

/*
function renderCreateFarmScreen() {
  return `
    <div class="auth-wrapper reveal-on-scroll">
      <div class="hb-auth-header">${hydrobotLogoHtml()}</div>
      <div class="auth-card">
        <h2>Create your farm</h2>
        <p>Set up your greenhouse farm entity to begin managing crops and telemetry.</p>
        ${AuthState.error ? `<div class="alert-box">${ic('alert')}<div>${esc(AuthState.error)}</div></div>` : ''}
        <form id="createFarmForm">
          <div class="form-group">
            <label for="cfName">Farm name</label>
            <input type="text" id="cfName" class="form-control" required placeholder="Riverside Hydro Farm">
          </div>
          <div class="form-group">
            <label for="cfLoc">Location / Sector</label>
            <input type="text" id="cfLoc" class="form-control" required placeholder="Valley Sector A">
          </div>
          <button type="submit" class="btn-primary" ${AuthState.loading ? 'disabled' : ''}>${AuthState.loading ? '<span class="spinner"></span> Creating farm…' : 'Create farm'}</button>
        </form>
      </div>
    </div>
  `;
}

function createFarmModal() {
  openModal({
    title: 'Create a new farm',
    submitLabel: 'Create farm',
    body: `<div class="form-grid">
      ${fld('Farm name', `<input id="mf-name" name="name" required placeholder="Riverside Hydro Farm">`, 'name')}
      ${fld('Location / Sector', `<input id="mf-loc" name="location" required placeholder="Valley Sector A">`, 'location')}
    </div>`,
    validate: d => ({
      name: !String(d.name || '').trim() && 'Enter a farm name.',
      location: !String(d.location || '').trim() && 'Enter a location or sector.',
    }),
    submit: async d => {
      const p_name = String(d.name || '').trim();
      const p_location = String(d.location || '').trim();
      if (sbClient && !AuthState.isDemoAuth) {
        const { data, error } = await sbClient.rpc('create_farm', { p_name, p_location });
        if (error) throw error;
        const createdId = data?.id || data?.farm_id || (Array.isArray(data) ? data[0]?.id || data[0]?.farm_id : null);
        if (createdId) AuthState.currentFarmId = createdId;
        await loadUserFarms();
      } else {
        const id = 'farm-' + Date.now().toString(36);
        AuthState.farms.push({ farmId: id, name: p_name, location: p_location, role: 'owner' });
        AuthState.currentFarmId = id;
        AuthState.role = 'owner';
        ui.farm = id;
      }
      render();
      return `Farm "${p_name}" created.`;
    }
  });
}
*/

function renderAccessDeniedScreen() {
  return `
    <div class="card card-b reveal-on-scroll" style="text-align:center;padding:50px 20px;max-width:600px;margin:40px auto">
      <div style="font-size:3.5rem;margin-bottom:12px">🚫</div>
      <h2>You don't have access</h2>
      <p class="muted" style="margin-top:8px;margin-bottom:24px">Your current role (<b style="text-transform:capitalize">${esc(AuthState.role)}</b>) does not permit viewing financial or sales modules.</p>
      <a href="#dashboard" class="btn primary" style="display:inline-block">Return to Dashboard</a>
    </div>
  `;
}

function renderNav() {
  const groups = {};
  Object.entries(ROUTES).forEach(([k, r]) => {
    if (AuthState.role === 'worker' && ['finance', 'sales'].includes(k)) return;
    if (r.group) (groups[r.group] = groups[r.group] || []).push([k, r]);
  });
  const resolvedRoute = resolveRoute(ui.route);
  const cur = resolvedRoute?.parent || ui.route;
  const ac = Store.mode === 'loading' ? 0 : activeAlerts().filter(a => a.state === 'new').length;
  $('#nav').innerHTML = Object.entries(groups).map(([g, items]) => `<div class="nav-group" role="group" aria-labelledby="ng-${g.replace(/\W/g, '')}"><div class="nav-label" id="ng-${g.replace(/\W/g, '')}">${g}</div>${items.map(([k, r]) => `<a href="#${k}" ${cur === k ? 'aria-current="page"' : ''}>${ic(r.icon)}<span>${r.label}</span>${k === 'alerts' && ac ? `<span class="count" aria-label="${ac} new alerts">${ac}</span>` : ''}</a>`).join('')}</div>`).join('');
  const userName = AuthState.profile?.full_name || AuthState.user?.user_metadata?.full_name || AuthState.user?.email || 'User';
  $('#sideFoot').innerHTML = `
    <div class="row"><b>${esc(userName)}</b> <span class="tag" style="text-transform:capitalize">${esc(AuthState.role)}</span></div>
    <div class="row"><span class="dot" style="background:var(--ok)"></span>Connected</div>
    <button class="btn" data-act="auth-signout" style="width:100%;margin-top:4px;font-size:.78rem;padding:5px">Sign out</button>
  `;
}

function renderTop() {
  $('#menuBtn').innerHTML = ic('menu');
  const n = Store.mode === 'loading' ? 0 : activeAlerts().filter(a => a.state === 'new').length;
  if ($('#bellBtn')) {
    $('#bellBtn').innerHTML = ic('bell') + (n ? `<span class="badge-count" aria-hidden="true">${n}</span>` : '');
    $('#bellBtn').setAttribute('aria-label', `Notifications, ${n} new`);
  }
  const u = currentUser();
  if ($('#profileBtn')) {
    $('#profileBtn').innerHTML = `<span class="avatar">${esc(u.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase())}</span><span class="who"><b>${esc(u.name)}</b><span>${esc(u.role)}</span></span>`;
  }
  /*
  if ($('#farmSel')) {
    if (!AuthState.isDemoAuth && AuthState.farms.length) {
      $('#farmSel').innerHTML = AuthState.farms.map(f => `<option value="${esc(f.farmId)}" ${f.farmId === AuthState.currentFarmId ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
      $('#farmSel').value = AuthState.currentFarmId;
    } else {
      $('#farmSel').value = ui.farm;
    }
  }
  */
  if ($('#mobileUtilBtn')) {
    $('#mobileUtilBtn').innerHTML = ic('grid') + (n ? `<span class="badge-count" aria-hidden="true">${n}</span>` : '');
    $('#mobileUtilBtn').setAttribute('aria-label', `Quick utilities and menu${n ? `, ${n} new alerts` : ''}`);
  }
  syncDataModeUI();
  updateThemeUI();
}

function dataModeToggleHtml(cls = '') {
  const live = isLiveMode();
  return `<div class="data-mode-toggle ${cls}" role="group" aria-label="Data mode">
    <button type="button" class="dm-btn" data-data-mode="simulated" aria-pressed="${!live}"><span class="dm-dot sim" aria-hidden="true"></span><span>Simulated Data</span></button>
    <button type="button" class="dm-btn" data-data-mode="live" aria-pressed="${live}"><span class="dm-dot live" aria-hidden="true"></span><span>Live Data</span></button>
  </div>`;
}

function syncDataModeUI() {
  const live = isLiveMode();
  $$('[data-data-mode]').forEach(btn => {
    const active = (btn.dataset.dataMode === 'live') === live;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function setDataMode(mode) {
  if (!window.HydrobotData) return;
  const changed = window.HydrobotData.setMode(mode);
  if (!changed) return;
  if (window.HydrobotData.isSimulated()) {
    restoreSimulatedCurrent();
  }
  const ghs = greenhouses();
  if (ghs.length && !ghById(ui.nutGh)) {
    ui.nutGh = ghs[0].id;
  }
  if (SYNC_CHANNEL) {
    SYNC_CHANNEL.postMessage({ type: 'mode_changed', mode });
  }
  if (window.HydrobotData.isLive() && Store.mode === 'backend') {
    Store.syncIncremental();
  }
  window.LiveGardenUI?.syncDataMode?.();
  syncDataModeUI();
  const pop = $('#mobileUtilPop');
  if (pop && !pop.hidden) pop.innerHTML = mobileUtilHtml();
  render();
  toast(window.HydrobotData.isLive()
    ? 'Live Data mode active. Waiting for sensor or manual inputs.'
    : 'Simulated Data mode restored.');
}

function render() {
  const view = $('#view');
  const isSignedOut = !AuthState.session || AuthState.authView === 'reset' || AuthState.authView === 'verify';
  const isLandingWelcome = !AuthState.session && AuthState.authView === 'welcome';

  document.body.classList.toggle('hb-landing-mode', isLandingWelcome);
  view.classList.toggle('is-landing', isLandingWelcome);

  if (isSignedOut) {
    window.LiveGardenUI?.dispose();
    if ($('#sidebar')) $('#sidebar').style.display = 'none';
    if ($('.topbar')) $('.topbar').style.display = 'none';
    if ($('.main')) $('.main').style.marginLeft = '0';
    view.style.marginInline = isLandingWelcome ? '' : 'auto';
    view.innerHTML = renderAuthScreen();
    initScrollAnimations();
    return;
  } else {
    if ($('#sidebar')) $('#sidebar').style.display = 'flex';
    if ($('.topbar')) $('.topbar').style.display = 'flex';
    if ($('.main')) $('.main').style.marginLeft = '';
    view.style.marginInline = '';
  }

  if (AuthState.authView === 'create_farm' && AuthState.farms.length === 0) {
    window.LiveGardenUI?.dispose();
    view.innerHTML = renderCreateFarmScreen();
    initScrollAnimations();
    return;
  }

  if (AuthState.role === 'worker' && ['finance', 'sales'].includes(ui.route)) {
    window.LiveGardenUI?.dispose();
    view.innerHTML = renderAccessDeniedScreen();
    initScrollAnimations();
    return;
  }

  if (ui.route === 'garden' && ui.farm !== 'hilltop' && Store.mode !== 'loading' && window.LiveGardenUI?.isActive()) {
    renderNav();
    renderTop();
    window.LiveGardenUI.updateInPlace();
    return;
  }

  if (ui.route !== 'garden' || ui.farm === 'hilltop' || Store.mode === 'loading') {
    window.LiveGardenUI?.dispose();
  }

  const fa = document.activeElement, fid = fa && fa.id, sel = fa && 'selectionStart' in fa ? [fa.selectionStart, fa.selectionEnd] : null;
  charts.forEach(c => c.destroy()); charts = [];
  renderNav(); renderTop();
  if (Store.mode === 'loading') { view.innerHTML = loadingView(); return; }
  const r = resolveRoute(ui.route) || ROUTES.dashboard;
  let html;
  if (ui.farm === 'hilltop') html = vEmptyFarm();
  else { try { html = r.view(); } catch (e) { console.error(e); html = `<div class="card card-b"><div class="notice crit">${ic('alert')}<div><b>This page could not be displayed.</b> ${esc(e.message)}. Try another page, then come back.</div></div></div>`; } }
  const bannerErr = Store.error || Store.syncError;
  const errBanner = bannerErr ? `<div class="notice warn" role="alert">${ic('alert')}<div style="flex:1">${esc(bannerErr)}</div><button type="button" class="btn sm" data-act="store-retry">Retry sync</button></div>` : '';
  view.innerHTML = errBanner + html;
  postRender.forEach(f => { try { f(); } catch (e) { console.error(e); } }); postRender = [];
  initScrollAnimations();
  if (fid) { const el = document.getElementById(fid); if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); if (sel && 'setSelectionRange' in el) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
}
let postRender = [];
const after = f => postRender.push(f);
function loadingView() {
  return `<div class="page-head"><div><h1>Loading farm records…</h1><p>Connecting to the farm database.</p></div></div><div class="card card-b loading-screen" aria-busy="true">${'<div class="skeleton"></div>'.repeat(6)}</div>`;
}
function vEmptyFarm() {
  return `<div class="page-head"><div><h1>${esc(activeFarmName())}</h1><p>No greenhouses have been set up for this farm yet.</p></div></div>
  <div class="card"><div class="empty"><span class="chip-ico">${ic('house')}</span><b>Nothing to show for ${esc(activeFarmName())}</b><p>Create a greenhouse or switch back to your primary workspace.</p><div class="toolbar"><button class="btn primary" data-act="farm-main">Return to primary farm</button>${can('targets') ? `<button class="btn" data-act="gh-new">${ic('plus')}Add greenhouse</button>` : ''}</div></div></div>`;
}
function go(route) { if (location.hash !== '#' + route) location.hash = route; else { ui.route = route; render(); } }
function route() {
  const h = location.hash.replace('#', '');
  ui.route = resolveRoute(h) ? h : 'dashboard';
  closeNav(); render(); window.scrollTo(0, 0);
  const v = $('#view'); if (v && document.activeElement && document.activeElement.closest('.nav')) v.focus({ preventScroll: true });
}
const pageHead = (title, sub, actions = '', crumb = '') => `<div class="page-head"><div>${crumb}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="toolbar">${actions}</div></div>`;
const card = (title, body, { sub = '', actions = '', cls = '', id = '' } = {}) => `<section class="card ${cls}" ${id ? `id="${id}"` : ''} aria-label="${esc(title.replace(/<[^>]+>/g, ''))}"><div class="card-h"><div><h2>${title}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${actions ? `<div class="toolbar">${actions}</div>` : ''}</div><div class="card-b">${body}</div></section>`;
const empty = (icon, title, text, action = '') => `<div class="empty"><span class="chip-ico">${ic(icon)}</span><b>${title}</b><p>${text}</p>${action}</div>`;
const seg = (name, options, value, label) => `<div class="seg" role="group" aria-label="${label}">${options.map(([v, l]) => `<button type="button" data-seg="${name}" data-val="${v}" aria-pressed="${String(v) === String(value)}">${l}</button>`).join('')}</div>`;
const SIM_TAG = '<span class="tag sim">' + ic('spark') + 'Simulated AI · rule-based demo</span>';
const DEMO_TAG = '<span class="tag demo">Demo sensor data</span>';
const dataModeTag = () => isLiveMode() ? '<span class="tag live">Live Data · sensors &amp; manual logs</span>' : DEMO_TAG;
const aiModeTag = () => isLiveMode() ? '<span class="tag live">' + ic('spark') + 'Live Data · rule-based engine</span>' : SIM_TAG;
const noPerm = what => `<div class="notice">${ic('info')}<div>${what} is not available for the <b>${esc(ui.role)}</b> role. Switch roles from your profile menu to try it.</div></div>`;

/* ================= Charts ================= */
function chartTheme() { return { text: cssVar('--muted'), grid: cssVar('--line-2'), fg: cssVar('--fg') }; }
function makeChart(id, config) {
  after(() => {
    const el = document.getElementById(id); if (!el) return;
    if (!window.Chart) { el.parentElement.innerHTML = '<div class="chart-fallback">Charts could not load. Check your connection and reload.</div>'; return; }
    const th = chartTheme();
    Chart.defaults.font.family = cssVar('--font') || 'system-ui'; Chart.defaults.color = th.text;
    const o = config.options = config.options || {};
    o.responsive = true; o.maintainAspectRatio = false; o.animation = matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 300 };
    o.plugins = Object.assign({ legend: { labels: { boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 3, color: th.text } }, tooltip: { mode: 'index', intersect: false } }, o.plugins || {});
    o.scales = o.scales || {};
    Object.values(o.scales).forEach(s => { s.grid = Object.assign({ color: th.grid, drawTicks: false }, s.grid || {}); s.border = { display: false }; s.ticks = Object.assign({ color: th.text, padding: 6 }, s.ticks || {}); });
    charts.push(new Chart(el, config));
  });
  return `<canvas id="${id}" role="img" aria-label="${esc(config.aria || 'Chart')}"></canvas>`;
}
const col = v => cssVar(v);
function weekKey(s) { const d = parseD(s); const day = (d.getDay() + 6) % 7; return iso(d.getTime() - day * DAY); }

/* ================= Dashboard ================= */
function vDashboard() {
  const k = kpis(), al = activeAlerts(), live = isLiveMode(), ghs = greenhouses();
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const todayTasks = tasks().filter(t => t.due === dOff(0) || isOverdue(t)).sort((a, b) => (a.status === 'Done') - (b.status === 'Done') || (b.due < a.due) - (a.due < b.due) || a.time.localeCompare(b.time));
  const dueToday = k.open.filter(t => t.due === dOff(0)).length, overdue = k.open.filter(isOverdue).length;
  const connectedGhs = live ? ghs.filter(g => readings(g.id) !== null).length : ghs.length;
  const k6 = live ? [
    ['sprout', 'Total plants', k.batches ? num(k.plants) : '0', k.batches ? `${k.batches} active crop batches` : 'No batches added yet'],
    ['house', 'Active greenhouses', `${k.gOn}<span class="muted" style="font-size:1rem"> / ${ghs.length}</span>`, ghs.length === 0 ? 'No greenhouses configured yet' : connectedGhs ? `${connectedGhs} reporting live data` : 'Waiting for sensor data'],
    ['leaf', 'Average plant health', k.plants ? `${num(k.health, 1)}<span class="muted" style="font-size:1rem">%</span>` : '—', k.plants ? 'Weighted by plant count' : 'No data available yet'],
    ['wallet', 'Projected harvest revenue', k.f30kg ? money(k.rev) : '—', k.f30kg ? `<span class="tag proj">Projection</span> next 30 days, ${num(k.f30kg)} kg` : 'No forecast data yet'],
    ['clipboard', 'Open tasks', num(k.open.length), k.open.length ? `${dueToday} due today${overdue ? ` · <span class="overdue">${overdue} overdue</span>` : ''}` : 'No tasks scheduled yet'],
    ['basket', 'Crops ready to harvest', num(k.ready.length), k.ready.length ? 'Batches ready within 7 days' : 'No harvests ready yet'],
  ] : [
    ['sprout', 'Total plants', num(k.plants), `${k.batches} active crop batches`],
    ['house', 'Active greenhouses', `${k.gOn}<span class="muted" style="font-size:1rem"> / ${ghs.length}</span>`, ghs.length ? 'Sensor feeds are demo data' : 'No greenhouses configured'],
    ['leaf', 'Average plant health', k.plants ? `${num(k.health, 1)}<span class="muted" style="font-size:1rem">%</span>` : '—', k.plants ? 'Weighted by plant count' : 'No active crops'],
    ['wallet', 'Projected harvest revenue', k.f30kg ? money(k.rev) : '—', `<span class="tag proj">Projection</span> next 30 days, ${num(k.f30kg)} kg`],
    ['clipboard', 'Open tasks', num(k.open.length), `${dueToday} due today${overdue ? ` · <span class="overdue">${overdue} overdue</span>` : ''}`],
    ['basket', 'Crops ready to harvest', num(k.ready.length), 'Batches ready within 7 days'],
  ];
  const pipe = activeBatches().sort((a, b) => a.expectedHarvest.localeCompare(b.expectedHarvest)).slice(0, 6);
  const ghBody = ghs.length
    ? `<div class="gh-grid">${ghs.map(g => ghCard(g, { secondary: true })).join('')}</div>`
    : empty('house', 'No greenhouses configured yet', 'Add a greenhouse to start tracking environmental telemetry, crop zones, and alerts.', can('targets') ? `<button class="btn primary" data-act="gh-new">${ic('plus')}Add greenhouse</button>` : '');
  const ghCardActions = `${dataModeTag()}${can('targets') ? `<button class="btn sm" data-act="gh-new">${ic('plus')}Add</button>` : ''}`;
  const trendActions = `${live ? `<button class="btn sm" data-act="resource-new">${ic('edit')}Log meters</button>` : ''}${seg('trendRange', [[7, '7 days'], [30, '30 days'], [90, '90 days']], ui.trendRange, 'Date range')}`;
  return `
  ${pageHead('Dashboard', `${greeting}, ${esc(currentUser().name.split(' ')[0])} · ${esc(activeFarmName())} · ${fmtDL(dOff(0))}`, `${dataModeToggleHtml('mobile-data-mode')}${dataModeTag()}<a class="btn" href="#alerts">${ic('bell')}Alerts (${al.length})</a>${can('tasks') ? `<button class="btn primary" data-act="task-new">${ic('plus')}New task</button>` : ''}`)}
  <section class="kpis" aria-label="Farm summary">${k6.map(([i, l, v, s]) => `<div class="card kpi"><div class="kpi-top"><span class="chip-ico">${ic(i)}</span>${l}</div><div class="kpi-val">${v}</div><div class="kpi-sub">${s}</div></div>`).join('')}</section>
  <div class="grid g-main dash-overview-grid">
    ${card('Greenhouse status', ghBody, { sub: live ? 'Select a greenhouse to connect sensors or log manual readings' : 'Select a greenhouse to open its monitoring page', actions: ghCardActions, cls: 'dash-gh-card' })}
    <div class="dash-alerts-slot">
      ${card('Smart alerts', alertFeed(al), { sub: `${al.filter(a => a.sev === 'crit').length} critical · ${al.filter(a => a.sev === 'warn').length} attention`, actions: '<a class="btn sm" href="#alerts">View all</a>', cls: 'dash-alerts-card' })}
    </div>
  </div>
  <div class="grid g-2">
    ${card('Harvest pipeline', pipelineTable(pipe), { sub: 'Next harvest per active batch', actions: '<a class="btn sm" href="#harvest">Harvest calendar</a>' })}
    ${card("Today's tasks", taskList(todayTasks.slice(0, 7)), { sub: `${todayTasks.filter(t => t.status === 'Done').length} of ${todayTasks.length} complete`, actions: '<a class="btn sm" href="#tasks">All tasks</a>' })}
  </div>
  ${card('Performance trends', trendCharts(), { sub: live ? 'Live harvest records and water/energy meter feeds' : 'Yield from harvest records; water and energy are demo meter data', actions: trendActions })}
  `;
}

function ghCard(g, opts = {}) {
  const st = ghStatus(g.id), r = readings(g.id), t = targets(g.id), live = isLiveMode(), meta = readingMeta(g.id);
  const m = (k, short, extraCritCls = '') => {
    const s = sensorDef(k);
    const val = r?.[k];
    const hasVal = val !== null && val !== undefined && Number.isFinite(Number(val));
    const ms = hasVal && t?.[k] ? metricStatus(val, t[k]) : 'ok';
    const boxCls = ms === 'crit' && extraCritCls ? ` ${extraCritCls}` : '';
    const unitHtml = s.unit ? `<span class="muted metric-unit">${s.unit}</span>` : '';
    return `<div class="metric${boxCls}"><small>${ic(s.icon)}${short}</small><b class="${ms === 'ok' ? '' : ms}">${hasVal ? `${num(val, s.dec)}${unitHtml ? ` ${unitHtml}` : ''}` : '<span class="muted">—</span>'}</b></div>`;
  };
  const crops = ghCrops(g.id);
  const secondaryRow = opts.secondary
    ? `<div class="metrics metrics-sub" aria-label="Water and nutrient telemetry">${m('res', 'Reservoir', 'metric-crit')}${m('ec', 'EC')}${m('ph', 'pH')}</div>`
    : '';
  const footRight = !live
    ? (READ_AT[g.id] != null ? `Demo reading · ${READ_AT[g.id]} min ago` : meta?.lastAt ? `Manual reading · ${ageText(meta.ageMin || 1)}` : 'Demo · ready')
    : !meta
      ? 'Waiting for sensor data'
      : `${meta.source === 'manual' ? 'Manual reading' : meta.source === 'hybrid' ? 'Sensor + manual' : 'Live sensor'} · ${ageText(meta.ageMin || 1)}`;
  const zCount = Array.isArray(g.zones) ? g.zones.length : 0;
  return `<a class="gh-card st-${st}" href="#${esc(g.id)}" aria-label="${esc(g.name)}: ${ST_LABEL[st] || 'No data'}. Open monitoring page">
    <div class="gh-top"><div><b>${esc(g.name)}</b><div class="muted">${esc(crops.join(', ') || 'No active crop')}</div></div>${badge(st)}</div>
    <div class="metrics">${m('temp', 'Temp')}${m('hum', 'Humidity')}${m('co2', 'CO₂')}<div class="metric"><small>${ic('sprout')}Plants</small><b>${num(ghPlants(g.id))}</b></div></div>
    ${secondaryRow}
    <div class="gh-foot"><span>${esc(g.system)} · ${zCount} zone${zCount === 1 ? '' : 's'}</span><span>${footRight}</span></div></a>`;
}
function alertFeed(list, full = false) {
  if (!list.length) {
    return isLiveMode()
      ? empty('check', 'No active alerts', 'Waiting for live sensor data, crop observations, stock alerts, or task warnings.')
      : empty('check', 'No active alerts', 'Every greenhouse, inventory item and task is within its targets.');
  }
  return `<div class="alerts">${list.map(a => `<div class="alert ${a.sev} ${a.state === 'acknowledged' ? 'acked' : ''}">
    <span class="sev-ico">${ic(a.icon)}</span>
    <div style="min-width:0"><b>${esc(a.title)}</b><p>${esc(a.detail)}</p>
      <div class="alert-meta">${badge(a.sev)}<span class="tag">${a.kind}</span><span class="small muted">${ageText(a.age)}</span>${a.state === 'acknowledged' ? `<span class="small muted">Acknowledged${a.stateBy ? ' by ' + esc(a.stateBy) : ''}</span>` : ''}</div>
      ${full ? `<div class="toolbar" style="margin-top:8px">${a.link ? `<a class="btn sm" href="${a.link}">${a.linkLabel}</a>` : ''}${a.action ? `<button class="btn sm" data-act="${a.action.act}" data-id="${a.action.id}">${a.action.label}</button>` : ''}${a.state === 'new' ? `<button class="btn sm" data-act="alert-ack" data-id="${a.id}">Acknowledge</button>` : ''}${a.state !== 'resolved' ? `<button class="btn sm" data-act="alert-resolve" data-id="${a.id}">Mark resolved</button>` : `<button class="btn sm" data-act="alert-reopen" data-id="${a.id}">Reopen</button>`}</div>` : ''}
    </div>
    ${!full ? (a.link ? `<a class="btn sm ghost" href="${a.link}" aria-label="${a.linkLabel}">${ic('chev')}</a>` : a.action ? `<button class="btn sm ghost" data-act="${a.action.act}" data-id="${a.action.id}" aria-label="${a.action.label}">${ic('chev')}</button>` : '') : ''}
  </div>`).join('')}</div>`;
}
function pipelineTable(list, actions = false) {
  if (!list.length) return empty('basket', 'No upcoming harvests', 'Add a crop batch to see it in the pipeline.');
  return `<div class="tbl-wrap"><table><thead><tr><th>Crop</th><th>Greenhouse</th><th class="r">Est. qty</th><th>Readiness</th><th>Scheduled</th>${actions ? '<th><span class="sr">Actions</span></th>' : ''}</tr></thead><tbody>${list.map(b => {
    const rd = readiness(b), d = daysFrom(b.expectedHarvest);
    return `<tr class="click" data-act="batch" data-id="${esc(b.id)}" tabindex="0"><td><b>${esc(cropDef(b.crop).label)}</b><div class="small muted">${esc(b.id)} · zone ${esc(b.zone)}</div></td><td>${esc(ghName(b.ghId))}</td><td class="r num">${num(b.estKg)} kg</td><td><div class="ready"><div class="bar" style="flex:1"><i style="width:${rd}%" class="${rd < 60 ? 'warn' : ''}"></i></div><span>${rd}%</span></div></td><td class="num">${fmtD(b.expectedHarvest)}<div class="small ${d < 0 ? 'overdue' : 'muted'}">${d === 0 ? 'Today' : d < 0 ? `${-d} d late` : `in ${d} d`}</div></td>${actions ? `<td class="r">${can('harvest') ? `<button class="btn sm" data-act="harvest-record" data-id="${esc(b.id)}">Record</button>` : ''}</td>` : ''}</tr>`;
  }).join('')}</tbody></table></div>`;
}
function taskList(list) {
  if (!list.length) return empty('clipboard', 'No tasks match', can('tasks') ? 'Create a task to assign work to your team.' : 'Nothing assigned right now.', can('tasks') ? `<button class="btn primary" data-act="task-new">${ic('plus')}New task</button>` : '');
  return `<div>${list.map(t => {
    const od = isOverdue(t), done = t.status === 'Done';
    return `<div class="task ${done ? 'done' : ''}">
      <button class="check" data-act="task-toggle" data-id="${esc(t.id)}" aria-pressed="${done}" aria-label="${done ? 'Mark as not done' : 'Mark as done'}: ${esc(t.title)}">${ic('check')}</button>
      <div style="min-width:0"><button class="t-title" data-act="task-edit" data-id="${esc(t.id)}" style="all:unset;cursor:pointer;font-weight:700">${esc(t.title)}</button>
        <div class="t-meta"><span>${ic('user', 'small')}${esc(t.assignee)}</span><span>${esc(t.ghId ? ghName(t.ghId) : '')}</span>${t.recurrence !== 'none' ? `<span>${ic('repeat')}${esc(t.recurrence)}</span>` : ''}${t.photo ? `<span>${ic('camera')}photo</span>` : ''}</div></div>
      <div class="t-right"><span class="pri pri-${t.priority}">${esc(t.priority)}</span><span class="num ${od ? 'overdue' : 'muted'}">${od ? 'Overdue · ' : ''}${t.due !== dOff(0) ? fmtD(t.due) + ', ' : ''}${fmtT(t.time)}</span>${done ? '<span class="badge b-ok">Done</span>' : ''}</div></div>`;
  }).join('')}</div>`.replace(/<svg class="ico small"/g, '<svg class="ico" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"');
}
function trendCharts() {
  const days = ui.trendRange, from = dOff(-days + 1), live = isLiveMode();
  const hs = harvests().filter(h => h.date >= from);
  const byWeek = days > 7;
  const keys = []; for (let d = -days + 1; d <= 0; d++) { const k = byWeek ? weekKey(dOff(d)) : dOff(d); if (!keys.includes(k)) keys.push(k); }
  const cropsObj = cropsMap();
  const crops = Object.keys(cropsObj);
  const ds = crops.map(c => ({ label: cropsObj[c].label, data: keys.map(k => hs.filter(h => h.crop === c && (byWeek ? weekKey(h.date) : h.date) === k).reduce((s, h) => s + Number(h.actualKg), 0)), backgroundColor: col(cropColorVar(c)), borderRadius: 4, stack: 'y' }));
  const total = hs.reduce((s, h) => s + Number(h.actualKg), 0);
  const res = resourceSeriesForMode(days);
  const water = res.reduce((s, r) => s + Number(r.water), 0), kwh = res.reduce((s, r) => s + Number(r.energy), 0);
  const yieldSub = live && !hs.length
    ? 'No harvest data yet'
    : `${num(total)} kg in ${days} days${water > 0 ? ` · ${num(total / (water / 1000), 1)} kg per m³ water` : ''}`;
  const yieldBody = live && !hs.length
    ? empty('basket', 'No harvest data available yet', 'Recorded harvests in Live Data mode will appear here.')
    : `<div class="chart-box">${makeChart('cYield', { type: 'bar', aria: `Harvested yield by ${byWeek ? 'week' : 'day'} and crop, ${num(total)} kg total`, data: { labels: keys.map(k => byWeek ? 'Wk ' + fmtD(k) : fmtD(k)), datasets: ds }, options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, title: { display: true, text: 'kg' } } } } })}</div>`;
  const resSub = live && !res.length
    ? 'Waiting for meter data'
    : `${num(water / 1000, 1)} m³ water · ${num(kwh)} kWh ${live ? '<span class="tag live">Live meters</span>' : '<span class="tag demo">Demo meters</span>'}`;
  const resBody = live && !res.length
    ? empty('gauge', 'Waiting for sensor data', 'Connect water flow and energy meters or log daily meter readings.', `<button class="btn primary" data-act="resource-new">${ic('edit')}Log meter reading</button>`)
    : `<div class="chart-box">${makeChart('cRes', { type: 'line', aria: 'Daily water and energy use', data: { labels: res.map(r => fmtD(r.date)), datasets: [
        { label: 'Water (L/day)', data: res.map(r => r.water), borderColor: col('--c5'), backgroundColor: col('--c5') + '22', fill: true, tension: .35, pointRadius: 0, yAxisID: 'y', borderWidth: 2 },
        { label: 'Energy (kWh/day)', data: res.map(r => r.energy), borderColor: col('--c2'), tension: .35, pointRadius: 0, yAxisID: 'y1', borderWidth: 2 }] },
        options: { interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }, y: { title: { display: true, text: 'Litres' } }, y1: { position: 'right', grid: { display: false }, title: { display: true, text: 'kWh' } } } } })}</div>`;
  return `<div class="grid g-2">
    <div><div class="split" style="justify-content:space-between;margin-bottom:8px"><h3>Harvested yield</h3><span class="small muted num">${yieldSub}</span></div>${yieldBody}</div>
    <div><div class="split" style="justify-content:space-between;margin-bottom:8px"><h3>Resource use</h3><span class="small muted num">${resSub}</span></div>${resBody}</div>
  </div>`;
}
function resourceForm(prefillDate = '') {
  const existing = window.HydrobotData ? window.HydrobotData.getLiveResourceSeries(90).slice().reverse() : [];
  const targetPt = prefillDate ? existing.find(p => p.date === prefillDate) : null;
  openModal({
    title: 'Water & energy meter log', submitLabel: 'Save meter log', wide: true,
    body: `<p class="muted">Record daily total water consumption (L) and energy usage (kWh) for Live Data performance trends.</p>
      <div class="form-grid" style="margin-bottom:14px">
        ${fld('Date', `<input id="rs-date" name="date" type="date" value="${esc(targetPt?.date || dOff(0))}" max="${dOff(0)}">`, 'date')}
        ${fld('Water used (L)', `<input id="rs-water" name="water" type="number" min="0" step="0.1" inputmode="decimal" value="${targetPt ? esc(targetPt.water) : ''}" placeholder="e.g. 5200">`, 'water')}
        ${fld('Energy used (kWh)', `<input id="rs-energy" name="energy" type="number" min="0" step="0.1" inputmode="decimal" value="${targetPt ? esc(targetPt.energy) : ''}" placeholder="e.g. 410">`, 'energy')}
      </div>
      ${existing.length ? `<h3 style="margin:12px 0 6px">Recorded days</h3><div class="tbl-wrap" style="max-height:200px;overflow:auto"><table><thead><tr><th>Date</th><th class="r">Water</th><th class="r">Energy</th><th></th></tr></thead><tbody>${existing.slice(0, 14).map(p => `<tr><td class="num">${fmtD(p.date)}</td><td class="r num">${num(p.water)} L</td><td class="r num">${num(p.energy)} kWh</td><td class="r"><button type="button" class="btn sm ghost" data-act="resource-pick" data-date="${esc(p.date)}" data-water="${p.water}" data-energy="${p.energy}">${ic('edit')}</button><button type="button" class="btn sm ghost" data-act="resource-delete" data-id="${esc(p.date)}" aria-label="Delete ${esc(p.date)}">${ic('trash')}</button></td></tr>`).join('')}</tbody></table></div>` : ''}`,
    onOpen: m => {
      m.addEventListener('click', async ev => {
        const pick = ev.target.closest('[data-act="resource-pick"]');
        if (pick) {
          $('#rs-date', m).value = pick.dataset.date;
          $('#rs-water', m).value = pick.dataset.water;
          $('#rs-energy', m).value = pick.dataset.energy;
          return;
        }
        const del = ev.target.closest('[data-act="resource-delete"]');
        if (del) {
          await Store.saveResourcePoint('delete', { date: del.dataset.id });
          toast(`Removed meter log for ${del.dataset.id}.`);
          resourceForm();
        }
      });
    },
    validate: d => ({
      date: !d.date ? 'Choose a date.' : d.date > dOff(0) && 'Date cannot be in the future.',
      water: !(d.water !== '' && Number(d.water) >= 0) && 'Enter water usage in litres (0 or more).',
      energy: !(d.energy !== '' && Number(d.energy) >= 0) && 'Enter energy usage in kWh (0 or more).',
    }),
    submit: async d => {
      await Store.saveResourcePoint('upsert', { date: d.date, water: +d.water, energy: +d.energy });
      return `Meter log saved for ${fmtD(d.date)}.`;
    }
  });
}

/* ================= Plant Management ================= */
function vPlants() {
  const f = ui.plantF, q = f.q.toLowerCase(), ghs = greenhouses();
  const allBatches = batches();
  const list = allBatches.filter(b => (!f.gh || b.ghId === f.gh) && (!f.stage || b.stage === f.stage) && (!q || `${b.id} ${b.crop} ${cropDef(b.crop).label} ${b.variety} ${b.zone}`.toLowerCase().includes(q))).sort((a, b) => (a.stage === 'Harvested') - (b.stage === 'Harvested') || a.expectedHarvest.localeCompare(b.expectedHarvest));
  const k = kpis();
  const actions = can('batches') ? `<button class="btn" data-act="crop-manage">${ic('sprout')}Manage crops</button><button class="btn primary" data-act="batch-new">${ic('plus')}Add crop batch</button>` : '';
  return `${pageHead('Plant Management', 'Crop batches, greenhouse zones, growth stages and health observations.', actions)}
  <div class="stats">${[['Active batches', k.batches], ['Plants growing', num(k.plants)], ['Average health', k.plants ? num(k.health, 1) + '%' : '—'], ['Harvested batches', allBatches.length - k.batches]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${card('Crop batches', `
    <div class="toolbar" style="margin-bottom:12px">
      <label class="sr" for="pf-q">Search batches</label><input id="pf-q" class="input grow" type="search" placeholder="Search by batch, crop, variety or zone" value="${esc(f.q)}" data-filter="plantF.q">
      <label class="sr" for="pf-gh">Greenhouse</label><select id="pf-gh" class="select" data-filter="plantF.gh"><option value="">All greenhouses</option>${ghs.map(g => `<option value="${esc(g.id)}" ${f.gh === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>
      <label class="sr" for="pf-st">Growth stage</label><select id="pf-st" class="select" data-filter="plantF.stage"><option value="">All stages</option>${STAGES.map(s => `<option ${f.stage === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    </div>
    ${list.length ? `<div class="tbl-wrap"><table><thead><tr><th>Batch</th><th>Crop</th><th>Location</th><th class="r">Plants</th><th>Planted</th><th>Stage</th><th>Health</th><th>Expected harvest</th></tr></thead><tbody>${list.map(b => `
      <tr class="click" data-act="batch" data-id="${esc(b.id)}" tabindex="0"><td><b class="mono">${esc(b.id)}</b></td><td><b>${esc(cropDef(b.crop).label)}</b><div class="small muted">${esc(b.variety)}</div></td><td>${esc(ghName(b.ghId))}<div class="small muted">Zone ${esc(b.zone)}</div></td><td class="r num">${num(b.plants)}</td><td class="num">${fmtD(b.plantedOn)}</td><td><span class="badge ${b.stage === 'Ready' ? 'b-ok' : b.stage === 'Harvested' ? 'b-mute' : 'b-info'}">${esc(b.stage)}</span></td><td>${healthCell(b.health)}</td><td class="num">${b.stage === 'Harvested' ? '—' : fmtD(b.expectedHarvest)}</td></tr>`).join('')}</tbody></table></div>`
      : allBatches.length
        ? empty('sprout', 'No batches match these filters', 'Clear the search or choose a different greenhouse or stage.', `<button class="btn" data-act="clear-plant-filters">Clear filters</button>`)
        : empty('sprout', 'No crop batches yet', 'Add your first crop batch in Live Data mode to begin tracking growth and yields.', can('batches') ? `<button class="btn primary" data-act="batch-new">${ic('plus')}Add crop batch</button>` : '')}
  `, { sub: `${list.length} of ${allBatches.length} batches` })}`;
}
const healthSt = h => h >= 85 ? 'ok' : h >= 70 ? 'warn' : 'crit';
const healthCell = h => `<div class="ready"><div class="bar" style="width:70px"><i class="${healthSt(h) === 'ok' ? '' : healthSt(h)}" style="width:${h}%"></i></div><span>${h}%</span></div>`;

function batchDetail(id) {
  const b = Store.get('batches', id); if (!b) return toast('That batch no longer exists.', 'error');
  const c = cropDef(b.crop), hs = harvests().filter(h => h.batchId === b.id);
  const obs = [...(b.observations || [])].sort((a, c) => c.date.localeCompare(a.date));
  openModal({ title: `${b.id} · ${c.label}`, wide: true, submitLabel: null, body: `
    <div class="split">${badge(healthSt(b.health))}<span class="badge b-info">${esc(b.stage)}</span><span class="tag">${esc(ghName(b.ghId))}, zone ${esc(b.zone)}</span>${b.demo ? '<span class="tag demo">Sample record</span>' : ''}</div>
    <div class="grid g-2" style="gap:16px">
      <dl class="kv"><dt>Variety</dt><dd>${esc(b.variety)}</dd><dt>Plants</dt><dd class="num">${num(b.plants)}</dd><dt>Planted</dt><dd>${fmtDL(b.plantedOn)}</dd><dt>Expected harvest</dt><dd>${fmtDL(b.expectedHarvest)} (${daysFrom(b.expectedHarvest) >= 0 ? 'in ' + daysFrom(b.expectedHarvest) + ' d' : -daysFrom(b.expectedHarvest) + ' d ago'})</dd><dt>Estimated yield</dt><dd class="num">${num(b.estKg)} kg${c.continuous ? ' per weekly pick' : ''}</dd><dt>Projected value</dt><dd class="num">${money(b.estKg * (Number(c.price) || 0))} <span class="tag proj">Projection</span></dd></dl>
      <div><h3 style="margin-bottom:8px">Readiness</h3><div class="ready"><div class="bar" style="flex:1;height:10px"><i style="width:${readiness(b)}%"></i></div><span>${readiness(b)}%</span></div>
      <p class="small muted" style="margin-top:8px">${esc(c.label)} cycle ≈ ${c.cycle} days. Health score ${b.health}%.</p>${b.notes ? `<p style="margin-top:8px">${esc(b.notes)}</p>` : ''}</div>
    </div>
    <div><div class="split" style="justify-content:space-between;margin-bottom:8px"><h3>Health observations</h3><button class="btn sm" data-act="obs-new" data-id="${esc(b.id)}">${ic('plus')}Add observation</button></div>
      ${obs.length ? `<div class="timeline">${obs.map(o => `<div class="tl ${o.flag ? 'flag' : ''}"><div class="small muted">${fmtDL(o.date)} · ${esc(o.by)} · health ${o.health}%</div>${o.flag ? `<span class="badge b-crit" style="margin:4px 0">${esc(o.flag)}</span>` : ''}<p>${esc(o.note)}</p></div>`).join('')}</div>` : '<p class="muted small">No observations yet. Add the first one after your next walk-through.</p>'}
    </div>
    ${hs.length ? `<div><h3 style="margin-bottom:8px">Harvest records</h3>${harvestTable(hs)}</div>` : ''}`,
    footer: `${can('batches') ? `<button type="button" class="btn" data-act="batch-delete" data-id="${esc(b.id)}">${ic('trash')}Delete</button><button type="button" class="btn" data-act="batch-edit" data-id="${esc(b.id)}">${ic('edit')}Edit batch</button>` : ''}${can('harvest') && b.stage !== 'Harvested' ? `<button type="button" class="btn primary" data-act="harvest-record" data-id="${esc(b.id)}">Record harvest</button>` : ''}<button type="button" class="btn" data-close>Close</button>` });
}
function batchForm(id) {
  const ghs = greenhouses();
  if (!id && !ghs.length) {
    toast('Add a greenhouse first before planting a crop batch.', 'error');
    if (can('targets')) ghForm();
    return;
  }
  const cropsObj = cropsMap();
  const cropKeys = Object.keys(cropsObj);
  const defCrop = cropKeys[0] || 'Lettuce';
  const defGh = ghs[0] || { id: 'gh-a', zones: ['A1'] };
  const b = id ? Store.get('batches', id) : { crop: defCrop, variety: '', ghId: defGh.id, zone: (defGh.zones && defGh.zones[0]) || 'Z1', plants: '', plantedOn: dOff(0), stage: 'Germination', health: 90, expectedHarvest: dOff(cropDef(defCrop).cycle || 42), estKg: '', notes: '' };
  if (!b) return;
  const zoneOpts = ghId => {
    const zs = ghById(ghId)?.zones || (b.zone ? [b.zone] : ['Z1']);
    return zs.map(z => `<option ${z === b.zone ? 'selected' : ''}>${esc(z)}</option>`).join('');
  };
  const ghOpts = ghs.some(g => g.id === b.ghId)
    ? ghs
    : [...ghs, { id: b.ghId, name: ghName(b.ghId), zones: [b.zone || 'Z1'] }];
  const cropEntries = cropsObj[b.crop] ? Object.entries(cropsObj) : [...Object.entries(cropsObj), [b.crop, cropDef(b.crop)]];
  openModal({
    title: id ? `Edit ${b.id}` : 'Add crop batch', submitLabel: id ? 'Save changes' : 'Add batch',
    body: `<div class="form-grid">
      ${fld('Crop', `<select id="f-crop" name="crop">${cropEntries.map(([k, c]) => `<option value="${esc(k)}" ${b.crop === k ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>`, 'crop')}
      ${fld('Variety', `<input id="f-variety" name="variety" value="${esc(b.variety)}" placeholder="e.g. Butterhead “Rex”">`, 'variety')}
      ${fld('Greenhouse', `<select id="f-gh" name="ghId">${ghOpts.map(g => `<option value="${esc(g.id)}" ${b.ghId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>`, 'ghId')}
      ${fld('Zone', `<select id="f-zone" name="zone">${zoneOpts(b.ghId)}</select>`, 'zone')}
      ${fld('Plant count', `<input id="f-plants" name="plants" type="number" min="1" step="1" inputmode="numeric" value="${esc(b.plants)}">`, 'plants')}
      ${fld('Growth stage', `<select id="f-stage" name="stage">${STAGES.map(s => `<option ${b.stage === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`, 'stage')}
      ${fld('Planting date', `<input id="f-planted" name="plantedOn" type="date" value="${b.plantedOn}">`, 'plantedOn')}
      ${fld('Expected harvest', `<input id="f-exp" name="expectedHarvest" type="date" value="${b.expectedHarvest}">`, 'expectedHarvest', 'Suggested from the crop cycle when you change the planting date.')}
      ${fld('Estimated yield (kg)', `<input id="f-est" name="estKg" type="number" min="0" step="0.1" value="${esc(b.estKg)}">`, 'estKg', 'Suggested from plant count × typical yield per plant.')}
      ${fld('Health score (%)', `<input id="f-health" name="health" type="number" min="0" max="100" step="1" value="${esc(b.health)}">`, 'health')}
      <div class="full">${fld('Notes', `<textarea id="f-notes" name="notes">${esc(b.notes || '')}</textarea>`, 'notes')}</div></div>`,
    onOpen: m => {
      const crop = $('#f-crop', m), gh = $('#f-gh', m), pl = $('#f-planted', m), plants = $('#f-plants', m);
      gh.onchange = () => { const zs = ghById(gh.value)?.zones || ['Z1']; $('#f-zone', m).innerHTML = zs.map(z => `<option>${esc(z)}</option>`).join(''); };
      const suggest = () => { const c = cropDef(crop.value); if (pl.value) $('#f-exp', m).value = iso(parseD(pl.value).getTime() + (c.cycle || 42) * DAY); if (plants.value) $('#f-est', m).value = Math.round(plants.value * (c.ypp || 0.15)); };
      crop.onchange = suggest; pl.onchange = suggest; plants.onchange = () => { if (!$('#f-est', m).value || !id) suggest(); };
    },
    validate: d => ({
      variety: !d.variety.trim() && 'Enter the variety so the team can tell batches apart.',
      plants: !(Number(d.plants) >= 1 && Number.isInteger(Number(d.plants))) && 'Enter a whole number of plants, 1 or more.',
      plantedOn: !d.plantedOn ? 'Choose the planting date.' : daysFrom(d.plantedOn) > 60 && 'Planting date can be at most 60 days ahead.',
      expectedHarvest: !d.expectedHarvest ? 'Choose the expected harvest date.' : d.expectedHarvest <= d.plantedOn && 'Expected harvest must be after the planting date.',
      estKg: !(d.estKg !== '' && Number(d.estKg) >= 0) && 'Enter an estimated yield of 0 kg or more.',
      health: !(d.health !== '' && Number(d.health) >= 0 && Number(d.health) <= 100) && 'Enter a health score between 0 and 100.',
    }),
    submit: async d => {
      const doc = { ...(id ? b : { id: nextId('B', batches()), observations: [] }), ...d, plants: Number(d.plants), estKg: Number(d.estKg), health: Number(d.health) };
      await Store.put('batches', doc); return `${doc.id} ${id ? 'updated' : 'added'}.`;
    }
  });
}
function cropsManagerModal() {
  const list = Object.entries(cropsMap());
  openModal({
    title: 'Manage crop varieties & pricing', wide: true, submitLabel: null,
    body: `${list.length ? `<div class="tbl-wrap"><table><thead><tr><th>Key</th><th>Label</th><th class="r">Cycle</th><th class="r">Price/kg</th><th class="r">pH</th><th>Picking</th><th></th></tr></thead><tbody>${list.map(([k, c]) => `<tr><td class="mono">${esc(k)}</td><td><b>${esc(c.label)}</b></td><td class="r num">${c.cycle} d</td><td class="r num">$${num(c.price, 2)}</td><td class="r num">${c.ph?.[0] ?? 5.5}–${c.ph?.[1] ?? 6.5}</td><td>${c.continuous ? '<span class="badge b-info">Continuous</span>' : '<span class="badge b-mute">Single</span>'}</td><td class="r"><button type="button" class="btn sm ghost" data-act="crop-edit" data-id="${esc(k)}">${ic('edit')}</button></td></tr>`).join('')}</tbody></table></div>` : empty('sprout', 'No crops defined yet', 'Add a crop variety with cycle days, wholesale price, and optimal pH/EC targets.')}`,
    footer: `<button type="button" class="btn primary" data-act="crop-new">${ic('plus')}Add crop</button><button type="button" class="btn" data-close>Close</button>`
  });
}
function cropForm(id) {
  const existing = id ? cropDef(id) : null;
  const c = existing || { id: '', label: '', cycle: 42, price: 6.0, ypp: 0.15, continuous: false, ph: [5.6, 6.2], ec: { Vegetative: [1.0, 1.6], Flowering: [1.4, 2.2], Fruiting: [1.6, 2.4] } };
  const veg = c.ec?.Vegetative || [1.0, 1.6];
  const fruit = c.ec?.Fruiting || c.ec?.Flowering || veg;
  openModal({
    title: id ? `Edit crop · ${c.label}` : 'Add crop', submitLabel: id ? 'Save crop' : 'Add crop',
    body: `<div class="form-grid">
      ${fld('Crop code / key', `<input id="cp-id" name="id" value="${esc(id || '')}" ${id ? 'readonly' : ''} placeholder="e.g. Kale or Cucumber">`, 'id')}
      ${fld('Display name', `<input id="cp-label" name="label" value="${esc(c.label)}" placeholder="e.g. Lacinato Kale">`, 'label')}
      ${fld('Growth cycle (days)', `<input id="cp-cycle" name="cycle" type="number" min="7" step="1" value="${c.cycle}">`, 'cycle')}
      ${fld('Wholesale price ($/kg)', `<input id="cp-price" name="price" type="number" min="0" step="0.01" value="${c.price}">`, 'price')}
      ${fld('Est. kg per plant', `<input id="cp-ypp" name="ypp" type="number" min="0.001" step="0.001" value="${c.ypp}">`, 'ypp')}
      ${fld('Harvest type', `<select id="cp-cont" name="continuous"><option value="0" ${!c.continuous ? 'selected' : ''}>Single harvest</option><option value="1" ${c.continuous ? 'selected' : ''}>Continuous weekly picking</option></select>`, 'continuous')}
      ${fld('Min pH', `<input id="cp-phlo" name="phLo" type="number" step="0.1" value="${c.ph?.[0] ?? 5.5}">`, 'phLo')}
      ${fld('Max pH', `<input id="cp-phhi" name="phHi" type="number" step="0.1" value="${c.ph?.[1] ?? 6.5}">`, 'phHi')}
      ${fld('Vegetative EC min', `<input id="cp-ecvlo" name="ecVegLo" type="number" step="0.1" value="${veg[0]}">`, 'ecVegLo')}
      ${fld('Vegetative EC max', `<input id="cp-ecvhi" name="ecVegHi" type="number" step="0.1" value="${veg[1]}">`, 'ecVegHi')}
      ${fld('Fruiting EC min', `<input id="cp-ecflo" name="ecFruitLo" type="number" step="0.1" value="${fruit[0]}">`, 'ecFruitLo')}
      ${fld('Fruiting EC max', `<input id="cp-ecfhi" name="ecFruitHi" type="number" step="0.1" value="${fruit[1]}">`, 'ecFruitHi')}
    </div>`,
    validate: d => ({
      id: !d.id.trim() && 'Enter a short crop key (no spaces preferred).',
      label: d.label.trim().length < 2 && 'Enter a crop display name.',
      cycle: !(Number(d.cycle) >= 7) && 'Enter a cycle of 7 days or more.',
      price: !(Number(d.price) >= 0) && 'Enter a non-negative price per kg.',
      ypp: !(Number(d.ypp) > 0) && 'Enter estimated yield per plant (> 0).',
      phLo: !(Number(d.phLo) >= 3 && Number(d.phLo) < Number(d.phHi)) && 'Min pH must be lower than max pH.',
    }),
    submit: async d => {
      const key = (id || d.id.trim()).replace(/[^A-Za-z0-9_-]/g, '');
      const ph = [+d.phLo, +d.phHi], v = [+d.ecVegLo, +d.ecVegHi], fr = [+d.ecFruitLo, +d.ecFruitHi];
      const doc = {
        id: key, label: d.label.trim(), cycle: +d.cycle, price: +d.price, ypp: +d.ypp, continuous: d.continuous === '1',
        ph, ec: { ...(c.ec || {}), Germination: [Math.max(0.2, +(v[0] * 0.6).toFixed(1)), v[0]], Seedling: [Math.max(0.4, +(v[0] * 0.8).toFixed(1)), v[0]], Vegetative: v, Flowering: fr, Fruiting: fr, Ready: v }
      };
      await Store.put('crops', doc);
      return `Crop "${doc.label}" saved.`;
    },
    footer: id ? `<button type="button" class="btn" data-act="crop-delete" data-id="${esc(id)}">${ic('trash')}Delete</button>` : ''
  });
}
function nextId(prefix, list) { const n = list.map(x => parseInt(String(x.id).split('-')[1])).filter(Number.isFinite); return prefix + '-' + (Math.max(0, ...n) + 1); }
function obsForm(id) {
  const b = Store.get('batches', id);
  openModal({
    title: `Health observation · ${b.id}`, submitLabel: 'Save observation',
    body: `<div class="form-grid">${fld('Date', `<input id="o-date" name="date" type="date" value="${dOff(0)}" max="${dOff(0)}">`, 'date')}${fld('Health score (%)', `<input id="o-health" name="health" type="number" min="0" max="100" value="${b.health}">`, 'health')}
      <div class="full">${fld('What did you see?', `<textarea id="o-note" name="note" placeholder="Leaf colour, root condition, pests, growth uniformity…"></textarea>`, 'note')}</div>
      <div class="full">${fld('Flag a suspected issue (optional)', `<select id="o-flag" name="flag"><option value="">No issue</option><option>Suspected leaf spot</option><option>Suspected powdery mildew</option><option>Suspected root rot (Pythium)</option><option>Suspected aphids</option><option>Suspected nutrient deficiency</option><option>Suspected tip burn</option></select>`, 'flag', 'Flagged issues create a Critical alert for 14 days.')}</div></div>`,
    validate: d => ({ note: d.note.trim().length < 5 && 'Describe what you observed (at least 5 characters).', health: !(d.health !== '' && +d.health >= 0 && +d.health <= 100) && 'Enter a health score between 0 and 100.', date: !d.date ? 'Choose a date.' : d.date > dOff(0) && 'Observations cannot be dated in the future.' }),
    submit: async d => {
      const o = { date: d.date, health: Number(d.health), note: d.note.trim(), by: currentUser().name }; if (d.flag) o.flag = d.flag;
      await Store.put('batches', { ...b, health: Number(d.health), observations: [...(b.observations || []), o] });
      setTimeout(() => batchDetail(b.id), 50); return 'Observation saved.';
    }
  });
}

/* ================= Greenhouses ================= */
function vGreenhouses() {
  const live = isLiveMode(), ghs = greenhouses();
  const anyLive = live && ghs.some(g => readings(g.id) !== null);
  const actions = `${dataModeTag()}${can('targets') ? `<button class="btn primary" data-act="gh-new">${ic('plus')}Add greenhouse</button>` : ''}`;
  return `${pageHead('Greenhouse Management', 'Climate, root-zone and reservoir monitoring for each greenhouse.', actions)}
  <div class="notice">${ic('plug')}<div>${live
    ? `<b>Live Data mode active.</b> ${anyLive ? 'Showing active physical sensor feeds and manual meter logs.' : 'No physical sensor devices are reporting yet. Open any greenhouse to log manual meter readings or connect IoT sensors.'}`
    : '<b>No sensor devices are connected.</b> Readings below are simulated demo data so you can explore the workflow. Connecting an IoT gateway (MQTT or Modbus) requires an integration that is not available in this prototype.'}</div></div>
  ${ghs.length
    ? `<div class="gh-grid">${ghs.map(g => `<div class="card card-b" style="display:grid;gap:12px">${ghCard(g)}<dl class="kv"><dt>System</dt><dd>${esc(g.system)}</dd><dt>Growing area</dt><dd class="num">${num(g.area)} m²</dd><dt>Reservoir</dt><dd class="num">${num(g.reservoirLiters || 1800)} L</dd><dt>Active batches</dt><dd>${activeBatches().filter(b => b.ghId === g.id).map(b => esc(b.id)).join(', ') || 'None'}</dd></dl>${can('targets') ? `<div class="toolbar"><button class="btn sm" data-act="gh-edit" data-id="${esc(g.id)}">${ic('edit')}Edit greenhouse</button></div>` : ''}</div>`).join('')}</div>`
    : `<div class="card">${empty('house', 'No greenhouses configured yet', 'Create your first greenhouse bay to start tracking telemetry, target ranges, and crop zones.', can('targets') ? `<button class="btn primary" data-act="gh-new">${ic('plus')}Add greenhouse</button>` : '')}</div>`}`;
}
function ghForm(id) {
  if (!can('targets')) return toast('Managing greenhouses is not available for this role.', 'error');
  const existing = id ? ghById(id) : null;
  const cropsObj = cropsMap();
  const defCrop = Object.keys(cropsObj)[0] || 'Lettuce';
  const g = existing || { name: '', code: '', system: 'NFT channels', area: 300, reservoirLiters: 1800, zones: ['Z1', 'Z2'], main: defCrop };
  openModal({
    title: id ? `Edit ${g.name}` : 'Add greenhouse', submitLabel: id ? 'Save greenhouse' : 'Create greenhouse',
    body: `<div class="form-grid">
      ${fld('Greenhouse name', `<input id="gh-name" name="name" value="${esc(g.name)}" placeholder="e.g. Greenhouse A">`, 'name')}
      ${fld('Short code', `<input id="gh-code" name="code" value="${esc(g.code)}" placeholder="e.g. A or E">`, 'code')}
      ${fld('Hydroponic system', `<input id="gh-sys" name="system" list="sysList" value="${esc(g.system)}" placeholder="e.g. NFT channels"><datalist id="sysList"><option value="NFT channels"><option value="Dutch buckets"><option value="Deep water culture"><option value="Vertical NFT towers"><option value="Ebb & flow"></datalist>`, 'system')}
      ${fld('Primary crop', `<select id="gh-main" name="main">${Object.entries(cropsObj).map(([k, c]) => `<option value="${esc(k)}" ${g.main === k ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>`, 'main')}
      ${fld('Growing area (m²)', `<input id="gh-area" name="area" type="number" min="1" step="1" value="${esc(g.area)}">`, 'area')}
      ${fld('Reservoir capacity (L)', `<input id="gh-res" name="reservoirLiters" type="number" min="50" step="10" value="${esc(g.reservoirLiters || 1800)}">`, 'reservoirLiters')}
      <div class="full">${fld('Growing zones (comma-separated)', `<input id="gh-zones" name="zonesStr" value="${esc((g.zones || []).join(', '))}" placeholder="e.g. E1, E2, E3">`, 'zonesStr')}</div>
    </div>`,
    validate: d => ({
      name: d.name.trim().length < 2 && 'Enter a greenhouse name.',
      code: !d.code.trim() && 'Enter a short code (e.g. A, B, E).',
      system: !d.system.trim() && 'Enter the hydroponic system type.',
      area: !(Number(d.area) > 0) && 'Enter growing area in m² (> 0).',
      reservoirLiters: !(Number(d.reservoirLiters) >= 50) && 'Enter reservoir capacity in litres (50 or more).',
      zonesStr: !d.zonesStr.split(',').map(s => s.trim()).filter(Boolean).length && 'Enter at least one zone name.',
    }),
    submit: async d => {
      const code = d.code.trim().toUpperCase().slice(0, 6);
      const zones = [...new Set(d.zonesStr.split(',').map(s => s.trim()).filter(Boolean))];
      const newId = id || ('gh-' + code.toLowerCase().replace(/[^a-z0-9]+/g, '') + '-' + Date.now().toString(36).slice(-3));
      const doc = { ...(existing || {}), id: newId, code, name: d.name.trim(), system: d.system.trim(), area: +d.area, reservoirLiters: +d.reservoirLiters, zones, main: d.main };
      await Store.put('greenhouses', doc);
      if (!ui.nutGh) ui.nutGh = doc.id;
      return `${doc.name} ${id ? 'updated' : 'created'}.`;
    },
    footer: id ? `<button type="button" class="btn" data-act="gh-delete" data-id="${esc(id)}">${ic('trash')}Delete</button>` : ''
  });
}
function vGhDetail(id) {
  const g = ghById(id);
  if (!g) {
    return `${pageHead('Greenhouse not found', '', `<a class="btn primary" href="#greenhouses">All greenhouses</a>`, `<div class="crumbs"><a href="#greenhouses">Greenhouses</a>${ic('chev')}<span>Missing</span></div>`)}
    <div class="card">${empty('house', 'This greenhouse could not be found', 'It may have been deleted or created in the other data mode.', `<a class="btn primary" href="#greenhouses">Return to Greenhouses</a>`)}</div>`;
  }
  const r = readings(id), t = targets(id), st = ghStatus(id), s = sensorDef(ui.ghMetric), live = isLiveMode();
  const meta = readingMeta(id);
  const hist = history(id, s.k, ui.ghRange);
  const mrs = manualReadingsForGh(id);
  const mr = mrs[0];
  const remoteCmds = (!AuthState.isDemoAuth && AuthState.equipmentCommands.length)
    ? AuthState.equipmentCommands
        .filter(c => c.farm_id === AuthState.currentFarmId && (!c.device || String(c.device).startsWith(`${id}:`)))
        .map(c => ({
          at: new Date(c.created_at).getTime() || Date.now(),
          label: `${c.device || 'Equipment'}: ${c.command || ''}`,
          by: currentUser().name,
          status: c.status || 'queued',
        }))
    : [];
  const localCmds = Store.all('commands').filter(c => c.ghId === id);
  const cmds = (remoteCmds.length ? remoteCmds : localCmds).sort((a, b) => b.at - a.at).slice(0, 6);
  const fmtX = at => ui.ghRange === '24h' ? new Date(at).toLocaleTimeString(undefined, { hour: 'numeric' }) : new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const lastUpdateTag = !live
    ? `<span class="tag">${READ_AT[id] != null ? `Last update ${new Date(Date.now() - READ_AT[id] * 60000).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : meta?.lastAt ? `Last update ${new Date(meta.lastAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : 'Demo ready'}</span>`
    : meta?.lastAt
      ? `<span class="tag">Last update ${new Date(meta.lastAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>`
      : '<span class="tag">Waiting for sensor data</span>';
  const histBody = live && !hist.length
    ? empty('trend', 'No sensor history available yet', `Waiting for live ${s.label.toLowerCase()} readings or manual meter logs for ${g.name}.`)
    : `<div class="chart-box tall">${makeChart('cGh', { type: 'line', aria: `${s.label} over ${ui.ghRange}`, data: { labels: hist.map(p => fmtX(p.at)), datasets: [
      { label: s.label + (s.unit ? ` (${s.unit})` : ''), data: hist.map(p => p.v), borderColor: col('--accent'), backgroundColor: col('--accent') + '1f', fill: true, tension: .35, pointRadius: (c) => c.dataIndex === hist.length - 1 ? 4 : 0, borderWidth: 2 },
      { label: 'Target min', data: hist.map(() => t[s.k][0]), borderColor: col('--muted'), borderDash: [5, 5], pointRadius: 0, borderWidth: 1.2, fill: false },
      { label: 'Target max', data: hist.map(() => t[s.k][1]), borderColor: col('--muted'), borderDash: [5, 5], pointRadius: 0, borderWidth: 1.2, fill: false }] },
      options: { interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: {} } } })}</div>`;
  const fmtMrSummary = rec => SENSORS.filter(sn => rec[sn.k] != null && rec[sn.k] !== '').map(sn => `${sn.k.toUpperCase()} ${num(rec[sn.k], sn.dec)}${sn.unit ? ' ' + sn.unit : ''}`).join(' · ');
  return `${pageHead(`${esc(g.name)} ${badge(st)}`, `${esc(ghCrops(id).join(', ') || 'No active crop')} · ${esc(g.system)} · ${num(g.area)} m² · ${num(g.reservoirLiters || 1800)} L tank · ${num(ghPlants(id))} plants`, `${dataModeTag()}${lastUpdateTag}${can('targets') ? `<button class="btn sm" data-act="gh-edit" data-id="${esc(id)}">${ic('edit')}Edit greenhouse</button>` : ''}`, `<div class="crumbs"><a href="#greenhouses">Greenhouses</a>${ic('chev')}<span>${esc(g.name)}</span></div>`)}
  <section class="readings" aria-label="Current readings">${SENSORS.map(x => {
    const val = r?.[x.k];
    const hasVal = val !== null && val !== undefined && Number.isFinite(Number(val));
    const ms = hasVal ? metricStatus(val, t[x.k]) : 'nodata';
    return `<button class="card reading" style="text-align:left;cursor:pointer;${ui.ghMetric === x.k ? 'border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)' : ''}" data-seg="ghMetric" data-val="${x.k}" aria-pressed="${ui.ghMetric === x.k}">
    <span class="lbl"><span>${x.label}</span>${badge(ms)}</span><span class="val">${hasVal ? `${num(val, x.dec)}<small>${x.unit}</small>` : '<span class="muted">—</span>'}</span><span class="small muted">Target ${t[x.k][0]}–${t[x.k][1]} ${x.unit}</span></button>`;
  }).join('')}</section>
  ${mr ? `<div class="notice">${ic('info')}<div>Latest manual reading: <b>${esc(fmtMrSummary(mr) || 'Logged')}</b> by ${esc(mr.by)} on ${fmtDT(mr.at)}.</div></div>` : ''}
  ${card(`${s.label} history`, histBody,
    { sub: `Select a reading above to change the metric · ${live ? 'live data' : 'demo data'}`, actions: seg('ghRange', [['24h', '24 hours'], ['7d', '7 days'], ['30d', '30 days']], ui.ghRange, 'History range') })}
  <div class="grid g-2">
    ${card('Target ranges', can('targets') ? `<form id="targetsForm" data-gh="${esc(id)}" novalidate><div class="tbl-wrap"><table><thead><tr><th>Reading</th><th>Min</th><th>Max</th></tr></thead><tbody>${SENSORS.map(x => `<tr><td><b>${x.label}</b><div class="small muted">${x.unit || 'unitless'}</div></td><td><label class="sr" for="t-${x.k}-lo">${x.label} minimum</label><input class="input" style="width:100px" id="t-${x.k}-lo" name="${x.k}-lo" type="number" step="any" value="${t[x.k][0]}"></td><td><label class="sr" for="t-${x.k}-hi">${x.label} maximum</label><input class="input" style="width:100px" id="t-${x.k}-hi" name="${x.k}-hi" type="number" step="any" value="${t[x.k][1]}"></td></tr>`).join('')}</tbody></table></div><p class="err" id="targetsErr" role="alert"></p><div class="toolbar" style="margin-top:10px"><button class="btn primary" type="submit">Save targets</button><button class="btn" type="button" data-act="targets-reset" data-id="${esc(id)}">Restore defaults</button></div></form>`
      : `<div class="tbl-wrap"><table><tbody>${SENSORS.map(x => `<tr><td>${x.label}</td><td class="num r">${t[x.k][0]}–${t[x.k][1]} ${x.unit}</td></tr>`).join('')}</tbody></table></div>${noPerm('Editing target ranges')}`,
      { sub: 'Status badges and alerts use these ranges' })}
    <div class="grid" style="gap:20px;align-content:start">
    ${card('Sensor connections', `<div class="tbl-wrap"><table><thead><tr><th>Sensor</th><th>Status</th><th>Last update</th></tr></thead><tbody>${SENSORS.map(x => {
      if (!live && READ_AT[id] != null) {
        return `<tr><td><b>${x.label}</b><div class="small muted">${x.model}</div></td><td><span class="badge b-mute">Simulated · not connected</span></td><td class="num small">${READ_AT[id]} min ago (demo)</td></tr>`;
      }
      const hasVal = r && r[x.k] !== null && r[x.k] !== undefined && Number.isFinite(Number(r[x.k]));
      const metricAt = meta?.updatedAtByMetric?.[x.k];
      const isManual = mr && mr[x.k] != null && (!metricAt || metricAt === mr.at);
      const stBadge = hasVal
        ? (isManual ? '<span class="badge b-info">Manual meter log</span>' : '<span class="badge b-ok">Connected</span>')
        : '<span class="badge b-nodata">Waiting for sensor</span>';
      const tsCell = hasVal && metricAt ? fmtDT(metricAt) : hasVal && mr?.at ? fmtDT(mr.at) : 'No data yet';
      return `<tr><td><b>${x.label}</b><div class="small muted">${x.model}</div></td><td>${stBadge}</td><td class="num small muted">${tsCell}</td></tr>`;
    }).join('')}</tbody></table></div>
      <div class="toolbar" style="margin-top:12px"><button class="btn" data-act="reading-new" data-id="${esc(id)}">${ic('edit')}Log manual reading</button><button class="btn" data-act="integration" data-id="sensor gateway">${ic('plug')}Connect devices</button></div>
      ${mrs.length ? `<h3 style="margin:14px 0 6px">Manual reading logs</h3><div class="tbl-wrap"><table><tbody>${mrs.slice(0, 6).map(rec => `<tr><td class="small num">${fmtDT(rec.at)}</td><td class="small">${esc(fmtMrSummary(rec))}<div class="muted">${esc(rec.by)}</div></td><td class="r"><button type="button" class="btn sm ghost" data-act="reading-edit" data-id="${esc(rec.id)}" aria-label="Edit reading">${ic('edit')}</button><button type="button" class="btn sm ghost" data-act="reading-delete" data-id="${esc(rec.id)}" aria-label="Delete reading">${ic('trash')}</button></td></tr>`).join('')}</tbody></table></div>` : ''}`)}
    ${card('Equipment controls', `<div class="notice warn" style="margin-bottom:12px">${ic('alert')}<div>Every command needs your explicit confirmation. No controller is connected, so commands are logged${!AuthState.isDemoAuth ? ' to Supabase' : ''} but <b>not sent</b> to equipment.</div></div>
      <div style="display:grid;gap:8px">${DEVICES.map(d => `<div class="equip-row"><div class="split">${ic(d.icon)}<div><b>${d.label}</b><div class="small muted">${d.action}</div></div></div><button class="btn sm" data-act="command" data-gh="${esc(id)}" data-id="${d.k}" ${can('commands') ? '' : 'disabled title="Not available for Farm Worker role"'}>${ic('power')}Send command…</button></div>`).join('')}</div>
      ${cmds.length ? `<h3 style="margin:14px 0 6px">Command log</h3><div class="tbl-wrap"><table><tbody>${cmds.map(c => `<tr><td class="small num">${fmtDT(c.at)}</td><td class="small">${esc(c.label)}<div class="muted">${esc(c.by)}</div></td><td><span class="badge ${c.status === 'queued' ? 'b-ok' : 'b-warn'}">${c.status === 'queued' ? 'Queued' : 'Not sent'}</span></td></tr>`).join('')}</tbody></table></div>` : ''}`)}
    </div>
  </div>
  ${card('Crop batches in this greenhouse', pipelineTable(activeBatches().filter(b => b.ghId === id)), { actions: can('batches') ? `<button class="btn sm" data-act="batch-new">${ic('plus')}Add batch</button>` : '' })}`;
}
function commandConfirm(ghId, devKey) {
  const g = ghById(ghId), d = DEVICES.find(x => x.k === devKey);
  if (!g || !d) return;
  openModal({
    title: 'Confirm equipment command', submitLabel: 'Confirm and send', danger: true,
    body: `<p>You are about to send this command:</p><dl class="kv"><dt>Greenhouse</dt><dd>${esc(g.name)}</dd><dt>Equipment</dt><dd>${esc(d.label)}</dd><dt>Action</dt><dd>${esc(d.action)}</dd></dl>
      <div class="notice warn">${ic('alert')}<div><b>No controller integration is connected.</b> Confirming records the request in the command log, but nothing will reach the equipment. Use the manual controls in the greenhouse.</div></div>
      <label class="split" style="font-weight:600"><input type="checkbox" id="cmdAck" name="ack" style="width:18px;height:18px"> I have checked that nobody is working on this equipment.</label><p class="err" id="err-ack"></p>`,
    validate: dd => ({ ack: !dd.ack && 'Tick the safety check before sending a command.' }),
    submit: async () => {
      const canRemoteLog = Boolean(sbClient && AuthState.session && !AuthState.isDemoAuth && isUuid(AuthState.currentFarmId));
      await Store.put('commands', { id: uid('CMD'), ghId, device: devKey, label: `${d.label}: ${d.action}`, at: Date.now(), by: currentUser().name, status: canRemoteLog ? 'queued' : 'not_sent' });
      if (canRemoteLog) {
        await logEquipmentCommand({ device: `${ghId}:${devKey}`, command: d.action, maxRuntimeMinutes: devKey === 'pump' ? 5 : devKey === 'fans' ? 20 : 0 });
        return { msg: `Command queued for ${g.name}.`, type: 'ok' };
      }
      return { msg: 'Command logged locally (no controller connected).', type: 'ok' };
    }
  });
}
function readingForm(ghId, readingId = null) {
  const existing = readingId ? Store.get('readings', readingId) : null;
  const targetGh = existing?.ghId || ghId;
  openModal({
    title: `${existing ? 'Edit' : 'Log'} manual reading · ${ghName(targetGh)}`, submitLabel: existing ? 'Save changes' : 'Save reading',
    body: `<p class="muted">Enter any handheld meter or spot-check measurements. Leave unknown sensors blank.</p><div class="form-grid">
      ${fld('pH', `<input id="r-ph" name="ph" type="number" step="0.01" min="0" max="14" inputmode="decimal" value="${existing?.ph ?? ''}">`, 'ph')}
      ${fld('EC (mS/cm)', `<input id="r-ec" name="ec" type="number" step="0.01" min="0" max="10" inputmode="decimal" value="${existing?.ec ?? ''}">`, 'ec')}
      ${fld('Air temp (°C)', `<input id="r-temp" name="temp" type="number" step="0.1" inputmode="decimal" value="${existing?.temp ?? ''}">`, 'temp')}
      ${fld('Humidity (%)', `<input id="r-hum" name="hum" type="number" step="1" min="0" max="100" inputmode="numeric" value="${existing?.hum ?? ''}">`, 'hum')}
      ${fld('CO₂ (ppm)', `<input id="r-co2" name="co2" type="number" step="10" min="0" inputmode="numeric" value="${existing?.co2 ?? ''}">`, 'co2')}
      ${fld('Water temp (°C)', `<input id="r-wt" name="wt" type="number" step="0.1" inputmode="decimal" value="${existing?.wt ?? ''}">`, 'wt')}
      ${fld('Reservoir level (%)', `<input id="r-res" name="res" type="number" step="1" min="0" max="100" inputmode="numeric" value="${existing?.res ?? ''}">`, 'res')}
    </div>`,
    validate: d => {
      const hasAny = SENSORS.some(s => d[s.k] !== '' && d[s.k] !== undefined && Number.isFinite(Number(d[s.k])));
      const errs = {};
      if (!hasAny) errs.ph = 'Enter at least one measurement.';
      if (d.ph !== '' && (+d.ph < 3 || +d.ph > 9)) errs.ph = 'Enter a pH between 3 and 9.';
      if (d.ec !== '' && (+d.ec < 0 || +d.ec > 6)) errs.ec = 'Enter an EC between 0 and 6 mS/cm.';
      if (d.hum !== '' && (+d.hum < 0 || +d.hum > 100)) errs.hum = 'Humidity must be 0–100%.';
      if (d.res !== '' && (+d.res < 0 || +d.res > 100)) errs.res = 'Reservoir level must be 0–100%.';
      return errs;
    },
    submit: async d => {
      const payload = { id: existing ? existing.id : uid('R'), ghId: targetGh, at: existing ? existing.at : Date.now(), by: currentUser().name };
      SENSORS.forEach(s => {
        if (d[s.k] !== '' && d[s.k] !== undefined && Number.isFinite(Number(d[s.k]))) {
          payload[s.k] = +Number(d[s.k]).toFixed(s.dec);
        }
      });
      await Store.put('readings', payload);
      return existing ? 'Reading updated.' : 'Reading saved.';
    },
    footer: existing ? `<button type="button" class="btn" data-act="reading-delete" data-id="${esc(existing.id)}">${ic('trash')}Delete</button>` : ''
  });
}

/* ================= Harvest ================= */
function vHarvest() {
  const hs = harvests(), last90 = hs.filter(h => h.date >= dOff(-90)), live = isLiveMode();
  const act = activeBatches().sort((a, b) => a.expectedHarvest.localeCompare(b.expectedHarvest));
  const estSum = last90.reduce((s, h) => s + h.estKg, 0);
  const acc = last90.length && estSum > 0 ? last90.reduce((s, h) => s + h.actualKg, 0) / estSum * 100 : null;
  const gradeA = last90.length ? last90.filter(h => h.grade === 'A').length / last90.length * 100 : null;
  const recent = hs.slice(0, 12).reverse();
  const evaBody = live && !recent.length
    ? empty('basket', 'No harvest records yet', 'Recorded harvests in Live Data mode will be compared against estimates here.')
    : `<div class="chart-box">${makeChart('cEva', { type: 'bar', aria: 'Estimated versus actual yield for the last 12 harvests', data: { labels: recent.map(h => `${h.id}`), datasets: [{ label: 'Estimated kg', data: recent.map(h => h.estKg), backgroundColor: col('--line'), borderRadius: 4 }, { label: 'Actual kg', data: recent.map(h => h.actualKg), backgroundColor: col('--accent'), borderRadius: 4 }] }, options: { scales: { x: { grid: { display: false }, ticks: { maxRotation: 60, font: { size: 10 } } }, y: {} } } })}</div><div class="legend" style="margin-top:8px"><span><i style="background:var(--accent-soft);border:1px solid var(--accent)"></i>Planned harvest</span><span><i style="background:var(--card);border:1px solid var(--line)"></i>Recorded harvest</span></div>`;
  return `${pageHead('Harvest Management', 'Plan harvests, track readiness and record actual yield and quality.', can('harvest') ? `<button class="btn primary" data-act="harvest-new">${ic('plus')}Log harvest</button>` : '')}
  <div class="stats">${[['Harvested, last 90 days', num(last90.reduce((s, h) => s + Number(h.actualKg), 0)) + ' kg'], ['Actual vs estimate', acc !== null ? num(acc, 1) + '%' : '—'], ['Grade A share', gradeA !== null ? num(gradeA, 0) + '%' : '—'], ['Ready within 7 days', act.filter(b => daysFrom(b.expectedHarvest) <= 7).length + ' batches']].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  <div class="grid g-main">
    ${card('Harvest calendar', calendar(), { actions: `<button class="btn sm" data-act="cal-prev" aria-label="Previous month">${ic('left')}</button><b class="cal-title">${ui.calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b><button class="btn sm" data-act="cal-next" aria-label="Next month">${ic('chev')}</button><button class="btn sm" data-act="cal-today">Today</button>` })}
    ${card('Estimated vs actual', evaBody, { sub: 'Last 12 recorded harvests' })}
  </div>
  ${card('Readiness tracking', pipelineTable(act, true), { sub: 'All active batches, soonest first' })}
  ${card('Harvest records', harvestTable(hs.slice(0, 25)), { sub: `Showing ${Math.min(25, hs.length)} of ${hs.length} records` })}`;
}
function calendar() {
  const m = ui.calMonth, start = new Date(m.getFullYear(), m.getMonth(), 1), off = (start.getDay() + 6) % 7;
  const first = new Date(start.getTime() - off * DAY);
  const plan = forecastItems(120), hs = harvests();
  let html = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const d = new Date(first.getTime() + i * DAY); d.setHours(0, 0, 0, 0); const k = iso(d);
    if (i >= 35 && d.getMonth() !== m.getMonth()) break;
    const evP = plan.filter(p => p.date === k), evH = hs.filter(h => h.date === k);
    html += `<div class="day ${d.getMonth() !== m.getMonth() ? 'out' : ''} ${k === dOff(0) ? 'today' : ''}"><span class="dn">${d.getDate()}</span>${evP.map(p => `<button class="ev plan" data-act="batch" data-id="${esc(p.batch.id)}" title="${esc(cropDef(p.crop).label)}, ${p.kg} kg planned">${esc(p.crop)} ${p.kg}kg</button>`).join('')}${evH.map(h => `<button class="ev done" data-act="harvest-view" data-id="${esc(h.id)}" title="${esc(cropDef(h.crop).label)}, ${h.actualKg} kg harvested">✓ ${esc(h.crop)} ${h.actualKg}kg</button>`).join('')}</div>`;
  }
  return `<div class="cal" aria-label="Harvest calendar">${html}</div>`;
}
function harvestTable(list) {
  if (!list.length) return empty('basket', 'No harvest records yet', 'Record a harvest from the readiness table or click Log harvest.');
  return `<div class="tbl-wrap"><table><thead><tr><th>Record</th><th>Date</th><th>Crop</th><th>Location</th><th class="r">Estimated</th><th class="r">Actual</th><th class="r">Variance</th><th>Grade</th></tr></thead><tbody>${list.map(h => { const v = h.estKg > 0 ? (h.actualKg - h.estKg) / h.estKg * 100 : 0; return `<tr class="click" data-act="harvest-view" data-id="${esc(h.id)}" tabindex="0"><td class="mono">${esc(h.id)}</td><td class="num">${fmtD(h.date)}</td><td>${esc(cropDef(h.crop).label)}</td><td>${esc(ghName(h.ghId))} · ${esc(h.zone || '')}</td><td class="r num">${num(h.estKg)} kg</td><td class="r num"><b>${num(h.actualKg)} kg</b></td><td class="r num" style="color:var(${v < -8 ? '--crit' : v < 0 ? '--warn' : '--ok'})">${h.estKg > 0 ? `${v > 0 ? '+' : ''}${num(v, 1)}%` : '—'}</td><td><span class="badge ${h.grade === 'A' ? 'b-ok' : h.grade === 'B' ? 'b-warn' : 'b-crit'}">Grade ${esc(h.grade)}</span></td></tr>`; }).join('')}</tbody></table></div>`;
}
function harvestView(id) {
  const h = Store.get('harvests', id); if (!h) return;
  openModal({
    title: `Harvest ${h.id}`, submitLabel: null,
    body: `<dl class="kv"><dt>Crop</dt><dd>${esc(cropDef(h.crop).label)}</dd><dt>Date</dt><dd>${fmtDL(h.date)}</dd><dt>Location</dt><dd>${esc(ghName(h.ghId))}, zone ${esc(h.zone || '—')}</dd>${h.batchId ? `<dt>Batch</dt><dd>${esc(h.batchId)}</dd>` : ''}<dt>Estimated</dt><dd class="num">${num(h.estKg)} kg</dd><dt>Actual</dt><dd class="num">${num(h.actualKg)} kg</dd><dt>Quality grade</dt><dd>Grade ${esc(h.grade)}</dd><dt>Recorded by</dt><dd>${esc(h.updatedBy || 'Sample data')}</dd>${h.notes ? `<dt>Notes</dt><dd>${esc(h.notes)}</dd>` : ''}</dl>`,
    footer: `${can('harvest') ? `<button type="button" class="btn" data-act="harvest-delete" data-id="${esc(h.id)}">${ic('trash')}Delete</button><button type="button" class="btn primary" data-act="harvest-edit" data-id="${esc(h.id)}">${ic('edit')}Edit</button>` : ''}<button type="button" class="btn" data-close>Close</button>`
  });
}
function harvestEditForm(id) {
  if (!can('harvest')) return toast('Editing harvests is not available for this role.', 'error');
  const h = Store.get('harvests', id); if (!h) return;
  const ghs = greenhouses(), cropsObj = cropsMap();
  const cropEntries = cropsObj[h.crop] ? Object.entries(cropsObj) : [...Object.entries(cropsObj), [h.crop, cropDef(h.crop)]];
  const ghOpts = ghs.some(g => g.id === h.ghId) ? ghs : [...ghs, { id: h.ghId, name: ghName(h.ghId) }];
  openModal({
    title: `Edit harvest · ${h.id}`, submitLabel: 'Save changes',
    body: `<div class="form-grid">
      ${fld('Crop', `<select id="he-crop" name="crop">${cropEntries.map(([k, c]) => `<option value="${esc(k)}" ${h.crop === k ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>`, 'crop')}
      ${fld('Greenhouse', `<select id="he-gh" name="ghId">${ghOpts.map(g => `<option value="${esc(g.id)}" ${h.ghId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>`, 'ghId')}
      ${fld('Zone', `<input id="he-zone" name="zone" value="${esc(h.zone || '')}">`, 'zone')}
      ${fld('Harvest date', `<input id="he-date" name="date" type="date" value="${h.date}" max="${dOff(0)}">`, 'date')}
      ${fld('Estimated (kg)', `<input id="he-est" name="estKg" type="number" min="0" step="0.1" value="${h.estKg}">`, 'estKg')}
      ${fld('Actual quantity (kg)', `<input id="he-kg" name="actualKg" type="number" min="0" step="0.1" value="${h.actualKg}">`, 'actualKg')}
      ${fld('Quality grade', `<select id="he-grade" name="grade">${['A', 'B', 'C'].map(g => `<option value="${g}" ${h.grade === g ? 'selected' : ''}>Grade ${g}</option>`).join('')}</select>`, 'grade')}
      <div class="full">${fld('Notes', `<textarea id="he-notes" name="notes">${esc(h.notes || '')}</textarea>`, 'notes')}</div>
    </div>`,
    validate: d => ({
      actualKg: !(d.actualKg !== '' && +d.actualKg > 0) && 'Enter the harvested quantity in kg (more than 0).',
      date: !d.date ? 'Choose the harvest date.' : d.date > dOff(0) && 'A harvest cannot be dated in the future.'
    }),
    submit: async d => {
      await Store.put('harvests', { ...h, ...d, estKg: Number(d.estKg) || 0, actualKg: Number(d.actualKg) });
      return `Harvest ${h.id} updated.`;
    }
  });
}
function harvestForm(batchId) {
  if (!can('harvest')) return toast('Recording harvests is not available for this role.', 'error');
  const b = batchId ? Store.get('batches', batchId) : null;
  if (b) {
    const c = cropDef(b.crop);
    openModal({
      title: `Record harvest · ${b.id}`, submitLabel: 'Save harvest record',
      body: `<p class="muted">${esc(c.label)}, ${esc(ghName(b.ghId))} zone ${esc(b.zone)}. Estimated ${num(b.estKg)} kg.</p><div class="form-grid">
        ${fld('Harvest date', `<input id="h-date" name="date" type="date" value="${dOff(0)}" max="${dOff(0)}">`, 'date')}
        ${fld('Actual quantity (kg)', `<input id="h-kg" name="actualKg" type="number" min="0" step="0.1" inputmode="decimal">`, 'actualKg')}
        ${fld('Quality grade', `<select id="h-grade" name="grade"><option value="A">Grade A, premium</option><option value="B">Grade B, standard</option><option value="C">Grade C, processing</option></select>`, 'grade')}
        ${fld('Batch status after harvest', `<select id="h-final" name="final"><option value="final" ${c.continuous ? '' : 'selected'}>Final harvest, mark batch harvested</option><option value="pick" ${c.continuous ? 'selected' : ''}>Ongoing picking, next pick in 7 days</option></select>`, 'final')}
        <div class="full">${fld('Notes', `<textarea id="h-notes" name="notes" placeholder="Rejects, size distribution, packing notes"></textarea>`, 'notes')}</div></div>`,
      validate: d => ({ actualKg: !(d.actualKg !== '' && +d.actualKg > 0) && 'Enter the harvested quantity in kg (more than 0).', date: !d.date ? 'Choose the harvest date.' : d.date > dOff(0) && 'A harvest cannot be recorded in the future.' }),
      submit: async d => {
        const rec = { id: nextId('H', harvests()), batchId: b.id, crop: b.crop, ghId: b.ghId, zone: b.zone, date: d.date, estKg: Number(b.estKg), actualKg: Number(d.actualKg), grade: d.grade, notes: d.notes };
        await Store.put('harvests', rec);
        await Store.put('batches', d.final === 'final' ? { ...b, stage: 'Harvested', harvestedOn: d.date } : { ...b, expectedHarvest: iso(parseD(d.date).getTime() + 7 * DAY), stage: b.stage === 'Ready' ? 'Fruiting' : b.stage });
        return `Harvest ${rec.id} saved: ${num(rec.actualKg, 1)} kg.`;
      }
    });
    return;
  }
  const ghs = greenhouses(), cropsObj = cropsMap(), act = activeBatches();
  const defGh = ghs[0] || { id: 'gh-a', zones: ['A1'] };
  openModal({
    title: 'Log harvest', submitLabel: 'Save harvest record',
    body: `<div class="form-grid">
      ${act.length ? `<div class="full">${fld('Link to active batch (optional)', `<select id="h-batch" name="batchId"><option value="">Standalone harvest record</option>${act.map(x => `<option value="${esc(x.id)}">${esc(x.id)} · ${esc(cropDef(x.crop).label)} (${esc(ghName(x.ghId))})</option>`).join('')}</select>`, 'batchId')}</div>` : ''}
      ${fld('Crop', `<select id="h-crop" name="crop">${Object.entries(cropsObj).map(([k, c]) => `<option value="${esc(k)}">${esc(c.label)}</option>`).join('')}</select>`, 'crop')}
      ${fld('Greenhouse', `<select id="h-gh" name="ghId">${ghs.length ? ghs.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('') : '<option value="gh-a">Greenhouse A</option>'}</select>`, 'ghId')}
      ${fld('Zone', `<input id="h-zone" name="zone" value="${esc((defGh.zones && defGh.zones[0]) || 'A1')}">`, 'zone')}
      ${fld('Harvest date', `<input id="h-date" name="date" type="date" value="${dOff(0)}" max="${dOff(0)}">`, 'date')}
      ${fld('Estimated (kg)', `<input id="h-est" name="estKg" type="number" min="0" step="0.1" value="0">`, 'estKg')}
      ${fld('Actual quantity (kg)', `<input id="h-kg" name="actualKg" type="number" min="0" step="0.1" inputmode="decimal">`, 'actualKg')}
      ${fld('Quality grade', `<select id="h-grade" name="grade"><option value="A">Grade A, premium</option><option value="B">Grade B, standard</option><option value="C">Grade C, processing</option></select>`, 'grade')}
      <div class="full">${fld('Notes', `<textarea id="h-notes" name="notes" placeholder="Rejects, size distribution, packing notes"></textarea>`, 'notes')}</div>
    </div>`,
    onOpen: m => {
      const sel = $('#h-batch', m);
      if (sel) sel.onchange = () => {
        const bx = Store.get('batches', sel.value);
        if (bx) { $('#h-crop', m).value = bx.crop; $('#h-gh', m).value = bx.ghId; $('#h-zone', m).value = bx.zone || ''; $('#h-est', m).value = bx.estKg; }
      };
    },
    validate: d => ({ actualKg: !(d.actualKg !== '' && +d.actualKg > 0) && 'Enter the harvested quantity in kg (more than 0).', date: !d.date ? 'Choose the harvest date.' : d.date > dOff(0) && 'A harvest cannot be recorded in the future.' }),
    submit: async d => {
      const rec = { id: nextId('H', harvests()), batchId: d.batchId || '', crop: d.crop, ghId: d.ghId, zone: d.zone, date: d.date, estKg: Number(d.estKg) || 0, actualKg: Number(d.actualKg), grade: d.grade, notes: d.notes };
      await Store.put('harvests', rec);
      return `Harvest ${rec.id} saved: ${num(rec.actualKg, 1)} kg.`;
    }
  });
}

/* ================= Tasks ================= */
function vTasks() {
  const f = ui.taskF, q = f.q.toLowerCase(), ghs = greenhouses(), people = teamMembers();
  const list = tasks().filter(t => (!f.gh || t.ghId === f.gh) && (!f.who || t.assignee === f.who) && (!f.pri || t.priority === f.pri) && (f.status === 'All' || (f.status === 'Open' ? t.status !== 'Done' : t.status === 'Done'))
    && (f.when === 'all' || (f.when === 'today' && t.due === dOff(0)) || (f.when === 'overdue' && isOverdue(t)) || (f.when === 'week' && daysFrom(t.due) >= 0 && daysFrom(t.due) <= 7))
    && (!q || `${t.title} ${t.notes} ${t.assignee}`.toLowerCase().includes(q))).sort((a, b) => (a.status === 'Done') - (b.status === 'Done') || a.due.localeCompare(b.due) || a.time.localeCompare(b.time));
  const all = tasks(), open = all.filter(t => t.status !== 'Done');
  const taskActions = can('tasks') ? `<button class="btn" data-act="team-manage">${ic('user')}Manage team</button><button class="btn primary" data-act="task-new">${ic('plus')}New task</button>` : '';
  return `${pageHead('Farmer Tasks', 'Assign, schedule and complete work across greenhouses.', taskActions)}
  <div class="stats">${[['Open', open.length], ['Due today', open.filter(t => t.due === dOff(0)).length], ['Overdue', open.filter(isOverdue).length], ['Completed today', all.filter(t => t.status === 'Done' && (t.completedAt ? iso(t.completedAt) === dOff(0) : t.due === dOff(0))).length]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${card('Tasks', `<div class="toolbar" style="margin-bottom:10px">
    <label class="sr" for="tf-q">Search tasks</label><input id="tf-q" class="input grow" type="search" placeholder="Search tasks" value="${esc(f.q)}" data-filter="taskF.q">
    <label class="sr" for="tf-gh">Greenhouse</label><select id="tf-gh" class="select" data-filter="taskF.gh"><option value="">All greenhouses</option>${ghs.map(g => `<option value="${esc(g.id)}" ${f.gh === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>
    <label class="sr" for="tf-who">Assignee</label><select id="tf-who" class="select" data-filter="taskF.who"><option value="">Everyone</option>${people.map(p => `<option ${f.who === p.name ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
    <label class="sr" for="tf-pri">Priority</label><select id="tf-pri" class="select" data-filter="taskF.pri"><option value="">Any priority</option>${['High', 'Medium', 'Low'].map(p => `<option ${f.pri === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
  </div><div class="toolbar" style="margin-bottom:6px">${seg('taskStatus', [['Open', 'Open'], ['Done', 'Completed'], ['All', 'All']], f.status, 'Status')}${seg('taskWhen', [['all', 'Any date'], ['today', 'Today'], ['overdue', 'Overdue'], ['week', 'Next 7 days']], f.when, 'Due date')}</div>
  ${taskList(list)}`, { sub: `${list.length} shown` })}`;
}
function teamManagerModal() {
  const people = Store.all('team');
  openModal({
    title: 'Manage farm team', wide: true, submitLabel: null,
    body: `${people.length ? `<div class="tbl-wrap"><table><thead><tr><th>Name</th><th>Role</th><th></th></tr></thead><tbody>${people.map(p => `<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.role)}</td><td class="r"><button type="button" class="btn sm ghost" data-act="team-edit" data-id="${esc(p.id)}">${ic('edit')}</button></td></tr>`).join('')}</tbody></table></div>` : empty('user', 'No team members added yet', 'Add team members so tasks can be assigned cleanly in Live Data mode.')}`,
    footer: `<button type="button" class="btn primary" data-act="team-new">${ic('plus')}Add team member</button><button type="button" class="btn" data-close>Close</button>`
  });
}
function teamMemberForm(id) {
  const p = id ? Store.get('team', id) : { name: '', role: 'Farm Worker' };
  if (!p) return;
  openModal({
    title: id ? `Edit ${p.name}` : 'Add team member', submitLabel: id ? 'Save changes' : 'Add member',
    body: `<div class="form-grid">
      <div class="full">${fld('Full name', `<input id="tm-name" name="name" value="${esc(p.name)}" placeholder="e.g. Maria Santos">`, 'name')}</div>
      <div class="full">${fld('Role', `<select id="tm-role" name="role">${['Farm Worker', 'Farm Manager', 'Farm Owner', 'Agronomist'].map(r => `<option ${p.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select>`, 'role')}</div>
    </div>`,
    validate: d => ({ name: d.name.trim().length < 2 && 'Enter a team member name.' }),
    submit: async d => {
      const doc = { id: id || uid('P'), name: d.name.trim(), role: d.role };
      await Store.put('team', doc);
      return `${doc.name} saved.`;
    },
    footer: id ? `<button type="button" class="btn" data-act="team-delete" data-id="${esc(id)}">${ic('trash')}Remove</button>` : ''
  });
}
function taskForm(id) {
  const ghs = greenhouses(), people = teamMembers();
  const defGh = ghs[0]?.id || '';
  const defWho = people[0]?.name || currentUser().name;
  const t = id ? Store.get('tasks', id) : { title: '', ghId: defGh, assignee: defWho, priority: 'Medium', due: dOff(0), time: '09:00', recurrence: 'none', notes: '', status: 'Open' };
  if (!t) return;
  const editable = can('tasks');
  let photo = t.photo || '';
  const ghOpts = ghs.length
    ? (ghs.some(g => g.id === t.ghId) || !t.ghId ? ghs : [...ghs, { id: t.ghId, name: ghName(t.ghId) }])
    : [{ id: '', name: 'Farmwide' }];
  const assigneeCtrl = people.length
    ? `<select id="k-who" name="assignee" ${editable ? '' : 'disabled'}>${(people.some(p => p.name === t.assignee) ? people : [...people, { name: t.assignee }]).filter(p => p.name).map(p => `<option ${t.assignee === p.name ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`
    : `<input id="k-who" name="assignee" value="${esc(t.assignee)}" ${editable ? '' : 'readonly'} placeholder="Assignee name">`;
  openModal({
    title: id ? (editable ? 'Edit task' : 'Task details') : 'New task', submitLabel: id ? 'Save changes' : 'Create task',
    body: `${!editable ? `<div class="notice">${ic('info')}<div>As a Farm Worker you can complete tasks and add notes or photos. Managers assign and schedule.</div></div>` : ''}<div class="form-grid">
      <div class="full">${fld('Task', `<input id="k-title" name="title" value="${esc(t.title)}" ${editable ? '' : 'readonly'} placeholder="e.g. Flush and refill reservoir B">`, 'title')}</div>
      ${fld('Greenhouse', `<select id="k-gh" name="ghId" ${editable ? '' : 'disabled'}><option value="">Farmwide</option>${ghOpts.filter(g => g.id).map(g => `<option value="${esc(g.id)}" ${t.ghId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>`, 'ghId')}
      ${fld('Assigned to', assigneeCtrl, 'assignee')}
      ${fld('Due date', `<input id="k-due" name="due" type="date" value="${t.due}" ${editable ? '' : 'readonly'}>`, 'due')}
      ${fld('Due time', `<input id="k-time" name="time" type="time" value="${t.time}" ${editable ? '' : 'readonly'}>`, 'time')}
      ${fld('Priority', `<select id="k-pri" name="priority" ${editable ? '' : 'disabled'}>${['High', 'Medium', 'Low'].map(p => `<option ${t.priority === p ? 'selected' : ''}>${p}</option>`).join('')}</select>`, 'priority')}
      ${fld('Repeats', `<select id="k-rec" name="recurrence" ${editable ? '' : 'disabled'}>${[['none', 'Does not repeat'], ['daily', 'Daily'], ['weekly', 'Weekly']].map(([v, l]) => `<option value="${v}" ${t.recurrence === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`, 'recurrence', 'Completing a repeating task schedules the next one.')}
      <div class="full">${fld('Notes', `<textarea id="k-notes" name="notes">${esc(t.notes || '')}</textarea>`, 'notes')}</div>
      <div class="full field"><label for="k-photo">Photo attachment</label><div class="photo-prev" id="k-prev">${safeImgSrc(photo) ? `<img src="${esc(safeImgSrc(photo))}" alt="Task photo">` : ''}<input id="k-photo" type="file" accept="image/jpeg,image/png,image/webp"><button type="button" class="btn sm" id="k-photo-rm" ${safeImgSrc(photo) ? '' : 'hidden'}>Remove photo</button></div><span class="hint">Photos are resized to 640 px before saving.</span><p class="err" id="err-photo"></p></div>
    </div>`,
    onOpen: m => {
      const inp = $('#k-photo', m);
      inp.onchange = async () => {
        const file = inp.files[0]; if (!file) return;
        $('#err-photo', m).textContent = '';
        try { validateImageUpload(file); photo = await downscale(file, 640); $('#k-prev img', m)?.remove(); $('#k-prev', m).insertAdjacentHTML('afterbegin', `<img src="${esc(safeImgSrc(photo))}" alt="Task photo">`); $('#k-photo-rm', m).hidden = false; }
        catch (e) { inp.value = ''; $('#err-photo', m).textContent = e?.message || 'That file could not be read as an image. Choose a JPEG, PNG, or WebP photo.'; }
      };
      $('#k-photo-rm', m).onclick = () => { photo = ''; $('#k-prev img', m)?.remove(); $('#k-photo-rm', m).hidden = true; inp.value = ''; };
    },
    validate: d => editable ? ({ title: d.title.trim().length < 3 && 'Enter a task name (at least 3 characters).', assignee: !String(d.assignee || '').trim() && 'Enter an assignee name.', due: !d.due && 'Choose a due date.', time: !d.time && 'Choose a due time.' }) : {},
    submit: async d => {
      const base = id ? t : { id: nextId('T', tasks()), status: 'Open', createdAt: Date.now() };
      const doc = editable ? { ...base, ...d, title: d.title.trim(), assignee: String(d.assignee || '').trim(), photo } : { ...base, notes: d.notes, photo };
      await Store.put('tasks', doc); return id ? 'Task updated.' : `Task assigned to ${doc.assignee}.`;
    },
    footer: id && editable ? `<button type="button" class="btn" data-act="task-delete" data-id="${esc(id)}">${ic('trash')}Delete</button>` : ''
  });
}
async function toggleTask(id) {
  const t = Store.get('tasks', id); if (!t) return;
  const done = t.status !== 'Done';
  try {
    await Store.put('tasks', { ...t, status: done ? 'Done' : 'Open', completedAt: done ? Date.now() : null, completedBy: done ? currentUser().name : null });
    if (done && t.recurrence !== 'none' && !tasks().some(x => x.seriesOf === (t.seriesOf || t.id) && x.status !== 'Done' && x.due > t.due)) {
      const nd = iso(parseD(t.due).getTime() + (t.recurrence === 'daily' ? 1 : 7) * DAY);
      await Store.put('tasks', { ...t, id: nextId('T', tasks()), due: nd, status: 'Open', completedAt: null, completedBy: null, photo: '', seriesOf: t.seriesOf || t.id, demo: false, createdAt: Date.now() });
      toast(`Completed. Next "${t.title}" scheduled for ${fmtD(nd)}.`);
    } else toast(done ? 'Task marked as done.' : 'Task reopened.');
  } catch (e) { toast(errText(e), 'error'); }
}
function downscale(file, max, quality = 0.84) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', quality)); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
    img.src = url;
  });
}

/* ================= Inventory ================= */
const INV_CATS = ['Seeds', 'Nutrients', 'Growing media', 'Packaging', 'Equipment'];
function vInventory() {
  const q = ui.invQ.toLowerCase();
  const allInv = inventory();
  const items = allInv.filter(i => (ui.invCat === 'All' || i.category === ui.invCat) && (!q || `${i.name} ${i.supplier}`.toLowerCase().includes(q))).sort((a, b) => (a.qty / a.threshold) - (b.qty / b.threshold));
  const low = allInv.filter(i => +i.qty < +i.threshold);
  const value = allInv.reduce((s, i) => s + i.qty * (i.cost || 0), 0);
  const mv = Store.all('movements').sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 12);
  return `${pageHead('Smart Inventory', 'Seeds, nutrients, growing media, packaging and equipment.', `${allInv.length ? `<button class="btn" data-act="move-new">${ic('repeat')}Record stock movement</button>` : ''}${can('inventory') ? `<button class="btn primary" data-act="inv-new">${ic('plus')}Add item</button>` : ''}`)}
  <div class="stats">${[['Items tracked', allInv.length], ['Below reorder point', low.length], ['Stock value (at cost)', money(value)], ['Suppliers', new Set(allInv.map(i => i.supplier)).size]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${low.length ? `<div class="notice warn">${ic('alert')}<div><b>${low.length} item${low.length > 1 ? 's' : ''} below reorder point:</b> ${low.map(i => esc(i.name)).join(', ')}. Supplier ordering requires a purchasing integration that is not connected.</div></div>` : ''}
  ${card('Stock', `<div class="toolbar" style="margin-bottom:12px"><label class="sr" for="iv-q">Search inventory</label><input id="iv-q" class="input grow" type="search" placeholder="Search items or suppliers" value="${esc(ui.invQ)}" data-filter="invQ">${seg('invCat', [['All', 'All'], ...INV_CATS.map(c => [c, c])], ui.invCat, 'Category')}</div>
  ${items.length ? `<div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Category</th><th class="r">On hand</th><th class="r">Reorder at</th><th>Level</th><th>Supplier</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${items.map(i => { const ratio = i.qty / Math.max(1, i.threshold), st = ratio < 0.5 ? 'crit' : ratio < 1 ? 'warn' : 'ok'; return `<tr><td><b>${esc(i.name)}</b><div class="small muted mono">${esc(i.id)}</div></td><td>${esc(i.category)}</td><td class="r num"><b>${num(i.qty)}</b> ${esc(i.unit)}</td><td class="r num">${num(i.threshold)} ${esc(i.unit)}</td><td><div class="ready"><div class="bar" style="width:80px"><i class="${st === 'ok' ? '' : st}" style="width:${clamp(ratio / 2 * 100, 3, 100)}%"></i></div>${st === 'ok' ? '<span class="badge b-ok">In stock</span>' : st === 'warn' ? '<span class="badge b-warn">Reorder</span>' : '<span class="badge b-crit">Critical</span>'}</div></td><td class="small">${esc(i.supplier)}</td><td class="r"><div class="toolbar" style="justify-content:flex-end;flex-wrap:nowrap"><button class="btn sm" data-act="move-new" data-id="${esc(i.id)}">Movement</button>${can('inventory') ? `<button class="btn sm ghost" data-act="inv-edit" data-id="${esc(i.id)}" aria-label="Edit ${esc(i.name)}">${ic('edit')}</button>` : ''}</div></td></tr>`; }).join('')}</tbody></table></div>` : allInv.length ? empty('box', 'No items match', 'Try another category or search term.') : empty('box', 'No inventory items yet', 'Add inventory items in Live Data mode to track stock levels and reorder alerts.', can('inventory') ? `<button class="btn primary" data-act="inv-new">${ic('plus')}Add item</button>` : '')}`, { sub: `${items.length} items` })}
  ${card('Recent stock movements', mv.length ? `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Item</th><th>Type</th><th class="r">Quantity</th><th>Note</th><th>By</th></tr></thead><tbody>${mv.map(m => { const it = Store.get('inventory', m.itemId); return `<tr><td class="num">${fmtD(m.date)}</td><td>${esc(it ? it.name : m.itemId)}</td><td><span class="badge ${m.type === 'In' ? 'b-ok' : m.type === 'Out' ? 'b-info' : 'b-mute'}">${m.type === 'In' ? 'Received' : m.type === 'Out' ? 'Used' : 'Adjusted'}</span></td><td class="r num">${m.type === 'Out' ? '−' : m.type === 'In' ? '+' : '='}${num(m.qty)} ${esc(it?.unit || '')}</td><td class="small">${esc(m.note)}</td><td class="small muted">${esc(m.by)}</td></tr>`; }).join('')}</tbody></table></div>` : empty('repeat', 'No movements yet', 'Record stock received or used.'))}`;
}
function invForm(id) {
  const i = id ? Store.get('inventory', id) : { name: '', category: 'Nutrients', qty: '', unit: 'kg', threshold: '', supplier: '', cost: '' };
  if (!i) return;
  openModal({
    title: id ? 'Edit item' : 'Add inventory item', submitLabel: id ? 'Save changes' : 'Add item',
    body: `<div class="form-grid"><div class="full">${fld('Item name', `<input id="i-name" name="name" value="${esc(i.name)}">`, 'name')}</div>
      ${fld('Category', `<select id="i-cat" name="category">${INV_CATS.map(c => `<option ${i.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>`, 'category')}
      ${fld('Unit', `<input id="i-unit" name="unit" value="${esc(i.unit)}" placeholder="kg, L, seeds, units">`, 'unit')}
      ${fld(id ? 'On hand' : 'Opening quantity', `<input id="i-qty" name="qty" type="number" min="0" step="any" value="${esc(i.qty)}" ${id ? 'readonly' : ''}>`, 'qty', id ? 'Change quantities with a stock movement so the history stays accurate.' : '')}
      ${fld('Reorder threshold', `<input id="i-th" name="threshold" type="number" min="0" step="any" value="${esc(i.threshold)}">`, 'threshold')}
      ${fld('Supplier', `<input id="i-sup" name="supplier" value="${esc(i.supplier)}">`, 'supplier')}
      ${fld('Unit cost ($)', `<input id="i-cost" name="cost" type="number" min="0" step="0.01" value="${esc(i.cost)}">`, 'cost')}</div>`,
    validate: d => ({ name: d.name.trim().length < 2 && 'Enter the item name.', unit: !d.unit.trim() && 'Enter a unit, such as kg or units.', qty: !(d.qty !== '' && +d.qty >= 0) && 'Enter a quantity of 0 or more.', threshold: !(d.threshold !== '' && +d.threshold >= 0) && 'Enter a reorder threshold of 0 or more.', supplier: !d.supplier.trim() && 'Enter the supplier name.' }),
    submit: async d => { const doc = { ...(id ? i : { id: nextId('I', inventory()) }), ...d, qty: +d.qty, threshold: +d.threshold, cost: +d.cost || 0 }; await Store.put('inventory', doc); return `${doc.name} saved.`; },
    footer: id && can('inventory') ? `<button type="button" class="btn" data-act="inv-delete" data-id="${esc(id)}">${ic('trash')}Delete</button>` : ''
  });
}
function moveForm(itemId) {
  const items = inventory();
  openModal({
    title: 'Record stock movement', submitLabel: 'Save movement',
    body: `<div class="form-grid"><div class="full">${fld('Item', `<select id="mv-item" name="itemId">${items.map(i => `<option value="${i.id}" ${i.id === itemId ? 'selected' : ''}>${esc(i.name)} (${num(i.qty)} ${esc(i.unit)})</option>`).join('')}</select>`, 'itemId')}</div>
      ${fld('Movement', `<select id="mv-type" name="type"><option value="Out">Used / issued</option><option value="In">Received</option>${can('inventory') ? '<option value="Adjust">Stock count adjustment</option>' : ''}</select>`, 'type')}
      ${fld('Quantity', `<input id="mv-qty" name="qty" type="number" min="0" step="any" inputmode="decimal">`, 'qty', 'For an adjustment, enter the counted quantity.')}
      ${fld('Date', `<input id="mv-date" name="date" type="date" value="${dOff(0)}" max="${dOff(0)}">`, 'date')}
      ${fld('Note', `<input id="mv-note" name="note" placeholder="PO number, batch, tank…">`, 'note')}</div>`,
    validate: d => { const it = Store.get('inventory', d.itemId); return { qty: !(d.qty !== '' && +d.qty >= 0 && (d.type === 'Adjust' || +d.qty > 0)) ? 'Enter a quantity greater than 0.' : d.type === 'Out' && +d.qty > +it.qty && `Only ${num(it.qty)} ${it.unit} on hand. Record a smaller quantity or receive stock first.`, date: !d.date && 'Choose a date.' }; },
    submit: async d => {
      const it = Store.get('inventory', d.itemId), q = +d.qty;
      const nq = d.type === 'In' ? +it.qty + q : d.type === 'Out' ? +it.qty - q : q;
      await Store.put('movements', { id: uid('M'), itemId: it.id, type: d.type, qty: q, date: d.date, note: d.note, by: currentUser().name });
      await Store.put('inventory', { ...it, qty: +nq.toFixed(3) });
      return `${it.name}: now ${num(nq)} ${it.unit}.`;
    }
  });
}

/* ================= Alerts ================= */
function vAlerts() {
  const all = alerts(), shown = all.filter(a => ui.showResolved || a.state !== 'resolved');
  const act = all.filter(a => a.state !== 'resolved');
  const live = isLiveMode();
  return `${pageHead('Smart Alerts', 'Prioritized issues from sensors, crop observations, inventory and tasks. Critical first.', `${dataModeTag()}<label class="split" style="font-weight:600"><input type="checkbox" id="showResolved" ${ui.showResolved ? 'checked' : ''} style="width:18px;height:18px"> Show resolved</label>`)}
  <div class="stats">${[['Critical', act.filter(a => a.sev === 'crit').length], ['Attention', act.filter(a => a.sev === 'warn').length], ['Acknowledged', act.filter(a => a.state === 'acknowledged').length], ['Resolved', all.filter(a => a.state === 'resolved').length]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  <div class="notice">${ic('info')}<div>${live ? 'Live Data mode active: sensor alerts trigger from connected sensors and manual meter logs checked against each greenhouse’s target ranges.' : 'Sensor alerts come from demo readings checked against each greenhouse\'s target ranges.'} Push notifications by SMS or email need a messaging integration that is not connected.</div></div>
  ${card('Alert feed', alertFeed(shown, true), { sub: `${shown.length} alerts` })}`;
}
async function setAlert(id, status) {
  try { await Store.put('alerts', { id, status }); toast(status === 'acknowledged' ? 'Alert acknowledged.' : status === 'resolved' ? 'Alert marked as resolved.' : 'Alert reopened.'); }
  catch (e) { toast(errText(e), 'error'); }
}

/* ================= AI: Crop Nutrition ================= */
function vNutrition() {
  const ghs = greenhouses();
  if (!ghs.length) {
    return `${pageHead('Crop Nutrition', 'Nutrient suggestions from crop stage and recorded pH and EC.', aiModeTag())}
    <div class="card">${empty('flask', 'No greenhouses configured yet', 'Add a greenhouse in Greenhouse Management to calculate dosing recommendations.', can('targets') ? `<button class="btn primary" data-act="gh-new">${ic('plus')}Add greenhouse</button>` : '')}</div>`;
  }
  const g = ghById(ui.nutGh) || ghs[0];
  const id = g.id;
  ui.nutGh = id;
  const r = readings(id), mr = manualReading(id), live = isLiveMode();
  const ph = mr?.ph != null ? mr.ph : (r?.ph ?? null);
  const ec = mr?.ec != null ? mr.ec : (r?.ec ?? null);
  const hasNut = ph !== null && ec !== null;
  const src = mr ? `manual reading by ${esc(mr.by)}, ${fmtDT(mr.at)}` : live ? 'live sensor reading' : 'demo sensor reading';
  const bs = activeBatches().filter(b => b.ghId === id);
  const crop = bs[0]?.crop || g.main, c = cropDef(crop);
  const stage = bs.sort((a, b) => STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage))[0]?.stage || 'Vegetative';
  const ecT = (c.ec && (c.ec[stage] || c.ec.Vegetative)) || [1.0, 1.8];
  const phT = c.ph || [5.5, 6.5];
  const recs = [];
  const res = Number(g.reservoirLiters) || 1800; // dynamic reservoir volume litres
  if (hasNut) {
    if (ph > phT[1]) { const delta = ph - (phT[0] + phT[1]) / 2; recs.push({ sev: 'warn', title: `Lower pH by about ${num(delta, 2)}`, why: `pH ${ph} is above the ${phT[0]}–${phT[1]} range for ${c.label}. Above 6.5, iron and manganese become less available, which shows as interveinal yellowing on new leaves.`, how: `Add pH Down (phosphoric 75%) in steps of about ${Math.round(res / 1000 * 2 * delta / 0.3)} mL for the ${num(res)} L reservoir, circulate 30 minutes and re-measure before adding more.` }); }
    else if (ph < phT[0]) { const delta = (phT[0] + phT[1]) / 2 - ph; recs.push({ sev: 'warn', title: `Raise pH by about ${num(delta, 2)}`, why: `pH ${ph} is below ${phT[0]}. Low pH can lock out calcium and magnesium and stress roots.`, how: 'Add pH Up (potassium hydroxide) in small steps, circulate 30 minutes and re-measure.' }); }
    else recs.push({ sev: 'ok', title: 'pH is within range', why: `pH ${ph} sits inside ${phT[0]}–${phT[1]} for ${c.label}.`, how: 'No change. Keep checking daily; pH tends to drift up as plants take up nitrate.' });
    if (ec < ecT[0]) { const add = Math.round((ecT[0] + ecT[1]) / 2 * 10 - ec * 10) / 10; recs.push({ sev: 'warn', title: `Increase EC by about ${num(add, 1)} mS/cm`, why: `EC ${ec} is below the ${ecT[0]}–${ecT[1]} mS/cm target for the ${stage.toLowerCase()} stage. ${stage === 'Fruiting' || stage === 'Flowering' ? 'Fruiting plants need more potassium and calcium for fruit set and sugar content.' : 'Underfeeding slows growth and pales foliage.'}`, how: `Add nutrient A and B in equal parts. Roughly ${num(add * res * 0.5 / 1000 * 1.0, 1)} kg of each per ${num(res)} L raises EC by ${num(add, 1)}; dose half, mix, then re-measure.` }); }
    else if (ec > ecT[1]) recs.push({ sev: 'warn', title: 'Reduce EC', why: `EC ${ec} is above ${ecT[1]} mS/cm. High salinity can cause tip burn and limit water uptake.`, how: 'Top up with fresh water and re-measure. Dilute in 10% steps.' });
    else recs.push({ sev: 'ok', title: 'EC is within range', why: `EC ${ec} sits inside ${ecT[0]}–${ecT[1]} mS/cm for the ${stage.toLowerCase()} stage.`, how: 'Keep the current feed strength.' });
  }
  if (r?.wt != null && r.wt > 22) recs.push({ sev: 'warn', title: 'Cool the nutrient solution', why: `Water temperature ${r.wt} °C reduces dissolved oxygen and raises root-rot risk.`, how: 'Shade the reservoir or run the chiller; target 18–21 °C.' });
  if (r?.res != null && r.res < 40) recs.push({ sev: 'crit', title: 'Refill the reservoir before adjusting', why: `Reservoir level is ${r.res}%. Small volumes swing in pH and EC quickly, so corrections made now will overshoot.`, how: 'Refill to at least 70%, let it mix, then measure pH and EC again before dosing.' });
  const adjBody = hasNut
    ? `<div style="display:grid;gap:10px">${recs.map(x => `<div class="alert ${x.sev === 'ok' ? '' : x.sev}" style="grid-template-columns:auto 1fr"><span class="sev-ico" style="${x.sev === 'ok' ? 'background:var(--ok-bg);color:var(--ok)' : ''}">${ic(x.sev === 'ok' ? 'check' : 'flask')}</span><div><b>${esc(x.title)}</b><p style="margin-top:4px"><b style="display:inline;color:var(--fg)">Why:</b> ${esc(x.why)}</p><p style="margin-top:4px"><b style="display:inline;color:var(--fg)">How:</b> ${esc(x.how)}</p></div></div>`).join('')}</div>`
    : empty('flask', 'Waiting for pH & EC data', `No live sensor reading or manual meter log is available for ${g.name} yet.`, `<button class="btn primary" data-act="reading-new" data-id="${esc(id)}">${ic('edit')}Log manual reading</button>`);
  return `${pageHead('Crop Nutrition', 'Nutrient suggestions from crop stage and recorded pH and EC.', aiModeTag())}
  <div class="notice">${ic('info')}<div>These suggestions come from a <b>rule-based engine</b> using published hydroponic ranges${live ? ' and your live/manual readings' : ', not a connected AI service'}. Confirm with your agronomist before changing a recipe.</div></div>
  <div class="toolbar">${seg('nutGh', ghs.map(x => [x.id, esc(x.name)]), id, 'Greenhouse')}<button class="btn" data-act="reading-new" data-id="${esc(id)}">${ic('edit')}Log manual reading</button>${can('targets') ? `<button class="btn" data-act="gh-edit" data-id="${esc(id)}">${ic('edit')}Edit reservoir (${num(res)} L)</button>` : ''}</div>
  <div class="grid g-main">
    ${card('Suggested adjustments', adjBody, { sub: `${esc(g.name)} · ${esc(c.label)}` })}
    ${card('Inputs used', `<dl class="kv"><dt>Crop</dt><dd>${esc(c.label)}</dd><dt>Most advanced stage</dt><dd>${esc(stage)}</dd><dt>Batches</dt><dd>${bs.map(b => `${esc(b.id)} (${esc(b.stage)})`).join(', ') || 'None'}</dd><dt>pH</dt><dd class="num">${ph !== null ? `${ph} <span class="small muted">(${src})</span>` : '<span class="muted">No data yet</span>'}</dd><dt>EC</dt><dd class="num">${ec !== null ? `${ec} mS/cm <span class="small muted">(${src})</span>` : '<span class="muted">No data yet</span>'}</dd><dt>Water temp.</dt><dd class="num">${r?.wt != null ? `${r.wt} °C${live ? '' : ' (demo)'}` : '<span class="muted">—</span>'}</dd><dt>Reservoir</dt><dd class="num">${r?.res != null ? `${r.res}% of ${num(res)} L${live ? '' : ' (demo)'}` : `${num(res)} L capacity`}</dd><dt>pH target</dt><dd class="num">${phT[0]}–${phT[1]}</dd><dt>EC target</dt><dd class="num">${ecT[0]}–${ecT[1]} mS/cm for ${stage.toLowerCase()}</dd></dl>
      <h3 style="margin:16px 0 6px">How the engine reasons</h3><ol class="list-plain small"><li>Finds the most advanced growth stage among active batches.</li><li>Looks up the crop's pH range and the stage-specific EC range.</li><li>Uses the newest manual reading if one exists, otherwise the ${live ? 'live' : 'demo'} sensor.</li><li>Flags conditions that make corrections unsafe, such as a low reservoir.</li><li>Sizes doses for the ${num(res)} L reservoir volume and asks you to re-measure.</li></ol>`)}
  </div>`;
}

/* ================= AI: Disease Detection ================= */
function vDisease() {
  const d = ui.disease;
  const batches = activeBatches();
  const hasImg = Boolean(safeImgSrc(d?.img));
  const isBusy = Boolean(d?.busy);
  return `${pageHead('Disease Detection', 'Upload or capture a plant photo for AI-powered visual symptom inspection and preliminary triage.', '<span class="tag live">' + ic('spark') + 'Vision AI</span>')}
  <div class="notice warn">${ic('alert')}<div><b>Preliminary AI screening only.</b> Vision analysis highlights visual symptoms and candidate causes to guide scouting—it is not a confirmed agricultural or laboratory diagnosis.</div></div>
  <div class="grid g-2">
    ${card('Plant image', `
      <div class="drop" id="dropZone">
        <span class="chip-ico">${ic('camera')}</span>
        <b>${hasImg ? 'Replace plant photo' : 'Drop a leaf or plant photo here'}</b>
        <span class="small muted">JPEG, PNG, or WebP · leaves, herbs, crops, trees, or shrubs in clear daylight</span>
        <div class="toolbar" style="justify-content:center">
          <label class="btn" for="dFile">${ic('upload')}Choose photo</label>
          <label class="btn" for="dCamera">${ic('camera')}Capture photo</label>
        </div>
        <input id="dFile" type="file" accept="image/jpeg,image/png,image/webp" class="sr">
        <input id="dCamera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" class="sr">
      </div>
      ${hasImg ? `<div class="dd-preview-wrap">
        <img class="thumb dd-preview-img" src="${esc(safeImgSrc(d.img))}" alt="Uploaded plant specimen">
        <div class="dd-preview-meta">
          <span class="small muted">${esc(d.fileName || 'Uploaded image')}</span>
          <button type="button" class="btn sm" data-act="disease-reset" ${isBusy ? 'disabled' : ''}>Analyze another image</button>
        </div>
      </div>` : ''}
      <div class="form-grid" style="margin-top:12px">
        <div class="full">${fld('Crop batch (optional)', `<select id="dBatch">
          <option value="" ${!d?.batchId ? 'selected' : ''}>General / non-batch plant (tree, shrub, herb, outdoor)</option>
          ${batches.map(b => { const g = ghById(b.ghId); return `<option value="${esc(b.id)}" ${d?.batchId === b.id ? 'selected' : ''}>${esc(b.id)} · ${esc(cropDef(b.crop).label)} · ${esc(g?.code || g?.name || b.ghId)}${esc(String(b.zone || '').slice(1))}</option>`; }).join('')}
        </select>`, 'dBatch')}</div>
        <div class="full">${fld('Visual context notes (optional)', `<input id="dNotes" type="text" maxlength="220" value="${esc(d?.notes || '')}" placeholder="e.g. Yellowing on lower leaves for 3 days, outdoor basil" ${isBusy ? 'disabled' : ''}>`, 'dNotes')}</div>
      </div>
      <div class="toolbar" style="margin-top:14px">
        <button type="button" class="btn primary" data-act="disease-run" ${hasImg && !isBusy ? '' : 'disabled'}>
          ${isBusy ? '<span class="spinner"></span>Analyzing image…' : ic('spark') + (d?.result ? 'Re-analyze image' : 'Analyze plant image')}
        </button>
        ${(hasImg || d?.result || d?.error) ? `<button type="button" class="btn" data-act="disease-reset" ${isBusy ? 'disabled' : ''}>Clear</button>` : ''}
      </div>`)}
    ${card('Assessment', d?.busy
      ? `<div class="dd-loading" role="status" aria-live="polite">
          <span class="spinner dd-spinner-lg"></span>
          <b>Inspecting plant tissue with Vision AI…</b>
          <span class="small muted">Examining lesions, discoloration, pest indicators, and foliage structure.</span>
        </div>`
      : d?.error
        ? `<div class="notice crit">${ic('alert')}<div><b>Analysis unavailable:</b> ${esc(d.error)}</div></div>
           <div class="toolbar" style="margin-top:12px">
             ${hasImg ? `<button type="button" class="btn primary" data-act="disease-run">Try again</button>` : ''}
             <button type="button" class="btn" data-act="disease-reset">Analyze another image</button>
           </div>`
        : d?.result
          ? diseaseResult(d.result)
          : empty('scan', 'No photo analyzed yet', 'Upload or capture a plant photo and click Analyze plant image to inspect symptoms and preliminary causes.'))}
  </div>`;
}
function diseaseResult(r) {
  const confMeta = c => {
    const pct = Math.round(clamp(Number(c) || 0, 0, 1) * 100);
    if (pct >= 70) return { badge: 'b-ok', label: 'High confidence', pct };
    if (pct >= 45) return { badge: 'b-warn', label: 'Moderate confidence', pct };
    if (pct >= 25) return { badge: 'b-mute', label: 'Low confidence', pct };
    return { badge: 'b-mute', label: 'Very low confidence', pct };
  };
  const sevBadge = level => {
    if (level === 'Severe') return 'b-crit';
    if (level === 'Moderate') return 'b-warn';
    if (level === 'Mild') return 'b-info';
    if (level === 'None') return 'b-ok';
    return 'b-mute';
  };
  const qualityBanner = r.imageQuality && r.imageQuality !== 'clear'
    ? `<div class="notice warn" style="margin-bottom:12px">${ic('alert')}<div><b>${r.imageQuality === 'unusable' ? 'Image unsuitable for reliable screening.' : 'Uncertain image clarity or inconclusive symptoms.'}</b> Consider capturing a closer, sharply lit photo of the affected leaf area.</div></div>`
    : '';
  const hasSelectedBatch = Boolean(ui.disease?.batchId && Store.get('batches', ui.disease.batchId));

  return `<div class="dd-res-head">
      <div class="split">
        <span class="tag live">${ic('spark')}Vision AI · Preliminary</span>
        ${r.plantIdentified ? `<span class="tag">${esc(r.plantIdentified)}</span>` : ''}
      </div>
      <span class="small muted">${fmtDT(r.analyzedAt || Date.now())}</span>
    </div>
    ${qualityBanner}
    ${r.summary ? `<p class="dd-summary">${esc(r.summary)}</p>` : ''}

    <div class="dd-section">
      <div class="dd-section-hdr">
        <h3>Visually observed symptoms</h3>
        <span class="small muted">Direct visual findings</span>
      </div>
      <ul class="list-plain dd-symptom-list">
        ${(r.observedSymptoms || []).map(s => `<li>${esc(s)}</li>`).join('')}
      </ul>
    </div>

    <div class="dd-section">
      <div class="dd-section-hdr">
        <h3>AI-generated preliminary hypotheses</h3>
        <span class="small muted">Not a confirmed diagnosis</span>
      </div>
      <div class="dd-hyp-list">
        ${(r.hypotheses || []).map(h => {
          const cm = confMeta(h.confidence);
          return `<div class="dd-hyp-card">
            <div class="dd-hyp-top">
              <div>
                <b>${esc(h.condition)}</b>
                ${h.category ? `<span class="tag sm" style="margin-left:6px">${esc(h.category)}</span>` : ''}
              </div>
              <span class="badge ${cm.badge}">${cm.label} · ${cm.pct}%</span>
            </div>
            <div class="bar dd-conf-bar" aria-hidden="true"><i class="${cm.pct >= 70 ? '' : cm.pct >= 45 ? 'warn' : ''}" style="width:${cm.pct}%"></i></div>
            ${h.visualEvidence ? `<p class="small dd-evidence"><b>Visual evidence:</b> ${esc(h.visualEvidence)}</p>` : ''}
            ${h.confidenceRationale ? `<p class="small muted" style="margin-top:4px">${esc(h.confidenceRationale)}</p>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>

    ${r.severity ? `<div class="dd-section">
      <div class="dd-section-hdr">
        <h3>Severity assessment</h3>
        <span class="badge ${sevBadge(r.severity.level)}">${esc(r.severity.level)}</span>
      </div>
      <div class="dd-sev-box">
        <p class="small">${esc(r.severity.assessment)}</p>
      </div>
    </div>` : ''}

    <div class="dd-section">
      <div class="dd-section-hdr">
        <h3>Recommended next steps</h3>
      </div>
      <ol class="list-plain">${(r.recommendedSteps || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    </div>

    ${r.disclaimer ? `<p class="small muted dd-disclaimer">${esc(r.disclaimer)}</p>` : ''}

    <div class="toolbar" style="margin-top:14px">
      <button type="button" class="btn primary" data-act="disease-reset">${ic('camera')}Analyze another image</button>
      ${can('tasks') ? `<button type="button" class="btn" data-act="disease-task">${ic('clipboard')}Create inspection task</button>` : ''}
      ${hasSelectedBatch ? `<button type="button" class="btn" data-act="disease-obs">${ic('edit')}Add to batch observations</button>` : ''}
    </div>`;
}
async function analyzeDiseaseImage() {
  const d = ui.disease;
  if (!d || !safeImgSrc(d.img)) return;
  d.busy = true;
  d.error = null;
  render();

  try {
    const b = d.batchId ? Store.get('batches', d.batchId) : null;
    const batchContext = {};
    if (b) {
      batchContext.cropLabel = cropDef(b.crop).label;
      batchContext.stage = b.stage;
      batchContext.greenhouse = ghName(b.ghId);
      const r = readings(b.ghId);
      if (r) batchContext.readings = { ph: r.ph, ec: r.ec, temp: r.temp, hum: r.hum };
    }
    if (d.notes && d.notes.trim()) {
      batchContext.notes = d.notes.trim();
    }

    const headers = { 'Content-Type': 'application/json' };
    if (!AuthState.isDemoAuth && AuthState.session?.access_token) {
      headers.Authorization = `Bearer ${AuthState.session.access_token}`;
    }

    const response = await fetch('/api/disease-analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imageDataUrl: d.img,
        batchContext: Object.keys(batchContext).length ? batchContext : null,
      }),
    });
    const out = await response.json().catch(() => ({}));
    if (!response.ok || !out || !Array.isArray(out.hypotheses)) {
      throw new Error(out?.error || 'Could not analyze the plant image. Please try again.');
    }
    d.result = out;
  } catch (e) {
    d.error = e?.message || 'Unable to reach Vision AI analysis right now. Please try again.';
  }
  d.busy = false;
  render();
}
function resetDiseaseAnalysis() {
  ui.disease = { batchId: ui.disease?.batchId || '' };
  render();
}
async function loadDiseaseFile(file) {
  if (!file) return;
  try {
    validateImageUpload(file);
  } catch (e) {
    ui.disease = { error: e?.message || 'Choose a JPEG, PNG, or WebP photo under 15 MB.' };
    return render();
  }
  try {
    const img = await downscale(file, 1280, 0.86);
    const el = new Image();
    el.src = img;
    await el.decode();
    ui.disease = {
      img,
      fileName: file.name || 'Captured plant photo',
      batchId: $('#dBatch')?.value ?? ui.disease?.batchId ?? '',
      notes: $('#dNotes')?.value ?? ui.disease?.notes ?? '',
    };
  } catch (e) {
    ui.disease = { error: 'The photo could not be read. Try a different JPEG, PNG, or WebP file.' };
  }
  render();
}

/* ================= AI: Farm Assistant ================= */
function vAssistant() {
  const sugg = [
    'Which greenhouse needs attention right now?',
    'Which inventory items should I reorder?',
    'What is ready to harvest this week?',
    'What agricultural technology is best for vertical farming?',
    'How do I prevent blossom end rot in tomatoes?',
    'What features does this platform have?'
  ];
  return `${pageHead('Farm Assistant', 'Your agriculture and farm operations assistant. Instant data retrieval for farm records, and AI intelligence for agricultural guidance and technology recommendations.')}
  
  ${card('Conversation', `<div class="chat" id="chatLog" aria-live="polite">${ui.chat.length ? ui.chat.map(m => {
    const safeSources = Array.isArray(m.sources) ? m.sources.map(s => ({ uri: safeHttpUrl(s?.uri), title: s?.title || s?.uri })).filter(s => s.uri) : [];
    return `<div class="msg ${m.role === 'user' ? 'user' : 'bot'}">${m.role === 'user' ? esc(m.text) : linkify(m.text)}${m.role !== 'user' ? `<span class="src">${m.src === 'gemini' ? '<span class="tag live">Gemini AI</span>' : m.src === 'direct' ? '<span class="tag live" style="background:var(--ok-bg);color:var(--ok)">Direct Data (Instant)</span>' : m.src === 'kb' ? '<span class="tag live" style="background:var(--ok-bg);color:var(--ok)">Knowledge Base (Instant)</span>' : m.src === 'claude' ? '<span class="tag live">Claude</span>' : m.src === 'error' ? '<span class="tag warn">API Error</span>' : m.src === 'pending' ? '<span class="tag">Thinking…</span>' : '<span class="tag sim">Simulated</span>'}</span>` : ''}${safeSources.length ? `<div class="sources small muted" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px"><span style="width:100%;font-weight:600">Web Sources:</span>${safeSources.map(s => `<a href="${esc(s.uri)}" target="_blank" rel="noopener noreferrer" class="tag sm" style="text-decoration:underline">${esc(s.title)}</a>`).join('')}</div>` : ''}</div>`;
  }).join('') : empty('chat', 'Ask a question about your farm or agriculture', 'Try one of the suggestions below.')}</div>
    <div class="assistant-prompts">${sugg.map(s => `<button class="btn sm wrap" data-act="ask" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    <form id="chatForm" class="toolbar" novalidate><label class="sr" for="chatIn">Your question</label><input id="chatIn" class="input grow" placeholder="e.g. Which supplies are low, or how does NFT hydroponics work?" autocomplete="off" ${ui.chatBusy ? 'disabled' : ''}><button class="btn primary" type="submit" ${ui.chatBusy ? 'disabled' : ''}>${ui.chatBusy ? '<span class="spinner"></span>' : ic('send')}Send</button>${ui.chat.length ? '<button class="btn" type="button" data-act="chat-clear">Clear</button>' : ''}</form>`)}`;
}
function recordLink(id) {
  if (/^B-\d+$/.test(id) && Store.get('batches', id)) return `<button class="tag" style="cursor:pointer" data-act="batch" data-id="${esc(id)}">${esc(id)}</button>`;
  if (/^T-\d+$/.test(id) && Store.get('tasks', id)) return `<button class="tag" style="cursor:pointer" data-act="task-edit" data-id="${esc(id)}">${esc(id)}</button>`;
  if (/^I-\d+$/.test(id) && Store.get('inventory', id)) return `<a class="tag" href="#inventory">${esc(id)}</a>`;
  if (/^H-\d+$/.test(id) && Store.get('harvests', id)) return `<button class="tag" style="cursor:pointer" data-act="harvest-view" data-id="${esc(id)}">${esc(id)}</button>`;
  if (/^SO-\d+$/.test(id) && Store.get('orders', id)) return `<a class="tag" href="#sales">${esc(id)}</a>`;
  const g = greenhouses().find(x => x.name.toLowerCase() === String(id || '').toLowerCase());
  if (g) return `<a class="tag" href="#${esc(g.id)}">${esc(g.name)}</a>`;
  return esc(id);
}
const linkify = t => esc(t).replace(/\[([^\]]{1,48})\]/g, (full, id) => {
  if (/^[A-Za-z]{1,2}-\d+$/.test(id) || greenhouses().some(x => x.name.toLowerCase() === id.toLowerCase())) {
    return recordLink(id);
  }
  return full;
}).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
function farmContext() {
  const k = kpis(), live = isLiveMode(), ghs = greenhouses();
  return JSON.stringify({
    date: dOff(0), farm: activeFarmName(), location: activeFarmLocation(), dataMode: live ? 'live' : 'simulated',
    note: live ? 'Live Data mode active; sensor readings are null where sensors or manual logs are not yet available.' : 'Sensor readings are demo data; no devices are connected.',
    greenhouses: ghs.map(g => ({ id: g.id, name: g.name, system: g.system, area: g.area, status: ST_LABEL[ghStatus(g.id)], readings: readings(g.id), targets: targets(g.id), plants: ghPlants(g.id), crops: ghCrops(g.id) })),
    batches: activeBatches().map(b => ({ id: b.id, crop: cropDef(b.crop).label, gh: ghName(b.ghId), zone: b.zone, plants: b.plants, stage: b.stage, health: b.health, expectedHarvest: b.expectedHarvest, estKg: b.estKg, lastObservation: (b.observations || []).slice(-1)[0] })),
    openTasks: tasks().filter(t => t.status !== 'Done').map(t => ({ id: t.id, title: t.title, assignee: t.assignee, gh: ghName(t.ghId) || 'Farmwide', priority: t.priority, due: t.due + ' ' + t.time, overdue: isOverdue(t) })),
    inventory: inventory().map(i => ({ id: i.id, name: i.name, category: i.category, qty: i.qty, unit: i.unit, reorderAt: i.threshold, supplier: i.supplier, cost: i.cost, belowReorder: Number(i.qty) < Number(i.threshold) })),
    alerts: activeAlerts().map(a => ({ severity: ST_LABEL[a.sev] || a.sev, title: a.title })),
    recentHarvests: harvests().slice(0, 10).map(h => ({ id: h.id, crop: cropDef(h.crop).label, date: h.date, estKg: h.estKg, actualKg: h.actualKg, grade: h.grade })),
    projectedRevenue30d: Math.round(k.rev),
    orders: Store.all('orders').map(o => ({ id: o.id, status: o.status, customer: o.customer, crop: cropDef(o.crop).label, kg: o.kg, pricePerKg: o.pricePerKg, date: o.date })),
    expenses: Store.all('expenses').slice(0, 10).map(ex => ({ id: ex.id, amount: ex.amount, date: ex.date, category: ex.category, note: ex.note })),
  });
}

/* ================= Knowledge Base & Hybrid Logic Layer ================= */
let KB_DATA = null;
let KB_FETCHING = null;

async function getKnowledgeBase() {
  if (KB_DATA) return KB_DATA;
  if (!KB_FETCHING) {
    KB_FETCHING = fetch('/knowledge_base.json')
      .then(r => r.ok ? r.json() : [])
      .then(data => { KB_DATA = data; return data; })
      .catch(() => { KB_DATA = []; return []; });
  }
  return KB_FETCHING;
}

// Pre-fetch knowledge_base.json in the background for instant availability
getKnowledgeBase();

/**
 * Checks for local keywords or matching questions in 'knowledge_base.json'.
 * Implements the hybrid response-handling logic layer before calling the Gemini API.
 */
function checkKnowledgeBase(q, kbList = KB_DATA) {
  if (!q || !kbList || !Array.isArray(kbList) || !kbList.length) return null;
  const sClean = q.toLowerCase().replace(/[?!.,;:()'"]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!sClean) return null;
  const qWords = sClean.split(' ').filter(w => w.length > 2);

  // 1. Question matching pass (exact match, substring inclusion, or high token overlap)
  for (const item of kbList) {
    if (!item || !Array.isArray(item.questions)) continue;
    for (const question of item.questions) {
      const qNorm = question.toLowerCase().replace(/[?!.,;:()'"]/g, ' ').replace(/\s+/g, ' ').trim();
      if (sClean === qNorm) {
        return { answer: item.answer, matchedOn: question, matchType: 'exact_question', id: item.id };
      }
      if (sClean.length > 10 && (sClean.includes(qNorm) || qNorm.includes(sClean))) {
        return { answer: item.answer, matchedOn: question, matchType: 'substring_question', id: item.id };
      }
      const itemWords = qNorm.split(' ').filter(w => w.length > 2);
      if (itemWords.length >= 3 && qWords.length >= 3) {
        const matches = qWords.filter(w => itemWords.includes(w)).length;
        if (matches / qWords.length >= 0.7 || matches / itemWords.length >= 0.7) {
          return { answer: item.answer, matchedOn: question, matchType: 'token_overlap', id: item.id };
        }
      }
    }
  }

  // 2. Keyword matching pass (phrase inclusion or distinct technical keyword boundary)
  for (const item of kbList) {
    if (!item || !Array.isArray(item.keywords)) continue;
    for (const kw of item.keywords) {
      const kwNorm = kw.toLowerCase().trim();
      if (!kwNorm) continue;
      if (kwNorm.includes(' ')) {
        if (sClean.includes(kwNorm)) {
          return { answer: item.answer, matchedOn: kw, matchType: 'keyword_phrase', id: item.id };
        }
      } else {
        const regex = new RegExp(`(^|\\s)${kwNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
        if (regex.test(sClean)) {
          return { answer: item.answer, matchedOn: kw, matchType: 'keyword_word', id: item.id };
        }
      }
    }
  }

  return null;
}

/**
 * Hybrid Query Classifier & Direct Retriever:
 * Evaluates queries against live platform records and structured platform features.
 * Returns an instant string answer if readily available (0ms latency, 0 tokens),
 * or returns null if the question requires LLM reasoning/general agricultural intelligence.
 */
function classifyAndRetrieve(q) {
  const s = q.toLowerCase().trim();
  const ghs = greenhouses();
  const team = teamMembers();
  const cropsObj = cropsMap();

  // 1. Direct Record ID Lookup: [B-xxx], [T-xxx], [I-xxx], [H-xxx], [SO-xxx], [Greenhouse X]
  const idm = q.match(/\b([BTI]|SO|H)-\d+\b/i);
  if (idm) {
    const id = idm[0].toUpperCase();
    const b = Store.get('batches', id), t = Store.get('tasks', id), i = Store.get('inventory', id), h = Store.get('harvests', id);
    if (b) {
      const obs = (b.observations || []).slice(-1)[0];
      return `**Crop Batch [${b.id}] Details:**\n• **Crop:** ${cropDef(b.crop).label}${b.variety ? ` (${b.variety})` : ''}\n• **Location:** [${ghName(b.ghId)}], Zone ${b.zone}\n• **Population:** ${num(b.plants)} plants\n• **Stage & Health:** ${b.stage} stage (${readiness(b)}% ready), health score **${b.health}%**\n• **Planted:** ${fmtD(b.plantedOn)} | **Expected Harvest:** ${fmtD(b.expectedHarvest)} (~${num(b.estKg)} kg)${obs ? `\n• **Latest Observation:** "${obs.note}" (${obs.by}, ${fmtD(obs.date)})${obs.flag ? ` [Alert: ${obs.flag}]` : ''}` : ''}`;
    }
    if (t) {
      return `**Work Order [${t.id}] Details:**\n• **Title:** "${t.title}"\n• **Status:** ${t.status} ${isOverdue(t) ? '(OVERDUE)' : ''}\n• **Assignee:** ${t.assignee}\n• **Location:** ${t.ghId ? `[${ghName(t.ghId)}]` : 'Farmwide'}\n• **Priority:** ${t.priority}\n• **Due Date:** ${fmtD(t.due)} at ${fmtT(t.time)}${t.recurrence && t.recurrence !== 'none' ? ` (Repeats: ${t.recurrence})` : ''}${t.notes ? `\n• **Notes:** ${t.notes}` : ''}`;
    }
    if (i) {
      const isLow = Number(i.qty) < Number(i.threshold);
      return `**Inventory Item [${i.id}] Details:**\n• **Name:** ${i.name}\n• **Category:** ${i.category}\n• **Stock on Hand:** ${num(i.qty)} ${i.unit}\n• **Reorder Point:** ${num(i.threshold)} ${i.unit}\n• **Status:** ${isLow ? '⚠️ **Below Reorder Threshold (Reorder Needed)**' : '✓ Stock Level Nominal'}\n• **Supplier:** ${i.supplier || 'Standard Supply'}\n• **Unit Cost:** $${num(i.cost, 2)}`;
    }
    if (h) {
      return `**Harvest Record [${h.id}] Details:**\n• **Crop:** ${cropDef(h.crop).label}\n• **Harvest Date:** ${fmtD(h.date)}\n• **Location:** [${ghName(h.ghId)}], Zone ${h.zone}\n• **Yield:** ${num(h.actualKg)} kg actual (Plan: ${num(h.estKg)} kg)\n• **Quality Grade:** ${h.grade}${h.notes ? `\n• **Notes:** ${h.notes}` : ''}`;
    }
    const o = Store.get('orders', id);
    if (o) {
      return `**Sales Order [${o.id}] Details:**\n• **Customer:** ${o.customer}\n• **Crop & Volume:** ${num(o.kg)} kg of ${cropDef(o.crop).label}\n• **Price:** $${num(o.pricePerKg, 2)}/kg (Total: $${num(o.kg * o.pricePerKg, 2)})\n• **Order Date:** ${fmtD(o.date)}\n• **Status:** ${o.status}\n• **Delivery:** ${o.delivery?.status || 'Scheduled'} (${o.delivery?.vehicle || 'Van'})`;
    }
  }

  // Check specific Greenhouse name or code lookup dynamically
  const ghByQuery = ghs.find(x => s.includes(x.name.toLowerCase()) || (x.code && new RegExp(`\\bgh-${x.code.toLowerCase()}\\b`, 'i').test(s)));
  if (ghByQuery && (s.includes('status') || s.includes('reading') || s.includes('sensor') || s.includes('how is') || s.includes('temperature') || s.includes('ph') || s.includes('condition') || s.includes('detail'))) {
    const g = ghByQuery;
    const r = readings(g.id), t = targets(g.id), st = ghStatus(g.id), live = isLiveMode();
    if (!r) {
      return `**[${g.name}] Current Environmental Status:**\n• **Overall Status:** ${ST_LABEL[st]} (${g.system}, ${g.area} m²)\n• **Telemetry:** Waiting for live sensor data or manual meter logs.\n• **Active Plant Count:** ${num(ghPlants(g.id))} plants (${ghCrops(g.id).join(', ') || 'Empty'})`;
    }
    const fmtVal = (val, dec, unit = '') => val != null && Number.isFinite(Number(val)) ? `${num(val, dec)}${unit}` : 'No data';
    return `**[${g.name}] Current Environmental Status:**\n• **Overall Status:** ${ST_LABEL[st]} (${g.system}, ${g.area} m²)\n• **Air Temp:** ${fmtVal(r.temp, 1, '°C')} (Target: ${t.temp[0]}–${t.temp[1]}°C)\n• **Humidity:** ${fmtVal(r.hum, 0, '%')} (Target: ${t.hum[0]}–${t.hum[1]}%)\n• **CO₂:** ${fmtVal(r.co2, 0, ' ppm')} (Target: ${t.co2[0]}–${t.co2[1]} ppm)\n• **Water Temp:** ${fmtVal(r.wt, 1, '°C')} (Target: ${t.wt[0]}–${t.wt[1]}°C)\n• **pH Level:** ${fmtVal(r.ph, 2)} (Target: ${t.ph[0]}–${t.ph[1]})\n• **EC:** ${fmtVal(r.ec, 2, ' mS/cm')} (Target: ${t.ec[0]}–${t.ec[1]} mS/cm)\n• **Reservoir Level:** ${fmtVal(r.res, 0, '%')} (Target: ${t.res[0]}–${t.res[1]}%)\n• **Active Plant Count:** ${num(ghPlants(g.id))} plants (${ghCrops(g.id).join(', ') || 'Empty'})\n*(${live ? 'Live telemetry mode' : 'Sensor telemetry values are demo readings'})*`;
  }

  // 2. Inventory / Reorder Inquiries (strictly farm inventory queries)
  if (/\b(reorder|re-order)\b/.test(s) || (/\b(inventory|supplies|stock)\b/.test(s) && /\b(low|need|short|order|replenish|out of|threshold|status|list)\b/.test(s))) {
    const low = inventory().filter(i => Number(i.qty) < Number(i.threshold));
    if (!inventory().length) return `No inventory items are currently registered for ${activeFarmName()}. Add supplies in Smart Inventory.`;
    if (!low.length) {
      return `**Inventory Reorder Status:**\nAll ${inventory().length} tracked inventory items are currently above their safety reorder thresholds. No urgent reorders required!`;
    }
    const lines = low.map(i => `• [${i.id}] **${i.name}**: on hand ${num(i.qty)} ${i.unit} (reorder threshold is ${num(i.threshold)} ${i.unit}) — Supplier: ${i.supplier || 'Standard'}, Unit Cost: $${num(i.cost, 2)}`).join('\n');
    return `**Items Below Reorder Point (${low.length} supplies need replenishment):**\n${lines}\n\n*Rule: Trigger replenishment whenever quantity on hand drops below threshold (qty < threshold).*`;
  }

  // Specific inventory item stock check
  if (/\b(how much|stock of|quantity of|do we have)\b/.test(s) && /\b(nutrient|calcium|phosphoric|rockwool|coco|seed|plug|clamshell|sleeve|meter|electrode)\b/.test(s)) {
    const items = inventory().filter(i => s.includes(i.name.toLowerCase().split(' ')[0]) || s.includes(i.category.toLowerCase()));
    if (items.length) {
      return `**Inventory Stock Lookup:**\n` + items.map(i => `• [${i.id}] **${i.name}**: ${num(i.qty)} ${i.unit} (Reorder threshold: ${num(i.threshold)} ${i.unit}, Status: ${Number(i.qty) < Number(i.threshold) ? '⚠️ Needs Reorder' : '✓ Sufficient'})`).join('\n');
    }
  }

  // 3. Greenhouse Attention & Problem Inquiries
  if (/\b(which greenhouse|what greenhouse|greenhouse.*(attention|problem|wrong|alert|alarm|critical|issue))\b/.test(s)) {
    if (!ghs.length) return `No greenhouses are configured yet for ${activeFarmName()}.`;
    const bad = ghs.filter(g => ['warn', 'crit'].includes(ghStatus(g.id)));
    const ghTagList = ghs.map(g => `[${g.name}]`).join(', ');
    if (!bad.length) {
      if (isLiveMode() && ghs.every(g => ghStatus(g.id) === 'nodata')) {
        return `Waiting for live sensor data across ${ghs.length} greenhouse${ghs.length === 1 ? '' : 's'} (${ghTagList}).`;
      }
      return `All reporting greenhouses (${ghTagList}) are currently operating within their target environmental thresholds.`;
    }
    return `**Greenhouses Requiring Immediate Attention:**\n` + bad.map(g => {
      const ghAlerts = alerts().filter(a => a.id.startsWith('sensor-' + g.id));
      const details = ghAlerts.length ? ghAlerts.map(a => a.title).join('; ') : 'Parameters out of target range';
      return `• [${g.name}] is in **${ST_LABEL[ghStatus(g.id)].toUpperCase()}** status: ${details}.`;
    }).join('\n') + (isLiveMode() ? '' : '\n*(Note: Environmental readings are simulated demo data)*');
  }

  // 4. Harvest Readiness & Upcoming Schedule
  if (/\b(what.*(ready|harvest|pick)|harvest.*(this week|upcoming|next|soon|schedule)|ready.*harvest|when.*(next harvest|harvesting))\b/.test(s)) {
    const r = activeBatches().filter(b => daysFrom(b.expectedHarvest) <= 7 || b.stage === 'Ready').sort((a, b) => a.expectedHarvest.localeCompare(b.expectedHarvest));
    if (!r.length) return 'No crop batches are scheduled for harvest in the next 7 days.';
    const lines = r.map(b => `• [${b.id}] **${cropDef(b.crop).label}** in [${ghName(b.ghId)}], Zone ${b.zone}: ~${num(b.estKg)} kg on ${fmtD(b.expectedHarvest)} (${readiness(b)}% ready, stage: ${b.stage})`).join('\n');
    return `**Batches Ready or Due for Harvest within 7 Days:**\n${lines}\n\n*Head to the Harvest Management module to log actual yields and quality grades.*`;
  }

  // 5. Tasks & Work Orders
  if (/\b(overdue.*task|task.*overdue)\b/.test(s)) {
    const o = tasks().filter(isOverdue);
    if (!o.length) return 'There are currently no overdue tasks across any greenhouse bays. All scheduled work orders are on track!';
    return `**Overdue Farmer Work Orders (${o.length} tasks):**\n` + o.map(t => `• [${t.id}] **${t.title}** — Assignee: ${t.assignee}, Location: [${ghName(t.ghId) || 'Farm'}], Due: ${fmtD(t.due)} at ${fmtT(t.time)} (Priority: ${t.priority})`).join('\n');
  }

  if (/\b(task.*(today|due today)|today.*task|tasks.*open|what.*(tasks|work orders))\b/.test(s) && !/\b(general|farming|how to)\b/.test(s)) {
    const td = tasks().filter(t => t.status !== 'Done' && t.due === dOff(0));
    const allOpen = tasks().filter(t => t.status !== 'Done');
    return `**Farm Work Orders Summary:**\n• **Due Today (${td.length}):** ${td.map(t => `[${t.id}] "${t.title}" (${t.assignee})`).join('; ') || 'None scheduled for today'}\n• **Total Open Work Orders:** ${allOpen.length} active tasks across farm staff.`;
  }

  // Tasks by assignee (matched dynamically against current teamMembers)
  if (/\b(task|assigned|work|doing|todo)\b/.test(s)) {
    const person = team.find(p => {
      const first = p.name.toLowerCase().split(/\s+/)[0];
      return s.includes(p.name.toLowerCase()) || (first.length >= 3 && new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(s));
    });
    if (person) {
      const pTasks = tasks().filter(t => t.assignee.toLowerCase().includes(person.name.toLowerCase()) && t.status !== 'Done');
      if (!pTasks.length) return `No open work orders currently assigned to ${person.name}.`;
      return `**Open Tasks Assigned to ${person.name} (${pTasks.length} tasks):**\n` + pTasks.map(t => `• [${t.id}] "${t.title}" in [${ghName(t.ghId) || 'Farm'}], Due: ${fmtD(t.due)} (${t.priority} Priority)`).join('\n');
    }
  }

  // 6. Active Alerts & Notifications
  if (/\b(what alerts|active alerts|any alerts|farm alerts|show alerts|current alerts|any warnings)\b/.test(s)) {
    const al = activeAlerts();
    if (!al.length) return 'There are currently no active smart alerts on the farm. All greenhouse conditions and stock levels are within nominal boundaries.';
    return `**Active Farm Alerts (${al.length}):**\n` + al.map(a => `• **[${ST_LABEL[a.sev] || a.sev}]** ${a.title}`).join('\n');
  }

  // 7. Active Batches Listing
  if (/\b(what batches|list batches|active batches|current batches|all batches|growing batches)\b/.test(s)) {
    const act = activeBatches();
    if (!act.length) return 'No active crop batches currently registered on the farm.';
    return `**Active Crop Batches (${act.length} batches):**\n` + act.map(b => `• [${b.id}] **${cropDef(b.crop).label}** in [${ghName(b.ghId)}] (Zone ${b.zone}) — ${num(b.plants)} plants, Stage: ${b.stage}, Health: ${b.health}%, Expected: ${fmtD(b.expectedHarvest)}`).join('\n');
  }

  // 8. Crops Grown on Farm
  if (/\b(what crops.*(grow|support|planted)|crops.*(on this farm|we grow|farm grow))\b/.test(s)) {
    const entries = Object.values(cropsObj);
    if (!entries.length) return `No crop profiles are configured yet for ${activeFarmName()}. Add crops in Plant Management.`;
    const cropList = entries.map(c => `• **${c.label}**: ${c.cycle}-day cycle, wholesale price $${Number(c.price || 0).toFixed(2)}/kg, optimal pH ${c.ph[0]}–${c.ph[1]}`).join('\n');
    return `**Crops Cultivated at ${activeFarmName()}:**\n${cropList}`;
  }

  // 9. Farm Staff & Team
  if (/\b(who works|farm staff|team members|farm workers|who is on the team|farm team)\b/.test(s)) {
    const cu = currentUser();
    const lines = team.map(p => `• **${p.name}** — ${p.role}`);
    if (!team.some(p => p.name.toLowerCase() === cu.name.toLowerCase())) {
      lines.push(`• **${cu.name}** — ${cu.role}`);
    }
    return `**${activeFarmName()} Staff:**\n${lines.join('\n')}\n\n*You can manage team members in Farmer Tasks or switch demo roles in the top-right profile menu.*`;
  }

  // 10. Sensor Telemetry Tracked
  if (/\b(what sensors|monitored sensors|sensors tracked|sensor parameters)\b/.test(s)) {
    return `**Automated Environmental Sensors Monitored per Greenhouse:**\n` + SENSORS.map(sn => `• **${sn.label}** (${sn.unit || 'unitless'}): Model ${sn.model}`).join('\n');
  }

  // 11. Navigation & How-To Shortcuts
  if (/\b(how (do i|to) (add|create|log|record))\b/.test(s)) {
    if (s.includes('batch')) return 'To plant or register a new crop batch:\n1. Click **Plant Management** in the sidebar (or press `/` and type batch).\n2. Click the **+ New batch** button in the top right.\n3. Enter the crop, greenhouse bay, zone, planted date, and plant population.';
    if (s.includes('task')) return 'To create a work order:\n1. Click **Farmer Tasks** in the sidebar.\n2. Click **+ New task**.\n3. Specify title, assignee, greenhouse location, priority, and due date/time.';
    if (s.includes('harvest')) return 'To log a completed harvest:\n1. Click **Harvest Management** in the sidebar.\n2. Click **+ Log harvest**.\n3. Select the batch, actual harvested kilograms, quality grade (A/B/C), and harvest notes.';
    if (s.includes('expense')) return 'To record an operational farm expense:\n1. Switch to **Farm Owner** role in the top profile menu.\n2. Go to **Financial Dashboard** and click **Record expense**.\n3. Enter category, date, amount, and invoice note.';
    if (s.includes('order')) return 'To create a customer sales order:\n1. Click **Sales** in the sidebar.\n2. Click **+ New order**.\n3. Select customer, crop, volume in kg, price per kg, and delivery date.';
  }

  // 12. Farm Overall KPIs & Scale
  if (/\b(how many plants|total (active )?plants|total plants growing|total crop|plant count)\b/.test(s)) {
    const k = kpis();
    return `**Current Farm Scale (${activeFarmName()}):**\n• **Total Active Plants:** ${num(k.plants)} growing plants\n• **Active Batches:** ${k.batches} batches across ${k.gOn} operational greenhouses\n• **Average Canopy Health:** ${num(k.health, 1)}%\n• **Projected 30-Day Harvest:** ~${num(k.f30kg)} kg (${money(k.rev)} estimated value)`;
  }

  if (/\b(projected revenue|30[- ]day revenue|revenue projection|expected revenue)\b/.test(s)) {
    const k = kpis();
    return `**Harvest Revenue Projection (Next 30 Days):**\n• **Projected Revenue:** ${money(k.rev)}\n• **Projected Harvest Weight:** ~${num(k.f30kg)} kg\n• **Active Batches Contributing:** ${activeBatches().length} crop batches.\n*(Calculated from batch planting schedules and wholesale target prices; see Financial Dashboard for actual realized sales)*`;
  }

  // 13. Website Features & Navigation Information
  if (/\b(what features|what can.*website|about.*(website|platform|hydrobot)|explain.*(website|features|modules)|how.*(navigate|use this dashboard)|what is hydrobot|who are you)\b/.test(s)) {
    return `**Hydrobot.Ai Farm Management Platform Overview:**\nHydrobot.Ai is an integrated commercial greenhouse and hydroponic operating system with 15 core modules:\n
• **Operations:** Dashboard (KPIs & live status), Plant Management (crop batches & growth stages), Greenhouse Management (environmental telemetry & target ranges), Harvest Management (yield logs & grading), Farmer Tasks (work order dispatch), Smart Inventory (supplies & reorder automation).
• **AI & Intelligence:** Crop Nutrition (formulations & dosing), Disease Detection (vision diagnostic check), Farm Assistant (real-time data + agronomic advice), Production Forecast (harvest predictions with 90% confidence bands).
• **Business & Monitoring:** Yield Analytics (productivity per m²), Financial Dashboard (P&L and monthly revenue), Sales (customer orders & pipeline), Logistics (delivery dispatch), Smart Alerts (environmental, stock & overdue warnings).
• **Navigation Tips:** Use the sidebar on desktop or the menu button on mobile. Use the top search bar (or press '/') to jump to any batch, task, or inventory item, and switch roles in the top bar.`;
  }

  // 14. Crop Location & Zone Breakdown
  if (/\b(what.*growing in greenhouse|crops in greenhouse|where.*(strawberry|strawberries|tomato|tomatoes|lettuce|basil))\b/.test(s)) {
    if (!ghs.length) return `No greenhouses are configured yet for ${activeFarmName()}.`;
    return `**Current Crop Canopy Distribution:**\n` + ghs.map(g => {
      const bList = activeBatches().filter(b => b.ghId === g.id);
      return `• [${g.name}] (${g.system}): ${bList.map(b => `${cropDef(b.crop).label} in Zone ${b.zone} [${b.id}] (${num(b.plants)} plants)`).join(', ') || 'No active batches'}`;
    }).join('\n');
  }

  // 15. Recent Harvests
  if (/\b(recent harvest|last harvest|harvest history)\b/.test(s)) {
    const recent = harvests().slice(0, 5);
    if (!recent.length) return 'No harvest records have been logged yet.';
    return `**Recent Harvest Records:**\n` + recent.map(h => `• [${h.id}] **${cropDef(h.crop).label}** on ${fmtD(h.date)}: ${num(h.actualKg)} kg (${h.grade}) in [${ghName(h.ghId)}]`).join('\n');
  }

  // 16. Deliveries & Orders
  if (/\b(deliver(y|ies)|out for delivery|upcoming delivery)\b/.test(s)) {
    const allOs = orders();
    if (!allOs.length) return 'No customer sales orders have been created yet.';
    const activeOrders = allOs.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').slice(0, 5);
    if (!activeOrders.length) return 'All customer orders are currently fulfilled and delivered.';
    return `**Active Deliveries & Sales Orders:**\n` + activeOrders.map(o => `• [${o.id}] **${o.customer}**: ${num(o.kg)} kg of ${cropDef(o.crop).label} — Status: ${o.status} (${o.delivery?.status || 'Scheduled'})`).join('\n');
  }

  // Not a direct retrieval match -> Delegate to LLM (Gemini) for agricultural reasoning, technology recommendations, or general farming knowledge!
  return null;
}

async function ask(q) {
  q = q.trim(); if (!q || ui.chatBusy) return;
  ui.chat.push({ role: 'user', text: q });

  // 1. Direct Dynamic Farm Records check (0ms response time, zero LLM calls)
  const direct = classifyAndRetrieve(q);
  if (direct) {
    ui.chat.push({ role: 'bot', text: direct, src: 'direct' });
    render();
    scrollChat();
    $('#chatIn')?.focus();
    return;
  }

  // 2. Logic layer: Check for local keywords or matching questions in 'knowledge_base.json'
  // Ensures hybrid response-handling before determining whether to call the Gemini API
  const kbList = await getKnowledgeBase();
  const kbMatch = checkKnowledgeBase(q, kbList);
  if (kbMatch) {
    ui.chat.push({ role: 'bot', text: kbMatch.answer, src: 'kb', matchedOn: kbMatch.matchedOn });
    render();
    scrollChat();
    $('#chatIn')?.focus();
    return;
  }

  // 3. LLM-Based Response: Call Gemini 3.8 Flash with Google Search Grounding for complex agricultural reasoning
  ui.chatBusy = true;
  const bot = { role: 'bot', text: 'Thinking…', src: 'pending' };
  ui.chat.push(bot);
  render();
  scrollChat();

  try {
    const history = ui.chat
      .slice(0, -1)
      .slice(-8)
      .filter(m => m && m.src !== 'pending' && m.src !== 'error' && typeof m.text === 'string' && m.text.trim())
      .map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
    const headers = { 'Content-Type': 'application/json' };
    if (!AuthState.isDemoAuth && AuthState.session?.access_token) {
      headers.Authorization = `Bearer ${AuthState.session.access_token}`;
    }
    const response = await fetch('/api/farm-assistant', {
      method: 'POST',
      headers,
      body: JSON.stringify({ question: q, farmContext: farmContext(), history })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.text) {
      const errText = result.error || 'API request failed.';
      bot.text = `⚠️ **Gemini API Error:** ${errText}`;
      bot.src = 'error';
    } else {
      bot.text = result.text;
      bot.src = 'gemini';
      bot.sources = result.sources || [];
    }
  } catch (e) {
    bot.text = `⚠️ **Gemini API Error:** ${e.message || 'Could not connect to the assistant server.'}`;
    bot.src = 'error';
  }

  ui.chatBusy = false;
  render();
  scrollChat();
  $('#chatIn')?.focus();
}

const scrollChat = () => { const l = $('#chatLog'); if (l) l.scrollTop = l.scrollHeight; };

function simulatedAnswer(q) {
  const s = q.toLowerCase();

  // 1. Direct dynamic retrieval fallback
  const direct = classifyAndRetrieve(q);
  if (direct) return direct;

  // 2. Knowledge base fallback
  const kbMatch = checkKnowledgeBase(q);
  if (kbMatch) return kbMatch.answer;

  // 2. Agricultural & Technology Curiosity Fallbacks:
  if (s.includes('yellow') || s.includes('chlorosis')) {
    return `**Diagnosing Yellow Leaves (Chlorosis) in Crops:**\n• **Top / New Growth Yellowing (Veins stay Green):** Interveinal iron (Fe) chlorosis. Common in hydroponics when root-zone pH rises above 6.5, locking out iron. Remedy: reduce pH to 5.8 using phosphoric acid [I-06] and apply chelated iron (Fe-DTPA/EDDHA).\n• **Bottom / Older Leaves Yellowing Uniformly:** Nitrogen (N) deficiency. Nitrogen is mobile; plants relocate it to new shoot growth. Supplement with calcium nitrate [I-04].\n• **Interveinal Yellowing on Older Leaves:** Magnesium (Mg) deficiency. Supplement with magnesium sulfate (Epsom salt).\n• **Leaf Margin Burn:** Salt stress from high EC or potassium deficiency.`;
  }

  if (s.includes('blossom end rot') || (s.includes('tomato') && s.includes('rot'))) {
    return `**Preventing Blossom End Rot in Tomatoes:**\nBlossom end rot appears as a sunken, leathery black lesion at the blossom end of developing tomatoes.\n• **Causal Mechanism:** Localized Calcium (Ca) deficiency in rapidly expanding fruit cells.\n• **Primary Drivers:** Uneven irrigation cycles, high vapor pressure deficit (VPD) or stagnant air preventing transpiration, and high ammonium/potassium ratios competing with calcium uptake.\n• **Best Practices:** Maintain root-zone pH between 5.8 and 6.3, supply calcium nitrate [I-04], maintain consistent substrate moisture in Dutch buckets, and ensure air movement (0.3–0.5 m/s) over the canopy.`;
  }

  if (s.includes('nft') || s.includes('nutrient film technique') || s.includes('vertical')) {
    return `**Agricultural Technology Recommendation: Hydroponic Systems**\n• **Nutrient Film Technique (NFT):** A shallow stream (1–2 mm) of recirculating nutrient solution flows down 1:30–1:40 sloped gullies. Excellent for quick-turn leafy greens (lettuce, herbs) with low root biomass. Highly water-efficient, but pump failure stops root hydration rapidly.\n• **Dutch Buckets / Bato Buckets:** Buckets filled with perlite/clay pebbles with drip emitters. Ideal for heavy-rooting fruiting crops like tomatoes, cucumbers, and peppers.\n• **Deep Water Culture (DWC):** Floating rafts over aerated reservoirs. Large thermal buffer and high resilience to power hiccups.\n• **Vertical NFT Towers (e.g. Greenhouse D):** Maximizes plant density per square meter for strawberries and greens, though requires uniform vertical light distribution.`;
  }

  if (s.includes('equipment') || s.includes('sensor') || s.includes('technology') || s.includes('automation')) {
    return `**Recommended Agricultural Technologies & Tools for Controlled Environment Agriculture (CEA):**\n• **Environmental Controllers:** Integrated controllers (e.g., Argus, Priva, TrolMaster) that coordinate exhaust fans, evaporative pads, shade curtains, and CO₂ injection based on VPD.\n• **Root-Zone Sensors:** Sealed industrial pH electrodes, toroidal conductivity (EC) probes, and substrate moisture/temperature/EC TDR sensors.\n• **Automated Fertigation & Dosing:** Venturi injectors or peristaltic dosing pumps coupled with inline optical/conductive feedback loops for continuous nutrient regulation.\n• **Lighting:** Full-spectrum LED fixtures delivering 250–350 µmol/m²/s PPFD for greens and 450–700 µmol/m²/s for fruiting crops.`;
  }

  if (s.includes('pest') || s.includes('ipm') || s.includes('biological') || s.includes('bug') || s.includes('mite') || s.includes('aphid')) {
    return `**Integrated Pest Management (IPM) for Protected Agriculture:**\n• **Preventative Monitoring:** Weekly scouting with yellow sticky cards for whiteflies/fungus gnats and blue cards for thrips.\n• **Biological Controls:** Introduce beneficial predatory mites (*Phytoseiulus persimilis* [I-03] for two-spotted spider mites; *Amblyseius swirskii* for thrips/whiteflies).\n• **Cultural & Physical Controls:** Double-entry vestibules, 50-mesh insect netting on intakes, and sanitizing tools between crop cycles.`;
  }

  if (s.includes('strawberry') || s.includes('strawberries')) {
    return `**Agronomic Guide for Hydroponic Strawberries (e.g. Albion plugs [I-03]):**\n• **Optimal pH:** 5.8 to 6.2.\n• **Optimal EC:** 1.0 to 1.4 mS/cm vegetative; 1.4 to 1.8 mS/cm flowering/fruiting.\n• **Temperature:** 18–22°C root-zone; 20–24°C daytime canopy.\n• **Key Technique:** Sensitive to salt accumulation. Flush root zones every 10–14 days and avoid excessive nitrogen which yields soft fruit.`;
  }

  if (s.includes('basil')) {
    return `**Agronomic Guide for Hydroponic Basil (e.g. Genovese Basil [B-301]):**\n• **Optimal pH:** 5.5 to 6.5.\n• **Optimal EC:** 1.0 to 1.6 mS/cm.\n• **Water Temp:** 20–23°C (cold water below 18°C causes leaf discoloration and root shock).\n• **Best Practice:** Pinch terminal flowers promptly to promote lateral bushiness and high volatile oil content.`;
  }

  // Fallback agricultural guidance
  return `As your **Hydrobot.Ai** agricultural assistant, I specialize in farming methods, plant biology, greenhouse technology, and farm operations.\n\nTry asking:\n• **Farm records:** "What is ready to harvest?", "Which inventory items should I reorder?", "What tasks are overdue?", or ask about record [B-101].\n• **Farming techniques:** "How does NFT hydroponics work?", "How to prevent blossom end rot?", or "What are the optimal pH and EC levels for strawberries?"\n• **Agricultural technology:** "What sensors are needed for automated greenhouse irrigation?"`;
}

/* ================= AI: Production Forecast ================= */
function vForecast() {
  const H = ui.fcRange, items = forecastItems(H), live = isLiveMode(), cropsObj = cropsMap();
  const weeks = []; for (let w = 0; w < H / 7; w++) weeks.push({ from: w * 7, to: w * 7 + 6 });
  const crops = [...new Set([...Object.keys(cropsObj), ...items.map(i => i.crop)])];
  const ratios = Object.fromEntries(crops.map(c => [c, historicalRatio(c)]));
  const rows = weeks.map(w => { const it = items.filter(i => i.day >= w.from && i.day <= w.to); const plan = it.reduce((s, i) => s + i.kg, 0); const exp = it.reduce((s, i) => s + i.kg * (ratios[i.crop]?.ratio || 1), 0); const sd = Math.sqrt(it.reduce((s, i) => s + (i.kg * (ratios[i.crop]?.ratio || 1) * (ratios[i.crop]?.cv || 0.08)) ** 2, 0)); return { ...w, plan, exp, lo: Math.max(0, exp - 1.64 * sd), hi: exp + 1.64 * sd, byCrop: Object.fromEntries(crops.map(c => [c, it.filter(i => i.crop === c).reduce((s, i) => s + i.kg * (ratios[c]?.ratio || 1), 0)])) }; });
  const tot = rows.reduce((s, r) => s + r.exp, 0), totPlan = rows.reduce((s, r) => s + r.plan, 0), totLo = rows.reduce((s, r) => s + r.lo, 0), totHi = rows.reduce((s, r) => s + r.hi, 0);
  const totRev = items.reduce((s, i) => s + i.kg * (ratios[i.crop]?.ratio || 1) * cropDef(i.crop).price, 0);
  const fcBody = live && !items.length
    ? empty('trend', 'No active crop batches to forecast', 'Add crop batches in Plant Management under Live Data mode to generate production forecasts.')
    : `<div class="chart-box tall">${makeChart('cFc', { type: 'bar', aria: 'Weekly expected harvest volume with 90 percent range', data: { labels: rows.map(r => 'Wk of ' + fmtD(dOff(r.from))), datasets: [
    ...crops.map(c => ({ label: cropDef(c).label, data: rows.map(r => Math.round(r.byCrop[c])), backgroundColor: col(cropColorVar(c)), stack: 's', borderRadius: 3, order: 2 })),
    { type: 'bar', label: '90% range', data: rows.map(r => [Math.round(r.lo), Math.round(r.hi)]), backgroundColor: 'transparent', borderColor: col('--fg'), borderWidth: { top: 2, bottom: 2, left: 0, right: 0 }, borderSkipped: false, barPercentage: .25, grouped: false, order: 1 },
    { type: 'line', label: 'Plan', data: rows.map(r => Math.round(r.plan)), borderColor: col('--muted'), borderDash: [4, 4], pointRadius: 3, pointBackgroundColor: col('--muted'), order: 0 }] },
    options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: false, beginAtZero: true, title: { display: true, text: 'kg' } } } } })}</div>`;
  return `${pageHead('Production Forecast', 'Upcoming harvest volume from planting schedules and historical yield.', aiModeTag() + seg('fcRange', [[28, '4 weeks'], [56, '8 weeks'], [84, '12 weeks']], H, 'Forecast horizon'))}
  <div class="notice">${ic('info')}<div>Statistical estimate from batch plans and past harvest records, calculated in the page. Not a connected AI model. Weather and pest events are not modeled.</div></div>
  <div class="stats">${[['Expected volume', items.length ? num(tot) + ' kg' : '—'], ['90% range', items.length ? `${num(totLo)}–${num(totHi)} kg` : '—'], ['Plan (batch estimates)', num(totPlan) + ' kg'], ['Projected value', items.length ? money(totRev) : '—']].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${card('Weekly forecast', fcBody, { sub: 'Stacked bars: expected kg by crop · whiskers: 90% range · dashed: plan' })}
  <div class="grid g-2">
    ${card('Assumptions', `<ul class="list-plain"><li>Each active batch is harvested on its expected date. Single-harvest crops count once; continuous crops (or long cycles) pick weekly at estimated pick size.</li><li>Expected kg = plan × the crop's average actual-to-estimate ratio from past records.</li><li>Uncertainty uses each crop's historical variation (minimum 8%), combined across picks; range is ±1.64 σ (90%).</li><li>Prices for projected value: ${crops.length ? crops.map(c => `${esc(cropDef(c).label)} $${Number(cropDef(c).price || 0).toFixed(2)}/kg`).join(', ') : 'none configured'}.</li></ul>`)}
    ${card('Historical yield accuracy', crops.length ? `<div class="tbl-wrap"><table><thead><tr><th>Crop</th><th class="r">Records</th><th class="r">Actual ÷ estimate</th><th class="r">Variation</th></tr></thead><tbody>${crops.map(c => `<tr><td>${esc(cropDef(c).label)}</td><td class="r num">${ratios[c].n}</td><td class="r num">${ratios[c].n ? num(ratios[c].ratio * 100, 1) + '%' : '—'}</td><td class="r num">±${num(ratios[c].cv * 100, 1)}%</td></tr>`).join('')}</tbody></table></div>` : empty('sprout', 'No crops configured', 'Add crops in Plant Management to track historical yield accuracy.'))}
  </div>`;
}

/* ================= Business ================= */
function monthKey(s) { return String(s || '').slice(0, 7); }
function lastMonths(n) { const out = []; for (let m = n - 1; m >= 0; m--) { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1); out.push(iso(d).slice(0, 7)); } return out; }
const mLabel = k => parseD(k + '-01').toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
function vYield() {
  const months = lastMonths(6), hs = harvests().filter(h => monthKey(h.date) >= months[0]), live = isLiveMode();
  const ghs = greenhouses(), cropsObj = cropsMap();
  const crops = [...new Set([...Object.keys(cropsObj), ...hs.map(h => h.crop).filter(Boolean)])];
  const tot = hs.reduce((s, h) => s + Number(h.actualKg || 0), 0);
  const area = ghs.reduce((s, g) => s + Number(g.area || 0), 0);
  const grades = ['A', 'B', 'C'].map(g => hs.filter(h => h.grade === g).reduce((s, h) => s + Number(h.actualKg || 0), 0));
  const ymBody = live && !hs.length
    ? empty('bar', 'No harvest analytics yet', 'Recorded harvests in Live Data mode will appear by month and crop here.')
    : `<div class="chart-box tall">${makeChart('cYm', { type: 'bar', aria: 'Monthly harvested kg by crop', data: { labels: months.map(mLabel), datasets: crops.map(c => ({ label: cropDef(c).label, data: months.map(m => hs.filter(h => h.crop === c && monthKey(h.date) === m).reduce((s, h) => s + Number(h.actualKg || 0), 0)), backgroundColor: col(cropColorVar(c)), borderRadius: 4, stack: 's' })) }, options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, title: { display: true, text: 'kg' } } } } })}</div>`;
  const grBody = live && !hs.length
    ? empty('basket', 'No quality grade data yet', 'Harvest grade breakdowns appear once harvests are logged.')
    : `<div class="chart-box tall">${makeChart('cGr', { type: 'doughnut', aria: 'Share of harvested weight by grade', data: { labels: ['Grade A', 'Grade B', 'Grade C'], datasets: [{ data: grades, backgroundColor: [col('--c1'), col('--warn'), col('--crit')], borderColor: col('--card'), borderWidth: 3 }] }, options: { cutout: '62%', plugins: { legend: { position: 'bottom' } } } })}</div>`;
  return `${pageHead('Yield Analytics', 'Harvested volume, productivity and quality over the last 6 months.', '')}
  <div class="stats">${[['Harvested, 6 months', num(tot) + ' kg'], ['Per m² growing area', hs.length && area > 0 ? num(tot / area, 1) + ' kg' : '—'], ['Grade A by weight', tot > 0 ? num(grades[0] / tot * 100, 0) + '%' : '—'], ['Harvest records', hs.length]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  <div class="grid g-main">
    ${card('Monthly yield by crop', ymBody)}
    ${card('Quality grades', grBody, { sub: 'By harvested weight' })}
  </div>
  ${card('By crop', crops.length ? `<div class="tbl-wrap"><table><thead><tr><th>Crop</th><th>Greenhouse</th><th class="r">Harvested</th><th class="r">Harvests</th><th class="r">Avg per harvest</th><th class="r">Actual vs estimate</th><th class="r">kg per m²</th></tr></thead><tbody>${crops.map(c => { const x = hs.filter(h => h.crop === c), kg = x.reduce((s, h) => s + Number(h.actualKg || 0), 0), est = x.reduce((s, h) => s + Number(h.estKg || 0), 0); const matchGhs = ghs.filter(g => g.main === c || x.some(h => h.ghId === g.id)); const gArea = matchGhs.reduce((s, g) => s + Number(g.area || 0), 0); const gLabel = matchGhs.map(g => g.name).join(', ') || '—'; return `<tr><td><b>${esc(cropDef(c).label)}</b></td><td>${esc(gLabel)}</td><td class="r num">${num(kg)} kg</td><td class="r num">${x.length}</td><td class="r num">${x.length ? num(kg / x.length, 1) + ' kg' : '—'}</td><td class="r num">${est > 0 ? num(kg / est * 100, 1) + '%' : '—'}</td><td class="r num">${x.length && gArea > 0 ? num(kg / gArea, 1) : '—'}</td></tr>`; }).join('')}</tbody></table></div>` : empty('sprout', 'No crops to summarize', 'Add crops or log harvests to see crop productivity.'))}`;
}
function vFinance() {
  if (!can('finance') && !can('financeView')) return pageHead('Financial Dashboard', '') + noPerm('The financial dashboard');
  const months = lastMonths(6), os = orders().filter(o => o.status === 'Delivered' && monthKey(o.date) >= months[0]), live = isLiveMode();
  const ex = Store.all('expenses').filter(e => monthKey(e.date) >= months[0]);
  const rev = months.map(m => os.filter(o => monthKey(o.date) === m).reduce((s, o) => s + o.kg * o.pricePerKg, 0));
  const exp = months.map(m => ex.filter(e => monthKey(e.date) === m).reduce((s, e) => s + Number(e.amount), 0));
  const totR = rev.reduce((a, b) => a + b, 0), totE = exp.reduce((a, b) => a + b, 0), k = kpis();
  const cats = [...new Set(ex.map(e => e.category))].map(c => [c, ex.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount), 0)]).sort((a, b) => b[1] - a[1]);
  const recent = Store.all('expenses').filter(e => !e.demo).sort((a, b) => b.date.localeCompare(a.date));
  const marginPct = totR > 0 ? ` (${num((totR - totE) / totR * 100, 0)}%)` : '';
  const finChartBody = live && !os.length && !ex.length
    ? empty('wallet', 'No financial records yet', 'Delivered sales orders and recorded expenses in Live Data mode will populate this chart.')
    : `<div class="chart-box tall">${makeChart('cFin', { type: 'bar', aria: 'Monthly actual revenue and expenses', data: { labels: months.map(mLabel), datasets: [{ label: 'Actual revenue', data: rev.map(Math.round), backgroundColor: col('--accent'), borderRadius: 4 }, { label: 'Expenses', data: exp, backgroundColor: col('--c2'), borderRadius: 4 }, { type: 'line', label: 'Margin', data: rev.map((r, i) => Math.round(r - exp[i])), borderColor: col('--fg'), pointRadius: 3, tension: .3 }] }, options: { scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => '$' + (v / 1000) + 'k' } } } } })}</div><p class="small muted" style="margin-top:8px">${live ? 'Revenue counts delivered sales orders only. Accounting sync (e.g. QuickBooks, Xero) is not connected.' : 'Revenue counts delivered sales orders only. Expense months before this one are sample monthly totals. Accounting sync (e.g. QuickBooks, Xero) is not connected.'}</p>`;
  const catsBody = cats.length
    ? `<div class="tbl-wrap"><table><tbody>${cats.map(([c, v]) => `<tr><td>${esc(c)}</td><td style="width:45%"><div class="bar"><i style="width:${cats[0][1] > 0 ? v / cats[0][1] * 100 : 0}%;background:var(--c2)"></i></div></td><td class="r num">${money(v)}</td></tr>`).join('')}</tbody></table></div>`
    : empty('wallet', 'No expenses by category yet', 'Recorded expenses will be grouped by category here.');
  return `${pageHead('Financial Dashboard', 'Recorded revenue and expenses for the last 6 months.', can('finance') ? `<button class="btn primary" data-act="expense-new">${ic('plus')}Record expense</button>` : '')}
  <div class="stats">${[['Actual revenue (delivered sales)', money(totR)], ['Recorded expenses', money(totE)], ['Operating margin', money(totR - totE) + marginPct]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}<div class="pill-stat" style="border-style:dashed"><b>${k.f30kg ? money(k.rev) : '—'}</b><span><span class="tag proj">Projection</span> Harvest revenue, next 30 days. Not actual sales.</span></div></div>
  ${card('Revenue vs expenses', finChartBody, { sub: 'Monthly, actual figures only' })}
  <div class="grid g-2">
    ${card('Expenses by category', catsBody, { sub: '6 months' })}
    ${card('Recently recorded expenses', recent.length ? `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Note</th><th class="r">Amount</th>${can('finance') ? '<th><span class="sr">Actions</span></th>' : ''}</tr></thead><tbody>${recent.slice(0, 12).map(e => `<tr><td class="num">${fmtD(e.date)}</td><td>${esc(e.category)}</td><td class="small">${esc(e.note)}</td><td class="r num">${money(e.amount)}</td>${can('finance') ? `<td class="r"><button class="btn sm ghost" data-act="expense-edit" data-id="${esc(e.id)}">Edit</button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : empty('wallet', 'No expenses recorded yet', can('finance') ? 'Record an expense to add it to this month.' : 'The farm owner records expenses.'))}
  </div>`;
}
function expenseForm(id) {
  const existing = id ? Store.get('expenses', id) : null;
  const ex = existing || { date: dOff(0), category: 'Energy', amount: '', note: '' };
  openModal({
    title: existing ? 'Edit expense' : 'Record expense',
    submitLabel: existing ? 'Save changes' : 'Save expense',
    footer: existing && can('finance') ? `<button type="button" class="btn danger" data-act="expense-delete" data-id="${esc(existing.id)}">Delete</button>` : '',
    body: `<div class="form-grid">${fld('Date', `<input id="e-date" name="date" type="date" value="${esc(ex.date)}" max="${dOff(0)}">`, 'date')}${fld('Category', `<select id="e-cat" name="category">${['Energy', 'Labor', 'Nutrients', 'Seeds & plugs', 'Packaging', 'Maintenance', 'Logistics', 'Other'].map(c => `<option ${ex.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>`, 'category')}${fld('Amount ($)', `<input id="e-amt" name="amount" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(ex.amount)}">`, 'amount')}${fld('Note', `<input id="e-note" name="note" value="${esc(ex.note || '')}" placeholder="Invoice or description">`, 'note')}</div>`,
    validate: d => ({ amount: !(+d.amount > 0) && 'Enter an amount greater than $0.', date: !d.date && 'Choose a date.', note: !d.note.trim() && 'Add a short description.' }),
    submit: async d => {
      const doc = { ...(existing || { id: uid('E') }), ...d, amount: +d.amount, note: d.note.trim() };
      await Store.put('expenses', doc);
      return existing ? 'Expense updated.' : 'Expense recorded.';
    }
  });
}
const ORDER_ST = ['Draft', 'Confirmed', 'Packed', 'Delivered', 'Cancelled'];
function vSales() {
  const q = ui.saleF.toLowerCase();
  const allOs = orders();
  const os = allOs.filter(o => !q || `${o.id} ${o.customer} ${o.crop} ${cropDef(o.crop).label} ${o.status}`.toLowerCase().includes(q));
  const open = allOs.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
  const m = monthKey(dOff(0)), mtd = allOs.filter(o => o.status === 'Delivered' && monthKey(o.date) === m).reduce((s, o) => s + o.kg * o.pricePerKg, 0);
  return `${pageHead('Sales', 'Customer orders. Only delivered orders count as actual revenue.', can('sales') ? `<button class="btn primary" data-act="order-new">${ic('plus')}New order</button>` : '')}
  <div class="stats">${[['Delivered this month', money(mtd)], ['Open orders', open.length], ['Open order value', money(open.reduce((s, o) => s + o.kg * o.pricePerKg, 0))], ['Customers', new Set(allOs.map(o => o.customer)).size]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${card('Orders', `<div class="toolbar" style="margin-bottom:12px"><label class="sr" for="so-q">Search orders</label><input id="so-q" class="input grow" type="search" placeholder="Search by order, customer, crop or status" value="${esc(ui.saleF)}" data-filter="saleF"></div>
  ${os.length ? `<div class="tbl-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Crop</th><th class="r">Qty</th><th class="r">Value</th><th>Delivery date</th><th>Status</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${os.slice(0, 40).map(o => `<tr><td class="mono">${esc(o.id)}</td><td>${esc(o.customer)}</td><td>${esc(cropDef(o.crop).label)}</td><td class="r num">${num(o.kg)} kg</td><td class="r num">${money(o.kg * o.pricePerKg)}</td><td class="num">${fmtD(o.date)}</td><td>${orderBadge(o.status)}</td><td class="r">${can('sales') ? `<button class="btn sm" data-act="order-edit" data-id="${esc(o.id)}">Edit</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : allOs.length ? empty('cart', 'No orders match', 'Try a different search.') : empty('cart', 'No sales orders yet', can('sales') ? 'Create a customer order in Live Data mode to get started.' : 'No orders recorded in Live Data mode yet.')}`, { sub: `${Math.min(40, os.length)} of ${os.length} shown, newest first` })}`;
}
const orderBadge = s => `<span class="badge ${s === 'Delivered' ? 'b-ok' : s === 'Cancelled' ? 'b-crit' : s === 'Draft' ? 'b-mute' : 'b-info'}">${s}</span>`;
function orderForm(id) {
  const cropsObj = cropsMap();
  const cropEntries = Object.entries(cropsObj);
  const firstCrop = cropEntries[0]?.[0] || 'Lettuce';
  const existing = id ? Store.get('orders', id) : null;
  const o = existing || { customer: '', crop: firstCrop, kg: '', pricePerKg: cropDef(firstCrop).price, date: dOff(3), status: 'Confirmed', delivery: { status: 'Scheduled', vehicle: 'Van 1 (refrigerated)', window: '07:00–10:00' } };
  const custs = customersList();
  openModal({
    title: existing ? `Edit ${o.id}` : 'New sales order',
    submitLabel: existing ? 'Save changes' : 'Create order',
    footer: existing && can('sales') ? `<button type="button" class="btn danger" data-act="order-delete" data-id="${esc(o.id)}">Delete</button>` : '',
    body: `<div class="form-grid">${fld('Customer', `<input id="so-c" name="customer" list="custList" value="${esc(o.customer)}"><datalist id="custList">${custs.map(c => `<option value="${esc(c)}">`).join('')}</datalist>`, 'customer')}
      ${fld('Crop', cropEntries.length ? `<select id="so-crop" name="crop">${cropEntries.map(([k, c]) => `<option value="${esc(k)}" ${o.crop === k ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>` : `<input id="so-crop" name="crop" value="${esc(o.crop)}" placeholder="e.g. Lettuce">`, 'crop')}
      ${fld('Quantity (kg)', `<input id="so-kg" name="kg" type="number" min="0" step="0.1" value="${esc(o.kg)}">`, 'kg')}
      ${fld('Price per kg ($)', `<input id="so-p" name="pricePerKg" type="number" min="0" step="0.01" value="${esc(o.pricePerKg)}">`, 'pricePerKg')}
      ${fld('Delivery date', `<input id="so-d" name="date" type="date" value="${esc(o.date)}">`, 'date')}
      ${fld('Order status', `<select id="so-st" name="status">${ORDER_ST.map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`, 'status', 'Delivered orders count as actual revenue.')}
      ${fld('Delivery vehicle', `<input id="so-veh" name="vehicle" value="${esc(o.delivery?.vehicle || '')}" placeholder="e.g. Van 1 (refrigerated)">`, 'vehicle')}
      ${fld('Delivery window', `<input id="so-win" name="window" value="${esc(o.delivery?.window || '')}" placeholder="e.g. 07:00–10:00">`, 'window')}</div>`,
    onOpen: m => {
      const sel = $('#so-crop', m);
      if (sel && sel.tagName === 'SELECT') sel.onchange = e => { $('#so-p', m).value = cropDef(e.target.value).price; };
    },
    validate: d => ({ customer: d.customer.trim().length < 2 && 'Enter the customer name.', crop: !String(d.crop || '').trim() && 'Enter or select a crop.', kg: !(+d.kg > 0) && 'Enter a quantity greater than 0 kg.', pricePerKg: !(+d.pricePerKg > 0) && 'Enter a price greater than $0.', date: !d.date && 'Choose a delivery date.' }),
    submit: async d => {
      const { vehicle, window: win, ...rest } = d;
      const baseDeliv = o.delivery || { status: 'Scheduled', vehicle: '', window: '' };
      const nextDelivStatus = rest.status === 'Delivered' ? 'Delivered' : rest.status === 'Cancelled' ? 'Cancelled' : (baseDeliv.status || 'Scheduled');
      const doc = {
        ...(existing ? o : { id: nextId('SO', orders()) }),
        ...rest,
        customer: rest.customer.trim(),
        crop: rest.crop.trim(),
        kg: +rest.kg,
        pricePerKg: +rest.pricePerKg,
        delivery: { ...baseDeliv, status: nextDelivStatus, vehicle: (vehicle || '').trim(), window: (win || '').trim() }
      };
      await Store.put('orders', doc);
      return `Order ${doc.id} saved.`;
    }
  });
}
const DELIV_ST = ['Not scheduled', 'Scheduled', 'Out for delivery', 'Delivered', 'Cancelled'];
function vLogistics() {
  const os = orders().filter(o => daysFrom(o.date) >= -3 && daysFrom(o.date) <= 14).sort((a, b) => a.date.localeCompare(b.date));
  return `${pageHead('Logistics', 'Delivery schedule for the past 3 and next 14 days.', can('sales') ? `<button class="btn primary" data-act="order-new">${ic('plus')}New order</button>` : '')}
  <div class="notice">${ic('truck')}<div>Live vehicle tracking and route optimization need a fleet or GPS integration that is <b>not connected</b>. Delivery statuses here are updated by hand.</div></div>
  <div class="stats">${DELIV_ST.slice(0, 4).map(s => `<div class="pill-stat"><b>${os.filter(o => o.delivery?.status === s).length}</b><span>${s}</span></div>`).join('')}</div>
  ${card('Deliveries', os.length ? `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Order</th><th>Customer</th><th class="r">Load</th><th>Vehicle</th><th>Window</th><th>Delivery status</th>${can('sales') ? '<th><span class="sr">Actions</span></th>' : ''}</tr></thead><tbody>${os.map(o => `<tr><td class="num">${fmtD(o.date)}<div class="small muted">${daysFrom(o.date) === 0 ? 'Today' : daysFrom(o.date) > 0 ? 'in ' + daysFrom(o.date) + ' d' : -daysFrom(o.date) + ' d ago'}</div></td><td class="mono">${esc(o.id)}</td><td>${esc(o.customer)}<div class="small muted">${esc(cropDef(o.crop).label)}</div></td><td class="r num">${num(o.kg)} kg</td><td class="small">${esc(o.delivery?.vehicle || '—')}</td><td class="small num">${esc(o.delivery?.window || '—')}</td><td>${can('sales') ? `<label class="sr" for="dl-${esc(o.id)}">Delivery status for ${esc(o.id)}</label><select class="select" id="dl-${esc(o.id)}" data-deliv="${esc(o.id)}" style="height:34px">${DELIV_ST.map(s => `<option ${o.delivery?.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>` : `<span class="badge b-info">${esc(o.delivery?.status)}</span>`}</td>${can('sales') ? `<td class="r"><button class="btn sm ghost" data-act="order-edit" data-id="${esc(o.id)}">Edit</button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : empty('truck', 'No deliveries in this window', 'Orders with delivery dates appear here.'))}`;
}

/* ================= Modal & forms ================= */
const fld = (label, control, name, hint = '') => { const idm = control.match(/id="([^"]+)"/); const id = idm ? idm[1] : ''; return `<div class="field"><label for="${id}">${label}</label>${control.replace(/(<(?:input|select|textarea)\b)/, `$1 aria-describedby="err-${name}${hint ? ' hint-' + name : ''}"`)}${hint ? `<span class="hint" id="hint-${name}">${hint}</span>` : ''}<p class="err" id="err-${name}"></p></div>`; };
let modalCfg = null;
function openModal(cfg) {
  const m = $('#modal'); modalCfg = cfg;
  if (m.open) m.close();
  m.className = cfg.wide ? 'wide' : '';
  m.innerHTML = `<form id="modalForm" novalidate><div class="m-h"><h2 id="modalTitle">${esc(cfg.title)}</h2><button type="button" class="icon-btn" data-close aria-label="Close dialog">${ic('x')}</button></div><div class="m-b">${cfg.body}</div><div class="m-f"><p class="err" id="formErr" role="alert" style="margin-right:auto;align-self:center"></p>${cfg.footer || ''}${cfg.submitLabel ? `<button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn ${cfg.danger ? 'danger' : 'primary'}" id="modalSubmit">${esc(cfg.submitLabel)}</button>` : ''}</div></form>`;
  m.showModal();
  cfg.onOpen && cfg.onOpen(m);
  const first = $('.m-b input:not([type=hidden]):not([readonly]), .m-b select, .m-b textarea', m); if (first) first.focus();
}
function closeModal() { const m = $('#modal'); if (m.open) m.close(); modalCfg = null; }
async function submitModal(form) {
  const cfg = modalCfg; if (!cfg || !cfg.submit) return;
  const d = {}; $$('input,select,textarea', form).forEach(el => { if (!el.name) return; d[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
  $$('.err', form).forEach(e => e.textContent = ''); $$('[aria-invalid]', form).forEach(e => e.removeAttribute('aria-invalid'));
  const errs = cfg.validate ? cfg.validate(d) : {}; let firstBad = null;
  Object.entries(errs).forEach(([k, msg]) => { if (!msg) return; const e = $('#err-' + k, form); if (e) e.textContent = msg; const inp = form.querySelector(`[name="${k}"]`); if (inp) { inp.setAttribute('aria-invalid', 'true'); firstBad = firstBad || inp; } });
  if (firstBad) { firstBad.focus(); $('#formErr', form).textContent = 'Fix the highlighted fields to continue.'; return; }
  const btn = $('#modalSubmit', form), label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Saving…';
  try { const res = await cfg.submit(d); if (modalCfg === cfg) closeModal(); if (res) typeof res === 'string' ? toast(res) : toast(res.msg, res.type); }
  catch (e) { console.error(e); btn.disabled = false; btn.innerHTML = label; $('#formErr', form).textContent = errText(e); }
}
function toast(msg, type = '') {
  const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.innerHTML = ic(type === 'error' ? 'alert' : 'check') + `<span>${esc(msg)}</span>`;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), type === 'error' ? 6500 : 3800);
}
function confirmDelete(what, fn) {
  openModal({ title: `Delete ${what}?`, submitLabel: 'Delete', danger: true, body: `<p>This removes ${esc(what)} for everyone using this farm. It cannot be undone.</p>`, submit: fn });
}

/* ================= Search ================= */
let sIdx = -1, sItems = [];
function searchAll(q) {
  q = q.toLowerCase().trim(); if (q.length < 2) return [];
  const R = [];
  Object.entries(ROUTES).forEach(([k, r]) => r.group && r.label.toLowerCase().includes(q) && R.push({ type: 'Page', label: r.label, go: () => go(k) }));
  greenhouses().forEach(g => (`${g.name} ${g.main || ''} ${g.system || ''}`.toLowerCase().includes(q)) && R.push({ type: 'Greenhouse', label: `${g.name} · ${ST_LABEL[ghStatus(g.id)]}`, go: () => go(g.id) }));
  batches().forEach(b => { const cLabel = cropDef(b.crop).label; return (`${b.id} ${b.crop} ${cLabel} ${b.variety || ''} ${b.zone}`.toLowerCase().includes(q)) && R.push({ type: 'Batch', label: `${b.id} · ${cLabel} · ${b.stage}`, go: () => batchDetail(b.id) }); });
  tasks().forEach(t => (`${t.id} ${t.title} ${t.assignee}`.toLowerCase().includes(q)) && R.push({ type: 'Task', label: `${t.title} · ${t.assignee}`, go: () => taskForm(t.id) }));
  inventory().forEach(i => (`${i.id} ${i.name} ${i.supplier || ''}`.toLowerCase().includes(q)) && R.push({ type: 'Inventory', label: `${i.name} · ${num(i.qty)} ${i.unit}`, go: () => { ui.invQ = i.name; go('inventory'); } }));
  orders().slice(0, 80).forEach(o => (`${o.id} ${o.customer}`.toLowerCase().includes(q)) && R.push({ type: 'Order', label: `${o.id} · ${o.customer} · ${o.status}`, go: () => { ui.saleF = o.id; go('sales'); } }));
  return R.slice(0, 12);
}
function renderSearch() {
  const box = $('#gresults'), inp = $('#gsearch');
  sItems = searchAll(inp.value);
  if (inp.value.trim().length < 2) { box.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
  box.innerHTML = sItems.length ? sItems.map((r, i) => `<div role="option" id="sr-${i}" aria-selected="${i === sIdx}" data-i="${i}"><span class="sr-type">${r.type}</span><span>${esc(r.label)}</span></div>`).join('') : `<div class="muted small" style="padding:10px">No records match “${esc(inp.value)}”.</div>`;
  box.hidden = false; inp.setAttribute('aria-expanded', 'true');
  inp.setAttribute('aria-activedescendant', sIdx >= 0 ? 'sr-' + sIdx : '');
}
function pickSearch(i) { const r = sItems[i]; if (!r) return; $('#gsearch').value = ''; sIdx = -1; renderSearch(); r.go(); }

let mItems = [];
function renderMobileSearch() {
  const box = $('#mobileSearchResults'), inp = $('#mobileSearchInp');
  if (!box || !inp) return;
  mItems = searchAll(inp.value);
  if (inp.value.trim().length < 2) { box.hidden = true; return; }
  box.innerHTML = mItems.length ? mItems.map((r, i) => `<div role="option" data-mi="${i}" style="display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:8px;cursor:pointer"><span class="sr-type">${r.type}</span><span>${esc(r.label)}</span></div>`).join('') : `<div class="muted small" style="padding:10px">No records match “${esc(inp.value)}”.</div>`;
  box.hidden = false;
}
function pickMobileSearch(i) {
  const r = mItems[i]; if (!r) return;
  closePops();
  r.go();
}

/* ================= Popovers & nav ================= */
function togglePop(btn, pop, html) {
  const open = pop.hidden; closePops();
  if (open) { pop.innerHTML = html(); pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); const f = pop.querySelector('button,a,select'); f && f.focus(); }
}
function closePops() {
  [['#bellBtn', '#bellPop'], ['#profileBtn', '#profilePop'], ['#mobileUtilBtn', '#mobileUtilPop']].forEach(([b, p]) => {
    const el = $(p); if (el) el.hidden = true;
    const btn = $(b); if (btn) btn.setAttribute('aria-expanded', 'false');
  });
}
const bellHtml = () => { const a = activeAlerts().slice(0, 5); return `<div class="split" style="justify-content:space-between;margin-bottom:8px"><h3>Notifications</h3><a class="btn sm" href="#alerts">All alerts</a></div>${a.length ? `<div class="alerts">${a.map(x => `<a class="alert ${x.sev}" style="grid-template-columns:auto 1fr;text-decoration:none;color:inherit" href="${x.link || '#alerts'}"><span class="sev-ico">${ic(x.icon)}</span><div><b>${esc(x.title)}</b><div class="alert-meta">${badge(x.sev)}<span class="small muted">${ageText(x.age)}</span></div></div></a>`).join('')}</div>` : '<p class="muted">You are all caught up.</p>'}`; };
const profileHtml = () => {
  const u = currentUser();
  const editFarmBtn = can('targets') ? `<button class="btn sm" data-act="farm-edit" style="width:100%;margin-bottom:8px">${ic('edit')}Edit farm details</button>` : '';
  if (!AuthState.isDemoAuth && AuthState.user) {
    return `<div class="split" style="margin-bottom:12px"><span class="avatar" style="width:40px;height:40px">${u.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}</span><div><b>${esc(u.name)}</b><div class="small muted">${esc(AuthState.profile?.email || AuthState.user.email || '')}</div><div class="small muted">${esc(u.role)} · ${esc(activeFarmName())}</div></div></div>
      ${editFarmBtn}
      <hr style="border:0;border-top:1px solid var(--line);margin:12px 0">
      <button class="btn" data-act="auth-signout" style="width:100%">Sign out</button>`;
  }
  return `<div class="split" style="margin-bottom:12px"><span class="avatar" style="width:40px;height:40px">${u.name.split(' ').map(x => x[0]).join('')}</span><div><b>${esc(u.name)}</b><div class="small muted">${esc(u.role)} · ${esc(activeFarmName())}</div></div></div>
  ${editFarmBtn}
  <div class="field"><label for="roleSel">Viewing as role (demo)</label><select id="roleSel" class="select">${Object.keys(ROLES).map(r => `<option ${r === ui.role ? 'selected' : ''}>${r}</option>`).join('')}</select><span class="hint">Owners see finances and settings. Managers run operations. Workers complete tasks, log observations, record harvests and stock use.</span></div>
  <hr style="border:0;border-top:1px solid var(--line);margin:12px 0"><button class="btn" data-act="auth-signout" style="width:100%">Sign out</button>`;
};

const mobileUtilHtml = () => {
  const al = activeAlerts();
  const u = currentUser();
  const isDark = currentTheme() === 'dark';
  const farmOpts = (!AuthState.isDemoAuth && AuthState.farms.length)
    ? AuthState.farms.map(f => `<option value="${esc(f.farmId)}" ${f.farmId === AuthState.currentFarmId ? 'selected' : ''}>${esc(f.name)}</option>`).join('')
    : `<option value="riverside" ${ui.farm === 'riverside' ? 'selected' : ''}>${esc(activeFarmName())}</option><option value="hilltop" ${ui.farm === 'hilltop' ? 'selected' : ''}>Hilltop Annex</option>`;
  return `
  <div class="mobile-util-menu">
    <div class="mu-section">
      <div class="mu-title">${ic('search')} Search Farm Records</div>
      <div class="search" style="max-width:none">
        <label for="mobileSearchInp" class="sr">Search farm records</label>
        <input id="mobileSearchInp" type="search" placeholder="Search batches, tasks, inventory, orders…" autocomplete="off">
        <div class="search-results" id="mobileSearchResults" role="listbox" hidden style="position:static;max-height:220px;margin-top:6px;box-shadow:none"></div>
      </div>
    </div>

    /*
    <div class="mu-section">
      <div class="mu-title">${ic('house')} Active Farm</div>
      <label for="mobileFarmSel" class="sr">Select farm</label>
      <select id="mobileFarmSel" class="select" style="width:100%">
        ${farmOpts}
      </select>
      ${!AuthState.isDemoAuth && AuthState.user ? `<button class="btn sm" data-act="farm-new" style="width:100%;margin-top:8px">${ic('plus')}Create new farm</button>` : ''}
    </div>
    */

    <div class="mu-section">
      <div class="mu-title">${ic('gauge')} Data Source Mode</div>
      ${dataModeToggleHtml('mu-dm-toggle')}
    </div>

    <div class="mu-section">
      <div class="mu-title">${ic('plus')} Quick Actions</div>
      <div class="mu-grid">
        ${can('tasks') ? `<button class="btn sm" data-act="task-new">${ic('plus')}New task</button>` : ''}
        ${can('batches') ? `<button class="btn sm" data-act="batch-new">${ic('plus')}Add batch</button>` : ''}
        ${can('harvest') ? `<button class="btn sm" data-act="harvest-new">${ic('plus')}Log harvest</button>` : ''}
        ${can('inventory') ? `<button class="btn sm" data-act="inv-new">${ic('plus')}Add item</button>` : ''}
        ${can('finance') ? `<button class="btn sm" data-act="expense-new">${ic('plus')}Expense</button>` : ''}
      </div>
    </div>

    <div class="mu-section">
      <div class="mu-title">${ic('gauge')} Utilities</div>
      <div class="mu-list">
        <button class="mu-item" id="mobileThemeToggleBtn" type="button">
          <span class="chip-ico">${ic(isDark ? 'sun' : 'moon')}</span>
          <div style="flex:1;text-align:left">
            <b>Theme</b>
            <div class="small muted">${isDark ? 'Dark Mode (tap for Light)' : 'Light Mode (tap for Dark)'}</div>
          </div>
          <span class="badge ${isDark ? 'b-ok' : 'b-warn'}">${isDark ? 'Dark' : 'Light'}</span>
        </button>

        <a class="mu-item" href="#alerts" style="text-decoration:none;color:inherit">
          <span class="chip-ico">${ic('bell')}</span>
          <div style="flex:1;text-align:left">
            <b>Notifications & Alerts</b>
            <div class="small muted">${al.length ? `${al.length} active warnings` : 'All nominal'}</div>
          </div>
          ${al.length ? `<span class="badge-count" style="position:static">${al.length}</span>` : '<span class="badge b-ok">Clear</span>'}
        </a>
      </div>
    </div>

    <div class="mu-section" style="border-bottom:none;padding-bottom:0;margin-bottom:0">
      <div class="mu-title">${ic('user')} User &amp; Role</div>
      <div class="split" style="margin-bottom:8px">
        <span class="avatar" style="width:34px;height:34px">${esc(u.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase())}</span>
        <div>
          <b>${esc(u.name)}</b>
          <div class="small muted">${esc(u.role)}</div>
        </div>
      </div>
      ${AuthState.isDemoAuth ? `<label for="mobileRoleSel" class="sr">Switch Role</label>
      <select id="mobileRoleSel" class="select" style="width:100%">
        ${Object.keys(ROLES).map(r => `<option ${r === ui.role ? 'selected' : ''}>${r}</option>`).join('')}
      </select>` : `<button class="btn" data-act="auth-signout" style="width:100%">Sign out</button>`}
    </div>
  </div>`;
};

function openNav() { $('#sidebar').classList.add('open'); $('#overlay').classList.add('show'); $('#menuBtn').setAttribute('aria-expanded', 'true'); $('#nav a')?.focus(); }
function closeNav() { $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }

/* ================= Events ================= */
document.addEventListener('click', async e => {
  const t = e.target;
  const dmBtn = t.closest('[data-data-mode]');
  if (dmBtn) {
    e.preventDefault();
    setDataMode(dmBtn.dataset.dataMode);
    return;
  }
  const hvScroll = t.closest('[data-hv-scroll]');
  if (hvScroll) {
    e.preventDefault();
    const targetEl = document.getElementById(hvScroll.dataset.hvScroll);
    if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const authNav = t.closest('[data-act="auth-nav"]');
  if (authNav) {
    e.preventDefault();
    AuthState.authView = authNav.dataset.view || 'welcome';
    AuthState.error = '';
    AuthState.successMsg = '';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const pwdToggle = t.closest('[data-act="toggle-pwd"]');
  if (pwdToggle) {
    e.preventDefault();
    const inp = document.getElementById(pwdToggle.dataset.target);
    if (inp) {
      inp.type = inp.type === 'password' ? 'text' : 'password';
      pwdToggle.textContent = inp.type === 'password' ? 'Show' : 'Hide';
    }
    return;
  }
  const signOutBtn = t.closest('[data-act="auth-signout"]');
  if (signOutBtn) {
    e.preventDefault();
    if (sbClient) await sbClient.auth.signOut();
    resetSensitiveStateOnSignOut();
    render();
    return;
  }
  if (t.closest('[data-close]')) { closeModal(); return; }
  const optEl = t.closest('#gresults [role=option]'); if (optEl) { pickSearch(+optEl.dataset.i); return; }
  const mobOpt = t.closest('#mobileSearchResults [role=option]'); if (mobOpt) { pickMobileSearch(+mobOpt.dataset.mi); return; }
  const mobTh = t.closest('#mobileThemeToggleBtn');
  if (mobTh) {
    toggleTheme();
    const pop = $('#mobileUtilPop'); if (pop && !pop.hidden) pop.innerHTML = mobileUtilHtml();
    return;
  }
  if (!t.closest('.pop-wrap')) closePops();
  if (!t.closest('.search')) { $('#gresults').hidden = true; $('#gsearch').setAttribute('aria-expanded', 'false'); }
  const segB = t.closest('[data-seg]');
  if (segB) {
    const n = segB.dataset.seg, v = segB.dataset.val;
    if (n === 'trendRange' || n === 'fcRange') ui[n] = +v; else if (n === 'taskStatus') ui.taskF.status = v; else if (n === 'taskWhen') ui.taskF.when = v; else ui[n] = v;
    render(); const again = $(`[data-seg="${n}"][data-val="${v}"]`); again && again.focus(); return;
  }
  const a = t.closest('[data-act]'); if (!a) return;
  closePops();
  const id = a.dataset.id, act = a.dataset.act;
  if (a.tagName === 'TR' && t.closest('button,a,select,input') && t.closest('button,a,select,input') !== a) return;
  switch (act) {
    case 'farm-edit': farmSettingsForm(); break;
    case 'store-retry': {
      const ok = await Store.loadFromBackend();
      render();
      toast(ok ? 'Farm data synchronized.' : 'Still unable to reach backend.', ok ? '' : 'error');
      break;
    }
    case 'gh-new': can('targets') ? ghForm() : toast('Adding greenhouses requires manager or owner access.', 'error'); break;
    case 'gh-edit': can('targets') ? ghForm(id) : toast('Editing greenhouses requires manager or owner access.', 'error'); break;
    case 'gh-delete': confirmDelete(`greenhouse ${ghName(id)}`, async () => { await Store.remove('greenhouses', id); if (ui.route === id) go('greenhouses'); return 'Greenhouse deleted.'; }); break;
    case 'crop-manage': cropsManagerModal(); break;
    case 'crop-new': cropForm(); break;
    case 'crop-edit': cropForm(id); break;
    case 'crop-delete': confirmDelete(`crop ${cropDef(id).label}`, async () => { await Store.remove('crops', id); return 'Crop removed.'; }); break;
    case 'team-manage': teamManagerModal(); break;
    case 'team-new': teamMemberForm(); break;
    case 'team-edit': teamMemberForm(id); break;
    case 'team-delete': confirmDelete('this team member', async () => { await Store.remove('team', id); return 'Team member removed.'; }); break;
    case 'batch': batchDetail(id); break;
    case 'batch-new': can('batches') ? batchForm() : toast('Adding batches is not available for this role.', 'error'); break;
    case 'batch-edit': batchForm(id); break;
    case 'batch-delete': confirmDelete(`batch ${id}`, async () => { await Store.remove('batches', id); return `Batch ${id} deleted.`; }); break;
    case 'obs-new': obsForm(id); break;
    case 'clear-plant-filters': ui.plantF = { q: '', gh: '', stage: '' }; render(); break;
    case 'harvest-record':
    case 'harvest-new': harvestForm(id); break;
    case 'harvest-view': harvestView(id); break;
    case 'harvest-edit': harvestEditForm(id); break;
    case 'harvest-delete': confirmDelete(`harvest ${id}`, async () => { await Store.remove('harvests', id); return `Harvest ${id} deleted.`; }); break;
    case 'cal-prev': ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() - 1, 1); render(); break;
    case 'cal-next': ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() + 1, 1); render(); break;
    case 'cal-today': ui.calMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); render(); break;
    case 'task-new': taskForm(); break;
    case 'task-edit': taskForm(id); break;
    case 'task-toggle': toggleTask(id); break;
    case 'task-delete': confirmDelete('this task', async () => { await Store.remove('tasks', id); return 'Task deleted.'; }); break;
    case 'inv-new': invForm(); break;
    case 'inv-edit': invForm(id); break;
    case 'inv-delete': confirmDelete('this inventory item', async () => { await Store.remove('inventory', id); return 'Inventory item deleted.'; }); break;
    case 'move-new': moveForm(id); break;
    case 'alert-ack': setAlert(id, 'acknowledged'); break;
    case 'alert-resolve': setAlert(id, 'resolved'); break;
    case 'alert-reopen': setAlert(id, 'new'); break;
    case 'command': commandConfirm(a.dataset.gh, id); break;
    case 'reading-new': readingForm(id); break;
    case 'reading-edit': readingForm(null, id); break;
    case 'reading-delete': confirmDelete('this manual reading', async () => { await Store.remove('readings', id); return 'Reading deleted.'; }); break;
    case 'resource-new': resourceForm(); break;
    case 'targets-reset': try { await Store.put('targets', { id, ranges: DEFAULT_TARGETS[id] || FALLBACK_TARGETS }); toast('Default targets restored.'); } catch (er) { toast(errText(er), 'error'); } break;
    case 'integration': openModal({ title: 'Connect devices', submitLabel: null, body: `<div class="notice warn">${ic('plug')}<div><b>Device integration is not available in this prototype.</b> Nothing has been connected.</div></div><p>Hydrobot.Ai is structured for an IoT gateway that publishes readings per greenhouse and sensor via <span class="mono">POST /api/telemetry/ingest</span> or over MQTT topics for ${esc(activeFarmName())}. Once connected, readings stream into Live Data mode automatically, and equipment commands still require explicit confirmation.</p>`, footer: '<button type="button" class="btn" data-close>Close</button>' }); break;
    case 'disease-run': analyzeDiseaseImage(); break;
    case 'disease-reset': resetDiseaseAnalysis(); break;
    case 'disease-task': {
      const res = ui.disease?.result;
      if (!res) break;
      const b = ui.disease?.batchId ? Store.get('batches', ui.disease.batchId) : null;
      const topHyp = res.hypotheses?.[0]?.condition || 'plant pathology check';
      taskForm();
      setTimeout(() => {
        $('#k-title').value = b
          ? `Inspect ${b.id} for ${topHyp.toLowerCase()}`
          : `Inspect ${res.plantIdentified || 'plant'} for ${topHyp.toLowerCase()}`;
        if (b?.ghId) $('#k-gh').value = b.ghId;
        $('#k-pri').value = res.severity?.level === 'Severe' || res.severity?.level === 'Moderate' ? 'High' : 'Medium';
        $('#k-notes').value = `Vision AI preliminary screening (Severity: ${res.severity?.level || 'Undetermined'}).\nObserved: ${(res.observedSymptoms || []).join('; ')}\nNext steps:\n` + (res.recommendedSteps || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
      }, 30);
      break;
    }
    case 'disease-obs': {
      const b = ui.disease?.batchId ? Store.get('batches', ui.disease.batchId) : null;
      const res = ui.disease?.result;
      if (!b || !res) break;
      obsForm(b.id);
      setTimeout(() => {
        $('#o-note').value = `Vision AI screening (preliminary, severity: ${res.severity?.level || 'Undetermined'}): ${(res.hypotheses || []).map(h => `${h.condition} (${Math.round((h.confidence || 0) * 100)}%)`).join('; ')}. Observed: ${(res.observedSymptoms || []).slice(0, 2).join('; ')}.`;
      }, 30);
      break;
    }
    case 'ask': ask(a.dataset.q); break;
    case 'chat-clear': ui.chat = []; render(); break;
    case 'expense-new': expenseForm(); break;
    case 'expense-edit': expenseForm(id); break;
    case 'expense-delete': confirmDelete('this expense', async () => { await Store.remove('expenses', id); return 'Expense deleted.'; }); break;
    case 'order-new': orderForm(); break;
    case 'order-edit': orderForm(id); break;
    case 'order-delete': confirmDelete(`order ${id}`, async () => { await Store.remove('orders', id); return `Order ${id} deleted.`; }); break;
    case 'farm-main': ui.farm = 'riverside'; render(); break;
    // case 'farm-new': createFarmModal(); break;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePops(); closeNav(); $('#gresults').hidden = true; }
  const tr = e.target.closest && e.target.closest('tr[data-act]');
  if (tr && (e.key === 'Enter' || e.key === ' ') && e.target === tr) { e.preventDefault(); tr.click(); }
  if (e.target && e.target.id === 'mobileSearchInp' && e.key === 'Enter') {
    e.preventDefault();
    if (mItems && mItems.length) pickMobileSearch(0);
  }
});
document.addEventListener('input', e => {
  if (e.target && e.target.id === 'suPwd') {
    const val = e.target.value;
    const lenRule = $('#ruleLen');
    if (lenRule) {
      if (val.length >= 8) {
        lenRule.classList.add('valid');
        lenRule.textContent = '✓ At least 8 characters';
      } else {
        lenRule.classList.remove('valid');
        lenRule.textContent = '• At least 8 characters';
      }
    }
  }
  if (e.target && e.target.id === 'mobileSearchInp') { renderMobileSearch(); }
  const f = e.target.dataset && e.target.dataset.filter;
  if (f) { const [a, b] = f.split('.'); if (b) ui[a][b] = e.target.value; else ui[a] = e.target.value; render(); }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'roleSel' || t.id === 'mobileRoleSel') {
    if (!AuthState.isDemoAuth) {
      closePops();
      toast('Role changes are managed by farm membership.', 'error');
      return;
    }
    if (!ROLES[t.value]) return;
    ui.role = t.value;
    try { localStorage.setItem('hydrobot.role', ui.role); } catch (er) { }
    closePops();
    render();
    toast(`Now viewing as ${ui.role}.`);
    return;
  }
  /*
  if (t.id === 'farmSel' || t.id === 'mobileFarmSel') {
    ui.farm = t.value;
    if (!AuthState.isDemoAuth && AuthState.farms.length) {
      const f = AuthState.farms.find(x => x.farmId === t.value);
      if (f) {
        AuthState.currentFarmId = f.farmId;
        AuthState.role = f.role || 'worker';
        syncUiRoleFromAuth();
        await loadEquipmentCommands();
      }
    }
    closePops();
    render();
    return;
  }
  */
  if (t.id === 'showResolved') { ui.showResolved = t.checked; render(); return; }
  if (t.id === 'dFile' || t.id === 'dCamera') { loadDiseaseFile(t.files[0]); return; }
  if (t.id === 'dBatch' && ui.disease) { ui.disease.batchId = t.value; return; }
  if (t.id === 'dNotes') { if (!ui.disease) ui.disease = {}; ui.disease.notes = t.value; return; }
  if (t.dataset.deliv) { const o = Store.get('orders', t.dataset.deliv); const ds = t.value; try { await Store.put('orders', { ...o, delivery: { ...o.delivery, status: ds }, status: ds === 'Delivered' ? 'Delivered' : ds === 'Cancelled' ? 'Cancelled' : ds === 'Out for delivery' && o.status !== 'Delivered' ? 'Packed' : o.status }); toast(`${o.id}: ${ds}.`); } catch (er) { toast(errText(er), 'error'); } return; }
  if (t.dataset.filter && t.tagName === 'SELECT') { /* handled by input */ }
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'signInForm') {
    const email = $('#siEmail').value.trim();
    const password = $('#siPwd').value;

    AuthState.error = '';
    AuthState.successMsg = '';
    AuthState.loading = true;
    render();
    try {
      let signedIn = false;
      if (sbClient && !AuthState.isDemoAuth) {
        const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = String(error.message || '');
          if (/email not confirmed/i.test(msg)) {
            throw new Error('Your email is not verified yet. Please check your inbox and click the confirmation link before signing in.');
          }
          if (/invalid login credentials/i.test(msg)) {
            throw new Error('Invalid email or password.');
          }
          throw error;
        }
        if (!data?.session || !data?.user) {
          throw new Error('Sign-in failed to establish a valid session.');
        }
        AuthState.session = data.session;
        AuthState.user = data.user;
        await loadUserFarms();
        signedIn = true;
      } else {
        AuthState.session = { access_token: 'demo-token' };
        AuthState.user = { email, user_metadata: { full_name: email.split('@')[0] } };
        AuthState.farms = [{ farmId: 'riverside', name: Store.get('farm', 'meta')?.name || (isLiveMode() ? 'My Farm' : 'Riverside Hydro Farm'), role: 'owner' }];
        AuthState.role = 'owner';
        ui.role = 'Farm Owner';
        if (Store.mode === 'backend') await Store.loadFromBackend();
        signedIn = true;
      }
      if (signedIn) toast('Signed in successfully.');
    } catch (er) {
      AuthState.error = er?.message || 'Invalid email or password.';
    }
    AuthState.loading = false;
    render();
    return;
  }
  if (f.id === 'signUpForm') {
    AuthState.error = '';
    AuthState.successMsg = '';
    const name = $('#suName').value.trim();
    const email = $('#suEmail').value.trim().toLowerCase();
    const password = $('#suPwd').value;
    const confirm = $('#suPwdConfirm').value;
    if (password !== confirm) {
      AuthState.error = 'Passwords do not match.';
      render();
      return;
    }
    if (password.length < 8) {
      AuthState.error = 'Password must be at least 8 characters.';
      render();
      return;
    }
    AuthState.loading = true;
    render();
    try {
      if (!sbClient || AuthState.isDemoAuth) {
        throw new Error('Registration is unavailable because Supabase authentication is not configured in this environment.');
      }

      // Server-side pre-check: verifies allowlist (if configured) and Supabase signup policy
      let preCheckRes = null;
      try {
        preCheckRes = await fetch('/api/auth/signup-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch (_) {
        preCheckRes = null;
      }

      if (preCheckRes && preCheckRes.status !== 404 && preCheckRes.status !== 405) {
        const preCheckData = await preCheckRes.json().catch(() => null);
        if (!preCheckRes.ok || preCheckData?.allowed === false) {
          throw new Error(preCheckData?.error || 'Registration is restricted for this email address.');
        }
      }

      const { data, error } = await sbClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        const raw = String(error.message || '');
        if (/signups not allowed|signup_disabled/i.test(raw)) {
          throw new Error('Public registration is disabled in Supabase. Only invited or pre-approved accounts can sign in.');
        }
        if (/database error saving new user/i.test(raw)) {
          throw new Error('Access restricted: Registration was rejected by the database policy (this email address may not be authorized).');
        }
        if (/user already registered|already exists/i.test(raw)) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw error;
      }

      if (!data || !data.user || !data.user.id) {
        throw new Error('Account could not be created. Registration may be restricted.');
      }

      // Supabase returns identities: [] without an error when confirmation obfuscation suppresses signup
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('Account could not be registered. This email may already exist or require administrator approval.');
      }

      if (data.session) {
        AuthState.session = data.session;
        AuthState.user = data.user;
        await loadUserFarms();
        toast('Account created successfully.');
      } else {
        AuthState.successMsg = 'Check your email to confirm your account before signing in.';
      }
    } catch (er) {
      AuthState.error = er?.message || 'Could not create account.';
      AuthState.successMsg = '';
    }
    AuthState.loading = false;
    render();
    return;
  }
  if (f.id === 'resendVerifyForm') {
    AuthState.error = '';
    AuthState.successMsg = '';
    const email = $('#rvEmail').value.trim().toLowerCase();
    AuthState.loading = true;
    render();
    try {
      if (!sbClient || AuthState.isDemoAuth) {
        throw new Error('Email verification requires an active Supabase configuration.');
      }
      const { error } = await sbClient.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) throw error;
      AuthState.successMsg = 'A new confirmation email has been sent if your account is pending verification.';
    } catch (er) {
      AuthState.error = er?.message || 'Could not resend confirmation email.';
    }
    AuthState.loading = false;
    render();
    return;
  }
  if (f.id === 'forgotForm') {
    AuthState.error = '';
    AuthState.successMsg = '';
    const email = $('#fgEmail').value.trim();
    AuthState.loading = true;
    render();
    try {
      if (sbClient) {
        const { error } = await sbClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
      }
      AuthState.successMsg = 'Password reset instructions sent to your email.';
    } catch (er) {
      AuthState.error = er.message || 'Could not send reset email.';
    }
    AuthState.loading = false;
    render();
    return;
  }
  if (f.id === 'resetForm') {
    AuthState.error = '';
    AuthState.successMsg = '';
    const password = $('#rsPwd').value;
    if (password.length < 8) {
      AuthState.error = 'Password must be at least 8 characters.';
      render();
      return;
    }
    AuthState.loading = true;
    render();
    try {
      if (sbClient) {
        const { error } = await sbClient.auth.updateUser({ password });
        if (error) throw error;
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
        await loadUserFarms();
        toast('Password updated successfully.');
        AuthState.authView = AuthState.farms.length === 0 ? 'create_farm' : 'welcome';
      } else {
        AuthState.successMsg = 'Password updated successfully!';
        setTimeout(() => { AuthState.authView = 'signin'; render(); }, 1200);
      }
    } catch (er) {
      AuthState.error = er.message || 'Could not update password.';
    }
    AuthState.loading = false;
    render();
    return;
  }
  if (f.id === 'createFarmForm') {
    AuthState.error = '';
    const name = $('#cfName').value.trim();
    const location = $('#cfLoc').value.trim();
    AuthState.loading = true;
    render();
    try {
      if (sbClient) {
        const { data, error } = await sbClient.rpc('create_farm', { p_name: name, p_location: location });
        if (error) throw error;
        const createdId = data?.id || data?.farm_id || (Array.isArray(data) ? data[0]?.id || data[0]?.farm_id : null);
        if (createdId) AuthState.currentFarmId = createdId;
        await loadUserFarms();
      } else {
        AuthState.farms = [{ farmId: 'riverside', name, location, role: 'owner' }];
        AuthState.currentFarmId = 'riverside';
        AuthState.role = 'owner';
        AuthState.authView = 'welcome';
      }
      toast('Farm created successfully.');
    } catch (er) {
      AuthState.error = er?.message || 'Could not create farm. Please check your permissions and try again.';
    }
    AuthState.loading = false;
    render();
    return;
  }
  if (f.id === 'modalForm') return submitModal(f);
  if (f.id === 'chatForm') { const v = $('#chatIn').value; $('#chatIn').value = ''; return ask(v); }
  if (f.id === 'targetsForm') {
    const gh = f.dataset.gh, ranges = {}, err = $('#targetsErr'); let bad = null;
    $$('[aria-invalid]', f).forEach(x => x.removeAttribute('aria-invalid'));
    SENSORS.forEach(s => { const lo = f.elements[s.k + '-lo'], hi = f.elements[s.k + '-hi']; const a = parseFloat(lo.value), b = parseFloat(hi.value);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) { lo.setAttribute('aria-invalid', 'true'); hi.setAttribute('aria-invalid', 'true'); bad = bad || `${s.label}: minimum must be a number lower than maximum.`; }
      ranges[s.k] = [a, b]; });
    if (bad) { err.textContent = bad; $('[aria-invalid]', f).focus(); return; }
    err.textContent = ''; const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Saving…';
    try { await Store.put('targets', { id: gh, ranges }); toast(`Targets saved for ${ghName(gh)}.`); } catch (er) { err.textContent = errText(er); btn.disabled = false; btn.textContent = 'Save targets'; }
  }
});
$('#gsearch').addEventListener('input', () => { sIdx = -1; renderSearch(); });
$('#gsearch').addEventListener('focus', renderSearch);
$('#gsearch').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); sIdx = Math.min(sItems.length - 1, sIdx + 1); renderSearch(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); sIdx = Math.max(-1, sIdx - 1); renderSearch(); }
  else if (e.key === 'Enter') { e.preventDefault(); pickSearch(sIdx >= 0 ? sIdx : 0); }
});
/* ================= Theme Toggle ================= */
function currentTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateThemeUI() {
  const btn = $('#themeBtn');
  if (!btn) return;
  const isDark = currentTheme() === 'dark';
  btn.innerHTML = ic(isDark ? 'sun' : 'moon');
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', label);
}

function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('hydrobot-theme', next); } catch (e) {}
  updateThemeUI();
  scheduleRender();
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('hydrobot-theme'); } catch (e) {}
  if (saved === 'dark' || saved === 'light') {
    document.documentElement.setAttribute('data-theme', saved);
  }
  updateThemeUI();
}

initTheme();

$('#themeBtn')?.addEventListener('click', toggleTheme);
$('#bellBtn').addEventListener('click', e => { e.stopPropagation(); togglePop($('#bellBtn'), $('#bellPop'), bellHtml); });
$('#profileBtn').addEventListener('click', e => { e.stopPropagation(); togglePop($('#profileBtn'), $('#profilePop'), profileHtml); });
$('#mobileUtilBtn')?.addEventListener('click', e => { e.stopPropagation(); togglePop($('#mobileUtilBtn'), $('#mobileUtilPop'), mobileUtilHtml); });
$('#menuBtn').addEventListener('click', () => $('#sidebar').classList.contains('open') ? closeNav() : openNav());
$('#overlay').addEventListener('click', closeNav);
document.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('#dropZone'); if (z) { e.preventDefault(); z.classList.add('over'); } });
document.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('#dropZone'); if (z) z.classList.remove('over'); });
document.addEventListener('drop', e => { const z = e.target.closest && e.target.closest('#dropZone'); if (z) { e.preventDefault(); z.classList.remove('over'); loadDiseaseFile(e.dataTransfer.files[0]); } });
window.addEventListener('hashchange', route);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { updateThemeUI(); scheduleRender(); });
new MutationObserver(scheduleRender).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

/* ================= Boot ================= */
(async function boot() {
  buildDemo();
  initTheme();
  getKnowledgeBase();
  await loadRuntimeConfigAndInitSupabase();
  await initAuth();
  const h0 = location.hash.replace('#', '');
  ui.route = resolveRoute(h0) ? h0 : 'dashboard';
  render();
  const samplePromise = (async () => {
    try { if (!window.claude || typeof claude.use !== 'function') return; const s = await claude.use('sample'); if (!s) return; ui.sample = s; const lim = await s.limits().catch(() => null); ui.sampleImages = !!(lim && lim.images); scheduleRender(); } catch (e) { }
  })();
  await Store.init();
  const h1 = location.hash.replace('#', '');
  if (h1 && resolveRoute(h1)) ui.route = h1;
  render();
  await samplePromise;
})();


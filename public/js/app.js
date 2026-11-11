'use strict';
/* ================= Utilities ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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

/* ================= Demo reference data ================= */
const PEOPLE = [
  { id: 'p1', name: 'Diego Alvarez', role: 'Farm Manager' },
  { id: 'p2', name: 'Maria Santos', role: 'Farm Worker' },
  { id: 'p3', name: 'Kwame Mensah', role: 'Farm Worker' },
  { id: 'p4', name: 'Li Wei', role: 'Farm Worker' },
  { id: 'p5', name: 'Priya Nair', role: 'Farm Worker' },
];
const ROLES = {
  'Farm Owner': { name: 'Jordan Reyes', perms: ['batches', 'targets', 'tasks', 'inventory', 'finance', 'sales', 'commands', 'harvest'] },
  'Farm Manager': { name: 'Diego Alvarez', perms: ['batches', 'targets', 'tasks', 'inventory', 'sales', 'commands', 'harvest', 'financeView'] },
  'Farm Worker': { name: 'Maria Santos', perms: ['harvest'] },
};
const CROPS = {
  Lettuce: { label: 'Butterhead Lettuce', cycle: 42, price: 6.0, ypp: 0.18, continuous: false, ph: [5.6, 6.2], ec: { Germination: [0.4, 0.8], Seedling: [0.6, 1.0], Vegetative: [0.8, 1.4], Ready: [0.8, 1.2] } },
  Tomato: { label: 'Cherry Tomato', cycle: 80, price: 5.2, ypp: 0.16, continuous: true, ph: [5.8, 6.5], ec: { Germination: [0.8, 1.2], Seedling: [1.2, 1.8], Vegetative: [2.0, 2.8], Flowering: [2.4, 3.2], Fruiting: [2.6, 3.5], Ready: [2.6, 3.5] } },
  Basil: { label: 'Genovese Basil', cycle: 32, price: 22.0, ypp: 0.08, continuous: false, ph: [5.5, 6.5], ec: { Germination: [0.4, 0.8], Seedling: [0.6, 1.0], Vegetative: [1.0, 1.6], Ready: [1.0, 1.6] } },
  Strawberry: { label: 'Albion Strawberry', cycle: 75, price: 11.5, ypp: 0.045, continuous: true, ph: [5.5, 6.2], ec: { Seedling: [0.8, 1.0], Vegetative: [1.0, 1.4], Flowering: [1.2, 1.6], Fruiting: [1.4, 1.8], Ready: [1.4, 1.8] } },
};
const CROP_COLOR = { Lettuce: '--c1', Tomato: '--c2', Basil: '--c3', Strawberry: '--c4' };
const STAGES = ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Ready', 'Harvested'];
const GH = [
  { id: 'gh-a', code: 'A', name: 'Greenhouse A', system: 'NFT channels', area: 420, zones: ['A1', 'A2', 'A3'], main: 'Lettuce' },
  { id: 'gh-b', code: 'B', name: 'Greenhouse B', system: 'Dutch buckets', area: 380, zones: ['B1', 'B2'], main: 'Tomato' },
  { id: 'gh-c', code: 'C', name: 'Greenhouse C', system: 'Deep water culture', area: 260, zones: ['C1', 'C2'], main: 'Basil' },
  { id: 'gh-d', code: 'D', name: 'Greenhouse D', system: 'Vertical NFT towers', area: 300, zones: ['D1', 'D2'], main: 'Strawberry' },
];
const ghById = id => GH.find(g => g.id === id);
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
const CUSTOMERS = ['FreshMart Grocers', 'Bistro Verde', 'Harbor Street Market', 'GreenBox Meal Kits', 'City Food Co-op'];
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
    out.push({ id: 'SO-' + (2001 + i), customer: CUSTOMERS[i % CUSTOMERS.length], crop: h.crop, kg, pricePerKg: +(CROPS[h.crop].price * gradeAdj).toFixed(2), date, status: 'Delivered', harvestId: h.id, delivery: { status: 'Delivered', vehicle: i % 2 ? 'Van 2 (refrigerated)' : 'Van 1 (refrigerated)', window: '07:00–10:00' }, demo: true });
  });
  const up = [['FreshMart Grocers', 'Basil', 30, 2, 'Packed', 'Out for delivery'], ['Bistro Verde', 'Tomato', 18, 3, 'Confirmed', 'Scheduled'], ['GreenBox Meal Kits', 'Lettuce', 160, 4, 'Confirmed', 'Scheduled'], ['City Food Co-op', 'Strawberry', 20, 5, 'Confirmed', 'Scheduled'], ['Harbor Street Market', 'Lettuce', 60, 5, 'Draft', 'Not scheduled']];
  up.forEach(([customer, crop, kg, d, status, ds], i) => out.push({ id: 'SO-' + (2101 + i), customer, crop, kg, pricePerKg: CROPS[crop].price, date: dOff(d), status, delivery: { status: ds, vehicle: ds === 'Not scheduled' ? '' : i % 2 ? 'Van 2 (refrigerated)' : 'Van 1 (refrigerated)', window: '07:00–10:00' }, demo: true }));
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

/* ================= Storage: shared database with local fallback ================= */
const COLS = ['batches', 'tasks', 'inventory', 'movements', 'harvests', 'orders', 'expenses', 'targets', 'alerts', 'commands', 'readings'];
const LS_KEY = 'hydrobot.records.v1';
const Store = {
  mode: 'loading', db: null, data: {}, error: null,
  async init() {
    COLS.forEach(c => this.data[c] = {});
    let db = null;
    try { if (window.claude && typeof claude.use === 'function') db = await Promise.race([claude.use('db'), sleep(8000).then(() => null)]); } catch (e) { db = null; }
    if (!db) { this.mode = 'local'; this.loadLocal(); return; }
    this.db = db; this.mode = 'db';
    await new Promise(resolve => {
      let pending = COLS.length, done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      const timer = setTimeout(() => { this.error = 'The farm database is slow to respond. Showing what has loaded so far.'; finish(); }, 10000);
      COLS.forEach(col => {
        let first = true;
        db.collection(col).onSnapshot(snap => {
          const m = {}; snap.docs.forEach(d => { m[d.id] = d.data(); });
          this.data[col] = m;
          if (first) { first = false; if (--pending === 0) { clearTimeout(timer); finish(); } }
          else scheduleRender();
        }, err => {
          this.error = 'Lost connection to the farm database (' + err.code + '). Changes may not save.';
          if (first) { first = false; if (--pending === 0) { clearTimeout(timer); finish(); } }
          scheduleRender();
        });
      });
    });
  },
  loadLocal() {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) { const d = JSON.parse(raw); COLS.forEach(c => this.data[c] = d[c] || {}); } }
    catch (e) { this.error = 'Browser storage is blocked, so changes will last only until you close this page.'; }
  },
  saveLocal() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.data)); }
    catch (e) { throw { code: 'storage_full', message: 'Browser storage is full or blocked.' }; }
  },
  all(col) {
    const map = new Map((DEMO[col] || []).map(d => [d.id, d]));
    for (const [id, d] of Object.entries(this.data[col] || {})) map.set(id, d);
    return [...map.values()].filter(d => !d._deleted);
  },
  get(col, id) { return this.all(col).find(d => d.id === id); },
  async put(col, doc) {
    const clean = JSON.parse(JSON.stringify({ ...doc, updatedAt: Date.now(), updatedBy: currentUser().name }));
    const prev = this.data[col][doc.id];
    this.data[col] = { ...this.data[col], [doc.id]: clean };
    try {
      if (this.mode === 'db') await withRetry(() => this.db.collection(col).doc(doc.id).set(clean));
      else this.saveLocal();
    } catch (e) {
      const copy = { ...this.data[col] }; if (prev) copy[doc.id] = prev; else delete copy[doc.id]; this.data[col] = copy;
      throw e;
    }
    scheduleRender();
    return clean;
  },
  async remove(col, id) { const d = this.get(col, id); if (d) await this.put(col, { ...d, _deleted: true }); },
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
  return 'The change could not be saved. Check your connection and try again.';
}

/* ================= State ================= */
const ui = {
  route: 'dashboard', role: 'Farm Owner', farm: 'riverside', trendRange: 30,
  ghMetric: 'temp', ghRange: '24h', plantF: { q: '', gh: '', stage: '' }, taskF: { q: '', gh: '', who: '', pri: '', status: 'Open', when: 'all' },
  invCat: 'All', invQ: '', showResolved: false, calMonth: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), saleF: '',
  nutGh: 'gh-d', chat: [], chatBusy: false, disease: null, sample: null, sampleImages: false, fcRange: 56,
};
try { const r = localStorage.getItem('hydrobot.role'); if (r && ROLES[r]) ui.role = r; } catch (e) { }
const currentUser = () => ({ name: ROLES[ui.role].name, role: ui.role });
const can = p => ROLES[ui.role].perms.includes(p);

/* ================= Derived farm data ================= */
const batches = () => Store.all('batches');
const activeBatches = () => batches().filter(b => b.stage !== 'Harvested');
const tasks = () => Store.all('tasks');
const inventory = () => Store.all('inventory');
const harvests = () => Store.all('harvests').sort((a, b) => b.date.localeCompare(a.date));
const orders = () => Store.all('orders').sort((a, b) => b.date.localeCompare(a.date));
function targets(ghId) { const t = Store.get('targets', ghId); return { ...DEFAULT_TARGETS[ghId], ...(t ? t.ranges : {}) }; }
function manualReading(ghId) { return Store.all('readings').filter(r => r.ghId === ghId).sort((a, b) => b.at - a.at)[0]; }
function readings(ghId) { return { ...CURRENT[ghId] }; }
function metricStatus(v, range) {
  const [lo, hi] = range; if (v >= lo && v <= hi) return 'ok';
  const d = v < lo ? (lo - v) / Math.abs(lo || 1) : (v - hi) / Math.abs(hi || 1);
  return d > 0.15 ? 'crit' : 'warn';
}
function ghStatus(ghId) {
  const r = readings(ghId), t = targets(ghId); let worst = 'ok';
  SENSORS.forEach(s => { const st = metricStatus(r[s.k], t[s.k]); if (st === 'crit') worst = 'crit'; else if (st === 'warn' && worst === 'ok') worst = 'warn'; });
  return worst;
}
const ST_LABEL = { ok: 'Optimal', warn: 'Attention', crit: 'Critical' };
const badge = st => `<span class="badge b-${st}">${ST_LABEL[st]}</span>`;
const isOverdue = t => t.status !== 'Done' && new Date(parseD(t.due).getTime() + timeMs(t.time)) < new Date();
const timeMs = t => { const [h, m] = String(t || '23:59').split(':').map(Number); return (h * 60 + m) * 60000; };
function readiness(b) {
  const p = parseD(b.plantedOn), e = parseD(b.expectedHarvest);
  if (b.stage === 'Ready') return Math.max(95, Math.round(clamp((TODAY - p) / Math.max(DAY, e - p), 0, 1) * 100));
  return Math.round(clamp((TODAY - p) / Math.max(DAY, e - p), 0, 1) * 100);
}
function ghPlants(ghId) { return activeBatches().filter(b => b.ghId === ghId).reduce((s, b) => s + Number(b.plants), 0); }
function ghCrops(ghId) { return [...new Set(activeBatches().filter(b => b.ghId === ghId).map(b => CROPS[b.crop].label))]; }
function forecastItems(horizon) {
  const out = [];
  activeBatches().forEach(b => {
    const c = CROPS[b.crop]; let d = daysFrom(b.expectedHarvest);
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
  const rev = f30.reduce((s, i) => s + i.kg * CROPS[i.crop].price, 0);
  const open = tasks().filter(t => t.status !== 'Done');
  const ready = act.filter(b => b.stage === 'Ready' || daysFrom(b.expectedHarvest) <= 7);
  const gOn = GH.filter(g => ghPlants(g.id) > 0).length;
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
  GH.forEach(g => {
    const r = readings(g.id), t = targets(g.id);
    SENSORS.forEach(s => {
      const st = metricStatus(r[s.k], t[s.k]); if (st === 'ok') return;
      const low = r[s.k] < t[s.k][0];
      let title = `${s.label} ${low ? 'low' : 'high'} in ${g.name}`;
      if (s.k === 'res') title = `Low water level in ${g.name} reservoir`;
      if (s.k === 'temp') title = `Temperature ${low ? 'below' : 'above'} target in ${g.name}`;
      list.push({ id: `sensor-${g.id}-${s.k}`, sev: st, kind: s.k === 'res' ? 'Water level' : s.k === 'temp' ? 'Temperature' : 'Sensor', icon: s.icon, title,
        detail: `Reading ${num(r[s.k], s.dec)}${s.unit ? ' ' + s.unit : ''}, target ${t[s.k][0]}–${t[s.k][1]}${s.unit ? ' ' + s.unit : ''}. Demo reading.`, link: '#' + g.id, linkLabel: 'Open ' + g.name, age: READ_AT[g.id] });
    });
  });
  batches().forEach(b => (b.observations || []).forEach((o, i) => {
    if (o.flag && b.stage !== 'Harvested' && daysFrom(o.date) >= -14) list.push({ id: `disease-${b.id}-${i}`, sev: 'crit', kind: 'Suspected disease', icon: 'scan', title: `${o.flag} reported in ${b.id} (${CROPS[b.crop].label})`, detail: `${ghById(b.ghId).name}, zone ${b.zone}: “${o.note}” — ${o.by}, ${fmtD(o.date)}.`, action: { act: 'batch', id: b.id, label: 'View batch' }, age: -daysFrom(o.date) * 1440 });
  }));
  inventory().filter(i => Number(i.qty) < Number(i.threshold)).forEach(i => list.push({ id: `inv-${i.id}`, sev: Number(i.qty) < Number(i.threshold) * 0.5 ? 'crit' : 'warn', kind: 'Low inventory', icon: 'box', title: `${i.name} below reorder point`, detail: `${num(i.qty)} ${i.unit} on hand, reorder at ${num(i.threshold)} ${i.unit}. Supplier: ${i.supplier}.`, link: '#inventory', linkLabel: 'Open inventory', age: 600 }));
  tasks().filter(isOverdue).forEach(t => list.push({ id: `task-${t.id}`, sev: t.priority === 'High' ? 'crit' : 'warn', kind: 'Overdue task', icon: 'clipboard', title: `Overdue: ${t.title}`, detail: `Assigned to ${t.assignee}, ${ghById(t.ghId)?.name || ''}. Was due ${fmtD(t.due)} at ${fmtT(t.time)}.`, action: { act: 'task-edit', id: t.id, label: 'Open task' }, age: Math.round((Date.now() - parseD(t.due).getTime() - timeMs(t.time)) / 60000) }));
  const state = Store.data.alerts || {};
  list.forEach(a => { a.state = state[a.id]?.status || 'new'; a.stateBy = state[a.id]?.updatedBy; });
  const sevRank = { crit: 0, warn: 1 };
  return list.sort((a, b) => (a.state === 'acknowledged') - (b.state === 'acknowledged') || sevRank[a.sev] - sevRank[b.sev] || a.age - b.age);
}
const activeAlerts = () => alerts().filter(a => a.state !== 'resolved');
const ageText = m => m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;

/* Sensor history (demo, deterministic) */
function history(ghId, key, range) {
  const r = rng(hash(ghId + key + range)), cur = CURRENT[ghId][key], t = DEFAULT_TARGETS[ghId][key];
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

/* ================= Rendering infrastructure ================= */
let charts = [];
let renderQueued = false;
function scheduleRender() { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; render(); }); }
const ROUTES = {
  dashboard: { label: 'Dashboard', icon: 'grid', group: 'Overview', view: () => vDashboard() },
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
GH.forEach(g => ROUTES[g.id] = { label: g.name, parent: 'greenhouses', view: () => vGhDetail(g.id) });

function renderNav() {
  const groups = {}; Object.entries(ROUTES).forEach(([k, r]) => { if (r.group) (groups[r.group] = groups[r.group] || []).push([k, r]); });
  const cur = ROUTES[ui.route]?.parent || ui.route;
  const ac = Store.mode === 'loading' ? 0 : activeAlerts().filter(a => a.state === 'new').length;
  $('#nav').innerHTML = Object.entries(groups).map(([g, items]) => `<div class="nav-group" role="group" aria-labelledby="ng-${g.replace(/\W/g, '')}"><div class="nav-label" id="ng-${g.replace(/\W/g, '')}">${g}</div>${items.map(([k, r]) => `<a href="#${k}" ${cur === k ? 'aria-current="page"' : ''}>${ic(r.icon)}<span>${r.label}</span>${k === 'alerts' && ac ? `<span class="count" aria-label="${ac} new alerts">${ac}</span>` : ''}</a>`).join('')}</div>`).join('');
  const modeTxt = Store.mode === 'db' ? ['--ok', 'Records saved to the shared farm database'] : Store.mode === 'local' ? ['--warn', 'Records saved in this browser only'] : ['--muted', 'Connecting to storage…'];
  $('#sideFoot').innerHTML = `<div class="row"><span class="dot" style="background:var(${modeTxt[0]})"></span>${modeTxt[1]}</div><div class="row"><span class="dot" style="background:var(--side-dim)"></span>Sensor feeds: demo data, no devices connected</div>`;
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
    $('#profileBtn').innerHTML = `<span class="avatar">${u.name.split(' ').map(x => x[0]).join('')}</span><span class="who"><b>${esc(u.name)}</b><span>${esc(u.role)}</span></span>`;
  }
  if ($('#farmSel')) $('#farmSel').value = ui.farm;
  if ($('#mobileUtilBtn')) {
    $('#mobileUtilBtn').innerHTML = ic('grid') + (n ? `<span class="badge-count" aria-hidden="true">${n}</span>` : '');
    $('#mobileUtilBtn').setAttribute('aria-label', `Quick utilities and menu${n ? `, ${n} new alerts` : ''}`);
  }
  updateThemeUI();
}
function render() {
  const fa = document.activeElement, fid = fa && fa.id, sel = fa && 'selectionStart' in fa ? [fa.selectionStart, fa.selectionEnd] : null;
  charts.forEach(c => c.destroy()); charts = [];
  renderNav(); renderTop();
  const view = $('#view');
  if (Store.mode === 'loading') { view.innerHTML = loadingView(); return; }
  const r = ROUTES[ui.route] || ROUTES.dashboard;
  let html;
  if (ui.farm !== 'riverside') html = vEmptyFarm();
  else { try { html = r.view(); } catch (e) { console.error(e); html = `<div class="card card-b"><div class="notice crit">${ic('alert')}<div><b>This page could not be displayed.</b> ${esc(e.message)}. Try another page, then come back.</div></div></div>`; } }
  view.innerHTML = (Store.error ? `<div class="notice warn" role="alert">${ic('alert')}<div>${esc(Store.error)}</div></div>` : '') + html;
  postRender.forEach(f => { try { f(); } catch (e) { console.error(e); } }); postRender = [];
  if (fid) { const el = document.getElementById(fid); if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); if (sel && 'setSelectionRange' in el) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
}
let postRender = [];
const after = f => postRender.push(f);
function loadingView() {
  return `<div class="page-head"><div><h1>Loading farm records…</h1><p>Connecting to the farm database.</p></div></div><div class="card card-b loading-screen" aria-busy="true">${'<div class="skeleton"></div>'.repeat(6)}</div>`;
}
function vEmptyFarm() {
  return `<div class="page-head"><div><h1>Hilltop Annex</h1><p>No greenhouses have been set up for this farm yet.</p></div></div>
  <div class="card"><div class="empty"><span class="chip-ico">${ic('house')}</span><b>Nothing to show for Hilltop Annex</b><p>Farm setup and multi-site management need an account integration that is not connected in this prototype.</p><button class="btn primary" data-act="farm-main">Switch to Riverside Hydro Farm</button></div></div>`;
}
function go(route) { if (location.hash !== '#' + route) location.hash = route; else { ui.route = route; render(); } }
function route() {
  const h = location.hash.replace('#', '');
  ui.route = ROUTES[h] ? h : 'dashboard';
  closeNav(); render(); window.scrollTo(0, 0);
  const v = $('#view'); if (v && document.activeElement && document.activeElement.closest('.nav')) v.focus({ preventScroll: true });
}
const pageHead = (title, sub, actions = '', crumb = '') => `<div class="page-head"><div>${crumb}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="toolbar">${actions}</div></div>`;
const card = (title, body, { sub = '', actions = '', cls = '', id = '' } = {}) => `<section class="card ${cls}" ${id ? `id="${id}"` : ''} aria-label="${esc(title.replace(/<[^>]+>/g, ''))}"><div class="card-h"><div><h2>${title}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${actions ? `<div class="toolbar">${actions}</div>` : ''}</div><div class="card-b">${body}</div></section>`;
const empty = (icon, title, text, action = '') => `<div class="empty"><span class="chip-ico">${ic(icon)}</span><b>${title}</b><p>${text}</p>${action}</div>`;
const seg = (name, options, value, label) => `<div class="seg" role="group" aria-label="${label}">${options.map(([v, l]) => `<button type="button" data-seg="${name}" data-val="${v}" aria-pressed="${String(v) === String(value)}">${l}</button>`).join('')}</div>`;
const SIM_TAG = '<span class="tag sim">' + ic('spark') + 'Simulated AI · rule-based demo</span>';
const DEMO_TAG = '<span class="tag demo">Demo sensor data</span>';
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
  const k = kpis(), al = activeAlerts();
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const todayTasks = tasks().filter(t => t.due === dOff(0) || isOverdue(t)).sort((a, b) => (a.status === 'Done') - (b.status === 'Done') || (b.due < a.due) - (a.due < b.due) || a.time.localeCompare(b.time));
  const dueToday = k.open.filter(t => t.due === dOff(0)).length, overdue = k.open.filter(isOverdue).length;
  const k6 = [
    ['sprout', 'Total plants', num(k.plants), `${k.batches} active crop batches`],
    ['house', 'Active greenhouses', `${k.gOn}<span class="muted" style="font-size:1rem"> / ${GH.length}</span>`, 'Sensor feeds are demo data'],
    ['leaf', 'Average plant health', `${num(k.health, 1)}<span class="muted" style="font-size:1rem">%</span>`, 'Weighted by plant count'],
    ['wallet', 'Projected harvest revenue', money(k.rev), `<span class="tag proj">Projection</span> next 30 days, ${num(k.f30kg)} kg`],
    ['clipboard', 'Open tasks', num(k.open.length), `${dueToday} due today${overdue ? ` · <span class="overdue">${overdue} overdue</span>` : ''}`],
    ['basket', 'Crops ready to harvest', num(k.ready.length), 'Batches ready within 7 days'],
  ];
  const pipe = activeBatches().sort((a, b) => a.expectedHarvest.localeCompare(b.expectedHarvest)).slice(0, 6);
  return `
  ${pageHead('Dashboard', `${greeting}, ${esc(currentUser().name.split(' ')[0])} · Riverside Hydro Farm · ${fmtDL(dOff(0))}`, `${DEMO_TAG}<a class="btn" href="#alerts">${ic('bell')}Alerts (${al.length})</a>${can('tasks') ? `<button class="btn primary" data-act="task-new">${ic('plus')}New task</button>` : ''}`)}
  <section class="kpis" aria-label="Farm summary">${k6.map(([i, l, v, s]) => `<div class="card kpi"><div class="kpi-top"><span class="chip-ico">${ic(i)}</span>${l}</div><div class="kpi-val">${v}</div><div class="kpi-sub">${s}</div></div>`).join('')}</section>
  <div class="grid g-main">
    ${card('Greenhouse status', `<div class="gh-grid">${GH.map(ghCard).join('')}</div>`, { sub: 'Select a greenhouse to open its monitoring page', actions: DEMO_TAG })}
    ${card('Smart alerts', alertFeed(al.slice(0, 5)) , { sub: `${al.filter(a => a.sev === 'crit').length} critical · ${al.filter(a => a.sev === 'warn').length} attention`, actions: '<a class="btn sm" href="#alerts">View all</a>' })}
  </div>
  <div class="grid g-2">
    ${card('Harvest pipeline', pipelineTable(pipe), { sub: 'Next harvest per active batch', actions: '<a class="btn sm" href="#harvest">Harvest calendar</a>' })}
    ${card("Today's tasks", taskList(todayTasks.slice(0, 7)), { sub: `${todayTasks.filter(t => t.status === 'Done').length} of ${todayTasks.length} complete`, actions: '<a class="btn sm" href="#tasks">All tasks</a>' })}
  </div>
  ${card('Performance trends', trendCharts(), { sub: 'Yield from harvest records; water and energy are demo meter data', actions: seg('trendRange', [[7, '7 days'], [30, '30 days'], [90, '90 days']], ui.trendRange, 'Date range') })}
  `;
}
function ghCard(g) {
  const st = ghStatus(g.id), r = readings(g.id), t = targets(g.id);
  const m = (k, short) => { const s = sensorDef(k); const ms = metricStatus(r[k], t[k]); return `<div class="metric"><small>${ic(s.icon)}${short}</small><b class="${ms === 'ok' ? '' : ms}">${num(r[k], s.dec)}<span class="muted" style="font-size:.7rem;font-family:var(--font)"> ${s.unit}</span></b></div>`; };
  const crops = ghCrops(g.id);
  return `<a class="gh-card st-${st}" href="#${g.id}" aria-label="${g.name}: ${ST_LABEL[st]}. Open monitoring page">
    <div class="gh-top"><div><b>${g.name}</b><div class="muted">${esc(crops.join(', ') || 'No active crop')}</div></div>${badge(st)}</div>
    <div class="metrics">${m('temp', 'Temp')}${m('hum', 'Humidity')}${m('co2', 'CO₂')}<div class="metric"><small>${ic('sprout')}Plants</small><b>${num(ghPlants(g.id))}</b></div></div>
    <div class="gh-foot"><span>${g.system} · ${g.zones.length} zones</span><span>Demo reading · ${READ_AT[g.id]} min ago</span></div></a>`;
}
function alertFeed(list, full = false) {
  if (!list.length) return empty('check', 'No active alerts', 'Every greenhouse, inventory item and task is within its targets.');
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
    return `<tr class="click" data-act="batch" data-id="${b.id}" tabindex="0"><td><b>${CROPS[b.crop].label}</b><div class="small muted">${b.id} · zone ${esc(b.zone)}</div></td><td>${ghById(b.ghId).name}</td><td class="r num">${num(b.estKg)} kg</td><td><div class="ready"><div class="bar" style="flex:1"><i style="width:${rd}%" class="${rd < 60 ? 'warn' : ''}"></i></div><span>${rd}%</span></div></td><td class="num">${fmtD(b.expectedHarvest)}<div class="small ${d < 0 ? 'overdue' : 'muted'}">${d === 0 ? 'Today' : d < 0 ? `${-d} d late` : `in ${d} d`}</div></td>${actions ? `<td class="r">${can('harvest') ? `<button class="btn sm" data-act="harvest-record" data-id="${b.id}">Record</button>` : ''}</td>` : ''}</tr>`;
  }).join('')}</tbody></table></div>`;
}
function taskList(list) {
  if (!list.length) return empty('clipboard', 'No tasks match', can('tasks') ? 'Create a task to assign work to your team.' : 'Nothing assigned right now.', can('tasks') ? `<button class="btn primary" data-act="task-new">${ic('plus')}New task</button>` : '');
  return `<div>${list.map(t => {
    const od = isOverdue(t), done = t.status === 'Done';
    return `<div class="task ${done ? 'done' : ''}">
      <button class="check" data-act="task-toggle" data-id="${t.id}" aria-pressed="${done}" aria-label="${done ? 'Mark as not done' : 'Mark as done'}: ${esc(t.title)}">${ic('check')}</button>
      <div style="min-width:0"><button class="t-title" data-act="task-edit" data-id="${t.id}" style="all:unset;cursor:pointer;font-weight:700">${esc(t.title)}</button>
        <div class="t-meta"><span>${ic('user', 'small')}${esc(t.assignee)}</span><span>${ghById(t.ghId)?.name || ''}</span>${t.recurrence !== 'none' ? `<span>${ic('repeat')}${t.recurrence}</span>` : ''}${t.photo ? `<span>${ic('camera')}photo</span>` : ''}</div></div>
      <div class="t-right"><span class="pri pri-${t.priority}">${t.priority}</span><span class="num ${od ? 'overdue' : 'muted'}">${od ? 'Overdue · ' : ''}${t.due !== dOff(0) ? fmtD(t.due) + ', ' : ''}${fmtT(t.time)}</span>${done ? '<span class="badge b-ok">Done</span>' : ''}</div></div>`;
  }).join('')}</div>`.replace(/<svg class="ico small"/g, '<svg class="ico" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px"');
}
function trendCharts() {
  const days = ui.trendRange, from = dOff(-days + 1);
  const hs = harvests().filter(h => h.date >= from);
  const byWeek = days > 7;
  const keys = []; for (let d = -days + 1; d <= 0; d++) { const k = byWeek ? weekKey(dOff(d)) : dOff(d); if (!keys.includes(k)) keys.push(k); }
  const crops = Object.keys(CROPS);
  const ds = crops.map(c => ({ label: CROPS[c].label, data: keys.map(k => hs.filter(h => h.crop === c && (byWeek ? weekKey(h.date) : h.date) === k).reduce((s, h) => s + h.actualKg, 0)), backgroundColor: col(CROP_COLOR[c]), borderRadius: 4, stack: 'y' }));
  const total = hs.reduce((s, h) => s + h.actualKg, 0);
  const res = resourceSeries(days);
  const water = res.reduce((s, r) => s + r.water, 0), kwh = res.reduce((s, r) => s + r.energy, 0);
  return `<div class="grid g-2">
    <div><div class="split" style="justify-content:space-between;margin-bottom:8px"><h3>Harvested yield</h3><span class="small muted num">${num(total)} kg in ${days} days · ${num(total / Math.max(1, water / 1000), 1)} kg per m³ water</span></div>
      <div class="chart-box">${makeChart('cYield', { type: 'bar', aria: `Harvested yield by ${byWeek ? 'week' : 'day'} and crop, ${num(total)} kg total`, data: { labels: keys.map(k => byWeek ? 'Wk ' + fmtD(k) : fmtD(k)), datasets: ds }, options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, title: { display: true, text: 'kg' } } } } })}</div></div>
    <div><div class="split" style="justify-content:space-between;margin-bottom:8px"><h3>Resource use</h3><span class="small muted num">${num(water / 1000, 1)} m³ water · ${num(kwh)} kWh <span class="tag demo">Demo meters</span></span></div>
      <div class="chart-box">${makeChart('cRes', { type: 'line', aria: 'Daily water and energy use', data: { labels: res.map(r => fmtD(r.date)), datasets: [
        { label: 'Water (L/day)', data: res.map(r => r.water), borderColor: col('--c5'), backgroundColor: col('--c5') + '22', fill: true, tension: .35, pointRadius: 0, yAxisID: 'y', borderWidth: 2 },
        { label: 'Energy (kWh/day)', data: res.map(r => r.energy), borderColor: col('--c2'), tension: .35, pointRadius: 0, yAxisID: 'y1', borderWidth: 2 }] },
        options: { interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }, y: { title: { display: true, text: 'Litres' } }, y1: { position: 'right', grid: { display: false }, title: { display: true, text: 'kWh' } } } } })}</div></div>
  </div>`;
}

/* ================= Plant Management ================= */
function vPlants() {
  const f = ui.plantF, q = f.q.toLowerCase();
  const list = batches().filter(b => (!f.gh || b.ghId === f.gh) && (!f.stage || b.stage === f.stage) && (!q || `${b.id} ${b.crop} ${b.variety} ${b.zone}`.toLowerCase().includes(q))).sort((a, b) => (a.stage === 'Harvested') - (b.stage === 'Harvested') || a.expectedHarvest.localeCompare(b.expectedHarvest));
  const k = kpis();
  return `${pageHead('Plant Management', 'Crop batches, greenhouse zones, growth stages and health observations.', can('batches') ? `<button class="btn primary" data-act="batch-new">${ic('plus')}Add crop batch</button>` : '')}
  <div class="stats">${[['Active batches', k.batches], ['Plants growing', num(k.plants)], ['Average health', num(k.health, 1) + '%'], ['Harvested batches', batches().length - k.batches]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${card('Crop batches', `
    <div class="toolbar" style="margin-bottom:12px">
      <label class="sr" for="pf-q">Search batches</label><input id="pf-q" class="input grow" type="search" placeholder="Search by batch, crop, variety or zone" value="${esc(f.q)}" data-filter="plantF.q">
      <label class="sr" for="pf-gh">Greenhouse</label><select id="pf-gh" class="select" data-filter="plantF.gh"><option value="">All greenhouses</option>${GH.map(g => `<option value="${g.id}" ${f.gh === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}</select>
      <label class="sr" for="pf-st">Growth stage</label><select id="pf-st" class="select" data-filter="plantF.stage"><option value="">All stages</option>${STAGES.map(s => `<option ${f.stage === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    </div>
    ${list.length ? `<div class="tbl-wrap"><table><thead><tr><th>Batch</th><th>Crop</th><th>Location</th><th class="r">Plants</th><th>Planted</th><th>Stage</th><th>Health</th><th>Expected harvest</th></tr></thead><tbody>${list.map(b => `
      <tr class="click" data-act="batch" data-id="${b.id}" tabindex="0"><td><b class="mono">${b.id}</b></td><td><b>${CROPS[b.crop].label}</b><div class="small muted">${esc(b.variety)}</div></td><td>${ghById(b.ghId).name}<div class="small muted">Zone ${esc(b.zone)}</div></td><td class="r num">${num(b.plants)}</td><td class="num">${fmtD(b.plantedOn)}</td><td><span class="badge ${b.stage === 'Ready' ? 'b-ok' : b.stage === 'Harvested' ? 'b-mute' : 'b-info'}">${b.stage}</span></td><td>${healthCell(b.health)}</td><td class="num">${b.stage === 'Harvested' ? '—' : fmtD(b.expectedHarvest)}</td></tr>`).join('')}</tbody></table></div>`
      : empty('sprout', 'No batches match these filters', 'Clear the search or choose a different greenhouse or stage.', `<button class="btn" data-act="clear-plant-filters">Clear filters</button>`)}
  `, { sub: `${list.length} of ${batches().length} batches` })}`;
}
const healthSt = h => h >= 85 ? 'ok' : h >= 70 ? 'warn' : 'crit';
const healthCell = h => `<div class="ready"><div class="bar" style="width:70px"><i class="${healthSt(h) === 'ok' ? '' : healthSt(h)}" style="width:${h}%"></i></div><span>${h}%</span></div>`;

function batchDetail(id) {
  const b = Store.get('batches', id); if (!b) return toast('That batch no longer exists.', 'error');
  const c = CROPS[b.crop], hs = harvests().filter(h => h.batchId === b.id);
  const obs = [...(b.observations || [])].sort((a, c) => c.date.localeCompare(a.date));
  openModal({ title: `${b.id} · ${c.label}`, wide: true, submitLabel: null, body: `
    <div class="split">${badge(healthSt(b.health))}<span class="badge b-info">${b.stage}</span><span class="tag">${ghById(b.ghId).name}, zone ${esc(b.zone)}</span>${b.demo ? '<span class="tag demo">Sample record</span>' : ''}</div>
    <div class="grid g-2" style="gap:16px">
      <dl class="kv"><dt>Variety</dt><dd>${esc(b.variety)}</dd><dt>Plants</dt><dd class="num">${num(b.plants)}</dd><dt>Planted</dt><dd>${fmtDL(b.plantedOn)}</dd><dt>Expected harvest</dt><dd>${fmtDL(b.expectedHarvest)} (${daysFrom(b.expectedHarvest) >= 0 ? 'in ' + daysFrom(b.expectedHarvest) + ' d' : -daysFrom(b.expectedHarvest) + ' d ago'})</dd><dt>Estimated yield</dt><dd class="num">${num(b.estKg)} kg${c.continuous ? ' per weekly pick' : ''}</dd><dt>Projected value</dt><dd class="num">${money(b.estKg * c.price)} <span class="tag proj">Projection</span></dd></dl>
      <div><h3 style="margin-bottom:8px">Readiness</h3><div class="ready"><div class="bar" style="flex:1;height:10px"><i style="width:${readiness(b)}%"></i></div><span>${readiness(b)}%</span></div>
      <p class="small muted" style="margin-top:8px">${c.label} cycle ≈ ${c.cycle} days. Health score ${b.health}%.</p>${b.notes ? `<p style="margin-top:8px">${esc(b.notes)}</p>` : ''}</div>
    </div>
    <div><div class="split" style="justify-content:space-between;margin-bottom:8px"><h3>Health observations</h3><button class="btn sm" data-act="obs-new" data-id="${b.id}">${ic('plus')}Add observation</button></div>
      ${obs.length ? `<div class="timeline">${obs.map(o => `<div class="tl ${o.flag ? 'flag' : ''}"><div class="small muted">${fmtDL(o.date)} · ${esc(o.by)} · health ${o.health}%</div>${o.flag ? `<span class="badge b-crit" style="margin:4px 0">${esc(o.flag)}</span>` : ''}<p>${esc(o.note)}</p></div>`).join('')}</div>` : '<p class="muted small">No observations yet. Add the first one after your next walk-through.</p>'}
    </div>
    ${hs.length ? `<div><h3 style="margin-bottom:8px">Harvest records</h3>${harvestTable(hs)}</div>` : ''}`,
    footer: `${can('batches') ? `<button type="button" class="btn" data-act="batch-delete" data-id="${b.id}">${ic('trash')}Delete</button><button type="button" class="btn" data-act="batch-edit" data-id="${b.id}">${ic('edit')}Edit batch</button>` : ''}${can('harvest') && b.stage !== 'Harvested' ? `<button type="button" class="btn primary" data-act="harvest-record" data-id="${b.id}">Record harvest</button>` : ''}<button type="button" class="btn" data-close>Close</button>` });
}
function batchForm(id) {
  const b = id ? Store.get('batches', id) : { crop: 'Lettuce', variety: '', ghId: 'gh-a', zone: 'A1', plants: '', plantedOn: dOff(0), stage: 'Germination', health: 90, expectedHarvest: dOff(42), estKg: '', notes: '' };
  const zoneOpts = ghId => ghById(ghId).zones.map(z => `<option ${z === b.zone ? 'selected' : ''}>${z}</option>`).join('');
  openModal({
    title: id ? `Edit ${b.id}` : 'Add crop batch', submitLabel: id ? 'Save changes' : 'Add batch',
    body: `<div class="form-grid">
      ${fld('Crop', `<select id="f-crop" name="crop">${Object.entries(CROPS).map(([k, c]) => `<option value="${k}" ${b.crop === k ? 'selected' : ''}>${c.label}</option>`).join('')}</select>`, 'crop')}
      ${fld('Variety', `<input id="f-variety" name="variety" value="${esc(b.variety)}" placeholder="e.g. Butterhead “Rex”">`, 'variety')}
      ${fld('Greenhouse', `<select id="f-gh" name="ghId">${GH.map(g => `<option value="${g.id}" ${b.ghId === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}</select>`, 'ghId')}
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
      gh.onchange = () => { $('#f-zone', m).innerHTML = ghById(gh.value).zones.map(z => `<option>${z}</option>`).join(''); };
      const suggest = () => { const c = CROPS[crop.value]; if (pl.value) $('#f-exp', m).value = iso(parseD(pl.value).getTime() + c.cycle * DAY); if (plants.value) $('#f-est', m).value = Math.round(plants.value * (c.continuous ? c.ypp : c.ypp)); };
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
  return `${pageHead('Greenhouse Management', 'Climate, root-zone and reservoir monitoring for each greenhouse.', DEMO_TAG)}
  <div class="notice">${ic('plug')}<div><b>No sensor devices are connected.</b> Readings below are simulated demo data so you can explore the workflow. Connecting an IoT gateway (MQTT or Modbus) requires an integration that is not available in this prototype.</div></div>
  <div class="gh-grid">${GH.map(g => `<div class="card card-b" style="display:grid;gap:12px">${ghCard(g)}<dl class="kv"><dt>System</dt><dd>${g.system}</dd><dt>Growing area</dt><dd class="num">${g.area} m²</dd><dt>Active batches</dt><dd>${activeBatches().filter(b => b.ghId === g.id).map(b => b.id).join(', ') || 'None'}</dd></dl></div>`).join('')}</div>`;
}
function vGhDetail(id) {
  const g = ghById(id), r = readings(id), t = targets(id), st = ghStatus(id), s = sensorDef(ui.ghMetric);
  const hist = history(id, s.k, ui.ghRange);
  const mr = manualReading(id);
  const cmds = Store.all('commands').filter(c => c.ghId === id).sort((a, b) => b.at - a.at).slice(0, 6);
  const fmtX = at => ui.ghRange === '24h' ? new Date(at).toLocaleTimeString(undefined, { hour: 'numeric' }) : new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${pageHead(`${g.name} ${badge(st)}`, `${esc(ghCrops(id).join(', ') || 'No active crop')} · ${g.system} · ${g.area} m² · ${num(ghPlants(id))} plants`, `${DEMO_TAG}<span class="tag">Last update ${new Date(Date.now() - READ_AT[id] * 60000).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>`, `<div class="crumbs"><a href="#greenhouses">Greenhouses</a>${ic('chev')}<span>${g.name}</span></div>`)}
  <section class="readings" aria-label="Current readings">${SENSORS.map(x => { const ms = metricStatus(r[x.k], t[x.k]); return `<button class="card reading" style="text-align:left;cursor:pointer;${ui.ghMetric === x.k ? 'border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)' : ''}" data-seg="ghMetric" data-val="${x.k}" aria-pressed="${ui.ghMetric === x.k}">
    <span class="lbl"><span>${x.label}</span>${badge(ms)}</span><span class="val">${num(r[x.k], x.dec)}<small>${x.unit}</small></span><span class="small muted">Target ${t[x.k][0]}–${t[x.k][1]} ${x.unit}</span></button>`; }).join('')}</section>
  ${mr ? `<div class="notice">${ic('info')}<div>Latest manual meter reading: pH <b>${mr.ph}</b>, EC <b>${mr.ec} mS/cm</b> by ${esc(mr.by)} on ${fmtDT(mr.at)}. Used by Crop Nutrition.</div></div>` : ''}
  ${card(`${s.label} history`, `<div class="chart-box tall">${makeChart('cGh', { type: 'line', aria: `${s.label} over ${ui.ghRange}`, data: { labels: hist.map(p => fmtX(p.at)), datasets: [
      { label: s.label + (s.unit ? ` (${s.unit})` : ''), data: hist.map(p => p.v), borderColor: col('--accent'), backgroundColor: col('--accent') + '1f', fill: true, tension: .35, pointRadius: (c) => c.dataIndex === hist.length - 1 ? 4 : 0, borderWidth: 2 },
      { label: 'Target min', data: hist.map(() => t[s.k][0]), borderColor: col('--muted'), borderDash: [5, 5], pointRadius: 0, borderWidth: 1.2, fill: false },
      { label: 'Target max', data: hist.map(() => t[s.k][1]), borderColor: col('--muted'), borderDash: [5, 5], pointRadius: 0, borderWidth: 1.2, fill: false }] },
      options: { interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: {} } } })}</div>`,
    { sub: 'Select a reading above to change the metric · demo data', actions: seg('ghRange', [['24h', '24 hours'], ['7d', '7 days'], ['30d', '30 days']], ui.ghRange, 'History range') })}
  <div class="grid g-2">
    ${card('Target ranges', can('targets') ? `<form id="targetsForm" data-gh="${id}" novalidate><div class="tbl-wrap"><table><thead><tr><th>Reading</th><th>Min</th><th>Max</th></tr></thead><tbody>${SENSORS.map(x => `<tr><td><b>${x.label}</b><div class="small muted">${x.unit || 'unitless'}</div></td><td><label class="sr" for="t-${x.k}-lo">${x.label} minimum</label><input class="input" style="width:100px" id="t-${x.k}-lo" name="${x.k}-lo" type="number" step="any" value="${t[x.k][0]}"></td><td><label class="sr" for="t-${x.k}-hi">${x.label} maximum</label><input class="input" style="width:100px" id="t-${x.k}-hi" name="${x.k}-hi" type="number" step="any" value="${t[x.k][1]}"></td></tr>`).join('')}</tbody></table></div><p class="err" id="targetsErr" role="alert"></p><div class="toolbar" style="margin-top:10px"><button class="btn primary" type="submit">Save targets</button><button class="btn" type="button" data-act="targets-reset" data-id="${id}">Restore defaults</button></div></form>`
      : `<div class="tbl-wrap"><table><tbody>${SENSORS.map(x => `<tr><td>${x.label}</td><td class="num r">${t[x.k][0]}–${t[x.k][1]} ${x.unit}</td></tr>`).join('')}</tbody></table></div>${noPerm('Editing target ranges')}`,
      { sub: 'Status badges and alerts use these ranges' })}
    <div class="grid" style="gap:20px;align-content:start">
    ${card('Sensor connections', `<div class="tbl-wrap"><table><thead><tr><th>Sensor</th><th>Status</th><th>Last update</th></tr></thead><tbody>${SENSORS.map(x => `<tr><td><b>${x.label}</b><div class="small muted">${x.model}</div></td><td><span class="badge b-mute">Simulated · not connected</span></td><td class="num small">${READ_AT[id]} min ago (demo)</td></tr>`).join('')}</tbody></table></div>
      <div class="toolbar" style="margin-top:12px"><button class="btn" data-act="reading-new" data-id="${id}">${ic('edit')}Log manual pH / EC reading</button><button class="btn" data-act="integration" data-id="sensor gateway">${ic('plug')}Connect devices</button></div>`)}
    ${card('Equipment controls', `<div class="notice warn" style="margin-bottom:12px">${ic('alert')}<div>Every command needs your explicit confirmation. No controller is connected, so commands are logged but <b>not sent</b> to equipment.</div></div>
      <div style="display:grid;gap:8px">${DEVICES.map(d => `<div class="split" style="justify-content:space-between;border:1px solid var(--line-2);border-radius:10px;padding:9px 12px"><div class="split">${ic(d.icon)}<div><b>${d.label}</b><div class="small muted">${d.action}</div></div></div><button class="btn sm" data-act="command" data-gh="${id}" data-id="${d.k}" ${can('commands') ? '' : 'disabled title="Not available for Farm Worker role"'}>${ic('power')}Send command…</button></div>`).join('')}</div>
      ${cmds.length ? `<h3 style="margin:14px 0 6px">Command log</h3><div class="tbl-wrap"><table><tbody>${cmds.map(c => `<tr><td class="small num">${fmtDT(c.at)}</td><td class="small">${esc(c.label)}<div class="muted">${esc(c.by)}</div></td><td><span class="badge b-warn">Not sent</span></td></tr>`).join('')}</tbody></table></div>` : ''}`)}
    </div>
  </div>
  ${card('Crop batches in this greenhouse', pipelineTable(activeBatches().filter(b => b.ghId === id)), { actions: can('batches') ? `<button class="btn sm" data-act="batch-new">${ic('plus')}Add batch</button>` : '' })}`;
}
function commandConfirm(ghId, devKey) {
  const g = ghById(ghId), d = DEVICES.find(x => x.k === devKey);
  openModal({
    title: 'Confirm equipment command', submitLabel: 'Confirm and send', danger: true,
    body: `<p>You are about to send this command:</p><dl class="kv"><dt>Greenhouse</dt><dd>${g.name}</dd><dt>Equipment</dt><dd>${d.label}</dd><dt>Action</dt><dd>${d.action}</dd></dl>
      <div class="notice warn">${ic('alert')}<div><b>No controller integration is connected.</b> Confirming records the request in the command log, but nothing will reach the equipment. Use the manual controls in the greenhouse.</div></div>
      <label class="split" style="font-weight:600"><input type="checkbox" id="cmdAck" name="ack" style="width:18px;height:18px"> I have checked that nobody is working on this equipment.</label><p class="err" id="err-ack"></p>`,
    validate: dd => ({ ack: !dd.ack && 'Tick the safety check before sending a command.' }),
    submit: async () => {
      await Store.put('commands', { id: uid('CMD'), ghId, device: devKey, label: `${d.label}: ${d.action}`, at: Date.now(), by: currentUser().name, status: 'not_sent' });
      return { msg: 'Command logged but not sent: no controller is connected.', type: 'error' };
    }
  });
}
function readingForm(ghId) {
  openModal({
    title: `Manual meter reading · ${ghById(ghId).name}`, submitLabel: 'Save reading',
    body: `<p class="muted">Record pH and EC from a handheld meter. Crop Nutrition uses the latest manual reading when it is newer than the demo sensor value.</p><div class="form-grid">${fld('pH', `<input id="r-ph" name="ph" type="number" step="0.01" min="0" max="14" inputmode="decimal">`, 'ph')}${fld('EC (mS/cm)', `<input id="r-ec" name="ec" type="number" step="0.01" min="0" max="10" inputmode="decimal">`, 'ec')}</div>`,
    validate: d => ({ ph: !(d.ph !== '' && +d.ph >= 3 && +d.ph <= 9) && 'Enter a pH between 3 and 9.', ec: !(d.ec !== '' && +d.ec >= 0 && +d.ec <= 6) && 'Enter an EC between 0 and 6 mS/cm.' }),
    submit: async d => { await Store.put('readings', { id: uid('R'), ghId, ph: +(+d.ph).toFixed(2), ec: +(+d.ec).toFixed(2), at: Date.now(), by: currentUser().name }); return 'Reading saved.'; }
  });
}

/* ================= Harvest ================= */
function vHarvest() {
  const hs = harvests(), last90 = hs.filter(h => h.date >= dOff(-90));
  const act = activeBatches().sort((a, b) => a.expectedHarvest.localeCompare(b.expectedHarvest));
  const acc = last90.length ? last90.reduce((s, h) => s + h.actualKg, 0) / last90.reduce((s, h) => s + h.estKg, 0) * 100 : 0;
  const gradeA = last90.length ? last90.filter(h => h.grade === 'A').length / last90.length * 100 : 0;
  const recent = hs.slice(0, 12).reverse();
  return `${pageHead('Harvest Management', 'Plan harvests, track readiness and record actual yield and quality.', '')}
  <div class="stats">${[['Harvested, last 90 days', num(last90.reduce((s, h) => s + h.actualKg, 0)) + ' kg'], ['Actual vs estimate', num(acc, 1) + '%'], ['Grade A share', num(gradeA, 0) + '%'], ['Ready within 7 days', act.filter(b => daysFrom(b.expectedHarvest) <= 7).length + ' batches']].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  <div class="grid g-main">
    ${card('Harvest calendar', calendar(), { actions: `<button class="btn sm" data-act="cal-prev" aria-label="Previous month">${ic('left')}</button><b style="min-width:130px;text-align:center">${ui.calMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b><button class="btn sm" data-act="cal-next" aria-label="Next month">${ic('chev')}</button><button class="btn sm" data-act="cal-today">Today</button>` })}
    ${card('Estimated vs actual', `<div class="chart-box">${makeChart('cEva', { type: 'bar', aria: 'Estimated versus actual yield for the last 12 harvests', data: { labels: recent.map(h => `${h.id}`), datasets: [{ label: 'Estimated kg', data: recent.map(h => h.estKg), backgroundColor: col('--line'), borderRadius: 4 }, { label: 'Actual kg', data: recent.map(h => h.actualKg), backgroundColor: col('--accent'), borderRadius: 4 }] }, options: { scales: { x: { grid: { display: false }, ticks: { maxRotation: 60, font: { size: 10 } } }, y: {} } } })}</div><div class="legend" style="margin-top:8px"><span><i style="background:var(--accent-soft);border:1px solid var(--accent)"></i>Planned harvest</span><span><i style="background:var(--card);border:1px solid var(--line)"></i>Recorded harvest</span></div>`, { sub: 'Last 12 recorded harvests' })}
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
    html += `<div class="day ${d.getMonth() !== m.getMonth() ? 'out' : ''} ${k === dOff(0) ? 'today' : ''}"><span class="dn">${d.getDate()}</span>${evP.map(p => `<button class="ev plan" data-act="batch" data-id="${p.batch.id}" title="${CROPS[p.crop].label}, ${p.kg} kg planned">${p.crop} ${p.kg}kg</button>`).join('')}${evH.map(h => `<button class="ev done" data-act="harvest-view" data-id="${h.id}" title="${CROPS[h.crop].label}, ${h.actualKg} kg harvested">✓ ${h.crop} ${h.actualKg}kg</button>`).join('')}</div>`;
  }
  return `<div class="cal" aria-label="Harvest calendar">${html}</div>`;
}
function harvestTable(list) {
  if (!list.length) return empty('basket', 'No harvest records yet', 'Record a harvest from the readiness table.');
  return `<div class="tbl-wrap"><table><thead><tr><th>Record</th><th>Date</th><th>Crop</th><th>Location</th><th class="r">Estimated</th><th class="r">Actual</th><th class="r">Variance</th><th>Grade</th></tr></thead><tbody>${list.map(h => { const v = (h.actualKg - h.estKg) / h.estKg * 100; return `<tr class="click" data-act="harvest-view" data-id="${h.id}" tabindex="0"><td class="mono">${h.id}</td><td class="num">${fmtD(h.date)}</td><td>${CROPS[h.crop].label}</td><td>${ghById(h.ghId).name} · ${esc(h.zone || '')}</td><td class="r num">${num(h.estKg)} kg</td><td class="r num"><b>${num(h.actualKg)} kg</b></td><td class="r num" style="color:var(${v < -8 ? '--crit' : v < 0 ? '--warn' : '--ok'})">${v > 0 ? '+' : ''}${num(v, 1)}%</td><td><span class="badge ${h.grade === 'A' ? 'b-ok' : h.grade === 'B' ? 'b-warn' : 'b-crit'}">Grade ${h.grade}</span></td></tr>`; }).join('')}</tbody></table></div>`;
}
function harvestView(id) {
  const h = Store.get('harvests', id); if (!h) return;
  openModal({ title: `Harvest ${h.id}`, submitLabel: null, body: `<dl class="kv"><dt>Crop</dt><dd>${CROPS[h.crop].label}</dd><dt>Date</dt><dd>${fmtDL(h.date)}</dd><dt>Location</dt><dd>${ghById(h.ghId).name}, zone ${esc(h.zone || '—')}</dd>${h.batchId ? `<dt>Batch</dt><dd>${h.batchId}</dd>` : ''}<dt>Estimated</dt><dd class="num">${num(h.estKg)} kg</dd><dt>Actual</dt><dd class="num">${num(h.actualKg)} kg</dd><dt>Quality grade</dt><dd>Grade ${h.grade}</dd><dt>Recorded by</dt><dd>${esc(h.updatedBy || 'Sample data')}</dd>${h.notes ? `<dt>Notes</dt><dd>${esc(h.notes)}</dd>` : ''}</dl>`, footer: '<button type="button" class="btn" data-close>Close</button>' });
}
function harvestForm(batchId) {
  if (!can('harvest')) return toast('Recording harvests is not available for this role.', 'error');
  const b = Store.get('batches', batchId), c = CROPS[b.crop];
  openModal({
    title: `Record harvest · ${b.id}`, submitLabel: 'Save harvest record',
    body: `<p class="muted">${c.label}, ${ghById(b.ghId).name} zone ${esc(b.zone)}. Estimated ${num(b.estKg)} kg.</p><div class="form-grid">
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
}

/* ================= Tasks ================= */
function vTasks() {
  const f = ui.taskF, q = f.q.toLowerCase();
  const list = tasks().filter(t => (!f.gh || t.ghId === f.gh) && (!f.who || t.assignee === f.who) && (!f.pri || t.priority === f.pri) && (f.status === 'All' || (f.status === 'Open' ? t.status !== 'Done' : t.status === 'Done'))
    && (f.when === 'all' || (f.when === 'today' && t.due === dOff(0)) || (f.when === 'overdue' && isOverdue(t)) || (f.when === 'week' && daysFrom(t.due) >= 0 && daysFrom(t.due) <= 7))
    && (!q || `${t.title} ${t.notes} ${t.assignee}`.toLowerCase().includes(q))).sort((a, b) => (a.status === 'Done') - (b.status === 'Done') || a.due.localeCompare(b.due) || a.time.localeCompare(b.time));
  const all = tasks(), open = all.filter(t => t.status !== 'Done');
  return `${pageHead('Farmer Tasks', 'Assign, schedule and complete work across greenhouses.', can('tasks') ? `<button class="btn primary" data-act="task-new">${ic('plus')}New task</button>` : '')}
  <div class="stats">${[['Open', open.length], ['Due today', open.filter(t => t.due === dOff(0)).length], ['Overdue', open.filter(isOverdue).length], ['Completed today', all.filter(t => t.status === 'Done' && (t.completedAt ? iso(t.completedAt) === dOff(0) : t.due === dOff(0))).length]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${card('Tasks', `<div class="toolbar" style="margin-bottom:10px">
    <label class="sr" for="tf-q">Search tasks</label><input id="tf-q" class="input grow" type="search" placeholder="Search tasks" value="${esc(f.q)}" data-filter="taskF.q">
    <label class="sr" for="tf-gh">Greenhouse</label><select id="tf-gh" class="select" data-filter="taskF.gh"><option value="">All greenhouses</option>${GH.map(g => `<option value="${g.id}" ${f.gh === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}</select>
    <label class="sr" for="tf-who">Assignee</label><select id="tf-who" class="select" data-filter="taskF.who"><option value="">Everyone</option>${PEOPLE.map(p => `<option ${f.who === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}</select>
    <label class="sr" for="tf-pri">Priority</label><select id="tf-pri" class="select" data-filter="taskF.pri"><option value="">Any priority</option>${['High', 'Medium', 'Low'].map(p => `<option ${f.pri === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
  </div><div class="toolbar" style="margin-bottom:6px">${seg('taskStatus', [['Open', 'Open'], ['Done', 'Completed'], ['All', 'All']], f.status, 'Status')}${seg('taskWhen', [['all', 'Any date'], ['today', 'Today'], ['overdue', 'Overdue'], ['week', 'Next 7 days']], f.when, 'Due date')}</div>
  ${taskList(list)}`, { sub: `${list.length} shown` })}`;
}
function taskForm(id) {
  const t = id ? Store.get('tasks', id) : { title: '', ghId: 'gh-a', assignee: PEOPLE[1].name, priority: 'Medium', due: dOff(0), time: '09:00', recurrence: 'none', notes: '', status: 'Open' };
  if (!t) return;
  const editable = can('tasks');
  let photo = t.photo || '';
  openModal({
    title: id ? (editable ? 'Edit task' : 'Task details') : 'New task', submitLabel: id ? 'Save changes' : 'Create task',
    body: `${!editable ? `<div class="notice">${ic('info')}<div>As a Farm Worker you can complete tasks and add notes or photos. Managers assign and schedule.</div></div>` : ''}<div class="form-grid">
      <div class="full">${fld('Task', `<input id="k-title" name="title" value="${esc(t.title)}" ${editable ? '' : 'readonly'} placeholder="e.g. Flush and refill reservoir B">`, 'title')}</div>
      ${fld('Greenhouse', `<select id="k-gh" name="ghId" ${editable ? '' : 'disabled'}>${GH.map(g => `<option value="${g.id}" ${t.ghId === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}</select>`, 'ghId')}
      ${fld('Assigned to', `<select id="k-who" name="assignee" ${editable ? '' : 'disabled'}>${PEOPLE.map(p => `<option ${t.assignee === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}</select>`, 'assignee')}
      ${fld('Due date', `<input id="k-due" name="due" type="date" value="${t.due}" ${editable ? '' : 'readonly'}>`, 'due')}
      ${fld('Due time', `<input id="k-time" name="time" type="time" value="${t.time}" ${editable ? '' : 'readonly'}>`, 'time')}
      ${fld('Priority', `<select id="k-pri" name="priority" ${editable ? '' : 'disabled'}>${['High', 'Medium', 'Low'].map(p => `<option ${t.priority === p ? 'selected' : ''}>${p}</option>`).join('')}</select>`, 'priority')}
      ${fld('Repeats', `<select id="k-rec" name="recurrence" ${editable ? '' : 'disabled'}>${[['none', 'Does not repeat'], ['daily', 'Daily'], ['weekly', 'Weekly']].map(([v, l]) => `<option value="${v}" ${t.recurrence === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`, 'recurrence', 'Completing a repeating task schedules the next one.')}
      <div class="full">${fld('Notes', `<textarea id="k-notes" name="notes">${esc(t.notes || '')}</textarea>`, 'notes')}</div>
      <div class="full field"><label for="k-photo">Photo attachment</label><div class="photo-prev" id="k-prev">${photo ? `<img src="${photo}" alt="Task photo">` : ''}<input id="k-photo" type="file" accept="image/*"><button type="button" class="btn sm" id="k-photo-rm" ${photo ? '' : 'hidden'}>Remove photo</button></div><span class="hint">Photos are resized to 640 px before saving.</span><p class="err" id="err-photo"></p></div>
    </div>`,
    onOpen: m => {
      const inp = $('#k-photo', m);
      inp.onchange = async () => {
        const file = inp.files[0]; if (!file) return;
        $('#err-photo', m).textContent = '';
        try { photo = await downscale(file, 640); $('#k-prev img', m)?.remove(); $('#k-prev', m).insertAdjacentHTML('afterbegin', `<img src="${photo}" alt="Task photo">`); $('#k-photo-rm', m).hidden = false; }
        catch (e) { $('#err-photo', m).textContent = 'That file could not be read as an image. Choose a JPEG or PNG photo.'; }
      };
      $('#k-photo-rm', m).onclick = () => { photo = ''; $('#k-prev img', m)?.remove(); $('#k-photo-rm', m).hidden = true; inp.value = ''; };
    },
    validate: d => editable ? ({ title: d.title.trim().length < 3 && 'Enter a task name (at least 3 characters).', due: !d.due && 'Choose a due date.', time: !d.time && 'Choose a due time.' }) : {},
    submit: async d => {
      const base = id ? t : { id: nextId('T', tasks()), status: 'Open', createdAt: Date.now() };
      const doc = editable ? { ...base, ...d, title: d.title.trim(), photo } : { ...base, notes: d.notes, photo };
      await Store.put('tasks', doc); return id ? 'Task updated.' : `Task assigned to ${doc.assignee}.`;
    },
    footer: id && editable ? `<button type="button" class="btn" data-act="task-delete" data-id="${id}">${ic('trash')}Delete</button>` : ''
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
function downscale(file, max) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.72)); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
    img.src = url;
  });
}

/* ================= Inventory ================= */
const INV_CATS = ['Seeds', 'Nutrients', 'Growing media', 'Packaging', 'Equipment'];
function vInventory() {
  const q = ui.invQ.toLowerCase();
  const items = inventory().filter(i => (ui.invCat === 'All' || i.category === ui.invCat) && (!q || `${i.name} ${i.supplier}`.toLowerCase().includes(q))).sort((a, b) => (a.qty / a.threshold) - (b.qty / b.threshold));
  const low = inventory().filter(i => +i.qty < +i.threshold);
  const value = inventory().reduce((s, i) => s + i.qty * (i.cost || 0), 0);
  const mv = Store.all('movements').sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 12);
  return `${pageHead('Smart Inventory', 'Seeds, nutrients, growing media, packaging and equipment.', `<button class="btn" data-act="move-new">${ic('repeat')}Record stock movement</button>${can('inventory') ? `<button class="btn primary" data-act="inv-new">${ic('plus')}Add item</button>` : ''}`)}
  <div class="stats">${[['Items tracked', inventory().length], ['Below reorder point', low.length], ['Stock value (at cost)', money(value)], ['Suppliers', new Set(inventory().map(i => i.supplier)).size]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${low.length ? `<div class="notice warn">${ic('alert')}<div><b>${low.length} item${low.length > 1 ? 's' : ''} below reorder point:</b> ${low.map(i => esc(i.name)).join(', ')}. Supplier ordering requires a purchasing integration that is not connected.</div></div>` : ''}
  ${card('Stock', `<div class="toolbar" style="margin-bottom:12px"><label class="sr" for="iv-q">Search inventory</label><input id="iv-q" class="input grow" type="search" placeholder="Search items or suppliers" value="${esc(ui.invQ)}" data-filter="invQ">${seg('invCat', [['All', 'All'], ...INV_CATS.map(c => [c, c])], ui.invCat, 'Category')}</div>
  ${items.length ? `<div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Category</th><th class="r">On hand</th><th class="r">Reorder at</th><th>Level</th><th>Supplier</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${items.map(i => { const ratio = i.qty / i.threshold, st = ratio < 0.5 ? 'crit' : ratio < 1 ? 'warn' : 'ok'; return `<tr><td><b>${esc(i.name)}</b><div class="small muted mono">${i.id}</div></td><td>${i.category}</td><td class="r num"><b>${num(i.qty)}</b> ${esc(i.unit)}</td><td class="r num">${num(i.threshold)} ${esc(i.unit)}</td><td><div class="ready"><div class="bar" style="width:80px"><i class="${st === 'ok' ? '' : st}" style="width:${clamp(ratio / 2 * 100, 3, 100)}%"></i></div>${st === 'ok' ? '<span class="badge b-ok">In stock</span>' : st === 'warn' ? '<span class="badge b-warn">Reorder</span>' : '<span class="badge b-crit">Critical</span>'}</div></td><td class="small">${esc(i.supplier)}</td><td class="r"><div class="toolbar" style="justify-content:flex-end;flex-wrap:nowrap"><button class="btn sm" data-act="move-new" data-id="${i.id}">Movement</button>${can('inventory') ? `<button class="btn sm ghost" data-act="inv-edit" data-id="${i.id}" aria-label="Edit ${esc(i.name)}">${ic('edit')}</button>` : ''}</div></td></tr>`; }).join('')}</tbody></table></div>` : empty('box', 'No items match', 'Try another category or search term.')}`, { sub: `${items.length} items` })}
  ${card('Recent stock movements', mv.length ? `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Item</th><th>Type</th><th class="r">Quantity</th><th>Note</th><th>By</th></tr></thead><tbody>${mv.map(m => { const it = Store.get('inventory', m.itemId); return `<tr><td class="num">${fmtD(m.date)}</td><td>${esc(it ? it.name : m.itemId)}</td><td><span class="badge ${m.type === 'In' ? 'b-ok' : m.type === 'Out' ? 'b-info' : 'b-mute'}">${m.type === 'In' ? 'Received' : m.type === 'Out' ? 'Used' : 'Adjusted'}</span></td><td class="r num">${m.type === 'Out' ? '−' : m.type === 'In' ? '+' : '='}${num(m.qty)} ${esc(it?.unit || '')}</td><td class="small">${esc(m.note)}</td><td class="small muted">${esc(m.by)}</td></tr>`; }).join('')}</tbody></table></div>` : empty('repeat', 'No movements yet', 'Record stock received or used.'))}`;
}
function invForm(id) {
  const i = id ? Store.get('inventory', id) : { name: '', category: 'Nutrients', qty: '', unit: 'kg', threshold: '', supplier: '', cost: '' };
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
    submit: async d => { const doc = { ...(id ? i : { id: nextId('I', inventory()) }), ...d, qty: +d.qty, threshold: +d.threshold, cost: +d.cost || 0 }; await Store.put('inventory', doc); return `${doc.name} saved.`; }
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
  return `${pageHead('Smart Alerts', 'Prioritized issues from sensors, crop observations, inventory and tasks. Critical first.', `<label class="split" style="font-weight:600"><input type="checkbox" id="showResolved" ${ui.showResolved ? 'checked' : ''} style="width:18px;height:18px"> Show resolved</label>`)}
  <div class="stats">${[['Critical', act.filter(a => a.sev === 'crit').length], ['Attention', act.filter(a => a.sev === 'warn').length], ['Acknowledged', act.filter(a => a.state === 'acknowledged').length], ['Resolved', all.filter(a => a.state === 'resolved').length]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  <div class="notice">${ic('info')}<div>Sensor alerts come from demo readings checked against each greenhouse's target ranges. Push notifications by SMS or email need a messaging integration that is not connected.</div></div>
  ${card('Alert feed', alertFeed(shown, true), { sub: `${shown.length} alerts` })}`;
}
async function setAlert(id, status) {
  try { await Store.put('alerts', { id, status }); toast(status === 'acknowledged' ? 'Alert acknowledged.' : status === 'resolved' ? 'Alert marked as resolved.' : 'Alert reopened.'); }
  catch (e) { toast(errText(e), 'error'); }
}

/* ================= AI: Crop Nutrition ================= */
function vNutrition() {
  const id = ui.nutGh, g = ghById(id), r = readings(id), mr = manualReading(id);
  const ph = mr ? mr.ph : r.ph, ec = mr ? mr.ec : r.ec, src = mr ? `manual reading by ${esc(mr.by)}, ${fmtDT(mr.at)}` : 'demo sensor reading';
  const bs = activeBatches().filter(b => b.ghId === id);
  const crop = bs[0]?.crop || g.main, c = CROPS[crop];
  const stage = bs.sort((a, b) => STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage))[0]?.stage || 'Vegetative';
  const ecT = c.ec[stage] || c.ec.Vegetative, phT = c.ph;
  const recs = [];
  const res = 1800; // reservoir volume litres (demo)
  if (ph > phT[1]) { const delta = ph - (phT[0] + phT[1]) / 2; recs.push({ sev: 'warn', title: `Lower pH by about ${num(delta, 2)}`, why: `pH ${ph} is above the ${phT[0]}–${phT[1]} range for ${c.label}. Above 6.5, iron and manganese become less available, which shows as interveinal yellowing on new leaves.`, how: `Add pH Down (phosphoric 75%) in steps of about ${Math.round(res / 1000 * 2 * delta / 0.3)} mL for the ${num(res)} L reservoir, circulate 30 minutes and re-measure before adding more.` }); }
  else if (ph < phT[0]) { const delta = (phT[0] + phT[1]) / 2 - ph; recs.push({ sev: 'warn', title: `Raise pH by about ${num(delta, 2)}`, why: `pH ${ph} is below ${phT[0]}. Low pH can lock out calcium and magnesium and stress roots.`, how: 'Add pH Up (potassium hydroxide) in small steps, circulate 30 minutes and re-measure.' }); }
  else recs.push({ sev: 'ok', title: 'pH is within range', why: `pH ${ph} sits inside ${phT[0]}–${phT[1]} for ${c.label}.`, how: 'No change. Keep checking daily; pH tends to drift up as plants take up nitrate.' });
  if (ec < ecT[0]) { const add = Math.round((ecT[0] + ecT[1]) / 2 * 10 - ec * 10) / 10; recs.push({ sev: 'warn', title: `Increase EC by about ${num(add, 1)} mS/cm`, why: `EC ${ec} is below the ${ecT[0]}–${ecT[1]} mS/cm target for the ${stage.toLowerCase()} stage. ${stage === 'Fruiting' || stage === 'Flowering' ? 'Fruiting plants need more potassium and calcium for fruit set and sugar content.' : 'Underfeeding slows growth and pales foliage.'}`, how: `Add nutrient A and B in equal parts. Roughly ${num(add * res * 0.5 / 1000 * 1.0, 1)} kg of each per ${num(res)} L raises EC by ${num(add, 1)}; dose half, mix, then re-measure.` }); }
  else if (ec > ecT[1]) recs.push({ sev: 'warn', title: 'Reduce EC', why: `EC ${ec} is above ${ecT[1]} mS/cm. High salinity can cause tip burn and limit water uptake.`, how: 'Top up with fresh water and re-measure. Dilute in 10% steps.' });
  else recs.push({ sev: 'ok', title: 'EC is within range', why: `EC ${ec} sits inside ${ecT[0]}–${ecT[1]} mS/cm for the ${stage.toLowerCase()} stage.`, how: 'Keep the current feed strength.' });
  if (r.wt > 22) recs.push({ sev: 'warn', title: 'Cool the nutrient solution', why: `Water temperature ${r.wt} °C reduces dissolved oxygen and raises root-rot risk.`, how: 'Shade the reservoir or run the chiller; target 18–21 °C.' });
  if (r.res < 40) recs.push({ sev: 'crit', title: 'Refill the reservoir before adjusting', why: `Reservoir level is ${r.res}%. Small volumes swing in pH and EC quickly, so corrections made now will overshoot.`, how: 'Refill to at least 70%, let it mix, then measure pH and EC again before dosing.' });
  return `${pageHead('Crop Nutrition', 'Nutrient suggestions from crop stage and recorded pH and EC.', SIM_TAG)}
  <div class="notice">${ic('info')}<div>These suggestions come from a <b>rule-based demo engine</b> using published hydroponic ranges, not a connected AI service. Confirm with your agronomist before changing a recipe.</div></div>
  <div class="toolbar">${seg('nutGh', GH.map(x => [x.id, x.name]), id, 'Greenhouse')}<button class="btn" data-act="reading-new" data-id="${id}">${ic('edit')}Log manual reading</button></div>
  <div class="grid g-main">
    ${card('Suggested adjustments', `<div style="display:grid;gap:10px">${recs.map(x => `<div class="alert ${x.sev === 'ok' ? '' : x.sev}" style="grid-template-columns:auto 1fr"><span class="sev-ico" style="${x.sev === 'ok' ? 'background:var(--ok-bg);color:var(--ok)' : ''}">${ic(x.sev === 'ok' ? 'check' : 'flask')}</span><div><b>${x.title}</b><p style="margin-top:4px"><b style="display:inline;color:var(--fg)">Why:</b> ${x.why}</p><p style="margin-top:4px"><b style="display:inline;color:var(--fg)">How:</b> ${x.how}</p></div></div>`).join('')}</div>`, { sub: `${g.name} · ${c.label}` })}
    ${card('Inputs used', `<dl class="kv"><dt>Crop</dt><dd>${c.label}</dd><dt>Most advanced stage</dt><dd>${stage}</dd><dt>Batches</dt><dd>${bs.map(b => `${b.id} (${b.stage})`).join(', ') || 'None'}</dd><dt>pH</dt><dd class="num">${ph} <span class="small muted">(${src})</span></dd><dt>EC</dt><dd class="num">${ec} mS/cm <span class="small muted">(${src})</span></dd><dt>Water temp.</dt><dd class="num">${r.wt} °C (demo)</dd><dt>Reservoir</dt><dd class="num">${r.res}% of ${num(res)} L (demo)</dd><dt>pH target</dt><dd class="num">${phT[0]}–${phT[1]}</dd><dt>EC target</dt><dd class="num">${ecT[0]}–${ecT[1]} mS/cm for ${stage.toLowerCase()}</dd></dl>
      <h3 style="margin:16px 0 6px">How the engine reasons</h3><ol class="list-plain small"><li>Finds the most advanced growth stage among active batches.</li><li>Looks up the crop's pH range and the stage-specific EC range.</li><li>Uses the newest manual reading if one exists, otherwise the demo sensor.</li><li>Flags conditions that make corrections unsafe, such as a low reservoir.</li><li>Sizes doses for the reservoir volume and asks you to re-measure.</li></ol>`)}
  </div>`;
}

/* ================= AI: Disease Detection ================= */
function vDisease() {
  const d = ui.disease;
  const connected = !!(ui.sample && ui.sampleImages);
  return `${pageHead('Disease Detection', 'Upload a plant photo for a preliminary assessment and inspection steps.', connected ? '<span class="tag live">' + ic('spark') + 'Claude image analysis available</span>' + SIM_TAG : SIM_TAG)}
  <div class="notice warn">${ic('alert')}<div><b>Preliminary assessment only.</b> Results are not a diagnosis. Confirm any suspected disease by physical inspection and, where needed, a lab test.</div></div>
  <div class="grid g-2">
    ${card('Plant photo', `<div class="drop" id="dropZone"><span class="chip-ico">${ic('camera')}</span><b>Drop a leaf or plant photo here</b><span class="small muted">JPEG or PNG, taken in daylight, close to the affected area</span><label class="btn" for="dFile">${ic('upload')}Choose photo</label><input id="dFile" type="file" accept="image/jpeg,image/png,image/webp" class="sr"></div>
      ${d?.img ? `<img class="thumb" src="${d.img}" alt="Uploaded plant photo" style="margin-top:12px">` : ''}
      <div class="form-grid" style="margin-top:12px">${fld('Crop batch', `<select id="dBatch">${activeBatches().map(b => `<option value="${b.id}" ${d?.batchId === b.id ? 'selected' : ''}>${b.id} · ${CROPS[b.crop].label} · ${ghById(b.ghId).code}${b.zone.slice(1)}</option>`).join('')}</select>`, 'dBatch')}</div>
      <div class="toolbar" style="margin-top:12px"><button class="btn primary" data-act="disease-run" ${d?.img && !d.busy ? '' : 'disabled'}>${d?.busy === 'sim' ? '<span class="spinner"></span>Analyzing…' : 'Run simulated check'}</button>${connected ? `<button class="btn" data-act="disease-claude" ${d?.img && !d.busy ? '' : 'disabled'}>${d?.busy === 'claude' ? '<span class="spinner"></span>Asking Claude…' : ic('spark') + 'Analyze with Claude'}</button>` : ''}</div>
      ${!connected ? '<p class="small muted" style="margin-top:10px">Connected image analysis needs the Claude viewer. It is not available in this view, so only the simulated check runs.</p>' : ''}`)}
    ${card('Assessment', d?.error ? `<div class="notice crit">${ic('alert')}<div>${esc(d.error)}</div></div>` : d?.result ? diseaseResult(d.result) : empty('scan', 'No photo analyzed yet', 'Upload a photo and run a check to see possible conditions.'))}
  </div>`;
}
function diseaseResult(r) {
  const conf = c => c >= 0.6 ? ['b-warn', 'Moderate'] : c >= 0.35 ? ['b-mute', 'Low'] : ['b-mute', 'Very low'];
  return `<div class="split" style="margin-bottom:10px">${r.source === 'claude' ? '<span class="tag live">' + ic('spark') + 'Connected: Claude image analysis</span>' : SIM_TAG}<span class="small muted">${fmtDT(r.at)}</span></div>
  ${r.summary ? `<p style="margin-bottom:12px">${esc(r.summary)}</p>` : ''}
  <div style="display:grid;gap:10px">${r.conditions.map(c => `<div style="border:1px solid var(--line);border-radius:10px;padding:11px 13px"><div class="split" style="justify-content:space-between"><b>${esc(c.name)}</b><span class="badge ${conf(c.confidence)[0]}">${conf(c.confidence)[1]} confidence · ${Math.round(c.confidence * 100)}%</span></div><p class="small muted" style="margin-top:4px">${esc(c.why)}</p></div>`).join('')}</div>
  <h3 style="margin:16px 0 6px">Suggested inspection steps</h3><ol class="list-plain">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
  <div class="toolbar" style="margin-top:14px">${can('tasks') ? `<button class="btn" data-act="disease-task">${ic('clipboard')}Create inspection task</button>` : ''}<button class="btn" data-act="disease-obs">${ic('edit')}Add to batch observations</button></div>`;
}
async function analyzeSimulated() {
  const d = ui.disease; d.busy = 'sim'; d.error = null; render();
  await sleep(1100);
  const { r, g, b, brown, yellow, white } = d.stats;
  const cond = [];
  if (brown > 0.08) cond.push({ name: 'Leaf spot (fungal or bacterial)', confidence: clamp(0.3 + brown * 1.5, 0, 0.7), why: `About ${Math.round(brown * 100)}% of pixels are brown or purple-brown, consistent with lesions.` });
  if (yellow > 0.15) cond.push({ name: 'Nutrient deficiency (chlorosis)', confidence: clamp(0.25 + yellow, 0, 0.65), why: `About ${Math.round(yellow * 100)}% of the image is yellow-green. Interveinal yellowing often follows high pH or low iron.` });
  if (white > 0.12) cond.push({ name: 'Powdery mildew', confidence: clamp(0.2 + white, 0, 0.6), why: `Pale, low-saturation patches cover about ${Math.round(white * 100)}% of the image.` });
  if (!cond.length) cond.push({ name: 'No clear symptoms detected', confidence: 0.4, why: `Colour is mostly healthy green (average RGB ${r}, ${g}, ${b}). Early infections may not be visible in a photo.` });
  cond.sort((a, b) => b.confidence - a.confidence);
  d.result = { source: 'sim', at: Date.now(), conditions: cond.slice(0, 3), summary: 'Colour-analysis heuristic. It only measures colour in the image and cannot recognize disease.', steps: ['Check the underside of 10 leaves in the affected row for spores, webbing or insects.', 'Compare new and old leaves: yellowing on new growth points to pH or iron, on old growth to nitrogen or magnesium.', 'Inspect roots: healthy roots are white and firm; brown, slimy roots suggest Pythium.', 'Measure pH, EC and water temperature in the reservoir feeding this zone.', 'Isolate affected plants and sanitize tools before moving to the next zone.'] };
  d.busy = null; render();
}
async function analyzeClaude() {
  const d = ui.disease, b = Store.get('batches', d.batchId);
  d.busy = 'claude'; d.error = null; render();
  try {
    const blob = await (await fetch(d.img)).blob();
    const out = await ui.sample.json(`You are helping a hydroponic grower triage a plant photo. Crop: ${CROPS[b.crop].label}, stage ${b.stage}, greenhouse ${ghById(b.ghId).name}. Latest demo readings: pH ${readings(b.ghId).ph}, EC ${readings(b.ghId).ec} mS/cm, air temp ${readings(b.ghId).temp} °C, humidity ${readings(b.ghId).hum}%.
Look at the attached image and give a cautious, preliminary assessment (not a diagnosis). Reply with only JSON: {"summary": string (1-2 sentences), "conditions": [{"name": string, "confidence": number 0-1, "why": string}] (1-3 items, most likely first), "steps": [string] (3-6 physical inspection steps)}.`, { images: [blob] });
    if (!out || !Array.isArray(out.conditions) || !Array.isArray(out.steps)) throw { code: 'invalid_json' };
    d.result = { source: 'claude', at: Date.now(), summary: String(out.summary || ''), conditions: out.conditions.slice(0, 3).map(c => ({ name: String(c.name), confidence: clamp(Number(c.confidence) || 0, 0, 1), why: String(c.why || '') })), steps: out.steps.slice(0, 6).map(String) };
  } catch (e) {
    d.error = { not_granted: 'Claude access was not allowed for this page. The simulated check still works.', rate_limited: 'Claude is busy or your usage limit was reached. Try again later.', image_rejected: 'Claude could not read this image. Try a JPEG or PNG under 20 MB.', invalid_json: 'Claude replied in an unexpected format. Try again.' }[e.code] || 'Claude could not analyze the photo right now. Try again or use the simulated check.';
  }
  d.busy = null; render();
}
async function loadDiseaseFile(file) {
  if (!file || !file.type.startsWith('image/')) { ui.disease = { error: 'That file is not an image. Choose a JPEG, PNG or WebP photo.' }; return render(); }
  try {
    const img = await downscale(file, 800);
    const el = new Image(); el.src = img; await el.decode();
    const c = document.createElement('canvas'); c.width = 80; c.height = Math.round(80 * el.height / el.width); const x = c.getContext('2d'); x.drawImage(el, 0, 0, c.width, c.height);
    const px = x.getImageData(0, 0, c.width, c.height).data; let R = 0, G = 0, B = 0, n = 0, brown = 0, yellow = 0, white = 0;
    for (let i = 0; i < px.length; i += 4) { const r = px[i], g = px[i + 1], b = px[i + 2]; R += r; G += g; B += b; n++; const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (r > g && r > b && mx < 170 && mx - mn > 30) brown++; else if (r > 150 && g > 140 && b < 110 && Math.abs(r - g) < 50) yellow++; else if (mn > 185 && mx - mn < 25) white++; }
    ui.disease = { img, batchId: $('#dBatch')?.value || activeBatches()[0]?.id, stats: { r: Math.round(R / n), g: Math.round(G / n), b: Math.round(B / n), brown: brown / n, yellow: yellow / n, white: white / n } };
  } catch (e) { ui.disease = { error: 'The photo could not be read. Try a different file.' }; }
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
  
  ${card('Conversation', `<div class="chat" id="chatLog" aria-live="polite">${ui.chat.length ? ui.chat.map(m => `<div class="msg ${m.role === 'user' ? 'user' : 'bot'}">${m.role === 'user' ? esc(m.text) : linkify(m.text)}${m.role !== 'user' ? `<span class="src">${m.src === 'gemini' ? '<span class="tag live">Gemini AI</span>' : m.src === 'direct' ? '<span class="tag live" style="background:var(--ok-bg);color:var(--ok)">Direct Data (Instant)</span>' : m.src === 'kb' ? '<span class="tag live" style="background:var(--ok-bg);color:var(--ok)">Knowledge Base (Instant)</span>' : m.src === 'claude' ? '<span class="tag live">Claude</span>' : m.src === 'error' ? '<span class="tag warn">API Error</span>' : m.src === 'pending' ? '<span class="tag">Thinking…</span>' : '<span class="tag sim">Simulated</span>'}</span>` : ''}${m.sources && m.sources.length ? `<div class="sources small muted" style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px"><span style="width:100%;font-weight:600">Web Sources:</span>${m.sources.map(s => `<a href="${esc(s.uri)}" target="_blank" rel="noopener" class="tag sm" style="text-decoration:underline">${esc(s.title || s.uri)}</a>`).join('')}</div>` : ''}</div>`).join('') : empty('chat', 'Ask a question about your farm or agriculture', 'Try one of the suggestions below.')}</div>
    <div class="toolbar" style="margin:12px 0">${sugg.map(s => `<button class="btn sm" data-act="ask" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    <form id="chatForm" class="toolbar" novalidate><label class="sr" for="chatIn">Your question</label><input id="chatIn" class="input grow" placeholder="e.g. Which supplies are low, or how does NFT hydroponics work?" autocomplete="off" ${ui.chatBusy ? 'disabled' : ''}><button class="btn primary" type="submit" ${ui.chatBusy ? 'disabled' : ''}>${ui.chatBusy ? '<span class="spinner"></span>' : ic('send')}Send</button>${ui.chat.length ? '<button class="btn" type="button" data-act="chat-clear">Clear</button>' : ''}</form>`)}`;
}
function recordLink(id) {
  if (/^B-\d+$/.test(id) && Store.get('batches', id)) return `<button class="tag" style="cursor:pointer" data-act="batch" data-id="${id}">${id}</button>`;
  if (/^T-\d+$/.test(id) && Store.get('tasks', id)) return `<button class="tag" style="cursor:pointer" data-act="task-edit" data-id="${id}">${id}</button>`;
  if (/^I-\d+$/.test(id) && Store.get('inventory', id)) return `<a class="tag" href="#inventory">${id}</a>`;
  if (/^H-\d+$/.test(id) && Store.get('harvests', id)) return `<button class="tag" style="cursor:pointer" data-act="harvest-view" data-id="${id}">${id}</button>`;
  if (/^SO-\d+$/.test(id)) return `<a class="tag" href="#sales">${id}</a>`;
  const g = GH.find(x => x.name === id); if (g) return `<a class="tag" href="#${g.id}">${id}</a>`;
  return esc(id);
}
const linkify = t => esc(t).replace(/\[([A-Za-z]{1,2}-\d+|Greenhouse [A-D])\]/g, (_, id) => recordLink(id)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
function farmContext() {
  const k = kpis();
  return JSON.stringify({
    date: dOff(0), farm: 'Riverside Hydro Farm', note: 'Sensor readings are demo data; no devices are connected.',
    greenhouses: GH.map(g => ({ id: g.id, name: g.name, system: g.system, area: g.area, status: ST_LABEL[ghStatus(g.id)], readings: readings(g.id), targets: targets(g.id), plants: ghPlants(g.id), crops: ghCrops(g.id) })),
    batches: activeBatches().map(b => ({ id: b.id, crop: CROPS[b.crop]?.label || b.crop, gh: ghById(b.ghId)?.name || b.ghId, zone: b.zone, plants: b.plants, stage: b.stage, health: b.health, expectedHarvest: b.expectedHarvest, estKg: b.estKg, lastObservation: (b.observations || []).slice(-1)[0] })),
    openTasks: tasks().filter(t => t.status !== 'Done').map(t => ({ id: t.id, title: t.title, assignee: t.assignee, gh: ghById(t.ghId)?.name || 'Farmwide', priority: t.priority, due: t.due + ' ' + t.time, overdue: isOverdue(t) })),
    inventory: inventory().map(i => ({ id: i.id, name: i.name, category: i.category, qty: i.qty, unit: i.unit, reorderAt: i.threshold, supplier: i.supplier, cost: i.cost, belowReorder: Number(i.qty) < Number(i.threshold) })),
    alerts: activeAlerts().map(a => ({ severity: ST_LABEL[a.sev] || a.sev, title: a.title })),
    recentHarvests: harvests().slice(0, 10).map(h => ({ id: h.id, crop: CROPS[h.crop]?.label || h.crop, date: h.date, estKg: h.estKg, actualKg: h.actualKg, grade: h.grade })),
    projectedRevenue30d: Math.round(k.rev),
    orders: Store.all('orders').map(o => ({ id: o.id, status: o.status, customer: o.customer, crop: CROPS[o.crop]?.label || o.crop, kg: o.kg, pricePerKg: o.pricePerKg, date: o.date })),
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

  // 1. Direct Record ID Lookup: [B-xxx], [T-xxx], [I-xxx], [H-xxx], [SO-xxx], [Greenhouse X]
  const idm = q.match(/\b([BTI]|SO|H)-\d+\b/i);
  if (idm) {
    const id = idm[0].toUpperCase();
    const b = Store.get('batches', id), t = Store.get('tasks', id), i = Store.get('inventory', id), h = Store.get('harvests', id);
    if (b) {
      const g = ghById(b.ghId);
      const obs = (b.observations || []).slice(-1)[0];
      return `**Crop Batch [${b.id}] Details:**\n• **Crop:** ${CROPS[b.crop]?.label || b.crop} (${b.variety || ''})\n• **Location:** [${g?.name || b.ghId}], Zone ${b.zone}\n• **Population:** ${num(b.plants)} plants\n• **Stage & Health:** ${b.stage} stage (${readiness(b)}% ready), health score **${b.health}%**\n• **Planted:** ${fmtD(b.plantedOn)} | **Expected Harvest:** ${fmtD(b.expectedHarvest)} (~${num(b.estKg)} kg)${obs ? `\n• **Latest Observation:** "${obs.note}" (${obs.by}, ${fmtD(obs.date)})${obs.flag ? ` [Alert: ${obs.flag}]` : ''}` : ''}`;
    }
    if (t) {
      const g = ghById(t.ghId);
      return `**Work Order [${t.id}] Details:**\n• **Title:** "${t.title}"\n• **Status:** ${t.status} ${isOverdue(t) ? '(OVERDUE)' : ''}\n• **Assignee:** ${t.assignee}\n• **Location:** [${g?.name || t.ghId || 'Farmwide'}]\n• **Priority:** ${t.priority}\n• **Due Date:** ${fmtD(t.due)} at ${fmtT(t.time)}${t.recurrence && t.recurrence !== 'none' ? ` (Repeats: ${t.recurrence})` : ''}${t.notes ? `\n• **Notes:** ${t.notes}` : ''}`;
    }
    if (i) {
      const isLow = Number(i.qty) < Number(i.threshold);
      return `**Inventory Item [${i.id}] Details:**\n• **Name:** ${i.name}\n• **Category:** ${i.category}\n• **Stock on Hand:** ${num(i.qty)} ${i.unit}\n• **Reorder Point:** ${num(i.threshold)} ${i.unit}\n• **Status:** ${isLow ? '⚠️ **Below Reorder Threshold (Reorder Needed)**' : '✓ Stock Level Nominal'}\n• **Supplier:** ${i.supplier || 'Standard Supply'}\n• **Unit Cost:** $${num(i.cost, 2)}`;
    }
    if (h) {
      const g = ghById(h.ghId);
      return `**Harvest Record [${h.id}] Details:**\n• **Crop:** ${CROPS[h.crop]?.label || h.crop}\n• **Harvest Date:** ${fmtD(h.date)}\n• **Location:** [${g?.name || h.ghId}], Zone ${h.zone}\n• **Yield:** ${num(h.actualKg)} kg actual (Plan: ${num(h.estKg)} kg)\n• **Quality Grade:** ${h.grade}${h.notes ? `\n• **Notes:** ${h.notes}` : ''}`;
    }
    const o = Store.get('orders', id);
    if (o) {
      return `**Sales Order [${o.id}] Details:**\n• **Customer:** ${o.customer}\n• **Crop & Volume:** ${num(o.kg)} kg of ${CROPS[o.crop]?.label || o.crop}\n• **Price:** $${num(o.pricePerKg, 2)}/kg (Total: $${num(o.kg * o.pricePerKg, 2)})\n• **Order Date:** ${fmtD(o.date)}\n• **Status:** ${o.status}\n• **Delivery:** ${o.delivery?.status || 'Scheduled'} (${o.delivery?.vehicle || 'Van'})`;
    }
  }

  // Check specific Greenhouse name lookup
  const ghMatch = q.match(/\bGreenhouse\s+([A-D])\b/i) || q.match(/\bGH-([A-D])\b/i);
  if (ghMatch && (s.includes('status') || s.includes('reading') || s.includes('sensor') || s.includes('how is') || s.includes('temperature') || s.includes('ph') || s.includes('condition') || s.includes('detail'))) {
    const code = ghMatch[1].toUpperCase();
    const g = GH.find(x => x.code === code);
    if (g) {
      const r = readings(g.id), t = targets(g.id), st = ghStatus(g.id);
      return `**[${g.name}] Current Environmental Status:**\n• **Overall Status:** ${ST_LABEL[st]} (${g.system}, ${g.area} m²)\n• **Air Temp:** ${num(r.temp, 1)}°C (Target: ${t.temp[0]}–${t.temp[1]}°C)\n• **Humidity:** ${num(r.hum, 0)}% (Target: ${t.hum[0]}–${t.hum[1]}%)\n• **CO₂:** ${num(r.co2, 0)} ppm (Target: ${t.co2[0]}–${t.co2[1]} ppm)\n• **Water Temp:** ${num(r.wt, 1)}°C (Target: ${t.wt[0]}–${t.wt[1]}°C)\n• **pH Level:** ${num(r.ph, 2)} (Target: ${t.ph[0]}–${t.ph[1]})\n• **EC:** ${num(r.ec, 2)} mS/cm (Target: ${t.ec[0]}–${t.ec[1]} mS/cm)\n• **Reservoir Level:** ${num(r.res, 0)}% (Target: ${t.res[0]}–${t.res[1]}%)\n• **Active Plant Count:** ${num(ghPlants(g.id))} plants (${ghCrops(g.id).join(', ') || 'Empty'})\n*(Sensor telemetry values are demo readings)*`;
    }
  }

  // 2. Inventory / Reorder Inquiries (strictly farm inventory queries)
  if (/\b(reorder|re-order)\b/.test(s) || (/\b(inventory|supplies|stock)\b/.test(s) && /\b(low|need|short|order|replenish|out of|threshold|status|list)\b/.test(s))) {
    const low = inventory().filter(i => Number(i.qty) < Number(i.threshold));
    if (!low.length) {
      return `**Inventory Reorder Status:**\nAll ${inventory().length} tracked inventory items are currently above their safety reorder thresholds. No urgent reorders required!`;
    }
    const lines = low.map(i => `• [${i.id}] **${i.name}**: on hand ${num(i.qty)} ${i.unit} (reorder threshold is ${num(i.threshold)} ${i.unit}) — Supplier: ${i.supplier}, Unit Cost: $${num(i.cost, 2)}`).join('\n');
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
    const bad = GH.filter(g => ghStatus(g.id) !== 'ok');
    if (!bad.length) return 'All four greenhouses ([Greenhouse A], [Greenhouse B], [Greenhouse C], [Greenhouse D]) are currently operating within their target environmental thresholds.';
    return `**Greenhouses Requiring Immediate Attention:**\n` + bad.map(g => {
      const ghAlerts = alerts().filter(a => a.id.startsWith('sensor-' + g.id));
      const details = ghAlerts.length ? ghAlerts.map(a => a.title).join('; ') : 'Parameters out of target range';
      return `• [${g.name}] is in **${ST_LABEL[ghStatus(g.id)].toUpperCase()}** status: ${details}.`;
    }).join('\n') + '\n*(Note: Environmental readings are simulated demo data)*';
  }

  // 4. Harvest Readiness & Upcoming Schedule
  if (/\b(what.*(ready|harvest|pick)|harvest.*(this week|upcoming|next|soon|schedule)|ready.*harvest|when.*(next harvest|harvesting))\b/.test(s)) {
    const r = activeBatches().filter(b => daysFrom(b.expectedHarvest) <= 7 || b.stage === 'Ready').sort((a, b) => a.expectedHarvest.localeCompare(b.expectedHarvest));
    if (!r.length) return 'No crop batches are scheduled for harvest in the next 7 days. The next active batches are still in vegetative or flowering stages.';
    const lines = r.map(b => `• [${b.id}] **${CROPS[b.crop]?.label || b.crop}** in [${ghById(b.ghId)?.name || b.ghId}], Zone ${b.zone}: ~${num(b.estKg)} kg on ${fmtD(b.expectedHarvest)} (${readiness(b)}% ready, stage: ${b.stage})`).join('\n');
    return `**Batches Ready or Due for Harvest within 7 Days:**\n${lines}\n\n*Head to the Harvest Management module to log actual yields and quality grades.*`;
  }

  // 5. Tasks & Work Orders
  if (/\b(overdue.*task|task.*overdue)\b/.test(s)) {
    const o = tasks().filter(isOverdue);
    if (!o.length) return 'There are currently no overdue tasks across any greenhouse bays. All scheduled work orders are on track!';
    return `**Overdue Farmer Work Orders (${o.length} tasks):**\n` + o.map(t => `• [${t.id}] **${t.title}** — Assignee: ${t.assignee}, Location: [${ghById(t.ghId)?.name || 'Farm'}], Due: ${fmtD(t.due)} at ${fmtT(t.time)} (Priority: ${t.priority})`).join('\n');
  }

  if (/\b(task.*(today|due today)|today.*task|tasks.*open|what.*(tasks|work orders))\b/.test(s) && !/\b(general|farming|how to)\b/.test(s)) {
    const td = tasks().filter(t => t.status !== 'Done' && t.due === dOff(0));
    const allOpen = tasks().filter(t => t.status !== 'Done');
    return `**Farm Work Orders Summary:**\n• **Due Today (${td.length}):** ${td.map(t => `[${t.id}] "${t.title}" (${t.assignee})`).join('; ') || 'None scheduled for today'}\n• **Total Open Work Orders:** ${allOpen.length} active tasks across farm staff.`;
  }

  // Tasks by assignee
  const assigneeMatch = s.match(/\b(diego|maria|kwame|li wei|priya)\b/i);
  if (assigneeMatch && /\b(task|assigned|work|doing|todo)\b/.test(s)) {
    const person = PEOPLE.find(p => p.name.toLowerCase().includes(assigneeMatch[1].toLowerCase()));
    if (person) {
      const pTasks = tasks().filter(t => t.assignee.toLowerCase().includes(person.name.toLowerCase()) && t.status !== 'Done');
      if (!pTasks.length) return `No open work orders currently assigned to ${person.name}.`;
      return `**Open Tasks Assigned to ${person.name} (${pTasks.length} tasks):**\n` + pTasks.map(t => `• [${t.id}] "${t.title}" in [${ghById(t.ghId)?.name || 'Farm'}], Due: ${fmtD(t.due)} (${t.priority} Priority)`).join('\n');
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
    return `**Active Crop Batches (${act.length} batches):**\n` + act.map(b => `• [${b.id}] **${CROPS[b.crop]?.label || b.crop}** in [${ghById(b.ghId)?.name || b.ghId}] (Zone ${b.zone}) — ${num(b.plants)} plants, Stage: ${b.stage}, Health: ${b.health}%, Expected: ${fmtD(b.expectedHarvest)}`).join('\n');
  }

  // 8. Crops Grown on Farm
  if (/\b(what crops.*(grow|support|planted)|crops.*(on this farm|we grow|farm grow))\b/.test(s)) {
    const cropList = Object.entries(CROPS).map(([k, c]) => `• **${c.label}**: ${c.cycle}-day cycle, wholesale price $${c.price.toFixed(2)}/kg, optimal pH ${c.ph[0]}–${c.ph[1]}`).join('\n');
    return `**Crops Cultivated at Riverside Hydro Farm:**\n${cropList}`;
  }

  // 9. Farm Staff & Team
  if (/\b(who works|farm staff|team members|farm workers|who is on the team|farm team)\b/.test(s)) {
    return `**Riverside Hydro Farm Staff:**\n` + PEOPLE.map(p => `• **${p.name}** — ${p.role}`).join('\n') + `\n• **Jordan Reyes** — Farm Owner\n\n*You can switch roles in the top-right profile menu to test different permission levels.*`;
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
    return `**Current Farm Scale:**\n• **Total Active Plants:** ${num(k.plants)} growing plants\n• **Active Batches:** ${k.batches} batches across ${k.gOn} operational greenhouses\n• **Average Canopy Health:** ${num(k.health, 1)}%\n• **Projected 30-Day Harvest:** ~${num(k.f30kg)} kg (${money(k.rev)} estimated value)`;
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
• **Navigation Tips:** Use the sidebar on desktop or the menu button on mobile. Use the top search bar (or press '/') to jump to any batch, task, or inventory item, and switch farms or roles in the top bar.`;
  }

  // 14. Crop Location & Zone Breakdown
  if (/\b(what.*growing in greenhouse|crops in greenhouse|where.*(strawberry|strawberries|tomato|tomatoes|lettuce|basil))\b/.test(s)) {
    return `**Current Crop Canopy Distribution:**\n` + GH.map(g => {
      const bList = activeBatches().filter(b => b.ghId === g.id);
      return `• [${g.name}] (${g.system}): ${bList.map(b => `${CROPS[b.crop]?.label || b.crop} in Zone ${b.zone} [${b.id}] (${num(b.plants)} plants)`).join(', ') || 'No active batches'}`;
    }).join('\n');
  }

  // 15. Recent Harvests
  if (/\b(recent harvest|last harvest|harvest history)\b/.test(s)) {
    const recent = harvests().slice(0, 5);
    return `**Recent Harvest Records:**\n` + recent.map(h => `• [${h.id}] **${CROPS[h.crop]?.label || h.crop}** on ${fmtD(h.date)}: ${num(h.actualKg)} kg (${h.grade}) in [${ghById(h.ghId)?.name || h.ghId}]`).join('\n');
  }

  // 16. Deliveries & Orders
  if (/\b(deliver(y|ies)|out for delivery|upcoming delivery)\b/.test(s)) {
    const activeOrders = orders().filter(o => o.status !== 'Delivered').slice(0, 5);
    if (!activeOrders.length) return 'All customer orders are currently fulfilled and delivered.';
    return `**Active Deliveries & Sales Orders:**\n` + activeOrders.map(o => `• [${o.id}] **${o.customer}**: ${num(o.kg)} kg of ${CROPS[o.crop]?.label || o.crop} — Status: ${o.status} (${o.delivery?.status || 'Scheduled'})`).join('\n');
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
    const history = ui.chat.slice(0, -1).slice(-8).filter(m => m.role !== 'bot' || m.src !== 'pending').map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
    const response = await fetch('/api/farm-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  const H = ui.fcRange, items = forecastItems(H);
  const weeks = []; for (let w = 0; w < H / 7; w++) weeks.push({ from: w * 7, to: w * 7 + 6 });
  const crops = Object.keys(CROPS), ratios = Object.fromEntries(crops.map(c => [c, historicalRatio(c)]));
  const rows = weeks.map(w => { const it = items.filter(i => i.day >= w.from && i.day <= w.to); const plan = it.reduce((s, i) => s + i.kg, 0); const exp = it.reduce((s, i) => s + i.kg * ratios[i.crop].ratio, 0); const sd = Math.sqrt(it.reduce((s, i) => s + (i.kg * ratios[i.crop].ratio * ratios[i.crop].cv) ** 2, 0)); return { ...w, plan, exp, lo: Math.max(0, exp - 1.64 * sd), hi: exp + 1.64 * sd, byCrop: Object.fromEntries(crops.map(c => [c, it.filter(i => i.crop === c).reduce((s, i) => s + i.kg * ratios[c].ratio, 0)])) }; });
  const tot = rows.reduce((s, r) => s + r.exp, 0), totPlan = rows.reduce((s, r) => s + r.plan, 0), totLo = rows.reduce((s, r) => s + r.lo, 0), totHi = rows.reduce((s, r) => s + r.hi, 0);
  const totRev = items.reduce((s, i) => s + i.kg * ratios[i.crop].ratio * CROPS[i.crop].price, 0);
  return `${pageHead('Production Forecast', 'Upcoming harvest volume from planting schedules and historical yield.', SIM_TAG + seg('fcRange', [[28, '4 weeks'], [56, '8 weeks'], [84, '12 weeks']], H, 'Forecast horizon'))}
  <div class="notice">${ic('info')}<div>Statistical estimate from batch plans and past harvest records, calculated in the page. Not a connected AI model. Weather and pest events are not modeled.</div></div>
  <div class="stats">${[['Expected volume', num(tot) + ' kg'], ['90% range', `${num(totLo)}–${num(totHi)} kg`], ['Plan (batch estimates)', num(totPlan) + ' kg'], ['Projected value', money(totRev)]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${card('Weekly forecast', `<div class="chart-box tall">${makeChart('cFc', { type: 'bar', aria: 'Weekly expected harvest volume with 90 percent range', data: { labels: rows.map(r => 'Wk of ' + fmtD(dOff(r.from))), datasets: [
    ...crops.map(c => ({ label: CROPS[c].label, data: rows.map(r => Math.round(r.byCrop[c])), backgroundColor: col(CROP_COLOR[c]), stack: 's', borderRadius: 3, order: 2 })),
    { type: 'bar', label: '90% range', data: rows.map(r => [Math.round(r.lo), Math.round(r.hi)]), backgroundColor: 'transparent', borderColor: col('--fg'), borderWidth: { top: 2, bottom: 2, left: 0, right: 0 }, borderSkipped: false, barPercentage: .25, grouped: false, order: 1 },
    { type: 'line', label: 'Plan', data: rows.map(r => Math.round(r.plan)), borderColor: col('--muted'), borderDash: [4, 4], pointRadius: 3, pointBackgroundColor: col('--muted'), order: 0 }] },
    options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: false, beginAtZero: true, title: { display: true, text: 'kg' } } } } })}</div>`, { sub: 'Stacked bars: expected kg by crop · whiskers: 90% range · dashed: plan' })}
  <div class="grid g-2">
    ${card('Assumptions', `<ul class="list-plain"><li>Each active batch is harvested on its expected date. Lettuce and basil are single harvests.</li><li>Tomatoes and strawberries in flowering or fruiting stage are picked weekly at the batch's estimated pick size.</li><li>Expected kg = plan × the crop's average actual-to-estimate ratio from past records.</li><li>Uncertainty uses each crop's historical variation (minimum 8%), combined across picks; range is ±1.64 σ (90%).</li><li>Prices for projected value: ${crops.map(c => `${c} $${CROPS[c].price.toFixed(2)}/kg`).join(', ')}.</li></ul>`)}
    ${card('Historical yield accuracy', `<div class="tbl-wrap"><table><thead><tr><th>Crop</th><th class="r">Records</th><th class="r">Actual ÷ estimate</th><th class="r">Variation</th></tr></thead><tbody>${crops.map(c => `<tr><td>${CROPS[c].label}</td><td class="r num">${ratios[c].n}</td><td class="r num">${num(ratios[c].ratio * 100, 1)}%</td><td class="r num">±${num(ratios[c].cv * 100, 1)}%</td></tr>`).join('')}</tbody></table></div>`)}
  </div>`;
}

/* ================= Business ================= */
function monthKey(s) { return s.slice(0, 7); }
function lastMonths(n) { const out = []; for (let m = n - 1; m >= 0; m--) { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, 1); out.push(iso(d).slice(0, 7)); } return out; }
const mLabel = k => parseD(k + '-01').toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
function vYield() {
  const months = lastMonths(6), hs = harvests().filter(h => monthKey(h.date) >= months[0]), crops = Object.keys(CROPS);
  const tot = hs.reduce((s, h) => s + h.actualKg, 0);
  const area = GH.reduce((s, g) => s + g.area, 0);
  const grades = ['A', 'B', 'C'].map(g => hs.filter(h => h.grade === g).reduce((s, h) => s + h.actualKg, 0));
  return `${pageHead('Yield Analytics', 'Harvested volume, productivity and quality over the last 6 months.', '')}
  <div class="stats">${[['Harvested, 6 months', num(tot) + ' kg'], ['Per m² growing area', num(tot / area, 1) + ' kg'], ['Grade A by weight', num(grades[0] / Math.max(1, tot) * 100, 0) + '%'], ['Harvest records', hs.length]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  <div class="grid g-main">
    ${card('Monthly yield by crop', `<div class="chart-box tall">${makeChart('cYm', { type: 'bar', aria: 'Monthly harvested kg by crop', data: { labels: months.map(mLabel), datasets: crops.map(c => ({ label: CROPS[c].label, data: months.map(m => hs.filter(h => h.crop === c && monthKey(h.date) === m).reduce((s, h) => s + h.actualKg, 0)), backgroundColor: col(CROP_COLOR[c]), borderRadius: 4, stack: 's' })) }, options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, title: { display: true, text: 'kg' } } } } })}</div>`)}
    ${card('Quality grades', `<div class="chart-box tall">${makeChart('cGr', { type: 'doughnut', aria: 'Share of harvested weight by grade', data: { labels: ['Grade A', 'Grade B', 'Grade C'], datasets: [{ data: grades, backgroundColor: [col('--c1'), col('--warn'), col('--crit')], borderColor: col('--card'), borderWidth: 3 }] }, options: { cutout: '62%', plugins: { legend: { position: 'bottom' } } } })}</div>`, { sub: 'By harvested weight' })}
  </div>
  ${card('By crop', `<div class="tbl-wrap"><table><thead><tr><th>Crop</th><th>Greenhouse</th><th class="r">Harvested</th><th class="r">Harvests</th><th class="r">Avg per harvest</th><th class="r">Actual vs estimate</th><th class="r">kg per m²</th></tr></thead><tbody>${crops.map(c => { const x = hs.filter(h => h.crop === c), kg = x.reduce((s, h) => s + h.actualKg, 0), est = x.reduce((s, h) => s + h.estKg, 0), g = GH.find(g => g.main === c); return `<tr><td><b>${CROPS[c].label}</b></td><td>${g.name}</td><td class="r num">${num(kg)} kg</td><td class="r num">${x.length}</td><td class="r num">${num(kg / Math.max(1, x.length), 1)} kg</td><td class="r num">${num(kg / Math.max(1, est) * 100, 1)}%</td><td class="r num">${num(kg / g.area, 1)}</td></tr>`; }).join('')}</tbody></table></div>`)}`;
}
function vFinance() {
  if (!can('finance') && !can('financeView')) return pageHead('Financial Dashboard', '') + noPerm('The financial dashboard');
  const months = lastMonths(6), os = orders().filter(o => o.status === 'Delivered' && monthKey(o.date) >= months[0]);
  const ex = Store.all('expenses').filter(e => monthKey(e.date) >= months[0]);
  const rev = months.map(m => os.filter(o => monthKey(o.date) === m).reduce((s, o) => s + o.kg * o.pricePerKg, 0));
  const exp = months.map(m => ex.filter(e => monthKey(e.date) === m).reduce((s, e) => s + Number(e.amount), 0));
  const totR = rev.reduce((a, b) => a + b, 0), totE = exp.reduce((a, b) => a + b, 0), k = kpis();
  const cats = [...new Set(ex.map(e => e.category))].map(c => [c, ex.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount), 0)]).sort((a, b) => b[1] - a[1]);
  const recent = Store.all('expenses').filter(e => !e.demo).sort((a, b) => b.date.localeCompare(a.date));
  return `${pageHead('Financial Dashboard', 'Recorded revenue and expenses for the last 6 months.', can('finance') ? `<button class="btn primary" data-act="expense-new">${ic('plus')}Record expense</button>` : '')}
  <div class="stats">${[['Actual revenue (delivered sales)', money(totR)], ['Recorded expenses', money(totE)], ['Operating margin', money(totR - totE) + ` (${num((totR - totE) / Math.max(1, totR) * 100, 0)}%)`]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}<div class="pill-stat" style="border-style:dashed"><b>${money(k.rev)}</b><span><span class="tag proj">Projection</span> Harvest revenue, next 30 days. Not actual sales.</span></div></div>
  ${card('Revenue vs expenses', `<div class="chart-box tall">${makeChart('cFin', { type: 'bar', aria: 'Monthly actual revenue and expenses', data: { labels: months.map(mLabel), datasets: [{ label: 'Actual revenue', data: rev.map(Math.round), backgroundColor: col('--accent'), borderRadius: 4 }, { label: 'Expenses', data: exp, backgroundColor: col('--c2'), borderRadius: 4 }, { type: 'line', label: 'Margin', data: rev.map((r, i) => Math.round(r - exp[i])), borderColor: col('--fg'), pointRadius: 3, tension: .3 }] }, options: { scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => '$' + (v / 1000) + 'k' } } } } })}</div><p class="small muted" style="margin-top:8px">Revenue counts delivered sales orders only. Expense months before this one are sample monthly totals. Accounting sync (e.g. QuickBooks, Xero) is not connected.</p>`, { sub: 'Monthly, actual figures only' })}
  <div class="grid g-2">
    ${card('Expenses by category', `<div class="tbl-wrap"><table><tbody>${cats.map(([c, v]) => `<tr><td>${esc(c)}</td><td style="width:45%"><div class="bar"><i style="width:${v / cats[0][1] * 100}%;background:var(--c2)"></i></div></td><td class="r num">${money(v)}</td></tr>`).join('')}</tbody></table></div>`, { sub: '6 months' })}
    ${card('Recently recorded expenses', recent.length ? `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Note</th><th class="r">Amount</th></tr></thead><tbody>${recent.slice(0, 10).map(e => `<tr><td class="num">${fmtD(e.date)}</td><td>${esc(e.category)}</td><td class="small">${esc(e.note)}</td><td class="r num">${money(e.amount)}</td></tr>`).join('')}</tbody></table></div>` : empty('wallet', 'No expenses recorded yet', can('finance') ? 'Record an expense to add it to this month.' : 'The farm owner records expenses.'))}
  </div>`;
}
function expenseForm() {
  openModal({ title: 'Record expense', submitLabel: 'Save expense', body: `<div class="form-grid">${fld('Date', `<input id="e-date" name="date" type="date" value="${dOff(0)}" max="${dOff(0)}">`, 'date')}${fld('Category', `<select id="e-cat" name="category">${['Energy', 'Labor', 'Nutrients', 'Seeds & plugs', 'Packaging', 'Maintenance', 'Logistics', 'Other'].map(c => `<option>${c}</option>`).join('')}</select>`, 'category')}${fld('Amount ($)', `<input id="e-amt" name="amount" type="number" min="0" step="0.01" inputmode="decimal">`, 'amount')}${fld('Note', `<input id="e-note" name="note" placeholder="Invoice or description">`, 'note')}</div>`,
    validate: d => ({ amount: !(+d.amount > 0) && 'Enter an amount greater than $0.', date: !d.date && 'Choose a date.', note: !d.note.trim() && 'Add a short description.' }),
    submit: async d => { await Store.put('expenses', { id: uid('E'), ...d, amount: +d.amount }); return 'Expense recorded.'; } });
}
const ORDER_ST = ['Draft', 'Confirmed', 'Packed', 'Delivered', 'Cancelled'];
function vSales() {
  const q = ui.saleF.toLowerCase();
  const os = orders().filter(o => !q || `${o.id} ${o.customer} ${o.crop} ${o.status}`.toLowerCase().includes(q));
  const open = orders().filter(o => !['Delivered', 'Cancelled'].includes(o.status));
  const m = monthKey(dOff(0)), mtd = orders().filter(o => o.status === 'Delivered' && monthKey(o.date) === m).reduce((s, o) => s + o.kg * o.pricePerKg, 0);
  return `${pageHead('Sales', 'Customer orders. Only delivered orders count as actual revenue.', can('sales') ? `<button class="btn primary" data-act="order-new">${ic('plus')}New order</button>` : '')}
  <div class="stats">${[['Delivered this month', money(mtd)], ['Open orders', open.length], ['Open order value', money(open.reduce((s, o) => s + o.kg * o.pricePerKg, 0))], ['Customers', new Set(orders().map(o => o.customer)).size]].map(([l, v]) => `<div class="pill-stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${card('Orders', `<div class="toolbar" style="margin-bottom:12px"><label class="sr" for="so-q">Search orders</label><input id="so-q" class="input grow" type="search" placeholder="Search by order, customer, crop or status" value="${esc(ui.saleF)}" data-filter="saleF"></div>
  ${os.length ? `<div class="tbl-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Crop</th><th class="r">Qty</th><th class="r">Value</th><th>Delivery date</th><th>Status</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${os.slice(0, 40).map(o => `<tr><td class="mono">${o.id}</td><td>${esc(o.customer)}</td><td>${CROPS[o.crop]?.label || esc(o.crop)}</td><td class="r num">${num(o.kg)} kg</td><td class="r num">${money(o.kg * o.pricePerKg)}</td><td class="num">${fmtD(o.date)}</td><td>${orderBadge(o.status)}</td><td class="r">${can('sales') ? `<button class="btn sm" data-act="order-edit" data-id="${o.id}">Edit</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : empty('cart', 'No orders match', 'Try a different search.')}`, { sub: `${Math.min(40, os.length)} of ${os.length} shown, newest first` })}`;
}
const orderBadge = s => `<span class="badge ${s === 'Delivered' ? 'b-ok' : s === 'Cancelled' ? 'b-crit' : s === 'Draft' ? 'b-mute' : 'b-info'}">${s}</span>`;
function orderForm(id) {
  const o = id ? Store.get('orders', id) : { customer: '', crop: 'Lettuce', kg: '', pricePerKg: CROPS.Lettuce.price, date: dOff(3), status: 'Confirmed', delivery: { status: 'Scheduled', vehicle: 'Van 1 (refrigerated)', window: '07:00–10:00' } };
  openModal({ title: id ? `Edit ${o.id}` : 'New sales order', submitLabel: id ? 'Save changes' : 'Create order',
    body: `<div class="form-grid">${fld('Customer', `<input id="so-c" name="customer" list="custList" value="${esc(o.customer)}"><datalist id="custList">${CUSTOMERS.map(c => `<option value="${c}">`).join('')}</datalist>`, 'customer')}
      ${fld('Crop', `<select id="so-crop" name="crop">${Object.entries(CROPS).map(([k, c]) => `<option value="${k}" ${o.crop === k ? 'selected' : ''}>${c.label}</option>`).join('')}</select>`, 'crop')}
      ${fld('Quantity (kg)', `<input id="so-kg" name="kg" type="number" min="0" step="0.1" value="${esc(o.kg)}">`, 'kg')}
      ${fld('Price per kg ($)', `<input id="so-p" name="pricePerKg" type="number" min="0" step="0.01" value="${esc(o.pricePerKg)}">`, 'pricePerKg')}
      ${fld('Delivery date', `<input id="so-d" name="date" type="date" value="${o.date}">`, 'date')}
      ${fld('Order status', `<select id="so-st" name="status">${ORDER_ST.map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`, 'status', 'Delivered orders count as actual revenue.')}</div>`,
    onOpen: m => { $('#so-crop', m).onchange = e => { $('#so-p', m).value = CROPS[e.target.value].price; }; },
    validate: d => ({ customer: d.customer.trim().length < 2 && 'Enter the customer name.', kg: !(+d.kg > 0) && 'Enter a quantity greater than 0 kg.', pricePerKg: !(+d.pricePerKg > 0) && 'Enter a price greater than $0.', date: !d.date && 'Choose a delivery date.' }),
    submit: async d => { const doc = { ...(id ? o : { id: nextId('SO', orders()) }), ...d, kg: +d.kg, pricePerKg: +d.pricePerKg, delivery: { ...o.delivery, status: d.status === 'Delivered' ? 'Delivered' : d.status === 'Cancelled' ? 'Cancelled' : o.delivery.status } }; await Store.put('orders', doc); return `Order ${doc.id} saved.`; } });
}
const DELIV_ST = ['Not scheduled', 'Scheduled', 'Out for delivery', 'Delivered', 'Cancelled'];
function vLogistics() {
  const os = orders().filter(o => daysFrom(o.date) >= -3 && daysFrom(o.date) <= 14).sort((a, b) => a.date.localeCompare(b.date));
  return `${pageHead('Logistics', 'Delivery schedule for the past 3 and next 14 days.', '')}
  <div class="notice">${ic('truck')}<div>Live vehicle tracking and route optimization need a fleet or GPS integration that is <b>not connected</b>. Delivery statuses here are updated by hand.</div></div>
  <div class="stats">${DELIV_ST.slice(0, 4).map(s => `<div class="pill-stat"><b>${os.filter(o => o.delivery?.status === s).length}</b><span>${s}</span></div>`).join('')}</div>
  ${card('Deliveries', os.length ? `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Order</th><th>Customer</th><th class="r">Load</th><th>Vehicle</th><th>Window</th><th>Delivery status</th></tr></thead><tbody>${os.map(o => `<tr><td class="num">${fmtD(o.date)}<div class="small muted">${daysFrom(o.date) === 0 ? 'Today' : daysFrom(o.date) > 0 ? 'in ' + daysFrom(o.date) + ' d' : -daysFrom(o.date) + ' d ago'}</div></td><td class="mono">${o.id}</td><td>${esc(o.customer)}<div class="small muted">${CROPS[o.crop]?.label}</div></td><td class="r num">${num(o.kg)} kg</td><td class="small">${esc(o.delivery?.vehicle || '—')}</td><td class="small num">${esc(o.delivery?.window || '—')}</td><td>${can('sales') ? `<label class="sr" for="dl-${o.id}">Delivery status for ${o.id}</label><select class="select" id="dl-${o.id}" data-deliv="${o.id}" style="height:34px">${DELIV_ST.map(s => `<option ${o.delivery?.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>` : `<span class="badge b-info">${esc(o.delivery?.status)}</span>`}</td></tr>`).join('')}</tbody></table></div>` : empty('truck', 'No deliveries in this window', 'Orders with delivery dates appear here.'))}`;
}

/* ================= Modal & forms ================= */
const fld = (label, control, name, hint = '') => { const idm = control.match(/id="([^"]+)"/); const id = idm ? idm[1] : ''; return `<div class="field"><label for="${id}">${label}</label>${control.replace(/(<(?:input|select|textarea)\b)/, `$1 aria-describedby="err-${name}${hint ? ' hint-' + name : ''}"`)}${hint ? `<span class="hint" id="hint-${name}">${hint}</span>` : ''}<p class="err" id="err-${name}"></p></div>`; };
let modalCfg = null;
function openModal(cfg) {
  const m = $('#modal'); modalCfg = cfg;
  if (m.open) m.close();
  m.className = cfg.wide ? 'wide' : '';
  m.innerHTML = `<form id="modalForm" novalidate><div class="m-h"><h2 id="modalTitle">${cfg.title}</h2><button type="button" class="icon-btn" data-close aria-label="Close dialog">${ic('x')}</button></div><div class="m-b">${cfg.body}</div><div class="m-f"><p class="err" id="formErr" role="alert" style="margin-right:auto;align-self:center"></p>${cfg.footer || ''}${cfg.submitLabel ? `<button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn ${cfg.danger ? 'danger' : 'primary'}" id="modalSubmit">${cfg.submitLabel}</button>` : ''}</div></form>`;
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
  GH.forEach(g => (`${g.name} ${g.main} ${g.system}`.toLowerCase().includes(q)) && R.push({ type: 'Greenhouse', label: `${g.name} · ${ST_LABEL[ghStatus(g.id)]}`, go: () => go(g.id) }));
  batches().forEach(b => (`${b.id} ${b.crop} ${CROPS[b.crop].label} ${b.variety} ${b.zone}`.toLowerCase().includes(q)) && R.push({ type: 'Batch', label: `${b.id} · ${CROPS[b.crop].label} · ${b.stage}`, go: () => batchDetail(b.id) }));
  tasks().forEach(t => (`${t.id} ${t.title} ${t.assignee}`.toLowerCase().includes(q)) && R.push({ type: 'Task', label: `${t.title} · ${t.assignee}`, go: () => taskForm(t.id) }));
  inventory().forEach(i => (`${i.id} ${i.name} ${i.supplier}`.toLowerCase().includes(q)) && R.push({ type: 'Inventory', label: `${i.name} · ${num(i.qty)} ${i.unit}`, go: () => { ui.invQ = i.name; go('inventory'); } }));
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
const profileHtml = () => { const u = currentUser(); return `<div class="split" style="margin-bottom:12px"><span class="avatar" style="width:40px;height:40px">${u.name.split(' ').map(x => x[0]).join('')}</span><div><b>${esc(u.name)}</b><div class="small muted">${esc(u.role)} · Riverside Hydro Farm</div></div></div>
  <div class="field"><label for="roleSel">Viewing as role (demo)</label><select id="roleSel" class="select">${Object.keys(ROLES).map(r => `<option ${r === ui.role ? 'selected' : ''}>${r}</option>`).join('')}</select><span class="hint">Owners see finances and settings. Managers run operations. Workers complete tasks, log observations, record harvests and stock use.</span></div>
  <hr style="border:0;border-top:1px solid var(--line);margin:12px 0"><p class="small muted">Sign-in and user accounts need an identity integration that is not connected in this prototype.</p>`; };

const mobileUtilHtml = () => {
  const al = activeAlerts();
  const u = currentUser();
  const isDark = currentTheme() === 'dark';
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

    <div class="mu-section">
      <div class="mu-title">${ic('house')} Active Farm</div>
      <label for="mobileFarmSel" class="sr">Select farm</label>
      <select id="mobileFarmSel" class="select" style="width:100%">
        <option value="riverside" ${ui.farm === 'riverside' ? 'selected' : ''}>Riverside Hydro Farm</option>
        <option value="hilltop" ${ui.farm === 'hilltop' ? 'selected' : ''}>Hilltop Annex</option>
      </select>
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
      <div class="mu-title">${ic('user')} User & Role</div>
      <div class="split" style="margin-bottom:8px">
        <span class="avatar" style="width:34px;height:34px">${u.name.split(' ').map(x => x[0]).join('')}</span>
        <div>
          <b>${esc(u.name)}</b>
          <div class="small muted">${esc(u.role)}</div>
        </div>
      </div>
      <label for="mobileRoleSel" class="sr">Switch Role</label>
      <select id="mobileRoleSel" class="select" style="width:100%">
        ${Object.keys(ROLES).map(r => `<option ${r === ui.role ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
    </div>
  </div>`;
};

function openNav() { $('#sidebar').classList.add('open'); $('#overlay').classList.add('show'); $('#menuBtn').setAttribute('aria-expanded', 'true'); $('#nav a')?.focus(); }
function closeNav() { $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }

/* ================= Events ================= */
document.addEventListener('click', async e => {
  const t = e.target;
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
    case 'batch': batchDetail(id); break;
    case 'batch-new': can('batches') ? batchForm() : toast('Adding batches is not available for this role.', 'error'); break;
    case 'batch-edit': batchForm(id); break;
    case 'batch-delete': confirmDelete(`batch ${id}`, async () => { await Store.remove('batches', id); return `Batch ${id} deleted.`; }); break;
    case 'obs-new': obsForm(id); break;
    case 'clear-plant-filters': ui.plantF = { q: '', gh: '', stage: '' }; render(); break;
    case 'harvest-record':
    case 'harvest-new': harvestForm(id); break;
    case 'harvest-view': harvestView(id); break;
    case 'cal-prev': ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() - 1, 1); render(); break;
    case 'cal-next': ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() + 1, 1); render(); break;
    case 'cal-today': ui.calMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); render(); break;
    case 'task-new': taskForm(); break;
    case 'task-edit': taskForm(id); break;
    case 'task-toggle': toggleTask(id); break;
    case 'task-delete': confirmDelete('this task', async () => { await Store.remove('tasks', id); return 'Task deleted.'; }); break;
    case 'inv-new': invForm(); break;
    case 'inv-edit': invForm(id); break;
    case 'move-new': moveForm(id); break;
    case 'alert-ack': setAlert(id, 'acknowledged'); break;
    case 'alert-resolve': setAlert(id, 'resolved'); break;
    case 'alert-reopen': setAlert(id, 'new'); break;
    case 'command': commandConfirm(a.dataset.gh, id); break;
    case 'reading-new': readingForm(id); break;
    case 'targets-reset': try { await Store.put('targets', { id, ranges: DEFAULT_TARGETS[id] }); toast('Default targets restored.'); } catch (er) { toast(errText(er), 'error'); } break;
    case 'integration': openModal({ title: 'Connect devices', submitLabel: null, body: `<div class="notice warn">${ic('plug')}<div><b>Device integration is not available in this prototype.</b> Nothing has been connected.</div></div><p>Hydrobot.Ai is structured for an IoT gateway that would publish readings per greenhouse and sensor, for example over MQTT topics like <span class="mono">farm/riverside/gh-a/ph</span>, or through a Modbus TCP bridge for controllers. Once connected, readings would replace demo data and lose the demo label, and equipment commands would still require explicit confirmation.</p>`, footer: '<button type="button" class="btn" data-close>Close</button>' }); break;
    case 'disease-run': analyzeSimulated(); break;
    case 'disease-claude': analyzeClaude(); break;
    case 'disease-task': { const b = Store.get('batches', ui.disease.batchId); taskForm(); setTimeout(() => { $('#k-title').value = `Inspect ${b.id} for ${ui.disease.result.conditions[0].name.toLowerCase()}`; $('#k-gh').value = b.ghId; $('#k-pri').value = 'High'; $('#k-notes').value = 'Preliminary photo assessment. Steps:\n' + ui.disease.result.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'); }, 30); break; }
    case 'disease-obs': { const b = Store.get('batches', ui.disease.batchId); obsForm(b.id); setTimeout(() => { $('#o-note').value = `Photo check (${ui.disease.result.source === 'claude' ? 'Claude' : 'simulated'}, preliminary): ${ui.disease.result.conditions.map(c => `${c.name} ${Math.round(c.confidence * 100)}%`).join('; ')}.`; }, 30); break; }
    case 'ask': ask(a.dataset.q); break;
    case 'chat-clear': ui.chat = []; render(); break;
    case 'expense-new': expenseForm(); break;
    case 'order-new': orderForm(); break;
    case 'order-edit': orderForm(id); break;
    case 'farm-main': ui.farm = 'riverside'; render(); break;
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
  if (e.target && e.target.id === 'mobileSearchInp') { renderMobileSearch(); }
  const f = e.target.dataset && e.target.dataset.filter;
  if (f) { const [a, b] = f.split('.'); if (b) ui[a][b] = e.target.value; else ui[a] = e.target.value; render(); }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'roleSel' || t.id === 'mobileRoleSel') { ui.role = t.value; try { localStorage.setItem('hydrobot.role', ui.role); } catch (er) { } closePops(); render(); toast(`Now viewing as ${ui.role}.`); return; }
  if (t.id === 'farmSel' || t.id === 'mobileFarmSel') { ui.farm = t.value; closePops(); render(); return; }
  if (t.id === 'showResolved') { ui.showResolved = t.checked; render(); return; }
  if (t.id === 'dFile') { loadDiseaseFile(t.files[0]); return; }
  if (t.id === 'dBatch' && ui.disease) { ui.disease.batchId = t.value; return; }
  if (t.dataset.deliv) { const o = Store.get('orders', t.dataset.deliv); const ds = t.value; try { await Store.put('orders', { ...o, delivery: { ...o.delivery, status: ds }, status: ds === 'Delivered' ? 'Delivered' : ds === 'Cancelled' ? 'Cancelled' : ds === 'Out for delivery' && o.status !== 'Delivered' ? 'Packed' : o.status }); toast(`${o.id}: ${ds}.`); } catch (er) { toast(errText(er), 'error'); } return; }
  if (t.dataset.filter && t.tagName === 'SELECT') { /* handled by input */ }
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
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
    try { await Store.put('targets', { id: gh, ranges }); toast(`Targets saved for ${ghById(gh).name}.`); } catch (er) { err.textContent = errText(er); btn.disabled = false; btn.textContent = 'Save targets'; }
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
  ui.route = ROUTES[location.hash.replace('#', '')] ? location.hash.replace('#', '') : 'dashboard';
  render();
  const samplePromise = (async () => {
    try { if (!window.claude || typeof claude.use !== 'function') return; const s = await claude.use('sample'); if (!s) return; ui.sample = s; const lim = await s.limits().catch(() => null); ui.sampleImages = !!(lim && lim.images); scheduleRender(); } catch (e) { }
  })();
  await Store.init();
  render();
  await samplePromise;
})();

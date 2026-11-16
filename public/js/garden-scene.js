import * as THREE from 'https://esm.sh/three@0.169.0';
import { OrbitControls } from 'https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.169.0/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'https://esm.sh/three@0.169.0/examples/jsm/utils/BufferGeometryUtils.js';

const DEFAULT_LAYOUT_URL = '/js/garden-layout.json';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function detectSoftwareGl() {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const name = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return /SwiftShader|llvmpipe|Software Rasterizer|Mesa OffScreen/i.test(String(name));
  } catch {
    return false;
  }
}

function normalizePumpState(state) {
  if (state === true) return 'running';
  if (state === false) return 'off';
  const s = String(state || 'off').toLowerCase().trim();
  if (s === 'on' || s === 'running' || s === 'active') return 'running';
  if (s === 'starting' || s === 'booting' || s === 'priming') return 'starting';
  if (s === 'error' || s === 'fault' || s === 'alarm' || s === 'critical') return 'fault';
  return 'off';
}

function drawPumpBadge(ctx, canvas, pumpState) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  let hex = '#64748b';
  let text = 'PUMP · OFF';
  if (pumpState === 'starting') {
    hex = '#d97706';
    text = 'STARTING...';
  } else if (pumpState === 'running') {
    hex = '#16a34a';
    text = 'RUNNING · FLOW OK';
  } else if (pumpState === 'fault') {
    hex = '#dc2626';
    text = 'FAULT · NO FLOW';
  }

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(4, 4, w - 8, h - 8, 16);
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = hex;
  ctx.stroke();

  ctx.fillStyle = hex;
  ctx.beginPath();
  ctx.arc(30, h / 2, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 24px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 50, h / 2 + 1);
}

function normalizeStatusColor(status) {
  const s = String(status || 'ok').toLowerCase().trim();
  if (s === 'crit' || s === 'critical' || s === 'error' || s === 'alarm') {
    return { hex: '#dc2626', glow: 0xef4444, label: 'CRIT' };
  }
  if (s === 'warn' || s === 'warning') {
    return { hex: '#d97706', glow: 0xf59e0b, label: 'WARN' };
  }
  if (s === 'offline') {
    return { hex: '#64748b', glow: 0x475569, label: 'OFFLINE' };
  }
  return { hex: '#16a34a', glow: 0x22c55e, label: 'OK' };
}

function createProceduralTextures(maxAnisotropy) {
  const rng = mulberry32(4219);

  // 1. Concrete patio / apron texture
  const concCanvas = document.createElement('canvas');
  concCanvas.width = 512;
  concCanvas.height = 512;
  const cCtx = concCanvas.getContext('2d');
  cCtx.fillStyle = '#dad4c8';
  cCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6500; i++) {
    const x = rng() * 512;
    const y = rng() * 512;
    const v = 200 + Math.floor(rng() * 34);
    cCtx.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
    cCtx.fillRect(x, y, 2, 2);
  }
  cCtx.strokeStyle = 'rgba(140, 134, 122, 0.25)';
  cCtx.lineWidth = 2;
  for (let g = 0; g <= 512; g += 128) {
    cCtx.beginPath();
    cCtx.moveTo(g, 0);
    cCtx.lineTo(g, 512);
    cCtx.stroke();
    cCtx.beginPath();
    cCtx.moveTo(0, g);
    cCtx.lineTo(512, g);
    cCtx.stroke();
  }
  const concreteTex = new THREE.CanvasTexture(concCanvas);
  concreteTex.colorSpace = THREE.SRGBColorSpace;
  concreteTex.wrapS = concreteTex.wrapT = THREE.RepeatWrapping;
  concreteTex.repeat.set(6, 4);
  concreteTex.anisotropy = maxAnisotropy;

  // 2. Dark crushed gravel texture (matching tower floor in Group B photo)
  const gravCanvas = document.createElement('canvas');
  gravCanvas.width = 512;
  gravCanvas.height = 512;
  const gCtx = gravCanvas.getContext('2d');
  gCtx.fillStyle = '#4a4e50';
  gCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9500; i++) {
    const x = rng() * 512;
    const y = rng() * 512;
    const r = 1.4 + rng() * 3.4;
    const shade = 52 + Math.floor(rng() * 68);
    gCtx.fillStyle = `rgb(${shade},${shade + 2},${shade + 4})`;
    gCtx.beginPath();
    gCtx.ellipse(x, y, r, r * (0.65 + rng() * 0.4), rng() * Math.PI, 0, Math.PI * 2);
    gCtx.fill();
  }
  const gravelTex = new THREE.CanvasTexture(gravCanvas);
  gravelTex.colorSpace = THREE.SRGBColorSpace;
  gravelTex.wrapS = gravelTex.wrapT = THREE.RepeatWrapping;
  gravelTex.repeat.set(5, 4);
  gravelTex.anisotropy = maxAnisotropy;

  // 3. Dark damp weed-mat aisle texture (matching NFT greenhouse aisle in Group B photo)
  const matCanvas = document.createElement('canvas');
  matCanvas.width = 256;
  matCanvas.height = 256;
  const mCtx = matCanvas.getContext('2d');
  mCtx.fillStyle = '#25282a';
  mCtx.fillRect(0, 0, 256, 256);
  mCtx.strokeStyle = 'rgba(70, 76, 80, 0.35)';
  mCtx.lineWidth = 1;
  for (let i = 0; i < 256; i += 8) {
    mCtx.beginPath();
    mCtx.moveTo(i, 0);
    mCtx.lineTo(i, 256);
    mCtx.stroke();
    mCtx.beginPath();
    mCtx.moveTo(0, i);
    mCtx.lineTo(256, i);
    mCtx.stroke();
  }
  for (let i = 0; i < 800; i++) {
    const x = rng() * 256;
    const y = rng() * 256;
    mCtx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.16)';
    mCtx.fillRect(x, y, 3, 2);
  }
  const weedMatTex = new THREE.CanvasTexture(matCanvas);
  weedMatTex.colorSpace = THREE.SRGBColorSpace;
  weedMatTex.wrapS = weedMatTex.wrapT = THREE.RepeatWrapping;
  weedMatTex.repeat.set(2, 6);
  weedMatTex.anisotropy = maxAnisotropy;

  return { concreteTex, gravelTex, weedMatTex };
}

function createLeafBladeGeometry(width, length, curl, arch, lowPoly = false) {
  const segsW = lowPoly ? 1 : 2;
  const segsL = lowPoly ? 2 : 4;
  const geom = new THREE.PlaneGeometry(width, length, segsW, segsL);
  geom.translate(0, length * 0.5, 0);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = Math.max(0, pos.getY(i));
    const t = Math.max(0, Math.min(1, y / Math.max(1e-6, length)));
    const widthProfile = Math.sin(Math.pow(t, 0.72) * Math.PI * 0.92);
    const nextX = x * (0.28 + widthProfile * 0.85);
    const cupZ = Math.abs(x / (width * 0.5 + 1e-4)) * width * 0.14;
    const bendZ = Math.pow(t, 1.55) * curl - Math.sin(t * Math.PI) * arch + cupZ;
    pos.setXYZ(i, nextX, y * (1 - t * 0.12), bendZ);
  }
  geom.computeVertexNormals();
  return geom;
}

// Reusable generator 1: Butterhead / leafy lettuce rosette (no spheres/boxes)
export function createLettucePrototype(lowPoly = false) {
  const parts = [];
  const outerCount = lowPoly ? 5 : 7;
  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2;
    const leaf = createLeafBladeGeometry(0.085, 0.125, 0.045, 0.014, lowPoly);
    leaf.rotateX(0.95);
    leaf.rotateY(angle);
    leaf.translate(Math.sin(angle) * 0.015, 0.005, Math.cos(angle) * 0.015);
    parts.push(leaf);
  }
  const midCount = lowPoly ? 4 : 5;
  for (let i = 0; i < midCount; i++) {
    const angle = (i / midCount) * Math.PI * 2 + 0.35;
    const leaf = createLeafBladeGeometry(0.072, 0.105, 0.032, 0.012, lowPoly);
    leaf.rotateX(0.58);
    leaf.rotateY(angle);
    leaf.translate(Math.sin(angle) * 0.008, 0.016, Math.cos(angle) * 0.008);
    parts.push(leaf);
  }
  const innerCount = lowPoly ? 3 : 4;
  for (let i = 0; i < innerCount; i++) {
    const angle = (i / innerCount) * Math.PI * 2 + 0.15;
    const leaf = createLeafBladeGeometry(0.052, 0.075, 0.018, 0.008, lowPoly);
    leaf.rotateX(0.28);
    leaf.rotateY(angle);
    leaf.translate(0, 0.025, 0);
    parts.push(leaf);
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  merged.computeBoundingSphere();
  return merged;
}

// Reusable generator 2: Tower pocket greens/herbs cluster oriented outward along +Z
export function createTowerPlantPrototype(lowPoly = false) {
  const parts = [];
  const leafAngles = lowPoly ? [-0.55, 0.0, 0.55] : [-0.65, -0.32, 0.0, 0.34, 0.68];
  for (let i = 0; i < leafAngles.length; i++) {
    const yaw = leafAngles[i];
    const leaf = createLeafBladeGeometry(0.058, 0.115, 0.036, 0.01, lowPoly);
    leaf.rotateX(0.85 + (i % 2) * 0.25);
    leaf.rotateY(yaw);
    leaf.translate(Math.sin(yaw) * 0.01, 0.01, 0.015);
    parts.push(leaf);
  }
  const tuftCount = lowPoly ? 2 : 4;
  for (let i = 0; i < tuftCount; i++) {
    const yaw = -0.45 + i * 0.3;
    const leaf = createLeafBladeGeometry(0.048, 0.088, 0.022, 0.008, lowPoly);
    leaf.rotateX(0.45);
    leaf.rotateY(yaw);
    leaf.translate(0, 0.025, 0.01);
    parts.push(leaf);
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  merged.computeBoundingSphere();
  return merged;
}

// Reusable generator 3: Climbing vine stem + alternating leaves (used if layout defines vines)
export function createVinePrototype() {
  const parts = [];
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.02, 0.35, 0.015),
    new THREE.Vector3(-0.02, 0.7, -0.015),
    new THREE.Vector3(0.015, 1.05, 0.02),
    new THREE.Vector3(0, 1.4, 0)
  ]);
  parts.push(new THREE.TubeGeometry(stemCurve, 10, 0.009, 5, false));
  for (let i = 0; i < 7; i++) {
    const h = 0.18 + i * 0.17;
    const yaw = i * 1.9;
    const leaf = createLeafBladeGeometry(0.07, 0.11, 0.035, 0.01);
    leaf.rotateX(1.05);
    leaf.rotateY(yaw);
    leaf.translate(Math.sin(yaw) * 0.014, h, Math.cos(yaw) * 0.014);
    parts.push(leaf);
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  merged.computeBoundingSphere();
  return merged;
}

function drawSensorBadge(ctx, canvas, sensorState) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const st = sensorState.offline
    ? normalizeStatusColor('offline')
    : normalizeStatusColor(sensorState.status);

  // Clean architectural slate card
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(4, 4, w - 8, h - 8, 18);
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = st.hex;
  ctx.stroke();

  // Status dot
  ctx.fillStyle = st.hex;
  ctx.beginPath();
  ctx.arc(34, 38, 11, 0, Math.PI * 2);
  ctx.fill();

  // Sensor label
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 22px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(sensorState.label || sensorState.id).slice(0, 16), 54, 38);

  // Main value or OFFLINE
  ctx.fillStyle = sensorState.offline ? '#94a3b8' : '#f8fafc';
  ctx.font = '700 36px system-ui, -apple-system, sans-serif';
  const readout = sensorState.offline
    ? 'OFFLINE'
    : `${sensorState.value} ${sensorState.unit || ''}`.trim();
  ctx.fillText(readout, 24, 92);

  // Status tag on right
  ctx.fillStyle = st.hex;
  ctx.font = '700 18px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(st.label, w - 22, 38);
  ctx.textAlign = 'left';
}

function buildGardenFromLayout(layout, sceneState) {
  const { scene, maxAnisotropy, lowPoly, disposables, objectsById, sensorsById, pumpsById, tanksById, flowMarkers } = sceneState;
  const textures = createProceduralTextures(maxAnisotropy);
  disposables.textures.push(textures.concreteTex, textures.gravelTex, textures.weedMatTex);

  // Shared PBR Materials (warm daylight natural palette)
  const mats = {
    plinthEdge: new THREE.MeshStandardMaterial({ color: '#c4bdb0', roughness: 0.88, metalness: 0.04 }),
    concrete: new THREE.MeshStandardMaterial({ map: textures.concreteTex, roughness: 0.88, metalness: 0.03 }),
    gravel: new THREE.MeshStandardMaterial({ map: textures.gravelTex, roughness: 0.94, metalness: 0.02 }),
    weedMat: new THREE.MeshStandardMaterial({ map: textures.weedMatTex, roughness: 0.72, metalness: 0.06 }),
    curb: new THREE.MeshStandardMaterial({ color: '#c8c3b8', roughness: 0.84, metalness: 0.05 }),
    galvSteel: new THREE.MeshStandardMaterial({ color: '#b4bcc2', roughness: 0.34, metalness: 0.78 }),
    darkFrame: new THREE.MeshStandardMaterial({ color: '#31373d', roughness: 0.45, metalness: 0.62 }),
    whitePvc: new THREE.MeshStandardMaterial({ color: '#f2f3f0', roughness: 0.38, metalness: 0.04 }),
    pvcTrim: new THREE.MeshStandardMaterial({ color: '#dde1de', roughness: 0.45, metalness: 0.06 }),
    netCup: new THREE.MeshStandardMaterial({ color: '#272a2c', roughness: 0.68, metalness: 0.05 }),
    hdpePipe: new THREE.MeshStandardMaterial({ color: '#23282c', roughness: 0.48, metalness: 0.08 }),
    returnPipe: new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 0.44, metalness: 0.05 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c49b45', roughness: 0.32, metalness: 0.84 }),
    ledHousing: new THREE.MeshStandardMaterial({ color: '#e5e7eb', roughness: 0.35, metalness: 0.2 }),
    ledEmissive: new THREE.MeshStandardMaterial({
      color: '#fffbeb',
      emissive: new THREE.Color('#fef3c7'),
      emissiveIntensity: 0.78,
      roughness: 0.25
    }),
    tankBody: new THREE.MeshStandardMaterial({ color: '#4f6d65', roughness: 0.48, metalness: 0.06 }),
    tankHatch: new THREE.MeshStandardMaterial({ color: '#2b3330', roughness: 0.52, metalness: 0.1 }),
    waterSight: new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.72
    }),
    pumpBody: new THREE.MeshStandardMaterial({ color: '#3b4f5e', roughness: 0.42, metalness: 0.68 }),
    flowBead: new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: new THREE.Color('#0ea5e9'),
      emissiveIntensity: 0.65,
      roughness: 0.2
    }),
    lettuceLeaf: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.56,
      metalness: 0.02,
      side: THREE.DoubleSide
    }),
    towerLeaf: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.58,
      metalness: 0.02,
      side: THREE.DoubleSide
    }),
    vineLeaf: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.55,
      metalness: 0.02,
      side: THREE.DoubleSide
    })
  };
  Object.values(mats).forEach((m) => disposables.materials.push(m));

  const registerSelectable = (group, id, label, category) => {
    group.name = id;
    group.userData.objectId = id;
    group.userData.label = label || id;
    group.userData.category = category;
    group.traverse((child) => {
      if (child.isMesh) {
        child.userData.objectId = id;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    objectsById.set(id, group);
    scene.add(group);
  };

  // --- 1. Ground Plinth & Zones ---
  const fp = layout.garden?.footprintMeters || { width: 12, depth: 8, plinthHeight: 0.24 };
  const plinthGrp = new THREE.Group();
  plinthGrp.name = 'ground-plinth';
  const plinthGeom = new THREE.BoxGeometry(fp.width + 0.18, fp.plinthHeight, fp.depth + 0.18);
  disposables.geometries.push(plinthGeom);
  const plinthMesh = new THREE.Mesh(plinthGeom, mats.plinthEdge);
  plinthMesh.position.set(0, -fp.plinthHeight * 0.5 - 0.002, 0);
  plinthMesh.receiveShadow = true;
  plinthGrp.add(plinthMesh);

  for (const zone of layout.garden?.zones || []) {
    const [zx, zy, zz] = zone.position;
    const [zw, zd] = zone.size;
    if (zone.type === 'concrete' || zone.type === 'utility_pad') {
      const h = zone.type === 'utility_pad' ? 0.03 : 0.012;
      const g = new THREE.BoxGeometry(zw, h, zd);
      disposables.geometries.push(g);
      const m = new THREE.Mesh(g, mats.concrete);
      m.position.set(zx, zy + h * 0.5 - 0.01, zz);
      m.receiveShadow = true;
      plinthGrp.add(m);
    } else if (zone.type === 'weed_mat') {
      const g = new THREE.BoxGeometry(zw, 0.014, zd);
      disposables.geometries.push(g);
      const m = new THREE.Mesh(g, mats.weedMat);
      m.position.set(zx, zy, zz);
      m.receiveShadow = true;
      plinthGrp.add(m);
    } else if (zone.type === 'gravel') {
      const g = new THREE.BoxGeometry(zw, 0.022, zd);
      disposables.geometries.push(g);
      const m = new THREE.Mesh(g, mats.gravel);
      m.position.set(zx, zy, zz);
      m.receiveShadow = true;
      plinthGrp.add(m);

      // Concrete curb perimeter around crushed gravel pit
      const ch = zone.curbHeight || 0.14;
      const ct = zone.curbThickness || 0.14;
      const curbTopBot = new THREE.BoxGeometry(zw + ct * 2, ch, ct);
      const curbSides = new THREE.BoxGeometry(ct, ch, zd);
      disposables.geometries.push(curbTopBot, curbSides);

      const nCurb = new THREE.Mesh(curbTopBot, mats.curb);
      nCurb.position.set(zx, ch * 0.5, zz - zd * 0.5 - ct * 0.5);
      nCurb.castShadow = true;
      nCurb.receiveShadow = true;
      const sCurb = new THREE.Mesh(curbTopBot, mats.curb);
      sCurb.position.set(zx, ch * 0.5, zz + zd * 0.5 + ct * 0.5);
      sCurb.castShadow = true;
      sCurb.receiveShadow = true;
      const wCurb = new THREE.Mesh(curbSides, mats.curb);
      wCurb.position.set(zx - zw * 0.5 - ct * 0.5, ch * 0.5, zz);
      wCurb.castShadow = true;
      wCurb.receiveShadow = true;
      const eCurb = new THREE.Mesh(curbSides, mats.curb);
      eCurb.position.set(zx + zw * 0.5 + ct * 0.5, ch * 0.5, zz);
      eCurb.castShadow = true;
      eCurb.receiveShadow = true;
      plinthGrp.add(nCurb, sCurb, wCurb, eCurb);
    }
  }
  scene.add(plinthGrp);

  // --- 2. Galvanized Steel Greenhouse End-Frame & Tower Pipe Gantries ---
  for (const frame of layout.frames || []) {
    const fGrp = new THREE.Group();
    const [fx, fy, fz] = frame.position;
    fGrp.position.set(fx, fy, fz);
    const w = frame.width;
    const h = frame.height;

    const postGeom = new THREE.CylinderGeometry(0.024, 0.024, h, 8);
    const topBarGeom = new THREE.CylinderGeometry(0.022, 0.022, w, 8);
    topBarGeom.rotateZ(Math.PI * 0.5);
    disposables.geometries.push(postGeom, topBarGeom);

    const leftPost = new THREE.Mesh(postGeom, mats.galvSteel);
    leftPost.position.set(-w * 0.5, h * 0.5, 0);
    const rightPost = new THREE.Mesh(postGeom, mats.galvSteel);
    rightPost.position.set(w * 0.5, h * 0.5, 0);
    const topBar = new THREE.Mesh(topBarGeom, mats.galvSteel);
    topBar.position.set(0, h, 0);
    fGrp.add(leftPost, rightPost, topBar);

    if (frame.type === 'galvanized_truss') {
      const midPost = new THREE.Mesh(postGeom, mats.galvSteel);
      midPost.position.set(0, h * 0.5, 0);
      fGrp.add(midPost);

      const midRail = new THREE.Mesh(topBarGeom, mats.galvSteel);
      midRail.position.set(0, h * 0.72, 0);
      fGrp.add(midRail);

      // Diagonal X-bracing inspired by Group B photo 2
      const braceLen = Math.hypot(w * 0.5, h * 0.72);
      const braceGeom = new THREE.CylinderGeometry(0.01, 0.01, braceLen, 6);
      disposables.geometries.push(braceGeom);
      const diagAngle = Math.atan2(w * 0.5, h * 0.72);

      for (const offset of [-w * 0.25, w * 0.25]) {
        const b1 = new THREE.Mesh(braceGeom, mats.galvSteel);
        b1.position.set(offset, h * 0.36, 0);
        b1.rotation.z = diagAngle;
        const b2 = new THREE.Mesh(braceGeom, mats.galvSteel);
        b2.position.set(offset, h * 0.36, 0);
        b2.rotation.z = -diagAngle;
        fGrp.add(b1, b2);
      }
    }

    registerSelectable(fGrp, frame.id, frame.id, 'structure');
  }

  // Track plant transform slots for single-draw InstancedMeshes per plant type
  const lettuceInstances = [];
  const towerPlantInstances = [];
  const vineInstances = [];

  // --- 3. Shelved Grow Beds (bed-1, bed-2) with LED bars & trays ---
  for (const bed of layout.shelvedBeds || []) {
    const grp = new THREE.Group();
    grp.position.set(...bed.position);
    grp.rotation.set(...(bed.rotation || [0, 0, 0]));

    const w = bed.width || 2.3;
    const d = bed.depth || 0.92;
    const h = bed.height || 2.0;
    const tiers = bed.tiers || 3;

    // 4 metal corner uprights
    const postGeom = new THREE.BoxGeometry(0.045, h, 0.045);
    disposables.geometries.push(postGeom);
    for (const px of [-w * 0.5 + 0.025, w * 0.5 - 0.025]) {
      for (const pz of [-d * 0.5 + 0.025, d * 0.5 - 0.025]) {
        const post = new THREE.Mesh(postGeom, mats.darkFrame);
        post.position.set(px, h * 0.5, pz);
        grp.add(post);
      }
    }

    const railXGeom = new THREE.BoxGeometry(w, 0.035, 0.035);
    const railZGeom = new THREE.BoxGeometry(0.035, 0.035, d);
    const trayGeom = new THREE.BoxGeometry(w - 0.1, 0.065, d - 0.08);
    const trayLipGeom = new THREE.BoxGeometry(w - 0.06, 0.025, d - 0.04);
    const ledBarGeom = new THREE.BoxGeometry(w - 0.16, 0.022, 0.06);
    const ledStripGeom = new THREE.BoxGeometry(w - 0.2, 0.012, 0.042);
    disposables.geometries.push(railXGeom, railZGeom, trayGeom, trayLipGeom, ledBarGeom, ledStripGeom);

    const tierStep = (h - 0.26) / tiers;
    const cols = bed.colsPerTier || 6;
    const rows = bed.rowsPerTier || 2;

    for (let t = 0; t < tiers; t++) {
      const shelfY = 0.22 + t * tierStep;

      // Support frame rails
      const rFront = new THREE.Mesh(railXGeom, mats.darkFrame);
      rFront.position.set(0, shelfY - 0.02, d * 0.5 - 0.025);
      const rBack = new THREE.Mesh(railXGeom, mats.darkFrame);
      rBack.position.set(0, shelfY - 0.02, -d * 0.5 + 0.025);
      const rLeft = new THREE.Mesh(railZGeom, mats.darkFrame);
      rLeft.position.set(-w * 0.5 + 0.025, shelfY - 0.02, 0);
      const rRight = new THREE.Mesh(railZGeom, mats.darkFrame);
      rRight.position.set(w * 0.5 - 0.025, shelfY - 0.02, 0);
      grp.add(rFront, rBack, rLeft, rRight);

      // White hydroponic grow tray
      const tray = new THREE.Mesh(trayGeom, mats.whitePvc);
      tray.position.set(0, shelfY + 0.028, 0);
      const lip = new THREE.Mesh(trayLipGeom, mats.pvcTrim);
      lip.position.set(0, shelfY + 0.055, 0);
      grp.add(tray, lip);

      // Overhead twin LED light bars suspended under next shelf (or top canopy bar)
      const lightY = shelfY + tierStep - 0.065;
      for (const lz of [-d * 0.22, d * 0.22]) {
        const housing = new THREE.Mesh(ledBarGeom, mats.ledHousing);
        housing.position.set(0, lightY, lz);
        const emitter = new THREE.Mesh(ledStripGeom, mats.ledEmissive);
        emitter.position.set(0, lightY - 0.012, lz);
        grp.add(housing, emitter);
      }

      // World positions for lettuce plants inside this tray
      const trayTopY = shelfY + 0.068;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const lx = -w * 0.39 + (cols > 1 ? (c / (cols - 1)) * w * 0.78 : 0);
          const lz = -d * 0.24 + (rows > 1 ? (r / (rows - 1)) * d * 0.48 : 0);
          const worldPt = new THREE.Vector3(lx, trayTopY, lz);
          worldPt.applyEuler(grp.rotation).add(grp.position);
          lettuceInstances.push({ pos: worldPt, scale: 0.92, rotY: 0 });
        }
      }
    }

    // Top rack cap rails for topmost LED mounting
    const topCapF = new THREE.Mesh(railXGeom, mats.darkFrame);
    topCapF.position.set(0, h - 0.02, d * 0.5 - 0.025);
    const topCapB = new THREE.Mesh(railXGeom, mats.darkFrame);
    topCapB.position.set(0, h - 0.02, -d * 0.5 + 0.025);
    const topCapL = new THREE.Mesh(railZGeom, mats.darkFrame);
    topCapL.position.set(-w * 0.5 + 0.025, h - 0.02, 0);
    const topCapR = new THREE.Mesh(railZGeom, mats.darkFrame);
    topCapR.position.set(w * 0.5 - 0.025, h - 0.02, 0);
    grp.add(topCapF, topCapB, topCapL, topCapR);

    registerSelectable(grp, bed.id, bed.label, 'shelved_bed');
  }

  // --- 4. Parallel NFT Growing Channel Tables (channel-bed-1, channel-bed-2) ---
  for (const ch of layout.channelBeds || []) {
    const grp = new THREE.Group();
    grp.position.set(...ch.position);
    grp.rotation.set(...(ch.rotation || [0, 0, 0]));

    const w = ch.width || 1.25;
    const len = ch.length || 3.85;
    const h = ch.height || 0.82;
    const count = ch.channels || 5;
    const plantsPer = ch.plantsPerChannel || 11;

    // Galvanized support legs & crossbars (3 H-frames along length)
    const legGeom = new THREE.CylinderGeometry(0.02, 0.02, h, 8);
    const crossGeom = new THREE.BoxGeometry(w - 0.08, 0.035, 0.035);
    const longRailGeom = new THREE.BoxGeometry(0.032, 0.032, len - 0.16);
    const gullyGeom = new THREE.BoxGeometry(0.115, 0.068, len);
    const headerGeom = new THREE.CylinderGeometry(0.022, 0.022, w - 0.06, 8);
    headerGeom.rotateZ(Math.PI * 0.5);
    const drainTroughGeom = new THREE.BoxGeometry(w + 0.04, 0.085, 0.12);
    const cupGeom = new THREE.CylinderGeometry(0.03, 0.025, 0.018, 8);

    disposables.geometries.push(
      legGeom, crossGeom, longRailGeom, gullyGeom, headerGeom, drainTroughGeom, cupGeom
    );

    const frameZs = [-len * 0.42, 0, len * 0.42];
    for (const fz of frameZs) {
      for (const fx of [-w * 0.42, w * 0.42]) {
        const leg = new THREE.Mesh(legGeom, mats.galvSteel);
        leg.position.set(fx, h * 0.5, fz);
        grp.add(leg);
      }
      const cross = new THREE.Mesh(crossGeom, mats.galvSteel);
      cross.position.set(0, h - 0.04, fz);
      grp.add(cross);
    }
    for (const rx of [-w * 0.42, w * 0.42]) {
      const longRail = new THREE.Mesh(longRailGeom, mats.galvSteel);
      longRail.position.set(rx, h - 0.06, 0);
      grp.add(longRail);
    }

    // Supply header (-Z end) & return drain trough (+Z end)
    const supplyHeader = new THREE.Mesh(headerGeom, mats.hdpePipe);
    supplyHeader.position.set(0, h + 0.02, -len * 0.5 - 0.03);
    const drainTrough = new THREE.Mesh(drainTroughGeom, mats.pvcTrim);
    drainTrough.position.set(0, h - 0.04, len * 0.5 + 0.04);
    grp.add(supplyHeader, drainTrough);

    // Parallel white NFT gullies
    const spanX = w - 0.18;
    for (let i = 0; i < count; i++) {
      const gx = -spanX * 0.5 + (count > 1 ? (i / (count - 1)) * spanX : 0);
      const gully = new THREE.Mesh(gullyGeom, mats.whitePvc);
      gully.position.set(gx, h + 0.015, 0);
      grp.add(gully);

      for (let p = 0; p < plantsPer; p++) {
        const pz = -len * 0.44 + (plantsPer > 1 ? (p / (plantsPer - 1)) * len * 0.88 : 0);
        const cup = new THREE.Mesh(cupGeom, mats.netCup);
        cup.position.set(gx, h + 0.052, pz);
        grp.add(cup);

        const worldPt = new THREE.Vector3(gx, h + 0.056, pz);
        worldPt.applyEuler(grp.rotation).add(grp.position);
        lettuceInstances.push({ pos: worldPt, scale: 1.05, rotY: 0 });
      }
    }

    registerSelectable(grp, ch.id, ch.label, 'channel_bed');
  }

  // --- 5. Vertical Aeroponic Towers (tower-1 .. tower-8) ---
  const towerColGeom = new THREE.BoxGeometry(0.22, 1.98, 0.22);
  const towerBaseGeom = new THREE.BoxGeometry(0.29, 0.14, 0.29);
  const towerCapGeom = new THREE.BoxGeometry(0.25, 0.06, 0.25);
  const pocketGeom = new THREE.CylinderGeometry(0.034, 0.028, 0.075, 8);
  const dropTubeGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6);
  disposables.geometries.push(towerColGeom, towerBaseGeom, towerCapGeom, pocketGeom, dropTubeGeom);

  for (const tw of layout.towers || []) {
    const grp = new THREE.Group();
    grp.position.set(...tw.position);
    grp.rotation.set(...(tw.rotation || [0, 0, 0]));

    const h = tw.height || 2.08;
    const tiers = tw.tiers || 8;

    const base = new THREE.Mesh(towerBaseGeom, mats.pvcTrim);
    base.position.set(0, 0.07, 0);
    const col = new THREE.Mesh(towerColGeom, mats.whitePvc);
    col.position.set(0, 0.08 + 1.98 * 0.5, 0);
    const cap = new THREE.Mesh(towerCapGeom, mats.pvcTrim);
    cap.position.set(0, h, 0);
    const dropTube = new THREE.Mesh(dropTubeGeom, mats.hdpePipe);
    dropTube.position.set(0, h + 0.16, 0);
    grp.add(base, col, cap, dropTube);

    // 4-sided staggered pocket cups + plant instances
    const sides = [
      { dir: new THREE.Vector3(0, 0, 1), yaw: 0 },
      { dir: new THREE.Vector3(1, 0, 0), yaw: Math.PI * 0.5 },
      { dir: new THREE.Vector3(0, 0, -1), yaw: Math.PI },
      { dir: new THREE.Vector3(-1, 0, 0), yaw: -Math.PI * 0.5 }
    ];

    for (let t = 0; t < tiers; t++) {
      const py = 0.28 + (t / (tiers - 1)) * (h - 0.45);
      for (let s = 0; s < 4; s++) {
        const yOffset = (s % 2) * 0.06;
        const pocketY = py + yOffset;
        if (pocketY > h - 0.1) continue;
        const side = sides[s];

        const cup = new THREE.Mesh(pocketGeom, mats.whitePvc);
        cup.position.set(side.dir.x * 0.118, pocketY, side.dir.z * 0.118);
        cup.rotation.y = side.yaw;
        cup.rotateX(Math.PI * 0.34);
        grp.add(cup);

        const plantLocal = new THREE.Vector3(side.dir.x * 0.14, pocketY + 0.015, side.dir.z * 0.14);
        plantLocal.applyEuler(grp.rotation).add(grp.position);
        const worldYaw = side.yaw + (grp.rotation ? grp.rotation.y : 0);
        towerPlantInstances.push({ pos: plantLocal, yaw: worldYaw, scale: 1.0 });
      }
    }

    registerSelectable(grp, tw.id, tw.label, 'vertical_tower');
  }

  // Optional climbing vines (if added to layout.vines)
  for (const v of layout.vines || []) {
    vineInstances.push({
      pos: new THREE.Vector3(...v.position),
      yaw: v.rotation ? v.rotation[1] || 0 : 0,
      scale: v.scale || 1.0
    });
  }

  // --- 6. Build InstancedMeshes for All Foliage ---
  const plantRng = mulberry32(8123);
  const dummy = new THREE.Object3D();
  const colorTmp = new THREE.Color();

  if (lettuceInstances.length > 0) {
    const lettuceGeom = createLettucePrototype(lowPoly);
    disposables.geometries.push(lettuceGeom);
    const lettuceMesh = new THREE.InstancedMesh(lettuceGeom, mats.lettuceLeaf, lettuceInstances.length);
    lettuceMesh.castShadow = true;
    lettuceMesh.receiveShadow = true;
    lettuceMesh.name = 'instanced-lettuce';

    for (let i = 0; i < lettuceInstances.length; i++) {
      const item = lettuceInstances[i];
      dummy.position.copy(item.pos);
      const s = item.scale * (0.86 + plantRng() * 0.28);
      dummy.scale.set(s, s * (0.9 + plantRng() * 0.2), s);
      dummy.rotation.set(0, plantRng() * Math.PI * 2, 0);
      dummy.updateMatrix();
      lettuceMesh.setMatrixAt(i, dummy.matrix);

      // Muted warm butterhead greens matching Group B photos + Group A palette
      colorTmp.setHSL(0.245 + (plantRng() - 0.5) * 0.035, 0.52 + plantRng() * 0.12, 0.42 + plantRng() * 0.1);
      lettuceMesh.setColorAt(i, colorTmp);
    }
    lettuceMesh.instanceMatrix.needsUpdate = true;
    if (lettuceMesh.instanceColor) lettuceMesh.instanceColor.needsUpdate = true;
    scene.add(lettuceMesh);
    disposables.meshes.push(lettuceMesh);
  }

  if (towerPlantInstances.length > 0) {
    const towerPlantGeom = createTowerPlantPrototype(lowPoly);
    disposables.geometries.push(towerPlantGeom);
    const towerPlantMesh = new THREE.InstancedMesh(
      towerPlantGeom,
      mats.towerLeaf,
      towerPlantInstances.length
    );
    towerPlantMesh.castShadow = true;
    towerPlantMesh.receiveShadow = true;
    towerPlantMesh.name = 'instanced-tower-greens';

    for (let i = 0; i < towerPlantInstances.length; i++) {
      const item = towerPlantInstances[i];
      dummy.position.copy(item.pos);
      const s = item.scale * (0.85 + plantRng() * 0.3);
      dummy.scale.set(s, s, s);
      dummy.rotation.set(0, item.yaw + (plantRng() - 0.5) * 0.25, (plantRng() - 0.5) * 0.18);
      dummy.updateMatrix();
      towerPlantMesh.setMatrixAt(i, dummy.matrix);

      colorTmp.setHSL(0.28 + (plantRng() - 0.5) * 0.045, 0.48 + plantRng() * 0.14, 0.36 + plantRng() * 0.12);
      towerPlantMesh.setColorAt(i, colorTmp);
    }
    towerPlantMesh.instanceMatrix.needsUpdate = true;
    if (towerPlantMesh.instanceColor) towerPlantMesh.instanceColor.needsUpdate = true;
    scene.add(towerPlantMesh);
    disposables.meshes.push(towerPlantMesh);
  }

  if (vineInstances.length > 0) {
    const vineGeom = createVinePrototype();
    disposables.geometries.push(vineGeom);
    const vineMesh = new THREE.InstancedMesh(vineGeom, mats.vineLeaf, vineInstances.length);
    vineMesh.castShadow = true;
    vineMesh.receiveShadow = true;
    for (let i = 0; i < vineInstances.length; i++) {
      const item = vineInstances[i];
      dummy.position.copy(item.pos);
      dummy.scale.setScalar(item.scale);
      dummy.rotation.set(0, item.yaw, 0);
      dummy.updateMatrix();
      vineMesh.setMatrixAt(i, dummy.matrix);
      colorTmp.setHSL(0.27 + (plantRng() - 0.5) * 0.03, 0.5, 0.38);
      vineMesh.setColorAt(i, colorTmp);
    }
    vineMesh.instanceMatrix.needsUpdate = true;
    if (vineMesh.instanceColor) vineMesh.instanceColor.needsUpdate = true;
    scene.add(vineMesh);
    disposables.meshes.push(vineMesh);
  }

  // --- 7. Main Water Tank (tank-1) ---
  for (const tk of layout.tanks || []) {
    const grp = new THREE.Group();
    grp.position.set(...tk.position);
    grp.rotation.set(...(tk.rotation || [0, 0, 0]));

    const r = tk.radius || 0.62;
    const h = tk.height || 1.48;
    const customTankMat = tk.color
      ? new THREE.MeshStandardMaterial({ color: tk.color, roughness: 0.48, metalness: 0.06 })
      : mats.tankBody;
    if (tk.color) disposables.materials.push(customTankMat);

    const bodyGeom = new THREE.CylinderGeometry(r, r, h - 0.14, 24);
    const topConeGeom = new THREE.CylinderGeometry(r * 0.86, r, 0.14, 24);
    const ribGeom = new THREE.TorusGeometry(r + 0.012, 0.022, 8, 24);
    ribGeom.rotateX(Math.PI * 0.5);
    const hatchGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.07, 16);
    const bulkheadGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.12, 10);
    bulkheadGeom.rotateZ(Math.PI * 0.5);

    // Sight glass level column
    const sightHeight = h * 0.72;
    const sightColGeom = new THREE.CylinderGeometry(0.018, 0.018, sightHeight, 8);
    const fillLevel = Math.max(0.1, Math.min(1.0, tk.fillLevel || 0.78));
    const sightWaterGeom = new THREE.CylinderGeometry(0.014, 0.014, sightHeight * fillLevel, 8);

    disposables.geometries.push(
      bodyGeom, topConeGeom, ribGeom, hatchGeom, bulkheadGeom, sightColGeom, sightWaterGeom
    );

    const body = new THREE.Mesh(bodyGeom, customTankMat);
    body.position.set(0, (h - 0.14) * 0.5, 0);
    const topShoulder = new THREE.Mesh(topConeGeom, customTankMat);
    topShoulder.position.set(0, h - 0.07, 0);
    const hatch = new THREE.Mesh(hatchGeom, mats.tankHatch);
    hatch.position.set(0.14, h + 0.02, 0);
    grp.add(body, topShoulder, hatch);

    for (const ry of [0.28, 0.65, 1.02]) {
      const rib = new THREE.Mesh(ribGeom, customTankMat);
      rib.position.set(0, ry, 0);
      grp.add(rib);
    }

    const suctionFitting = new THREE.Mesh(bulkheadGeom, mats.brass);
    suctionFitting.position.set(r + 0.03, 0.28, 0);
    const returnFitting = new THREE.Mesh(bulkheadGeom, mats.brass);
    returnFitting.position.set(0, 0.24, r + 0.03);
    returnFitting.rotation.y = Math.PI * 0.5;

    const sightGlass = new THREE.Mesh(sightColGeom, mats.whitePvc);
    sightGlass.position.set(0, 0.18 + sightHeight * 0.5, r + 0.04);
    const sightWater = new THREE.Mesh(sightWaterGeom, mats.waterSight);
    sightWater.position.set(0, 0.18 + (sightHeight * fillLevel) * 0.5, r + 0.055);
    grp.add(suctionFitting, returnFitting, sightGlass, sightWater);

    tanksById.set(tk.id, {
      id: tk.id,
      sightWater,
      sightHeight,
      baseFill: fillLevel,
      levelPct: fillLevel * 100
    });

    registerSelectable(grp, tk.id, tk.label, 'tank');
  }

  // --- 8. Circulation Pump (pump-1) ---
  for (const pm of layout.pumps || []) {
    const grp = new THREE.Group();
    grp.position.set(...pm.position);
    grp.rotation.set(...(pm.rotation || [0, 0, 0]));

    const padGeom = new THREE.BoxGeometry(0.56, 0.08, 0.42);
    const motorGeom = new THREE.CylinderGeometry(0.11, 0.11, 0.28, 16);
    motorGeom.rotateZ(Math.PI * 0.5);
    const voluteGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16);
    voluteGeom.rotateZ(Math.PI * 0.5);
    const flangeGeom = new THREE.CylinderGeometry(0.048, 0.048, 0.08, 12);
    const finGeom = new THREE.BoxGeometry(0.22, 0.24, 0.014);
    const beaconRingGeom = new THREE.TorusGeometry(0.065, 0.015, 8, 20);
    beaconRingGeom.rotateX(Math.PI * 0.5);
    const impellerHubGeom = new THREE.CylinderGeometry(0.042, 0.042, 0.025, 8);
    impellerHubGeom.rotateZ(Math.PI * 0.5);
    const bladeGeom = new THREE.BoxGeometry(0.015, 0.14, 0.022);
    const pCardGeom = new THREE.PlaneGeometry(0.68, 0.22);

    disposables.geometries.push(
      padGeom, motorGeom, voluteGeom, flangeGeom, finGeom, beaconRingGeom, impellerHubGeom, bladeGeom, pCardGeom
    );

    const pad = new THREE.Mesh(padGeom, mats.curb);
    pad.position.set(0, 0.04, 0);
    const motor = new THREE.Mesh(motorGeom, mats.pumpBody);
    motor.position.set(0.06, 0.22, 0);
    const volute = new THREE.Mesh(voluteGeom, mats.darkFrame);
    volute.position.set(-0.14, 0.22, 0);

    const suctionPort = new THREE.Mesh(flangeGeom, mats.brass);
    suctionPort.rotation.z = Math.PI * 0.5;
    suctionPort.position.set(-0.24, 0.22, 0);
    const dischargePort = new THREE.Mesh(flangeGeom, mats.brass);
    dischargePort.position.set(-0.1, 0.36, 0);

    grp.add(pad, motor, volute, suctionPort, dischargePort);

    for (let f = -2; f <= 2; f++) {
      const fin = new THREE.Mesh(finGeom, mats.pumpBody);
      fin.position.set(0.06, 0.22, f * 0.038);
      grp.add(fin);
    }

    const beaconMat = new THREE.MeshStandardMaterial({
      color: '#22c55e',
      emissive: new THREE.Color('#22c55e'),
      emissiveIntensity: 0.9,
      roughness: 0.25
    });
    disposables.materials.push(beaconMat);
    const beacon = new THREE.Mesh(beaconRingGeom, beaconMat);
    beacon.position.set(0.06, 0.34, 0);
    grp.add(beacon);

    // Animated impeller indicator on end of pump housing
    const impellerGrp = new THREE.Group();
    impellerGrp.position.set(0.21, 0.22, 0);
    const hub = new THREE.Mesh(impellerHubGeom, mats.brass);
    const b1 = new THREE.Mesh(bladeGeom, mats.whitePvc);
    const b2 = new THREE.Mesh(bladeGeom, mats.whitePvc);
    b2.rotation.x = Math.PI * 0.5;
    impellerGrp.add(hub, b1, b2);
    grp.add(impellerGrp);

    // Pump state label pill ("PUMP · OFF", "STARTING...", "RUNNING · FLOW OK", "FAULT · NO FLOW")
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 340;
    pCanvas.height = 104;
    const pCtx = pCanvas.getContext('2d');
    const pTex = new THREE.CanvasTexture(pCanvas);
    pTex.colorSpace = THREE.SRGBColorSpace;
    pTex.anisotropy = maxAnisotropy;
    disposables.textures.push(pTex);
    const pCardMat = new THREE.MeshBasicMaterial({ map: pTex, transparent: true, side: THREE.DoubleSide });
    disposables.materials.push(pCardMat);
    const cardMesh = new THREE.Mesh(pCardGeom, pCardMat);
    cardMesh.position.set(0, 0.66, 0);
    grp.add(cardMesh);

    const initPumpState = normalizePumpState(pm.initialState || 'off');
    drawPumpBadge(pCtx, pCanvas, initPumpState);
    pTex.needsUpdate = true;

    pumpsById.set(pm.id, {
      id: pm.id,
      group: grp,
      beaconMat,
      impellerGrp,
      cardMesh,
      pCanvas,
      pCtx,
      pTex,
      state: initPumpState
    });

    registerSelectable(grp, pm.id, pm.label, 'pump');
  }

  // --- 9. Piping & Animated Flow Markers ---
  const pipeGrp = new THREE.Group();
  pipeGrp.name = 'irrigation-pipes';
  const flowSphereGeom = new THREE.SphereGeometry(0.022, 8, 8);
  disposables.geometries.push(flowSphereGeom);

  for (const pipe of layout.pipes || []) {
    if (!pipe.points || pipe.points.length < 2) continue;
    const vecs = pipe.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(vecs, false, 'catmullrom', 0.08);
    const tubularSegs = Math.max(12, vecs.length * 10);
    const tubeGeom = new THREE.TubeGeometry(curve, tubularSegs, pipe.radius || 0.024, 8, false);
    disposables.geometries.push(tubeGeom);

    const pipeMat = pipe.kind === 'return' ? mats.returnPipe : mats.hdpePipe;
    const mesh = new THREE.Mesh(tubeGeom, pipeMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    pipeGrp.add(mesh);

    // Add animated flow beads on supply lines
    if (pipe.kind === 'supply') {
      const beadCount = Math.max(2, Math.floor(curve.getLength() / 1.4));
      for (let b = 0; b < beadCount; b++) {
        const bead = new THREE.Mesh(flowSphereGeom, mats.flowBead);
        pipeGrp.add(bead);
        flowMarkers.push({
          mesh: bead,
          curve,
          offset: b / beadCount,
          speed: 0.22
        });
      }
    }
  }
  scene.add(pipeGrp);

  // --- 10. Field Sensors (sensor-1 .. sensor-4) ---
  const sPostGeom = new THREE.CylinderGeometry(0.016, 0.018, 1.0, 8);
  const sPodGeom = new THREE.BoxGeometry(0.11, 0.14, 0.065);
  const sRingGeom = new THREE.TorusGeometry(0.036, 0.009, 8, 16);
  const sCardGeom = new THREE.PlaneGeometry(0.56, 0.26);
  disposables.geometries.push(sPostGeom, sPodGeom, sRingGeom, sCardGeom);

  for (const sn of layout.sensors || []) {
    const grp = new THREE.Group();
    const [sx, sy, sz] = sn.position;
    grp.position.set(sx, 0, sz);
    grp.rotation.set(...(sn.rotation || [0, 0, 0]));

    const mountH = sn.mountHeight || sy || 1.1;
    const post = new THREE.Mesh(sPostGeom, mats.galvSteel);
    post.scale.y = mountH;
    post.position.set(0, mountH * 0.5, 0);

    const pod = new THREE.Mesh(sPodGeom, mats.darkFrame);
    pod.position.set(0, mountH, 0.02);

    const statusMat = new THREE.MeshStandardMaterial({
      color: '#22c55e',
      emissive: new THREE.Color('#22c55e'),
      emissiveIntensity: 0.85,
      roughness: 0.25
    });
    disposables.materials.push(statusMat);

    const ring = new THREE.Mesh(sRingGeom, statusMat);
    ring.position.set(0, mountH + 0.09, 0.02);

    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 148;
    const ctx = canvas.getContext('2d');
    const cardTex = new THREE.CanvasTexture(canvas);
    cardTex.colorSpace = THREE.SRGBColorSpace;
    cardTex.anisotropy = maxAnisotropy;
    disposables.textures.push(cardTex);

    const cardMat = new THREE.MeshBasicMaterial({
      map: cardTex,
      transparent: true,
      side: THREE.DoubleSide
    });
    disposables.materials.push(cardMat);

    const cardMesh = new THREE.Mesh(sCardGeom, cardMat);
    cardMesh.position.set(0, mountH + 0.28, 0.03);

    grp.add(post, pod, ring, cardMesh);

    const sensorRecord = {
      id: sn.id,
      label: sn.label || sn.id,
      unit: sn.unit || '',
      value: sn.initialValue ?? '--',
      status: sn.initialStatus || 'ok',
      offline: false,
      canvas,
      ctx,
      cardTex,
      cardMesh,
      statusMat,
      group: grp
    };
    drawSensorBadge(ctx, canvas, sensorRecord);
    cardTex.needsUpdate = true;

    sensorsById.set(sn.id, sensorRecord);
    registerSelectable(grp, sn.id, sn.label, 'sensor');
  }
}

export function mountGarden(containerElement, options = {}) {
  if (!containerElement) {
    throw new Error('mountGarden requires a valid containerElement');
  }

  const layoutUrl = options.layoutUrl || DEFAULT_LAYOUT_URL;
  const onSelect = typeof options.onSelect === 'function' ? options.onSelect : null;
  const lowPoly = Boolean(options.mobile ?? containerElement.clientWidth < 680);

  const isSoftwareGl = detectSoftwareGl();
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance'
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.setPixelRatio(
    isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, lowPoly ? 1.5 : 2)
  );
  renderer.shadowMap.enabled = !isSoftwareGl;
  if (renderer.shadowMap.enabled) {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';
  containerElement.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ebe7df');

  // Subtle Environment Reflections via RoomEnvironment
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTarget = pmrem.fromScene(roomEnv, 0.04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.55;
  roomEnv.dispose();
  pmrem.dispose();

  // Warm daylight + soft cool sky fill (Group A visual feel)
  const hemiLight = new THREE.HemisphereLight('#d6e7f5', '#b8ab96', 0.72);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight('#fff2da', 2.05);
  sunLight.position.set(11, 16, 9);
  sunLight.castShadow = !isSoftwareGl;
  if (sunLight.castShadow) {
    const shadowRes = lowPoly ? 1024 : 2048;
    sunLight.shadow.mapSize.set(shadowRes, shadowRes);
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 42;
    const d = 9.2;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.025;
  }
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight('#d7e6f5', 0.36);
  rimLight.position.set(-10, 8, -9);
  scene.add(rimLight);

  // Isometric OrthographicCamera
  const frustumSize = 9.4;
  const initW = Math.max(containerElement.clientWidth, 320);
  const initH = Math.max(containerElement.clientHeight, 240);
  const aspect = initW / initH;
  const camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    120
  );
  const defaultCamPos = new THREE.Vector3(11.5, 9.8, 11.5);
  const defaultTarget = new THREE.Vector3(0, 0.75, 0.25);
  const defaultZoom = 1.0;
  camera.position.copy(defaultCamPos);

  renderer.setSize(initW, initH, false);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.copy(defaultTarget);
  controls.minPolarAngle = Math.PI * 0.02;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.minAzimuthAngle = -Math.PI * 0.45;
  controls.maxAzimuthAngle = Math.PI * 0.65;
  controls.minZoom = 0.6;
  controls.maxZoom = 2.4;
  controls.update();

  // Selection ground ring indicator
  const highlightRingGeom = new THREE.RingGeometry(0.45, 0.56, 36);
  highlightRingGeom.rotateX(-Math.PI * 0.5);
  const highlightRingMat = new THREE.MeshBasicMaterial({
    color: '#10b981',
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  const highlightRing = new THREE.Mesh(highlightRingGeom, highlightRingMat);
  highlightRing.visible = false;
  scene.add(highlightRing);

  const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy() || 1, 8);
  const disposables = {
    geometries: [highlightRingGeom],
    materials: [highlightRingMat],
    textures: [],
    meshes: []
  };

  const objectsById = new Map();
  const sensorsById = new Map();
  const pumpsById = new Map();
  const tanksById = new Map();
  const flowMarkers = [];

  const sceneState = {
    scene,
    maxAnisotropy,
    lowPoly,
    disposables,
    objectsById,
    sensorsById,
    pumpsById,
    tanksById,
    flowMarkers
  };

  // Preallocated scratch vectors & raycaster (zero per-frame alloc)
  const _box = new THREE.Box3();
  const _center = new THREE.Vector3();
  const _size = new THREE.Vector3();
  const _pointerNdc = new THREE.Vector2();
  const _raycaster = new THREE.Raycaster();
  const _savedEmissives = new Map();

  let disposed = false;
  let sceneLoaded = false;
  let currentPumpState = 'off';
  let currentHighlightId = null;
  let rafId = null;
  let renderPending = false;
  let animActive = false;
  let lastTime = performance.now();

  // Buffer early calls made before layout JSON finishes loading
  const pendingCalls = [];

  function hasActiveMotion() {
    return currentPumpState === 'running' || currentPumpState === 'starting' || currentPumpState === 'fault';
  }

  function stepAnimation(now) {
    const dt = Math.min((now - lastTime) * 0.001, 0.05);
    lastTime = now;

    // Spin pump impeller & update beacon/badge for off / starting / running / fault
    for (const pump of pumpsById.values()) {
      if (pump.state === 'running') {
        pump.impellerGrp.rotation.x += dt * 7.5;
        pump.beaconMat.color.setHex(0x22c55e);
        pump.beaconMat.emissive.setHex(0x22c55e);
        pump.beaconMat.emissiveIntensity = 0.75 + Math.sin(now * 0.005) * 0.25;
      } else if (pump.state === 'starting') {
        pump.impellerGrp.rotation.x += dt * 2.2;
        pump.beaconMat.color.setHex(0xf59e0b);
        pump.beaconMat.emissive.setHex(0xf59e0b);
        pump.beaconMat.emissiveIntensity = 0.45 + Math.abs(Math.sin(now * 0.006)) * 0.55;
      } else if (pump.state === 'fault') {
        pump.beaconMat.color.setHex(0xef4444);
        pump.beaconMat.emissive.setHex(0xef4444);
        pump.beaconMat.emissiveIntensity = 0.5 + Math.abs(Math.sin(now * 0.009)) * 0.9;
      } else {
        pump.beaconMat.color.setHex(0x64748b);
        pump.beaconMat.emissive.setHex(0x334155);
        pump.beaconMat.emissiveIntensity = 0.2;
      }
      pump.cardMesh.lookAt(camera.position.x, pump.cardMesh.position.y + 0.6, camera.position.z);
    }

    // Move flow beads along supply pipes ONLY when pump flow is confirmed ('running')
    const showFlow = currentPumpState === 'running';
    for (let i = 0; i < flowMarkers.length; i++) {
      const m = flowMarkers[i];
      m.mesh.visible = showFlow;
      if (showFlow) {
        m.offset = (m.offset + dt * m.speed) % 1;
        m.curve.getPointAt(m.offset, m.mesh.position);
      }
    }

    // Keep sensor badges gently oriented toward camera yaw for readability
    for (const s of sensorsById.values()) {
      s.cardMesh.lookAt(camera.position.x, s.cardMesh.position.y + 0.6, camera.position.z);
    }

    if (highlightRing.visible) {
      const pulse = 1 + Math.sin(now * 0.004) * 0.04;
      highlightRing.scale.set(
        highlightRing.userData.baseScale * pulse,
        1,
        highlightRing.userData.baseScale * pulse
      );
    }
  }

  function drawFrame(now) {
    if (disposed) return;
    renderPending = false;
    controls.update();
    stepAnimation(now);
    renderer.render(scene, camera);

    if (animActive && (hasActiveMotion() || currentHighlightId)) {
      scheduleNextFrame();
    } else {
      animActive = false;
    }
  }

  function scheduleNextFrame() {
    if (disposed || renderPending) return;
    renderPending = true;
    if (isSoftwareGl) {
      const gl = renderer.getContext();
      const sync = gl && gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (gl && sync) {
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const status = gl.clientWaitSync(sync, 0, 0);
          if (status === gl.WAIT_FAILED || status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) {
            gl.deleteSync(sync);
            rafId = requestAnimationFrame(drawFrame);
          } else {
            setTimeout(poll, 12);
          }
        };
        setTimeout(poll, 16);
        return;
      }
    }
    rafId = requestAnimationFrame(drawFrame);
  }

  function requestRender(continuous = false) {
    if (disposed) return;
    if (continuous) animActive = true;
    scheduleNextFrame();
  }

  function restoreHighlight() {
    for (const [mat, prev] of _savedEmissives.entries()) {
      if (mat && mat.emissive) {
        mat.emissive.copy(prev.emissive);
        mat.emissiveIntensity = prev.intensity;
      }
    }
    _savedEmissives.clear();
    highlightRing.visible = false;
    currentHighlightId = null;
  }

  // --- Public API Methods ---
  function setPumpState(state, pumpId = 'pump-1') {
    if (!sceneLoaded) {
      pendingCalls.push(() => setPumpState(state, pumpId));
      return;
    }
    const normalized = normalizePumpState(state);
    currentPumpState = normalized;
    const targetPump = pumpsById.get(pumpId) || pumpsById.values().next().value;
    if (targetPump) {
      targetPump.state = normalized;
      drawPumpBadge(targetPump.pCtx, targetPump.pCanvas, normalized);
      targetPump.pTex.needsUpdate = true;
    }
    requestRender(hasActiveMotion());
  }

  function setTankLevel(tankId, levelPct) {
    if (!sceneLoaded) {
      pendingCalls.push(() => setTankLevel(tankId, levelPct));
      return;
    }
    const tk = tanksById.get(tankId) || tanksById.values().next().value;
    if (!tk) return;
    const frac = Math.max(0.05, Math.min(1.0, Number(levelPct) / 100));
    tk.levelPct = Math.round(frac * 100);
    const scaleY = frac / tk.baseFill;
    tk.sightWater.scale.y = scaleY;
    tk.sightWater.position.y = 0.18 + (tk.sightHeight * frac) * 0.5;
    requestRender(hasActiveMotion());
  }

  function setCameraPreset(preset = 'isometric') {
    if (preset === 'top') {
      camera.position.set(0.01, 16.5, 0.45);
      controls.target.set(0, 0.5, 0.25);
      camera.zoom = lowPoly ? 0.85 : 1.05;
    } else {
      camera.position.copy(defaultCamPos);
      controls.target.copy(defaultTarget);
      camera.zoom = defaultZoom;
    }
    camera.updateProjectionMatrix();
    controls.update();
    requestRender(hasActiveMotion());
  }

  function setSensorValue(sensorId, value, status = 'ok') {
    if (!sceneLoaded) {
      pendingCalls.push(() => setSensorValue(sensorId, value, status));
      return;
    }
    const sensor = sensorsById.get(sensorId);
    if (!sensor) return;
    sensor.value = value;
    sensor.status = status || 'ok';
    sensor.offline = false;

    const st = normalizeStatusColor(sensor.status);
    sensor.statusMat.color.set(st.hex);
    sensor.statusMat.emissive.setHex(st.glow);
    sensor.statusMat.emissiveIntensity = 0.9;

    drawSensorBadge(sensor.ctx, sensor.canvas, sensor);
    sensor.cardTex.needsUpdate = true;
    requestRender(hasActiveMotion());
  }

  function setSensorOffline(sensorId, offline = true) {
    if (!sceneLoaded) {
      pendingCalls.push(() => setSensorOffline(sensorId, offline));
      return;
    }
    const sensor = sensorsById.get(sensorId);
    if (!sensor) return;
    sensor.offline = Boolean(offline);

    const st = sensor.offline
      ? normalizeStatusColor('offline')
      : normalizeStatusColor(sensor.status);
    sensor.statusMat.color.set(st.hex);
    sensor.statusMat.emissive.setHex(st.glow);
    sensor.statusMat.emissiveIntensity = sensor.offline ? 0.15 : 0.9;

    drawSensorBadge(sensor.ctx, sensor.canvas, sensor);
    sensor.cardTex.needsUpdate = true;
    requestRender(hasActiveMotion());
  }

  function highlightObject(id) {
    if (!sceneLoaded) {
      pendingCalls.push(() => highlightObject(id));
      return;
    }
    restoreHighlight();
    if (!id) {
      requestRender(hasActiveMotion());
      return;
    }
    const target = objectsById.get(id);
    if (!target) {
      requestRender(hasActiveMotion());
      return;
    }

    currentHighlightId = id;
    // Clone/tint emissive cleanly on selected object's meshes
    target.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive) {
        if (!child.userData.clonedForHighlight) {
          child.material = child.material.clone();
          child.userData.clonedForHighlight = true;
          disposables.materials.push(child.material);
        }
        if (!_savedEmissives.has(child.material)) {
          _savedEmissives.set(child.material, {
            emissive: child.material.emissive.clone(),
            intensity: child.material.emissiveIntensity ?? 0
          });
        }
        child.material.emissive.setHex(0x10b981);
        child.material.emissiveIntensity = 0.28;
      }
    });

    _box.setFromObject(target);
    _box.getCenter(_center);
    _box.getSize(_size);
    const footprintRadius = Math.max(_size.x, _size.z) * 0.55;
    highlightRing.position.set(_center.x, 0.032, _center.z);
    highlightRing.userData.baseScale = Math.max(0.7, footprintRadius / 0.5);
    highlightRing.scale.set(highlightRing.userData.baseScale, 1, highlightRing.userData.baseScale);
    highlightRing.visible = true;

    requestRender(true);
  }

  // --- Pointer Selection & Hover ---
  let pointerDownPos = { x: 0, y: 0 };
  function onPointerDown(e) {
    pointerDownPos.x = e.clientX;
    pointerDownPos.y = e.clientY;
  }

  function onPointerUp(e) {
    const moved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (moved > 6 || !sceneLoaded) return;

    const rect = renderer.domElement.getBoundingClientRect();
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    _raycaster.setFromCamera(_pointerNdc, camera);

    const selectableRoots = Array.from(objectsById.values());
    const hits = _raycaster.intersectObjects(selectableRoots, true);
    if (hits.length > 0) {
      const hitObj = hits[0].object;
      const objectId = hitObj.userData.objectId || null;
      if (objectId) {
        highlightObject(objectId);
        if (onSelect) {
          const root = objectsById.get(objectId);
          onSelect({
            id: objectId,
            label: root?.userData?.label || objectId,
            category: root?.userData?.category || 'object'
          });
        }
        return;
      }
    }
    highlightObject(null);
    if (onSelect) onSelect(null);
  }

  let hoverTimer = null;
  function onPointerMove(e) {
    if (hoverTimer || !sceneLoaded) return;
    hoverTimer = setTimeout(() => {
      hoverTimer = null;
      if (disposed) return;
      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(Array.from(objectsById.values()), true);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    }, 60);
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  controls.addEventListener('change', () => requestRender(hasActiveMotion()));

  // Responsive ResizeObserver
  const resizeObserver = new ResizeObserver((entries) => {
    if (disposed) return;
    for (const entry of entries) {
      const w = Math.max(entry.contentRect.width, 1);
      const h = Math.max(entry.contentRect.height, 1);
      const a = w / h;
      camera.left = (-frustumSize * a) / 2;
      camera.right = (frustumSize * a) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      requestRender(hasActiveMotion());
    }
  });
  resizeObserver.observe(containerElement);

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (hoverTimer) clearTimeout(hoverTimer);

    resizeObserver.disconnect();
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('pointerup', onPointerUp);
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    controls.dispose();

    for (const m of disposables.meshes) {
      if (m.dispose) m.dispose();
    }
    for (const g of disposables.geometries) g.dispose();
    for (const m of disposables.materials) m.dispose();
    for (const t of disposables.textures) t.dispose();
    envTarget.dispose();

    renderer.dispose();
    if (renderer.domElement.parentNode === containerElement) {
      containerElement.removeChild(renderer.domElement);
    }
  }

  const controller = {
    setPumpState,
    setSensorValue,
    setSensorOffline,
    highlightObject,
    setTankLevel,
    setCameraPreset,
    dispose,
    getLayoutIds: () => Array.from(objectsById.keys()),
    ready: null
  };

  controller.ready = fetch(layoutUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${layoutUrl} (${res.status})`);
      return res.json();
    })
    .then((layout) => {
      if (disposed) return controller;

      // Apply layout camera framing if specified
      if (layout.garden?.camera) {
        const cam = layout.garden.camera;
        if (cam.position) {
          defaultCamPos.set(...cam.position);
          camera.position.copy(defaultCamPos);
        }
        if (cam.target) {
          defaultTarget.set(...cam.target);
          controls.target.copy(defaultTarget);
        }
        if (typeof cam.zoom === 'number') {
          camera.zoom = cam.zoom;
        }
        if (typeof cam.minZoom === 'number') controls.minZoom = cam.minZoom;
        if (typeof cam.maxZoom === 'number') controls.maxZoom = cam.maxZoom;
        camera.updateProjectionMatrix();
        controls.update();
      }

      buildGardenFromLayout(layout, sceneState);
      sceneLoaded = true;

      // Apply initial pump state from layout if present
      const firstPump = layout.pumps && layout.pumps[0];
      if (firstPump) {
        currentPumpState = normalizePumpState(firstPump.initialState || 'off');
      }

      // Flush any API calls queued before JSON load completed
      while (pendingCalls.length > 0) {
        const fn = pendingCalls.shift();
        fn();
      }

      requestRender(hasActiveMotion());
      return controller;
    });

  return controller;
}

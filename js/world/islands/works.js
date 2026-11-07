// The Works: production data systems at Providence, as machines.
//   Reconciliation Mill  eight hoppers (the eight reports) feed one conveyor into one silo
//   Inspection Gate      the validation framework, scanning tiles on the belt
//   Migration Depot      a crane moving crates from an old warehouse to a new one
//   Clock Tower          the MDO scheduling engine: 2 h to 10 min
//   Boiler Gauge         Cost Insight tuning: 20 h to 15 h
import * as THREE from 'three';
import { BrickBuilder } from '../../lego/builder.js';
import { PLATE } from '../../lego/dims.js';
import { part, toBufferGeometry } from '../../lego/parts.js';
import { buildTerrain, scatter } from '../terrain.js';
import { house, lamppost, crate, barrel, pine, fence, reserve, printedTile, M4 } from '../props.js';
import { FPS } from '../../core/stepped.js';

function dialTexture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#f2ede2'; g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#17202b'; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#17202b';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.save(); g.translate(256 + Math.sin(a) * 196, 256 - Math.cos(a) * 196); g.rotate(a);
    g.fillRect(-5, -18, 10, 36); g.restore();
  }
  g.font = '600 54px "DM Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (kind === 'clock') { g.fillText('2 h', 256, 150); g.fillStyle = '#c4561f'; g.fillText('10 min', 256, 370); }
  else {
    g.fillStyle = '#c91a09'; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 180, -Math.PI * 0.25, Math.PI * 0.05); g.closePath(); g.globalAlpha = 0.25; g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#17202b'; g.fillText('20 h', 360, 150); g.fillStyle = '#237841'; g.fillText('15 h', 180, 150);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function build(ctx) {
  const b = new BrickBuilder({ seed: 31 });
  const onPath = (x, z) =>
    (z >= 4 && z <= 5 && x >= -15 && x <= 21) ||
    (x >= 3 && x <= 4 && z >= -15 && z <= 5) ||
    (z >= -2 && z <= -1 && x >= -14 && x <= 4) ||
    (x >= -12 && x <= -11 && z >= -2 && z <= 5);
  const t = buildTerrain(b, {
    seed: 41,
    blobs: [{ x: 0, z: 0, rx: 19.5, rz: 14 }, { x: -6, z: -9, rx: 13, rz: 8 }, { x: 10, z: 8, rx: 10, rz: 7 }, { x: 2, z: -15, rx: 6, rz: 3.5 }, { x: -15, z: 6, rx: 6, rz: 6 }],
    edge: 1.8, depth: 15, taper: 1.05, roots: 18,
    grass: (x, z, v) => (v > 0.68 ? 'olive' : v < 0.3 ? 'darkGreen' : 'green'),
    path: onPath,
    pathColor: (x, z) => ((x * 7 + z * 3) % 5 === 0 ? 'darkGray' : 'lightGray'),
    strata: [['darkGray', 'lightGray'], ['darkGray', 'black'], ['black', 'darkGray'], ['black', 'darkGray']],
    moss: 'darkGreen',
  });
  for (const k of t.cells) ctx.cells.add(k);

  // ---------------------------------------------------------- conveyor (z = 8)
  const beltY = 3; // plates
  for (let x = -16; x <= 0; x++) {
    b.brick(x, 0, 8, 1, 1, 3, x % 2 ? 'black' : 'darkGray', { studs: false });
    b.tile(x, beltY, 8, 1, 1, 'black');
    if (x % 3 === 0) { b.tile(x, 0, 7, 1, 1, 'yellow'); b.tile(x, 0, 9, 1, 1, 'yellow'); }
  }
  reserve(ctx, -16, 7, 17, 3);
  // ---------------------------------------------------------- eight hoppers (the eight reports)
  const hopColors = ['red', 'blue', 'yellow', 'green', 'orange', 'white', 'sandBlue', 'darkTan'];
  for (let i = 0; i < 8; i++) {
    const x = -16 + (i % 4) * 2, z = i < 4 ? 5.99 : 10, zi = i < 4 ? 6 : 10;
    const c = hopColors[i];
    b.brick(x, 0, zi, 2, 1, 3, 'darkGray', { studs: false });
    b.brick(x, 3, zi, 2, 1, 3, c);
    b.brick(x, 6, zi, 2, 1, 3, c);
    b.tile(x, 9, zi, 2, 1, i % 2 ? 'black' : 'yellow');
    b.slope(x, 3, i < 4 ? 7 : 9, 2, 1, 3, c, i < 4 ? 0 : 2, 0, { occ: false });
  }
  reserve(ctx, -16, 6, 8, 1); reserve(ctx, -16, 10, 8, 1);
  // ---------------------------------------------------------- the silo (one reconciled layer)
  const sc = { x: 3.5, z: 9 };
  for (let c = 0; c < 9; c++) {
    for (let x = 0; x <= 7; x++) for (let z = 5; z <= 13; z++) {
      const d = Math.hypot(x + 0.5 - sc.x, z + 0.5 - sc.z);
      if (d > 3.6 || d < 2.4) continue;
      const col = c === 6 ? 'glowCyan' : c % 3 === 0 ? 'lightGray' : 'white';
      b.brick(x, c * 3, z, 1, 1, 3, col, { studs: c === 8 });
    }
  }
  b.free('dish', [6], M4(sc.x - 3, 27 * PLATE + 0.01, sc.z - 3).multiply(new THREE.Matrix4().makeScale(1, 0.6, 1)), 'lightGray');
  b.free('cone', [1, 3], M4(sc.x - 0.5, 27 * PLATE + 1.3, sc.z - 0.5), 'darkGray');
  for (let x = 0; x <= 7; x++) for (let z = 5; z <= 13; z++) if (Math.hypot(x + 0.5 - sc.x, z + 0.5 - sc.z) <= 3.6) { ctx.blocked.add(x + ',' + z); ctx.reserved.add(x + ',' + z); }
  ctx.lights.push({ x: sc.x, y: 7.5, z: sc.z, color: 0x4fd8e8, power: 0.45 });

  // ---------------------------------------------------------- inspection gate over the belt
  for (const z of [6, 10]) for (let c = 0; c < 4; c++) b.brick(-3, c * 3, z, 2, 1, 3, c % 2 ? 'yellow' : 'black', { studs: false });
  b.brick(-3, 12, 6, 2, 5, 3, 'darkGray');
  b.tile(-3, 15, 6, 2, 5, 'black');
  b.put('tile', [2, 1, 1], -3, 11, 8, 'glowCyan', { occ: false });
  b.round(-3, 15, 7, 1, 3, 'glowGreen'); b.round(-2, 15, 9, 1, 3, 'glowRed');
  reserve(ctx, -3, 6, 2, 1); reserve(ctx, -3, 10, 2, 1);
  ctx.lights.push({ x: -2, y: 4.2, z: 8.5, color: 0x6fe8f0, power: 0.5 });

  // ---------------------------------------------------------- boiler house and gauge (Cost Insight)
  house(b, ctx, 10, 0, -3, {
    w: 7, d: 5, courses: 3, wall: (c, p) => ((c + p) % 3 ? 'darkRed' : 'red'), trim: 'black',
    windows: [{ side: 'e', at: 1 }], door: { side: 'w', at: 1, w: 1 }, roof: { kind: 'flat', color: 'darkGray', rim: 'yellow' }, lit: true,
  });
  for (const cx of [11, 14]) for (let k = 0; k < 6; k++) b.brick(cx, 11 + k * 3, -3, 2, 2, 3, k === 5 ? 'black' : k % 2 ? 'darkGray' : 'lightGray', { studs: false });
  // pipe from the boiler to the silo
  for (let x = 8; x <= 10; x++) b.round(x, 3, 1, 1, 3, 'pearlGold', { studs: false, occ: false });
  b.free('cyl', [0.35, 6.5, 12], M4(7.5, 1.6, 1.5, 0, 0, Math.PI / 2), 'pearlGold');

  // ---------------------------------------------------------- clock tower (MDO)
  const tx = 6, tz = -9;
  for (let c = 0; c < 8; c++) {
    const col = c === 0 ? 'darkGray' : c >= 5 ? 'tan' : (c % 2 ? 'darkTan' : 'tan');
    for (const [x, z, w, d] of c % 2 ? [[tx, tz, 4, 1], [tx, tz + 3, 4, 1], [tx, tz + 1, 1, 2], [tx + 3, tz + 1, 1, 2]] : [[tx, tz, 1, 4], [tx + 3, tz, 1, 4], [tx + 1, tz, 2, 1], [tx + 1, tz + 3, 2, 1]]) {
      b.brick(x, c * 3, z, w, d, 3, col, { studs: c === 7 });
    }
  }
  b.plate(tx - 1, 24, tz - 1, 6, 6, 'darkGray');
  for (let L = 0; L < 3; L++) {
    const o = L, n = 6 - L * 2;
    b.slope(tx - 1 + o, 25 + L * 3, tz - 1 + o + n - 2, n, 2, 3, 'sandGreen', 0, 1);
    b.slope(tx - 1 + o, 25 + L * 3, tz - 1 + o, n, 2, 3, 'sandGreen', 2, 1);
  }
  b.cone(tx + 1, 34, tz + 1, 'pearlGold');
  reserve(ctx, tx, tz, 4, 4);

  // ---------------------------------------------------------- migration depot: old and new warehouses, crane
  house(b, ctx, -19, 0, -12, {
    w: 8, d: 6, courses: 4, wall: (c, p) => ((c * 3 + p) % 5 === 0 ? 'darkBrown' : 'darkRed'), trim: 'darkGray', lit: true,
    windows: [{ side: 's', at: 1 }], door: { side: 'e', at: 1, w: 2 }, roof: { kind: 'gable', axis: 'x', color: 'darkGray', ridge: 'black' },
  });
  house(b, ctx, -9, 0, -16, {
    w: 7, d: 5, courses: 3, wall: (c) => (c === 2 ? 'azure' : 'white'), trim: 'darkAzure', lit: true,
    windows: [{ side: 's', at: 0 }, { side: 's', at: 5 }], door: { side: 's', at: 3, w: 1 }, roof: { kind: 'flat', color: 'lightGray', rim: 'azure' },
  });
  for (const [x, z, h] of [[-15, -5, 2], [-17, -5, 1], [-15, -3, 1]]) for (let k = 0; k < h; k++) crate(b, ctx, x, k * 6, z, { size: 2, h: 6, color: k ? 'darkBrown' : 'brown' });
  crate(b, ctx, -2, 0, -10, { size: 2, h: 6, color: 'white', top: 'azure' });
  // crane base
  const cb = { x: -8, z: -7 };
  for (let k = 0; k < 2; k++) b.brick(cb.x, k * 3, cb.z, 2, 2, 3, 'black', { studs: false });
  reserve(ctx, cb.x, cb.z, 2, 2);
  const crane = new BrickBuilder({ seed: 32 });
  for (let k = 0; k < 6; k++) crane.brick(-1, k * 3, -1, 2, 2, 3, k % 2 ? 'orange' : 'yellow', { studs: false });
  crane.brick(-2, 18, -1, 10, 2, 2, 'orange');
  crane.brick(-4, 18, -1, 2, 2, 3, 'darkGray');
  crane.brick(-1, 20, -1, 2, 2, 3, 'black');
  crane.tile(-1, 23, -1, 2, 2, 'yellow');
  const { group: craneArm } = crane.build();
  const cranePivot = new THREE.Group(); cranePivot.position.set(cb.x + 1, 6 * PLATE, cb.z + 1); cranePivot.add(craneArm);
  const hook = new THREE.Group(); hook.position.set(7, 18 * PLATE, 0); craneArm.add(hook);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), new THREE.MeshStandardMaterial({ color: 0x1b2a34 }));
  hook.add(cable);
  const hookCrate = new THREE.Mesh(toBufferGeometry(part('brick', 2, 2, 5).geo), new THREE.MeshPhysicalMaterial({ color: 0x582a12, roughness: 0.35, clearcoat: 0.3 }));
  hookCrate.castShadow = true; hook.add(hookCrate);

  // ---------------------------------------------------------- cable car station (north tip)
  b.fillPlates(0, 0, -18, 6, 4, 'darkGray', { tile: true });
  for (let x = 0; x < 6; x++) for (let z = -18; z < -14; z++) { ctx.cells.add(x + ',' + z); ctx.heights.set(x + ',' + z, PLATE); }
  for (let k = 0; k < 7; k++) b.brick(4, k * 3, -18, 1, 1, 3, k % 2 ? 'yellow' : 'black', { studs: k === 6 });
  for (let k = 0; k < 7; k++) b.brick(1, k * 3, -18, 1, 1, 3, k % 2 ? 'yellow' : 'black', { studs: k === 6 });
  b.brick(1, 21, -18, 4, 1, 3, 'darkGray');
  b.round(2, 24, -18, 1, 3, 'pearlGold'); b.round(3, 24, -18, 1, 3, 'pearlGold');
  reserve(ctx, 1, -18, 1, 1); reserve(ctx, 4, -18, 1, 1);
  ctx.ports.station = [2.5, -16];
  ctx.ports.cableTop = [3, -17.5, 26 * PLATE];

  // ---------------------------------------------------------- lamps, details
  lamppost(b, ctx, 7, 0, 3, { power: 0.9 });
  lamppost(b, ctx, -7, 0, 3, { power: 0.8 });
  lamppost(b, ctx, 5, 0, -12, { power: 0.8 });
  lamppost(b, ctx, -13, 0, -3, { power: 0.7 });
  lamppost(b, ctx, 19, 0, 3, { power: 0.8 });
  barrel(b, ctx, 17, 0, -1); barrel(b, ctx, 17, 0, 1, { color: 'darkRed' });
  crate(b, ctx, 8, 0, 11, { size: 2, h: 3, color: 'darkGray', top: 'yellow' });
  pine(b, ctx, -17, 0, 0, { layers: 4, size: 2 }); pine(b, ctx, 15, 0, 9, { layers: 3, size: 1.8 }); pine(b, ctx, -5, 0, 12, { layers: 3 });
  fence(b, ctx, 9, 0, 13, 6, 'x', { color: 'darkGray' });

  // collectible: under the crane arm
  ctx.collectibles.push({ id: 'piece-works', local: [-12.5, 0.2, -7.5] });

  scatter(b, t, ctx.reserved, 7, { flowers: 14, rocks: 22 });
  const { group, stats } = b.build();
  ctx.occ = b.occ;
  ctx.camOcc = b.camOcc;
  // the crane sweeps a disc at arm height: keep cameras out of it
  for (let x = -9; x <= 9; x++) for (let z = -9; z <= 9; z++) if (Math.hypot(x, z) <= 9) for (let l = 0; l < 30; l++) {
    if (l < 22 && Math.hypot(x, z) > 1.5) continue;
    b.occ.add((cb.x + 1 + x) + ',' + l + ',' + (cb.z + 1 + z));
  }
  group.add(cranePivot);

  // ---------------------------------------------------------- printed faces: clock, gauge
  const clockMat = new THREE.MeshStandardMaterial({ map: dialTexture('clock'), roughness: 0.4 });
  const handMat = new THREE.MeshStandardMaterial({ color: 0x17202b, roughness: 0.4 });
  const hands = [];
  for (const [nx, nz, ry] of [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]]) {
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.35, 32), clockMat);
    const cx = tx + 2 + nx * 2.03, cz = tz + 2 + nz * 2.03;
    face.position.set(cx, 18 * PLATE + 0.2, cz); face.rotation.y = ry; group.add(face);
    const hand = new THREE.Group(); hand.position.copy(face.position); hand.rotation.y = ry;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, 0.06), handMat); bar.position.set(0, 0.45, 0.04); hand.add(bar);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 10), handMat); pin.rotation.x = Math.PI / 2; pin.position.z = 0.05; hand.add(pin);
    group.add(hand); hands.push(hand);
  }
  const gauge = new THREE.Mesh(new THREE.CircleGeometry(1.15, 32), new THREE.MeshStandardMaterial({ map: dialTexture('gauge'), roughness: 0.35 }));
  gauge.position.set(13.5, 2.4, 2.03); group.add(gauge);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.1, 8, 32), new THREE.MeshStandardMaterial({ color: 0xaa7f2e, metalness: 0.85, roughness: 0.3 }));
  bezel.position.copy(gauge.position); group.add(bezel);
  const needle = new THREE.Group(); needle.position.set(13.5, 2.4, 2.08);
  const nb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.04), new THREE.MeshStandardMaterial({ color: 0xc91a09 })); nb.position.y = 0.4; needle.add(nb);
  group.add(needle);
  const sign = printedTile('THE WORKS', 3.6, 0.8, { bg: '#1b2a34', ink: '#f2cd37', font: '800 70px "Bricolage Grotesque", Georgia, serif' });
  sign.position.set(19.5, 2.2, 7.1); sign.rotation.y = 0.4; group.add(sign);

  // ---------------------------------------------------------- data tiles on the belt (cyan)
  const tileGeo = toBufferGeometry(part('tile', 1, 1, 1).geo);
  tileGeo.translate(-0.5, 0, -0.5); tileGeo.scale(0.7, 1, 0.7);
  const tileMat = new THREE.MeshStandardMaterial({ color: 0x4fd8e8, emissive: 0x2bb9cc, emissiveIntensity: 1.4, roughness: 0.15, transparent: true, opacity: 0.85 });
  const N = 14;
  const tiles = new THREE.InstancedMesh(tileGeo, tileMat, N);
  tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(tiles);
  const dummy = new THREE.Object3D();

  // ---------------------------------------------------------- smoke puffs from the chimneys
  const puffGeo = toBufferGeometry(part('round', 2, 1).geo, part('round', 2, 1).studs); puffGeo.translate(-1, 0, -1);
  const puffMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.9, transparent: true, opacity: 0.75 });
  const puffs = new THREE.InstancedMesh(puffGeo, puffMat, 10);
  group.add(puffs);

  // ---------------------------------------------------------- exhibits
  ctx.exhibits.push(
    { id: 'cost-insight', marker: [13.5, 6.4, 3], stand: [11.5, 4.6], face: [13.5, 2], hit: [10, 0, -3, 7, 7, 6], shot: { side: 35, dist: 16 }, focusY: 4 },
    { id: 'qa', marker: [-2, 8.2, 8.5], stand: [-0.5, 4.6], face: [-2, 8.5], hit: [-4, 0, 5.5, 4, 7, 6], shot: { side: 40, dist: 16 }, focusY: 3.2 },
    { id: 'gl-recon', marker: [-11, 6.5, 8.5], stand: [-8.5, 4.6], face: [-11, 8.5], hit: [-17, 0, 5.5, 11, 5, 6.5], shot: { side: 32, dist: 21 }, focusY: 2.6 },
    { id: 'migration', marker: [-8, 12, -7], stand: [-6, -1.5], face: [-9, -8], hit: [-19, 0, -16, 18, 11, 12], shot: { side: -30, dist: 26, el: 26 }, focusY: 4 },
    { id: 'mdo', marker: [8, 15.2, -7], stand: [4.6, -6], face: [8, -7], hit: [6, 0, -9, 4, 14, 4], shot: { side: -40, dist: 20, el: 14 }, focusY: 6.5 },
  );
  ctx.ports.east = [20.5, 4.5];
  ctx.spawn = [16, 4.5];

  ctx.beats = [
    { id: 'establish', len: 1.2, cam: { subject: [0, 4, -2], az: 62, el: 30, dist: 50, fov: 38 }, char: [[17, 4.5]] },
    { id: 'cost-insight', len: 1.0, exhibit: 'cost-insight', char: [[11.5, 4.6]] },
    { id: 'qa', len: 1.0, exhibit: 'qa', char: [[-0.5, 4.6]] },
    { id: 'gl-recon', len: 1.1, exhibit: 'gl-recon', char: [[-8.5, 4.6]] },
    { id: 'migration', len: 1.1, exhibit: 'migration', char: [[-11.5, 4.5], [-11.5, -1.5], [-6, -1.5]] },
    { id: 'mdo', len: 1.1, exhibit: 'mdo', char: [[3.5, -1.5], [3.5, -6], [4.6, -6]] },
    { id: 'station', len: 0.9, cam: { subject: [2.5, 3, -15], az: 160, el: 24, dist: 22, fov: 38 }, char: [[3.5, -12], [2.5, -15.5]] },
  ];

  // machine state
  let clockT = 0, gaugeT = 0;
  ctx.onOpen = (id) => { if (id === 'mdo') clockT = 0.001; if (id === 'cost-insight') gaugeT = 0.001; };
  ctx.update = (time, dt, w) => {
    const m = w.reduced ? 0 : Math.floor(time * FPS.machine);
    // belt: each tile advances one stud per machine frame, from a hopper to the silo
    for (let i = 0; i < N; i++) {
      const x = -16 + ((m + Math.round((i * 17) / N)) % 17);
      const y = beltY * PLATE + PLATE;
      dummy.position.set(x + 0.5, y, 8.5);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      tiles.setMatrixAt(i, dummy.matrix);
    }
    tiles.instanceMatrix.needsUpdate = true;
    // smoke: puffs rise and shrink on sixes
    const l = Math.floor(time * FPS.life);
    for (let i = 0; i < 10; i++) {
      const ph = ((l + i * 3) % 15) / 15;
      const cx = i % 2 ? 12 : 15;
      dummy.position.set(cx + Math.sin(i * 7) * 0.3 * ph, (29 * PLATE) + ph * 7, -2 + Math.cos(i * 3) * 0.3 * ph);
      dummy.scale.setScalar(w.reduced ? 0 : 0.6 + ph * 0.9);
      dummy.rotation.y = i;
      dummy.updateMatrix(); puffs.setMatrixAt(i, dummy.matrix);
    }
    puffs.instanceMatrix.needsUpdate = true;
    // crane: swing between the old depot (west) and the new one (north), held frames
    const cyc = (m % 64) / 64;
    const sw = cyc < 0.35 ? cyc / 0.35 : cyc < 0.5 ? 1 : cyc < 0.85 ? 1 - (cyc - 0.5) / 0.35 : 0;
    cranePivot.rotation.y = w.reduced ? 1.45 : 1.45 + sw * 1.35;
    const drop = cyc > 0.38 && cyc < 0.48 ? 1 : cyc > 0.88 ? 1 : 0;
    cable.scale.y = 2.4 + drop * 1.6; cable.position.y = -(2.4 + drop * 1.6) / 2;
    hookCrate.position.set(-1, -(2.4 + drop * 1.6) - 2, -1);
    // clock: idles at 2 h; after opening, sweeps to the 10-minute mark in steps
    if (clockT > 0) clockT = Math.min(1, clockT + dt * 0.6);
    const ang = -(Math.floor(clockT * 12) / 12) * Math.PI * 1.17;
    for (const h of hands) h.children[0].parent.rotation.z = ang;
    if (gaugeT > 0) gaugeT = Math.min(1, gaugeT + dt * 0.7);
    needle.rotation.z = -0.6 + (Math.floor(gaugeT * 8) / 8) * 1.25 + (w.reduced ? 0 : (m % 3 === 0 ? 0.02 : 0));
  };
  ctx.stats = stats;
  return group;
}

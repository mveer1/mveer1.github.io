// The Signal Lab: AI systems.
//   Context Tower       one plate layer per context layer; lights bottom to top when opened
//   Skill Switchboard   AIDLC: a cabinet of skill drawers that slide out one at a time
//   Telescope           Smart Research Scout, in the observatory dome
//   Analysis Bench      Small Data: a bench with a tiny bar chart
// Also owns the cable car from the Works.
import * as THREE from 'three';
import { BrickBuilder } from '../../lego/builder.js';
import { PLATE } from '../../lego/dims.js';
import { part, toBufferGeometry } from '../../lego/parts.js';
import { buildTerrain, scatter } from '../terrain.js';
import { lamppost, crate, pine, leafyTree, fence, reserve, printedTile, M4 } from '../props.js';
import { solid } from '../../lego/materials.js';
import { FPS } from '../../core/stepped.js';
import { PULLBACK } from '../world.js';

export function build(ctx) {
  const b = new BrickBuilder({ seed: 51 });
  const onPath = (x, z) =>
    (x >= -4 && x <= -3 && z >= -1 && z <= 13) ||
    (z >= -1 && z <= 0 && x >= -10 && x <= 16) ||
    (x >= 7 && x <= 8 && z >= -1 && z <= 8);
  const t = buildTerrain(b, {
    seed: 61,
    blobs: [{ x: 0, z: 0, rx: 15, rz: 12.5 }, { x: -3, z: 12, rx: 6, rz: 4 }, { x: 9, z: -5, rx: 7.5, rz: 7 }, { x: -9, z: -6, rx: 7, rz: 6 }],
    edge: 1.8, depth: 14, taper: 1.0, roots: 12,
    grass: (x, z, v) => (v > 0.62 ? 'sandGreen' : v < 0.28 ? 'darkGreen' : 'green'),
    path: onPath,
    pathColor: (x, z) => ((x + z) % 4 === 0 ? 'lightGray' : 'white'),
    strata: [['lightGray', 'white'], ['lightGray', 'darkGray'], ['darkGray', 'sandBlue'], ['darkGray', 'black']],
    moss: 'sandGreen',
  });
  for (const k of t.cells) ctx.cells.add(k);

  // ---------------------------------------------------------- observatory dome (Research Scout)
  const oc = { x: -6, z: -7 }, R = 4.6;
  for (let c = 0; c < 3; c++) for (let x = -11; x <= -1; x++) for (let z = -12; z <= -2; z++) {
    const d = Math.hypot(x + 0.5 - oc.x, z + 0.5 - oc.z);
    if (d > R || d < R - 1.2) continue;
    const door = c < 2 && z >= -3 && x >= -7 && x <= -6;
    if (door) continue;
    const win = c === 1 && (Math.abs(x + 0.5 - oc.x) < 1 || Math.abs(z + 0.5 - oc.z) < 1) && !(z > oc.z);
    b.brick(x, c * 3, z, 1, 1, 3, win ? 'transBlue' : c === 2 ? 'sandBlue' : 'white', { studs: false });
  }
  b.put('tile', [2, 1, 6], -7, 0, -3, 'glowCyan', { occ: false });
  // dome: rings that shrink, with a slot facing north-east
  for (let k = 0; k < 5; k++) {
    const r = R - 0.2 - k * 0.95;
    for (let x = -11; x <= -1; x++) for (let z = -12; z <= -2; z++) {
      const dx = x + 0.5 - oc.x, dz = z + 0.5 - oc.z, d = Math.hypot(dx, dz);
      if (d > r || d < r - 1.3) continue;
      const slot = Math.abs(dx - dz * -1) < 1.4 && dx > 0 && dz < 0 && k > 0;
      if (slot) continue;
      b.brick(x, 9 + k * 2, z, 1, 1, 2, k % 2 ? 'lightGray' : 'white', { studs: k === 4 });
    }
  }
  b.round(oc.x - 0.5, 19, oc.z - 0.5, 1, 3, 'white');
  reserve(ctx, -11, -12, 10, 10);
  // telescope tube through the slot
  const tube = new THREE.Group();
  tube.position.set(oc.x + 0.5, 4.4, oc.z + 0.5);
  const tubeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 6.5, 18), solid(0x0a3463));
  tubeMesh.position.y = 3.2; tubeMesh.castShadow = true; tube.add(tubeMesh);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 18), solid(0xaa7f2e, { metalness: 0.8 })); lens.position.y = 6.4; tube.add(lens);
  tube.rotation.set(-0.75, 0.78, 0); // aims out of the slot, north-east, toward the sky

  // ---------------------------------------------------------- context tower: four layers
  const cx0 = 3, cz0 = -7;
  const layers = [['sandBlue', 'azure'], ['white', 'transBlue'], ['lightGray', 'darkAzure'], ['yellow', 'black']];
  const glows = [];
  for (let L = 0; L < 4; L++) {
    const y = L * 6;
    for (const [x, z] of [[cx0, cz0], [cx0 + 4, cz0], [cx0, cz0 + 4], [cx0 + 4, cz0 + 4]]) b.round(x, y, z, 1, 3, 'darkGray', { studs: false });
    for (const [x, z] of [[cx0, cz0], [cx0 + 4, cz0], [cx0, cz0 + 4], [cx0 + 4, cz0 + 4]]) b.round(x, y + 3, z, 1, 1, 'darkGray', { studs: false });
    b.plate(cx0, y + 4, cz0, 5, 5, layers[L][0]);
    b.plate(cx0 + 1, y + 5, cz0 + 1, 3, 3, layers[L][1]);
    glows.push({ L, y: (y + 4) * PLATE });
  }
  b.cone(cx0 + 2, 24, cz0 + 2, 'pearlGold');
  reserve(ctx, cx0, cz0, 5, 5);
  // glow strips per layer (separate meshes so they can light in sequence)
  const stripGeo = new THREE.BoxGeometry(5.1, 0.12, 5.1);
  const strips = glows.map(({ y }) => {
    const m = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4fd8e8).multiplyScalar(0.25) }));
    m.position.set(cx0 + 2.5, y - 0.04, cz0 + 2.5);
    return m;
  });

  // ---------------------------------------------------------- skill switchboard (AIDLC)
  const sx = 9, sz = -2;
  b.brick(sx, 0, sz - 3, 6, 2, 3, 'darkGray', { studs: false });
  for (let c = 1; c < 4; c++) b.brick(sx, c * 3, sz - 3, 6, 1, 3, 'lightGray', { studs: false });
  b.plate(sx, 12, sz - 3, 6, 2, 'sandBlue');
  b.tile(sx, 13, sz - 3, 6, 2, 'white');
  reserve(ctx, sx, sz - 3, 6, 2);
  const drawers = new THREE.Group();
  const drawerCols = ['red', 'blue', 'yellow', 'green', 'orange', 'azure', 'white', 'sandBlue', 'darkTan', 'lime', 'darkOrange', 'tan'];
  const drawerMeshes = [];
  for (let i = 0; i < 12; i++) {
    const c = i % 3, r = Math.floor(i / 3);
    const g = toBufferGeometry(part('brick', 2, 1, 3).geo);
    const m = new THREE.Mesh(g, solid(new THREE.Color(drawerColHex(drawerCols[i])).getHex()));
    m.position.set(sx + c * 2, (3 + r * 2.25) * PLATE * 1.0 + 0.0, sz - 2.02);
    m.scale.set(0.96, 0.62, 0.3);
    m.castShadow = true;
    drawers.add(m); drawerMeshes.push({ m, z0: m.position.z });
  }
  // patch cables from the switchboard to the context tower
  const cableMat = solid(0x1b2a34, { roughness: 0.6, clearcoat: 0 });
  for (const [k, colr] of [[0, 0xc91a09], [1, 0x0055bf], [2, 0xf2cd37]]) {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(sx + 1 + k * 2, 5.4, sz - 3.1), new THREE.Vector3(sx - 0.5 + k, 2.2, sz - 4.5), new THREE.Vector3(cx0 + 4.5, 1.0 + k * 1.6, cz0 + 4.2)]);
    const tm = new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.09, 6), solid(colr, { roughness: 0.5 }));
    tm.castShadow = true; drawers.add(tm);
  }

  // ---------------------------------------------------------- analysis bench (Small Data)
  const bx = 9, bz = 4;
  for (const [x, z] of [[bx, bz], [bx + 3, bz], [bx, bz + 1], [bx + 3, bz + 1]]) b.round(x, 0, z, 1, 3, 'brown', { studs: false });
  b.plate(bx, 3, bz, 4, 2, 'darkTan');
  b.tile(bx, 4, bz, 4, 2, 'tan', { studs: false });
  [[1, 'blue'], [3, 'azure'], [2, 'blue'], [5, 'orange']].forEach(([h, c], i) => { for (let k = 0; k < h; k++) b.brick(bx + i, 4 + k, bz, 1, 1, 1, c, { studs: k === h - 1, occ: true, lift: PLATE * 0 }); });
  b.round(bx + 2, 4, bz + 1, 1, 1, 'transClear');
  reserve(ctx, bx, bz, 4, 2);

  // ---------------------------------------------------------- radio mast with a cyan blink
  for (let k = 0; k < 10; k++) b.round(13, k * 3, -9, 1, 3, k % 3 === 2 ? 'white' : 'lightGray', { studs: false });
  b.free('dish', [3], M4(12, 30 * PLATE + 0.2, -10.5, 0, 0.5, 0), 'white');
  b.round(13, 30, -9, 1, 1, 'darkGray');
  reserve(ctx, 13, -9, 1, 1);
  const blink = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4fd8e8).multiplyScalar(3) }));
  blink.position.set(13.5, 31 * PLATE + 0.4, -8.5);

  // ---------------------------------------------------------- station (south nub) and details
  b.fillPlates(-7, 0, 11, 6, 4, 'lightGray', { tile: true });
  for (let x = -7; x < -1; x++) for (let z = 11; z < 15; z++) { ctx.cells.add(x + ',' + z); ctx.heights.set(x + ',' + z, PLATE); }
  for (let k = 0; k < 7; k++) { b.brick(-7, k * 3, 14, 1, 1, 3, k % 2 ? 'white' : 'sandBlue', { studs: k === 6 }); b.brick(-2, k * 3, 14, 1, 1, 3, k % 2 ? 'white' : 'sandBlue', { studs: k === 6 }); }
  b.brick(-7, 21, 14, 6, 1, 3, 'sandBlue');
  reserve(ctx, -7, 14, 1, 1); reserve(ctx, -2, 14, 1, 1);
  ctx.ports.station = [-4.5, 12.5];
  ctx.ports.cableTop = [-4, 14.5, 25 * PLATE];
  lamppost(b, ctx, -2, 0, 3, { post: 'white', glow: 'glowCyan', power: 0.5 });
  lamppost(b, ctx, 14, 0, 1, { post: 'white', glow: 'glowCyan', power: 0.4 });
  lamppost(b, ctx, -9, 0, 1, { post: 'white', power: 0.7 });
  pine(b, ctx, -12, 0, 3, { layers: 4, color: 'darkGreen' });
  leafyTree(b, ctx, 3, 0, 6, { color: 'sandGreen', alt: 'green', h: 3 });
  crate(b, ctx, 12, 0, 6, { size: 2, h: 3, color: 'white', top: 'azure' });
  fence(b, ctx, -1, 0, 9, 6, 'x', { color: 'white' });
  ctx.collectibles.push({ id: 'piece-lab', local: [-1.5, 0.2, -9.5] });

  scatter(b, t, ctx.reserved, 9, { flowers: 18, rocks: 14 });
  const { group, stats } = b.build();
  ctx.occ = b.occ;
  ctx.camOcc = b.camOcc;
  group.add(tube, drawers, blink, ...strips);
  const sign = printedTile('SIGNAL LAB', 3.8, 0.8, { bg: '#f2f3f2', ink: '#0a3463', font: '800 66px "Bricolage Grotesque", Georgia, serif' });
  sign.position.set(-5.5, 2.4, 9.1); group.add(sign);

  // ---------------------------------------------------------- exhibits
  ctx.exhibits.push(
    { id: 'context', marker: [cx0 + 2.5, 11.2, cz0 + 2.5], stand: [cx0 + 1, 0.6], face: [cx0 + 2.5, cz0 + 4], hit: [cx0, 0, cz0, 5, 10, 5], shot: { side: 35, dist: 21, el: 16 }, focusY: 5 },
    { id: 'aidlc', marker: [sx + 3, 7.2, sz - 2], stand: [sx + 1.5, -0.4], face: [sx + 3, sz - 2], hit: [sx, 0, sz - 3, 6, 6, 2], shot: { side: 40, dist: 15 }, focusY: 3 },
    { id: 'scout', marker: [oc.x, 10.6, oc.z + 3.2], stand: [oc.x - 1.5, -0.5], face: [oc.x, oc.z + 3.5], hit: [-11, 0, -12, 10, 10, 10], shot: { side: -35, dist: 22, el: 22 }, focusY: 5 },
    { id: 'small-data', marker: [bx + 2, 4.8, bz + 1], stand: [7.5, 3.6], face: [bx + 2, bz + 1], hit: [bx, 0, bz, 4, 3.5, 2], shot: { side: 40, dist: 12, el: 24 }, focusY: 2 },
  );
  ctx.ports.east = [15.6, -0.5];
  ctx.spawn = [-3.5, 8];

  ctx.beats = [
    { id: 'establish', len: 1.0, cam: { subject: [0, 5, -3], az: 200, el: 24, dist: 42, fov: 38 }, char: [[-3.5, 9]] },
    { id: 'scout', len: 1.0, exhibit: 'scout', char: [[-3.5, -0.5], [oc.x - 1.5, -0.5]] },
    { id: 'context', len: 1.1, exhibit: 'context', char: [[cx0 + 1, 0.6]] },
    { id: 'aidlc', len: 1.0, exhibit: 'aidlc', char: [[sx + 1.5, -0.4]] },
    { id: 'small-data', len: 1.0, exhibit: 'small-data', char: [[7.5, -0.5], [7.5, 3.6]] },
    { id: 'exit', len: 0.8, cam: { subject: [15, 3, -0.5], az: -70, el: 22, dist: 22, fov: 38 }, char: [[7.5, -0.5], [15, -0.5]] },
  ];

  // ---------------------------------------------------------- cable car from the Works
  const car = cableCar();
  const world = ctx.world;
  let line = null, rideBeat = null;
  const setupCable = () => {
    const works = world.islands.get('works');
    if (!works || line) return;
    const wTop = new THREE.Vector3(works.ctx.ports.cableTop[0], works.ctx.ports.cableTop[2], works.ctx.ports.cableTop[1]).add(works.origin);
    const lTop = new THREE.Vector3(ctx.ports.cableTop[0], ctx.ports.cableTop[2], ctx.ports.cableTop[1]).add(ctx.origin);
    const wSt = new THREE.Vector3(works.ctx.ports.station[0], PLATE, works.ctx.ports.station[1]).add(works.origin);
    const lSt = new THREE.Vector3(ctx.ports.station[0], PLATE, ctx.ports.station[1]).add(ctx.origin);
    line = { wTop, lTop, wSt, lSt };
    const cableMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(wTop, lTop), 8, 0.08, 6), solid(0x1b2a34));
    world.scene.add(cableMesh, car.group);
    car.place(wSt);
    world.transports = world.transports || [];
    world.transports.push({
      id: 'cable', label: 'Ride the cable car', mapLine: [wSt, lSt],
      near: (p) => p.distanceTo(wSt) < 3 || p.distanceTo(lSt) < 3,
      start: (app) => {
        const up = app.ctrl.pos.distanceTo(wSt) < 3;
        app.startRide({ from: up ? wSt : lSt, to: up ? lSt : wSt, dur: 4.5, car, exit: up ? lSt.clone().add(new THREE.Vector3(0, 0, -4)) : wSt.clone().add(new THREE.Vector3(0, 0, 4)) });
      },
    });
  };
  ctx.travelFrom = (w) => {
    setupCable();
    if (!line) return null;
    const subject = new THREE.Vector3().lerpVectors(line.wSt, line.lSt, 0.55).add(new THREE.Vector3(0, 4, 0));
    const shot = w.frame('lab', { subject, az: -1.9, el: 0.2, dist: 30 * PULLBACK, fov: 38 });
    rideBeat = 'works>lab';
    return [{ id: rideBeat, island: 'works', len: 1.6, shot, path: [line.wSt.clone(), line.lSt.clone()], face: null, travel: true, ride: 'cable' }];
  };

  let layerT = 0, drawerT = 0;
  ctx.onOpen = (id) => { if (id === 'context') layerT = 0.001; if (id === 'aidlc') drawerT = 0.001; };
  ctx.update = (time, dt, w) => {
    const m = Math.floor(time * FPS.machine), l = Math.floor(time * FPS.life);
    blink.visible = w.reduced || l % 6 < 2;
    // layers light bottom to top, then stay lit
    if (layerT > 0) layerT = Math.min(1, layerT + dt * 0.5);
    strips.forEach((s, i) => s.material.color.setRGB(...(Math.floor(layerT * 5) > i ? [0.31 * 3, 0.85 * 3, 0.91 * 3] : [0.08, 0.21, 0.23])));
    if (drawerT > 0) drawerT = Math.min(1, drawerT + dt * 0.35);
    drawerMeshes.forEach((d, i) => {
      const k = Math.floor(drawerT * 14);
      const out = k > i ? (k < 13 ? 0.5 : 0.18) : 0;
      d.m.position.z = d.z0 + out;
    });
    // cable car: in the tour, its position comes from scroll progress
    if (line && w.mode === 'journey' && !w.app.riding) {
      const rb = w.app.world.journey.find(rideBeat);
      if (rb) {
        const k = Math.min(1, Math.max(0, (w.journeyS - rb.s0) / (rb.len * 0.6)));
        const kk = w.reduced ? Math.round(k) : Math.floor(k * 24) / 24;
        car.place(new THREE.Vector3().lerpVectors(line.wSt, line.lSt, kk));
      }
    }
  };
  ctx.stats = stats;
  setupCable();
  return group;
}

function drawerColHex(name) {
  const map = { red: 0xc91a09, blue: 0x0055bf, yellow: 0xf2cd37, green: 0x237841, orange: 0xfe8a18, azure: 0x36aebf, white: 0xf2f3f2, sandBlue: 0x6074a1, darkTan: 0x958a73, lime: 0xbbe90b, darkOrange: 0xa95500, tan: 0xe4cd9e };
  return map[name];
}

/** The cable car cabin: floor at the group origin, hanger up to the cable. */
function cableCar() {
  const b = new BrickBuilder({ seed: 81 });
  b.plate(-2, 0, -2, 4, 4, 'darkGray');
  for (const [x, z] of [[-2, -2], [1, -2], [-2, 1], [1, 1]]) for (let k = 0; k < 3; k++) b.round(x, 1 + k * 3, z, 1, 3, 'white', { studs: false });
  b.brick(-1, 1, -2, 2, 1, 2, 'red'); b.brick(-1, 1, 1, 2, 1, 2, 'red');
  b.brick(-2, 1, -1, 1, 2, 2, 'red'); b.brick(1, 1, -1, 1, 2, 2, 'red');
  b.plate(-2, 10, -2, 4, 4, 'red');
  b.slope(-2, 11, -2, 4, 2, 3, 'white', 2, 1); b.slope(-2, 11, 0, 4, 2, 3, 'white', 0, 1);
  b.round(-1, 14, -1, 1, 3, 'black');
  const { group } = b.build();
  const hanger = new THREE.Group();
  hanger.add(group);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 4.6, 8), solid(0x1b2a34));
  arm.position.set(-0.5, 17 * PLATE + 2.3, -0.5); arm.castShadow = true; hanger.add(arm);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.12, 6, 14), solid(0xaa7f2e, { metalness: 0.8 }));
  wheel.position.set(-0.5, 17 * PLATE + 4.6, -0.5); hanger.add(wheel);
  return {
    group: hanger,
    place(p) { hanger.position.copy(p).add(new THREE.Vector3(0, -PLATE * 0.95, 0)); },
  };
}

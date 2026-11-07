// The Harbour: arrival dock, the assembling gate, signpost (about) and noticeboard (results).
import * as THREE from 'three';
import { BrickBuilder } from '../../lego/builder.js';
import { PLATE } from '../../lego/dims.js';
import { Assembly } from '../../lego/assembly.js';
import { buildTerrain, scatter } from '../terrain.js';
import { house, lamppost, lantern, pine, leafyTree, crate, barrel, fence, reserve, printedTile, M4 } from '../props.js';
import { FPS } from '../../core/stepped.js';
import { createBeam } from '../beacon.js';

export const HARBOUR = { id: 'harbour', origin: new THREE.Vector3(0, 0, 0) };

export function build(ctx) {
  const b = new BrickBuilder({ seed: 11 });
  const inPath = (x, z) =>
    (x >= -1 && x <= 0 && z >= -3 && z <= 11) ||
    (z >= -6 && z <= -5 && x >= -17 && x <= -1) ||
    (Math.hypot(x + 0.5, z + 5) < 3.9);
  const plaza = (x, z) => Math.hypot(x + 0.5, z + 5) < 3.9;
  const t = buildTerrain(b, {
    seed: 21,
    blobs: [{ x: 0, z: 0, rx: 13, rz: 11.5 }, { x: -8, z: -5, rx: 9.5, rz: 6.5 }, { x: 6, z: 5, rx: 7, rz: 6 }, { x: 2, z: -9, rx: 9, rz: 5 }],
    edge: 2.0, depth: 13, taper: 1.05, roots: 14, moss: 'darkGreen',
    path: inPath,
    pathColor: (x, z) => (plaza(x, z) ? ((x + z) % 3 ? 'lightGray' : 'tan') : (z > 6 ? 'darkTan' : 'tan')),
    strata: [['darkTan', 'tan'], ['darkTan', 'brown'], ['darkTan', 'darkGray'], ['darkGray', 'lightGray'], ['darkGray', 'black']],
  });
  for (const k of t.cells) ctx.cells.add(k);

  // --- dock: planks on posts, continuing the path south
  for (let z = 10; z <= 23; z++) {
    for (let x = -2; x <= 1; x++) ctx.cells.add(x + ',' + z);
    if (!t.cells.has('-2,' + z) || z > 12) b.tile(-2, -1, z, 4, 1, z % 3 === 0 ? 'darkBrown' : 'brown', { occ: true });
  }
  for (const z of [12, 16, 20, 23]) for (const x of [-3, 2]) {
    for (let k = 0; k < 6; k++) b.round(x, -1 - k * 3 + 0, z, 1, 3, 'darkBrown', { studs: k === 0 });
  }
  for (const x of [-3, 2]) b.plate(x, 2, 12, 1, 12, 'brown', { occ: false });
  for (const z of [12, 16, 20]) for (const x of [-3, 2]) b.round(x, 2 + 0, z, 1, 1, 'darkBrown', { occ: false, lift: 0.4 });
  lantern(b, ctx, -3, 3, 23, { power: 0.8 });
  lantern(b, ctx, 2, 3, 23, { power: 0.5, light: false });
  for (let z = 12; z <= 23; z++) { ctx.blocked.add('-3,' + z); ctx.blocked.add('2,' + z); }
  ctx.cells.add('-3,23'); ctx.cells.add('2,23');
  crate(b, ctx, -2, 0, 21, { size: 1, h: 3, color: 'darkBrown' });

  // --- harbourmaster's hut
  house(b, ctx, 4, 0, -13, {
    w: 7, d: 6, courses: 4, wall: (c, p) => ((c + p) % 4 === 0 ? 'darkTan' : 'tan'), trim: 'white', floor: 'darkTan',
    windows: [{ side: 's', at: 0 }, { side: 's', at: 5 }, { side: 'w', at: 1 }], door: { side: 's', at: 2, w: 2 },
    roof: { color: 'sandGreen', kind: 'gable', axis: 'x', ridge: 'darkGreen', gable: 'tan' },
  });
  b.brick(12, 0, -12, 2, 2, 3, 'darkTan'); b.brick(12, 3, -12, 2, 2, 3, 'tan'); // chimney base
  for (let k = 0; k < 4; k++) b.brick(9, 12 + k * 3, -12, 2, 2, 3, k % 2 ? 'darkGray' : 'lightGray', { occ: true });
  reserve(ctx, 12, -12, 2, 2);
  barrel(b, ctx, 11, 0, -6);
  crate(b, ctx, 11, 0, -9, { size: 2, h: 6 });
  crate(b, ctx, 12, 6, -9, { size: 1, h: 3, color: 'darkBrown' });

  // --- lamps and trees
  lamppost(b, ctx, -2, 0, 9);
  lamppost(b, ctx, 1, 0, 9, { light: false });
  lamppost(b, ctx, 3, 0, -7, { power: 0.9 });
  lamppost(b, ctx, -9, 0, -7, { power: 0.8 });
  pine(b, ctx, -9, 0, -11, { layers: 5, size: 2.6 });
  pine(b, ctx, -12, 0, -2, { layers: 4, size: 2.1 });
  pine(b, ctx, -4, 0, -11, { layers: 3, size: 1.8 });
  leafyTree(b, ctx, 8, 0, 3, { h: 3 });
  leafyTree(b, ctx, -7, 0, 6, { h: 4, color: 'darkGreen', alt: 'green' });
  fence(b, ctx, 6, 0, 8, 6, 'x');
  fence(b, ctx, -9, 0, 1, 5, 'x');

  // --- signpost (about): nameplate on top, arms pointing to the islands
  const sx = -3, sz = 1;
  for (let k = 0; k < 6; k++) b.round(sx, k * 3, sz, 1, 3, 'brown', { studs: k === 5 });
  reserve(ctx, sx, sz, 1, 1);
  const signGroup = new THREE.Group();
  const arms = [['WORKS', -46, -20], ['LAB', -40, -70], ['WORKSHOP', 8, -80], ['ARCHIVE', 48, -52], ['LOOKOUT', 44, -10]];
  arms.forEach(([label, wx, wz], i) => {
    const ang = Math.atan2(-(wz - (sz + 0.5)), wx - (sx + 0.5));
    const arm = new THREE.Group();
    arm.position.set(sx + 0.5, 3.1 + i * 0.62, sz + 0.5);
    arm.rotation.y = ang;
    const board = printedTile(label, 3.0, 0.5, { bg: '#e4cd9e', font: '700 54px "DM Mono", monospace', border: false });
    board.position.set(1.7, 0, 0.09); arm.add(board);
    const back = board.clone(); back.rotation.y = Math.PI; back.position.z = -0.09; arm.add(back);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.52, 0.16), new THREE.MeshStandardMaterial({ color: 0x582a12, roughness: 0.5 }));
    slab.position.set(1.7, 0, 0); slab.castShadow = true; arm.add(slab);
    signGroup.add(arm);
  });
  const name = printedTile('MAHAVIR', 2.6, 0.7, { bg: '#f2f3f2', ink: '#17202b', font: '800 64px "Bricolage Grotesque", Georgia, serif' });
  name.position.set(sx + 0.5, 6.9, sz + 0.55 + 0.42); signGroup.add(name);
  const nameBack = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x17202b, roughness: 0.4 }));
  nameBack.position.set(sx + 0.5, 6.9, sz + 0.5); nameBack.castShadow = true; signGroup.add(nameBack);

  // --- noticeboard (results)
  const nbx = 2, nbz = -2;
  for (const x of [nbx, nbx + 4]) for (let k = 0; k < 4; k++) b.round(x, k * 3, nbz, 1, 3, 'brown', { studs: k === 3 });
  b.brick(nbx, 12, nbz, 5, 1, 1, 'brown');
  b.slope(nbx - 1, 13, nbz - 1, 7, 2, 3, 'darkRed', 0, 1, { occ: false });
  reserve(ctx, nbx, nbz, 5, 1);
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.6, 0.24), new THREE.MeshStandardMaterial({ color: 0x352100, roughness: 0.7 }));
  board.position.set(nbx + 2.5, 3.5, nbz + 0.5); board.castShadow = true; board.receiveShadow = true;
  signGroup.add(board);
  [['1B+', '#f2f3f2'], ['92%', '#f2cd37'], ['$1.25M', '#f2f3f2'], ['400+', '#e4cd9e']].forEach(([txt, bg], i) => {
    const note = printedTile(txt, 1.6, 0.95, { bg, font: '700 76px "DM Mono", monospace', border: false });
    note.position.set(nbx + 2.5 + (i % 2 ? 0.9 : -0.9), 3.5 + (i < 2 ? 0.6 : -0.6), nbz + 0.64);
    note.rotation.z = (i % 2 ? 1 : -1) * 0.04 * (i + 1);
    signGroup.add(note);
  });

  // --- the gate, assembled from a pile as the figure walks through
  const gate = [];
  const pillar = (x0) => {
    for (let c = 0; c < 3; c++) {
      if (c % 2 === 0) { gate.push({ type: 'brick', args: [1, 2, 3], x: x0, y: c * 3, z: 4, color: 'darkTan' }); gate.push({ type: 'brick', args: [1, 2, 3], x: x0 + 1, y: c * 3, z: 4, color: 'tan' }); }
      else { gate.push({ type: 'brick', args: [2, 1, 3], x: x0, y: c * 3, z: 4, color: 'tan' }); gate.push({ type: 'brick', args: [2, 1, 3], x: x0, y: c * 3, z: 5, color: 'darkTan' }); }
    }
  };
  pillar(-3); pillar(1);
  gate.push({ type: 'brick', args: [4, 2, 3], x: -3, y: 9, z: 4, color: 'darkRed' });
  gate.push({ type: 'brick', args: [2, 2, 3], x: 1, y: 9, z: 4, color: 'darkRed' });
  gate.push({ type: 'brick', args: [2, 2, 3], x: -3, y: 12, z: 4, color: 'darkTan' });
  gate.push({ type: 'brick', args: [4, 2, 3], x: -1, y: 12, z: 4, color: 'tan' });
  gate.push({ type: 'slope', args: [2, 2, 3, 1], x: -3, y: 15, z: 4, color: 'sandGreen', rot: 3 });
  gate.push({ type: 'tile', args: [2, 2, 1], x: -1, y: 15, z: 4, color: 'darkGreen' });
  gate.push({ type: 'slope', args: [2, 2, 3, 1], x: 1, y: 15, z: 4, color: 'sandGreen', rot: 1 });
  gate.push({ type: 'round', args: [1, 3], x: -1, y: 16, z: 4, color: 'glowAmber' });
  gate.push({ type: 'round', args: [1, 3], x: 0, y: 16, z: 5, color: 'glowAmber' });
  const assembly = new Assembly(gate, { x: 3, z: 6, w: 4, d: 3 }, 5, b.occ);
  reserve(ctx, -3, 4, 2, 2); reserve(ctx, 1, 4, 2, 2);
  ctx.lights.push({ x: -0.5, y: 7.6, z: 5, color: 0xffa64d, power: 0.6 });

  // --- the skiff moored at the dock end
  const sb = new BrickBuilder({ seed: 71 });
  sb.brick(0, 0, 1, 4, 6, 1, 'brown');
  sb.slope(0, 0, 7, 4, 1, 3, 'brown', 0, 0, { occ: false });
  sb.slope(0, 0, -0, 4, 1, 3, 'brown', 2, 0, { occ: false });
  for (const x of [0, 3]) sb.brick(x, 1, 1, 1, 6, 3, 'darkBrown');
  sb.brick(0, -2, 2, 4, 4, 2, 'darkTan', { studs: false });
  sb.tile(1, 1, 2, 2, 2, 'tan');
  for (let k = 0; k < 7; k++) sb.round(1, 1 + k * 3, 5, 1, 3, 'darkBrown', { studs: k === 6 });
  sb.round(1, 22, 5, 1, 3, 'glowAmber');
  sb.slope(2, 18, 5, 2, 1, 3, 'red', 1, 0);
  const { group: skiff } = sb.build();
  const skiffPivot = new THREE.Group();
  skiffPivot.position.set(3.4, -0.9, 16.5);
  skiffPivot.add(skiff);

  // --- collectible piece behind the hut
  ctx.collectibles.push({ id: 'piece-harbour', local: [3.5, 0.2, -13.5], color: 'lime' });

  // --- the reward: a brick model of the islands, assembled when every beacon is shut down
  const model = [{ type: 'brick', args: [4, 6, 1], x: 7, y: 0, z: -4, color: 'darkTan' }];
  const spots = [['green', 0, 4], ['darkGray', -1, 2], ['sandGreen', -1, 0], ['brown', 1, 0], ['tan', 1, 2], ['red', 1, 4], ['black', 0, 2]];
  for (const [c, dx, dz] of spots) {
    model.push({ type: 'brick', args: [1, 1, 3], x: 8 + dx, y: 1, z: -4 + dz, color: 'darkGray' });
    model.push({ type: 'brick', args: [1, 1, 1], x: 8 + dx, y: 4, z: -4 + dz, color: c });
  }
  model.push({ type: 'round', args: [1, 3], x: 9, y: 5, z: 0, color: 'red' });
  const reward = new Assembly(model, { x: 7, z: -4, w: 4, d: 6 }, 9);
  reserve(ctx, 7, -4, 4, 6);
  reward.items.forEach((it) => { it.pilePos.y += 14; });
  reward.group.visible = false;
  let rewardT = -1;
  // a green beam rises from the finished model, so the reward can be found from anywhere
  const win = createBeam({ color: 'green' });
  win.group.position.set(9.5, 4.6, -1); win.level = win.target = 0;
  ctx.onPieces = (n, total) => { if (n >= total && rewardT < 0) { reward.group.visible = true; rewardT = 0; win.target = 1; } };

  scatter(b, t, ctx.reserved, 3, { flowers: 36, rocks: 10 });
  const { group, stats } = b.build();
  ctx.occ = b.occ;
  ctx.camOcc = b.camOcc;
  group.add(signGroup, assembly.group, skiffPivot, reward.group, win.group);

  // --- exhibits
  ctx.exhibits.push(
    { id: 'about', marker: [sx + 0.5, 8.6, sz + 0.5], stand: [-1.4, 1.6], face: [sx + 0.5, sz + 0.5], hit: [sx - 1, 0, sz - 1, 4, 8, 3],
      shot: { side: -45 }, focusY: 4 },
    { id: 'results', marker: [nbx + 2.5, 7.4, nbz + 0.5], stand: [nbx + 0.6, nbz + 2.4], face: [nbx + 2.5, nbz], hit: [nbx, 0, nbz - 1, 5, 7, 3],
      shot: { side: 38 }, focusY: 3.6 },
  );
  ctx.ports.west = [-16.5, -5.5];

  // --- journey beats (local coordinates)
  ctx.beats = [
    { id: 'title', len: 1.4, cam: { pos: [92, 50, 64], look: [-16, -6, -44], fov: 38 }, char: [[-0.5, 21.5]], hold: true, title: true },
    { id: 'arrive', len: 1.0, cam: { subject: [-0.5, 2.5, 12], az: -24, el: 22, dist: 31, fov: 36, also: [[-0.5, 3, 21.5]] }, char: [[-0.5, 21.5]] },
    { id: 'gate', len: 1.3, cam: { subject: [-0.5, 3.4, 6], az: -38, el: 21, dist: 24, fov: 36, also: [[-0.5, 3, 9]] }, char: [[-0.5, 13], [-0.5, 7.5]], assemble: true },
    { id: 'about', len: 1.1, exhibit: 'about', char: [[-0.5, 3.5], [-1.4, 1.6]] },
    { id: 'results', len: 1.1, exhibit: 'results', char: [[-0.5, 0.5], [nbx + 0.6, nbz + 2.4]] },
    { id: 'exit', len: 1.1, cam: { subject: [-14, 2.5, -5.5], az: 75, el: 20, dist: 22, fov: 38 }, char: [[-0.5, -4.5], [-8, -5.5], [-15.8, -5.5]] },
  ];

  let gateP = 0;
  ctx.update = (t, dt, w) => {
    // skiff bob, on sixes
    const tt = Math.floor(t * FPS.life) / FPS.life;
    skiffPivot.position.y = -0.9 + Math.sin(tt * 1.3) * 0.12;
    skiffPivot.rotation.z = Math.sin(tt * 0.9) * 0.025;
    skiffPivot.rotation.x = Math.sin(tt * 1.1 + 1) * 0.015;
    // gate progress: from the journey when touring, from proximity when exploring
    if (w.mode === 'journey' && w.beatProgress('harbour', 'gate') !== null) {
      gateP = w.beatProgress('harbour', 'gate') * 1.15;
    } else if (w.mode !== 'journey') {
      const near = w.figureLocal('harbour');
      if (near && Math.hypot(near.x + 0.5, near.z - 6) < 9) gateP = Math.min(1, gateP + dt * 0.6);
    }
    if (w.mode === 'journey' && w.journeyS > w.beatEnd('harbour', 'gate')) gateP = 1;
    if (w.mode === 'journey' && w.journeyS < w.beatStart('harbour', 'gate')) gateP = 0;
    assembly.set(w.reduced ? 1 : Math.round(Math.min(1, gateP) * gate.length * 4) / (gate.length * 4));
    if (rewardT >= 0 && rewardT < 1) { rewardT = Math.min(1, rewardT + dt * 0.35); reward.set(w.reduced ? 1 : Math.floor(rewardT * model.length * 4) / (model.length * 4)); }
  };
  ctx.stats = stats;
  return group;
}

// The Workshop: personal builds. A timber shed with an awning, and six exhibits:
// Task Board, Training Rack (fit), Orrery (Physics Hyperion), Writing Desk (Echo Journal),
// Projector (Motion Lab), Arcade Cabinet. Also the hidden chain lift down to the Dormant Rock.
import * as THREE from 'three';
import { BrickBuilder } from '../../lego/builder.js';
import { PLATE } from '../../lego/dims.js';
import { buildTerrain, scatter } from '../terrain.js';
import { house, lamppost, lantern, crate, barrel, pine, leafyTree, fence, reserve, printedTile, lightCone, M4 } from '../props.js';
import { solid } from '../../lego/materials.js';
import { FPS } from '../../core/stepped.js';

function boardTexture() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#f2ede2'; g.fillRect(0, 0, 768, 512);
  const cols = ['New', 'Active', 'Hold / Later', 'Done'];
  const cards = [[3, '#f2cd37'], [2, '#36aebf'], [1, '#a95500'], [4, '#4b9f4a']];
  cols.forEach((name, i) => {
    const x = 16 + i * 188;
    g.fillStyle = '#e6dfcf'; g.fillRect(x, 16, 176, 480);
    g.fillStyle = '#17202b'; g.font = '700 30px Figtree, sans-serif'; g.fillText(name, x + 12, 56);
    for (let k = 0; k < cards[i][0]; k++) {
      g.fillStyle = cards[i][1]; g.fillRect(x + 10, 80 + k * 96, 156, 80);
      g.fillStyle = 'rgba(23,32,43,0.55)'; g.fillRect(x + 22, 100 + k * 96, 110, 10); g.fillRect(x + 22, 120 + k * 96, 80, 10);
    }
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function screenTexture(lines, bg = '#0b1420', ink = '#bada55') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 384);
  g.fillStyle = ink; g.font = '600 46px "DM Mono", monospace'; g.textAlign = 'center';
  lines.forEach((ln, i) => g.fillText(ln, 256, 150 + i * 70));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function build(ctx) {
  const b = new BrickBuilder({ seed: 71 });
  const onPath = (x, z) =>
    (z >= 3 && z <= 4 && x >= -16 && x <= 14) ||
    (x >= -1 && x <= 0 && z >= -3 && z <= 12) ||
    (z >= 8 && z <= 9 && x >= 0 && x <= 13);
  const t = buildTerrain(b, {
    seed: 81,
    blobs: [{ x: 0, z: 0, rx: 14.5, rz: 12 }, { x: -9, z: 4, rx: 7, rz: 6 }, { x: 8, z: 7, rx: 7, rz: 6 }, { x: -4, z: 11, rx: 5, rz: 3 }],
    edge: 2.0, depth: 13, taper: 1.05, roots: 14,
    grass: (x, z, v) => (v > 0.65 ? 'brightGreen' : v < 0.3 ? 'darkGreen' : 'green'),
    path: onPath,
    pathColor: (x, z) => ((x * 3 + z) % 4 === 0 ? 'darkTan' : 'tan'),
    strata: [['darkTan', 'brown'], ['darkTan', 'tan'], ['darkGray', 'darkTan'], ['darkGray', 'black']],
    moss: 'darkGreen',
  });
  for (const k of t.cells) ctx.cells.add(k);

  // ---------------------------------------------------------- the shed with an awning
  house(b, ctx, -8, 0, -11, {
    w: 11, d: 7, courses: 4, wall: (c, p) => ((c + p) % 3 === 0 ? 'darkBrown' : 'brown'), trim: 'tan', floor: 'tan',
    windows: [{ side: 's', at: 1 }, { side: 's', at: 8 }, { side: 'e', at: 2 }], door: { side: 's', at: 4, w: 3 },
    roof: { kind: 'gable', axis: 'x', color: 'darkOrange', ridge: 'darkBrown', gable: 'tan' },
  });
  // awning: striped slopes over the door
  for (let i = 0; i < 7; i++) b.slope(-6 + i, 13, -5, 1, 2, 3, i % 2 ? 'white' : 'green', 0, 0, { occ: false });
  for (const x of [-6, 0]) for (let k = 0; k < 4; k++) b.round(x, k * 3 + 1, -3, 1, 3, 'brown', { studs: false, occ: k > 0 });
  reserve(ctx, -6, -3, 1, 1); reserve(ctx, 0, -3, 1, 1);
  // string lights along the awning
  for (let i = 0; i < 8; i++) b.free('round', [1, 1], M4(-6.2 + i * 0.95, 4.4 - Math.sin((i / 7) * Math.PI) * 0.35, -2.6).multiply(new THREE.Matrix4().makeScale(0.5, 0.5, 0.5)), i % 2 ? 'glowAmber' : 'glowWarm');
  ctx.lights.push({ x: -3, y: 4.5, z: -2.5, color: 0xffb060, power: 1.0 });
  // tool rack on the west wall
  b.brick(-10, 0, -9, 1, 4, 3, 'darkBrown'); b.brick(-10, 3, -9, 1, 4, 3, 'brown');
  b.free('bar', [2.6, 0.08], M4(-10.6, 1.2, -7.6, 0, 0, 0.3), 'silver');
  b.free('bar', [2.2, 0.08], M4(-10.6, 1.2, -8.6, 0, 0, -0.2), 'silver');
  reserve(ctx, -10, -9, 1, 4);

  // ---------------------------------------------------------- task board (kanban) on an easel
  const kb = { x: -6, z: 0 };
  for (const x of [kb.x, kb.x + 4]) for (let k = 0; k < 4; k++) b.round(x, k * 3, kb.z, 1, 3, 'darkBrown', { studs: k === 3 });
  b.brick(kb.x, 12, kb.z, 5, 1, 1, 'darkBrown');
  reserve(ctx, kb.x, kb.z, 5, 1);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.8), new THREE.MeshStandardMaterial({ map: boardTexture(), roughness: 0.5 }));
  board.position.set(kb.x + 2.5, 3.0, kb.z + 1.02);

  // ---------------------------------------------------------- training rack (fit): bar on a stand + week board
  const fr = { x: 6, z: -6 };
  for (const x of [fr.x, fr.x + 5]) { b.brick(x, 0, fr.z, 1, 2, 3, 'black', { studs: false }); b.brick(x, 3, fr.z, 1, 1, 3, 'black', { studs: false }); b.brick(x, 6, fr.z, 1, 1, 3, 'darkGray'); }
  b.free('cyl', [0.12, 7.8, 10], M4(fr.x - 1, 9 * PLATE - 0.15, fr.z + 0.62, 0, 0, -Math.PI / 2), 'silver');
  for (const [x, s] of [[fr.x - 0.6, 1], [fr.x + 6.6, 1]]) b.free('cyl', [0.9, 0.5, 18], M4(x - 0.25 * s, 9 * PLATE - 0.9 + 0.75, fr.z + 0.62 - 0.9, 0, 0, -Math.PI / 2), 'black');
  reserve(ctx, fr.x, fr.z, 6, 2);
  // seven-slot week board
  for (let i = 0; i < 7; i++) b.tile(fr.x - 1 + i, 0, fr.z + 3, 1, 1, [0, 1, 2, 4, 5].includes(i) ? 'brightGreen' : 'lightGray');

  // ---------------------------------------------------------- orrery (Physics Hyperion)
  const oc = { x: 7, z: 3 };
  b.round(oc.x - 1, 0, oc.z - 1, 2, 3, 'black');
  b.round(oc.x - 0.5 | 0, 3, oc.z - 0.5 | 0, 1, 3, 'pearlGold', { studs: false });
  reserve(ctx, oc.x - 1, oc.z - 1, 2, 2);
  const orrery = new THREE.Group(); orrery.position.set(oc.x, 2.6, oc.z);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb15a).multiplyScalar(1.3) }));
  sun.position.y = 0.9; orrery.add(sun);
  const arms = [];
  [[1.6, 0xbada55, 0.22], [2.6, 0x36aebf, 0.3], [3.5, 0xc91a09, 0.26]].forEach(([r, c, s], i) => {
    const arm = new THREE.Group(); arm.position.y = 0.9 - i * 0.18;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, r, 6), solid(0xaa7f2e, { metalness: 0.8 })); rod.rotation.z = Math.PI / 2; rod.position.x = r / 2; arm.add(rod);
    const planet = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 10), solid(c)); planet.position.x = r; planet.castShadow = true; arm.add(planet);
    const stud = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.5, s * 0.5, s * 0.5, 10), solid(c)); stud.position.set(r, s, 0); arm.add(stud);
    orrery.add(arm); arms.push({ arm, speed: [1.0, 0.55, 0.3][i] });
  });
  ctx.lights.push({ x: oc.x, y: 3.6, z: oc.z, color: 0xffb060, power: 0.6 });

  // ---------------------------------------------------------- writing desk (Echo Journal)
  const wd = { x: -11, z: 5 };
  for (const [x, z] of [[wd.x, wd.z], [wd.x + 3, wd.z], [wd.x, wd.z + 1], [wd.x + 3, wd.z + 1]]) b.round(x, 0, z, 1, 3, 'darkBrown', { studs: false });
  b.tile(wd.x, 3, wd.z, 4, 2, 'brown');
  b.tile(wd.x + 1, 4, wd.z, 2, 1, 'white'); b.tile(wd.x + 1, 5, wd.z, 2, 1, 'tan');
  lantern(b, ctx, wd.x + 3, 4, wd.z + 1, { power: 0.5 });
  reserve(ctx, wd.x, wd.z, 4, 2);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshStandardMaterial({ map: screenTexture([':)'], '#f2ede2', '#237841'), roughness: 0.4 }));
  dial.position.set(wd.x + 0.6, 2.1, wd.z + 2.05);

  // ---------------------------------------------------------- projector (Motion Lab) and its screen
  const pj = { x: 4, z: 10 };
  for (const [dx, dz] of [[0, 0], [1, 0]]) b.round(pj.x + dx, 0, pj.z + dz, 1, 3, 'black', { studs: false });
  b.brick(pj.x, 3, pj.z, 2, 2, 3, 'darkGray');
  b.round(pj.x + 0.5 | 0, 6, pj.z - 0 | 0, 1, 1, 'transClear');
  b.free('cyl', [0.7, 0.3, 16], M4(pj.x + 0.3, 6 * PLATE + 0.7, pj.z + 1.5, 0, Math.PI / 2, 0), 'black');
  b.free('cyl', [0.7, 0.3, 16], M4(pj.x + 1.7, 6 * PLATE + 0.7, pj.z + 1.5, 0, Math.PI / 2, 0), 'black');
  reserve(ctx, pj.x, pj.z, 2, 2);
  // screen to the east
  for (let k = 0; k < 4; k++) b.brick(11, k * 3, 8, 1, 4, 3, k === 0 ? 'darkGray' : 'white', { studs: false });
  reserve(ctx, 11, 8, 1, 4);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.6), new THREE.MeshBasicMaterial({ map: screenTexture(['MOTION', 'LAB'], '#1b2a34', '#f2cd37') }));
  screen.position.set(10.98, 2.6, 10); screen.rotation.y = -Math.PI / 2;
  const beam = lightCone(6.4, 1.6, 0xfff1d0, 0.12);
  beam.position.set(pj.x + 1, 6 * PLATE + 0.6, pj.z + 0.4); beam.rotation.z = Math.PI / 2 + 0.05; beam.rotation.y = 0.05;

  // ---------------------------------------------------------- arcade cabinet
  const ac = { x: 6, z: -11 };
  b.brick(ac.x, 0, ac.z, 3, 2, 3, 'black', { studs: false });
  b.brick(ac.x, 3, ac.z, 3, 2, 3, 'black', { studs: false });
  b.slope(ac.x, 6, ac.z, 3, 2, 3, 'darkGray', 0, 1);
  b.brick(ac.x, 9, ac.z, 3, 1, 3, 'black', { studs: false });
  b.brick(ac.x, 12, ac.z, 3, 1, 3, 'black', { studs: false });
  b.brick(ac.x, 15, ac.z, 3, 2, 2, 'red');
  b.round(ac.x + 0, 9, ac.z + 1, 1, 1, 'red'); b.round(ac.x + 2, 9, ac.z + 1, 1, 1, 'yellow');
  reserve(ctx, ac.x, ac.z, 3, 2);
  const arcadeScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), new THREE.MeshBasicMaterial({ map: screenTexture(['FLAPPY', 'BYTE']) }));
  arcadeScreen.position.set(ac.x + 1.5, 4.8, ac.z + 1.03);
  ctx.lights.push({ x: ac.x + 1.5, y: 4.5, z: ac.z + 2.5, color: 0xbada55, power: 0.35 });

  // ---------------------------------------------------------- chain lift (hidden) on the south edge
  const lx = -5, lz = 12;
  for (const x of [lx, lx + 3]) for (let k = 0; k < 5; k++) b.brick(x, k * 3, lz, 1, 1, 3, k % 2 ? 'darkGray' : 'black', { studs: k === 4 });
  b.brick(lx, 15, lz, 4, 1, 3, 'darkGray');
  b.free('cyl', [0.5, 2.6, 14], M4(lx + 0.7, 16 * PLATE - 0.5, lz + 0.5 + 0.5, 0, 0, -Math.PI / 2), 'pearlGold');
  reserve(ctx, lx, lz, 1, 1); reserve(ctx, lx + 3, lz, 1, 1);
  ctx.ports.lift = [lx + 2, lz - 0.5];
  ctx.ports.liftTop = [lx + 2, lz + 0.5, 16 * PLATE];

  // ---------------------------------------------------------- lamps and life
  lamppost(b, ctx, -2, 0, 5, { power: 0.9 });
  lamppost(b, ctx, 13, 0, 6, { power: 0.8 });
  lamppost(b, ctx, -14, 0, 2, { power: 0.7 });
  pine(b, ctx, 12, 0, -4, { layers: 4, size: 2.2 });
  leafyTree(b, ctx, -12, 0, -2, { h: 4 });
  leafyTree(b, ctx, 2, 0, -14 + 2, { h: 3, color: 'darkGreen', alt: 'green' });
  crate(b, ctx, 2, 0, -2, { size: 2, h: 6 }); crate(b, ctx, 2, 6, -2, { size: 1, h: 3, color: 'darkBrown' });
  barrel(b, ctx, -3, 0, -2);
  fence(b, ctx, -16, 0, 7, 5, 'x');
  ctx.collectibles.push({ id: 'piece-workshop', local: [-9.5, 0.2, -3.0] }); // on the ground: every piece must be reachable on foot

  scatter(b, t, ctx.reserved, 11, { flowers: 30, rocks: 10 });
  const { group, stats } = b.build();
  ctx.occ = b.occ;
  ctx.camOcc = b.camOcc;
  group.add(board, orrery, dial, screen, beam, arcadeScreen);
  const sign = printedTile('WORKSHOP', 3.4, 0.8, { bg: '#e4cd9e', ink: '#582a12', font: '800 66px "Bricolage Grotesque", Georgia, serif' });
  sign.position.set(-2.5, 5.6, -3.88); group.add(sign);

  ctx.exhibits.push(
    { id: 'taskboard', marker: [kb.x + 2.5, 6.2, kb.z + 0.5], stand: [kb.x + 0.8, 3.5], face: [kb.x + 2.5, kb.z + 1], hit: [kb.x, 0, kb.z - 0.5, 5, 5.5, 2], shot: { side: 30, dist: 14 }, focusY: 3 },
    { id: 'fit', marker: [fr.x + 3, 5.2, fr.z + 1], stand: [fr.x + 1.5, -2.5], face: [fr.x + 3, fr.z + 1], hit: [fr.x - 1, 0, fr.z - 0.5, 8, 4.5, 4.5], shot: { side: 35, dist: 15 }, focusY: 2.5 },
    { id: 'physics', marker: [oc.x, 6.6, oc.z], stand: [oc.x - 2.5, 4.5], face: [oc.x, oc.z], hit: [oc.x - 3.6, 0, oc.z - 3.6, 7.2, 5, 7.2], shot: { side: -35, dist: 15, el: 26 }, focusY: 3 },
    { id: 'echo', marker: [wd.x + 2, 5.4, wd.z + 1], stand: [wd.x + 2, 3.5], face: [wd.x + 2, wd.z + 1], hit: [wd.x, 0, wd.z, 4, 3.5, 2.4], shot: { side: -40, dist: 13, el: 26 }, focusY: 2 },
    { id: 'motion', marker: [pj.x + 1, 5.4, pj.z + 1], stand: [pj.x - 0.5, 8.5], face: [pj.x + 1, pj.z + 1], hit: [pj.x, 0, pj.z, 8, 5, 3], shot: { side: -40, dist: 16, el: 22 }, focusY: 2.6 },
    { id: 'arcade', marker: [ac.x + 1.5, 8.6, ac.z + 1], stand: [ac.x + 1.5, ac.z + 4], face: [ac.x + 1.5, ac.z + 1], hit: [ac.x, 0, ac.z, 3, 7, 2], shot: { side: 30, dist: 13 }, focusY: 3.5 },
  );
  ctx.ports.west = [-15.5, 3.5];
  ctx.ports.east = [13.5, 8.5];
  ctx.spawn = [-12, 3.5];

  ctx.beats = [
    { id: 'establish', len: 1.0, cam: { subject: [0, 3.5, -2], az: -110, el: 28, dist: 40, fov: 38 }, char: [[-12, 3.5]] },
    { id: 'echo', len: 0.9, exhibit: 'echo', char: [[wd.x + 2, 3.5]] },
    { id: 'taskboard', len: 0.9, exhibit: 'taskboard', char: [[kb.x + 0.8, 3.5]] },
    { id: 'arcade', len: 0.9, exhibit: 'arcade', char: [[-0.5, 3.5], [-0.5, -2], [3, -2.5], [ac.x + 1.5, -5], [ac.x + 1.5, ac.z + 4]] },
    { id: 'fit', len: 0.9, exhibit: 'fit', char: [[fr.x + 1.5, -2.5]] },
    { id: 'physics', len: 0.9, exhibit: 'physics', char: [[3, -2.5], [-0.5, 1], [oc.x - 2.5, 3.5], [oc.x - 2.5, 4.5]] },
    { id: 'motion', len: 0.9, exhibit: 'motion', char: [[-0.5, 4.5], [-0.5, 8.5], [pj.x - 0.5, 8.5]] },
    { id: 'exit', len: 0.8, cam: { subject: [12, 3, 8.5], az: -150, el: 22, dist: 24, fov: 38 }, char: [[12.8, 8.5]] },
  ];

  ctx.update = (time, dt, w) => {
    const m = w.reduced ? 0 : Math.floor(time * FPS.machine);
    arms.forEach(({ arm, speed }, i) => { arm.rotation.y = m * 0.14 * speed + i * 2.1; });
    beam.material.uniforms.opacity.value = w.reduced ? 0.1 : (Math.floor(time * 12) % 7 === 0 ? 0.08 : 0.12);
  };
  ctx.stats = stats;
  return group;
}

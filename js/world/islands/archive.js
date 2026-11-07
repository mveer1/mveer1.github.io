// The Archive: timeline, skills, education.
//   Timeline Stair   seven landings that climb one brick each, a banner per year (walkable)
//   Parts Library    shelves of coloured bins: the skills, sorted
//   Plinth           BITS Pilani
import * as THREE from 'three';
import { BrickBuilder } from '../../lego/builder.js';
import { PLATE } from '../../lego/dims.js';
import { buildTerrain, scatter } from '../terrain.js';
import { lamppost, pine, leafyTree, fence, reserve, printedTile, M4 } from '../props.js';
import { FPS } from '../../core/stepped.js';

export function build(ctx) {
  const b = new BrickBuilder({ seed: 91 });
  const onPath = (x, z) =>
    (z >= -5 && z <= -4 && x >= -15 && x <= -6) ||
    (x >= -3 && x <= -2 && z >= 1 && z <= 13) ||
    (z >= 1 && z <= 2 && x >= -7 && x <= 10) ||
    (Math.hypot(x + 2.5, z - 6) < 3.4);
  const t = buildTerrain(b, {
    seed: 101,
    blobs: [{ x: 0, z: 0, rx: 14, rz: 12 }, { x: 3, z: 8, rx: 8, rz: 5.5 }, { x: -7, z: -6, rx: 8, rz: 6 }, { x: -2, z: 12, rx: 4, rz: 2.5 }],
    edge: 1.8, depth: 13, taper: 1.05, roots: 12,
    grass: (x, z, v) => (v > 0.66 ? 'olive' : v < 0.3 ? 'darkGreen' : 'green'),
    path: onPath,
    pathColor: (x, z) => (Math.hypot(x + 2.5, z - 6) < 3.4 ? ((x + z) % 2 ? 'tan' : 'darkTan') : 'tan'),
    strata: [['tan', 'darkTan'], ['darkTan', 'tan'], ['darkTan', 'darkGray'], ['darkGray', 'black']],
    moss: 'sandGreen',
  });
  for (const k of t.cells) ctx.cells.add(k);

  // ---------------------------------------------------------- the timeline stair: 7 landings
  // From the path near (-7, -3) climbing north-east to the library terrace.
  const years = ['2019', '2020', '2021', '2023', '2023', '2025', '2026'];
  const landings = [];
  for (let i = 0; i < 7; i++) {
    const x = -7 + i * 2, z = -3 - i * 1;
    const h = (i + 1) * 3; // plates: each landing one brick above the last
    for (let k = 0; k < i + 1; k++) b.brick(x, k * 3, z - 2, 2, 3, 3, k === i ? (i % 2 ? 'tan' : 'white') : 'darkTan', { studs: k === i });
    for (let a = 0; a < 2; a++) for (let c = 0; c < 3; c++) { const k = (x + a) + ',' + (z - 2 + c); ctx.heights.set(k, h * PLATE); }
    landings.push({ x: x + 0.5, z: z - 0.5, y: h * PLATE, year: years[i] });
    // banner post on the landing's back corner
    for (let k = 0; k < 4; k++) b.round(x + 1, h + k * 3, z - 2, 1, 3, 'darkBrown', { studs: k === 3 });
    ctx.blocked.add((x + 1) + ',' + (z - 2));
  }
  // the terrace at the top, in front of the library
  const top = 7 * 3;
  for (let k = 0; k < 7; k++) b.brick(7, k * 3, -11, 6, 4, 3, k % 2 ? 'tan' : 'darkTan', { studs: false });
  b.fillPlates(7, top, -11, 6, 4, 'lightGray', { tile: true });
  for (let x = 7; x < 13; x++) for (let z = -11; z < -7; z++) ctx.heights.set(x + ',' + z, (top + 1) * PLATE);

  // ---------------------------------------------------------- library hall behind the terrace
  const lx = 4, lz = -18;
  b.fillPlates(lx, 0, lz, 10, 6, 'darkTan', { tile: true });
  for (let c = 0; c < 10; c++) {
    const col = c === 9 ? 'tan' : (c % 2 ? 'tan' : 'darkTan');
    b.wall?.call(b, lx, 1 + c * 3, lz, 10, 'x', 3, col, { studs: c === 9 });
    b.brick(lx, 1 + c * 3, lz + 1, 1, 5, 3, col, { studs: false });
    b.brick(lx + 9, 1 + c * 3, lz + 1, 1, 5, 3, col, { studs: false });
  }
  // columns along the front (south)
  for (const x of [lx, lx + 3, lx + 6, lx + 9]) for (let k = 0; k < 10; k++) b.round(x, 1 + k * 3, lz + 6, 1, 3, 'white', { studs: false });
  b.brick(lx - 1, 31, lz - 1, 12, 9, 1, 'tan');
  // copper roof (sand green), stepped
  for (let L = 0; L < 4; L++) {
    b.slope(lx - 1, 32 + L * 3, lz + 7 - L, 12, 2, 3, 'sandGreen', 0, 1);
    b.slope(lx - 1, 32 + L * 3, lz - 1 + L, 12, 2, 3, 'sandGreen', 2, 1);
  }
  b.brick(lx - 1, 44, lz + 3, 12, 2, 1, 'darkGreen');
  // banners
  for (const x of [lx + 1, lx + 7]) for (let k = 0; k < 3; k++) b.brick(x, 18 + k * 3, lz + 7, 2, 1, 3, 'darkRed', { studs: false, occ: false });
  // lit door
  b.put('tile', [2, 1, 9], lx + 4, top + 1, lz + 6, 'glowWarm', { occ: false });
  ctx.lights.push({ x: lx + 5, y: (top + 5) * PLATE, z: lz + 7, color: 0xffb060, power: 0.9 });
  reserve(ctx, lx - 1, lz - 1, 12, 9);

  // ---------------------------------------------------------- parts library (skills): open shelves of bins
  const px = 3, pz = 3;
  const binCols = [['blue', 'azure', 'sandBlue'], ['red', 'darkOrange', 'orange'], ['yellow', 'lime', 'tan'], ['green', 'brightGreen', 'sandGreen']];
  for (let k = 0; k < 5; k++) for (const x of [px, px + 9]) b.brick(x, k * 3, pz + 3, 1, 2, 3, 'brown', { studs: k === 4 });
  for (let s = 0; s < 3; s++) b.plate(px, 3 + s * 5, pz + 3, 10, 2, 'darkBrown', { occ: true });
  for (let s = 0; s < 3; s++) for (let i = 0; i < 4; i++) {
    const c = binCols[i][s];
    b.brick(px + 1 + i * 2, 4 + s * 5, pz + 3, 2, 2, 3, c, { studs: true });
    b.slope(px + 1 + i * 2, 4 + s * 5, pz + 2, 2, 1, 3, c, 2, 0, { occ: false });
  }
  b.plate(px, 15, pz + 3, 10, 2, 'darkBrown');
  reserve(ctx, px, pz + 2, 10, 3);

  // ---------------------------------------------------------- plinth (education)
  const ex = -9, ez = 4;
  b.brick(ex, 0, ez, 3, 3, 3, 'white', { studs: false });
  b.brick(ex, 3, ez, 3, 3, 3, 'lightGray', { studs: false });
  b.tile(ex, 6, ez, 3, 3, 'white');
  b.brick(ex + 1, 7, ez + 1, 1, 1, 1, 'black');
  b.tile(ex, 8, ez, 3, 3, 'black');
  b.round(ex + 2, 9, ez + 2, 1, 1, 'yellow', { studs: false });
  reserve(ctx, ex, ez, 3, 3);

  // ---------------------------------------------------------- lamps, trees
  lamppost(b, ctx, -4, 0, 8, { power: 0.9 });
  lamppost(b, ctx, -7, 0, 0, { power: 0.8 });
  lamppost(b, ctx, 9, 0, 0, { power: 0.7 });
  leafyTree(b, ctx, -2, 0, 6, { h: 4, color: 'sandGreen', alt: 'green' });
  pine(b, ctx, 11, 0, 7, { layers: 4 }); pine(b, ctx, -12, 0, -9, { layers: 3 });
  fence(b, ctx, 2, 0, 10, 7, 'x', { color: 'darkTan' });
  ctx.collectibles.push({ id: 'piece-archive', local: [12.5, (top + 1) * PLATE + 0.2, -8.5] });

  scatter(b, t, ctx.reserved, 13, { flowers: 22, rocks: 12 });
  const { group, stats } = b.build();
  ctx.occ = b.occ;
  ctx.camOcc = b.camOcc;

  // year banners on the stair posts
  for (const L of landings) {
    const tile = printedTile(L.year, 1.6, 0.9, { bg: '#720e0f', ink: '#f2ede2', font: '600 72px "DM Mono", monospace', border: false });
    tile.position.set(L.x + 1, L.y + 3.2, L.z - 0.47);
    tile.rotation.y = 0;
    group.add(tile);
  }
  // shelf labels
  ['Data', 'AI', 'Cloud', 'Code'].forEach((txt, i) => {
    const lab = printedTile(txt, 1.8, 0.45, { bg: '#f2ede2', font: '600 56px "DM Mono", monospace', border: false });
    lab.position.set(px + 2 + i * 2, 0.9, pz + 2.02); group.add(lab);
  });
  const plaque = printedTile('BITS Pilani\n2019 – 2023', 2.6, 1.3, { bg: '#f2f3f2', ink: '#17202b', font: '600 54px Figtree, sans-serif' });
  plaque.position.set(ex + 1.5, 1.6, ez + 3.02); group.add(plaque);
  const sign = printedTile('THE ARCHIVE', 3.6, 0.8, { bg: '#e4cd9e', ink: '#720e0f', font: '800 64px "Bricolage Grotesque", Georgia, serif' });
  sign.position.set(-12, 2.2, -3.3); sign.rotation.y = 0.5; group.add(sign);

  const L3 = landings[3];
  ctx.exhibits.push(
    { id: 'timeline', marker: [L3.x, L3.y + 6, L3.z - 1.5], stand: [-7.5, -4.5], face: [-4, -6], hit: [-8, 0, -12, 16, 10, 10], shot: { side: -38, dist: 25, el: 20 }, focusY: 4 },
    { id: 'skills', marker: [px + 5, 7.6, pz + 4], stand: [px + 3, 1.5], face: [px + 5, pz + 3], hit: [px, 0, pz + 2, 10, 7, 3], shot: { side: 32, dist: 17 }, focusY: 3 },
    { id: 'education', marker: [ex + 1.5, 5.4, ez + 1.5], stand: [ex + 3.5, 1.5], face: [ex + 1.5, ez + 1.5], hit: [ex, 0, ez, 3, 4.5, 3], shot: { side: -35, dist: 12 }, focusY: 2 },
  );
  ctx.ports.west = [-15.3, -4.5];
  ctx.ports.south = [-2.5, 13.5];
  ctx.spawn = [-12, -4.5];

  // the figure climbs the stair, landing by landing
  const climb = landings.map((L) => [L.x, L.z]);
  ctx.beats = [
    { id: 'establish', len: 1.0, cam: { subject: [0, 5, -4], az: -100, el: 26, dist: 40, fov: 38 }, char: [[-11, -4.5]] },
    { id: 'timeline', len: 1.4, exhibit: 'timeline', char: [[-8, -4.5], ...climb] },
    { id: 'skills', len: 1.0, exhibit: 'skills', char: [[landings[6].x, landings[6].z], ...climb.slice().reverse(), [-7, 1.5], [px + 3, 1.5]] },
    { id: 'education', len: 0.9, exhibit: 'education', char: [[ex + 3.5, 1.5]] },
    { id: 'exit', len: 0.8, cam: { subject: [-2.5, 3, 11], az: -60, el: 24, dist: 22, fov: 38 }, char: [[-2.5, 1.5], [-2.5, 12.5]] },
  ];
  ctx.stats = stats;
  return group;
}

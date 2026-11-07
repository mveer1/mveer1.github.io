// The Lookout: contact. A lighthouse whose beam sweeps the islands, a mailbox
// (contact), the lamp-room door (CV), a bench facing the Harbour, and a zip line home.
import * as THREE from 'three';
import { BrickBuilder } from '../../lego/builder.js';
import { PLATE } from '../../lego/dims.js';
import { buildTerrain, scatter } from '../terrain.js';
import { lantern, fence, reserve, printedTile, lightCone, M4 } from '../props.js';
import { solid } from '../../lego/materials.js';

export function build(ctx) {
  const b = new BrickBuilder({ seed: 111 });
  const onPath = (x, z) => (x >= -1 && x <= 0 && z >= -9 && z <= 5) || (z >= 4 && z <= 5 && x >= -6 && x <= 4);
  const t = buildTerrain(b, {
    seed: 121,
    blobs: [{ x: 0, z: 0, rx: 8, rz: 7.5 }, { x: -1, z: -6, rx: 4, rz: 3.5 }, { x: -4, z: 4, rx: 4, rz: 3.5 }],
    edge: 1.4, depth: 16, taper: 0.62, roots: 8,
    grass: (x, z, v) => (v > 0.6 ? 'darkGreen' : v < 0.35 ? 'darkGray' : 'green'),
    path: onPath, pathColor: 'darkGray',
    strata: [['darkGray', 'lightGray'], ['darkGray', 'black'], ['black', 'darkGray']],
  });
  for (const k of t.cells) ctx.cells.add(k);

  // ---------------------------------------------------------- lighthouse
  const c = { x: 3, z: -1 }, R = 2.6;
  for (let k = 0; k < 9; k++) {
    for (let x = -1; x <= 7; x++) for (let z = -5; z <= 3; z++) {
      const d = Math.hypot(x + 0.5 - c.x, z + 0.5 - c.z);
      if (d > R || d < R - 1.1) continue;
      if (k < 2 && z >= 1 && x >= 2 && x <= 3) continue; // door
      b.brick(x, 1 + k * 3, z, 1, 1, 3, k % 2 ? 'red' : 'white', { studs: false });
    }
  }
  b.fillPlates(0, 0, -4, 6, 6, 'lightGray', { tile: true });
  b.put('tile', [2, 1, 6], 2, 1, 1, 'glowWarm', { occ: false });
  const lampY = 28;
  b.fillPlates(0, lampY, -4, 6, 6, 'darkGray');
  for (const [x, z] of [[0, -4], [5, -4], [0, 1], [5, 1]]) for (let k = 0; k < 2; k++) b.round(x, lampY + 1 + k * 3, z, 1, 3, 'black', { studs: false });
  b.round(2, lampY + 1, -2, 2, 3, 'glowAmber');
  b.round(2, lampY + 4, -2, 2, 1, 'pearlGold', { studs: false });
  b.fillPlates(0, lampY + 7, -4, 6, 6, 'red');
  for (let L = 0; L < 2; L++) { b.slope(L, lampY + 8 + L * 3, 1 - L, 6 - L * 2, 2, 3, 'red', 0, 1); b.slope(L, lampY + 8 + L * 3, -4 + L, 6 - L * 2, 2, 3, 'red', 2, 1); }
  b.cone(2, lampY + 14, -2, 'black');
  reserve(ctx, 0, -4, 6, 6);
  ctx.lights.push({ x: 3, y: (lampY + 2.5) * PLATE, z: -1, color: 0xffc070, power: 1.8 });
  ctx.lights.push({ x: 2.5, y: 2.2, z: 2.2, color: 0xffb060, power: 0.6 });
  // glass ring of the lamp room
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 2.3, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xeef4f6, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.set(c.x, (lampY + 1) * PLATE + 1.2, c.z);
  // beam: two soft cones, swept continuously
  const beam = new THREE.Group(); beam.position.set(c.x, (lampY + 2.2) * PLATE, c.z);
  for (const s of [1, -1]) {
    const cone = lightCone(70, 7, 0xffd8a0, 0.07);
    cone.rotation.z = s * Math.PI / 2; cone.rotation.x = 0.06;
    beam.add(cone);
  }

  // ---------------------------------------------------------- mailbox (contact)
  const mx = -4, mz = 2;
  for (let k = 0; k < 3; k++) b.round(mx, k * 3, mz, 1, 3, 'darkBrown', { studs: false });
  b.brick(mx - 1, 9, mz - 1, 2, 3, 3, 'red', { studs: false });
  b.slope(mx - 1, 12, mz - 1, 2, 3, 3, 'red', 1, 1, { occ: true });
  b.tile(mx - 1, 10, mz + 2, 2, 1, 'black', { occ: false });
  reserve(ctx, mx - 1, mz - 1, 2, 3);
  // flag mast
  for (let k = 0; k < 10; k++) b.round(-5, k * 3, -3, 1, 3, 'white', { studs: k === 9 });
  reserve(ctx, -5, -3, 1, 1);
  const flag = new THREE.Group(); flag.position.set(-4.5, 30 * PLATE - 0.9, -2.5);
  const flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3, 6, 1), new THREE.MeshStandardMaterial({ color: 0xbada55, side: THREE.DoubleSide, roughness: 0.6 }));
  flagMesh.position.x = 1.15; flag.add(flagMesh);
  // bench facing the Harbour (south-west)
  b.brick(-6, 0, 5, 1, 1, 2, 'darkBrown', { studs: false }); b.brick(-3, 0, 5, 1, 1, 2, 'darkBrown', { studs: false });
  b.tile(-6, 2, 5, 4, 1, 'brown');
  b.brick(-6, 2, 6, 4, 1, 3, 'brown', { studs: false });
  reserve(ctx, -6, 5, 4, 2);
  lantern(b, ctx, 0, 0, 6, { power: 0.6 });
  // zip line post (west edge)
  for (let k = 0; k < 8; k++) b.brick(-8, k * 3, -1, 1, 1, 3, k % 2 ? 'yellow' : 'black', { studs: k === 7 });
  reserve(ctx, -8, -1, 1, 1);
  ctx.ports.zip = [-7, 0];
  ctx.ports.zipTop = [-7.5, -0.5, 24 * PLATE];
  fence(b, ctx, 4, 0, 5, 4, 'x', { color: 'darkGray' });
  ctx.collectibles.push({ id: 'piece-lookout', local: [-4.5, 0.2, 7.2] });

  scatter(b, t, ctx.reserved, 17, { flowers: 6, rocks: 14 });
  const { group, stats } = b.build();
  ctx.occ = b.occ;
  ctx.camOcc = b.camOcc;
  group.add(glass, beam, flag);
  const sign = printedTile('LOOKOUT', 2.8, 0.7, { bg: '#f2f3f2', ink: '#c91a09', font: '800 60px "Bricolage Grotesque", Georgia, serif' });
  sign.position.set(-1.8, 1.8, -8.2); sign.rotation.y = Math.PI + 0.2; group.add(sign);
  // the way back: a sign on the zip-line post, facing the island
  const zipSign = printedTile('ZIP LINE\nBACK TO THE START', 3.3, 1.2, { bg: '#f2cd37', ink: '#17202b', font: '800 44px "Bricolage Grotesque", Georgia, serif' });
  zipSign.position.set(-6.94, 2.4, -0.5); zipSign.rotation.y = Math.PI / 2; group.add(zipSign);

  ctx.exhibits.push(
    { id: 'contact', marker: [mx, 7.6, mz + 0.5], stand: [-2, 4.5], face: [mx, mz + 0.5], hit: [mx - 1.5, 0, mz - 1.5, 3, 6.5, 4], shot: { side: -35, dist: 14 }, focusY: 3 },
    { id: 'cv', marker: [2.5, 5.2, 2.6], stand: [1.2, 4.5], face: [2.5, 1.5], hit: [0, 0, -4, 6, 14, 6], shot: { side: 30, dist: 20, el: 14 }, focusY: 4 },
  );
  ctx.ports.south = [-0.5, -9.5];
  ctx.spawn = [-0.5, -6];

  ctx.beats = [
    { id: 'establish', len: 1.0, cam: { subject: [2, 8, -1], az: 200, el: 6, dist: 34, fov: 36 }, char: [[-0.5, -7]] },
    { id: 'cv', len: 1.0, exhibit: 'cv', char: [[-0.5, 3], [1.2, 4.5]] },
    { id: 'contact', len: 1.0, exhibit: 'contact', char: [[-2, 4.5]] },
    { id: 'finale', len: 1.6, cam: { subject: [-42, -8, -32], az: 150, el: 28, dist: 128, fov: 40 }, char: [[-3.5, 4.8]], finale: true },
  ];

  // zip line to the Harbour
  const world = ctx.world;
  let zip = null;
  const setupZip = () => {
    const h = world.islands.get('harbour');
    if (!h || zip) return;
    const a = new THREE.Vector3(ctx.ports.zipTop[0], ctx.ports.zipTop[2], ctx.ports.zipTop[1]).add(ctx.origin);
    const bEnd = new THREE.Vector3(12, 5.2, -3).add(h.origin);
    const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, bEnd), 8, 0.06, 6), solid(0x1b2a34));
    world.scene.add(rope);
    const from = new THREE.Vector3(ctx.ports.zip[0], 0, ctx.ports.zip[1]).add(ctx.origin);
    const to = new THREE.Vector3(11, 0, -2).add(h.origin);
    zip = { a, bEnd, from, to };
    world.transports = world.transports || [];
    world.transports.push({
      id: 'zip', label: 'Ride the zip line back to the Harbour, where you started', mapLine: [from, to],
      near: (p) => p.distanceTo(from) < 3,
      start: (app) => app.startRide({ from: a.clone().add(new THREE.Vector3(0, -4.6, 0)), to: bEnd.clone().add(new THREE.Vector3(0, -4.6, 0)), dur: 3.2, exit: to, hang: true }),
    });
  };
  setupZip();
  ctx.onBuilt = setupZip;

  ctx.update = (time, dt, w) => {
    beam.rotation.y = w.reduced ? 0.8 : time * 0.45;
    const l = Math.floor(time * 6);
    flagMesh.rotation.y = w.reduced ? 0 : (l % 3 - 1) * 0.12;
  };
  ctx.stats = stats;
  return group;
}

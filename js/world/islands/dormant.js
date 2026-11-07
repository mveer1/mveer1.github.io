// The Dormant Rock (hidden): a half-built machine for the planned "next pipeline".
// Dark bricks, an unconnected conveyor, loose pieces, one faint cyan pulse in the core.
import * as THREE from 'three';
import { BrickBuilder } from '../../lego/builder.js';
import { PLATE } from '../../lego/dims.js';
import { buildTerrain, scatter } from '../terrain.js';
import { reserve, M4 } from '../props.js';
import { solid } from '../../lego/materials.js';

export function build(ctx) {
  const b = new BrickBuilder({ seed: 131 });
  const t = buildTerrain(b, {
    seed: 141, blobs: [{ x: 0, z: 0, rx: 7, rz: 6 }, { x: 0, z: -5, rx: 3.5, rz: 2.5 }],
    edge: 1.3, depth: 9, taper: 0.9, roots: 16,
    grass: (x, z, v) => (v > 0.6 ? 'darkGreen' : 'darkGray'),
    strata: [['black', 'darkGray'], ['black', 'darkGray']],
  });
  for (const k of t.cells) ctx.cells.add(k);
  // machine frame: corner pillars, one beam, a missing one
  for (const [x, z, h] of [[-3, -2, 4], [2, -2, 4], [-3, 2, 3], [2, 2, 1]]) for (let k = 0; k < h; k++) b.brick(x, k * 3, z, 1, 1, 3, k % 2 ? 'darkGray' : 'black', { studs: k === h - 1 });
  b.brick(-3, 12, -2, 6, 1, 1, 'black');
  for (let x = -2; x <= 1; x++) b.brick(x, 0, 0, 1, 1, 3, 'darkGray', { studs: false });
  b.tile(-2, 3, 0, 2, 1, 'black');
  reserve(ctx, -3, -2, 6, 5);
  // the core
  b.round(-1, 0, -1, 2, 3, 'black');
  b.round(-1, 3, -1, 2, 1, 'transBlue');
  // loose pieces on the ground
  for (const [x, z, w, d, c] of [[3, 3, 2, 1, 'darkGray'], [-5, 1, 1, 2, 'black'], [4, -1, 1, 1, 'lightGray'], [-4, 4, 2, 2, 'darkGray']]) b.brick(x, 0, z, w, d, 1, c);
  b.free('brick', [2, 4, 3], M4(4.5, 0.7, 1.5, 0.6, 1.2, 0), 'black', { studs: true });
  // lift base on the north edge
  b.fillPlates(-2, 0, -7, 4, 3, 'darkGray', { tile: true });
  for (let x = -2; x < 2; x++) for (let z = -7; z < -4; z++) { ctx.cells.add(x + ',' + z); ctx.heights.set(x + ',' + z, PLATE); }
  ctx.ports.lift = [0, -5.5];
  ctx.collectibles.push({ id: 'piece-dormant', local: [3.5, 0.2, -3.5] });

  scatter(b, t, ctx.reserved, 19, { flowers: 0, rocks: 10 });
  const { group, stats } = b.build();
  ctx.occ = b.occ;
  ctx.camOcc = b.camOcc;
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x4fd8e8) }));
  pulse.position.set(0, 3 * PLATE + 0.25, 0); group.add(pulse);
  ctx.lights.push({ x: 0, y: 1.6, z: 0, color: 0x4fd8e8, power: 0.35 });

  ctx.exhibits.push({ id: 'next', marker: [0, 6.8, 0], stand: [0, 4.5], face: [0, 0], hit: [-3.5, 0, -2.5, 7, 6, 6], shot: { side: 35, dist: 14 }, focusY: 2 });
  ctx.beats = [];
  ctx.spawn = [0, -5.5];

  // chain lift from the Workshop
  const world = ctx.world;
  let lift = null;
  const setupLift = () => {
    const w = world.islands.get('workshop');
    if (!w || lift) return;
    const top = new THREE.Vector3(w.ctx.ports.lift[0], 0, w.ctx.ports.lift[1]).add(w.origin);
    const bottom = new THREE.Vector3(ctx.ports.lift[0], PLATE, ctx.ports.lift[1]).add(ctx.origin);
    const chain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(top.clone().add(new THREE.Vector3(0, 6.2, 1)), bottom.clone().add(new THREE.Vector3(0, 6, 0))), 12, 0.07, 6), solid(0x6c6e68, { metalness: 0.7 }));
    world.scene.add(chain);
    const cage = new BrickBuilder({ seed: 151 });
    cage.plate(-2, 0, -2, 4, 4, 'darkGray');
    for (const [x, z] of [[-2, -2], [1, -2], [-2, 1], [1, 1]]) for (let k = 0; k < 4; k++) cage.round(x, 1 + k * 3, z, 1, 3, 'black', { studs: false });
    cage.plate(-2, 13, -2, 4, 4, 'black');
    const { group: car } = cage.build();
    world.scene.add(car);
    car.position.copy(top).add(new THREE.Vector3(0, -PLATE * 0.95, 1.5));
    lift = { top, bottom, car };
    world.transports = world.transports || [];
    const carObj = { place: (p) => car.position.copy(p).add(new THREE.Vector3(0, -PLATE * 0.95, 0)) };
    world.transports.push({
      id: 'lift', label: 'Ride the chain lift down', mapLine: [top, bottom],
      near: (p) => p.distanceTo(top) < 3 || p.distanceTo(bottom) < 3,
      start: (app) => {
        const down = app.ctrl.pos.distanceTo(top) < 3;
        app.startRide({ from: down ? top.clone().add(new THREE.Vector3(0, 0, 1.5)) : bottom, to: down ? bottom : top.clone().add(new THREE.Vector3(0, 0, 1.5)), dur: 4, car: carObj, exit: down ? bottom.clone().add(new THREE.Vector3(0, 0, 3)) : top.clone().add(new THREE.Vector3(0, 0, -2.5)) });
      },
    });
  };
  setupLift();

  ctx.update = (time, dt, w) => {
    const f = Math.floor(time * 6);
    const on = w.reduced ? 0.5 : (f % 12 < 2 ? 1 : 0.25);
    pulse.material.color.setRGB(0.31 * on * 2.4, 0.85 * on * 2.4, 0.91 * on * 2.4);
  };
  ctx.stats = stats;
  return group;
}

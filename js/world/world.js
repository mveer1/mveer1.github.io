// World: island layout, progressive island building, connectors, walk map,
// light pool, exhibits and the journey.
import * as THREE from 'three';
import { WalkMap } from './walk.js';
import { buildBridge } from './connectors.js';
import { Journey } from '../camera/journey.js';
import { markerMesh } from './props.js';
import { byId } from '../content/content.js';
import { PLATE } from '../lego/dims.js';
import { attachEngine } from './thruster.js';

const DEG = Math.PI / 180;

// Camera pull-back. Every authored shot distance is multiplied by this, so the tour and the
// exhibit panels show a whole building and its surroundings, not just the object. Distances
// already past WIDE are overview shots and are left alone.
export const PULLBACK = 2.0;
const WIDE = 60;
const back = (d) => (d >= WIDE ? d : d * PULLBACK);
/** Push an explicit camera position away from its look-at point by the pull-back factor. */
const pushBack = (pos, look) => { const o = pos.clone().sub(look); return o.length() >= WIDE ? pos.clone() : look.clone().add(o.multiplyScalar(PULLBACK)); };

/** Distance from point q to segment a-b. */
function segDist(q, a, b) {
  const ab = new THREE.Vector3().subVectors(b, a), aq = new THREE.Vector3().subVectors(q, a);
  const t = THREE.MathUtils.clamp(aq.dot(ab) / ab.lengthSq(), 0, 1);
  return a.clone().addScaledVector(ab, t).distanceTo(q);
}

export const LAYOUT = {
  harbour:  { origin: [0, 0, 0],         load: () => import('./islands/harbour.js') },
  works:    { origin: [-46, -2.4, -20],  load: () => import('./islands/works.js') },
  lab:      { origin: [-40, 6, -70],     load: () => import('./islands/lab.js') },
  workshop: { origin: [8, 1.2, -80],     load: () => import('./islands/workshop.js') },
  archive:  { origin: [48, 3.6, -52],    load: () => import('./islands/archive.js') },
  lookout:  { origin: [44, 10.8, -10],   load: () => import('./islands/lookout.js') },
  dormant:  { origin: [2, -9.6, -44],    load: () => import('./islands/dormant.js') },
};
export const ROUTE = ['harbour', 'works', 'lab', 'workshop', 'archive', 'lookout'];
export const BUILD_ORDER = ['harbour', 'works', 'lab', 'workshop', 'archive', 'lookout', 'dormant'];

// Bridges: [fromIsland, fromPort, toIsland, toPort, options]. Cable car and lifts are island-owned.
export const BRIDGES = [
  ['harbour', 'west', 'works', 'east', { sag: 0.9, width: 4 }],
  ['lab', 'east', 'workshop', 'west', { sag: 0.4, width: 4, steps: 0 }],
  ['workshop', 'east', 'archive', 'west', { sag: 1.1, width: 3 }],
  ['archive', 'south', 'lookout', 'south', { steps: 6, width: 3, sag: 0 }],
];

const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

export class World {
  constructor({ scene, tier }) {
    this.scene = scene;
    this.tier = tier;
    this.walk = new WalkMap();
    this.islands = new Map();
    this.exhibits = [];
    this.lightAnchors = [];
    this.collectibles = [];
    this.bridges = [];
    this.transports = [];
    this._shotCache = new Map();
    this.journey = null;
    this.listeners = [];
    this.pool = [];
    for (let i = 0; i < tier.lights; i++) {
      const l = new THREE.PointLight(0xffa64d, 0, 18, 1.5);
      l.castShadow = false;
      scene.add(l);
      this.pool.push(l);
    }
    this.hitGroup = new THREE.Group(); this.hitGroup.visible = true;
    scene.add(this.hitGroup);
  }

  onChange(fn) { this.listeners.push(fn); }

  async buildIsland(id) {
    const L = LAYOUT[id];
    const mod = await L.load();
    const origin = V(L.origin);
    const ctx = {
      id, origin, cells: new Set(), blocked: new Set(), reserved: new Set(), heights: new Map(),
      lights: [], exhibits: [], beats: [], ports: {}, collectibles: [], transports: [], update: null, world: this,
    };
    const t0 = performance.now();
    const group = mod.build(ctx);
    attachEngine(group, ctx);
    group.position.copy(origin);
    group.name = 'island:' + id;
    // stop-motion arrival: drop in from above in held frames
    group.userData.arrive = { t: 0 };
    this.scene.add(group);
    this.walk.addIsland({ id, origin, cells: ctx.cells, blocked: ctx.blocked, heights: ctx.heights });
    for (const l of ctx.lights) this.lightAnchors.push({ pos: new THREE.Vector3(l.x, l.y, l.z).add(origin), color: l.color, power: l.power ?? 1, island: id });
    this.islands.set(id, { id, origin, group, ctx });
    for (const ex of ctx.exhibits) this._addExhibit(id, origin, ex);
    for (const c of ctx.collectibles) this.collectibles.push({ ...c, island: id, pos: V(c.local).add(origin) });
    const island = { id, origin, group, ctx, ms: performance.now() - t0 };
    if (this.islands.size === 1 && id === BUILD_ORDER[0]) group.userData.arrive.t = 1;
    this.islands.set(id, island);
    this._connect();
    this._rebuildJourney();
    for (const fn of this.listeners) fn(id);
    return island;
  }

  _addExhibit(island, origin, ex) {
    const content = byId[ex.id];
    const w = (p) => new THREE.Vector3(p[0], p[1] ?? 0, p[2] ?? 0).add(origin);
    const marker = markerMesh();
    marker.position.copy(w(ex.marker));
    this.scene.add(marker);
    const [hx, hy, hz, hw, hh, hd] = ex.hit;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, hd), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(hx + hw / 2, hy + hh / 2, hz + hd / 2).add(origin);
    hit.userData.exhibit = ex.id;
    this.hitGroup.add(hit);
    const stand = new THREE.Vector3(ex.stand[0], 0, ex.stand[1]).add(origin);
    const face = new THREE.Vector3(ex.face[0], 0, ex.face[1]).add(origin);
    const size = Math.max(hw, hh, hd);
    const focusY = ex.focusY ?? Math.min(hh * 0.55, 4.5);
    const subject = new THREE.Vector3(face.x * 0.78 + stand.x * 0.22, origin.y + focusY, face.z * 0.78 + stand.z * 0.22);
    const front = Math.atan2(stand.x - face.x, stand.z - face.z);
    const shot = ex.shot?.pos ? { pos: pushBack(w(ex.shot.pos), w(ex.shot.look)), look: w(ex.shot.look), fov: ex.shot.fov }
      : (() => {
        const head = new THREE.Vector3(stand.x, origin.y + 3.2, stand.z);
        const centre = new THREE.Vector3(hx + hw / 2, hy + hh * 0.6, hz + hd / 2).add(origin);
        return this.frame(island, { subject, az: front + (ex.shot?.side ?? 40) * DEG, el: (ex.shot?.el ?? 20) * DEG, dist: Math.max(56, (ex.shot?.dist ?? THREE.MathUtils.clamp(size * 1.3 + 9, 12, 24)) * 1.35 * PULLBACK * 1.2), fov: ex.shot?.fov ?? 34,
          also: [head, centre], avoid: [[head, centre], [new THREE.Vector3(stand.x, origin.y + 1.6, stand.z), centre]] });
      })();
    this.exhibits.push({ id: ex.id, island, content, marker, hit, stand, face, shot, onOpen: ex.onOpen || null, markerBase: marker.position.y });
  }

  exhibit(id) { return this.exhibits.find((e) => e.id === id); }

  /** True if a world point is inside a brick of any built island. */
  occupiedAt(q) {
    for (const is of this.islands.values()) {
      const occ = is.ctx.occ; if (!occ) continue;
      const x = q.x - is.origin.x, y = q.y - is.origin.y, z = q.z - is.origin.z;
      const k = Math.floor(x) + ',' + Math.floor(y / PLATE) + ',' + Math.floor(z);
      if (occ.has(k) || is.ctx.camOcc?.has(k)) return true;
    }
    return false;
  }

  /** True if the segment a->b passes through bricks of any built island (occupancy ray march). */
  occluded(a, b, skipEnd = 1.6) {
    const d = b.clone().sub(a); const L = d.length(); d.divideScalar(L);
    const p = new THREE.Vector3();
    for (const is of this.islands.values()) {
      const occ = is.ctx.occ; if (!occ) continue;
      for (let t = 0.5; t < L - skipEnd; t += 0.4) {
        p.copy(a).addScaledVector(d, t).sub(is.origin);
        const k = Math.floor(p.x) + ',' + Math.floor(p.y / PLATE) + ',' + Math.floor(p.z);
        if (occ.has(k) || is.ctx.camOcc?.has(k)) return true;
      }
    }
    return false;
  }

  /**
   * Auto-framing: a camera that sees `subject` (and the points in `also`) from near the
   * preferred azimuth, trying wider angles and then a higher elevation until the view is clear.
   */
  frame(island, { subject, az, el = 0.35, dist = 15, fov = 34, also = [], spread = 80, avoid = [] }) {
    const look = subject.clone();
    const UP = new THREE.Vector3(0, 1, 0);
    const pose = (a, e, r) => new THREE.Vector3(look.x + r * Math.cos(e) * Math.sin(a), look.y + r * Math.sin(e), look.z + r * Math.cos(e) * Math.cos(a));
    const roomy = (pos) => {
      for (const [dx, dy, dz] of [[0, 0, 0], [2.2, 0, 0], [-2.2, 0, 0], [0, 0, 2.2], [0, 0, -2.2], [0, -2, 0], [0, 1.6, 0]]) {
        if (this.occupiedAt(pos.clone().add(new THREE.Vector3(dx, dy, dz)))) return false;
      }
      return true;
    };
    // Nothing big in front of the lens: sample the view frustum at several depths.
    const tanV = Math.tan((fov * DEG) / 2), tanH = tanV * 1.55;
    const coneClear = (pos) => {
      const f = look.clone().sub(pos); const L = f.length(); f.normalize();
      const r = new THREE.Vector3().crossVectors(f, UP).normalize();
      const u = new THREE.Vector3().crossVectors(r, f);
      const q = new THREE.Vector3();
      for (const d of [2, 3.5, 5, 7, 9.5, 12]) {
        if (d > L - 4) break;
        for (const sx of [-1.1, -0.8, -0.5, -0.2, 0.1, 0.4, 0.7, 1.0]) for (const sy of [-0.95, -0.55, -0.15, 0.25, 0.65]) {
          q.copy(pos).addScaledVector(f, d).addScaledVector(r, sx * tanH * d).addScaledVector(u, sy * tanV * d);
          if (this.occupiedAt(q)) return false;
        }
      }
      return true;
    };
    const offsets = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90].filter((o) => Math.abs(o) <= spread);
    const passes = [
      { e: el, need: also, cone: true }, { e: el + 10 * DEG, need: also, cone: true },
      { e: el, need: also.slice(0, 1), cone: true }, { e: el + 18 * DEG, need: [], cone: true },
      { e: el + 14 * DEG, need: [], cone: false }, { e: el + 28 * DEG, need: [], cone: false },
    ];
    for (const p of passes) {
      for (const off of offsets) {
        for (const r of [dist, dist * 1.2, dist * 0.9]) {
          const pos = pose(az + off * DEG, p.e, r);
          if (!roomy(pos)) continue;
          if (this.occluded(pos, look)) continue;
          if (p.need.some((q) => this.occluded(pos, q, 1.2))) continue;
          if (p.cone && !coneClear(pos)) continue;
          if (p.cone && avoid.some(([q, target]) => segDist(q, pos, target) < 1.7)) continue;
          return { pos, look, fov };
        }
      }
    }
    return { pos: pose(az, el + 30 * DEG, dist), look, fov };
  }

  _port(island, port) {
    const is = this.islands.get(island);
    const p = is.ctx.ports[port];
    const v = new THREE.Vector3(p[0], 0, p[1]).add(is.origin);
    v.y = is.origin.y + (p[2] || 0);
    return v;
  }

  _connect() {
    for (const [fa, pa, fb, pb, opts] of BRIDGES) {
      const key = fa + '>' + fb;
      if (this.bridges.find((b) => b.key === key)) continue;
      if (!this.islands.has(fa) || !this.islands.has(fb)) continue;
      if (!this.islands.get(fa).ctx.ports[pa] || !this.islands.get(fb).ctx.ports[pb]) { console.warn(`Bridge ${key}: missing port`); continue; }
      let a = this._port(fa, pa), b = this._port(fb, pb);
      // Both ends must land on walkable deck, or the figure cannot step on or off the bridge.
      const dir = new THREE.Vector3().subVectors(b, a).setY(0).normalize();
      const a2 = this.walk.landing(fa, a, dir.clone().negate()), b2 = this.walk.landing(fb, b, dir);
      a = a2; b = b2;
      const br = buildBridge(a, b, opts);
      this.scene.add(br.group);
      this.walk.addBridge({ id: key, a, b, width: br.width, steps: br.steps, sag: br.sag });
      this.bridges.push({ key, from: fa, to: fb, a, b, ...br });
    }
  }

  _rebuildJourney() {
    const beats = [];
    let start = null;
    for (let i = 0; i < ROUTE.length; i++) {
      const id = ROUTE[i];
      const is = this.islands.get(id);
      if (!is) break;
      const o = is.origin;
      const w = (p) => new THREE.Vector3(p[0], p.length > 2 ? p[1] : 0, p.length > 2 ? p[2] : p[1]).add(o);
      if (i > 0) {
        const prev = ROUTE[i - 1];
        const br = this.bridges.find((b) => b.from === prev && b.to === id);
        const travel = is.ctx.travelFrom?.(this);
        if (travel) beats.push(...travel);
        else if (br) beats.push(this._bridgeBeat(prev, id, br));
      }
      for (const b of is.ctx.beats) {
        const ex = b.exhibit ? this.exhibit(b.exhibit) : null;
        let shot = this._shotCache.get(id + ':' + b.id);
        if (shot) { /* cached */ }
        else if (b.cam?.subject) shot = this.frame(id, { subject: w(b.cam.subject), az: (b.cam.az ?? 0) * DEG, el: (b.cam.el ?? 20) * DEG, dist: back(b.cam.dist ?? 16), fov: b.cam.fov ?? 36, also: (b.cam.also || []).map(w) });
        else if (b.cam) shot = { pos: pushBack(w(b.cam.pos), w(b.cam.look)), look: w(b.cam.look), fov: b.cam.fov };
        else shot = ex.shot;
        this._shotCache.set(id + ':' + b.id, shot);
        const path = (b.char || []).map((c) => { const v = w(c); v.y = this._groundY(v); return v; });
        if (!start) start = path[0]?.clone() || o.clone();
        beats.push({
          id: id + ':' + b.id, island: id, len: b.len, shot, path,
          face: ex ? ex.face : (b.face ? w(b.face) : null), exhibit: b.exhibit || null, title: !!b.title, finale: !!b.finale, assemble: !!b.assemble,
          ride: b.ride || null,
        });
      }
    }
    if (!beats.length) return;
    this.journey = new Journey(beats, start);
  }

  _bridgeBeat(from, to, br) {
    // Bridges hang in open air, so a side view from outside the ring has nothing in the way.
    const mid = new THREE.Vector3().lerpVectors(br.a, br.b, 0.5);
    const dir = new THREE.Vector3().subVectors(br.b, br.a).setY(0).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const ringC = new THREE.Vector3(0, 0, -45);
    if (perp.dot(new THREE.Vector3().subVectors(mid, ringC)) < 0) perp.negate();
    const L = br.a.distanceTo(br.b);
    const pos = mid.clone().addScaledVector(perp, (L * 1.3 + 14) * 1.5).addScaledVector(dir, -L * 0.15).add(new THREE.Vector3(0, (10 + L * 0.2) * 1.5, 0));
    const look = mid.clone().addScaledVector(dir, L * 0.12).add(new THREE.Vector3(0, 1.5, 0));
    const inward = this.islands.get(to).origin.clone().sub(br.b).setY(0).normalize();
    const path = br.points.map((p) => p.clone());
    const after = br.b.clone().addScaledVector(inward, 2.5); after.y = this._groundY(after);
    path.push(after);
    return { id: from + '>' + to, island: from, len: 1.5, shot: { pos, look, fov: 36 }, path, face: null, travel: true };
  }

  _groundY(v) {
    const g = this.walk.ground(v.x, v.z, null);
    return g ? g.y : v.y;
  }

  /** Assign the light pool to the anchors nearest the focus point. */
  updateLights(focus) {
    if (!this.pool.length) return;
    const ranked = this.lightAnchors
      .map((a) => ({ a, d: a.pos.distanceToSquared(focus) / (a.power + 0.2) }))
      .sort((x, y) => x.d - y.d);
    for (let i = 0; i < this.pool.length; i++) {
      const l = this.pool[i], r = ranked[i];
      if (!r) { l.intensity = 0; continue; }
      l.position.copy(r.a.pos);
      l.color.setHex(r.a.color);
      const fade = THREE.MathUtils.clamp(1 - Math.sqrt(r.a.pos.distanceToSquared(focus)) / 70, 0, 1);
      l.intensity = 14 * r.a.power * fade;
    }
  }

  update(t, dt, w) {
    for (const is of this.islands.values()) {
      const ar = is.group.userData.arrive;
      if (ar && ar.t < 1) {
        ar.t = Math.min(1, ar.t + dt * 1.6);
        const k = Math.floor(ar.t * 6) / 6; // held frames
        is.group.position.y = is.origin.y + (1 - k) * (1 - k) * 6;
        if (ar.t >= 1) is.group.position.y = is.origin.y;
      }
      is.ctx.update?.(t, dt, w);
    }
  }
}

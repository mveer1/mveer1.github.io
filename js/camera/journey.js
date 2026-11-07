// The authored journey: a list of beats, each with a scroll length (in screens),
// a camera shot and figure waypoints. Scroll position s (screens) maps to:
//   - a camera pose: travel to the beat's shot in the first 60% of the beat, hold for the rest;
//   - a figure position: walk the beat's waypoints in the first 60%, then stand.
import * as THREE from 'three';
import { smooth } from '../core/stepped.js';

const TRAVEL = 0.6;
// The title beat used to hold a fixed camera for its whole 1.4 screens, so scrolling the hero showed
// nothing moving. Now the camera already covers this share of the way to the first stop during the
// title beat (fast at first, easing out), and the next beat's travel carries on from there.
const HERO_DRIFT = 0.3;
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

/** Camera pose in orbit form: look target + spherical offset. */
export function toOrbit(pos, look, fov) {
  const o = new THREE.Vector3().subVectors(pos, look);
  const r = o.length();
  return { look: look.clone(), r, az: Math.atan2(o.x, o.z), el: Math.asin(THREE.MathUtils.clamp(o.y / r, -1, 1)), fov };
}

export function fromOrbit(o, outPos) {
  const ce = Math.cos(o.el);
  outPos.set(o.look.x + o.r * ce * Math.sin(o.az), o.look.y + o.r * Math.sin(o.el), o.look.z + o.r * ce * Math.cos(o.az));
  return outPos;
}

export function lerpOrbit(a, b, t, out = {}) {
  let daz = b.az - a.az;
  while (daz > Math.PI) daz -= Math.PI * 2;
  while (daz < -Math.PI) daz += Math.PI * 2;
  out.look = (out.look || new THREE.Vector3()).lerpVectors(a.look, b.look, t);
  out.r = Math.exp(Math.log(a.r) + (Math.log(b.r) - Math.log(a.r)) * t);
  out.az = a.az + daz * t;
  out.el = a.el + (b.el - a.el) * t;
  out.fov = a.fov + (b.fov - a.fov) * t;
  return out;
}

export class Journey {
  /**
   * beats: [{ id, island, len, shot: { pos: V3, look: V3, fov }, path: [V3...], face: V3|null, exhibit, title, assemble }]
   * start: V3 initial figure position
   */
  constructor(beats, start) {
    this.beats = [];
    let s = 0;
    let last = start.clone();
    for (const b of beats) {
      const path = [last.clone(), ...b.path.map((p) => p.clone())];
      // polyline lengths
      let L = 0; const seg = [];
      for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z); seg.push(d); L += d; }
      const beat = { ...b, s0: s, s1: s + b.len, path, seg, L, orbit: toOrbit(b.shot.pos, b.shot.look, b.shot.fov || 36) };
      this.beats.push(beat);
      s += b.len;
      last = path[path.length - 1];
    }
    this.length = s;
    // Precompute a table of figure positions for nearest-point lookups.
    this.table = [];
    for (let i = 0; i <= 600; i++) { const ss = (i / 600) * this.length; this.table.push({ s: ss, p: this.figureAt(ss).pos.clone() }); }
  }

  beatIndex(s) {
    const B = this.beats;
    if (s <= 0) return 0;
    for (let i = 0; i < B.length; i++) if (s < B[i].s1) return i;
    return B.length - 1;
  }

  /** Camera pose at s (orbit form). */
  cameraAt(s, out = {}) {
    s = Math.max(0, Math.min(this.length, s));
    const i = this.beatIndex(s), b = this.beats[i];
    const prev = this.beats[Math.max(0, i - 1)];
    const local = (s - b.s0) / b.len;
    if (i === 0) {
      const next = this.beats[1];
      if (b.title && next) return lerpOrbit(b.orbit, next.orbit, HERO_DRIFT * easeOutQuad(local), out);
      return lerpOrbit(b.orbit, b.orbit, 0, out);
    }
    if (local >= TRAVEL) return lerpOrbit(b.orbit, b.orbit, 0, out);
    const from = prev.title ? HERO_DRIFT : 0;
    const t = from + (1 - from) * smoother(local / TRAVEL);
    return lerpOrbit(prev.orbit, b.orbit, t, out);
  }

  /** Figure position and state at s. */
  figureAt(s) {
    s = Math.max(0, Math.min(this.length, s));
    const i = this.beatIndex(s), b = this.beats[i];
    const local = (s - b.s0) / b.len;
    const res = { pos: new THREE.Vector3(), dir: null, moving: false, beat: b, index: i };
    if (b.L < 1e-3 || local >= TRAVEL) {
      res.pos.copy(b.path[b.path.length - 1]);
      res.face = b.face || null;
      return res;
    }
    let dist = smooth(Math.min(1, local / TRAVEL)) * 0 + (local / TRAVEL) * b.L; // constant walking speed
    for (let k = 0; k < b.seg.length; k++) {
      if (dist <= b.seg[k] || k === b.seg.length - 1) {
        const t = b.seg[k] > 0 ? Math.min(1, dist / b.seg[k]) : 1;
        res.pos.lerpVectors(b.path[k], b.path[k + 1], t);
        res.dir = new THREE.Vector3().subVectors(b.path[k + 1], b.path[k]).setY(0).normalize();
        res.moving = true;
        break;
      }
      dist -= b.seg[k];
    }
    return res;
  }

  /** Progress 0..1 through a beat (whole beat), or null if s is outside it. */
  progressIn(beatId, s) {
    const b = this.beats.find((x) => x.id === beatId);
    if (!b || s < b.s0 || s > b.s1) return null;
    return (s - b.s0) / b.len;
  }

  find(beatId) { return this.beats.find((x) => x.id === beatId); }

  /** s where the figure is nearest to point p (optionally on the same island). */
  nearestS(p, island = null) {
    let best = 0, bd = Infinity;
    for (const row of this.table) {
      if (island) {
        const b = this.beats[this.beatIndex(row.s)];
        if (b.island !== island) continue;
      }
      const d = (row.p.x - p.x) ** 2 + (row.p.z - p.z) ** 2 + ((row.p.y - p.y) * 0.5) ** 2;
      if (d < bd) { bd = d; best = row.s; }
    }
    // land on the hold part of that beat, so the camera and figure are at rest
    const b = this.beats[this.beatIndex(best)];
    return Math.min(b.s1 - 0.02, Math.max(best, b.s0 + b.len * (TRAVEL + 0.05)));
  }

  /** Resting s for a beat (middle of its hold). */
  restS(beat) { return beat.s0 + beat.len * (TRAVEL + 0.2); }
}

// Procedural LEGO part library.
//
// Every part is generated from a few numbers and cached by key. Geometry is kept as
// raw, non-indexed Float32Arrays (position + normal) so the builder can merge
// thousands of parts per island into one draw call without BufferGeometry overhead.
//
// Local frame of a part: footprint spans x in [0, w], z in [0, d], y from 0 up.
// `studs` lists stud centres (local) on the top surface; the builder decides
// which ones are visible.
import * as THREE from 'three';
import { ShapeUtils } from 'three';
import { PLATE, STUD_R, STUD_H, GAP, CHAMFER } from './dims.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();

/** Growable float buffer. */
class Buf {
  constructor() { this.a = new Float32Array(1024); this.n = 0; }
  push3(x, y, z) {
    if (this.n + 3 > this.a.length) { const b = new Float32Array(this.a.length * 2); b.set(this.a); this.a = b; }
    this.a[this.n++] = x; this.a[this.n++] = y; this.a[this.n++] = z;
  }
  done() { return this.a.slice(0, this.n); }
}

/** Raw geometry under construction. */
class Raw {
  constructor() { this.P = new Buf(); this.N = new Buf(); }
  /** Convex polygon, flat shaded, wound to face `out`. */
  poly(pts, out) {
    _a.set(...pts[1]).sub(_b.set(...pts[0]));
    _c.set(...pts[2]).sub(_b);
    const n = _a.clone().cross(_c);
    if (n.lengthSq() < 1e-14) return; // degenerate (duplicate profile points)
    n.normalize();
    let p = pts;
    if (n.dot(out) < 0) { p = pts.slice().reverse(); n.negate(); }
    for (let i = 1; i < p.length - 1; i++) {
      this.tri(p[0], p[i], p[i + 1], n);
    }
  }
  tri(a, b, c, n) {
    this.P.push3(...a); this.P.push3(...b); this.P.push3(...c);
    for (let k = 0; k < 3; k++) this.N.push3(n.x, n.y, n.z);
  }
  /** Triangle with per-vertex normals. */
  triN(a, b, c, na, nb, nc) {
    this.P.push3(...a); this.P.push3(...b); this.P.push3(...c);
    this.N.push3(...na); this.N.push3(...nb); this.N.push3(...nc);
  }
  done() { return { p: this.P.done(), n: this.N.done() }; }
}

/** Append a centred chamfered box to `raw`, offset by (ox, oy, oz). */
function chamferBoxInto(raw, w, h, d, c, ox = 0, oy = 0, oz = 0, skipBottom = false) {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  c = Math.min(c, hw * 0.45, hh * 0.45, hd * 0.45);
  const P = (sx, sy, sz, axis) => {
    if (axis === 0) return [ox + sx * hw, oy + sy * (hh - c), oz + sz * (hd - c)];
    if (axis === 1) return [ox + sx * (hw - c), oy + sy * hh, oz + sz * (hd - c)];
    return [ox + sx * (hw - c), oy + sy * (hh - c), oz + sz * hd];
  };
  const out = new THREE.Vector3();
  // Main faces
  for (let axis = 0; axis < 3; axis++) {
    for (const s of [-1, 1]) {
      if (skipBottom && axis === 1 && s === -1) continue;
      const pts = [];
      const cyc = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [u, v] of cyc) {
        const sg = [0, 0, 0]; sg[axis] = s;
        const o = [0, 1, 2].filter((k) => k !== axis);
        sg[o[0]] = u; sg[o[1]] = v;
        pts.push(P(sg[0], sg[1], sg[2], axis));
      }
      out.set(0, 0, 0).setComponent(axis, s);
      raw.poly(pts, out);
    }
  }
  // Edge chamfers
  for (let a = 0; a < 3; a++) {
    for (let b = a + 1; b < 3; b++) {
      const cAxis = 3 - a - b;
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) {
        if (skipBottom && ((a === 1 && sa === -1) || (b === 1 && sb === -1))) continue;
        const mk = (sc, axis) => { const sg = [0, 0, 0]; sg[a] = sa; sg[b] = sb; sg[cAxis] = sc; return P(sg[0], sg[1], sg[2], axis); };
        const pts = [mk(-1, a), mk(1, a), mk(1, b), mk(-1, b)];
        out.set(0, 0, 0).setComponent(a, sa).setComponent(b, sb);
        raw.poly(pts, out);
      }
    }
  }
  // Corners
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    if (skipBottom && sy === -1) continue;
    raw.poly([P(sx, sy, sz, 0), P(sx, sy, sz, 1), P(sx, sy, sz, 2)], out.set(sx, sy, sz));
  }
}

/** Prism from a simple polygon profile in (z, y), extruded along x from x0 to x1. */
function prismInto(raw, profile, x0, x1) {
  // Orientation of profile (signed area in z-y plane)
  let area = 0;
  for (let i = 0; i < profile.length; i++) {
    const [z0, y0] = profile[i], [z1, y1] = profile[(i + 1) % profile.length];
    area += z0 * y1 - z1 * y0;
  }
  const ccw = area > 0;
  // Caps
  const contour = profile.map(([z, y]) => new THREE.Vector2(z, y));
  const tris = ShapeUtils.triangulateShape(contour, []);
  for (const [xc, nx] of [[x0, -1], [x1, 1]]) {
    const n = new THREE.Vector3(nx, 0, 0);
    for (const t of tris) {
      const pts = t.map((i) => [xc, profile[i][1], profile[i][0]]);
      raw.poly(pts, n);
    }
  }
  // Sides
  for (let i = 0; i < profile.length; i++) {
    const [z0, y0] = profile[i], [z1, y1] = profile[(i + 1) % profile.length];
    const ez = z1 - z0, ey = y1 - y0;
    // outward normal in (z,y): for CCW polygon, outward = (ey, -ez)
    let nz = ey, ny = -ez;
    if (!ccw) { nz = -nz; ny = -ny; }
    const out = new THREE.Vector3(0, ny, nz).normalize();
    raw.poly([[x0, y0, z0], [x1, y0, z0], [x1, y1, z1], [x0, y1, z1]], out);
  }
}

/**
 * Lathe around the y axis with smooth normals across segments.
 * profile: [[r, y], ...] from bottom to top. `hard` lists profile indices where the
 * normal should not be smoothed along the profile (a crisp crease).
 */
function latheInto(raw, profile, segs, ox = 0, oy = 0, oz = 0, hard = []) {
  // Profile normals per segment
  const segN = [];
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i], [r1, y1] = profile[i + 1];
    const dr = r1 - r0, dy = y1 - y0;
    const l = Math.hypot(dr, dy) || 1;
    segN.push([dy / l, -dr / l]); // (radial, y)
  }
  const vN = (i, side) => {
    // side: 0 = belongs to segment i-1 end, 1 = segment i start
    if (hard.includes(i)) return side === 0 ? segN[i - 1] : segN[i];
    const a = segN[i - 1], b = segN[i];
    if (!a) return b; if (!b) return a;
    const r = a[0] + b[0], y = a[1] + b[1]; const l = Math.hypot(r, y) || 1;
    return [r / l, y / l];
  };
  for (let s = 0; s < segs; s++) {
    const t0 = (s / segs) * Math.PI * 2, t1 = ((s + 1) / segs) * Math.PI * 2;
    const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    for (let i = 0; i < profile.length - 1; i++) {
      const [ra, ya] = profile[i], [rb, yb] = profile[i + 1];
      const na = vN(i, 1), nb = vN(i + 1, 0);
      const A0 = [ox + ra * s0, oy + ya, oz + ra * c0], A1 = [ox + ra * s1, oy + ya, oz + ra * c1];
      const B0 = [ox + rb * s0, oy + yb, oz + rb * c0], B1 = [ox + rb * s1, oy + yb, oz + rb * c1];
      const nA0 = [na[0] * s0, na[1], na[0] * c0], nA1 = [na[0] * s1, na[1], na[0] * c1];
      const nB0 = [nb[0] * s0, nb[1], nb[0] * c0], nB1 = [nb[0] * s1, nb[1], nb[0] * c1];
      if (ra > 1e-5) raw.triN(A0, A1, B1, nA0, nA1, nB1);
      if (rb > 1e-5) raw.triN(A0, B1, B0, nA0, nB1, nB0);
    }
  }
}


/** Swap two coordinate axes of a raw geometry. Swapping is a reflection, so the
 *  winding of every triangle is reversed too, or back faces would render. */
function swapAxes(g, a, b) {
  for (let i = 0; i < g.p.length; i += 3) {
    let t = g.p[i + a]; g.p[i + a] = g.p[i + b]; g.p[i + b] = t;
    t = g.n[i + a]; g.n[i + a] = g.n[i + b]; g.n[i + b] = t;
  }
  for (let i = 0; i < g.p.length; i += 9) {
    for (const arr of [g.p, g.n]) for (let k = 0; k < 3; k++) {
      const t = arr[i + 3 + k]; arr[i + 3 + k] = arr[i + 6 + k]; arr[i + 6 + k] = t;
    }
  }
  return g;
}

// ---------------------------------------------------------------------------
// Stud
let STUD_SEGS = 14;
export function setDetail(level) {
  // level: 2 high, 1 medium, 0 low
  STUD_SEGS = level >= 2 ? 16 : level === 1 ? 12 : 8;
  cache.clear();
}

function studRaw() {
  const raw = new Raw();
  const b = 0.045;
  latheInto(raw, [[STUD_R, 0], [STUD_R, STUD_H - b], [STUD_R - b * 0.35, STUD_H - b * 0.3], [STUD_R - b, STUD_H], [0, STUD_H]], STUD_SEGS, 0, 0, 0, [0]);
  return raw.done();
}

// ---------------------------------------------------------------------------
const cache = new Map();

function gridStuds(w, d, topY, inset = 0) {
  const s = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) s.push([i + 0.5, topY, j + 0.5]);
  return s;
}

const DEF = {
  /** Rectangular brick or plate; h in plates. */
  brick(w, d, h) {
    const raw = new Raw();
    const H = h * PLATE;
    chamferBoxInto(raw, w - 2 * GAP, H - GAP, d - 2 * GAP, CHAMFER, w / 2, (H - GAP) / 2, d / 2);
    return { geo: raw.done(), studs: gridStuds(w, d, H - GAP), foot: [w, d, h] };
  },
  /** Smooth tile: no studs. */
  tile(w, d, h = 1) {
    const r = DEF.brick(w, d, h);
    return { ...r, studs: [] };
  },
  /** 45° (or steeper) slope descending toward +z. `flat` stud rows at the back. */
  slope(w, d, h, flat = 1) {
    const raw = new Raw();
    const H = h * PLATE - GAP, D = d - 2 * GAP, lip = Math.min(0.2, H * 0.2);
    const z0 = GAP, z1 = GAP + D;
    const zf = Math.min(z0 + flat, z1 - 0.2);
    prismInto(raw, [[z0, 0], [z1, 0], [z1, lip], [zf, H], [z0, H]], GAP, w - GAP);
    const studs = [];
    for (let i = 0; i < w; i++) for (let j = 0; j < flat; j++) studs.push([i + 0.5, H, j + 0.5]);
    return { geo: raw.done(), studs, foot: [w, d, h] };
  },
  /** Inverted slope (overhang), widening toward the top at +z. */
  slopeInv(w, d, h) {
    const raw = new Raw();
    const H = h * PLATE - GAP, D = d - 2 * GAP, lip = Math.min(0.2, H * 0.25);
    prismInto(raw, [[GAP, 0], [GAP + 1 - 2 * GAP, 0], [GAP + D, H - lip], [GAP + D, H], [GAP, H]], GAP, w - GAP);
    return { geo: raw.done(), studs: gridStuds(w, d, H), foot: [w, d, h] };
  },
  /** Round brick / plate of diameter dia (1 or 2). */
  round(dia, h) {
    const raw = new Raw();
    const r = dia / 2 - GAP, H = h * PLATE - GAP, c = 0.03;
    latheInto(raw, [[0, 0], [r - c, 0], [r, c], [r, H - c], [r - c, H], [0, H]], dia === 1 ? STUD_SEGS + 2 : STUD_SEGS + 8, dia / 2, 0, dia / 2, [1, 4]);
    const studs = dia === 1 ? [[0.5, H, 0.5]] : gridStuds(dia, dia, H);
    return { geo: raw.done(), studs, foot: [dia, dia, h] };
  },
  /** Round tile without stud. */
  roundTile(dia, h = 1) {
    const r = DEF.round(dia, h);
    return { ...r, studs: [] };
  },
  /** 1x1 cone (truncated), stud on top. */
  cone(dia = 1, h = 3) {
    const raw = new Raw();
    const r0 = dia / 2 - GAP, H = h * PLATE - GAP, rt = dia === 1 ? 0.3 : 0.55;
    latheInto(raw, [[0, 0], [r0, 0], [r0, 0.12], [rt, H], [0, H]], STUD_SEGS + 4, dia / 2, 0, dia / 2, [1, 2, 3]);
    return { geo: raw.done(), studs: [[dia / 2, H, dia / 2]], foot: [dia, dia, h] };
  },
  /** Arch brick w x 1 (opening along x), h in plates. */
  arch(w, h) {
    const raw = new Raw();
    const H = h * PLATE - GAP, top = Math.min(PLATE * 1.5, H * 0.3);
    const pts = [];
    const rOpen = (w - 2) / 2; // leaves 1-stud legs
    const cx = w / 2, sy = H - top - rOpen; // spring line
    // Profile in (x, y) — we build as prism along z, so map to (z,y) and rotate later.
    pts.push([GAP, 0], [1, 0]);
    const N = 10;
    for (let i = 0; i <= N; i++) {
      const a = Math.PI - (i / N) * Math.PI;
      pts.push([cx + Math.cos(a) * rOpen, Math.max(0, sy) + Math.sin(a) * rOpen]);
    }
    pts.push([w - 1, 0], [w - GAP, 0], [w - GAP, H], [GAP, H]);
    // prismInto extrudes along x with profile (z, y); we want profile along x, extruded along z.
    const tmp = new Raw();
    prismInto(tmp, pts, GAP, 1 - GAP);
    const g = swapAxes(tmp.done(), 0, 2);
    return { geo: g, studs: gridStuds(w, 1, H), foot: [w, 1, h] };
  },
  /** Window frame w x 1 x h plates with a rectangular opening. */
  window(w, h) {
    const raw = new Raw();
    const H = h * PLATE - GAP, f = 0.16, D = 1 - 2 * GAP;
    // four bars around the opening
    chamferBoxInto(raw, w - 2 * GAP, f, D, 0.02, w / 2, f / 2, 0.5);
    chamferBoxInto(raw, w - 2 * GAP, f, D, 0.02, w / 2, H - f / 2, 0.5);
    chamferBoxInto(raw, f, H - 2 * f, D, 0.02, GAP + f / 2, H / 2, 0.5);
    chamferBoxInto(raw, f, H - 2 * f, D, 0.02, w - GAP - f / 2, H / 2, 0.5);
    if (w >= 2) chamferBoxInto(raw, f * 0.6, H - 2 * f, 0.18, 0.01, w / 2, H / 2, 0.5); // mullion
    if (h >= 6) chamferBoxInto(raw, w - 2 * f, f * 0.6, 0.18, 0.01, w / 2, H / 2, 0.5);
    return { geo: raw.done(), studs: gridStuds(w, 1, H), foot: [w, 1, h] };
  },
  /** Glass pane for a window frame. */
  pane(w, h) {
    const raw = new Raw();
    const H = h * PLATE - GAP;
    chamferBoxInto(raw, w - 0.3, H - 0.3, 0.06, 0.005, w / 2, H / 2, 0.5);
    return { geo: raw.done(), studs: [], foot: [w, 1, h] };
  },
  /** Thin vertical bar (pole), centred on a 1x1 cell. len in world units. */
  bar(len, r = 0.16) {
    const raw = new Raw();
    latheInto(raw, [[0, 0], [r, 0], [r, len], [0, len]], 10, 0.5, 0, 0.5, [1, 2]);
    return { geo: raw.done(), studs: [], foot: [1, 1, Math.max(1, Math.round(len / PLATE))] };
  },
  /** Generic cylinder, centred on its footprint. */
  cyl(r, len, segs = 18) {
    const raw = new Raw();
    const c = Math.min(0.03, r * 0.2);
    latheInto(raw, [[0, 0], [r - c, 0], [r, c], [r, len - c], [r - c, len], [0, len]], segs, r, 0, r, [1, 4]);
    return { geo: raw.done(), studs: [], foot: [Math.ceil(r * 2), Math.ceil(r * 2), Math.max(1, Math.round(len / PLATE))] };
  },
  /** Technic-style gear in the x-y plane, centred at origin, thickness along z. */
  gear(teeth, thick = 0.5) {
    const raw = new Raw();
    const R = teeth * 0.08 + 0.15, tooth = 0.16;
    const pts = [];
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2, step = (Math.PI * 2) / teeth;
      for (const [f, rr] of [[0, R], [0.18, R + tooth], [0.5, R + tooth], [0.68, R]]) {
        const a = a0 + f * step;
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
    }
    const tmp = new Raw();
    prismInto(tmp, pts, -thick / 2, thick / 2);
    // prism built with profile (z,y) along x; swap so the gear faces +z
    const g = swapAxes(tmp.done(), 0, 2);
    // hub
    const hub = new Raw();
    latheInto(hub, [[0, -thick * 0.7], [0.22, -thick * 0.7], [0.22, thick * 0.7], [0, thick * 0.7]], 12, 0, 0, 0, [1, 2]);
    const h = swapAxes(hub.done(), 1, 2); // lathe axis y -> z
    return { geo: concat(g, h), studs: [], foot: [1, 1, 1], radius: R + tooth };
  },
  /** Radar / satellite dish, concave up, centred on its footprint. */
  dish(dia) {
    const raw = new Raw();
    const r = dia / 2 - GAP;
    const prof = [];
    const N = 8;
    for (let i = 0; i <= N; i++) { const t = i / N; prof.push([t * r, 0.12 + t * t * r * 0.45]); }
    // underside + rim (outer surface), then inner concave going back
    const outer = [[0, 0], [r * 0.35, 0.02], ...prof.slice(2).map(([rr, y]) => [rr, y - 0.08])];
    const rim = [[r, prof[N][1] - 0.08], [r, prof[N][1]]];
    const inner = prof.slice().reverse();
    latheInto(raw, [...outer, ...rim, ...inner.slice(1)], STUD_SEGS + 10, dia / 2, 0, dia / 2, [outer.length - 1, outer.length]);
    return { geo: raw.done(), studs: [], foot: [dia, dia, 1] };
  },
  /** Plant leaf piece: a flat, pointed blade, lying in x-z, base at origin, pointing +x. */
  leaf(len = 1.6, wid = 0.7) {
    const raw = new Raw();
    const pts = [[0, -0.12], [len * 0.35, -wid / 2], [len * 0.8, -wid * 0.28], [len, 0], [len * 0.8, wid * 0.28], [len * 0.35, wid / 2], [0, 0.12]];
    const tmp = new Raw();
    prismInto(tmp, pts.map(([x, z]) => [z, x]), -0.04, 0.04);
    // prism: profile (z, y=x) along x; swap x<->y so the blade lies flat
    const g = swapAxes(tmp.done(), 0, 1);
    return { geo: g, studs: [], foot: [1, 1, 1] };
  },
  /** Layer of a brick-built pine tree: a short wide cone. */
  pineLayer(r, h = 1.0) {
    const raw = new Raw();
    latheInto(raw, [[0, 0], [r, 0.05], [r * 0.92, 0.22], [r * 0.25, h], [0, h]], 10, 0, 0, 0, [1, 2]);
    return { geo: raw.done(), studs: [], foot: [1, 1, 1] };
  },
  /** 1x1 flower plate: five petals around a stud. */
  flower() {
    const raw = new Raw();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      chamferBoxInto(raw, 0.28, PLATE * 0.6, 0.28, 0.04, 0.5 + Math.cos(a) * 0.22, PLATE * 0.3, 0.5 + Math.sin(a) * 0.22);
    }
    return { geo: raw.done(), studs: [[0.5, PLATE * 0.6, 0.5]], foot: [1, 1, 1] };
  },
  /** Free box (not grid-snapped), centred at origin. */
  box(w, h, d, c = 0.02) {
    const raw = new Raw();
    chamferBoxInto(raw, w, h, d, c, 0, 0, 0);
    return { geo: raw.done(), studs: [], foot: [1, 1, 1] };
  },
};

function concat(a, b) {
  const p = new Float32Array(a.p.length + b.p.length); p.set(a.p); p.set(b.p, a.p.length);
  const n = new Float32Array(a.n.length + b.n.length); n.set(a.n); n.set(b.n, a.n.length);
  return { p, n };
}

/** Get (and cache) a part by type and parameters. */
export function part(type, ...args) {
  const key = type + ':' + args.join(':');
  let p = cache.get(key);
  if (!p) {
    const fn = DEF[type];
    if (!fn) throw new Error(`Unknown part type: ${type}`);
    p = fn(...args);
    p.key = key;
    cache.set(key, p);
  }
  return p;
}

let studCache = null;
export function stud() {
  if (!studCache || studCache.segs !== STUD_SEGS) studCache = { geo: studRaw(), segs: STUD_SEGS };
  return studCache.geo;
}

/** Convert a raw geometry (plus optional studs) into a BufferGeometry. */
export function toBufferGeometry(raw, withStuds = null) {
  let g = raw;
  if (withStuds && withStuds.length) {
    const s = stud();
    const total = raw.p.length + s.p.length * withStuds.length;
    const p = new Float32Array(total), n = new Float32Array(total);
    p.set(raw.p); n.set(raw.n);
    let o = raw.p.length;
    for (const [x, y, z] of withStuds) {
      for (let i = 0; i < s.p.length; i += 3) {
        p[o + i] = s.p[i] + x; p[o + i + 1] = s.p[i + 1] + y; p[o + i + 2] = s.p[i + 2] + z;
        n[o + i] = s.n[i]; n[o + i + 1] = s.n[i + 1]; n[o + i + 2] = s.n[i + 2];
      }
      o += s.p.length;
    }
    g = { p, n };
  }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(g.p, 3));
  bg.setAttribute('normal', new THREE.BufferAttribute(g.n, 3));
  bg.computeBoundingSphere();
  return bg;
}

export const _internal = { Raw, chamferBoxInto, latheInto, prismInto, concat, swapAxes };

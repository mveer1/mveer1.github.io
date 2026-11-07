// BrickBuilder: place parts on the stud grid, then merge everything into one mesh
// per material class (plastic, trans, glow, metal).
//
// Coordinates: x, z in studs; y in plates. All relative to the builder's origin,
// which is wherever the returned group is placed.
//
//   const b = new BrickBuilder({ seed: 7 });
//   b.brick(0, 0, 0, 2, 4, 3, 'red');          // a 2x4 brick
//   b.slope(0, 3, 0, 2, 2, 3, 'sandGreen', 2); // a slope rotated 180°
//   const { group } = b.build();
import * as THREE from 'three';
import { part, stud } from './parts.js';
import { PLATE } from './dims.js';
import { col } from './palette.js';
import { mat } from './materials.js';

export function rng(seed = 1) {
  let a = seed >>> 0;
  const f = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.range = (lo, hi) => lo + f() * (hi - lo);
  f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.chance = (p) => f() < p;
  return f;
}

const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4();
const _col = new THREE.Color(), _hsl = { h: 0, s: 0, l: 0 };

export class BrickBuilder {
  constructor({ seed = 1, jitter = 1, colorJitter = 0.022 } = {}) {
    this.rand = rng(seed);
    this.jitter = jitter;
    this.colorJitter = colorJitter;
    this.items = [];
    this.occ = new Set();
    this.camOcc = new Set(); // camera-only volumes (foliage, lamp glow); never hides studs
  }

  _key(x, y, z) { return x + ',' + y + ',' + z; }
  occupied(x, y, z) { return this.occ.has(this._key(x, y, z)); }

  /**
   * Place a grid part. rot: quarter turns about +y.
   * opts: { rot, studs (bool), occ (bool, mark occupancy), lift (extra y in world units) }
   */
  put(type, args, x, y, z, color, opts = {}) {
    const p = part(type, ...args);
    const rot = ((opts.rot || 0) % 4 + 4) % 4;
    const [w, d, h] = p.foot;
    const W = rot % 2 ? d : w, D = rot % 2 ? w : d;
    const j = this.jitter;
    const jx = j ? this.rand.range(-0.009, 0.009) : 0, jz = j ? this.rand.range(-0.009, 0.009) : 0;
    const ja = j ? this.rand.range(-0.004, 0.004) : 0;
    _t.makeTranslation(-w / 2, 0, -d / 2);
    _r.makeRotationY(rot * Math.PI / 2 + ja);
    _m.makeTranslation(x + W / 2 + jx, y * PLATE + (opts.lift || 0), z + D / 2 + jz).multiply(_r).multiply(_t);
    const item = this._item(p, _m.clone(), color, opts.studs !== false);
    item.top = y + h; item.cell = [x, z, W, D];
    if (opts.occ !== false) {
      for (let i = 0; i < W; i++) for (let k = 0; k < D; k++) for (let l = y; l < y + h; l++) this.occ.add(this._key(x + i, l, z + k));
    }
    return item;
  }

  /** Place a part with an arbitrary matrix (not on the grid, no occupancy). */
  free(type, args, matrix, color, opts = {}) {
    const p = part(type, ...args);
    const item = this._item(p, matrix.clone(), color, !!opts.studs);
    item.free = true;
    return item;
  }

  _item(p, m, color, studs) {
    const c = col(color);
    _col.setHex(c.hex);
    if (this.colorJitter && c.cls !== 'glow') {
      _col.getHSL(_hsl);
      _col.setHSL(_hsl.h, _hsl.s, Math.min(1, Math.max(0, _hsl.l * (1 + this.rand.range(-this.colorJitter, this.colorJitter)))));
    }
    if (c.cls === 'glow') _col.multiplyScalar(c.power || 2.5);
    const item = { p, m, color: _col.clone(), cls: c.cls || 'plastic', studs };
    this.items.push(item);
    return item;
  }

  // Convenience wrappers --------------------------------------------------
  brick(x, y, z, w, d, h, color, opts) { return this.put('brick', [w, d, h], x, y, z, color, opts); }
  plate(x, y, z, w, d, color, opts) { return this.put('brick', [w, d, 1], x, y, z, color, opts); }
  tile(x, y, z, w, d, color, opts) { return this.put('tile', [w, d, 1], x, y, z, color, opts); }
  slope(x, y, z, w, d, h, color, rot = 0, flat = 1, opts = {}) { return this.put('slope', [w, d, h, flat], x, y, z, color, { ...opts, rot }); }
  round(x, y, z, dia, h, color, opts) { return this.put('round', [dia, h], x, y, z, color, opts); }
  cone(x, y, z, color, opts) { return this.put('cone', [1, 3], x, y, z, color, opts); }

  /** Fill a rectangle with bricks in running bond. Height h plates. */
  wall(x, y, z, len, axis, h, color, opts = {}) {
    // axis 'x' runs along +x; 'z' along +z. Courses of one brick (3 plates).
    const courses = Math.round(h / 3);
    for (let c = 0; c < courses; c++) {
      let pos = 0;
      const offset = c % 2 ? 1 : 0;
      const sizes = [];
      if (offset && len > 2) { sizes.push(1); pos = 1; }
      while (pos < len) {
        const remain = len - pos;
        const s = remain >= 4 ? (this.rand.chance(0.6) ? 4 : (remain >= 6 && this.rand.chance(0.5) ? 6 : 2)) : remain;
        sizes.push(Math.min(s, remain)); pos += Math.min(s, remain);
      }
      let p = 0;
      for (const s of sizes) {
        const cc = typeof color === 'function' ? color(c, p) : color;
        if (axis === 'x') this.brick(x + p, y + c * 3, z, s, 1, 3, cc, opts);
        else this.brick(x, y + c * 3, z + p, 1, s, 3, cc, opts);
        p += s;
      }
    }
  }

  /** Tile a rectangle with plates of random sizes (studs on top). */
  fillPlates(x, y, z, w, d, color, opts = {}) {
    const sizes = opts.sizes || [[4, 2], [2, 4], [2, 2], [3, 2], [2, 3], [4, 1], [1, 4], [2, 1], [1, 2], [1, 1]];
    const done = new Set();
    for (let k = 0; k < d; k++) for (let i = 0; i < w; i++) {
      if (done.has(i + ',' + k)) continue;
      const order = sizes.slice().sort(() => this.rand() - 0.5);
      for (const [sw, sd] of order) {
        if (i + sw > w || k + sd > d) continue;
        let ok = true;
        for (let a = 0; a < sw && ok; a++) for (let b = 0; b < sd; b++) if (done.has((i + a) + ',' + (k + b))) { ok = false; break; }
        if (!ok) continue;
        for (let a = 0; a < sw; a++) for (let b = 0; b < sd; b++) done.add((i + a) + ',' + (k + b));
        const cc = typeof color === 'function' ? color(x + i, z + k) : color;
        this.put(opts.tile ? 'tile' : 'brick', opts.tile ? [sw, sd, 1] : [sw, sd, opts.h || 1], x + i, y, z + k, cc, opts);
        break;
      }
    }
  }

  // Merge ---------------------------------------------------------------
  build({ castShadow = true, receiveShadow = true } = {}) {
    const studGeo = stud();
    const byCls = new Map();
    const studsFor = new Map();
    const tmp = new THREE.Vector3();
    for (const it of this.items) {
      let list = byCls.get(it.cls);
      if (!list) { list = []; byCls.set(it.cls, list); }
      list.push(it);
      if (it.studs && it.p.studs.length) {
        const vis = [];
        for (const s of it.p.studs) {
          tmp.set(s[0], s[1], s[2]).applyMatrix4(it.m);
          if (!it.free) {
            const cx = Math.floor(tmp.x + 1e-3), cz = Math.floor(tmp.z + 1e-3);
            if (this.occ.has(this._key(cx, it.top, cz))) continue;
          }
          vis.push(s);
        }
        studsFor.set(it, vis);
      }
    }
    const group = new THREE.Group();
    const stats = { tris: 0, parts: this.items.length, studs: 0 };
    for (const [cls, list] of byCls) {
      let floats = 0;
      for (const it of list) {
        floats += it.p.geo.p.length;
        const v = studsFor.get(it); if (v) floats += v.length * studGeo.p.length;
      }
      if (!floats) continue;
      const P = new Float32Array(floats), N = new Float32Array(floats), Cc = new Float32Array(floats);
      let o = 0;
      const write = (src, m, color, ox = 0, oy = 0, oz = 0) => {
        const e = m.elements;
        const sp = src.p, sn = src.n;
        const r = color.r, g = color.g, b = color.b;
        for (let i = 0; i < sp.length; i += 3) {
          const x = sp[i] + ox, y = sp[i + 1] + oy, z = sp[i + 2] + oz;
          P[o] = e[0] * x + e[4] * y + e[8] * z + e[12];
          P[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
          P[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
          const nx = sn[i], ny = sn[i + 1], nz = sn[i + 2];
          let ax = e[0] * nx + e[4] * ny + e[8] * nz, ay = e[1] * nx + e[5] * ny + e[9] * nz, az = e[2] * nx + e[6] * ny + e[10] * nz;
          const l = Math.hypot(ax, ay, az) || 1;
          N[o] = ax / l; N[o + 1] = ay / l; N[o + 2] = az / l;
          Cc[o] = r; Cc[o + 1] = g; Cc[o + 2] = b;
          o += 3;
        }
      };
      for (const it of list) {
        write(it.p.geo, it.m, it.color);
        const v = studsFor.get(it);
        if (v) for (const s of v) { write(studGeo, it.m, it.color, s[0], s[1], s[2]); stats.studs++; }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
      g.computeBoundingSphere();
      g.computeBoundingBox();
      const mesh = new THREE.Mesh(g, mat(cls));
      mesh.name = 'bricks:' + cls;
      mesh.castShadow = castShadow && cls !== 'trans' && cls !== 'glow';
      mesh.receiveShadow = receiveShadow && cls !== 'glow';
      if (cls === 'trans') mesh.renderOrder = 2;
      group.add(mesh);
      stats.tris += floats / 9;
    }
    group.userData.stats = stats;
    return { group, stats };
  }
}

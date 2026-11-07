// Floating island terrain built from bricks.
//
// Top: one layer of studded plates (grass etc.) with smooth tiles where paths run.
// Underside: brick courses that taper with depth into a rough point. Only an outer
// shell of each course is built: the inside is never visible, so it costs nothing.
import { rng } from '../lego/builder.js';

/** Smooth value noise in 2D, deterministic per seed. */
export function noise2(seed) {
  const r = rng(seed);
  const P = new Float32Array(512); for (let i = 0; i < 512; i++) P[i] = r();
  const h = (x, y) => P[((x * 73856093) ^ (y * 19349663)) & 511];
  const s = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    const u = s(xf), v = s(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

const SIZES = [[4, 2], [2, 4], [3, 2], [2, 3], [4, 1], [1, 4], [2, 2], [6, 1], [1, 6], [3, 1], [1, 3], [2, 1], [1, 2], [1, 1]];

/** Greedy pack a set of cells ("x,z" keys) into rectangles. Calls place(x, z, w, d). */
export function packCells(cells, r, place, sizes = SIZES, offset = 0) {
  const keys = [...cells].map((k) => k.split(',').map(Number));
  keys.sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
  const done = new Set();
  for (const [x, z] of keys) {
    const k = x + ',' + z;
    if (done.has(k)) continue;
    const order = sizes.slice().sort(() => r() - 0.5);
    if ((x + z + offset) % 2) order.reverse();
    for (const [w, d] of order) {
      let ok = true;
      for (let i = 0; i < w && ok; i++) for (let j = 0; j < d; j++) {
        const kk = (x + i) + ',' + (z + j);
        if (!cells.has(kk) || done.has(kk)) { ok = false; break; }
      }
      if (!ok) continue;
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) done.add((x + i) + ',' + (z + j));
      place(x, z, w, d);
      break;
    }
  }
}

/**
 * Build island terrain into builder `b` (local coordinates, top surface at y = 0).
 * spec: { seed, blobs: [{x, z, rx, rz}], edge: amplitude, depth: max courses,
 *         taper: cells per course, grass(x,z,n) -> colour, path(x,z) -> bool,
 *         pathColor, strata: [[colours], ...] per course, roots: count, tip: colour }
 * Returns { cells: Set, dist: Map, bounds }.
 */
export function buildTerrain(b, spec) {
  const r = rng(spec.seed || 1);
  const n = noise2(spec.seed || 1);
  const n2 = noise2((spec.seed || 1) + 99);
  const blobs = spec.blobs;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const bl of blobs) {
    minX = Math.min(minX, Math.floor(bl.x - bl.rx - 4)); maxX = Math.max(maxX, Math.ceil(bl.x + bl.rx + 4));
    minZ = Math.min(minZ, Math.floor(bl.z - bl.rz - 4)); maxZ = Math.max(maxZ, Math.ceil(bl.z + bl.rz + 4));
  }
  const edge = spec.edge ?? 2.2;
  const cells = new Set();
  for (let x = minX; x <= maxX; x++) for (let z = minZ; z <= maxZ; z++) {
    const cx = x + 0.5, cz = z + 0.5;
    let best = -Infinity;
    for (const bl of blobs) {
      const dx = (cx - bl.x) / bl.rx, dz = (cz - bl.z) / bl.rz;
      const rr = Math.min(bl.rx, bl.rz);
      const v = (1 - Math.sqrt(dx * dx + dz * dz)) * rr; // ~cells from blob edge
      best = Math.max(best, v);
    }
    best += (n(cx * 0.18, cz * 0.18) - 0.5) * 2 * edge + (n2(cx * 0.5, cz * 0.5) - 0.5) * 1.1;
    if (best > 0) cells.add(x + ',' + z);
  }
  for (const k of spec.add || []) cells.add(k);
  // Distance from edge (4-neighbour BFS).
  const dist = new Map();
  const queue = [];
  for (const k of cells) {
    const [x, z] = k.split(',').map(Number);
    const out = !cells.has((x + 1) + ',' + z) || !cells.has((x - 1) + ',' + z) || !cells.has(x + ',' + (z + 1)) || !cells.has(x + ',' + (z - 1));
    if (out) { dist.set(k, 0); queue.push([x, z]); }
  }
  for (let qi = 0; qi < queue.length; qi++) {
    const [x, z] = queue[qi]; const d = dist.get(x + ',' + z);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (x + dx) + ',' + (z + dz);
      if (cells.has(k) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
    }
  }
  let maxD = 0; for (const v of dist.values()) maxD = Math.max(maxD, v);

  // --- top layer: plates and tiles, top at y = 0
  const grass = new Set(), path = new Set();
  for (const k of cells) {
    const [x, z] = k.split(',').map(Number);
    if (spec.path && spec.path(x, z)) path.add(k); else grass.add(k);
  }
  const grassColor = spec.grass || ((x, z, v) => (v > 0.62 ? 'brightGreen' : v < 0.25 ? 'darkGreen' : 'green'));
  packCells(grass, r, (x, z, w, d) => {
    const v = n(x * 0.21 + 3.1, z * 0.21 - 1.7);
    b.plate(x, -1, z, w, d, grassColor(x, z, v, dist.get(x + ',' + z)));
  }, [[4, 2], [2, 4], [2, 2], [3, 2], [2, 3], [4, 1], [1, 4], [2, 1], [1, 2], [1, 1]]);
  packCells(path, r, (x, z, w, d) => {
    const c = typeof spec.pathColor === 'function' ? spec.pathColor(x, z) : (spec.pathColor || 'tan');
    b.tile(x, -1, z, w, d, c);
  }, [[2, 2], [2, 1], [1, 2], [1, 1], [4, 1], [1, 4]]);

  // --- underside courses
  const depth = Math.min(spec.depth || 12, 30);
  const taper = spec.taper || 1.15;
  const shell = 3;
  const strata = spec.strata || [['darkTan', 'tan'], ['darkTan', 'brown'], ['darkGray', 'darkTan'], ['darkGray', 'lightGray'], ['darkGray', 'black']];
  let lastCourse = [], lastY = -4;
  for (let k = 0; k < depth; k++) {
    const course = new Set();
    for (const [key, d] of dist) {
      const [x, z] = key.split(',').map(Number);
      const e = k * taper + (n(x * 0.3 + k * 1.7, z * 0.3 - k) - 0.5) * 2.2 + (k > 0 ? 0.4 : -1);
      if (d >= Math.max(0, e) && (d < e + shell || e + shell > maxD - 0.5 || k === depth - 1)) course.add(key);
    }
    if (!course.size) break;
    const yy = -1 - 3 * (k + 1);
    const pal = strata[Math.min(strata.length - 1, Math.floor(k / Math.max(1, depth / strata.length)))];
    packCells(course, r, (x, z, w, d) => {
      const v = n2(x * 0.25 + k * 0.6, z * 0.25);
      let c = v > 0.55 ? pal[1] : pal[0];
      if (spec.moss && k < 3 && n(x * 0.4 + 7, z * 0.4 + k) > 0.74) c = spec.moss;
      b.brick(x, yy, z, w, d, 3, c, { studs: false });
    }, undefined, k);
    lastCourse = [...course]; lastY = yy;
  }
  // roots hanging from the lower courses
  const roots = spec.roots ?? 10;
  for (let i = 0; i < roots && lastCourse.length; i++) {
    const [x, z] = r.pick(lastCourse).split(',').map(Number);
    const len = r.int(2, 5);
    for (let j = 0; j < len; j++) b.round(x, lastY - (j + 1) * 3, z, 1, 3, j === len - 1 && r.chance(0.5) ? 'darkGreen' : 'brown', { studs: false, occ: false });
  }
  return { cells, dist, grass, path, bounds: { minX, maxX, minZ, maxZ }, maxD, bottomY: lastY };
}

/** Scatter small decorations on grass cells not in `reserved`. */
export function scatter(b, terrain, reserved, seed, { flowers = 30, rocks = 10, tufts = 0 } = {}) {
  const r = rng(seed);
  const free = [...terrain.grass].filter((k) => !reserved.has(k) && terrain.dist.get(k) > 0);
  const take = () => free.splice(Math.floor(r() * free.length), 1)[0];
  for (let i = 0; i < flowers && free.length; i++) {
    const [x, z] = take().split(',').map(Number);
    b.put('flower', [], x, 0, z, r.pick(['yellow', 'red', 'white', 'yellow', 'orange']));
  }
  for (let i = 0; i < rocks && free.length; i++) {
    const [x, z] = take().split(',').map(Number);
    b.round(x, 0, z, 1, r.chance(0.5) ? 1 : 3, r.pick(['lightGray', 'darkGray']));
  }
  return free;
}

// Walkable surfaces: island cell grids and bridge strips.
// Islands: a set of local "x,z" cells at a base height, optional per-cell height
// offsets (raised floors, stairs) and blocked cells (buildings, machines).
// Bridges: a straight strip between two world points, height interpolated
// (or stepped, for stair bridges).

export class WalkMap {
  constructor() { this.islands = []; this.bridges = []; }

  addIsland({ id, origin, cells, blocked, heights }) {
    this.islands.push({ id, ox: origin.x, oy: origin.y, oz: origin.z, cells, blocked, heights: heights || new Map() });
  }

  addBridge({ id, a, b, width = 3, steps = 0, sag = 0 }) {
    this.bridges.push({ id, a: a.clone(), b: b.clone(), width, steps, sag });
  }

  /** All candidate surfaces under (x, z): [{ y, kind, id, blocked }]. */
  surfaces(x, z) {
    const out = [];
    for (const is of this.islands) {
      const cx = Math.floor(x - is.ox), cz = Math.floor(z - is.oz);
      const k = cx + ',' + cz;
      if (!is.cells.has(k)) continue;
      out.push({ y: is.oy + (is.heights.get(k) || 0), kind: 'island', id: is.id, blocked: is.blocked.has(k) });
    }
    for (const br of this.bridges) {
      const ax = br.a.x, az = br.a.z, bx = br.b.x, bz = br.b.z;
      const dx = bx - ax, dz = bz - az;
      const L2 = dx * dx + dz * dz;
      let t = ((x - ax) * dx + (z - az) * dz) / L2;
      if (t < -0.02 || t > 1.02) continue;
      t = Math.max(0, Math.min(1, t));
      const px = ax + dx * t, pz = az + dz * t;
      const d = Math.hypot(x - px, z - pz);
      if (d > br.width / 2) continue;
      let f = t;
      if (br.steps) f = Math.round(t * br.steps) / br.steps;
      out.push({ y: br.a.y + (br.b.y - br.a.y) * f - br.sag * 4 * t * (1 - t), kind: 'bridge', id: br.id, blocked: false, t });
    }
    return out;
  }

  /** The surface the figure would stand on, given its current height. */
  ground(x, z, currentY = null, maxStep = 1.35) {
    const s = this.surfaces(x, z);
    if (!s.length) return null;
    if (currentY === null) return s.reduce((a, b) => (b.y > a.y ? b : a));
    let best = null, bd = Infinity;
    for (const c of s) {
      const d = Math.abs(c.y - currentY);
      if (d < bd) { bd = d; best = c; }
    }
    if (bd > maxStep) return { ...best, tooHigh: true };
    return best;
  }

  /**
   * Where a bridge should land on island `id`: p if it already touches a standable cell,
   * otherwise p moved along `dir` (unit, pointing into the island, i.e. continuing the bridge
   * line) until it does, then a little way onto the deck. Falls back to the nearest standable
   * cell centre. Returns p unchanged when the island has no cell within `reach` studs.
   */
  landing(id, p, dir, reach = 10) {
    const is = this.islands.find((i) => i.id === id);
    if (!is) return p.clone();
    const ok = (x, z) => { const k = Math.floor(x - is.ox) + ',' + Math.floor(z - is.oz); return is.cells.has(k) && !is.blocked.has(k); };
    // a deck 2 cells deep, so the bridge does not end on a single-cell spur
    const solid = (x, z) => ok(x, z) && ok(x + dir.x * 1.2, z + dir.z * 1.2);
    if (solid(p.x, p.z)) return p.clone();
    for (let d = 0.25; d <= reach; d += 0.25) {
      const x = p.x + dir.x * d, z = p.z + dir.z * d;
      if (solid(x, z)) return p.clone().setX(x + dir.x * 0.8).setZ(z + dir.z * 0.8);
    }
    let best = null, bd = Infinity;
    for (const k of is.cells) {
      if (is.blocked.has(k)) continue;
      const [cx, cz] = k.split(',').map(Number);
      const d = Math.hypot(cx + 0.5 + is.ox - p.x, cz + 0.5 + is.oz - p.z);
      if (d < bd) { bd = d; best = [cx + 0.5 + is.ox, cz + 0.5 + is.oz]; }
    }
    return best && bd <= reach ? p.clone().setX(best[0]).setZ(best[1]) : p.clone();
  }

  /** Island id under a point, if any. */
  islandAt(x, z) {
    for (const is of this.islands) {
      if (is.cells.has(Math.floor(x - is.ox) + ',' + Math.floor(z - is.oz))) return is.id;
    }
    return null;
  }
}

// Bridges between islands. Planks are real tiles placed along the span; ropes are
// LEGO-string-like tubes. Stair bridges climb in one-brick steps.
import * as THREE from 'three';
import { BrickBuilder } from '../lego/builder.js';
import { PLATE } from '../lego/dims.js';
import { solid } from '../lego/materials.js';

/**
 * a, b: world Vector3 at walk height. opts: { width (studs), sag, steps, plank, post, rope, seed }
 * Returns { group, height(t), points }.
 */
export function buildBridge(a, b, opts = {}) {
  const width = opts.width || 4;
  const sag = opts.sag ?? 0.6;
  const steps = opts.steps || 0;
  const dx = b.x - a.x, dz = b.z - a.z;
  const L = Math.hypot(dx, dz);
  const theta = Math.atan2(dz, dx);
  const height = (t) => {
    const f = steps ? Math.round(t * steps) / steps : t;
    return a.y + (b.y - a.y) * f - sag * 4 * t * (1 - t);
  };
  const bb = new BrickBuilder({ seed: opts.seed || 9 });
  const n = Math.ceil(L);
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  const m = new THREE.Matrix4();
  const tmp = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, tc = (t0 + t1) / 2;
    const y0 = height(t0), y1 = height(t1);
    const pitch = steps ? 0 : Math.atan2(y1 - y0, L / n);
    const px = a.x + dx * tc, pz = a.z + dz * tc, py = steps ? height(tc) : (y0 + y1) / 2;
    e.set(0, -theta, 0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(px, py, pz), q, new THREE.Vector3(1, 1, 1));
    m.multiply(tmp.makeRotationZ(pitch));
    m.multiply(tmp.makeTranslation(-0.5, -PLATE, -width / 2));
    const c = opts.plank || (i % 5 === 0 ? 'darkBrown' : i % 2 ? 'brown' : 'darkTan');
    bb.free(steps ? 'brick' : 'tile', steps ? [1, width, 2] : [1, width, 1], m, c, { studs: false });
    if (steps) {
      // riser under each step down to the previous level
      const m2 = m.clone().multiply(tmp.makeTranslation(0, -0.8, 0));
      bb.free('brick', [1, width, 2], m2, 'darkGray', { studs: false });
    }
  }
  // posts and ropes
  const posts = [];
  const every = 4;
  for (let i = 0; i <= n; i += every) {
    const t = Math.min(1, i / n);
    const py = height(t);
    for (const side of [-1, 1]) {
      const off = new THREE.Vector3(-Math.sin(theta) * side * (width / 2 + 0.2), 0, Math.cos(theta) * side * (width / 2 + 0.2));
      const p = new THREE.Vector3(a.x + dx * t, py, a.z + dz * t).add(off);
      const pm = new THREE.Matrix4().makeTranslation(p.x - 0.5, p.y - PLATE * 2, p.z - 0.5);
      bb.free('round', [1, 3], pm, opts.post || 'darkBrown');
      bb.free('round', [1, 3], pm.clone().multiply(new THREE.Matrix4().makeTranslation(0, 1.2, 0)), opts.post || 'darkBrown', { studs: true });
      posts.push({ p: p.clone().setY(p.y + 1.9), side });
    }
  }
  const { group } = bb.build();
  const ropeMat = solid(0xb9a57c, { roughness: 0.8, clearcoat: 0 });
  for (const side of [-1, 1]) {
    const pts = posts.filter((x) => x.side === side).map((x) => x.p);
    if (pts.length < 2) continue;
    const curvePts = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const A = pts[i], B = pts[i + 1];
      for (let k = 0; k < 6; k++) { const t = k / 6; const p = new THREE.Vector3().lerpVectors(A, B, t); p.y -= Math.sin(t * Math.PI) * 0.45; curvePts.push(p); }
    }
    curvePts.push(pts[pts.length - 1]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), curvePts.length * 3, 0.07, 6), ropeMat);
    tube.castShadow = true;
    group.add(tube);
  }
  const points = [];
  for (let k = 0; k <= 8; k++) { const t = k / 8; points.push(new THREE.Vector3(a.x + dx * t, height(t), a.z + dz * t)); }
  return { group, height, points, width, sag, steps };
}

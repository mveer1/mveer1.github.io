// Stop-motion assembly: a build whose bricks travel from a loose pile to their final
// place, one after another, in held frames. Progress p in [0, 1] fully determines the
// pose, so scrolling back takes the build apart again.
import * as THREE from 'three';
import { part, toBufferGeometry } from './parts.js';
import { PLATE } from './dims.js';
import { col } from './palette.js';
import { solid } from './materials.js';
import { rng } from './builder.js';

const glowMats = new Map();
function materialFor(c) {
  const e = col(c);
  if (e.cls === 'glow') {
    let m = glowMats.get(e.hex);
    if (!m) { m = new THREE.MeshBasicMaterial({ color: new THREE.Color(e.hex).multiplyScalar(e.power || 2.5) }); glowMats.set(e.hex, m); }
    return m;
  }
  if (e.cls === 'trans') return solid(e.hex, { transparent: true, opacity: 0.55, roughness: 0.05 });
  if (e.cls === 'metal') return solid(e.hex, { metalness: 0.85, roughness: 0.32, clearcoat: 0 });
  return solid(e.hex);
}

const geoCache = new Map();
function geometryFor(type, args) {
  const key = type + ':' + args.join(':');
  let g = geoCache.get(key);
  if (!g) {
    const p = part(type, ...args);
    g = { geo: toBufferGeometry(p.geo, p.studs), foot: p.foot };
    geoCache.set(key, g);
  }
  return g;
}

/** Pose matrix for a grid placement, matching BrickBuilder.put. */
function gridPose(foot, x, y, z, rot) {
  const [w, d] = foot; const W = rot % 2 ? d : w, D = rot % 2 ? w : d;
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot * Math.PI / 2);
  const c = new THREE.Vector3(-w / 2, 0, -d / 2).applyQuaternion(q);
  return { pos: new THREE.Vector3(x + W / 2 + c.x, y * PLATE, z + D / 2 + c.z), quat: q };
}

export class Assembly {
  /**
   * pieces: [{ type, args, x, y, z, color, rot }] in build order (grid coords)
   * pile: { x, z, w, d } area where loose pieces lie (grid coords, y = 0)
   */
  constructor(pieces, pile, seed = 1, occ = null) {
    this.group = new THREE.Group();
    const r = rng(seed);
    this.items = pieces.map((p, i) => {
      const { geo, foot } = geometryFor(p.type, p.args);
      const mesh = new THREE.Mesh(geo, materialFor(p.color));
      mesh.castShadow = true; mesh.receiveShadow = true;
      const fin = gridPose(foot, p.x, p.y, p.z, p.rot || 0);
      if (occ) {
        const [w, d, h] = foot; const W = (p.rot || 0) % 2 ? d : w, D = (p.rot || 0) % 2 ? w : d;
        for (let a = 0; a < W; a++) for (let b = 0; b < D; b++) for (let l = p.y; l < p.y + h; l++) occ.add((p.x + a) + ',' + l + ',' + (p.z + b));
      }
      const pileQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(r.chance(0.3) ? Math.PI / 2 : 0, r.range(0, Math.PI * 2), r.chance(0.2) ? 0.3 : 0));
      const pilePos = new THREE.Vector3(pile.x + r.range(0, pile.w), 0.02 + (i % 3) * 0.35 * r(), pile.z + r.range(0, pile.d));
      this.group.add(mesh);
      return { mesh, fin, pilePos, pileQ };
    });
    this.p = -1;
    this.set(0);
  }

  /** Progress 0..1. `held` quantises each brick's flight into four frames. */
  set(p) {
    p = Math.max(0, Math.min(1, p));
    if (p === this.p) return;
    this.p = p;
    const N = this.items.length;
    const f = p * N;
    for (let i = 0; i < N; i++) {
      const it = this.items[i];
      const local = f - i; // <0 pile, 0..1 flying, >1 placed
      if (local <= 0) { it.mesh.position.copy(it.pilePos); it.mesh.quaternion.copy(it.pileQ); continue; }
      if (local >= 1) { it.mesh.position.copy(it.fin.pos); it.mesh.quaternion.copy(it.fin.quat); continue; }
      const k = Math.min(3, Math.floor(local * 4)) / 3; // held frames: 0, 1/3, 2/3, 1
      const a = it.pilePos, b = it.fin.pos;
      const pos = new THREE.Vector3().lerpVectors(a, b, k);
      pos.y += Math.sin(k * Math.PI) * 2.2 + (k > 0.6 && k < 1 ? 0.5 : 0);
      it.mesh.position.copy(pos);
      it.mesh.quaternion.copy(it.pileQ).slerp(it.fin.quat, k);
    }
  }
}

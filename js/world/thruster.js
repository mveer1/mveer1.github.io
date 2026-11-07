// Thrusters: every island hangs from a small brick-built engine under its keel, burning a still
// blue flame with a white-hot core, as if the whole archipelago were flying through space.
// The flame is static on purpose: it reads as a steady engine and never pulls the eye.
//
// createEngine({ scale }) engine model + flame, hanging from the origin
// attachEngine(group, ctx) finds the lowest point under an island and hangs one there
import * as THREE from 'three';
import { BrickBuilder } from '../lego/builder.js';
import { PLATE } from '../lego/dims.js';

let shared = null;
const MOUTH = 8 * PLATE; // bell mouth, below the attach point, in model units

function setup() {
  if (shared) return shared;
  // flame cone: wide at the nozzle (y = 0), point at y = -1
  const cone = new THREE.ConeGeometry(1, 1, 22, 1, true).rotateX(Math.PI).translate(0, -0.5, 0);
  const layer = (rgb, opacity) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { color: { value: new THREE.Color(...rgb) }, opacity: { value: opacity } },
    vertexShader: `varying float vT; varying vec3 vN; varying vec3 vV;
      void main(){ vT = -position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 color; uniform float opacity; varying float vT; varying vec3 vN; varying vec3 vV;
      void main(){
        float side = pow(max(abs(dot(vN, vV)), 0.0001), 0.7);
        float body = pow(clamp(1.0 - vT, 0.0, 1.0), 1.25);
        gl_FragColor = vec4(color, opacity * side * body);
      }`,
  });
  const layers = [
    { r: 1.0, l: 1.0, mat: layer([0.15, 0.5, 3.0], 0.65) },    // outer blue
    { r: 0.6, l: 0.76, mat: layer([0.55, 1.5, 3.2], 0.85) },   // light blue
    { r: 0.28, l: 0.5, mat: layer([3.0, 3.1, 3.3], 1.0) },     // white-hot core
  ];
  // soft halo around the nozzle, always facing the camera
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(235,245,255,1)'); grad.addColorStop(0.25, 'rgba(90,160,255,0.7)'); grad.addColorStop(1, 'rgba(30,80,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  const haloMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0.85 });
  shared = { cone, layers, haloMat };
  return shared;
}

/** An engine hanging below the origin. scale 1 suits a small island. */
export function createEngine({ scale = 1 } = {}) {
  const S = setup();
  const b = new BrickBuilder({ seed: 17, jitter: 0, colorJitter: 0 });
  // built upward from the keel, then flipped so the bell opens downward
  b.round(-1, 0, -1, 2, 3, 'black', { studs: false });
  b.round(-2, 3, -2, 4, 3, 'darkGray', { studs: false });
  b.round(-2, 6, -2, 4, 1, 'glowAmber', { studs: false });
  b.round(-3, 7, -3, 6, 1, 'darkGray', { studs: false });
  const { group: model } = b.build();
  model.rotation.x = Math.PI;
  const root = new THREE.Group();
  root.add(model);
  root.scale.setScalar(scale);

  const flame = new THREE.Group();
  flame.position.y = -MOUTH - 0.05;
  const R = 1.5, L = 6.5;
  for (const l of S.layers) {
    const m = new THREE.Mesh(S.cone, l.mat);
    m.scale.set(R * l.r, L * l.l, R * l.r);
    m.frustumCulled = false;
    flame.add(m);
  }
  const halo = new THREE.Sprite(S.haloMat);
  halo.scale.setScalar(R * 3.2);
  flame.add(halo);
  root.add(flame);
  return { root };
}

/** Hang an engine under the lowest point near the middle of an island. group: the island's local group. */
export function attachEngine(group, ctx) {
  let sx = 0, sz = 0, n = 0;
  for (const k of ctx.cells) { const i = k.indexOf(','); sx += +k.slice(0, i); sz += +k.slice(i + 1); n++; }
  if (!n) return null;
  const cx = sx / n + 0.5, cz = sz / n + 0.5, half = Math.sqrt(n) / 2;
  let bx = cx, bz = cz, by = Infinity;
  if (ctx.occ) {
    for (const k of ctx.occ) {
      const i = k.indexOf(','), j = k.lastIndexOf(',');
      const y = +k.slice(i + 1, j);
      if (y >= by) continue;
      const x = +k.slice(0, i) + 0.5, z = +k.slice(j + 1) + 0.5;
      if (Math.hypot(x - cx, z - cz) > 5) continue;
      by = y; bx = x; bz = z;
    }
  }
  let y;
  if (by === Infinity) { group.updateMatrixWorld(true); y = new THREE.Box3().setFromObject(group).min.y; } else y = by * PLATE;
  const scale = THREE.MathUtils.clamp(half / 10, 0.55, 1.1);
  const e = createEngine({ scale });
  e.root.position.set(bx, y + 1.0, bz);
  group.add(e.root);
  return e;
}

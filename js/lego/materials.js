// Shared plastic materials. One instance per class for the whole world, so every
// island's merged mesh reuses the same compiled program.
import * as THREE from 'three';

let M = null;

export function createMaterials(tier = 2) {
  const plastic = tier >= 2
    ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.34, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.22, envMapIntensity: 0.55 })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.36, metalness: 0, envMapIntensity: 0.55 });
  const trans = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.5,
    envMapIntensity: 1.1, depthWrite: false, side: THREE.DoubleSide,
  });
  // Light-emitting plastic: still lit and glossy, plus emission from its own vertex colour,
  // so lamps keep shading and a highlight instead of reading as flat cut-outs.
  const glow = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0, emissive: 0xffffff, emissiveIntensity: 1, envMapIntensity: 0.8 });
  glow.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor.rgb;');
  };
  const metal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.85, envMapIntensity: 1.0 });
  M = { plastic, trans, glow, metal };
  return M;
}

export function mat(cls = 'plastic') {
  if (!M) createMaterials();
  return M[cls] || M.plastic;
}

/** A single-colour plastic material for non-merged meshes (the minifigure, props). */
const solidCache = new Map();
export function solid(hex, opts = {}) {
  const key = hex + JSON.stringify(opts);
  let m = solidCache.get(key);
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.32, clearcoat: 0.3, clearcoatRoughness: 0.2, envMapIntensity: 0.6, ...opts });
    solidCache.set(key, m);
  }
  return m;
}

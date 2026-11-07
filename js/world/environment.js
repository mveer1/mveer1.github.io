// Night environment: sky dome (gradient, stars, moon), fog, cloud sea, distant
// rocks in the fog, far-off wonders (wonders.js), dust motes. Colours from docs/art-direction.md.
import * as THREE from 'three';
import { BrickBuilder, rng } from '../lego/builder.js';
import { buildTerrain } from './terrain.js';
import { PLATE } from '../lego/dims.js';
import { buildWonders } from './wonders.js';
import { FAR_LAYER } from '../core/renderer.js';

export const FOG = new THREE.Color(0x111b28);

function skyDome(moonDir) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      zenith: { value: new THREE.Color(0x05080f) }, horizon: { value: new THREE.Color(0x1b293b) },
      below: { value: new THREE.Color(0x0c131d) }, moonDir: { value: moonDir.clone() },
      moon: { value: new THREE.Color(0xd7e3f6) }, time: { value: 0 },
    },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
    fragmentShader: `
      uniform vec3 zenith, horizon, below, moonDir, moon; uniform float time;
      varying vec3 vDir;
      float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 c = h > 0.0 ? mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(horizon, below, clamp(-h * 3.0, 0.0, 1.0));
        // stars, sparse, only above the horizon haze
        vec3 g = floor(d * 260.0);
        float s = hash(g);
        float star = step(0.9965, s) * smoothstep(0.05, 0.35, h);
        float tw = 0.65 + 0.35 * sin(time * (1.0 + s * 3.0) + s * 40.0);
        c += vec3(0.75, 0.82, 1.0) * star * tw * (0.35 + 0.65 * fract(s * 91.0));
        // moon disc and halo
        float m = dot(d, normalize(moonDir));
        c += moon * smoothstep(0.99935, 0.99965, m) * 2.4;
        c += moon * pow(max(m, 0.0), 180.0) * 0.32 + moon * pow(max(m, 0.0), 12.0) * 0.05;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(800, 48, 24), mat);
  m.frustumCulled = false;
  m.renderOrder = -10;
  return m;
}

function cloudSea() {
  const mat = new THREE.ShaderMaterial({
    transparent: false, depthWrite: true, fog: false,
    uniforms: {
      time: { value: 0 }, deep: { value: new THREE.Color(0x0b121c) }, lit: { value: new THREE.Color(0x2a3a50) },
      fogColor: { value: FOG.clone() }, camPos: { value: new THREE.Vector3() },
    },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float time; uniform vec3 deep, lit, fogColor, camPos; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * n(p); p *= 2.03; a *= 0.5; } return v; }
      void main(){
        vec2 p = vW.xz * 0.012 + vec2(time * 0.004, time * 0.0025);
        float f = fbm(p + fbm(p * 1.7 + time * 0.003) * 0.6);
        vec3 c = mix(deep, lit, smoothstep(0.42, 0.85, f));
        float dist = length(vW.xz - camPos.xz);
        float fogF = smoothstep(60.0, 520.0, dist);
        gl_FragColor = vec4(mix(c, fogColor * 0.9, fogF), 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.CircleGeometry(900, 64), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = -46;
  return m;
}

/** Distant floating rocks, some with ruins. Built coarse; fog turns them to silhouettes. */
function farRocks(seed = 41) {
  const r = rng(seed);
  const group = new THREE.Group();
  const spots = [
    [-150, 18, -150, 1.1], [-210, -6, -40, 1.4], [170, 30, -170, 1.3], [210, 4, -20, 1.0],
    [40, 46, -240, 1.6], [-80, -12, -250, 1.2], [140, -18, 80, 0.9], [-160, 26, 90, 1.0], [-30, 60, -320, 2.2],
  ];
  for (const [x, y, z, s] of spots) {
    const b = new BrickBuilder({ seed: r.int(1, 9999), jitter: 0 });
    const rx = r.range(5, 9), rz = r.range(4, 8);
    buildTerrain(b, {
      seed: r.int(1, 9999), blobs: [{ x: 0, z: 0, rx, rz }], edge: 1.6, depth: r.int(6, 10), taper: 0.9, roots: 4,
      grass: () => 'darkGreen', strata: [['darkGray', 'black'], ['black', 'darkGray']],
    });
    // ruins: broken columns
    const cols = r.int(1, 3);
    for (let i = 0; i < cols; i++) {
      const cx = r.int(-3, 2), cz = r.int(-2, 2), hgt = r.int(2, 6);
      for (let k = 0; k < hgt; k++) b.round(cx, k * 3, cz, 2, 3, 'darkGray');
    }
    if (r.chance(0.5)) { b.brick(-3, 18, -1, 7, 1, 3, 'darkGray'); }
    const { group: g } = b.build({ castShadow: false, receiveShadow: false });
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    g.rotation.y = r.range(0, Math.PI * 2);
    group.add(g);
  }
  // One enormous unfinished arch, very far away
  const b = new BrickBuilder({ seed: 5, jitter: 0 });
  for (let k = 0; k < 14; k++) { b.brick(-12, k * 3, 0, 3, 3, 3, 'darkGray', { studs: false }); if (k < 9) b.brick(10, k * 3, 0, 3, 3, 3, 'darkGray', { studs: false }); }
  for (let i = 0; i < 8; i++) b.brick(-12 + i * 2, 42 + Math.round(Math.sin(i / 7 * Math.PI) * 6) * 3, 0, 3, 3, 3, 'darkGray', { studs: false });
  const { group: arch } = b.build({ castShadow: false, receiveShadow: false });
  arch.position.set(250, -30, -280); arch.scale.setScalar(2.6); arch.rotation.y = -0.6;
  group.add(arch);
  return group;
}

function dust(count = 260) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), s = new Float32Array(count);
  const r = rng(77);
  for (let i = 0; i < count; i++) { p[i * 3] = r.range(-60, 60); p[i * 3 + 1] = r.range(-10, 30); p[i * 3 + 2] = r.range(-60, 60); s[i] = r.range(0.5, 1.5); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('size', new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, center: { value: new THREE.Vector3() }, color: { value: new THREE.Color(0xffd7a0) }, scale: { value: 300 } },
    vertexShader: `
      attribute float size; uniform float time; uniform vec3 center; uniform float scale; varying float vA;
      void main(){
        vec3 q = position;
        q.x += sin(time * 0.11 + position.z) * 2.0; q.y += sin(time * 0.07 + position.x * 0.3) * 1.5;
        q = mod(q - center + vec3(60.0, 10.0, 60.0), vec3(120.0, 40.0, 120.0)) + center - vec3(60.0, 10.0, 60.0);
        vec4 mv = modelViewMatrix * vec4(q, 1.0);
        gl_PointSize = size * scale / -mv.z;
        vA = smoothstep(90.0, 10.0, -mv.z) * smoothstep(2.0, 8.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: 'uniform vec3 color; varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); gl_FragColor = vec4(color, vA * 0.35 * smoothstep(0.5, 0.0, d)); }',
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return pts;
}

export function createEnvironment(scene, { moonDir, tier }) {
  scene.fog = new THREE.Fog(FOG, 170, 560);
  scene.background = FOG.clone();
  const sky = skyDome(moonDir);
  scene.add(sky);
  const clouds = cloudSea();
  scene.add(clouds);
  const hemi = new THREE.HemisphereLight(0x46607f, 0x0a0e15, 0.9);
  scene.add(hemi);
  let rocks = null, wonders = null;
  const dustPts = dust(tier >= 1 ? 260 : 120);
  scene.add(dustPts);
  return {
    sky, clouds, hemi, dust: dustPts,
    buildFar() {
      rocks = farRocks(); wonders = buildWonders({ lite: tier === 0 });
      for (const g of [rocks, wonders.group]) { g.traverse((o) => o.layers.set(FAR_LAYER)); scene.add(g); } // sharp: kept out of the tilt-shift
      return rocks;
    },
    update(t, camera, focus, reduced = false) {
      wonders?.update(t, camera, reduced);
      sky.position.copy(camera.position);
      sky.material.uniforms.time.value = t;
      clouds.material.uniforms.time.value = t;
      clouds.material.uniforms.camPos.value.copy(camera.position);
      dustPts.material.uniforms.time.value = t;
      dustPts.material.uniforms.center.value.copy(focus);
      dustPts.material.uniforms.scale.value = innerHeight * 0.35;
    },
  };
}

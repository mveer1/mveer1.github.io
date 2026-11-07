// Things in the far distance that nobody can reach: a drowned skyline with lights on, a
// lighthouse answering the Lookout in Morse, a door standing open in the sky,
// a small ringed planet and the odd shooting star. Placed 200 to 750 studs out, in the
// fog, so they are hints rather than destinations.
import * as THREE from 'three';
import { BrickBuilder, rng } from '../lego/builder.js';
import { buildTerrain } from './terrain.js';
import { lightCone } from './props.js';

const CENTER = new THREE.Vector3(0, 0, -45);
const CLOUD_Y = -46; // the cloud sea (environment.js)
const DEG = Math.PI / 180;
const glowMat = (hex, k = 1.8) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), fog: false });

let haloTex = null;
function halo(color, size) {
  if (!haloTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    haloTex = new THREE.CanvasTexture(c);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: new THREE.Color(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  s.scale.setScalar(size);
  return s;
}

// --------------------------------------------------------------------- the drowned skyline
function skyline() {
  const r = rng(404);
  const b = new BrickBuilder({ seed: 9, jitter: 0, colorJitter: 0.03 });
  const palette = ['darkGray', 'black', 'darkBlue', 'sandBlue', 'darkTan', 'darkGray'];
  const towers = [];
  for (let i = 0; i < 17; i++) {
    const w = r.int(3, 6), d = r.int(3, 5);
    const x = Math.round(-26 + i * 3.2 + r.range(-1, 1)), z = r.int(-8, 8);
    const courses = r.int(5, 16) + (i % 5 === 2 ? 7 : 0);
    const c = r.pick(palette);
    for (let k = -10; k < courses; k++) b.brick(x, k * 3, z, w, d, 3, k % 5 === 0 ? 'lightGray' : c, { studs: k === courses - 1 });
    towers.push({ x, z, w, d, courses });
    if (r.chance(0.5)) for (let k = 0; k < r.int(2, 5); k++) b.round(x + 1, courses * 3 + k * 3, z + 1, 1, 3, 'darkGray', { studs: false });
  }
  const { group } = b.build({ castShadow: false, receiveShadow: false });
  // windows: small bright quads on the four faces
  const geo = new THREE.PlaneGeometry(0.46, 0.62);
  const slots = [];
  for (const T of towers) {
    for (let k = 0; k < T.courses; k++) {
      const y = k * 1.2 + 0.6;
      for (let i = 0; i < T.w; i++) {
        slots.push([T.x + i + 0.5, y, T.z - 0.02, Math.PI], [T.x + i + 0.5, y, T.z + T.d + 0.02, 0]);
      }
      for (let i = 0; i < T.d; i++) {
        slots.push([T.x - 0.02, y, T.z + i + 0.5, -Math.PI / 2], [T.x + T.w + 0.02, y, T.z + i + 0.5, Math.PI / 2]);
      }
    }
  }
  const lit = slots.filter(() => r() < 0.2);
  const sets = [0, 1, 2].map(() => new THREE.InstancedMesh(geo, glowMat(0xffc878, 2.0), Math.ceil(lit.length / 3)));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  lit.forEach((s, i) => {
    q.setFromEuler(e.set(0, s[3], 0));
    sets[i % 3].setMatrixAt(Math.floor(i / 3), m.compose(new THREE.Vector3(s[0], s[1], s[2]), q, one));
  });
  sets.forEach((s) => { s.frustumCulled = false; group.add(s); });
  // red aircraft light on the tallest tower
  const tall = towers.reduce((a, t) => (t.courses > a.courses ? t : a), towers[0]);
  const light = halo(0xff3322, 7);
  light.position.set(tall.x + tall.w / 2, tall.courses * 1.2 + 2.5, tall.z + tall.d / 2);
  group.add(light);
  group.scale.setScalar(2.4);
  group.position.set(-130, CLOUD_Y - 2, -330);
  group.rotation.y = 0.35;
  return {
    group,
    update(t, _cam, reduced) {
      if (reduced) { sets.forEach((s) => { s.visible = true; }); return; }
      // a few windows go dark and come back, now and then
      sets[1].visible = Math.floor(t / 2.3) % 4 !== 0;
      sets[2].visible = Math.floor(t / 3.1 + 1.7) % 5 !== 0;
      light.material.opacity = Math.floor(t * 0.9) % 2 ? 0.15 : 1;
    },
  };
}

// --------------------------------------------------------------------- a lighthouse that answers
const MORSE = { H: '....', E: '.', L: '.-..', O: '---' };
function morseTimeline(word, unit = 0.3) {
  const seq = [];
  for (const ch of word) {
    for (const s of MORSE[ch]) { seq.push([true, (s === '.' ? 1 : 3) * unit], [false, unit]); }
    seq.push([false, 2 * unit]);
  }
  seq.push([false, 14 * unit]);
  const total = seq.reduce((a, s) => a + s[1], 0);
  return { seq, total };
}

function farLighthouse() {
  const b = new BrickBuilder({ seed: 31, jitter: 0, colorJitter: 0.02 });
  buildTerrain(b, { seed: 77, blobs: [{ x: 0, z: 0, rx: 6, rz: 5.5 }], edge: 1.2, depth: 6, taper: 1, roots: 0, grass: () => 'darkGreen', strata: [['darkGray', 'black']] });
  for (let k = 0; k < 14; k++) b.round(-2, k * 3, -2, 4, 3, k % 2 ? 'red' : 'white', { studs: false });
  b.round(-2, 42, -2, 4, 1, 'black', { studs: false });
  b.round(-1, 43, -1, 2, 3, 'glowAmber', { studs: false });
  b.round(-2, 46, -2, 4, 1, 'red', { studs: false });
  b.cone(0, 47, 0, 'black');
  const { group } = b.build({ castShadow: false, receiveShadow: false });
  const lamp = halo(0xffd9a0, 1);
  lamp.position.set(0, 44 * 0.4 + 0.2, 0);
  group.add(lamp);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), glowMat(0xffe2b0, 3));
  core.position.copy(lamp.position); group.add(core);
  group.scale.setScalar(2.2);
  group.position.set(210, CLOUD_Y + 5, -190);
  const { seq, total } = morseTimeline('HELLO');
  return {
    group,
    update(t, _cam, reduced) {
      let on = true;
      if (!reduced) {
        let u = t % total;
        for (const [state, dur] of seq) { if (u < dur) { on = state; break; } u -= dur; }
      }
      lamp.material.opacity = on ? 1 : 0;
      lamp.scale.setScalar(on ? 16 : 2);
      core.visible = on;
    },
  };
}

// --------------------------------------------------------------------- a door in the sky
function door() {
  const b = new BrickBuilder({ seed: 52, jitter: 0, colorJitter: 0.02 });
  buildTerrain(b, { seed: 61, blobs: [{ x: 0, z: 0, rx: 7, rz: 5 }], edge: 1, depth: 8, taper: 1, roots: 2, grass: () => 'darkGreen', strata: [['darkGray', 'black'], ['black', 'darkGray']] });
  for (const x of [-3, 2]) for (let k = 0; k < 7; k++) b.brick(x, k * 3, -1, 1, 1, 3, k % 2 ? 'tan' : 'white', { studs: k === 6 });
  b.brick(-3, 21, -1, 6, 1, 3, 'white');
  b.brick(-2, 24, -1, 4, 1, 1, 'tan');
  // someone standing in the doorway, facing the light
  b.brick(-1, 0, 0, 1, 1, 2, 'black', { studs: false }); b.brick(0, 0, 0, 1, 1, 2, 'black', { studs: false });
  b.brick(-1, 2, 0, 2, 1, 3, 'black', { studs: false });
  b.round(-1, 5, 0, 1, 2, 'black', { studs: false });
  const { group } = b.build({ castShadow: false, receiveShadow: false });
  // the glow in the doorway, brighter toward the floor
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = 8; c.height = 64;
    const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, '#ffe9b8'); gr.addColorStop(1, '#fffbe8'); g.fillStyle = gr; g.fillRect(0, 0, 8, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(2.2, 2.0, 1.6), fog: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(4, 8.4), mat);
  plane.position.set(0, 4.4, -0.45);
  group.add(plane);
  const spill = lightCone(26, 6.5, 0xffe2a8, 0.16);
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, 4.4, -0.4);
  group.add(spill);
  const gl = halo(0xffe2a8, 11); gl.position.set(0, 4.4, 0.6); group.add(gl);
  group.scale.setScalar(2.4);
  group.position.set(-300, -2, -120);
  group.rotation.y = Math.atan2(CENTER.x - group.position.x, CENTER.z - group.position.z);
  return {
    group,
    update(t, _cam, reduced) {
      const k = reduced ? 1 : 0.94 + 0.06 * Math.sin(Math.floor(t * 6) * 1.7);
      mat.color.setRGB(2.2 * k, 2.0 * k, 1.6 * k);
      gl.material.opacity = k * 0.9;
    },
  };
}

// --------------------------------------------------------------------- a ringed brick planet
function planet() {
  const R = 15;
  const geo = new THREE.IcosahedronGeometry(R, 2);
  const bands = [0x8a4a1f, 0xb86a2c, 0x7a3a1c, 0xc98a45, 0x9a5524, 0x6b3418].map((h) => new THREE.Color(h).multiplyScalar(0.55));
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 3) {
    const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3 / R;
    const c = bands[Math.min(bands.length - 1, Math.floor((y * 0.5 + 0.5) * bands.length))];
    for (let k = 0; k < 3; k++) col.set([c.r, c.g, c.b], (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const ball = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, fog: false }));
  // the ring: two rows of little bricks
  const brick = new THREE.BoxGeometry(1.75, 0.7, 0.85);
  const n = 90, ring = new THREE.InstancedMesh(brick, new THREE.MeshStandardMaterial({ roughness: 0.6, fog: false }), n * 2);
  const palette = [0xc91a09, 0x0055bf, 0xf2cd37, 0x237841, 0xe9ecef, 0xfe8a18].map((h) => new THREE.Color(h).multiplyScalar(0.6));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = R * (1.75 + row * 0.2);
    q.setFromAxisAngle(up, -a + Math.PI / 2);
    m.compose(new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr), q, new THREE.Vector3(1, 1, 1));
    ring.setMatrixAt(row * n + i, m);
    ring.setColorAt(row * n + i, palette[(i * 7 + row * 3) % palette.length]);
  }
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(2.8, 1), new THREE.MeshStandardMaterial({ color: 0x8e9db0, flatShading: true, roughness: 0.9, fog: false }));
  const tilt = new THREE.Group();
  tilt.rotation.set(0.5, 0, 0.35);
  tilt.add(ball, ring);
  const group = new THREE.Group();
  group.add(tilt, moon);
  group.position.set(260, 125, -740);
  return {
    group,
    update(t, _cam, reduced) {
      const s = reduced ? 0 : Math.floor(t * 6) / 6;
      ball.rotation.y = s * 0.02;
      const a = s * 0.05;
      moon.position.set(Math.cos(a) * R * 3.1, Math.sin(a) * R * 0.7, Math.sin(a) * R * 3.1);
    },
  };
}

// --------------------------------------------------------------------- shooting stars
function shootingStars() {
  const geo = new THREE.PlaneGeometry(1, 1).translate(-0.5, 0, 0); // head at the origin, tail trailing -x
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
    uniforms: { opacity: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float opacity; varying vec2 vUv; void main(){ float along = pow(vUv.x, 2.5); float across = smoothstep(0.5, 0.0, abs(vUv.y - 0.5)); gl_FragColor = vec4(vec3(1.6, 1.8, 2.4) * along, along * across * opacity); }',
  });
  const group = new THREE.Group();
  const stars = [0, 1, 2].map((i) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -5; m.visible = false; group.add(m); return { m, period: 9 + i * 3.7, off: i * 4.1 }; });
  const h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  return {
    group,
    update(t, camera, reduced) {
      for (const s of stars) {
        const cyc = Math.floor((t + s.off) / s.period), u = ((t + s.off) / s.period - cyc) / 0.07;
        if (reduced || u >= 1) { s.m.visible = false; continue; }
        const az = h(cyc * 3.1 + s.off) * Math.PI * 2, el = 0.12 + h(cyc * 1.7 + s.period) * 0.5;
        const a = az + u * 0.45, e = el - u * 0.18;
        s.m.position.set(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)).multiplyScalar(720).add(camera.position);
        s.m.lookAt(camera.position);
        s.m.rotateZ(-0.35);
        s.m.scale.set(70, 0.9, 1);
        s.m.visible = true;
      }
      mat.uniforms.opacity.value = 1;
    },
  };
}

/** Build everything (lite: low quality tier). update(t, camera, reduced) once per frame. */
export function buildWonders({ lite = false } = {}) {
  const group = new THREE.Group();
  // the low tier keeps the cheap ones and drops the heavy brick builds
  const items = lite ? [farLighthouse(), planet(), shootingStars()] : [skyline(), farLighthouse(), door(), planet(), shootingStars()];
  for (const it of items) group.add(it.group);
  return { group, update: (t, camera, reduced) => { for (const it of items) it.update(t, camera, reduced); } };
}

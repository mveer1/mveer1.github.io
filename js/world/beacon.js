// Laser beacons: a small brick-built blaster that fires a thin beam straight up (perpendicular
// to the ground), so a hidden piece can be spotted from any island. Walking up to one shuts
// it down: the beam fades out and its lens turns green. The same beam, in green, marks the
// reward once all seven are found.
//
// createBeam()   just the beam (for anything that wants a column of light)
// createBeacon() blaster model + ground ring + beam
// updateBeams()  per-frame: stepped pulse and state fades. The beam keeps one narrow, straight width.
import * as THREE from 'three';
import { BrickBuilder } from '../lego/builder.js';
import { FPS } from '../core/stepped.js';

const COLORS = {
  red: { core: [2.4, 0.9, 0.7], glow: [1.5, 0.07, 0.04], lens: 0xff3322 },
  green: { core: [0.9, 2.4, 1.1], glow: [0.15, 1.5, 0.25], lens: 0x7dff8a },
};

const beams = [];
let sharedGeo = null;

function beamMaterial(rgb, opacity) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { color: { value: new THREE.Color(...rgb) }, opacity: { value: opacity }, level: { value: 1 }, time: { value: 0 } },
    vertexShader: `varying float vT; varying vec3 vN; varying vec3 vV;
      void main(){ vT = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 color; uniform float opacity; uniform float level; uniform float time;
      varying float vT; varying vec3 vN; varying vec3 vV;
      void main(){
        float edge = pow(max(abs(dot(vN, vV)), 0.0001), 1.6);                 // soft sides
        float fade = pow(max(1.0 - vT, 0.0), 0.45) * smoothstep(0.0, 0.004, vT); // long fade into the sky
        float pulse = 0.78 + 0.22 * sin(vT * 260.0 - time * 7.0);   // bands climbing the beam
        gl_FragColor = vec4(color, opacity * level * edge * fade * pulse);
      }`,
  });
}

/** A column of light, base at the origin, rising along +y. */
export function createBeam({ color = 'red', height = 190, radius = 0.4 } = {}) {
  const c = COLORS[color];
  sharedGeo ||= new THREE.CylinderGeometry(1, 1, 1, 14, 1, true).translate(0, 0.5, 0);
  const group = new THREE.Group();
  const core = new THREE.Mesh(sharedGeo, beamMaterial(c.core, 1));
  const glow = new THREE.Mesh(sharedGeo, beamMaterial(c.glow, 0.55));
  core.renderOrder = glow.renderOrder = 4;
  core.frustumCulled = glow.frustumCulled = false;
  group.add(glow, core);
  const beam = { group, core, glow, height, radius, level: 1, target: 1, color };
  setBeamScale(beam);
  beams.push(beam);
  return beam;
}

function setBeamScale(b) {
  b.core.scale.set(0.085, b.height, 0.085);
  b.glow.scale.set(b.radius, b.height, b.radius);
}

/** Per-frame: call once from the app loop. */
export function updateBeams(t, dt, reduced = false) {
  const step = Math.floor(t * FPS.machine) / FPS.machine;
  for (const b of beams) {
    if (!b.group.parent) continue;
    // fade toward the target level
    if (b.level !== b.target) b.level = reduced ? b.target : Math.abs(b.target - b.level) < 0.02 ? b.target : b.level + (b.target - b.level) * Math.min(1, dt * 3);
    for (const m of [b.core, b.glow]) {
      m.material.uniforms.time.value = reduced ? 0 : step;
      m.material.uniforms.level.value = b.level * (reduced ? 1 : 0.94 + 0.06 * Math.sin(step * 31));
    }
    b.group.visible = b.level > 0.01;
  }
}

/** The blaster: a base plate, a column, a red turret and a lens that points straight up. */
export function createBeacon({ color = 'red', height = 190 } = {}) {
  const c = COLORS[color];
  const b = new BrickBuilder({ seed: 5, jitter: 0, colorJitter: 0 });
  b.plate(-2, 0, -2, 4, 4, 'darkGray');
  for (const [x, z] of [[-2, -2], [1, -2], [-2, 1], [1, 1]]) b.plate(x, 1, z, 1, 1, 'yellow', { studs: true });
  b.round(-1, 1, -1, 2, 3, 'black', { studs: false });
  b.brick(-1, 4, -1, 2, 2, 3, color === 'red' ? 'red' : 'green');
  b.round(-1, 7, -1, 2, 1, 'black', { studs: false, occ: false });
  const { group: model } = b.build();
  const group = new THREE.Group();
  group.add(model);
  // the lens: a bright disc that changes colour when the beacon is shut down
  const lensMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(c.lens).multiplyScalar(2.2) });
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 20), lensMat);
  lens.position.y = 8 * 0.4 + 0.02;
  group.add(lens);
  // a ring on the ground, so the spot reads from above
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(c.lens).multiplyScalar(1.4), transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.62, 36), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
  group.add(ring);
  const beam = createBeam({ color, height });
  beam.group.position.y = 8 * 0.4 + 0.1;
  group.add(beam.group);
  const done = new THREE.Color(0x7dff8a).multiplyScalar(1.3);
  return {
    group, beam, lens, ring,
    /** on = armed (beam firing); off = shut down (beam fades, lens green). */
    setArmed(on, instant = false) {
      beam.target = on ? 1 : 0;
      if (instant) beam.level = beam.target;
      lensMat.color.copy(on ? new THREE.Color(c.lens).multiplyScalar(2.2) : done);
      ringMat.color.copy(on ? new THREE.Color(c.lens).multiplyScalar(1.4) : done);
      ringMat.opacity = on ? 0.55 : 0.3;
    },
    /** Held-frame ring pulse. */
    tick(t, reduced) {
      if (beam.target === 0) return;
      const fr = Math.floor(t * FPS.life);
      ring.scale.setScalar(reduced ? 1 : 1 + (fr % 3) * 0.05);
      ringMat.opacity = reduced ? 0.55 : 0.4 + (fr % 3) * 0.12;
    },
  };
}

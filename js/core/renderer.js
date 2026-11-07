// Renderer, post chain and resize. One WebGL context for the whole page.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Objects on this layer are the far-off scenery: drawn normally, but kept out of the tilt-shift blur. */
export const FAR_LAYER = 1;

// Tilt-shift: blur grows with distance from a horizontal focus band. One shader,
// run twice (horizontal, vertical). Based on the classic three.js example shaders.
// A mask (white where far-off scenery is) switches the blur off, so distant things stay crisp.
const TiltShift = {
  uniforms: { tDiffuse: { value: null }, tMask: { value: null }, dir: { value: new THREE.Vector2(1, 0) }, amount: { value: 0.002 }, focus: { value: 0.5 }, band: { value: 0.16 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform sampler2D tMask; uniform vec2 dir; uniform float amount; uniform float focus; uniform float band;
    varying vec2 vUv;
    void main(){
      float d = max(0.0, abs(vUv.y - focus) - band);
      float k = amount * smoothstep(0.0, 0.35, d) * 1.6 * (1.0 - texture2D(tMask, vUv).r);
      vec2 o = dir * k;
      vec4 s = texture2D(tDiffuse, vUv) * 0.1633;
      s += texture2D(tDiffuse, vUv + o * 1.0) * 0.1531; s += texture2D(tDiffuse, vUv - o * 1.0) * 0.1531;
      s += texture2D(tDiffuse, vUv + o * 2.0) * 0.12245; s += texture2D(tDiffuse, vUv - o * 2.0) * 0.12245;
      s += texture2D(tDiffuse, vUv + o * 3.0) * 0.0918; s += texture2D(tDiffuse, vUv - o * 3.0) * 0.0918;
      s += texture2D(tDiffuse, vUv + o * 4.0) * 0.051; s += texture2D(tDiffuse, vUv - o * 4.0) * 0.051;
      gl_FragColor = s;
    }`,
};

// Final grade in display space: vignette, a touch of warm/cool split, fine grain.
const Grade = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vignette: { value: 0.42 }, grain: { value: 0.035 }, fade: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time; uniform float vignette; uniform float grain; uniform float fade;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.299,0.587,0.114));
      c = mix(c, c * vec3(0.94,0.98,1.06), (1.0 - l) * 0.35);   // cool shadows
      c = mix(c, c * vec3(1.05,1.0,0.93), l * l * 0.25);          // warm highlights
      vec2 q = vUv - 0.5;
      float v = 1.0 - dot(q, q) * vignette * 2.2;
      c *= clamp(v, 0.0, 1.0);
      float g = hash(vUv * vec2(1920.0, 1080.0) + fract(time) * 91.7) - 0.5;
      c += g * grain * (0.6 + 0.4 * (1.0 - l));
      c = mix(c, vec3(0.02, 0.03, 0.05), fade);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export function createRenderer(canvas, settings) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !settings.post, powerPreference: 'high-performance', alpha: false, stencil: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, settings.dpr));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = settings.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false; // accumulate across all passes of a frame

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.5, 1400);
  camera.layers.enable(FAR_LAYER);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
  pmrem.dispose();

  // silhouettes of the far-off layer, half resolution, for the tilt-shift mask
  const maskMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
  let maskRT = null;
  function renderMask() {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const w = Math.max(2, size.x >> 1), h = Math.max(2, size.y >> 1);
    if (!maskRT) maskRT = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false });
    else if (maskRT.width !== w || maskRT.height !== h) maskRT.setSize(w, h);
    const sm = renderer.shadowMap, nu = sm.needsUpdate;
    const bg = scene.background, fog = scene.fog, layers = camera.layers.mask, ov = scene.overrideMaterial;
    const hidden = [];
    // sprites and points have their own shaders: leave them out of the silhouette
    scene.traverse((o) => { if ((o.isSprite || o.isPoints) && o.visible && (o.layers.mask & (1 << FAR_LAYER))) { o.visible = false; hidden.push(o); } });
    scene.background = null; scene.fog = null; scene.overrideMaterial = maskMat;
    camera.layers.set(FAR_LAYER); // only the far layer: no lights, so no shadow pass either
    const clear = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 1);
    renderer.setRenderTarget(maskRT); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
    renderer.setClearColor(clear, ca);
    scene.background = bg; scene.fog = fog; scene.overrideMaterial = ov; camera.layers.mask = layers;
    for (const o of hidden) o.visible = true;
    sm.needsUpdate = nu;
    return maskRT.texture;
  }

  let composer = null, bloom = null, tiltH = null, tiltV = null, grade = null;
  function buildComposer(s) {
    if (composer) { composer.dispose(); composer = null; }
    if (!s.post) return;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: s.msaa });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    if (s.bloom) {
      bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.5, 0.55, 0.72);
      composer.addPass(bloom);
    } else bloom = null;
    if (s.tilt) {
      tiltH = new ShaderPass(TiltShift); tiltV = new ShaderPass(TiltShift);
      tiltV.uniforms.dir.value.set(0, 1);
      composer.addPass(tiltH); composer.addPass(tiltV);
    } else { tiltH = tiltV = null; }
    composer.addPass(new OutputPass());
    grade = new ShaderPass(Grade);
    composer.addPass(grade);
  }
  buildComposer(settings);

  const api = {
    renderer, scene, camera,
    get composer() { return composer; },
    focus: { amount: 1, center: 0.5 },
    fade: 0,
    applySettings(s) {
      renderer.setPixelRatio(Math.min(devicePixelRatio, s.dpr));
      renderer.setSize(innerWidth, innerHeight, false);
      renderer.shadowMap.enabled = s.shadows;
      buildComposer(s);
      api.resize();
    },
    resize() {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (composer) composer.setSize(w, h);
    },
    render(t) {
      renderer.info.reset();
      if (composer) {
        const W = innerWidth, H = innerHeight;
        if (tiltH) {
          tiltH.uniforms.amount.value = (2.4 / W) * api.focus.amount * 4;
          tiltV.uniforms.amount.value = (2.4 / H) * api.focus.amount * 4;
          tiltH.uniforms.focus.value = tiltV.uniforms.focus.value = api.focus.center;
          tiltH.uniforms.tMask.value = tiltV.uniforms.tMask.value = renderMask();
        }
        grade.uniforms.time.value = t;
        grade.uniforms.fade.value = api.fade;
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    },
  };
  addEventListener('resize', () => api.resize());
  return api;
}

/** Moonlight with a shadow camera that follows a focus point, snapped to texels. */
export function createKeyLight(scene, settings) {
  const dir = new THREE.Vector3(-0.62, 0.42, -0.66).normalize(); // from the moon (behind-left)
  const light = new THREE.DirectionalLight(0xb8c8e8, 2.1);
  light.castShadow = settings.shadows;
  const S = 46;
  Object.assign(light.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: 160 });
  light.shadow.mapSize.set(settings.shadowSize || 1024, settings.shadowSize || 1024);
  light.shadow.bias = -0.00035; light.shadow.normalBias = 0.035;
  light.shadow.radius = 3;
  scene.add(light); scene.add(light.target);
  const focus = new THREE.Vector3();
  return {
    light, dir,
    follow(p) {
      const texel = (2 * S) / (light.shadow.mapSize.x || 1024);
      focus.set(Math.round(p.x / texel) * texel, Math.round(p.y / texel) * texel, Math.round(p.z / texel) * texel);
      light.target.position.copy(focus);
      light.position.copy(focus).addScaledVector(dir, 80);
    },
    setShadows(on, size) {
      light.castShadow = on;
      if (size && light.shadow.mapSize.x !== size) {
        light.shadow.mapSize.set(size, size);
        if (light.shadow.map) { light.shadow.map.dispose(); light.shadow.map = null; }
      }
    },
  };
}

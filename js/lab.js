// Parts lab: renders library parts and props in isolation for visual QA.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BrickBuilder } from './lego/builder.js';
import { createMaterials } from './lego/materials.js';
import { setDetail, part } from './lego/parts.js';

setDetail(2);
createMaterials(2);
const view = new URLSearchParams(location.search).get('view') || 'parts';
document.getElementById('view').value = view;
document.getElementById('view').onchange = (e) => { location.search = '?view=' + e.target.value; };

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = (new URLSearchParams(location.search).get("tm") === "agx") ? THREE.AgXToneMapping : THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141b26);
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;

const cam = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 500);
const controls = new OrbitControls(cam, renderer.domElement);

const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
key.position.set(-14, 22, 12);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 80 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key);
scene.add(new THREE.HemisphereLight(0x8aa0c0, 0x202020, 0.5));
const rim = new THREE.DirectionalLight(0x9fc0ff, 1.2); rim.position.set(12, 8, -16); scene.add(rim);

const b = new BrickBuilder({ seed: 3 });
// baseplate
b.fillPlates(-12, -1, -8, 26, 16, (x, z) => ((x + z) % 7 === 0 ? 'brightGreen' : 'green'), { sizes: [[4, 4], [4, 2], [2, 4], [2, 2]] });

if (view === 'parts') {
  let x = -10;
  b.brick(x, 0, -6, 2, 4, 3, 'red'); x += 3;
  b.brick(x, 0, -6, 1, 2, 1, 'yellow'); b.brick(x, 1, -6, 1, 2, 1, 'blue'); x += 2;
  b.tile(x, 0, -6, 2, 2, 'tan'); x += 3;
  b.slope(x, 0, -6, 2, 2, 3, 'sandGreen', 0); x += 3;
  b.slope(x, 0, -6, 2, 3, 3, 'darkRed', 0, 1); x += 3;
  b.round(x, 0, -6, 1, 3, 'white'); b.round(x, 3, -6, 1, 3, 'white'); x += 2;
  b.round(x, 0, -6, 2, 3, 'lightGray'); x += 3;
  b.cone(x, 0, -6, 'orange'); x += 2;
  b.put('arch', [4, 6], -10, 0, -1, 'darkTan');
  b.put('window', [2, 6], -5, 0, -1, 'white');
  b.put('pane', [2, 6], -5, 0, -1, 'transClear', { occ: false });
  b.put('roundTile', [2], -2, 0, -1, 'glowAmber');
  b.put('round', [1, 3], 1, 0, -1, 'transOrange');
  b.put('flower', [], 3, 0, -1, 'yellow');
  b.put('flower', [], 4, 0, 0, 'red');
  // a running-bond wall
  b.wall(-10, 0, 3, 8, 'x', 9, (c, p) => (c + p) % 3 ? 'darkTan' : 'tan');
  b.wall(0, 0, 3, 6, 'x', 6, 'darkRed');
  const g = part('gear', 16);
  b.free('gear', [16], new THREE.Matrix4().makeTranslation(9, 2, 0), 'lightGray');
  b.free('dish', [4], new THREE.Matrix4().makeTranslation(7, 0, 3), 'white');
  for (let i = 0; i < 5; i++) b.free('leaf', [1.8, 0.8], new THREE.Matrix4().makeTranslation(12, 0.5, 4).multiply(new THREE.Matrix4().makeRotationY(i * 1.25)).multiply(new THREE.Matrix4().makeRotationZ(0.45)), 'brightGreen');
  // pine
  b.round(11, 0, -6, 1, 3, 'brown');
  for (let i = 0; i < 4; i++) b.free('pineLayer', [1.8 - i * 0.35, 1.2], new THREE.Matrix4().makeTranslation(11.5, 1.2 + i * 0.85, -5.5), 'darkGreen');
  cam.position.set(4, 16, 26);
  controls.target.set(1, 1, -1);
}

const { group, stats } = b.build();
scene.add(group);

async function addFigure() {
  const { createMinifig } = await import('./character/minifig.js');
  const fig = createMinifig();
  fig.root.position.set(view === 'figure' ? 0 : 6, 0, view === 'figure' ? 0 : -2);
  scene.add(fig.root);
  if (view === 'figure') {
    fig.setPose({ legL: 0.35, legR: -0.35, armL: -0.4, armR: 0.5, head: 0.25 });
    const fig2 = createMinifig();
    fig2.root.position.set(-3.5, 0, 0.5); fig2.root.rotation.y = 0.9; scene.add(fig2.root);
    const fig3 = createMinifig();
    fig3.root.position.set(3.5, 0, 0.5); fig3.root.rotation.y = Math.PI + 0.6; scene.add(fig3.root);
    cam.position.set(0, 4.5, 13); controls.target.set(0, 2.4, 0); cam.fov = 30; cam.updateProjectionMatrix();
  }
  window.__fig = fig;
}

try { await addFigure(); } catch (e) { console.warn('minifig not ready', e.message); }

controls.update();
window.__stats = () => ({ ...stats, calls: renderer.info.render.calls, rtris: renderer.info.render.triangles });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, cam); });
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));

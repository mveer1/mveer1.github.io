// The explorer minifigure: geometry, printed decals and a simple joint rig.
// Units: studs. The root sits at the soles; the figure faces +z.
//
// Design (docs/art-direction.md): classic yellow skin, dark orange explorer jacket
// with a lime "hub" chest mark (the classic site's brand icon), sand-blue trousers,
// reddish-brown wide-brim hat, tan backpack, and a lantern in the left hand.
import * as THREE from 'three';
import { solid } from '../lego/materials.js';

const COL = {
  skin: '#f2cd37', jacket: '#a95500', jacketDark: '#7a3d00', lime: '#bada55',
  trousers: 0x6074a1, hat: 0x582a12, band: 0x958a73, pack: 0xe4cd9e, packDark: 0xb9a57c,
  black: 0x1b2a34,
};

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function faceTexture(kind = 'open') {
  return canvasTex(1024, 512, (g, W, H) => {
    g.fillStyle = COL.skin; g.fillRect(0, 0, W, H);
    const cx = W / 2, ey = H * 0.44, sep = 58;
    g.fillStyle = '#1a1a1a'; g.strokeStyle = '#1a1a1a'; g.lineCap = 'round';
    // brows
    g.lineWidth = 9;
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(cx + s * (sep - 22), ey - 58 + (kind === 'surprised' ? -10 : 0)); g.quadraticCurveTo(cx + s * sep, ey - 70 + (kind === 'surprised' ? -12 : 0), cx + s * (sep + 22), ey - 60 + (kind === 'surprised' ? -8 : 0)); g.stroke();
    }
    // eyes
    for (const s of [-1, 1]) {
      if (kind === 'closed') {
        g.lineWidth = 10; g.beginPath(); g.moveTo(cx + s * sep - 20, ey + 2); g.quadraticCurveTo(cx + s * sep, ey + 14, cx + s * sep + 20, ey + 2); g.stroke();
      } else {
        const ry = kind === 'surprised' ? 30 : 26;
        g.beginPath(); g.ellipse(cx + s * sep, ey, 19, ry, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + s * sep - 6, ey - 9, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1a1a1a';
      }
    }
    // mouth
    g.lineWidth = 10;
    if (kind === 'surprised') { g.beginPath(); g.ellipse(cx, H * 0.7, 16, 20, 0, 0, Math.PI * 2); g.fill(); }
    else { g.beginPath(); g.arc(cx, H * 0.6, 64, 0.22 * Math.PI, 0.78 * Math.PI); g.stroke(); }
  });
}

function torsoTexture() {
  return canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = COL.jacket; g.fillRect(0, 0, W, H);
    // shirt in the open collar
    g.fillStyle = '#e9e1cf';
    g.beginPath(); g.moveTo(W * 0.36, 0); g.lineTo(W * 0.5, H * 0.34); g.lineTo(W * 0.64, 0); g.closePath(); g.fill();
    // collar lapels
    g.fillStyle = COL.jacketDark;
    g.beginPath(); g.moveTo(W * 0.3, 0); g.lineTo(W * 0.5, H * 0.36); g.lineTo(W * 0.42, H * 0.05); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(W * 0.7, 0); g.lineTo(W * 0.5, H * 0.36); g.lineTo(W * 0.58, H * 0.05); g.closePath(); g.fill();
    // zip
    g.strokeStyle = '#3a2410'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(W * 0.5, H * 0.36); g.lineTo(W * 0.5, H); g.stroke();
    // pockets
    g.strokeStyle = COL.jacketDark; g.lineWidth = 6;
    g.strokeRect(W * 0.14, H * 0.6, W * 0.22, H * 0.2);
    g.strokeRect(W * 0.64, H * 0.6, W * 0.22, H * 0.2);
    // lime straps
    g.fillStyle = COL.lime;
    g.fillRect(W * 0.17, 0, W * 0.07, H * 0.55);
    g.fillRect(W * 0.76, 0, W * 0.07, H * 0.55);
    // hub mark: a centre node with four branches
    const cx = W * 0.705, cy = H * 0.4, r = 9;
    g.strokeStyle = COL.lime; g.lineWidth = 4; g.fillStyle = COL.lime;
    for (const [dx, dy] of [[-22, -18], [22, -18], [-22, 18], [22, 18]]) {
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + dx, cy + dy); g.stroke();
      g.beginPath(); g.arc(cx + dx, cy + dy, 6, 0, Math.PI * 2); g.fill();
    }
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  });
}

/** Trapezoid torso with the front face UV-mapped for the print. */
function torsoGeometry(bw, tw, d, H) {
  const g = new THREE.BufferGeometry();
  const dz = d / 2;
  const v = {
    b0: [-bw, 0, -dz], b1: [bw, 0, -dz], b2: [bw, 0, dz], b3: [-bw, 0, dz],
    t0: [-tw, H, -dz], t1: [tw, H, -dz], t2: [tw, H, dz], t3: [-tw, H, dz],
  };
  const pos = [], uv = [];
  const groups = [];
  const quad = (a, b, c, d2, uvs) => {
    for (const p of [a, b, c, a, c, d2]) pos.push(...p);
    const U = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (const i of [0, 1, 2, 0, 2, 3]) uv.push(...U[i]);
  };
  // front (print) — group 1
  const u = (x) => (x + bw) / (2 * bw);
  quad(v.b3, v.b2, v.t2, v.t3, [[0, 0], [1, 0], [u(tw), 1], [u(-tw), 1]]);
  groups.push([0, 6, 1]);
  const start = pos.length / 3;
  quad(v.b1, v.b0, v.t0, v.t1);          // back
  quad(v.b0, v.b3, v.t3, v.t0);          // left
  quad(v.b2, v.b1, v.t1, v.t2);          // right
  quad(v.t3, v.t2, v.t1, v.t0);          // top
  quad(v.b0, v.b1, v.b2, v.b3);          // bottom
  groups.push([start, pos.length / 3 - start, 0]);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  for (const [s, c, m] of groups) g.addGroup(s, c, m);
  return g;
}

function cylBetween(a, b, r, mat, segs = 12) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, segs), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

function roundedBox(w, h, d, r, mat) {
  // A box with softened vertical edges using a lathe-free approach: extrude a rounded rect.
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 1, curveSegments: 3 });
  g.rotateX(-Math.PI / 2); // extrude along +y
  g.translate(0, 0, 0);
  return new THREE.Mesh(g, mat);
}

export function createMinifig({ lanternLight = false } = {}) {
  const root = new THREE.Group(); root.name = 'minifig';
  const M = {
    skin: solid(0xf2cd37),
    jacket: solid(0xa95500),
    trousers: solid(COL.trousers),
    hat: solid(COL.hat, { roughness: 0.5, clearcoat: 0.1 }),
    band: solid(COL.band),
    pack: solid(COL.pack),
    packDark: solid(COL.packDark),
    black: solid(COL.black),
    lime: solid(0xbada55),
  };
  const faces = { open: faceTexture('open'), closed: faceTexture('closed'), surprised: faceTexture('surprised') };
  const faceMat = new THREE.MeshPhysicalMaterial({ map: faces.open, roughness: 0.3, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 0.6 });
  const printMat = new THREE.MeshPhysicalMaterial({ map: torsoTexture(), roughness: 0.34, clearcoat: 0.3, envMapIntensity: 0.6 });

  const cast = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

  // --- hips and legs
  const hipY = 1.2;
  const hips = new THREE.Group(); hips.position.y = hipY; root.add(hips);
  const hipBlock = roundedBox(1.88, 0.34, 0.82, 0.08, M.trousers); hipBlock.position.y = 0.0; hips.add(hipBlock);
  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.47, 0.1, 0); hips.add(pivot);
    const leg = roundedBox(0.9, 1.0, 0.78, 0.06, M.trousers); leg.position.set(0, -1.2, -0.02); pivot.add(leg);
    const foot = roundedBox(0.9, 0.32, 1.02, 0.08, M.trousers); foot.position.set(0, -1.3, 0.1); pivot.add(foot);
    legs.push(pivot);
  }
  // --- torso
  const torso = new THREE.Group(); torso.position.y = hipY + 0.34; root.add(torso);
  const TH = 1.5;
  const torsoMesh = new THREE.Mesh(torsoGeometry(0.95, 0.74, 0.84, TH), [M.jacket, printMat]);
  torso.add(torsoMesh);
  // backpack
  const pack = new THREE.Group(); pack.position.set(0, 0.25, -0.42); torso.add(pack);
  const packBody = roundedBox(1.18, 1.05, 0.5, 0.1, M.pack); packBody.position.set(0, 0, -0.25); pack.add(packBody);
  const flap = roundedBox(1.0, 0.36, 0.06, 0.04, M.packDark); flap.position.set(0, 0.72, -0.52); pack.add(flap);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.3, 12), solid(0x582a12)); roll.rotation.z = Math.PI / 2; roll.position.set(0, 1.2, -0.28); pack.add(roll);
  // arms
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.8, TH - 0.28, 0); torso.add(pivot);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 10), M.jacket); pivot.add(shoulder);
    const elbow = new THREE.Vector3(s * 0.16, -0.72, 0.05), wrist = new THREE.Vector3(s * 0.2, -0.95, 0.42);
    pivot.add(cylBetween(new THREE.Vector3(0, 0, 0), elbow, 0.21, M.jacket));
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 8), M.jacket); e.position.copy(elbow); pivot.add(e);
    pivot.add(cylBetween(elbow, wrist, 0.2, M.jacket));
    // hand: C-shaped clip
    const hand = new THREE.Group(); hand.position.copy(wrist).add(new THREE.Vector3(0, -0.04, 0.12)); pivot.add(hand);
    const wristCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.16, 10), M.skin); wristCyl.rotation.x = Math.PI / 2 - 0.4; wristCyl.position.z = -0.08; hand.add(wristCyl);
    const clip = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.075, 8, 14, Math.PI * 1.5), M.skin);
    clip.rotation.y = Math.PI / 2; clip.rotation.x = 0.4; clip.position.z = 0.12; hand.add(clip);
    arms.push({ pivot, hand, side: s });
  }
  // --- head
  const head = new THREE.Group(); head.position.y = TH; torso.add(head);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 14), M.skin); neck.position.y = 0.08; head.add(neck);
  const prof = [[0.001, 0], [0.4, 0], [0.5, 0.07], [0.58, 0.2], [0.58, 0.8], [0.5, 0.93], [0.4, 1.0], [0.001, 1.0]].map(([r, y]) => new THREE.Vector2(r, y));
  const headGeo = new THREE.LatheGeometry(prof, 32, Math.PI);
  const pa = headGeo.attributes.position, ua = headGeo.attributes.uv;
  for (let i = 0; i < pa.count; i++) ua.setY(i, pa.getY(i));
  const headMesh = new THREE.Mesh(headGeo, faceMat); headMesh.position.y = 0.16; head.add(headMesh);
  // hat
  const hat = new THREE.Group(); hat.position.y = 0.16 + 0.86; head.add(hat);
  const hatProf = [[0.001, 0.0], [1.02, 0.0], [1.06, 0.05], [1.0, 0.09], [0.66, 0.12], [0.63, 0.5], [0.5, 0.62], [0.2, 0.56], [0.001, 0.6]].map(([r, y]) => new THREE.Vector2(r, y));
  const hatMesh = new THREE.Mesh(new THREE.LatheGeometry(hatProf, 28), M.hat); hat.add(hatMesh);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.655, 0.66, 0.13, 28), M.band); band.position.y = 0.19; hat.add(band);
  hat.rotation.x = -0.06;

  // --- lantern in the left hand
  const lantern = new THREE.Group();
  const lh = arms[0].hand; lh.add(lantern);
  lantern.position.set(0, -0.12, 0.12);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 6, 12, Math.PI), M.black); handle.position.y = -0.02; lantern.add(handle);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.14, 10), M.black); cap.position.y = -0.1; lantern.add(cap);
  const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffa040).multiplyScalar(2.0) });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 10), glowMat); glass.position.y = -0.32; lantern.add(glass);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 10), M.black); base.position.y = -0.5; lantern.add(base);
  let light = null;
  if (lanternLight) {
    light = new THREE.PointLight(0xffa64d, 9, 16, 1.6);
    light.position.y = -0.32; lantern.add(light);
  }

  cast(root);
  glass.castShadow = false;

  const state = { face: 'open' };
  function setFace(kind) {
    if (state.face === kind) return;
    state.face = kind; faceMat.map = faces[kind]; faceMat.needsUpdate = true;
  }

  /** Pose angles in radians; forward swing positive. */
  function setPose(p) {
    legs[0].rotation.x = -(p.legL || 0); legs[1].rotation.x = -(p.legR || 0);
    arms[0].pivot.rotation.x = -(p.armL || 0); arms[1].pivot.rotation.x = -(p.armR || 0);
    arms[0].pivot.rotation.z = -(p.armLz || 0); arms[1].pivot.rotation.z = (p.armRz || 0);
    head.rotation.y = p.head || 0; head.rotation.x = p.headX || 0;
    torso.rotation.y = p.torsoY || 0;
    torso.rotation.x = p.lean || 0;
    hips.position.y = hipY + (p.bob || 0);
    torso.position.y = hipY + 0.34 + (p.bob || 0);
    lantern.rotation.x = p.swing || 0;
  }

  setPose({});
  return { root, setPose, setFace, light, lantern, head, parts: { legs, arms, torso, hips } };
}

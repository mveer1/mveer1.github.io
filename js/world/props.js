// Reusable brick-built props. Each takes a BrickBuilder and grid coordinates
// (x, z in studs, y in plates, local to the island). Props that emit light push
// an anchor { x, y, z, color, power } into `ctx.lights` (world units, local).
import * as THREE from 'three';
import { PLATE } from '../lego/dims.js';

const M4 = (x, y, z, ry = 0, rx = 0, rz = 0) => new THREE.Matrix4().compose(
  new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1));
export { M4 };

/** Mark a volume as occupied (for camera framing) without placing bricks. Plates for y. */
export function occVolume(b, cx, cz, r, y0, y1) {
  for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
    if (Math.hypot(x + 0.5 - cx, z + 0.5 - cz) > r + 0.3) continue;
    for (let l = y0; l < y1; l++) b.camOcc.add(x + ',' + l + ',' + z);
  }
}

/** Reserve cells (for walk blocking and scatter avoidance). */
export function reserve(ctx, x, z, w, d, block = true) {
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
    const k = (x + i) + ',' + (z + j);
    ctx.reserved.add(k);
    if (block) ctx.blocked.add(k);
  }
}

export function lamppost(b, ctx, x, y, z, { height = 4, post = 'black', glow = 'glowAmber', light = true, power = 1 } = {}) {
  b.plate(x - 0, y, z - 0, 1, 1, 'darkGray');
  for (let i = 0; i < height; i++) b.round(x, y + 1 + i * 3, z, 1, 3, post, { studs: i === height - 1 });
  const top = y + 1 + height * 3;
  b.round(x, top, z, 1, 3, glow);
  b.put('cone', [1, 2], x, top + 3, z, post);
  if (light) ctx.lights.push({ x: x + 0.5, y: (top + 1.5) * PLATE, z: z + 0.5, color: 0xffa64d, power });
  occVolume(b, x + 0.5, z + 0.5, 1.2, y + 1, top + 6);
  reserve(ctx, x, z, 1, 1);
}

export function lantern(b, ctx, x, y, z, { power = 0.7, light = true } = {}) {
  b.round(x, y, z, 1, 1, 'black');
  b.round(x, y + 1, z, 1, 3, 'glowAmber');
  b.put('cone', [1, 2], x, y + 4, z, 'black');
  if (light) ctx.lights.push({ x: x + 0.5, y: (y + 2.5) * PLATE, z: z + 0.5, color: 0xffa64d, power });
}

export function crate(b, ctx, x, y, z, { size = 2, h = 6, color = 'brown', top = 'tan' } = {}) {
  b.brick(x, y, z, size, size, h - 1, color, { studs: false });
  b.tile(x, y + h - 1, z, size, size, top);
  reserve(ctx, x, z, size, size);
}

export function barrel(b, ctx, x, y, z, { color = 'darkBrown', band = 'darkGray' } = {}) {
  b.round(x, y, z, 2, 3, color);
  b.round(x, y + 3, z, 2, 1, band, { studs: false });
  b.round(x, y + 4, z, 2, 3, color, { studs: false });
  b.put('roundTile', [2], x, y + 7, z, 'brown');
  reserve(ctx, x, z, 2, 2);
}

export function pine(b, ctx, x, y, z, { layers = 4, size = 2.2, color = 'darkGreen', trunk = 'brown' } = {}) {
  b.round(x, y, z, 1, 3, trunk);
  b.round(x, y + 3, z, 1, 3, trunk, { studs: false });
  for (let i = 0; i < layers; i++) {
    const r = size - i * (size * 0.6 / layers);
    b.free('pineLayer', [r, 1.3], M4(x + 0.5, (y + 4) * PLATE + i * 1.0, z + 0.5, i * 0.7), color);
  }
  occVolume(b, x + 0.5, z + 0.5, size * 0.85, y + 4, y + 4 + Math.ceil((layers * 1.0 + 1.3) / PLATE));
  reserve(ctx, x, z, 1, 1);
}

/** Round, leafy tree: trunk plus clusters of leaf pieces. */
export function leafyTree(b, ctx, x, y, z, { color = 'green', alt = 'brightGreen', h = 4, spread = 1.9 } = {}) {
  for (let i = 0; i < h; i++) b.round(x, y + i * 3, z, 1, 3, 'brown', { studs: false });
  const cy = (y + h * 3) * PLATE;
  const r = b.rand;
  for (let tier = 0; tier < 3; tier++) {
    const n = 7 - tier * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + tier * 0.6;
      b.free('leaf', [spread - tier * 0.35, 0.95], M4(x + 0.5, cy + tier * 0.55, z + 0.5, a, 0, -0.25 - tier * 0.25 + r.range(-0.1, 0.1)), r.chance(0.5) ? color : alt);
    }
  }
  b.free('leaf', [0.9, 0.8], M4(x + 0.5, cy + 1.6, z + 0.5, 0.3, 0, 1.2), alt);
  occVolume(b, x + 0.5, z + 0.5, spread * 0.9, y + h * 3 - 2, y + h * 3 + 7);
  reserve(ctx, x, z, 1, 1);
}

export function fence(b, ctx, x, y, z, len, axis = 'x', { color = 'brown', block = true } = {}) {
  for (let i = 0; i <= len; i += 2) {
    const px = axis === 'x' ? x + Math.min(i, len - 1) : x, pz = axis === 'z' ? z + Math.min(i, len - 1) : z;
    b.round(px, y, pz, 1, 3, color, { studs: false });
    b.round(px, y + 3, pz, 1, 1, color);
  }
  if (axis === 'x') b.plate(x, y + 3, z, len, 1, color, { occ: true }); else b.plate(x, y + 3, z, 1, len, color);
  if (block) reserve(ctx, x, z, axis === 'x' ? len : 1, axis === 'z' ? len : 1);
}

/** A run of 1-wide wall with openings: [{ at, w, from (course), to (course) }]. */
function wallRun(b, x, y, z, len, axis, courses, color, openings = [], startOffset = 0) {
  for (let c = 0; c < courses; c++) {
    const cells = [];
    for (let i = 0; i < len; i++) {
      const open = openings.some((o) => i >= o.at && i < o.at + o.w && c >= o.from && c < o.to);
      cells.push(!open);
    }
    let i = 0;
    while (i < len) {
      if (!cells[i]) { i++; continue; }
      let run = 0; while (i + run < len && cells[i + run]) run++;
      // pack run with alternating offsets
      let p = 0;
      const first = ((c + startOffset) % 2 && run > 2) ? 1 + (run % 2) : 0;
      const segs = [];
      if (first) { segs.push(first); p = first; }
      while (p < run) {
        const rem = run - p;
        let s = rem >= 6 && b.rand.chance(0.25) ? 6 : rem >= 4 ? (b.rand.chance(0.7) ? 4 : 2) : rem >= 3 && b.rand.chance(0.5) ? 3 : Math.min(2, rem);
        segs.push(s); p += s;
      }
      let q = i;
      for (const s of segs) {
        const cc = typeof color === 'function' ? color(c, q) : color;
        if (axis === 'x') b.brick(x + q, y + c * 3, z, s, 1, 3, cc, { studs: c === courses - 1 });
        else b.brick(x, y + c * 3, z + q, 1, s, 3, cc, { studs: c === courses - 1 });
        q += s;
      }
      i += run;
    }
  }
}

/**
 * A building with walls, windows, door and roof.
 * opts: { w, d, courses, wall, trim, roof: { color, kind: 'gable'|'flat'|'shed', axis: 'x'|'z' },
 *         windows: [{ side: 'n'|'s'|'e'|'w', at, w }], door: { side, at }, lit: true }
 * Returns { top (plates), cells }.
 */
export function house(b, ctx, x, y, z, o) {
  const { w, d } = o;
  const courses = o.courses || 4;
  const wall = o.wall || 'tan';
  const winC = 1, winTo = 3; // windows span courses 1..2 (two bricks)
  const sideLen = { s: w, n: w, e: d - 2, w: d - 2 };
  const ops = { s: [], n: [], e: [], w: [] };
  for (const win of o.windows || []) ops[win.side].push({ at: win.at, w: win.w || 2, from: winC, to: winTo, kind: 'win' });
  if (o.door) ops[o.door.side].push({ at: o.door.at, w: o.door.w || 2, from: 0, to: 3, kind: 'door' });
  // floor
  b.fillPlates(x, y, z, w, d, o.floor || 'darkTan', { tile: true });
  const y0 = y + 1;
  wallRun(b, x, y0, z + d - 1, w, 'x', courses, wall, ops.s, 0);
  wallRun(b, x, y0, z, w, 'x', courses, wall, ops.n, 1);
  wallRun(b, x, y0, z + 1, d - 2, 'z', courses, wall, ops.w, 1);
  wallRun(b, x + w - 1, y0, z + 1, d - 2, 'z', courses, wall, ops.e, 0);
  // Fill openings
  const place = (side, op) => {
    const map = {
      s: (i) => [x + i, z + d - 1, 0], n: (i) => [x + i, z, 2],
      w: (i) => [x, z + 1 + i, 1], e: (i) => [x + w - 1, z + 1 + i, 3],
    };
    const [px, pz, rot] = map[side](op.at);
    const rotQ = side === 'w' || side === 'e' ? 1 : 0;
    if (op.kind === 'win') {
      b.put('window', [op.w, 6], px, y0 + 3, pz, o.trim || 'white', { rot: rotQ });
      b.put('pane', [op.w, 6], px, y0 + 3, pz, 'transClear', { rot: rotQ, occ: false });
      // lit interior card just inside
      if (o.lit !== false) {
        const inX = side === 'w' ? px + 1 : side === 'e' ? px - 1 : px;
        const inZ = side === 'n' ? pz + 1 : side === 's' ? pz - 1 : pz;
        b.put('tile', rotQ ? [1, op.w, 6] : [op.w, 1, 6], inX, y0 + 3, inZ, 'glowWarm', { occ: false, studs: false });
        ctx.lights.push({ x: inX + 0.5, y: (y0 + 6) * PLATE, z: inZ + 0.5, color: 0xffb060, power: 0.35, soft: true });
      }
    } else {
      // door: recessed panel and a lintel
      const dw = op.w;
      b.put('tile', rotQ ? [1, dw, 8] : [dw, 1, 8], px + (side === 'e' ? 0 : 0), y0, pz, o.doorColor || 'brown', { occ: true, studs: false });
      b.put('round', [1, 1], side === 's' || side === 'n' ? px + dw - 1 : px, y0 + 4, side === 's' || side === 'n' ? pz : pz + dw - 1, 'pearlGold', { occ: false, lift: 0, studs: false });
      b.put('tile', rotQ ? [1, dw, 1] : [dw, 1, 1], px, y0 + 8, pz, o.trim || 'white', { occ: true });
    }
  };
  for (const s of ['s', 'n', 'e', 'w']) for (const op of ops[s]) place(s, op);
  // lintel course over windows/doors is part of upper courses already; top plates
  const top = y0 + courses * 3;
  const roof = o.roof || { color: 'sandGreen', kind: 'gable', axis: 'x' };
  if (roof.kind === 'flat') {
    b.fillPlates(x, top, z, w, d, roof.color);
    if (roof.rim) for (let i = 0; i < w; i++) { b.tile(x + i, top + 1, z, 1, 1, roof.rim); b.tile(x + i, top + 1, z + d - 1, 1, 1, roof.rim); }
  } else if (roof.kind === 'shed') {
    for (let L = 0; L < Math.ceil(d / 2); L++) {
      const zz = z + d - 2 - L * 2;
      if (zz < z - 1) break;
      b.slope(x - 1, top + L * 3, Math.max(z - 1, zz), w + 2, 2, 3, roof.color, 0, 1);
    }
  } else {
    // gable roof, ridge along x (or z)
    // Gable roof: each course of 2-deep slopes steps one stud inward and sits on the
    // flat stud row of the course below. One stud of overhang on every side.
    const along = roof.axis || 'x';
    const span = along === 'x' ? d : w, len = along === 'x' ? w : d;
    let L = 0;
    for (; L < (span - 1) / 2; L++) {
      const yy = top + L * 3;
      const nS = L - 1, sS = span - 1 - L;
      const gapFrom = L + 1, gapLen = span - 2 - 2 * L;
      if (along === 'x') {
        b.slope(x - 1, yy, z + sS, len + 2, 2, 3, roof.color, 0, 1);   // descends toward +z
        b.slope(x - 1, yy, z + nS, len + 2, 2, 3, roof.color, 2, 1);   // descends toward -z
        if (gapLen > 0) for (const gx of [x, x + w - 1]) b.brick(gx, yy, z + gapFrom, 1, gapLen, 3, roof.gable || wall, { studs: false });
      } else {
        b.slope(x + sS, yy, z - 1, len + 2, 2, 3, roof.color, 1, 1);   // descends toward +x
        b.slope(x + nS, yy, z - 1, len + 2, 2, 3, roof.color, 3, 1);   // descends toward -x
        if (gapLen > 0) for (const gz of [z, z + d - 1]) b.brick(x + gapFrom, yy, gz, gapLen, 1, 3, roof.gable || wall, { studs: false });
      }
    }
    const yy = top + L * 3;
    const from = L - 1, ridgeW = Math.max(1, span - 2 * L + 2);
    if (along === 'x') b.brick(x - 1, yy, z + from, len + 2, ridgeW, 1, roof.ridge || roof.color);
    else b.brick(x + from, yy, z - 1, ridgeW, len + 2, 1, roof.ridge || roof.color);
  }
  reserve(ctx, x, z, w, d);
  return { top };
}

/** Canvas-printed tile text (signs). Returns a Mesh in the x-y plane facing +z. */
export function printedTile(text, w, h, { bg = '#e4cd9e', ink = '#2b2118', font = '600 72px "Bricolage Grotesque", Georgia, serif', border = true } = {}) {
  const c = document.createElement('canvas');
  const scale = 128;
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  if (border) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 6; g.strokeRect(8, 8, c.width - 16, c.height - 16); }
  g.fillStyle = ink; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = String(text).split('\n');
  lines.forEach((ln, i) => g.fillText(ln, c.width / 2, c.height / 2 + (i - (lines.length - 1) / 2) * 80));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, envMapIntensity: 0.4 }));
  m.receiveShadow = true;
  return m;
}

/** Floating marker over an exhibit: a small amber round tile on a thin stem of light. */
export function markerMesh() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb15a).multiplyScalar(1.5) }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd59a).multiplyScalar(1.1), transparent: true, opacity: 0.8 }));
  ring.rotation.x = Math.PI / 2;
  const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 14), disc.material); stud.position.y = 0.15;
  g.add(disc, ring, stud);
  g.userData = { disc, ring };
  return g;
}

/** Soft additive light cone (fake volumetric), apex at origin pointing -y. */
export function lightCone(height = 5, radius = 2.2, color = 0xffb15a, opacity = 0.16) {
  const geo = new THREE.ConeGeometry(radius, height, 24, 1, true);
  geo.translate(0, -height / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(color) }, opacity: { value: opacity }, h: { value: height } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 color; uniform float opacity; uniform float h; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float t = clamp(-vY / h, 0.0, 1.0); float f = pow(abs(dot(vN, vV)), 1.5); gl_FragColor = vec4(color, opacity * (1.0 - t) * (1.0 - t) * f); }',
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 3;
  return m;
}

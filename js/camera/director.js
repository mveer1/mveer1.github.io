// The only writer of the camera transform. A source (rail, follow, shot) produces a
// desired pose each frame; switching sources blends from the actual pose.
import * as THREE from 'three';
import { toOrbit, fromOrbit, lerpOrbit } from './journey.js';
import { damp, easeInOut } from '../core/stepped.js';

export class Director {
  constructor(camera) {
    this.camera = camera;
    this.source = null;
    this.current = toOrbit(new THREE.Vector3(60, 40, 70), new THREE.Vector3(0, 0, -30), 40);
    this.blend = null;
    this.view = { x: 0, y: 0, tx: 0, ty: 0 };
    this.damping = 0;
    this._pos = new THREE.Vector3();
  }

  /** fn() returns an orbit pose. duration 0 = cut. damping > 0 smooths follow sources. */
  setSource(fn, { duration = 0.9, damping = 0 } = {}) {
    this.source = fn;
    this.damping = damping;
    if (duration <= 0) { this.blend = null; this.current = this._copy(fn()); return; }
    this.blend = { from: this._copy(this.current), t: 0, dur: duration };
  }

  _copy(o) { return { look: o.look.clone(), r: o.r, az: o.az, el: o.el, fov: o.fov }; }

  /** Shift the rendered image so the subject sits in the part of the screen a panel leaves free. */
  setViewShift(px, py) { this.view.tx = px; this.view.ty = py; }

  update(dt) {
    if (!this.source) return;
    const want = this.source();
    if (this.blend) {
      this.blend.t += dt / this.blend.dur;
      const k = easeInOut(Math.min(1, this.blend.t));
      lerpOrbit(this.blend.from, want, k, this.current);
      if (this.blend.t >= 1) this.blend = null;
    } else if (this.damping > 0) {
      const k = 1 - Math.exp(-this.damping * dt);
      lerpOrbit(this.current, want, k, this.current);
    } else {
      this.current = this._copy(want);
    }
    const cam = this.camera;
    // Portrait screens see a much narrower slice of the world: back off in proportion.
    const aspect = innerWidth / Math.max(1, innerHeight);
    const portrait = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;
    fromOrbit({ ...this.current, r: this.current.r * portrait }, this._pos);
    cam.position.copy(this._pos);
    cam.lookAt(this.current.look);
    if (Math.abs(cam.fov - this.current.fov) > 0.01) { cam.fov = this.current.fov; cam.updateProjectionMatrix(); }
    // view shift (panel offset), smoothed
    const v = this.view;
    v.x = damp(v.x, v.tx, 8, dt); v.y = damp(v.y, v.ty, 8, dt);
    if (Math.abs(v.x) > 0.5 || Math.abs(v.y) > 0.5) {
      const W = innerWidth, H = innerHeight;
      cam.setViewOffset(W, H, v.x, v.y, W, H);
    } else if (cam.view && cam.view.enabled) cam.clearViewOffset();
  }

  get look() { return this.current.look; }
}

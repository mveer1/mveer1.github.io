// Free-exploration movement: keyboard (camera-relative), click/tap to walk to a point.
// Collides against the walk map: blocked cells, gaps and steps higher than one brick.
import * as THREE from 'three';
import { angleDelta } from './animator.js';

const WALK_SPEED = 6.5, RUN_SPEED = 12;
const GRAVITY = 32;   // studs per second squared while falling
const STEP_DOWN = 1.35; // drops up to this are ordinary steps; anything deeper is a fall

export class Controller {
  constructor(walk) {
    this.walk = walk;
    this.pos = new THREE.Vector3();
    this.yaw = 0;
    this.speed = 0;
    this.running = false;
    this.target = null;      // click-to-move goal (Vector3)
    this.lastGround = null;
    this.fall = null;        // { vy, y0 } while falling off an edge
  }

  get falling() { return !!this.fall; }

  /** How far below where the fall began (studs), 0 when standing. */
  get fallen() { return this.fall ? this.fall.y0 - this.pos.y : 0; }

  place(p, yaw = this.yaw) {
    this.pos.copy(p);
    const g = this.walk.ground(p.x, p.z, p.y);
    if (g) this.pos.y = g.y;
    this.yaw = yaw; this.target = null; this.fall = null;
  }

  goTo(p) { this.target = p.clone(); }

  /**
   * What is at (x, z) for a figure standing at the current height: a surface to step onto,
   * { fall: true } where there is nothing under it (an edge, a gap) or a drop deeper than a
   * step, or null where it is blocked (walls, props, a step that is too high).
   */
  _canStand(x, z) {
    const g = this.walk.ground(x, z, this.pos.y);
    if (!g) return { fall: true };
    if (g.blocked) return null;
    if (g.tooHigh) return g.y < this.pos.y - STEP_DOWN ? { fall: true } : null;
    return g;
  }

  /** Falling: gravity, with a landing on any surface the figure passes through on the way down. */
  _fallStep(dt) {
    const f = this.fall;
    f.vy -= GRAVITY * dt;
    const y1 = this.pos.y + f.vy * dt;
    const landing = this.walk.surfaces(this.pos.x, this.pos.z).filter((s) => !s.blocked && s.y <= this.pos.y + 0.05 && s.y >= y1).sort((a, b) => b.y - a.y)[0];
    if (landing) { this.pos.y = landing.y; this.fall = null; this.speed = 0; return 0; }
    this.pos.y = y1;
    return 0;
  }

  /** input: { x, z } in camera space (-1..1), run; camYaw: camera azimuth. */
  update(dt, input, camYaw) {
    if (this.fall) { this.target = null; return this._fallStep(dt); }
    let mx = 0, mz = 0;
    if (input.x || input.z) {
      this.target = null;
      // camera-relative: forward is away from camera
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
      const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
      mx = fx * input.z + rx * input.x;
      mz = fz * input.z + rz * input.x;
    } else if (this.target) {
      const dx = this.target.x - this.pos.x, dz = this.target.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.35) this.target = null; else { mx = dx / d; mz = dz / d; }
    }
    const len = Math.hypot(mx, mz);
    this.running = !!input.run && len > 0;
    const sp = (this.running ? RUN_SPEED : WALK_SPEED) * Math.min(1, len);
    if (len < 0.01) { this.speed = 0; return 0; }
    mx /= len; mz /= len;
    // turn toward the movement direction quickly (the animator holds it on twos)
    const want = Math.atan2(mx, mz);
    this.yaw += angleDelta(this.yaw, want) * Math.min(1, dt * 14);
    const step = sp * dt;
    const nx = this.pos.x + mx * step, nz = this.pos.z + mz * step;
    let g = this._canStand(nx, nz), px = nx, pz = nz;
    if (!g) { g = this._canStand(nx, this.pos.z); px = nx; pz = this.pos.z; }
    if (!g) { g = this._canStand(this.pos.x, nz); px = this.pos.x; pz = nz; }
    if (!g) { this.speed = 0; if (this.target) this.target = null; return 0; }
    const moved = Math.hypot(px - this.pos.x, pz - this.pos.z);
    this.pos.x = px; this.pos.z = pz;
    if (g.fall) { this.fall = { vy: 0, y0: this.pos.y }; this.speed = 0; return 0; }
    this.pos.y = g.y;
    this.lastGround = g;
    this.speed = moved / dt;
    return this.speed;
  }
}

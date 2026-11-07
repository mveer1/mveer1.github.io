// Stop-motion animation for the minifigure. Poses change only on 12 fps frames.
// Actions: idle, walk, run, look (turn head to a target), interact (reach), hop, discover.
import * as THREE from 'three';
import { FPS } from '../core/stepped.js';

const WALK = [
  { legL: 0.5, legR: -0.5, armL: -0.42, armR: 0.42, bob: 0.0 },
  { legL: 0.25, legR: -0.25, armL: -0.2, armR: 0.2, bob: 0.06 },
  { legL: 0.0, legR: 0.0, armL: 0.0, armR: 0.0, bob: 0.1 },
  { legL: -0.25, legR: 0.25, armL: 0.2, armR: -0.2, bob: 0.06 },
  { legL: -0.5, legR: 0.5, armL: 0.42, armR: -0.42, bob: 0.0 },
  { legL: -0.25, legR: 0.25, armL: 0.2, armR: -0.2, bob: 0.06 },
  { legL: 0.0, legR: 0.0, armL: 0.0, armR: 0.0, bob: 0.1 },
  { legL: 0.25, legR: -0.25, armL: -0.2, armR: 0.2, bob: 0.06 },
];
const RUN = [
  { legL: 0.75, legR: -0.75, armL: -0.9, armR: 0.9, bob: 0.0, lean: 0.12 },
  { legL: 0.2, legR: -0.2, armL: -0.3, armR: 0.3, bob: 0.2, lean: 0.12 },
  { legL: -0.75, legR: 0.75, armL: 0.9, armR: -0.9, bob: 0.0, lean: 0.12 },
  { legL: -0.2, legR: 0.2, armL: 0.3, armR: -0.3, bob: 0.2, lean: 0.12 },
];

export class Animator {
  constructor(fig) {
    this.fig = fig;
    this.lastFrame = -1;
    this.phase = 0;            // walk cycle frame counter
    this.action = 'idle';
    this.actionT = 0;
    this.headTarget = 0;
    this.head = 0;
    this.nextBlink = 2.5;
    this.blinkUntil = 0;
    this.idleLook = 0;
    this.nextIdleLook = 4;
  }

  /** Trigger a one-shot action: 'hop' | 'discover' | 'interact' | 'jump'. */
  play(action) { this.action = action; this.actionT = 0; }

  /**
   * state: { speed (studs/s), running, lookYaw (radians relative to body, or null), reduced }
   * Returns true when a new frame was posed (so callers can step position in sync).
   */
  update(t, dt, state) {
    this.actionT += dt;
    const f = Math.floor(t * FPS.figure);
    if (f === this.lastFrame) return false;
    const frames = this.lastFrame < 0 ? 1 : f - this.lastFrame;
    this.lastFrame = f;
    const fig = this.fig;
    const moving = state.speed > 0.4 && !state.reduced;
    let pose;
    if (moving) {
      const cycle = state.running ? RUN : WALK;
      // advance cycle by distance: ~1 frame per 0.28 studs walking
      const adv = Math.max(1, Math.round((state.speed / (state.running ? 14 : 8)) * frames * 1.6));
      this.phase = (this.phase + adv) % cycle.length;
      pose = { ...cycle[this.phase] };
      pose.swing = -pose.armL * 0.6;
    } else {
      this.phase = 0;
      const breathe = Math.floor(t * 0.8) % 2 ? 0.015 : 0;
      pose = { legL: 0, legR: 0, armL: 0.08, armR: -0.04, bob: breathe, swing: 0.05 };
      // idle: occasionally glance around
      if (!state.reduced && t > this.nextIdleLook) {
        this.idleLook = this.idleLook ? 0 : (Math.sin(t * 7.3) > 0 ? 0.55 : -0.55);
        this.nextIdleLook = t + (this.idleLook ? 1.4 : 3 + (Math.sin(t * 3.1) + 1) * 2.5);
      }
    }
    // actions
    const a = this.action, at = this.actionT;
    if (a === 'interact') {
      if (at < 1.6) { pose.armR = 1.25; pose.armRz = 0.15; pose.legL = 0; pose.legR = 0; }
      else this.action = 'idle';
    } else if (a === 'jump') {
      // arms up and knees tucked while airborne (the app lifts the figure)
      if (at < 0.62) { pose.armL = 2.1; pose.armR = 2.1; pose.armLz = 0.3; pose.armRz = 0.3; pose.legL = -0.5; pose.legR = 0.3; }
      else this.action = 'idle';
    } else if (a === 'hop' || a === 'discover') {
      const k = Math.floor(at * FPS.figure);
      const H = a === 'discover' ? [0.0, 0.55, 0.85, 0.85, 0.5, 0.0, -0.06, 0] : [0, 0.4, 0.6, 0.35, 0, -0.05, 0];
      if (k < H.length) {
        pose.bob = (pose.bob || 0) + H[k];
        pose.legL = H[k] > 0.3 ? -0.35 : 0; pose.legR = H[k] > 0.3 ? 0.2 : 0;
        if (a === 'discover') { pose.armL = 2.3; pose.armR = 2.3; pose.armLz = 0.35; pose.armRz = 0.35; }
      } else this.action = 'idle';
    }
    // head: snap toward target in two held steps
    const want = state.lookYaw ?? (moving ? 0 : this.idleLook);
    const clamped = Math.max(-1.0, Math.min(1.0, want));
    this.head += (clamped - this.head) * 0.55;
    if (Math.abs(clamped - this.head) < 0.02) this.head = clamped;
    pose.head = this.head;
    pose.headX = state.lookUp || 0;
    fig.setPose(pose);
    // face: blink, surprise on discover
    if (!state.reduced && t > this.nextBlink) { this.blinkUntil = t + 0.12; this.nextBlink = t + 3 + ((Math.sin(t * 12.9898) + 1) * 1.6); }
    fig.setFace(a === 'discover' && at < 0.9 ? 'surprised' : t < this.blinkUntil ? 'closed' : 'open');
    return true;
  }
}

/** Shortest signed angle from a to b. */
export function angleDelta(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const yawTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
export { THREE };

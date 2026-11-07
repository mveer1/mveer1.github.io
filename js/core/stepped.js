// Stop-motion timing. Everything that should look hand-animated reads time through
// these helpers, so each system holds its pose between frames at its own rate.
//
//   12 fps  figure, assembly          (on twos)
//    8 fps  machines                  (mechanical)
//    6 fps  small life: flags, smoke  (sparse)
// Camera, light and fog never use these.

export const FPS = { figure: 12, assembly: 12, machine: 8, life: 6 };

/** Quantise time t (seconds) to a frame rate. */
export const step = (t, fps) => Math.floor(t * fps) / fps;

/** Frame index at a rate. */
export const frame = (t, fps) => Math.floor(t * fps);

/** Quantise a continuous value so it changes only on frame boundaries. */
export class Held {
  constructor(fps) { this.fps = fps; this.last = -1; this.value = undefined; }
  /** Returns the held value; `fn` is called only when a new frame starts. */
  get(t, fn) {
    const f = Math.floor(t * this.fps);
    if (f !== this.last) { this.last = f; this.value = fn(); }
    return this.value;
  }
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

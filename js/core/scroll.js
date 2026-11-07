// Native page scroll mapped to journey progress (in screens). Native scroll keeps
// keyboard, touch, scrollbar and assistive scrolling working. Only the camera
// director reads `s`; nothing else animates from scroll.
import { damp } from './stepped.js';

export class ScrollJourney {
  constructor(spacer) {
    this.spacer = spacer;
    this.length = 1;
    this.s = 0;          // smoothed
    this.target = 0;     // raw
    this.locked = false;
    this.velocity = 0;
    this._screens = Math.max(0, spacer.offsetHeight / Math.max(1, innerHeight) - 1); // the CSS height the page started with
    addEventListener('scroll', () => { if (!this.locked) this.target = this._read(); }, { passive: true });
    addEventListener('resize', () => this.setLength(this.length));
  }

  _read() { return scrollY / Math.max(1, innerHeight); }

  /** The page is already tall enough for the whole tour at first paint (CSS), so while islands are still
      being built the length only grows: shrinking would pull a visitor who scrolled early back up. */
  setLength(screens, { final = false } = {}) {
    this.length = screens;
    this._screens = final ? screens : Math.max(this._screens ?? 0, screens);
    this.spacer.style.height = `${(this._screens + 1) * innerHeight}px`;
  }

  /** Freeze page scroll (explore, panels). */
  lock() {
    if (this.locked) return;
    this.locked = true;
    this._y = scrollY;
  }

  unlock() { this.locked = false; this.target = this._read(); }

  /** Jump the page to s (screens). */
  goto(s, { instant = true } = {}) {
    const y = Math.max(0, Math.min(this.length, s)) * innerHeight;
    this.target = y / innerHeight;
    if (instant) { this.s = this.target; }
    window.scrollTo({ top: y, behavior: instant ? 'instant' : 'smooth' });
  }

  update(dt, reduced = false) {
    if (this.locked) { this.velocity = 0; return this.s; }
    const prev = this.s;
    this.s = reduced ? this.target : damp(this.s, this.target, 5.5, dt);
    if (Math.abs(this.s - this.target) < 1e-4) this.s = this.target;
    this.velocity = (this.s - prev) / Math.max(dt, 1e-3);
    return this.s;
  }
}

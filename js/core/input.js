// Keyboard and pointer state. Ignores keys while typing in a form field.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.canvas = canvas;
    this.handlers = {};
    this.drag = null;
    this.dragYaw = 0;
    this.dragPitch = 0;
    this.pointer = { x: 0, y: 0, inside: false };
    addEventListener('keydown', (e) => {
      if (this._typing(e)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      this.keys.add(k);
      this.handlers.key?.(k, e);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('pointerdown', (e) => {
      this.drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, t: performance.now() };
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      this.pointer = { x: e.clientX, y: e.clientY, inside: true };
      if (this.drag && this.drag.id === e.pointerId) {
        const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
        this.drag.moved += Math.abs(dx) + Math.abs(e.clientY - this.drag.y);
        this.drag.x = e.clientX; this.drag.y = e.clientY;
        if (this.drag.moved > 6) { this.dragYaw += dx * 0.006; this.dragPitch += dy * 0.004; canvas.classList.add('dragging'); }
      }
      this.handlers.move?.(e);
    });
    const end = (e) => {
      if (!this.drag) return;
      const tap = this.drag.moved <= 6 && performance.now() - this.drag.t < 600;
      this.drag = null; canvas.classList.remove('dragging');
      if (tap) this.handlers.tap?.(e);
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', () => { this.drag = null; canvas.classList.remove('dragging'); });
    canvas.addEventListener('pointerleave', () => { this.pointer.inside = false; });
    canvas.addEventListener('wheel', (e) => this.handlers.wheel?.(e), { passive: true });
  }

  _typing(e) {
    const t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  on(name, fn) { this.handlers[name] = fn; }

  /** Movement axes in camera space: x right, z forward. */
  axes() {
    const k = this.keys;
    const x = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    const z = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
    return { x, z, run: k.has('shift') };
  }

  /** Accumulated drag rotation since last call. */
  takeYaw() { const y = this.dragYaw; this.dragYaw = 0; return y; }
  /** Accumulated vertical drag since last call (down is positive). */
  takePitch() { const y = this.dragPitch; this.dragPitch = 0; return y; }
}

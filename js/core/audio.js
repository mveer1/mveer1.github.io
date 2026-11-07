// Ambient sound, synthesised (no files): wind, a low drone, machine ticks near the
// Works, and brick snaps for interactions. Off until the visitor turns it on.
export class Ambience {
  constructor() { this.ctx = null; this.on = false; this.machine = 0; this._tickT = 0; }

  _init() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
    // wind: looping noise through a wandering band-pass
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0; for (let i = 0; i < len; i++) { b = 0.985 * b + 0.015 * (Math.random() * 2 - 1); d[i] = b * 6; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.6;
    const wg = ctx.createGain(); wg.gain.value = 0.32;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 220;
    lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
    src.connect(bp); bp.connect(wg); wg.connect(this.master); src.start();
    // drone
    this.drone = ctx.createGain(); this.drone.gain.value = 0.05; this.drone.connect(this.master);
    for (const f of [55, 82.4, 110.2]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = f === 55 ? 0.6 : 0.25;
      o.connect(g); g.connect(this.drone); o.start();
    }
    this.noise = buf;
  }

  toggle() {
    if (!this.ctx) this._init();
    this.on = !this.on;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.on ? 0.55 : 0, t, 0.4);
    return this.on;
  }

  /** A short plastic click. */
  snap(level = 1) {
    if (!this.on) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * level, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(hp); hp.connect(g); g.connect(this.master); s.start(t, Math.random() * 3, 0.08);
    const o = ctx.createOscillator(); o.frequency.value = 1900 + Math.random() * 400;
    const og = ctx.createGain(); og.gain.setValueAtTime(0.12 * level, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(og); og.connect(this.master); o.start(t); o.stop(t + 0.06);
  }

  /** Machine presence 0..1 (distance-based); ticks on eights. */
  update(dt, machine) {
    if (!this.on) return;
    this.machine = machine;
    this._tickT += dt;
    if (machine > 0.05 && this._tickT > 0.25) {
      this._tickT = 0;
      const ctx = this.ctx, t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 140 + Math.random() * 30;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.05 * machine, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(lp); lp.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.1);
    }
  }
}

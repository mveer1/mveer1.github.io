// Adaptive quality. Tiers and the asymmetric-hysteresis governor are adapted from
// czlonkowski/blender-web-3d-skill (MIT): downgrade after one slow window, upgrade
// only after several healthy ones, so the tier does not flap.

export const TIERS = [
  { name: 'low',    dpr: 1.0,  shadows: false, shadowSize: 0,    post: false, bloom: false, tilt: false, msaa: 0, lights: 2, detail: 0, clearcoat: false },
  { name: 'medium', dpr: 1.25, shadows: true,  shadowSize: 1024, post: true,  bloom: true,  tilt: true,  msaa: 0, lights: 3, detail: 1, clearcoat: false },
  { name: 'high',   dpr: 1.75, shadows: true,  shadowSize: 2048, post: true,  bloom: true,  tilt: true,  msaa: 4, lights: 4, detail: 2, clearcoat: true },
];

const WINDOW = 90, SLOW_MS = 26, HEALTHY_MS = 17, UPGRADE_AFTER = 6;

/** Choose a starting tier from cheap device hints. `?q=low|medium|high` overrides. */
export function initialTier() {
  const q = new URLSearchParams(location.search).get('q');
  const named = TIERS.findIndex((t) => t.name === q);
  if (named >= 0) return { tier: named, locked: true };
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width, screen.height) < 700;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 8;
  if ((coarse && small) || mem <= 2 || cores <= 2) return { tier: 0, locked: false };
  if (coarse || cores <= 4 || mem <= 4) return { tier: 1, locked: false };
  return { tier: 2, locked: false };
}

export function createGovernor({ tier, locked = false, onChange }) {
  const samples = new Float32Array(WINDOW);
  let n = 0, healthy = 0;
  // Geometry detail is fixed at build time; the governor may only lower runtime costs,
  // and never upgrades above the starting tier (detail would not match).
  const ceiling = tier;
  return {
    get tier() { return tier; },
    get settings() { return TIERS[tier]; },
    sample(ms) {
      if (locked || ms <= 0 || ms > 250) return;
      samples[n++] = ms;
      if (n < WINDOW) return;
      n = 0;
      const sorted = Array.from(samples).sort((a, b) => a - b);
      const p75 = sorted[Math.floor(WINDOW * 0.75)];
      let next = tier;
      if (p75 > SLOW_MS && tier > 0) { next = tier - 1; healthy = 0; }
      else if (p75 < HEALTHY_MS && tier < ceiling && ++healthy >= UPGRADE_AFTER) { next = tier + 1; healthy = 0; }
      else if (p75 >= HEALTHY_MS) healthy = 0;
      if (next !== tier) { tier = next; onChange?.(TIERS[tier], p75); }
    },
    reset() { n = 0; },
  };
}

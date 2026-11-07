// Boot: capability check, then the world, or the text field guide when WebGL is missing.
document.documentElement.classList.replace('no-js', 'js');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}

function fallback(reason) {
  const html = document.documentElement;
  html.classList.add('no-webgl');
  html.dataset.mode = 'guide';
  document.querySelector('.guide-note').hidden = false;
  if (reason) document.querySelector('.guide-note').textContent = reason;
  document.querySelector('.loading')?.remove();
  document.querySelector('.hud')?.remove();
  document.querySelector('.title-card')?.remove();
  document.querySelector('#world')?.remove();
  window.__ready = true;
}

async function boot() {
  if (!webglAvailable()) { fallback('This browser could not start the 3D world, so here is everything it holds.'); return; }
  try {
    // Signs are painted to canvas at build time: give the web fonts a moment to arrive.
    const fonts = document.fonts ? Promise.all(['800 64px "Bricolage Grotesque"', '600 54px "DM Mono"', '600 54px Figtree'].map((f) => document.fonts.load(f))) : Promise.resolve();
    const [{ App }, { initialTier }] = await Promise.all([import('./app.js'), import('./core/quality.js'), Promise.race([fonts, new Promise((r) => setTimeout(r, 1500))])]);
    const { tier, locked } = initialTier();
    const app = new App({ canvas: document.getElementById('world'), tier, locked });
    window.__world = app;
    window.__stats = () => {
      const i = app.gfx.renderer.info;
      return { tier: app.governor.settings.name, calls: i.render.calls, tris: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, islands: [...app.world.islands.keys()], journey: app.world.journey?.length, mode: app.mode, s: +app.scroll.s.toFixed(3) };
    };
    await app.start();
  } catch (e) {
    console.error(e);
    fallback('The 3D world failed to load, so here is everything it holds.');
  }
}

boot();

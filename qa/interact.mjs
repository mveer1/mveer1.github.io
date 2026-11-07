// Interaction tests: state machine, scroll lock, movement, collision, rides, panels.
//   node qa/interact.mjs
import { chromium } from 'playwright';
import { serve } from './shoot.mjs';

const srv = await serve();
const port = srv.address().port;
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => window.__allBuilt === true, null, { timeout: 60000 });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); };
const ev = (fn, arg) => page.evaluate(fn, arg);
const wait = (ms) => page.waitForTimeout(ms);
const hold = async (key, ms) => { await page.keyboard.down(key); await wait(ms); await page.keyboard.up(key); };

// 1. Scroll drives the journey
await page.mouse.move(700, 450);
await page.mouse.wheel(0, 2400);
await wait(1200);
const s1 = await ev(() => __world.scroll.s);
check('wheel scroll advances the tour', s1 > 1.5, `s=${s1.toFixed(2)}`);
const beat1 = await ev(() => __world._beat().id);
check('chapter follows the beat', (await ev(() => document.querySelector('.chapter-name').textContent)).length > 0, beat1);

// 2. Enter explore with W, scroll is locked, figure moves
const sBefore = await ev(() => scrollY);
await hold('w', 900);
const mode2 = await ev(() => __world.mode);
check('W enters explore mode', mode2 === 'explore', mode2);
const p0 = await ev(() => __world.ctrl.pos.toArray());
await hold('w', 1200);
const p1 = await ev(() => __world.ctrl.pos.toArray());
const moved = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
check('figure walks with W', moved > 2, `moved ${moved.toFixed(2)} studs`);
await page.mouse.wheel(0, 3000);
await wait(500);
check('scroll is frozen while exploring', Math.abs((await ev(() => scrollY)) - sBefore) < 2, `scrollY ${await ev(() => scrollY)} vs ${sBefore}`);

// 3. Collision: walking into the harbourmaster's hut stops at its wall
await ev(() => { const h = __world.world.islands.get('harbour').origin; __world.ctrl.place(new __world.ctrl.pos.constructor(h.x + 7.5, 0, h.z - 4)); __world.follow.az = 0; });
await hold('w', 2500);
const pc = await ev(() => { const h = __world.world.islands.get('harbour').origin; return [__world.ctrl.pos.x - h.x, __world.ctrl.pos.z - h.z]; });
check('walls block the figure', pc[1] > -7.2, `stopped at z=${pc[1].toFixed(2)} (wall at -7)`);

// 4. Back to the tour: nearest stop, scroll restored
await page.keyboard.press('j');
await wait(1200);
const back = await ev(() => ({ mode: __world.mode, s: __world.scroll.s, beat: __world._beat().id }));
check('J returns to the tour', back.mode === 'journey', JSON.stringify(back));
check('tour resumes on the same island', back.beat.startsWith('harbour'), back.beat);

// 5. Panel from the chapter card, Escape restores journey
await ev(() => __world.openExhibit('gl-recon'));
await wait(1400);
const pan = await ev(() => ({ mode: __world.mode, title: document.querySelector('#panel .panel-title').textContent, open: document.getElementById('panel').open }));
check('exhibit opens a panel', pan.open && pan.mode === 'panel', pan.title);
check('panel shows real content', pan.title === 'Project-to-GL reconciliation');
await page.keyboard.press('Escape');
await wait(1000);
const after = await ev(() => ({ mode: __world.mode, beat: __world._beat().id }));
check('Escape closes the panel back to the tour', after.mode === 'journey' && after.beat === 'works:gl-recon', JSON.stringify(after));

// 6. Panel prev/next walks the island's exhibits
await ev(() => __world.openExhibit('qa'));
await wait(800);
await page.click('[data-act="panel-next"]');
await wait(900);
check('panel next goes to the next exhibit', (await ev(() => document.querySelector('#panel .panel-title').textContent)) === 'Project-to-GL reconciliation');
await page.keyboard.press('Escape');
await wait(600);

// 7. Map travel
await page.keyboard.press('m');
await wait(600);
check('M opens the map', await ev(() => document.getElementById('map').open));
await page.click('.map-list [data-island="archive"]');
await wait(1200);
const tr = await ev(() => ({ mode: __world.mode, island: __world._beat().island }));
check('map travel lands on the island', tr.mode === 'journey' && tr.island === 'archive', JSON.stringify(tr));

// 8. Field guide
await page.keyboard.press('g');
await wait(500);
check('G opens the field guide', await ev(() => document.getElementById('guide').classList.contains('open')));
check('guide holds every exhibit', (await ev(() => document.querySelectorAll('.guide-exhibit').length)) === 23);
await page.keyboard.press('Escape');
await wait(400);

// 9. Cable car ride in explore
await ev(() => { const j = __world.world.journey; __world.scroll.goto(j.restS(j.find('works:station'))); });
await wait(900);
await ev(() => __world.enterExplore());
await wait(900);
const near = await ev(() => { __world._proximity(); return __world._nearRide?.id || null; });
check('cable car is offered at the station', near === 'cable', String(near));
await page.keyboard.press('Enter');
await wait(5600);
const isl = await ev(() => __world.world.walk.islandAt(__world.ctrl.pos.x, __world.ctrl.pos.z));
check('ride arrives at the Signal Lab', isl === 'lab', String(isl));

// 10. Laser beacon: armed with a beam, shut down by walking up to it
await ev(() => { const c = __world.world.collectibles.find((x) => x.id === 'piece-lab'); __world.ctrl.place(c.pos.clone().add(new c.pos.constructor(4.5, 0, 0))); __world.follow.az = Math.PI / 2; });
check('beacons are armed and fire a beam', await ev(() => { const c = __world.world.collectibles.find((x) => x.id === 'piece-lab'); return !__world.found.has('piece-lab') && c.beacon.beam.target === 1 && c.beacon.beam.group.visible; }));
await hold('w', 1300);
check('walking up to a beacon shuts it down', await ev(() => __world.found.has('piece-lab') && __world.world.collectibles.find((x) => x.id === 'piece-lab').beacon.beam.target === 0));

// 11. Arcade: the cabinet opens a game-select screen; both games open from it and respond to input
await ev(() => { __world.mode = 'explore'; __world.openExhibit('arcade'); });
await wait(600);
check('the cabinet opens the game-select screen', await ev(() => document.getElementById('arcade').open && document.getElementById('arcade').dataset.view === 'menu' && document.querySelectorAll('#arcade [data-arcade-open]').length === 2 && !document.getElementById('panel').open));
await page.click('[data-arcade-open="flappy"]');
await wait(500);
check('Flappy Byte opens from its tile', await ev(() => document.getElementById('arcade').open && __world.gameOpen && document.getElementById('arcade').dataset.view === 'flappy' && !document.getElementById('flappyCanvas').closest('.game').hidden));
const modeBefore = await ev(() => __world.mode);
await page.keyboard.press('m');
check('world keys are ignored while a game is open', (await ev(() => document.getElementById('map').open)) === false && (await ev(() => __world.mode)) === modeBefore);
await page.click('#flappyStartBtn');
await page.keyboard.press('Space');
await wait(700);
check('Flappy Byte runs (status PLAYING)', (await ev(() => document.getElementById('flappyStatus').textContent)) === 'PLAYING', await ev(() => document.getElementById('flappyStatus').textContent));
await page.click('[data-view="flappy"] [data-arcade-menu]');
await wait(300);
check('All games returns to the game-select screen', await ev(() => document.getElementById('arcade').dataset.view === 'menu' && document.getElementById('arcade').open));
await page.click('[data-arcade-open="life"]');
await wait(300);
const pop0 = await ev(() => +document.getElementById('lifePop').textContent);
check('Life Cell opens seeded with the Gosper gun', pop0 > 0, 'population ' + pop0);
await page.click('#lifeStepBtn');
await page.click('#lifeStepBtn');
check('Life Cell steps generations', (await ev(() => +document.getElementById('lifeGen').textContent)) === 2);
await page.keyboard.press('Escape');
await wait(500);
check('Escape closes the arcade', (await ev(() => !document.getElementById('arcade').open && !__world.gameOpen)));

// 12. Enter opens an exhibit even right after clicking the HUD button (focus used to swallow it)
await ev(() => { __world.closeOverlay?.(); __world.mode = 'journey'; __world.scroll.unlock(); __world.scroll.goto(0, { instant: true }); });
await wait(600);
await page.click('[data-act="mode"]');
await wait(900);
await ev(() => { const ex = __world.world.exhibit('education'); __world.ctrl.place(ex.stand.clone()); __world.held.pos.copy(__world.ctrl.pos); });
await wait(500);
await page.keyboard.press('Enter');
await wait(1500);
check('Enter opens the exhibit you stand at and the panel stays open', await ev(() => document.getElementById('panel').open && __world.mode === 'panel'), await ev(() => __world.mode));
await page.keyboard.press('Escape');
await wait(700);
check('Escape closes the panel', await ev(() => !document.getElementById('panel').open && __world.mode === 'explore'), await ev(() => __world.mode));

// 13. Walking camera stays far back near buildings
const rs = [];
for (const id of ['cost-insight', 'timeline', 'cv', 'taskboard']) {
  await ev((i) => { const ex = __world.world.exhibit(i); __world.ctrl.place(ex.stand.clone()); __world.held.pos.copy(__world.ctrl.pos); __world.figSmooth.copy(__world.ctrl.pos); __world.follow.boom = null; }, id);
  await wait(2200);
  rs.push(await ev(() => +__world.director.current.r.toFixed(1)));
}
check('walk camera never zooms in much near buildings (>= 24 studs)', Math.min(...rs) >= 24, 'distances ' + rs.join(', '));

// 14. Free camera: W A S D move the view, not the figure
await page.keyboard.press('c');
await wait(900);
const fig0 = await ev(() => __world.ctrl.pos.toArray()), look0 = await ev(() => __world.director.current.look.toArray());
await hold('d', 900);
const fig1 = await ev(() => __world.ctrl.pos.toArray()), look1 = await ev(() => __world.director.current.look.toArray());
check('free camera: the view moves', Math.hypot(look1[0] - look0[0], look1[2] - look0[2]) > 8, `look moved ${Math.hypot(look1[0] - look0[0], look1[2] - look0[2]).toFixed(1)}`);
check('free camera: the figure stays put', Math.hypot(fig1[0] - fig0[0], fig1[2] - fig0[2]) < 0.05);
await page.keyboard.press('c');
await wait(500);
check('C hands the camera back to the figure', await ev(() => !__world.free));

// 15. Play / pause tour
await page.keyboard.press('j');
await wait(900);
await page.click('.tp-play');
const a0 = await ev(() => scrollY);
await wait(2500);
const a1 = await ev(() => scrollY);
check('Play travels the tour slowly by itself', (await ev(() => __world.autoplay)) && a1 - a0 > 100 && a1 - a0 < 700, `scrolled ${(a1 - a0).toFixed(0)}px in 2.5s`);
await page.click('.tp-play');
const b0 = await ev(() => scrollY);
await wait(1000);
check('Pause stops it', !(await ev(() => __world.autoplay)) && Math.abs((await ev(() => scrollY)) - b0) < 3);
await page.click('.tp-play');
await page.mouse.wheel(0, 200);
await wait(400);
check('manual scroll takes over from autoplay', !(await ev(() => __world.autoplay)));

// 16. Escape closes the map and the field guide too
await page.keyboard.press('m'); await wait(400);
await page.keyboard.press('Escape'); await wait(400);
check('Escape closes the map', await ev(() => !document.getElementById('map').open));
await page.keyboard.press('g'); await wait(400);
await page.keyboard.press('Escape'); await wait(400);
check('Escape closes the field guide', await ev(() => !document.getElementById('guide').classList.contains('open')));

// 17. Chapter card on the right, dismissed by Escape; transport controls apart from the header
await ev(() => { __world.setAutoplay(false); __world.scroll.goto(__world.world.journey.restS(__world.world.journey.find('works:cost-insight')), { instant: true }); });
await wait(1200);
const box = await ev(() => { const r = document.querySelector('.chapter').getBoundingClientRect(); return { left: r.left, right: r.right, w: innerWidth, visible: !document.querySelector('.chapter').hidden }; });
check('chapter card sits on the right side', box.visible && box.left > box.w / 2 && box.right <= box.w, JSON.stringify(box));
const tp = await ev(() => { const r = document.querySelector('.transport').getBoundingClientRect(); return { left: r.left, top: r.top, h: innerHeight, inHeader: !!document.querySelector('.hud .tp-play') }; });
check('play/pause is bottom left and not in the header', tp.left < 80 && tp.top > tp.h / 2 && !tp.inHeader, JSON.stringify(tp));
await page.keyboard.press('Escape');
await wait(500);
check('Escape hides the chapter card', await ev(() => getComputedStyle(document.querySelector('.chapter')).visibility === 'hidden'));
await page.click('.chapter-tab');
await wait(400);
check('Show chapter brings it back', await ev(() => getComputedStyle(document.querySelector('.chapter')).visibility === 'visible'));

// 18. Speed buttons
await ev(() => __world.scroll.goto(2, { instant: true }));
await wait(300);
const rate = async (n) => {
  await page.click(`.tp-speeds [data-speed="${n}"]`);
  const y0 = await ev(() => scrollY);
  await wait(1500);
  const y1 = await ev(() => scrollY);
  return y1 - y0;
};
const d1 = await rate(1), d4 = await rate(4);
check('speed buttons make the tour faster (4x moves ~4x as far)', d4 > d1 * 2.5, `1x ${d1.toFixed(0)}px, 4x ${d4.toFixed(0)}px in 1.5s`);
await page.click('.tp-play');
check('speed button starts it, play button pauses it', !(await ev(() => __world.autoplay)));

// 19. Space jumps; free camera goes up and down
await page.keyboard.press('w'); await wait(700);
const y = await ev(() => __world.fig.root.position.y);
await page.keyboard.press('Space');
await wait(250);
const yAir = await ev(() => __world.fig.root.position.y);
await wait(900);
const yLand = await ev(() => __world.fig.root.position.y);
check('Space makes the figure jump and land', yAir - y > 0.8 && Math.abs(yLand - y) < 0.2, `ground ${y.toFixed(2)}, air ${yAir.toFixed(2)}, landed ${yLand.toFixed(2)}`);
await page.keyboard.press('c'); await wait(900);
const cy0 = await ev(() => __world.director.current.look.y);
await hold('r', 900);
const cy1 = await ev(() => __world.director.current.look.y);
await hold('f', 1400);
const cy2 = await ev(() => __world.director.current.look.y);
check('free camera: R goes up, F comes back down', cy1 - cy0 > 5 && cy1 - cy2 > 5, `y ${cy0.toFixed(1)} -> ${cy1.toFixed(1)} -> ${cy2.toFixed(1)}`);
await page.keyboard.press('c');

// 20. Walking off an edge: the figure falls, then starts again on the island it fell from
const edge = await ev(() => {
  const w = __world.world, is = w.walk.islands.find((i) => i.id === 'harbour');
  const has = (x, z) => is.cells.has(x + ',' + z);
  for (const k of is.cells) {
    const [x, z] = k.split(',').map(Number);
    if (is.blocked.has(k) || is.heights.get(k)) continue;
    if (!has(x, z - 1) && !has(x, z - 2) && has(x, z + 1) && !is.blocked.has(x + ',' + (z + 1)) && has(x - 1, z) && has(x + 1, z)) {
      // far from any bridge end
      const wx = is.ox + x + 0.5, wz = is.oz + z + 0.9;
      if (w.bridges.some((b) => Math.hypot(b.a.x - wx, b.a.z - wz) < 7 || Math.hypot(b.b.x - wx, b.b.z - wz) < 7)) continue;
      __world.ctrl.place(new (__world.ctrl.pos.constructor)(wx, is.oy, wz)); __world.held.pos.copy(__world.ctrl.pos); __world.figSmooth.copy(__world.ctrl.pos);
      __world.follow.az = 0; __world.free = null;
      return [wx, wz];
    }
  }
  return null;
});
check('found a harbour edge to walk off', !!edge);
await wait(600);
await page.keyboard.down('w');
let fell = false, minY = 0;
for (let i = 0; i < 20 && !fell; i++) { await wait(100); fell = await ev(() => __world.ctrl.falling); }
await page.keyboard.up('w');
check('stepping off the edge starts a fall', fell);
await wait(550);
minY = await ev(() => __world.ctrl.pos.y);
check('the figure drops below the island', minY < -3, 'y ' + minY.toFixed(1));
await wait(2600);
const respawn = await ev(() => ({ falling: __world.ctrl.falling, y: __world.ctrl.pos.y, island: __world.world.walk.islandAt(__world.ctrl.pos.x, __world.ctrl.pos.z), mode: __world.mode }));
check('after falling it starts again on the same island', !respawn.falling && respawn.island === 'harbour' && Math.abs(respawn.y) < 0.5 && respawn.mode === 'explore', JSON.stringify(respawn));
await page.keyboard.down('w'); await wait(600); await page.keyboard.up('w');
check('and can walk again', await ev(() => !__world.ctrl.falling));

check('no page errors', errors.length === 0, errors.join(' | '));
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  (' + r.detail + ')' : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
await browser.close();
srv.close();
process.exit(failed.length ? 1 : 0);

// Visual QA: screenshot every journey beat at rest (and optionally every exhibit panel).
//   node qa/tour.mjs [--w 1440 --h 900] [--panels] [--only works] [--out qa/shots/tour] [--mobile]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './shoot.mjs';

const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes('--' + k);

const srv = await serve();
const port = srv.address().port;
const out = flag('out', 'qa/shots/tour');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: +flag('w', 1440), height: +flag('h', 900) }, isMobile: has('mobile'), hasTouch: has('mobile'), deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${port}/${flag('query', '')}`);
await page.waitForFunction(() => window.__allBuilt === true, null, { timeout: 60000 });
const beats = await page.evaluate(() => __world.world.journey.beats.map((b) => ({ id: b.id, exhibit: b.exhibit, island: b.island })));
const only = flag('only');
let n = 0;
for (const b of beats) {
  if (only && !b.id.startsWith(only)) continue;
  await page.evaluate((id) => { const j = __world.world.journey; __world.scroll.goto(j.restS(j.find(id))); }, b.id);
  await page.waitForTimeout(+flag('wait', 1100));
  const file = path.join(out, `${String(n).padStart(2, '0')}-${b.id.replace(/[:>]/g, '_')}.png`);
  await page.screenshot({ path: file });
  if (has('panels') && b.exhibit) {
    await page.evaluate((id) => __world.openExhibit(id), b.exhibit);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: file.replace('.png', '-panel.png') });
    await page.evaluate(() => __world.closeOverlay());
    await page.waitForTimeout(400);
  }
  n++;
}
const perf = await page.evaluate(() => new Promise((r) => {
  const ts = []; let last = performance.now();
  const f = (t) => { ts.push(t - last); last = t; if (ts.length < 180) requestAnimationFrame(f); else { ts.sort((a, b) => a - b); r({ p50: ts[90].toFixed(1), p90: ts[162].toFixed(1), stats: __stats() }); } };
  requestAnimationFrame(f);
}));
console.log(JSON.stringify({ shots: n, perf, errors }, null, 1));
await browser.close();
srv.close();

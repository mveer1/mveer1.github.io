// Screenshot harness. Serves the repository over http on 127.0.0.1 and drives the
// system Chrome (real GPU) with Playwright.
//
//   node qa/shoot.mjs --url lab.html --out qa/shots/lab.png
//   node qa/shoot.mjs --url / --w 1440 --h 900 --eval "__world.goto(3.2)" --wait 1500 --out qa/shots/a.png
//
// Flags: --url --out --w --h --wait (ms after ready) --eval (JS, repeatable) --mobile
//        --reduced (prefers-reduced-motion) --nowebgl --keys "w,w,d" --full
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes('--' + k);
const evals = []; args.forEach((a, i) => { if (a === '--eval') evals.push(args[i + 1]); });
const shots = []; args.forEach((a, i) => { if (a === '--shot') shots.push(args[i + 1]); });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };

export function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let f = path.join(ROOT, p);
      if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function main() {
  const srv = await serve();
  const port = srv.address().port;
  const w = +flag('w', 1440), h = +flag('h', 900);
  const browser = await chromium.launch({
    channel: 'chrome', headless: true,
    args: has('nowebgl') ? ['--disable-webgl', '--disable-3d-apis'] : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
  });
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: +flag('dpr', 1),
    isMobile: has('mobile'), hasTouch: has('mobile'),
    reducedMotion: has('reduced') ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); else if (has('verbose')) logs.push(`[log] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack || ''}`));
  const url = `http://127.0.0.1:${port}/${flag('url', '').replace(/^\//, '')}`;
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load' });
  try { await page.waitForFunction(() => window.__ready === true, null, { timeout: +flag('timeout', 30000) }); }
  catch { logs.push('[harness] __ready not set within timeout'); }
  const readyMs = Date.now() - t0;
  for (const e of evals) {
    try { const r = await page.evaluate(e); if (r !== undefined) logs.push(`[eval] ${JSON.stringify(r).slice(0, 2000)}`); }
    catch (err) { logs.push(`[eval-error] ${err.message}`); }
    await page.waitForTimeout(+flag('step', 250));
  }
  const keys = flag('keys');
  if (keys) for (const k of keys.split(',')) { await page.keyboard.down(k); await page.waitForTimeout(+flag('hold', 400)); await page.keyboard.up(k); }
  await page.waitForTimeout(+flag('wait', 800));
  const out = flag('out', 'qa/shots/shot.png');
  fs.mkdirSync(path.dirname(path.join(ROOT, out)), { recursive: true });
  await page.screenshot({ path: path.join(ROOT, out), fullPage: has('full') });
  // Additional named shots: --shot "js;;file.png"
  for (const s of shots) {
    const [js, file, wait] = s.split(';;');
    try { const r = await page.evaluate(js); if (r !== undefined) logs.push(`[shot-eval] ${JSON.stringify(r).slice(0, 1500)}`); } catch (err) { logs.push(`[shot-error] ${err.message}`); }
    await page.waitForTimeout(+(wait || 1200));
    await page.screenshot({ path: path.join(ROOT, file) });
  }
  const stats = await page.evaluate(() => window.__stats ? window.__stats() : null).catch(() => null);
  console.log(JSON.stringify({ url, readyMs, stats }, null, 0));
  if (logs.length) console.log(logs.join('\n'));
  await browser.close();
  srv.close();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();

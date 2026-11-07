// Reachability audit: can the figure get everywhere on foot (plus the rides)?
//   node qa/reach.mjs
// Flood-fills the walk map with the same rules as the Controller (blocked cells, gaps,
// steps over one brick) from the Harbour, then reports islands, exhibit stands, beacons
// and ride endpoints that the flood did not reach. Rides are exercised for real afterwards.
import { chromium } from 'playwright';
import { serve } from './shoot.mjs';

const srv = await serve();
const port = srv.address().port;
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${port}${process.argv[2] || '/'}`);
await page.waitForFunction(() => window.__allBuilt === true, null, { timeout: 90000 });

const report = await page.evaluate(() => {
  const app = window.__world, world = app.world, walk = world.walk;
  const STEP = 0.5;
  const key = (x, z, y) => Math.round(x / STEP) + ',' + Math.round(z / STEP) + ',' + Math.round(y * 4);
  const seen = new Map();
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const flood = (from) => {
    const g0 = walk.ground(from.x, from.z, from.y);
    const q = [{ x: from.x, z: from.z, y: g0 ? g0.y : from.y }];
    if (!seen.has(key(q[0].x, q[0].z, q[0].y))) seen.set(key(q[0].x, q[0].z, q[0].y), q[0]);
    while (q.length) {
      const c = q.pop();
      for (const [dx, dz] of dirs) {
        const nx = c.x + dx * STEP, nz = c.z + dz * STEP;
        const g = walk.ground(nx, nz, c.y);
        if (!g || g.tooHigh || g.blocked) continue;
        const k = key(nx, nz, g.y);
        if (seen.has(k)) continue;
        const n = { x: nx, z: nz, y: g.y };
        seen.set(k, n); q.push(n);
      }
    }
  };
  const near = (p, r = 1.2, dy = 2.2) => [...seen.values()].some((s) => Math.abs(s.x - p.x) < r && Math.abs(s.z - p.z) < r && Math.abs(s.y - p.y) < dy);
  // rides: boarding from either end, landing at the exit the ride itself declares
  const exits = [];
  app.mode = 'explore';
  for (const t of world.transports) for (const end of t.mapLine) {
    app.ctrl.place(end.clone()); t.start(app);
    if (app.riding) { exits.push({ id: t.id, board: end.clone(), exit: app.riding.exit.clone() }); app.riding = null; }
  }
  const start = world.journey.figureAt(0).pos;
  flood(start);
  const used = [];
  for (let again = true; again;) {
    again = false;
    for (const e of exits) if (!used.includes(e) && near(e.board, 2.8, 2.5)) { used.push(e); flood(e.exit); again = true; }
  }
  const pts = [...seen.values()];
  const out = { cells: pts.length, islands: {}, exhibits: [], pieces: [], rides: [], unusedRides: exits.filter((e) => !used.includes(e)).map((e) => e.id) };
  for (const is of walk.islands) out.islands[is.id] = pts.some((s) => walk.islandAt(s.x, s.z) === is.id);
  for (const ex of world.exhibits) out.exhibits.push({ id: ex.id, island: ex.island, ok: near(ex.stand, 2.5, 3) });
  for (const c of world.collectibles) out.pieces.push({ id: c.id, island: c.island, ok: near(c.pos, 1.6, 3.5), pos: c.pos.toArray() });
  for (const t of world.transports) out.rides.push({ id: t.id, ends: t.mapLine.map((p) => ({ ok: near(p, 2.8, 2.5), at: walk.islandAt(p.x, p.z) })) });
  return out;
});

console.log(`walkable cells reached from the Harbour (using rides): ${report.cells}`);
for (const [id, ok] of Object.entries(report.islands)) console.log(`${ok ? '  ok ' : ' FAIL'} island ${id}`);
for (const e of report.exhibits) if (!e.ok) console.log(` FAIL exhibit ${e.id} (${e.island}): stand point not reachable on foot`);
for (const p of report.pieces) if (!p.ok) console.log(` FAIL beacon ${p.id} (${p.island}) not reachable on foot at ${p.pos.map((v) => v.toFixed(1))}`);
for (const r of report.rides) r.ends.forEach((e, i) => console.log(`${e.ok ? '  ok ' : 'note '} ride ${r.id} end ${i} on ${e.at} ${e.ok ? 'reachable on foot' : '(only reachable by another ride)'}`));

// Use every ride from each end and see where the figure lands.
const rideResults = await page.evaluate(async () => {
  const app = window.__world, world = app.world;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  app.enterExplore();
  const res = [];
  for (const t of world.transports) {
    for (const end of t.mapLine) {
      app.ctrl.place(end.clone()); app.held.pos.copy(app.ctrl.pos);
      app.mode = 'explore';
      app._proximity();
      const before = world.walk.islandAt(app.ctrl.pos.x, app.ctrl.pos.z);
      t.start(app);
      if (!app.riding) { res.push({ id: t.id, from: before, started: false }); continue; }
      const dur = app.riding.dur;
      await wait(dur * 1000 + 800);
      const p = app.ctrl.pos;
      const g = world.walk.ground(p.x, p.z, p.y);
      res.push({ id: t.id, from: before, started: true, to: world.walk.islandAt(p.x, p.z), standing: !!g && !g.blocked && !g.tooHigh });
    }
  }
  return res;
});
for (const r of rideResults) console.log(`${r.started && r.standing ? '  ok ' : ' FAIL'} ride ${r.id}: ${r.from} -> ${r.to ?? '?'}${r.standing ? '' : ' (did not land on walkable ground)'}`);

const bad = Object.values(report.islands).some((v) => !v) || report.exhibits.some((e) => !e.ok) || report.pieces.some((p) => !p.ok) || rideResults.some((r) => !r.started || !r.standing);
if (errors.length) console.log('page errors:', errors.slice(0, 5));
console.log(bad ? 'RESULT: some places are not accessible' : 'RESULT: every island, exhibit and beacon is accessible');
await browser.close(); srv.close();
process.exit(bad ? 1 : 0);

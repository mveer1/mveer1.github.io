// Flappy Byte and Life Cell, ported from the earlier version of this site and dressed in
// bricks. The game logic is the original (Flappy: a dt-clamped physics loop with a stored high
// score; Life: a wrapping 60x40 grid with presets). Flappy's pipes are stacks of bricks with a
// white cap and the packet is a yellow brick; Life runs on a studded baseplate and each live
// cell is a brick coloured by its age. One <dialog id="arcade"> hosts both. Each game registers
// { onOpen, onClose, onHide }.

/** root: the #arcade <dialog>. Returns { flappy, life } game controllers. */
export function createGames(root) {
  const registry = {};

  function initFlappyByte() {
      const canvas = document.getElementById('flappyCanvas');
      if (!canvas || !canvas.getContext) return;

      const ctx = canvas.getContext('2d');
      const scoreEl = document.getElementById('flappyScore');
      const highEl = document.getElementById('flappyHigh');
      const statusEl = document.getElementById('flappyStatus');
      const overlayEl = document.getElementById('flappyOverlay');
      const startBtn = document.getElementById('flappyStartBtn');
      const resetHighBtn = document.getElementById('flappyResetHighBtn');

      // The logic runs on a 480x360 field; the canvas is twice that so it stays sharp when large.
      const S = 2;
      ctx.setTransform(S, 0, 0, S, 0, 0);
      const W = canvas.width / S;
      const H = canvas.height / S;
      const GROUND = 30;           // the baseplate along the bottom
      const FLOOR = H - GROUND;
      const HIGH_KEY = 'flappyByteHighScore';

      // Tuning. Kept deliberately floaty: the canvas is only 360px tall, so at a
      // realistic gravity the bird hits the floor in under half a second.
      const GRAVITY = 430;         // px/s^2 — ~0.89s free-fall from centre to floor
      const FLAP_VELOCITY = -210;  // px/s — apex rise ~51px, ~0.49s to peak
      const SCROLL_SPEED = 118;    // px/s
      const GAP = 132;             // vertical gap in the firewall
      const PIPE_W = 52;
      const PIPE_SPACING = 270;    // px between pipe pairs (~2.3s apart)
      // The bird is pinned at x = W/2, so a pipe spawned just off-screen reaches it
      // almost immediately. Give the first one a real run-up instead.
      const FIRST_PIPE_OFFSET = 240;
      const BIRD_R = 9;

      const STATE = { READY: 'READY', PLAYING: 'PLAYING', DEAD: 'DEAD' };

      let state = STATE.READY;
      let birdY = H / 2;
      let birdV = 0;
      let pipes = [];
      let score = 0;
      let high = readHigh();
      let frameId = null;
      let lastTs = 0;
      let flashT = 0;
      let bgT = 0;          // background clock (clouds drift even while waiting)
      let groundOff = 0;    // studs on the baseplate scroll with the pipes

      function readHigh() {
          try {
              const raw = window.localStorage.getItem(HIGH_KEY);
              const n = parseInt(raw, 10);
              return Number.isFinite(n) && n >= 0 ? n : 0;
          } catch (err) {
              // Private mode / storage disabled — fall back to in-memory only
              return 0;
          }
      }

      function writeHigh(value) {
          try {
              window.localStorage.setItem(HIGH_KEY, String(value));
          } catch (err) {
              /* non-fatal */
          }
      }

      const pad = n => String(Math.max(0, n)).padStart(4, '0');

      function syncHud() {
          if (scoreEl) scoreEl.textContent = pad(score);
          if (highEl) highEl.textContent = pad(high);
          if (statusEl) statusEl.textContent = state;
      }

      function setStartLabel(text) {
          const label = startBtn && startBtn.querySelector('.game-btn-text');
          if (label) label.textContent = text;
      }

      function showOverlay(title, sub, hint) {
          if (!overlayEl) return;
          overlayEl.hidden = false;
          const t = overlayEl.querySelector('.game-overlay-title');
          const s = overlayEl.querySelector('.game-overlay-sub');
          const h = overlayEl.querySelector('.game-overlay-hint');
          if (t) t.textContent = title;
          if (s) s.textContent = sub;
          if (h) h.textContent = hint;
      }

      function hideOverlay() {
          if (overlayEl) overlayEl.hidden = true;
      }

      function spawnPipes() {
          pipes = [];
          for (let i = 0; i < 4; i++) {
              pipes.push(makePipe(W + FIRST_PIPE_OFFSET + i * PIPE_SPACING));
          }
      }

      function makePipe(x) {
          const margin = 34;
          const gapTop = margin + Math.random() * (FLOOR - GAP - margin * 2);
          return { x, gapTop, scored: false, hue: Math.floor(Math.random() * PIPE_COLORS.length) };
      }

      function reset() {
          birdY = H / 2;
          birdV = 0;
          score = 0;
          flashT = 0;
          spawnPipes();
      }

      function start() {
          reset();
          state = STATE.PLAYING;
          hideOverlay();
          setStartLabel('RESTART');
          syncHud();
          // Without this, every restart spawns another rAF chain that never ends
          stopLoop();
          loop(performance.now(), true);
      }

      function die() {
          state = STATE.DEAD;
          flashT = 0.18;
          if (score > high) {
              high = score;
              writeHigh(high);
          }
          setStartLabel('PLAY AGAIN');
          showOverlay(
              'PACKET DROPPED',
              `SCORE ${pad(score)}  ·  HIGH ${pad(high)}`,
              'SPACE / CLICK to try again'
          );
          syncHud();
      }

      function flap() {
          if (state === STATE.PLAYING) {
              birdV = FLAP_VELOCITY;
          } else {
              start();
          }
      }

      function update(dt) {
          if (state !== STATE.PLAYING) return;

          birdV += GRAVITY * dt;
          birdY += birdV * dt;

          for (const p of pipes) {
              p.x -= SCROLL_SPEED * dt;

              if (!p.scored && p.x + PIPE_W < W / 2 - BIRD_R) {
                  p.scored = true;
                  score += 1;
              }
          }

          // Recycle pipes that have left the screen
          if (pipes.length && pipes[0].x + PIPE_W < -10) {
              pipes.shift();
              const lastX = pipes.length ? pipes[pipes.length - 1].x : W;
              pipes.push(makePipe(lastX + PIPE_SPACING));
          }

          // Floor / ceiling
          if (birdY + BIRD_R >= FLOOR || birdY - BIRD_R <= 0) {
              birdY = Math.min(Math.max(birdY, BIRD_R), FLOOR - BIRD_R);
              die();
              return;
          }

          // Pipe collision (bird is a circle at fixed x = W/2)
          const bx = W / 2;
          for (const p of pipes) {
              const withinX = bx + BIRD_R > p.x && bx - BIRD_R < p.x + PIPE_W;
              if (!withinX) continue;
              const inGap = birdY - BIRD_R > p.gapTop && birdY + BIRD_R < p.gapTop + GAP;
              if (!inGap) {
                  die();
                  return;
              }
          }
      }

      // ---- Brick drawing helpers. Colours are plastic colours: body, shaded edge, highlight.
      const PIPE_COLORS = [
          { body: '#c91a09', dark: '#7f0f05', light: '#ee5a46' },
          { body: '#0055bf', dark: '#003579', light: '#4a8be0' },
          { body: '#237841', dark: '#15502a', light: '#5fbf80' },
          { body: '#fe8a18', dark: '#a85706', light: '#ffc07a' }
      ];
      const CAP = { body: '#f2f3f2', dark: '#aab0b4', light: '#ffffff' };
      const YELLOW = { body: '#f2cd37', dark: '#c4a113', light: '#fbe58a' };
      const BRICK_H = 14;

      function rr(x, y, w, h, r) {
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
          ctx.fill();
      }

      function brick(x, y, w, h, c) {
          ctx.fillStyle = c.body;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = c.light;
          ctx.fillRect(x, y, w, 2);
          ctx.fillStyle = c.dark;
          ctx.fillRect(x, y + h - 3, w, 3);
          ctx.fillRect(x + w - 2, y, 2, h);
      }

      // A row of studs standing on the top edge at y.
      function studRow(x, y, w, c) {
          const n = Math.max(1, Math.round(w / 17));
          const pitch = w / n;
          for (let i = 0; i < n; i++) {
              const cx = x + pitch * (i + 0.5);
              ctx.fillStyle = c.dark;
              rr(cx - 6, y - 5, 12, 6, 2);
              ctx.fillStyle = c.body;
              rr(cx - 6, y - 6, 12, 5, 2);
          }
      }

      // One pipe half: courses of bricks, the course beside the gap is a white cap.
      function pipeHalf(x, from, to, c, fromGap) {
          const n = Math.ceil(Math.abs(to - from) / BRICK_H);
          for (let i = 0; i < n; i++) {
              const y = fromGap > 0 ? from + i * BRICK_H : from - (i + 1) * BRICK_H;
              const col = i === 0 ? CAP : c;
              if (i % 2 === 0) {
                  brick(x, y, PIPE_W / 2, BRICK_H, col);
                  brick(x + PIPE_W / 2, y, PIPE_W / 2, BRICK_H, col);
              } else {
                  brick(x, y, PIPE_W / 4, BRICK_H, col);
                  brick(x + PIPE_W / 4, y, PIPE_W / 2, BRICK_H, col);
                  brick(x + PIPE_W * 0.75, y, PIPE_W / 4, BRICK_H, col);
              }
          }
      }

      function cloud(x, y, k) {
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(k, k);
          const white = { body: '#ffffff', dark: '#cfdde6', light: '#ffffff' };
          for (let i = 0; i < 3; i++) brick(i * 28, 14, 28, 13, white);
          for (let i = 0; i < 2; i++) brick(14 + i * 28, 1, 28, 13, white);
          studRow(14, 1, 56, white);
          ctx.restore();
      }

      function draw() {
          ctx.setTransform(S, 0, 0, S, 0, 0);
          ctx.clearRect(0, 0, W, H);

          // Sky and drifting brick clouds
          const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
          sky.addColorStop(0, '#3f9fe6');
          sky.addColorStop(1, '#c4e8fb');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, W, H);
          const span = W + 220;
          for (const [cx, cy, k] of [[40, 52, 1], [250, 118, 0.75], [420, 40, 0.9]]) {
              cloud(((cx - bgT * 9) % span + span) % span - 110, cy, k);
          }

          // Firewall: stacks of bricks
          for (const p of pipes) {
              const c = PIPE_COLORS[p.hue];
              pipeHalf(p.x, p.gapTop, 0, c, -1);
              pipeHalf(p.x, p.gapTop + GAP, FLOOR, c, 1);
              studRow(p.x, p.gapTop + GAP, PIPE_W, CAP);
          }

          // Baseplate with studs along the bottom
          ctx.fillStyle = '#237841';
          ctx.fillRect(0, FLOOR, W, GROUND);
          ctx.fillStyle = '#4fae6b';
          ctx.fillRect(0, FLOOR, W, 3);
          ctx.fillStyle = '#15502a';
          ctx.fillRect(0, H - 8, W, 8);
          const pitch = 22;
          for (let x = -(groundOff % pitch); x < W + pitch; x += pitch) {
              ctx.fillStyle = '#1a5c32';
              rr(x + 3, FLOOR + 8, 16, 7, 3);
              ctx.fillStyle = '#2f9455';
              rr(x + 3, FLOOR + 6, 16, 7, 3);
          }

          // The packet: a yellow brick with a red wing
          const bx = W / 2;
          const flap = state === STATE.PLAYING ? (birdV < 0 ? -4 : 3) : Math.sin(bgT * 6) * 2;
          ctx.save();
          ctx.translate(bx, birdY);
          ctx.rotate(Math.max(-0.45, Math.min(0.7, birdV / 520)));
          brick(-12, -9, 24, 18, YELLOW);
          ctx.fillStyle = YELLOW.dark;
          rr(-8, -13, 7, 5, 2);
          rr(2, -13, 7, 5, 2);
          ctx.fillStyle = YELLOW.body;
          rr(-8, -14, 7, 5, 2);
          rr(2, -14, 7, 5, 2);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(5, -3, 4.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#17202b';
          ctx.beginPath(); ctx.arc(6.4, -3, 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#b45a06';
          rr(10, 0, 8, 6, 2);
          ctx.fillStyle = '#fe8a18';
          rr(10, -1, 8, 5, 2);
          ctx.fillStyle = '#7f0f05';
          rr(-11, 3 + flap, 13, 6, 2);
          ctx.fillStyle = '#c91a09';
          rr(-11, 2 + flap, 13, 5, 2);
          ctx.restore();

          // Score
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '800 54px "Bricolage Grotesque", "Arial Black", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pad(score), W / 2, 62);

          // Death flash
          if (flashT > 0) {
              ctx.fillStyle = `rgba(201, 26, 9, ${Math.min(0.5, flashT * 2.5)})`;
              ctx.fillRect(0, 0, W, H);
          }
      }

      function loop(ts, isFirst) {
          if (isFirst) lastTs = ts;
          // Clamp dt so a background tab or a long frame can't teleport the bird
          const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
          lastTs = ts;

          if (flashT > 0) flashT = Math.max(0, flashT - dt);
          bgT += dt;
          if (state === STATE.PLAYING) groundOff += SCROLL_SPEED * dt;

          update(dt);
          draw();
          syncHud();

          frameId = requestAnimationFrame(t => loop(t, false));
      }

      function stopLoop() {
          if (frameId !== null) {
              cancelAnimationFrame(frameId);
              frameId = null;
          }
      }

      // ---- Input ----
      function onKeyDown(e) {
          // Only while this game's modal is on screen
          if (!root.open || root.dataset.game !== 'flappy') return;
          if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
              e.preventDefault();
              flap();
          }
      }

      document.addEventListener('keydown', onKeyDown);

      canvas.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          flap();
      });

      if (startBtn) {
          startBtn.addEventListener('click', (e) => {
              e.preventDefault();
              start();
              canvas.focus();
          });
      }

      if (resetHighBtn) {
          resetHighBtn.addEventListener('click', (e) => {
              e.preventDefault();
              high = 0;
              writeHigh(0);
              syncHud();
          });
      }

      function idle() {
          state = STATE.READY;
          reset();
          setStartLabel('START');
          showOverlay(
              'FLAPPY BYTE',
              'SPACE / CLICK / TAP to flap',
              'avoid the firewall — one hit and the packet drops'
          );
          syncHud();
          draw();
      }

      registry.flappy = {
          onOpen() {
              idle();
              stopLoop();
              loop(performance.now(), true);
          },
          onClose() {
              stopLoop();
              state = STATE.READY;
          },
          onHide() {
              // Losing focus mid-flight would be an unfair death; park it instead
              if (state === STATE.PLAYING) {
                  state = STATE.READY;
                  setStartLabel('START');
                  showOverlay('PAUSED', 'SPACE / CLICK to restart', 'the run was reset when the tab lost focus');
                  syncHud();
              }
          }
      };

      idle();
  }


  function initGameOfLife() {
      const canvas = document.getElementById('lifeCanvas');
      if (!canvas || !canvas.getContext) return;

      const ctx = canvas.getContext('2d');
      const genEl = document.getElementById('lifeGen');
      const popEl = document.getElementById('lifePop');
      const playBtn = document.getElementById('lifePlayBtn');
      const stepBtn = document.getElementById('lifeStepBtn');
      const randomBtn = document.getElementById('lifeRandomBtn');
      const clearBtn = document.getElementById('lifeClearBtn');
      const speedEl = document.getElementById('lifeSpeed');
      const presetEl = document.getElementById('lifePreset');
      const rulesBtn = document.getElementById('lifeRulesBtn');
      const rulesPanel = document.getElementById('lifeRulesPanel');
      const rulesCloseBtn = document.getElementById('lifeRulesCloseBtn');

      const CELL = 12;
      const COLS = Math.floor(canvas.width / CELL);   // 60
      const ROWS = Math.floor(canvas.height / CELL);  // 40

      // Each cell holds its age: 0 is dead, 1 is newly born, and it counts up while the cell survives.
      let grid = new Uint8Array(COLS * ROWS);
      let next = new Uint8Array(COLS * ROWS);
      let generation = 0;
      let running = false;
      let frameId = null;
      let accumulator = 0;
      let lastTs = 0;
      let stepsPerSecond = speedEl ? parseInt(speedEl.value, 10) || 10 : 10;

      // Pointer painting state
      let painting = false;
      let paintValue = 1;

      const idx = (c, r) => r * COLS + c;

      // Presets as [col, row] offsets, placed relative to a given origin
      const PRESETS = {
          glider: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
          blinker: [[0, 0], [1, 0], [2, 0]],
          toad: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]],
          pulsar: [
              [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
              [0, 2], [5, 2], [7, 2], [12, 2],
              [0, 3], [5, 3], [7, 3], [12, 3],
              [0, 4], [5, 4], [7, 4], [12, 4],
              [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
              [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
              [0, 8], [5, 8], [7, 8], [12, 8],
              [0, 9], [5, 9], [7, 9], [12, 9],
              [0, 10], [5, 10], [7, 10], [12, 10],
              [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12]
          ],
          lwss: [[1, 0], [4, 0], [0, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3]],
          gosper: [
              [0, 4], [1, 4], [0, 5], [1, 5],
              [10, 4], [10, 5], [10, 6], [11, 3], [11, 7], [12, 2], [12, 8], [13, 2], [13, 8],
              [14, 5], [15, 3], [15, 7], [16, 4], [16, 5], [16, 6], [17, 5],
              [20, 2], [20, 3], [20, 4], [21, 2], [21, 3], [21, 4], [22, 1], [22, 5],
              [24, 0], [24, 1], [24, 5], [24, 6],
              [34, 2], [34, 3], [35, 2], [35, 3]
          ]
      };

      function population() {
          let n = 0;
          for (let i = 0; i < grid.length; i++) if (grid[i] > 0) n++;
          return n;
      }

      function syncHud() {
          if (genEl) genEl.textContent = String(generation);
          if (popEl) popEl.textContent = String(population());
      }

      function setPlayLabel() {
          const label = playBtn && playBtn.querySelector('.game-btn-text');
          if (label) label.textContent = running ? 'PAUSE' : 'PLAY';
          const icon = playBtn && playBtn.querySelector('.material-symbols-outlined');
          if (icon) icon.textContent = running ? 'pause' : 'play_arrow';
      }

      // One generation. Neighbour lookup wraps at the edges (a torus), so patterns
      // leaving one side reappear on the other.
      function step() {
          for (let r = 0; r < ROWS; r++) {
              const rUp = (r - 1 + ROWS) % ROWS;
              const rDown = (r + 1) % ROWS;
              for (let c = 0; c < COLS; c++) {
                  const cLeft = (c - 1 + COLS) % COLS;
                  const cRight = (c + 1) % COLS;

                  const n = (grid[idx(cLeft, rUp)] > 0) + (grid[idx(c, rUp)] > 0) + (grid[idx(cRight, rUp)] > 0)
                      + (grid[idx(cLeft, r)] > 0) + (grid[idx(cRight, r)] > 0)
                      + (grid[idx(cLeft, rDown)] > 0) + (grid[idx(c, rDown)] > 0) + (grid[idx(cRight, rDown)] > 0);

                  const age = grid[idx(c, r)];
                  // Survival on 2-3, reproduction on exactly 3, death otherwise
                  next[idx(c, r)] = age > 0 ? ((n === 2 || n === 3) ? Math.min(255, age + 1) : 0) : (n === 3 ? 1 : 0);
              }
          }
          const swap = grid;
          grid = next;
          next = swap;
          generation += 1;
      }

      // The empty baseplate is drawn once and copied each frame.
      let plate = null;
      function buildPlate() {
          plate = document.createElement('canvas');
          plate.width = canvas.width;
          plate.height = canvas.height;
          const g = plate.getContext('2d');
          g.fillStyle = '#0b4faa';
          g.fillRect(0, 0, plate.width, plate.height);
          for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                  const cx = c * CELL + CELL / 2;
                  const cy = r * CELL + CELL / 2;
                  g.fillStyle = '#07357a';
                  g.beginPath(); g.arc(cx, cy + 1, 4.3, 0, Math.PI * 2); g.fill();
                  g.fillStyle = '#1d6ad0';
                  g.beginPath(); g.arc(cx, cy, 4.3, 0, Math.PI * 2); g.fill();
                  g.strokeStyle = '#3b84e4';
                  g.lineWidth = 0.8;
                  g.beginPath(); g.arc(cx, cy, 3.4, Math.PI * 1.05, Math.PI * 1.65); g.stroke();
              }
          }
      }

      // Brick colour by age: body, shaded edge, highlight.
      const AGES = [
          ['#f2cd37', '#c4a113', '#fbe58a'], // new
          ['#fe8a18', '#a85706', '#ffc07a'], // young
          ['#c91a09', '#7f0f05', '#ee5a46'], // settling
          ['#237841', '#15502a', '#5fbf80'], // old
          ['#f2f3f2', '#aab0b4', '#ffffff']  // stable
      ];
      const ageClass = a => (a < 2 ? 0 : a < 4 ? 1 : a < 8 ? 2 : a < 16 ? 3 : 4);

      function draw() {
          if (!plate) buildPlate();
          ctx.drawImage(plate, 0, 0);

          for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                  const a = grid[idx(c, r)];
                  if (a === 0) continue;
                  const [body, dark, light] = AGES[ageClass(a)];
                  const x = c * CELL;
                  const y = r * CELL;
                  ctx.fillStyle = body;
                  ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
                  ctx.fillStyle = light;
                  ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, 1.5);
                  ctx.fillStyle = dark;
                  ctx.fillRect(x + 0.5, y + CELL - 3, CELL - 1, 2.5);
                  // the stud on top of the brick
                  const cx = x + CELL / 2;
                  const cy = y + CELL / 2 - 0.5;
                  ctx.fillStyle = dark;
                  ctx.beginPath(); ctx.arc(cx, cy + 0.9, 3.5, 0, Math.PI * 2); ctx.fill();
                  ctx.fillStyle = body;
                  ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
                  ctx.strokeStyle = light;
                  ctx.lineWidth = 0.8;
                  ctx.beginPath(); ctx.arc(cx, cy, 2.6, Math.PI * 1.05, Math.PI * 1.65); ctx.stroke();
              }
          }
      }

      function render() {
          draw();
          syncHud();
      }

      function loop(ts) {
          if (!running) return;
          if (!lastTs) lastTs = ts;
          const dt = Math.min(0.25, (ts - lastTs) / 1000);
          lastTs = ts;
          accumulator += dt;

          const interval = 1 / stepsPerSecond;
          let guard = 0;
          while (accumulator >= interval && guard < 20) {
              step();
              accumulator -= interval;
              guard += 1;
          }

          render();
          frameId = requestAnimationFrame(loop);
      }

      function play() {
          if (running) return;
          running = true;
          lastTs = 0;
          accumulator = 0;
          setPlayLabel();
          frameId = requestAnimationFrame(loop);
      }

      function pause() {
          running = false;
          if (frameId !== null) {
              cancelAnimationFrame(frameId);
              frameId = null;
          }
          setPlayLabel();
      }

      function clear() {
          grid.fill(0);
          generation = 0;
          render();
      }

      function randomise(density = 0.28) {
          for (let i = 0; i < grid.length; i++) {
              grid[i] = Math.random() < density ? 1 : 0;
          }
          generation = 0;
          render();
      }

      function loadPreset(name) {
          const cells = PRESETS[name];
          if (!cells) return;

          grid.fill(0);
          generation = 0;

          // Keep the dropdown showing what's actually on the grid
          if (presetEl && presetEl.value !== name) presetEl.value = name;

          // Centre the pattern on the grid
          let maxC = 0;
          let maxR = 0;
          cells.forEach(([c, r]) => {
              if (c > maxC) maxC = c;
              if (r > maxR) maxR = r;
          });
          const originC = Math.max(0, Math.floor((COLS - maxC) / 2));
          const originR = Math.max(0, Math.floor((ROWS - maxR) / 2));

          cells.forEach(([c, r]) => {
              const cc = (originC + c) % COLS;
              const rr = (originR + r) % ROWS;
              grid[idx(cc, rr)] = 1;
          });

          render();
      }

      // ---- Painting cells ----
      function cellFromEvent(e) {
          const rect = canvas.getBoundingClientRect();
          // Canvas is CSS-scaled, so map client px back to internal px
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const c = Math.floor((e.clientX - rect.left) * scaleX / CELL);
          const r = Math.floor((e.clientY - rect.top) * scaleY / CELL);
          if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
          return { c, r };
      }

      canvas.addEventListener('pointerdown', (e) => {
          const cell = cellFromEvent(e);
          if (!cell) return;
          e.preventDefault();
          painting = true;
          // Drag paints a single value, decided by what you first touched
          paintValue = grid[idx(cell.c, cell.r)] > 0 ? 0 : 1;
          grid[idx(cell.c, cell.r)] = paintValue;
          if (canvas.setPointerCapture && e.pointerId !== undefined) {
              try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          }
          render();
      });

      canvas.addEventListener('pointermove', (e) => {
          if (!painting) return;
          const cell = cellFromEvent(e);
          if (!cell) return;
          if ((grid[idx(cell.c, cell.r)] > 0 ? 1 : 0) !== paintValue) {
              grid[idx(cell.c, cell.r)] = paintValue;
              render();
          }
      });

      const endPaint = () => { painting = false; };
      canvas.addEventListener('pointerup', endPaint);
      canvas.addEventListener('pointercancel', endPaint);
      canvas.addEventListener('pointerleave', endPaint);

      // ---- Controls ----
      if (playBtn) {
          playBtn.addEventListener('click', (e) => {
              e.preventDefault();
              running ? pause() : play();
          });
      }

      if (stepBtn) {
          stepBtn.addEventListener('click', (e) => {
              e.preventDefault();
              pause();
              step();
              render();
          });
      }

      if (randomBtn) {
          randomBtn.addEventListener('click', (e) => {
              e.preventDefault();
              randomise();
              if (presetEl) presetEl.value = '';
          });
      }

      if (clearBtn) {
          clearBtn.addEventListener('click', (e) => {
              e.preventDefault();
              pause();
              clear();
              if (presetEl) presetEl.value = '';
          });
      }

      if (speedEl) {
          speedEl.addEventListener('input', () => {
              stepsPerSecond = Math.max(1, parseInt(speedEl.value, 10) || 10);
              accumulator = 0;
          });
      }

      if (presetEl) {
          presetEl.addEventListener('change', () => {
              if (!presetEl.value) return;
              pause();
              loadPreset(presetEl.value);
          });
      }

      // ---- Rules popover ----
      function setRulesOpen(open) {
          if (!rulesPanel || !rulesBtn) return;
          rulesPanel.hidden = !open;
          rulesBtn.setAttribute('aria-expanded', String(open));
          if (open) {
              pause();
              rulesPanel.scrollIntoView({ block: 'nearest' });
          }
      }

      if (rulesBtn) {
          rulesBtn.addEventListener('click', (e) => {
              e.preventDefault();
              setRulesOpen(rulesPanel.hidden);
          });
      }

      if (rulesCloseBtn) {
          rulesCloseBtn.addEventListener('click', (e) => {
              e.preventDefault();
              setRulesOpen(false);
          });
      }

      registry.life = {
          onOpen() {
              // Open on something alive so the rules are immediately legible. An
              // existing grid is left alone so closing the modal doesn't discard
              // whatever the visitor drew.
              if (population() === 0) loadPreset('gosper');
              render();
          },
          onClose() {
              pause();
          },
          onHide() {
              pause();
          }
      };

      setPlayLabel();
      loadPreset('gosper');
  }

  initFlappyByte();
  initGameOfLife();
  return registry;
}

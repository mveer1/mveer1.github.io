// App: interaction states and the frame loop. See docs/game-design.md for the state
// diagram. One rule above all: exactly one source writes the camera (Director), and
// page scroll is frozen whenever the tour is not the active state.
import * as THREE from 'three';
import { createRenderer, createKeyLight } from './core/renderer.js';
import { createGovernor, TIERS } from './core/quality.js';
import { ScrollJourney } from './core/scroll.js';
import { Input } from './core/input.js';
import { Ambience } from './core/audio.js';
import { reducedMotion, damp, FPS } from './core/stepped.js';
import { createMaterials } from './lego/materials.js';
import { setDetail } from './lego/parts.js';
import { createEnvironment } from './world/environment.js';
import { World, BUILD_ORDER, ROUTE, LAYOUT } from './world/world.js';
import { createMinifig } from './character/minifig.js';
import { Animator, angleDelta, yawTo } from './character/animator.js';
import { Controller } from './character/controller.js';
import { Director } from './camera/director.js';
import { toOrbit } from './camera/journey.js';
import { UI } from './ui/ui.js';
import { mapSVG } from './ui/map.js';
import { createGames } from './arcade/games.js';
import { createBeacon, updateBeams } from './world/beacon.js';
import { ISLANDS, EXHIBITS, byId, exhibitsOf, islandById } from './content/content.js';

// Free-walk camera: a long way back and fairly high, so a whole island and the paths off it are in view.
const FOLLOW = { dist: 40, el: 0.55, fov: 42, height: 2.6, min: 12, max: 76 };
// Free camera: detached from the figure, flies over the whole world.
const FREE = { min: 14, max: 170, speed: 0.55, rise: 0.4, lift: [-1.5, 120], bounds: { x: [-110, 110], z: [-150, 40] } };
// Play/pause tour: screens of scroll per second (the whole tour is about 45 screens).
const AUTOPLAY_SPEED = 0.12;
const AUTOPLAY_RATES = [1, 2, 4]; // the speed buttons multiply the base speed
// Space: a small hop, about two bricks high.
const JUMP = { dur: 0.6, height: 2.4 };

export class App {
  constructor({ canvas, tier, locked }) {
    this.canvas = canvas;
    this.reduced = reducedMotion();
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => { this.reduced = e.matches; });
    this.settings = TIERS[tier];
    setDetail(this.settings.detail);
    createMaterials(this.settings.clearcoat ? 2 : 1);
    this.gfx = createRenderer(canvas, this.settings);
    this.key = createKeyLight(this.gfx.scene, this.settings);
    this.env = createEnvironment(this.gfx.scene, { moonDir: this.key.dir, tier });
    this.governor = createGovernor({
      tier, locked,
      onChange: (s) => { this.settings = s; this.gfx.applySettings(s); this.key.setShadows(s.shadows, s.shadowSize); },
    });
    this.world = new World({ scene: this.gfx.scene, tier: this.settings });
    this.director = new Director(this.gfx.camera);
    this.scroll = new ScrollJourney(document.getElementById('scroll-spacer'));
    this.input = new Input(canvas);
    this.audio = new Ambience();
    this.ui = new UI();
    this.arcade = document.getElementById('arcade');
    this.games = createGames(this.arcade);
    this.gameOpen = false;
    this.mode = 'loading';
    this.returnMode = 'journey';
    this.follow = { az: 0, dist: FOLLOW.dist, dEl: 0 };
    this.free = null;
    this.autoplay = false;
    this.autoRate = 1;
    this.jump = null;
    this._lastIsland = 'harbour';
    this._respawning = false;
    this._fallPlayed = false;
    this._chapterIsland = null;
    this.figSmooth = new THREE.Vector3();
    this.held = { pos: new THREE.Vector3(), yaw: Math.PI };
    this.lastBeat = -1;
    this.t = 0;
    this.found = new Set();
    try { JSON.parse(localStorage.getItem('portfolio.found') || localStorage.getItem('archipelago.found') /* key from before the rename */ || '[]').forEach((x) => this.found.add(x)); } catch { /* storage unavailable */ }
    this.raycaster = new THREE.Raycaster();
    this._fader = Object.assign(document.createElement('div'), { className: 'fader' });
    Object.assign(this._fader.style, { position: 'fixed', inset: '0', background: '#0a1019', opacity: '0', pointerEvents: 'none', transition: 'opacity 220ms', zIndex: '35' });
    document.body.appendChild(this._fader);
    this._bind();
  }

  // ------------------------------------------------------------------ boot
  async start() {
    const only = new URLSearchParams(location.search).get('islands');
    const order = only ? BUILD_ORDER.filter((id) => id === 'harbour' || only.split(',').includes(id)) : BUILD_ORDER;
    const total = order.length;
    this.ui.loading(0, total, 'Laying the first bricks');
    // figure
    this.fig = createMinifig({ lanternLight: true });
    this.gfx.scene.add(this.fig.root);
    this.anim = new Animator(this.fig);
    this.ctrl = new Controller(this.world.walk);
    // first island, then show the world
    await this.world.buildIsland('harbour');
    this.world.islands.get('harbour').group.userData.arrive.t = 1;
    this.ui.loading(1, total, 'Building the Works');
    this.scroll.setLength(this.world.journey.length);
    // The hero is scrollable from first paint: pick up wherever the visitor already is instead of easing there from 0.
    this.scroll.s = this.scroll.target = this.scroll._read();
    this.env.buildFar();
    const p0 = this.world.journey.figureAt(0).pos;
    this.held.pos.copy(p0); this.figSmooth.copy(p0);
    this.fig.root.position.copy(p0);
    this.director.setSource(() => this._rail(), { duration: 0 });
    this.mode = 'journey';
    this.ui.setMode('journey');
    // honour a deep link like #visit-gl-recon after everything is built
    this._loop();
    await new Promise((r) => setTimeout(r, 60));
    this.ui.doneLoading();
    window.__ready = true;
    // a hero button pressed while the world was still building (see the inline script in index.html)
    const early = window.__early;
    if (early) { window.__early = null; delete this.ui.root.dataset.queued; this.ui.onAction(early.act, early.data); }
    // remaining islands, progressively, without blocking interaction
    for (let i = 1; i < total; i++) {
      const id = order[i];
      await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 120 }) : setTimeout(r, 16)));
      try { await this.world.buildIsland(id); }
      catch (e) { console.error(`Island ${id} failed to build`, e); this.ui.toast(`${islandById[id]?.name || id} could not be built. Its content is in the field guide.`); }
      this.scroll.setLength(this.world.journey.length, { final: i === total - 1 });
      this.scroll.target = scrollY / innerHeight;
      this.ui.loading(i + 1, total);
    }
    this._spawnCollectibles();
    const pieces = [...this.found].filter((x) => x.startsWith('piece-')).length;
    if (pieces >= this.world.collectibles.length) this.world.islands.get('harbour')?.ctx.onPieces?.(pieces, pieces);
    window.__allBuilt = true;
    this._deepLink();
  }

  _deepLink() {
    const h = location.hash;
    const m = h.match(/^#visit-([\w-]+)$/);
    if (m && byId[m[1]]) this.openExhibit(m[1]);
    const g = h.match(/^#play-(flappy|life)$/);
    if (g) this.openGame(g[1]);
  }

  // ------------------------------------------------------------------ sources
  _rail() {
    const j = this.world.journey;
    if (this.reduced) {
      const b = j.beats[j.beatIndex(this.scroll.s)];
      return { ...b.orbit, look: b.orbit.look.clone() };
    }
    return j.cameraAt(this.scroll.s);
  }

  _followPose() {
    const look = this.figSmooth.clone().add(new THREE.Vector3(0, FOLLOW.height, 0));
    const want = this.follow.dist, wantEl = THREE.MathUtils.clamp(FOLLOW.el + this.follow.dEl, 0.2, 1.3);
    const at = (rr, ee) => new THREE.Vector3(look.x + rr * Math.cos(ee) * Math.sin(this.follow.az), look.y + rr * Math.sin(ee), look.z + rr * Math.cos(ee) * Math.cos(this.follow.az));
    const blocked = (rr, ee) => { const p = at(rr, ee); return this.world.occupiedAt(p) || this.world.occluded(p, look, 0.8); };
    // Something in the way: rise first (a higher viewpoint clears most things and keeps the
    // distance), step in only if rising is not enough, and never closer than 60% of the zoom.
    let r = want, el = wantEl;
    if (blocked(r, el)) {
      let ok = false;
      for (const de of [0.12, 0.24, 0.38, 0.52, 0.68]) {
        const e2 = Math.min(1.3, wantEl + de);
        if (!blocked(r, e2)) { el = e2; ok = true; break; }
      }
      for (const k of ok ? [] : [0.88, 0.76, 0.66, 0.6]) {
        const e2 = Math.min(1.3, wantEl + 0.5);
        r = want * k; el = e2;
        if (!blocked(r, e2)) { ok = true; break; }
      }
    }
    // easing: ease in slowly and out more slowly, so a passing lamppost never jerks the view
    const b = this.follow.boom || (this.follow.boom = { r, el });
    b.r += (r - b.r) * (r < b.r ? 0.1 : 0.03);
    b.el += (el - b.el) * (el > b.el ? 0.1 : 0.03);
    return { look, r: b.r, az: this.follow.az, el: b.el, fov: FOLLOW.fov };
  }

  _freePose() {
    const f = this.free;
    return { look: f.look.clone(), r: f.dist, az: f.az, el: f.el, fov: FOLLOW.fov };
  }

  /** Whichever camera the explore mode is using right now. */
  _exploreCam() { return this.free ? this._freePose() : this._followPose(); }

  /** Detach the camera from the figure (or snap it back). Explore mode only. */
  toggleFree() {
    if (this.mode !== 'explore' || this.riding) return;
    if (this.free) {
      this.follow.az = this.free.az;
      this.follow.dist = THREE.MathUtils.clamp(this.free.dist, FOLLOW.min, FOLLOW.max);
      this.follow.boom = null;
      this.free = null;
    } else {
      const d = this.director.current;
      this.free = { look: d.look.clone(), az: d.az, el: THREE.MathUtils.clamp(d.el, 0.25, 1.4), dist: THREE.MathUtils.clamp(Math.max(d.r, 50), FREE.min, FREE.max), lift: 0, baseY: d.look.y };
    }
    this.ui.freeCam(!!this.free);
    this.director.setSource(() => this._exploreCam(), { duration: this.reduced ? 0 : 0.7, damping: 8 });
    this.ui.toast(this.free ? 'Free camera: W A S D move the view, R and F raise and lower it. C follows the figure again.' : 'The camera follows the figure again.');
  }

  setAutoRate(n) {
    if (!AUTOPLAY_RATES.includes(n)) return;
    this.autoRate = n;
    this.ui.speed(n);
    if (!this.autoplay && (this.mode === 'journey' || this.mode === 'explore')) this.setAutoplay(true);
  }

  /** Where the figure starts on an island: its spawn point, else the end of its first tour walk. */
  _islandSpawn(islandId) {
    const is = this.world.islands.get(islandId);
    if (is?.ctx.spawn) return new THREE.Vector3(is.ctx.spawn[0], 0, is.ctx.spawn[1]).add(is.origin);
    if (islandId === 'harbour') return this.world.journey.figureAt(0).pos.clone();
    return this.world.journey.beats.find((b) => b.island === islandId && !b.travel)?.path.at(-1)?.clone() ?? null;
  }

  /** Off the edge: fade out, then start again on the island the figure fell from. */
  _respawnFromFall() {
    this._respawning = true;
    const id = this._lastIsland;
    const go = () => {
      const sp = this._islandSpawn(id) || this.world.journey.figureAt(0).pos.clone();
      this.ctrl.place(sp);
      this.held.pos.copy(this.ctrl.pos); this.figSmooth.copy(this.ctrl.pos); this.fig.root.position.copy(this.ctrl.pos);
      this.follow.boom = null;
      this.jump = null; this._fallPlayed = false; this._respawning = false;
      this.anim.play('hop');
      this.ui.toast(`You fell off the edge. Back at ${islandById[id]?.name ?? 'the start'}.`);
    };
    if (this.reduced) go(); else this._cut(go);
  }

  _jump() {
    if (this.mode !== 'explore' || this.riding || this.jump || this.ctrl.falling) return;
    this.jump = { t0: this.t };
    this.anim.play('jump');
    this.audio.snap(0.7);
  }

  /** Slow automatic tour: the page scrolls itself, everything else follows. */
  setAutoplay(on) {
    if (on && this.mode === 'explore') this.backToTour();
    if (on && this.mode !== 'journey') return;
    this.autoplay = on;
    this._autoPos = scrollY;
    this.ui.autoplay(on);
    if (on) { this.ui.help(false); this.ui.prompt(null); }
  }

  // ------------------------------------------------------------------ states
  enterExplore() {
    if (this.mode !== 'journey') return;
    this.mode = 'explore';
    this.scroll.lock();
    this.ui.setMode('explore');
    this.ctrl.place(this.held.pos.clone(), this.held.yaw);
    this.follow.az = this.director.current.az;
    this.follow.dist = FOLLOW.dist;
    this.follow.dEl = 0; this.follow.boom = null;
    this.free = null; this.ui.freeCam(false);
    this.director.setSource(() => this._exploreCam(), { duration: this.reduced ? 0 : 0.9, damping: 7 });
    if (!this._helped) { this._helped = true; this.ui.help(true); this._helpT = this.t + 9; }
    this.ui.prompt(null);
  }

  backToTour() {
    if (this.mode !== 'explore' || this.riding) return;
    const j = this.world.journey;
    const island = this.world.walk.islandAt(this.ctrl.pos.x, this.ctrl.pos.z);
    const s = j.nearestS(this.ctrl.pos, ROUTE.includes(island) ? island : null);
    this.free = null; this.ui.freeCam(false);
    this.mode = 'journey';
    this.ui.setMode('journey');
    this.ui.help(false); this.ui.prompt(null);
    this.scroll.unlock();
    this.scroll.goto(s, { instant: true });
    this.anim.play('hop');
    this.director.setSource(() => this._rail(), { duration: this.reduced ? 0 : 1.0 });
    this.lastBeat = -1;
  }

  openExhibit(id) {
    const ex = this.world.exhibit(id);
    if (!ex) { this.ui.toast('That place is still being built. Try again in a moment.'); return; }
    if (id === 'arcade') { this._stepUpToArcade(ex); return; }
    if (this.mode === 'panel') { this._showPanel(ex); return; }
    this.returnMode = this.mode === 'map' || this.mode === 'guide' ? (this._baseMode || 'journey') : this.mode;
    if (this.mode === 'map') this.ui.closeMap();
    if (this.mode === 'guide') this.ui.closeGuide();
    const far = ex.stand.distanceTo(this.held.pos) > 30;
    const go = () => {
      if (this.returnMode === 'journey') {
        // move the tour to this stop, so closing the panel returns here
        const beat = this.world.journey.beats.find((b) => b.exhibit === id);
        if (beat) {
          this.scroll.unlock();
          this.scroll.goto(this.world.journey.restS(beat), { instant: true });
          const p = this.world.journey.figureAt(this.scroll.s).pos;
          this.held.pos.copy(p); this.figSmooth.copy(p); this.fig.root.position.copy(p);
        }
      } else if (far) {
        this.ctrl.place(ex.stand.clone()); this.held.pos.copy(this.ctrl.pos); this.figSmooth.copy(this.ctrl.pos);
      }
      this.scroll.lock();
      this.mode = 'panel';
      this.ui.setMode('panel');
      this.ui.prompt(null); this.ui.label(null);
      const orbit = toOrbit(ex.shot.pos, ex.shot.look, ex.shot.fov);
      this.director.setSource(() => orbit, { duration: far || this.reduced ? 0 : 0.9 });
      this._showPanel(ex);
    };
    if (far && !this.reduced) this._cut(go); else go();
  }

  /** Exhibits of an island in tour order (then any not on the tour). */
  _islandOrder(island) {
    const toured = this.world.journey.beats.filter((b) => b.island === island && b.exhibit).map((b) => b.exhibit);
    return [...toured, ...exhibitsOf(island).map((e) => e.id).filter((id) => !toured.includes(id))];
  }

  _showPanel(ex) {
    const list = this._islandOrder(ex.island);
    const i = list.indexOf(ex.id);
    this.currentPanel = ex.id;
    this.ui.openPanel(ex.id, { prev: list[i - 1], next: list[i + 1] });
    if (this.mode === 'panel' && this.currentPanelOrbit !== ex.id) {
      this.currentPanelOrbit = ex.id;
      const orbit = toOrbit(ex.shot.pos, ex.shot.look, ex.shot.fov);
      this.director.setSource(() => orbit, { duration: this.reduced ? 0 : 0.8 });
    }
    // the figure turns to the exhibit and reaches toward it
    if (ex.stand.distanceTo(this.held.pos) < 14) this.held.yaw = yawTo(this.held.pos, ex.face);
    this.anim.play('interact');
    ex.onOpen?.();
    this.world.islands.get(ex.island)?.ctx.onOpen?.(ex.id);
    this.audio.snap(1);
    this._panelShift();
  }

  _panelShift() {
    const mobile = innerWidth <= 760;
    if (mobile) this.director.setViewShift(0, innerHeight * 0.26);
    else this.director.setViewShift(Math.min(500, innerWidth * 0.44) / 2, 0);
  }

  closeOverlay() {
    if (this.mode === 'panel') {
      this.ui.closePanel();
      this.director.setViewShift(0, 0);
      this.currentPanel = null; this.currentPanelOrbit = null;
      this.mode = this.returnMode;
      this.ui.setMode(this.mode);
      if (this.mode === 'journey') { this.scroll.unlock(); this.director.setSource(() => this._rail(), { duration: this.reduced ? 0 : 0.9 }); this.lastBeat = -1; }
      else this.director.setSource(() => this._exploreCam(), { duration: this.reduced ? 0 : 0.9, damping: 7 });
    } else if (this.mode === 'map') {
      this.ui.closeMap(); this.mode = this._baseMode; this.ui.setMode(this.mode);
      if (this.mode === 'journey') this.scroll.unlock();
    } else if (this.mode === 'guide') {
      this.ui.closeGuide(); this.mode = this._baseMode; this.ui.setMode(this.mode);
      if (this.mode === 'journey') this.scroll.unlock();
    }
  }

  openMap() {
    if (this.mode === 'map') return this.closeOverlay();
    if (this.mode === 'panel') this.closeOverlay();
    this._baseMode = this.mode === 'guide' ? this._baseMode : this.mode;
    if (this.mode === 'guide') this.ui.closeGuide();
    this.scroll.lock();
    this.mode = 'map'; this.ui.setMode('map');
    const hiddenFound = this.found.has('dormant');
    this.ui.openMap(mapSVG(this.world, this.held.pos, hiddenFound), { found: [...this.found].filter((x) => x.startsWith('piece-')).length, total: this.world.collectibles.length, hiddenFound });
  }

  openGuide(anchor) {
    if (this.mode === 'guide') return this.closeOverlay();
    if (this.mode === 'panel') this.closeOverlay();
    this._baseMode = this.mode === 'map' ? this._baseMode : this.mode;
    if (this.mode === 'map') this.ui.closeMap();
    this.scroll.lock();
    this.mode = 'guide'; this.ui.setMode('guide');
    this.ui.openGuide(anchor);
  }

  travel(islandId) {
    const base = this._baseMode || 'journey';
    this.ui.closeMap();
    const go = () => {
      this.mode = base; this.ui.setMode(base);
      if (base === 'journey') {
        const beat = this.world.journey.beats.find((b) => b.island === islandId && !b.travel);
        if (!beat) { this.ui.toast('That island is still being built.'); return; }
        this.scroll.unlock();
        this.scroll.goto(this.world.journey.restS(beat), { instant: true });
        const p = this.world.journey.figureAt(this.scroll.s).pos;
        this.held.pos.copy(p); this.figSmooth.copy(p);
        this.director.setSource(() => this._rail(), { duration: 0 });
        this.lastBeat = -1;
      } else {
        const is = this.world.islands.get(islandId);
        const spawn = this._islandSpawn(islandId);
        if (!spawn) return;
        this.ctrl.place(spawn.clone()); this.held.pos.copy(this.ctrl.pos); this.figSmooth.copy(this.ctrl.pos);
        if (this.free) this.free.look.copy(this.ctrl.pos).add(new THREE.Vector3(0, 2, 0));
        this.director.setSource(() => this._exploreCam(), { duration: 0, damping: 7 });
      }
      this.anim.play('hop');
    };
    if (this.reduced) go(); else this._cut(go);
  }

  /** Explore-mode transport: carry the figure from -> to over dur seconds (held frames). */
  startRide({ from, to, dur = 4, car = null, exit, hang = false }) {
    if (this.mode !== 'explore' || this.riding) return;
    this.riding = { from: from.clone(), to: to.clone(), dur, t: 0, car, exit: exit.clone(), hang };
    this.ui.prompt(null);
    this.audio.snap(1);
  }

  _ride(dt) {
    const r = this.riding;
    r.t += dt / r.dur;
    const k = Math.min(1, r.t);
    const kk = this.reduced ? (k < 1 ? 0 : 1) : Math.floor(k * 30) / 30;
    const p = new THREE.Vector3().lerpVectors(r.from, r.to, kk);
    if (r.car) r.car.place(p);
    this.ctrl.pos.copy(p);
    this.held.pos.copy(p);
    this.held.yaw = Math.atan2(r.to.x - r.from.x, r.to.z - r.from.z);
    if (k >= 1) {
      this.riding = null;
      this.ctrl.place(r.exit);
      this.held.pos.copy(this.ctrl.pos);
      this.anim.play('hop');
    }
  }

  _cut(fn) {
    this._fader.style.opacity = '1';
    setTimeout(() => { fn(); requestAnimationFrame(() => { this._fader.style.opacity = '0'; }); }, 230);
  }

  stepStop(dir) {
    const j = this.world.journey;
    const stops = j.beats.filter((b) => !b.travel);
    const cur = j.beats[j.beatIndex(this.scroll.s)];
    let i = stops.indexOf(cur);
    if (i < 0) i = stops.findIndex((b) => b.s0 > this.scroll.s) - (dir > 0 ? 1 : 0);
    const next = stops[Math.max(0, Math.min(stops.length - 1, i + dir))];
    if (next) this.scroll.goto(j.restS(next), { instant: this.reduced });
  }

  // ------------------------------------------------------------------ input
  _bind() {
    this.ui.onAction = (act, data) => {
      switch (act) {
        case 'start': this.stepStop(1); break;
        case 'mode': this.mode === 'explore' ? this.backToTour() : (this.mode === 'journey' ? this.enterExplore() : null); break;
        case 'autoplay': this.setAutoplay(!this.autoplay); break;
        case 'free': this.toggleFree(); break;
        case 'speed': this.setAutoRate(+data.speed); break;
        case 'chapter-close': this.ui.dismissChapter(true); break;
        case 'chapter-open': this.ui.dismissChapter(false); break;
        case 'map': this.openMap(); break;
        case 'guide': this.openGuide(); break;
        case 'close': case 'close-guide': this.closeOverlay(); break;
        case 'sound': this.ui.sound(this.audio.toggle()); break;
        case 'open': this.openExhibit(data.id); break;
        case 'panel-prev': case 'panel-next': if (data.id) this.openExhibit(data.id); break;
        case 'prev': this.stepStop(-1); break;
        case 'next': this.stepStop(1); break;
        case 'travel': this.travel(data.id); break;
        case 'visit': this.ui.closeGuide(); this.mode = this._baseMode || 'journey'; this.openExhibit(data.id); break;
        case 'interact': this._interact(); break;
        case 'play': this.openGame(data.game); break;
        case 'restart': this.scroll.goto(0, { instant: this.reduced }); break;
      }
    };
    this.input.on('key', (k, e) => {
      if (this.mode === 'loading' || this.gameOpen) return;
      if (k === 'escape') return; // handled by the Escape listener below, which also works inside form fields
      if (this.mode === 'guide' || this.mode === 'map') {
        if (k === 'm' && this.mode === 'map') this.closeOverlay();
        if (k === 'g' && this.mode === 'guide') this.closeOverlay();
        return;
      }
      if (k === 'm') { e.preventDefault(); this.openMap(); return; }
      if (k === 'g') { e.preventDefault(); this.openGuide(); return; }
      if (k === 'n') { this.ui.sound(this.audio.toggle()); return; }
      if (k === 'p' && (this.mode === 'journey' || this.mode === 'explore')) { this.setAutoplay(!this.autoplay); return; }
      if ((k === '[' || k === ']') && (this.mode === 'journey' || this.mode === 'explore')) {
        const i = AUTOPLAY_RATES.indexOf(this.autoRate) + (k === ']' ? 1 : -1);
        this.setAutoRate(AUTOPLAY_RATES[Math.max(0, Math.min(AUTOPLAY_RATES.length - 1, i))]);
        return;
      }
      if (this.mode === 'panel') return;
      if (this.mode === 'journey') {
        if (['w', 'a', 's', 'd'].includes(k)) { this.enterExplore(); return; }
        if (k === '.') this.stepStop(1);
        if (k === ',') this.stepStop(-1);
        if (k === 'enter' || k === 'f') { const b = this._beat(); if (b?.exhibit && document.activeElement === document.body) this.openExhibit(b.exhibit); }
      } else if (this.mode === 'explore') {
        if (k.startsWith('arrow') || k === ' ') e.preventDefault();
        if (k === 'j') this.backToTour();
        if (k === 'c') this.toggleFree();
        if (k === ' ' && !e.repeat) this._jump();
        // F raises/lowers the free camera, so it only opens things while the camera follows the figure
        if ((k === 'enter' || (k === 'f' && !this.free)) && !this.riding && (this._nearExhibit || this._nearRide)) {
          // opening a panel moves focus to its Close button mid-keypress; without this the
          // browser would then "press" Close with the same Enter and the panel would vanish
          e.preventDefault();
          this._interact();
        }
        if (k === '+' || k === '=') this._zoom(-3);
        if (k === '-') this._zoom(3);
      }
    });
    this.input.on('wheel', (e) => { if (this.mode === 'explore') this._zoom(Math.sign(e.deltaY) * 2.4); });
    // Escape closes whatever is open (game, panel, map, field guide), even from inside a form field.
    addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || this.mode === 'loading') return;
      if (this.gameOpen) { e.preventDefault(); this.closeGame(); return; }
      if (this.mode === 'panel' || this.mode === 'map' || this.mode === 'guide') { e.preventDefault(); this.closeOverlay(); return; }
      if (this.mode === 'journey' && this.ui.chapterShown) { e.preventDefault(); this.ui.dismissChapter(true); }
    });
    // Any manual scroll or key press takes over from the automatic tour.
    for (const ev of ['wheel', 'touchstart']) addEventListener(ev, () => { if (this.autoplay) this.setAutoplay(false); }, { passive: true });
    addEventListener('keydown', (e) => { if (this.autoplay && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) this.setAutoplay(false); });
    this.input.on('tap', (e) => this._tap(e));
    addEventListener('resize', () => { if (this.mode === 'panel') this._panelShift(); });
    addEventListener('hashchange', () => {
      if (location.hash === '#guide') this.openGuide();
      const g = location.hash.match(/^#play-(flappy|life)$/);
      if (g) this.openGame(g[1]);
    });
    this._bindArcade();
    document.querySelector('.skip')?.addEventListener('click', (e) => { e.preventDefault(); this.openGuide(); });
  }

  /** Zoom whichever explore camera is active; positive = further away. */
  _zoom(d) {
    if (this.free) this.free.dist = THREE.MathUtils.clamp(this.free.dist + d * Math.max(1, this.free.dist / 30), FREE.min, FREE.max);
    else this.follow.dist = THREE.MathUtils.clamp(this.follow.dist + d, FOLLOW.min, FOLLOW.max);
  }

  _ndc(e) { return new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); }

  _pickExhibit(e) {
    this.raycaster.setFromCamera(this._ndc(e), this.gfx.camera);
    const hit = this.raycaster.intersectObjects(this.world.hitGroup.children, false)[0];
    return hit ? hit.object.userData.exhibit : null;
  }

  _tap(e) {
    if (this.mode !== 'journey' && this.mode !== 'explore') return;
    const id = this._pickExhibit(e);
    if (id) { this.openExhibit(id); return; }
    if (this.mode === 'explore') {
      this.raycaster.setFromCamera(this._ndc(e), this.gfx.camera);
      const targets = [...this.world.islands.values()].map((i) => i.group).concat(this.world.bridges.map((b) => b.group));
      const hit = this.raycaster.intersectObjects(targets, true)[0];
      if (hit) {
        const g = this.world.walk.ground(hit.point.x, hit.point.z, null);
        if (g && !g.blocked) { this.ctrl.goTo(hit.point); this.ui.help(false); }
      }
    }
  }

  _interact() {
    if (this.ctrl.falling) return;
    const near = this._nearExhibit;
    if (near) { this.openExhibit(near.id); return; }
    const ride = this._nearRide;
    if (ride) ride.start(this);
  }

  _beat() { const j = this.world.journey; return j.beats[j.beatIndex(this.scroll.s)]; }

  // ------------------------------------------------------------------ arcade
  /** The cabinet is not a text panel: stepping up to it opens the game-select screen over the world. */
  _stepUpToArcade(ex) {
    // arriving from the map or the field guide: put the world back first
    this.ui.closeGuide(); this.ui.closeMap();
    if (this.mode === 'map' || this.mode === 'guide') this.mode = this._baseMode || 'journey';
    if (this.mode === 'journey') this.scroll.unlock();
    this.ui.setMode(this.mode);
    if (ex.stand.distanceTo(this.held.pos) < 14) this.held.yaw = yawTo(this.held.pos, ex.face);
    this.anim.play('interact');
    this.audio.snap(1);
    this.openArcade();
  }

  /** Show one view of the arcade dialog: the game-select screen ('menu') or one of the games. */
  _arcadeView(view) {
    const dlg = this.arcade;
    const prev = dlg.dataset.game;
    if (prev && prev !== view) this.games[prev]?.onClose();
    dlg.dataset.view = view;
    dlg.dataset.game = view === 'menu' ? '' : view;
    dlg.querySelectorAll('[data-view]').forEach((s) => { s.hidden = s.dataset.view !== view; });
    dlg.querySelector('#arcade-title').textContent = { menu: 'Choose your game', flappy: 'Flappy Byte', life: 'Life Cell' }[view];
    dlg.querySelector('.arcade-sheet').scrollTop = 0;
  }

  _openArcadeDialog() {
    const dlg = this.arcade;
    if (this.autoplay) this.setAutoplay(false);
    if (!dlg.open) { this._gameReturn = document.activeElement; dlg.showModal(); }
    this.gameOpen = true;
  }

  /** The game-select screen: two big poster tiles. */
  openArcade() {
    if (this.mode === 'loading') return;
    this._arcadeView('menu');
    this._openArcadeDialog();
    this.arcade.querySelector('.arcade-tile')?.focus({ preventScroll: true });
  }

  /** Open one of the two games directly (deep links, the field guide, a tile). */
  openGame(id) {
    const g = this.games[id];
    if (!g || this.mode === 'loading') return;
    this._arcadeView(id);
    this._openArcadeDialog();
    g.onOpen();
    this.arcade.querySelector(`.game[data-view="${id}"] [data-autofocus]`)?.focus({ preventScroll: true });
  }

  closeGame() {
    if (this.arcade.open) this.arcade.close();
  }

  _bindArcade() {
    const dlg = this.arcade;
    dlg.querySelector('[data-arcade-close]').addEventListener('click', () => this.closeGame());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) this.closeGame(); });
    dlg.querySelectorAll('[data-arcade-open]').forEach((b) => b.addEventListener('click', () => this.openGame(b.dataset.arcadeOpen)));
    dlg.querySelectorAll('[data-arcade-menu]').forEach((b) => b.addEventListener('click', () => this.openArcade()));
    dlg.addEventListener('close', () => {
      this.games[dlg.dataset.game]?.onClose();
      this.gameOpen = false;
      this._gameReturn?.focus?.({ preventScroll: true });
      if (/^#play-|^#visit-arcade/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.gameOpen) this.games[dlg.dataset.game]?.onHide?.(); });
  }

  // ------------------------------------------------------------------ beacons
  // Seven laser beacons, one per island: each fires a red beam straight up so it can be spotted
  // from anywhere in the world. Walking up to one shuts it down.
  _spawnCollectibles() {
    for (const c of this.world.collectibles) {
      const bc = createBeacon();
      bc.group.position.copy(c.pos); bc.group.position.y -= 0.2;
      this.gfx.scene.add(bc.group);
      c.beacon = bc;
      bc.setArmed(!this.found.has(c.id), true);
    }
  }

  _checkCollectibles() {
    for (const c of this.world.collectibles) {
      if (!c.beacon) continue;
      const armed = !this.found.has(c.id);
      if (armed) c.beacon.tick(this.t, this.reduced);
      if (armed && this.mode === 'explore' && this.held.pos.distanceTo(c.pos) < 2.6) {
        this.found.add(c.id);
        c.beacon.setArmed(false, this.reduced);
        this.anim.play('discover');
        this.audio.snap(1.4);
        const n = [...this.found].filter((x) => x.startsWith('piece-')).length;
        const total = this.world.collectibles.length;
        const name = islandById[c.island]?.name ?? 'an island';
        this.ui.toast(n >= total ? `All ${total} beacons are dark. Something is being built by the Harbour, and a green light marks the spot.` : `Beacon shut down at ${name}: ${n} of ${total}`, n >= total ? 5200 : 3200);
        try { localStorage.setItem('portfolio.found', JSON.stringify([...this.found])); } catch { /* storage unavailable */ }
        this.world.islands.get('harbour')?.ctx.onPieces?.(n, total);
      }
    }
  }

  // ------------------------------------------------------------------ frame
  _loop() {
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      this.t += dt;
      // A game is open over the world: the world is mostly covered, so it only ticks every fifth
      // frame and leaves the machine to the game.
      if (this.gameOpen && (this._gameFrame = ((this._gameFrame || 0) + 1) % 5)) { this._raf = requestAnimationFrame(frame); return; }
      try { this._frame(dt); } catch (e) { console.error(e); }
      if (!document.hidden && !this.gameOpen) this.governor.sample(dt * 1000);
      this._raf = requestAnimationFrame(frame);
    };
    this._raf = requestAnimationFrame(frame);
  }

  _frame(dt) {
    const t = this.t;
    const j = this.world.journey;
    if (this.autoplay) {
      if (this.mode !== 'journey') this.setAutoplay(false);
      else {
        // the page scrolls itself; a float position keeps slow speeds from stalling on pixel rounding
        if (Math.abs(scrollY - this._autoPos) > 4) this._autoPos = scrollY;
        this._autoPos += AUTOPLAY_SPEED * this.autoRate * innerHeight * dt;
        const end = j.length * innerHeight;
        if (this._autoPos >= end) { this._autoPos = end; this.setAutoplay(false); }
        scrollTo({ top: this._autoPos, behavior: 'instant' });
      }
    }
    const s = this.scroll.update(dt, this.reduced);
    let speed = 0, lookYaw = null;

    if (this.mode === 'journey') {
      const f = j.figureAt(s);
      const target = f.pos.clone();
      if (this.reduced) target.copy(f.beat.path.at(-1));
      const g = this.world.walk.ground(target.x, target.z, target.y);
      if (g && !g.tooHigh) target.y = g.y;
      speed = Math.abs(this.scroll.velocity) * (f.beat.L / Math.max(0.1, f.beat.len * 0.6));
      if (!f.moving || f.beat.ride) speed = 0;
      if (this.anim.lastFrame !== Math.floor(t * FPS.figure)) {
        // held position: the figure advances only on its own frames
        this.held.pos.copy(target);
        if (f.beat.ride && f.dir) this.held.yaw = Math.atan2(f.dir.x, f.dir.z);
        else if (f.moving && f.dir) this.held.yaw = Math.atan2(f.dir.x, f.dir.z) + (this.scroll.velocity < 0 ? Math.PI : 0);
        else if (f.face) this.held.yaw = yawTo(this.held.pos, f.face);
      }
      // chapter card
      const bi = j.beatIndex(s);
      if (bi !== this.lastBeat) {
        this.lastBeat = bi;
        const b = j.beats[bi];
        const stops = j.beats.filter((x) => !x.travel);
        if (b.island !== this._chapterIsland) { this._chapterIsland = b.island; this.ui.dismissChapter(false); }
        this.ui.finale(!!b.finale);
        this.ui.hero(!!b.title);
        if (b.finale) this.ui.hideChapter();
        else this.ui.chapter({ island: b.island, order: this._islandOrder(b.island), current: b.exhibit, index: Math.max(0, stops.indexOf(b)), total: stops.length, travelling: b.travel });
        this.ui.setPlace(b.travel ? j.beats[Math.min(bi + 1, j.beats.length - 1)].island : b.island);
      }
      if (innerWidth > 760) this.director.setViewShift(Math.min(200, innerWidth * 0.12), 0);
      else this.director.setViewShift(0, -innerHeight * 0.08);
    } else if (this.mode === 'explore') {
      this.director.setViewShift(0, 0);
      // camera turn: Q/E and drag (sideways turns, up and down tilts)
      const k = this.input.keys;
      const f = this.free;
      const turn = (k.has('q') ? dt * 1.8 : 0) - (k.has('e') ? dt * 1.8 : 0) - this.input.takeYaw();
      const tilt = this.input.takePitch();
      let az;
      if (f) {
        f.az += turn; f.el = THREE.MathUtils.clamp(f.el + tilt, 0.2, 1.45); az = f.az;
      } else {
        this.follow.az += turn; this.follow.dEl = THREE.MathUtils.clamp(this.follow.dEl + tilt, -0.35, 0.7); az = this.follow.az;
      }
      const ax = this.input.axes();
      if (f) {
        // free camera: W A S D fly the view over the world; the figure stays where it is
        const v = FREE.speed * f.dist * (ax.run ? 2.2 : 1) * dt;
        f.look.x += (-Math.sin(az) * ax.z + Math.cos(az) * ax.x) * v;
        f.look.z += (-Math.cos(az) * ax.z - Math.sin(az) * ax.x) * v;
        f.look.x = THREE.MathUtils.clamp(f.look.x, FREE.bounds.x[0], FREE.bounds.x[1]);
        f.look.z = THREE.MathUtils.clamp(f.look.z, FREE.bounds.z[0], FREE.bounds.z[1]);
        // height: R up, F down (the view otherwise follows the ground under it)
        f.lift = THREE.MathUtils.clamp(f.lift + ((k.has('r') ? 1 : 0) - (k.has('f') ? 1 : 0)) * FREE.rise * f.dist * (ax.run ? 2.2 : 1) * dt, FREE.lift[0], FREE.lift[1]);
        const g = this.world.walk.ground(f.look.x, f.look.z, null);
        if (g) f.baseY = damp(f.baseY, g.y + 2, 4, dt);
        f.look.y = f.baseY + f.lift;
      }
      if (this.riding) { this._ride(dt); speed = 0; }
      else speed = this.ctrl.update(dt, f ? { x: 0, z: 0, run: false } : ax, az);
      if (speed > 0 && this._helpT && t > this._helpT) { this.ui.help(false); this._helpT = 0; }
      if (!this.riding && this.anim.lastFrame !== Math.floor(t * FPS.figure)) { this.held.pos.copy(this.ctrl.pos); this.held.yaw = this.ctrl.yaw; }
      const isl = this.world.walk.islandAt(this.ctrl.pos.x, this.ctrl.pos.z);
      if (this.ctrl.falling) {
        // stepped off an edge: arms up on the way down, a fade once it is clearly gone
        this._fallPlayed = true; this.jump = null;
        if (this.anim.action !== 'jump') this.anim.play('jump');
        if (!this._respawning && this.ctrl.fallen > 14) this._respawnFromFall();
        if (this.ctrl.fallen > 60) { this.ctrl.fall = null; this._respawning = false; this._respawnFromFall(); }
      } else if (isl) {
        this._lastIsland = isl; this._fallPlayed = false;
        this.ui.setPlace(isl); if (isl === 'dormant') this.found.add('dormant');
        if (isl === 'lookout' && !this._zipHint) { this._zipHint = true; this.ui.toast('The zip line on the west edge rides back to the Harbour, where you started.', 5200); }
      }
      this._proximity();
    } else if (this.mode === 'panel') {
      const ex = this.world.exhibit(this.currentPanel);
      if (ex && ex.stand.distanceTo(this.held.pos) < 14) lookYaw = angleDelta(this.held.yaw, yawTo(this.held.pos, ex.face)) * 0.3;
    }

    // the hero text rolls away with the scroll itself (CSS); this only retires the card once it is gone
    this.ui.started(this.mode !== 'journey' || s > (this.reduced ? 0.35 : 0.8));
    // figure: held pose and position
    this.anim.update(t, dt, { speed, running: this.mode === 'explore' && this.ctrl.running, lookYaw, reduced: this.reduced });
    this.fig.root.position.copy(this.held.pos);
    // jump: lift the figure on the stop-motion clock (held on twos like everything else it does)
    if (this.jump && this.mode !== 'explore') this.jump = null;
    if (this.jump) {
      const T = this.t - this.jump.t0;
      if (T >= JUMP.dur) this.jump = null;
      else { const u = Math.floor(T * FPS.figure) / FPS.figure / JUMP.dur; this.fig.root.position.y += 4 * JUMP.height * u * (1 - u); }
    }
    this.fig.root.rotation.y = this.held.yaw;
    this.figSmooth.x = damp(this.figSmooth.x, this.held.pos.x, 10, dt);
    this.figSmooth.y = damp(this.figSmooth.y, this.held.pos.y, 10, dt);
    this.figSmooth.z = damp(this.figSmooth.z, this.held.pos.z, 10, dt);

    this.director.update(dt);
    const focus = this.director.look;
    // Shadows are invisible on wide shots: refresh the shadow map only occasionally there.
    const sm = this.gfx.renderer.shadowMap;
    if (sm.enabled) {
      const wide = this.director.current.r > 95;
      sm.autoUpdate = !wide;
      if (wide && (this._shadowTick = (this._shadowTick || 0) + 1) % 45 === 0) sm.needsUpdate = true;
    }
    this.key.follow(focus);
    this.world.updateLights(focus);
    this.env.update(t, this.gfx.camera, focus, this.reduced);
    this.world.update(t, dt, this._worldState());
    this._markers(t);
    this._hover();
    this._checkCollectibles();
    updateBeams(t, dt, this.reduced);
    const works = this.world.islands.get('works');
    this.audio.update(dt, works ? Math.max(0, 1 - this.held.pos.distanceTo(works.origin) / 40) : 0);
    // tilt-shift: stronger on wide shots
    this.gfx.focus.amount = THREE.MathUtils.clamp((this.director.current.r - 10) / 130, 0.1, 0.4);
    this.gfx.render(t);
  }

  _worldState() {
    const j = this.world.journey, s = this.scroll.s, self = this;
    return {
      mode: this.mode === 'panel' ? this.returnMode : this.mode, journeyS: s, reduced: this.reduced, t: this.t, figure: this.held.pos,
      beatProgress: (is, b) => j.progressIn(is + ':' + b, s),
      beatStart: (is, b) => j.find(is + ':' + b)?.s0 ?? Infinity,
      beatEnd: (is, b) => j.find(is + ':' + b)?.s1 ?? -Infinity,
      figureLocal(is) { const o = self.world.islands.get(is)?.origin; return o ? self.held.pos.clone().sub(o) : null; },
      app: this,
    };
  }

  _markers(t) {
    const cur = this.mode === 'journey' ? this._beat()?.exhibit : this.mode === 'panel' ? this.currentPanel : this._nearExhibit?.id;
    const fr = Math.floor(t * FPS.life);
    for (const ex of this.world.exhibits) {
      const m = ex.marker;
      const active = ex.id === cur;
      m.position.y = ex.markerBase + (this.reduced ? 0 : (fr % 2) * 0.12) + (active ? 0.3 : 0);
      m.rotation.y = this.reduced ? 0 : fr * 0.35;
      const s = active ? 0.95 : 0.75;
      m.scale.setScalar(s);
      m.userData.ring.material.opacity = active ? 0.7 : 0.35;
      m.visible = this.mode !== 'panel' || active;
    }
  }

  _hover() {
    const p = this.input.pointer;
    if (!p.inside || (this.mode !== 'journey' && this.mode !== 'explore') || this.input.drag) {
      this.canvas.classList.remove('pointing');
      if (this.mode !== 'explore' || !this._nearExhibit) this.ui.label(null);
      return;
    }
    const id = this._pickExhibit({ clientX: p.x, clientY: p.y });
    this.canvas.classList.toggle('pointing', !!id);
    if (id) {
      const ex = this.world.exhibit(id);
      const v = ex.marker.position.clone().project(this.gfx.camera);
      this.ui.label(ex.content.object, ex.content.title, (v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight);
    } else this.ui.label(null);
  }

  _proximity() {
    let best = null, bd = 4.2;
    for (const ex of this.world.exhibits) {
      const d = Math.min(ex.stand.distanceTo(this.ctrl.pos), Math.hypot(ex.marker.position.x - this.ctrl.pos.x, ex.marker.position.z - this.ctrl.pos.z) - 1);
      if (d < bd) { bd = d; best = ex; }
    }
    this._nearExhibit = best;
    let ride = null;
    if (!best) {
      for (const tr of this.world.transports || []) if (tr.near(this.ctrl.pos)) { ride = tr; break; }
    }
    this._nearRide = ride;
    this.ui.prompt(best ? (best.content.open || `Open the ${best.content.object.toLowerCase()}`) : ride ? ride.label : null);
  }
}

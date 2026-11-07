// DOM side of the world: HUD, chapter card, panels, map, field guide, prompts.
// Emits actions through `onAction(name, data)`; never touches the 3D scene.
import { ISLANDS, EXHIBITS, byId, exhibitsOf, islandById, SITE } from '../content/content.js';
import { exhibitBody, esc } from '../content/render.js';

const $ = (s, r = document) => r.querySelector(s);

export class UI {
  constructor() {
    this.root = document.documentElement;
    this.el = {
      placeName: $('.place-name'), placeLabel: $('.place-label'),
      chapter: $('.chapter'), chStep: $('.chapter-step'), chLabel: $('.chapter-label'), chName: $('.chapter-name'),
      chSummary: $('.chapter-summary'), chStops: $('.chapter-stops'), chCur: $('.chapter-current'),
      curLine: $('.cur-line'), curMetric: $('.cur-metric'), curOpen: $('.cur-open'), chCount: $('.chapter-count'),
      panel: $('#panel'), pObject: $('#panel .panel-object'), pKicker: $('#panel .panel-kicker'), pTitle: $('#panel .panel-title'),
      pBody: $('#panel .panel-body'), pPrev: $('[data-act="panel-prev"]'), pNext: $('[data-act="panel-next"]'),
      map: $('#map'), mapArt: $('.map-art'), mapList: $('.map-list'), mapFound: $('.map-found'),
      guide: $('#guide'), prompt: $('.prompt'), promptText: $('.prompt-text'), label: $('.label3d'), toast: $('.toast'),
      loading: $('.loading'), loadingText: $('.loading-text'), bricks: [...document.querySelectorAll('.loading-bricks i')],
      mode: $('[data-act="mode"] .hud-text'), sound: $('[data-act="sound"]'), help: $('.explore-help'),
    };
    this.onAction = () => {};
    this._chapterKey = '';
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      if (a) {
        e.preventDefault();
        // keep keyboard focus off HUD buttons so Enter and WASD go to the world, not to a stale button
        if (a.classList.contains('hud-btn') && e.detail > 0) a.blur();
        this.onAction(a.dataset.act, a.dataset);
        return;
      }
      const play = e.target.closest('[data-play]');
      if (play) { e.preventDefault(); this.onAction('play', { game: play.dataset.play }); return; }
      const stop = e.target.closest('[data-exhibit]');
      if (stop) { e.preventDefault(); this.onAction('open', { id: stop.dataset.exhibit }); return; }
      const go = e.target.closest('[data-goto]');
      if (go) { e.preventDefault(); this.onAction('open', { id: go.dataset.goto }); return; }
      const visit = e.target.closest('[data-visit]');
      if (visit) { e.preventDefault(); this.onAction('visit', { id: visit.dataset.visit }); return; }
      const isl = e.target.closest('[data-island]');
      if (isl) { e.preventDefault(); this.onAction('travel', { id: isl.dataset.island }); }
    });
    this.el.curOpen.addEventListener('click', () => this.onAction('open', { id: this.el.curOpen.dataset.id }));
    this.el.prompt.addEventListener('click', () => this.onAction('interact', {}));
    this.el.panel.addEventListener('cancel', (e) => { e.preventDefault(); this.onAction('close', {}); });
    this.el.map.addEventListener('cancel', (e) => { e.preventDefault(); this.onAction('close', {}); });
    this.el.panel.addEventListener('click', (e) => { if (e.target === this.el.panel) this.onAction('close', {}); });
    this.el.map.addEventListener('click', (e) => { if (e.target === this.el.map) this.onAction('close', {}); });
    document.addEventListener('submit', (e) => {
      const f = e.target.closest('[data-contact]');
      if (f) { e.preventDefault(); this._send(f); }
    });
  }

  setMode(mode) {
    this.root.dataset.mode = mode;
    this.el.mode.textContent = mode === 'explore' ? 'Back to the tour' : 'Walk around';
    this.el.mode.parentElement.querySelector('.hud-key').textContent = mode === 'explore' ? 'J' : 'W';
  }

  /** Play/pause button state. */
  autoplay(on) {
    const b = document.querySelector('.tp-play');
    b.setAttribute('aria-pressed', String(on));
    b.querySelector('.tp-text').textContent = on ? 'Pause tour' : 'Play tour';
  }

  /** Highlight the chosen tour speed. */
  speed(n) {
    for (const b of document.querySelectorAll('.tp-speeds button')) b.setAttribute('aria-pressed', String(+b.dataset.speed === n));
  }

  /** Hide or restore the chapter card (the player dismissed it with Esc or its close button). */
  dismissChapter(on) { if (on) this.root.dataset.chapterOff = ''; else delete this.root.dataset.chapterOff; }

  get chapterShown() { return !this.el.chapter.hidden && !('chapterOff' in this.root.dataset); }

  /** Free-camera button state. */
  freeCam(on) {
    const b = document.querySelector('.hud-free');
    b.setAttribute('aria-pressed', String(on));
    b.querySelector('.hud-text').textContent = on ? 'Follow figure' : 'Free camera';
  }

  started(on) { if (on) this.root.dataset.started = ''; else delete this.root.dataset.started; }

  setPlace(islandId) {
    const is = islandById[islandId];
    if (!is || this._place === islandId) return;
    this._place = islandId;
    this.el.placeName.textContent = is.name;
    this.el.placeLabel.textContent = is.label;
  }

  /** Chapter card for the current journey beat. */
  chapter({ island, order, current, index, total, travelling }) {
    const is = islandById[island];
    const exs = order ? order.map((id) => byId[id]) : exhibitsOf(island);
    const key = island;
    const el = this.el;
    el.chapter.hidden = false;
    if (key !== this._chapterKey) {
      this._chapterKey = key;
      el.chStep.textContent = String(ISLANDS.findIndex((i) => i.id === island) + 1);
      el.chLabel.textContent = is.label;
      el.chName.textContent = is.name;
      el.chSummary.textContent = is.summary;
      el.chStops.innerHTML = exs.map((e) => `<li><button type="button" data-exhibit="${e.id}">${esc(e.object)}<span class="stop-title">${esc(e.title)}</span></button></li>`).join('');
    }
    for (const b of el.chStops.querySelectorAll('button')) b.setAttribute('aria-current', String(b.dataset.exhibit === current));
    if (current && !travelling) {
      const ex = byId[current];
      el.chCur.hidden = false;
      el.curLine.textContent = ex.line;
      el.curMetric.innerHTML = ex.metric ? `<b>${esc(ex.metric[0])}</b>${esc(ex.metric[1])}` : '';
      el.curMetric.hidden = !ex.metric;
      el.curOpen.textContent = ex.open || `Open the ${ex.object.toLowerCase()}`;
      el.curOpen.dataset.id = current;
    } else el.chCur.hidden = true;
    el.chCount.textContent = `Stop ${index + 1} of ${total}`;
  }

  finale(on) { const f = document.querySelector('.finale-card'); if (f) f.hidden = !on; }

  hideChapter() { this.el.chapter.hidden = true; this._chapterKey = ''; this.dismissChapter(false); }

  openPanel(id, { prev, next } = {}) {
    const ex = byId[id];
    const el = this.el;
    el.pObject.textContent = ex.object;
    el.pKicker.textContent = ex.kicker;
    el.pTitle.textContent = ex.title;
    el.pBody.innerHTML = exhibitBody(ex);
    el.pBody.scrollTop = 0;
    const set = (btn, x) => { btn.disabled = !x; btn.querySelector('span').textContent = x ? byId[x].object : ''; btn.dataset.id = x || ''; };
    set(el.pPrev, prev); set(el.pNext, next);
    if (!el.panel.open) { this._returnFocus = document.activeElement; el.panel.show(); }
    el.panel.querySelector('.close').focus({ preventScroll: true });
  }

  closePanel() {
    if (this.el.panel.open) this.el.panel.close();
    this._returnFocus?.focus?.({ preventScroll: true });
  }

  openMap(svg, { found = 0, total = 0, hiddenFound = false } = {}) {
    const el = this.el;
    el.mapArt.innerHTML = svg;
    el.mapList.innerHTML = ISLANDS.filter((i) => !i.hidden || hiddenFound).map((i) => `<li><button class="btn" type="button" data-island="${i.id}">${esc(i.name)}</button></li>`).join('');
    el.mapFound.hidden = !found;
    el.mapFound.textContent = `Beacons shut down: ${found} of ${total}`;
    if (!el.map.open) { this._returnFocus = document.activeElement; el.map.showModal(); }
  }

  closeMap() { if (this.el.map.open) this.el.map.close(); this._returnFocus?.focus?.({ preventScroll: true }); }

  openGuide(anchor) {
    const g = this.el.guide;
    g.classList.add('open');
    g.focus({ preventScroll: true });
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ block: 'start' });
    else g.scrollTop = 0;
  }

  closeGuide() { this.el.guide.classList.remove('open'); }

  prompt(text) {
    if (!text) { this.el.prompt.hidden = true; return; }
    this.el.prompt.hidden = false;
    this.el.promptText.textContent = text;
  }

  label(text, sub, x, y) {
    const l = this.el.label;
    if (!text) { l.hidden = true; return; }
    l.hidden = false;
    if (l.dataset.t !== text) { l.dataset.t = text; l.innerHTML = `${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}`; }
    l.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -130%)`;
  }

  toast(msg, ms = 3200) {
    const t = this.el.toast;
    t.textContent = msg; t.hidden = false;
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => { t.hidden = true; }, ms);
  }

  help(show) { this.el.help.hidden = !show; }

  sound(on) {
    this.el.sound.setAttribute('aria-pressed', String(on));
    this.el.sound.querySelector('.hud-text').textContent = on ? 'Sound on' : 'Sound off';
  }

  loading(i, total, text) {
    this.el.bricks.forEach((b, k) => b.classList.toggle('on', k < i));
    if (text) this.el.loadingText.textContent = text;
  }

  doneLoading() {
    this.root.dataset.ready = ''; // the canvas fades in over the CSS sky
    this.el.loading.classList.add('done');
    setTimeout(() => { this.el.loading.hidden = true; }, 700);
  }

  /** True while the camera is still in the title beat: the first chapter card rolls up from below the fold. */
  hero(on) { if (on) this.root.dataset.hero = ''; else delete this.root.dataset.hero; }

  async _send(form) {
    const status = form.querySelector('.form-status');
    status.textContent = 'Sending…';
    try {
      const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(String(r.status));
      form.reset();
      status.textContent = 'Sent. Thank you, I will reply by email.';
    } catch {
      status.innerHTML = `That did not send. Please email <a href="mailto:${SITE.email}">${SITE.email}</a> instead.`;
    }
  }
}

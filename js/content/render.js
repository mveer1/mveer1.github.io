// HTML rendering for exhibit content. Pure strings, no DOM, so it runs in the browser
// (panels) and in Node (the static field guide in index.html).
import { ISLANDS, EXHIBITS, SITE, exhibitsOf } from './content.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const BRICK_COLOURS = ['#c91a09', '#0055bf', '#f2cd37', '#237841', '#a95500', '#6074a1', '#a0bcac', '#958a73'];
const brickIcon = (i) => `<svg class="part-icon" viewBox="0 0 22 14" aria-hidden="true"><rect x="2" y="2" width="5" height="3" rx="1" fill="${BRICK_COLOURS[i % 8]}"/><rect x="9" y="2" width="5" height="3" rx="1" fill="${BRICK_COLOURS[i % 8]}"/><rect x="16" y="2" width="4" height="3" rx="1" fill="${BRICK_COLOURS[i % 8]}"/><rect x="0.5" y="4.5" width="21" height="9" rx="1.5" fill="${BRICK_COLOURS[i % 8]}"/></svg>`;

function link(l) {
  const ext = /^https?:/.test(l.href);
  const cls = l.kind === 'primary' ? 'btn btn-primary' : 'btn';
  const play = l.play ? ` data-play="${esc(l.play)}"` : '';
  return `<a class="${cls}" href="${esc(l.href)}"${play}${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(l.label)}</a>`;
}

export function contactForm(idSuffix = '') {
  return `<form class="contact-form" action="${SITE.formAction}" method="POST" data-contact>
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="hp">
  <label for="cf-name${idSuffix}">Name</label>
  <input id="cf-name${idSuffix}" name="name" type="text" autocomplete="name" required>
  <label for="cf-email${idSuffix}">Email</label>
  <input id="cf-email${idSuffix}" name="_replyto" type="email" autocomplete="email" required>
  <label for="cf-msg${idSuffix}">Message</label>
  <textarea id="cf-msg${idSuffix}" name="message" rows="4" required></textarea>
  <button class="btn btn-primary" type="submit">Send the message</button>
  <p class="form-status" role="status" aria-live="polite"></p>
</form>`;
}

/** Body of an exhibit (shared by the panel and the guide). h = heading level for sub-heads. */
export function exhibitBody(ex, { h = 3, form = true, idSuffix = '' } = {}) {
  const H = `h${h}`;
  let out = '';
  if (ex.metrics?.length) {
    const n = ex.metrics.length, cols = n === 4 || n === 2 ? 2 : Math.min(3, n);
    out += `<dl class="metrics" style="--cols:${cols}">${ex.metrics.map(([v, label, to]) => `<div class="metric"${to ? ` data-goto="${esc(to)}" role="link" tabindex="0"` : ''}>${to ? `<span class="goto">See how it was built &rarr;</span>` : ''}<dt>${esc(label)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  }
  for (const p of ex.paragraphs || []) out += `<p>${esc(p)}</p>`;
  if (ex.facts?.length) out += `<dl class="facts">${ex.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  if (ex.steps?.length) {
    out += `<${H} class="sub">How it was built</${H}><ol class="steps">${ex.steps.map((s, i) => `<li><span class="step-box">${i + 1}</span><span>${esc(s)}</span></li>`).join('')}</ol>`;
  }
  if (ex.timeline?.length) {
    out += `<ol class="timeline">${ex.timeline.map(([y, t, d]) => `<li><span class="tl-year">${esc(y)}</span><div><p class="tl-title">${esc(t)}</p><p>${esc(d)}</p></div></li>`).join('')}</ol>`;
  }
  if (ex.bins?.length) {
    out += `<div class="bins">${[...ex.bins, ex.extraBin].filter(Boolean).map(([name, items], bi) => `<section class="bin${bi >= ex.bins.length ? ' bin-extra' : ''}"><${H} class="sub">${esc(name)}</${H}><ul>${items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>`).join('')}</div>`;
  }
  if (ex.stack?.length) {
    out += `<section class="parts"><${H} class="sub">Parts used</${H}><ul>${ex.stack.map((s, i) => `<li>${brickIcon(i)}<span>${esc(s)}</span></li>`).join('')}</ul></section>`;
  }
  if (ex.contact && form) out += contactForm(idSuffix);
  if (ex.links?.length) out += `<p class="links">${ex.links.map(link).join('')}</p>`;
  return out;
}

/** The whole portfolio as one document. */
export function guideHTML() {
  const nav = `<nav class="guide-toc" aria-label="Field guide contents"><ol>${ISLANDS.map((is) => `<li><a href="#g-${is.id}">${esc(is.name)}</a> <span>${esc(is.label)}</span></li>`).join('')}</ol></nav>`;
  const parts = ISLANDS.map((is, i) => {
    const exs = exhibitsOf(is.id);
    return `<section class="guide-island" id="g-${is.id}" aria-labelledby="g-${is.id}-h">
  <header class="guide-island-head"><span class="step-box">${i + 1}</span><div><p class="chapter-label">${esc(is.label)}</p><h2 id="g-${is.id}-h">${esc(is.name)}</h2><p>${esc(is.summary)}</p></div></header>
  ${exs.map((ex) => `<article class="guide-exhibit" id="g-ex-${ex.id}" aria-labelledby="g-ex-${ex.id}-h">
    <p class="panel-object">${esc(ex.object)}</p>
    <p class="panel-kicker">${esc(ex.kicker)}</p>
    <h3 id="g-ex-${ex.id}-h">${esc(ex.title)}</h3>
    ${exhibitBody(ex, { h: 4, idSuffix: '-g' })}
    <p class="guide-visit"><a href="#visit-${ex.id}" data-visit="${ex.id}">See it in the world</a></p>
  </article>`).join('\n')}
</section>`;
  }).join('\n');
  return `${nav}\n${parts}\n<p class="guide-foot">The same content is in the <a href="${SITE.cv}">CV</a>, a one-page PDF.</p>`;
}

export { esc, EXHIBITS };

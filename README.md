# Mahavir Chaudhari — Portfolio

A personal portfolio site for Mahavir Chaudhari, Data Engineer, built as an explorable world of brick-built floating islands that holds the featured projects, skills, career timeline and a way to get in touch.

**Live site:** [mveer1.github.io](https://mveer1.github.io)

The world is the home page (`/`). The earlier one-page portfolio was removed from this branch (it is still in git history and on `main`); its two games, Flappy Byte and Life Cell, were ported into the world.

## The world

### Concept

Every system starts as a collection of disconnected pieces; the interesting part is what you build with them. The world makes that literal: a minifigure explorer walks a ring of floating islands built from procedural LEGO-style bricks, and each island holds one part of the work. Production data pipelines are machines that move and merge pieces, AI systems sit in a cold observatory, side projects clutter a warm workshop, and the timeline is a stair you climb one brick per year.

It looks like a stop-motion film shot at night with a macro lens: bright toy plastic against deep blue fog, warm lanterns, tilt-shift focus, and characters that move on twos.

### Structure

Seven locations, sized by how much real content each holds (rationale in `docs/world-design.md`):

| Island | Holds |
|---|---|
| The Harbour | About, headline results |
| The Works | Five production systems at Providence: GL reconciliation, Snowflake migrations, MDO scheduling, validation framework, Cost Insight |
| The Signal Lab | Context engineering, AIDLC, Smart Research Scout, Small Data |
| The Workshop | Task Board, fit, Physics Hyperion, Echo Journal, Motion Lab, the arcade cabinet (Flappy Byte and Life Cell, playable in a dialog) |
| The Archive | Career timeline, skills, education |
| The Lookout | Contact form, email, profiles, CV |
| The Dormant Rock (hidden) | The planned "next pipeline" |

Visitors can scroll the authored tour or press **Play tour** (P, bottom left, with 1x / 2x / 4x speed buttons; `[` and `]` change speed) for a slow automatic one, walk freely (W A S D or tap), switch to a **free camera** (C) that flies over the whole world without the figure (R and F raise and lower it), make the figure jump (Space; walking off an edge makes it fall, and it starts again on the island it fell from), open any exhibit (Enter), use the map, or read the **field guide**. Escape closes any dialog and the chapter card (the card sits on the right; a "Show chapter" tab brings it back): all content as plain semantic HTML, which is also what loads when WebGL is unavailable.

### Run it

There is no build step; GitHub Pages serves the repository as is.

```bash
npm install          # dev tools only (Vite, Playwright)
npm run dev          # Vite dev server, then open the printed URL
npm run serve        # or a plain static server, exactly how GitHub Pages serves it
# or any static server:
npx http-server . -p 8080
```

URL options: `?q=low|medium|high` locks a quality tier; `?islands=works,lab` builds only some islands (the Harbour is always built); `#visit-gl-recon` opens an exhibit on load.

### Architecture

Vanilla Three.js 0.170 as ES modules through an import map (no bundler, zero-build deploy). `three@0.170.0` is also a dev dependency, only so the Vite dev server can resolve the bare `three` import; the deployed page loads it from the CDN through the import map, so keep the two versions in step.

```
(repository root)
  index.html            page, HUD, chapter card, dialogs, static field guide
  css/world.css         booklet-style UI (tokens from docs/art-direction.md)
  css/arcade.css        the arcade: game-select tiles and the brick-themed games
  lab.html              parts lab: renders parts and the figure alone, for QA
  js/
    main.js             capability check, fallback, boot
    app.js              interaction states and the frame loop
    arcade/             games.js (Flappy Byte and Life Cell, ported from the earlier site, dressed in bricks)
    content/            content.js (all portfolio text, sourced), render.js (HTML)
    lego/               dims, palette, materials, parts (generator), builder, assembly
    world/              world.js (layout, building, walk map, framing, light pool),
                        terrain.js, props.js, connectors.js, walk.js, environment.js,
                        beacon.js (laser beacons), thruster.js (island engines),
                        wonders.js (far-off sights),
                        islands/*.js (one module per island)
    camera/             journey.js (beats -> camera and figure), director.js (sole camera writer)
    character/          minifig.js, animator.js (12 fps), controller.js (explore movement)
    core/               renderer (post chain), quality tiers, scroll, input, audio, stop-motion timing
    ui/                 ui.js (DOM), map.js (map drawn from stud cells)
  tools/render-guide.mjs  writes the field guide into index.html
qa/                     Playwright scripts: shoot, tour, interact, storyboard; sheet.py
docs/                   design and review documents
```

Rules that keep it maintainable:

- **One camera writer.** `Director` takes a source (rail, follow, shot) and blends between them. Scroll only sets a number; it never moves anything directly.
- **Content is data.** Panels, chapter cards, the map labels and the field guide all render from `js/content/content.js`.
- **Islands are modules.** Each one builds its bricks, registers walk cells, light anchors, exhibits, ports and journey beats into a context object, and owns its own animation.

### Add a portfolio project

1. Add an entry to `EXHIBITS` in `js/content/content.js` with `id`, `island`, `object` (what it is in the world), `title`, `kicker`, `line`, and any of `metrics`, `paragraphs`, `steps`, `stack`, `links`. Use only facts from a source you can name; record the source in `docs/portfolio-content-inventory.md`.
2. In the island's module (`js/world/islands/<island>.js`), build the object and push an exhibit:
   ```js
   ctx.exhibits.push({ id: 'my-project', marker: [x, y, z], stand: [x, z], face: [x, z], hit: [x, y, z, w, h, d], shot: { side: 35 } });
   ```
   `stand` is where the figure stands, `face` what it looks at, `hit` the clickable box (local studs). The camera is auto-framed; `shot.side`, `dist`, `el` nudge it.
3. Add a beat to `ctx.beats` where it belongs on the walk: `{ id: 'my-project', len: 1, exhibit: 'my-project', char: [[x, z]] }`.
4. Run `node tools/render-guide.mjs` to refresh the static field guide, then `node qa/tour.mjs --only <island> --panels` and look at the shots.

### Add an island

1. Create `js/world/islands/<id>.js` exporting `build(ctx)`. Use `buildTerrain` for the ground, the props in `props.js`, set `ctx.occ = b.occ; ctx.camOcc = b.camOcc;` after `b.build()`, and fill `ctx.exhibits`, `ctx.beats`, `ctx.ports`, `ctx.spawn`.
2. Register it in `LAYOUT` (origin) and `BUILD_ORDER` in `js/world/world.js`, add it to `ROUTE` if the tour visits it, and add a bridge to `BRIDGES`.
3. Add it to `ISLANDS` in `content.js` and give it a colour in `ui/map.js`.

### Asset workflow

There are no model files. Every brick is generated by `js/lego/parts.js` from a few numbers (stud pitch 1, plate 0.4, brick 1.2; chamfered edges; seams; studs only where nothing covers them) and merged by `BrickBuilder` into one mesh per material class per island. To add a part type, add a function to `DEF` in `parts.js`, look at it in `lab.html` (`node qa/shoot.mjs --url lab.html --out qa/shots/lab.png`), then use it with `b.put(type, args, x, y, z, colour)`. Why procedural instead of Blender is explained in `docs/technical-tooling-audit.md`.

### Performance

- The hero is plain HTML on a CSS sky, so it paints before any 3D code arrives: fonts are self-hosted (`assets/fonts/`, latin subset, preloaded), three.js is the minified build, and every module the world needs is `modulepreload`ed in parallel (`npm run preload` regenerates the local list in `index.html` after you add a module). The canvas fades in over the sky when the first frame is ready; the page is scrollable from first paint, and a hero button pressed early is replayed once the world is up.
- Hero scroll motion: the title lines roll up with the page via CSS scroll-driven animations (compositor thread; `--hero-p` from an inline script in browsers without them), and the first chapter card rolls up from below. The title beat's camera drifts toward the first stop (`HERO_DRIFT` in `js/camera/journey.js`) so scrolling the hero visibly moves the world.
- Zero model downloads; islands are generated in 10 to 81 ms each, one at a time after the Harbour is on screen.
- About 3 to 5 draw calls per island (merged plastic, transparent, glow and metal meshes) plus small animated parts.
- Three tiers (`core/quality.js`): pixel ratio, shadows, bloom, tilt-shift, MSAA, stud detail and light-pool size. The starting tier comes from device hints; a governor drops a tier when p75 frame time passes 26 ms.
- Shadows follow the active island and refresh only occasionally on very wide shots.
- Measured on Apple M2 in Chrome: p50 and p90 frame time 16.7 ms on every tier; about 0.9 to 1.0M triangles on the widest shot at high, 0.27M at low.

### Camera and walkability

- Authored shot distances are multiplied by `PULLBACK` (2.0) in `js/world/world.js`, so the tour and the exhibit panels show a whole building and the paths around it. Overview shots (60 studs and more) are left alone. The free-walk camera starts 40 studs back and zooms from 12 to 76 (wheel, `+` / `-`); when a building is in the way it rises first and only steps in as a last resort, never closer than 60% of the zoom. The free camera (C) zooms out to 170.
- Bridges land on solid deck: `WalkMap.landing()` moves a bridge end onto the nearest standable cell, so the figure can always step on and off.
- `node qa/reach.mjs` checks the walk map the way the controller walks it (blocked cells, gaps, one-brick steps), then rides every cable car, lift and zip line. Anything unreachable fails the run.

### Accessibility

Field guide (static HTML, works without JavaScript or WebGL) and a skip link to it; every action on the keyboard (`docs/game-design.md`, Controls); dialogs with focus handling; reduced motion replaces camera moves with cuts and stops stepped loops; UI text meets WCAG AA (ink 14:1, muted 6.2:1, accent 5.4:1 on paper).

### QA

```bash
node qa/interact.mjs                 # 53 behaviour checks: tour, walking, jump, falling off edges, camera, free camera, autoplay and speed, Escape, arcade
node qa/reach.mjs                    # flood-fill: every island, exhibit, beacon and ride is reachable
node qa/tour.mjs --panels            # screenshot every beat and panel into qa/shots/tour
node qa/shoot.mjs --url / --mobile --w 390 --h 844 --out qa/shots/m.png
node qa/storyboard.mjs               # regenerate docs/camera-storyboard.md
```

### Known limitations

- Not tested on real phones; mobile was checked in emulation only.
- A few exhibit frames still have a lamppost at the edge.
- The tour is long (about 45 screens); the map, stop arrows and chapter list shortcut it.
- The 3D scene is not navigable by screen readers; the field guide is the equivalent.
- See `docs/visual-review.md` for scores and the full list.

### Documents

`docs/portfolio-content-inventory.md` · `docs/technical-tooling-audit.md` · `docs/world-design.md` · `docs/art-direction.md` · `docs/game-design.md` · `docs/camera-storyboard.md` · `docs/visual-review.md`

LEGO is a trademark of the LEGO Group, which does not sponsor or endorse this site.

# Portfolio Site Architecture

The site is a zero-build static page: one HTML file, one stylesheet, ES-module scripts and Three.js 0.170 loaded from a CDN through an import map. GitHub Pages serves the repository as it is. It is an explorable 3D world of procedural, LEGO-style brick islands that holds the whole portfolio.

## Layout

```
index.html        page, HUD, chapter card, dialogs, generated field guide
css/world.css     UI styling (tokens from docs/art-direction.md)
lab.html          parts lab: renders parts and the figure alone, for QA
js/               main.js (boot), app.js (states and frame loop), content/, lego/, world/,
                  camera/, character/, core/, ui/
tools/            render-guide.mjs writes the field guide into index.html
qa/               Playwright scripts: interact, reach, tour, shoot, storyboard
docs/             design and review documents
mahavir.pdf       the CV, linked from the world
```

`README.md` holds the full description: concept, islands, how to add a project or an island, performance, accessibility, QA and limitations.

## Key rules

- **One camera writer.** `js/camera/director.js` is the only code that moves the camera; scroll, free-walk and panels are sources it blends between.
- **Content is data.** `js/content/content.js` feeds the panels, chapter cards, map and the static field guide (`node tools/render-guide.mjs`).
- **Islands are modules.** Each island in `js/world/islands/` builds its bricks and registers walk cells, exhibits, ports, light anchors and journey beats.
- **Everything is walkable.** `js/world/walk.js` is the walk map; bridges are snapped onto deck cells in `world.js`, and `qa/reach.mjs` proves every island, exhibit and laser beacon can be reached.

## Deployment

Static. Push to the Pages branch; there is no build step. `npm run dev` (Vite) is only a convenience server, and `npm run qa` runs the browser checks. The contact form posts to Formspree.

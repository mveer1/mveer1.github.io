# Visual review

Review date: 2026-11-05. Every image was captured from the running build, not from code inspection.

## Method

| Tool | What it checks |
|---|---|
| `lab.html` + `qa/shoot.mjs` | Each part and the minifigure alone under studio light (stands in for Blender renders; Blender is not installed). |
| `qa/tour.mjs [--panels]` | Screenshot of every journey beat at rest (41), and every content panel (22 on the tour, plus the hidden one). Prints frame-time p50/p90 and renderer stats. |
| `qa/interact.mjs` | 20 behavioural checks: scroll drives the tour, W enters explore, scroll locks, walking, wall collision, J returns to the nearest stop, panels open and restore state, panel order, map travel, field guide, cable-car ride, collectible pickup, no page errors. **Result: 20/20 pass.** |
| `qa/shoot.mjs --mobile / --reduced / --nowebgl / ?q=low` | Phone layout at 390x844, reduced motion, the no-WebGL fallback, each quality tier. |
| `qa/sheet.py` | Contact sheets for side-by-side comparison between passes. |

Environment: headless Google Chrome via Playwright, ANGLE on Metal, Apple M2. Screenshots use the real GPU, so lighting, shadows and bloom are what a visitor sees on this class of machine.

## Critique log

Each pass: render, name the most significant defects, fix them, render again.

| Pass | Scene | Defects found (most significant first) | Fix | Verified |
|---|---|---|---|---|
| 1 | Parts lab | 1. AgX tone mapping desaturated plastic (green read as sage). 2. Parts built by swapping axes (leaf, arch, gear) rendered back faces. 3. Test layout overlapped two parts. | Khronos Neutral tone mapping. `swapAxes` now also reverses winding. Lab layout moved. | Re-render: true LEGO colours, leaves green. |
| 2 | Harbour, first slice | 1. Title text sat on top of the island. 2. Camera shots too close for the figure's scale; a flat white sail blocked the arrival shot. 3. Lanterns blown out to white. | Wider title framing; all close shots pulled back; sail replaced by a mast and pennant; glow power lowered. | Re-render. |
| 3 | Harbour exhibits | 1. About shot placed the camera inside the gate. 2. Results shot put the figure's head between the lens and the board. 3. Panel sat under the HUD; one empty metric cell. | **Auto-framing** against the brick occupancy grid; the gate's assembly registered in the grid; panel top margin; metric grid columns by count. | Re-render. |
| 4 | Lamps | Lamps were flat cut-outs: luminance (~0.88) under the bloom threshold, and an unlit material. | Glow parts became lit plastic with per-vertex emission; bloom threshold 0.72. | Lamps now glow amber with a highlight. |
| 5 | Works | Camera hid behind the swinging crane arm (not in the grid). | Crane's swept disc added to occupancy. | Re-render. |
| 6 | Full tour (41 shots) | 1. Lampposts and tree foliage in the foreground of most exhibit shots. 2. Bridge shots missed the bridge. 3. Tilt-shift too strong on wide shots. | Lens-frustum clearance test; camera-only occupancy for foliage and lamp glow (kept separate so it never hides studs); bridges filmed side-on from outside the ring; tilt-shift capped. | Re-tour. |
| 7 | Exhibit shots | Figure filled half the frame and covered exhibits (34° lens at 15 studs is only 8.6 studs tall). Markers too bright. | Exhibit shots at 20+ studs on a 31° lens, subject weighted toward the exhibit, figure kept off the lens-exhibit line; smaller, dimmer markers; orrery sun dimmed. | Re-tour: exhibits read first. |
| 8 | Finale, title, mobile, panels | 1. Finale card never appeared (flag dropped in the journey build). 2. Archive terrace beat looked into a wall. 3. Mobile HUD labels wrapped; hint line overlapped the trademark line. 4. Title card showed through panels opened from the first screen. 5. Accent text 3.83:1 on paper. | Flag passed through; terrace beat removed; mobile HUD trimmed and hint hidden on touch; "started" state now tracks scroll in every mode; accent darkened to `#a3421a` (5.37:1). | Re-shoot of each. |

## Scores

Scored against the brief's rubric after pass 8. A 10 would mean nothing left to fix.

| Category | Score | Evidence and what holds it back |
|---|---|---|
| Visual identity | 8 | Night sky, cloud sea, warm practicals and tilt-shift read as miniature photography; the title frame is the strongest image. Some mid-tour frames are busy. |
| LEGO authenticity | 8 | Real proportions, chamfered edges, seams, studs only where uncovered, tiles for paths, running-bond walls, stepped gable roofs. Smooth spheres remain on the orrery planets and the lantern glass. |
| World coherence | 7 | One ring of islands, each visible from the others, joined by bridges, a cable car and a zip line; the map is drawn from the real cells. Elevation differences are modest, so the vertical drama is limited. |
| Atmosphere | 8 | Deep blue fog, a moon behind the ring, distant ruined rocks, the lighthouse beam crossing the fog, dust. Fog density was not tuned per island. |
| Stop-motion quality | 6 | Figure and its position on 12 fps, machines on 8, small life on 6, the camera smooth. Walk cycles are basic; assembly has a four-frame arc but no squash or settle. |
| Camera choreography | 6 | Orbit-space interpolation with holds; auto-framing stops shots going through walls. Remaining: lamps still clip frame edges in some shots, and some exhibit angles are merely adequate (Lookout CV, Archive establish). |
| Character quality | 6 | Reads instantly as a minifigure with a printed face, blinking, glances, discovery jump, a reach when a panel opens, and a lantern that lights the ground. Geometry is simple (box legs, capsule arms); no secondary motion on the hat or pack. |
| Interactivity | 7 | Opening an exhibit makes its machine act (clock sweeps 2 h to 10 min, gauge drops, drawers slide, context layers light); three rides; seven collectibles with a reward. Exhibits do not yet react to the figure walking up in explore mode. |
| Portfolio content | 9 | All 23 exhibits carry real, sourced content (inventory documents each source and every discrepancy); metrics link to their machines; the field guide holds everything as text. |
| Technical quality | 7 | Clear module boundaries (lego, world, islands, camera, character, ui, content), data-driven islands, one camera writer. `app.js` (about 600 lines) owns too much; no unit tests below the browser tests. |
| Performance | 7 | Measured on M2: p50 16.7 ms, p90 16.7 ms on all tiers; islands build in 10 to 81 ms each; zero model downloads. Wide shots draw about 1M triangles. **Not measured on a real phone.** |
| Accessibility | 7 | Semantic field guide (also static HTML, works without JavaScript), keyboard for every action, dialogs with focus handling, reduced-motion cuts, AA contrast on all UI text, skip link, no-WebGL fallback. The 3D scene itself is not screen-reader navigable; the guide is its equivalent. |
| Responsive design | 6 | Phone layout at 390 px: compact HUD, bottom-sheet chapter and panels, low tier chosen automatically. The panel sheet covers most of the scene on phones, and touch controls are tap-to-walk only (no joystick). |

## Unresolved issues

1. Lampposts still clip the edge of a few exhibit frames (Works boiler and gate, Workshop task board). The frustum test samples a grid and can miss thin posts at the frame's edge.
2. The chapter card covers about a fifth of the desktop frame at exhibit stops.
3. No real-device testing: all phone checks are emulated in desktop Chrome.
4. The tour is long (44.8 screens). The stop arrows, map and chapter list shorten it, but a visitor who only scrolls will scroll a lot.
5. The contact form posts to the classic site's Formspree endpoint. Delivery was not tested, to avoid sending a real message.
6. Audio was only checked for errors, not listened to.

# Technical tooling audit

Audit date: 2026-11-05.

## Existing environment

| Item | State |
|---|---|
| Site stack | Vanilla HTML, CSS and JavaScript. No framework, no bundling. GitHub Pages serves the repository root of `main` directly. There is no `.github/workflows`. |
| Three.js on the classic site | r128 UMD from cdnjs, used only for the hero "neural mesh". |
| Node / npm | Node 24.22.1, npm 11.19.1 |
| Dev dependencies before this work | `vite@^5`, `http-server@^14` (declared, `node_modules` not installed) |
| Browsers | Google Chrome (system). Headless Chrome reports `ANGLE Metal Renderer: Apple M2`, so screenshots use the real GPU. |
| Blender | **Not installed** (`which blender` empty, nothing in `/Applications`). |
| Homebrew | Present at `/opt/homebrew/bin/brew`. |
| Playwright | Not installed before this work. |
| Browser MCP | None configured for this session. |

## Agent skills already installed (`~/.claude/skills`)

All three repositories named in the brief were already installed before this work started, so nothing was reinstalled.

| Repository | Installed as | Licence | Last push | Verdict |
|---|---|---|---|---|
| `cesartevisual/threejs-skills` | `threejs-*` (22 focused skills: scene, geometry, materials, lighting, animation, html, accessibility, performance, testing, postprocessing, r3f...) | MIT | 2026-09-10 | Used. Short routing skills; the routing table decided which docs to read. |
| `czlonkowski/blender-web-3d-skill` | `blender-web-3d` | MIT | 2026-09-23 | Partly used. Its adaptive-quality governor (asymmetric hysteresis) is adapted in `js/core/quality.js`, with attribution. Its Blender half cannot run here. |
| `fletcherholt/3dmodel-skill` | `3dmodel` | none declared | 2026-06-16 | Used for its method only: render, look, critique, fix one defect, repeat. No code copied (no licence). |

Design skills (`design-taste-frontend`, `impeccable`, `emil-design-eng`, `apple-design`, `animate`, `choreograph`, `review-animations`, `animation-performance`, `mobile-native`) were already present and are used as written. None was duplicated or overridden.

### How the taste skill was applied

The taste skill targets company websites. This is a full-screen WebGL world, so its section-per-screen layout rules and photograph rules do not map onto it. Applied as written: plain copy in content panels, a noun in every heading, buttons as verb plus object, no invented figures, no violet, no captions under visuals, one button style and one panel style, visible hover and press states, reduced-motion rest state. The type pairing was dealt by `start.mjs deal --page gaming`: **Bricolage Grotesque / Figtree / DM Mono**. The dealt palettes (light pastels) contradict the brief's night-world direction and were not used; colour comes from `docs/art-direction.md`.

## Gaps and how each was closed

| Capability | Gap | Decision |
|---|---|---|
| Browser QA | No Playwright | Installed `playwright@1.56.1` as a **project dev dependency**. It drives the system Chrome (`channel: 'chrome'`), so no browser binaries were downloaded. |
| Procedural LEGO modelling | No Blender | **Built a runtime procedural part generator in JavaScript** (`js/lego/`). See below. |
| Asset inspection renders | No Blender renders | `lab.html` renders each part alone; `qa/shoot.mjs` captures it. |
| Scroll choreography | none in the stack | Custom scroll-to-progress mapping owned by one camera director. GSAP not added. See below. |
| Rendering library | r128 is old and UMD-only | Three.js **0.170.0** as ES modules from jsDelivr through an import map, for the world page only. The classic page keeps r128. |

### Why no Blender

1. LEGO parts are parametric primitives: a brick is a box with studs on a fixed 8 mm grid. A generator in JavaScript describes every part in a few numbers, so a whole island costs **0 bytes of model download** and is rebuilt from data.
2. The world is data-driven (`js/world/islands/*.js`). Adding a building is a code change that is reviewable in a diff, the same property the Blender skill gets from versioned scripts, without a 400 MB global install.
3. Instancing and static batching need geometry the engine owns. Imported GLBs would be re-batched at runtime anyway.
4. The brief asks to prefer project-local installs. Blender cannot be project-local.

What Blender would still add: hand-sculpted organic shapes and baked lightmaps. Neither is needed for LEGO plastic. If baked AO is wanted later, `brew install --cask blender` plus the skill's `baked-lighting.md` is the path.

### Why no React Three Fiber

R3F needs JSX and a bundler. The site is zero-build on GitHub Pages; adding a build would change how the live site deploys, which is a material change the brief says to avoid without approval. Vanilla Three.js modules load natively in the browser.

### Why no GSAP ScrollTrigger

The brief's rule is that one system owns each transform. The camera is damped toward a point on an authored spline, and the character is placed on its own path from the same progress value. ScrollTrigger would add a second owner (its scrub tween) between scroll and the camera, and pinning would fight free-exploration mode, where scroll must be frozen. The replacement is about 40 lines (`js/core/scroll.js`): native page scroll, so keyboard, touch and screen-reader scrolling keep working, mapped to a 0 to 1 journey value that only the director reads.

### Why no Draco, KTX2 or meshopt

There are no model files and no textures larger than a few small canvas-generated decals (minifigure face, torso print, signage). Compression tooling would have nothing to compress. The relevant budget is triangles and draw calls; see `README.md`, Performance.

## Dependencies added

| Package | Kind | Purpose |
|---|---|---|
| `playwright@1.56.1` | devDependency | Screenshots and interaction tests in `qa/` |
| `three@0.170.0` | runtime, CDN import map | World rendering (not in `package.json`; loaded from `cdn.jsdelivr.net`, the same model the classic page uses for r128) |
| Google Fonts: Bricolage Grotesque, Figtree, DM Mono | runtime, CSS | UI type |

`npm install` was run to materialise the existing Vite and http-server dev dependencies; `fsevents` install scripts were left unapproved (not needed).

## Rejected tools

| Tool | Reason |
|---|---|
| React Three Fiber, Drei | Requires a build step; see above. |
| GSAP / ScrollTrigger | Second transform owner; see above. |
| Rapier / cannon physics | Character movement is constrained to island tops and bridges; a walk-surface query is enough. A physics engine would add 400 KB+ of WASM for nothing the visitor sees. |
| Blender (global install) | See above. |
| AI text-to-3D (Tripo, Meshy, etc.) | Paid external services, and generated meshes do not read as LEGO. |
| Howler or other audio libraries | Ambient sound is synthesised with Web Audio in about 150 lines. |

## References used

- Three.js manual and docs (r170): `BufferGeometry`, `InstancedMesh`, `EffectComposer`, `PMREMGenerator` with `RoomEnvironment`, `DirectionalLight` shadow cameras, `CatmullRomCurve3`.
- Three.js examples: `HorizontalTiltShiftShader` / `VerticalTiltShiftShader` (tilt-shift miniature blur), `OutputPass` (tone mapping and colour space at the end of the chain).
- MDN: `prefers-reduced-motion`, Pointer Events, Web Audio API, `<dialog>`, `inert`.
- Playwright: `chromium.launch({ channel: 'chrome' })`, `page.screenshot`, `page.mouse.wheel`.
- LEGO system dimensions (public measurements): stud pitch 8.0 mm, plate height 3.2 mm, brick height 9.6 mm, stud diameter 4.8 mm, stud height 1.7 mm.

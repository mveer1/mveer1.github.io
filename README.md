# Mahavir Chaudhari — Web Portfolio
# mveer1.github.io

A futuristic, animated portfolio with cyberpunk aesthetics. Built with vanilla HTML/CSS/JS and powered by Vite for fast local development. Features a glitching hero, matrix/neural animated backdrops, interactive timeline, and an animated, scrollable skills list with infinite loop and percentage fill.

## Features

- Futuristic UI with custom cursor, holographic cube, and dynamic visuals
- Loading screen with terminal boot sequence
- Floating navigation with active section tracking
- About section at full width (desktop), with Skills + Timeline in a 2-column layout beneath
- Animated Skills list:
  - Infinite scrolling loop
  - Keyboard navigation (Arrow Up/Down, Tab, Enter)
  - Gradient scroll hints
  - Horizontal fill background per skill percentage (50% opacity)
  - Mobile-first responsive layout (About → Timeline → Skills)
- Interactive timeline with ripple/hover effects
- Project cards with 3D flip and glow
- Contact form with animated feedback (simulated submission)

## Tech Stack

- HTML, CSS, JavaScript (no framework)
- Vite (Dev server and build)
- Optional motion-inspired animations reimplemented in vanilla JS

## Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install
```bash
npm install
```

### Development
```bash
npm run dev
```
- Local: http://localhost:5173
- Hot reload enabled

### Build
```bash
npm run build
```
Output in `dist/`.

### Preview (serve production build locally)
```bash
npm run preview
```

## Project Structure

```
.
├─ index.html            # Main page
├─ style.css             # Global styles + components + responsive rules
├─ app.js                # All interactions, animations, skills logic
├─ favicon.ico
├─ package.json          # Vite scripts
└─ README.md
```

## Key Implementation Notes

- About section spans 100% width on desktop; Skills + Timeline share 50-50 below it.
- Mobile order: About → Timeline → Skills.
- Animated Skills List:
  - Rendered dynamically in `app.js` via `initAnimatedSkillsList()`.
  - Infinite loop implemented by rendering multiple copies and snapping scroll position.
  - Fill overlay uses `.skill-fill-bg` to fill the entire item (opacity 0.5), animated on visibility.
  - Keyboard navigation is active only when the skills section is in view.

## Deployment (GitHub Pages)

For user/organization site repos like `mveer1.github.io`, push the built site to the default branch and enable Pages:

1. Build locally:
   ```bash
   npm run build
   ```
2. Commit and push:
   - If serving static files directly, ensure `index.html` and assets are at repo root and Pages is set to serve from `/<branch>`.
   - If serving the Vite build, you can:
     - Serve `dist` via GitHub Actions workflow (Pages → Build and deployment → GitHub Actions), or
     - Use a `docs/` folder (set `build.outDir = "docs"` in Vite config) and set Pages source to `docs/`.

Note: Since this is a root user site repo, the site is served from `/`. No `base` path is needed in Vite.

## Customization

- Skills list: Edit the `skills` array in `app.js` (`initAnimatedSkillsList()`).
- Timeline items: Update the HTML under `#about .timeline`.
- Colors/FX: Tweak CSS variables in `style.css` (cyber theme vars under `:root`).

## License

MIT
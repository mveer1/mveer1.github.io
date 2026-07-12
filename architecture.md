# Portfolio Site Architecture

This document describes the technical architecture, technology stack, and component structure of the personal portfolio website.

## Technology Stack

The portfolio is built as a highly performant, lightweight static site with no heavy frontend frameworks (like React or Angular).

- **Core Structure:** Vanilla HTML5 (`index.html`)
- **Styling:** Vanilla CSS (`style.css`), utilizing CSS variables for theming, CSS Grid/Flexbox for layouts, and hardware-accelerated CSS animations.
- **Interactivity:** Vanilla JavaScript (`app.js`), organized via a modular initialization pattern.
- **Build System:** Vite (configured via `package.json` for rapid local development and optimized production bundling).
- **Data Management:** Static data extraction pattern (timeline and projects data separated into their own JS files, like `timeline-data.js`).

## System Components

### 1. File Structure
- `index.html`: The main single-page application structure. Contains semantic tags mapping to specific portfolio sections (`#hero`, `#about`, `#projects`, `#skills`, `#timeline`, `#contact`).
- `style.css`: All styling definitions. Organizes global variables (themes, fonts), typography, UI components (buttons, modals, terminal windows), and specific section styling.
- `app.js`: The central script managing the site's interactivity.
- `timeline-data.js`: A dedicated data store containing the JSON-like representation of career milestones, decoupled from the core application logic.
- `package.json` / `package-lock.json`: Node dependencies (Vite) and npm scripts (`dev`, `build`, `preview`).
- `assets/`: Contains site images and external files (e.g., `favicon.ico`, `mahavir.pdf`).

### 2. Theming and UI Features
- **Light/Dark Mode Toggle:** Controlled in `app.js` and `style.css`. It detects OS preferences via `window.matchMedia`, falls back to localStorage saves, and updates the `data-theme` attribute on the root HTML tag.
- **Glassmorphism & Cyberpunk Elements:** Features like `.terminal-window` representations, glitch text effects, and custom cursors (`.cursor-trail`) provide a unique developer-focused aesthetic.
- **Modals:** Used for project details and navigation (`#navModal`, `.project-modal-overlay`). Handled by event listeners toggling active classes and managing body overflow.

### 3. Canvas Animations
The site implements performance-conscious custom canvas backgrounds rather than importing heavy Three.js scenes where not required:
- **Matrix Background:** A custom implementation in `app.js` (`initMatrixBackground`) drawing descending character streams on a `<canvas>` element using a throttled `requestAnimationFrame` loop.
- **Neural Network Background:** An interactive node-and-link visualization (`initNeuralNetwork`) mapping connections based on node proximity.

### 4. Interactive Components
- **Scroll Reveal & Parallax:** Implements the `IntersectionObserver` API to detect when elements enter the viewport (`.reveal` classes) and handles subtle Y-axis transforms for parallax effects.
- **Dynamic Timeline:** Reads data from `timeline-data.js` to render complex timeline cards dynamically on load, complete with a scroll-driven progress line (`timelineProgressFill`).
- **Form Integration:** The Contact section leverages Formspree (`https://formspree.io/f/xnjnezwz`) for serverless form submissions, eliminating the need for a custom backend.

## Performance and Deployment
- The site prioritizes performance by limiting external library dependencies and relying on native APIs (`IntersectionObserver`, `window.matchMedia`, `localStorage`).
- **Asset Optimization:** Heavy dependencies (Three.js) are deferred, and modal images are native lazy-loaded (`loading="lazy"`) with explicit dimensions to prevent Cumulative Layout Shift (CLS).
- **SEO & Accessibility:** Structured with semantic HTML, comprehensive `og:image`/`twitter:card` meta tags for social previews, ARIA roles on canvas elements, and a `<noscript>` fallback for JS-disabled environments.
- Deployment is handled statically. The Vite build command outputs optimized, minified HTML/CSS/JS ready to be hosted on any static provider (e.g., GitHub Pages). Note that the CI pipeline is Vite-based; legacy Jekyll workflows have been removed.

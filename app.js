// Global variables
let mouseX = 0;
let mouseY = 0;
let isLoading = true;
let currentSection = 'hero';
let currentTheme = 'dark';

// Respect the OS-level "reduce motion" accessibility setting.
function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Run an initializer in isolation so one failure can't abort the rest of the page.
function safeInit(name, fn) {
    try {
        fn();
    } catch (error) {
        console.error(`init failed: ${name}`, error);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Flag reduced motion before anything renders so CSS can react immediately
    if (prefersReducedMotion()) {
        document.body.classList.add('reduced-motion');
    }

    // Apply theme first (before any rendering)
    safeInit('themeToggle', initThemeToggle);
    // Initialize all components
    safeInit('loadingScreen', initLoadingScreen);
    safeInit('customCursor', initCustomCursor);
    safeInit('matrixBackground', initMatrixBackground);
    safeInit('neuralNetwork', initNeuralNetwork);
    safeInit('typingAnimation', initTypingAnimation);
    safeInit('navigation', initNavigation);
    safeInit('scrollAnimations', initScrollAnimations);
    safeInit('scrollReveal', initScrollReveal);
    safeInit('timeline', initTimeline);
    safeInit('projects', initProjects);
    safeInit('contactForm', initContactForm);
    safeInit('floatingParticles', initFloatingParticles);
    safeInit('profileModal', initProfileModal);
    safeInit('parallax', initParallax);
    safeInit('threeHeroScene', initThreeHeroScene);
    safeInit('gameModals', initGameModals);
    safeInit('flappyByte', initFlappyByte);
    safeInit('gameOfLife', initGameOfLife);

    // Handle mobile detection
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile');
    }
}

// Loading Screen
// Nothing is genuinely loading here except three.js from a CDN, so the screen is
// dismissed as soon as the document is ready rather than on a hardcoded timer.
// Holding the hero behind an artificial delay is pure injected latency.
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;

    // Mark body as loading to hold hero entrance animations
    document.body.classList.add('loading');

    const dismiss = () => {
        if (!isLoading) return;
        isLoading = false;

        loadingScreen.classList.add('fade-out');
        document.body.classList.remove('loading');

        // Remove from the layer tree once the fade has finished. The fade is
        // cosmetic — the hero is already live and interactive by this point.
        const remove = () => { loadingScreen.style.display = 'none'; };
        if (prefersReducedMotion()) {
            remove();
        } else {
            loadingScreen.addEventListener('transitionend', remove, { once: true });
            // Safety net in case the transition never fires (e.g. display changes).
            setTimeout(remove, 600);
        }
    };

    // Dismiss on the next frame so the hero paints in its pre-animation state
    // first, then hand control straight to the user.
    requestAnimationFrame(() => requestAnimationFrame(dismiss));
}

// Theme Toggle (Dark / Light)
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    const root = document.documentElement;

    // Determine initial theme: saved pref > OS pref > dark default
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        currentTheme = 'light';
    } else {
        currentTheme = 'dark';
    }

    // Apply theme immediately
    applyTheme(currentTheme);

    // Toggle on click
    if (toggle) {
        toggle.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';

            // Add transition class for smooth color change
            root.classList.add('theme-transitioning');
            applyTheme(currentTheme);
            localStorage.setItem('theme', currentTheme);

            // Remove transition class after animation completes
            setTimeout(() => {
                root.classList.remove('theme-transitioning');
            }, 600);
        });
    }

    // Listen for OS preference changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't explicitly set a preference
            if (!localStorage.getItem('theme')) {
                currentTheme = e.matches ? 'light' : 'dark';
                applyTheme(currentTheme);
            }
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
}

// Scroll Reveal Animation
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
}

// Parallax effect on hero backgrounds
function initParallax() {
    if (window.innerWidth <= 768) return; // skip on mobile for performance

    const matrixCanvas = document.getElementById('matrix-canvas');
    const neuralCanvas = document.getElementById('neural-canvas');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const parallaxSpeed = 0.3;

        if (matrixCanvas) {
            matrixCanvas.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
        }
        if (neuralCanvas) {
            neuralCanvas.style.transform = `translateY(${scrollY * parallaxSpeed * 0.5}px)`;
        }
    }, { passive: true });
}

// Custom Cursor
function initCustomCursor() {
    if (window.innerWidth <= 768) return; // Skip on mobile

    const cursorTrail = document.querySelector('.cursor-trail');
    if (!cursorTrail) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    // Scale is lerped in the same loop as position so that a single writer owns
    // `transform`. Writing it from hover handlers as well used to make the two
    // fight for the property.
    let targetScale = 1;
    let currentScale = 1;

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    }, { passive: true });

    function updateCursor() {
        currentX += (targetX - currentX) * 0.35;
        currentY += (targetY - currentY) * 0.35;
        currentScale += (targetScale - currentScale) * 0.2;

        // translate3d + scale on one composited property, no layout per frame.
        cursorTrail.style.transform =
            `translate3d(${currentX - 10}px, ${currentY - 10}px, 0) scale(${currentScale.toFixed(3)})`;

        requestAnimationFrame(updateCursor);
    }

    updateCursor();

    // Cursor interactions — colour via a class, scale via the loop above.
    const interactiveElements = document.querySelectorAll('button, a, .timeline-item, .project-card-v2');

    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            targetScale = 1.5;
            cursorTrail.classList.add('is-over-interactive');
        });

        element.addEventListener('mouseleave', () => {
            targetScale = 1;
            cursorTrail.classList.remove('is-over-interactive');
        });
    });
}

// Matrix Background
function initMatrixBackground() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = canvas.width / 20;
    const drops = [];

    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }

    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/[]{}()!@#$%^&*';

    function drawMatrix() {
        const style = getComputedStyle(document.documentElement);
        const fadeBg = style.getPropertyValue('--matrix-fade').trim() || 'rgba(10, 10, 10, 0.04)';
        const textColor = style.getPropertyValue('--primary-cyber').trim() || '#bada55';
        ctx.fillStyle = fadeBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = textColor;
        ctx.font = '15px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = characters[Math.floor(Math.random() * characters.length)];
            ctx.fillText(text, i * 20, drops[i] * 20);

            if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(drawMatrix, 35);

    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Neural Network Background
function initNeuralNetwork() {
    const canvas = document.getElementById('neural-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = [];
    const nodeCount = 50;
    const connectionDistance = 150;

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            connections: []
        });
    }

    function updateNodes() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update node positions
        nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;

            // Bounce off edges
            if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

            // Keep within bounds
            node.x = Math.max(0, Math.min(canvas.width, node.x));
            node.y = Math.max(0, Math.min(canvas.height, node.y));
        });

        // Draw connections
        const style = getComputedStyle(document.documentElement);
        const accentColor = style.getPropertyValue('--primary-cyber').trim() || '#bada55';
        // Parse hex to rgb for dynamic opacity
        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        };
        const rgb = hexToRgb(accentColor);
        ctx.strokeStyle = `rgba(${rgb}, 0.2)`;
        ctx.lineWidth = 1;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    const opacity = 1 - (distance / connectionDistance);
                    ctx.strokeStyle = `rgba(${rgb}, ${opacity * 0.3})`;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        ctx.fillStyle = accentColor;
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = accentColor;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        requestAnimationFrame(updateNodes);
    }

    updateNodes();

    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Typing Animation
function initTypingAnimation() {
    const typingElement = document.querySelector('.typing-animation');
    const texts = [
        'Building data pipelines...',
        'Scaling cloud architectures...',
        'Processing big data streams...',
        'Training neural networks...',
        'Optimizing data workflows...',
        'Creating universes with code...',
        'Solving problems mere mortals fear...',
        'Turning coffee into miracles...',
        'Debugging reality itself...',
        'Writing code that shapes worlds...',
        'Hello, world!',
    ];

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeText() {
        if (isLoading) {
            setTimeout(typeText, 100);
            return;
        }

        const currentText = texts[textIndex];

        if (isDeleting) {
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = 100;

        if (isDeleting) {
            typeSpeed /= 2;
        }

        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typeSpeed = 500;
        }

        setTimeout(typeText, typeSpeed);
    }

    // Short beat so the hero entrance settles first, then start typing. This was
    // 2000ms, which was tuned around the old artificial 1.5s loading delay.
    setTimeout(typeText, 400);
}

// Navigation — Burger Menu + Modal
function initNavigation() {
    const burger = document.getElementById('burgerMenu');
    const modal = document.getElementById('navModal');
    const modalLinks = document.querySelectorAll('.nav-modal-link');

    if (!burger || !modal) return;

    // Toggle burger menu + modal
    burger.addEventListener('click', () => {
        const isOpen = burger.classList.contains('active');
        if (isOpen) {
            closeBurgerMenu(burger, modal);
        } else {
            openBurgerMenu(burger, modal);
        }
    });

    // Navigate on link click
    modalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Resume PDF opens in new tab (already handled by target=_blank)
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                closeBurgerMenu(burger, modal);
                // Small delay so modal close animation plays first
                setTimeout(() => scrollToSection(targetId), 300);
            } else {
                // External link (like resume) — just close the modal
                closeBurgerMenu(burger, modal);
            }
        });
    });

    // Close on overlay click (outside modal)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBurgerMenu(burger, modal);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && burger.classList.contains('active')) {
            closeBurgerMenu(burger, modal);
        }
    });
}

function openBurgerMenu(burger, modal) {
    burger.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBurgerMenu(burger, modal) {
    burger.classList.remove('active');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Scroll Animations — generic .animate-in tagging for observed sections
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation (timeline items reveal via their own observer in initTimeline)
    const elementsToAnimate = document.querySelectorAll('.terminal-window');
    elementsToAnimate.forEach(el => observer.observe(el));
}

// ============================================
// TIMELINE — Interactive Scroll-Reactive
// ============================================
let currentTimelineMode = 'impact';
let timelineObserver = null;
let timelineScrollHandler = null;

function initTimeline() {
    const data = window.TIMELINE_DATA;
    if (!data || !data.length) return;

    // Render timeline with default mode (impact)
    renderTimeline(data, currentTimelineMode);

    // Init scroll-driven progress line
    initTimelineProgressLine();
}

/**
 * Render all timeline items from data for a given mode
 */
function renderTimeline(data, mode) {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    // Preserve progress track
    const progressTrack = container.querySelector('.timeline-progress-track');

    // Remove old items
    container.querySelectorAll('.timeline-item').forEach(el => el.remove());

    // Build items
    data.forEach((entry, index) => {
        const item = createTimelineItem(entry, mode, index);
        container.appendChild(item);
    });

    // Re-attach progress track at start
    if (progressTrack) {
        container.insertBefore(progressTrack, container.firstChild);
    }

    // Setup observers and interactions
    initTimelineObserver();
    initTimelineExpand();

    // Stagger reveal animation
    const items = container.querySelectorAll('.timeline-item');
    items.forEach((item, i) => {
        setTimeout(() => {
            item.classList.add('visible');
        }, 80 * i);
    });
}

/**
 * Create a single timeline item DOM element — alternating left/right Stitch layout
 */
function createTimelineItem(entry, mode, index) {
    const isEven = index % 2 === 0;
    const item = document.createElement('div');
    item.className = `timeline-item timeline-item--${isEven ? 'left' : 'right'}`;
    item.dataset.year = entry.year;
    item.dataset.index = index;

    // Choose an icon based on index rotation
    const icons = ['psychology', 'analytics', 'cloud_done', 'data_object', 'neurology', 'hub', 'sensors'];
    const icon = icons[index % icons.length];
    const accentClass = isEven ? 'accent-primary' : 'accent-secondary';

    // Year label (shown on the opposite side of the card on desktop)
    const yearSide = document.createElement('div');
    yearSide.className = 'timeline-year-side';
    yearSide.innerHTML = `
        <span class="timeline-year-label">${entry.year}</span>
        <p class="timeline-year-subtitle">${entry.subtitle}</p>
    `;

    // Center node (dot on the central line)
    const node = document.createElement('div');
    node.className = `timeline-node ${accentClass}`;

    // Card (glass panel)
    const card = document.createElement('div');
    card.className = `timeline-card-v2 ${accentClass}`;

    const descriptionText = entry.description[mode] || entry.description.impact;

    // Build expanded section HTML
    let expandedHTML = '';
    if (entry.expanded) {
        const highlightsHTML = (entry.expanded.highlights || []).map(h =>
            `<div class="tc-highlight-item">
                <span class="material-symbols-outlined tc-highlight-icon">check_circle</span>
                <span>${h}</span>
            </div>`
        ).join('');

        expandedHTML = `
            <button class="tc-expand-btn" type="button" aria-expanded="false">
                <span class="prompt">user@neural-net:~$</span>
                <span class="command">inspect project</span>
                <span class="material-symbols-outlined expand-arrow">expand_more</span>
            </button>
            <div class="tc-expanded-section">
                <p class="tc-expanded-details">${entry.expanded.details}</p>
                <div class="tc-expanded-highlights">
                    ${highlightsHTML}
                </div>
            </div>
        `;
    }

    // Domain badge HTML
    const domainHTML = entry.domain
        ? `<span class="tc-domain ${accentClass}">${entry.domain}</span>`
        : '';

    card.innerHTML = `
        <div class="tc-header">
            <span class="material-symbols-outlined tc-icon ${accentClass}">${icon}</span>
            <span class="tc-mobile-year">${entry.year}<span class="tc-mobile-subtitle">${entry.subtitle}</span></span>
        </div>
        ${domainHTML}
        <h3 class="tc-title">${entry.title}</h3>
        <p class="tc-description">${descriptionText}</p>
        <div class="tc-tags">
            ${entry.techStack.map(t => `<span class="tc-tag ${accentClass}">${t}</span>`).join('')}
        </div>
        <div class="tc-impact-row">
            <span class="tc-impact-metric ${accentClass}">${entry.impact.metric}</span>
            <span class="tc-impact-label">${entry.impact.label}</span>
        </div>
        ${expandedHTML}
    `;

    // Assemble: order depends on side
    if (isEven) {
        item.appendChild(yearSide);
        item.appendChild(node);
        item.appendChild(card);
    } else {
        item.appendChild(card);
        item.appendChild(node);
        item.appendChild(yearSide);
    }

    return item;
}

/**
 * IntersectionObserver: activate one item at a time on scroll
 */
function initTimelineObserver() {
    // Disconnect any previous observer
    if (timelineObserver) {
        timelineObserver.disconnect();
    }

    const items = document.querySelectorAll('#timeline .timeline-item');
    if (!items.length) return;

    timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active from all
                items.forEach(i => i.classList.remove('active'));
                // Set this one as active
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.4,
        rootMargin: '0px 0px -20% 0px'
    });

    items.forEach(item => timelineObserver.observe(item));
}

/**
 * Scroll-driven progress line
 */
function initTimelineProgressLine() {
    // Remove any old handler
    if (timelineScrollHandler) {
        window.removeEventListener('scroll', timelineScrollHandler);
    }

    const fill = document.getElementById('timelineProgressFill');
    const timeline = document.getElementById('timeline-container');
    if (!fill || !timeline) return;

    let ticking = false;

    timelineScrollHandler = function () {
        if (!ticking) {
            requestAnimationFrame(() => {
                const rect = timeline.getBoundingClientRect();
                const windowH = window.innerHeight;

                // Calculate progress: 0 when timeline top enters viewport, 1 when timeline bottom reaches center
                const timelineTop = rect.top;
                const timelineHeight = rect.height;

                // Start progress when the top of the timeline enters the viewport
                const start = windowH;
                const end = -timelineHeight + windowH * 0.5;

                let progress = (start - timelineTop) / (start - end);
                progress = Math.max(0, Math.min(1, progress));

                fill.style.height = (progress * 100) + '%';
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', timelineScrollHandler, { passive: true });
    // Initial call
    timelineScrollHandler();
}

/**
 * Expand/collapse accordion — one card at a time.
 *
 * This previously queried `.timeline-expand-btn`, a class that is never rendered
 * (the markup uses `.tc-expand-btn`), so it bound zero listeners and the
 * "collapse the others" behaviour never ran. The accordion only worked at all
 * because of an inline onclick attribute in the template string, which toggled a
 * single card in isolation.
 */
function initTimelineExpand() {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    const buttons = container.querySelectorAll('.tc-expand-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();

            const section = btn.nextElementSibling;
            if (!section) return;

            const wasOpen = section.classList.contains('open');

            // Collapse every panel first so only one is ever open.
            buttons.forEach(other => {
                other.classList.remove('active');
                other.setAttribute('aria-expanded', 'false');
                const otherSection = other.nextElementSibling;
                if (otherSection) otherSection.classList.remove('open');
            });

            // Re-open the clicked one unless it was the one already open.
            if (!wasOpen) {
                btn.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
                section.classList.add('open');
            }
        });
    });
}

// initModeSwitcher removed — mode switcher UI was removed

// Projects
function initProjects() {
    // Project detail modals
    initProjectModals();
}

// ---- Project Detail Modals ----
function initProjectModals() {
    const triggers = document.querySelectorAll('[data-project-modal]');
    const modals = document.querySelectorAll('.project-modal-overlay[data-project-id]');
    if (!triggers.length || !modals.length) return;

    let lastFocusedTrigger = null;

    function openProjectModal(id, trigger) {
        const modal = document.querySelector(`.project-modal-overlay[data-project-id="${id}"]`);
        if (!modal) return;
        // Close any already open project modal
        closeAllProjectModals();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        lastFocusedTrigger = trigger || null;

        // Focus first focusable element inside modal for accessibility
        const focusable = modal.querySelector('button, a[href], [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            setTimeout(() => focusable.focus(), 60);
        }
    }

    function closeProjectModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        // Only restore body scroll if no other modal is active
        if (!document.querySelector('.project-modal-overlay.active, .summary-modal-overlay.active')) {
            document.body.style.overflow = '';
        }
        if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
            lastFocusedTrigger.focus();
        }
    }

    function closeAllProjectModals() {
        document.querySelectorAll('.project-modal-overlay.active').forEach(m => {
            m.classList.remove('active');
        });
    }

    // Wire triggers
    triggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.getAttribute('data-project-modal');
            openProjectModal(id, btn);
        });
    });

    // Wire close controls
    modals.forEach(modal => {
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProjectModal(modal);
            }
        });

        // Close buttons inside modal (control.close and [data-project-close])
        modal.querySelectorAll('[data-project-close]').forEach(closer => {
            closer.addEventListener('click', (e) => {
                e.preventDefault();
                closeProjectModal(modal);
            });
        });
    });

    // Escape key closes topmost active project modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // A game modal opens on top of everything, so let it consume Escape first
            if (document.querySelector('.game-modal-overlay.active')) return;
            const active = document.querySelector('.project-modal-overlay.active');
            if (active) {
                e.preventDefault();
                closeProjectModal(active);
            }
        }
    });
}

// Contact Form
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const inputs = form.querySelectorAll('.neural-input');

    // Add focus effects
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
    // The previous per-keystroke boxShadow write (set, then reverted 100ms later
    // by a timer) produced a flicker on every character typed rather than useful
    // feedback. The focus glow in CSS already communicates the active field.

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmission(form);
    });
}

async function handleFormSubmission(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.querySelector('.btn-text').textContent;

    // Show loading state
    submitBtn.querySelector('.btn-text').textContent = 'TRANSMITTING...';
    submitBtn.disabled = true;

    try {
        // Submit form to Formspree
        const formData = new FormData(form);
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            // Success
            submitBtn.querySelector('.btn-text').textContent = 'TRANSMISSION_COMPLETE';
            submitBtn.style.background = '#00ccff';

            // Show success message
            showNotification('Message transmitted successfully!', 'success');

            // Reset form after delay
            setTimeout(() => {
                form.reset();
                submitBtn.querySelector('.btn-text').textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
            }, 3000);
        } else {
            // Handle Formspree errors
            const data = await response.json();
            throw new Error(data.error || 'Failed to send message');
        }
    } catch (error) {
        // Error handling
        submitBtn.querySelector('.btn-text').textContent = 'TRANSMISSION_FAILED';
        submitBtn.style.background = '#ff0040';

        // Show error message
        showNotification('Transmission failed. Please try again or contact directly.', 'error');

        // Reset button after delay
        setTimeout(() => {
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }, 3000);

        console.error('Form submission error:', error);
    }
}

// Floating Particles
function initFloatingParticles() {
    const particles = document.querySelectorAll('.floating-particle');

    particles.forEach((particle, index) => {
        // Random initial position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        // Random animation duration
        particle.style.animationDuration = (8 + Math.random() * 4) + 's';
        particle.style.animationDelay = index * 2 + 's';
    });
}

// Profile Summary Modal handling
function initProfileModal() {
    const modalBtn = document.getElementById('profileSummaryBtn');
    const modal = document.getElementById('profileSummaryModal');
    const closeBtn = document.getElementById('closeSummaryModal');
    const container = document.getElementById('floatingSummaryContainer');
    const dismissBtn = document.getElementById('closeFloatingSummaryBtn');

    if (!modalBtn || !modal || !closeBtn) return;

    // Open modal
    modalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        if (typeof createRipple === 'function') {
            createRipple(modalBtn);
        }
    });

    // Dismiss floating button
    if (dismissBtn && container) {
        dismissBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.add('hidden');
            container.dataset.userDismissed = 'true';
        });
    }

    // Auto-hide the floating button over the contact section and footer, where it
    // otherwise sits on top of the email/LinkedIn links and the footer text.
    if (container && 'IntersectionObserver' in window) {
        const blockers = ['#contact', '.site-footer']
            .map(sel => document.querySelector(sel))
            .filter(Boolean);

        if (blockers.length) {
            const covering = new Set();
            const coverageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        covering.add(entry.target);
                    } else {
                        covering.delete(entry.target);
                    }
                });

                // A manual dismiss stays sticky — don't re-show what the user closed
                if (container.dataset.userDismissed === 'true') return;
                container.classList.toggle('hidden', covering.size > 0);
            }, { threshold: 0 });

            blockers.forEach(el => coverageObserver.observe(el));
        }
    }

    // Close modal via control button
    closeBtn.addEventListener('click', () => {
        closeProfileModal();
    });

    // Close modal via any [data-close-summary] button (e.g. Acknowledge)
    modal.querySelectorAll('[data-close-summary]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeProfileModal();
        });
    });

    // Close modal via overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeProfileModal();
        }
    });

    // Close modal via Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            // Don't steal Escape from a game modal stacked on top
            if (document.querySelector('.game-modal-overlay.active')) return;
            closeProfileModal();
        }
    });

    function closeProfileModal() {
        modal.classList.remove('active');
        // Only restore scroll if no other modal is active
        if (!document.querySelector('.project-modal-overlay.active')) {
            document.body.style.overflow = '';
        }
    }
}

// Utility Functions
function createRipple(element) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = rect.width / 2 - size / 2;
    const y = rect.height / 2 - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.setAttribute('role', type === 'error' ? 'alert' : 'status');
    notification.textContent = message;

    document.body.appendChild(notification);

    // Two frames, not a timer: the first guarantees the off-screen start state is
    // committed, the second flips to the settled state so the transition actually
    // runs. A setTimeout here raced layout and sometimes skipped the slide.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => notification.classList.add('is-visible'));
    });

    // Exit along the same edge it entered from, then remove once the transition
    // has finished rather than on a duration guess.
    setTimeout(() => {
        notification.classList.remove('is-visible');

        const remove = () => notification.remove();
        notification.addEventListener('transitionend', remove, { once: true });
        // Safety net if the transition is suppressed (reduced motion, hidden tab).
        setTimeout(remove, 600);
    }, 3000);
}

// The hero entrance is owned entirely by CSS (`.hero-anim` + the `heroEntrance`
// keyframes, gated on `body.loading`). The previous JS implementation wrote
// inline `transition: all` and inline transforms, which both duplicated the CSS
// and overrode the reduced-motion rules — inline styles beat a stylesheet
// selector, so reduced-motion users still got the 30px slide.

// Performance optimization
function optimizeAnimations() {
    // Reduce animations when the user has asked for it, or on lower-end devices
    if (prefersReducedMotion() || navigator.hardwareConcurrency < 4) {
        document.body.classList.add('reduced-motion');
    }

    // React to the OS setting changing while the page is open
    if (window.matchMedia) {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onMotionChange = (event) => {
            document.body.classList.toggle('reduced-motion', event.matches);
        };
        if (motionQuery.addEventListener) {
            motionQuery.addEventListener('change', onMotionChange);
        }
    }

    // Pause animations when page is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.body.classList.add('paused-animations');
        } else {
            document.body.classList.remove('paused-animations');
        }
    });
}

// Window resize handler
window.addEventListener('resize', () => {
    // Update mobile detection
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile');
    } else {
        document.body.classList.remove('mobile');
    }
});

// Add CSS for dynamic classes
const dynamicStyles = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .focused .input-glow {
        width: 100% !important;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(186, 218, 85, 0.3);
        transform: scale(0);
        animation: rippleEffect 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    .paused-animations * {
        animation-play-state: paused !important;
    }
    
    @media (max-width: 768px) {
        .timeline-item {
            touch-action: manipulation;
        }
        
        .floating-particle {
            display: none;
        }
        
        .neural-network,
        .matrix-bg {
            opacity: 0.1 !important;
        }
    }
`;

// Inject dynamic styles
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// Initialize performance optimizations after page load
window.addEventListener('load', () => {
    optimizeAnimations();
});

// Export functions for global access
window.scrollToSection = scrollToSection;

// ==========================================
// Three.js Hero Canvas Implementation
// ==========================================
function initThreeHeroScene() {
    const container = document.getElementById('three-hero-container');
    if (!container) return;

    // three.js is loaded from a CDN — skip the scene entirely if it didn't arrive
    // (e.g. CDN blocked or the SRI check failed) rather than throwing.
    if (typeof THREE === 'undefined') {
        console.warn('three.js unavailable — hero scene skipped');
        return;
    }

    const scene = new THREE.Scene();

    // Measure the *content* box. clientWidth/clientHeight include padding, so if
    // the container is ever padded again the canvas would overhang its flex slot
    // and get cropped by overflow:hidden — which is exactly the bug this replaces.
    function measure() {
        const cs = getComputedStyle(container);
        const w = container.clientWidth
            - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
        const h = container.clientHeight
            - parseFloat(cs.paddingTop || 0) - parseFloat(cs.paddingBottom || 0);
        // Never hand the renderer a zero (hidden container, mid-transition layout)
        return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
    }

    let size = measure();

    const camera = new THREE.PerspectiveCamera(75, size.w / size.h, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    // Cap DPR at 2: beyond that the pixel cost outweighs any visible gain
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size.w, size.h, false);
    container.appendChild(renderer.domElement);

    // Radius chosen so the *fully displaced* mesh still clears the frustum.
    // Frustum half-height at the mesh plane = tan(fov/2) * camZ = tan(37.5°) * 5 ≈ 3.84.
    // Peak radius = RADIUS * (1 + MAX_DISPLACE) = 2.35 * 1.5 ≈ 3.53, leaving ~8% margin.
    const RADIUS = 2.35;
    const MAX_DISPLACE = 0.5;
    const BASE_AMP = 0.22;   // idle organic wobble
    const RIPPLE_AMP = 0.16; // bulge toward the pointer
    const PULSE_AMP = 0.20;  // click burst, decays

    const geometry = new THREE.SphereGeometry(RADIUS, 48, 48);
    // Snapshot the base geometry once; JSON round-tripping a typed array is both
    // slow and lossy, so copy it directly.
    const originalPositions = Float32Array.from(geometry.attributes.position.array);

    // Precompute unit directions so the ripple doesn't normalise 7k vertices/frame
    const dirs = new Float32Array(originalPositions.length);
    for (let i = 0; i < originalPositions.length; i += 3) {
        const x = originalPositions[i];
        const y = originalPositions[i + 1];
        const z = originalPositions[i + 2];
        const len = Math.hypot(x, y, z) || 1;
        dirs[i] = x / len;
        dirs[i + 1] = y / len;
        dirs[i + 2] = z / len;
    }

    // Material for the core 'neural' structure (wireframe-like but organic)
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ccff, // Secondary cyber color
        wireframe: true,
        transparent: true,
        opacity: 0.2
    });
    const blob = new THREE.Mesh(geometry, material);
    scene.add(blob);

    // A second, slightly larger shell counter-rotating for depth
    const shellGeometry = new THREE.IcosahedronGeometry(RADIUS * 1.28, 1);
    const shellMaterial = new THREE.MeshBasicMaterial({
        color: 0xbada55,
        wireframe: true,
        transparent: true,
        opacity: 0.07
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    scene.add(shell);

    camera.position.z = 5;

    let time = 0;
    let frameId = null;
    let lastTs = 0;

    // ---- Interaction state ----
    const hint = document.getElementById('heroVisualHint');
    let hovering = false;
    let dragging = false;
    let pointerId = null;
    let lastPointer = { x: 0, y: 0 };
    // NDC-ish pointer position over the container, -1..1
    const pointer = { x: 0, y: 0 };
    let spinVelocity = { x: 0, y: 0 };  // rad/s, from dragging
    let hoverStrength = 0;              // 0..1, eases with hover
    let pulse = 0;                      // 0..1, decays after a click
    let interacted = false;

    const AUTO_SPIN = 0.07;   // rad/s idle rotation
    const MORPH_SPEED = 0.32; // how fast the organic wobble evolves
    const DRAG_SENS = 0.008;  // rad per px
    const SPIN_DECAY = 0.94;  // per frame-ish, applied time-corrected

    function markInteracted() {
        if (interacted) return;
        interacted = true;
        if (hint) hint.classList.add('is-hidden');
    }

    function updatePointerFromEvent(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    }

    function morph() {
        const pos = geometry.attributes.position.array;

        // Direction the ripple bulges toward, derived from the pointer
        const px = pointer.x;
        const py = pointer.y;
        const pz = 0.75;
        const plen = Math.hypot(px, py, pz) || 1;
        const pnx = px / plen;
        const pny = py / plen;
        const pnz = pz / plen;

        const ripple = RIPPLE_AMP * hoverStrength;
        const burst = PULSE_AMP * pulse;

        for (let i = 0; i < pos.length; i += 3) {
            const x = originalPositions[i];
            const y = originalPositions[i + 1];
            const z = originalPositions[i + 2];

            // Organic displacement logic
            let noise = Math.sin(x * 1.5 + time) * Math.cos(y * 1.5 + time) * Math.sin(z * 1.5 + time) * BASE_AMP;

            if (ripple > 0.001) {
                // Vertices facing the pointer reach toward it; ^3 keeps it local
                const dot = dirs[i] * pnx + dirs[i + 1] * pny + dirs[i + 2] * pnz;
                if (dot > 0) noise += dot * dot * dot * ripple;
            }

            if (burst > 0.001) {
                // Spherical shockwave travelling outward from the centre
                noise += Math.sin(pulse * Math.PI) * Math.cos(dirs[i + 1] * 6 - pulse * 8) * burst;
            }

            // Clamp so a stacked ripple + pulse can never push the mesh out of frame
            if (noise > MAX_DISPLACE) noise = MAX_DISPLACE;
            else if (noise < -MAX_DISPLACE) noise = -MAX_DISPLACE;

            const f = 1 + noise;
            pos[i] = x * f;
            pos[i + 1] = y * f;
            pos[i + 2] = z * f;
        }

        geometry.attributes.position.needsUpdate = true;
    }

    function renderFrame() {
        renderer.render(scene, camera);
    }

    function animate(ts) {
        frameId = requestAnimationFrame(animate);

        if (!lastTs) lastTs = ts;
        const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
        lastTs = ts;

        time += dt * MORPH_SPEED;

        // Ease hover response and decay the click pulse
        const targetHover = hovering ? 1 : 0;
        hoverStrength += (targetHover - hoverStrength) * Math.min(1, dt * 6);
        if (pulse > 0) pulse = Math.max(0, pulse - dt * 1.6);

        // Drag momentum bleeds off, then idle auto-spin takes over
        const decay = Math.pow(SPIN_DECAY, dt * 60);
        spinVelocity.x *= decay;
        spinVelocity.y *= decay;

        blob.rotation.y += (AUTO_SPIN + spinVelocity.y) * dt;
        blob.rotation.x += spinVelocity.x * dt;
        // Clamp tilt so the mesh never ends up edge-on and unreadable
        blob.rotation.x = Math.max(-0.7, Math.min(0.7, blob.rotation.x));

        shell.rotation.y -= (AUTO_SPIN * 0.6) * dt;
        shell.rotation.z += (AUTO_SPIN * 0.25) * dt;
        const shellScale = 1 + pulse * 0.06;
        shell.scale.setScalar(shellScale);

        // Warm the wireframe toward the lime accent while the pointer is on it
        const mix = Math.min(1, hoverStrength + pulse * 0.5);
        material.color.setRGB(
            (0x00 / 255) + ((0xba - 0x00) / 255) * mix,
            (0xcc / 255) + ((0xda - 0xcc) / 255) * mix,
            (0xff / 255) + ((0x55 - 0xff) / 255) * mix
        );
        material.opacity = 0.2 + mix * 0.22;
        shellMaterial.opacity = 0.07 + mix * 0.1;

        morph();
        renderFrame();
    }

    function start() {
        if (frameId === null) {
            lastTs = 0;
            frameId = requestAnimationFrame(animate);
        }
    }

    function stop() {
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }
    }

    // ---- Pointer / keyboard interaction ----
    const reduced = prefersReducedMotion();

    container.addEventListener('pointerenter', () => { hovering = true; });

    container.addEventListener('pointerleave', () => {
        hovering = false;
        pointer.x = 0;
        pointer.y = 0;
    });

    container.addEventListener('pointermove', (e) => {
        updatePointerFromEvent(e);
        if (!dragging) return;
        const dx = e.clientX - lastPointer.x;
        const dy = e.clientY - lastPointer.y;
        lastPointer.x = e.clientX;
        lastPointer.y = e.clientY;

        if (reduced) {
            // No animation loop is running, so momentum would never be applied.
            // Rotate directly and redraw a single frame instead — dragging still
            // works for someone who asked for reduced motion.
            blob.rotation.y += dx * DRAG_SENS;
            blob.rotation.x = Math.max(-0.7, Math.min(0.7, blob.rotation.x + dy * DRAG_SENS));
            shell.rotation.y -= dx * DRAG_SENS * 0.6;
            renderFrame();
            return;
        }

        // Horizontal drag spins around Y, vertical drag tilts around X
        spinVelocity.y = dx * DRAG_SENS * 60;
        spinVelocity.x = dy * DRAG_SENS * 60;
    });

    container.addEventListener('pointerdown', (e) => {
        markInteracted();
        updatePointerFromEvent(e);
        dragging = true;
        pointerId = e.pointerId;
        lastPointer.x = e.clientX;
        lastPointer.y = e.clientY;
        hovering = true;
        container.classList.add('is-dragging');
        if (container.setPointerCapture && e.pointerId !== undefined) {
            try { container.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        if (reduced) renderFrame();
    });

    function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        container.classList.remove('is-dragging');
        if (container.releasePointerCapture && pointerId !== null) {
            try { container.releasePointerCapture(pointerId); } catch (err) { /* ignore */ }
        }
        pointerId = null;

        // A tap (negligible drag) reads as a click → fire the pulse
        if (e && Math.abs(spinVelocity.x) < 6 && Math.abs(spinVelocity.y) < 6) {
            pulse = 1;
            if (reduced) {
                pulse = 0;
                renderFrame();
            }
        }
    }

    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);

    container.addEventListener('keydown', (e) => {
        const step = 2.2;
        let handled = true;
        switch (e.key) {
            case 'ArrowLeft': spinVelocity.y = -step; break;
            case 'ArrowRight': spinVelocity.y = step; break;
            case 'ArrowUp': spinVelocity.x = -step; break;
            case 'ArrowDown': spinVelocity.x = step; break;
            case 'Enter':
            case ' ':
                pulse = 1;
                break;
            default: handled = false;
        }
        if (!handled) return;

        e.preventDefault();
        markInteracted();

        if (reduced) {
            // Apply the nudge as a discrete rotation, since no loop is running
            pulse = 0;
            spinVelocity.x = 0;
            spinVelocity.y = 0;
            const nudge = 0.18;
            if (e.key === 'ArrowLeft') blob.rotation.y -= nudge;
            else if (e.key === 'ArrowRight') blob.rotation.y += nudge;
            else if (e.key === 'ArrowUp') blob.rotation.x = Math.max(-0.7, blob.rotation.x - nudge);
            else if (e.key === 'ArrowDown') blob.rotation.x = Math.min(0.7, blob.rotation.x + nudge);
            renderFrame();
        }
    });

    if (reduced) {
        // Render a single static frame instead of a continuous animation
        morph();
        renderFrame();
        if (hint) hint.textContent = 'drag to rotate';
    } else {
        start();

        // Don't burn CPU/GPU recomputing ~7k vertices per frame on a hidden tab
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });
    }

    function resize() {
        size = measure();
        camera.aspect = size.w / size.h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(size.w, size.h, false);
        renderFrame();
    }

    // ResizeObserver catches container changes that no window resize fires for
    // (breakpoint reflow, font load, the hero entrance animation settling).
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(resize);
        ro.observe(container);
    } else {
        window.addEventListener('resize', resize);
    }
}

// ==========================================
// Arcade: modal shell shared by both games
// ==========================================

// Each game registers { onOpen, onClose } so it can start/stop its own loop.
const GAME_REGISTRY = {};

function initGameModals() {
    const triggers = document.querySelectorAll('[data-game-open]');
    const overlays = document.querySelectorAll('.game-modal-overlay[data-game-id]');
    if (!triggers.length || !overlays.length) return;

    let lastTrigger = null;

    function closeGame(overlay) {
        if (!overlay) return;
        const id = overlay.getAttribute('data-game-id');
        overlay.classList.remove('active');

        // Stop the game loop so a closed modal costs nothing
        const game = GAME_REGISTRY[id];
        if (game && typeof game.onClose === 'function') game.onClose();

        if (!document.querySelector('.game-modal-overlay.active, .project-modal-overlay.active, .summary-modal-overlay.active')) {
            document.body.style.overflow = '';
        }
        if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    }

    function openGame(id, trigger) {
        const overlay = document.querySelector(`.game-modal-overlay[data-game-id="${id}"]`);
        if (!overlay) return;

        document.querySelectorAll('.game-modal-overlay.active').forEach(closeGame);
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        lastTrigger = trigger || null;

        const game = GAME_REGISTRY[id];
        if (game && typeof game.onOpen === 'function') game.onOpen();

        const focusable = overlay.querySelector('button, select, input, a[href]');
        if (focusable) setTimeout(() => focusable.focus(), 60);
    }

    triggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openGame(btn.getAttribute('data-game-open'), btn);
        });
    });

    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeGame(overlay);
        });

        overlay.querySelectorAll('[data-game-close]').forEach(closer => {
            closer.addEventListener('click', (e) => {
                e.preventDefault();
                closeGame(overlay);
            });
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const active = document.querySelector('.game-modal-overlay.active');
        if (active) {
            e.preventDefault();
            closeGame(active);
        }
    });

    // Pause whichever game is open if the tab goes to the background
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) return;
        const active = document.querySelector('.game-modal-overlay.active');
        if (!active) return;
        const game = GAME_REGISTRY[active.getAttribute('data-game-id')];
        if (game && typeof game.onHide === 'function') game.onHide();
    });
}

// ==========================================
// Arcade: Flappy Byte
// ==========================================
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

    const W = canvas.width;
    const H = canvas.height;
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
        const gapTop = margin + Math.random() * (H - GAP - margin * 2);
        return { x, gapTop, scored: false };
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
        if (birdY + BIRD_R >= H || birdY - BIRD_R <= 0) {
            birdY = Math.min(Math.max(birdY, BIRD_R), H - BIRD_R);
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

    function themeColors() {
        const css = getComputedStyle(document.documentElement);
        return {
            primary: (css.getPropertyValue('--primary-cyber') || '#bada55').trim(),
            secondary: (css.getPropertyValue('--secondary-cyber') || '#00ccff').trim()
        };
    }

    function draw() {
        const { primary, secondary } = themeColors();

        ctx.clearRect(0, 0, W, H);

        // Backdrop grid — reads as a terminal, matches the site
        ctx.fillStyle = 'rgba(6, 10, 18, 0.9)';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(186, 218, 85, 0.07)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, H);
            ctx.stroke();
        }
        for (let y = 0; y <= H; y += 24) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(W, y + 0.5);
            ctx.stroke();
        }

        // Firewall pipes
        for (const p of pipes) {
            ctx.fillStyle = 'rgba(0, 204, 255, 0.14)';
            ctx.strokeStyle = secondary;
            ctx.lineWidth = 2;

            ctx.fillRect(p.x, 0, PIPE_W, p.gapTop);
            ctx.strokeRect(p.x + 1, -1, PIPE_W - 2, p.gapTop);

            const lowerY = p.gapTop + GAP;
            ctx.fillRect(p.x, lowerY, PIPE_W, H - lowerY);
            ctx.strokeRect(p.x + 1, lowerY + 1, PIPE_W - 2, H - lowerY);
        }

        // The packet
        const bx = W / 2;
        ctx.save();
        ctx.translate(bx, birdY);
        ctx.rotate(Math.max(-0.5, Math.min(0.9, birdV / 420)));
        ctx.fillStyle = primary;
        ctx.shadowColor = primary;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-BIRD_R, -BIRD_R);
        ctx.lineTo(BIRD_R + 3, 0);
        ctx.lineTo(-BIRD_R, BIRD_R);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Score watermark
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(186, 218, 85, 0.18)';
        ctx.font = 'bold 56px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pad(score), W / 2, 62);

        // Death flash
        if (flashT > 0) {
            ctx.fillStyle = `rgba(255, 0, 64, ${Math.min(0.5, flashT * 2)})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    function loop(ts, isFirst) {
        if (isFirst) lastTs = ts;
        // Clamp dt so a background tab or a long frame can't teleport the bird
        const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
        lastTs = ts;

        if (flashT > 0) flashT = Math.max(0, flashT - dt);

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
        const overlay = document.querySelector('.game-modal-overlay[data-game-id="flappy"]');
        if (!overlay || !overlay.classList.contains('active')) return;
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
            showNotification('Highscore cleared', 'info');
        });
    }

    function idle() {
        state = STATE.READY;
        reset();
        setStartLabel('START');
        showOverlay(
            'FLAPPY_BYTE',
            'SPACE / CLICK / TAP to flap',
            'avoid the firewall — one hit and the packet drops'
        );
        syncHud();
        draw();
    }

    GAME_REGISTRY.flappy = {
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

// ==========================================
// Arcade: Conway's Game of Life
// ==========================================
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

    const CELL = 8;
    const COLS = Math.floor(canvas.width / CELL);   // 60
    const ROWS = Math.floor(canvas.height / CELL);  // 40

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
        for (let i = 0; i < grid.length; i++) n += grid[i];
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

                const n = grid[idx(cLeft, rUp)] + grid[idx(c, rUp)] + grid[idx(cRight, rUp)]
                    + grid[idx(cLeft, r)] + grid[idx(cRight, r)]
                    + grid[idx(cLeft, rDown)] + grid[idx(c, rDown)] + grid[idx(cRight, rDown)];

                const alive = grid[idx(c, r)] === 1;
                // Survival on 2-3, reproduction on exactly 3, death otherwise
                next[idx(c, r)] = (alive ? (n === 2 || n === 3) : n === 3) ? 1 : 0;
            }
        }
        const swap = grid;
        grid = next;
        next = swap;
        generation += 1;
    }

    function draw() {
        const css = getComputedStyle(document.documentElement);
        const primary = (css.getPropertyValue('--primary-cyber') || '#bada55').trim();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(6, 10, 18, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(186, 218, 85, 0.06)';
        ctx.lineWidth = 1;
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(c * CELL + 0.5, 0);
            ctx.lineTo(c * CELL + 0.5, ROWS * CELL);
            ctx.stroke();
        }
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * CELL + 0.5);
            ctx.lineTo(COLS * CELL, r * CELL + 0.5);
            ctx.stroke();
        }

        // Live cells
        ctx.fillStyle = primary;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[idx(c, r)] === 1) {
                    ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
                }
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
        paintValue = grid[idx(cell.c, cell.r)] === 1 ? 0 : 1;
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
        if (grid[idx(cell.c, cell.r)] !== paintValue) {
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

    GAME_REGISTRY.life = {
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

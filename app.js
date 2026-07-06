// Global variables
let isLoading = true;
let currentSection = 'hero';
let currentTheme = 'dark';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Apply theme first (before any rendering)
    initThemeToggle();
    // Initialize all components
    initLoadingScreen();
    initCustomCursor();
    initMatrixBackground();
    initNeuralNetwork();
    initTypingAnimation();
    initNavigation();
    initScrollAnimations();
    initScrollReveal();
    initTimeline();
    initProjects();
    initContactForm();
    initFloatingParticles();
    initProfileModal();
    initParallax();
    initThreeHeroScene();
    optimizeAnimations();

    // Handle mobile detection
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile');
    }
}

// Loading Screen
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');

    // Mark body as loading to hold hero entrance animations
    document.body.classList.add('loading');

    // Dismiss after 1s progress bar completes
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        isLoading = false;

        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.body.classList.remove('loading');
            startHeroAnimations();
        }, 400);
    }, 1100);
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
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });

    function updateCursor() {
        currentX += (targetX - currentX) * 0.35;
        currentY += (targetY - currentY) * 0.35;

        cursorTrail.style.left = currentX - 10 + 'px';
        cursorTrail.style.top = currentY - 10 + 'px';

        requestAnimationFrame(updateCursor);
    }

    updateCursor();

    // Cursor interactions
    const interactiveElements = document.querySelectorAll('button, a, .timeline-item, .project-card-v2');

    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursorTrail.style.transform = 'scale(1.5)';
            cursorTrail.style.borderColor = '#00ccff';
        });

        element.addEventListener('mouseleave', () => {
            cursorTrail.style.transform = 'scale(1)';
            cursorTrail.style.borderColor = '#bada55';
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

    // Cache theme-derived colors (updated on theme change)
    let matrixFadeBg = 'rgba(10, 10, 10, 0.04)';
    let matrixTextColor = '#bada55';

    function updateMatrixColors() {
        const style = getComputedStyle(document.documentElement);
        matrixFadeBg = style.getPropertyValue('--matrix-fade').trim() || 'rgba(10, 10, 10, 0.04)';
        matrixTextColor = style.getPropertyValue('--primary-cyber').trim() || '#bada55';
    }
    updateMatrixColors();

    // Re-read colors when theme changes
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => setTimeout(updateMatrixColors, 50));
    }

    function drawMatrix() {
        ctx.fillStyle = matrixFadeBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = matrixTextColor;
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

    // Use requestAnimationFrame with time-delta throttle instead of setInterval
    let lastMatrixTime = 0;
    function matrixLoop(timestamp) {
        if (timestamp - lastMatrixTime >= 35) {
            drawMatrix();
            lastMatrixTime = timestamp;
        }
        requestAnimationFrame(matrixLoop);
    }
    requestAnimationFrame(matrixLoop);

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

    // Cache theme-derived colors (updated on theme change)
    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };

    let neuralAccentColor = '#bada55';
    let neuralRgb = hexToRgb(neuralAccentColor);

    function updateNeuralColors() {
        const style = getComputedStyle(document.documentElement);
        neuralAccentColor = style.getPropertyValue('--primary-cyber').trim() || '#bada55';
        neuralRgb = hexToRgb(neuralAccentColor);
    }
    updateNeuralColors();

    // Re-read colors when theme changes
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => setTimeout(updateNeuralColors, 50));
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

        // Draw connections using cached color values
        const rgb = neuralRgb;
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
        ctx.fillStyle = neuralAccentColor;
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = neuralAccentColor;
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

    setTimeout(typeText, 2000);
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
            <button class="tc-expand-btn" onclick="this.classList.toggle('active'); this.nextElementSibling.classList.toggle('open');">
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
 * Expand/collapse accordion — one card at a time
 */
function initTimelineExpand() {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    container.querySelectorAll('.timeline-expand-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.timeline-item');
            if (!item) return;

            const wasExpanded = item.classList.contains('expanded');

            // Collapse all
            container.querySelectorAll('.timeline-item.expanded').forEach(el => {
                el.classList.remove('expanded');
            });

            // Toggle clicked
            if (!wasExpanded) {
                item.classList.add('expanded');
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
    const inputs = form.querySelectorAll('.neural-input');

    // Add focus effects
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });

        // Add typing sound effect visual
        input.addEventListener('input', () => {
            input.style.boxShadow = '0 0 20px rgba(186, 218, 85, 0.5)';
            setTimeout(() => {
                input.style.boxShadow = '0 0 15px rgba(186, 218, 85, 0.3)';
            }, 100);
        });
    });

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
        });
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
    notification.textContent = message;

    // Set colors based on notification type
    let color = '#bada55'; // Default green
    let borderColor = '#bada55';
    let shadowColor = 'rgba(186, 218, 85, 0.3)';

    if (type === 'error') {
        color = '#ff0040';
        borderColor = '#ff0040';
        shadowColor = 'rgba(255, 0, 64, 0.3)';
    } else if (type === 'success') {
        color = '#00ccff';
        borderColor = '#00ccff';
        shadowColor = 'rgba(0, 204, 255, 0.3)';
    }

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: ${color};
        padding: 15px 25px;
        border: 1px solid ${borderColor};
        border-radius: 6px;
        z-index: 10001;
        font-family: var(--font-cyber);
        font-size: 14px;
        box-shadow: 0 0 20px ${shadowColor};
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function startHeroAnimations() {
    // Start hero section animations after loading
    const heroElements = document.querySelectorAll('.hero-content > *');

    heroElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';

        setTimeout(() => {
            element.style.transition = 'all 0.8s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// Performance optimization
function optimizeAnimations() {
    // Reduce animations on lower-end devices
    if (navigator.hardwareConcurrency < 4) {
        document.body.classList.add('reduced-motion');
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Create a high-detail sphere for the morphing effect — 40% larger (1.8 → 2.52)
    const geometry = new THREE.SphereGeometry(2.52, 48, 48);
    const originalPositions = JSON.parse(JSON.stringify(geometry.attributes.position.array));

    // Material for the core 'neural' structure (wireframe-like but organic)
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ccff, // Secondary cyber color
        wireframe: true,
        transparent: true,
        opacity: 0.2
    });
    const blob = new THREE.Mesh(geometry, material);
    scene.add(blob);

    camera.position.z = 5;

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        // Morph the blob using a simple sine-based displacement
        const pos = geometry.attributes.position.array;

        for (let i = 0; i < pos.length; i += 3) {
            const x = originalPositions[i];
            const y = originalPositions[i + 1];
            const z = originalPositions[i + 2];

            // Organic displacement logic
            const noise = Math.sin(x * 1.5 + time) * Math.cos(y * 1.5 + time) * Math.sin(z * 1.5 + time) * 0.3;

            pos[i] = x * (1 + noise);
            pos[i + 1] = y * (1 + noise);
            pos[i + 2] = z * (1 + noise);
        }

        geometry.attributes.position.needsUpdate = true;

        blob.rotation.y += 0.002;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
// Global variables
let mouseX = 0;
let mouseY = 0;
let isLoading = true;
let currentSection = 'hero';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize all components
    initLoadingScreen();
    initCustomCursor();
    initMatrixBackground();
    initNeuralNetwork();
    initTypingAnimation();
    initNavigation();
    initScrollAnimations();
    initSkillBars();
    initTimeline();
    initProjects();
    initContactForm();
    initFloatingParticles();
    
    // Handle mobile detection
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile');
    }
}

// Loading Screen
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const bootLines = document.querySelectorAll('.boot-line');
    const progressBar = document.querySelector('.progress-bar');
    
    // Simulate loading process
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        isLoading = false;
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            startHeroAnimations();
        }, 1000);
    }, 4000);
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
        currentX += (targetX - currentX) * 0.1;
        currentY += (targetY - currentY) * 0.1;
        
        cursorTrail.style.left = currentX - 10 + 'px';
        cursorTrail.style.top = currentY - 10 + 'px';
        
        requestAnimationFrame(updateCursor);
    }
    
    updateCursor();
    
    // Cursor interactions
    const interactiveElements = document.querySelectorAll('button, a, .project-card, .timeline-item');
    
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
    
    function drawMatrix() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#bada55';
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
        ctx.strokeStyle = 'rgba(186, 218, 85, 0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < connectionDistance) {
                    const opacity = 1 - (distance / connectionDistance);
                    ctx.strokeStyle = `rgba(186, 218, 85, ${opacity * 0.3})`;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }
        
        // Draw nodes
        ctx.fillStyle = '#bada55';
        nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#bada55';
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
        'Optimizing data workflows...'
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

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
    
    // Update active nav on scroll
    window.addEventListener('scroll', updateActiveNav);
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

function updateActiveNav() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSectionId = section.id;
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + currentSectionId) {
            link.classList.add('active');
        }
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Trigger specific animations based on element type
                if (entry.target.classList.contains('skill-item')) {
                    animateSkillBar(entry.target);
                }
                
                if (entry.target.classList.contains('timeline-item')) {
                    animateTimelineItem(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll('.skill-item, .timeline-item, .project-card, .terminal-window');
    elementsToAnimate.forEach(el => observer.observe(el));
}

// Skills Bar Animation
function initSkillBars() {
    // Skills will be animated when they come into view via scroll animations
}

function animateSkillBar(skillItem) {
    const progressBar = skillItem.querySelector('.skill-progress');
    const level = progressBar.getAttribute('data-level');
    
    setTimeout(() => {
        progressBar.style.width = level + '%';
    }, 200);
}

// Timeline
function initTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            timelineItems.forEach(ti => ti.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');
            
            // Add ripple effect
            createRipple(item);
        });
        
        // Hover effects
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(15px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateX(0) scale(1)';
        });
    });
}

function animateTimelineItem(item) {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-50px)';
    
    setTimeout(() => {
        item.style.transition = 'all 0.6s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
    }, 100);
}

// Projects
function initProjects() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        // Add hover sound effect visual
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
            card.style.boxShadow = '0 20px 40px rgba(186, 218, 85, 0.3)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = 'none';
        });
        
        // Touch support for mobile
        card.addEventListener('touchstart', () => {
            card.classList.add('touched');
        });
    });
    
    // Initialize project animations
    initPhysicsSimulation();
    initFuturePreview();
}

function initPhysicsSimulation() {
    const particles = document.querySelectorAll('.physics-simulation .particle');
    
    particles.forEach((particle, index) => {
        // Create random movement patterns
        setInterval(() => {
            const x = Math.random() * 80 + 10; // 10-90%
            const y = Math.random() * 80 + 10; // 10-90%
            
            particle.style.left = x + '%';
            particle.style.top = y + '%';
            particle.style.transform = `scale(${0.5 + Math.random() * 0.5})`;
        }, 2000 + index * 500);
    });
}

function initFuturePreview() {
    const dots = document.querySelectorAll('.loading-dots .dot');
    const hologramText = document.querySelector('.hologram-text');
    
    // Add extra glitch effect to hologram text
    setInterval(() => {
        hologramText.style.textShadow = `
            ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0 #ff0040,
            ${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0 #00ccff
        `;
        
        setTimeout(() => {
            hologramText.style.textShadow = 'none';
        }, 50);
    }, 3000);
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

function handleFormSubmission(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.querySelector('.btn-text').textContent;
    
    // Show loading state
    submitBtn.querySelector('.btn-text').textContent = 'TRANSMITTING...';
    submitBtn.disabled = true;
    
    // Simulate form submission
    setTimeout(() => {
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
    }, 2000);
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
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: #bada55;
        padding: 15px 25px;
        border: 1px solid #bada55;
        border-radius: 6px;
        z-index: 10001;
        font-family: var(--font-cyber);
        font-size: 14px;
        box-shadow: 0 0 20px rgba(186, 218, 85, 0.3);
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

// Mobile Touch Handling
function initMobileSupport() {
    if (window.innerWidth <= 768) {
        // Add touch support for project cards
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            let touchStartTime = 0;
            
            card.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
            });
            
            card.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - touchStartTime;
                
                if (touchDuration < 500) { // Quick tap
                    card.classList.toggle('flipped');
                }
            });
        });
        
        // Disable hover effects on mobile
        document.body.classList.add('mobile-device');
    }
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
    
    .mobile-device .project-card:hover {
        transform: none !important;
    }
    
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    .paused-animations * {
        animation-play-state: paused !important;
    }
    
    .project-card.flipped .card-inner {
        transform: rotateY(180deg);
    }
    
    @media (max-width: 768px) {
        .project-card {
            touch-action: manipulation;
        }
        
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

// Initialize mobile support and optimizations
window.addEventListener('load', () => {
    initMobileSupport();
    optimizeAnimations();
});

// Export functions for global access
window.scrollToSection = scrollToSection;
document.addEventListener("DOMContentLoaded", function() {
    // Initialize custom cursor
    initCustomCursor();
    
    // Initialize particle background
    initParticleBackground();
    
    // Initialize scroll reveal
    initScrollReveal();
    
    // Initialize tilt effect for project cards
    initTiltEffect();
    
    // Initialize magnetic buttons
    initMagneticButtons();
    
    // Initialize glitch text effect
    initGlitchText();
    
    // Initialize form animations
    initFormAnimations();
});

// Custom cursor implementation
function initCustomCursor() {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    window.addEventListener('mousemove', function(e) {
        const posX = e.clientX;
        const posY = e.clientY;
        
        // Animate cursor dot to follow mouse exactly
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;
        
        // Animate cursor outline with slight delay for smooth effect
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 100, fill: 'forwards' });
    });
    
    // Change cursor size on clickable elements
    const clickables = document.querySelectorAll('a, button, .burger-menu, .project-block');
    clickables.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursorOutline.style.width = '60px';
            cursorOutline.style.height = '60px';
            cursorOutline.style.borderColor = 'rgba(186, 218, 85, 0.8)';
        });
        
        element.addEventListener('mouseleave', () => {
            cursorOutline.style.width = '40px';
            cursorOutline.style.height = '40px';
            cursorOutline.style.borderColor = 'rgba(186, 218, 85, 0.5)';
        });
    });
    
    // Add click animation
    document.addEventListener('mousedown', () => {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(0.5)';
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(0.8)';
    });
    
    document.addEventListener('mouseup', () => {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
    });
}

// Particle background implementation
function initParticleBackground() {
    const canvas = document.getElementById('background-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Particle settings
    const particlesArray = [];
    const numberOfParticles = 100;
    
    // Create particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.color = `rgba(186, 218, 85, ${Math.random() * 0.5})`;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // Bounce off edges
            if (this.x > canvas.width || this.x < 0) {
                this.speedX = -this.speedX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.speedY = -this.speedY;
            }
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create particles
    function init() {
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
            
            // Connect particles with lines
            for (let j = i; j < particlesArray.length; j++) {
                const dx = particlesArray[i].x - particlesArray[j].x;
                const dy = particlesArray[i].y - particlesArray[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(186, 218, 85, ${0.1 - distance/1000})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });
    
    init();
    animate();
}

// Scroll reveal implementation
function initScrollReveal() {
    const sections = document.querySelectorAll('.reveal-section');
    const textReveal = document.querySelectorAll('.text-reveal');
    
    function checkScroll() {
        const triggerBottom = window.innerHeight * 0.8;
        
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            
            if (sectionTop < triggerBottom) {
                section.classList.add('active');
            }
        });
        
        textReveal.forEach(text => {
            const textTop = text.getBoundingClientRect().top;
            
            if (textTop < triggerBottom) {
                text.classList.add('active');
            }
        });
    }
    
    // Check on initial load
    checkScroll();
    
    // Check on scroll
    window.addEventListener('scroll', checkScroll);
}

// Tilt effect implementation
function initTiltEffect() {
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', tiltEffect);
        card.addEventListener('mouseleave', resetTilt);
    });
    
    function tiltEffect(e) {
        const card = this;
        const cardRect = card.getBoundingClientRect();
        const cardWidth = cardRect.width;
        const cardHeight = cardRect.height;
        const centerX = cardRect.left + cardWidth / 2;
        const centerY = cardRect.top + cardHeight / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        const rotateX = (-mouseY / (cardHeight / 2)) * 10;
        const rotateY = (mouseX / (cardWidth / 2)) * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
    
    function resetTilt() {
        this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    }
}

// Magnetic buttons implementation
function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.btn-magnetic');
    
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', magneticEffect);
        btn.addEventListener('mouseleave', resetMagnetic);
    });
    
    function magneticEffect(e) {
        const btn = this;
        const btnRect = btn.getBoundingClientRect();
        const btnWidth = btnRect.width;
        const btnHeight = btnRect.height;
        const centerX = btnRect.left + btnWidth / 2;
        const centerY = btnRect.top + btnHeight / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
        const maxDistance = Math.sqrt((btnWidth * btnWidth) / 4 + (btnHeight * btnHeight) / 4);
        
        if (distance < maxDistance) {
            const moveX = (mouseX / maxDistance) * 10;
            const moveY = (mouseY / maxDistance) * 10;
            btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    }
    
    function resetMagnetic() {
        this.style.transform = 'translate(0, 0)';
    }
}

// Glitch text effect implementation
function initGlitchText() {
    const glitchText = document.querySelector('.glitch-text');
    
    if (glitchText) {
        // Set data-text attribute to match text content
        glitchText.setAttribute('data-text', glitchText.textContent);
        
        // Randomly trigger glitch effect
        setInterval(() => {
            glitchText.classList.add('active');
            
            setTimeout(() => {
                glitchText.classList.remove('active');
            }, 200);
        }, 3000);
    }
}

// Form animations implementation
function initFormAnimations() {
    const formGroups = document.querySelectorAll('.form-group');
    
    formGroups.forEach(group => {
        const input = group.querySelector('input, textarea');
        
        if (input) {
            // Check initial state
            if (input.value !== '') {
                input.classList.add('has-value');
            }
            
            // Add event listeners
            input.addEventListener('focus', () => {
                input.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                input.classList.remove('focused');
                if (input.value !== '') {
                    input.classList.add('has-value');
                } else {
                    input.classList.remove('has-value');
                }
            });
        }
    });
}

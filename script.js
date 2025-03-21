document.addEventListener("DOMContentLoaded", function() {
    // Create menu overlay
    const menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';
    
    // Add menu items
    const menuItems = [
        { text: 'About', href: '#about' },
        { text: 'Projects', href: '#projects' },
        { text: 'Resume', href: '#' },
        { text: 'Contact', href: '#' }
    ];
    
    menuItems.forEach(item => {
        const link = document.createElement('a');
        link.textContent = item.text;
        link.href = item.href;
        link.addEventListener('click', () => {
            menuOverlay.classList.remove('active');
        });
        menuContainer.appendChild(link);
    });
    
    menuOverlay.appendChild(menuContainer);
    document.body.appendChild(menuOverlay);
    
    // Burger menu functionality
    const burger = document.getElementById('burger');
    
    burger.addEventListener('click', function() {
        menuOverlay.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    menuOverlay.addEventListener('click', function(e) {
        if (e.target === menuOverlay) {
            menuOverlay.classList.remove('active');
        }
    });
});

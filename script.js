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


// --- Contact Form: Show Thank You Message on Success ---
// This works by intercepting the submit event, letting the form POST to Formspree (which works without JS),
// then hiding the form and showing the thank you message.

document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById('contact-form');
    const thankYou = document.getElementById('thank-you-message');
    const wrapper = document.getElementById('contact-form-wrapper');
    const submitAnother = document.getElementById('submit-another');
  
    if (form && thankYou && submitAnother) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
  
        // Send form data to Formspree using AJAX to avoid page reload
        const data = new FormData(form);
        fetch(form.action, {
          method: "POST",
          body: data,
          headers: {
            'Accept': 'application/json'
          }
        }).then(response => {
          if (response.ok) {
            form.reset();
            form.style.display = "none";
            thankYou.style.display = "block";
          } else {
            response.json().then(data => {
              alert(data.error || "Oops! There was a problem.");
            });
          }
        }).catch(() => {
          alert("Oops! There was a problem.");
        });
      });
  
      // Allow user to submit another message
      submitAnother.addEventListener('click', function() {
        form.style.display = "block";
        thankYou.style.display = "none";
      });
    }
  });
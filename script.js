document.addEventListener("DOMContentLoaded", function () {
    const burger = document.getElementById("burger");
    const menu = document.getElementById("menu");

    burger.addEventListener("click", function () {
        menu.classList.toggle("active"); // Toggle visibility
    });
});

// Add this function in your existing JavaScript file or inline in your HTML

function toggleMenu() {
    // You can implement your menu opening/closing logic here
    alert('Menu toggled!'); // Replace this with your menu logic
}


function showOverlay(section) {
    document.getElementById('overlay').style.display = 'flex';

    let text = '';
    switch (section) {
        case 'about':
            text = '<h1>About Me</h1><p>This is the About section content.</p>';
            break;
        case 'resume':
            text = '<h1>My Resume</h1><p>This is the Resume section content.</p>';
            break;
        case 'contact':
            text = '<h1>Contact Me</h1><p>This is the Contact section content.</p>';
            break;
    }
    document.getElementById('overlay-text').innerHTML = text;
}

function closeOverlay() {
    document.getElementById('overlay').style.display = 'none';
}

function closePage() {
    window.history.back();
}

function openResume() {
    window.open('resume.pdf', '_blank');
  }

const transitionOverlay = document.getElementById('pageTransitionOverlay');

function transitionToPage(url) {
    transitionOverlay.classList.add('active'); // Activate curtains

    // Wait for the curtains to fully come in
    setTimeout(() => {
        // Change the page here to show the new content
        setTimeout(() => {
            transitionOverlay.classList.remove('active');
        }, 0); 
        window.location.href = url; // Navigate to the new page

        // Now remove the active class to start exit animation
// Immediately start the exit animation after changing the page
    }, 1400); // Duration for curtains coming in
}
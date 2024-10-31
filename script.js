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

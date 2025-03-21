document.addEventListener("DOMContentLoaded", function() {
    // Create loading screen element
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    
    // Create progress bar container
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    
    // Create progress element
    const progress = document.createElement('div');
    progress.className = 'progress';
    
    // Append elements
    progressBar.appendChild(progress);
    loadingScreen.appendChild(progressBar);
    document.body.appendChild(loadingScreen);
    
    // Hide loading screen after animation completes
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 3000); //change it to 3000 after development.
});

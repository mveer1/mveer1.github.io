// High score management
class HighScoreManager {
    constructor(gameName, maxScores = 5) {
        this.storageKey = `${gameName}HighScores`;
        this.maxScores = maxScores;
        this.scores = this.loadScores();
    }

    loadScores() {
        const savedScores = localStorage.getItem(this.storageKey);
        return savedScores ? JSON.parse(savedScores) : [];
    }

    saveScore(name, score) {
        const newScore = { name, score, date: new Date().toISOString() };
        this.scores.push(newScore);
        
        // Sort scores (highest first)
        this.scores.sort((a, b) => b.score - a.score);
        
        // Keep only top scores
        if (this.scores.length > this.maxScores) {
            this.scores = this.scores.slice(0, this.maxScores);
        }
        
        // Save to localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
        return this.isHighScore(score);
    }

    isHighScore(score) {
        return this.scores.length < this.maxScores || score > this.scores[this.scores.length - 1].score;
    }

    renderScoreList(container) {
        const list = document.createElement('ul');
        
        if (this.scores.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'No high scores yet!';
            list.appendChild(emptyItem);
        } else {
            this.scores.forEach((score, index) => {
                const item = document.createElement('li');
                
                const rank = document.createElement('span');
                rank.textContent = `#${index + 1}`;
                
                const name = document.createElement('span');
                name.textContent = score.name;
                
                const points = document.createElement('span');
                points.textContent = score.score;
                
                item.appendChild(rank);
                item.appendChild(name);
                item.appendChild(points);
                
                list.appendChild(item);
            });
        }
        
        container.innerHTML = '';
        container.appendChild(list);
    }
}

// Flappy Bird Game Implementation
class FlappyBirdGame {
    constructor(canvas, highScoreManager, difficulty = 'medium') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.highScoreManager = highScoreManager;
        
        // Game state
        this.isRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = localStorage.getItem('flappyBirdHighScore') || 0;
        
        // Animation properties
        this.animationId = null;
        this.lastUpdateTime = 0;
        
        // Set difficulty
        this.setDifficulty(difficulty);
        
        // Bird properties
        this.birdSize = 20;
        this.birdX = this.width / 4;
        this.birdY = this.height / 2;
        this.birdVelocity = 0;
        this.birdGravity = 0.5;
        this.birdJumpStrength = -8;
        
        // Pipe properties
        this.pipes = [];
        this.pipeWidth = 50;
        this.pipeGap = 150;
        this.pipeSpawnInterval = 1500;
        this.lastPipeSpawnTime = 0;
        
        // Road properties
        this.roadStripes = [];
        this.stripeWidth = 30;
        this.stripeHeight = 5;
        this.stripeGap = 30;
        this.initRoadStripes();
        
        // Initialize event listeners
        this.setupEventListeners();
    }
    
    pauseGame() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    startGame() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.gameOver = false;
            this.animationId = requestAnimationFrame(this.update.bind(this));
        }
    }

    setDifficulty(difficulty) {
        switch(difficulty) {
            case 'easy':
                this.gameSpeed = 2;
                this.pipeFrequency = 2000;
                break;
            case 'medium':
                this.gameSpeed = 3;
                this.pipeFrequency = 1500;
                break;
            case 'hard':
                this.gameSpeed = 4;
                this.pipeFrequency = 1200;
                break;
            default:
                this.gameSpeed = 3;
                this.pipeFrequency = 1500;
        }
    }
    
    initRoadStripes() {
        const totalStripes = Math.ceil(this.width / (this.stripeWidth + this.stripeGap)) + 1;
        for (let i = 0; i < totalStripes; i++) {
            this.roadStripes.push({
                x: i * (this.stripeWidth + this.stripeGap),
                y: this.height - 20
            });
        }
    }
    
    updateRoadStripes() {
        if (!this.gameOver) {
            for (let stripe of this.roadStripes) {
                stripe.x -= this.gameSpeed;
                if (stripe.x + this.stripeWidth < 0) {
                    stripe.x = this.width;
                }
            }
        }
    }
    
    drawRoadStripes() {
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(0, this.height - 25, this.width, 25);
        
        this.ctx.fillStyle = '#FFFFFF';
        for (let stripe of this.roadStripes) {
            this.ctx.fillRect(stripe.x, stripe.y, this.stripeWidth, this.stripeHeight);
        }
    }
    
    setupEventListeners() {
        // Jump on click/tap
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) {
                this.resetGame();
            } else {
                this.jump();
            }
        });
        
        // Jump on spacebar
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (this.gameOver) {
                    this.resetGame();
                } else {
                    this.jump();
                }
                e.preventDefault();
            }
        });
    }
    
    jump() {
        this.birdVelocity = this.birdJumpStrength;
    }
    
    spawnPipe() {
        const minHeight = 50;
        const maxHeight = this.height - this.pipeGap - minHeight - 25; // Account for road
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        this.pipes.push({
            x: this.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            passed: false
        });
    }
    
    updateBird() {
        // Apply gravity
        this.birdVelocity += this.birdGravity;
        this.birdY += this.birdVelocity;
        
        // Check for collisions with canvas boundaries
        if (this.birdY < 0) {
            this.birdY = 0;
            this.birdVelocity = 0;
        }
        
        if (this.birdY + this.birdSize > this.height - 25) { // Account for road
            this.birdY = this.height - this.birdSize - 25;
            this.gameOver = true;
        }
    }
    
    updatePipes() {
        // Move pipes
        for (let i = 0; i < this.pipes.length; i++) {
            const pipe = this.pipes[i];
            pipe.x -= this.gameSpeed;
            
            // Check for score
            if (!pipe.passed && pipe.x + this.pipeWidth < this.birdX) {
                pipe.passed = true;
                this.score++;
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('flappyBirdHighScore', this.highScore);
                }
            }
            
            // Check for collisions
            if (
                this.birdX + this.birdSize > pipe.x && 
                this.birdX < pipe.x + this.pipeWidth && 
                (this.birdY < pipe.topHeight || this.birdY + this.birdSize > pipe.bottomY)
            ) {
                this.gameOver = true;
            }
        }
        
        // Remove off-screen pipes
        this.pipes = this.pipes.filter(pipe => pipe.x + this.pipeWidth > 0);
    }
    
    drawBird() {
        this.ctx.fillStyle = '#FF4136'; // Red bird
        this.ctx.beginPath();
        this.ctx.arc(
            this.birdX + this.birdSize/2, 
            this.birdY + this.birdSize/2, 
            this.birdSize/2, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    drawPipes() {
        this.ctx.fillStyle = '#2ECC40'; // Green pipes
        
        for (const pipe of this.pipes) {
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Bottom pipe
            this.ctx.fillRect(
                pipe.x, 
                pipe.bottomY, 
                this.pipeWidth, 
                this.height - pipe.bottomY - 25 // Account for road
            );
        }
    }
    
    drawScore() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `Score: ${this.score}`, 
            this.width / 2, 
            30
        );
        
        if (this.gameOver) {
            this.ctx.fillText(
                `Game Over`, 
                this.width / 2, 
                this.height / 2 - 50
            );
            this.ctx.fillText(
                `Click to restart`, 
                this.width / 2, 
                this.height / 2 + 50
            );
        }
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height - 25);
        gradient.addColorStop(0, '#001f3f');
        gradient.addColorStop(1, '#0074D9');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height - 25);
    }
    
    draw() {
        this.drawBackground();
        this.drawPipes();
        this.drawRoadStripes();
        this.drawBird();
        this.drawScore();
    }
    
    update(timestamp) {
        if (this.gameOver) {
            this.promptForName();
            return;
        }

        if (!this.lastUpdateTime) this.lastUpdateTime = timestamp;
        const elapsed = timestamp - this.lastUpdateTime;
        
        // Update road stripes only if game is not over
        this.updateRoadStripes();
        
        // Spawn pipes at intervals
        if (!this.gameOver && timestamp - this.lastPipeSpawnTime > this.pipeFrequency) {
            this.spawnPipe();
            this.lastPipeSpawnTime = timestamp;
        }
        
        if (!this.gameOver) {
            this.updateBird();
            this.updatePipes();
        }
        
        this.draw();
        this.lastUpdateTime = timestamp;
        
        if (this.isRunning) {
            this.animationId = requestAnimationFrame(this.update.bind(this));
        }


    }
    
    resetGame() {
        if (this.gameOver && this.score > 0) {
            const isHighScore = this.highScoreManager.isHighScore(this.score);
            if (isHighScore) {
                this.promptForName();
                return;
            }
        }
        
        this.gameOver = false;
        this.score = 0;
        this.birdY = this.height / 2;
        this.birdVelocity = 0;
        this.pipes = [];
        this.lastPipeSpawnTime = 0;
        
        if (!this.isRunning) {
            this.startGame();
        }
    }

    promptForName() {
        // Create name input container
        const container = document.createElement('div');
        container.className = 'name-input-container';
        
        const heading = document.createElement('h4');
        heading.textContent = 'New High Score!';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter your name';
        input.maxLength = 15;
        
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit Score';
        
        const skipBtn = document.createElement('button');
        skipBtn.textContent = 'Skip';
        // skipBtn.style.marginLeft = '10px';
        
        container.appendChild(heading);
        container.appendChild(input);
        container.appendChild(submitBtn);
        container.appendChild(skipBtn);
        
        // Add to the name form area instead of game section
        const nameFormArea = document.getElementById('nameFormArea') || document.querySelector('.highscore-section');
        nameFormArea.appendChild(container);
        
        // Focus the input
        input.focus();
        
        // Handle submission
        submitBtn.addEventListener('click', () => {
            const name = input.value.trim() || 'Anonymous';
            this.highScoreManager.saveScore(name, this.score);
            this.highScoreManager.renderScoreList(document.getElementById('highScoresList'));
            container.remove();
            this.resetGameState();
        });
        
        // Skip option
        skipBtn.addEventListener('click', () => {
            container.remove();
            this.resetGameState();
        });
        
        // Also submit on Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitBtn.click();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Get the modal elements
    const modal = document.getElementById('flappyBirdModal');
    const openButton = document.getElementById('openFlappyGame');
    const closeButton = document.querySelector('.close-modal');
    const canvas = document.getElementById('flappyCanvas');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const difficultySelect = document.getElementById('difficultySelect');
    
    let game;
    let highScoreManager;

    openButton.addEventListener('click', function() {
        modal.style.display = 'block';
        if (!game) {
            highScoreManager = new HighScoreManager('FlappyBird');
            game = new FlappyBirdGame(canvas, highScoreManager);
            game.draw(); // Initial draw
            highScoreManager.renderScoreList(document.getElementById('highScoresList'));
        }
    });

    // Add event listeners for buttons
    playPauseBtn.addEventListener('click', function() {
        if (game.isRunning) {
            game.pauseGame();
            playPauseBtn.innerHTML = '▶';
        } else {
            game.startGame();
            playPauseBtn.innerHTML = '❚❚';
        }
    });

    resetBtn.addEventListener('click', function() {
        game.resetGame();
        playPauseBtn.innerHTML = '▶';
    });

    difficultySelect.addEventListener('change', function() {
        game.setDifficulty(this.value);
    });

    // Close modal when clicking the close button
    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
        if (game && game.isRunning) {
            game.pauseGame();
            playPauseBtn.innerHTML = '▶';
        }
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (game && game.isRunning) {
                game.pauseGame();
                playPauseBtn.innerHTML = '▶';
            }
        }
    });
});

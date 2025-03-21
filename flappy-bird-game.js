// Flappy Bird Game Implementation
class FlappyBirdGame {
    constructor(canvas, difficulty = 'medium') {
        this.birdCanvas = canvas;
        this.birdContext = canvas.getContext('2d');
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        
        // Game state
        this.isGameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = localStorage.getItem('flappyBirdHighScore') || 0;
        
        // Animation properties
        this.birdAnimationId = null;
        this.lastBirdUpdateTime = 0;
        
        // Set difficulty
        this.setDifficulty(difficulty);
        
        // Bird properties
        this.birdSize = 20;
        this.birdX = this.canvasWidth / 4;
        this.birdY = this.canvasHeight / 2;
        this.birdVelocity = 0;
        this.birdGravity = 0.5;
        this.birdJumpStrength = -8;
        
        // Pipe properties
        this.pipes = [];
        this.pipeWidth = 50;
        this.pipeGap = 150;
        this.pipeSpawnInterval = 1500; // milliseconds
        this.lastPipeSpawnTime = 0;
        
        // Initialize event listeners
        this.setupEventListeners();
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
    
    setupEventListeners() {
        // Jump on click/tap
        this.birdCanvas.addEventListener('click', () => {
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
        const maxHeight = this.canvasHeight - this.pipeGap - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        this.pipes.push({
            x: this.canvasWidth,
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
        
        if (this.birdY + this.birdSize > this.canvasHeight) {
            this.birdY = this.canvasHeight - this.birdSize;
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
        this.birdContext.fillStyle = '#bada55';
        this.birdContext.beginPath();
        this.birdContext.arc(
            this.birdX + this.birdSize/2, 
            this.birdY + this.birdSize/2, 
            this.birdSize/2, 
            0, 
            Math.PI * 2
        );
        this.birdContext.fill();
    }
    
    drawPipes() {
        this.birdContext.fillStyle = '#bada55';
        
        for (const pipe of this.pipes) {
            // Top pipe
            this.birdContext.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Bottom pipe
            this.birdContext.fillRect(
                pipe.x, 
                pipe.bottomY, 
                this.pipeWidth, 
                this.canvasHeight - pipe.bottomY
            );
        }
    }
    
    drawScore() {
        this.birdContext.fillStyle = '#bada55';
        this.birdContext.font = '24px Courier New';
        this.birdContext.textAlign = 'center';
        this.birdContext.fillText(
            `Score: ${this.score}`, 
            this.canvasWidth / 2, 
            30
        );
        
        if (this.gameOver) {
            this.birdContext.fillText(
                `High Score: ${this.highScore}`, 
                this.canvasWidth / 2, 
                60
            );
            this.birdContext.fillText(
                'Click to restart', 
                this.canvasWidth / 2, 
                this.canvasHeight / 2 + 50
            );
        }
    }
    
    drawBackground() {
        // Draw a simple background
        this.birdContext.fillStyle = '#2d2d2d';
        this.birdContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    
    draw() {
        this.drawBackground();
        this.drawPipes();
        this.drawBird();
        this.drawScore();
    }
    
    update(timestamp) {
        if (!this.lastBirdUpdateTime) this.lastBirdUpdateTime = timestamp;
        const elapsed = timestamp - this.lastBirdUpdateTime;
        
        // Spawn pipes at intervals
        if (timestamp - this.lastPipeSpawnTime > this.pipeFrequency) {
            this.spawnPipe();
            this.lastPipeSpawnTime = timestamp;
        }
        
        if (!this.gameOver) {
            this.updateBird();
            this.updatePipes();
        }
        
        this.draw();
        this.lastBirdUpdateTime = timestamp;
        
        if (this.isGameRunning) {
            this.birdAnimationId = requestAnimationFrame(this.update.bind(this));
        }
    }
    
    startGame() {
        if (!this.isGameRunning) {
            this.isGameRunning = true;
            this.birdAnimationId = requestAnimationFrame(this.update.bind(this));
        }
    }
    
    pauseGame() {
        this.isGameRunning = false;
        if (this.birdAnimationId) {
            cancelAnimationFrame(this.birdAnimationId);
            this.birdAnimationId = null;
        }
    }
    
    resetGame() {
        this.gameOver = false;
        this.score = 0;
        this.birdY = this.canvasHeight / 2;
        this.birdVelocity = 0;
        this.pipes = [];
        this.lastPipeSpawnTime = 0;
        
        if (!this.isGameRunning) {
            this.startGame();
        }
    }
}

// Initialize Flappy Bird Game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const secondProjectBlock = document.querySelector('.project-block:nth-child(2)');
    
    if (secondProjectBlock) {
        // Clear any existing content
        secondProjectBlock.innerHTML = '';
        
        // Create container for the game
        const flappyGameContainer = document.createElement('div');
        flappyGameContainer.className = 'flappy-game-container';
        
        // Create title
        const gameTitle = document.createElement('h3');
        gameTitle.className = 'project-title';
        gameTitle.textContent = "Flappy Bird";
        
        // Create canvas for the game
        const flappyCanvas = document.createElement('canvas');
        flappyCanvas.width = 300;
        flappyCanvas.height = 300;
        flappyCanvas.className = 'flappy-game-canvas';
        
        // Create controls
        const gameControls = document.createElement('div');
        gameControls.className = 'flappy-game-controls';
        
        const playPauseButton = document.createElement('button');
        playPauseButton.className = 'flappy-game-btn play-pause';
        playPauseButton.innerHTML = '▶';
        
        const resetButton = document.createElement('button');
        resetButton.className = 'flappy-game-btn reset';
        resetButton.innerHTML = '↻';
        
        const difficultySelector = document.createElement('select');
        difficultySelector.className = 'flappy-difficulty-select';
        
        const difficultyLevels = [
            { value: 'easy', text: 'Easy' },
            { value: 'medium', text: 'Medium' },
            { value: 'hard', text: 'Hard' }
        ];
        
        difficultyLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.value;
            option.text = level.text;
            difficultySelector.appendChild(option);
        });
        
        // Create instructions
        const instructions = document.createElement('p');
        instructions.className = 'flappy-instructions';
        instructions.textContent = 'Click or press Space to jump';
        
        // Append elements
        gameControls.appendChild(playPauseButton);
        gameControls.appendChild(resetButton);
        gameControls.appendChild(difficultySelector);
        
        flappyGameContainer.appendChild(gameTitle);
        flappyGameContainer.appendChild(flappyCanvas);
        flappyGameContainer.appendChild(instructions);
        flappyGameContainer.appendChild(gameControls);
        
        secondProjectBlock.appendChild(flappyGameContainer);
        
        // Initialize game
        const flappyGame = new FlappyBirdGame(flappyCanvas, 'medium');
        flappyGame.draw(); // Initial draw
        
        // Add event listeners
        playPauseButton.addEventListener('click', function() {
            if (flappyGame.isGameRunning) {
                flappyGame.pauseGame();
                playPauseButton.innerHTML = '▶';
            } else {
                flappyGame.startGame();
                playPauseButton.innerHTML = '❚❚';
            }
        });
        
        resetButton.addEventListener('click', function() {
            flappyGame.resetGame();
            if (!flappyGame.isGameRunning) {
                flappyGame.startGame();
                playPauseButton.innerHTML = '❚❚';
            }
        });
        
        difficultySelector.addEventListener('change', function() {
            flappyGame.setDifficulty(this.value);
        });
    }
});

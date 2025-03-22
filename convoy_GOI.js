// Conway's Game of Life implementation with more specific naming
class ConwayGameOfLife {
    constructor(canvas, cellSize = 10, framesPerSecond = 10) {
        this.gameCanvas = canvas;
        this.gameContext = canvas.getContext('2d');
        this.cellSize = cellSize;
        this.framesPerSecond = framesPerSecond;
        this.isGameRunning = false;
        this.gameAnimationId = null;
        this.lastGameUpdateTime = 0;
        this.gameUpdateInterval = 1000 / this.framesPerSecond;
        
        // Calculate grid dimensions
        this.gridColumns = Math.floor(canvas.width / cellSize);
        this.gridRows = Math.floor(canvas.height / cellSize);
        
        // Initialize grid
        this.currentGrid = this.createEmptyGrid();
        this.nextGenerationGrid = this.createEmptyGrid();
        
        // Add initial pattern
        this.addLifePattern('glider');
    }
    
    createEmptyGrid() {
        return Array(this.gridRows).fill().map(() => Array(this.gridColumns).fill(0));
    }
    
    addLifePattern(patternName) {
        // Clear the grid first
        this.currentGrid = this.createEmptyGrid();
        
        const centerRow = Math.floor(this.gridRows / 2);
        const centerCol = Math.floor(this.gridColumns / 2);
        
        switch(patternName) {
            case 'glider':
                // Add a glider pattern
                this.currentGrid[centerRow-1][centerCol] = 1;
                this.currentGrid[centerRow][centerCol+1] = 1;
                this.currentGrid[centerRow+1][centerCol-1] = 1;
                this.currentGrid[centerRow+1][centerCol] = 1;
                this.currentGrid[centerRow+1][centerCol+1] = 1;
                break;
            case 'pulsar':
                // Add a pulsar pattern (larger oscillator)
                const pulsarPattern = [
                    [2, 4, 5, 6, 10, 11, 12, 14],
                    [2, 7, 9, 14],
                    [2, 7, 9, 14],
                    [2, 4, 5, 6, 10, 11, 12, 14],
                    [0, 0, 0, 0, 0, 0, 0, 0],
                    [2, 4, 5, 6, 10, 11, 12, 14],
                    [2, 7, 9, 14],
                    [2, 7, 9, 14],
                    [2, 4, 5, 6, 10, 11, 12, 14]
                ];
                
                for (let i = 0; i < pulsarPattern.length; i++) {
                    for (let j = 0; j < pulsarPattern[i].length; j++) {
                        if (pulsarPattern[i][j] === 1) {
                            const row = centerRow - 4 + i;
                            const col = centerCol - 7 + j;
                            if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridColumns) {
                                this.currentGrid[row][col] = 1;
                            }
                        }
                    }
                }
                break;
            case 'random':
                // Fill with random cells
                for (let i = 0; i < this.gridRows; i++) {
                    for (let j = 0; j < this.gridColumns; j++) {
                        this.currentGrid[i][j] = Math.random() > 0.8 ? 1 : 0;
                    }
                }
                break;
        }
    }
    
    countLivingNeighbors(grid, row, col) {
        let neighborCount = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                const r = (row + i + this.gridRows) % this.gridRows;
                const c = (col + j + this.gridColumns) % this.gridColumns;
                
                neighborCount += grid[r][c];
            }
        }
        return neighborCount;
    }
    
    updateLifeGeneration() {
        // Apply Conway's Game of Life rules
        for (let i = 0; i < this.gridRows; i++) {
            for (let j = 0; j < this.gridColumns; j++) {
                const cellState = this.currentGrid[i][j];
                const neighborCount = this.countLivingNeighbors(this.currentGrid, i, j);
                
                // Rules
                if (cellState === 0 && neighborCount === 3) {
                    this.nextGenerationGrid[i][j] = 1; // Birth
                } else if (cellState === 1 && (neighborCount < 2 || neighborCount > 3)) {
                    this.nextGenerationGrid[i][j] = 0; // Death
                } else {
                    this.nextGenerationGrid[i][j] = cellState; // Stasis
                }
            }
        }
        
        // Swap grids
        [this.currentGrid, this.nextGenerationGrid] = [this.nextGenerationGrid, this.currentGrid];
    }
    
    drawLifeGrid() {
        this.gameContext.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        // Draw cells
        this.gameContext.fillStyle = '#bada55';
        
        for (let i = 0; i < this.gridRows; i++) {
            for (let j = 0; j < this.gridColumns; j++) {
                if (this.currentGrid[i][j] === 1) {
                    this.gameContext.fillRect(
                        j * this.cellSize,
                        i * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }
    }
    
    animateLifeSimulation(timestamp) {
        if (!this.lastGameUpdateTime) this.lastGameUpdateTime = timestamp;
        
        const elapsedTime = timestamp - this.lastGameUpdateTime;
        
        if (elapsedTime > this.gameUpdateInterval) {
            this.updateLifeGeneration();
            this.drawLifeGrid();
            this.lastGameUpdateTime = timestamp;
        }
        
        if (this.isGameRunning) {
            this.gameAnimationId = requestAnimationFrame(this.animateLifeSimulation.bind(this));
        }
    }
    
    startLifeSimulation() {
        if (!this.isGameRunning) {
            this.isGameRunning = true;
            this.gameAnimationId = requestAnimationFrame(this.animateLifeSimulation.bind(this));
        }
    }
    
    pauseLifeSimulation() {
        this.isGameRunning = false;
        if (this.gameAnimationId) {
            cancelAnimationFrame(this.gameAnimationId);
            this.gameAnimationId = null;
        }
    }
    
    resetLifeSimulation(pattern = 'glider') {
        this.pauseLifeSimulation();
        this.addLifePattern(pattern);
        this.drawLifeGrid();
    }
}

// Initialize Game of Life when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const firstProjectBlock = document.querySelector('.project-block:first-child');
    
    if (firstProjectBlock) {
        // Clear any existing content
        firstProjectBlock.innerHTML = '';
        
        // Create container for the game
        const conwayGameContainer = document.createElement('div');
        conwayGameContainer.className = 'conway-game-container';
        
        // Create title
        const gameTitle = document.createElement('h3');
        gameTitle.className = 'project-title';
        gameTitle.textContent = "Conway's Game of Life";
        
        // Create canvas for the game
        const conwayCanvas = document.createElement('canvas');
        conwayCanvas.width = 300;
        conwayCanvas.height = 400;
        conwayCanvas.className = 'conway-game-canvas';
        
        // Create controls
        const gameControls = document.createElement('div');
        gameControls.className = 'conway-game-controls';
        
        const playPauseButton = document.createElement('button');
        playPauseButton.className = 'conway-game-btn play-pause';
        playPauseButton.innerHTML = '▶';
        
        const resetButton = document.createElement('button');
        resetButton.className = 'conway-game-btn reset';
        resetButton.innerHTML = '↻';
        
        const patternSelector = document.createElement('select');
        patternSelector.className = 'conway-pattern-select';
        
        const lifePatterns = [
            { value: 'glider', text: 'Glider' },
            { value: 'pulsar', text: 'Pulsar' },
            { value: 'random', text: 'Random' }
        ];
        
        lifePatterns.forEach(pattern => {
            const option = document.createElement('option');
            option.value = pattern.value;
            option.text = pattern.text;
            patternSelector.appendChild(option);
        });
        
        // Append elements
        gameControls.appendChild(playPauseButton);
        gameControls.appendChild(resetButton);
        gameControls.appendChild(patternSelector);
        
        conwayGameContainer.appendChild(gameTitle);
        conwayGameContainer.appendChild(conwayCanvas);
        conwayGameContainer.appendChild(gameControls);
        
        firstProjectBlock.appendChild(conwayGameContainer);
        
        // Initialize game
        const conwayGame = new ConwayGameOfLife(conwayCanvas, 10, 8);
        conwayGame.drawLifeGrid();
        
        // Add event listeners
        playPauseButton.addEventListener('click', function() {
            if (conwayGame.isGameRunning) {
                conwayGame.pauseLifeSimulation();
                playPauseButton.innerHTML = '▶';
            } else {
                conwayGame.startLifeSimulation();
                playPauseButton.innerHTML = '❚❚';
            }
        });
        
        resetButton.addEventListener('click', function() {
            conwayGame.resetLifeSimulation(patternSelector.value);
            if (!conwayGame.isGameRunning) {
                playPauseButton.innerHTML = '▶';
            }
        });
        
        patternSelector.addEventListener('change', function() {
            conwayGame.resetLifeSimulation(this.value);
        });
    }
});

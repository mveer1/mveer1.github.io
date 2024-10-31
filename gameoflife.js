const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400; // Increased width
canvas.height = 600; // Increased height

const resolution = 5; // Smaller pixel size
const COLS = (canvas.width - 20) / resolution;
const ROWS = (canvas.height - 20) / resolution;

let grid = buildGrid();
let running = false;

// Function to build the initial grid with 500 random active cells
function buildGrid() {
    const grid = new Array(COLS).fill(null)
        .map(() => new Array(ROWS).fill(0)); // Initialize all cells as dead

    const activeCells = 500; // Number of active cells to generate

    let count = 0;
    while (count < activeCells) {
        const x = Math.floor(Math.random() * COLS); // Random position across the entire grid
        const y = Math.floor(Math.random() * ROWS); // Random position across the entire grid

        // Ensure we don't activate the same cell multiple times
        if (grid[x][y] === 0) {
            grid[x][y] = 1; // Activate the cell
            count++;
        }
    }
    
    return grid;
}

// Function to render the grid on the canvas
function renderGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid.forEach((col, x) => {
        col.forEach((cell, y) => {
            ctx.fillStyle = cell ? "#808080" : "#2d2d2d"; // Gray for live cells, black for dead cells
            ctx.fillRect(x * resolution, y * resolution, resolution, resolution);
        });
    });
}

// Function to calculate the next generation based on current grid state
function nextGeneration(grid) {
    const newGrid = grid.map(arr => [...arr]);
    for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[x].length; y++) {
            const neighbors = countNeighbors(grid, x, y);
            if (grid[x][y] === 1 && (neighbors < 2 || neighbors > 3)) {
                newGrid[x][y] = 0; // Cell dies
            } else if (grid[x][y] === 0 && neighbors === 3) {
                newGrid[x][y] = 1; // Cell is born
            }
        }
    }
    return newGrid;
}

// Function to count live neighbors around a cell
function countNeighbors(grid, x, y) {
    const offsets = [-1, 0, 1];
    return offsets.reduce((acc, dx) => {
        return acc + offsets.reduce((innerAcc, dy) => {
            if (dx === 0 && dy === 0) return innerAcc; // Skip the cell itself
            const col = x + dx;
            const row = y + dy;
            return innerAcc + (grid[col] && grid[col][row] ? 1 : 0);
        }, 0);
    }, 0);
}

// Slower update using setTimeout instead of requestAnimationFrame
let updateDelay = 500; // Delay in milliseconds (slower than before)

function update() {
    if (!running) return;
    grid = nextGeneration(grid);
    renderGrid();

    // Check if the grid is stable or oscillating
    if (isStable(grid)) {
        resetGrid();
    }

    setTimeout(update, updateDelay); // Use setTimeout to control update speed
}

// Function to check if the grid configuration is stable or oscillating
function isStable(grid) {
    // Check for oscillations or stable configurations (basic check)
    return grid.flat().every(cell => cell === 0) || grid.flat().some((cell, i) => i > 0 && cell === grid.flat()[i - 1]);
}

// Function to reset the grid with a new random configuration
function resetGrid() {
    grid = buildGrid(); // Reset with a new random configuration
}

// Function to toggle the game state between running and paused
function toggleGame() {
    running = !running;
    if (running) update();
}

// Initial render of the grid
renderGrid();

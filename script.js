const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TETROMINOS = {
    I: { shape: [[1,1,1,1]], color: 'I' },
    O: { shape: [[1,1],[1,1]], color: 'O' },
    T: { shape: [[0,1,0],[1,1,1]], color: 'T' },
    S: { shape: [[0,1,1],[1,1,0]], color: 'S' },
    Z: { shape: [[1,1,0],[0,1,1]], color: 'Z' },
    J: { shape: [[1,0,0],[1,1,1]], color: 'J' },
    L: { shape: [[0,0,1],[1,1,1]], color: 'L' }
};

// Wall kick data untuk Super Rotation System (SRS)
const WALL_KICKS = {
    // Normal pieces (T, S, Z, J, L)
    normal: {
        '0->1': [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '1->0': [[1, 0], [1, 1], [0, -2], [1, -2]],
        '1->2': [[1, 0], [1, 1], [0, -2], [1, -2]],
        '2->1': [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '2->3': [[1, 0], [1, -1], [0, 2], [1, 2]],
        '3->2': [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '3->0': [[-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '0->3': [[1, 0], [1, -1], [0, 2], [1, 2]]
    },
    // I piece has different wall kicks
    I: {
        '0->1': [[-2, 0], [1, 0], [-2, 1], [1, -2]],
        '1->0': [[2, 0], [-1, 0], [2, -1], [-1, 2]],
        '1->2': [[-1, 0], [2, 0], [-1, -2], [2, 1]],
        '2->1': [[1, 0], [-2, 0], [1, 2], [-2, -1]],
        '2->3': [[2, 0], [-1, 0], [2, -1], [-1, 2]],
        '3->2': [[-2, 0], [1, 0], [-2, 1], [1, -2]],
        '3->0': [[1, 0], [-2, 0], [1, 2], [-2, -1]],
        '0->3': [[-1, 0], [2, 0], [-1, -2], [2, 1]]
    }
};

let board = [];
let currentPiece = null;
let currentX = 0;
let currentY = 0;
let currentRotation = 0;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let isPaused = false;
let dropInterval = null;
let currentPlayerName = '';
let combo = 0;
let comboTimeout = null;

// Store data in memory instead of localStorage
let leaderboardData = [];

// Input control variables - PERBAIKAN SISTEM HOLD
let inputState = {
    left: false,
    right: false,
    down: false,
    up: false,
    space: false
};

let inputIntervals = {
    left: null,
    right: null,
    down: null
};

let inputTimers = {
    left: null,
    right: null,
    down: null,
    up: null,
    space: null
};

// Timing constants
const INITIAL_DELAY = 170; // Delay sebelum repeat dimulai
const REPEAT_RATE = 50; // Kecepatan repeat untuk left/right
const SOFT_DROP_RATE = 30; // Kecepatan soft drop (down)
const ACTION_COOLDOWN = 120; // Cooldown untuk rotate dan hard drop

// Leaderboard functions
function saveLeaderboard(leaderboard) {
    try {
        localStorage.setItem('tetris_leaderboard', JSON.stringify(leaderboard));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

let isInitialized = false;

async function initializeGame() {
    if (isInitialized) return; // Hindari duplikasi
    
    isInitialized = true;
    initializeEventListeners();
    init();
    
    // Load leaderboard dari server
    try {
        leaderboardData = await loadLeaderboardFromServer();
        updateLeaderboardDisplay();
    } catch (error) {
        console.error('Error loading initial leaderboard:', error);
        leaderboardData = [];
    }
}   

async function loadLeaderboardFromServer() {
    try {
        const response = await fetch('http://localhost:3000/leaderboard');
        if (response.ok) {
            const serverData = await response.json();
            return serverData || [];
        } else {
            // Fallback ke localStorage jika server tidak available
            const backup = localStorage.getItem('tetris_leaderboard');
            return backup ? JSON.parse(backup) : [];
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        // Fallback ke localStorage
        const backup = localStorage.getItem('tetris_leaderboard');
        return backup ? JSON.parse(backup) : [];
    }
}

function addToLeaderboard(name, score, lines, level) {
    const newEntry = {
        name: name,
        score: score,
        lines: lines,
        level: level,
        date: new Date().toISOString()
    };
    
    // PERBAIKAN: Cek duplikat berdasarkan name, score, dan waktu yang mirip
    const isDuplicate = leaderboardData.some(entry => 
        entry.name === newEntry.name && 
        entry.score === newEntry.score &&
        Math.abs(new Date(entry.date) - new Date(newEntry.date)) < 5000 // 5 detik tolerance
    );
    
    if (!isDuplicate) {
        leaderboardData.push(newEntry);
        leaderboardData.sort((a, b) => b.score - a.score);
        updateLeaderboardDisplay();
    }
}

function updateLeaderboardDisplay() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = '';
    
    // Urutkan leaderboard berdasarkan skor tertinggi
    leaderboardData.sort((a, b) => b.score - a.score);
    
    // Ambil top 10
    const top10 = leaderboardData.slice(0, 10);
    
    top10.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        
        li.innerHTML = `
            <span class="leaderboard-rank">${index + 1}.</span>
            <span class="leaderboard-name">${entry.name}</span>
            <span class="leaderboard-score">${entry.score}</span>
        `;
        
        leaderboardList.appendChild(li);
    });

    // Jika ada pemain saat ini, tampilkan juga
    if (currentPlayerName && score > 0) {
        const playerRank = leaderboardData.findIndex(entry => 
            entry.name === currentPlayerName && entry.score === score
        ) + 1;

        if (playerRank > 10) {
            const li = document.createElement('li');
            li.className = 'leaderboard-item current-player';
            li.innerHTML = `
                <span class="leaderboard-rank">${playerRank}.</span>
                <span class="leaderboard-name">${currentPlayerName}</span>
                <span class="leaderboard-score">${score}</span>
            `;
            leaderboardList.appendChild(li);
        }
    }
}
// PERBAIKAN SISTEM INPUT - FUNGSI HOLD
function startHoldAction(action) {
    if (inputTimers[action]) return; // Sudah aktif
    
    // Eksekusi sekali langsung
    executeAction(action);
    
    // Set timer untuk delay awal
    inputTimers[action] = setTimeout(() => {
        // Mulai interval repeat
        inputIntervals[action] = setInterval(() => {
            if (inputState[action] && gameRunning && !isPaused) {
                executeAction(action);
            }
        }, getRepeatRate(action));
    }, INITIAL_DELAY);
}

function stopHoldAction(action) {
    if (inputTimers[action]) {
        clearTimeout(inputTimers[action]);
        inputTimers[action] = null;
    }
    
    if (inputIntervals[action]) {
        clearInterval(inputIntervals[action]);
        inputIntervals[action] = null;
    }
}

function getRepeatRate(action) {
    switch(action) {
        case 'left':
        case 'right':
            return REPEAT_RATE;
        case 'down':
            return SOFT_DROP_RATE;
        default:
            return REPEAT_RATE;
    }
}

function executeAction(action) {
    if (!gameRunning || isPaused) return;
    
    switch(action) {
        case 'left':
            if (!isCollision(currentX - 1, currentY, currentPiece.shape)) {
                currentX--;
                render();
            }
            break;
        case 'right':
            if (!isCollision(currentX + 1, currentY, currentPiece.shape)) {
                currentX++;
                render();
            }
            break;
        case 'down':
            if (!isCollision(currentX, currentY + 1, currentPiece.shape)) {
                currentY++;
                render();
            }
            break;
        case 'up':
            if (tryRotate()) {
                render();
            }
            break;
        case 'space':
            // Hard drop
            let dropDistance = 0;
            while (!isCollision(currentX, currentY + 1, currentPiece.shape)) {
                currentY++;
                dropDistance++;
            }
            if (dropDistance > 0) {
                updateDisplay();
            }
            drop();
            break;
    }
}

// Combo system
function showCombo(comboCount) {
    const comboDisplay = document.getElementById('comboDisplay');
    if (!comboDisplay) return;
    
    comboDisplay.innerHTML = `<div class="combo-text">COMBO x${comboCount}!</div>`;
    
    setTimeout(() => {
        comboDisplay.innerHTML = '';
    }, 2000);
}

function showComboBreak() {
    const comboDisplay = document.getElementById('comboDisplay');
    if (!comboDisplay) return;
    
    comboDisplay.innerHTML = `<div class="combo-break">Combo Broken!</div>`;
    
    setTimeout(() => {
        comboDisplay.innerHTML = '';
    }, 1500);
}

function resetCombo() {
    if (combo > 1) {
        showComboBreak();
    }
    combo = 0;
    if (comboTimeout) {
        clearTimeout(comboTimeout);
        comboTimeout = null;
    }
}

// Initialize game
function init() {
    createBoard();
    createGrid();
    nextPiece = getRandomPiece();
    spawnPiece();
    updateDisplay();
    updateLeaderboardDisplay();
    startGame();
}

function createBoard() {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
}

function createGrid() {
    const grid = document.getElementById('grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 0; i < BOARD_HEIGHT * BOARD_WIDTH; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        grid.appendChild(cell);
    }
}

function getRandomPiece() {
    const pieces = Object.keys(TETROMINOS);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return TETROMINOS[randomPiece];
}

function spawnPiece() {
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();
    currentX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.shape[0].length / 2);
    currentY = 0;
    currentRotation = 0;
    
    if (isCollision(currentX, currentY, currentPiece.shape)) {
        gameOver();
        return;
    }
    
    updateNextPiece();
}

function updateNextPiece() {
    const nextGrid = document.getElementById('nextPiece');
    if (!nextGrid) return;
    
    nextGrid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'next-cell';
        nextGrid.appendChild(cell);
    }

    if (!nextPiece) return;

    const shape = nextPiece.shape;
    const shapeHeight = shape.length;
    const shapeWidth = shape[0].length;
    const offsetY = Math.floor((4 - shapeHeight) / 2);
    const offsetX = Math.floor((4 - shapeWidth) / 2);

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const gridY = y + offsetY;
                const gridX = x + offsetX;
                const index = gridY * 4 + gridX;
                const cell = nextGrid.children[index];
                if (cell) {
                    cell.classList.add('filled', nextPiece.color);
                }
            }
        }
    }
}

function isCollision(x, y, shape) {
    for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[dy].length; dx++) {
            if (shape[dy][dx]) {
                const newX = x + dx;
                const newY = y + dy;
                
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function placePiece() {
    const shape = currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardY = currentY + y;
                const boardX = currentX + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
}

function clearLines() {
    let completedRows = [];
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            completedRows.push(y);
        }
    }
    
    if (completedRows.length > 0) {
        // Handle combo system
        combo++;
        if (combo > 1) {
            showCombo(combo);
        }
        
        // Reset combo timeout
        if (comboTimeout) {
            clearTimeout(comboTimeout);
        }
        comboTimeout = setTimeout(() => {
            resetCombo();
        }, 3000);

        completedRows.forEach(y => {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cellIndex = y * BOARD_WIDTH + x + 1;
                const cell = document.querySelector(`#grid .cell:nth-child(${cellIndex})`);
                if (cell) {
                    cell.classList.add('line-complete');
                }
            }
        });
        
        setTimeout(() => {
            document.querySelectorAll('.line-complete').forEach(cell => {
                cell.classList.remove('line-complete');
            });
            
            completedRows.sort((a, b) => b - a);
            completedRows.forEach(y => {
                board.splice(y, 1);
                board.unshift(Array(BOARD_WIDTH).fill(0));
            });
            
            const linesCleared = completedRows.length;
            lines += linesCleared;
            level = Math.floor(lines / 10) + 1;
            
            const basePoints = [0, 40, 100, 300, 1200][linesCleared] || 1200;
            const comboBonus = combo > 1 ? (combo - 1) * 50 : 0;
            const earnedPoints = (basePoints + comboBonus) * level;
            score += earnedPoints;
            
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                scoreElement.classList.add('score-flash');
                setTimeout(() => scoreElement.classList.remove('score-flash'), 200);
            }
            
            updateDisplay();
            render();
            
            if (gameRunning) {
                clearInterval(dropInterval);
                startGameLoop();
            }
        }, 150);
    } else {
        // No lines cleared, reset combo after timeout
        if (comboTimeout) {
            clearTimeout(comboTimeout);
        }
        comboTimeout = setTimeout(() => {
            resetCombo();
        }, 2000);
    }
}

// FUNGSI ROTASI YANG DIPERBAIKI
function rotatePiece(shape) {
    const rotated = [];
    const rows = shape.length;
    const cols = shape[0].length;
    
    // Rotasi clockwise 90 derajat
    for (let x = 0; x < cols; x++) {
        rotated[x] = [];
        for (let y = rows - 1; y >= 0; y--) {
            rotated[x][cols - 1 - y] = shape[y][x];
        }
    }
    
    return rotated;
}

// Fungsi untuk mendapatkan semua rotasi dari sebuah piece
function getAllRotations(basePiece) {
    const rotations = [basePiece.shape];
    let currentShape = basePiece.shape;
    
    // Generate 4 rotasi (0°, 90°, 180°, 270°)
    for (let i = 1; i < 4; i++) {
        currentShape = rotatePiece(currentShape);
        rotations.push(JSON.parse(JSON.stringify(currentShape))); // Deep copy
    }
    
    return rotations;
}

// Fungsi untuk mencoba rotasi dengan wall kick
function tryRotate() {
    if (!currentPiece) return false;
    
    // Piece O tidak perlu dirotasi
    if (currentPiece.color === 'O') return false;
    
    const newRotation = (currentRotation + 1) % 4;
    const allRotations = getAllRotations(currentPiece);
    const newShape = allRotations[newRotation];
    
    // Coba rotasi tanpa wall kick terlebih dahulu
    if (!isCollision(currentX, currentY, newShape)) {
        currentPiece.shape = newShape;
        currentRotation = newRotation;
        return true;
    }
    
    // Jika gagal, coba dengan wall kick
    const wallKickData = currentPiece.color === 'I' ? WALL_KICKS.I : WALL_KICKS.normal;
    const kickKey = `${currentRotation}->${newRotation}`;
    const kicks = wallKickData[kickKey] || [];
    
    for (const [dx, dy] of kicks) {
        const testX = currentX + dx;
        const testY = currentY + dy;
        
        if (!isCollision(testX, testY, newShape)) {
            currentPiece.shape = newShape;
            currentRotation = newRotation;
            currentX = testX;
            currentY = testY;
            return true;
        }
    }
    
    return false;
}

function render() {
    const cells = document.querySelectorAll('#grid .cell');
    
    cells.forEach(cell => {
        cell.className = 'cell';
    });
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const cell = cells[y * BOARD_WIDTH + x];
            if (cell && board[y][x]) {
                cell.classList.add('filled', board[y][x]);
            }
        }
    }
    
    if (currentPiece) {
        const shape = currentPiece.shape;
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardY = currentY + y;
                    const boardX = currentX + x;
                    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                        const cell = cells[boardY * BOARD_WIDTH + boardX];
                        if (cell) {
                            cell.classList.add('active', currentPiece.color);
                        }
                    }
                }
            }
        }
    }
}

function updateDisplay() {
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    
    if (scoreElement) scoreElement.textContent = score;
    if (levelElement) levelElement.textContent = level;
    if (linesElement) linesElement.textContent = lines;
}

function drop() {
    if (isCollision(currentX, currentY + 1, currentPiece.shape)) {
        placePiece();
        clearLines();
        spawnPiece();
    } else {
        currentY++;
    }
    render();
}

function startGame() {
    gameRunning = true;
    startGameLoop();
}

function startGameLoop() {
    clearInterval(dropInterval);
    const dropTime = Math.max(50, 1000 - (level - 1) * 100);
    dropInterval = setInterval(() => {
        if (!isPaused && gameRunning) {
            drop();
        }
    }, dropTime);
}

function gameOver() {
    gameRunning = false;
    clearInterval(dropInterval);
    
    // Stop all input actions
    Object.keys(inputState).forEach(action => {
        inputState[action] = false;
        stopHoldAction(action);
    });
    
    const finalScoreElement = document.getElementById('finalScore');
    const finalLinesElement = document.getElementById('finalLines');
    const finalLevelElement = document.getElementById('finalLevel');
    const gameOverElement = document.getElementById('gameOver');
    const playerNameElement = document.getElementById('playerName');
    
    if (finalScoreElement) finalScoreElement.textContent = score;
    if (finalLinesElement) finalLinesElement.textContent = lines;
    if (finalLevelElement) finalLevelElement.textContent = level;
    if (gameOverElement) gameOverElement.style.display = 'flex';
    if (playerNameElement) playerNameElement.focus();
}


// PERBAIKAN 1: Fungsi submitScore() - Hindari duplikasi
async function submitScore() {
    const nameInput = document.getElementById('playerName');
    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name || name === '') {
        alert("Please enter your name.");
        nameInput.focus();
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/submit-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                score,
                lines,
                level
            })
        });

        if (response.ok) {
            // PERBAIKAN: Reload data dari server instead of adding locally
            leaderboardData = await loadLeaderboardFromServer();
            updateLeaderboardDisplay();
            
            // Hide submit button setelah berhasil submit
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) submitBtn.style.display = 'none';
        } else {
            // Fallback: tambah ke local jika server gagal
            addToLeaderboard(name, score, lines, level);
        }
    } catch (error) {
        console.error('Error submitting score:', error);
        alert("Network error. Score saved locally.");
        // Fallback: tambah ke local jika network error
        addToLeaderboard(name, score, lines, level);
    }
}

function restartGame() {
    const gameOverElement = document.getElementById('gameOver');
    const submitBtn = document.getElementById('submitBtn');
    const playerNameElement = document.getElementById('playerName');
    const pauseBtn = document.getElementById('pauseBtn');
    const pauseOverlay = document.getElementById('pauseOverlay');
    
    if (gameOverElement) gameOverElement.style.display = 'none';
    if (submitBtn) {
        submitBtn.style.display = 'inline-block'; // PERBAIKAN: Tampilkan kembali submit button
        submitBtn.disabled = false; // PERBAIKAN: Enable button
    }
    if (playerNameElement) playerNameElement.value = '';
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    
    score = 0;
    level = 1;
    lines = 0;
    combo = 0;
    isPaused = false;
    currentPlayerName = '';
    currentRotation = 0;
    
    // Reset input state
    Object.keys(inputState).forEach(action => {
        inputState[action] = false;
        stopHoldAction(action);
    });
    
    clearInterval(dropInterval);
    if (comboTimeout) {
        clearTimeout(comboTimeout);
        comboTimeout = null;
    }
    init();
}

function togglePause() {
    if (!gameRunning) return;
    
    isPaused = !isPaused;
    
    const pauseBtn = document.getElementById('pauseBtn');
    const pauseOverlay = document.getElementById('pauseOverlay');
    
    if (pauseBtn) pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    if (pauseOverlay) pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    
    // Stop all input actions when paused
    if (isPaused) {
        Object.keys(inputState).forEach(action => {
            stopHoldAction(action);
        });
    }
}

// Initialize event listeners when DOM is ready
function initializeEventListeners() {
    // PERBAIKAN KEYBOARD CONTROLS - SISTEM HOLD YANG PROPER
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
        
        if (!gameRunning || isPaused) return;
        
        let action = null;
        switch(e.key) {
            case 'ArrowLeft':
                action = 'left';
                break;
            case 'ArrowRight':
                action = 'right';
                break;
            case 'ArrowDown':
                action = 'down';
                break;
            case 'ArrowUp':
                action = 'up';
                break;
            case ' ':
                action = 'space';
                break;
        }
        
        if (action && !inputState[action]) {
            inputState[action] = true;
            
            if (action === 'up' || action === 'space') {
                // Rotate dan hard drop hanya sekali dengan cooldown
                if (!inputTimers[action]) {
                    executeAction(action);
                    inputTimers[action] = setTimeout(() => {
                        inputTimers[action] = null;
                    }, ACTION_COOLDOWN);
                }
            } else {
                // Left, right, down bisa hold
                startHoldAction(action);
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
        
        let action = null;
        switch(e.key) {
            case 'ArrowLeft':
                action = 'left';
                break;
            case 'ArrowRight':
                action = 'right';
                break;
            case 'ArrowDown':
                action = 'down';
                break;
            case 'ArrowUp':
                action = 'up';
                break;
            case ' ':
                action = 'space';
                break;
        }
        
        if (action) {
            inputState[action] = false;
            stopHoldAction(action);
        }
    });

    // PERBAIKAN TOUCH CONTROLS - MIRIP DENGAN SISTEM HOLD
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchMoved = false;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        touchMoved = false;
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        touchMoved = true;
        e.preventDefault();
    });

    document.addEventListener('touchend', (e) => {
        if (!gameRunning || isPaused || touchMoved) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const touchDuration = Date.now() - touchStartTime;
        
        // Tap (short touch) vs Hold (long touch)
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            // Horizontal swipe
            if (deltaX > 0) {
                executeAction('right');
            } else {
                executeAction('left');
            }
        } else if (Math.abs(deltaY) > minSwipeDistance) {
            // Vertical swipe
            if (deltaY > 0) {
                executeAction('down');
            } else {
                executeAction('up'); // Swipe up untuk rotate
            }
        } else if (touchDuration < 200) {
            // Quick tap untuk rotate
            executeAction('up');
        } else {
            // Long tap untuk hard drop
            executeAction('space');
        }
        
        e.preventDefault();
    });

    // Player name enter key handler
    const playerNameElement = document.getElementById('playerName');
    if (playerNameElement) {
        playerNameElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitScore();
            }
        });
    }
    
    // Pause key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            togglePause();
        }
    });
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded',async() => {
    initializeEventListeners();
    init();
    leaderboardData = await loadLeaderboardFromServer(); // ambil dari server
    updateLeaderboardDisplay(); // Memastikan leaderboard langsung muncul
});

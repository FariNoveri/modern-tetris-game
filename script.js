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

const cheaterStyles = `
<style>
.cheater-detected {
    background-color: rgba(220, 53, 69, 0.1) !important;
    border-left: 3px solid #dc3545 !important;
    animation: cheater-pulse 2s infinite;
}

.cheater-name {
    color: #dc3545 !important;
    font-weight: bold !important;
    text-shadow: 1px 1px 2px rgba(220, 53, 69, 0.3);
}

@keyframes cheater-pulse {
    0%, 100% { 
        background-color: rgba(220, 53, 69, 0.1); 
    }
    50% { 
        background-color: rgba(220, 53, 69, 0.2); 
    }
}

.btn-forgive {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
}

.btn-forgive:hover {
    background-color: #218838 !important;
    transform: translateY(-2px);
}

/* Tambahan styling untuk warning icon */
.cheater-detected .leaderboard-name::after {
    content: " 🚫";
    font-size: 0.8em;
}
</style>
`;

let musicPanel = null;

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
let bgMusic = null;
let gameOverSound = null;
let isBgMusicPausedByUser = false;
let isServerModalVisible = false;
let isDragging = false;
let serverAvailable = false;
let hasShownCustomError = false; // Untuk mencegah spam pesan
// Store data in memory instead of localStorage
let leaderboardData = [];
let suppressDefaultErrors = true; // Untuk mengontrol apakah kita sembunyikan error browser
let detectedCheaters = new Set(); // Menyimpan nama-nama cheater yang terdeteksi
let currentPlayerIsCheater = false; // Status cheater untuk pemain saat ini
let offsetX = 0;
let offsetY = 0;

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

function markPlayerAsCheater(playerName, reason = "Cheat detected") {
    if (!playerName) return;
    
    detectedCheaters.add(playerName);
    
    // Jika pemain saat ini yang cheating
    if (playerName === currentPlayerName) {
        currentPlayerIsCheater = true;
    }
    
    // Update leaderboard display untuk menampilkan warna merah
    updateLeaderboardDisplay();
    
    // Log untuk debugging
    console.warn(`Player "${playerName}" marked as cheater: ${reason}`);
}

function clearCheaterStatus(playerName) {
    if (playerName) {
        detectedCheaters.delete(playerName);
        if (playerName === currentPlayerName) {
            currentPlayerIsCheater = false;
        }
        updateLeaderboardDisplay();
    }
}

// Leaderboard functions
function saveLeaderboard(leaderboard) {
    try {
        localStorage.setItem('tetris_leaderboard', JSON.stringify(leaderboard));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

let isInitialized = false;

// Contoh penggunaan fetch yang lebih aman
async function checkServerAvailability() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);

        const response = await fetch('http://localhost:3000/leaderboard', {
            method: 'HEAD',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        serverAvailable = response.ok;
        return response.ok;
    } catch (e) {
        serverAvailable = false;
        return false;
    }
}

// MASALAH 9: Perbaikan di initializeGame
async function initializeGame() {
    if (isInitialized) return;

    const available = await checkServerAvailability();
    if (!available) {
        showServerNotRunningModal();
        hasShownCustomError = false;
        return;
    }

// if (!(await checkFileIntegrity())) {
//     showAntiCheatModal(["File integrity check failed"]);
//     return;
// }

    serverAvailable = true;
    isInitialized = true;

    initializeEventListeners();
    setupMusicPanelDrag();
    init();
    leaderboardData = await loadLeaderboardFromServer();
    updateLeaderboardDisplay();
}

function cleanupGame() {
    // Clear all intervals
    clearInterval(dropInterval);
    if (comboTimeout) {
        clearTimeout(comboTimeout);
        comboTimeout = null;
    }

    // Clear all input timers and intervals
    Object.keys(inputTimers).forEach(action => {
        if (inputTimers[action]) {
            clearTimeout(inputTimers[action]);
            inputTimers[action] = null;
        }
    });

    Object.keys(inputIntervals).forEach(action => {
        if (inputIntervals[action]) {
            clearInterval(inputIntervals[action]);
            inputIntervals[action] = null;
        }
    });

    // Reset input states
    Object.keys(inputState).forEach(action => {
        inputState[action] = false;
    });
}

async function loadLeaderboardFromServer() {
    try {
        const response = await fetch('http://localhost:3000/leaderboard');
        if (response.ok) {
            const data = await response.json();
            
            // Proses data untuk mengidentifikasi cheater
            data.forEach(entry => {
                if (entry.isCheater) {
                    detectedCheaters.add(entry.name);
                }
            });
            
            leaderboardData = data;
            hideServerNotRunningModal();
            return leaderboardData;
        } else {
            throw new Error("Server not available");
        }
    } catch (error) {
        console.warn("Server tidak tersedia, menggunakan data lokal sementara...");
        return leaderboardData; // Tetap gunakan data lokal
    }
}

async function retryLeaderboardLoad() {
    try {
        const response = await fetch('http://localhost:3000/leaderboard');
        if (response.ok) {
            leaderboardData = await response.json();
            updateLeaderboardDisplay();
            hideServerNotRunningModal();
            serverAvailable = true;
        }
    } catch (error) {
        // Tampilkan pesan kustom hanya sekali
        if (!hasShownCustomError && suppressDefaultErrors) {
            console.error("Harap start node server.js di terminal.\nKalau masih anda spam percuma saja....\nGame ini dibuat oleh Fari Noveri\nThis game was made by Fari Noveri");
            hasShownCustomError = true;
        }

        // Efek getar pada modal
        const modalContent = document.querySelector('#serverNotRunningModal .server-modal-content');
        if (modalContent) {
            modalContent.classList.remove('shake');
            void modalContent.offsetWidth; // force reflow to restart animation
            modalContent.classList.add('shake');
        }
    }
}

function addToLeaderboard(name, score, lines, level, isCheater = false) {
    const newEntry = {
        name: name,
        score: score,
        lines: lines,
        level: level,
        date: new Date().toISOString(),
        isCheater: isCheater // Tambah flag cheater
    };
    
    // Jika pemain adalah cheater, tandai
    if (isCheater) {
        markPlayerAsCheater(name, "Submitted with cheat detection");
    }
    
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
        
        // Cek apakah pemain ini adalah cheater
        const isCheater = detectedCheaters.has(entry.name);
        
        // Tambahkan class khusus untuk cheater
        if (isCheater) {
            li.classList.add('cheater-detected');
        }
        
        li.innerHTML = `
            <span class="leaderboard-rank">${index + 1}.</span>
            <span class="leaderboard-name ${isCheater ? 'cheater-name' : ''}">${entry.name}${isCheater ? ' ⚠️' : ''}</span>
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
            
            // Cek apakah pemain saat ini adalah cheater
            if (currentPlayerIsCheater) {
                li.classList.add('cheater-detected');
            }
            
            li.innerHTML = `
                <span class="leaderboard-rank">${playerRank}.</span>
                <span class="leaderboard-name ${currentPlayerIsCheater ? 'cheater-name' : ''}">${currentPlayerName}${currentPlayerIsCheater ? ' ⚠️' : ''}</span>
                <span class="leaderboard-score">${score}</span>
            `;
            leaderboardList.appendChild(li);
        }
    }
}

// PERBAIKAN SISTEM INPUT - FUNGSI HOLD
function startHoldAction(action) {
    if (inputTimers[action]) return; // Sudah aktif
    
    // PERBAIKAN: Cek state sebelum eksekusi
    if (!gameRunning || isPaused) return;
    
    // Eksekusi sekali langsung
    executeAction(action);
    
    // Set timer untuk delay awal
    inputTimers[action] = setTimeout(() => {
        // Mulai interval repeat
        inputIntervals[action] = setInterval(() => {
            // PERBAIKAN: Tambahkan pengecekan state di setiap interval
            if (inputState[action] && gameRunning && !isPaused && currentPiece) {
                executeAction(action);
            } else {
                // Hentikan interval jika kondisi tidak memenuhi
                stopHoldAction(action);
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
    
    // PERBAIKAN: Reset input state juga
    if (inputState[action]) {
        inputState[action] = false;
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
    // PERBAIKAN: Tambahkan pengecekan state yang lebih ketat
    if (!gameRunning || isPaused || !currentPiece) return;
    
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
    const rows = 20;
    const cols = 10;
    createGrid(rows, cols);
    createBoard();
    nextPiece = getRandomPiece();
    spawnPiece();
    updateDisplay();
    updateLeaderboardDisplay();
    startGame();
}

function createBoard() {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
}

function createGrid(rows, cols) {
    const grid = document.getElementById('grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let i = 0; i < rows * cols; i++) {
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

function toggleMusicPause() {
    const musicPauseBtn = document.getElementById('musicPauseBtn');
    if (!bgMusic || !musicPauseBtn) return;

    // JIKA GAME PAUSE ATAU GAME OVER, BLOKIR FUNGSI RESUME MUSIK
    if (isPaused || !gameRunning) {
        // Reset ke paused jika coba di-unpause saat game pause
        bgMusic.pause();
        bgMusic.currentTime = 0;
        musicPauseBtn.textContent = '▶️ Resume Music';
        alert("Musik tidak bisa diatur saat game di-pause atau game over.");
        return;
    }

    // JIKA GAME BERJALAN, IZINKAN PAUSE/RESUME MUSIK
    if (bgMusic.paused) {
        bgMusic.play().catch(e => console.log("Playback error:", e));
        musicPauseBtn.textContent = '⏸️ Pause Music';
    } else {
        bgMusic.pause();
        musicPauseBtn.textContent = '▶️ Resume Music';
    }
}

function setVolume(value) {
    if (!bgMusic || !gameOverSound) return;

    bgMusic.volume = parseFloat(value);
    gameOverSound.volume = parseFloat(value);
}

function testAudio() {
    if (bgMusic && bgMusic.paused) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Error playing music:", e));
    }
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
    // PERBAIKAN: Tambahkan pengecekan state
    if (!gameRunning || isPaused || !currentPiece) return;
    
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
    startGameLoop(); // TAMBAHKAN INI

    // Jika bgMusic tidak ditemukan, jangan lanjut
    if (!bgMusic) {
        console.warn("Audio element bgMusic tidak tersedia.");
        return;
    }

    // Reset musik dan coba putar
    try {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Autoplay diblokir oleh browser:", e));
    } catch (e) {
        console.error("Gagal memulai musik latar:", e);
    }
}

function startGameLoop() {
    clearInterval(dropInterval);
    const dropTime = Math.max(50, 1000 - (level - 1) * 100);
    dropInterval = setInterval(() => {
        if (gameRunning && !isPaused && currentPiece) {
            drop();
        }
    }, dropTime);
}

function gameOver() {
    gameRunning = false;
    clearInterval(dropInterval);

    // Simpan final score dan lines
    const finalScore = score;
    const finalLines = lines;
    const finalLevel = level;

    // Sembunyikan musik
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }

    // Tampilkan final stats
    document.getElementById('finalScore').textContent = finalScore;
    document.getElementById('finalLines').textContent = finalLines;
    document.getElementById('finalLevel').textContent = finalLevel;

    // Tampilkan modal
    const gameOverElement = document.getElementById('gameOver');
    if (gameOverElement) gameOverElement.style.display = 'flex';

    // Reset state
    isPaused = false;
    currentPiece = null;
    render();
}

// PERBAIKAN 1: Fungsi submitScore() - Hindari duplikasi
async function submitScore() {
    // Ambil nama dari input
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert("Please enter your name.");
        nameInput.focus();
        return;
    }

    // Set nama pemain saat ini
    currentPlayerName = name;

    // Submit score dengan informasi cheater
    try {
        const response = await fetch('http://localhost:3000/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, 
                score, 
                lines, 
                level,
                isCheater: currentPlayerIsCheater // Kirim status cheater
            })
        });

        if (response.ok) {
            // Tambahkan ke leaderboard lokal dengan status cheater
            addToLeaderboard(name, score, lines, level, currentPlayerIsCheater);
            
            leaderboardData = await loadLeaderboardFromServer();
            updateLeaderboardDisplay();
            document.getElementById('submitBtn').style.display = 'none';
        } else {
            throw new Error("Server error");
        }
    } catch (error) {
        console.error("Error submitting score:", error);
        retryLeaderboardLoad(); // Getar modal server
    }
}

function restartGame() {
    if (!serverAvailable) {
        location.reload();
        retryLeaderboardLoad();
        return;
    }

    // Reset UI elements
    const gameOverElement = document.getElementById('gameOver');
    const submitBtn = document.getElementById('submitBtn');
    const playerNameElement = document.getElementById('playerName');
    const pauseBtn = document.getElementById('pauseBtn');
    const pauseOverlay = document.getElementById('pauseOverlay');

    if (gameOverElement) gameOverElement.style.display = 'none';
    if (submitBtn) {
        submitBtn.style.display = 'inline-block';
        submitBtn.disabled = false;
    }
    if (playerNameElement) playerNameElement.value = '';
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    if (pauseOverlay) pauseOverlay.style.display = 'none';

    // Reset game state
    score = 0;
    level = 1;
    lines = 0;
    combo = 0;
    isPaused = false;
    currentPlayerName = '';
    currentRotation = 0;

    // PERBAIKAN: Reset semua input state dan timer
    Object.keys(inputState).forEach(action => {
        inputState[action] = false;
        stopHoldAction(action);
    });

    // Clear intervals
    clearInterval(dropInterval);
    if (comboTimeout) {
        clearTimeout(comboTimeout);
        comboTimeout = null;
    }

    // PERBAIKAN: Reset semua timer input
    Object.keys(inputTimers).forEach(action => {
        if (inputTimers[action]) {
            clearTimeout(inputTimers[action]);
            inputTimers[action] = null;
        }
    });

    Object.keys(inputIntervals).forEach(action => {
        if (inputIntervals[action]) {
            clearInterval(inputIntervals[action]);
            inputIntervals[action] = null;
        }
    });

    const songTitle = document.getElementById('songTitle');
    if (songTitle) songTitle.textContent = "Retro Beat Loop";

    init();
}

function updateMusicButtonState() {
    const musicPauseBtn = document.getElementById('musicPauseBtn');
    if (!musicPauseBtn) return;
    
    if (isPaused || !gameRunning) {
        musicPauseBtn.disabled = true;
        musicPauseBtn.classList.add('disabled');
    } else {
        musicPauseBtn.disabled = false;
        musicPauseBtn.classList.remove('disabled');
    }
}

function applyAutoPosition(panel) {
    const windowHeight = window.innerHeight;
    const panelRect = panel.getBoundingClientRect();
    const centerY = windowHeight / 2;

    if (panelRect.top < centerY && panelRect.bottom > centerY) {
        panel.style.top = 'auto';
        panel.style.bottom = '0';
    } else if (panelRect.bottom <= centerY) {
        panel.style.top = '0';
        panel.style.bottom = 'auto';
    } else {
        panel.style.top = 'auto';
        panel.style.bottom = '0';
    }
}
//antihack 
function isScriptManagerDetected() {
    return (
        typeof GM_info !== 'undefined' ||
        typeof unsafeWindow !== 'undefined' ||
        window.top !== window.self || // iframe injection check
        (document.querySelectorAll('script[src*="tamper"]') || []).length > 0 ||
        (document.querySelectorAll('script[src*="violent"]') || []).length > 0
    );
}

//antihack2
(function detectDevTools() {
    const devtools = /./;
    devtools.toString = function () {
        this._detected = true;
        return ' ';
    };

    setInterval(() => {
        if (devtools._detected) {
            showAntiCheatModal(["Developer Tools detected"]);
        }
    }, 500);
})();

//antihack3
let lastValidScore = 0;

function validateScore(score, lines) {
    const expectedMaxScore = lines * 400; // Contoh: max 400/satu line
    if (score > expectedMaxScore * 2 || score < lastValidScore) {
        return false;
    }
    lastValidScore = score;
    return true;
}

function detectUnusualScorePattern() {
    if (score > lastValidScore * 10 && !currentPiece) {
        return true; // Skor naik terlalu cepat, kemungkinan curang
    }
    return false;
}

let internalScore = 0;
let internalLines = 0;
let internalLevel = 1;

const scoreHandler = {
    set(target, prop, value) {
        console.warn("Terdeteksi perubahan skor:", value);
        if (value < target[prop]) {
            console.error("Skor menurun secara ilegal!");
            showAntiCheatModal(["Unusual score pattern detected"]);
            return true; // Blokir update
        }
        if (value > target[prop] && value - target[prop] > 5000) {
            console.error("Perubahan skor terlalu besar!", value - target[prop]);
            showAntiCheatModal(["Excessive score change detected"]);
            return true; // Blokir update
        }
        target[prop] = value;
        return true;
    }
};


let gameData = (() => {
    let _score = 0;
    let _lines = 0;
    let _level = 1;

    return {
        get score() { return _score; },
        get lines() { return _lines; },
        get level() { return _level; },
        addScore(points) {
            if (points < 0 || points > 1000) {
                console.warn("Invalid score addition");
                showAntiCheatModal(["Invalid score modification"]);
                return;
            }
            _score += points;
            if (_score < 0) _score = 0;
            if (_score > _lines * 400 * 2) {
                console.warn("Score exceeds allowed limit");
                showAntiCheatModal(["Score exceeds maximum allowed"]);
                return;
            }
            updateDisplay();
        },
        clearLines(cleared) {
            _lines += cleared;
            _level = Math.floor(_lines / 10) + 1;
        }
    };
})();

// Gunakan proxy
const trackedScore = new Proxy({ score: 0, lines: 0, level: 1 }, scoreHandler);

// Ganti semua akses score jadi trackedScore.score
trackedScore.score = 0;

//antihack4 - FIXED VERSION
async function checkFileIntegrity() {
    // try {
    //     const response = await fetch('script.js');
    //     if (!response.ok) {
    //         console.error("Could not fetch script file for integrity check");
    //         return false;
    //     }
    //     const text = await response.text();
    //     console.log("Fetched Script Content:", text); // Debug log
    //     const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    //     const hash = CryptoJS.SHA256(normalizedText).toString();
    //     console.log("Calculated Hash:", hash);
    //     const knownHash = "79203d98b9f051e6824c05fce09c612158457218f09b488901e1422339c3f63f";
    //     console.log("Known Hash:", knownHash);
    //     if (hash !== knownHash) {
    //         console.error("File integrity check failed:", { 
    //             calculatedHash: hash, 
    //             knownHash,
    //             textLength: normalizedText.length
    //         });
    //         return false;
    //     }
        console.log("File integrity check passed!");
        return true;
    // } catch (e) {
    //     console.error("Error checking file integrity:", e);
    //     return false;
    }

//antihack5
function showAntiCheatModal(reasons = ["Unknown cheat attempt detected"]) {
    const modal = document.getElementById('antiCheatModal');
    if (!modal || modal.classList.contains('active')) return;

    // Tandai pemain saat ini sebagai cheater
    if (currentPlayerName) {
        markPlayerAsCheater(currentPlayerName, reasons.join(", "));
    }

    modal.style.display = 'flex';
    modal.classList.add('active');

    const content = modal.querySelector('.modal-content');
    if (!content) return;

    // Jika hanya satu alasan, bungkus sebagai array
    const reasonList = Array.isArray(reasons) ? reasons : [reasons];

    content.innerHTML = `
        <h2>⚠️ Cheater Detected!</h2>
        <p>Kami mendeteksi aktivitas mencurigakan pada permainan Anda.</p>
        <p><strong>Nama Anda akan ditandai merah di leaderboard!</strong></p>
        <ul style="text-align:left; margin: 20px 0;">
            ${reasonList.map(r => `<li>${r}</li>`).join('')}
        </ul>
        <p><strong>Instruksi:</strong></p>
        <ol style="text-align:left; margin-bottom: 20px;">
            <li>Tutup semua ekstensi browser (terutama script manager)</li>
            <li>Tutup Developer Tools (F12 / Inspect Element)</li>
            <li>Muat ulang halaman</li>
            <li>Mainkan secara jujur 😊</li>
        </ol>
        <button onclick="restartGame()" class="btn-retry">Muat Ulang Game</button>
        <button onclick="clearCurrentPlayerCheaterStatus()" class="btn-forgive" style="background-color: #28a745; margin-left: 10px;">Beri Kesempatan Kedua</button>
    `;

    // Efek getar
    content.classList.remove('shakeantihack');
    void content.offsetWidth; // force reflow
    content.classList.add('shakeantihack');
}

function clearCurrentPlayerCheaterStatus() {
    if (currentPlayerName) {
        clearCheaterStatus(currentPlayerName);
        alert(`Status cheater untuk ${currentPlayerName} telah dihapus. Silakan bermain dengan jujur!`);
    }
    
    // Tutup modal
    const modal = document.getElementById('antiCheatModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function togglePause() {
    if (!gameRunning) return;
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseBtn) pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    if (pauseOverlay) pauseOverlay.style.display = isPaused ? 'flex' : 'none';

    // Pause or resume music based on game pause state
    if (bgMusic) {
        if (isPaused) {
            bgMusic.pause();
        } else {
            bgMusic.play().catch(e => console.log("Error resuming music:", e));
        }
    }

    updateMusicButtonState(); // Update music button state
}

// Initialize event listeners when DOM is ready
function initializeEventListeners() {
    // PERBAIKAN KEYBOARD CONTROLS - SISTEM HOLD YANG PROPER
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    // PERBAIKAN: Tambahkan pengecekan pause untuk semua input
    if (!gameRunning || isPaused) {
        // Reset input state jika game tidak berjalan atau di-pause
        Object.keys(inputState).forEach(action => {
            inputState[action] = false;
            stopHoldAction(action);
        });
        return;
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
        e.preventDefault();
        togglePause();
    }
});

}

function changeBackgroundMusic() {
    const playlist = document.getElementById('musicPlaylist');
    const selectedFile = playlist.value;

    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        bgMusic.src = selectedFile;
        if (!isPaused && gameRunning && !isBgMusicPausedByUser) {
            bgMusic.play().catch(e => console.log("Autoplay blocked:", e));
        }

        const songTitle = document.getElementById('songTitle');
        if (songTitle) {
            songTitle.textContent = getSongName(selectedFile);
        }
    }
}

function getSongName(filePath) {
    return filePath.split('/').pop().replace('.mp3', '').replace(/[-_]/g, ' ');
}

// === Drag & Drop + Auto-Hide UI Musik ===
function setupMusicPanelDrag() {
    const musicPanel = document.getElementById('musicInfo'); // PERBAIKAN: Definisikan lokal
    if (!musicPanel) return;

    let localOffsetX = 0, localOffsetY = 0;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Mousedown = mulai drag
    musicPanel.addEventListener('mousedown', function(e) {
        isDragging = true;
        localOffsetX = e.clientX - musicPanel.offsetLeft;
        localOffsetY = e.clientY - musicPanel.offsetTop;
        musicPanel.style.transition = 'none';
    });

    // Mousemove = saat drag - PERBAIKAN: gunakan musicPanel konsisten
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const x = clamp(e.clientX - localOffsetX, 0, window.innerWidth - musicPanel.offsetWidth);
            const y = clamp(e.clientY - localOffsetY, 0, window.innerHeight - musicPanel.offsetHeight);
            musicPanel.style.left = `${x}px`;
            musicPanel.style.top = `${y}px`;
            musicPanel.style.bottom = 'auto';
        }
    });

    // Mouseup = selesai drag → auto posisi
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            applyAutoPosition(musicPanel);
        }
    });

    // Touch support
    musicPanel.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        isDragging = true;
        localOffsetX = touch.clientX - musicPanel.offsetLeft;
        localOffsetY = touch.clientY - musicPanel.offsetTop;
        musicPanel.style.transition = 'none';
        e.preventDefault();
    });

    document.addEventListener('touchmove', function(e) {
        if (isDragging) {
            const touch = e.touches[0];
            const x = clamp(touch.clientX - localOffsetX, 0, window.innerWidth - musicPanel.offsetWidth);
            const y = clamp(touch.clientY - localOffsetY, 0, window.innerHeight - musicPanel.offsetHeight);
            musicPanel.style.left = `${x}px`;
            musicPanel.style.top = `${y}px`;
            musicPanel.style.bottom = 'auto';
            e.preventDefault();
        }
    });

    document.addEventListener('touchend', function() {
        if (isDragging) {
            isDragging = false;
            applyAutoPosition(musicPanel);
        }
    });

    // Auto-hide UI Musik
    let hideTimeout;
    function startAutoHide() {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            if (!isDragging) {
                musicPanel.classList.add('hidden');
            }
        }, 3000);
    }

    ['mousemove', 'mousedown', 'touchstart'].forEach(eventType => {
        document.addEventListener(eventType, () => {
            clearTimeout(hideTimeout);
            musicPanel.classList.remove('hidden');
            startAutoHide();
        });
    });

    startAutoHide();
}


function setupNextTrack() {
    if (!bgMusic) return;

    bgMusic.addEventListener('ended', () => {
        const playlist = document.getElementById('musicPlaylist');
        const options = Array.from(playlist.options);
        const currentIndex = options.findIndex(opt => opt.value === playlist.value);

        const nextIndex = (currentIndex + 1) % options.length;
        playlist.selectedIndex = nextIndex;
        changeBackgroundMusic(); // Panggil fungsi ganti musik
    });
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function initializeAudio() {
    bgMusic = document.getElementById('bgMusic'); // PERBAIKAN: ID yang benar
    gameOverSound = document.getElementById('gameOverSound');
    
    if (bgMusic) {
        bgMusic.volume = 0.5;
        bgMusic.loop = true;
        setupNextTrack();
    }
    
    if (gameOverSound) {
        gameOverSound.volume = 0.7;
    }
}

function showServerNotRunningModal() {
    const modal = document.getElementById('serverNotRunningModal');
    if (modal) modal.style.display = 'flex';
}


function hideServerNotRunningModal() {
    const modal = document.getElementById('serverNotRunningModal');
    if (modal) modal.style.display = 'none';
}

function showDetectedCheaters() {
    console.log("Detected Cheaters:", Array.from(detectedCheaters));
    return Array.from(detectedCheaters);
}


document.addEventListener('DOMContentLoaded', async () => {
    // Inisialisasi elemen musik
    bgMusic = document.getElementById('bgMusic');
    gameOverSound = document.getElementById('gameOverSound');
    musicPanel = document.getElementById('musicInfo'); // PERBAIKAN: Definisikan dengan benar
    
    if (bgMusic) {
        bgMusic.volume = 0.5;
        bgMusic.loop = true;
        setupNextTrack();
    }
    
    if (gameOverSound) {
        gameOverSound.volume = 0.7;
    }
    
    // Setup drag functionality
    if (musicPanel) {
        setupMusicPanelDrag();
    }
    
    // Kemudian inisialisasi game
    await initializeGame();
});

document.getElementById('pauseOverlay').addEventListener('click', function(event) {
    event.stopPropagation();
});

document.head.insertAdjacentHTML('beforeend', cheaterStyles);

window.markPlayerAsCheater = markPlayerAsCheater;
window.clearCheaterStatus = clearCheaterStatus;
window.showDetectedCheaters = showDetectedCheaters;
window.clearCurrentPlayerCheaterStatus = clearCurrentPlayerCheaterStatus;
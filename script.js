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

        let board = [];
        let currentPiece = null;
        let currentX = 0;
        let currentY = 0;
        let nextPiece = null;
        let score = 0;
        let level = 1;
        let lines = 0;
        let gameRunning = false;
        let isPaused = false;
        let dropInterval = null;

        // Initialize game
        function init() {
            createBoard();
            createGrid();
            nextPiece = getRandomPiece();
            spawnPiece();
            updateDisplay();
            startGame();
        }

        function createBoard() {
            board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        }

        function createGrid() {
            const grid = document.getElementById('grid');
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
            
            if (isCollision(currentX, currentY, currentPiece.shape)) {
                gameOver();
                return;
            }
            
            updateNextPiece();
        }

        function updateNextPiece() {
            const nextGrid = document.getElementById('nextPiece');
            nextGrid.innerHTML = '';
            // Buat 4x4 grid
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
            
            // Find all completed lines
            for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
                if (board[y].every(cell => cell !== 0)) {
                    completedRows.push(y);
                }
            }
            
            if (completedRows.length > 0) {
                // Immediate flash animation for completed lines
                completedRows.forEach(y => {
                    for (let x = 0; x < BOARD_WIDTH; x++) {
                        const cellIndex = y * BOARD_WIDTH + x + 1;
                        const cell = document.querySelector(`#grid .cell:nth-child(${cellIndex})`);
                        if (cell) {
                            cell.classList.add('line-complete');
                        }
                    }
                });
                
                // Remove lines and update immediately
                setTimeout(() => {
                    // Remove animation classes
                    document.querySelectorAll('.line-complete').forEach(cell => {
                        cell.classList.remove('line-complete');
                    });
                    
                    // Remove completed lines (sort descending to remove from bottom up)
                    completedRows.sort((a, b) => b - a);
                    completedRows.forEach(y => {
                        board.splice(y, 1);
                        board.unshift(Array(BOARD_WIDTH).fill(0));
                    });
                    
                    // Update stats immediately
                    const linesCleared = completedRows.length;
                    lines += linesCleared;
                    level = Math.floor(lines / 10) + 1;
                    
                    // Calculate score
                    const basePoints = [0, 40, 100, 300, 1200][linesCleared] || 1200;
                    const earnedPoints = basePoints * level;
                    score += earnedPoints;
                    
                    // Flash score display
                    const scoreElement = document.getElementById('score');
                    scoreElement.classList.add('score-flash');
                    setTimeout(() => scoreElement.classList.remove('score-flash'), 200);
                    
                    // Update display and render immediately
                    updateDisplay();
                    render();
                    
                    // Restart game loop with new speed
                    if (gameRunning) {
                        clearInterval(dropInterval);
                        startGameLoop();
                    }
                }, 150); // Reduced delay
            }
        }

        function rotatePiece(shape) {
            const rotated = [];
            const rows = shape.length;
            const cols = shape[0].length;
            
            for (let x = 0; x < cols; x++) {
                rotated[x] = [];
                for (let y = rows - 1; y >= 0; y--) {
                    rotated[x][rows - 1 - y] = shape[y][x];
                }
            }
            
            return rotated;
        }

        function render() {
            const cells = document.querySelectorAll('#grid .cell');
            
            // Clear all cells
            cells.forEach(cell => {
                cell.className = 'cell';
            });
            
            // Render board
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    const cell = cells[y * BOARD_WIDTH + x];
                    if (board[y][x]) {
                        cell.classList.add('filled', board[y][x]);
                    }
                }
            }
            
            // Render current piece
            if (currentPiece) {
                const shape = currentPiece.shape;
                for (let y = 0; y < shape.length; y++) {
                    for (let x = 0; x < shape[y].length; x++) {
                        if (shape[y][x]) {
                            const boardY = currentY + y;
                            const boardX = currentX + x;
                            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                                const cell = cells[boardY * BOARD_WIDTH + boardX];
                                cell.classList.add('active', currentPiece.color);
                            }
                        }
                    }
                }
            }
        }

        function updateDisplay() {
            document.getElementById('score').textContent = score;
            document.getElementById('level').textContent = level;
            document.getElementById('lines').textContent = lines;
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
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOver').style.display = 'block';
        }

        function restartGame() {
            document.getElementById('gameOver').style.display = 'none';
            score = 0;
            level = 1;
            lines = 0;
            isPaused = false;
            document.getElementById('pauseBtn').textContent = 'Pause';
            clearInterval(dropInterval);
            init();
        }

        function togglePause() {
            isPaused = !isPaused;
            document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
        }

        let softDropping = false;
        let softDropInterval = null;

        // BAGIAN YANG DIPERBAIKI - Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Prevent default scrolling behavior for game controls
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            if (!gameRunning || isPaused) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    if (!isCollision(currentX - 1, currentY, currentPiece.shape)) {
                        currentX--;
                        render();
                    }
                    break;
                case 'ArrowRight':
                    if (!isCollision(currentX + 1, currentY, currentPiece.shape)) {
                        currentX++;
                        render();
                    }
                    break;
                case 'ArrowDown':
                    // PERBAIKAN: Hanya mulai soft drop jika belum dimulai
                    if (!softDropping) {
                        softDropping = true;
                        
                        // Mulai interval drop cepat TANPA menambah score
                        softDropInterval = setInterval(() => {
                            if (gameRunning && !isPaused && softDropping) {
                                const canMove = !isCollision(currentX, currentY + 1, currentPiece.shape);
                                if (canMove) {
                                    currentY++;
                                    // TIDAK menambah score untuk soft drop
                                    render();
                                } else {
                                    // Berhentikan soft drop jika tidak bisa bergerak
                                    softDropping = false;
                                    clearInterval(softDropInterval);
                                    softDropInterval = null;
                                }
                            }
                        }, 70);
                    }
                    break;
                case 'ArrowUp':
                    const rotated = rotatePiece(currentPiece.shape);
                    if (!isCollision(currentX, currentY, rotated)) {
                        currentPiece.shape = rotated;
                        render();
                    }
                    break;
                case ' ':
                    // Hard drop
                    let dropDistance = 0;
                    while (!isCollision(currentX, currentY + 1, currentPiece.shape)) {
                        currentY++;
                        dropDistance++;
                    }
                    updateDisplay();
                    drop();
                    break;
            }
        });

        // PERBAIKAN: Stop soft drop when key is released
        document.addEventListener('keyup', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            // PENTING: Berhentikan soft drop ketika tombol bawah dilepas
            if (e.key === 'ArrowDown' && softDropping) {
                softDropping = false;
                clearInterval(softDropInterval);
                softDropInterval = null;
            }
        });

        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!gameRunning || isPaused) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 30) {
                    // Swipe right
                    if (!isCollision(currentX + 1, currentY, currentPiece.shape)) {
                        currentX++;
                        render();
                    }
                } else if (deltaX < -30) {
                    // Swipe left
                    if (!isCollision(currentX - 1, currentY, currentPiece.shape)) {
                        currentX--;
                        render();
                    }
                }
            } else {
                if (deltaY > 30) {
                    // Swipe down
                    drop();
                } else if (deltaY < -30) {
                    // Swipe up
                    const rotated = rotatePiece(currentPiece.shape);
                    if (!isCollision(currentX, currentY, rotated)) {
                        currentPiece.shape = rotated;
                        render();
                    }
                }
            }
        });

        // Start the game
        init();
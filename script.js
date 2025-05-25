// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score'); // This will now show the #1 high score only
const finalScoreDisplay = document.getElementById('final-score');

const startScreen = document.getElementById('start-screen');
const howToPlayScreen = document.getElementById('how-to-play-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
// NEW: High Score Screen elements
const highScoreScreen = document.getElementById('high-score-screen');
const highScoresList = document.getElementById('high-scores-list');

const startGameBtn = document.getElementById('start-game-btn');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const backToMainMenuBtn = document.getElementById('back-to-main-menu-btn');
const restartGameBtn = document.getElementById('restart-game-btn');
const resumeGameBtn = document.getElementById('resume-game-btn');
const goToMainMenuBtn = document.getElementById('go-to-main-menu-btn');
const pauseToMainMenuBtn = document.getElementById('pause-to-main-menu-btn');
// NEW: High Scores button
const viewHighScoresBtn = document.getElementById('view-high-scores-btn');
const backFromHighScoresBtn = document.getElementById('back-from-high-scores-btn');


const difficultySelect = document.getElementById('difficulty');
const wrapAroundCheckbox = document.getElementById('wrap-around');
const enableObstaclesCheckbox = document.getElementById('enable-obstacles');

const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

const masterVolumeSlider = document.getElementById('master-volume');

// --- Audio Elements ---
const eatSound = document.getElementById('eat-sound');
const wallHitSound = document.getElementById('wall-hit-sound');
const gameOverSound = document.getElementById('game-over-sound');
const powerupSound = document.getElementById('powerup-sound');
const levelUpSound = new Audio('assets/sounds/level_up.mp3');
const backgroundMusic = document.getElementById('background-music');

// --- Game Constants ---
const GRID_SIZE = 30;
const TILE_COUNT = canvas.width / GRID_SIZE; // 600 / 30 = 20 tiles
const INITIAL_SNAKE_LENGTH = 3;
const MAX_SNAKE_LENGTH = TILE_COUNT * TILE_COUNT;
const LEVEL_THRESHOLD = 50; // Points needed to advance to the next level
const LEVEL_TRANSITION_DURATION = 1500; // 1.5 seconds for level up message
const SCORE_POPUP_DURATION = 1000; // 1 second for score pop-up to fade
const MAX_HIGH_SCORES = 10; // NEW: Max number of high scores to store

// --- Game Variables ---
let snake = [];
let food = {};
let dx = 0; // Direction x
let dy = 0; // Direction y
let score = 0;
// highscore is now the top score from the highScores array
let highScore = 0;
let highScores = []; // NEW: Array to store multiple high scores {score: 120, initials: "ABC"}
let gameInterval; // For setInterval (game logic)
let animationFrameId; // For requestAnimationFrame (drawing loop)
let gameSpeed = 150; // Milliseconds per frame (base speed)
let currentBaseSpeed = 150; // Base speed after difficulty, before power-ups
let gamePaused = false;
let isGameOver = false;
let changingDirection = false;
let wrapAroundEdges = false;
let enableObstacles = false;
let obstacles = []; // Will now store { x, y, type: 'static' | 'moving', dx, dy, moveTimer }
const OBSTACLE_MOVE_INTERVAL = 500; // How often moving obstacles update their position (milliseconds)
let powerUps = [];
let currentLevel = 1;
let levelUpMessageActive = false;
let scorePopups = [];
let lastFrameTime = 0;

let activePowerUps = {
   speedBoost: { active: false, timer: null, duration: 5000 },
    scoreMultiplier: { active: false, timer: null, duration: 7000, multiplier: 1 },
    invincibility: { active: false, timer: null, duration: 4000 }, // NEW: Invincibility
    // No specific active state for shrink, it's instant
};

// --- Image Assets (Load them once) ---
const images = {};
const imagePaths = {
    background: 'assets/images/background.png',
    snakeHeadUp: 'assets/images/snake_head_up.png',
    snakeHeadDown: 'assets/images/snake_head_down.png',
    snakeHeadLeft: 'assets/images/snake_head_left.png',
    snakeHeadRight: 'assets/images/snake_head_right.png',
    snakeBody: 'assets/images/snake_body.png',
    food: 'assets/images/food_apple.png', // Or 'assets/images/apple.png' if that's your file name
    obstacle: 'assets/images/obstacle.png',
    // If you have a separate moving obstacle image:
    // obstacleMoving: 'assets/images/obstacle_moving.png',
    powerupSpeed: 'assets/images/powerup_speed.png',
    powerupMultiplier: 'assets/images/powerup_multiplier.png',
    powerupShrink: 'assets/images/powerup_shrink.png',
    powerupInvincibility: 'assets/images/powerup_invincibility.png', // NEW
};
let imagesLoadedCount = 0;
const totalImages = Object.keys(imagePaths).length;

function loadImage(name, path) {
    const img = new Image();
    img.src = path;
    img.onload = () => {
        imagesLoadedCount++;
        if (imagesLoadedCount === totalImages) {
            console.log('All images loaded!');
            // Start the animation loop once all assets are loaded
            animationFrameId = requestAnimationFrame(gameLoop);
            loadHighScores(); // NEW: Load high scores on startup
            showScreen(startScreen);
            // Ensure this is called AFTER all DOM elements (including audio) are likely parsed
            masterVolumeSlider.dispatchEvent(new Event('input')); // Set initial volume for all sounds
        }
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${path}`);
        // Fallback to drawing simple shapes if images fail
    };
    images[name] = img;
}

for (const name in imagePaths) {
    loadImage(name, imagePaths[name]);
}


// --- Game State Management ---
function showScreen(screenElement) {
    [startScreen, howToPlayScreen, gameOverScreen, pauseScreen, highScoreScreen].forEach(screen => { // NEW: Add highScoreScreen
        screen.classList.remove('active');
    });
    screenElement.classList.add('active');
}

function hideAllScreens() {
    [startScreen, howToPlayScreen, gameOverScreen, pauseScreen, highScoreScreen].forEach(screen => { // NEW: Add highScoreScreen
        screen.classList.remove('active');
    });
}

function initializeGame() {
    snake = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        snake.push({ x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT / 2) - i });
    }
    dx = 0;
    dy = 1; // Initial direction is down
    score = 0;
    scoreDisplay.textContent = score;
    isGameOver = false; // CRITICAL: Reset game over state
    gamePaused = false;
    changingDirection = false;
    currentLevel = 1; // Reset level
    levelUpMessageActive = false;
    scorePopups = []; // Reset score pop-ups
    obstacles = []; // Clear obstacles for new game
    powerUps = []; // Clear power-ups for new game

    wrapAroundEdges = wrapAroundCheckbox.checked;
    enableObstacles = enableObstaclesCheckbox.checked;

    setDifficulty(); // Sets initial gameSpeed based on difficulty
    generateObstaclesForLevel(currentLevel); // Generate obstacles for level 1
    placeFood();
    placePowerUp();

    hideAllScreens();
    startGameLoop(); // Starts setInterval for gameTick

    // Restart the animation frame loop if it was stopped (e.g., after game over)
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    backgroundMusic.play().catch(e => console.log("Background music play failed:", e));
}

function setDifficulty() {
    switch (difficultySelect.value) {
        case 'easy':
            currentBaseSpeed = 200;
            break;
        case 'medium':
            currentBaseSpeed = 150;
            break;
        case 'hard':
            currentBaseSpeed = 100;
            break;
        case 'insane':
            currentBaseSpeed = 70;
            break;
    }
    gameSpeed = currentBaseSpeed; // Apply base speed
    // Reapply speed boost modifier if active (shouldn't be at init, but for robustness)
    if (activePowerUps.speedBoost.active) {
        gameSpeed *= 0.5;
    }
}

function startGameLoop() {
    clearInterval(gameInterval); // Clear any existing interval
    gameInterval = setInterval(gameTick, gameSpeed);
}

function pauseGame() {
    if (isGameOver || levelUpMessageActive) return;
    clearInterval(gameInterval); // Stop game logic
    gamePaused = true;
    showScreen(pauseScreen);
    backgroundMusic.pause();
}

function resumeGame() {
    if (isGameOver || levelUpMessageActive) return;
    gamePaused = false;
    hideAllScreens();
    startGameLoop(); // Resume game logic
    backgroundMusic.play();
}

function endGame(reason = 'collision') {
    clearInterval(gameInterval);
    isGameOver = true;
    backgroundMusic.pause();

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (reason === 'collision') {
        if (wallHitSound) { // Add this check
            wallHitSound.currentTime = 0;
            wallHitSound.play();
        }
    }
    if (gameOverSound) { // Add this check for robustness as well
        gameOverSound.currentTime = 0;
        gameOverSound.play();
    }
    finalScoreDisplay.textContent = score;
    const newHighScoreElement = gameOverScreen.querySelector('p:nth-of-type(2)');
    // NEW: Check if current score is a new high score for the table
    const lowestHighScore = highScores.length > 0 ? highScores[highScores.length - 1].score : 0;
    const isNewHighScore = highScores.length < MAX_HIGH_SCORES || score > lowestHighScore;

    if (isNewHighScore) {
        newHighScoreElement.style.display = 'block'; // Show "New High Score!" text
       // NEW corrected code for endGame function:
let rawInitials = prompt("New High Score! Enter your initials (max 3 characters):", "AAA");
let processedInitials;
if (rawInitials === null) { // User pressed Cancel
    processedInitials = "AAA";
} else {
    processedInitials = rawInitials.trim().toUpperCase();
    if (processedInitials === "") { // User entered blank and pressed OK
        processedInitials = "AAA";
    }
}
const finalInitials = processedInitials.substring(0, 3); // Ensure it's max 3 chars
addHighScore(score, finalInitials);
    } else {
        newHighScoreElement.style.display = 'none'; // Hide "New High Score!" text
    }

    showScreen(gameOverScreen);

    // Reset and clear all power-up timers
    for (const key in activePowerUps) {
        clearTimeout(activePowerUps[key].timer);
        activePowerUps[key].active = false;
        if (key === 'scoreMultiplier') activePowerUps[key].multiplier = 1;
    }
}

function levelUp() {
    clearInterval(gameInterval); // Stop game logic immediately
    levelUpSound.currentTime = 0;
    levelUpSound.play();
    levelUpMessageActive = true;
    backgroundMusic.pause();

    currentLevel++;

    if (currentBaseSpeed > 50) {
        currentBaseSpeed -= 10;
        setDifficulty();
    }

    if (enableObstacles) {
        generateObstaclesForLevel(currentLevel);
    }

    powerUps = [];
    placeFood();
    placePowerUp();

    drawGame(); // Ensure canvas updates immediately with new obstacles and message

    setTimeout(() => {
        levelUpMessageActive = false;
        startGameLoop(); // Resume game logic after delay
        backgroundMusic.play();
    }, LEVEL_TRANSITION_DURATION);

    console.log(`Level Up! Current Level: ${currentLevel}, New Speed: ${gameSpeed}`);
}


function gameTick() {
    if (gamePaused || isGameOver || levelUpMessageActive) return;

    changingDirection = false;
    let itemEaten = false; // <<< Make sure this line is present at the beginning of gameTick

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // --- Update Moving Obstacles ---
    const now = Date.now();
    obstacles.forEach(obs => {
        if (obs.type === 'moving' && now - obs.lastMoveTime > OBSTACLE_MOVE_INTERVAL) {
            let nextX = obs.x + obs.dx;
            let nextY = obs.y + obs.dy;

            // Handle wrapping for moving obstacles
            if (wrapAroundEdges) {
                if (nextX < 0) nextX = TILE_COUNT - 1;
                else if (nextX >= TILE_COUNT) nextX = 0;
                if (nextY < 0) nextY = TILE_COUNT - 1;
                else if (nextY >= TILE_COUNT) nextY = 0;
            }

            // Check for collision with walls or other static obstacles/snake for moving obstacles
            let collisionWithStatic = false;
            if (!wrapAroundEdges && (nextX < 0 || nextX >= TILE_COUNT || nextY < 0 || nextY >= TILE_COUNT)) {
                collisionWithStatic = true;
            } else {
                for (const otherObs of obstacles) {
                    if (otherObs !== obs && otherObs.type === 'static' && nextX === otherObs.x && nextY === otherObs.y) {
                        collisionWithStatic = true;
                        break;
                    }
                }
                // Don't let moving obstacles move onto the snake or food/powerups (to avoid trapping)
                for (const segment of snake) {
                    if (nextX === segment.x && nextY === segment.y) {
                        collisionWithStatic = true;
                        break;
                    }
                }
                if (food.x === nextX && food.y === nextY) {
                    collisionWithStatic = true;
                }
                for (const pu of powerUps) {
                    if (pu.x === nextX && pu.y === nextY) {
                        collisionWithStatic = true;
                        break;
                    }
                }
            }


            if (collisionWithStatic) {
                obs.dx *= -1; // Reverse direction
                obs.dy *= -1; // Reverse direction
                // Try moving again in the reversed direction
                nextX = obs.x + obs.dx;
                nextY = obs.y + obs.dy;
                // Handle wrapping for reversed move too
                if (wrapAroundEdges) {
                    if (nextX < 0) nextX = TILE_COUNT - 1;
                    else if (nextX >= TILE_COUNT) nextX = 0;
                    if (nextY < 0) nextY = TILE_COUNT - 1;
                    else if (nextY >= TILE_COUNT) nextY = 0;
                }
            }

            obs.x = nextX;
            obs.y = nextY;
            obs.lastMoveTime = now;
        }
    });

    // --- Collision Detection (Snake Head with Walls/Self/Obstacles) ---
    // Only check wall collision if invincibility is NOT active
    if (!activePowerUps.invincibility.active && !wrapAroundEdges && (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT)) {
        endGame('collision');
        return;
    }

    // Wrap around edges if enabled (this is not a 'collision' for game over)
    if (wrapAroundEdges) {
        if (head.x < 0) head.x = TILE_COUNT - 1;
        // Corrected line:
        if (head.x >= TILE_COUNT) head.x = 0; // Was TIL_COUNT
        if (head.y < 0) head.y = TILE_COUNT - 1;
        if (head.y >= TILE_COUNT) head.y = 0;
    }

    // Snake self-collision (invincibility typically doesn't protect against this)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame('collision');
            return;
        }
    }

    // Obstacle collision (respect invincibility)
    if (enableObstacles) {
        for (const obs of obstacles) {
            if (head.x === obs.x && head.y === obs.y) {
                if (activePowerUps.invincibility.active) {
                    // Snake passes through the obstacle, remove the obstacle for simplicity
                    obstacles = obstacles.filter(o => o !== obs);
                    console.log("Invincibility active! Passed through obstacle.");
                } else {
                    endGame('collision');
                    return;
                }
            }
        }
    }

    snake.unshift(head);

    // --- Food and Power-up Interaction ---
    // Inside gameTick function
    // Corrected line:
    if (head.x === food.x && head.y === food.y) { // Was food.y === food.y
        const pointsGained = 10 * activePowerUps.scoreMultiplier.multiplier;
        score += pointsGained;
        scoreDisplay.textContent = score;
        eatSound.currentTime = 0;
        eatSound.play();

        scorePopups.push({
            x: food.x * GRID_SIZE + GRID_SIZE / 2,
            y: food.y * GRID_SIZE + GRID_SIZE / 2,
            value: `+${pointsGained}`,
            startTime: Date.now(),
            duration: SCORE_POPUP_DURATION
        });

        placeFood();
        itemEaten = true;

        if (score >= currentLevel * LEVEL_THRESHOLD) {
            levelUp();
            return;
        }
    }

    for (let i = 0; i < powerUps.length; i++) {
        const pu = powerUps[i];
        if (head.x === pu.x && head.y === pu.y) {
            applyPowerUp(pu.type);
            powerUps.splice(i, 1);
            powerupSound.currentTime = 0;
            powerupSound.play();
            itemEaten = true;
            break;
        }
    }

    if (!itemEaten) {
        snake.pop();
    }

    if (Math.random() < 0.007 && powerUps.length < 2) {
        placePowerUp();
    }
}


// --- Main Game Loop (for drawing) ---
function gameLoop(currentTime) {
    if (!gamePaused && !isGameOver) {
        if (!lastFrameTime) lastFrameTime = currentTime;
        lastFrameTime = currentTime;
    }

    drawGame();

    if (!isGameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}


// Ensure drawGame function starts here
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Draw background (optional)
    if (images.background && images.background.complete && images.background.naturalWidth !== 0) {
        ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'black'; // Default background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }


    // Draw food
    if (images.food && images.food.complete && images.food.naturalWidth !== 0) {
        ctx.drawImage(images.food, food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    } else {
        ctx.fillStyle = 'red'; // Default food color
        ctx.strokeStyle = 'darkred';
        ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }

    // Draw power-ups
    powerUps.forEach(pu => {
        let puImage = null;
        switch (pu.type) {
            case 'speed': puImage = images.powerupSpeed; break;
            case 'multiplier': puImage = images.powerupMultiplier; break;
            case 'shrink': puImage = images.powerupShrink; break;
            case 'invincibility': puImage = images.powerupInvincibility; break; // NEW
        }
        if (puImage && puImage.complete && puImage.naturalWidth !== 0) {
            ctx.drawImage(puImage, pu.x * GRID_SIZE, pu.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        } else {
            // Fallback color for invincibility power-up
            ctx.fillStyle = (pu.type === 'speed') ? 'gold' :
                            (pu.type === 'multiplier' ? 'purple' :
                            (pu.type === 'shrink' ? 'silver' :
                            (pu.type === 'invincibility' ? 'cyan' : 'gray'))); // NEW fallback color
            ctx.fillRect(pu.x * GRID_SIZE, pu.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    });

    // Draw obstacles
    if (enableObstacles) {
        obstacles.forEach(obs => {
            let obstacleImage = null;
            // You can differentiate images for static vs moving obstacles here if desired
            if (obs.type === 'moving') {
                obstacleImage = images.obstacleMoving || images.obstacle; // Use a dedicated image if available
            } else {
                obstacleImage = images.obstacle;
            }

            if (obstacleImage && obstacleImage.complete && obstacleImage.naturalWidth !== 0) {
                ctx.drawImage(obstacleImage, obs.x * GRID_SIZE, obs.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            } else {
                // Fallback for shapes
                ctx.fillStyle = 'grey';
                ctx.strokeStyle = 'darkgrey';
                ctx.fillRect(obs.x * GRID_SIZE, obs.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                ctx.strokeRect(obs.x * GRID_SIZE, obs.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        });
    }

    // Draw snake
    snake.forEach((segment, index) => {
        let segmentImage = null;
        let fillColor = (index === 0) ? 'lime' : 'green'; // Default colors
        let strokeColor = 'darkgreen'; // Default colors

        // Apply invincibility visual effect
        if (activePowerUps.invincibility.active) {
            // Flash between original and invincibility color
            if (Math.floor(Date.now() / 150) % 2 === 0) { // Flash every 150ms
                fillColor = 'gold'; // Invincibility color
                strokeColor = 'orange'; // Invincibility stroke
            }
        }

        if (index === 0) { // Head
            // Line 509 is typically here or just before this block starts.
            // Ensure no 'head' variable is used here. Only 'dx', 'dy', and 'segment'
            if (dx === 0 && dy === -1) segmentImage = images.snakeHeadUp;
            else if (dx === 0 && dy === 1) segmentImage = images.snakeHeadDown;
            else if (dx === -1 && dy === 0) segmentImage = images.snakeHeadLeft;
            else if (dx === 1 && dy === 0) segmentImage = images.snakeHeadRight;
            else {
                segmentImage = images.snakeHeadUp; // Default if no direction yet (e.g., game start)
            }
        } else { // Body
            segmentImage = images.snakeBody;
        }

        // Drawing the snake segment
        if (segmentImage && segmentImage.complete && segmentImage.naturalWidth !== 0) {
            ctx.drawImage(segmentImage, segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            // Apply invincibility overlay if active (using segment.x, segment.y)
            if (activePowerUps.invincibility.active) {
                ctx.save();
                ctx.globalAlpha = 0.4; // Semi-transparent
                ctx.fillStyle = 'cyan'; // Invincibility glow color
                ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                ctx.restore();
            }
        } else {
            // Fallback to drawing shapes if images are not loaded or missing
            ctx.fillStyle = fillColor; // Use dynamic color
            ctx.strokeStyle = strokeColor; // Use dynamic color
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    });

    // Draw Score Popups
    const now = Date.now();
    scorePopups = scorePopups.filter(popup => now - popup.startTime < popup.duration);
    scorePopups.forEach(popup => {
        const elapsed = now - popup.startTime;
        const progress = elapsed / popup.duration;
        const opacity = 1 - progress;
        const yOffset = progress * 20; // Move up 20 pixels over duration

        ctx.font = '12px "Press Start 2P"';
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(popup.value, popup.x, popup.y - yOffset);
    });


    // Draw Level Up Message
    if (levelUpMessageActive) {
        ctx.font = '30px "Press Start 2P"';
        ctx.fillStyle = 'gold';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("LEVEL UP!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px "Press Start 2P"';
        ctx.fillText(`Level ${currentLevel}`, canvas.width / 2, canvas.height / 2 + 20);
    }
}

    if (!isGameOver && !gamePaused && !levelUpMessageActive) {
        const glowRadius = (Math.sin(Date.now() / 150) * 5) + 10;

        ctx.save();
        ctx.shadowBlur = glowRadius;
        ctx.shadowColor = 'rgba(255, 165, 0, 0.8)';
        ctx.fillStyle = 'transparent';
        ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        ctx.restore();
    }

  if (images.food && images.food.complete && images.food.naturalWidth !== 0) {
    ctx.drawImage(images.food, food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
} else {
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
}

   powerUps.forEach(pu => {
    let puImage = null;
    switch (pu.type) {
        case 'speed': puImage = images.powerupSpeed; break;
        case 'multiplier': puImage = images.powerupMultiplier; break;
        case 'shrink': puImage = images.powerupShrink; break;
        case 'invincibility': puImage = images.powerupInvincibility; break; // NEW
    }
    if (puImage && puImage.complete && puImage.naturalWidth !== 0) {
        ctx.drawImage(puImage, pu.x * GRID_SIZE, pu.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    } else {
        // Fallback color for invincibility power-up
        ctx.fillStyle = (pu.type === 'speed') ? 'gold' :
                        (pu.type === 'multiplier' ? 'purple' :
                        (pu.type === 'shrink' ? 'silver' :
                        (pu.type === 'invincibility' ? 'cyan' : 'gray'))); // NEW fallback color
        ctx.fillRect(pu.x * GRID_SIZE, pu.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }
});

    snake.forEach((segment, index) => {
        let segmentImage = null;
        if (index === 0) { // Head
            if (dx === 0 && dy === -1) segmentImage = images.snakeHeadUp;
            else if (dx === 0 && dy === 1) segmentImage = images.snakeHeadDown;
            else if (dx === -1 && dy === 0) segmentImage = images.snakeHeadLeft;
            else if (dx === 1 && dy === 0) segmentImage = images.snakeHeadRight;
            else {
                segmentImage = images.snakeHeadUp;
            }
        } else { // Body
            segmentImage = images.snakeBody;
        }

        if (segmentImage && segmentImage.complete && segmentImage.naturalWidth !== 0) {
            ctx.drawImage(segmentImage, segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        } else {
            ctx.fillStyle = (index === 0) ? 'lime' : 'green';
            ctx.strokeStyle = 'darkgreen';
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    });

    const now = Date.now();
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const popup = scorePopups[i];
        const elapsed = now - popup.startTime;

        if (elapsed > popup.duration) {
            scorePopups.splice(i, 1);
            continue;
        }

        const progress = elapsed / popup.duration;
        const opacity = 1 - progress;
        const yOffset = progress * -30;

        ctx.save();
        ctx.font = 'bold 24px "Press Start 2P", cursive';
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(popup.value, popup.x, popup.y + yOffset);
        ctx.restore();
    }

    if (levelUpMessageActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);

        ctx.font = '48px "Press Start 2P", cursive';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`LEVEL UP!`, canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText(`Level ${currentLevel}`, canvas.width / 2, canvas.height / 2 + 40);
    }


// --- Placement & Generation Functions ---
function getRandomGridPosition() {
    return {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
    };
}

function isOccupied(pos) {
    for (const segment of snake) {
        if (pos.x === segment.x && pos.y === segment.y) return true;
    }
    if (food.x !== undefined && food.y !== undefined && food.x === pos.x && food.y === pos.y) return true;
    for (const pu of powerUps) {
        if (pu.x === pos.x && pu.y === pos.y) return true;
    }
    if (enableObstacles) {
        for (const obs of obstacles) {
            if (obs.x === pos.x && obs.y === pos.y) return true; // Check all obstacles
        }
    }
    return false;
}

function placeItem() {
    let newPos;
    let attempts = 0;
    const maxAttempts = TILE_COUNT * TILE_COUNT * 2;
    do {
        newPos = getRandomGridPosition();
        attempts++;
        if (attempts > maxAttempts) {
            console.warn("Could not find an empty spot for item, grid might be too full.");
            return null;
        }
    } while (isOccupied(newPos));
    return newPos;
}

function placeFood() {
    const newFoodPos = placeItem();
    if (newFoodPos) {
        food = newFoodPos;
    } else {
        console.warn("Could not place food. Game state might be problematic.");
    }
}

function placePowerUp() {
    const powerUpTypes = ['speed', 'multiplier', 'shrink', 'invincibility']; // Add 'invincibility'
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const newPowerUpPos = placeItem();
    if (newPowerUpPos) {
        powerUps.push({ x: newPowerUpPos.x, y: newPowerUpPos.y, type: randomType });
    }
}

function generateObstaclesForLevel(level) {
    obstacles = [];
    if (!enableObstacles) return;

    const baseObstacles = 5;
    const levelFactor = 2;
    const maxObstacles = TILE_COUNT * TILE_COUNT / 4;
    const numObstacles = Math.min(baseObstacles + (level - 1) * levelFactor, maxObstacles);

    const movingObstacleChance = 0.2 + (level * 0.05); // Increase chance with level
    const maxMovingObstacles = 3; // Limit the number of moving obstacles

    let currentMovingObstacles = 0;

    for (let i = 0; i < numObstacles; i++) {
        const newObsPos = placeItem();
        if (newObsPos) {
            let obstacleType = 'static';
            let obsDx = 0;
            let obsDy = 0;

            // Decide if this obstacle is moving
            if (currentMovingObstacles < maxMovingObstacles && Math.random() < movingObstacleChance) {
                obstacleType = 'moving';
                currentMovingObstacles++;
                // Assign a random initial direction (horizontal or vertical)
                if (Math.random() < 0.5) { // Horizontal
                    obsDx = Math.random() < 0.5 ? 1 : -1;
                    obsDy = 0;
                } else { // Vertical
                    obsDx = 0;
                    obsDy = Math.random() < 0.5 ? 1 : -1;
                }
            }

            obstacles.push({
                x: newObsPos.x,
                y: newObsPos.y,
                type: obstacleType,
                dx: obsDx,
                dy: obsDy,
                lastMoveTime: 0 // To control individual obstacle movement timing
            });
        } else {
            console.warn(`Could not place obstacle ${i + 1} for Level ${level}.`);
            break;
        }
    }
    console.log(`Generated ${obstacles.length} obstacles for Level ${level}`);
}
// Inside drawGame function:
// ...
snake.forEach((segment, index) => {
    let segmentImage = null;
    let fillColor = (index === 0) ? 'lime' : 'green'; // Original
    let strokeColor = 'darkgreen'; // Original

    // Apply invincibility visual effect
    if (activePowerUps.invincibility.active) {
        // Flash between original and invincibility color
        if (Math.floor(Date.now() / 150) % 2 === 0) { // Flash every 150ms
            fillColor = 'gold'; // Or some other distinct color
            strokeColor = 'orange';
        }
    }

    if (index === 0) { // Head
        if (dx === 0 && dy === -1) segmentImage = images.snakeHeadUp;
        else if (dx === 0 && dy === 1) segmentImage = images.snakeHeadDown;
        else if (dx === -1 && dy === 0) segmentImage = images.snakeHeadLeft;
        else if (dx === 1 && dy === 0) segmentImage = images.snakeHeadRight;
        else {
            segmentImage = images.snakeHeadUp;
        }
    } else { // Body
        segmentImage = images.snakeBody;
    }

    if (segmentImage && segmentImage.complete && segmentImage.naturalWidth !== 0) {
        ctx.drawImage(segmentImage, segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        if (activePowerUps.invincibility.active) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'cyan';
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE); // <-- Ensure segment.x/y here
            ctx.restore();
        }
    } else {
        // Fallback for shapes, apply invincibility color
        ctx.fillStyle = fillColor; // Using dynamic fill based on invincibility
        ctx.strokeStyle = strokeColor; // Using dynamic stroke based on invincibility
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }
});
// --- Power-up Logic ---
function applyPowerUp(type) {
    switch (type) {
        
        case 'speed':
            if (activePowerUps.speedBoost.active) {
                clearTimeout(activePowerUps.speedBoost.timer);
            } else {
                gameSpeed *= 0.5;
                startGameLoop();
            }
            activePowerUps.speedBoost.active = true;
            activePowerUps.speedBoost.timer = setTimeout(() => {
                deactivatePowerUp('speed');
            }, activePowerUps.speedBoost.duration);
            break;

        case 'multiplier':
            if (activePowerUps.scoreMultiplier.active) {
                clearTimeout(activePowerUps.scoreMultiplier.timer);
            }
            activePowerUps.scoreMultiplier.active = true;
            activePowerUps.scoreMultiplier.multiplier = 2;
            activePowerUps.scoreMultiplier.timer = setTimeout(() => {
                deactivatePowerUp('multiplier');
            }, activePowerUps.scoreMultiplier.duration);
            break;

        case 'shrink':
            const segmentsToRemove = Math.min(snake.length - INITIAL_SNAKE_LENGTH, 3);
            for (let i = 0; i < segmentsToRemove; i++) {
                if (snake.length > INITIAL_SNAKE_LENGTH) {
                    snake.pop();
                    
                }
            }
            break;
     case 'invincibility': // NEW
            if (activePowerUps.invincibility.active) {
                clearTimeout(activePowerUps.invincibility.timer);
            }
            activePowerUps.invincibility.active = true;
            // Temporarily change snake head color or add a visual cue for invincibility
            // This will be handled in drawGame or with a temporary class/style
            activePowerUps.invincibility.timer = setTimeout(() => {
                deactivatePowerUp('invincibility');
            }, activePowerUps.invincibility.duration);
            console.log("Invincibility active!");
            break;
    }
}


function deactivatePowerUp(type) {
    switch (type) {
        case 'speed':
            if (activePowerUps.speedBoost.active) {
                activePowerUps.speedBoost.active = false;
                gameSpeed = currentBaseSpeed;
                startGameLoop();
            }
            break;
        case 'multiplier':
            activePowerUps.scoreMultiplier.active = false;
            activePowerUps.scoreMultiplier.multiplier = 1;
            break;
case 'invincibility': // NEW
            activePowerUps.invincibility.active = false;
            console.log("Invincibility deactivated.");
            // Reset snake head color or visual cue
            break;
    }
}

// --- High Score Logic ---
function loadHighScores() {
    const storedHighScores = localStorage.getItem('snakeHighScores');
    if (storedHighScores) {
        highScores = JSON.parse(storedHighScores);
        // Ensure high score display is updated with the actual top score
        if (highScores.length > 0) {
            highScore = highScores[0].score;
            highScoreDisplay.textContent = highScore;
        } else {
            highScore = 0;
            highScoreDisplay.textContent = highScore;
        }
    } else {
        highScores = [];
        highScore = 0;
        highScoreDisplay.textContent = highScore;
    }
}

function saveHighScores() {
    localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    // Update the single high score display
    if (highScores.length > 0) {
        highScore = highScores[0].score;
        highScoreDisplay.textContent = highScore;
    } else {
        highScore = 0;
        highScoreDisplay.textContent = highScore;
    }
}

function addHighScore(newScore, newInitials) {
    highScores.push({ score: newScore, initials: newInitials });
    // Sort in descending order
    highScores.sort((a, b) => b.score - a.score);
    // Keep only the top MAX_HIGH_SCORES
    highScores = highScores.slice(0, MAX_HIGH_SCORES);
    saveHighScores();
    updateHighScoresList(); // Update the displayed list immediately
}

function updateHighScoresList() {
    highScoresList.innerHTML = ''; // Clear previous list
    if (highScores.length === 0) {
        const li = document.createElement('li');
        li.textContent = "No high scores yet!";
        highScoresList.appendChild(li);
        return;
    }
    highScores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.initials} - ${entry.score}`;
        highScoresList.appendChild(li);
    });
}

// --- Event Listeners ---
document.addEventListener('keydown', e => {
    if (isGameOver || gamePaused || changingDirection || levelUpMessageActive) return;

    const head = snake[0];
    const neck = snake[1];

    switch (e.key) {
        case 'ArrowUp':
            if (dy === 0 && !(head.y - 1 === neck.y && head.x === neck.x)) { dx = 0; dy = -1; changingDirection = true; }
            break;
        case 'ArrowDown':
            if (dy === 0 && !(head.y + 1 === neck.y && head.x === neck.x)) { dx = 0; dy = 1; changingDirection = true; }
            break;
        case 'ArrowLeft':
            if (dx === 0 && !(head.x - 1 === neck.x && head.y === neck.y)) { dx = -1; dy = 0; changingDirection = true; }
            break;
        case 'ArrowRight':
            if (dx === 0 && !(head.x + 1 === neck.x && head.y === neck.y)) { dx = 1; dy = 0; changingDirection = true; }
            break;
        case ' ': // Spacebar for pause
            e.preventDefault();
            if (!gamePaused) {
                pauseGame();
            } else {
                resumeGame();
            }
            break;
    }
});

// Mobile Controls (add !levelUpMessageActive to conditions)
upBtn.addEventListener('click', () => { if (!gamePaused && !isGameOver && dy === 0 && !changingDirection && !levelUpMessageActive) { dx = 0; dy = -1; changingDirection = true; } });
downBtn.addEventListener('click', () => { if (!gamePaused && !isGameOver && dy === 0 && !changingDirection && !levelUpMessageActive) { dx = 0; dy = 1; changingDirection = true; } });
leftBtn.addEventListener('click', () => { if (!gamePaused && !isGameOver && dx === 0 && !changingDirection && !levelUpMessageActive) { dx = -1; dy = 0; changingDirection = true; } });
rightBtn.addEventListener('click', () => { if (!gamePaused && !isGameOver && dx === 0 && !changingDirection && !levelUpMessageActive) { dx = 1; dy = 0; changingDirection = true; } });


// Button Listeners
startGameBtn.addEventListener('click', initializeGame);
restartGameBtn.addEventListener('click', initializeGame);
resumeGameBtn.addEventListener('click', resumeGame);

howToPlayBtn.addEventListener('click', () => showScreen(howToPlayScreen));
backToMainMenuBtn.addEventListener('click', () => showScreen(startScreen));

// NEW: High Scores button listeners
viewHighScoresBtn.addEventListener('click', () => {
    updateHighScoresList(); // Populate the list before showing
    showScreen(highScoreScreen);
});
backFromHighScoresBtn.addEventListener('click', () => showScreen(startScreen));


// Refactored main menu transition logic for cleaner code
function returnToMainMenu() {
    clearInterval(gameInterval);
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    snake = [];
    food = {};
    powerUps = [];
    obstacles = [];
    scorePopups = [];
    isGameOver = true; // Temporary state to ensure canvas clears on draw
    drawGame(); // Clear canvas
    isGameOver = false; // Reset for potential new game start
    showScreen(startScreen);
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

goToMainMenuBtn.addEventListener('click', returnToMainMenu);
pauseToMainMenuBtn.addEventListener('click', returnToMainMenu);


// Volume control
masterVolumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value;
    if (eatSound) eatSound.volume = volume;
    if (wallHitSound) wallHitSound.volume = volume;
    if (gameOverSound) gameOverSound.volume = volume; // Add the check here
    if (powerupSound) powerupSound.volume = volume;
    if (levelUpSound) levelUpSound.volume = volume;
    if (backgroundMusic) backgroundMusic.volume = volume * 0.7;
});
// Initial setup after images load (moved from here, now in loadImage onload)
// This was moved inside loadImage onload to ensure high scores load AFTER elements are ready.
// The initial call to requestAnimationFrame(gameLoop) is also handled there.
// highScoreDisplay.textContent = highScore; // Handled by loadHighScores() now
masterVolumeSlider.dispatchEvent(new Event('input')); // Set initial volume for all sounds

// The very first call to start the drawing loop is now inside the loadImage function,
// ensuring all assets are ready before the game starts rendering.
// showScreen(startScreen); // Also moved to loadImage onload
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('bgMusic');
const restartButton = document.getElementById('restartButton');

// Game settings
const player = { x: 50, y: canvas.height / 2 - 20, width: 20, height: 20, speed: 5, health: 3 };
let bullets = [];
let powerUps = [];
let obstacles = [];
const initialBulletSpeed = 5;
let bulletSpeed = initialBulletSpeed;
let score = 0;
let level = 1;
let gameOver = false;
let canShoot = true;
const shootCooldown = 500; // 500ms cooldown for shooting
const maxHealth = 5;
const powerUpFrequency = 0.01; // Power-up spawn rate
const maxPowerUps = 3; // Maximum number of power-ups on screen
const powerUpLifetime = 10000; // Time in milliseconds before power-up disappears

// Initialize the game
function initializeGame() {
    player.health = 3;
    player.x = 50;
    player.y = canvas.height / 2 - 20;

    bullets = [];
    powerUps = [];
    obstacles = [];
    score = 0;
    level = 1;
    bulletSpeed = initialBulletSpeed;
    gameOver = false;

    addObstacles();
    bgMusic.play();
    restartButton.classList.add('hidden');
    update();
}

// Add obstacles based on the level
function addObstacles() {
    const numberOfObstacles = level + 3;
    for (let i = 0; i < numberOfObstacles; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - 50),
            y: Math.random() * (canvas.height - 50),
            width: 50,
            height: 50,
            dx: 2 + level
        });
    }
}

// Collision detection function
function detectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update game elements
function update() {
    if (gameOver) return;

    obstacles.forEach(obstacle => {
        obstacle.x += obstacle.dx;
        if (obstacle.x <= 0 || obstacle.x + obstacle.width >= canvas.width) {
            obstacle.dx *= -1;
        }
    });

    bullets.forEach(bullet => bullet.x += bulletSpeed);

    bullets = bullets.filter(bullet => {
        const hitObstacle = obstacles.some(obstacle => detectCollision(bullet, obstacle));
        if (hitObstacle) {
            obstacles = obstacles.filter(obstacle => {
                if (detectCollision(bullet, obstacle)) {
                    score += 10;
                    return false;
                }
                return true;
            });
            return false;
        }
        return bullet.x <= canvas.width;
    });

    if (obstacles.some(obstacle => detectCollision(player, obstacle))) {
        player.health -= 1;
        if (player.health <= 0) {
            gameOver = true;
            bgMusic.pause();
            restartButton.classList.remove('hidden');
            return;
        } else {
            player.x = 50;
            player.y = canvas.height / 2 - 20;
            obstacles = [];
            addObstacles();
            level++;
        }
    }

    if (obstacles.length === 0 && !gameOver) {
        level++;
        addObstacles();
    }

    powerUps = powerUps.filter(powerUp => {
        if (detectCollision(player, powerUp)) {
            if (powerUp.type === 'speed') {
                bulletSpeed = Math.min(bulletSpeed + 2, 10);
                console.log("Speed power-up collected");
            } else if (powerUp.type === 'health') {
                player.health = Math.min(player.health + 1, maxHealth);
                console.log("Health power-up collected");
            }
            return false;
        }
        return true;
    });

    const now = Date.now();
    powerUps = powerUps.filter(powerUp => now - powerUp.spawnTime < powerUpLifetime);

    if (powerUps.length < maxPowerUps && Math.random() < powerUpFrequency) {
        powerUps.push({
            x: Math.random() * (canvas.width - 20),
            y: Math.random() * (canvas.height - 20),
            width: 20,
            height: 20,
            type: Math.random() < 0.5 ? 'speed' : 'health',
            spawnTime: Date.now()
        });
    }

    draw();
    requestAnimationFrame(update);
}

// Draw game elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = 'red';
    bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));

    ctx.fillStyle = 'green';
    obstacles.forEach(obstacle => ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height));

    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.type === 'speed' ? 'yellow' : 'purple';
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    ctx.fillText('Health: ' + player.health, canvas.width - 100, 20);

    ctx.fillText('Level: ' + level, canvas.width / 2 - 50, 20);

    if (gameOver) {
        ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2 - 20);
        ctx.fillText('Tap Restart to Play Again', canvas.width / 2 - 130, canvas.height / 2 + 20);
    }
}

// Handle user input for keyboard
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && canShoot && !gameOver) {
        bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2 - 2,
            width: 10,
            height: 5
        });
        canShoot = false;
        setTimeout(() => canShoot = true, shootCooldown);
    } else if (e.key === 'ArrowUp' && player.y > 0) {
        player.y -= player.speed;
    } else if (e.key === 'ArrowDown' && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
});

// Handle touch controls
let touchStartX = null;
let touchStartY = null;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        if (touchX > canvas.width - 110 && touchY < 50) {
            initializeGame();
        }
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && player.x < canvas.width - player.width) {
            player.x += player.speed;
        } else if (dx < 0 && player.x > 0) {
            player.x -= player.speed;
        }
    } else {
        if (dy > 0 && player.y < canvas.height - player.height) {
            player.y += player.speed;
        } else if (dy < 0 && player.y > 0) {
            player.y -= player.speed;
        }
    }

    touchStartX = touchEndX;
    touchStartY = touchEndY;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (canShoot && !gameOver) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        if (touchX > player.x && touchX < player.x + player.width &&
            touchY > player.y && touchY < player.y + player.height) {
            bullets.push({
                x: player.x + player.width,
                y: player.y + player.height / 2 - 2,
                width: 10,
                height: 5
            });
            canShoot = false;
            setTimeout(() => canShoot = true, shootCooldown);
        }
    }
});

// Restart button click event
restartButton.addEventListener('click', () => {
    initializeGame();
});

// Start the game initially
initializeGame();

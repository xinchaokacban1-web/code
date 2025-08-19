// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let score = 0;
let coins = 0;
let gameRunning = true;

// Player object
const player = {
    x: 50,
    y: 300,
    width: 30,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 15,
    onGround: false,
    direction: 1, // 1 for right, -1 for left
    color: '#FF0000'
};

// Physics constants
const gravity = 0.8;
const friction = 0.8;

// Platforms
const platforms = [
    { x: 0, y: 350, width: 800, height: 50, color: '#8B4513' }, // Ground
    { x: 200, y: 280, width: 100, height: 20, color: '#8B4513' },
    { x: 400, y: 220, width: 100, height: 20, color: '#8B4513' },
    { x: 600, y: 160, width: 100, height: 20, color: '#8B4513' },
    { x: 100, y: 120, width: 80, height: 20, color: '#8B4513' },
    { x: 500, y: 80, width: 80, height: 20, color: '#8B4513' }
];

// Coins array
let coinsArray = [
    { x: 250, y: 250, width: 15, height: 15, collected: false, color: '#FFD700' },
    { x: 450, y: 190, width: 15, height: 15, collected: false, color: '#FFD700' },
    { x: 650, y: 130, width: 15, height: 15, collected: false, color: '#FFD700' },
    { x: 150, y: 90, width: 15, height: 15, collected: false, color: '#FFD700' },
    { x: 550, y: 50, width: 15, height: 15, collected: false, color: '#FFD700' }
];

// Enemies array
let enemies = [
    { x: 300, y: 310, width: 25, height: 25, velocityX: -1, color: '#8B0000' },
    { x: 500, y: 310, width: 25, height: 25, velocityX: 1, color: '#8B0000' },
    { x: 700, y: 310, width: 25, height: 25, velocityX: -1, color: '#8B0000' }
];

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Platform collision
function checkPlatformCollision() {
    player.onGround = false;
    
    for (let platform of platforms) {
        if (checkCollision(player, platform)) {
            // Landing on top of platform
            if (player.velocityY > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
            }
            // Hitting platform from below
            else if (player.velocityY < 0 && player.y > platform.y) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Hitting platform from sides
            else if (player.velocityX > 0 && player.x < platform.x) {
                player.x = platform.x - player.width;
            }
            else if (player.velocityX < 0 && player.x > platform.x) {
                player.x = platform.x + platform.width;
            }
        }
    }
}

// Update player
function updatePlayer() {
    // Horizontal movement
    if (keys['ArrowLeft']) {
        player.velocityX = -player.speed;
        player.direction = -1;
    } else if (keys['ArrowRight']) {
        player.velocityX = player.speed;
        player.direction = 1;
    } else {
        player.velocityX *= friction;
    }
    
    // Jumping
    if (keys['Space'] && player.onGround) {
        player.velocityY = -player.jumpPower;
        player.onGround = false;
    }
    
    // Apply gravity
    if (!player.onGround) {
        player.velocityY += gravity;
    }
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height) {
        player.x = 50;
        player.y = 300;
        player.velocityX = 0;
        player.velocityY = 0;
        score = Math.max(0, score - 10);
    }
    
    checkPlatformCollision();
}

// Update enemies
function updateEnemies() {
    for (let enemy of enemies) {
        enemy.x += enemy.velocityX;
        
        // Bounce off screen edges
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            enemy.velocityX *= -1;
        }
        
        // Check collision with player
        if (checkCollision(player, enemy)) {
            // Player loses points and gets knocked back
            score = Math.max(0, score - 5);
            player.x = Math.max(0, player.x - 50);
            player.velocityY = -10;
        }
    }
}

// Check coin collection
function checkCoinCollection() {
    for (let coin of coinsArray) {
        if (!coin.collected && checkCollision(player, coin)) {
            coin.collected = true;
            coins++;
            score += 10;
        }
    }
}

// Draw functions
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw eyes
    ctx.fillStyle = '#FFFFFF';
    if (player.direction === 1) {
        ctx.fillRect(player.x + 20, player.y + 5, 5, 5);
    } else {
        ctx.fillRect(player.x + 5, player.y + 5, 5, 5);
    }
    
    // Draw hat
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x - 2, player.y - 5, player.width + 4, 8);
}

function drawPlatforms() {
    for (let platform of platforms) {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }
}

function drawCoins() {
    for (let coin of coinsArray) {
        if (!coin.collected) {
            ctx.fillStyle = coin.color;
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Coin shine
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2 - 2, coin.y + coin.height/2 - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, 3, 3);
        ctx.fillRect(enemy.x + 15, enemy.y + 5, 3, 3);
    }
}

function drawBackground() {
    // Draw clouds
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(100, 80, 20, 0, Math.PI * 2);
    ctx.arc(120, 80, 25, 0, Math.PI * 2);
    ctx.arc(140, 80, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(500, 60, 15, 0, Math.PI * 2);
    ctx.arc(515, 60, 20, 0, Math.PI * 2);
    ctx.arc(530, 60, 15, 0, Math.PI * 2);
    ctx.fill();
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('coins').textContent = coins;
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game objects
    updatePlayer();
    updateEnemies();
    checkCoinCollection();
    
    // Draw everything
    drawBackground();
    drawPlatforms();
    drawCoins();
    drawEnemies();
    drawPlayer();
    
    // Update UI
    updateUI();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
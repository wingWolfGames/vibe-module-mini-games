import gameState from './gameState'; // Import gameState

class Player {
    constructor() {
        this.lives = 5;
        // this.ammo = 6; // Removed - ammo is now managed by gameState
        this.reloading = false;
    }

    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            // Game Over logic will be handled in game state
        }
    }

    shoot() {
        // This method only checks if a shot is possible based on global game state ammo.
        // gameState.shootBullet() will handle the actual ammo decrement.
        return gameState.playerAmmo > 0;
    }

    reload() {
        // Ammo is reloaded via gameState.reloadAmmo()
        this.reloading = false;
    }
}

class Character {
    constructor(x, y, width, height, type, canvasWidth, direction = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'bad' or 'good'
        this.isAlive = true;
        this.hp = 1; // All NPCs start with 1 HP
        this.direction = direction;
        this.speed = (Math.random() * 1.5) + 1; // Random speed between 1 and 2.5
        this.isStopped = false;
        this.stopTime = 0;
        this.hasCrossedScreen = false; // New property to track if the character has successfully crossed the screen
        this.resumeTime = 0;
        this.stopDuration = (Math.random() * 1000) + 1000; // Random stop duration between 1-2 seconds
        this.canStop = Math.random() < 0.3; // 30% chance to have stop-and-go behavior
        this.canvasWidth = canvasWidth; // Initialize canvasWidth
    }

    update(deltaTime) {
        if (this.canStop) {
            if (!this.isStopped && Math.random() < 0.005) { // Small chance to stop each frame
                this.isStopped = true;
                this.stopTime = Date.now();
                this.resumeTime = this.stopTime + this.stopDuration;
            }

            if (this.isStopped && Date.now() >= this.resumeTime) {
                this.isStopped = false;
                this.stopTime = 0;
                this.resumeTime = 0;
                this.stopDuration = (Math.random() * 1000) + 1000; // Reset for next stop

                // 40% chance to change direction when resuming movement
                if (Math.random() < 0.4) {
                    this.direction *= -1;
                }
            }
        }

        // Movement logic
        if (!this.isStopped) {
            this.x += this.speed * this.direction;
        }

        // Mark as not alive if off-screen
        if (this.direction === 1 && this.x > this.canvasWidth) { // Moving right and off screen
            this.isAlive = false;
            this.hasCrossedScreen = true; // Mark as crossed if it goes off screen
        } else if (this.direction === -1 && this.x + this.width < 0) { // Moving left and off screen
            this.isAlive = false;
            this.hasCrossedScreen = true; // Mark as crossed if it goes off screen
        }
        return false; // Base character doesn't shoot
    }

    isHit(targetX, targetY, radius) {
        // Check for circular collision with a rectangular entity
        // Find the closest point on the rectangle to the center of the circle
        let testX = targetX;
        let testY = targetY;

        if (targetX < this.x) testX = this.x;
        else if (targetX > this.x + this.width) testX = this.x + this.width;

        if (targetY < this.y) testY = this.y;
        else if (targetY > this.y + this.height) testY = this.y + this.height;

        // Calculate the distance between the closest point and the circle's center
        let distX = targetX - testX;
        let distY = targetY - testY;
        let distance = Math.sqrt((distX * distX) + (distY * distY));

        // If the distance is less than the circle's radius, there's a collision
        return distance <= radius;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isAlive = false;
            if (this.type === 'bad') {
                this.stopFlashing(); // Ensure flashing stops when bad guy is killed
            }
        }
    }
}

class BadGuy extends Character {
    constructor(x, y, width, height, canvasWidth, direction, imagePath) {
        super(x, y, width, height, 'bad', canvasWidth, direction);
        this.lastShotTime = 0;
        this.reloadTime = (Math.random() * 2000) + 1000; // Random reload time between 1-3 seconds
        this.nextShotTime = Date.now() + (Math.random() * 3000) + 2000; // Initial random shot time
        this.flashing = false;
        this.flashInterval = null;
        this.flashCount = 0;
        this.maxFlashes = 6; // Flash 3 times (on/off = 2 states per flash)
        this.flashDuration = 100; // How long each flash state lasts (ms)
        this.tellDuration = 750; // 0.75 seconds before shooting
        this.timeToFlash = this.nextShotTime - this.tellDuration; // Start flashing before first shot
        this.canvasWidth = canvasWidth;
        this.hasShotOnScreen = false; // New property to track if the bad guy has shot while on screen
        this.image = new Image();
        this.image.src = imagePath;
        this.image.onerror = (err) => {
            console.error(`Failed to load BadGuy image ${imagePath}:`, err);
        };
    }

    startFlashing() {
        if (this.flashInterval) return; // Already flashing
        this.flashing = true;
        this.flashCount = 0;
        this.flashInterval = setInterval(() => {
            this.flashCount++;
            if (this.flashCount > this.maxFlashes) {
                this.stopFlashing();
            }
        }, this.flashDuration);
    }

    stopFlashing() {
        this.flashing = false;
        if (this.flashInterval) {
            clearInterval(this.flashInterval);
            this.flashInterval = null;
        }
    }

    update(deltaTime) {
        if (this.canStop) {
            if (!this.isStopped && Math.random() < 0.005) { // Small chance to stop each frame
                this.isStopped = true;
                this.stopTime = Date.now();
                this.resumeTime = this.stopTime + this.stopDuration;
            }

            if (this.isStopped && Date.now() >= this.resumeTime) {
                this.isStopped = false;
                this.stopTime = 0;
                this.resumeTime = 0;
                this.stopDuration = (Math.random() * 1000) + 1000; // Reset for next stop
            }
        }

        // Movement logic
        if (!this.isStopped) {
            this.x += this.speed * this.direction;
        }

        // Mark as not alive if off-screen
        if (this.direction === 1 && this.x > this.canvasWidth) { // Moving right and off screen
            this.isAlive = false;
        } else if (this.direction === -1 && this.x + this.width < 0) { // Moving left and off screen
            this.isAlive = false;
        }

        // Check if bad guy is on screen
        const isOnScreen = this.x + this.width > 0 && this.x < this.canvasWidth;

        // Schedule the first shot if on screen and hasn't shot yet
        if (isOnScreen && !this.hasShotOnScreen) {
            this.nextShotTime = Date.now() + (Math.random() * 1000) + 2000; // 2-3 second delay
            this.timeToFlash = this.nextShotTime - this.tellDuration; // Set time to flash for this scheduled shot
            this.hasShotOnScreen = true; // Mark that it has shot
        }
 
        // Start flashing if it's time and not already flashing
        if (!this.flashing && this.isAlive && Date.now() >= this.timeToFlash) {
            this.startFlashing();
        }
 
        // Shooting logic (can shoot even if stopped)
        if (this.isAlive && Date.now() >= this.nextShotTime) {
            this.stopFlashing(); // Ensure flashing stops when shooting
            this.lastShotTime = Date.now();
            this.reloadTime = (Math.random() * 2000) + 1000; // Randomize reload time for next shot
            this.nextShotTime = Date.now() + this.reloadTime; // Set next shot time
            this.timeToFlash = this.nextShotTime - this.tellDuration; // Set time to flash for next shot
            this.startFlashing(); // Start flashing for the next shot
            return { shot: true, x: this.x + this.width / 2, y: this.y + this.height / 2 }; // Indicate that the bad guy shot and provide coordinates
        }
        return false;
    }
}

class GoodGuy extends Character {
    constructor(x, y, width, height, canvasWidth, direction, imagePath) {
        super(x, y, width, height, 'good', canvasWidth, direction);
        this.image = new Image();
        this.image.src = imagePath;
        this.image.onerror = (err) => {
            console.error(`Failed to load GoodGuy image ${imagePath}:`, err);
        };
    }

    update(deltaTime) {
        super.update(deltaTime); // Call parent update to handle movement and off-screen logic
        return false; // Good guys don't shoot
    }
}

class UnknownGuy extends Character {
    constructor(x, y, width, height, canvasWidth, direction) {
        super(x, y, width, height, 'unknown', canvasWidth, direction);
        this.transformTime = 0;
        this.transformed = false;
        this.canStop = true; // UnknownGuy always has stop-and-go behavior
        this.stopDuration = 1000; // Fixed 1 second stop duration for transformation
    }

    update(deltaTime) {
        const superResult = super.update(deltaTime); // Call parent update to handle movement and off-screen logic

        if (!this.transformed) {
            if (this.isStopped && Date.now() >= this.transformTime) {
                this.transformed = true; // Mark as transformed
                // Return transformation event to game loop
                return { transform: true, x: this.x, y: this.y, width: this.width, height: this.height, direction: this.direction };
            }
        }
        return superResult || false; // Return super result if any, otherwise false
    }
}

class LifeUp extends Character {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'powerup');
        this.creationTime = Date.now();
        this.lifespan = 3000; // 3 seconds
    }

    update(deltaTime) {
        // Power-up does not move, but checks its lifespan
        if (Date.now() - this.creationTime > this.lifespan) {
            this.isAlive = false; // Mark for removal if lifespan exceeded
        }
        return false; // Power-up doesn't shoot or have other special updates
    }
}

export { Player, BadGuy, GoodGuy, UnknownGuy, LifeUp };
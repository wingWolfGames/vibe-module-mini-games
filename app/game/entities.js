class Player {
    constructor() {
        this.lives = 5;
        this.ammo = 6;
        this.reloading = false;
    }

    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            // Game Over logic will be handled in game state
        }
    }

    shoot() {
        if (this.ammo > 0) {
            this.ammo--;
            return true;
        }
        return false;
    }

    reload() {
        this.ammo = 6;
        this.reloading = false;
    }
}

class Character {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'bad' or 'good'
        this.isAlive = true;
    }

    isHit(targetX, targetY) {
        return targetX >= this.x && targetX <= this.x + this.width &&
               targetY >= this.y && targetY <= this.y + this.height;
    }
}

class BadGuy extends Character {
    constructor(x, y, width, height, canvasWidth) {
        super(x, y, width, height, 'bad');
        this.shootsAt = Date.now() + (Math.random() * 3000) + 2000; // Random time between 2-5 seconds
        this.flashing = false;
        this.flashInterval = null;
        this.flashCount = 0;
        this.maxFlashes = 6; // Flash 3 times (on/off = 2 states per flash)
        this.flashDuration = 100; // How long each flash state lasts (ms)
        this.timeToFlash = this.shootsAt - (this.maxFlashes * this.flashDuration); // Start flashing before shooting
        this.speed = 2; // Pixels per frame
        this.direction = 1; // 1 for right, -1 for left
        this.canvasWidth = canvasWidth;
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
        // Movement logic
        this.x += this.speed * this.direction;

        // Bounce off edges
        if (this.x + this.width > this.canvasWidth || this.x < 0) {
            this.direction *= -1; // Reverse direction
        }

        // Start flashing if it's time
        if (!this.flashing && Date.now() >= this.timeToFlash && this.isAlive) {
            this.startFlashing();
        }

        if (Date.now() >= this.shootsAt && this.isAlive) {
            this.stopFlashing(); // Ensure flashing stops when shooting
            return true; // Indicate that the bad guy shot
        }
        return false;
    }
}

class GoodGuy extends Character {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'good');
    }
}

export { Player, BadGuy, GoodGuy };
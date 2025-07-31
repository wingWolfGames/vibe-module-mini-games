class GameState {
    constructor() {
        this.playerLives = 5;
        this.playerAmmo = 6;
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.showDoubleTapToShoot = true; // New property for the initial instruction
        this.badGuys = [];
        this.goodGuys = [];
        this.hitCircles = []; // New property for hit circles
        this.isPlayerHit = false; // New property for hit feedback
        this.badGuyShotEffects = []; // New property for bad guy shooting effects
        this.showReloadOk = false; // New property for reload success feedback
        this.isReloadShaking = false; // New property for reload shake feedback
    }

    reset() {
        this.playerLives = 5; // Increased lives as per user request
        this.playerAmmo = 6;
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.showDoubleTapToShoot = true; // Reset on game reset
        this.badGuys = [];
        this.goodGuys = [];
        this.hitCircles = []; // Reset hit circles on game reset
        this.isPlayerHit = false;
        this.badGuyShotEffects = []; // Reset bad guy shot effects on game reset
        this.showReloadOk = false; // Reset reload success feedback on game reset
        this.isReloadShaking = false; // Reset reload shake feedback on game reset
    }

    loseLife() {
        this.playerLives--;
        this.isPlayerHit = true; // Set to true when player is hit
        setTimeout(() => {
            this.isPlayerHit = false; // Reset after a short duration
        }, 200); // Flash/shake duration
        if (this.playerLives <= 0) {
            this.gameOver = true;
        }
    }

    shootBullet() {
        if (this.playerAmmo > 0) {
            this.playerAmmo--;
            if (this.showDoubleTapToShoot) { // If it's the first shot
                this.showDoubleTapToShoot = false; // Hide the instruction
            }
            return true;
        }
        return false;
    }

    reloadAmmo() {
        if (this.playerAmmo < 6) {
            this.playerAmmo = 6;
            this.showReloadOk = true;
            this.isReloadShaking = true;
            setTimeout(() => {
                this.showReloadOk = false;
                this.isReloadShaking = false;
            }, 500); // Display for 0.5 seconds and shake duration
            return true;
        }
        return false;
    }

    addScore(points) {
        this.score += points;
    }

    addBadGuy(badGuy) {
        this.badGuys.push(badGuy);
    }

    removeBadGuy(badGuy) {
        this.badGuys = this.badGuys.filter(bg => bg !== badGuy);
    }

    addGoodGuy(goodGuy) {
        this.goodGuys.push(goodGuy);
    }

    removeGoodGuy(goodGuy) {
        this.goodGuys = this.goodGuys.filter(gg => gg !== goodGuy);
    }
    createHitCircle(x, y, radius = 25) {
        this.hitCircles.push({ x, y, radius, creationTime: Date.now() });
    }

    processHitCircles() {
        const HIT_CIRCLE_DURATION = 100; // milliseconds
        const currentTime = Date.now();

        // Filter out expired hit circles
        this.hitCircles = this.hitCircles.filter(circle => currentTime - circle.creationTime < HIT_CIRCLE_DURATION);

        this.hitCircles.forEach(circle => {
            // Check collision with bad guys
            this.badGuys.forEach(badGuy => {
                if (badGuy.isAlive && badGuy.isHit(circle.x, circle.y, circle.radius)) {
                    badGuy.takeDamage(1);
                    if (!badGuy.isAlive) {
                        this.addScore(10); // Score for hitting a bad guy
                    }
                }
            });

            // Check collision with good guys
            this.goodGuys.forEach(goodGuy => {
                if (goodGuy.isAlive && goodGuy.isHit(circle.x, circle.y, circle.radius)) {
                    goodGuy.takeDamage(1);
                    if (!goodGuy.isAlive) {
                        this.loseLife(); // Lose life for hitting a good guy
                    }
                }
            });
        });

        // Remove dead bad guys and good guys
        this.badGuys = this.badGuys.filter(bg => bg.isAlive);
        this.goodGuys = this.goodGuys.filter(gg => gg.isAlive);
    }

    createBadGuyShotEffect(x, y) {
        const DURATION = 500; // 0.5 seconds
        this.badGuyShotEffects.push({
            x,
            y,
            creationTime: Date.now(),
            duration: DURATION
        });
    }

    processBadGuyShotEffects() {
        const currentTime = Date.now();
        this.badGuyShotEffects = this.badGuyShotEffects.filter(effect => {
            return currentTime - effect.creationTime < effect.duration;
        });
    }
}

const gameState = new GameState();
export default gameState;
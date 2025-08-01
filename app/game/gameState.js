class GameState {
    constructor() {
        this.playerLives = 10;
        this.playerAmmo = 6;
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.showDoubleTapToShoot = true; // New property for the initial instruction
        this.currentScreen = 'TITLE'; // 'TITLE', 'INTRO', 'PLAYING'
        this.hasGameBeenPlayedOnce = false; // New property to track if game has been played at least once
        this.currentLevel = 1; // New property for current level
        this.scoreThresholdForNextLevel = 50; // New property for score threshold to next level
        this.badGuys = [];
        this.goodGuys = [];
        this.unknownGuys = []; // New property for unknown guys
        this.lifeUps = []; // New property for LifeUp power-ups
        this.hitCircles = []; // New property for hit circles
        this.isPlayerHit = false; // New property for hit feedback
        this.badGuyShotEffects = []; // New property for bad guy shooting effects
        this.showReloadOk = false; // New property for reload success feedback
        this.isReloadShaking = false; // New property for reload shake feedback
        this.isHitByBadGuy = false; // New property for bad guy hit feedback
        this.playerHitTimeoutId = null; // To store timeout ID for player hit feedback
        this.reloadOkTimeoutId = null; // To store timeout ID for reload feedback
    }

    reset() {
        this.playerLives = 10; // Set to max lives as per user request
        this.playerAmmo = 6;
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.showDoubleTapToShoot = true; // Reset on game reset
        this.currentScreen = 'TITLE'; // Reset to title screen on game reset
        this.currentLevel = 1; // Reset current level on game reset
        this.scoreThresholdForNextLevel = 50; // Reset score threshold on game reset
        this.badGuys = [];
        this.goodGuys = [];
        this.unknownGuys = []; // Reset unknown guys on game reset
        this.lifeUps = []; // Reset life-ups on game reset
        this.hitCircles = []; // Reset hit circles on game reset
        this.isPlayerHit = false;
        this.isHitByBadGuy = false;
        this.badGuyShotEffects = []; // Reset bad guy shot effects on game reset
        this.showReloadOk = false; // Reset reload success feedback on game reset
        this.isReloadShaking = false; // Reset reload shake feedback on game reset
        this.clearTimeouts(); // Clear any pending timeouts on reset
    }

    loseLife(isBadGuyAttack = false) {
        this.playerLives--;
        this.isPlayerHit = true;
        this.isHitByBadGuy = isBadGuyAttack;
        if (this.playerHitTimeoutId) clearTimeout(this.playerHitTimeoutId);
        this.playerHitTimeoutId = setTimeout(() => {
            this.isPlayerHit = false;
            this.isHitByBadGuy = false;
            this.playerHitTimeoutId = null;
        }, 200);
        if (this.playerLives <= 0) {
            this.gameOver = true;
            this.clearTimeouts();
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
            if (this.reloadOkTimeoutId) clearTimeout(this.reloadOkTimeoutId); // Clear previous timeout
            this.reloadOkTimeoutId = setTimeout(() => {
                this.showReloadOk = false;
                this.isReloadShaking = false;
                this.reloadOkTimeoutId = null;
            }, 500); // Display for 0.5 seconds and shake duration
            return true;
        }
        return false;
    }

    addScore(points) {
        this.score += points;
        if (this.score >= this.scoreThresholdForNextLevel) {
            this.currentLevel++;
            // For now, assuming 4 levels based on backgroundImages array in gameCanvas.js
            // In the future, this should be dynamic or configured elsewhere.
            if (this.currentLevel > 4) { // Assuming 4 levels (1-4)
                this.currentLevel = 1; // Cycle back to Level 1
            }
            this.scoreThresholdForNextLevel += 50; // Increase threshold for next level
        }
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

    addUnknownGuy(unknownGuy) {
        this.unknownGuys.push(unknownGuy);
    }

    removeUnknownGuy(unknownGuy) {
        this.unknownGuys = this.unknownGuys.filter(ug => ug !== unknownGuy);
    }

    addLife(amount = 1) {
        this.playerLives += amount;
    }

    addLifeUp(lifeUp) {
        this.lifeUps.push(lifeUp);
    }

    removeLifeUp(lifeUp) {
        this.lifeUps = this.lifeUps.filter(lu => lu !== lifeUp);
    }

    createHitCircle(x, y, radius = 25) {
        this.hitCircles.push({ x, y, radius, creationTime: Date.now() });
    }

    processHitCircles() {
        if (this.gameOver) return; // Immediately stop processing if game is over

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

            // Check collision with unknown guys
            this.unknownGuys.forEach(unknownGuy => {
                if (unknownGuy.isAlive && unknownGuy.isHit(circle.x, circle.y, circle.radius)) {
                    unknownGuy.takeDamage(1);
                    if (!unknownGuy.isAlive) {
                        this.loseLife(); // Lose life for hitting an unknown guy
                    }
                }
            });

            // Check collision with LifeUp power-ups
            this.lifeUps.forEach(lifeUp => {
                if (lifeUp.isAlive && lifeUp.isHit(circle.x, circle.y, circle.radius)) {
                    this.addLife(1); // Add 1 life to the player
                    lifeUp.isAlive = false; // Mark power-up for removal
                }
            });
        });

        // Remove dead bad guys, good guys, unknown guys, and collected life-ups
        this.badGuys = this.badGuys.filter(bg => bg.isAlive);
        this.goodGuys = this.goodGuys.filter(gg => gg.isAlive);
        this.unknownGuys = this.unknownGuys.filter(ug => ug.isAlive);
        this.lifeUps = this.lifeUps.filter(lu => lu.isAlive);
    }

    createBadGuyShotEffect(x, y) {
        const DURATION = 500; // 0.5 seconds
        this.badGuyShotEffects.push({
            x,
            y,
            creationTime: performance.now(),
            duration: DURATION,
            damageApplied: false
        });
    }

    processBadGuyShotEffects() {
        const currentTime = performance.now();
        this.badGuyShotEffects = this.badGuyShotEffects.filter(effect => {
            return currentTime - effect.creationTime < effect.duration;
        });
    }
    clearTimeouts() {
        if (this.playerHitTimeoutId) {
            clearTimeout(this.playerHitTimeoutId);
            this.playerHitTimeoutId = null;
        }
        if (this.reloadOkTimeoutId) {
            clearTimeout(this.reloadOkTimeoutId);
            this.reloadOkTimeoutId = null;
        }
    }

    setScreen(screenName) {
        this.currentScreen = screenName;
    }

    getBackgroundIndexForLevel() {
        // Assuming backgroundImages array in gameCanvas.js has 4 elements (index 0-3)
        // Level 1 maps to index 0, Level 2 to index 1, etc.
        // The modulo operator ensures cycling back to 0 if currentLevel exceeds the array length.
        return (this.currentLevel - 1) % 4; // Adjust 4 if the number of backgrounds changes
    }
}

const gameState = new GameState();
export default gameState;
class GameState {
    constructor() {
        this.playerLives = 5;
        this.playerAmmo = 6;
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.badGuys = [];
        this.goodGuys = [];
        this.hitCircles = []; // New property for hit circles
        this.isPlayerHit = false; // New property for hit feedback
    }

    reset() {
        this.playerLives = 25; // Increased lives as per user request
        this.playerAmmo = 6;
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.badGuys = [];
        this.goodGuys = [];
        this.hitCircles = []; // Reset hit circles on game reset
        this.isPlayerHit = false;
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
            return true;
        }
        return false;
    }

    reloadAmmo() {
        this.playerAmmo = 6;
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
    createHitCircle(x, y, radius = 50) {
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
                        this.addScore(100); // Score for hitting a bad guy
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
}

const gameState = new GameState();
export default gameState;
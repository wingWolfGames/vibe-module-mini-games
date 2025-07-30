class GameState {
    constructor() {
        this.playerLives = 5;
        this.playerAmmo = 6;
        this.score = 0;
        this.gameOver = false;
        this.gameStarted = false;
        this.badGuys = [];
        this.goodGuys = [];
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
}

const gameState = new GameState();
export default gameState;
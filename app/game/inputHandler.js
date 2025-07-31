import gameState from './gameState';

class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.isMouseDown = false;
        this.mouseDownTime = 0;
        this.lastClickTime = 0;
        this.clickCount = 0;
        this.swipeStartY = 0;
        this.reloadThreshold = 50; // Pixels to swipe up for reload

        this.initEventListeners();
    }

    initEventListeners() {
        // Mouse events for PC testing
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));

        this.onShoot = null; // Callback for shooting
        this.onReload = null; // Callback for reloading
    }

    handleMouseDown(event) {
        if (gameState.isTitleScreen || gameState.gameOver) return; // Ignore input on title screen or game over
        this.isMouseDown = true;
        this.mouseDownTime = Date.now();
        this.swipeStartY = event.clientY;
    }

    handleMouseUp(event) {
        if (gameState.isTitleScreen || gameState.gameOver) return; // Ignore input on title screen or game over
        this.isMouseDown = false;
        const clickDuration = Date.now() - this.mouseDownTime;

        // Double-tap simulation for shooting
        if (clickDuration < 200) { // Short click
            const currentTime = Date.now();
            if (currentTime - this.lastClickTime < 300) { // Second click within 300ms
                this.clickCount++;
                if (this.clickCount === 2) {
                    if (this.onShoot) {
                        const rect = this.canvas.getBoundingClientRect();
                        const x = event.clientX - rect.left;
                        const y = event.clientY - rect.top;
                        this.onShoot(x, y);
                        gameState.createHitCircle(x, y); // Create hit circle on shoot
                    }
                    this.clickCount = 0; // Reset for next double tap
                }
            } else {
                this.clickCount = 1;
            }
            this.lastClickTime = currentTime;
        }
    }

    handleMouseMove(event) {
        if (this.isMouseDown && this.onReload) {
            const swipeDistance = this.swipeStartY - event.clientY;
            if (swipeDistance > this.reloadThreshold) {
                if (gameState.reloadAmmo()) { // Call reloadAmmo and check if successful
                    this.onReload(); // Only call onReload if reload was successful
                }
                this.isMouseDown = false; // Prevent continuous reloading
            }
        }
    }

    handleTouchStart(event) {
        if (gameState.isTitleScreen || gameState.gameOver) return; // Ignore input on title screen or game over
        if (event.touches.length === 1) {
            this.isMouseDown = true; // Simulate mouse down for touch
            this.mouseDownTime = Date.now();
            this.swipeStartY = event.touches[0].clientY;
        }
    }

    handleTouchEnd(event) {
        if (gameState.isTitleScreen || gameState.gameOver) return; // Ignore input on title screen or game over
        this.isMouseDown = false; // Simulate mouse up for touch
        const clickDuration = Date.now() - this.mouseDownTime;

        // Double-tap for shooting
        if (clickDuration < 200) { // Short touch
            const currentTime = Date.now();
            if (currentTime - this.lastClickTime < 300) { // Second touch within 300ms
                this.clickCount++;
                if (this.clickCount === 2) {
                    if (this.onShoot) {
                        const touch = event.changedTouches[0];
                        const rect = this.canvas.getBoundingClientRect();
                        const x = touch.clientX - rect.left;
                        const y = touch.clientY - rect.top;
                        this.onShoot(x, y);
                        gameState.createHitCircle(x, y); // Create hit circle on shoot
                    }
                    this.clickCount = 0; // Reset for next double tap
                }
            } else {
                this.clickCount = 1;
            }
            this.lastClickTime = currentTime;
        }
    }

    handleTouchMove(event) {
        if (this.isMouseDown && event.touches.length === 1 && this.onReload) {
            const swipeDistance = this.swipeStartY - event.touches[0].clientY;
            if (swipeDistance > this.reloadThreshold) {
                if (gameState.reloadAmmo()) { // Call reloadAmmo and check if successful
                    this.onReload(); // Only call onReload if reload was successful
                }
                this.isMouseDown = false; // Prevent continuous reloading
            }
        }
    }
}

export default InputHandler;
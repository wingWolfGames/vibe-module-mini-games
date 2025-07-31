import gameState from './gameState';

class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.isMouseDown = false;
        this.mouseDownTime = 0;
        this.swipeStartY = 0;
        this.reloadThreshold = 50; // Pixels to swipe up for reload
        this.canShoot = true; // Flag to control shooting rate
        this.shootCooldown = 200; // Cooldown in ms after a shot

        this.initEventListeners();
    }

    initEventListeners() {
        // Mouse events for PC testing
        this.boundHandleMouseDown = this.handleMouseDown.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleTouchStart = this.handleTouchStart.bind(this);
        this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
        this.boundHandleTouchMove = this.handleTouchMove.bind(this);

        this.canvas.addEventListener('mousedown', this.boundHandleMouseDown);
        this.canvas.addEventListener('mouseup', this.boundHandleMouseUp);
        this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.boundHandleTouchStart);
        this.canvas.addEventListener('touchend', this.boundHandleTouchEnd);
        this.canvas.addEventListener('touchmove', this.boundHandleTouchMove);

        this.onShoot = null; // Callback for shooting
        this.onReload = null; // Callback for reloading
    }

    handleMouseDown(event) {
        if (gameState.currentScreen !== 'PLAYING' || gameState.gameOver) return; // Ignore input if not playing or game over
        this.isMouseDown = true;
        this.mouseDownTime = Date.now();
        this.swipeStartY = event.clientY;
    }

    handleMouseUp(event) {
        if (gameState.currentScreen !== 'PLAYING' || gameState.gameOver) return; // Ignore input if not playing or game over
        this.isMouseDown = false;
        const clickDuration = Date.now() - this.mouseDownTime;

        // Shooting logic (simple debounce)
        if (clickDuration < 200) { // Short click/touch
            if (this.onShoot && this.canShoot) {
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                this.onShoot(x, y);
                this.canShoot = false; // Disable shooting
                setTimeout(() => {
                    this.canShoot = true; // Re-enable after cooldown
                }, this.shootCooldown);
            }
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
        if (gameState.currentScreen !== 'PLAYING' || gameState.gameOver) return; // Ignore input if not playing or game over
        if (event.touches.length === 1) {
            this.isMouseDown = true; // Simulate mouse down for touch
            this.mouseDownTime = Date.now();
            this.swipeStartY = event.touches[0].clientY;
        }
    }

    handleTouchEnd(event) {
        if (gameState.currentScreen !== 'PLAYING' || gameState.gameOver) return; // Ignore input if not playing or game over
        this.isMouseDown = false; // Simulate mouse up for touch
        const clickDuration = Date.now() - this.mouseDownTime;

        // Shooting logic (simple debounce)
        if (clickDuration < 200) { // Short touch
            if (this.onShoot && this.canShoot) {
                const touch = event.changedTouches[0];
                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.onShoot(x, y);
                this.canShoot = false; // Disable shooting
                setTimeout(() => {
                    this.canShoot = true; // Re-enable after cooldown
                }, this.shootCooldown);
            }
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
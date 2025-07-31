import React, { useRef, useEffect, useCallback, useState } from 'react';
import InputHandler from './inputHandler';
import gameState from './gameState';
import { Player, BadGuy, GoodGuy } from './entities';
import GameUI from './GameUI'; // Import GameUI

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const inputHandlerRef = useRef(null);
    const playerRef = useRef(new Player());
    const animationFrameId = useRef(null);
    const spawnIntervalId = useRef(null); // New ref for spawn interval
    const [localShowDoubleTapToShoot, setLocalShowDoubleTapToShoot] = useState(gameState.showDoubleTapToShoot);

    const gameLoop = useCallback((timestamp) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Apply screen shake and red flash if player is hit
        let shakeX = 0;
        let shakeY = 0;
        if (gameState.isPlayerHit) {
            shakeX = (Math.random() - 0.5) * 10; // Shake by up to 10 pixels
            shakeY = (Math.random() - 0.5) * 10;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red flash
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (gameState.isReloadShaking) {
            shakeY = (Math.random() - 0.5) * 5; // Subtle vertical shake for reload
        }

        ctx.save(); // Save the current canvas state
        ctx.translate(shakeX, shakeY); // Apply shake translation

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game state
        gameState.processHitCircles(); // Process hit circles and collisions
        gameState.processBadGuyShotEffects(); // Process bad guy shot effects

        gameState.badGuys.forEach(badGuy => {
            const shotResult = badGuy.update(timestamp);
            if (shotResult && shotResult.shot) {
                // NPC shoots player, take 1 life away
                gameState.loseLife();
                gameState.createBadGuyShotEffect(shotResult.x, shotResult.y);
                console.log('Player lives:', gameState.playerLives);
            }
        });

        gameState.goodGuys.forEach(goodGuy => {
            goodGuy.update(timestamp); // Update good guy movement
        });

        gameState.goodGuys.forEach(goodGuy => {
            goodGuy.update(timestamp); // Update good guy movement
        });

        // Remove dead bad guys (if any)
        gameState.badGuys = gameState.badGuys.filter(bg => bg.isAlive);
        gameState.goodGuys = gameState.goodGuys.filter(gg => gg.isAlive); // Also remove dead good guys

        // Render entities
        gameState.badGuys.forEach(badGuy => {
            // Flash between orange and red
            ctx.fillStyle = (badGuy.flashing && badGuy.flashCount % 2 === 0) ? 'orange' : 'red';
            ctx.fillRect(badGuy.x, badGuy.y, badGuy.width, badGuy.height);
        });

        gameState.goodGuys.forEach(goodGuy => {
            ctx.fillStyle = 'blue';
            ctx.fillRect(goodGuy.x, goodGuy.y, goodGuy.width, goodGuy.height);
        });

        // Draw bad guy shooting effects
        gameState.badGuyShotEffects.forEach(effect => {
            const elapsed = timestamp - effect.creationTime;
            const progress = elapsed / effect.duration; // 0 to 1
            const maxRadius = Math.max(canvas.width, canvas.height) * 1.2; // Expand beyond screen
            const currentRadius = Math.max(0, maxRadius * progress); // Ensure radius is not negative
            const opacity = Math.max(0, Math.min(1, 1 - progress)); // Fade out, clamped between 0 and 1

            ctx.beginPath();
            ctx.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`; // Red, fading out
            ctx.fill();
        });

        // Draw hit circles
        gameState.hitCircles.forEach(circle => {
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // Semi-transparent yellow
            ctx.fill();
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        ctx.restore(); // Restore canvas state to remove shake translation

        if (!gameState.gameOver) {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
    }, []);

    const spawnRandomNPC = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const isBadGuy = Math.random() < 0.8; // 80% chance for a bad guy
        const fromLeft = Math.random() < 0.5; // 50% chance to come from left
        const y = Math.random() * (canvas.height - 50); // Random height, ensure it's within canvas bounds
        const width = 50;
        const height = 50;

        let x;
        let direction;

        if (fromLeft) {
            x = -width; // Start off-screen to the left
            direction = 1; // Move right
        } else {
            x = canvas.width; // Start off-screen to the right
            direction = -1; // Move left
        }

        if (isBadGuy) {
            const badGuy = new BadGuy(x, y, width, height, canvas.width, direction);
            gameState.addBadGuy(badGuy);
        } else {
            const goodGuy = new GoodGuy(x, y, width, height, direction);
            goodGuy.canvasWidth = canvas.width; // GoodGuy also needs canvasWidth for off-screen check
            gameState.addGoodGuy(goodGuy);
        }
    }, []);

    const handleRestart = useCallback(() => {
        gameState.reset();
        playerRef.current = new Player(); // Re-initialize player
        // Clear existing entities and re-spawn if needed
        gameState.badGuys = [];
        gameState.goodGuys = [];
        // Re-start game loop if it was stopped
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        if (spawnIntervalId.current) { // Clear existing spawn interval
            clearInterval(spawnIntervalId.current);
        }
        animationFrameId.current = requestAnimationFrame(gameLoop);
        gameState.gameStarted = true; // Ensure gameStarted is true after restart
        // Do not start spawn interval immediately on restart
    }, [gameLoop, spawnRandomNPC]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement; // Get the parent container
        if (container) {
            container.style.width = window.innerWidth > 600 ? '400px' : '90%';
            container.style.height = `${window.innerHeight * 0.8}px`;
            container.style.position = 'relative'; // Ensure container is positioned for absolute children
        }

        canvas.width = window.innerWidth > 600 ? 400 : window.innerWidth * 0.9;
        canvas.height = window.innerHeight * 0.8;

        inputHandlerRef.current = new InputHandler(canvas);

        inputHandlerRef.current.onShoot = (x, y) => {
            if (gameState.gameOver || !gameState.gameStarted) return;

            if (playerRef.current.shoot()) {
                gameState.shootBullet();
                console.log('Shot fired! Ammo:', gameState.playerAmmo);

                // Hit detection is now handled by gameState.processHitCircles
                // The onShoot callback in inputHandler.js now directly calls gameState.createHitCircle
                // which will then be processed in the gameLoop by gameState.processHitCircles
            } else {
                console.log('Out of ammo!');
            }
        };

        inputHandlerRef.current.onReload = () => {
            if (gameState.gameOver || !gameState.gameStarted) return;
            if (playerRef.current.ammo < 6 && !playerRef.current.reloading) {
                playerRef.current.reloading = true;
                console.log('Reloading...');
                setTimeout(() => {
                    playerRef.current.reload();
                    gameState.reloadAmmo();
                    console.log('Reloaded! Ammo:', gameState.playerAmmo);
                }, 1000);
            }
        };

        gameState.gameStarted = true;
        animationFrameId.current = requestAnimationFrame(gameLoop);

        // Do not start spawn interval immediately

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (spawnIntervalId.current) { // Clear the interval on unmount
                clearInterval(spawnIntervalId.current);
            }
            if (inputHandlerRef.current) {
                const ih = inputHandlerRef.current;
                ih.canvas.removeEventListener('mousedown', ih.handleMouseDown);
                ih.canvas.removeEventListener('mouseup', ih.handleMouseUp);
                ih.canvas.removeEventListener('mousemove', ih.handleMouseMove);
                ih.canvas.removeEventListener('touchstart', ih.handleTouchStart);
                ih.canvas.removeEventListener('touchend', ih.handleTouchEnd);
                ih.canvas.removeEventListener('touchmove', ih.handleTouchMove);
            }
            // Reset playerRef when component unmounts or game restarts
            playerRef.current = new Player();
        };
    }, [gameLoop, spawnRandomNPC]);

    useEffect(() => {
        const updateLocalState = () => {
            setLocalShowDoubleTapToShoot(gameState.showDoubleTapToShoot);
        };
        const interval = setInterval(updateLocalState, 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!localShowDoubleTapToShoot && !spawnIntervalId.current) {
            spawnIntervalId.current = setInterval(spawnRandomNPC, 2000);
        }
    }, [localShowDoubleTapToShoot, spawnRandomNPC]);

    return (
        <div style={{ border: '1px solid black', margin: 'auto', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
            <GameUI onRestart={handleRestart} />
        </div>
    );
};

export default GameCanvas;
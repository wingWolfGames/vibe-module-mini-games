import React, { useRef, useEffect, useCallback } from 'react';
import InputHandler from './inputHandler';
import gameState from './gameState';
import { Player, BadGuy, GoodGuy } from './entities';
import GameUI from './GameUI'; // Import GameUI

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const inputHandlerRef = useRef(null);
    const playerRef = useRef(new Player());
    const animationFrameId = useRef(null);

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
        }

        ctx.save(); // Save the current canvas state
        ctx.translate(shakeX, shakeY); // Apply shake translation

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game state
        gameState.processHitCircles(); // Process hit circles and collisions

        gameState.badGuys.forEach(badGuy => {
            if (badGuy.update(timestamp)) {
                // NPC shoots player, take 1 life away
                gameState.loseLife();
                console.log('Player lives:', gameState.playerLives);
            }
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

        if (gameState.gameOver) {
            ctx.fillStyle = 'black';
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        } else {
            animationFrameId.current = requestAnimationFrame(gameLoop);
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
        animationFrameId.current = requestAnimationFrame(gameLoop);

        // Re-spawn initial entities for testing
        const canvas = canvasRef.current;
        if (canvas) {
            setTimeout(() => {
                const badGuy = new BadGuy(canvas.width / 4, canvas.height / 4, 50, 50, canvas.width);
                gameState.addBadGuy(badGuy);
                console.log('Bad guy spawned after restart!');
            }, 1000); // Shorter delay for restart testing

            setTimeout(() => {
                const goodGuy = new GoodGuy(canvas.width * 3 / 4, canvas.height / 4, 50, 50);
                gameState.addGoodGuy(goodGuy);
                console.log('Good guy spawned after restart!');
            }, 2000);
        }
    }, [gameLoop, Player]); // Add Player to dependencies

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

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

        setTimeout(() => {
            const badGuy = new BadGuy(canvas.width / 4, canvas.height / 4, 50, 50, canvas.width);
            gameState.addBadGuy(badGuy);
            // badGuy.startFlashing(); // Flashing is now handled by update method based on timeToFlash
            console.log('Bad guy spawned!');
        }, 3000);

        setTimeout(() => {
            const goodGuy = new GoodGuy(canvas.width * 3 / 4, canvas.height / 4, 50, 50);
            gameState.addGoodGuy(goodGuy);
            console.log('Good guy spawned!');
        }, 5000);


        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
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
    }, [gameLoop]);

    return (
        <>
            <canvas ref={canvasRef} style={{ border: '1px solid black', display: 'block', margin: 'auto' }}></canvas>
            <GameUI onRestart={handleRestart} />
        </>
    );
};

export default GameCanvas;
import React, { useRef, useEffect, useCallback, useState } from 'react';
import InputHandler from './inputHandler';
import gameState from './gameState';
import { Player, BadGuy, GoodGuy } from './entities';
import GameUI from './GameUI';
import TitleScreen from '../../components/TitleScreen';

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const inputHandlerRef = useRef(null);
    const playerRef = useRef(new Player());
    const animationFrameId = useRef(null);
    const spawnIntervalId = useRef(null);
    const reloadTimeoutId = useRef(null); // New ref for reload timeout

    // Centralized UI State (now managed by gameState.currentScreen)
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [gameActive, setGameActive] = useState(false); // New state for active game
    const [currentScreen, setCurrentScreen] = useState(gameState.currentScreen); // Use gameState for current screen
    const [lives, setLives] = useState(gameState.playerLives);
    const [ammo, setAmmo] = useState(gameState.playerAmmo);
    const [score, setScore] = useState(gameState.score);
    const [showReloadOk, setShowReloadOk] = useState(false);
    const [isFlashingReload, setIsFlashingReload] = useState(false);
    const [showDoubleTapToShoot, setShowDoubleTapToShoot] = useState(true);

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameStarted) {
            animationFrameId.current = requestAnimationFrame(gameLoop);
            return;
        }

        // Centralized state update
        setLives(gameState.playerLives);
        setAmmo(gameState.playerAmmo);
        setScore(gameState.score);
        setGameOver(gameState.gameOver);
        setShowReloadOk(gameState.showReloadOk);
        setIsFlashingReload(gameState.playerAmmo === 0);
        setShowDoubleTapToShoot(gameState.showDoubleTapToShoot);
        setCurrentScreen(gameState.currentScreen); // Update current screen state

        if (gameState.gameOver) {
            if (spawnIntervalId.current) {
                clearInterval(spawnIntervalId.current);
                spawnIntervalId.current = null;
            }
            gameState.badGuys = [];
            gameState.goodGuys = [];
            gameState.hitCircles = [];
            gameState.badGuyShotEffects = [];
            animationFrameId.current = requestAnimationFrame(gameLoop);
            return;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
            let shakeX = 0;
            let shakeY = 0;

            if (gameState.isPlayerHit) {
                shakeX = (Math.random() - 0.5) * 10;
                shakeY = (Math.random() - 0.5) * 10;
            } else if (gameState.isReloadShaking) {
                shakeY = (Math.random() - 0.5) * 5;
            }

            ctx.save();
            ctx.translate(shakeX, shakeY);

            gameState.processHitCircles();
            gameState.processBadGuyShotEffects();

            gameState.badGuys.forEach(badGuy => {
                const shotResult = badGuy.update(performance.now());
                if (shotResult && shotResult.shot && !gameState.gameOver) {
                    gameState.createBadGuyShotEffect(shotResult.x, shotResult.y);
                }
            });

            gameState.goodGuys.forEach(goodGuy => goodGuy.update(performance.now()));
            gameState.badGuys = gameState.badGuys.filter(bg => bg.isAlive);
            gameState.goodGuys = gameState.goodGuys.filter(gg => gg.isAlive);

            gameState.badGuys.forEach(badGuy => {
                ctx.fillStyle = (badGuy.flashing && badGuy.flashCount % 2 === 0) ? 'orange' : 'red';
                ctx.fillRect(badGuy.x, badGuy.y, badGuy.width, badGuy.height);
            });

            gameState.goodGuys.forEach(goodGuy => {
                ctx.fillStyle = 'blue';
                ctx.fillRect(goodGuy.x, goodGuy.y, goodGuy.width, goodGuy.height);
            });

            gameState.badGuyShotEffects.forEach(effect => {
                const elapsed = (performance.now() - effect.creationTime) + 16;
                const progress = elapsed / effect.duration;
                const maxRadius = Math.max(canvas.width, canvas.height);
                const currentRadius = Math.max(0, maxRadius * progress);
                const opacity = Math.max(0, 1 - progress);

                if (progress >= 1 && !effect.damageApplied) {
                    gameState.loseLife(true);
                    effect.damageApplied = true;
                }

                ctx.beginPath();
                ctx.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
                ctx.fill();
            });

            gameState.hitCircles.forEach(circle => {
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.fill();
                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // Draw the full-screen red flash after all other elements
            if (gameState.isPlayerHit && !gameState.isHitByBadGuy) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.restore();
        } catch (error) {
            console.error("Error in game loop:", error);
            gameState.gameOver = true;
        }

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [gameStarted]);

    const spawnRandomNPC = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const isBadGuy = Math.random() < 0.8;
        const fromLeft = Math.random() < 0.5;
        const y = Math.random() * (canvas.height - 50);
        const width = 50;
        const height = 50;
        let x = fromLeft ? -width : canvas.width;
        let direction = fromLeft ? 1 : -1;

        if (isBadGuy) {
            gameState.addBadGuy(new BadGuy(x, y, width, height, canvas.width, direction));
        } else {
            const goodGuy = new GoodGuy(x, y, width, height, direction);
            goodGuy.canvasWidth = canvas.width;
            gameState.addGoodGuy(goodGuy);
        }
    }, []);

    const startIntro = useCallback(() => {
        gameState.setScreen('INTRO');
        setCurrentScreen('INTRO'); // Explicitly update local state
        setGameActive(false); // Game is not active during intro
    }, []);

    const startGame = useCallback(() => {
        gameState.reset();
        gameState.setScreen('PLAYING'); // Set screen to PLAYING
        setCurrentScreen('PLAYING'); // Explicitly update local state
        gameState.gameStarted = true;
        gameState.showDoubleTapToShoot = true;

        setGameStarted(true);
        setGameOver(false);
        setGameActive(true); // Set game to active

        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = requestAnimationFrame(gameLoop);

        if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
        spawnIntervalId.current = setInterval(spawnRandomNPC, 2000);

        if (reloadTimeoutId.current) clearTimeout(reloadTimeoutId.current); // Clear any pending reload timeout
    }, [gameLoop, spawnRandomNPC]);

    const handleReturnToTitle = useCallback(() => {
        gameState.setScreen('TITLE'); // Return to title screen
        setCurrentScreen('TITLE'); // Explicitly update local state
        gameState.gameStarted = false;
        gameState.gameOver = false;

        setGameStarted(false);
        setGameOver(false);
        setGameActive(false); // Set game to inactive

        if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
        spawnIntervalId.current = null;
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (reloadTimeoutId.current) clearTimeout(reloadTimeoutId.current); // Clear any pending reload timeout
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        const resizeCanvas = () => {
            container.style.width = window.innerWidth > 600 ? '400px' : '90%';
            container.style.height = `${window.innerHeight * 0.8}px`;
            container.style.position = 'relative';
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        inputHandlerRef.current = new InputHandler(canvas);
        inputHandlerRef.current.onShoot = (x, y) => {
            if (gameState.gameOver || !gameState.gameStarted) return;
            if (playerRef.current.shoot()) {
                gameState.shootBullet();
                gameState.createHitCircle(x, y);
            }
        };
        inputHandlerRef.current.onReload = () => {
            if (gameState.gameOver || !gameState.gameStarted) return;
            if (playerRef.current.ammo < 6 && !playerRef.current.reloading) {
                playerRef.current.reloading = true;
                if (reloadTimeoutId.current) clearTimeout(reloadTimeoutId.current);
                reloadTimeoutId.current = setTimeout(() => {
                    playerRef.current.reload();
                    gameState.reloadAmmo();
                    reloadTimeoutId.current = null;
                }, 1000);
            }
        };

        animationFrameId.current = requestAnimationFrame(gameLoop);

        if (gameStarted) {
            spawnIntervalId.current = setInterval(spawnRandomNPC, 2000);
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
            if (reloadTimeoutId.current) clearTimeout(reloadTimeoutId.current);
            const ih = inputHandlerRef.current;
            if (ih) {
                ih.canvas.removeEventListener('mousedown', ih.handleMouseDown);
                ih.canvas.removeEventListener('mouseup', ih.handleMouseUp);
                ih.canvas.removeEventListener('mousemove', ih.handleMouseMove);
                ih.canvas.removeEventListener('touchstart', ih.handleTouchStart);
                ih.canvas.removeEventListener('touchend', ih.handleTouchEnd);
                ih.canvas.removeEventListener('touchmove', ih.handleTouchMove);
            }
        };
    }, [gameStarted, gameLoop, currentScreen]); // Added currentScreen to dependencies

    // Effect to synchronize local currentScreen state with gameState.currentScreen
    useEffect(() => {
        const handleScreenChange = () => {
            setCurrentScreen(gameState.currentScreen);
        };

        // Since gameState is a singleton, we can't directly subscribe to its changes
        // without modifying gameState to emit events.
        // For now, we'll rely on the gameLoop to update currentScreen,
        // but for immediate UI updates, we need to ensure the state is set.
        // The issue is likely that the gameLoop isn't running when on the title screen,
        // so setCurrentScreen isn't being called.

        // A more robust solution would involve a state management pattern
        // where gameState changes trigger React component updates more directly.
        // For this immediate fix, we'll ensure startIntro and startGame
        // also explicitly update the local currentScreen state.
    }, []); // Empty dependency array means this runs once on mount

    return (
        <div style={{ border: '1px solid black', margin: 'auto', position: 'relative', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
            <GameUI
                lives={lives}
                ammo={ammo}
                score={score}
                gameOver={gameOver}
                showReloadOk={showReloadOk}
                isFlashingReload={isFlashingReload}
                showDoubleTapToShoot={showDoubleTapToShoot}
                onRestart={startGame}
                onReturnToTitle={handleReturnToTitle}
                currentScreen={currentScreen} // Pass current screen state
                onStartIntro={startIntro} // Pass start intro function
                onStartGame={startGame} // Pass start game function
            />
        </div>
    );
};

export default GameCanvas;
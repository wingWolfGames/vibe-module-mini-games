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

    // Centralized UI State
    const [isTitleScreen, setIsTitleScreen] = useState(true);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [lives, setLives] = useState(gameState.playerLives);
    const [ammo, setAmmo] = useState(gameState.playerAmmo);
    const [score, setScore] = useState(gameState.score);
    const [showReloadOk, setShowReloadOk] = useState(false);
    const [isFlashingReload, setIsFlashingReload] = useState(false);
    const [showDoubleTapToShoot, setShowDoubleTapToShoot] = useState(true);

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Update local state from gameState
        setLives(gameState.playerLives);
        setAmmo(gameState.playerAmmo);
        setScore(gameState.score);
        setGameOver(gameState.gameOver);
        setShowReloadOk(gameState.showReloadOk);
        setIsFlashingReload(gameState.playerAmmo === 0);
        setShowDoubleTapToShoot(gameState.showDoubleTapToShoot);

        let shakeX = 0;
        let shakeY = 0;
        if (gameState.isPlayerHit) {
            shakeX = (Math.random() - 0.5) * 10;
            shakeY = (Math.random() - 0.5) * 10;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (gameState.isReloadShaking) {
            shakeY = (Math.random() - 0.5) * 5;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        gameState.processHitCircles();
        gameState.processBadGuyShotEffects();

        gameState.badGuys.forEach(badGuy => {
            const shotResult = badGuy.update(performance.now());
            if (shotResult && shotResult.shot) {
                gameState.loseLife();
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
            const elapsed = performance.now() - effect.creationTime;
            const progress = elapsed / effect.duration;
            const maxRadius = Math.max(canvas.width, canvas.height) * 1.2;
            const currentRadius = Math.max(0, maxRadius * progress);
            const opacity = Math.max(0, 1 - progress);
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

        ctx.restore();

        if (!gameState.gameOver) {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
    }, []);

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

    const startGame = useCallback(() => {
        gameState.reset();
        gameState.isTitleScreen = false;
        gameState.gameStarted = true;
        gameState.showDoubleTapToShoot = true;

        setIsTitleScreen(false);
        setGameStarted(true);
        setGameOver(false);

        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = requestAnimationFrame(gameLoop);

        if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
        spawnIntervalId.current = setInterval(spawnRandomNPC, 2000);
    }, [gameLoop, spawnRandomNPC]);

    const handleReturnToTitle = useCallback(() => {
        gameState.isTitleScreen = true;
        gameState.gameStarted = false;
        gameState.gameOver = false;

        setIsTitleScreen(true);
        setGameStarted(false);
        setGameOver(false);

        if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
        spawnIntervalId.current = null;
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        container.style.width = window.innerWidth > 600 ? '400px' : '90%';
        container.style.height = `${window.innerHeight * 0.8}px`;
        container.style.position = 'relative';
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

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
                setTimeout(() => {
                    playerRef.current.reload();
                    gameState.reloadAmmo();
                }, 1000);
            }
        };

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
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
    }, [gameLoop]);

    return (
        <div style={{ border: '1px solid black', margin: 'auto', position: 'relative', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
            {isTitleScreen ? (
                <TitleScreen onStartGame={startGame} />
            ) : (
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
                />
            )}
        </div>
    );
};

export default GameCanvas;
import React, { useRef, useEffect, useCallback, useState } from 'react';
import InputHandler from './inputHandler';
import gameState from './gameState';
import { Player, BadGuy, GoodGuy, UnknownGuy, LifeUp } from './entities';
import GameUI from './GameUI';
import TitleScreen from '../../components/TitleScreen';

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const inputHandlerRef = useRef(null);
    const playerRef = useRef(new Player());
    const animationFrameId = useRef(null);
    const spawnIntervalId = useRef(null);
    const reloadTimeoutId = useRef(null); // New ref for reload timeout
    const lifeUpSpawnIntervalId = useRef(null); // New ref for LifeUp spawn interval

    // Centralized UI State (now managed by gameState.currentScreen)
    // Define GoodGuy image paths outside the component to avoid re-creation on every render
    const goodGuyImagePaths = [
        '/npc/Trevor.png',
        '/npc/Wong.png',
        '/npc/Lin.png',
        '/npc/Jonathan.png',
        '/npc/Zephyr.png',
        '/npc/Leonard.png',
    ];
    const badGuyImagePaths = [
        '/npc/Sophia.png',
        '/npc/Emily.png',
        '/npc/James.png',
        '/npc/Charles.png',
        '/npc/Ethan.png',
        '/npc/Kevin.png',
        '/npc/Sam.png',
        '/npc/arlo.png',
        '/npc/anya.png',
        '/npc/anna.png',
    ];
    // Removed goodGuySprite state as each GoodGuy will load its own image
    const [lifeUpSprite, setLifeUpSprite] = useState(null); // State for LifeUp sprite
    const [backgroundImage, setBackgroundImage] = useState(null); // State for background image
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
            gameState.unknownGuys = []; // Clear unknown guys on game over
            gameState.lifeUps = []; // Clear life-ups on game over
            gameState.hitCircles = [];
            gameState.badGuyShotEffects = [];
            animationFrameId.current = requestAnimationFrame(gameLoop);
            return;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background image if loaded and game is playing
        if (backgroundImage && gameState.currentScreen === 'PLAYING') {
            const imgAspectRatio = backgroundImage.width / backgroundImage.height;
            const canvasAspectRatio = canvas.width / canvas.height;

            let drawWidth;
            let drawHeight;
            let drawX;
            let drawY;

            // Fit height and center horizontally
            drawHeight = canvas.height;
            drawWidth = backgroundImage.width * (canvas.height / backgroundImage.height);
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;

            ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
        }

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

            gameState.badGuys.forEach(badGuy => {
                const shotResult = badGuy.update(performance.now());
                if (shotResult && shotResult.shot && !gameState.gameOver) {
                    gameState.createBadGuyShotEffect(shotResult.x, shotResult.y);
                }
            });

            gameState.goodGuys.forEach(goodGuy => {
                goodGuy.update(performance.now());
                // Check if a good guy has successfully crossed the screen
                if (!goodGuy.isAlive && goodGuy.hasCrossedScreen) {
                    // If no life-up is currently active, spawn one
                    if (gameState.lifeUps.length === 0) {
                        const canvas = canvasRef.current;
                        if (canvas) {
                            const randomX = Math.random() * (canvas.width - 64); // Random X within canvas bounds
                            const randomY = Math.random() * (canvas.height - 64); // Random Y within canvas bounds
                            gameState.addLifeUp(new LifeUp(randomX, randomY, 64, 64));
                        }
                    }
                }
            });

            // Update and handle UnknownGuys
            gameState.unknownGuys.forEach(unknownGuy => {
                const transformResult = unknownGuy.update(performance.now());
                if (transformResult && transformResult.transform) {
                    // Transform into GoodGuy or BadGuy
                    const isBadGuy = Math.random() < 0.5; // 50% chance to become BadGuy
                    if (isBadGuy) {
                        const randomBadGuyImagePath = badGuyImagePaths[Math.floor(Math.random() * badGuyImagePaths.length)];
                        const newBadGuy = new BadGuy(transformResult.x, transformResult.y, transformResult.width, transformResult.height, canvas.width, transformResult.direction, randomBadGuyImagePath);
                        // Adjust speed and shooting frequency for transformed BadGuy
                        newBadGuy.speed *= 1.5; // Walk a bit faster
                        newBadGuy.reloadTime /= 2; // Shoot more frequently
                        newBadGuy.nextShotTime = Date.now() + newBadGuy.reloadTime; // Set initial shot time
                        newBadGuy.timeToFlash = newBadGuy.nextShotTime - newBadGuy.tellDuration;
                        gameState.addBadGuy(newBadGuy);
                    } else {
                        const randomGoodGuyImagePath = goodGuyImagePaths[Math.floor(Math.random() * goodGuyImagePaths.length)];
                        const newGoodGuy = new GoodGuy(transformResult.x, transformResult.y, 80, 80, canvas.width, transformResult.direction, randomGoodGuyImagePath);
                        newGoodGuy.canvasWidth = canvas.width;
                        gameState.addGoodGuy(newGoodGuy);
                    }
                    unknownGuy.isAlive = false; // Mark unknown guy for removal
                }
                // Check if a transformed unknown guy (now good guy) has successfully crossed the screen
                if (!unknownGuy.isAlive && unknownGuy.hasCrossedScreen && unknownGuy.transformed) {
                    // If no life-up is currently active, spawn one
                    if (gameState.lifeUps.length === 0) {
                        const canvas = canvasRef.current;
                        if (canvas) {
                            const randomX = Math.random() * (canvas.width - 64); // Random X within canvas bounds
                            const randomY = Math.random() * (canvas.height - 64); // Random Y within canvas bounds
                            gameState.addLifeUp(new LifeUp(randomX, randomY, 64, 64));
                        }
                    }
                }
            });

            // Update LifeUp power-ups
            gameState.lifeUps.forEach(lifeUp => {
                lifeUp.update(performance.now());
            });



            gameState.badGuys = gameState.badGuys.filter(bg => bg.isAlive);
            gameState.goodGuys = gameState.goodGuys.filter(gg => gg.isAlive);
            gameState.unknownGuys = gameState.unknownGuys.filter(ug => ug.isAlive); // Filter out transformed unknown guys
            gameState.lifeUps = gameState.lifeUps.filter(lu => lu.isAlive); // Filter out collected or expired life-ups

            gameState.badGuys.forEach(badGuy => {
                const randomBadGuyImagePath = badGuyImagePaths[Math.floor(Math.random() * badGuyImagePaths.length)];
                if (!badGuy.image) { // Load image only once
                    badGuy.image = new Image();
                    badGuy.image.src = randomBadGuyImagePath;
                    badGuy.image.onerror = (err) => {
                        console.error(`Failed to load BadGuy image ${randomBadGuyImagePath}:`, err);
                    };
                }

                if (badGuy.image && badGuy.image.complete) {
                    const aspectRatio = badGuy.image.width / badGuy.image.height;
                    let newWidth = 80;
                    let newHeight = 80;

                    if (aspectRatio > 1) { // Wider than tall
                        newHeight = newWidth / aspectRatio;
                    } else if (aspectRatio < 1) { // Taller than wide
                        newWidth = newHeight * aspectRatio;
                    }
                    ctx.drawImage(badGuy.image, badGuy.x, badGuy.y, newWidth, newHeight);
                } else {
                    ctx.fillStyle = (badGuy.flashing && badGuy.flashCount % 2 === 0) ? 'orange' : 'red';
                    ctx.fillRect(badGuy.x, badGuy.y, badGuy.width, badGuy.height);
                }
            });

            gameState.goodGuys.forEach(goodGuy => {
                if (goodGuy.image && goodGuy.image.complete) {
                    // Calculate aspect ratio and new dimensions
                    const aspectRatio = goodGuy.image.width / goodGuy.image.height;
                    let newWidth = 80;
                    let newHeight = 80;
 
                    if (aspectRatio > 1) { // Wider than tall
                        newHeight = newWidth / aspectRatio;
                    } else if (aspectRatio < 1) { // Taller than wide
                        newWidth = newHeight * aspectRatio;
                    }
 
                    ctx.drawImage(goodGuy.image, goodGuy.x, goodGuy.y, newWidth, newHeight);
                } else {
                    ctx.fillStyle = 'blue';
                    ctx.fillRect(goodGuy.x, goodGuy.y, goodGuy.width, goodGuy.height);
                }
            });

            gameState.unknownGuys.forEach(unknownGuy => {
                ctx.beginPath();
                ctx.arc(unknownGuy.x + unknownGuy.width / 2, unknownGuy.y + unknownGuy.height / 2, 40, 0, Math.PI * 2); // 80x80 circle, so radius is 40
                ctx.fillStyle = 'gray';
                ctx.fill();
            });

            // Draw LifeUp power-ups
            gameState.lifeUps.forEach(lifeUp => {
                if (lifeUpSprite) {
                    ctx.drawImage(lifeUpSprite, lifeUp.x, lifeUp.y, lifeUp.width, lifeUp.height);
                } else {
                    ctx.fillStyle = 'purple'; // Fallback color if sprite not loaded
                    ctx.fillRect(lifeUp.x, lifeUp.y, lifeUp.width, lifeUp.height);
                }
            });

            gameState.badGuyShotEffects.forEach(effect => {
                const elapsed = (performance.now() - effect.creationTime); // Removed + 16
                const progress = elapsed / effect.duration;
                const maxRadius = Math.max(canvas.width, canvas.height);
                const currentRadius = Math.max(0, maxRadius * progress);
                const opacity = Math.max(0, 1 - progress);

                if (progress >= 1 && !effect.damageApplied) {
                    console.log("GameCanvas: Applying damage from bad guy shot effect.");
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

    gameState.processBadGuyShotEffects(); // Moved here to ensure damage is applied before filtering

    const spawnRandomNPC = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const npcType = Math.random(); // 0-1
        const fromLeft = Math.random() < 0.5;
        const y = Math.random() * (canvas.height - 50);
        const width = 50;
        const height = 50;
        let x = fromLeft ? -width : canvas.width;
        let direction = fromLeft ? 1 : -1;
 
        // Randomly select a GoodGuy image path
        const randomGoodGuyImagePath = goodGuyImagePaths[Math.floor(Math.random() * goodGuyImagePaths.length)];

        if (npcType < 0.75) { // 75% chance for BadGuy
            const randomBadGuyImagePath = badGuyImagePaths[Math.floor(Math.random() * badGuyImagePaths.length)];
            gameState.addBadGuy(new BadGuy(x, y, width, height, canvas.width, direction, randomBadGuyImagePath));
        } else if (npcType < 0.85) { // 10% chance for GoodGuy (0.75 to 0.85)
            const goodGuy = new GoodGuy(x, y, 80, 80, canvas.width, direction, randomGoodGuyImagePath);
            gameState.addGoodGuy(goodGuy);
        } else { // 15% chance for UnknownGuy (0.85 to 1.0)
            const unknownGuy = new UnknownGuy(x, y, width, height, canvas.width, direction);
            gameState.addUnknownGuy(unknownGuy);
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

        if (lifeUpSpawnIntervalId.current) clearInterval(lifeUpSpawnIntervalId.current);
        lifeUpSpawnIntervalId.current = setInterval(() => {
            const canvas = canvasRef.current;
            if (canvas && gameState.lifeUps.length === 0) { // Only spawn if no LifeUp is currently active
                const randomX = Math.random() * (canvas.width - 64);
                const randomY = Math.random() * (canvas.height - 64);
                gameState.addLifeUp(new LifeUp(randomX, randomY, 64, 64));
            }
        }, 15000); // Spawn every 15 seconds

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
        if (lifeUpSpawnIntervalId.current) clearInterval(lifeUpSpawnIntervalId.current); // Clear LifeUp spawn interval
        lifeUpSpawnIntervalId.current = null;
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (reloadTimeoutId.current) clearTimeout(reloadTimeoutId.current); // Clear any pending reload timeout
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // GoodGuy sprite loading moved to GoodGuy class

        // Load LifeUp sprite
        const lifeUpImage = new Image();
        lifeUpImage.src = '/heart/heartplus.png'; // Path relative to public directory
        lifeUpImage.onload = () => {
            setLifeUpSprite(lifeUpImage);
        };
        lifeUpImage.onerror = (err) => {
            console.error("Failed to load heartplus.png:", err);
        };

        // Load background image
        const bgImage = new Image();
        bgImage.src = '/backgrounds/subway_bg2.png'; // Corrected path
        bgImage.onload = () => {
            setBackgroundImage(bgImage);
        };
        bgImage.onerror = (err) => {
            console.error("Failed to load subway_bg2.png:", err);
        };

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
            // Removed redundant check, InputHandler class handles active state
            if (playerRef.current.shoot()) {
                gameState.shootBullet();
                gameState.createHitCircle(x, y);
            }
        };
        inputHandlerRef.current.onReload = () => {
            // Removed redundant check, InputHandler class handles active state
            if (gameState.playerAmmo < 6 && !playerRef.current.reloading) {
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
            lifeUpSpawnIntervalId.current = setInterval(() => {
                const canvas = canvasRef.current;
                if (canvas && gameState.lifeUps.length === 0) { // Only spawn if no LifeUp is currently active
                    const randomX = Math.random() * (canvas.width - 64);
                    const randomY = Math.random() * (canvas.height - 64);
                    gameState.addLifeUp(new LifeUp(randomX, randomY, 64, 64));
                }
            }, 15000); // Spawn every 15 seconds
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
            if (lifeUpSpawnIntervalId.current) clearInterval(lifeUpSpawnIntervalId.current); // Clear LifeUp spawn interval
            if (reloadTimeoutId.current) clearTimeout(reloadTimeoutId.current);
            const ih = inputHandlerRef.current;
            if (ih) {
                ih.canvas.removeEventListener('mousedown', ih.boundHandleMouseDown);
                ih.canvas.removeEventListener('mouseup', ih.boundHandleMouseUp);
                ih.canvas.removeEventListener('mousemove', ih.boundHandleMouseMove);
                ih.canvas.removeEventListener('touchstart', ih.boundHandleTouchStart);
                ih.canvas.removeEventListener('touchend', ih.boundHandleTouchEnd);
                ih.canvas.removeEventListener('touchmove', ih.boundHandleTouchMove);
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
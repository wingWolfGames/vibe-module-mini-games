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
    // Removed goodGuySprite state as each GoodGuy will load its own image
    const [lifeUpSprite, setLifeUpSprite] = useState(null); // State for LifeUp sprite
    const [backgroundImage, setBackgroundImage] = useState(null); // State for background image
    const [backgroundOpacity, setBackgroundOpacity] = useState(1); // New state for background opacity
    const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0); // New state for current background index
    const backgroundImages = [
        '/backgrounds/subway_bg2.png',
        '/backgrounds/wong_bg.png',
        '/backgrounds/cabby_bg.png',
        '/backgrounds/car_bg.png',
    ];
    const backgroundFadeTimeout = useRef(null); // New ref for fade timeout
    const backgroundChangeInterval = useRef(null); // New ref for background change interval

    const [gameOver, setGameOver] = useState(false);
    const [gameActive, setGameActive] = useState(false); // New state for active game
    const [currentScreen, setCurrentScreen] = useState(gameState.currentScreen); // Use gameState for current screen
    const [lives, setLives] = useState(gameState.playerLives);
    useEffect(() => {
    }, [gameActive]);
    const [ammo, setAmmo] = useState(gameState.playerAmmo);
    const [score, setScore] = useState(gameState.score);
    const [showReloadOk, setShowReloadOk] = useState(false);
    const [isFlashingReload, setIsFlashingReload] = useState(false);
    const [showDoubleTapToShoot, setShowDoubleTapToShoot] = useState(true);

    const loopStateRef = useRef({});
    loopStateRef.current = { gameActive, backgroundImage, backgroundOpacity, lifeUpSprite };

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Always draw the background
        if (loopStateRef.current.backgroundImage) {
            ctx.save();
            ctx.globalAlpha = loopStateRef.current.backgroundOpacity;
            const img = loopStateRef.current.backgroundImage;
            const imgAspectRatio = img.width / img.height;
            const canvasAspectRatio = canvas.width / canvas.height;
            let drawWidth, drawHeight, drawX, drawY;
            drawHeight = canvas.height;
            drawWidth = img.width * (canvas.height / img.height);
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
        }

        // Update UI state from gameState every frame
        setLives(gameState.playerLives);
        setAmmo(gameState.playerAmmo);
        setScore(gameState.score);
        setGameOver(gameState.gameOver);
        setShowReloadOk(gameState.showReloadOk);
        setIsFlashingReload(gameState.playerAmmo === 0);
        setShowDoubleTapToShoot(gameState.showDoubleTapToShoot);
        setCurrentScreen(gameState.currentScreen);

        // Only run game logic if the game is active and not over
        if (loopStateRef.current.gameActive && !gameState.gameOver) {
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
                gameState.processBadGuyShotEffects(); // Moved here to ensure damage is applied before filtering
                gameState.badGuys.forEach(badGuy => {
                    const shotResult = badGuy.update(performance.now());
                    if (shotResult && shotResult.shot && !gameState.gameOver) {
                        gameState.createBadGuyShotEffect(shotResult.x, shotResult.y);
                    }
                });
                gameState.goodGuys.forEach(goodGuy => {
                    goodGuy.update(performance.now());
                    if (!goodGuy.isAlive && goodGuy.hasCrossedScreen) {
                        if (gameState.lifeUps.length === 0) {
                            const canvas = canvasRef.current;
                            if (canvas) {
                                const randomX = Math.random() * (canvas.width - 64);
                                const randomY = Math.random() * (canvas.height - 64);
                                gameState.addLifeUp(new LifeUp(randomX, randomY, 64, 64));
                            }
                        }
                    }
                });
                gameState.unknownGuys.forEach(unknownGuy => {
                    const transformResult = unknownGuy.update(performance.now());
                    if (transformResult && transformResult.transform) {
                        const isBadGuy = Math.random() < 0.5;
                        if (isBadGuy) {
                            const randomBadGuyImagePath = badGuyImagePaths[Math.floor(Math.random() * badGuyImagePaths.length)];
                            const newBadGuy = new BadGuy(transformResult.x, transformResult.y, transformResult.width, transformResult.height, canvas.width, transformResult.direction, randomBadGuyImagePath);
                            newBadGuy.speed *= 1.5;
                            newBadGuy.reloadTime /= 2;
                            newBadGuy.nextShotTime = Date.now() + newBadGuy.reloadTime;
                            newBadGuy.timeToFlash = newBadGuy.nextShotTime - newBadGuy.tellDuration;
                            gameState.addBadGuy(newBadGuy);
                        } else {
                            const randomGoodGuyImagePath = goodGuyImagePaths[Math.floor(Math.random() * goodGuyImagePaths.length)];
                            const newGoodGuy = new GoodGuy(transformResult.x, transformResult.y, 80, 80, canvas.width, transformResult.direction, randomGoodGuyImagePath);
                            newGoodGuy.canvasWidth = canvas.width;
                            gameState.addGoodGuy(newGoodGuy);
                        }
                        unknownGuy.isAlive = false;
                    }
                    if (!unknownGuy.isAlive && unknownGuy.hasCrossedScreen && unknownGuy.transformed) {
                        if (gameState.lifeUps.length === 0) {
                            const canvas = canvasRef.current;
                            if (canvas) {
                                const randomX = Math.random() * (canvas.width - 64);
                                const randomY = Math.random() * (canvas.height - 64);
                                gameState.addLifeUp(new LifeUp(randomX, randomY, 64, 64));
                            }
                        }
                    }
                });
                gameState.lifeUps.forEach(lifeUp => lifeUp.update(performance.now()));
                gameState.badGuys = gameState.badGuys.filter(bg => bg.isAlive);
                gameState.goodGuys = gameState.goodGuys.filter(gg => gg.isAlive);
                gameState.unknownGuys = gameState.unknownGuys.filter(ug => ug.isAlive);
                gameState.lifeUps = gameState.lifeUps.filter(lu => lu.isAlive);
                gameState.badGuys.forEach(badGuy => {
                    const randomBadGuyImagePath = badGuyImagePaths[Math.floor(Math.random() * badGuyImagePaths.length)];
                    let newWidth = 80;
                    let newHeight = 80; // Declare newHeight here to ensure it's always in scope

                    if (!badGuy.image) {
                        badGuy.image = new Image();
                        badGuy.image.src = randomBadGuyImagePath;
                        badGuy.image.onerror = (err) => console.error(`Failed to load BadGuy image ${randomBadGuyImagePath}:`, err);
                    }
                    if (badGuy.image && badGuy.image.complete) {
                        const aspectRatio = badGuy.image.width / badGuy.image.height;
                        if (aspectRatio > 1) newHeight = newWidth / aspectRatio;
                        else if (aspectRatio < 1) newWidth = newHeight * aspectRatio;
                        ctx.drawImage(badGuy.image, badGuy.x, badGuy.y, newWidth, newHeight);
                    } else {
                        ctx.fillStyle = (badGuy.flashing && badGuy.flashCount % 2 === 0) ? 'orange' : 'red';
                        ctx.fillRect(badGuy.x, badGuy.y, badGuy.width, badGuy.height);
                        newHeight = badGuy.height; // Ensure newHeight is set even if image not loaded
                    }
                    // Draw lower body GIF if loaded
                    if (badGuy.lowerBodyImage && badGuy.lowerBodyImage.complete) {
                        const currentTime = performance.now();
                        if (currentTime - badGuy.lastFrameTime > badGuy.frameRate) {
                            badGuy.currentFrameIndex = (badGuy.currentFrameIndex + 1) % badGuy.animationFrames.length;
                            badGuy.lastFrameTime = currentTime;
                        }

                        const frame = badGuy.animationFrames[badGuy.currentFrameIndex];
                        ctx.drawImage(
                            badGuy.lowerBodyImage,
                            frame.x,
                            frame.y,
                            badGuy.frameWidth,
                            badGuy.frameHeight,
                            badGuy.x - 5,
                            badGuy.y + newHeight - 5,
                            80, // Destination width
                            80  // Destination height
                        );
                    }
                });
                gameState.goodGuys.forEach(goodGuy => {
                    if (goodGuy.image && goodGuy.image.complete) {
                        const aspectRatio = goodGuy.image.width / goodGuy.image.height;
                        let newWidth = 80, newHeight = 80;
                        if (aspectRatio > 1) newHeight = newWidth / aspectRatio;
                        else if (aspectRatio < 1) newWidth = newHeight * aspectRatio;
                        ctx.drawImage(goodGuy.image, goodGuy.x, goodGuy.y, newWidth, newHeight);
                    } else {
                        ctx.fillStyle = 'blue';
                        ctx.fillRect(goodGuy.x, goodGuy.y, goodGuy.width, goodGuy.height);
                    }
                    // Draw lower body sprite sheet for GoodGuy
                    if (goodGuy.lowerBodyImage && goodGuy.lowerBodyImage.complete) {
                        const currentTime = performance.now();
                        if (currentTime - goodGuy.lastFrameTime > goodGuy.frameRate) {
                            goodGuy.currentFrameIndex = (goodGuy.currentFrameIndex + 1) % goodGuy.animationFrames.length;
                            goodGuy.lastFrameTime = currentTime;
                        }

                        const frame = goodGuy.animationFrames[goodGuy.currentFrameIndex];
                        ctx.drawImage(
                            goodGuy.lowerBodyImage,
                            frame.x,
                            frame.y,
                            goodGuy.frameWidth,
                            goodGuy.frameHeight,
                            goodGuy.x,
                            goodGuy.y + goodGuy.height - 5, // Position below the head
                            80, // Destination width
                            80  // Destination height
                        );
                    }
                });
                gameState.unknownGuys.forEach(unknownGuy => {
                    ctx.beginPath();
                    ctx.arc(unknownGuy.x + unknownGuy.width / 2, unknownGuy.y + unknownGuy.height / 2, 40, 0, Math.PI * 2);
                    ctx.fillStyle = 'gray';
                    ctx.fill();
                    // Draw lower body sprite sheet for UnknownGuy
                    if (unknownGuy.lowerBodyImage && unknownGuy.lowerBodyImage.complete) {
                        const currentTime = performance.now();
                        if (currentTime - unknownGuy.lastFrameTime > unknownGuy.frameRate) {
                            unknownGuy.currentFrameIndex = (unknownGuy.currentFrameIndex + 1) % unknownGuy.animationFrames.length;
                            unknownGuy.lastFrameTime = currentTime;
                        }

                        const frame = unknownGuy.animationFrames[unknownGuy.currentFrameIndex];
                        ctx.drawImage(
                            unknownGuy.lowerBodyImage,
                            frame.x,
                            frame.y,
                            unknownGuy.frameWidth,
                            unknownGuy.frameHeight,
                            unknownGuy.x,
                            unknownGuy.y + 80, // Position below the head (assuming head height is 80)
                            80, // Destination width
                            80  // Destination height
                        );
                    }
                });
                gameState.lifeUps.forEach(lifeUp => {
                    if (loopStateRef.current.lifeUpSprite) {
                        ctx.drawImage(loopStateRef.current.lifeUpSprite, lifeUp.x, lifeUp.y, lifeUp.width, lifeUp.height);
                    } else {
                        ctx.fillStyle = 'purple';
                        ctx.fillRect(lifeUp.x, lifeUp.y, lifeUp.width, lifeUp.height);
                    }
                });
                gameState.badGuyShotEffects.forEach(effect => {
                    const elapsed = performance.now() - effect.creationTime;
                    const progress = elapsed / effect.duration;
                    const maxRadius = Math.max(canvas.width, canvas.height);
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
                if (gameState.isPlayerHit && !gameState.isHitByBadGuy) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.restore();
            } catch (error) {
                console.error("Error in game loop:", error);
                gameState.gameOver = true;
            }
        } else if (gameState.gameOver) {
            // Cleanup logic when game is over but still in the loop
            if (spawnIntervalId.current) {
                clearInterval(spawnIntervalId.current);
                spawnIntervalId.current = null;
            }
            gameState.badGuys = [];
            gameState.goodGuys = [];
            gameState.unknownGuys = [];
            gameState.lifeUps = [];
            gameState.hitCircles = [];
            gameState.badGuyShotEffects = [];
        }

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, []);


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

        setCurrentBackgroundIndex(0); // Reset to the first background
        setGameOver(false);
        setGameActive(true); // Set game to active

        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = requestAnimationFrame(gameLoop);


        if (reloadTimeoutId.current) clearTimeout(reloadTimeoutId.current); // Clear any pending reload timeout

        // Background changing logic is now handled in useEffect based on gameActive state
    }, [gameLoop, spawnRandomNPC]);

    const handleReturnToTitle = useCallback(() => {
        gameState.setScreen('TITLE'); // Return to title screen
        setCurrentScreen('TITLE'); // Explicitly update local state
        gameState.gameStarted = false;
        gameState.gameOver = false;

        setGameOver(false);
        setGameActive(false); // Set game to inactive

        if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
        spawnIntervalId.current = null;
        if (lifeUpSpawnIntervalId.current) clearInterval(lifeUpSpawnIntervalId.current); // Clear LifeUp spawn interval
        lifeUpSpawnIntervalId.current = null;
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (reloadTimeoutId.current) clearTimeout(reloadTimeoutId.current); // Clear any pending reload timeout
        if (backgroundChangeInterval.current) clearInterval(backgroundChangeInterval.current); // Clear background change interval
        backgroundChangeInterval.current = null;
        if (backgroundFadeTimeout.current) clearTimeout(backgroundFadeTimeout.current); // Clear background fade timeout
        backgroundFadeTimeout.current = null;
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

        // Load initial background image when component mounts
        const initialBgImage = new Image();
        initialBgImage.src = backgroundImages[gameState.getBackgroundIndexForLevel()];
        initialBgImage.onload = () => {
            setBackgroundImage(initialBgImage);
            setBackgroundOpacity(1); // Ensure it's visible
        };
        initialBgImage.onerror = (err) => {
            console.error(`Failed to load initial background image ${backgroundImages[gameState.getBackgroundIndexForLevel()]}:`, err);
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

        if (gameActive) {
            // Clear any existing intervals before starting new ones
            if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
            spawnIntervalId.current = setInterval(spawnRandomNPC, 2000);

            if (lifeUpSpawnIntervalId.current) clearInterval(lifeUpSpawnIntervalId.current);
            lifeUpSpawnIntervalId.current = setInterval(() => {
                const canvas = canvasRef.current;
                if (canvas && gameState.lifeUps.length === 0) {
                    const randomX = Math.random() * (canvas.width - 64);
                    const randomY = Math.random() * (canvas.height - 64);
                    gameState.addLifeUp(new LifeUp(randomX, randomY, 64, 64));
                }
            }, 15000);

        } else {
            // If game is not active, clear all intervals
            if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
            if (lifeUpSpawnIntervalId.current) clearInterval(lifeUpSpawnIntervalId.current);
            if (backgroundChangeInterval.current) clearInterval(backgroundChangeInterval.current);
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if (spawnIntervalId.current) clearInterval(spawnIntervalId.current);
            if (lifeUpSpawnIntervalId.current) clearInterval(lifeUpSpawnIntervalId.current); // Clear LifeUp spawn interval
            if (reloadTimeoutId.current) clearTimeout(reloadTimeoutId.current);
            if (backgroundChangeInterval.current) clearInterval(backgroundChangeInterval.current); // Clear background change interval
            if (backgroundFadeTimeout.current) clearTimeout(backgroundFadeTimeout.current); // Clear background fade timeout
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
    }, [gameActive, gameLoop, spawnRandomNPC]);

    // This useEffect handles the loading of the new background image whenever the index changes.
    // This useEffect handles the loading of the new background image whenever the level changes.
    useEffect(() => {
        const newBgImage = new Image();
        newBgImage.src = backgroundImages[gameState.getBackgroundIndexForLevel()];
        newBgImage.onload = () => {
            setBackgroundImage(newBgImage);
        };
        newBgImage.onerror = (err) => {
            console.error(`Failed to load background image ${backgroundImages[gameState.getBackgroundIndexForLevel()]}:`, err);
        };
    }, [gameState.currentLevel]); // Depend on gameState.currentLevel

    useEffect(() => {
        if (gameOver) {
            setGameActive(false);
        }
    }, [gameOver]);

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
                currentLevel={gameState.currentLevel} // Pass current level state
            />
        </div>
    );
};

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
export default GameCanvas;
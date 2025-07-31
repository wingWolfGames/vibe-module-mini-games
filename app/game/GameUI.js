import React, { useState, useEffect } from 'react';
import gameState from './gameState';

const GameUI = ({ onRestart }) => {
    const [lives, setLives] = useState(gameState.playerLives);
    const [ammo, setAmmo] = useState(gameState.playerAmmo);
    const [score, setScore] = useState(gameState.score);
    const [gameOver, setGameOver] = useState(gameState.gameOver);
    const [showReloadOk, setShowReloadOk] = useState(gameState.showReloadOk);
    const [isFlashingReload, setIsFlashingReload] = useState(false);

    useEffect(() => {
        const updateUI = () => {
            setLives(gameState.playerLives);
            setAmmo(gameState.playerAmmo);
            setScore(gameState.score);
            setGameOver(gameState.gameOver);
            setShowReloadOk(gameState.showReloadOk);
            if (gameState.playerAmmo === 0 && !isFlashingReload) {
                setIsFlashingReload(true);
            } else if (gameState.playerAmmo > 0 && isFlashingReload) {
                setIsFlashingReload(false);
            }
        };

        const interval = setInterval(updateUI, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                padding: '5px 10px',
                borderRadius: '5px',
                zIndex: 100
            }}>
                <p style={{ margin: '0', fontSize: '1em' }}>Lives: {lives}</p>
            </div>

            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                padding: '5px 10px',
                borderRadius: '5px',
                zIndex: 100
            }}>
                <p style={{ margin: '0', fontSize: '1em' }}>Score: {score}</p>
            </div>

            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                padding: '5px 10px',
                borderRadius: '5px',
                zIndex: 100,
                textAlign: 'center'
            }}>
                <p style={{ margin: '0', fontSize: '1em' }}>Ammo: {ammo}</p>
            </div>

            {isFlashingReload && ammo === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 101,
                    fontSize: '3em',
                    color: 'red',
                    animation: 'flash 1s infinite',
                    WebkitAnimation: 'flash 1s infinite'
                }}>
                    RELOAD
                </div>
            )}

            {showReloadOk && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 101,
                    fontSize: '3em',
                    color: 'blue'
                }}>
                    RELOAD<br/>OK
                </div>
            )}

            <style>{`
                @keyframes flash {
                    0% { opacity: 1; }
                    50% { opacity: 0; }
                    100% { opacity: 1; }
                }
            `}</style>

            {gameOver && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 101,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '20px',
                    borderRadius: '10px',
                    color: 'white' // Added color for GAME OVER text
                }}>
                    <p style={{ margin: '0 0 15px 0', fontSize: '2em', fontWeight: 'bold' }}>GAME OVER</p>
                    <button
                        onClick={onRestart}
                        style={{
                            padding: '10px 20px',
                            fontSize: '1.2em',
                            cursor: 'pointer'
                        }}
                    >
                        Restart Game
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameUI;
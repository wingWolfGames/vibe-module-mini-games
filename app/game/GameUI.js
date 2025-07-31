import React, { useState, useEffect } from 'react';
import gameState from './gameState';

const GameUI = ({ onRestart }) => {
    const [lives, setLives] = useState(gameState.playerLives);
    const [ammo, setAmmo] = useState(gameState.playerAmmo);
    const [score, setScore] = useState(gameState.score);
    const [gameOver, setGameOver] = useState(gameState.gameOver);

    useEffect(() => {
        const updateUI = () => {
            setLives(gameState.playerLives);
            setAmmo(gameState.playerAmmo);
            setScore(gameState.score);
            setGameOver(gameState.gameOver);
        };

        const interval = setInterval(updateUI, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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

            {gameOver && (
                <div style={{
                    position: 'absolute',
                    top: '25%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 101,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '20px',
                    borderRadius: '10px'
                }}>
                    <button
                        onClick={onRestart}
                        style={{
                            marginTop: '15px', /* Added margin-top to push it down from GAME OVER */
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
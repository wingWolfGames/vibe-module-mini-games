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
        <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: '10px 20px',
            borderRadius: '5px',
            zIndex: 100,
            textAlign: 'center'
        }}>
            <p style={{ margin: '5px 0', fontSize: '1.2em' }}>Lives: {lives}</p>
            <p style={{ margin: '5px 0', fontSize: '1.2em' }}>Ammo: {ammo}</p>
            <p style={{ margin: '5px 0', fontSize: '1.2em' }}>Score: {score}</p>
            {gameOver && (
                <>
                    <h2 style={{ color: 'red', fontSize: '2em', marginTop: '10px' }}>GAME OVER</h2>
                    <button
                        onClick={onRestart}
                        style={{
                            marginTop: '10px',
                            padding: '10px 20px',
                            fontSize: '1.2em',
                            cursor: 'pointer'
                        }}
                    >
                        Restart Game
                    </button>
                </>
            )}
        </div>
    );
};

export default GameUI;
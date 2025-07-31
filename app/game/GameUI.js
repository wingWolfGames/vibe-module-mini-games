import React from 'react';

const GameUI = ({
    lives,
    ammo,
    score,
    gameOver,
    showReloadOk,
    isFlashingReload,
    showDoubleTapToShoot,
    onRestart,
    onReturnToTitle
}) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: gameOver ? 'auto' : 'none' // Allow clicks only when game is over for restart button
        }}>
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
                    RELOAD<br/><span style={{ fontSize: '0.5em' }}>(swipe up!)</span>
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

            {showDoubleTapToShoot && (
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
                    Double tap to Shoot!
                </div>
            )}

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
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            marginBottom: '10px' // Add some space below Restart button
                        }}
                    >
                        Restart Game
                    </button>
                    <button
                        onClick={onReturnToTitle}
                        style={{
                            padding: '10px 20px',
                            fontSize: '1.2em',
                            cursor: 'pointer',
                            pointerEvents: 'auto'
                        }}
                    >
                        Return to Title Screen
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameUI;
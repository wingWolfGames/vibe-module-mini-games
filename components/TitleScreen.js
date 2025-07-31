import React from 'react';

const TitleScreen = ({ onStartGame }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            zIndex: 200 // Ensure it's above other game elements
        }}>
            <h1 style={{ fontSize: '3em', marginBottom: '20px', textAlign: 'center' }}>PROTOTYPE GAME</h1>
            <button
                onClick={onStartGame}
                style={{
                    padding: '15px 30px',
                    fontSize: '1.5em',
                    cursor: 'pointer',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px'
                }}
            >
                Start Game
            </button>
        </div>
    );
};

export default TitleScreen;
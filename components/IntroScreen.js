import React from 'react';

const IntroScreen = ({ onNext }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url('/backgrounds/HUB5_BG_v04.gif')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            zIndex: 200
        }}>
            <h1 style={{ fontSize: '3em', marginBottom: '20px', textAlign: 'center' }}>INTRO</h1>
            <button
                onClick={onNext}
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
                NEXT
            </button>
        </div>
    );
};

export default IntroScreen;
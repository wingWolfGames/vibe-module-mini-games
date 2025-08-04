import React, { useState, useEffect } from 'react';
import { getAssetPath } from '../lib/utils';

const TitleScreen = ({ onStartIntro }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url('/backgrounds/HUB2_BG_v02.gif')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', /* Center items vertically */
            alignItems: 'center',
            color: 'white',
            zIndex: 200 // Ensure it's above other game elements
        }}>
            <TitleDisplay />
            <button
                onClick={onStartIntro}
                style={{
                    position: 'absolute', /* Position absolutely */
                    bottom: '100px',     /* 100px from the bottom */
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

const TitleDisplay = () => {
    const titles = [
        "PUBLIC EYE",
        "The Arcade Game",
        "- Mobile Version -"
    ];
    const [displayedTitles, setDisplayedTitles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            if (currentIndex < titles.length) {
                setDisplayedTitles(prev => [...prev, titles[currentIndex]]);
                setCurrentIndex(prev => prev + 1);
            } else {
                // All titles displayed, wait 5 seconds then reset
                setTimeout(() => {
                    setDisplayedTitles([]);
                    setCurrentIndex(0);
                }, 5000);
            }
        }, 500); // 0.5 second interval for each line

        return () => clearInterval(interval);
    }, [currentIndex, titles]);

    return (
        <div style={{
            position: 'absolute', /* Position absolutely within TitleScreen */
            top: '50%',            /* Center vertically */
            transform: 'translateY(-50%)', /* Adjust for element's height */
            textAlign: 'center',
            width: '100%',         /* Take full width */
            marginBottom: '20px'   /* Keep original margin for spacing */
        }}>
            {displayedTitles.map((title, index) => (
                <h1
                    key={index}
                    style={{
                        fontSize: index === 0 ? '3em' : '1.5em', /* First line 3em, others 1.5em */
                        margin: '10px 0',
                        color: 'white'
                    }}
                >
                    {title}
                </h1>
            ))}
        </div>
    );
};

export default TitleScreen;
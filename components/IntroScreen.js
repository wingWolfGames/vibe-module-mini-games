import React, { useState, useEffect } from 'react';

const IntroScreen = ({ onNext }) => {
    const lines = [
        "Shoot Suspects!",
        "Protect Victims and Witnesses!!",
        "Defeat the Mastermind!!!"
    ];
    const [displayedText, setDisplayedText] = useState('');
    const [lineIndex, setLineIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        if (lineIndex < lines.length) {
            if (charIndex < lines[lineIndex].length) {
                const typingTimer = setTimeout(() => {
                    setDisplayedText(prev => prev + lines[lineIndex][charIndex]);
                    setCharIndex(prev => prev + 1);
                }, 1500 / lines[lineIndex].length); // 1.5 seconds per line
                return () => clearTimeout(typingTimer);
            } else {
                // Line finished, pause for 0.5 second, then move to next line
                const linePauseTimer = setTimeout(() => {
                    setDisplayedText(prev => prev + '\n\n'); // Add two newline characters for a blank line
                    setLineIndex(prev => prev + 1);
                    setCharIndex(0);
                }, 500); // 0.5 second pause
                return () => clearTimeout(linePauseTimer);
            }
        } else {
            // All lines displayed, show the button
            setShowButton(true);
        }
    }, [lineIndex, charIndex, lines]);

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
            alignItems: 'flex-start', /* Changed from 'center' to 'flex-start' */
            color: 'white',
            zIndex: 200,
            whiteSpace: 'pre-wrap' // To respect newline characters
        }}>
            <h1 style={{ fontSize: '1.5em', marginBottom: '20px', textAlign: 'left', paddingLeft: '10%' }}> {/* Changed font size and text alignment, added padding for text */}
                {displayedText}
            </h1>
            {showButton && (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}> {/* New wrapper div for centering button */}
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
            )}
        </div>
    );
};

export default IntroScreen;
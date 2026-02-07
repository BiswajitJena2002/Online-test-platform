import React from 'react';

const AccessibilityControls = ({
    theme,
    toggleTheme,
    textSize,
    setTextSize,
    textBold,
    toggleTextBold
}) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            padding: '10px',
            backgroundColor: 'var(--card-bg)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            flexWrap: 'wrap'
        }} className="accessibility-bar">
            <button
                onClick={toggleTheme}
                className="btn btn-secondary"
                aria-label="Toggle Night Mode"
            >
                {theme === 'light' ? '🌙 Night Mode' : '☀️ Day Mode'}
            </button>

            <button
                onClick={toggleTextBold}
                className="btn btn-secondary"
                style={{ fontWeight: textBold ? 'bold' : 'normal' }}
                aria-label="Toggle Bold Text"
            >
                {textBold ? 'Normal Text' : 'B Bold Text'}
            </button>

            <div style={{ display: 'flex', gap: '5px' }}>
                <button
                    onClick={() => setTextSize('normal')}
                    className={`btn btn-secondary ${textSize === 'normal' ? 'active' : ''}`}
                    aria-label="Reset Text Size"
                    disabled={textSize === 'normal'}
                >
                    A
                </button>
                <button
                    onClick={() => setTextSize('large')}
                    className={`btn btn-secondary ${textSize === 'large' ? 'active' : ''}`}
                    aria-label="Increase Text Size"
                    disabled={textSize === 'large'}
                    style={{ fontSize: '1.2em' }}
                >
                    A+
                </button>
            </div>
        </div>
    );
};

export default AccessibilityControls;

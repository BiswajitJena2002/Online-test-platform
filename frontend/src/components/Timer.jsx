import React, { useEffect, useState } from 'react';

const Timer = ({ initialMinutes, onTimeUp, isPaused }) => {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

    useEffect(() => {
        if (isPaused) return; // Don't countdown when paused

        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, onTimeUp, isPaused]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="timer">
            ⏱️ {formatTime(timeLeft)}
        </div>
    );
};

export default Timer;

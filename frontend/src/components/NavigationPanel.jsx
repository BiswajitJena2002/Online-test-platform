import React from 'react';

const NavigationPanel = ({ totalQuestions, currentQuestionIndex, onNavigate, answers, skipped, questions }) => {
    return (
        <div className="card" style={{ height: '100%', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>Question Navigator</h3>
            <div className="nav-grid">
                {Array.from({ length: totalQuestions }).map((_, index) => {
                    const questionNum = index + 1;
                    const isCurrent = index === currentQuestionIndex;

                    // Determine status
                    const qId = questions && questions[index] ? questions[index].question_id : null;
                    let statusClass = "";

                    if (qId) {
                        if (answers[qId]) statusClass = "answered";
                        else if (skipped.includes(qId)) statusClass = "skipped";
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => onNavigate(index)}
                            className={`nav-btn ${isCurrent ? 'active' : ''} ${statusClass}`}
                        >
                            {questionNum}
                        </button>
                    );
                })}
            </div>
            <div style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div className="nav-btn answered" style={{ width: '12px', height: '12px', marginRight: '8px' }}></div>
                    Answered
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="nav-btn skipped" style={{ width: '12px', height: '12px', marginRight: '8px' }}></div>
                    Skipped / Not Visited
                </div>
            </div>
        </div>
    );
};

export default NavigationPanel;

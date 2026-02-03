import React from 'react';

const QuestionCard = ({ question, selectedOption, onOptionSelect, onSkip }) => {
    if (!question) return <div className="loading">Loading...</div>;

    const { question: questionText, options } = question; // backend sends "question" as text, options as object

    return (
        <div className="card">
            <h2 className="question-text">
                Q: {questionText}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {Object.entries(options).map(([key, value]) => (
                    <div
                        key={key}
                        onClick={() => onOptionSelect(key)}
                        className={`option-item ${selectedOption === key ? 'selected' : ''}`}
                    >
                        <div className="option-key">
                            {key.toUpperCase()}
                        </div>
                        <span className="option-value">{value}</span>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={onSkip}
                    className="btn btn-secondary"
                >
                    Skip Question
                </button>
            </div>
        </div>
    );
};

export default QuestionCard;

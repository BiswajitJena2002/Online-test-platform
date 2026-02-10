import React from 'react';

const NavigationPanel = ({ totalQuestions, currentQuestionIndex, onNavigate, answers, skipped, questions, markedForReview, sections, isSubjectWise }) => {

    const renderQuestionGrid = (startIndex, count, sectionName = null) => {
        return (
            <div key={startIndex} style={{ marginBottom: '1.5rem' }}>
                {sectionName && (
                    <h5 style={{
                        margin: '0 0 0.75rem 0',
                        color: '#4b5563',
                        fontSize: '0.9rem',
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '0.25rem'
                    }}>
                        {sectionName}
                    </h5>
                )}
                <div className="nav-grid">
                    {Array.from({ length: count }).map((_, i) => {
                        const globalIndex = startIndex + i;
                        const questionNum = globalIndex + 1;
                        const isCurrent = globalIndex === currentQuestionIndex;

                        // Determine status
                        const qId = questions && questions[globalIndex] ? questions[globalIndex].question_id : null;
                        let statusClass = "";

                        if (qId) {
                            if (markedForReview && markedForReview.includes(qId)) statusClass = "marked";
                            else if (answers[qId]) statusClass = "answered";
                            else if (skipped.includes(qId)) statusClass = "skipped";
                        }

                        return (
                            <button
                                key={globalIndex}
                                onClick={() => onNavigate(globalIndex)}
                                className={`nav-btn ${isCurrent ? 'active' : ''} ${statusClass}`}
                            >
                                {questionNum}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="card" style={{ height: '100%', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>Question Navigator</h3>

            {isSubjectWise && sections && sections.length > 0 ? (
                // Subject-wise grouping
                sections.map((section, idx) => {
                    // Calculate start index for this section
                    let startIndex = 0;
                    for (let i = 0; i < idx; i++) {
                        startIndex += sections[i].questions.length;
                    }
                    return renderQuestionGrid(startIndex, section.questions.length, section.subject_name);
                })
            ) : (
                // Flat structure
                renderQuestionGrid(0, totalQuestions)
            )}

            <div style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div className="nav-btn answered" style={{ width: '12px', height: '12px', marginRight: '8px' }}></div>
                    Answered
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div className="nav-btn marked" style={{ width: '12px', height: '12px', marginRight: '8px' }}></div>
                    Marked for Review
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

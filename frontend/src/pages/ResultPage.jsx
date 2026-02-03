import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const ResultPage = () => {
    const { sessionId } = useParams();
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE = `http://${window.location.hostname}:5000`;

    useEffect(() => {
        const fetchResult = async () => {
            try {
                console.log('Fetching result for session:', sessionId);
                console.log('API URL:', `${API_BASE}/api/result/${sessionId}`);

                const res = await fetch(`${API_BASE}/api/result/${sessionId}`);

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();
                console.log('Result data received:', data);
                setResultData(data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching result:", err);
                setError(err.message);
                setLoading(false);
            }
        };
        fetchResult();
    }, [sessionId, API_BASE]);

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="loading" style={{ fontSize: '1.5rem', color: '#3b82f6' }}>Loading Results...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="card" style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem' }}>
                    <h2 style={{ color: '#ef4444' }}>❌ Error Loading Results</h2>
                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{error}</p>
                    <Link to="/" className="btn btn-primary">Back to Home</Link>
                </div>
            </div>
        );
    }

    if (!resultData || !resultData.summary) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="card" style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem' }}>
                    <h2>⚠️ No Results Found</h2>
                    <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Result data not available for this session.</p>
                    <Link to="/" className="btn btn-primary">Back to Home</Link>
                </div>
            </div>
        );
    }

    const { summary, detailedReview } = resultData;

    return (
        <div className="page-container">
            <div className="result-card">
                <h1>Test Results 📊</h1>

                <div className="score-summary">
                    <div className="score-item">
                        <h3>Total Score</h3>
                        <p className="big-score">{summary.score} / {summary.totalMarks}</p>
                    </div>
                    <div className="stats-grid">
                        <div className="stat correct">
                            <span>✅ Correct</span>
                            <span>{summary.correctCount}</span>
                        </div>
                        <div className="stat wrong">
                            <span>❌ Wrong</span>
                            <span>{summary.wrongCount}</span>
                        </div>
                        <div className="stat skipped">
                            <span>⏭️ Skipped</span>
                            <span>{summary.skippedCount}</span>
                        </div>
                    </div>
                </div>

                <h2>Detailed Review</h2>
                <div className="review-list">
                    {detailedReview.map((item, idx) => (
                        <div key={idx} className={`review-item ${item.status}`}>
                            <div className="question-header">
                                <span className="q-num">Q{idx + 1}</span>
                                <p>{item.question}</p>
                            </div>
                            <div className="options-review">
                                {Object.entries(item.options).map(([key, val]) => {
                                    let optionClass = 'option-row';
                                    if (key === item.correctAnswer) optionClass += ' correct-option';
                                    if (key === item.userAnswer && key !== item.correctAnswer) optionClass += ' wrong-option';
                                    if (key === item.userAnswer && key === item.correctAnswer) optionClass += ' user-correct';

                                    return (
                                        <div key={key} className={optionClass}>
                                            <span className="opt-key">{key.toUpperCase()}</span>
                                            <span className="opt-val">{val}</span>
                                            {key === item.userAnswer && <span className="badge">Your Answer</span>}
                                            {key === item.correctAnswer && <span className="badge success">Correct Answer</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="actions">
                    <Link to="/" className="btn btn-primary">Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default ResultPage;

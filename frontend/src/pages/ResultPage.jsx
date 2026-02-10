import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const ResultPage = () => {
    const { sessionId } = useParams();
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveCode, setSaveCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const API_BASE = import.meta.env.MODE === 'development'
        ? 'http://localhost:5000'
        : 'https://online-test-backend-m2sw.onrender.com';

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

    const handleSaveTest = async () => {
        if (!saveCode.trim()) {
            setSaveMessage('Please enter the private code');
            return;
        }

        setSaving(true);
        setSaveMessage('');

        try {
            const res = await fetch(`${API_BASE}/api/test/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: resultData.testId,
                    privateCode: saveCode
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save test');
            }

            setSaveMessage('✅ Test saved successfully!');
            setTimeout(() => {
                setShowSaveModal(false);
                setSaveCode('');
                setSaveMessage('');
            }, 2000);
        } catch (err) {
            setSaveMessage(`❌ ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

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

                {/* Subject-Wise Breakdown */}
                {summary.subjectWise && summary.subjectWise.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h2>Subject Performance</h2>
                        <div className="subject-stats">
                            {summary.subjectWise.map((subject, idx) => (
                                <div key={idx} className="subject-result-card" style={{ marginBottom: 0 }}>
                                    <h4>{subject.subject}</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div className="subject-stat">
                                            <div className="subject-stat-value" style={{ fontSize: '1.2rem' }}>
                                                {subject.score} / {subject.totalMarks}
                                            </div>
                                            <div className="subject-stat-label">Score</div>
                                        </div>
                                        <div className="subject-stat" style={{ background: '#ecfdf5' }}>
                                            <div className="subject-stat-value" style={{ fontSize: '1.2rem', color: '#059669' }}>
                                                {Math.round((subject.score / (subject.totalMarks || 1)) * 100)}%
                                            </div>
                                            <div className="subject-stat-label">Accuracy</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>✅ {subject.correct}</span>
                                        <span>❌ {subject.wrong}</span>
                                        <span>⏭️ {subject.skipped}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

                <div className="actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="btn btn-secondary"
                        style={{ background: '#10b981', color: 'white', border: 'none' }}
                    >
                        💾 Save This Test
                    </button>
                    <Link to="/" className="btn btn-primary">Back to Home</Link>
                </div>

                {/* Save Test Modal */}
                {showSaveModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '12px',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                        }}>
                            <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>🔒 Enter Private Code</h3>
                            <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                                Enter the private code to save this test template
                            </p>
                            <input
                                type="password"
                                value={saveCode}
                                onChange={(e) => setSaveCode(e.target.value)}
                                placeholder="Enter code..."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '1rem',
                                    marginBottom: '1rem'
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveTest()}
                            />
                            {saveMessage && (
                                <div style={{
                                    padding: '0.75rem',
                                    marginBottom: '1rem',
                                    borderRadius: '6px',
                                    background: saveMessage.includes('✅') ? '#d1fae5' : '#fee2e2',
                                    color: saveMessage.includes('✅') ? '#065f46' : '#991b1b',
                                    fontSize: '0.9rem'
                                }}>
                                    {saveMessage}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        setShowSaveModal(false);
                                        setSaveCode('');
                                        setSaveMessage('');
                                    }}
                                    className="btn btn-secondary"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTest}
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Test'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultPage;

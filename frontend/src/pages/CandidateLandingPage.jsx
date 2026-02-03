import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CandidateLandingPage = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [testInfo, setTestInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE = `http://${window.location.hostname}:5000`;

    useEffect(() => {
        const fetchTestInfo = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/test/${testId}/info`);
                if (!res.ok) {
                    throw new Error('Test not found');
                }
                const data = await res.json();
                setTestInfo(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch test info:", err);
                setError(err.message);
                setLoading(false);
            }
        };
        fetchTestInfo();
    }, [testId, API_BASE]);

    const handleStartTest = () => {
        navigate(`/test/${testId}/exam`);
    };

    if (loading) {
        return <div className="loading-screen">Loading test details...</div>;
    }

    if (error) {
        return (
            <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                <div className="card" style={{ maxWidth: '600px', width: '90%', textAlign: 'center', padding: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#991b1b' }}>❌ Test Not Found</h1>
                    <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                        The test link you're trying to access is invalid or has expired.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', minHeight: '100vh' }}>
            <div className="card" style={{ maxWidth: '700px', width: '90%', textAlign: 'center', padding: '3rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#1f2937' }}>{testInfo.testName}</h1>
                <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                    Welcome! Please review the test details below before starting.
                </p>

                <div style={{ textAlign: 'left', background: '#f3f4f6', padding: '2rem', borderRadius: '12px', marginBottom: '2.5rem', border: '2px solid #e5e7eb' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#374151', fontSize: '1.2rem' }}>📋 Test Information</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>Total Questions</div>
                            <div style={{ fontSize: '2rem', color: '#1f2937', fontWeight: 'bold' }}>{testInfo.questionCount}</div>
                        </div>
                        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>Duration</div>
                            <div style={{ fontSize: '2rem', color: '#1f2937', fontWeight: 'bold' }}>{testInfo.timerMinutes} <span style={{ fontSize: '1rem' }}>mins</span></div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1rem' }}>Marking Scheme</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Correct Answer</div>
                                <div style={{ fontSize: '1.5rem', color: '#16a34a', fontWeight: 'bold' }}>+{testInfo.correctMark}</div>
                            </div>
                            <div style={{ width: '1px', background: '#e5e7eb' }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Wrong Answer</div>
                                <div style={{ fontSize: '1.5rem', color: '#dc2626', fontWeight: 'bold' }}>{testInfo.wrongMark}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #fbbf24' }}>
                    <p style={{ margin: 0, color: '#92400e', fontSize: '0.95rem' }}>
                        ⚠️ <strong>Important:</strong> Once you click "Start Test", the timer will begin immediately. Make sure you're ready!
                    </p>
                </div>

                <button
                    onClick={handleStartTest}
                    className="btn btn-primary"
                    style={{
                        fontSize: '1.25rem',
                        padding: '1rem 3rem',
                        width: '100%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                    }}
                >
                    Start Test 🚀
                </button>
            </div>
        </div>
    );
};

export default CandidateLandingPage;

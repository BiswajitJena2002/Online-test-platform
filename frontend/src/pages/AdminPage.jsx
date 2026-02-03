import React, { useState } from 'react';

const AdminPage = () => {
    const [testName, setTestName] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [message, setMessage] = useState('');
    const [timerMinutes, setTimerMinutes] = useState(30);
    const [correctMark, setCorrectMark] = useState(1);
    const [wrongMark, setWrongMark] = useState(-0.25);
    const [generatedTestLink, setGeneratedTestLink] = useState('');
    const [serverIP, setServerIP] = useState('');

    // Dynamic API Base URL
    const API_BASE = `http://${window.location.hostname}:5000`;

    React.useEffect(() => {
        // Fetch server IP
        const fetchIP = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/ip`);
                const data = await res.json();
                if (data.ip) {
                    setServerIP(data.ip);
                }
            } catch (e) {
                console.error("Failed to fetch IP", e);
            }
        };
        fetchIP();
    }, [API_BASE]);

    const handleCreateTest = async () => {
        if (!testName.trim()) {
            setMessage('Error: Please enter a test name');
            return;
        }

        try {
            const parsed = JSON.parse(jsonInput);
            const questions = Array.isArray(parsed) ? parsed : parsed.questions;

            if (!questions || questions.length === 0) {
                setMessage('Error: No questions found in JSON');
                return;
            }

            const res = await fetch(`${API_BASE}/api/test/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testName: testName.trim(),
                    timerMinutes: parseInt(timerMinutes),
                    correctMark: parseFloat(correctMark),
                    wrongMark: parseFloat(wrongMark),
                    questions
                })
            });

            const data = await res.json();
            if (res.ok) {
                const testLink = `http://${serverIP}:${window.location.port}/test/${data.testId}`;
                setGeneratedTestLink(testLink);
                setMessage(`✅ Success: Test "${data.testName}" created with ${data.questionCount} questions!`);
                // Clear form
                setTestName('');
                setJsonInput('');
            } else {
                setMessage(`Error: ${data.error}`);
            }
        } catch (e) {
            setMessage(`Invalid JSON: ${e.message}`);
        }
    };

    const sampleJson = [
        {
            "question_id": 1,
            "question": "What is the capital of France?",
            "options": { "a": "Berlin", "b": "Madrid", "c": "Paris", "d": "Rome" },
            "correct_answer": "c"
        },
        {
            "question_id": 2,
            "question": "What is 2 + 2?",
            "options": { "a": "3", "b": "4", "c": "5", "d": "6" },
            "correct_answer": "b"
        },
        {
            "question_id": 3,
            "question": "Which planet is known as the Red Planet?",
            "options": { "a": "Venus", "b": "Mars", "c": "Jupiter", "d": "Saturn" },
            "correct_answer": "b"
        }
    ];

    return (
        <div className="page-container">
            <div className="card" style={{ margin: '0 auto', maxWidth: '1200px', padding: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>🎓 Admin: Create New Test</h1>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Configure and create a new test with a unique shareable link</p>

                {/* Generated Test Link Section */}
                {generatedTestLink && (
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#dcfce7', borderRadius: '8px', border: '2px solid #16a34a' }}>
                        <h3 style={{ marginBottom: '0.5rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ✅ Test Created Successfully!
                        </h3>
                        <p style={{ marginBottom: '1rem', color: '#166534' }}>
                            Share this link with candidates:
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                readOnly
                                value={generatedTestLink}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '4px',
                                    border: '2px solid #16a34a',
                                    fontSize: '1.1rem',
                                    fontFamily: 'monospace',
                                    background: 'white'
                                }}
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedTestLink);
                                    alert('Link copied to clipboard!');
                                }}
                                className="btn btn-primary"
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                📋 Copy Link
                            </button>
                        </div>
                        <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#166534' }}>
                            💡 Candidates will see test details and can start the test from this link
                        </p>
                    </div>
                )}

                {/* Test Name */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '1.1rem' }}>
                        Test Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        placeholder="e.g., Mathematics Quiz - Chapter 5"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {/* Test Settings */}
                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>⚙️ Test Configuration</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Timer (minutes)</label>
                            <input
                                type="number"
                                value={timerMinutes}
                                onChange={(e) => setTimerMinutes(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Correct Answer Mark</label>
                            <input
                                type="number"
                                step="0.25"
                                value={correctMark}
                                onChange={(e) => setCorrectMark(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Wrong Answer Mark</label>
                            <input
                                type="number"
                                step="0.25"
                                value={wrongMark}
                                onChange={(e) => setWrongMark(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Question Upload */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>📝 Questions (JSON Format)</h3>
                    <textarea
                        style={{
                            width: '100%',
                            height: '300px',
                            padding: '1rem',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '6px',
                            resize: 'vertical'
                        }}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste JSON array of questions here..."
                    />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => setJsonInput(JSON.stringify(sampleJson, null, 2))}
                            className="btn btn-secondary"
                        >
                            📄 Load Sample Questions
                        </button>
                    </div>
                </div>

                {/* Create Test Button */}
                <button
                    onClick={handleCreateTest}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1.2rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none'
                    }}
                >
                    🚀 Create Test & Generate Link
                </button>

                {message && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        borderRadius: '6px',
                        background: message.includes('Success') || message.includes('✅') ? '#dcfce7' : '#fee2e2',
                        color: message.includes('Success') || message.includes('✅') ? '#166534' : '#991b1b',
                        border: `1px solid ${message.includes('Success') || message.includes('✅') ? '#16a34a' : '#dc2626'}`
                    }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;

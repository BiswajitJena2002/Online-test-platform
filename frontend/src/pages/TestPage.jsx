import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Timer from '../components/Timer';
import QuestionCard from '../components/QuestionCard';
import NavigationPanel from '../components/NavigationPanel';

const TestPage = () => {
    const { testId } = useParams();
    const [questions, setQuestions] = useState([]);
    const [questionsOdia, setQuestionsOdia] = useState([]); // New: Odia questions
    const [language, setLanguage] = useState('english'); // New: 'english' | 'odia'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: option }
    const [skipped, setSkipped] = useState([]); // [questionId]
    const [loading, setLoading] = useState(true);
    const [timerMinutes, setTimerMinutes] = useState(30);
    const [isPaused, setIsPaused] = useState(false);
    const [testName, setTestName] = useState('');
    const navigate = useNavigate();
    const API_BASE = import.meta.env.MODE === 'development'
        ? 'http://localhost:5000'
        : 'https://online-test-backend-m2sw.onrender.com';

    // Start test session when component mounts
    useEffect(() => {
        const startTest = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/test/${testId}/start`, { method: 'POST' });
                if (!res.ok) {
                    throw new Error('Failed to start test');
                }
                const data = await res.json();
                setSessionId(data.sessionId);
                setQuestions(data.questions);
                setQuestionsOdia(data.questionsOdia || []); // Set Odia questions
                setTimerMinutes(data.timerMinutes || 30);
                setTestName(data.testName || 'Online Test');
                localStorage.setItem('test_session_id', data.sessionId);
                setLoading(false);
            } catch (err) {
                console.error("Failed to start test", err);
                alert("Failed to start test. Please try again.");
                navigate(`/test/${testId}`);
            }
        };
        startTest();
    }, [testId, API_BASE, navigate]);

    const handleOptionSelect = async (optionKey) => {
        if (isPaused) return; // Don't allow changes when paused

        // Always use English question ID for tracking answers
        const question = questions[currentQuestionIndex];
        if (!question) return;

        setAnswers(prev => ({ ...prev, [question.question_id]: optionKey }));

        await fetch(`${API_BASE}/api/submit-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                questionId: question.question_id,
                selectedOption: optionKey
            })
        });
    };

    const handleSkip = async () => {
        if (isPaused) return; // Don't allow changes when paused

        const question = questions[currentQuestionIndex];
        if (!question) return;

        setAnswers(prev => {
            const next = { ...prev };
            delete next[question.question_id];
            return next;
        });
        setSkipped(prev => [...prev, question.question_id]);

        await fetch(`${API_BASE}/api/submit-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                questionId: question.question_id,
                selectedOption: null
            })
        });

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePauseResume = () => {
        setIsPaused(!isPaused);
    };

    const handleFinalSubmit = async () => {
        if (!window.confirm("Are you sure you want to submit the test?")) return;

        await fetch(`${API_BASE}/api/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });

        navigate(`/result/${sessionId}`);
    };

    if (loading) return <div className="loading-screen">Loading Test...</div>;

    if (!sessionId || questions.length === 0) {
        return (
            <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="card" style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem' }}>
                    <h2>❌ Error Loading Test</h2>
                    <p style={{ color: '#6b7280' }}>Unable to load test questions. Please try again.</p>
                    <button
                        onClick={() => navigate(`/test/${testId}`)}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Determine which question to display based on language
    const currentQuestionEnglish = questions[currentQuestionIndex];
    const currentQuestionOdia = questionsOdia && questionsOdia[currentQuestionIndex];

    // Use Odia question if language is 'odia' and it exists, otherwise fallback to English
    const displayQuestion = (language === 'odia' && currentQuestionOdia)
        ? currentQuestionOdia
        : currentQuestionEnglish;

    // Ensure we preserve the original question_id for logic even if displaying Odia
    // But for UI rendering, we use displayQuestion's text and options

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb' }}>
            {/* Header */}
            <header style={{
                background: 'white',
                padding: '1rem 2rem',
                borderBottom: '2px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#1f2937' }}>
                    {testName} {isPaused && <span style={{ color: '#ef4444', fontSize: '1rem' }}>(PAUSED)</span>}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Language Toggle */}
                    {questionsOdia && questionsOdia.length > 0 && (
                        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '20px', padding: '0.25rem' }}>
                            <button
                                onClick={() => setLanguage('english')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: language === 'english' ? 'white' : 'transparent',
                                    color: language === 'english' ? '#2563eb' : '#6b7280',
                                    fontWeight: '600',
                                    boxShadow: language === 'english' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('odia')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: language === 'odia' ? 'white' : 'transparent',
                                    color: language === 'odia' ? '#2563eb' : '#6b7280',
                                    fontWeight: '600',
                                    boxShadow: language === 'odia' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Odia
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (window.confirm("Start fresh test? Current progress will be lost.")) {
                                navigate('/admin');
                            }
                        }}
                        className="btn btn-secondary"
                        style={{ border: '1px solid #ccc' }}
                    >
                        Start Fresh Test
                    </button>
                    <Timer initialMinutes={timerMinutes} onTimeUp={handleFinalSubmit} isPaused={isPaused} />
                    <button
                        onClick={handlePauseResume}
                        className="btn btn-secondary"
                        style={{ background: isPaused ? '#22c55e' : '#f59e0b', color: 'white', border: 'none' }}
                    >
                        {isPaused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                    <button
                        onClick={handleFinalSubmit}
                        className="btn btn-danger"
                    >
                        Final Submit
                    </button>
                </div>
            </header>

            {/* Main Content - Full Height */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left: Question Area */}
                <div style={{
                    flex: 1,
                    padding: '2rem 3rem',
                    overflowY: 'auto',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div style={{ width: '100%' }}>
                        {/* Image Rendering */}
                        {currentQuestionEnglish.image && (
                            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                <img
                                    src={currentQuestionEnglish.image.startsWith('http')
                                        ? currentQuestionEnglish.image
                                        : `${API_BASE}${currentQuestionEnglish.image}`}
                                    alt="Question Attachment"
                                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                            </div>
                        )}

                        <QuestionCard
                            question={displayQuestion}
                            selectedOption={answers[currentQuestionEnglish.question_id]}
                            onOptionSelect={handleOptionSelect}
                            onSkip={handleSkip}
                        />

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                disabled={currentQuestionIndex === 0 || isPaused}
                                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                className="btn btn-secondary"
                                style={{ opacity: (currentQuestionIndex === 0 || isPaused) ? 0.5 : 1, fontSize: '1rem', padding: '0.75rem 2rem' }}
                            >
                                ← Previous
                            </button>
                            <button
                                disabled={currentQuestionIndex === questions.length - 1 || isPaused}
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className="btn btn-primary"
                                style={{ opacity: (currentQuestionIndex === questions.length - 1 || isPaused) ? 0.5 : 1, fontSize: '1rem', padding: '0.75rem 2rem' }}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Navigation Panel */}
                <div style={{ width: '350px', padding: '2rem', background: '#f8fafc', borderLeft: '2px solid #e5e7eb', overflowY: 'auto' }}>
                    <NavigationPanel
                        totalQuestions={questions.length}
                        currentQuestionIndex={currentQuestionIndex}
                        onNavigate={(index) => !isPaused && setCurrentQuestionIndex(index)}
                        answers={answers}
                        skipped={skipped}
                        questions={questions}
                    />
                </div>
            </div>
        </div>
    );
};

export default TestPage;

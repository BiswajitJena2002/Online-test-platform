import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Timer from '../components/Timer';
import QuestionCard from '../components/QuestionCard';
import NavigationPanel from '../components/NavigationPanel';
import SubjectNavigator from '../components/SubjectNavigator';

const TestPage = () => {
    const { testId } = useParams();
    const [questions, setQuestions] = useState([]);
    const [questionsOdia, setQuestionsOdia] = useState([]); // New: Odia questions
    const [language, setLanguage] = useState('english'); // New: 'english' | 'odia'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: option }
    const [skipped, setSkipped] = useState([]); // [questionId]
    const [markedForReview, setMarkedForReview] = useState([]); // [questionId]
    const [loading, setLoading] = useState(true);
    const [timerMinutes, setTimerMinutes] = useState(30);
    const [isPaused, setIsPaused] = useState(false);
    const [testName, setTestName] = useState('');
    const [imageModal, setImageModal] = useState({ show: false, url: '', zoom: 1 });

    // Subject-wise test support
    const [isSubjectWise, setIsSubjectWise] = useState(false);
    const [sections, setSections] = useState([]);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [questionToSectionMap, setQuestionToSectionMap] = useState({}); // { questionId: sectionIndex }
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
                setTimerMinutes(data.timerMinutes || 30);
                setTestName(data.testName || 'Online Test');
                setIsSubjectWise(data.isSubjectWise || false);

                if (data.isSubjectWise && data.sections) {
                    // Subject-wise test: flatten sections into questions array
                    setSections(data.sections);
                    let allQuestions = [];
                    let allQuestionsOdia = [];
                    let qToSectionMap = {};

                    data.sections.forEach((section, sectionIdx) => {
                        section.questions.forEach(q => {
                            allQuestions.push(q);
                            qToSectionMap[q.question_id] = sectionIdx;
                        });
                        if (section.questionsOdia) {
                            section.questionsOdia.forEach(q => {
                                allQuestionsOdia.push(q);
                            });
                        }
                    });

                    setQuestions(allQuestions);
                    setQuestionsOdia(allQuestionsOdia);
                    setQuestionToSectionMap(qToSectionMap);
                } else {
                    // Flat test
                    setQuestions(data.questions);
                    setQuestionsOdia(data.questionsOdia || []);
                }

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

    const handleMarkForReview = () => {
        if (isPaused) return; // Don't allow changes when paused

        const question = questions[currentQuestionIndex];
        if (!question) return;

        setMarkedForReview(prev => {
            if (prev.includes(question.question_id)) {
                // Unmark: remove from array
                return prev.filter(id => id !== question.question_id);
            } else {
                // Mark: add to array
                return [...prev, question.question_id];
            }
        });
    };

    const handleClearOption = async () => {
        if (isPaused) return; // Don't allow changes when paused

        const question = questions[currentQuestionIndex];
        if (!question) return;

        // Remove answer from state
        setAnswers(prev => {
            const next = { ...prev };
            delete next[question.question_id];
            return next;
        });

        // Remove from skipped array if present
        setSkipped(prev => prev.filter(id => id !== question.question_id));

        // Send null to backend
        await fetch(`${API_BASE}/api/submit-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                questionId: question.question_id,
                selectedOption: null
            })
        });
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

    const handleImageClick = (url) => {
        setImageModal({ show: true, url, zoom: 1 });
    };

    const closeImageModal = () => {
        setImageModal({ show: false, url: '', zoom: 1 });
    };

    const zoomIn = () => {
        setImageModal(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.25, 3) }));
    };

    const zoomOut = () => {
        setImageModal(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.25, 0.5) }));
    };

    // Subject-wise navigation helpers
    const handleSectionChange = (sectionIndex) => {
        setCurrentSectionIndex(sectionIndex);
        // Find first question in this section
        const firstQuestionInSection = questions.findIndex(q => questionToSectionMap[q.question_id] === sectionIndex);
        if (firstQuestionInSection !== -1) {
            setCurrentQuestionIndex(firstQuestionInSection);
        }
    };

    const calculateSectionProgress = () => {
        if (!isSubjectWise || sections.length === 0) return {};

        const progress = {};
        sections.forEach((section, idx) => {
            const sectionQuestions = questions.filter(q => questionToSectionMap[q.question_id] === idx);
            const answered = sectionQuestions.filter(q => answers[q.question_id]).length;
            progress[section.subject_id] = {
                answered,
                total: sectionQuestions.length
            };
        });
        return progress;
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

            {/* Subject Navigator - Only show for subject-wise tests */}
            {isSubjectWise && sections.length > 0 && (
                <SubjectNavigator
                    sections={sections}
                    currentSectionIndex={currentSectionIndex}
                    onSectionChange={handleSectionChange}
                    sectionProgress={calculateSectionProgress()}
                />
            )}

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
                                    onClick={() => setImageModal({
                                        show: true,
                                        url: currentQuestionEnglish.image.startsWith('http')
                                            ? currentQuestionEnglish.image
                                            : `${API_BASE}${currentQuestionEnglish.image}`,
                                        zoom: 1
                                    })}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '300px',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        cursor: 'zoom-in',
                                        transition: 'transform 0.2s',
                                        ':hover': { transform: 'scale(1.02)' }
                                    }}
                                />
                            </div>
                        )}

                        <QuestionCard
                            question={displayQuestion}
                            selectedOption={answers[currentQuestionEnglish.question_id]}
                            onOptionSelect={handleOptionSelect}
                            onSkip={handleSkip}
                        />

                        {/* Mark for Review and Clear Option Buttons */}
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                disabled={isPaused}
                                onClick={handleMarkForReview}
                                className="btn"
                                style={{
                                    opacity: isPaused ? 0.5 : 1,
                                    fontSize: '1rem',
                                    padding: '0.75rem 1.5rem',
                                    background: markedForReview.includes(currentQuestionEnglish.question_id) ? '#8b5cf6' : '#f59e0b',
                                    color: 'white',
                                    fontWeight: '600'
                                }}
                            >
                                {markedForReview.includes(currentQuestionEnglish.question_id) ? '🔖 Unmark for Review' : '🔖 Mark for Review'}
                            </button>
                            <button
                                disabled={isPaused || !answers[currentQuestionEnglish.question_id]}
                                onClick={handleClearOption}
                                className="btn btn-secondary"
                                style={{
                                    opacity: (isPaused || !answers[currentQuestionEnglish.question_id]) ? 0.5 : 1,
                                    fontSize: '1rem',
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: '600'
                                }}
                            >
                                ✖ Clear Option
                            </button>
                        </div>

                        {/* Navigation Buttons */}
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
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
                        markedForReview={markedForReview}
                        sections={sections}
                        isSubjectWise={isSubjectWise}
                    />
                </div>
            </div>

            {/* Image Zoom Modal */}
            {imageModal.show && (
                <div
                    onClick={() => setImageModal({ show: false, url: '', zoom: 1 })}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 9999,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '2rem'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setImageModal({ show: false, url: '', zoom: 1 })}
                            style={{
                                position: 'absolute',
                                top: '-3rem',
                                right: 0,
                                background: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                fontSize: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: '#374151',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                        >
                            ×
                        </button>

                        {/* Image */}
                        <div style={{ overflow: 'auto', maxWidth: '80vw', maxHeight: '75vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img
                                src={imageModal.url}
                                alt="Zoomed Question"
                                style={{
                                    transform: `scale(${imageModal.zoom})`,
                                    transformOrigin: 'center center',
                                    transition: 'transform 0.3s ease',
                                    display: 'block',
                                    width: '80vw',
                                    height: 'auto',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>

                        {/* Zoom Controls */}
                        <div style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                            <button
                                onClick={() => setImageModal(prev => ({
                                    ...prev,
                                    zoom: Math.max(0.5, prev.zoom - 0.25)
                                }))}
                                disabled={imageModal.zoom <= 0.5}
                                style={{
                                    background: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    fontSize: '20px',
                                    cursor: imageModal.zoom <= 0.5 ? 'not-allowed' : 'pointer',
                                    opacity: imageModal.zoom <= 0.5 ? 0.5 : 1,
                                    fontWeight: 'bold'
                                }}
                            >
                                −
                            </button>
                            <span style={{
                                fontWeight: '600',
                                minWidth: '60px',
                                textAlign: 'center',
                                color: '#374151'
                            }}>
                                {Math.round(imageModal.zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setImageModal(prev => ({
                                    ...prev,
                                    zoom: Math.min(3, prev.zoom + 0.25)
                                }))}
                                disabled={imageModal.zoom >= 3}
                                style={{
                                    background: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    fontSize: '20px',
                                    cursor: imageModal.zoom >= 3 ? 'not-allowed' : 'pointer',
                                    opacity: imageModal.zoom >= 3 ? 0.5 : 1,
                                    fontWeight: 'bold'
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestPage;

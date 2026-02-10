import React, { useState, useEffect } from 'react';
import SubjectSectionManager from '../components/SubjectSectionManager';

const AdminPage = () => {
    const [testName, setTestName] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [jsonInputOdia, setJsonInputOdia] = useState(''); // New: Odia JSON Input
    const [isDualLanguage, setIsDualLanguage] = useState(false); // New: Toggle Dual Language
    const [isSubjectWise, setIsSubjectWise] = useState(false); // New: Toggle Subject-Wise
    const [sections, setSections] = useState([]); // New: Sections array for subject-wise tests
    const [images, setImages] = useState({}); // New: Map question index to image URL { 0: "url", 2: "url" }
    const [message, setMessage] = useState('');
    const [timerMinutes, setTimerMinutes] = useState(30);
    const [correctMark, setCorrectMark] = useState(1);
    const [wrongMark, setWrongMark] = useState(-0.25);
    const [generatedTestLink, setGeneratedTestLink] = useState('');

    // Saved Tests Feature
    const [activeTab, setActiveTab] = useState('create'); // 'create' or 'saved'
    const [savedTests, setSavedTests] = useState([]);
    const [loadingSavedTests, setLoadingSavedTests] = useState(false);

    // Production API Base URL
    // Production API Base URL
    const API_BASE = import.meta.env.MODE === 'development'
        ? 'http://localhost:5000'
        : 'https://online-test-backend-m2sw.onrender.com';

    // Production Frontend URL - UPDATE THIS with your actual Render frontend URL
    const FRONTEND_URL = window.location.origin; // This will use the current domain

    const handleCreateTest = async () => {
        if (!testName.trim()) {
            setMessage('Error: Please enter a test name');
            return;
        }

        try {
            let requestBody = {
                testName: testName.trim(),
                timerMinutes: parseInt(timerMinutes),
                correctMark: parseFloat(correctMark),
                wrongMark: parseFloat(wrongMark),
                isSubjectWise
            };

            if (isSubjectWise) {
                // Validate sections
                if (sections.length === 0) {
                    setMessage('Error: Please add at least one subject section');
                    return;
                }

                // Validate each section
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i];
                    if (!section.subject_name.trim()) {
                        setMessage(`Error: Section ${i + 1} is missing a subject name`);
                        return;
                    }
                    if (!section.questions || section.questions.length === 0) {
                        setMessage(`Error: Section "${section.subject_name}" has no questions`);
                        return;
                    }
                    if (isDualLanguage && (!section.questionsOdia || section.questionsOdia.length === 0)) {
                        setMessage(`Error: Section "${section.subject_name}" is missing Odia questions`);
                        return;
                    }
                    if (isDualLanguage && section.questions.length !== section.questionsOdia.length) {
                        setMessage(`Error: Question count mismatch in section "${section.subject_name}"`);
                        return;
                    }
                }

                requestBody.sections = sections;
            } else {
                // Flat test validation
                const parsed = JSON.parse(jsonInput);
                const questions = Array.isArray(parsed) ? parsed : parsed.questions;

                if (!questions || questions.length === 0) {
                    setMessage('Error: No questions found in JSON');
                    return;
                }

                let questionsOdia = null;
                if (isDualLanguage) {
                    if (!jsonInputOdia.trim()) {
                        setMessage('Error: Please enter Odia questions JSON');
                        return;
                    }
                    const parsedOdia = JSON.parse(jsonInputOdia);
                    questionsOdia = Array.isArray(parsedOdia) ? parsedOdia : parsedOdia.questions;

                    if (questionsOdia.length !== questions.length) {
                        setMessage(`Error: Question count mismatch. English: ${questions.length}, Odia: ${questionsOdia.length}`);
                        return;
                    }
                }

                requestBody.questions = questions;
                requestBody.questionsOdia = questionsOdia;
                requestBody.images = images;
            }

            const res = await fetch(`${API_BASE}/api/test/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await res.json();
            if (res.ok) {
                const testLink = `${FRONTEND_URL}/test/${data.testId}`;
                setGeneratedTestLink(testLink);
                setMessage(`✅ Success: Test "${data.testName}" created with ${data.questionCount} questions!`);
                // Clear form
                setTestName('');
                setJsonInput('');
                setJsonInputOdia('');
                setImages({});
                setSections([]);
                setIsSubjectWise(false);
            } else {
                setMessage(`Error: ${data.error}`);
            }
        } catch (e) {
            setMessage(`Invalid JSON: ${e.message}`);
        }
    };

    const handleImageUpload = async (e, questionIndex) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setImages(prev => ({
                    ...prev,
                    [questionIndex]: data.url
                }));
                alert(`Image uploaded for Question ${questionIndex + 1}`);
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Upload failed');
        }
    };

    // Fetch saved tests when switching to Saved Tests tab
    useEffect(() => {
        if (activeTab === 'saved') {
            fetchSavedTests();
        }
    }, [activeTab, API_BASE]);

    const fetchSavedTests = async () => {
        setLoadingSavedTests(true);
        try {
            const res = await fetch(`${API_BASE}/api/tests/saved`);
            const data = await res.json();
            setSavedTests(data.savedTests || []);
        } catch (error) {
            console.error('Error fetching saved tests:', error);
            alert('Failed to load saved tests');
        } finally {
            setLoadingSavedTests(false);
        }
    };

    const loadSavedTest = async (savedTestId) => {
        try {
            const res = await fetch(`${API_BASE}/api/tests/saved/${savedTestId}`);
            const data = await res.json();

            // Pre-fill form with saved test data
            setTestName(data.testName + ' (Copy)');
            setIsSubjectWise(data.isSubjectWise || false);
            setIsDualLanguage(!!data.questionsOdia || data.sections?.some(s => s.questionsOdia));

            if (data.isSubjectWise) {
                setSections(data.sections || []);
                setJsonInput('');
                setJsonInputOdia('');
            } else {
                setJsonInput(JSON.stringify(data.questions, null, 2));
                setJsonInputOdia(data.questionsOdia ? JSON.stringify(data.questionsOdia, null, 2) : '');
                setSections([]);
            }

            setImages(data.images || {});
            setTimerMinutes(data.settings.timerMinutes);
            setCorrectMark(data.settings.correctMark);
            setWrongMark(data.settings.wrongMark);

            // Switch to create tab
            setActiveTab('create');
            setMessage('Saved test loaded! You can modify and create a new test.');
        } catch (error) {
            console.error('Error loading saved test:', error);
            alert('Failed to load saved test');
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

    const sampleJsonOdia = [
        {
            "question_id": 1,
            "question": "ଫ୍ରାନ୍ସର ରାଜଧାନୀ କ’ଣ?",
            "options": { "a": "ବର୍ଲିନ୍", "b": "ମାଦ୍ରିଦ୍", "c": "ପ୍ୟାରିସ୍", "d": "ରୋମ୍" },
            "correct_answer": "c"
        },
        {
            "question_id": 2,
            "question": "୨ + ୨ କେତେ?",
            "options": { "a": "୩", "b": "୪", "c": "୫", "d": "୬" },
            "correct_answer": "b"
        },
        {
            "question_id": 3,
            "question": "କେଉଁ ଗ୍ରହକୁ ଲାଲ୍ ଗ୍ରହ କୁହାଯାଏ?",
            "options": { "a": "ଶୁକ୍ର", "b": "ମଙ୍ଗଳ", "c": "ବୃହସ୍ପତି", "d": "ଶନି" },
            "correct_answer": "b"
        }
    ];

    return (
        <div className="page-container">
            <div className="card" style={{ margin: '0 auto', maxWidth: '1200px', padding: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>🎓 Admin Panel</h1>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Create new tests or use saved templates</p>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e5e7eb' }}>
                    <button
                        onClick={() => setActiveTab('create')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'create' ? '#3b82f6' : 'transparent',
                            color: activeTab === 'create' ? 'white' : '#6b7280',
                            border: 'none',
                            borderBottom: activeTab === 'create' ? '3px solid #3b82f6' : '3px solid transparent',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        ✏️ Create New Test
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'saved' ? '#3b82f6' : 'transparent',
                            color: activeTab === 'saved' ? 'white' : '#6b7280',
                            border: 'none',
                            borderBottom: activeTab === 'saved' ? '3px solid #3b82f6' : '3px solid transparent',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        💾 Saved Tests ({savedTests.length})
                    </button>
                </div>

                <>
                    {/* Create Tab Content */}
                    {activeTab === 'create' && (
                        <div>

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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>📝 Questions</h3>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#fef3c7', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                                            <input
                                                type="checkbox"
                                                checked={isSubjectWise}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setIsSubjectWise(checked);
                                                    // Only initialize if checking and no sections exist
                                                    if (checked && sections.length === 0) {
                                                        setSections([{ subject_id: 'subject1', subject_name: '', questions: [], questionsOdia: [] }]);
                                                    }
                                                    // Do not clear sections when unchecking, so user doesn't lose data accidentally
                                                }}
                                            />
                                            <span style={{ fontWeight: '600', color: '#92400e' }}>📚 Subject-Wise Test</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#e0f2fe', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                                            <input
                                                type="checkbox"
                                                checked={isDualLanguage}
                                                onChange={(e) => setIsDualLanguage(e.target.checked)}
                                            />
                                            <span style={{ fontWeight: '600', color: '#0369a1' }}>🌐 Dual Language (Odia)</span>
                                        </label>
                                    </div>
                                </div>

                                {isSubjectWise ? (
                                    <SubjectSectionManager
                                        sections={sections}
                                        setSections={setSections}
                                        isDualLanguage={isDualLanguage}
                                    />
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', gap: '1rem', flexDirection: isDualLanguage ? 'row' : 'column' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>English Questions {isDualLanguage && '(Default)'}</label>
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
                                                    placeholder="Paste English JSON array..."
                                                />
                                            </div>
                                            {isDualLanguage && (
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Odia Questions</label>
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
                                                        value={jsonInputOdia}
                                                        onChange={(e) => setJsonInputOdia(e.target.value)}
                                                        placeholder="Paste Odia JSON array..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                            <button
                                                onClick={() => {
                                                    setJsonInput(JSON.stringify(sampleJson, null, 2));
                                                    if (isDualLanguage) {
                                                        setJsonInputOdia(JSON.stringify(sampleJsonOdia, null, 2));
                                                    }
                                                }}
                                                className="btn btn-secondary"
                                            >
                                                📄 Load Sample Questions
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Image Upload Section */}
                            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>🖼️ Attach Images to Questions</h3>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Question Index (starts at 1)</label>
                                        <input
                                            type="number"
                                            id="qIndexInput"
                                            placeholder="e.g. 1"
                                            min="1"
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div style={{ flex: 2, minWidth: '300px' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Image</label>
                                        <input
                                            type="file"
                                            id="imageInput"
                                            accept="image/*"
                                            style={{ width: '100%', padding: '0.5rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            const indexInput = document.getElementById('qIndexInput');
                                            const imageInput = document.getElementById('imageInput');
                                            const index = parseInt(indexInput.value) - 1; // Convert to 0-based

                                            if (isNaN(index) || index < 0) {
                                                alert('Please enter a valid question number');
                                                return;
                                            }
                                            if (imageInput.files.length === 0) {
                                                alert('Please select an image');
                                                return;
                                            }

                                            handleImageUpload({ target: imageInput }, index);
                                        }}
                                    >
                                        Upload Image
                                    </button>
                                </div>

                                {/* List of uploaded images */}
                                {Object.keys(images).length > 0 && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Attached Images:</h4>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {Object.entries(images).map(([idx, url]) => (
                                                <div key={idx} style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontWeight: 'bold' }}>Q{parseInt(idx) + 1}:</span>
                                                    <a href={url.startsWith('http') ? url : API_BASE + url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.9rem' }}>View Image</a>
                                                    <button
                                                        onClick={() => {
                                                            const newImages = { ...images };
                                                            delete newImages[idx];
                                                            setImages(newImages);
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '0.5rem' }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                    )}

                    {/* Saved Tests Tab Content */}
                    {activeTab === 'saved' && (
                        <div>
                            {loadingSavedTests ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    Loading saved tests...
                                </div>
                            ) : savedTests.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '1rem' }}>
                                        📂 No saved tests yet
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                                        Complete a test and save it to see it here
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {savedTests.map((test) => (
                                        <div
                                            key={test.id}
                                            style={{
                                                padding: '1.5rem',
                                                background: '#ffffff',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#3b82f6';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                                                        {test.testName}
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: '1.5rem', color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                                        <span>📝 {test.questionCount} Questions</span>
                                                        <span>📅 {new Date(test.savedDate).toLocaleDateString()}</span>
                                                        {test.isBilingual && <span>🌐 Bilingual</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => loadSavedTest(test.id)}
                                                    className="btn btn-primary"
                                                    style={{ whiteSpace: 'nowrap' }}
                                                >
                                                    🔄 Use This Test
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            </div>
        </div>
    );
};

export default AdminPage;





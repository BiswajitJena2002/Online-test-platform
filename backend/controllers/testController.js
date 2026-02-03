const { v4: uuidv4 } = require('uuid');

// Store tests by unique ID
let tests = {}; // { testId: { testName, timerMinutes, correctMark, wrongMark, questions, createdAt } }
let sessions = {};

// Default config (used when no test specified - backward compatibility)
let defaultConfig = {
    timerMinutes: 30,
    correctMark: 1,
    wrongMark: -0.25
};

// Legacy: global questions array (for backward compatibility)
let questions = [];

// CREATE NEW TEST
exports.createTest = (req, res) => {
    const { testName, timerMinutes, correctMark, wrongMark, questions } = req.body;

    if (!testName || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "Test name and questions are required" });
    }

    const testId = uuidv4().split('-')[0]; // Short ID like "a3f5b2c1"

    tests[testId] = {
        testId,
        testName,
        timerMinutes: timerMinutes || 30,
        correctMark: correctMark !== undefined ? correctMark : 1,
        wrongMark: wrongMark !== undefined ? wrongMark : -0.25,
        questions,
        createdAt: Date.now()
    };

    console.log(`Created test "${testName}" with ID: ${testId}`);
    res.json({
        message: "Test created successfully",
        testId,
        testName,
        questionCount: questions.length
    });
};

// GET TEST INFO (for candidate landing page)
exports.getTestInfo = (req, res) => {
    const { testId } = req.params;
    const test = tests[testId];

    if (!test) {
        return res.status(404).json({ error: "Test not found" });
    }

    res.json({
        testId: test.testId,
        testName: test.testName,
        questionCount: test.questions.length,
        timerMinutes: test.timerMinutes,
        correctMark: test.correctMark,
        wrongMark: test.wrongMark
    });
};

// START TEST SESSION (for specific test)
exports.startTestSession = (req, res) => {
    const { testId } = req.params;
    const test = tests[testId];

    if (!test) {
        return res.status(404).json({ error: "Test not found" });
    }

    const sessionId = uuidv4();
    sessions[sessionId] = {
        sessionId,
        testId,
        startTime: Date.now(),
        endTime: null,
        answers: {},
        skipped: []
    };

    // Return sanitized questions (without correct answers)
    const sanitizedQuestions = test.questions.map(q => {
        const { correct_answer, ...rest } = q;
        return rest;
    });

    res.json({
        sessionId,
        testName: test.testName,
        questions: sanitizedQuestions,
        timerMinutes: test.timerMinutes,
        correctMark: test.correctMark,
        wrongMark: test.wrongMark
    });
};

// LEGACY: Upload questions (backward compatibility)
exports.uploadQuestions = (req, res) => {
    const newQuestions = req.body;
    if (Array.isArray(newQuestions)) {
        questions = newQuestions;
    } else if (newQuestions.questions) {
        questions = newQuestions.questions;
    } else {
        return res.status(400).json({ error: "Invalid format" });
    }
    console.log(`Uploaded ${questions.length} questions (legacy)`);
    res.json({ message: "Questions uploaded successfully", count: questions.length });
};

// LEGACY: Start test (backward compatibility - uses global questions)
exports.startTest = (req, res) => {
    const sessionId = uuidv4();
    sessions[sessionId] = {
        sessionId,
        testId: null, // Legacy session
        startTime: Date.now(),
        endTime: null,
        answers: {},
        skipped: []
    };

    const sanitizedQuestions = questions.map(q => {
        const { correct_answer, ...rest } = q;
        return rest;
    });

    res.json({
        sessionId,
        questions: sanitizedQuestions,
        timerMinutes: defaultConfig.timerMinutes,
        correctMark: defaultConfig.correctMark,
        wrongMark: defaultConfig.wrongMark
    });
};

exports.submitAnswer = (req, res) => {
    const { sessionId, questionId, selectedOption } = req.body;
    const session = sessions[sessionId];
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.endTime) return res.status(400).json({ error: "Test already ended" });

    if (selectedOption) {
        session.answers[questionId] = selectedOption;
        session.skipped = session.skipped.filter(id => id !== questionId);
    } else {
        if (!session.skipped.includes(questionId)) {
            session.skipped.push(questionId);
        }
        delete session.answers[questionId];
    }

    res.json({ message: "Recorded" });
};

exports.endTest = (req, res) => {
    const { sessionId } = req.body;
    const session = sessions[sessionId];
    if (!session) return res.status(404).json({ error: "Session not found" });

    session.endTime = Date.now();

    // Get questions from test or legacy
    const testQuestions = session.testId ? tests[session.testId].questions : questions;
    const config = session.testId ? tests[session.testId] : defaultConfig;

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let score = 0;

    testQuestions.forEach(q => {
        const qId = q.question_id;
        if (session.skipped.includes(qId) || !session.answers[qId]) {
            skippedCount++;
        } else {
            const userAnswer = session.answers[qId];
            if (userAnswer === q.correct_answer) {
                correctCount++;
                score += config.correctMark;
            } else {
                wrongCount++;
                score += config.wrongMark;
            }
        }
    });

    session.result = {
        totalQuestions: testQuestions.length,
        correctCount,
        wrongCount,
        skippedCount,
        score,
        totalMarks: testQuestions.length * config.correctMark
    };

    res.json({ message: "Test submitted", result: session.result });
};

exports.getResult = (req, res) => {
    const { sessionId } = req.params;
    const session = sessions[sessionId];
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (!session.endTime) return res.status(400).json({ error: "Test not yet submitted" });

    const testQuestions = session.testId ? tests[session.testId].questions : questions;

    const detailedReview = testQuestions.map(q => ({
        questionId: q.question_id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        userAnswer: session.answers[q.question_id] || null,
        status: session.answers[q.question_id]
            ? (session.answers[q.question_id] === q.correct_answer ? 'correct' : 'wrong')
            : 'skipped'
    }));

    res.json({
        summary: session.result,
        detailedReview
    });
};

exports.setConfig = (req, res) => {
    const { timerMinutes, correctMark, wrongMark } = req.body;

    if (timerMinutes) defaultConfig.timerMinutes = timerMinutes;
    if (correctMark !== undefined) defaultConfig.correctMark = correctMark;
    if (wrongMark !== undefined) defaultConfig.wrongMark = wrongMark;

    res.json({
        message: "Configuration updated successfully",
        config: defaultConfig
    });
};

// LEGACY: Get info (backward compatibility)
exports.getInfo = (req, res) => {
    res.json({
        questionCount: questions.length,
        timerMinutes: defaultConfig.timerMinutes,
        correctMark: defaultConfig.correctMark,
        wrongMark: defaultConfig.wrongMark
    });
};

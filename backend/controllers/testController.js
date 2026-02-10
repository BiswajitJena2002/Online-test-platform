const { v4: uuidv4 } = require('uuid');
const SavedTest = require('../models/SavedTest');

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
    const { testName, timerMinutes, correctMark, wrongMark, questions, questionsOdia, images, sections, isSubjectWise } = req.body;

    if (!testName || (!questions && !sections)) {
        return res.status(400).json({ error: "Test name and questions/sections are required" });
    }

    // Validate subject-wise test
    if (isSubjectWise && sections) {
        if (!Array.isArray(sections) || sections.length === 0) {
            return res.status(400).json({ error: "Sections array is required for subject-wise tests" });
        }
    }

    // Validate flat test
    if (!isSubjectWise && questions) {
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: "Questions array is required" });
        }
    }

    // If images are provided, map them to the corresponding questions
    if (images && typeof images === 'object' && !isSubjectWise) {
        Object.keys(images).forEach(index => {
            if (questions[index]) {
                questions[index].image = images[index];
            }
            if (questionsOdia && questionsOdia[index]) {
                questionsOdia[index].image = images[index];
            }
        });
    }

    const testId = uuidv4().split('-')[0]; // Short ID like "a3f5b2c1"

    tests[testId] = {
        testId,
        testName,
        timerMinutes: timerMinutes || 30,
        correctMark: correctMark !== undefined ? correctMark : 1,
        wrongMark: wrongMark !== undefined ? wrongMark : -0.25,
        questions: questions || [],
        questionsOdia: questionsOdia || null,
        sections: sections || [],
        isSubjectWise: isSubjectWise || false,
        createdAt: Date.now()
    };

    const questionCount = isSubjectWise
        ? sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0)
        : questions.length;

    console.log(`Created test "${testName}" with ID: ${testId} (${isSubjectWise ? 'Subject-wise' : 'Flat'})`);
    res.json({
        message: "Test created successfully",
        testId,
        testName,
        questionCount
    });
};

// GET TEST INFO (for candidate landing page)
exports.getTestInfo = (req, res) => {
    const { testId } = req.params;
    const test = tests[testId];

    if (!test) {
        return res.status(404).json({ error: "Test not found" });
    }

    const questionCount = test.isSubjectWise
        ? test.sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0)
        : test.questions.length;

    const response = {
        testId: test.testId,
        testName: test.testName,
        questionCount,
        timerMinutes: test.timerMinutes,
        correctMark: test.correctMark,
        wrongMark: test.wrongMark,
        isBilingual: !!test.questionsOdia,
        isSubjectWise: test.isSubjectWise || false
    };

    if (test.isSubjectWise) {
        response.sections = test.sections.map(s => ({
            subject_id: s.subject_id,
            subject_name: s.subject_name,
            questionCount: s.questions?.length || 0
        }));
    }

    res.json(response);
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
        skipped: [],
        result: null,
        isSubjectWise: test.isSubjectWise || false
    };

    let response = {
        sessionId,
        testName: test.testName,
        timerMinutes: test.timerMinutes,
        correctMark: test.correctMark,
        wrongMark: test.wrongMark,
        isSubjectWise: test.isSubjectWise || false
    };

    if (test.isSubjectWise) {
        // Sanitize sections
        const sanitizedSections = test.sections.map(section => ({
            subject_id: section.subject_id,
            subject_name: section.subject_name,
            questions: section.questions.map(({ correct_answer, ...rest }) => rest),
            questionsOdia: section.questionsOdia
                ? section.questionsOdia.map(({ correct_answer, ...rest }) => rest)
                : null
        }));
        response.sections = sanitizedSections;
    } else {
        // Return sanitized questions (without correct answers)
        const sanitizedQuestions = test.questions.map(({ correct_answer, ...rest }) => rest);
        const sanitizedQuestionsOdia = test.questionsOdia
            ? test.questionsOdia.map(({ correct_answer, ...rest }) => rest)
            : null;
        response.questions = sanitizedQuestions;
        response.questionsOdia = sanitizedQuestionsOdia;
    }

    res.json(response);
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

    // For legacy, there's no questionsOdia, so it will be null
    const sanitizedQuestionsOdia = null;

    res.json({
        sessionId,
        questions: sanitizedQuestions,
        questionsOdia: sanitizedQuestionsOdia, // Added for consistency, will be null
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

    const test = session.testId ? tests[session.testId] : null;
    const config = test || defaultConfig;

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let score = 0;
    let subjectWiseResults = [];

    // Get all questions (flatten if subject-wise)
    let allQuestions = [];
    if (test && test.isSubjectWise) {
        // Process subject-wise
        test.sections.forEach(section => {
            let sectionCorrect = 0;
            let sectionWrong = 0;
            let sectionSkipped = 0;
            let sectionScore = 0;

            section.questions.forEach(q => {
                const qId = q.question_id;
                if (session.skipped.includes(qId) || !session.answers[qId]) {
                    skippedCount++;
                    sectionSkipped++;
                } else {
                    const userAnswer = session.answers[qId];
                    if (userAnswer === q.correct_answer) {
                        correctCount++;
                        sectionCorrect++;
                        score += config.correctMark;
                        sectionScore += config.correctMark;
                    } else {
                        wrongCount++;
                        sectionWrong++;
                        score += config.wrongMark;
                        sectionScore += config.wrongMark;
                    }
                }
            });

            subjectWiseResults.push({
                subject_id: section.subject_id,
                subject_name: section.subject_name,
                totalQuestions: section.questions.length,
                correctCount: sectionCorrect,
                wrongCount: sectionWrong,
                skippedCount: sectionSkipped,
                score: sectionScore,
                totalMarks: section.questions.length * config.correctMark
            });

            allQuestions = allQuestions.concat(section.questions);
        });
    } else {
        // Process flat questions
        const testQuestions = test ? test.questions : questions;
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
        allQuestions = testQuestions;
    }

    session.result = {
        totalQuestions: allQuestions.length,
        correctCount,
        wrongCount,
        skippedCount,
        score,
        totalMarks: allQuestions.length * config.correctMark,
        isSubjectWise: test?.isSubjectWise || false,
        subjectWiseResults: test?.isSubjectWise ? subjectWiseResults : null
    };

    res.json({ message: "Test submitted", result: session.result });
};

exports.getResult = (req, res) => {
    const { sessionId } = req.params;
    const session = sessions[sessionId];
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (!session.endTime) return res.status(400).json({ error: "Test not yet submitted" });

    const test = session.testId ? tests[session.testId] : null;
    let detailedReview = [];
    let detailedReviewBySubject = [];

    if (test && test.isSubjectWise) {
        // Group by subject
        test.sections.forEach(section => {
            const sectionReview = section.questions.map(q => ({
                questionId: q.question_id,
                question: q.question,
                options: q.options,
                correctAnswer: q.correct_answer,
                userAnswer: session.answers[q.question_id] || null,
                status: session.answers[q.question_id]
                    ? (session.answers[q.question_id] === q.correct_answer ? 'correct' : 'wrong')
                    : 'skipped'
            }));

            detailedReviewBySubject.push({
                subject_id: section.subject_id,
                subject_name: section.subject_name,
                questions: sectionReview
            });

            detailedReview = detailedReview.concat(sectionReview);
        });
    } else {
        const testQuestions = test ? test.questions : questions;
        detailedReview = testQuestions.map(q => ({
            questionId: q.question_id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correct_answer,
            userAnswer: session.answers[q.question_id] || null,
            status: session.answers[q.question_id]
                ? (session.answers[q.question_id] === q.correct_answer ? 'correct' : 'wrong')
                : 'skipped'
        }));
    }

    const response = {
        testId: session.testId,
        summary: session.result,
        detailedReview,
        isSubjectWise: test?.isSubjectWise || false
    };

    if (test?.isSubjectWise) {
        response.detailedReviewBySubject = detailedReviewBySubject;
    }

    res.json(response);
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

// ========== SAVED TESTS FEATURE ==========

// SAVE TEST TEMPLATE (with private code)
exports.saveTest = async (req, res) => {
    try {
        const { testId, privateCode } = req.body;

        // Validate private code
        const PRIVATE_CODE = process.env.SAVE_TEST_CODE || 'Jitu@2002';
        if (privateCode !== PRIVATE_CODE) {
            return res.status(403).json({ error: 'Invalid private code' });
        }

        // Find the test
        const test = tests[testId];
        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        // Create saved test in database
        const savedTest = await SavedTest.create({
            testId: testId,
            testName: test.testName,
            config: {
                timerMinutes: test.timerMinutes,
                correctMark: test.correctMark,
                wrongMark: test.wrongMark
            },
            questions: test.questions || [],
            images: test.images || {},
            isDualLanguage: !!test.questionsOdia,
            questionsOdia: test.questionsOdia || [],
            isSubjectWise: test.isSubjectWise || false,
            sections: test.sections || []
        });

        res.json({
            success: true,
            message: 'Test saved successfully',
            savedTestId: savedTest._id
        });
    } catch (error) {
        console.error('Error saving test:', error);
        res.status(500).json({ error: 'Failed to save test' });
    }
};

// GET ALL SAVED TESTS
exports.getSavedTests = async (req, res) => {
    try {
        const savedTests = await SavedTest.find()
            .select('_id testName savedAt questions sections isSubjectWise isDualLanguage')
            .sort({ savedAt: -1 });

        const testsList = savedTests.map(test => {
            const questionCount = test.isSubjectWise
                ? test.sections.reduce((sum, section) => sum + (section.questions?.length || 0), 0)
                : test.questions?.length || 0;

            return {
                id: test._id,
                testName: test.testName,
                savedDate: test.savedAt,
                questionCount,
                isBilingual: test.isDualLanguage,
                isSubjectWise: test.isSubjectWise || false
            };
        });

        res.json({
            savedTests: testsList
        });
    } catch (error) {
        console.error('Error fetching saved tests:', error);
        res.status(500).json({ error: 'Failed to fetch saved tests' });
    }
};

// GET SPECIFIC SAVED TEST
exports.getSavedTest = async (req, res) => {
    try {
        const { id } = req.params;

        const savedTest = await SavedTest.findById(id);

        if (!savedTest) {
            return res.status(404).json({ error: 'Saved test not found' });
        }

        // Format response to match frontend expectations
        const response = {
            id: savedTest._id,
            testName: savedTest.testName,
            savedDate: savedTest.savedAt,
            questions: savedTest.questions || [],
            questionsOdia: savedTest.questionsOdia || [],
            images: savedTest.images || {},
            settings: savedTest.config,
            isSubjectWise: savedTest.isSubjectWise || false,
            sections: savedTest.sections || []
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching saved test:', error);
        res.status(500).json({ error: 'Failed to fetch saved test' });
    }
};



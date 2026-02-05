
// SAVE TEST TEMPLATE (with private code)
exports.saveTest = (req, res) => {
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

    // Create saved test object
    const savedTestId = uuidv4();
    const savedTest = {
        id: savedTestId,
        testName: test.testName,
        savedDate: new Date().toISOString(),
        questions: test.questions,
        questionsOdia: test.questionsOdia || null,
        images: test.images || {},
        settings: {
            timerMinutes: test.timerMinutes,
            correctMark: test.correctMark,
            wrongMark: test.wrongMark
        }
    };

    savedTests.push(savedTest);

    res.json({
        success: true,
        message: 'Test saved successfully',
        savedTestId: savedTestId
    });
};

// GET ALL SAVED TESTS
exports.getSavedTests = (req, res) => {
    const testsList = savedTests.map(test => ({
        id: test.id,
        testName: test.testName,
        savedDate: test.savedDate,
        questionCount: test.questions.length,
        isBilingual: !!test.questionsOdia
    }));

    res.json({
        savedTests: testsList
    });
};

// GET SPECIFIC SAVED TEST
exports.getSavedTest = (req, res) => {
    const { id } = req.params;

    const savedTest = savedTests.find(test => test.id === id);

    if (!savedTest) {
        return res.status(404).json({ error: 'Saved test not found' });
    }

    res.json(savedTest);
};

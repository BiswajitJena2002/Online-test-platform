const mongoose = require('mongoose');

const SavedTestSchema = new mongoose.Schema({
    testId: {
        type: String,
        required: true
    },
    testName: {
        type: String,
        required: true
    },
    savedAt: {
        type: Date,
        default: Date.now
    },
    config: {
        timerMinutes: Number,
        correctMark: Number,
        wrongMark: Number
    },
    questions: [{
        question_id: String,
        question: String,
        options: [String],
        correct_answer: String
    }],
    images: {
        type: Map,
        of: String
    },
    isDualLanguage: {
        type: Boolean,
        default: false
    },
    questionsOdia: [{
        question_id: String,
        question: String,
        options: [String],
        correct_answer: String
    }]
});

module.exports = mongoose.model('SavedTest', SavedTestSchema);

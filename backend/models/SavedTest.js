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
    questions: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    images: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isDualLanguage: {
        type: Boolean,
        default: false
    },
    questionsOdia: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    }
});

module.exports = mongoose.model('SavedTest', SavedTestSchema);


const mongoose = require('mongoose');

// all the things to save

const quizCurrentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        required: true,
        default: 0
    }
}, { collection: 'currentQuiz'} );

// export so we can use it
// AutoReact is the name of the collection in MongoDB

// ✅ Prevent OverwriteModelError
module.exports = mongoose.models.CurrentQuiz || mongoose.model('CurrentQuiz', quizCurrentSchema);
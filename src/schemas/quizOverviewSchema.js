const mongoose = require('mongoose');

// all the things to save

const quizOverviewSchema = new mongoose.Schema({
    hostId: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: false,
        default: 0
    },
    first: {
        type: String,
        required: false
    },
    second: {
        type: String,
        required: false
    },
    third: {
        type: String,
        required: false
    },
    fourth: {
        type: String,
        required: false
    },
    fifth: {
        type: String,
        required: false
    }
});

// export so we can use it
// AutoReact is the name of the collection in MongoDB
module.exports = mongoose.model('Overview', quizOverviewSchema);
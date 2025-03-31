const mongoose = require('mongoose');

// all the things to save

const quizPlayersSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: false
    }
});

// export so we can use it
// AutoReact is the name of the collection in MongoDB
module.exports = mongoose.model('Players', quizPlayersSchema);
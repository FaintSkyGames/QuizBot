const mongoose = require('mongoose');

// all the things to save

const autoReactorSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,

    },
    channelId: {
        type: String,
        required: true
    },
    emoji: {
        type: String,
        required: true
    }
});

// export so we can use it
// AutoReact is the name of the collection in MongoDB
module.exports = mongoose.model('AutoReact', autoReactorSchema);
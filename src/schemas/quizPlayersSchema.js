const mongoose = require("mongoose");

// all the things to save

const quizPlayersSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false,
  },
  avatar: {
    type: String,
    default: "", // Optional: store Discord avatar hash or full URL
  },
  totalPoints: {
    type: Number,
    required: true,
    default: 0,
  },
});

// export so we can use it
module.exports =
  mongoose.models.Players || mongoose.model("Players", quizPlayersSchema);

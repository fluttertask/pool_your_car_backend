const mongoose = require("mongoose");

//Chat Schema

const Chat = mongoose.model("Chat", {
  senderId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  recieverId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
});

module.exports = { Chat };

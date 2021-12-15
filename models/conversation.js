const mongoose = require("mongoose");

//Conversation Schema

const Conversation = mongoose.model("Conversation", {
  firstUserId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  secondUserId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  message: [
    {
      senderId: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Number,
        required: true,
      },
    },
  ],
  // date: {
  //   type: String,
  //   required: true,
  // },
  // time: {
  //   type: String,
  //   required: true,
  // },
});

module.exports = { Conversation };

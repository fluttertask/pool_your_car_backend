const mongoose = require("mongoose");

//Chat Schema

const Inbox = mongoose.model("Inbox", {
  conversation: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Conversation",
      required: true,
    },
  ],
});

module.exports = { Inbox };

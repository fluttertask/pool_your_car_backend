const mongoose = require("mongoose");

//Wallet Schema

const Wallet = mongoose.model("Wallet", {
  credit: {
    type: Number,
    required: true,
    default: 0,
  },

  userID: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
  },
});

module.exports = { Wallet };

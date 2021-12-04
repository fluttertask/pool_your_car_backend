const mongoose = require("mongoose");

//Wallet Schema

const Wallet = mongoose.model("Wallet", {
  credit: {
    type: Number,
    required: true,
    default: 0,
  },

  uniqueID: {
    type: Number,
    require: true,
  },

  userID: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
  },

  balance: {
    type: Number,
    default: 0,
  },

});

module.exports = { Wallet };

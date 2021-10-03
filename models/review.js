const mongoose = require("mongoose");

//Review Schema

const Review = mongoose.model("Review", {
  passengerId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  driverId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
});

module.exports = { Review };

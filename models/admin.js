const mongoose = require("mongoose");

//Admin Schema

const Admin = mongoose.model("Admin", {
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdOn: {
    type: String,
  },
  lastLogin: {
    type: String,
  },
  totalAmount: {
    type: Number,
    default: 0,
  }
});

module.exports = { Admin };

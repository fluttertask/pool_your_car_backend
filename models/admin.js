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
  createOn: {
    type: String,
  },
  lastLogin: {
    type: String,
  }
});

module.exports = { Admin };

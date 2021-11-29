const mongoose = require("mongoose");

//User Schema

const User = mongoose.model("User", {
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  phonenumber: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    lowercase: true,
  },
  emailverified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
  },
  confirmpassword: {
    type: String,
    required: true,
  },
  createdat: {
    type: Date,
    required: true,
  },
  profile_image_url: {
    type: String,
  },
  notifications: [
    {
      type: {
        type: String,
      },

      senderID: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },

      ride: {
        type: mongoose.Schema.ObjectId,
        ref: "Ride",
      },

      from: {
        type: String
      },

      to: {
        type: String
      },

      name: {
        type: String
      },

      message: {
        type: String
      },
      
      read: {
        type: Boolean
      }
    },
  ],
  walletID: {
    type: mongoose.Schema.ObjectId,
    ref: "Wallet",
  },
  blocked: {
    type: String,
    default: 'unblocked'
  },
  offeredride: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Ride",
    },
  ],
  bookedride: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Ride",
    },
  ],
  pastofferedride: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Ride",
    },
  ],
  pastbookedride: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Ride",
    },
  ],
  
});

module.exports = { User };

const mongoose = require("mongoose");

//Ride Schema

const Ride = mongoose.model("Ride", {
  pickuplocation: {
    type: String,
    required: true,
  },
  pickuplocation_Lat: {
    type: String,
    required: true,
  },
  pickuplocation_Lon: {
    type: String,
    required: true,
  },
  droplocation: {
    type: String,
    required: true,
  },
  droplocation_Lat: {
    type: String,
    required: true,
  },
  droplocation_Lon: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
    // default: Date.now(),
  },
  time: {
    type: String,
    required: true,
  },
  offeredseats: {
    type: Number,
    required: true,
  },
  availableseats: {
    type: Number,
    required: true,
  },
  requestedPassengers: [
    {
      type: mongoose.Schema.ObjectId,
      seatsbooked: Number,
      ref: "User",
    },
  ],
  passengers: [
    {
      type: mongoose.Schema.ObjectId,
      seatsbooked: Number,
      ref: "User",
    },
  ],

  cartype: {
    type: String,
    required: true,
  },
  vehicle_registration_number: {
    type: String,
    required: true,
  },

  optional_details: {
    type: String,
  },
  discount: {
    type: Number,
    default: 0,
    required: true,
  },
  ridefare: {
    type: Number,
    required: true,
  },
  ride_type: {
    type: String,
    required: true,
  },

  driverId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  passengersID: [
    {
      type: mongoose.Schema.ObjectId,
      seatsbooked: Number,
      ref: "User",
    },
  ],
});

module.exports = { Ride };

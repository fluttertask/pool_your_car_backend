const mongoose = require("mongoose");

//Wallet Schema

const Payment = mongoose.model("Payment", {
    from: {
        type: mongoose.Schema.ObjectId,
        ref: "wallet",
    },
    
    to: {
        type: mongoose.Schema.ObjectId,
        ref: "wallet",
    },

    ammount: {
        type: Number,
    }

});

module.exports = { Payment };

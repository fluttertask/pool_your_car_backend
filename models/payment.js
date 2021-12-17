const mongoose = require("mongoose");

//Wallet Schema

const Payment = mongoose.model("Payment", {
    fromname: {
        type: String
    },

    toname: {
        type: String
    },
    
    from: {
        type: String,
    },

    to: {
        type: String,
    },

    fromid: {
        type: mongoose.Schema.ObjectId,
        ref: "wallet",
    },
    
    toid: {
        type: mongoose.Schema.ObjectId,
        ref: "wallet",
    },

    date: {
        type: Date,
    },

    amount: {
        type: Number,
    }

});

module.exports = { Payment };

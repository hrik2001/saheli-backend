const mongoose = require("mongoose")

const notificationSchema = mongoose.Schema({
    issuer: {
        type: String,
        ref: "user",
        required: true
    },
    issuee: {
        type: String,
        required: true
    },
    seen: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model("notification" , notificationSchema)

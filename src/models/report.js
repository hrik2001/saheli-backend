const mongoose = require("mongoose")

const reportSchema = mongoose.Schema({
    issuer:{
        type: String,
        required: true
    },
    issuee:{
        type: String,
        required: true
    },
    complaint:{
        type: String,
        required: true
    }
}, {timestamps : true})

module.exports = mongoose.model("report" , reportSchema)

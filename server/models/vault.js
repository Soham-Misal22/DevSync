const mongoose = require("mongoose");
const project = require("../models/project");
const user = require("../models/user");
const vaultSchema = new mongoose.Schema({
    keyName: {
        type: String,
        required: true
    },
    secretValue: {
        type: String,
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

module.exports = mongoose.model("Vault", vaultSchema);

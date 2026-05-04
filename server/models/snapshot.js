const mongoose = require("mongoose");

const snapshotSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    fileName: {
        type: String,
        default: "index.js"
    },
    code: {
        type: String,
        default: ""
    },
    message: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

snapshotSchema.set("timestamps", true);

module.exports = mongoose.model("Snapshot", snapshotSchema);

const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['api_doc', 'code'],
        default: 'api_doc'
    },
    language: {
        type: String,
        default: 'javascript'
    },
    title: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH", ""],
        default: ""
    },
    url: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        required: true
    },
    body: {
        type: String,
        default: ""
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Snippet', snippetSchema);
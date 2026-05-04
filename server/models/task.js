const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    status:{
        type: String,
        enum: ['To-Do', 'In Progress', 'Review', 'Done'],
        default: "To-Do"
    },
    priority:{
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    labels: {
        type: [String],
        default: []
    },
    order: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ["Task", "Bug", "Epic"],
        default: "Task"
    },
    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    assignedTo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    verification: {
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        prLink: { type: String },
        comments: { type: String }
    }
})

taskSchema.set("timestamps", true);

module.exports = mongoose.model("Task", taskSchema);
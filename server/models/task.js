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
    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },
    assignedTo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
})

taskSchema.set("timestamps", true);

module.exports = mongoose.model("Task", taskSchema);
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    description:{
        type:String,
        required: true
    },
    admin:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: []
    }

    }
)

projectSchema.set("timestamps", true);

module.exports = mongoose.model("Project", projectSchema);

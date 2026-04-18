const task = require("../models/task");
const project = require("../models/project");
const user = require("../models/user");


const createTask = async (req, res) => {
    const { projectId } = req.params;
    try {
        const { title, description, priority, assignedTo } = req.body;
        if (!title || !description || !priority || !assignedTo) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const taskExists = await task.findOne({ title, project: projectId });
        if (taskExists) {
            return res.status(400).json({ message: "Task already exists" });
        }

        const projectExists = await project.findById(projectId);
        if (!projectExists) {
            return res.status(400).json({ message: "Project not found" });
        }

        const userExists = await user.findById(assignedTo);
        if (!userExists) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!projectExists.members.includes(userExists._id)) {
            return res.status(400).json({ message: "User not a member of this project" });
        }

        if (projectExists.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied. Only the Admin can create tasks." });
        }

        const isAssigneeAMember = projectExists.members.includes(assignedTo);
        if (!isAssigneeAMember) {
            return res.status(400).json({ message: "The assigned user is not a member of this project." });
        }

        const newTask = await task.create({
            title,
            description,
            priority,
            project: projectId,
            assignedTo
        })
        return res.status(201).json({ message: "Task created successfully", newTask })

    } catch (error) {
        next(error);
    }
}


const getProjectTasks = async (req, res) => {
    const { projectId } = req.params;
    try {
        const projectExists = await project.findById(projectId);
        if (!projectExists) {
            return res.status(400).json({ message: "Project not found" });
        }

        const userMember = projectExists.members.includes(req.user._id);
        if (!userMember) {
            return res.status(400).json({ message: "User not a member of this project" });

        }

        const tasks = await task.find({ project: projectId }).populate("assignedTo", "name email");
        return res.status(200).json({ message: "Tasks fetched successfully", tasks })

    } catch (error) {
        next(error);
    }
}


const updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    if (!["To-Do", "In Progress", "Review", "Done"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const taskExists = await task.findById(taskId);
        if (!taskExists) {
            return res.status(400).json({ message: "Task not found" });
        }

        const projectExists = await project.findById(taskExists.project);
        if (!projectExists) {
            return res.status(400).json({ message: "Project not found" });
        }

        if (!projectExists.members.includes(req.user._id)) {
            return res.status(400).json({ message: "User not a member of this project" });
        }

        if (taskExists.assignedTo.toString() !== req.user._id.toString() && projectExists.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "User not authorized to update this task" });
        }

        taskExists.status = status;
        await taskExists.save();
        return res.status(200).json({ message: "Task status updated successfully", taskExists });


    } catch (error) {
        next(error);
    }
}


const deleteTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const taskExists = await task.findById(taskId);
        if (!taskExists) {
            return res.status(404).json({ message: "Task not found" });
        }

        const projectExists = await project.findById(taskExists.project);
        if (!projectExists) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Only the assigned user or the project Admin can delete
        if (taskExists.assignedTo.toString() !== req.user._id.toString() && projectExists.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this task" });
        }

        await task.findByIdAndDelete(taskId);
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        next(error);
    }
};
const updateTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { title, description, priority, assignedTo } = req.body;

        const taskExists = await task.findById(taskId);
        if (!taskExists) {
            return res.status(404).json({ message: "Task not found" });
        }

        const projectExists = await project.findById(taskExists.project);
        if (!projectExists) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (!projectExists.members.includes(req.user._id)) {
            return res.status(400).json({ message: "User not a member of this project" });
        }

        if (taskExists.assignedTo.toString() !== req.user._id.toString() && projectExists.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this task" });
        }

        if (assignedTo && assignedTo !== taskExists.assignedTo.toString()) {
            const isAssigneeAMember = projectExists.members.includes(assignedTo);
            if (!isAssigneeAMember) {
                return res.status(400).json({ message: "The assigned user is not a member of this project." });
            }
            taskExists.assignedTo = assignedTo;
        }

        if (title) taskExists.title = title;
        if (description) taskExists.description = description;
        if (priority) taskExists.priority = priority;

        await taskExists.save();
        res.status(200).json({ message: "Task updated successfully", task: taskExists });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTask, getProjectTasks, updateTaskStatus, deleteTask, updateTask };

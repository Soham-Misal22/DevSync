const task = require("../models/task");
const project = require("../models/project");
const user = require("../models/user");

const createTask = async (req, res, next) => {
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
        });

        const io = req.app.get('io');
        if (io) io.to(projectId.toString()).emit('tasksUpdated');

        return res.status(201).json({ message: "Task created successfully", newTask });
    } catch (error) {
        next(error);
    }
}

const getProjectTasks = async (req, res, next) => {
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
        return res.status(200).json({ message: "Tasks fetched successfully", tasks });
    } catch (error) {
        next(error);
    }
}

const updateTaskStatus = async (req, res, next) => {
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

        const io = req.app.get('io');
        if (io) io.to(taskExists.project.toString()).emit('tasksUpdated');

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

        if (taskExists.assignedTo.toString() !== req.user._id.toString() && projectExists.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this task" });
        }

        await task.findByIdAndDelete(taskId);

        const io = req.app.get('io');
        if (io) io.to(taskExists.project.toString()).emit('tasksUpdated');

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

        const io = req.app.get('io');
        if (io) io.to(taskExists.project.toString()).emit('tasksUpdated');

        res.status(200).json({ message: "Task updated successfully", task: taskExists });
    } catch (error) {
        next(error);
    }
};

const reorderTasks = async (req, res, next) => {
    try {
        const { tasks } = req.body; 
        if (!tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ message: "Tasks array is required" });
        }

        const tasksToUpdate = await task.find({ _id: { $in: tasks.map(t => t._id) } });
        
        for (const t of tasks) {
            if (t.status === 'Done') {
                const dbTask = tasksToUpdate.find(x => x._id.toString() === t._id);
                // Only enforce verification if the task is actively moving into Done from another column
                if (dbTask && dbTask.status !== 'Done') {
                    if (dbTask.verification?.status !== 'Approved') {
                        return res.status(400).json({ message: `Task "${dbTask.title}" cannot be moved to Done without Verification Approval.` });
                    }
                }
            }
        }

        const bulkOps = tasks.map(t => ({
            updateOne: {
                filter: { _id: t._id },
                update: { status: t.status, order: t.order }
            }
        }));

        await task.bulkWrite(bulkOps);

        if (tasks.length > 0) {
            const sampleTask = await task.findById(tasks[0]._id);
            if (sampleTask) {
                const io = req.app.get('io');
                if (io) io.to(sampleTask.project.toString()).emit('tasksUpdated');
            }
        }

        return res.status(200).json({ message: "Tasks reordered successfully" });
    } catch (error) {
        next(error);
    }
};

const verifyTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { status, prLink, comments } = req.body;

        const taskExists = await task.findById(taskId);
        if (!taskExists) return res.status(404).json({ message: "Task not found" });

        const projectExists = await project.findById(taskExists.project);
        if (!projectExists) return res.status(404).json({ message: "Project not found" });

        if (!projectExists.members.includes(req.user._id)) {
            return res.status(403).json({ message: "Not a project member" });
        }

        if (taskExists.assignedTo.toString() === req.user._id.toString() && projectExists.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You cannot verify your own task" });
        }

        taskExists.verification = {
            status: status || taskExists.verification?.status || 'Pending',
            verifiedBy: req.user._id,
            prLink: prLink !== undefined ? prLink : taskExists.verification?.prLink,
            comments: comments !== undefined ? comments : taskExists.verification?.comments
        };

        await taskExists.save();

        const io = req.app.get('io');
        if (io) io.to(taskExists.project.toString()).emit('tasksUpdated');

        return res.status(200).json({ message: "Verification updated", task: taskExists });
    } catch (err) {
        next(err);
    }
};

module.exports = { createTask, getProjectTasks, updateTaskStatus, deleteTask, updateTask, reorderTasks, verifyTask };

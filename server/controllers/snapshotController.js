const Snapshot = require("../models/snapshot");
const Project = require("../models/project");

const createSnapshot = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { code, message, fileName } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (!project.members.includes(req.user._id)) {
            return res.status(403).json({ message: "Not a member of this project" });
        }

        const snapshot = await Snapshot.create({
            project: projectId,
            fileName: fileName || 'index.js',
            code,
            message,
            createdBy: req.user._id
        });

        res.status(201).json(snapshot);
    } catch (err) {
        next(err);
    }
};

const getProjectSnapshots = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (!project.members.includes(req.user._id)) {
            return res.status(403).json({ message: "Not a member of this project" });
        }

        const snapshots = await Snapshot.find({ project: projectId })
            .populate("createdBy", "name email avatar")
            .sort({ createdAt: -1 });

        res.status(200).json(snapshots);
    } catch (err) {
        next(err);
    }
};

module.exports = { createSnapshot, getProjectSnapshots };

const snippet = require("../models/snippet");
const project = require("../models/project");
const user = require("../models/user");

const createSnippet = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, method, url, description, body, type = 'api_doc', language = 'javascript' } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        if (type === 'api_doc') {
            if (!method || !url) {
                return res.status(400).json({ message: "Method and URL are required for API Docs" });
            }
        } else if (type === 'code') {
            if (!body) {
                return res.status(400).json({ message: "Code body is required for Code Snippets" });
            }
        }

        const projectExists = await project.findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ message: "Project not found" });
        }

        const userMember = projectExists.members.includes(req.user._id);
        if (!userMember) {
            return res.status(403).json({ message: "User not a member of this project" });
        }

        const Snippet = await snippet.create({
            title, method, url, description, body, type, language,
            project: projectId, createdBy: req.user._id
        });
        return res.status(201).json({ message: "Snippet created successfully", Snippet });
    } catch (error) {
        next(error);
    }
}


const getProjectSnippets = async (req, res) => {
    try {
        const { projectId } = req.params;

        const projectExists = await project.findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ message: "Project not found" });
        }

        const userMember = projectExists.members.includes(req.user._id);
        if (!userMember) {
            return res.status(403).json({ message: "User not a member of this project" });
        }

        const snippets = await snippet.find({ project: projectId }).populate("createdBy", "name email").populate("project", "name");
        return res.status(200).json({ message: "Snippets fetched successfully", snippets });
    } catch (error) {
        next(error);
    }
}

const deleteSnippet = async (req, res, next) => {
    try {
        const { snippetId } = req.params;
        const targetSnippet = await snippet.findById(snippetId);

        if (!targetSnippet) {
            return res.status(404).json({ message: "Snippet not found" });
        }

        const projectExists = await project.findById(targetSnippet.project);

        if (!projectExists) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Only the creator or the project Admin can delete
        if (targetSnippet.createdBy.toString() !== req.user._id.toString() && projectExists.admin.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this snippet" });
        }

        await snippet.findByIdAndDelete(snippetId);
        res.status(200).json({ message: "Snippet deleted successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = { createSnippet, getProjectSnippets, deleteSnippet }
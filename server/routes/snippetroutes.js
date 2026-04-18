const express = require("express");
const { createSnippet, getProjectSnippets, deleteSnippet } = require("../controllers/snippetController");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/:projectId/create", protect, createSnippet);
router.get("/:projectId", protect, getProjectSnippets);
router.delete("/:snippetId", protect, deleteSnippet);

module.exports = router;
const express = require("express");
const { explainSnippet, generateTasks } = require("../controllers/aiController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/explain", protect, explainSnippet);
router.post("/generate-tasks", protect, generateTasks);

module.exports = router;

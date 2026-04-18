const express = require("express");
const { createVaultItem, getVaultItems } = require("../controllers/createVaultItemController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/:projectId/create", protect, createVaultItem);
router.get("/:projectId", protect, getVaultItems);

module.exports = router;
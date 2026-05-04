const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createSnapshot, getProjectSnapshots } = require('../controllers/snapshotController');

router.post('/:projectId', protect, createSnapshot);
router.get('/:projectId', protect, getProjectSnapshots);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createTask, getProjectTasks, updateTaskStatus, deleteTask, updateTask, reorderTasks, verifyTask } = require('../controllers/taskController');

router.post('/create/:projectId', protect, createTask);
router.get('/:projectId', protect, getProjectTasks);
router.patch('/reorder', protect, reorderTasks);
router.patch('/:taskId', protect, updateTask);
router.patch('/:taskId/status', protect, updateTaskStatus);
router.post('/:taskId/verify', protect, verifyTask);
router.delete('/:taskId', protect, deleteTask);

module.exports = router;

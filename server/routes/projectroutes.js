const express = require('express');
const router = express.Router();
const {protect} = require('../middlewares/authMiddleware');
const {createProject, addMember, getAllProjects, getprojectDetails} = require('../controllers/projectController');

router.get('/', protect, getAllProjects);
router.get('/:projectId', protect,getprojectDetails )
router.post('/create', protect, createProject);
router.post('/:projectId/add-member', protect, addMember);


module.exports = router;
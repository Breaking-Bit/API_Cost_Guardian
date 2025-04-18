const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const projectMiddleware = require('../middleware/projectMiddleware');

router.use(authMiddleware);

router.post('/', projectController.createProject);
router.get('/', projectController.getCompanyProjects);
router.get('/:project_id', projectMiddleware.validateProjectAccess, projectController.getProjectDetails);
router.put('/:project_id', projectMiddleware.validateProjectAccess, projectController.updateProject);

module.exports = router;
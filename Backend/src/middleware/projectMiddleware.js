const Project = require('../models/Project');
const logger = require('../utils/logger');

const projectMiddleware = {
    validateProjectAccess: async (req, res, next) => {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'] || req.params.project_id;

            if (!project_id) {
                return res.status(400).json({ error: 'Project ID is required' });
            }

            const project = await Project.findOne({
                _id: project_id,
                company: company_id
            });

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            req.project = project;
            next();
        } catch (error) {
            logger.error('Project Middleware Error:', error);
            res.status(500).json({ error: 'Failed to validate project access' });
        }
    }
};

module.exports = projectMiddleware;
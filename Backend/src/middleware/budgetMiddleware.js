const Budget = require('../models/Budget');
const logger = require('../utils/logger');

const budgetMiddleware = {
    validateBudgetData: (req, res, next) => {
        if (req.method === 'POST') {
            const { budget_amount, budget_period, service_name } = req.body;

            if (!budget_amount || !budget_period || !service_name) {
                return res.status(400).json({ 
                    error: 'Missing required budget data',
                    required: ['budget_amount', 'budget_period', 'service_name']
                });
            }

            if (budget_amount <= 0) {
                return res.status(400).json({ error: 'Budget amount must be greater than 0' });
            }
        } else if (req.method === 'PUT') {
            const { budget_amount, alert_threshold } = req.body;

            if (Object.keys(req.body).length === 0) {
                return res.status(400).json({ error: 'No update data provided' });
            }

            if (budget_amount !== undefined && budget_amount <= 0) {
                return res.status(400).json({ error: 'Budget amount must be greater than 0' });
            }

            if (alert_threshold !== undefined && (alert_threshold < 0 || alert_threshold > 100)) {
                return res.status(400).json({ error: 'Alert threshold must be between 0 and 100' });
            }
        }

        next();
    },

    checkDuplicateBudget: async (req, res, next) => {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const { service_name } = req.body;

            const existingBudget = await Budget.findOne({
                company: company_id,
                project: project_id,
                service_name,
                budget_status: 'active'
            });

            if (existingBudget) {
                return res.status(400).json({ error: 'Active budget already exists for this service' });
            }

            next();
        } catch (error) {
            logger.error('Budget Middleware Error:', error);
            res.status(500).json({ error: 'Failed to check duplicate budget' });
        }
    }
};

module.exports = budgetMiddleware;
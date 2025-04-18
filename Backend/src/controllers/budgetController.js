const Budget = require('../models/Budget');
const CostData = require('../models/CostData');
const logger = require('../utils/logger');
const { DEFAULT_VALUES } = require('../config/constants');

class BudgetController {
    async createBudget(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const { service_name, budget_amount, budget_period, alert_threshold } = req.body;

            const budget = new Budget({
                company: company_id,
                project: project_id,
                service_name,
                budget_amount,
                budget_period,
                alert_threshold: alert_threshold || DEFAULT_VALUES.BUDGET_ALERT_THRESHOLD
            });

            await budget.save();
            res.status(201).json(budget);
        } catch (error) {
            logger.error('Create Budget Error:', error);
            res.status(500).json({ error: 'Failed to create budget' });
        }
    }

    async getBudgetByService(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const { service_name } = req.params;

            const budget = await Budget.findOne({
                company: company_id,
                project: project_id,
                service_name,
                budget_status: 'active'
            });

            if (!budget) {
                return res.status(404).json({ error: 'Budget not found' });
            }

            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const currentUsage = await CostData.aggregate([
                {
                    $match: {
                        company: company_id,
                        project: project_id,
                        service_name,
                        date: { $gte: monthStart }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total_cost: { $sum: '$cost' },
                        total_usage: { $sum: '$usage_quantity' }
                    }
                }
            ]);

            const usage = currentUsage[0] || { total_cost: 0, total_usage: 0 };
            const utilization = (usage.total_cost / budget.budget_amount) * 100;

            res.json({
                budget,
                current_usage: {
                    cost: usage.total_cost,
                    usage_quantity: usage.total_usage,
                    utilization_percentage: parseFloat(utilization.toFixed(2))
                }
            });
        } catch (error) {
            logger.error('Get Budget Error:', error);
            res.status(500).json({ error: 'Failed to fetch budget' });
        }
    }

    async updateBudget(req, res) {
        try {
            const { company_id } = req.user;
            const { budget_id } = req.params;
            const { budget_amount, alert_threshold } = req.body;

            const updates = {};
            if (budget_amount !== undefined) updates.budget_amount = budget_amount;
            if (alert_threshold !== undefined) updates.alert_threshold = alert_threshold;
            updates.updated_at = new Date();

            const budget = await Budget.findOneAndUpdate(
                {
                    _id: budget_id,
                    company: company_id
                },
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!budget) {
                return res.status(404).json({ error: 'Budget not found' });
            }

            res.json(budget);
        } catch (error) {
            logger.error('Update Budget Error:', error);
            res.status(500).json({ error: 'Failed to update budget' });
        }
    }

    async deactivateBudget(req, res) {
        try {
            const { company_id } = req.user;
            const { budget_id } = req.params;

            const budget = await Budget.findOneAndUpdate(
                {
                    _id: budget_id,
                    company: company_id
                },
                {
                    budget_status: 'inactive',
                    updated_at: new Date()
                },
                { new: true }
            );

            if (!budget) {
                return res.status(404).json({ error: 'Budget not found' });
            }

            res.json({ message: 'Budget deactivated successfully' });
        } catch (error) {
            logger.error('Deactivate Budget Error:', error);
            res.status(500).json({ error: 'Failed to deactivate budget' });
        }
    }

    async getProjectBudgets(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
    
            const budgets = await Budget.find({
                company: company_id,
                project: project_id
            }).sort({ created_at: -1 });
    
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
    
            const usageData = await CostData.aggregate([
                {
                    $match: {
                        company: company_id,
                        project: project_id,
                        date: { $gte: monthStart }
                    }
                },
                {
                    $group: {
                        _id: '$service_name',
                        total_cost: { $sum: '$cost' },
                        total_usage: { $sum: '$usage_quantity' }
                    }
                }
            ]);
    
            const budgetsWithUsage = budgets.map(budget => {
                const usage = usageData.find(u => u._id === budget.service_name) || 
                             { total_cost: 0, total_usage: 0 };
                const utilization = (usage.total_cost / budget.budget_amount) * 100;
    
                return {
                    ...budget.toObject(),
                    current_usage: {
                        cost: usage.total_cost,
                        usage_quantity: usage.total_usage,
                        utilization_percentage: parseFloat(utilization.toFixed(2))
                    }
                };
            });
    
            res.json(budgetsWithUsage);
        } catch (error) {
            logger.error('Get Project Budgets Error:', error);
            res.status(500).json({ error: 'Failed to fetch project budgets' });
        }
    }
}

module.exports = new BudgetController();
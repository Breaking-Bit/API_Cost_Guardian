const Alert = require('../models/Alert');
const CostData = require('../models/CostData');
const Budget = require('../models/Budget');
const Company = require('../models/Company'); // Add this import
const logger = require('../utils/logger');

class AlertController {
    async getActiveAlerts(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];

            const alerts = await Alert.find({
                company: company_id,
                project: project_id,
                status: 'active'
            }).sort({ created_at: -1 });

            res.json(alerts);
        } catch (error) {
            logger.error('Get Active Alerts Error:', error);
            res.status(500).json({ error: 'Failed to fetch alerts' });
        }
    }

    async createAlert(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const { service_name, alert_type, message, threshold } = req.body;

            // Validate required fields
            if (!service_name || !alert_type || !message || threshold === undefined) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    required: ['service_name', 'alert_type', 'message', 'threshold']
                });
            }

            // Validate threshold value
            if (typeof threshold !== 'number' || threshold <= 0) {
                return res.status(400).json({
                    error: 'Threshold must be a positive number'
                });
            }

            // Validate alert_type with correct enum values
            const validAlertTypes = ['budget_threshold', 'cost_spike', 'system'];
            if (!validAlertTypes.includes(alert_type)) {
                return res.status(400).json({
                    error: 'Invalid alert type',
                    valid_types: validAlertTypes
                });
            }

            const alert = new Alert({
                company: company_id,
                project: project_id,
                service_name,
                alert_type,
                message,
                threshold,
                status: 'active',
                created_at: new Date()
            });

            await alert.save();

            // Send email directly instead of using service
            const company = await Company.findById(company_id);
            if (company && company.email) {
                logger.info(`Alert email would be sent to ${company.email}`);
            }

            res.status(201).json(alert);
        } catch (error) {
            logger.error('Create Alert Error:', error);
            res.status(500).json({ error: 'Failed to create alert' });
        }
    }

    async resolveAlert(req, res) {
        try {
            const { company_id } = req.user;
            const { alert_id } = req.params;

            const alert = await Alert.findOneAndUpdate(
                { _id: alert_id, company: company_id },
                {
                    status: 'resolved',
                    resolved_at: new Date()
                },
                { new: true }
            );

            if (!alert) {
                return res.status(404).json({ error: 'Alert not found' });
            }

            res.json(alert);
        } catch (error) {
            logger.error('Resolve Alert Error:', error);
            res.status(500).json({ error: 'Failed to resolve alert' });
        }
    }

    async checkBudgetAlerts(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];

            const budgets = await Budget.find({
                company: company_id,
                project: project_id,
                budget_status: 'active'
            });

            const alerts = [];
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            for (const budget of budgets) {
                const usage = await CostData.aggregate([
                    {
                        $match: {
                            company: company_id,
                            project: project_id,
                            service_name: budget.service_name,
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

                const totalCost = usage[0]?.total_cost || 0;
                const utilizationPercentage = (totalCost / budget.budget_amount) * 100;

                // Check if there's an existing active alert for this budget
                const existingAlert = await Alert.findOne({
                    company: company_id,
                    project: project_id,
                    service_name: budget.service_name,
                    alert_type: 'budget_threshold',
                    status: 'active'
                });

                if (utilizationPercentage >= budget.alert_threshold && !existingAlert) {
                    const alert = new Alert({
                        company: company_id,
                        project: project_id,
                        service_name: budget.service_name,
                        alert_type: 'budget_threshold',
                        message: `WARNING: Budget utilization at ${utilizationPercentage.toFixed(2)}% for ${budget.service_name}`,
                        threshold: budget.alert_threshold,
                        current_value: utilizationPercentage,
                        status: 'active',
                        created_at: new Date()
                    });

                    await alert.save();
                    alerts.push(alert);
                }
            }

            res.json({
                alerts_generated: alerts.length,
                alerts
            });
        } catch (error) {
            logger.error('Check Budget Alerts Error:', error);
            res.status(500).json({ error: 'Failed to check budget alerts' });
        }
    }
}

module.exports = new AlertController();
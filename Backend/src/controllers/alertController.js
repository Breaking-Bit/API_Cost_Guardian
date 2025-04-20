const Alert = require('../models/Alert');
const CostData = require('../models/CostData');
const Budget = require('../models/Budget');
const Company = require('../models/Company');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer'); // Add this import

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

            // Get all active budgets
            const budgets = await Budget.find({
                company: company_id,
                project: project_id,
                budget_status: 'active'
            });

            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const alerts = [];

            for (const budget of budgets) {
                // Get current usage with proper MongoDB ObjectId conversion
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
                            total_cost: { $sum: '$cost' }
                        }
                    }
                ]);

                const totalCost = usage[0]?.total_cost || 0;
                const utilizationPercentage = (totalCost / budget.budget_amount) * 100;

                // Check for existing active alert
                const existingAlert = await Alert.findOne({
                    company: company_id,
                    project: project_id,
                    service_name: budget.service_name,
                    alert_type: 'budget_threshold',
                    status: 'active'
                });

                // Generate alert if threshold is exceeded and no active alert exists
                if (utilizationPercentage >= budget.alert_threshold && !existingAlert) {
                    const alert = new Alert({
                        company: company_id,
                        project: project_id,
                        service_name: budget.service_name,
                        alert_type: 'budget_threshold',
                        message: `${budget.service_name} usage has reached ${utilizationPercentage.toFixed(2)}% of monthly budget ($${totalCost.toFixed(2)}/$${budget.budget_amount})`,
                        threshold: budget.alert_threshold,
                        current_value: utilizationPercentage,
                        status: 'active',
                        created_at: new Date()
                    });

                    await alert.save();
                    alerts.push(alert);

                    // Send email notification
                    const company = await Company.findById(company_id);
                    if (company?.email) {
                        await this.sendAlertEmail(company.email, {
                            service: budget.service_name,
                            usage: utilizationPercentage.toFixed(2),
                            currentCost: totalCost.toFixed(2),
                            budget: budget.budget_amount,
                            threshold: budget.alert_threshold
                        });
                    }
                }
            }

            // Get all active alerts after generating new ones
            const allActiveAlerts = await Alert.find({
                company: company_id,
                project: project_id,
                status: 'active'
            }).sort({ created_at: -1 });

            res.json({
                alerts_generated: alerts.length,
                all_active_alerts: allActiveAlerts,
                new_alerts: alerts
            });

        } catch (error) {
            logger.error('Check Budget Alerts Error:', error);
            res.status(500).json({ error: 'Failed to check budget alerts' });
        }
    }
}

module.exports = new AlertController();
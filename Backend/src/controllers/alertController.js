const Alert = require('../models/Alert');
const CostData = require('../models/CostData');
const Budget = require('../models/Budget');
const Company = require('../models/Company'); // Add this import
const logger = require('../utils/logger');
const { DEFAULT_VALUES, API_SERVICES } = require('../config/constants');

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

            // First, check for existing active alerts to prevent duplicates
            const existingAlerts = await Alert.find({
                company: company_id,
                project: project_id,
                status: 'active',
                alert_type: 'budget_threshold'
            });

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
                            total_cost: { $sum: '$cost' }
                        }
                    }
                ]);

                const totalCost = usage[0]?.total_cost || 0;
                const utilizationPercentage = (totalCost / budget.budget_amount) * 100;

                // Check if there's already an active alert for this budget
                const existingAlert = existingAlerts.find(
                    alert => alert.service_name === budget.service_name
                );

                if (utilizationPercentage >= budget.alert_threshold) {
                    if (!existingAlert) {
                        const alert = new Alert({
                            company: company_id,
                            project: project_id,
                            service_name: budget.service_name,
                            alert_type: 'budget_threshold',
                            message: `Budget threshold (${budget.alert_threshold}%) exceeded for ${budget.service_name}`,
                            threshold: budget.alert_threshold,
                            current_value: utilizationPercentage,
                            status: 'active',
                            created_at: new Date()
                        });

                        await alert.save();
                        alerts.push(alert);
                    }
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

    async checkGeminiUsageSpike(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];

            // Get last 24 hours usage
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            const usage = await CostData.aggregate([
                {
                    $match: {
                        company: company_id,
                        project: project_id,
                        service_name: 'Gemini',
                        created_at: { $gte: yesterday }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total_usage: { $sum: '$usage_quantity' },
                        avg_cost: { $avg: '$cost' }
                    }
                }
            ]);

            if (usage.length > 0) {
                const avgHourlyUsage = usage[0].total_usage / 24;
                const currentHourUsage = await CostData.aggregate([
                    {
                        $match: {
                            company: company_id,
                            project: project_id,
                            service_name: 'Gemini',
                            created_at: { 
                                $gte: new Date(Date.now() - 1000 * 60 * 60) // Last hour
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            usage: { $sum: '$usage_quantity' }
                        }
                    }
                ]);

                // Check for usage spike (2x average)
                if (currentHourUsage.length > 0 && 
                    currentHourUsage[0].usage > avgHourlyUsage * 2) {
                
                    // Create spike alert if none exists
                    const existingAlert = await Alert.findOne({
                        company: company_id,
                        project: project_id,
                        service_name: 'Gemini',
                        alert_type: 'cost_spike',
                        status: 'active'
                    });

                    if (!existingAlert) {
                        const alert = new Alert({
                            company: company_id,
                            project: project_id,
                            service_name: 'Gemini',
                            alert_type: 'cost_spike',
                            message: `Unusual spike in Gemini API usage detected (${currentHourUsage[0].usage} calls in last hour)`,
                            threshold: avgHourlyUsage * 2,
                            current_value: currentHourUsage[0].usage,
                            status: 'active'
                        });
                        await alert.save();
                        return res.json({ alert_generated: true, alert });
                    }
                }
            }

            res.json({ alert_generated: false });
        } catch (error) {
            logger.error('Check Gemini Usage Spike Error:', error);
            res.status(500).json({ error: 'Failed to check usage spike' });
        }
    }

    // Add Gemini-specific alert check
    async checkGeminiUsage(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const usage = await CostData.aggregate([
                {
                    $match: {
                        company: company_id,
                        project: project_id,
                        service_name: 'Gemini',
                        date: { $gte: today }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total_cost: { $sum: '$cost' },
                        total_tokens: { $sum: '$usage_quantity' }
                    }
                }
            ]);

            if (usage.length > 0) {
                const alert = await this.createGeminiAlert(
                    company_id,
                    project_id,
                    usage[0]
                );
                res.json(alert);
            } else {
                res.json({ message: 'No unusual usage detected' });
            }
        } catch (error) {
            logger.error('Check Gemini Usage Error:', error);
            res.status(500).json({ error: 'Failed to check Gemini usage' });
        }
    }

    async createGeminiAlert(company_id, project_id, usage) {
        const threshold = usage.total_cost * DEFAULT_VALUES.COST_SPIKE_MULTIPLIER;
        
        const alert = new Alert({
            company: company_id,
            project: project_id,
            service_name: 'Gemini',
            alert_type: 'cost_spike',
            message: `High Gemini API usage detected: $${usage.total_cost.toFixed(2)} (${usage.total_tokens} tokens)`,
            threshold,
            current_value: usage.total_cost,
            status: 'active',
            created_at: new Date()
        });
        
        await alert.save();
        return alert;
    }
}

module.exports = new AlertController();
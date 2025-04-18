const CostData = require('../models/CostData');
const Budget = require('../models/Budget');
const logger = require('../utils/logger');

class CostDataController {
    async recordApiUsage(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const { service_name, cost, usage_quantity, unit, region } = req.body;

            // Check budget before recording
            const budget = await Budget.findOne({
                company: company_id,
                project: project_id,
                service_name,
                budget_status: 'active'
            });

            const costData = new CostData({
                company: company_id,
                project: project_id,
                service_name,
                cost,
                usage_quantity,
                unit,
                region,
                date: new Date()
            });

            await costData.save();

            // Check for budget threshold
            if (budget) {
                const monthStart = new Date();
                monthStart.setDate(1);
                monthStart.setHours(0, 0, 0, 0);

                const monthlyTotal = await CostData.aggregate([
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
                            total: { $sum: "$cost" }
                        }
                    }
                ]);

                const totalCost = monthlyTotal[0]?.total || 0;
                if (totalCost >= budget.budget_amount) {
                    return res.status(400).json({
                        error: 'Budget limit exceeded',
                        current_cost: totalCost,
                        budget_limit: budget.budget_amount
                    });
                }
            }

            res.status(201).json(costData);
        } catch (error) {
            logger.error('Record API Usage Error:', error);
            res.status(500).json({ error: 'Failed to record API usage' });
        }
    }

    async predictCosts(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const { service_name } = req.query;

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const historicalData = await CostData.aggregate([
                {
                    $match: {
                        company: company_id,
                        project: project_id,
                        service_name,
                        date: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        daily_cost: { $sum: "$cost" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            // Simple linear prediction
            const dailyAverage = historicalData.reduce((acc, curr) => acc + curr.daily_cost, 0) / historicalData.length;
            const predictedMonthly = dailyAverage * 30;

            res.json({
                predicted_cost: predictedMonthly,
                trend: predictedMonthly > (dailyAverage * 30) ? "increasing" : "decreasing",
                confidence_score: 0.8,
                historical_data: historicalData
            });
        } catch (error) {
            logger.error('Predict Costs Error:', error);
            res.status(500).json({ error: 'Failed to predict costs' });
        }
    }

    async getCostSummary(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];

            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const summary = await CostData.aggregate([
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
                        total_usage: { $sum: '$usage_quantity' },
                        average_daily_cost: { $avg: '$cost' }
                    }
                },
                {
                    $sort: { total_cost: -1 }
                },
                {
                    $limit: 3
                }
            ]);

            const totalCost = summary.reduce((acc, curr) => acc + curr.total_cost, 0);

            res.json({
                total_cost: totalCost,
                top_3_apis: summary,
                month: monthStart.toISOString().slice(0, 7)
            });
        } catch (error) {
            logger.error('Get Cost Summary Error:', error);
            res.status(500).json({ error: 'Failed to fetch cost summary' });
        }
    }

    async detectSpikes(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const { service_name } = req.query;

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const todayCosts = await CostData.aggregate([
                {
                    $match: {
                        company: company_id,
                        project: project_id,
                        service_name,
                        date: { $gte: yesterday }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total_cost: { $sum: '$cost' }
                    }
                }
            ]);

            const averageCost = await CostData.aggregate([
                {
                    $match: {
                        company: company_id,
                        project: project_id,
                        service_name,
                        date: {
                            $gte: new Date(yesterday.setDate(yesterday.getDate() - 7))
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avg_cost: { $avg: '$cost' }
                    }
                }
            ]);

            const todayTotal = todayCosts[0]?.total_cost || 0;
            const avgDaily = averageCost[0]?.avg_cost || 0;

            const isSpike = todayTotal > (avgDaily * 2);

            res.json({
                alert: isSpike,
                current_cost: todayTotal,
                average_cost: avgDaily,
                threshold: avgDaily * 2,
                message: isSpike ? `Cost spike detected for ${service_name}` : null
            });
        } catch (error) {
            logger.error('Detect Spikes Error:', error);
            res.status(500).json({ error: 'Failed to detect cost spikes' });
        }
    }
}

module.exports = new CostDataController();
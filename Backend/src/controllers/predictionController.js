const CostData = require('../models/CostData');
const Budget = require('../models/Budget');
const logger = require('../utils/logger');

class PredictionController {
    async predictCosts(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const { service_name, days = 30 } = req.query;

            const historicalData = await CostData.aggregate([
                {
                    $match: {
                        company: company_id,
                        project: project_id,
                        service_name,
                        date: {
                            $gte: new Date(new Date().setDate(new Date().getDate() - days))
                        }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        daily_cost: { $sum: "$cost" },
                        usage_count: { $sum: "$usage_quantity" }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            const prediction = this.calculatePrediction(historicalData);
            res.json(prediction);
        } catch (error) {
            logger.error('Predict Costs Error:', error);
            res.status(500).json({ error: 'Failed to predict costs' });
        }
    }

    calculatePrediction(historicalData) {
        if (historicalData.length === 0) {
            return {
                predicted_cost: 0,
                trend: "no_data",
                confidence_score: 0,
                daily_prediction: []
            };
        }

        const costs = historicalData.map(day => day.daily_cost);
        const average = costs.reduce((a, b) => a + b, 0) / costs.length;
        
        // Simple linear regression
        const xValues = Array.from({ length: costs.length }, (_, i) => i);
        const slope = this.calculateSlope(xValues, costs);
        
        // Predict next 30 days
        const lastDate = new Date(historicalData[historicalData.length - 1]._id);
        const dailyPredictions = Array.from({ length: 30 }, (_, i) => {
            const predictedDate = new Date(lastDate);
            predictedDate.setDate(predictedDate.getDate() + i + 1);
            return {
                date: predictedDate.toISOString().split('T')[0],
                predicted_cost: Math.max(0, average + (slope * (costs.length + i)))
            };
        });

        const monthlyPrediction = dailyPredictions.reduce((sum, day) => sum + day.predicted_cost, 0);
        const trend = slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable";
        
        // Calculate R-squared for confidence score
        const rSquared = this.calculateRSquared(xValues, costs, slope, average);

        return {
            predicted_monthly_cost: monthlyPrediction,
            trend,
            confidence_score: rSquared,
            daily_predictions: dailyPredictions,
            historical_data: historicalData
        };
    }

    calculateSlope(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + (xi * y[i]), 0);
        const sumXX = x.reduce((sum, xi) => sum + (xi * xi), 0);
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    calculateRSquared(x, y, slope, yMean) {
        const yPred = x.map(xi => yMean + (slope * xi));
        const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
        const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        return 1 - (ssRes / ssTot);
    }
}

module.exports = new PredictionController();
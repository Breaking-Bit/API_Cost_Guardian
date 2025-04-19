const CostData = require('../models/CostData');
const logger = require('../utils/logger');

class AnalyticsController {
    async getAnalyticsData(req, res) {
        try {
            const { company_id } = req.user;
            const project_id = req.headers['x-project-id'];
            const { startDate, endDate } = req.query;

            const query = {
                company: company_id,
                project: project_id
            };

            if (startDate && endDate) {
                query.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const data = await CostData.find(query)
                .sort({ date: 1 })
                .select('service_name cost usage_quantity date region');

            res.json(data);
        } catch (error) {
            logger.error('Analytics Data Error:', error);
            res.status(500).json({ error: 'Failed to fetch analytics data' });
        }
    }
}

module.exports = new AnalyticsController();
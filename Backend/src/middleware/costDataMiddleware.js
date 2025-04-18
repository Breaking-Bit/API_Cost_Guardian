const logger = require('../utils/logger');

const costDataMiddleware = {
    validateCostData: (req, res, next) => {
        const { service_name, cost, usage_quantity, unit, region } = req.body;

        if (!service_name || cost === undefined || !usage_quantity || !unit || !region) {
            return res.status(400).json({
                error: 'Missing required cost data',
                required: ['service_name', 'cost', 'usage_quantity', 'unit', 'region']
            });
        }

        if (cost < 0 || usage_quantity < 0) {
            return res.status(400).json({ error: 'Cost and usage quantity must be non-negative' });
        }

        next();
    }
};

module.exports = costDataMiddleware;
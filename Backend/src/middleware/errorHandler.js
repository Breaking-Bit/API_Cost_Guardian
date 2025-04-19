const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('API Error:', err);

  if (err.response) {
    // External API error
    return res.status(err.response.status || 500).json({
      error: 'External API error',
      details: err.response.data
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
};

module.exports = errorHandler;
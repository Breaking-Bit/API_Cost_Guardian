const express = require('express');
const router = express.Router();
const costDataController = require('../controllers/costDataController');
const authMiddleware = require('../middleware/authMiddleware');
const projectMiddleware = require('../middleware/projectMiddleware');
const costDataMiddleware = require('../middleware/costDataMiddleware');

router.use(authMiddleware);
router.use(projectMiddleware.validateProjectAccess);

router.post('/usage', costDataMiddleware.validateCostData, costDataController.recordApiUsage);
router.get('/predict', costDataController.predictCosts);
router.get('/summary', costDataController.getCostSummary);
router.get('/spikes', costDataController.detectSpikes);

module.exports = router;
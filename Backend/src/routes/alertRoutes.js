const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');
const projectMiddleware = require('../middleware/projectMiddleware');

router.use(authMiddleware);
router.use(projectMiddleware.validateProjectAccess);

router.get('/', alertController.getActiveAlerts);
router.post('/', alertController.createAlert);
router.put('/:alert_id/resolve', alertController.resolveAlert);
router.post('/check-budget', alertController.checkBudgetAlerts);

module.exports = router;
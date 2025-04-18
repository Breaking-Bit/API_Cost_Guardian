const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const authMiddleware = require('../middleware/authMiddleware');
const projectMiddleware = require('../middleware/projectMiddleware');

router.use(authMiddleware);
router.use(projectMiddleware.validateProjectAccess);

router.post('/', syncController.syncData);
router.get('/status', syncController.getLastSyncStatus);

module.exports = router;
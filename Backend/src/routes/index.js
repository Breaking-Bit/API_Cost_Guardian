const express = require('express');
const router = express.Router();

const companyRoutes = require('./companyRoutes');
const projectRoutes = require('./projectRoutes');
const budgetRoutes = require('./budgetRoutes');
const costDataRoutes = require('./costDataRoutes');
const alertRoutes = require('./alertRoutes');
const syncRoutes = require('./syncRoutes');

router.use('/companies', companyRoutes);
router.use('/projects', projectRoutes);
router.use('/budgets', budgetRoutes);
router.use('/cost-data', costDataRoutes);
router.use('/alerts', alertRoutes);
router.use('/sync', syncRoutes);

module.exports = router;
const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');
const projectMiddleware = require('../middleware/projectMiddleware');
const budgetMiddleware = require('../middleware/budgetMiddleware');

router.use(authMiddleware);
router.use(projectMiddleware.validateProjectAccess);

// Add new route for getting all budgets
router.get('/', budgetController.getProjectBudgets);

router.post('/', 
    budgetMiddleware.validateBudgetData,
    budgetMiddleware.checkDuplicateBudget,
    budgetController.createBudget
);

router.get('/service/:service_name', budgetController.getBudgetByService);
router.put('/:budget_id', budgetMiddleware.validateBudgetData, budgetController.updateBudget);
router.put('/:budget_id/deactivate', budgetController.deactivateBudget);

module.exports = router;
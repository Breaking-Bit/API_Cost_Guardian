const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', companyController.registerCompany);
router.post('/login', companyController.loginCompany);
router.get('/profile', authMiddleware, companyController.getCompanyProfile);
router.put('/profile', authMiddleware, companyController.updateCompanyProfile);

module.exports = router;
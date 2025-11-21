const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', auth, companyController.getAllCompanies);
router.post('/', auth, roleCheck(['super_admin', 'placement_officer']), companyController.createCompany);

module.exports = router;

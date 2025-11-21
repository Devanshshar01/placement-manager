const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', auth, driveController.getAllDrives);
router.post('/', auth, roleCheck(['super_admin', 'placement_officer']), driveController.createDrive);

module.exports = router;

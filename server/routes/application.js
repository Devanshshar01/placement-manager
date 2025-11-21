const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/apply', auth, roleCheck(['student']), applicationController.applyForDrive);
router.get('/my-applications', auth, roleCheck(['student']), applicationController.getMyApplications);
router.put('/status', auth, roleCheck(['super_admin', 'placement_officer']), applicationController.updateStatus);

module.exports = router;

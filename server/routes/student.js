const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Middleware to ensure user is a student
const isStudent = [auth, roleCheck(['student'])];

// Profile Routes
router.get('/profile', isStudent, studentController.getProfile);
router.put('/profile', isStudent, studentController.updateProfile);

// Drive Routes
router.get('/drives', isStudent, studentController.getAllDrives);
router.get('/drives/:id', isStudent, studentController.getDriveById);

// Application Routes
router.post('/apply/:driveId', isStudent, studentController.applyForDrive);
router.get('/applications', isStudent, studentController.getMyApplications);
router.delete('/applications/:id', isStudent, studentController.withdrawApplication);

// Notification Routes
router.get('/notifications', isStudent, studentController.getNotifications);

module.exports = router;

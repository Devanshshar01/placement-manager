const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Middleware: Admin Only
const isAdmin = [auth, roleCheck(['super_admin', 'placement_officer'])];
const isSuperAdmin = [auth, roleCheck(['super_admin'])];

// Student Management
router.get('/students', isAdmin, adminController.getAllStudents);
router.get('/students/:id', isAdmin, adminController.getStudentById);
router.put('/students/:id/status', isAdmin, adminController.updateStudentStatus);

// Company Management
router.post('/companies', isAdmin, adminController.createCompany);
router.get('/companies', isAdmin, adminController.getAllCompanies);
router.put('/companies/:id', isAdmin, adminController.updateCompany);
router.delete('/companies/:id', isAdmin, adminController.deleteCompany);

// Drive Management
router.post('/drives', isAdmin, adminController.createDrive);
router.get('/drives', isAdmin, adminController.getAllDrives);
router.put('/drives/:id', isAdmin, adminController.updateDrive);
router.delete('/drives/:id', isAdmin, adminController.deleteDrive);
router.put('/drives/:id/status', isAdmin, adminController.updateDriveStatus);

// Application Management
router.get('/applications', isAdmin, adminController.getApplications);
router.put('/applications/:id/status', isAdmin, adminController.updateApplicationStatus);

// Analytics
router.get('/analytics', isAdmin, adminController.getAnalytics);

// Admin Creation (Super Admin Only)
router.post('/create', isSuperAdmin, adminController.createAdmin);

module.exports = router;

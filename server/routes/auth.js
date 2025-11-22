const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerStudentValidator, registerAdminValidator, loginValidator } = require('../middleware/validators');
const { loginLimiter, createAccountLimiter } = require('../middleware/rateLimiter');

// @route   POST api/auth/register/student
// @desc    Register student
// @access  Public
router.post('/register/student', createAccountLimiter, registerStudentValidator, authController.registerStudent);

// @route   POST api/auth/register/admin
// @desc    Register admin
// @access  Public (with key)
router.post('/register/admin', createAccountLimiter, registerAdminValidator, authController.registerAdmin);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginLimiter, loginValidator, authController.login);

// @route   POST api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authController.logout);

module.exports = router;

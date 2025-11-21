check('roll_number', 'Roll number is required').not().isEmpty(),
    check('branch', 'Branch is required').not().isEmpty(),
    check('cgpa', 'CGPA is required').isNumeric()
], authController.registerStudent);

// @route   POST api/auth/register/admin
// @desc    Register admin
// @access  Public (with key)
router.post('/register/admin', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('admin_key', 'Admin key is required').not().isEmpty()
], authController.registerAdmin);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    check('role', 'Role is required (student/admin)').isIn(['student', 'admin'])
], authController.login);

// @route   POST api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, authController.logout);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getMe);

module.exports = router;

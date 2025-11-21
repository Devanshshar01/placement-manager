const { body, param } = require('express-validator');

const registerStudentValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
        .withMessage('Password must include one lowercase character, one uppercase character, a number, and a special character'),
    body('roll_number').trim().notEmpty().withMessage('Roll number is required'),
    body('branch').trim().notEmpty().withMessage('Branch is required'),
    body('cgpa').isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10')
];

const registerAdminValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i")
        .withMessage('Password must include one lowercase character, one uppercase character, a number, and a special character'),
    body('admin_key').notEmpty().withMessage('Admin key is required')
];

const loginValidator = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidator = [
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('resume_link').optional().isURL().withMessage('Please provide a valid URL for resume'),
    body('linkedin_link').optional().isURL().withMessage('Please provide a valid URL for LinkedIn'),
    body('portfolio_link').optional().isURL().withMessage('Please provide a valid URL for portfolio')
];

const createCompanyValidator = [
    body('name').trim().notEmpty().withMessage('Company name is required'),
    body('website').optional().isURL().withMessage('Please provide a valid website URL'),
    body('email').optional().isEmail().withMessage('Please provide a valid contact email')
];

const createDriveValidator = [
    body('company_id').isInt().withMessage('Valid Company ID is required'),
    body('job_title').trim().notEmpty().withMessage('Job title is required'),
    body('job_description').trim().notEmpty().withMessage('Job description is required'),
    body('eligible_branches').isArray({ min: 1 }).withMessage('At least one eligible branch is required'),
    body('min_cgpa').isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be between 0 and 10'),
    body('salary_package').trim().notEmpty().withMessage('Salary package is required'),
    body('deadline').isISO8601().toDate().withMessage('Valid deadline date is required'),
    body('drive_date').isISO8601().toDate().withMessage('Valid drive date is required')
];

module.exports = {
    registerStudentValidator,
    registerAdminValidator,
    loginValidator,
    updateProfileValidator,
    createCompanyValidator,
    createDriveValidator
};

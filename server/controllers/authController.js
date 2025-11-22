const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const AppError = require('../utils/AppError');

// Helper to get token and set cookie
const sendTokenResponse = (user, statusCode, res) => {
    const payload = {
        user: {
            id: user.id,
            role: user.role
        }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    const options = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};

// @route   POST api/auth/register/student
exports.registerStudent = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    const { name, email, password, roll_number, branch, cgpa } = req.body;

    try {
        const [existingUser] = await db.promise().query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return next(new AppError('Email already registered', 400));
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const connection = await db.promise().getConnection();
        try {
            await connection.beginTransaction();

            const [userResult] = await connection.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, 'student']
            );
            const userId = userResult.insertId;

            await connection.query(
                'INSERT INTO students (user_id, roll_number, branch, cgpa) VALUES (?, ?, ?, ?)',
                [userId, roll_number, branch, cgpa]
            );

            await connection.commit();

            const newUser = { id: userId, name, email, role: 'student' };
            sendTokenResponse(newUser, 201, res);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        next(error);
    }
};

// @route   POST api/auth/register/admin
exports.registerAdmin = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    const { name, email, password, admin_key } = req.body;

    if (admin_key !== process.env.ADMIN_KEY) {
        return next(new AppError('Invalid Admin Key', 403));
    }

    try {
        const [existingUser] = await db.promise().query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return next(new AppError('Email already registered', 400));
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.promise().query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'admin']
        );

        const newUser = { id: result.insertId, name, email, role: 'admin' };
        sendTokenResponse(newUser, 201, res);

    } catch (error) {
        next(error);
    }
};

// @route   POST api/auth/login
exports.login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new AppError(errors.array()[0].msg, 400));
    }

    const { email, password } = req.body;

    try {
        const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return next(new AppError('Invalid credentials', 401));
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return next(new AppError('Invalid credentials', 401));
        }

        sendTokenResponse(user, 200, res);

    } catch (error) {
        next(error);
    }
};

// @route   POST api/auth/logout
exports.logout = (req, res) => {
    res.cookie('token', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ success: true, data: {} });
};

// @route   GET api/auth/me
exports.getMe = async (req, res, next) => {
    try {
        // Assuming auth middleware adds req.user
        // We need to fetch full details if needed, or just return req.user
        // For now, let's query the DB to be sure
        const [users] = await db.promise().query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);

        if (users.length === 0) {
            return next(new AppError('User not found', 404));
        }

        res.json({ success: true, data: users[0] });
    } catch (error) {
        next(error);
    }
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');

// Helper to get token and set cookie
const sendTokenResponse = (user, statusCode, res) => {
    const payload = {
        user: {
            id: user.id,
            role: user.role
        }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });

    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
    email: user.email,
        role: role === 'student' ? 'student' : user.role
};

sendTokenResponse(userForToken, 200, res);

    } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
}
};

// @route   POST api/auth/logout
// @desc    Logout user / clear cookie
// @access  Private
exports.logout = async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ success: true, data: {} });
};

// @route   GET api/auth/me
// @desc    Get current logged in user
// @access  Private
exports.getMe = async (req, res) => {
    try {
        let tableName = req.user.role === 'student' ? 'students' : 'admin';
        const [rows] = await db.query(`SELECT id, name, email, role, created_at FROM ${tableName} WHERE id = ?`, [req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const user = rows[0];
        res.json({ success: true, data: user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

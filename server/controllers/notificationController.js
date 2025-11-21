const db = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        let userType = req.user.role === 'student' ? 'student' : 'admin';
        const [rows] = await db.query('SELECT * FROM notifications WHERE user_type = ? AND user_id = ? ORDER BY created_at DESC', [userType, req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

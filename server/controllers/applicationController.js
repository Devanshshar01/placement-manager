const db = require('../config/db');

exports.applyForDrive = async (req, res) => {
    const { drive_id } = req.body;
    try {
        // Check if already applied
        const [existing] = await db.query('SELECT * FROM applications WHERE student_id = ? AND drive_id = ?', [req.user.id, drive_id]);
        if (existing.length > 0) return res.status(400).json({ msg: 'Already applied' });

        await db.query('INSERT INTO applications (student_id, drive_id) VALUES (?, ?)', [req.user.id, drive_id]);
        res.json({ msg: 'Application submitted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getMyApplications = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, jd.job_title, c.company_name, jd.drive_date
            FROM applications a
            JOIN job_drives jd ON a.drive_id = jd.id
            JOIN companies c ON jd.company_id = c.id
            WHERE a.student_id = ?
        `, [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateStatus = async (req, res) => {
    const { application_id, status } = req.body;
    try {
        await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, application_id]);
        res.json({ msg: 'Status updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

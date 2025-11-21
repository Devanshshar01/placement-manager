const db = require('../config/db');

exports.getAllDrives = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT jd.*, c.company_name 
            FROM job_drives jd 
            JOIN companies c ON jd.company_id = c.id
            ORDER BY jd.drive_date DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createDrive = async (req, res) => {
    const { company_id, job_title, job_type, ctc, location, eligibility_criteria, required_skills, application_deadline, drive_date } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO job_drives (company_id, job_title, job_type, ctc, location, eligibility_criteria, required_skills, application_deadline, drive_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [company_id, job_title, job_type, ctc, location, eligibility_criteria, required_skills, application_deadline, drive_date]
        );
        res.json({ id: result.insertId, msg: 'Drive created' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

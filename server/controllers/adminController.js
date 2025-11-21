const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

// @route   GET api/admin/students
// @desc    Get all students with filters
exports.getAllStudents = async (req, res) => {
    const { branch, cgpa_min, name } = req.query;
    try {
        let query = 'SELECT id, name, email, roll_number, branch, cgpa, phone, skills, created_at FROM students WHERE 1=1';
        let params = [];

        if (branch) {
            query += ' AND branch = ?';
            params.push(branch);
        }
        if (cgpa_min) {
            query += ' AND cgpa >= ?';
            params.push(cgpa_min);
        }
        if (name) {
            query += ' AND name LIKE ?';
            params.push(`%${name}%`);
        }

        const [rows] = await db.query(query, params);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/admin/students/:id
// @desc    Get specific student details
exports.getStudentById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ msg: 'Student not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   PUT api/admin/students/:id/status
// @desc    Update student details (Simulating status update by updating profile)
exports.updateStudentStatus = async (req, res) => {
    const { branch, cgpa } = req.body; // Assuming these are the "status" related fields we might want to fix
    try {
        await db.query('UPDATE students SET branch = ?, cgpa = ? WHERE id = ?', [branch, cgpa, req.params.id]);
        res.json({ success: true, msg: 'Student details updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ==========================================
// COMPANY MANAGEMENT
// ==========================================

exports.createCompany = async (req, res) => {
    const { company_name, industry, website, description, hr_name, hr_email, hr_phone } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO companies (company_name, industry, website, description, hr_name, hr_email, hr_phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [company_name, industry, website, description, hr_name, hr_email, hr_phone]
        );
        res.json({ success: true, data: { id: result.insertId, ...req.body } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM companies ORDER BY created_at DESC');
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateCompany = async (req, res) => {
    const { company_name, industry, website, description, hr_name, hr_email, hr_phone } = req.body;
    try {
        await db.query(
            'UPDATE companies SET company_name=?, industry=?, website=?, description=?, hr_name=?, hr_email=?, hr_phone=? WHERE id=?',
            [company_name, industry, website, description, hr_name, hr_email, hr_phone, req.params.id]
        );
        res.json({ success: true, msg: 'Company updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteCompany = async (req, res) => {
    try {
        await db.query('DELETE FROM companies WHERE id = ?', [req.params.id]);
        res.json({ success: true, msg: 'Company deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ==========================================
// DRIVE MANAGEMENT
// ==========================================

exports.createDrive = async (req, res) => {
    const { company_id, job_title, job_type, ctc, location, eligibility_criteria, required_skills, application_deadline, drive_date } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO job_drives (company_id, job_title, job_type, ctc, location, eligibility_criteria, required_skills, application_deadline, drive_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [company_id, job_title, job_type, ctc, location, eligibility_criteria, required_skills, application_deadline, drive_date]
        );

        // NOTIFICATION: Notify all students
        const message = `New Job Drive Alert: ${job_title} (CTC: ${ctc} LPA). Check details and apply before ${application_deadline}`;

        // Get all student IDs
        const [students] = await db.query('SELECT id FROM students');

        if (students.length > 0) {
            const notificationValues = students.map(s => ['student', s.id, message]);
            await db.query('INSERT INTO notifications (user_type, user_id, message) VALUES ?', [notificationValues]);
        }

        res.json({ success: true, data: { id: result.insertId, ...req.body }, msg: 'Drive created and notifications sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllDrives = async (req, res) => {
    const { company_id, status } = req.query;
    try {
        let query = `
            SELECT jd.*, c.company_name 
            FROM job_drives jd 
            JOIN companies c ON jd.company_id = c.id
            WHERE 1=1
        `;
        let params = [];

        if (company_id) {
            query += ' AND jd.company_id = ?';
            params.push(company_id);
        }
        if (status) {
            query += ' AND jd.status = ?';
            params.push(status);
        }

        query += ' ORDER BY jd.created_at DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateDrive = async (req, res) => {
    const { job_title, job_type, ctc, location, eligibility_criteria, required_skills, application_deadline, drive_date } = req.body;
    try {
        await db.query(
            'UPDATE job_drives SET job_title=?, job_type=?, ctc=?, location=?, eligibility_criteria=?, required_skills=?, application_deadline=?, drive_date=? WHERE id=?',
            [job_title, job_type, ctc, location, eligibility_criteria, required_skills, application_deadline, drive_date, req.params.id]
        );
        res.json({ success: true, msg: 'Drive updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteDrive = async (req, res) => {
    try {
        await db.query('DELETE FROM job_drives WHERE id = ?', [req.params.id]);
        res.json({ success: true, msg: 'Drive deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateDriveStatus = async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE job_drives SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, msg: 'Drive status updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ==========================================
// APPLICATION MANAGEMENT
// ==========================================

exports.getApplications = async (req, res) => {
    const { drive_id } = req.query;
    try {
        let query = `
            SELECT a.*, s.name as student_name, s.email as student_email, s.roll_number, s.branch, s.cgpa, s.resume_url,
                   jd.job_title, c.company_name
            FROM applications a
            JOIN students s ON a.student_id = s.id
            JOIN job_drives jd ON a.drive_id = jd.id
            JOIN companies c ON jd.company_id = c.id
            WHERE 1=1
        `;
        let params = [];

        if (drive_id) {
            query += ' AND a.drive_id = ?';
            params.push(drive_id);
        }

        query += ' ORDER BY a.applied_at DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateApplicationStatus = async (req, res) => {
    const { status } = req.body;
    const appId = req.params.id;
    try {
        // Get application details for notification
        const [app] = await db.query(`
            SELECT a.student_id, jd.job_title, c.company_name 
            FROM applications a
            JOIN job_drives jd ON a.drive_id = jd.id
            JOIN companies c ON jd.company_id = c.id
            WHERE a.id = ?
        `, [appId]);

        if (app.length === 0) return res.status(404).json({ msg: 'Application not found' });

        await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, appId]);

        // NOTIFICATION
        const message = `Your application for ${app[0].job_title} at ${app[0].company_name} has been updated to: ${status}`;
        await db.query('INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)', ['student', app[0].student_id, message]);

        res.json({ success: true, msg: 'Application status updated and notification sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ==========================================
// ANALYTICS
// ==========================================

exports.getAnalytics = async (req, res) => {
    try {
        const [totalStudents] = await db.query('SELECT COUNT(*) as count FROM students');
        const [totalDrives] = await db.query('SELECT COUNT(*) as count FROM job_drives');
        const [totalApplications] = await db.query('SELECT COUNT(*) as count FROM applications');

        // Placed students (unique students with at least one 'Selected' application)
        const [placedStudents] = await db.query('SELECT COUNT(DISTINCT student_id) as count FROM applications WHERE status = "Selected"');

        // Average CTC of selected applications
        const [avgCTC] = await db.query(`
            SELECT AVG(jd.ctc) as avg_ctc 
            FROM applications a 
            JOIN job_drives jd ON a.drive_id = jd.id 
            WHERE a.status = "Selected"
        `);

        // Company wise placement
        const [companyStats] = await db.query(`
            SELECT c.company_name, COUNT(a.id) as selected_count
            FROM applications a
            JOIN job_drives jd ON a.drive_id = jd.id
            JOIN companies c ON jd.company_id = c.id
            WHERE a.status = "Selected"
            GROUP BY c.id, c.company_name
            ORDER BY selected_count DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                total_students: totalStudents[0].count,
                total_drives: totalDrives[0].count,
                total_applications: totalApplications[0].count,
                placed_students: placedStudents[0].count,
                placement_rate: totalStudents[0].count > 0 ? ((placedStudents[0].count / totalStudents[0].count) * 100).toFixed(2) : 0,
                average_ctc: parseFloat(avgCTC[0].avg_ctc || 0).toFixed(2),
                top_companies: companyStats
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// ==========================================
// ADMIN CREATION (Existing)
// ==========================================
exports.createAdmin = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const [existing] = await db.query('SELECT email FROM admin WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ msg: 'Admin already exists' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await db.query('INSERT INTO admin (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, password_hash, role]);
        res.json({ msg: 'Admin created successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const db = require('../config/db');

// @route   GET api/student/profile
// @desc    Get current student profile
// @access  Private (Student)
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, roll_number, branch, cgpa, phone, resume_url, linkedin_url, github_url, skills, created_at FROM students WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ msg: 'Student not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   PUT api/student/profile
// @desc    Update student profile
// @access  Private (Student)
exports.updateProfile = async (req, res) => {
    const { phone, resume_url, linkedin_url, github_url, skills } = req.body;

    // Build profile object
    const profileFields = {};
    if (phone) profileFields.phone = phone;
    if (resume_url) profileFields.resume_url = resume_url;
    if (linkedin_url) profileFields.linkedin_url = linkedin_url;
    if (github_url) profileFields.github_url = github_url;
    if (skills) profileFields.skills = skills;

    try {
        let query = 'UPDATE students SET ';
        let params = [];
        for (const [key, value] of Object.entries(profileFields)) {
            query += `${key} = ?, `;
            params.push(value);
        }

        if (params.length === 0) {
            return res.status(400).json({ msg: 'No fields to update' });
        }

        query = query.slice(0, -2); // Remove trailing comma
        query += ' WHERE id = ?';
        params.push(req.user.id);

        await db.query(query, params);

        const [rows] = await db.query(
            'SELECT id, name, email, roll_number, branch, cgpa, phone, resume_url, linkedin_url, github_url, skills FROM students WHERE id = ?',
            [req.user.id]
        );
        res.json({ success: true, data: rows[0], msg: 'Profile updated successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/student/drives
// @desc    Get all available job drives (with filters)
// @access  Private (Student)
exports.getAllDrives = async (req, res) => {
    const { company, ctc_min, job_type } = req.query;

    try {
        let query = `
            SELECT jd.*, c.company_name, c.industry, c.website 
            FROM job_drives jd 
            JOIN companies c ON jd.company_id = c.id
            WHERE jd.application_deadline > NOW() 
            AND jd.status IN ('Scheduled', 'Ongoing')
        `;
        let params = [];

        if (company) {
            query += ` AND c.company_name LIKE ?`;
            params.push(`%${company}%`);
        }
        if (ctc_min) {
            query += ` AND jd.ctc >= ?`;
            params.push(ctc_min);
        }
        if (job_type) {
            query += ` AND jd.job_type = ?`;
            params.push(job_type);
        }

        query += ` ORDER BY jd.application_deadline ASC`;

        const [rows] = await db.query(query, params);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/student/drives/:id
// @desc    Get specific drive details
// @access  Private (Student)
exports.getDriveById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT jd.*, c.company_name, c.industry, c.website, c.description as company_description
            FROM job_drives jd 
            JOIN companies c ON jd.company_id = c.id
            WHERE jd.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Drive not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/student/apply/:driveId
// @desc    Apply to a job drive
// @access  Private (Student)
exports.applyForDrive = async (req, res) => {
    const driveId = req.params.driveId;
    const studentId = req.user.id;

    try {
        // 1. Check if drive exists and is active
        const [drive] = await db.query('SELECT * FROM job_drives WHERE id = ?', [driveId]);
        if (drive.length === 0) {
            return res.status(404).json({ msg: 'Drive not found' });
        }

        const currentDrive = drive[0];
        if (new Date(currentDrive.application_deadline) < new Date()) {
            return res.status(400).json({ msg: 'Application deadline has passed' });
        }

        // 2. Check if already applied
        const [existingApp] = await db.query(
            'SELECT * FROM applications WHERE student_id = ? AND drive_id = ?',
            [studentId, driveId]
        );
        if (existingApp.length > 0) {
            return res.status(400).json({ msg: 'You have already applied for this drive' });
        }

        // 3. Apply
        await db.query(
            'INSERT INTO applications (student_id, drive_id, status) VALUES (?, ?, ?)',
            [studentId, driveId, 'Applied']
        );

        // 4. Create Notification
        const message = `You have successfully applied for ${currentDrive.job_title} at Company ID ${currentDrive.company_id}`;
        await db.query(
            'INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)',
            ['student', studentId, message]
        );

        res.json({ success: true, msg: 'Application submitted successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/student/applications
// @desc    Get all student's applications
// @access  Private (Student)
exports.getMyApplications = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.id as application_id, a.status, a.applied_at, 
                   jd.id as drive_id, jd.job_title, jd.job_type, jd.ctc, jd.location, jd.drive_date,
                   c.company_name
            FROM applications a
            JOIN job_drives jd ON a.drive_id = jd.id
            JOIN companies c ON jd.company_id = c.id
            WHERE a.student_id = ?
            ORDER BY a.applied_at DESC
        `, [req.user.id]);

        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   DELETE api/student/applications/:id
// @desc    Withdraw application
// @access  Private (Student)
exports.withdrawApplication = async (req, res) => {
    try {
        const appId = req.params.id;

        // Check application status
        const [app] = await db.query('SELECT * FROM applications WHERE id = ? AND student_id = ?', [appId, req.user.id]);

        if (app.length === 0) {
            return res.status(404).json({ msg: 'Application not found' });
        }

        if (app[0].status !== 'Applied') {
            return res.status(400).json({ msg: 'Cannot withdraw application. Status is ' + app[0].status });
        }

        await db.query('DELETE FROM applications WHERE id = ?', [appId]);

        res.json({ success: true, msg: 'Application withdrawn successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/student/notifications
// @desc    Get student notifications
// @access  Private (Student)
exports.getNotifications = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_type = ? AND user_id = ? ORDER BY created_at DESC',
            ['student', req.user.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

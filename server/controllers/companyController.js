const db = require('../config/db');

exports.getAllCompanies = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM companies');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createCompany = async (req, res) => {
    const { company_name, industry, website, description, hr_name, hr_email, hr_phone } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO companies (company_name, industry, website, description, hr_name, hr_email, hr_phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [company_name, industry, website, description, hr_name, hr_email, hr_phone]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

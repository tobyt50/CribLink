const pool = require('../db');

const getAllDocs = async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM legal_documents');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

module.exports = { getAllDocs };

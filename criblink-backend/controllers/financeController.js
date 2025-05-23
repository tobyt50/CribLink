const pool = require('../db');

const getAllFinances = async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM finance_overview');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

module.exports = { getAllFinances };
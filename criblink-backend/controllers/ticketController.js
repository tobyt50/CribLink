const pool = require('../db');

const getAllTickets = async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM support_tickets');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

module.exports = { getAllTickets };
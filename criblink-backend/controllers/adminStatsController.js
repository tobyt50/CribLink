const pool = require('../db');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'lionel_messi_10_is_the_goat!';

// Controller function
exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(`SELECT user_id, full_name AS name, email, role, status, date_joined AS created_at FROM users`);
    res.json(result.rows); // ✅ return an array directly
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

exports.getAgentCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = 'agent'`
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error fetching agent count:', err);
    res.status(500).send('Server Error');
  }
};

exports.getListingsCount = async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM property_listings');
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error fetching listing count:', err);
    res.status(500).json({ error: 'Internal server error fetching listing' });
  }
};

exports.getPendingApprovalsCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM property_listings WHERE TRIM(LOWER(status)) = 'pending'`
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error fetching pending listing approvals:', err);
    res.status(500).send('Server Error');
  }
};

exports.getInquiriesCount = async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM inquiries');
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error fetching inquiries count:', err);
    res.status(500).send('Server Error');
  }
};

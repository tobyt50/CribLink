// controllers/inquiriesController.js
const pool = require('../db');
const { query } = require('../db');
const logActivity = require('../utils/logActivity');

// GET /admin/inquiries
const getAllInquiries = async (req, res) => {
  try {
    const result = await query('SELECT * FROM inquiries ORDER BY inquiry_id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /admin/inquiries/:id/assign
const assignInquiry = async (req, res) => {
  const { id } = req.params;
  const { agent_id } = req.body;

  try {
    await query(
      'UPDATE inquiries SET status = $1, assigned_agent = $2 WHERE inquiry_id = $3',
      ['assigned', agent_id, id]
    );

    await logActivity(`Assigned inquiry ID ${id} to agent ID ${agent_id}`, req.user, 'inquiry');

    res.sendStatus(200);
  } catch (err) {
    console.error('Error assigning inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /admin/inquiries/:id/resolve
const resolveInquiry = async (req, res) => {
  const { id } = req.params;

  try {
    await query(
      'UPDATE inquiries SET status = $1 WHERE inquiry_id = $2',
      ['resolved', id]
    );

    await logActivity(`Marked inquiry ID ${id} as resolved`, req.user, 'inquiry');

    res.sendStatus(200);
  } catch (err) {
    console.error('Error resolving inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



module.exports = {
  getAllInquiries,
  assignInquiry,
  resolveInquiry
};

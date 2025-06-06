
// controllers/agentController.js
const pool = require('../db');

const getAllAgents = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agent_performance');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// ✅ NEW: Dashboard stats for logged-in agent
const getAgentDashboardStats = async (req, res) => {
  try {
    const listingsRes = await pool.query(
      `SELECT COUNT(*) FROM property_listings WHERE agent_id = $1`,
      [req.user.user_id]
    );

    const inquiriesRes = await pool.query(
      `SELECT COUNT(*) FROM inquiries WHERE assigned_agent = $1`,
      [req.user.email]
    );

    res.json({
      totalListings: parseInt(listingsRes.rows[0].count, 10),
      totalInquiries: parseInt(inquiriesRes.rows[0].count, 10),
    });
  } catch (err) {
    console.error('Error fetching agent dashboard stats:', err);
    res.status(500).json({ error: 'Failed to load agent stats' });
  }
};

// ✅ NEW: Recent activity relevant to agent
const getAgentActivity = async (req, res) => {
  try {
    const { full_name, email } = req.user;

    const result = await pool.query(
      `SELECT type, message, actor_name, timestamp
   FROM activity_logs
   WHERE user_id = $1
   ORDER BY timestamp DESC
   LIMIT 10`,
      [req.user.user_id]
    );


    res.json({ activities: result.rows });
  } catch (err) {
    console.error('Error fetching agent activity:', err);
    res.status(500).json({ error: 'Failed to load agent activity' });
  }
};

module.exports = {
  getAllAgents,
  getAgentDashboardStats,
  getAgentActivity,
};

const pool = require('../db');

// Get recent activity from inquiries, agents, and custom logs
exports.getRecentActivity = async (req, res) => {
  try {
    const [inquiries, agents, logs] = await Promise.all([
      pool.query(`
        SELECT
            'inquiry' AS type,
            i.message_content AS message,
            i.status,
            i.created_at,
            COALESCE(u.full_name, 'Guest') AS client_name -- Join to get client name, default to 'Guest' if client_id is null
        FROM inquiries i
        LEFT JOIN users u ON i.client_id = u.user_id -- Join with users table
        ORDER BY i.created_at DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT 'agent' AS type, full_name, date_joined
        FROM users
        WHERE role = 'agent'
        ORDER BY date_joined DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT type, message, actor_name, timestamp
        FROM activity_logs
        ORDER BY timestamp DESC
        LIMIT 10
      `)
    ]);

    // Simplify inquiry activity messages
    const inquiryActivities = inquiries.rows.map(row => ({
      type: 'inquiry',
      message: `Inquiry from ${row.client_name}: "${row.message}" (Status: ${row.status})`, // More descriptive message
      timestamp: row.created_at || new Date(0)
    }));

    // Simplify agent activity messages
    const agentActivities = agents.rows.map(row => ({
      type: 'agent',
      message: `New Agent: ${row.full_name}`,
      timestamp: row.date_joined || new Date()
    }));

    // Use the message directly from activity_logs for custom activities
    const customActivities = logs.rows.map(row => ({
      type: row.type,
      message: row.message,
      timestamp: row.timestamp || new Date()
    }));

    const all = [...inquiryActivities, ...agentActivities, ...customActivities];

    const sorted = all
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({ activities: sorted });
  } catch (err) {
    console.error("Error fetching recent activity on server:", err);
    res.status(500).json({ error: 'Server error fetching recent activity', details: err.message });
  }
};
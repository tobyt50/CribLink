const pool = require('../db');

const logActivity = async (message, user = {}, type = 'general') => {
  try {
    const actorName = user?.role
      ? `${user.role}: ${user.full_name || user.name || user.email || 'Unknown'}`
      : user?.full_name || user?.name || user?.email || 'Unknown';

    const userId = user?.user_id || null;

    await pool.query(
      `INSERT INTO activity_logs (message, actor_name, user_id, type, timestamp)
       VALUES ($1, $2, $3, $4, NOW())`,
      [message, actorName, userId, type]

    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

module.exports = logActivity;

const pool = require("../db");

// Get count of all users
exports.getTotalUsersCount = async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM users`);
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching total users count:", err);
    res.status(500).json({ error: "Failed to fetch total users count" });
  }
};

// Get count of agencies
exports.getAgenciesCount = async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM agencies`);
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching agencies count:", err);
    res.status(500).json({ error: "Failed to fetch agencies count" });
  }
};

// Get count of agents
exports.getAgentCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = 'agent'`,
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching agent count:", err);
    res.status(500).send("Server Error");
  }
};

// Get count of clients
exports.getClientsCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = 'client'`,
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching clients count:", err);
    res.status(500).json({ error: "Failed to fetch clients count" });
  }
};

// Get count of all listings
exports.getListingsCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM property_listings");
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching listing count:", err);
    res.status(500).json({ error: "Internal server error fetching listing" });
  }
};

// Get count of available listings
exports.getAvailableListingsCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM property_listings WHERE TRIM(LOWER(status)) = 'available'`,
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching available listings count:", err);
    res.status(500).json({ error: "Failed to fetch available listings count" });
  }
};

// Get count of sold listings
exports.getSoldListingsCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM property_listings WHERE TRIM(LOWER(status)) = 'sold'`,
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching sold listings count:", err);
    res.status(500).json({ error: "Failed to fetch sold listings count" });
  }
};

// Get count of sold listings
exports.getPendingListingsCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM property_listings WHERE TRIM(LOWER(status)) = 'pending'`,
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching pending listings count:", err);
    res.status(500).json({ error: "Failed to fetch pending listings count" });
  }
};

// Get count of all inquiries (conversations)
exports.getAllInquiriesCount = async (req, res) => {
  try {
    // Count distinct conversation_ids
    const result = await pool.query(
      "SELECT COUNT(DISTINCT conversation_id) FROM inquiries",
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching all inquiries count:", err);
    res.status(500).json({ error: "Failed to fetch all inquiries count" });
  }
};

// Get count of all agent responses (messages from agents)
exports.getAgentResponsesCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM inquiries WHERE message_type IN ('agent_reply', 'agency_admin_reply')`,
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching agent responses count:", err);
    res.status(500).json({ error: "Failed to fetch agent responses count" });
  }
};

// Get count of all legal documents
exports.getDocumentsCount = async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM legal_documents`);
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching documents count:", err);
    res.status(500).json({ error: "Failed to fetch documents count" });
  }
};

// Get recent activity for the entire platform
exports.getPlatformActivity = async (req, res) => {
  try {
    // Fetch recent user signups
    const userSignups = await pool.query(`
      SELECT 'user_signup' AS type, full_name AS message, date_joined AS timestamp
      FROM users
      ORDER BY date_joined DESC
      LIMIT 5
    `);

    // Fetch recent agency creations
    const agencyCreations = await pool.query(`
      SELECT 'agency_created' AS type, name AS message, created_at AS timestamp
      FROM agencies
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Fetch recent listing creations (status 'pending' or 'available')
    const newListingActivities = await pool.query(`
      SELECT 'listing' AS type, title AS message, date_listed AS timestamp
      FROM property_listings
      WHERE status IN ('pending', 'available')
      ORDER BY date_listed DESC
      LIMIT 5
    `);

    // Fetch recent inquiries (initial inquiries)
    const newInquiries = await pool.query(`
      SELECT 'inquiry' AS type, message_content AS message, created_at AS timestamp
      FROM inquiries
      WHERE message_type = 'initial_inquiry'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Combine all activities and sort by timestamp
    const allActivities = [
      ...userSignups.rows.map((row) => ({
        type: row.type,
        message: `New user signed up: ${row.message}`,
        timestamp: row.timestamp,
      })),
      ...agencyCreations.rows.map((row) => ({
        type: row.type,
        message: `New agency created: ${row.message}`,
        timestamp: row.timestamp,
      })),
      ...newListingActivities.rows.map((row) => ({
        type: row.type,
        message: `New listing added: "${row.message}"`,
        timestamp: row.timestamp,
      })),
      ...newInquiries.rows.map((row) => ({
        type: row.type,
        message: `New inquiry received: "${row.message}"`,
        timestamp: row.timestamp,
      })),
    ];

    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Limit to top 10 recent activities

    res.status(200).json({ activities: sortedActivities });
  } catch (err) {
    console.error("Error fetching platform recent activity:", err);
    res
      .status(500)
      .json({
        message: "Failed to fetch platform recent activity.",
        error: err.message,
      });
  }
};

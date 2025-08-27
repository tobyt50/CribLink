const pool = require("../db"); // Assuming your database connection pool is here

// Get count of saved listings for a client
exports.getSavedListingsCount = async (req, res) => {
  const clientId = req.user.user_id;
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM user_favourites WHERE user_id = $1`,
      [clientId],
    );
    res.status(200).json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching saved listings count:", err);
    res.status(500).json({ error: "Failed to fetch saved listings count." });
  }
};

// Get count of recommended listings for a client from their connected agent
exports.getRecommendedListingsCountForClient = async (req, res) => {
  const { clientId, agentId } = req.params; // Expect client ID and agent ID from params
  // Ensure the requesting user is the client themselves or an admin
  if (req.user.role === "client" && parseInt(clientId) !== req.user.user_id) {
    return res
      .status(403)
      .json({
        message:
          "Forbidden: You can only view recommendations for your own account.",
      });
  }

  try {
    const result = await pool.query(
      `SELECT COUNT(*)
             FROM agent_recommended_listings
             WHERE client_id = $1 AND agent_id = $2`,
      [clientId, agentId],
    );
    res.status(200).json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error("Error fetching recommended listings count for client:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch recommended listings count." });
  }
};

// Get recent activity for a client (e.g., new inquiries, agent messages, listing matches)
exports.getClientRecentActivity = async (req, res) => {
  const clientId = req.user.user_id;
  try {
    // Fetch recent inquiries/messages involving this client
    const inquiryActivities = await pool.query(
      `SELECT 'inquiry_update' as type,
                    message_content as message,
                    created_at as timestamp
             FROM inquiries
             WHERE client_id = $1
             ORDER BY created_at DESC
             LIMIT 5`,
      [clientId],
    );

    // Fetch new listing matches (if you have a system for that, otherwise this can be a placeholder)
    // For now, let's simulate or fetch from a simple log if available
    const listingMatchActivities = await pool.query(
      `SELECT 'listing_match' as type,
                    'New listing match found for your preferences: ' || pl.title as message,
                    arm.recommended_at as timestamp -- Changed from arm.matched_at to arm.recommended_at
             FROM agent_recommended_listings arm
             JOIN property_listings pl ON arm.property_id = pl.property_id
             WHERE arm.client_id = $1
             ORDER BY arm.recommended_at DESC -- Changed from arm.matched_at to arm.recommended_at
             LIMIT 5`,
      [clientId],
    );

    // Fetch agent connection activities
    const agentConnectionActivities = await pool.query(
      `SELECT 'agent_connection' as type,
                    CASE
                        WHEN acr.status = 'accepted' AND acr.sender_id = $1 THEN 'You connected with ' || u.full_name
                        WHEN acr.status = 'accepted' AND acr.receiver_id = $1 THEN u.full_name || ' connected with you'
                        WHEN acr.status = 'pending' AND acr.sender_id = $1 THEN 'Connection request sent to ' || u.full_name
                        WHEN acr.status = 'pending' AND acr.receiver_id = $1 THEN u.full_name || ' sent you a connection request'
                        ELSE 'Agent connection activity'
                    END as message,
                    acr.updated_at as timestamp
             FROM agent_client_requests acr
             JOIN users u ON (CASE WHEN acr.sender_id = $1 THEN acr.receiver_id ELSE acr.sender_id END) = u.user_id
             WHERE (acr.sender_id = $1 OR acr.receiver_id = $1)
             ORDER BY acr.updated_at DESC
             LIMIT 5`,
      [clientId],
    );

    // Combine all activities and sort by timestamp
    const allActivities = [
      ...inquiryActivities.rows,
      ...listingMatchActivities.rows,
      ...agentConnectionActivities.rows,
    ];

    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Limit to top 10 recent activities

    res.status(200).json({ activities: sortedActivities });
  } catch (err) {
    console.error("Error fetching client recent activity:", err);
    res.status(500).json({ error: "Failed to fetch client activity." });
  }
};

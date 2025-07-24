const pool = require('../db'); // Assuming your database connection pool is here
const logActivity = require('../utils/logActivity'); // For logging activities

/**
 * @desc Get count of agents affiliated with a specific agency
 * @route GET /api/agency-stats/:agencyId/agents/count
 * @access Private (Agency Admin or Super Admin)
 */
exports.getAgencyAgentCount = async (req, res) => {
    const { agencyId } = req.params;
    const currentUserId = req.user.user_id;
    const currentUserRole = req.user.role;

    try {
        // Authorization: Must be an agency admin of this agency or a super admin
        if (currentUserRole === 'agency_admin') {
            if (req.user.agency_id !== parseInt(agencyId)) {
                return res.status(403).json({ message: 'Forbidden: You are not authorized to view stats for this agency.' });
            }
        } else if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        const result = await pool.query(
            `SELECT COUNT(user_id) FROM users WHERE agency_id = $1 AND role = 'agent'`,
            [agencyId]
        );
        res.status(200).json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error('Error fetching agency agent count:', err);
        res.status(500).json({ message: 'Failed to fetch agency agent count.', error: err.message });
    }
};

/**
 * @desc Get count of agency administrators for a specific agency
 * @route GET /api/agency-stats/:agencyId/admins/count
 * @access Private (Agency Admin or Super Admin)
 */
exports.getAgencyAdminCount = async (req, res) => {
    const { agencyId } = req.params;
    const currentUserId = req.user.user_id;
    const currentUserRole = req.user.role;

    try {
        // Authorization: Must be an agency admin of this agency or a super admin
        if (currentUserRole === 'agency_admin') {
            if (req.user.agency_id !== parseInt(agencyId)) {
                return res.status(403).json({ message: 'Forbidden: You are not authorized to view stats for this agency.' });
            }
        } else if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        const result = await pool.query(
            `SELECT COUNT(user_id) FROM users WHERE agency_id = $1 AND role = 'agency_admin'`,
            [agencyId]
        );
        res.status(200).json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error('Error fetching agency admin count:', err);
        res.status(500).json({ message: 'Failed to fetch agency admin count.', error: err.message });
    }
};


/**
 * @desc Get count of clients who have inquired with agents from a specific agency
 * @route GET /api/agency-stats/:agencyId/clients/count
 * @access Private (Agency Admin or Super Admin)
 */
exports.getAgencyClientCount = async (req, res) => {
    const { agencyId } = req.params;
    const currentUserId = req.user.user_id;
    const currentUserRole = req.user.role;

    try {
        // Authorization: Must be an agency admin of this agency or a super admin
        if (currentUserRole === 'agency_admin') {
            if (req.user.agency_id !== parseInt(agencyId)) {
                return res.status(403).json({ message: 'Forbidden: You are not authorized to view stats for this agency.' });
            }
        } else if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        // Get all agent_ids belonging to this agency
        const agencyAgentsResult = await pool.query(
            `SELECT agent_id FROM agency_members WHERE agency_id = $1 AND request_status = 'accepted'`,
            [agencyId]
        );
        const agentIds = agencyAgentsResult.rows.map(row => row.agent_id);

        if (agentIds.length === 0) {
            return res.status(200).json({ count: 0 });
        }

        // Count distinct clients who have inquired with any of these agents
        const result = await pool.query(
            `SELECT COUNT(DISTINCT client_id)
             FROM inquiries
             WHERE agent_id = ANY($1::int[]) AND client_id IS NOT NULL`, // Ensure client_id is not null (for logged-in clients)
            [agentIds]
        );
        res.status(200).json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error('Error fetching agency client count:', err);
        res.status(500).json({ message: 'Failed to fetch agency client count.', error: err.message });
    }
};

/**
 * @desc Get count of listings associated with a specific agency
 * @route GET /api/agency-stats/:agencyId/listings/count
 * @access Private (Agency Admin or Super Admin)
 */
exports.getAgencyListingsCount = async (req, res) => {
    const { agencyId } = req.params;
    const currentUserId = req.user.user_id;
    const currentUserRole = req.user.role;

    try {
        // Authorization: Must be an agency admin of this agency or a super admin
        if (currentUserRole === 'agency_admin') {
            if (req.user.agency_id !== parseInt(agencyId)) {
                return res.status(403).json({ message: 'Forbidden: You are not authorized to view stats for this agency.' });
            }
        } else if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        const result = await pool.query(
            `SELECT COUNT(pl.property_id)
             FROM property_listings pl
             WHERE pl.agency_id = $1`,
            [agencyId]
        );
        res.status(200).json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error('Error fetching agency listings count:', err);
        res.status(500).json({ message: 'Failed to fetch agency listings count.', error: err.message });
    }
};

/**
 * @desc Get count of pending listings for a specific agency
 * @route GET /api/agency-stats/:agencyId/listings/pending-approvals
 * @access Private (Agency Admin or Super Admin)
 */
exports.getAgencyPendingApprovalsCount = async (req, res) => {
    const { agencyId } = req.params;
    const currentUserId = req.user.user_id;
    const currentUserRole = req.user.role;

    try {
        // Authorization: Must be an agency admin of this agency or a super admin
        if (currentUserRole === 'agency_admin') {
            if (req.user.agency_id !== parseInt(agencyId)) {
                return res.status(403).json({ message: 'Forbidden: You are not authorized to view stats for this agency.' });
            }
        } else if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        const result = await pool.query(
            `SELECT COUNT(pl.property_id)
             FROM property_listings pl
             WHERE pl.agency_id = $1 AND TRIM(LOWER(pl.status)) = 'pending'`,
            [agencyId]
        );
        res.status(200).json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error('Error fetching agency pending listings count:', err);
        res.status(500).json({ message: 'Failed to fetch agency pending listings count.', error: err.message });
    }
};

/**
 * @desc Get recent activity for a specific agency (inquiries, new agents, listings)
 * @route GET /api/agency-stats/:agencyId/recent-activity
 * @access Private (Agency Admin or Super Admin)
 */
exports.getAgencyRecentActivity = async (req, res) => {
    const { agencyId } = req.params;
    const currentUserId = req.user.user_id;
    const currentUserRole = req.user.role;

    try {
        // Authorization: Must be an agency admin of this agency or a super admin
        if (currentUserRole === 'agency_admin') {
            if (req.user.agency_id !== parseInt(agencyId)) {
                return res.status(403).json({ message: 'Forbidden: You are not authorized to view activity for this agency.' });
            }
        } else if (currentUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        // Get all agent_ids belonging to this agency
        const agencyMembersResult = await pool.query(
            `SELECT user_id, role FROM users WHERE agency_id = $1 AND (role = 'agent' OR role = 'agency_admin')`,
            [agencyId]
        );
        const agentIds = agencyMembersResult.rows.filter(m => m.role === 'agent').map(row => row.user_id);
        const adminIds = agencyMembersResult.rows.filter(m => m.role === 'agency_admin').map(row => row.user_id);


        // Fetch recent inquiries related to agents in this agency
        const inquiries = await pool.query(`
            SELECT
                'inquiry' AS type,
                i.message_content AS message,
                i.status,
                i.created_at,
                COALESCE(u_client.full_name, i.name) AS client_name
            FROM inquiries i
            LEFT JOIN users u_client ON i.client_id = u_client.user_id
            WHERE i.agent_id = ANY($1::int[]) -- Filter by agents in this agency
            ORDER BY i.created_at DESC
            LIMIT 5
        `, [agentIds.length > 0 ? agentIds : [0]]); // Pass [0] if no agents to prevent error

        // Fetch recent agent joins for this agency
        const newAgents = await pool.query(`
            SELECT 'agent_join' AS type, full_name, date_joined AS timestamp
            FROM users
            WHERE agency_id = $1 AND role = 'agent'
            ORDER BY date_joined DESC
            LIMIT 5
        `, [agencyId]);

        // Fetch recent listings created by agents/admins in this agency
        const newListings = await pool.query(`
            SELECT 'listing' AS type, pl.title AS message, pl.date_listed AS timestamp
            FROM property_listings pl
            WHERE pl.agency_id = $1
            ORDER BY pl.date_listed DESC
            LIMIT 5
        `, [agencyId]);

        // Combine all activities and sort by timestamp
        const allActivities = [
            ...inquiries.rows.map(row => ({
                type: 'inquiry',
                message: `New inquiry from ${row.client_name}: "${row.message}" (Status: ${row.status})`,
                timestamp: row.created_at
            })),
            ...newAgents.rows.map(row => ({
                type: 'agent_join',
                message: `New Agent joined: ${row.full_name}`,
                timestamp: row.timestamp
            })),
            ...newListings.rows.map(row => ({
                type: 'listing',
                message: `New Listing added: "${row.message}"`,
                timestamp: row.timestamp
            }))
        ];

        const sortedActivities = allActivities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10); // Limit to top 10 recent activities

        res.status(200).json({ activities: sortedActivities });
    } catch (err) {
        console.error('Error fetching agency recent activity:', err);
        res.status(500).json({ message: 'Failed to fetch agency recent activity.', error: err.message });
    }
};

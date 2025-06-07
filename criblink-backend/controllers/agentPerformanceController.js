// controllers/agentPerformanceController.js

// Corrected path to your database connection file (index.js)
// assuming it's located in the 'db/' directory at the root of your project.
const { pool } = require('../db/index'); // Path: From 'controllers/' go up to 'project-root/', then into 'db/index'

/**
 * @namespace AgentPerformanceController
 * @description Controller functions for managing agent performance data.
 */
const AgentPerformanceController = {
    /**
     * @function getAgentPerformance
     * @description Fetches agent performance data with optional search and pagination.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @returns {void}
     */
    getAgentPerformance: async (req, res) => {
        const { search, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        try {
            let query = `SELECT user_id, full_name, deals_closed, revenue, avg_rating,
                         properties_assigned, client_feedback, region, commission_earned
                         FROM agent_performance`;
            let countQuery = `SELECT COUNT(*) FROM agent_performance`;
            const queryParams = [];
            const countParams = [];

            if (search) {
                // Add search condition for full_name or region
                query += ` WHERE full_name ILIKE $1 OR region ILIKE $2`;
                countQuery += ` WHERE full_name ILIKE $1 OR region ILIKE $2`;
                queryParams.push(`%${search}%`, `%${search}%`);
                countParams.push(`%${search}%`, `%${search}%`);
            }

            // Order by a default or specific column (e.g., full_name ASC)
            // Note: For dynamic sorting, you'd add query parameters for sortKey and sortDirection
            query += ` ORDER BY full_name ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            queryParams.push(parseInt(limit), offset);

            const [performanceResult, totalCountResult] = await Promise.all([
                pool.query(query, queryParams),
                pool.query(countQuery, countParams)
            ]);

            const performance = performanceResult.rows;
            const total = parseInt(totalCountResult.rows[0].count, 10);
            const totalPages = Math.ceil(total / parseInt(limit));

            res.status(200).json({
                performance,
                total,
                totalPages,
                currentPage: parseInt(page)
            });
        } catch (error) {
            console.error('Error fetching agent performance:', error);
            res.status(500).json({ message: 'Error fetching agent performance data', error: error.message });
        }
    },

    /**
     * @function addAgentPerformance
     * @description Adds a new agent performance entry.
     * @param {Object} req - Express request object (body should contain performance data).
     * @param {Object} res - Express response object.
     * @returns {void}
     */
    addAgentPerformance: async (req, res) => {
        const {
            user_id, full_name, deals_closed, revenue, avg_rating,
            properties_assigned, client_feedback, region, commission_earned
        } = req.body;

        try {
            // Basic validation
            if (!user_id || !full_name) {
                return res.status(400).json({ message: 'User ID and full name are required.' });
            }

            const result = await pool.query(
                `INSERT INTO agent_performance (user_id, full_name, deals_closed, revenue, avg_rating,
                                                properties_assigned, client_feedback, region, commission_earned)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`, // RETURNING * allows you to get the inserted row back
                [user_id, full_name, deals_closed || 0, revenue || 0, avg_rating || 0.0,
                 properties_assigned || 0, client_feedback || null, region || null, commission_earned || 0]
            );
            res.status(201).json({ message: 'Agent performance entry added successfully', entry: result.rows[0] });
        } catch (error) {
            console.error('Error adding agent performance entry:', error);
            // Handle unique constraint violation for user_id
            if (error.code === '23505') { // PostgreSQL unique violation error code
                return res.status(409).json({ message: 'A performance entry for this user ID already exists.' });
            }
            res.status(500).json({ message: 'Error adding agent performance entry', error: error.message });
        }
    },

    /**
     * @function updateAgentPerformance
     * @description Updates an existing agent performance entry by user_id.
     * @param {Object} req - Express request object (params.userId for ID, body for data).
     * @param {Object} res - Express response object.
     * @returns {void}
     */
    updateAgentPerformance: async (req, res) => {
        const { userId } = req.params;
        const {
            full_name, deals_closed, revenue, avg_rating,
            properties_assigned, client_feedback, region, commission_earned
        } = req.body;

        try {
            const result = await pool.query(
                `UPDATE agent_performance
                 SET full_name = COALESCE($1, full_name),
                     deals_closed = COALESCE($2, deals_closed),
                     revenue = COALESCE($3, revenue),
                     avg_rating = COALESCE($4, avg_rating),
                     properties_assigned = COALESCE($5, properties_assigned),
                     client_feedback = COALESCE($6, client_feedback),
                     region = COALESCE($7, region),
                     commission_earned = COALESCE($8, commission_earned)
                 WHERE user_id = $9
                 RETURNING *`,
                [full_name, deals_closed, revenue, avg_rating,
                 properties_assigned, client_feedback, region, commission_earned, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Agent performance entry not found.' });
            }
            res.status(200).json({ message: 'Agent performance entry updated successfully', entry: result.rows[0] });
        } catch (error) {
            console.error('Error updating agent performance entry:', error);
            res.status(500).json({ message: 'Error updating agent performance entry', error: error.message });
        }
    },

    /**
     * @function deleteAgentPerformance
     * @description Deletes an agent performance entry by user_id.
     * @param {Object} req - Express request object (params.userId for ID).
     * @param {Object} res - Express response object.
     * @returns {void}
     */
    deleteAgentPerformance: async (req, res) => {
        const { userId } = req.params;
        try {
            const result = await pool.query(
                `DELETE FROM agent_performance WHERE user_id = $1 RETURNING user_id`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Agent performance entry not found.' });
            }
            res.status(200).json({ message: 'Agent performance entry deleted successfully' });
        } catch (error) {
            console.error('Error deleting agent performance entry:', error);
            res.status(500).json({ message: 'Error deleting agent performance entry', error: error.message });
        }
    }
};

module.exports = AgentPerformanceController;

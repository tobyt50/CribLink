// controllers/inquiriesController.js
const pool = require('../db');
const { query } = require('../db');
const logActivity = require('../utils/logActivity');

// POST /inquiries
const createInquiry = async (req, res) => {
  const { client_id, agent_id, property_id, name, email, phone, message } = req.body;

  if (!property_id || !name || !email || !message) { // agent_id and client_id can be null now
    return res.status(400).json({ error: 'Missing required inquiry fields (property, name, email, message).' });
  }

  try {
    // Determine initial status based on agent_id presence
    const initialStatus = agent_id ? 'assigned' : 'new';
    // Use agent_id for assigned_agent if present, otherwise null
    const assignedAgentId = agent_id || null;

    const result = await query(
      'INSERT INTO inquiries (client_id, agent_id, property_id, name, email, phone, message, status, assigned_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [client_id, agent_id, property_id, name, email, phone, message, initialStatus, assignedAgentId] // Set status and assigned_agent
    );

    // Log the activity of a new inquiry being created
    await logActivity(`Client ${client_id || 'Guest'} sent an inquiry for property ${property_id} to agent ${agent_id || 'N/A'}. Status: ${initialStatus}.`, req.user, 'inquiry');

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /agent/inquiries (for agents/admins to see all their inquiries)
const getAllInquiries = async (req, res) => {
  try {
    const { search, page, limit, sort, direction } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let orderBy = 'created_at'; // Default sort key
    let orderDirection = 'DESC'; // Default sort direction

    // Validate and set sort key
    const validSortKeys = ['inquiry_id', 'name', 'email', 'phone', 'message', 'status', 'assigned_agent', 'created_at'];
    if (sort && validSortKeys.includes(sort)) {
      orderBy = sort;
    }

    // Validate and set sort direction
    if (direction && ['asc', 'desc'].includes(direction.toLowerCase())) {
      orderDirection = direction.toUpperCase();
    }

    let whereClause = '';
    const queryParams = [];
    let paramIndex = 1;

    // Filter by assigned agent for agents
    if (req.user.role === 'agent') {
        whereClause += ` WHERE assigned_agent = $${paramIndex}`;
        queryParams.push(req.user.user_id); // Use user_id from token
        paramIndex++;
    }

    if (search) {
      if (whereClause === '') {
        whereClause += ` WHERE (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
      } else {
        whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
      }
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const totalResult = await query(`SELECT COUNT(*) FROM inquiries ${whereClause}`, queryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Get inquiries with pagination and sorting
    const result = await query(
      `SELECT * FROM inquiries ${whereClause} ORDER BY ${orderBy} ${orderDirection} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limitNum, offset]
    );

    res.json({
      inquiries: result.rows,
      total: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /agent/inquiries/:id/assign
const assignInquiry = async (req, res) => {
  const { id } = req.params;
  const { agent_id } = req.body; // Expecting agent_id (numeric user_id)

  if (!agent_id) {
    return res.status(400).json({ error: 'Agent ID is required for assignment.' });
  }

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

// PUT /agent/inquiries/:id/resolve
const resolveInquiry = async (req, res) => {
  const { id } = req.params;
  const { agent_response, client_email } = req.body;

  if (!agent_response) {
    return res.status(400).json({ error: 'Agent response is required to resolve inquiry.' });
  }

  try {
    await query(
      'UPDATE inquiries SET status = $1, agent_response = $2, updated_at = NOW() WHERE inquiry_id = $3',
      ['resolved', agent_response, id]
    );

    await logActivity(`Resolved inquiry ID ${id}. Agent message sent to ${client_email}.`, req.user, 'inquiry');

    res.sendStatus(200);
  } catch (err) {
    console.error('Error resolving inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /agent/inquiries/:id
const deleteInquiry = async (req, res) => {
  const { id } = req.params;

  try {
    await query('DELETE FROM inquiries WHERE inquiry_id = $1', [id]);

    await logActivity(`Deleted inquiry ID ${id}`, req.user, 'inquiry');

    res.sendStatus(204); // No Content
  } catch (err) {
    console.error('Error deleting inquiry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createInquiry,
  getAllInquiries,
  assignInquiry,
  resolveInquiry,
  deleteInquiry,
};

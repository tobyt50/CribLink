// controllers/inquiriesController.js
const pool = require('../db');
const { query } = require('../db');
const logActivity = require('../utils/logActivity');

// GET /admin/inquiries
const getAllInquiries = async (req, res) => {
  try {
    const { search, page, limit, sort, direction } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let orderBy = 'inquiry_id'; // Default sort key
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

    if (search) {
      whereClause += ` WHERE (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Fetch total count for pagination
    const countResult = await query(`SELECT COUNT(*) FROM inquiries${whereClause}`, queryParams);
    const total = parseInt(countResult.rows[0].count, 10);

    // Fetch inquiries with pagination and sorting
    const result = await query(
      `SELECT * FROM inquiries${whereClause} ORDER BY ${orderBy} ${orderDirection} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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

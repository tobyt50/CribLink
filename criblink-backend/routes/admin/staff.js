// /routes/admin/staff.js
const express = require('express');
const router = express.Router();
const pool = require('../../db'); // Assuming your db connection is here

// GET staff members with optional filters, search, sorting, and conditional pagination
router.get('/staff', async (req, res) => {
  // Extract query parameters. Do NOT provide default values for page/limit here
  // so we can check if they were explicitly provided by the frontend.
  const {
    search = '',
    department,
    status,
    page, // page will be undefined if not provided
    limit, // limit will be undefined if not provided
    sort = 'start_date', // Default sort column
    direction = 'desc' // Default sort direction
  } = req.query;

  let whereClauses = []; // Array to hold WHERE clause conditions
  let values = []; // Array to hold values for parameterized query

  // Add search condition if search query is provided
  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    // Search in full_name or email (case-insensitive)
    whereClauses.push(`(LOWER(full_name) LIKE $${values.length} OR LOWER(email) LIKE $${values.length})`);
  }

  // Add department filter condition if department is provided
  if (department) {
    values.push(department);
    whereClauses.push(`department = $${values.length}`);
  }

  // Add status filter condition if status is provided
  if (status) {
    values.push(status);
    whereClauses.push(`status = $${values.length}`);
  }

  // Construct the WHERE clause string
  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Determine the column to sort by and the sort order
  const validSortColumns = ['employee_id', 'full_name', 'role', 'department', 'email', 'phone', 'start_date', 'status', 'user_id']; // Added user_id as a valid sort column
  const orderByColumn = validSortColumns.includes(sort) ? sort : 'start_date'; // Use default if sort column is invalid
  const orderByDirection = direction.toLowerCase() === 'asc' ? 'ASC' : 'DESC'; // Use ASC or DESC

  // Base query text without LIMIT and OFFSET
  let queryText = `SELECT employee_id, full_name, role, department, email, phone, start_date, status, user_id
                   FROM staff_directory
                   ${whereSQL}
                   ORDER BY ${orderByColumn} ${orderByDirection}`;

  let countQueryText = `SELECT COUNT(*) FROM staff_directory ${whereSQL}`;
  let totalCount = 0;

  try {
      // First, get the total count of staff members matching the filters (regardless of pagination)
      const countRes = await pool.query(countQueryText, values);
      totalCount = parseInt(countRes.rows[0].count);

      // Conditionally add LIMIT and OFFSET if page and limit are provided (for paginated requests)
      if (page !== undefined && limit !== undefined) {
          const parsedPage = parseInt(page);
          const parsedLimit = parseInt(limit);

          // Validate parsed page and limit
          if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedLimit) || parsedLimit < 1) {
              return res.status(400).json({ error: 'Invalid page or limit parameter' });
          }

          const offset = (parsedPage - 1) * parsedLimit;
          queryText += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
          // Add limit and offset values to the values array for the main query
          values.push(parsedLimit, offset);
      }

      // Execute the main query (with or without LIMIT/OFFSET)
      const staffRes = await pool.query(queryText, values);

      // Send the staff data and total count in the response
      res.json({
        staff: staffRes.rows,
        total: totalCount, // Include total count for pagination metadata
        // Only include page and limit in the response if they were part of the request
        ...(page !== undefined && limit !== undefined && { page: parseInt(page), limit: parseInt(limit) })
      });

  } catch (err) {
    console.error('Error fetching staff:', err.message);
    res.status(500).json({ error: 'Internal server error' }); // Send internal server error response
  }
});

// Placeholder routes for staff actions (similar to users.js)
// You will need to implement the actual logic for these based on your needs

// GET a single staff member by ID
router.get('/staff/:id', async (req, res) => {
    const staffId = req.params.id;
    try {
        // Implement logic to fetch a single staff member
        res.status(501).json({ message: `GET staff member ${staffId} not implemented` });
    } catch (err) {
        console.error('Error fetching staff member:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE staff member details
router.put('/staff/:id', async (req, res) => {
    const staffId = req.params.id;
    const updatedDetails = req.body; // Get updated details from request body
    try {
        // Implement logic to update staff member details
         res.status(501).json({ message: `UPDATE staff member ${staffId} not implemented` });
    } catch (err) {
        console.error('Error updating staff member:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE a staff member
router.delete('/staff/:id', async (req, res) => {
    const staffId = req.params.id;
    try {
        // Implement logic to delete a staff member
        // Example: await pool.query('DELETE FROM staff_directory WHERE employee_id = $1', [staffId]);
        res.status(501).json({ message: `DELETE staff member ${staffId} not implemented` });
    } catch (err) {
        console.error('Error deleting staff member:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE staff member status (e.g., suspend/activate)
router.put('/staff/:id/status', async (req, res) => {
    const staffId = req.params.id;
    const { status } = req.body; // Get new status from request body
     const validStatus = ['active', 'suspended', 'terminated']; // Define valid statuses
    if (!validStatus.includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided' });
    }
    try {
        // Implement logic to update staff member status
         res.status(501).json({ message: `UPDATE staff member ${staffId} status not implemented` });
    } catch (err) {
        console.error('Error updating staff member status:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to reset staff member password (requires careful implementation)
router.post('/staff/:id/reset-password', async (req, res) => {
    const staffId = req.params.id;
    try {
        // Implement secure password reset logic (e.g., send reset link/email)
        res.status(501).json({ message: `Reset password for staff member ${staffId} not implemented` });
    } catch (err) {
        console.error('Error resetting staff password:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router; // Export the router

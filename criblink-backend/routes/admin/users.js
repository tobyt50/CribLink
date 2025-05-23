const express = require('express');
const router = express.Router();
// Corrected import: Destructure the 'pool' property from the exported object
const { pool, query } = require('../../db'); 
const logActivity = require('../../utils/logActivity'); // Corrected path to logActivity

// GET users with optional filters, search, sorting, and conditional pagination
router.get('/users', async (req, res) => {
  // Extract query parameters. Do NOT provide default values for page/limit here
  // so we can check if they were explicitly provided by the frontend.
  const {
    search = '',
    role,
    status,
    page, // page will be undefined if not provided
    limit, // limit will be undefined if not provided
    sort = 'date_joined', // Default sort column
    direction = 'desc' // Default sort direction
  } = req.query;

  let whereClauses = [];
  let values = [];

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    whereClauses.push(`(LOWER(full_name) LIKE $${values.length} OR LOWER(email) LIKE $${values.length})`);
  }

  if (role) {
    values.push(role);
    whereClauses.push(`role = $${values.length}`);
  }

  if (status) {
    values.push(status);
    whereClauses.push(`status = $${values.length}`);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Determine the column to sort by and the sort order
  const validSortColumns = ['user_id', 'full_name', 'email', 'role', 'status', 'date_joined']; // Valid columns for sorting
  const orderByColumn = validSortColumns.includes(sort) ? sort : 'date_joined'; // Use default if sort column is invalid
  const orderByDirection = direction.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Base query text without LIMIT and OFFSET
  let queryText = `SELECT user_id, full_name, email, role, status, date_joined
                   FROM users
                   ${whereSQL}
                   ORDER BY ${orderByColumn} ${orderByDirection}`;

  let countQueryText = `SELECT COUNT(*) FROM users ${whereSQL}`;
  let totalCount = 0;

  try {
      // First, get the total count of users matching the filters (regardless of pagination)
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
      const usersRes = await pool.query(queryText, values);

      // Send the user data and total count in the response
      res.json({
        users: usersRes.rows,
        total: totalCount, // Include total count for pagination metadata
        // Only include page and limit in the response if they were part of the request
        ...(page !== undefined && limit !== undefined && { page: parseInt(page), limit: parseInt(limit) })
      });

  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Promote/demote role with protection for last admin
router.post('/users/:id/role', async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const validRoles = ['user', 'agent', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const userRes = await pool.query('SELECT role FROM users WHERE user_id = $1', [userId]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

    const currentRole = userRes.rows[0].role;

    if (currentRole === 'admin' && role !== 'admin') {
      const countRes = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
      if (parseInt(countRes.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last remaining admin.' });
      }
    }

    const updateRes = await pool.query(
      'UPDATE users SET role = $1 WHERE user_id = $2 RETURNING *',
      [role, userId]
    );

    res.json({ message: 'Role updated', user: updateRes.rows[0] });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// New endpoint for updating user role (admin action)
router.put('/users/:userId/role', async (req, res) => {
  const { newRole } = req.body; // Get newRole from the request body
  const { userId } = req.params; // Get userId from the URL parameters
  // Removed manual userName construction; logActivity will handle it.
  const validRoles = ['client', 'agent', 'admin']; // Define valid roles

  if (!validRoles.includes(newRole)) { // Validate the new role
      return res.status(400).json({ message: 'Invalid role provided.' });
  }

  try {
      await pool.query(`UPDATE users SET role = $1 WHERE user_id = $2`, [newRole, userId]); // Update the user's role in the database
      res.json({ message: 'User role updated' }); // Send success response

      // FIX: Removed "by ${userName}" from the message string.
      // logActivity will now correctly derive the actor's name from req.user.
      await logActivity(`Updated role of user ID ${userId} to "${newRole}"`, req.user, 'user');

  } catch (err) {
      console.error('Error updating user role:', err.message);
      res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
});

// Ban or unban user
router.put('/users/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatus = ['active', 'banned'];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await pool.query('UPDATE users SET status = $1 WHERE user_id = $2', [status, req.params.id]);
    res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    console.error('Error updating user status:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const userIdToDelete = req.params.id;
  const client = await pool.connect(); // Get a client from the connection pool

  try {
    await client.query('BEGIN'); // Start a transaction

    // 1. Delete associated activity logs
    await client.query('DELETE FROM activity_logs WHERE user_id = $1', [userIdToDelete]);

    // 2. Delete the user
    const deleteUserRes = await client.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [userIdToDelete]);

    if (deleteUserRes.rowCount === 0) {
      await client.query('ROLLBACK'); // Rollback if user not found
      return res.status(404).json({ error: 'User not found.' });
    }

    await client.query('COMMIT'); // Commit the transaction if all operations succeed

    // Log the activity after successful deletion
    // Removed manual actingUser construction; logActivity will handle it.
    // FIX: Removed "by ${actingUser}" from the message string.
    // logActivity will now correctly derive the actor's name from req.user.
    await logActivity(`Deleted user ID: ${userIdToDelete}`, req.user, 'user_deletion');

    res.json({ message: 'User and associated activity logs deleted successfully.' });

  } catch (err) {
    await client.query('ROLLBACK'); // Rollback the transaction on error
    console.error('Error deleting user and activity logs:', err.message);
    res.status(500).json({ error: 'Internal server error during user deletion.' });
  } finally {
    client.release(); // Release the client back to the pool
  }
});

module.exports = router;

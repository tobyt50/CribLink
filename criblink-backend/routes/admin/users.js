const express = require("express");
const router = express.Router();
const { pool } = require("../../db");
const logActivity = require("../../utils/logActivity");

// GET users with optional filters, search, sorting, and conditional pagination
router.get("/users", async (req, res) => {
  const {
    search = "",
    role,
    status,
    subscription,
    page,
    limit,
    sort = "date_joined",
    direction = "desc",
  } = req.query;

  let whereClauses = [];
  let values = [];

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    whereClauses.push(
      `(LOWER(u.full_name) LIKE $${values.length} OR LOWER(u.email) LIKE $${values.length})`,
    );
  }

  if (role) {
    values.push(role);
    whereClauses.push(`u.role = $${values.length}`);
  }

  if (status) {
    values.push(status);
    whereClauses.push(`u.status = $${values.length}`);
  }

  if (subscription) {
    if (subscription === "none") {
      whereClauses.push(
        `(u.role = 'agency_admin' AND (a.subscription_type IS NULL OR a.subscription_type = '')) OR (u.role != 'agency_admin' AND (u.subscription_type IS NULL OR u.subscription_type = ''))`,
      );
    } else {
      values.push(subscription);
      whereClauses.push(
        `(u.role = 'agency_admin' AND a.subscription_type = $${values.length}) OR (u.role != 'agency_admin' AND u.subscription_type = $${values.length})`,
      );
    }
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const validSortColumns = [
    "user_id",
    "full_name",
    "email",
    "role",
    "status",
    "date_joined",
    "subscription_type",
    "featured_priority",
  ];
  const orderByColumn = validSortColumns.includes(sort) ? sort : "date_joined";
  const orderByDirection = direction.toLowerCase() === "asc" ? "ASC" : "DESC";

  let queryText = `
    SELECT
      u.user_id,
      u.full_name,
      u.email,
      u.role,
      u.status,
      u.date_joined,
      u.profile_picture_url,
      u.agency_id,
      CASE
        WHEN u.role = 'agency_admin' THEN a.subscription_type
        ELSE u.subscription_type
      END AS subscription_type,
      CASE
        WHEN u.role = 'agency_admin' THEN a.featured_priority
        ELSE u.featured_priority
      END AS featured_priority
    FROM users u
    LEFT JOIN agencies a ON u.agency_id = a.agency_id
    ${whereSQL}
    ORDER BY ${orderByColumn} ${orderByDirection}
  `;

  let countQueryText = `SELECT COUNT(*) FROM users u LEFT JOIN agencies a ON u.agency_id = a.agency_id ${whereSQL}`;
  let totalCount = 0;

  try {
    const countRes = await pool.query(countQueryText, values);
    totalCount = parseInt(countRes.rows[0].count);

    if (page !== undefined && limit !== undefined) {
      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);

      if (
        isNaN(parsedPage) ||
        parsedPage < 1 ||
        isNaN(parsedLimit) ||
        parsedLimit < 1
      ) {
        return res
          .status(400)
          .json({ error: "Invalid page or limit parameter" });
      }

      const offset = (parsedPage - 1) * parsedLimit;
      queryText += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(parsedLimit, offset);
    }

    const usersRes = await pool.query(queryText, values);

    res.json({
      users: usersRes.rows,
      total: totalCount,
      ...(page !== undefined &&
        limit !== undefined && {
          page: parseInt(page),
          limit: parseInt(limit),
        }),
    });
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Promote/demote role with protection for last admin
router.post("/users/:id/role", async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const validRoles = ["client", "agent", "admin", "agency_admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const userRes = await pool.query(
      "SELECT role FROM users WHERE user_id = $1",
      [userId],
    );
    if (userRes.rowCount === 0)
      return res.status(404).json({ error: "User not found" });

    const currentRole = userRes.rows[0].role;

    if (currentRole === "admin" && role !== "admin") {
      const countRes = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = $1",
        ["admin"],
      );
      if (parseInt(countRes.rows[0].count) <= 1) {
        return res
          .status(400)
          .json({ error: "Cannot demote the last remaining admin." });
      }
    }

    const updateRes = await pool.query(
      "UPDATE users SET role = $1 WHERE user_id = $2 RETURNING *",
      [role, userId],
    );

    await logActivity(
      `Updated role of user ID ${userId} to "${role}"`,
      req.user,
      "user_role_change",
    );
    res.json({ message: "Role updated", user: updateRes.rows[0] });
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update user role (admin action)
router.put("/users/:userId/role", async (req, res) => {
  const { newRole } = req.body;
  const { userId } = req.params;
  const validRoles = ["client", "agent", "admin", "agency_admin"];

  if (!validRoles.includes(newRole)) {
    return res.status(400).json({ message: "Invalid role provided." });
  }

  try {
    await pool.query(`UPDATE users SET role = $1 WHERE user_id = $2`, [
      newRole,
      userId,
    ]);
    await logActivity(
      `Updated role of user ID ${userId} to "${newRole}"`,
      req.user,
      "user_role_change",
    );
    res.json({ message: "User role updated" });
  } catch (err) {
    console.error("Error updating user role:", err.message);
    res
      .status(500)
      .json({ message: "Failed to update role", error: err.message });
  }
});

// Ban or unban user
router.put("/users/:id/status", async (req, res) => {
  const { status } = req.body;
  const validStatus = ["active", "banned"];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    await pool.query("UPDATE users SET status = $1 WHERE user_id = $2", [
      status,
      req.params.id,
    ]);
    await logActivity(
      `Updated status of user ID ${req.params.id} to "${status}"`,
      req.user,
      "user_status_change",
    );
    res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    console.error("Error updating user status:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete user and associated activity logs
router.delete("/users/:id", async (req, res) => {
  const userIdToDelete = req.params.id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM activity_logs WHERE user_id = $1", [
      userIdToDelete,
    ]);
    const deleteUserRes = await client.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING *",
      [userIdToDelete],
    );

    if (deleteUserRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found." });
    }

    await client.query("COMMIT");
    await logActivity(
      `Deleted user ID: ${userIdToDelete}`,
      req.user,
      "user_deletion",
    );
    res.json({
      message: "User and associated activity logs deleted successfully.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting user and activity logs:", err.message);
    res
      .status(500)
      .json({ error: "Internal server error during user deletion." });
  } finally {
    client.release();
  }
});

// NEW: Update user subscription and featured priority
router.put("/users/:userId/subscription", async (req, res) => {
  const { userId } = req.params;
  const { subscription_type } = req.body;
  const validSubscriptions = ["", "basic", "pro", "enterprise"];

  if (!validSubscriptions.includes(subscription_type)) {
    return res.status(400).json({ error: "Invalid subscription type" });
  }

  const featuredPriorityMap = {
    "": 0,
    basic: 1,
    pro: 2,
    enterprise: 3,
  };
  const featured_priority = featuredPriorityMap[subscription_type];

  try {
    const userRes = await pool.query(
      "SELECT role, agency_id FROM users WHERE user_id = $1",
      [userId],
    );
    if (userRes.rowCount === 0)
      return res.status(404).json({ error: "User not found" });

    const { role, agency_id } = userRes.rows[0];

    if (role === "agency_admin" && agency_id) {
      // Update agency's subscription and priority if user is agency_admin
      await pool.query(
        "UPDATE agencies SET subscription_type = $1, featured_priority = $2 WHERE agency_id = $3",
        [subscription_type, featured_priority, agency_id],
      );
    } else {
      // Update user's subscription and priority
      await pool.query(
        "UPDATE users SET subscription_type = $1, featured_priority = $2 WHERE user_id = $3",
        [subscription_type, featured_priority, userId],
      );
    }

    await logActivity(
      `Updated subscription of user ID ${userId} to "${subscription_type}" with priority ${featured_priority}`,
      req.user,
      "user_subscription_change",
    );
    res.json({ message: "Subscription and priority updated" });
  } catch (err) {
    console.error("Error updating subscription:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

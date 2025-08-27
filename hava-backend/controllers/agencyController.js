// hava-backend/controllers/agencyController.js
const db = require("../db/index"); // Assuming your database connection pool is here
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryPublicId,
} = require("../utils/cloudinary");
const logActivity = require("../utils/logActivity");
const jwt = require("jsonwebtoken");
const SUBSCRIPTION_TIERS = require("../config/subscriptionConfig"); // NEW: Import subscription config

const SECRET_KEY = process.env.JWT_KEY || "lionel_messi_10_is_the_goat!";

/**
 * @desc Create a new agency
 * @route POST /api/agencies
 * @access Private (Admin only)
 */
exports.createAgency = async (req, res) => {
  const {
    name,
    email,
    phone,
    website,
    description,
    logoBase64,
    logoOriginalname,
    address,
  } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    let logo_url = null;
    let logo_public_id = null;

    if (logoBase64) {
      const isIco =
        logoOriginalname && logoOriginalname.toLowerCase().endsWith(".ico");
      const resourceType = isIco ? "raw" : "image";
      const uploadRes = await uploadToCloudinary(
        logoBase64,
        logoOriginalname || "agency_logo.png",
        "hava/agency_logos",
        resourceType,
      );
      logo_url = uploadRes.url;
      logo_public_id = uploadRes.publicId;
    }

    // UPDATE: Add default subscription fields on creation
    const result = await client.query(
      `INSERT INTO agencies (name, email, phone, website, description, logo_url, logo_public_id, address, subscription_type, featured_priority)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'basic', 0) RETURNING *`,
      [
        name,
        email,
        phone,
        website,
        description,
        logo_url,
        logo_public_id,
        address,
      ],
    );

    await client.query("COMMIT");
    logActivity(
      "Agency Created",
      `Admin created new agency: ${name}`,
      req.user.user_id,
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating agency:", error);
    res
      .status(500)
      .json({ message: "Server error creating agency.", error: error.message });
  } finally {
    client.release();
  }
};

/**
 * @desc Agent registers a new agency and becomes agency_admin
 * @route POST /api/agencies/register-agent-agency
 * @access Private (Agent only)
 */
exports.registerAgentAgency = async (req, res) => {
  const {
    name,
    address,
    phone,
    email,
    website,
    description,
    logoBase64,
    logoOriginalname,
  } = req.body;
  const userId = req.user.user_id;
  const userRole = req.user.role;

  let client;
  try {
    client = await db.pool.connect();
    await client.query("BEGIN");

    if (userRole !== "agent") {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden: Only agents can register new agencies." });
    }
    if (!name || !email || !phone) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Agency name, email, and phone are required." });
    }

    const existingActiveMembership = await client.query(
      `SELECT agency_id, request_status FROM agency_members WHERE agent_id = $1 AND (request_status = 'accepted' OR request_status = 'pending')`,
      [userId],
    );
    if (existingActiveMembership.rows.length > 0) {
      const status =
        existingActiveMembership.rows[0].request_status === "accepted"
          ? "connected to"
          : "have a pending request with";
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({
          message: `You are already ${status} another agency. An agent can only be affiliated with one agency at a time.`,
        });
    }

    const existingAgency = await client.query(
      "SELECT 1 FROM agencies WHERE name = $1 OR email = $2",
      [name, email],
    );
    if (existingAgency.rows.length > 0) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ message: "An agency with this name or email already exists." });
    }

    let logo_url = null;
    let logo_public_id = null;
    if (logoBase64) {
      const isIco =
        logoOriginalname && logoOriginalname.toLowerCase().endsWith(".ico");
      const resourceType = isIco ? "raw" : "image";
      const uploadRes = await uploadToCloudinary(
        logoBase64,
        logoOriginalname || "agency_logo.png",
        "hava/agency_logos",
        resourceType,
      );
      logo_url = uploadRes.url;
      logo_public_id = uploadRes.publicId;
    }

    // UPDATE: Add default subscription fields on creation
    const agencyInsertResult = await client.query(
      `INSERT INTO agencies (name, address, phone, email, website, description, logo_url, logo_public_id, agency_admin_id, subscription_type, featured_priority)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'basic', 0) RETURNING agency_id`,
      [
        name,
        address,
        phone,
        email,
        website,
        description,
        logo_url,
        logo_public_id,
        userId,
      ],
    );
    const newAgencyId = agencyInsertResult.rows[0].agency_id;

    const updatedUserResult = await client.query(
      `UPDATE users SET role = 'agency_admin', agency_id = $1, agency = $2 WHERE user_id = $3 RETURNING *`,
      [newAgencyId, name, userId],
    );
    const updatedUser = updatedUserResult.rows[0];

    await client.query(
      `INSERT INTO agency_members (agency_id, agent_id, role, request_status, member_status) VALUES ($1, $2, 'admin', 'accepted', 'regular')`,
      [newAgencyId, userId, "admin"],
    );

    await client.query("COMMIT");

    const newToken = jwt.sign(
      {
        user_id: updatedUser.user_id,
        name: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.role,
        agency_id: updatedUser.agency_id,
        status: updatedUser.status,
        session_id: req.user.session_id,
      },
      SECRET_KEY,
      { expiresIn: "7d" },
    );

    logActivity(
      "Agency Registered by Agent",
      `Agent ${userId} registered new agency: ${name} and became agency_admin`,
      userId,
    );
    res
      .status(201)
      .json({
        message:
          "Agency registered and user updated to agency admin successfully!",
        user: updatedUser,
        token: newToken,
      });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Error registering agency by agent:", error);
    if (error.code === "23505")
      return res
        .status(409)
        .json({ message: "An agency with this name or email already exists." });
    res
      .status(500)
      .json({
        message: "Server error registering agency.",
        error: error.message,
      });
  } finally {
    if (client) client.release();
  }
};

/**
 * @desc Get all agencies
 * @route GET /api/agencies
 * @access Public/Private
 */
exports.getAllAgencies = async (req, res) => {
  try {
    const { search } = req.query;
    // UPDATE: Include subscription fields in the SELECT statement
    let query =
      "SELECT agency_id, name, email, phone, website, logo_url, description, address, subscription_type, featured_priority FROM agencies";
    const queryParams = [];

    if (search) {
      query +=
        " WHERE name ILIKE $1 OR description ILIKE $1 OR address ILIKE $1";
      queryParams.push(`%${search}%`);
    }

    query += " ORDER BY name";

    const result = await db.query(query, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching all agencies:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching agencies.",
        error: error.message,
      });
  }
};

/**
 * @desc Get a single agency by ID
 * @route GET /api/agencies/:id
 * @access Public
 */
exports.getAgencyById = async (req, res) => {
  const { id } = req.params;
  try {
    // UPDATE: Include subscription fields in the SELECT statement
    const result = await db.query(
      "SELECT agency_id, name, email, phone, website, description, agency_admin_id, logo_url, logo_public_id, address, subscription_type, featured_priority FROM agencies WHERE agency_id = $1",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Agency not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching agency by ID:", error);
    res
      .status(500)
      .json({ message: "Server error fetching agency.", error: error.message });
  }
};

/**
 * @desc Update an agency's details
 * @route PUT /api/agencies/:id
 * @access Private (Agency Admin or Super Admin)
 */
exports.updateAgency = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    website,
    description,
    logoBase64,
    logoOriginalname,
    address,
  } = req.body;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const agencyResult = await client.query(
      "SELECT agency_admin_id, logo_public_id FROM agencies WHERE agency_id = $1",
      [id],
    );
    if (agencyResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Agency not found." });
    }
    const oldLogoPublicId = agencyResult.rows[0].logo_public_id;

    if (performingUserRole === "agency_admin") {
      const performingUserAgencyResult = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [performingUserId],
      );
      if (
        performingUserAgencyResult.rows.length === 0 ||
        performingUserAgencyResult.rows[0].agency_id !== parseInt(id)
      ) {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({
            message: "Forbidden: You are not authorized to manage this agency.",
          });
      }
    } else if (performingUserRole !== "admin") {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    let logo_url = undefined;
    let logo_public_id = undefined;

    if (logoBase64 !== undefined) {
      if (oldLogoPublicId) {
        await deleteFromCloudinary(oldLogoPublicId);
      }
      if (logoBase64) {
        const isIco =
          logoOriginalname && logoOriginalname.toLowerCase().endsWith(".ico");
        const resourceType = isIco ? "raw" : "image";
        const uploadRes = await uploadToCloudinary(
          logoBase64,
          logoOriginalname || "agency_logo.png",
          "hava/agency_logos",
          resourceType,
        );
        logo_url = uploadRes.url;
        logo_public_id = uploadRes.publicId;
      } else {
        logo_url = null;
        logo_public_id = null;
      }
    }

    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email !== undefined) {
      fieldsToUpdate.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      fieldsToUpdate.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (website !== undefined) {
      fieldsToUpdate.push(`website = $${paramIndex++}`);
      values.push(website);
    }
    if (description !== undefined) {
      fieldsToUpdate.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (address !== undefined) {
      fieldsToUpdate.push(`address = $${paramIndex++}`);
      values.push(address);
    }
    if (logo_url !== undefined) {
      fieldsToUpdate.push(`logo_url = $${paramIndex++}`);
      values.push(logo_url);
    }
    if (logo_public_id !== undefined) {
      fieldsToUpdate.push(`logo_public_id = $${paramIndex++}`);
      values.push(logo_public_id);
    }

    if (fieldsToUpdate.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "No fields provided for update." });
    }

    values.push(id);

    const result = await client.query(
      `UPDATE agencies SET ${fieldsToUpdate.join(", ")}, updated_at = NOW() WHERE agency_id = $${paramIndex} RETURNING *`,
      values,
    );

    await client.query("COMMIT");
    logActivity(
      "Agency Updated",
      `${performingUserRole} updated agency: ${result.rows[0].name}`,
      performingUserId,
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating agency:", error);
    res
      .status(500)
      .json({ message: "Server error updating agency.", error: error.message });
  } finally {
    client.release();
  }
};

// --- NEW: Function to update an agency's subscription tier ---
/**
 * @desc Updates an agency's subscription tier.
 * @route PUT /api/agencies/:id/subscription
 * @access Private (Admin only)
 */
exports.updateAgencySubscription = async (req, res) => {
  const { id: agencyId } = req.params;
  const { subscription_type } = req.body;
  const performingUser = req.user; // Admin performing the action

  // 1. Validate the new tier against the config file
  if (!SUBSCRIPTION_TIERS[subscription_type]) {
    return res
      .status(400)
      .json({ message: "Invalid subscription tier provided." });
  }

  const newTierConfig = SUBSCRIPTION_TIERS[subscription_type];

  try {
    // 2. Update the agency's subscription type and featured priority in the database
    const result = await db.query(
      `UPDATE agencies SET 
                subscription_type = $1, 
                featured_priority = $2, 
                updated_at = NOW() 
             WHERE agency_id = $3
             RETURNING *`, // Return all fields of the updated agency
      [subscription_type, newTierConfig.featuredPriority, agencyId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Agency not found." });
    }

    const updatedAgency = result.rows[0];

    // 3. Log the administrative activity
    await logActivity(
      `Admin ${performingUser.name} updated subscription for agency ${updatedAgency.name} (ID: ${agencyId}) to '${subscription_type}'`,
      performingUser.user_id,
      "agency_subscription_change",
    );

    // 4. Send the response
    res.status(200).json({
      message: `Agency subscription successfully updated to ${subscription_type}.`,
      agency: updatedAgency,
    });
  } catch (err) {
    console.error("Error updating agency subscription:", err);
    res
      .status(500)
      .json({
        message: "Failed to update agency subscription.",
        error: err.message,
      });
  }
};

// (The rest of your existing agencyController.js functions (deleteAgency, requestToJoinAgency, approveJoinRequest, etc.) remain here, unchanged.)
// ... All other functions from your provided file are included below without modification ...

/**
 * @desc Delete an agency
 * @route DELETE /api/agencies/:id
 * @access Private (Super Admin only)
 */
exports.deleteAgency = async (req, res) => {
  const { id } = req.params;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    if (performingUserRole !== "admin") {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden: Only super admins can delete agencies." });
    }

    const agencyResult = await db.query(
      "SELECT logo_public_id FROM agencies WHERE agency_id = $1",
      [id],
    );
    const logoPublicId = agencyResult.rows[0]?.logo_public_id;

    const result = await db.query(
      "DELETE FROM agencies WHERE agency_id = $1 RETURNING name",
      [id],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Agency not found." });
    }

    if (logoPublicId) {
      await deleteFromCloudinary(logoPublicId);
    }

    await client.query("COMMIT");
    logActivity(
      "Agency Deleted",
      `Admin deleted agency: ${result.rows[0].name}`,
      performingUserId,
    );
    res.status(200).json({ message: "Agency deleted successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting agency:", error);
    res
      .status(500)
      .json({ message: "Server error deleting agency.", error: error.message });
  } finally {
    client.release();
  }
};

/**
 * @desc Agent requests to join an agency
 * @route POST /api/agencies/request-to-join
 * @access Private (Agent only)
 */
exports.requestToJoinAgency = async (req, res) => {
  const { agency_id } = req.body;
  const agentId = req.user.user_id;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const agencyExists = await client.query(
      "SELECT agency_id FROM agencies WHERE agency_id = $1",
      [agency_id],
    );
    if (agencyExists.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Agency not found." });
    }

    const existingActiveMembership = await client.query(
      `SELECT agency_id, request_status FROM agency_members WHERE agent_id = $1 AND (request_status = 'accepted' OR request_status = 'pending')`,
      [agentId],
    );

    if (existingActiveMembership.rows.length > 0) {
      const existingAgencyId = existingActiveMembership.rows[0].agency_id;
      const existingStatus = existingActiveMembership.rows[0].request_status;
      await client.query("ROLLBACK");
      if (existingStatus === "accepted") {
        return res
          .status(400)
          .json({
            message: `You are already connected to an agency (Agency ID: ${existingAgencyId}). An agent can only be affiliated with one agency at a time.`,
          });
      } else if (existingStatus === "pending") {
        return res
          .status(400)
          .json({
            message: `You have a pending request to join another agency (Agency ID: ${existingAgencyId}). An agent can only be affiliated with one agency at a time.`,
          });
      }
    }

    const existingMembershipForThisAgency = await client.query(
      `SELECT request_status FROM agency_members WHERE agency_id = $1 AND agent_id = $2`,
      [agency_id, agentId],
    );

    if (existingMembershipForThisAgency.rows.length > 0) {
      const status = existingMembershipForThisAgency.rows[0].request_status;
      if (status === "rejected") {
        await client.query(
          `UPDATE agency_members SET request_status = 'pending', updated_at = NOW() WHERE agency_id = $1 AND agent_id = $2`,
          [agency_id, agentId],
        );
        await client.query("COMMIT");
        logActivity(
          "Agency Join Request Re-sent",
          `Agent ${agentId} re-sent request to join agency ${agency_id}`,
          agentId,
        );
        return res
          .status(200)
          .json({
            message:
              "Your previous agency join request has been re-sent and is now pending approval.",
          });
      }
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({
          message:
            "You are already affiliated with this agency or have a pending request.",
        });
    }

    await client.query(
      `INSERT INTO agency_members (agency_id, agent_id, role, request_status, member_status)
             VALUES ($1, $2, 'agent', 'pending', 'regular')`,
      [agency_id, agentId],
    );

    await client.query("COMMIT");
    logActivity(
      "Agency Join Request",
      `Agent ${agentId} requested to join agency ${agency_id}`,
      agentId,
    );
    res
      .status(201)
      .json({
        message: "Agency join request sent successfully. Awaiting approval.",
      });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error sending agency join request:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .json({
          message:
            "A request to join this agency already exists for you. Please check your pending requests or membership status.",
        });
    }
    res
      .status(500)
      .json({
        message: "Server error sending join request.",
        error: error.message,
      });
  } finally {
    client.release();
  }
};

/**
 * @desc Agency Admin approves an agent's request to join
 * @route PUT /api/agencies/approve-join-request/:requestId
 * @access Private (Agency Admin or Super Admin)
 */
exports.approveJoinRequest = async (req, res) => {
  const { requestId } = req.params;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT am.agency_id, am.agent_id, am.request_status
             FROM agency_members am
             WHERE am.agency_member_id = $1 AND am.request_status = 'pending'`,
      [requestId],
    );

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({
          message: "Pending join request not found or already processed.",
        });
    }

    const { agency_id, agent_id: agentToApprove } = requestResult.rows[0];

    if (performingUserRole === "agency_admin") {
      const performingUserAgencyResult = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [performingUserId],
      );
      if (
        performingUserAgencyResult.rows.length === 0 ||
        performingUserAgencyResult.rows[0].agency_id !== parseInt(agency_id)
      ) {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You are not authorized to approve requests for this agency.",
          });
      }
    } else if (performingUserRole !== "admin") {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    const existingActiveMembershipForAgent = await client.query(
      `SELECT agency_id, request_status FROM agency_members WHERE agent_id = $1 AND (request_status = 'accepted' OR request_status = 'pending') AND agency_id != $2`,
      [agentToApprove, agency_id],
    );

    if (existingActiveMembershipForAgent.rows.length > 0) {
      const existingAgencyId =
        existingActiveMembershipForAgent.rows[0].agency_id;
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({
          message: `Agent (ID: ${agentToApprove}) is already affiliated with another agency (ID: ${existingAgencyId}). An agent can only be affiliated with one agency at a time.`,
        });
    }

    await client.query(
      `UPDATE agency_members SET request_status = 'accepted', joined_at = NOW(), updated_at = NOW(), member_status = 'regular', role = 'agent' WHERE agency_member_id = $1`,
      [requestId],
    );

    const agencyNameResult = await client.query(
      "SELECT name FROM agencies WHERE agency_id = $1",
      [agency_id],
    );
    const agencyName = agencyNameResult.rows[0].name;

    await client.query(
      `UPDATE users SET agency_id = $1, agency = $2 WHERE user_id = $3`,
      [agency_id, agencyName, agentToApprove],
    );

    await client.query("COMMIT");
    logActivity(
      "Agency Join Request Approved",
      `${performingUserRole} approved agent ${agentToApprove}'s request to join agency ${agency_id}`,
      performingUserId,
    );
    res
      .status(200)
      .json({ message: "Agent join request approved successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error approving agency join request:", error);
    res
      .status(500)
      .json({
        message: "Server error approving join request.",
        error: error.message,
      });
  } finally {
    client.release();
  }
};

/**
 * @desc Agency Admin rejects an agent's request to join
 * @route PUT /api/agencies/reject-join-request/:requestId
 * @access Private (Agency Admin or Super Admin)
 */
exports.rejectJoinRequest = async (req, res) => {
  const { requestId } = req.params;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT am.agency_id, am.agent_id, am.request_status
             FROM agency_members am
             WHERE am.agency_member_id = $1 AND am.request_status = 'pending'`,
      [requestId],
    );

    if (requestResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({
          message: "Pending join request not found or already processed.",
        });
    }

    const { agency_id, agent_id: agentToReject } = requestResult.rows[0];

    if (performingUserRole === "agency_admin") {
      const performingUserAgencyResult = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [performingUserId],
      );
      if (
        performingUserAgencyResult.rows.length === 0 ||
        performingUserAgencyResult.rows[0].agency_id !== parseInt(agency_id)
      ) {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You are not authorized to reject requests for this agency.",
          });
      }
    } else if (performingUserRole !== "admin") {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    await client.query(
      `UPDATE agency_members SET request_status = 'rejected', updated_at = NOW() WHERE agency_member_id = $1`,
      [requestId],
    );

    await client.query(
      `UPDATE users SET agency_id = NULL, agency = NULL WHERE user_id = $1`,
      [agentToReject],
    );

    await client.query("COMMIT");
    logActivity(
      "Agency Join Request Rejected",
      `${performingUserRole} rejected agent ${agentToReject}'s request to join agency ${agency_id}`,
      performingUserId,
    );
    res.status(200).json({ message: "Agent join request rejected." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error rejecting agency join request:", error);
    res
      .status(500)
      .json({
        message: "Server error rejecting join request.",
        error: error.message,
      });
  } finally {
    client.release();
  }
};

/**
 * @desc Get all agents (members) for a specific agency
 * @route GET /api/agencies/:agencyId/agents
 * @access Private (Agency Admin or Super Admin for that agency)
 */
exports.getAgentsByAgencyId = async (req, res) => {
  const { agencyId } = req.params;
  const { role } = req.query;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;

  try {
    const agencyExistsCheck = await db.query(
      "SELECT agency_id FROM agencies WHERE agency_id = $1",
      [agencyId],
    );
    if (agencyExistsCheck.rows.length === 0) {
      return res.status(404).json({ message: "Agency not found." });
    }

    if (performingUserRole === "agency_admin") {
      const performingUserAgencyResult = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [performingUserId],
      );
      if (
        performingUserAgencyResult.rows.length === 0 ||
        performingUserAgencyResult.rows[0].agency_id !== parseInt(agencyId)
      ) {
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You are not authorized to view agents for this agency.",
          });
      }
    } else if (performingUserRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    let query = `
            SELECT
                u.user_id, u.full_name, u.email, u.phone, u.profile_picture_url, u.date_joined, u.status AS user_status,
                am.role AS agency_role,
                am.joined_at,
                am.member_status
             FROM users u
             JOIN agency_members am ON u.user_id = am.agent_id
             WHERE am.agency_id = $1 AND am.request_status = 'accepted'
        `;
    const queryParams = [agencyId];
    let paramIndex = 2;

    if (role && role !== "all") {
      query += ` AND am.role = $${paramIndex++}`;
      queryParams.push(role);
    }

    query += ` ORDER BY u.full_name`;

    const result = await db.query(query, queryParams);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching agents for agency:", error);
    res
      .status(500)
      .json({ message: "Server error fetching agents.", error: error.message });
  }
};

/**
 * @desc Get pending join requests for a specific agency
 * @route GET /api/agencies/:agencyId/pending-requests
 * @access Private (Agency Admin or Super Admin for that agency)
 */
exports.getPendingAgencyJoinRequests = async (req, res) => {
  const { agencyId } = req.params;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;

  try {
    const agencyExistsCheck = await db.query(
      "SELECT agency_id FROM agencies WHERE agency_id = $1",
      [agencyId],
    );
    if (agencyExistsCheck.rows.length === 0) {
      return res.status(404).json({ message: "Agency not found." });
    }

    if (performingUserRole === "agency_admin") {
      const performingUserAgencyResult = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [performingUserId],
      );
      if (
        performingUserAgencyResult.rows.length === 0 ||
        performingUserAgencyResult.rows[0].agency_id !== parseInt(agencyId)
      ) {
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You are not authorized to view pending requests for this agency.",
          });
      }
    } else if (performingUserRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    const result = await db.query(
      `SELECT
                am.agency_member_id AS request_id,
                u.user_id AS agent_id, u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone,
                u.profile_picture_url AS agent_profile_picture_url,
                am.request_status, am.joined_at AS requested_at, am.message,
                am.member_status,
                am.role AS agency_member_role
             FROM agency_members am
             JOIN users u ON am.agent_id = u.user_id
             WHERE am.agency_id = $1 AND am.request_status = 'pending'
             ORDER BY am.joined_at DESC`,
      [agencyId],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching pending agency join requests:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching pending requests.",
        error: error.message,
      });
  }
};

/**
 * @desc Get an agent's pending join requests (for General.js)
 * @route GET /api/agencies/agent/:agentId/pending-requests
 * @access Private (Agent or Agency Admin for that agent)
 */
exports.getAgentPendingRequests = async (req, res) => {
  const { agentId } = req.params;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;

  if (parseInt(agentId) !== performingUserId) {
    if (performingUserRole !== "admin") {
      return res
        .status(403)
        .json({
          message: "Forbidden: You are not authorized to view these requests.",
        });
    }
  }

  try {
    const result = await db.query(
      `SELECT
                am.agency_member_id,
                am.agency_id,
                a.name AS agency_name,
                a.logo_url,
                am.request_status,
                am.member_status,
                am.role AS agency_member_role,
                am.joined_at AS requested_at,
                am.message
             FROM agency_members am
             JOIN agencies a ON am.agency_id = a.agency_id
             WHERE am.agent_id = $1 AND am.request_status = 'pending'
             ORDER BY am.joined_at DESC`,
      [agentId],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching agent pending requests:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching agent pending requests.",
        error: error.message,
      });
  }
};

/**
 * @desc Remove an agent from an agency (by agency admin or super admin)
 * @route DELETE /api/agencies/:agencyId/members/:agentId
 * @access Private (Agency Admin or Super Admin, or the Agent themselves)
 */
exports.removeAgencyMember = async (req, res) => {
  const { agencyId, agentId } = req.params;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const isSelfRemoval =
      parseInt(agentId) === performingUserId && performingUserRole === "agent";

    if (!isSelfRemoval) {
      const agencyExistsCheck = await db.query(
        "SELECT agency_id FROM agencies WHERE agency_id = $1",
        [agencyId],
      );
      if (agencyExistsCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Agency not found." });
      }

      if (performingUserRole === "agency_admin") {
        const performingUserAgencyResult = await db.query(
          "SELECT agency_id FROM users WHERE user_id = $1",
          [performingUserId],
        );
        if (
          performingUserAgencyResult.rows.length === 0 ||
          performingUserAgencyResult.rows[0].agency_id !== parseInt(agencyId)
        ) {
          await client.query("ROLLBACK");
          return res
            .status(403)
            .json({
              message:
                "Forbidden: You are not authorized to remove members from this agency.",
            });
        }
      } else if (performingUserRole !== "admin") {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions." });
      }
    }

    const targetMemberRoleResult = await client.query(
      "SELECT role FROM users WHERE user_id = $1",
      [agentId],
    );
    const targetMemberRole = targetMemberRoleResult.rows[0]?.role;

    if (targetMemberRole === "agency_admin") {
      const adminCountResult = await client.query(
        `SELECT COUNT(*) FROM users WHERE agency_id = $1 AND role = 'agency_admin'`,
        [agencyId],
      );
      if (parseInt(adminCountResult.rows[0].count) <= 1) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({
            message: "You cannot remove the last agency administrator.",
          });
      }
    }

    const memberCheck = await client.query(
      `SELECT * FROM agency_members WHERE agency_id = $1 AND agent_id = $2`,
      [agencyId, agentId],
    );
    if (memberCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({
          message:
            "Agent is not affiliated with this agency or request not found.",
        });
    }

    await client.query(
      `DELETE FROM agency_members WHERE agency_id = $1 AND agent_id = $2`,
      [agencyId, agentId],
    );

    if (memberCheck.rows[0].request_status === "accepted") {
      await client.query(
        `UPDATE users SET agency_id = NULL, agency = NULL WHERE user_id = $1`,
        [agentId],
      );
    }

    await client.query("COMMIT");
    logActivity(
      "Agency Member Removed",
      `${performingUserRole} removed agent ${agentId} from agency ${agencyId}`,
      performingUserId,
    );
    res
      .status(200)
      .json({ message: "Agent removed from agency successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error removing agency member:", error);
    res
      .status(500)
      .json({
        message: "Server error removing agency member.",
        error: error.message,
      });
  } finally {
    client.release();
  }
};

/**
 * @desc Agency Admin deletes their agency. This action forces role reversion.
 * @route DELETE /api/agencies/:agencyId/admin-delete
 * @access Private (Agency Admin only)
 */
exports.adminDeleteAgency = async (req, res) => {
  const { agencyId } = req.params;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    if (performingUserRole !== "agency_admin") {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({
          message:
            "Forbidden: Only agency administrators can delete their agency.",
        });
    }

    const agencyCheck = await client.query(
      "SELECT agency_admin_id, logo_public_id FROM agencies WHERE agency_id = $1",
      [agencyId],
    );
    if (agencyCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Agency not found." });
    }
    const {
      agency_admin_id: owningAgencyAdminId,
      logo_public_id: agencyLogoPublicId,
    } = agencyCheck.rows[0];

    if (owningAgencyAdminId !== performingUserId) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own agency." });
    }

    const agencyMembers = await client.query(
      `SELECT agent_id FROM agency_members WHERE agency_id = $1`,
      [agencyId],
    );

    for (const member of agencyMembers.rows) {
      await client.query(
        `UPDATE users SET agency_id = NULL, agency = NULL WHERE user_id = $1`,
        [member.agent_id],
      );
    }

    await client.query(`DELETE FROM agency_members WHERE agency_id = $1`, [
      agencyId,
    ]);

    await client.query(`DELETE FROM agencies WHERE agency_id = $1`, [agencyId]);

    if (agencyLogoPublicId) {
      await deleteFromCloudinary(agencyLogoPublicId);
    }

    const updatedUserResult = await client.query(
      `UPDATE users SET role = 'agent', agency_id = NULL, agency = NULL WHERE user_id = $1 RETURNING *`,
      [performingUserId],
    );
    const updatedUser = updatedUserResult.rows[0];

    await client.query("COMMIT");

    const newToken = jwt.sign(
      {
        user_id: updatedUser.user_id,
        name: updatedUser.full_name,
        email: updatedUser.email,
        role: updatedUser.role,
        agency_id: updatedUser.agency_id,
        status: updatedUser.status,
        session_id: req.user.session_id,
      },
      SECRET_KEY,
      { expiresIn: "7d" },
    );

    logActivity(
      "Agency Deleted by Admin",
      `Agency Admin ${performingUserId} deleted agency ${agencyId} and reverted to agent.`,
      performingUserId,
    );

    res.status(200).json({
      message: "Agency deleted and your role reverted successfully.",
      user: updatedUser,
      token: newToken,
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("Error deleting agency by admin:", error);
    res
      .status(500)
      .json({ message: "Failed to delete agency.", error: error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * @desc Promotes a member within an agency to 'agency_admin' role.
 * @route PUT /api/agencies/:agencyId/members/:memberId/promote-to-admin
 * @access Private (Agency Admin or Super Admin)
 */
exports.promoteMemberToAdmin = async (req, res) => {
  const { agencyId, memberId } = req.params;
  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  let client;
  try {
    client = await db.pool.connect();
    await client.query("BEGIN");

    const agencyExistsCheck = await client.query(
      "SELECT agency_id FROM agencies WHERE agency_id = $1",
      [agencyId],
    );
    if (agencyExistsCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Agency not found." });
    }

    if (currentUserRole === "agency_admin") {
      const performingUserAgencyResult = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [currentUserId],
      );
      if (
        performingUserAgencyResult.rows.length === 0 ||
        performingUserAgencyResult.rows[0].agency_id !== parseInt(agencyId)
      ) {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You are not authorized to manage members for this agency.",
          });
      }
    } else if (currentUserRole !== "admin") {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    const memberCheck = await client.query(
      `SELECT u.role, am.request_status FROM users u JOIN agency_members am ON u.user_id = am.agent_id
             WHERE u.user_id = $1 AND am.agency_id = $2 AND am.request_status = 'accepted'`,
      [memberId, agencyId],
    );

    if (memberCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({
          message: "Member not found in this agency or not an active member.",
        });
    }
    if (memberCheck.rows[0].role === "agency_admin") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Member is already an agency administrator." });
    }

    const userUpdateResult = await client.query(
      `UPDATE users SET role = 'agency_admin', updated_at = NOW() WHERE user_id = $1 RETURNING *`,
      [memberId],
    );

    await client.query(
      `UPDATE agency_members SET role = 'admin', updated_at = NOW() WHERE agent_id = $1 AND agency_id = $2`,
      [memberId, agencyId],
    );

    await client.query("COMMIT");
    await logActivity(
      `Member ${userUpdateResult.rows[0].full_name} promoted to admin by ${req.user.name} in agency ${agencyId}`,
      currentUserId,
      "member_role_change",
    );

    res
      .status(200)
      .json({ message: "Member promoted to administrator successfully." });
  } catch (err) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("Error promoting member to admin:", err);
    res
      .status(500)
      .json({ message: "Failed to promote member.", error: err.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * @desc Demotes a member within an agency from 'agency_admin' to 'agent' role.
 * @route PUT /api/agencies/:agencyId/members/:memberId/demote-to-agent
 * @access Private (Agency Admin or Super Admin)
 */
exports.demoteMemberToAgent = async (req, res) => {
  const { agencyId, memberId } = req.params;
  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  let client;
  try {
    client = await db.pool.connect();
    await client.query("BEGIN");

    const agencyExistsCheck = await client.query(
      "SELECT agency_id FROM agencies WHERE agency_id = $1",
      [agencyId],
    );
    if (agencyExistsCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Agency not found." });
    }

    if (currentUserRole === "agency_admin") {
      const performingUserAgencyResult = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [currentUserId],
      );
      if (
        performingUserAgencyResult.rows.length === 0 ||
        performingUserAgencyResult.rows[0].agency_id !== parseInt(agencyId)
      ) {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You are not authorized to manage members for this agency.",
          });
      }
    } else if (currentUserRole !== "admin") {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    const memberCheck = await client.query(
      `SELECT u.role, am.request_status FROM users u JOIN agency_members am ON u.user_id = am.agent_id
             WHERE u.user_id = $1 AND am.agency_id = $2 AND am.request_status = 'accepted'`,
      [memberId, agencyId],
    );

    if (memberCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({
          message: "Member not found in this agency or not an active member.",
        });
    }
    if (memberCheck.rows[0].role !== "agency_admin") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Member is not an agency administrator." });
    }

    if (parseInt(memberId) === currentUserId) {
      const adminCountResult = await client.query(
        `SELECT COUNT(*) FROM users WHERE agency_id = $1 AND role = 'agency_admin'`,
        [agencyId],
      );
      if (parseInt(adminCountResult.rows[0].count) <= 1) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({
            message:
              "You cannot demote yourself as you are the last agency administrator.",
          });
      }
    }

    const userUpdateResult = await client.query(
      `UPDATE users SET role = 'agent', updated_at = NOW() WHERE user_id = $1 RETURNING *`,
      [memberId],
    );

    await client.query(
      `UPDATE agency_members SET role = 'agent', updated_at = NOW() WHERE agent_id = $1 AND agency_id = $2`,
      [memberId, agencyId],
    );

    await client.query("COMMIT");
    await logActivity(
      `Member ${userUpdateResult.rows[0].full_name} demoted to agent by ${req.user.name} in agency ${agencyId}`,
      currentUserId,
      "member_role_change",
    );

    res.status(200).json({ message: "Member demoted to agent successfully." });
  } catch (err) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("Error demoting member to agent:", err);
    res
      .status(500)
      .json({ message: "Failed to demote member.", error: err.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * @desc Updates a member's status (e.g., 'vip', 'regular') within an agency.
 * @route PUT /api/agencies/:agencyId/members/:memberId/status
 * @access Private (Agency Admin or Super Admin)
 */
exports.updateMemberStatus = async (req, res) => {
  const { agencyId, memberId } = req.params;
  const { status } = req.body;
  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  let client;
  try {
    client = await db.pool.connect();
    await client.query("BEGIN");

    if (!["vip", "regular"].includes(status)) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({
          message: 'Invalid status provided. Must be "vip" or "regular".',
        });
    }

    const agencyExistsCheck = await db.query(
      "SELECT agency_id FROM agencies WHERE agency_id = $1",
      [agencyId],
    );
    if (agencyExistsCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Agency not found." });
    }

    if (currentUserRole === "agency_admin") {
      const performingUserAgencyResult = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [currentUserId],
      );
      if (
        performingUserAgencyResult.rows.length === 0 ||
        performingUserAgencyResult.rows[0].agency_id !== parseInt(agencyId)
      ) {
        await client.query("ROLLBACK");
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You are not authorized to manage members for this agency.",
          });
      }
    } else if (currentUserRole !== "admin") {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    if (parseInt(memberId) === currentUserId) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({
          message: "Forbidden: You cannot change your own member status.",
        });
    }

    const memberCheck = await client.query(
      `SELECT am.member_status FROM agency_members am
             WHERE am.agent_id = $1 AND am.agency_id = $2 AND am.request_status = 'accepted'`,
      [memberId, agencyId],
    );

    if (memberCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({
          message: "Member not found in this agency or not an active member.",
        });
    }

    await client.query(
      `UPDATE agency_members SET member_status = $1, updated_at = NOW() WHERE agent_id = $2 AND agency_id = $3`,
      [status, memberId, agencyId],
    );

    await client.query("COMMIT");
    await logActivity(
      `Member ${memberId} status updated to ${status} by ${req.user.name} in agency ${agencyId}`,
      currentUserId,
      "member_status_change",
    );

    res
      .status(200)
      .json({ message: `Member status updated to ${status} successfully.` });
  } catch (err) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("Error updating member status:", err);
    res
      .status(500)
      .json({ message: "Failed to update member status.", error: err.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * @desc Get all agency memberships (connected, pending, rejected) for a specific agent
 * @route GET /api/users/:agentId/agency-memberships
 * @access Private
 */
exports.getAgentAgencyMemberships = async (req, res) => {
  const { agentId } = req.params;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;

  try {
    let query = `
            SELECT
                am.agency_member_id, am.agency_id, a.name AS agency_name, a.logo_url,
                am.request_status, am.member_status, am.role AS agency_member_role,
                am.joined_at, am.updated_at
            FROM agency_members am
            JOIN agencies a ON am.agency_id = a.agency_id
            WHERE am.agent_id = $1
            ORDER BY am.updated_at DESC
        `;
    const queryParams = [agentId];

    const result = await db.query(query, queryParams);

    if (performingUserRole === "agency_admin") {
      const agentAgencyCheck = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [agentId],
      );
      if (
        agentAgencyCheck.rows.length === 0 ||
        agentAgencyCheck.rows[0].agency_id !== req.user.agency_id
      ) {
        if (parseInt(agentId) !== performingUserId) {
          return res
            .status(403)
            .json({
              message:
                "Forbidden: You are not authorized to view memberships for this agent.",
            });
        }
      }
    } else if (
      performingUserRole !== "admin" &&
      parseInt(agentId) !== performingUserId
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching agent agency memberships:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching agent agency memberships.",
        error: error.message,
      });
  }
};

/**
 * @desc Get the count of agency administrators for a specific agency.
 * @route GET /api/agencies/:agencyId/admin-count
 * @access Private (Agency Admin or Super Admin for that agency)
 */
exports.getAgencyAdminCount = async (req, res) => {
  const { agencyId } = req.params;
  const performingUserId = req.user.user_id;
  const performingUserRole = req.user.role;

  try {
    if (performingUserRole === "agency_admin") {
      const performingUserAgencyResult = await db.query(
        "SELECT agency_id FROM users WHERE user_id = $1",
        [performingUserId],
      );
      if (
        performingUserAgencyResult.rows.length === 0 ||
        performingUserAgencyResult.rows[0].agency_id !== parseInt(agencyId)
      ) {
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You are not authorized to view admin count for this agency.",
          });
      }
    } else if (performingUserRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions." });
    }

    const agencyExistsCheck = await db.query(
      "SELECT agency_id FROM agencies WHERE agency_id = $1",
      [agencyId],
    );
    if (agencyExistsCheck.rows.length === 0) {
      return res.status(404).json({ message: "Agency not found." });
    }

    const result = await db.query(
      `SELECT COUNT(*) AS admin_count
             FROM users
             WHERE agency_id = $1 AND role = 'agency_admin'`,
      [agencyId],
    );

    res.status(200).json({ admin_count: parseInt(result.rows[0].admin_count) });
  } catch (error) {
    console.error("Error fetching agency admin count:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching agency admin count.",
        error: error.message,
      });
  }
};

/**
 * @desc Get all listings associated with a specific agency
 * @route GET /api/agencies/:agencyId/listings
 * @access Public
 */
exports.getAgencyListings = async (req, res) => {
  const { agencyId } = req.params;
  try {
    const result = await db.query(
      `SELECT
                pl.*, pd.*, u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone
             FROM property_listings pl
             LEFT JOIN property_details pd ON pl.property_id = pd.property_id
             LEFT JOIN users u ON pl.agent_id = u.user_id
             WHERE pl.agency_id = $1
             ORDER BY pl.date_listed DESC`,
      [agencyId],
    );

    const listingsWithGallery = await Promise.all(
      result.rows.map(async (listing) => {
        const galleryResult = await db.query(
          "SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id",
          [listing.property_id],
        );
        listing.gallery_images = galleryResult.rows.map((row) => row.image_url);
        return listing;
      }),
    );

    res.status(200).json(listingsWithGallery);
  } catch (error) {
    console.error("Error fetching agency listings:", error);
    res
      .status(500)
      .json({
        message: "Server error fetching agency listings.",
        error: error.message,
      });
  }
};

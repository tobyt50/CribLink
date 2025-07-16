// criblink-backend/controllers/agencyController.js
const db = require('../db/index'); // Assuming your database connection pool is here
// Corrected import: Destructure the specific functions you need from cloudinary.js
const { uploadToCloudinary, deleteFromCloudinary, getCloudinaryPublicId } = require('../utils/cloudinary');
const logActivity = require('../utils/logActivity'); // For logging admin activities
const jwt = require('jsonwebtoken'); // Import JWT for token generation

const SECRET_KEY = process.env.JWT_KEY || 'lionel_messi_10_is_the_goat!';


/**
 * @desc Create a new agency
 * @route POST /api/agencies
 * @access Private (Admin only initially)
 */
exports.createAgency = async (req, res) => {
    const { name, email, phone, website, description, logoBase64, logoOriginalname } = req.body; // Added logoOriginalname
    const client = await db.pool.connect(); // Corrected: access pool from db
    try {
        await client.query('BEGIN');

        let logo_url = null;
        let logo_public_id = null;

        if (logoBase64) {
            // Determine resource type based on file extension
            const isIco = logoOriginalname && logoOriginalname.toLowerCase().endsWith('.ico');
            const resourceType = isIco ? 'raw' : 'image';

            // Use the directly imported uploadToCloudinary function
            // Now passes logoBase64 string directly
            const uploadRes = await uploadToCloudinary(logoBase64, logoOriginalname || 'agency_logo.png', 'criblink/agency_logos', resourceType);
            logo_url = uploadRes.url; // Access 'url' from the returned object
            logo_public_id = uploadRes.publicId; // Access 'publicId' from the returned object
        }

        const result = await client.query(
            `INSERT INTO agencies (name, email, phone, website, description, logo_url, logo_public_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, email, phone, website, description, logo_url, logo_public_id]
        );

        await client.query('COMMIT');
        logActivity('Agency Created', `Admin created new agency: ${name}`, req.user.user_id);
        res.status(201).json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating agency:', error);
        res.status(500).json({ message: 'Server error creating agency.', error: error.message });
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
    const { name, address, phone, email, website, description, logoBase64, logoOriginalname } = req.body;
    const userId = req.user.user_id; // The agent's user ID
    const userRole = req.user.role; // Should be 'agent'

    let client;
    try {
        client = await db.pool.connect(); // Corrected: access pool from db
        await client.query('BEGIN');

        // 1. Basic validation
        if (userRole !== 'agent') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Only agents can register new agencies.' });
        }
        if (!name || !email || !phone) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Agency name, email, and phone are required.' });
        }

        // Check if agent is already associated with an agency
        const userCheck = await client.query('SELECT agency_id, role FROM users WHERE user_id = $1', [userId]);
        if (userCheck.rows[0]?.agency_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'You are already associated with an agency. Cannot create a new one.' });
        }
        if (userCheck.rows[0]?.role === 'agency_admin') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'You are already an agency admin.' });
        }

        // Check for unique agency name and email
        const existingAgency = await client.query('SELECT 1 FROM agencies WHERE name = $1 OR email = $2', [name, email]);
        if (existingAgency.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'An agency with this name or email already exists.' });
        }

        let logo_url = null;
        let logo_public_id = null;

        if (logoBase64 && logoOriginalname) {
            // Determine resource type based on file extension
            const isIco = logoOriginalname.toLowerCase().endsWith('.ico');
            const resourceType = isIco ? 'raw' : 'image';

            // Use the directly imported uploadToCloudinary function
            // Now passes logoBase64 string directly
            const uploadRes = await uploadToCloudinary(logoBase64, logoOriginalname, 'criblink/agency_logos', resourceType);
            logo_url = uploadRes.url; // Access 'url' from the returned object
            logo_public_id = uploadRes.publicId; // Access 'publicId' from the returned object
        }

        // 2. Create the new agency record
        const agencyInsertResult = await client.query(
            `INSERT INTO agencies (name, address, phone, email, website, description, logo_url, logo_public_id, agency_admin_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING agency_id`,
            [name, address, phone, email, website, description, logo_url, logo_public_id, userId]
        );
        const newAgencyId = agencyInsertResult.rows[0].agency_id;

        // 3. Update the agent's user record: change role to 'agency_admin' and link to the new agency
        const updatedUserResult = await client.query(
            `UPDATE users SET role = 'agency_admin', agency_id = $1, agency = $2 WHERE user_id = $3 RETURNING *`,
            [newAgencyId, name, userId]
        );
        const updatedUser = updatedUserResult.rows[0];

        // 4. Add the user as an 'admin' in the agency_members table with 'accepted' status and default member_status
        await client.query(
            `INSERT INTO agency_members (agency_id, agent_id, role, request_status, member_status) VALUES ($1, $2, $3, 'accepted', 'regular')`, // Added default 'regular'
            [newAgencyId, userId, 'admin'] // Role in agency_members for the creator is 'admin'
        );

        await client.query('COMMIT');

        // Generate a new JWT token with the updated role and agency_id
        const newToken = jwt.sign({
            user_id: updatedUser.user_id,
            name: updatedUser.full_name,
            email: updatedUser.email,
            role: updatedUser.role,
            agency_id: updatedUser.agency_id,
            status: updatedUser.status,
            session_id: req.user.session_id // Keep current session ID
        }, SECRET_KEY, { expiresIn: '7d' });

        logActivity('Agency Registered by Agent', `Agent ${userId} registered new agency: ${name} and became agency_admin`, userId);

        res.status(201).json({
            message: 'Agency registered and user updated to agency admin successfully!',
            user: updatedUser,
            token: newToken
        });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error registering agency by agent:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ message: 'An agency with this name or email already exists.' });
        }
        res.status(500).json({ message: 'Server error registering agency.', error: error.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};


/**
 * @desc Get all agencies
 * @route GET /api/agencies
 * @access Public/Private (e.g., for agent signup dropdown)
 */
exports.getAllAgencies = async (req, res) => {
    try {
        const result = await db.query('SELECT agency_id, name, email, phone, website, logo_url, description FROM agencies ORDER BY name'); // Corrected: use db.query
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching all agencies:', error);
        res.status(500).json({ message: 'Server error fetching agencies.', error: error.message });
    }
};

/**
 * @desc Get a single agency by ID
 * @route GET /api/agencies/:id
 * @access Public (for agency profile pages)
 */
exports.getAgencyById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT agency_id, name, email, phone, website, description, agency_admin_id, logo_url, logo_public_id FROM agencies WHERE agency_id = $1', [id]); // Corrected: use db.query
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Agency not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching agency by ID:', error);
        res.status(500).json({ message: 'Server error fetching agency.', error: error.message });
    }
};

/**
 * @desc Update an agency's details
 * @route PUT /api/agencies/:id
 * @access Private (Agency Admin or Super Admin)
 */
exports.updateAgency = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, website, description, logoBase64, logoOriginalname } = req.body; // Added logoOriginalname
    const performingUserId = req.user.user_id;
    const performingUserRole = req.user.role;
    const client = await db.pool.connect(); // Corrected: access pool from db

    try {
        await client.query('BEGIN');

        // Check if the performing user is the agency_admin for this agency or a super admin
        const agencyResult = await client.query('SELECT agency_admin_id, logo_public_id FROM agencies WHERE agency_id = $1', [id]);
        if (agencyResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Agency not found.' });
        }
        const currentAgencyAdminId = agencyResult.rows[0].agency_admin_id;
        const oldLogoPublicId = agencyResult.rows[0].logo_public_id;

        if (performingUserRole === 'agency_admin') {
            if (currentAgencyAdminId !== performingUserId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Forbidden: You are not authorized to update this agency.' });
            }
        } else if (performingUserRole !== 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        let logo_url = undefined; // Use undefined to not update if not provided
        let logo_public_id = undefined;

        if (logoBase64 !== undefined) { // Check if logoBase64 is explicitly provided (can be null for clearing)
            if (oldLogoPublicId) {
                // Delete old logo from Cloudinary if it exists
                await deleteFromCloudinary(oldLogoPublicId); // Use directly imported function
            }
            if (logoBase64) {
                // Determine resource type based on file extension
                const isIco = logoOriginalname && logoOriginalname.toLowerCase().endsWith('.ico');
                const resourceType = isIco ? 'raw' : 'image';

                // Upload new logo
                // Now passes logoBase64 string directly
                const uploadRes = await uploadToCloudinary(logoBase64, logoOriginalname, 'criblink/agency_logos', resourceType);
                logo_url = uploadRes.url;
                logo_public_id = uploadRes.publicId;
            } else {
                // If logoBase64 is null, it means clear the logo
                logo_url = null;
                logo_public_id = null;
            }
        }

        const fieldsToUpdate = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) { fieldsToUpdate.push(`name = $${paramIndex++}`); values.push(name); }
        if (email !== undefined) { fieldsToUpdate.push(`email = $${paramIndex++}`); values.push(email); }
        if (phone !== undefined) { fieldsToUpdate.push(`phone = $${paramIndex++}`); values.push(phone); }
        if (website !== undefined) { fieldsToUpdate.push(`website = $${paramIndex++}`); values.push(website); }
        if (description !== undefined) { fieldsToUpdate.push(`description = $${paramIndex++}`); values.push(description); }
        // Only add logo fields if they were explicitly handled above (i.e., logoBase64 was in payload)
        if (logo_url !== undefined) { fieldsToUpdate.push(`logo_url = $${paramIndex++}`); values.push(logo_url); }
        if (logo_public_id !== undefined) { fieldsToUpdate.push(`logo_public_id = $${paramIndex++}`); values.push(logo_public_id); }

        if (fieldsToUpdate.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        values.push(id); // Add agency_id to the end of values for WHERE clause

        const result = await client.query(
            `UPDATE agencies SET
             ${fieldsToUpdate.join(', ')},
             updated_at = NOW()
             WHERE agency_id = $${paramIndex} RETURNING *`,
            values
        );

        await client.query('COMMIT');
        logActivity('Agency Updated', `${performingUserRole} updated agency: ${result.rows[0].name}`, performingUserId);
        res.status(200).json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating agency:', error);
        res.status(500).json({ message: 'Server error updating agency.', error: error.message });
    } finally {
        client.release();
    }
};

/**
 * @desc Delete an agency
 * @route DELETE /api/agencies/:id
 * @access Private (Super Admin only)
 */
exports.deleteAgency = async (req, res) => {
    const { id } = req.params;
    const performingUserId = req.user.user_id;
    const performingUserRole = req.user.role;
    const client = await db.pool.connect(); // Corrected: access pool from db

    try {
        await client.query('BEGIN');

        if (performingUserRole !== 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Only super admins can delete agencies.' });
        }

        // Get logo public ID for Cloudinary deletion
        const agencyResult = await client.query('SELECT logo_public_id FROM agencies WHERE agency_id = $1', [id]);
        const logoPublicId = agencyResult.rows[0]?.logo_public_id;

        const result = await db.query('DELETE FROM agencies WHERE agency_id = $1 RETURNING name', [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Agency not found.' });
        }

        // Delete logo from Cloudinary
        if (logoPublicId) {
            await deleteFromCloudinary(logoPublicId); // Use directly imported function
        }

        await client.query('COMMIT');
        logActivity('Agency Deleted', `Admin deleted agency: ${result.rows[0].name}`, performingUserId);
        res.status(200).json({ message: 'Agency deleted successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting agency:', error);
        res.status(500).json({ message: 'Server error deleting agency.', error: error.message });
    } finally {
        client.release();
    }
};

/**
 * @desc Agent requests to join an agency
 * @route POST /api/agencies/request-to-join
 * @access Private (Agent only)
 */
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
        await client.query('BEGIN');

        // Check if agency exists
        const agencyExists = await client.query('SELECT agency_id FROM agencies WHERE agency_id = $1', [agency_id]);
        if (agencyExists.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Agency not found.' });
        }

        // Check if agent is already a member or has a pending/rejected/other request
        const existingMembership = await client.query(
            `SELECT request_status FROM agency_members WHERE agency_id = $1 AND agent_id = $2`,
            [agency_id, agentId]
        );

        if (existingMembership.rows.length > 0) {
            const status = existingMembership.rows[0].request_status;
            if (status === 'pending') {
                await client.query('ROLLBACK');
                return res.status(409).json({ message: 'You already have a pending request to join this agency.' });
            } else if (status === 'accepted') {
                await client.query('ROLLBACK');
                return res.status(409).json({ message: 'You are already a member of this agency.' });
            } else {
                // If status is 'rejected' or any other non-accepted/non-pending status,
                // update the existing record to 'pending'
                await client.query(
                    `UPDATE agency_members SET request_status = 'pending', updated_at = NOW() WHERE agency_id = $1 AND agent_id = $2`,
                    [agency_id, agentId]
                );
                await client.query('COMMIT');
                logActivity('Agency Join Request Re-sent', `Agent ${agentId} re-sent request to join agency ${agency_id}`, agentId);
                return res.status(200).json({ message: 'Your previous agency join request has been re-sent and is now pending approval.' });
            }
        }

        // If no existing membership, insert new pending request with default member_status
        await client.query(
            `INSERT INTO agency_members (agency_id, agent_id, role, request_status, member_status)
             VALUES ($1, $2, 'agent', 'pending', 'regular')`, // Added default 'regular'
            [agency_id, agentId]
        );

        await client.query('COMMIT');
        logActivity('Agency Join Request', `Agent ${agentId} requested to join agency ${agency_id}`, agentId);
        res.status(201).json({ message: 'Agency join request sent successfully. Awaiting approval.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error sending agency join request:', error);
        // Specifically catch the duplicate key error if it still occurs due to a race condition
        if (error.code === '23505') {
            return res.status(409).json({ message: 'A request to join this agency already exists for you. Please check your pending requests or membership status.' });
        }
        res.status(500).json({ message: 'Server error sending join request.', error: error.message });
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
    const client = await db.pool.connect(); // Corrected: access pool from db

    try {
        await client.query('BEGIN');

        // Get request details and check authorization
        const requestResult = await client.query(
            `SELECT am.agency_id, am.agent_id, a.agency_admin_id, am.request_status
             FROM agency_members am
             JOIN agencies a ON am.agency_id = a.agency_id
             WHERE am.agency_member_id = $1 AND am.request_status = 'pending'`, // Assuming agency_member_id is primary key for agency_members
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Pending join request not found or already processed.' });
        }

        const { agency_id, agent_id: agentToApprove, agency_admin_id: owningAgencyAdminId } = requestResult.rows[0];

        // Authorization check: Must be the agency's admin or a super admin
        if (performingUserRole === 'agency_admin') {
            if (owningAgencyAdminId !== performingUserId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Forbidden: You are not authorized to approve requests for this agency.' });
            }
        } else if (performingUserRole !== 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        // Update request status to 'accepted' and set default member_status
        await client.query(
            `UPDATE agency_members SET request_status = 'accepted', joined_at = NOW(), updated_at = NOW(), member_status = 'regular' WHERE agency_member_id = $1`,
            [requestId]
        );

        // Update the agent's user record to link them to the agency
        const agencyNameResult = await client.query('SELECT name FROM agencies WHERE agency_id = $1', [agency_id]);
        const agencyName = agencyNameResult.rows[0].name;

        await client.query(
            `UPDATE users SET agency_id = $1, agency = $2 WHERE user_id = $3`,
            [agency_id, agencyName, agentToApprove]
        );

        await client.query('COMMIT');
        logActivity('Agency Join Request Approved', `${performingUserRole} approved agent ${agentToApprove}'s request to join agency ${agency_id}`, performingUserId);
        res.status(200).json({ message: 'Agent join request approved successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving agency join request:', error);
        res.status(500).json({ message: 'Server error approving join request.', error: error.message });
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
    const client = await db.pool.connect(); // Corrected: access pool from db

    try {
        await client.query('BEGIN');

        // Get request details and check authorization
        const requestResult = await client.query(
            `SELECT am.agency_id, am.agent_id, a.agency_admin_id, am.request_status
             FROM agency_members am
             JOIN agencies a ON am.agency_id = a.agency_id
             WHERE am.agency_member_id = $1 AND am.request_status = 'pending'`,
            [requestId]
        );

        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Pending join request not found or already processed.' });
        }

        const { agency_id, agent_id: agentToReject, agency_admin_id: owningAgencyAdminId } = requestResult.rows[0];

        // Authorization check
        if (performingUserRole === 'agency_admin') {
            if (owningAgencyAdminId !== performingUserId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Forbidden: You are not authorized to reject requests for this agency.' });
            }
        } else if (performingUserRole !== 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        // Update request status to 'rejected'
        await client.query(
            `UPDATE agency_members SET request_status = 'rejected', updated_at = NOW() WHERE agency_member_id = $1`,
            [requestId]
        );

        // Optionally, remove agency_id and agency from the rejected agent's user record
        // This ensures they can re-apply or join another agency without lingering data
        await client.query(
            `UPDATE users SET agency_id = NULL, agency = NULL WHERE user_id = $1`,
            [agentToReject]
        );

        await client.query('COMMIT');
        logActivity('Agency Join Request Rejected', `${performingUserRole} rejected agent ${agentToReject}'s request to join agency ${agency_id}`, performingUserId);
        res.status(200).json({ message: 'Agent join request rejected.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error rejecting agency join request:', error);
        res.status(500).json({ message: 'Server error rejecting join request.', error: error.message });
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
    const performingUserId = req.user.user_id;
    const performingUserRole = req.user.role;

    try {
        // Verify authorization: User must be the agency admin or a super admin
        const agencyResult = await db.query('SELECT agency_admin_id FROM agencies WHERE agency_id = $1', [agencyId]); // Corrected: use db.query
        if (agencyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Agency not found.' });
        }
        const owningAgencyAdminId = agencyResult.rows[0].agency_admin_id;

        if (performingUserRole === 'agency_admin') {
            if (owningAgencyAdminId !== performingUserId) {
                return res.status(403).json({ message: 'Forbidden: You are not authorized to view agents for this agency.' });
            }
        } else if (performingUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        const result = await db.query( // Corrected: use db.query
            `SELECT
                u.user_id, u.full_name, u.email, u.phone, u.profile_picture_url, u.date_joined, u.status AS user_status,
                u.role AS agency_role, -- Corrected: Fetch role from users table for 'agency_admin'
                am.joined_at,
                am.member_status -- Fetch member_status
             FROM users u
             JOIN agency_members am ON u.user_id = am.agent_id
             WHERE am.agency_id = $1 AND am.request_status = 'accepted'
             ORDER BY u.full_name`,
            [agencyId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching agents for agency:', error);
        res.status(500).json({ message: 'Server error fetching agents.', error: error.message });
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
        // Verify authorization: User must be the agency admin or a super admin
        const agencyResult = await db.query('SELECT agency_admin_id FROM agencies WHERE agency_id = $1', [agencyId]); // Corrected: use db.query
        if (agencyResult.rows.length === 0) {
            return res.status(404).json({ message: 'Agency not found.' });
        }
        const owningAgencyAdminId = agencyResult.rows[0].agency_admin_id;

        if (performingUserRole === 'agency_admin') {
            if (owningAgencyAdminId !== performingUserId) {
                return res.status(403).json({ message: 'Forbidden: You are not authorized to view pending requests for this agency.' });
            }
        } else if (performingUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        const result = await db.query( // Corrected: use db.query
            `SELECT
                am.agency_member_id AS request_id, -- Use this as the ID for the request
                u.user_id AS agent_id, u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone,
                u.profile_picture_url AS agent_profile_picture_url,
                am.request_status, am.joined_at AS requested_at, am.message,
                am.member_status -- Fetch member_status
             FROM agency_members am
             JOIN users u ON am.agent_id = u.user_id
             WHERE am.agency_id = $1 AND am.request_status = 'pending'
             ORDER BY am.joined_at DESC`,
            [agencyId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching pending agency join requests:', error);
        res.status(500).json({ message: 'Server error fetching pending requests.', error: error.message });
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

    // Authorization: Agent can see their own requests, Agency Admin can see their agents' requests
    if (parseInt(agentId) !== performingUserId && performingUserRole !== 'agency_admin' && performingUserRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: You are not authorized to view these requests.' });
    }

    try {
        const result = await db.query(
            `SELECT
                am.agency_member_id AS request_id,
                am.agency_id,
                a.name AS agency_name,
                am.request_status,
                am.joined_at AS requested_at,
                am.message,
                am.member_status -- Fetch member_status
             FROM agency_members am
             JOIN agencies a ON am.agency_id = a.agency_id
             WHERE am.agent_id = $1 AND am.request_status = 'pending'
             ORDER BY am.joined_at DESC`,
            [agentId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching agent pending requests:', error);
        res.status(500).json({ message: 'Server error fetching agent pending requests.', error: error.message });
    }
};


/**
 * @desc Remove an agent from an agency (by agency admin or super admin)
 * @route DELETE /api/agencies/:agencyId/members/:agentId
 * @access Private (Agency Admin or Super Admin)
 */
exports.removeAgencyMember = async (req, res) => {
    const { agencyId, agentId } = req.params;
    const performingUserId = req.user.user_id;
    const performingUserRole = req.user.role;
    const client = await db.pool.connect(); // Corrected: access pool from db

    try {
        await client.query('BEGIN');

        // Verify authorization: User must be the agency admin or a super admin
        const agencyResult = await db.query('SELECT agency_admin_id FROM agencies WHERE agency_id = $1', [agencyId]);
        if (agencyResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Agency not found.' });
        }
        const owningAgencyAdminId = agencyResult.rows[0].agency_admin_id;

        if (performingUserRole === 'agency_admin') {
            if (owningAgencyAdminId !== performingUserId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Forbidden: You are not authorized to remove members from this agency.' });
            }
        } else if (performingUserRole !== 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        // Ensure the agent is actually a member of this agency
        const memberCheck = await client.query(
            `SELECT * FROM agency_members WHERE agency_id = $1 AND agent_id = $2 AND request_status = 'accepted'`,
            [agencyId, agentId]
        );
        if (memberCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Agent is not an active member of this agency.' });
        }

        // Remove the agent from agency_members table
        await client.query(
            `DELETE FROM agency_members WHERE agency_id = $1 AND agent_id = $2`,
            [agencyId, agentId]
        );

        // Update the agent's user record to remove agency affiliation
        await client.query(
            `UPDATE users SET agency_id = NULL, agency = NULL WHERE user_id = $1`,
            [agentId]
        );

        await client.query('COMMIT');
        logActivity('Agency Member Removed', `${performingUserRole} removed agent ${agentId} from agency ${agencyId}`, performingUserId);
        res.status(200).json({ message: 'Agent removed from agency successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error removing agency member:', error);
        res.status(500).json({ message: 'Server error removing agency member.', error: error.message });
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
    const client = await db.pool.connect(); // Corrected: access pool from db

    try {
        await client.query('BEGIN');

        // 1. Verify user is agency_admin and owns this agency
        if (performingUserRole !== 'agency_admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Only agency administrators can delete their agency.' });
        }

        const agencyCheck = await client.query('SELECT agency_admin_id, logo_public_id FROM agencies WHERE agency_id = $1', [agencyId]);
        if (agencyCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Agency not found.' });
        }
        const { agency_admin_id: owningAgencyAdminId, logo_public_id: agencyLogoPublicId } = agencyCheck.rows[0];

        if (owningAgencyAdminId !== performingUserId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: You can only delete your own agency.' });
        }

        // 2. Disassociate all agents from this agency
        const agencyMembers = await client.query(
            `SELECT agent_id FROM agency_members WHERE agency_id = $1`,
            [agencyId]
        );

        for (const member of agencyMembers.rows) {
            await client.query(
                `UPDATE users SET agency_id = NULL, agency = NULL WHERE user_id = $1`,
                [member.agent_id]
            );
        }

        // 3. Delete all agency_members entries for this agency
        await client.query(
            `DELETE FROM agency_members WHERE agency_id = $1`,
            [agencyId]
        );

        // 4. Delete the agency record itself
        await client.query(
            `DELETE FROM agencies WHERE agency_id = $1`,
            [agencyId]
        );

        // 5. Delete agency logo from Cloudinary if exists
        if (agencyLogoPublicId) {
            await deleteFromCloudinary(agencyLogoPublicId); // Use directly imported function
        }

        // 6. Revert the current agency admin's role to 'agent'
        const updatedUserResult = await client.query(
            `UPDATE users SET role = 'agent', agency_id = NULL, agency = NULL WHERE user_id = $1 RETURNING *`,
            [performingUserId]
        );
        const updatedUser = updatedUserResult.rows[0];

        await client.query('COMMIT');

        // Generate a new JWT token with the updated role
        const newToken = jwt.sign({
            user_id: updatedUser.user_id,
            name: updatedUser.full_name,
            email: updatedUser.email,
            role: updatedUser.role, // Will be 'agent'
            agency_id: updatedUser.agency_id, // Will be null
            status: updatedUser.status,
            session_id: req.user.session_id
        }, SECRET_KEY, { expiresIn: '7d' });

        logActivity('Agency Deleted by Admin', `Agency Admin ${performingUserId} deleted agency ${agencyId} and reverted to agent.`, performingUserId);

        res.status(200).json({
            message: 'Agency deleted and your role reverted successfully.',
            user: updatedUser,
            token: newToken
        });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error deleting agency by admin:', error);
        res.status(500).json({ message: 'Failed to delete agency.', error: error.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

// --- NEW: Promote Member to Agency Admin ---
exports.promoteMemberToAdmin = async (req, res) => {
    const { agencyId, memberId } = req.params; // Get both agencyId and memberId from params
    const currentUserId = req.user.user_id;
    const currentUserRole = req.user.role;

    let client;
    try {
        client = await db.pool.connect();
        await client.query('BEGIN');

        // 1. Verify the current user is an agency_admin for THIS agency
        const agencyCheck = await client.query('SELECT agency_admin_id FROM agencies WHERE agency_id = $1', [agencyId]);
        if (agencyCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Agency not found.' });
        }
        const owningAgencyAdminId = agencyCheck.rows[0].agency_admin_id;

        if (currentUserRole === 'agency_admin') {
            if (owningAgencyAdminId !== currentUserId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Forbidden: You are not authorized to manage members for this agency.' });
            }
        } else if (currentUserRole !== 'admin') { // Allow super admin as well
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        // 2. Check if the target member is part of this agency and is not already an admin
        const memberCheck = await client.query(
            `SELECT u.role, am.request_status FROM users u JOIN agency_members am ON u.user_id = am.agent_id
             WHERE u.user_id = $1 AND am.agency_id = $2 AND am.request_status = 'accepted'`,
            [memberId, agencyId]
        );

        if (memberCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Member not found in this agency or not an active member.' });
        }
        if (memberCheck.rows[0].role === 'agency_admin') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Member is already an agency administrator.' });
        }

        // 3. Update the member's role in the 'users' table
        const userUpdateResult = await client.query(
            `UPDATE users SET role = 'agency_admin', updated_at = NOW() WHERE user_id = $1 RETURNING *`,
            [memberId]
        );

        // 4. Update the member's role in the 'agency_members' table
        await client.query(
            `UPDATE agency_members SET role = 'admin', updated_at = NOW() WHERE agent_id = $1 AND agency_id = $2`,
            [memberId, agencyId]
        );

        await client.query('COMMIT');
        await logActivity(`Member ${userUpdateResult.rows[0].full_name} promoted to admin by ${req.user.full_name} in agency ${agencyId}`, currentUserId, 'member_role_change');

        res.status(200).json({ message: 'Member promoted to administrator successfully.' });

    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error promoting member to admin:', err);
        res.status(500).json({ message: 'Failed to promote member.', error: err.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

// --- NEW: Demote Member to Agent ---
exports.demoteMemberToAgent = async (req, res) => {
    const { agencyId, memberId } = req.params; // Get both agencyId and memberId from params
    const currentUserId = req.user.user_id;
    const currentUserRole = req.user.role;

    let client;
    try {
        client = await db.pool.connect();
        await client.query('BEGIN');

        // 1. Verify the current user is an agency_admin for THIS agency
        const agencyCheck = await client.query('SELECT agency_admin_id FROM agencies WHERE agency_id = $1', [agencyId]);
        if (agencyCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Agency not found.' });
        }
        const owningAgencyAdminId = agencyCheck.rows[0].agency_admin_id;

        if (currentUserRole === 'agency_admin') {
            if (owningAgencyAdminId !== currentUserId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Forbidden: You are not authorized to manage members for this agency.' });
            }
        } else if (currentUserRole !== 'admin') { // Allow super admin as well
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        // 2. Check if the target member is part of this agency and is an admin
        const memberCheck = await client.query(
            `SELECT u.role, am.request_status FROM users u JOIN agency_members am ON u.user_id = am.agent_id
             WHERE u.user_id = $1 AND am.agency_id = $2 AND am.request_status = 'accepted'`,
            [memberId, agencyId]
        );

        if (memberCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Member not found in this agency or not an active member.' });
        }
        if (memberCheck.rows[0].role !== 'agency_admin') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Member is not an agency administrator.' });
        }

        // 3. Prevent demoting self if they are the last admin in this agency
        if (parseInt(memberId) === currentUserId) {
            const adminCountResult = await client.query(
                `SELECT COUNT(*) FROM users WHERE agency_id = $1 AND role = 'agency_admin'`,
                [agencyId]
            );
            if (parseInt(adminCountResult.rows[0].count) <= 1) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'You cannot demote yourself as you are the last agency administrator.' });
            }
        }

        // 4. Update the member's role in the 'users' table
        const userUpdateResult = await client.query(
            `UPDATE users SET role = 'agent', updated_at = NOW() WHERE user_id = $1 RETURNING *`,
            [memberId]
        );

        // 5. Update the member's role in the 'agency_members' table
        await client.query(
            `UPDATE agency_members SET role = 'agent', updated_at = NOW() WHERE agent_id = $1 AND agency_id = $2`,
            [memberId, agencyId]
        );

        await client.query('COMMIT');
        await logActivity(`Member ${userUpdateResult.rows[0].full_name} demoted to agent by ${req.user.full_name} in agency ${agencyId}`, currentUserId, 'member_role_change');

        res.status(200).json({ message: 'Member demoted to agent successfully.' });

    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error demoting member to agent:', err);
        res.status(500).json({ message: 'Failed to demote member.', error: err.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

// --- NEW: Update Member Status (VIP/Regular) ---
exports.updateMemberStatus = async (req, res) => {
    const { agencyId, memberId } = req.params;
    const { status } = req.body; // 'vip' or 'regular'
    const currentUserId = req.user.user_id;
    const currentUserRole = req.user.role;

    let client;
    try {
        client = await db.pool.connect();
        await client.query('BEGIN');

        // 1. Basic validation for status
        if (!['vip', 'regular'].includes(status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Invalid status provided. Must be "vip" or "regular".' });
        }

        // 2. Verify the current user is an agency_admin for THIS agency or a super admin
        const agencyCheck = await client.query('SELECT agency_admin_id FROM agencies WHERE agency_id = $1', [agencyId]);
        if (agencyCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Agency not found.' });
        }
        const owningAgencyAdminId = agencyCheck.rows[0].agency_admin_id;

        if (currentUserRole === 'agency_admin') {
            if (owningAgencyAdminId !== currentUserId) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Forbidden: You are not authorized to manage members for this agency.' });
            }
        } else if (currentUserRole !== 'admin') { // Allow super admin as well
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        // Prevent an admin from changing their own member status
        if (parseInt(memberId) === currentUserId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: You cannot change your own member status.' });
        }

        // 3. Check if the target member is part of this agency and is an active member
        const memberCheck = await client.query(
            `SELECT am.member_status FROM agency_members am
             WHERE am.agent_id = $1 AND am.agency_id = $2 AND am.request_status = 'accepted'`,
            [memberId, agencyId]
        );

        if (memberCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Member not found in this agency or not an active member.' });
        }

        // 4. Update the member_status in the 'agency_members' table
        await client.query(
            `UPDATE agency_members SET member_status = $1, updated_at = NOW() WHERE agent_id = $2 AND agency_id = $3`,
            [status, memberId, agencyId]
        );

        await client.query('COMMIT');
        await logActivity(`Member ${memberId} status updated to ${status} by ${req.user.full_name} in agency ${agencyId}`, currentUserId, 'member_status_change');

        res.status(200).json({ message: `Member status updated to ${status} successfully.` });

    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error updating member status:', err);
        res.status(500).json({ message: 'Failed to update member status.', error: err.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

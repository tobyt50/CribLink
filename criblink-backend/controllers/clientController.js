const db = require('../db');
const logActivity = require('../utils/logActivity'); // Assuming you have this utility if needed

// Fetch all clients + VIP + notes for a specific agent
const getClientsForAgent = async (req, res) => {
  const { agentId } = req.params;
  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  // Authorization: An agent can only view their own clients.
  // Admins can view any agent's clients. Agency Admins can view clients of agents in their agency.
  if (parseInt(agentId) !== currentUserId && currentUserRole !== 'admin' && currentUserRole !== 'agency_admin') {
    return res.status(403).json({ message: 'Forbidden: You are not authorized to view these clients.' });
  }

  try {
    let queryText = `
      SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.profile_picture_url,
        u.date_joined,
        u.status,
        ac.notes,
        ac.status AS client_status,
        (SELECT COUNT(*) FROM inquiries WHERE client_id = u.user_id AND agent_id = ac.agent_id AND read_by_agent = FALSE AND message_type = 'client_reply') AS unread_messages_count
      FROM agent_clients ac
      JOIN users u ON ac.client_id = u.user_id
      WHERE ac.agent_id = $1 AND ac.request_status = 'accepted'
      ORDER BY u.full_name ASC
    `;
    const queryParams = [agentId];

    const result = await db.query(queryText, queryParams);

    const clients = result.rows.map(client => ({
      ...client,
      hasUnreadMessagesFromClient: client.unread_messages_count > 0,
    }));

    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients for agent:', error);
    res.status(500).json({ message: 'Server error fetching clients.', error: error.message });
  }
};

// Function to get a specific client's full profile details
const getClientProfileDetails = async (req, res) => {
    const { clientId } = req.params;
    const requestingUserId = req.user.user_id; // The ID of the authenticated user
    const requestingUserRole = req.user.role; // The role of the authenticated user


    try {
        // Fetch client details from the 'users' table, now including 'last_login' and share_favourites_with_agents
        const userResult = await db.query(
            `SELECT
                user_id,
                full_name,
                email,
                phone,
                profile_picture_url,
                date_joined,
                last_login,
                status AS user_status,
                share_favourites_with_agents, -- NEW: Add this column to the select statement
                share_property_preferences_with_agents -- NEW: Add this column
             FROM users WHERE user_id = $1`,
            [clientId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Client not found.' });
        }
        const clientDetails = userResult.rows[0];


        // Fetch client-agent relationship details (notes, client_status)
        // Now also checking request_status
        const agentClientResult = await db.query(
            `SELECT notes, status AS client_status, request_status
             FROM agent_clients
             WHERE agent_id = $1 AND client_id = $2`,
            [requestingUserId, clientId]
        );

        let agentSpecificDetails = {};
        if (agentClientResult.rows.length > 0) {
            agentSpecificDetails = agentClientResult.rows[0];
        } else {
            // If an agent is trying to view a client not linked to them, and there's no relationship, deny
            if (requestingUserRole === 'agent') {
                return res.status(403).json({ message: 'Forbidden: This client is not associated with your account.' });
            }
        }

        const combinedClientData = {
            ...clientDetails,
            ...agentSpecificDetails
        };

        res.status(200).json(combinedClientData);

    } catch (err) {
        console.error('Get client profile details error:', err);
        res.status(500).json({ error: 'Internal error fetching client profile details.', details: err.message });
    }
};

// Get Client Property Preferences
const getClientPreferences = async (req, res) => {
    const { clientId } = req.params;
    try {
        const result = await db.query(
            `SELECT preferred_property_type, preferred_location, min_price, max_price, min_bedrooms, min_bathrooms
             FROM client_property_preferences
             WHERE user_id = $1`,
            [clientId]
        );

        if (result.rows.length === 0) {
            // If no preferences are set, return defaults or an empty object
            return res.status(200).json({
                preferred_property_type: 'any',
                preferred_location: 'any',
                min_price: 0,
                max_price: 1000000000,
                min_bedrooms: 0,
                min_bathrooms: 0
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching client preferences:', err);
        res.status(500).json({ error: 'Failed to fetch client preferences.', details: err.message });
    }
};

// Update Client Property Preferences
const updateClientPreferences = async (req, res) => {
    const { clientId } = req.params;
    const { preferred_property_type, preferred_location, min_price, max_price, min_bedrooms, min_bathrooms } = req.body;

    try {
        const query = `
            INSERT INTO client_property_preferences (user_id, preferred_property_type, preferred_location, min_price, max_price, min_bedrooms, min_bathrooms, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (user_id) DO UPDATE
            SET
                preferred_property_type = EXCLUDED.preferred_property_type,
                preferred_location = EXCLUDED.preferred_location,
                min_price = EXCLUDED.min_price,
                max_price = EXCLUDED.max_price,
                min_bedrooms = EXCLUDED.min_bedrooms,
                min_bathrooms = EXCLUDED.min_bathrooms,
                last_updated = NOW()
            RETURNING *;
        `;
        const values = [clientId, preferred_property_type, preferred_location, min_price, max_price, min_bedrooms, min_bathrooms];
        const result = await db.query(query, values);

        res.status(200).json({ message: 'Client preferences updated successfully.', preferences: result.rows[0] });
    } catch (err) {
        console.error('Error updating client preferences:', err);
        res.status(500).json({ error: 'Failed to update client preferences.', details: err.message });
    }
};

// Get Agent-Recommended Listings for a Client (Existing: for agents to see what they recommended to a client)
const getRecommendedListings = async (req, res) => {
    const { clientId } = req.params;
    const agentId = req.user.user_id; // The authenticated agent

    // Authorization: Only the recommending agent or admin can access this
    if (req.user.role === 'client' || (req.user.role === 'agent' && parseInt(agentId) !== req.user.user_id)) {
        return res.status(403).json({ message: 'Forbidden: You are not authorized to view these recommendations.' });
    }

    try {
        const result = await db.query(
            `SELECT arl.property_id, pl.title, pl.location, pl.price, pl.image_url, arl.recommended_at,
                    pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.status,
                    pd.square_footage, pd.description, pd.amenities,
                    (SELECT ARRAY_AGG(pi.image_url ORDER BY pi.image_id)
                     FROM property_images pi
                     WHERE pi.property_id = pl.property_id) AS gallery_images
             FROM agent_recommended_listings arl
             JOIN property_listings pl ON arl.property_id = pl.property_id
             LEFT JOIN property_details pd ON pl.property_id = pd.property_id
             WHERE arl.agent_id = $1 AND arl.client_id = $2
             ORDER BY arl.recommended_at DESC`,
            [agentId, clientId]
        );
        res.status(200).json({ recommendations: result.rows }); // Wrap in 'recommendations' object
    } catch (err) {
        console.error('Error fetching recommended listings:', err);
        res.status(500).json({ error: 'Failed to fetch recommended listings.', details: err.message });
    }
};

// NEW: Get Recommended Listings from a Specific Agent for an Authenticated Client
const getRecommendedListingsByAgentForClient = async (req, res) => {
    const { clientId, agentId } = req.params;
    const requestingUserId = req.user.user_id;
    const requestingUserRole = req.user.role;

    // Authorization: Only the client themselves, or an admin, can view these recommendations.
    // An agent should not be able to see recommendations made by *other* agents to *this* client.
    if (requestingUserRole === 'client' && parseInt(clientId) !== requestingUserId) {
        return res.status(403).json({ message: 'Forbidden: You can only view recommendations for your own account.' });
    }
    if (requestingUserRole === 'agent' && parseInt(agentId) !== requestingUserId) {
      // If an agent tries to use this endpoint, it should be for their own recommendations to a client.
      // If the agentId in the URL doesn't match the authenticated agent's ID, deny.
      return res.status(403).json({ message: 'Forbidden: You can only view recommendations made by yourself.' });
    }
     if (requestingUserRole === 'guest') {
        return res.status(401).json({ message: 'Authentication required to view recommended listings.' });
    }

    try {
        const result = await db.query(
            `SELECT arl.property_id, pl.title, pl.location, pl.price, pl.image_url, arl.recommended_at,
                    pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.status,
                    pd.square_footage, pd.description, pd.amenities,
                    (SELECT ARRAY_AGG(pi.image_url ORDER BY pi.image_id)
                     FROM property_images pi
                     WHERE pi.property_id = pl.property_id) AS gallery_images
             FROM agent_recommended_listings arl
             JOIN property_listings pl ON arl.property_id = pl.property_id
             LEFT JOIN property_details pd ON pl.property_id = pd.property_id
             WHERE arl.agent_id = $1 AND arl.client_id = $2
             ORDER BY arl.recommended_at DESC`,
            [agentId, clientId]
        );
        res.status(200).json({ recommendations: result.rows }); // Wrap in 'recommendations' object
    } catch (err) {
        console.error('Error fetching recommended listings by agent for client:', err);
        res.status(500).json({ error: 'Failed to fetch recommended listings by agent for client.', details: err.message });
    }
};


// Add a Recommended Listing for a Client
const addRecommendedListing = async (req, res) => {
    const { clientId, propertyId } = req.params;
    const agentId = req.user.user_id;

    try {
        const result = await db.query(
            `INSERT INTO agent_recommended_listings (agent_id, client_id, property_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (agent_id, client_id, property_id) DO NOTHING
             RETURNING *;`, // RETURNING * to see if it was inserted or conflicted
            [agentId, clientId, propertyId]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({ message: 'Listing already recommended to this client by you.' });
        }
        res.status(201).json({ message: 'Listing recommended successfully.', recommendation: result.rows[0] });
    } catch (err) {
        console.error('Error adding recommended listing:', err);
        res.status(500).json({ error: 'Failed to add recommended listing.', details: err.message });
    }
};

// Remove a Recommended Listing for a Client
const removeRecommendedListing = async (req, res) => {
    const { clientId, propertyId } = req.params;
    const agentId = req.user.user_id;

    try {
        const result = await db.query(
            `DELETE FROM agent_recommended_listings
             WHERE agent_id = $1 AND client_id = $2 AND property_id = $3
             RETURNING property_id;`,
            [agentId, clientId, propertyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Recommended listing not found.' });
        }
        res.status(200).json({ message: 'Recommended listing removed successfully.', removedPropertyId: result.rows[0].property_id });
    } catch (err) {
        console.error('Error removing recommended listing:', err);
        res.status(500).json({ error: 'Failed to remove recommended listing.', details: err.message });
    }
};


// NEW: sendConnectionRequestToAgent - Client sends a connection request to an agent
const sendConnectionRequestToAgent = async (req, res) => {
    const { agentId } = req.params; // The agent the client wants to connect with
    const clientId = req.user.user_id; // The authenticated client sending the request
    const { message } = req.body; // Optional message

    // Authorization: Only authenticated clients can send requests to agents
    if (req.user.role !== 'client') {
        return res.status(403).json({ message: 'Forbidden: Only clients can send connection requests to agents.' });
    }
    if (parseInt(agentId) === clientId) {
        return res.status(400).json({ message: 'You cannot send a connection request to yourself.' });
    }

    try {
        // Check if the recipient is actually an agent
        const agentCheck = await db.query(`SELECT user_id FROM users WHERE user_id = $1 AND role = 'agent'`, [agentId]);
        if (agentCheck.rows.length === 0) {
            return res.status(404).json({ message: 'The specified recipient is not a valid agent.' });
        }

        // Check for existing relationship in agent_clients (already connected)
        const existingAgentClientRelationship = await db.query(
            `SELECT * FROM agent_clients WHERE agent_id = $1 AND client_id = $2 AND request_status = 'accepted'`,
            [agentId, clientId]
        );
        if (existingAgentClientRelationship.rows.length > 0) {
            return res.status(200).json({ message: 'You are already connected with this agent.', status: 'connected' });
        }

        // Check for existing request (any status) between client and agent
        const existingRequest = await db.query(
            `SELECT request_id, status, sender_id FROM agent_client_requests
             WHERE (sender_id = $1 AND receiver_id = $2)
             OR (sender_id = $2 AND receiver_id = $1)`, // Check both directions regardless of status
            [clientId, agentId]
        );

        if (existingRequest.rows.length > 0) {
            const request = existingRequest.rows[0];
            const reqStatus = request.status;

            if (reqStatus === 'pending') {
                if (request.sender_id === clientId) {
                    return res.status(200).json({ message: 'Connection request already sent and pending.', status: 'pending_sent' });
                } else {
                    return res.status(200).json({ message: 'This agent has already sent you a connection request. Check your incoming requests.', status: 'pending_received' });
                }
            } else if (reqStatus === 'accepted') {
                // This case should ideally be caught by existingAgentClientRelationship check above, but as a safeguard
                return res.status(200).json({ message: 'You are already connected with this agent.', status: 'connected' });
            } else if (reqStatus === 'rejected') {
                // If rejected, update the existing request back to pending
                await db.query(
                    `UPDATE agent_client_requests
                     SET status = 'pending', message = $1, updated_at = NOW(), sender_id = $2, receiver_id = $3, sender_role = 'client', receiver_role = 'agent'
                     WHERE request_id = $4
                     RETURNING *;`,
                    [message, clientId, agentId, request.request_id]
                );
                return res.status(200).json({ message: 'Connection request re-sent successfully.', status: 'pending_sent' });
            }
        }

        // If no existing request (or it was handled by the rejected logic), insert a new one
        await db.query(
            `INSERT INTO agent_client_requests (sender_id, receiver_id, sender_role, receiver_role, status, message)
             VALUES ($1, $2, 'client', 'agent', 'pending', $3)`,
            [clientId, agentId, message]
        );
        res.status(201).json({ message: 'Connection request sent successfully to agent.', status: 'pending_sent' });

    } catch (err) {
        console.error('Error sending connection request to agent:', err);
        res.status(500).json({ error: 'Failed to send connection request to agent.', details: err.message });
    }
};

// NEW: getConnectionStatus - Get connection status between a client and an agent
const getConnectionStatus = async (req, res) => {
    const { clientId, agentId } = req.params;
    const requestingUserId = req.user.user_id;
    const requestingUserRole = req.user.role;

    // Authorization: Only the client or agent involved, or an admin can check status
    if (requestingUserRole === 'client' && parseInt(clientId) !== requestingUserId) {
        return res.status(403).json({ message: 'Forbidden: You can only check connection status for your own account.' });
    }
    if (requestingUserRole === 'agent' && parseInt(agentId) !== requestingUserId) {
        return res.status(403).json({ message: 'Forbidden: You can only check connection status for your own agent profile.' });
    }
    // Admin role has implicit access, no specific check needed beyond authenticateToken

    try {
        // Check if there's an accepted relationship in agent_clients
        const acceptedRelationship = await db.query(
            `SELECT * FROM agent_clients WHERE (agent_id = $1 AND client_id = $2) AND request_status = 'accepted'`,
            [agentId, clientId]
        );

        if (acceptedRelationship.rows.length > 0) {
            return res.status(200).json({ status: 'connected' });
        }

        // Check for pending requests (sent by client to agent OR by agent to client)
        const pendingRequest = await db.query(
            `SELECT * FROM agent_client_requests
             WHERE (sender_id = $1 AND receiver_id = $2 AND sender_role = 'client' AND receiver_role = 'agent' AND status = 'pending')
             OR (sender_id = $2 AND receiver_id = $1 AND sender_role = 'agent' AND receiver_role = 'client' AND status = 'pending')`,
            [clientId, agentId] // clientId is $1, agentId is $2
        );

        if (pendingRequest.rows.length > 0) {
            const request = pendingRequest.rows[0];
            if (request.sender_id === parseInt(clientId) && request.receiver_id === parseInt(agentId)) {
                return res.status(200).json({ status: 'pending_sent' });
            } else if (request.sender_id === parseInt(agentId) && request.receiver_id === parseInt(clientId)) {
                return res.status(200).json({ status: 'pending_received' });
            }
        }

        // Additionally, check for rejected requests. If one exists, it means the client can potentially resend.
        // We do not want to block them from re-attempting if the previous one was rejected.
        const rejectedRequest = await db.query(
            `SELECT * FROM agent_client_requests
             WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
             AND status = 'rejected'`,
            [clientId, agentId]
        );

        if (rejectedRequest.rows.length > 0) {
            // A rejected request exists, which means a new one *could* be sent (or the old one updated)
            // The client can re-send, so for the UI's purpose, it's like no active request exists.
            return res.status(200).json({ status: 'none' });
        }


        // If neither connected, nor pending, nor rejected (which would reset to 'none'), then status is 'none'
        res.status(200).json({ status: 'none' });

    } catch (err) {
        console.error('Error fetching connection status:', err);
        res.status(500).json({ error: 'Failed to fetch connection status.', details: err.message });
    }
};

// NEW: disconnectFromAgent - Client disconnects from an agent
const disconnectFromAgent = async (req, res) => {
    const { clientId, agentId } = req.params;
    const requestingUserId = req.user.user_id;

    // Authorization: Only the client disconnecting can call this
    if (parseInt(clientId) !== requestingUserId || req.user.role !== 'client') {
        return res.status(403).json({ message: 'Forbidden: You can only disconnect yourself from an agent.' });
    }

    try {
        await db.query('BEGIN'); // Start transaction

        // 1. Delete the entry from agent_clients (remove the active connection)
        const deleteAgentClientResult = await db.query(
            `DELETE FROM agent_clients
             WHERE agent_id = $1 AND client_id = $2 AND request_status = 'accepted'
             RETURNING *;`,
            [agentId, clientId]
        );

        if (deleteAgentClientResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Active connection not found between client and agent.' });
        }

        // 2. Update the status in agent_client_requests to 'rejected'
        // This ensures the request can be re-sent later and reflects the disconnection.
        await db.query(
            `UPDATE agent_client_requests
             SET status = 'rejected', updated_at = NOW()
             WHERE (sender_id = $1 AND receiver_id = $2 AND status = 'accepted')
             OR (sender_id = $2 AND receiver_id = $1 AND status = 'accepted');`,
            [clientId, agentId] // Checks both directions
        );

        await db.query('COMMIT'); // Commit transaction
        res.status(200).json({ message: 'Successfully disconnected from agent.' });

    } catch (err) {
        await db.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error disconnecting from agent:', err);
        res.status(500).json({ error: 'Failed to disconnect from agent.', details: err.message });
    }
};


// NEW: getClientIncomingRequests - Get connection requests sent TO the authenticated client (from agents)
const getClientIncomingRequests = async (req, res) => {
    const clientId = req.user.user_id; // The authenticated client
    const clientRole = req.user.role;

    if (clientRole !== 'client') {
        return res.status(403).json({ message: 'Forbidden: This endpoint is for clients only.' });
    }

    try {
        const result = await db.query(
            `SELECT acr.request_id, acr.sender_id AS agent_id, u.full_name AS client_name, u.email AS client_email, -- Renamed to client_name/email as this is what ClientCard expects
                    u.profile_picture_url AS client_profile_picture_url, acr.message, acr.created_at, acr.status
             FROM agent_client_requests acr
             JOIN users u ON acr.sender_id = u.user_id
             WHERE acr.receiver_id = $1 AND acr.receiver_role = 'client' AND acr.status = 'pending'
             ORDER BY acr.created_at DESC`,
            [clientId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching client incoming requests:', err);
        res.status(500).json({ error: 'Failed to fetch incoming connection requests.', details: err.message });
    }
};

// NEW: getClientOutgoingRequests - Get connection requests sent BY the authenticated client (to agents)
const getClientOutgoingRequests = async (req, res) => {
    const clientId = req.user.user_id; // The authenticated client
    const clientRole = req.user.role;

    if (clientRole !== 'client') {
        return res.status(403).json({ message: 'Forbidden: This endpoint is for clients only.' });
    }

    try {
        const result = await db.query(
            `SELECT acr.request_id, acr.receiver_id AS agent_id, u.full_name AS agent_name, u.email AS agent_email,
                    u.profile_picture_url AS agent_profile_picture_url, acr.message, acr.created_at, acr.status
             FROM agent_client_requests acr
             JOIN users u ON acr.receiver_id = u.user_id
             WHERE acr.sender_id = $1 AND acr.sender_role = 'client'
             ORDER BY acr.created_at DESC`,
            [clientId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching client outgoing requests:', err);
        res.status(500).json({ error: 'Failed to fetch outgoing connection requests.', details: err.message });
    }
};

// NEW: acceptConnectionRequestFromAgent - Client accepts a connection request from an agent
const acceptConnectionRequestFromAgent = async (req, res) => {
    const { requestId } = req.params;
    const clientId = req.user.user_id;
    const clientRole = req.user.role;

    if (clientRole !== 'client') {
        return res.status(403).json({ message: 'Forbidden: Only clients can accept connection requests.' });
    }

    try {
        await db.query('BEGIN'); // Start transaction

        // 1. Update the request status to 'accepted'
        const requestUpdateResult = await db.query(
            `UPDATE agent_client_requests
             SET status = 'accepted', updated_at = NOW()
             WHERE request_id = $1 AND receiver_id = $2 AND receiver_role = 'client' AND status = 'pending'
             RETURNING sender_id, receiver_id;`,
            [requestId, clientId]
        );

        if (requestUpdateResult.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Connection request not found, already accepted, or not pending.' });
        }

        const { sender_id: agentId, receiver_id: acceptedClientId } = requestUpdateResult.rows[0];

        // 2. Insert into agent_clients table if not already present (establishing the primary relationship)
        await db.query(
            `INSERT INTO agent_clients (agent_id, client_id, status, request_status)
             VALUES ($1, $2, 'regular', 'accepted')
             ON CONFLICT (agent_id, client_id) DO UPDATE SET request_status = 'accepted', status = 'regular';`,
            [agentId, acceptedClientId]
        );

        await db.query('COMMIT'); // Commit transaction

        // Optional: Log activity
        // await logActivity(`Client (ID: ${clientId}) accepted connection request from Agent (ID: ${agentId})`, req.user, 'connection_accepted');

        res.status(200).json({ message: 'Connection request accepted successfully.' });

    } catch (err) {
        await db.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error accepting connection request:', err);
        res.status(500).json({ error: 'Failed to accept connection request.', details: err.message });
    }
};

// NEW: rejectConnectionRequestFromAgent - Client rejects a connection request from an agent
const rejectConnectionRequestFromAgent = async (req, res) => {
    const { requestId } = req.params;
    const clientId = req.user.user_id;
    const clientRole = req.user.role;

    if (clientRole !== 'client') {
        return res.status(403).json({ message: 'Forbidden: Only clients can reject connection requests.' });
    }

    try {
        const result = await db.query(
            `UPDATE agent_client_requests
             SET status = 'rejected', updated_at = NOW()
             WHERE request_id = $1 AND receiver_id = $2 AND receiver_role = 'client' AND status = 'pending'
             RETURNING request_id;`,
            [requestId, clientId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Connection request not found, already processed, or not pending.' });
        }

        // Optional: Log activity
        // await logActivity(`Client (ID: ${clientId}) rejected connection request (ID: ${requestId})`, req.user, 'connection_rejected');
        res.status(200).json({ message: 'Connection request rejected successfully.' });

    } catch (err) {
        console.error('Error rejecting connection request:', err);
        res.status(500).json({ error: 'Failed to reject connection request.', details: err.message });
    }
};


// Send email mock
const sendEmailToClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { subject, message } = req.body;

  console.log(`Email from agent ${agentId} to client ${clientId}: Subject=${subject}, Message=${message}`);
  res.status(200).json({ message: 'Email sent (mock)' });
};

// Respond to inquiry mock
const respondToInquiry = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { message } = req.body;

  console.log(`Agent ${agentId} responded to client ${clientId}: ${message}`);
  res.status(200).json({ message: 'Response sent (mock)' });
};

// Add agent notes
const addNoteToClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { note } = req.body;
  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  // Authorization check: Only the assigned agent can update the note
  if (parseInt(agentId) !== currentUserId || currentUserRole !== 'agent') {
    return res.status(403).json({ message: 'Forbidden: You are not authorized to update this client\'s note.' });
  }

  try {
    const result = await db.query(`
      UPDATE agent_clients SET notes = $1 WHERE agent_id = $2 AND client_id = $3 AND request_status = 'accepted'
    `, [note, agentId, clientId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Client connection not found or not accepted.' });
    }

    // Optional: Log activity
    await logActivity(`Agent ${agentId} updated note for client ${clientId}`, req.user, 'client_note_update');

    res.status(200).json({ message: 'Note added successfully.' });
  } catch (err) {
    console.error('Add note error:', err);
    res.status(500).json({ error: 'Error adding note' });
  }
};

// Toggle VIP status
const toggleVipFlag = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { status } = req.body;

  if (!['vip', 'regular'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  // Authorization check: Only the assigned agent can toggle VIP status
  if (parseInt(agentId) !== currentUserId || currentUserRole !== 'agent') {
    return res.status(403).json({ message: 'Forbidden: You are not authorized to change this client\'s VIP status.' });
  }

  try {
    // Only update if the request_status is 'accepted'
    const result = await db.query(`
      UPDATE agent_clients SET status = $1 WHERE agent_id = $2 AND client_id = $3 AND request_status = 'accepted'
    `, [status, agentId, clientId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Client connection not found or not accepted.' });
    }

    // Optional: Log activity
    await logActivity(`Agent ${agentId} changed client ${clientId} status to ${status}`, req.user, 'client_status_update');

    res.status(200).json({ message: 'Client status updated' });
  } catch (err) {
    console.error('Toggle VIP error:', err);
    res.status(500).json({ error: 'Error updating VIP status' });
  }
};

// Optional: Save message to message log
const sendMessageToClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  const { message } = req.body;

  try {
    console.log(`Simulating message from agent ${agentId} to client ${clientId}: ${message}`);
    res.status(200).json({ message: 'Message logged (simulated)' });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Error sending message' });
  }
};

const archiveClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  // Authorization check: Only the assigned agent can archive the client
  if (parseInt(agentId) !== currentUserId || currentUserRole !== 'agent') {
    return res.status(403).json({ message: 'Forbidden: You are not authorized to archive this client.' });
  }

  // Log incoming parameters for debugging
  console.log(`[archiveClient] Attempting to archive client: agentId=${agentId}, clientId=${clientId}`);
  try {
    // Start a transaction to ensure atomicity
    await db.query('BEGIN');

    // 1. Copy to archive first
    const insertArchiveResult = await db.query(`
      INSERT INTO archived_clients (agent_id, client_id, notes, status)
      SELECT agent_id, client_id, notes, status
      FROM agent_clients
      WHERE agent_id = $1 AND client_id = $2 AND request_status = 'accepted'
      ON CONFLICT (agent_id, client_id) DO UPDATE
      SET
          notes = EXCLUDED.notes,
          status = EXCLUDED.status,
          archived_at = NOW()
      RETURNING *;
    `, [agentId, clientId]);

    // Log result of insert operation
    console.log(`[archiveClient] Insert into archived_clients result: rows=${insertArchiveResult.rows.length}`);

    if (insertArchiveResult.rows.length === 0) {
      // If no rows were inserted/updated, it means the client was not found in agent_clients with 'accepted' status
      await db.query('ROLLBACK');
      console.warn(`[archiveClient] Client ${clientId} not found or not in an accepted relationship with agent ${agentId} for archiving.`);
      return res.status(404).json({ message: 'Client not found or not in an accepted relationship to be archived.' });
    }

    // 2. Delete from active agent_clients table
    await db.query(`
      DELETE FROM agent_clients WHERE agent_id = $1 AND client_id = $2 AND request_status = 'accepted';
    `, [agentId, clientId]);

    // 3. Update status in agent_client_requests to 'rejected'
    // This allows client to resend connection request in the future and signifies disconnection.
    await db.query(`
        UPDATE agent_client_requests
        SET status = 'rejected', updated_at = NOW()
        WHERE (sender_id = $1 AND receiver_id = $2 AND status = 'accepted')
        OR (sender_id = $2 AND receiver_id = $1 AND status = 'accepted');
    `, [clientId, agentId]);

    await db.query('COMMIT'); // Commit transaction
    console.log(`[archiveClient] Client ${clientId} archived and relationship disconnected successfully.`);
    res.status(200).json({ message: 'Client archived and relationship disconnected successfully.' });
  } catch (err) {
    await db.query('ROLLBACK'); // Rollback transaction on error
    console.error('Archive client error:', err.message, err.stack); // Log specific error message and stack trace
    res.status(500).json({ error: 'Failed to archive client.', details: err.message }); // Send error message to frontend
  }
};

const getArchivedClients = async (req, res) => {
  const { agentId } = req.params;
  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  // Authorization: An agent can only view their own archived clients.
  // Admins can view any agent's archived clients.
  if (parseInt(agentId) !== currentUserId && currentUserRole !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: You are not authorized to view these archived clients.' });
  }

  try {
    const result = await db.query(`
      SELECT u.user_id, u.full_name, u.email, u.date_joined, u.status, ac.notes, ac.status AS client_status, ac.archived_at
      FROM archived_clients ac
      JOIN users u ON ac.client_id = u.user_id
      WHERE ac.agent_id = $1
    `, [agentId]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch archived error:', err);
    res.status(500).json({ error: 'Failed to fetch archived clients' });
  }
};

const restoreClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  const currentUserId = req.user.user_id;
  const currentUserRole = req.user.role;

  // Authorization check: Only the assigned agent can restore the client
  if (parseInt(agentId) !== currentUserId || currentUserRole !== 'agent') {
    return res.status(403).json({ message: 'Forbidden: You are not authorized to restore this client.' });
  }

  try {
    // Move back to active table
    // When restoring, set request_status to 'accepted' as it signifies an active relationship
    await db.query(`
      INSERT INTO agent_clients (agent_id, client_id, notes, status, request_status)
      SELECT agent_id, client_id, notes, status, 'accepted' as request_status
      FROM archived_clients
      WHERE agent_id = $1 AND client_id = $2
      ON CONFLICT (agent_id, client_id) DO UPDATE SET request_status = 'accepted';
    `, [agentId, clientId]);

    // Remove from archive
    await db.query(`
      DELETE FROM archived_clients WHERE agent_id = $1 AND client_id = $2
    `, [agentId, clientId]);

    // If there was a rejected request, and now it's restored, maybe set it to accepted?
    // Or clear it entirely. For now, we assume if client is restored, they are connected.
    await db.query(`
        UPDATE agent_client_requests
        SET status = 'accepted', updated_at = NOW()
        WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1);
    `, [clientId, agentId]);


    res.status(200).json({ message: 'Client restored' });
  } catch (err) {
    console.error('Restore client error:', err);
    res.status(500).json({ error: 'Failed to restore client' });
  }
};

// Function to permanently delete an archived client
const deleteArchivedClient = async (req, res) => {
  const { agentId, clientId } = req.params;
  try {
    // Delete the client from the archived_clients table
    const result = await db.query(`
      DELETE FROM archived_clients WHERE agent_id = $1 AND client_id = $2
      RETURNING *; -- Optional: return deleted row to confirm deletion
    `, [agentId, clientId]);

    if (result.rows.length === 0) {
      // If no rows were deleted, the client was not found
      return res.status(404).json({ error: 'Archived client not found' });
    }
    res.status(200).json({ message: 'Archived client deleted permanently' });
  } catch (err) {
    console.error('Delete archived client error:', err);
    res.status(500).json({ error: 'Failed to permanently delete archived client' });
  }
};

/**
 * @desc Get all clients associated with agents of a specific agency
 * @route GET /api/clients/agency/:agencyId/clients
 * @access Private (Agency Admin or Super Admin)
 */
const getClientsByAgencyId = async (req, res) => {
    const { agencyId } = req.params;
    const performingUserId = req.user.user_id;
    const performingUserRole = req.user.role;

    try {
        // Authorization: User must be an agency admin of this agency or a super admin
        const agencyExistsCheck = await db.query('SELECT agency_id FROM agencies WHERE agency_id = $1', [agencyId]);
        if (agencyExistsCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Agency not found.' });
        }

        if (performingUserRole === 'agency_admin') {
            const performingUserAgencyResult = await db.query('SELECT agency_id FROM users WHERE user_id = $1', [performingUserId]);
            if (performingUserAgencyResult.rows.length === 0 || performingUserAgencyResult.rows[0].agency_id !== parseInt(agencyId)) {
                return res.status(403).json({ message: 'Forbidden: You are not authorized to view clients for this agency.' });
            }
        } else if (performingUserRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }

        // Fetch all agents belonging to this agency
        const agentsInAgencyResult = await db.query(
            `SELECT user_id FROM users WHERE agency_id = $1 AND role = 'agent'`,
            [agencyId]
        );
        const agentIds = agentsInAgencyResult.rows.map(row => row.user_id);

        if (agentIds.length === 0) {
            return res.status(200).json([]); // No agents in this agency, so no clients
        }

        // Fetch clients connected to these agents
        const clientsResult = await db.query(
            `SELECT
                c.user_id,
                c.full_name,
                c.email,
                c.phone,
                c.profile_picture_url,
                c.date_joined,
                c.status,
                ac.notes,
                ac.status AS client_status,
                u_agent.user_id AS agent_id,
                u_agent.full_name AS agent_name,
                u_agent.email AS agent_email,
                (SELECT COUNT(*) FROM inquiries WHERE client_id = c.user_id AND agent_id = ac.agent_id AND read_by_agent = FALSE AND message_type = 'client_reply') AS unread_messages_count
             FROM agent_clients ac -- clients
             JOIN users c ON ac.client_id = c.user_id
             JOIN users u_agent ON ac.agent_id = u_agent.user_id
             WHERE ac.agent_id = ANY($1::int[]) AND ac.request_status = 'accepted'
             ORDER BY c.full_name ASC`,
            [agentIds]
        );

        // Additionally, fetch any clients who have initiated inquiries with agents from this agency
        // but might not yet have a formal 'connected' status in agent_clients.
        // This ensures all relevant clients are shown.
        const inquiryClientsResult = await db.query(
            `SELECT DISTINCT
                i.client_id AS user_id,
                COALESCE(u_client.full_name, i.name) AS full_name,
                COALESCE(u_client.email, i.email) AS email,
                COALESCE(u_client.phone, i.phone) AS phone,
                u_client.profile_picture_url,
                u_client.date_joined,
                u_client.status,
                NULL AS notes, -- Notes are specific to agent_clients, not inquiries
                'inquiry' AS client_status, -- Mark as inquiry
                i.agent_id,
                u_agent.full_name AS agent_name,
                u_agent.email AS agent_email,
                (SELECT COUNT(*) FROM inquiries WHERE client_id = i.client_id AND agent_id = i.agent_id AND read_by_agent = FALSE AND message_type = 'client_reply') AS unread_messages_count
             FROM inquiries i
             LEFT JOIN users u_client ON i.client_id = u_client.user_id
             JOIN users u_agent ON i.agent_id = u_agent.user_id
             WHERE i.agent_id = ANY($1::int[])
             AND i.client_id IS NOT NULL
             AND i.message_content IS NOT NULL AND i.message_content != '::shell::' -- Exclude shell messages
             ORDER BY full_name ASC`,
            [agentIds]
        );

        // Combine results, ensuring uniqueness by client_id
        const combinedClientsMap = new Map();
        clientsResult.rows.forEach(client => combinedClientsMap.set(client.user_id, {
          ...client,
          hasUnreadMessagesFromClient: client.unread_messages_count > 0,
        }));
        inquiryClientsResult.rows.forEach(client => {
            if (!combinedClientsMap.has(client.user_id)) { // Only add if not already in connected clients
                combinedClientsMap.set(client.user_id, {
                  ...client,
                  hasUnreadMessagesFromClient: client.unread_messages_count > 0,
                });
            }
        });

        const allAgencyClients = Array.from(combinedClientsMap.values());

        res.status(200).json(allAgencyClients);

    } catch (error) {
        console.error('Error fetching clients for agency:', error);
        res.status(500).json({ message: 'Server error fetching agency clients.', error: error.message });
    }
};

const getClientPendingAgentRequests = async (req, res) => {
    const { clientId } = req.params;
    const requestingUserId = req.user.user_id;
    const requestingUserRole = req.user.role;

    if (requestingUserRole !== 'client' || parseInt(clientId) !== requestingUserId) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own pending requests.' });
    }

    try {
        const result = await db.query(
            `SELECT
                acr.request_id,
                CASE
                    WHEN acr.sender_id = $1 THEN acr.receiver_id
                    ELSE acr.sender_id
                END AS agent_id,
                u.full_name AS agent_name,
                u.email AS agent_email,
                u.profile_picture_url AS agent_profile_picture_url,
                acr.message,
                acr.created_at,
                acr.status,
                acr.sender_id AS request_sender_id -- To distinguish if client sent or agent sent
             FROM agent_client_requests acr
             JOIN users u ON
                CASE
                    WHEN acr.sender_id = $1 THEN acr.receiver_id
                    ELSE acr.sender_id
                END = u.user_id
             WHERE (acr.sender_id = $1 OR acr.receiver_id = $1)
             AND acr.status = 'pending'
             ORDER BY acr.created_at DESC`,
            [clientId]
        );

        const formattedRequests = result.rows.map(row => ({
            ...row,
            is_outgoing: row.request_sender_id === parseInt(clientId),
            is_incoming: row.request_sender_id !== parseInt(clientId)
        }));

        res.status(200).json({ requests: formattedRequests });
    } catch (err) {
        console.error('Error fetching client pending agent requests:', err);
        res.status(500).json({ error: 'Failed to fetch pending connection requests.', details: err.message });
    }
};

// Get details of the client's connected agent(s) - MODIFIED FOR MULTIPLE AGENTS
const getConnectedAgentDetails = async (req, res) => {
    const clientId = req.user.user_id;
    try {
        // Find ALL agents connected to this client with an 'accepted' status
        const result = await db.query(
            `SELECT u.user_id, u.full_name, u.email, u.phone, u.profile_picture_url,
                    a.agency_id, -- ADDED: agency_id
                    a.name AS agency_name, a.logo_url AS agency_logo_url, a.address AS agency_address,
                    ap.avg_rating, ap.deals_closed, ap.properties_assigned
             FROM agent_clients ac
             JOIN users u ON ac.agent_id = u.user_id
             LEFT JOIN agencies a ON u.agency_id = a.agency_id
             LEFT JOIN agent_performance ap ON u.user_id = ap.user_id
             WHERE ac.client_id = $1 AND ac.request_status = 'accepted'
             ORDER BY u.full_name ASC`, // Removed LIMIT 1
            [clientId]
        );
        // Always return an array, even if empty
        res.status(200).json({ agents: result.rows });
    } catch (err) {
        console.error('Error fetching connected agent details:', err);
        res.status(500).json({ error: 'Failed to fetch connected agent details.' });
    }
};

// Get all agents (for clients to browse and connect) with pagination
const getAllAgentsForClient = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // Default limit to 20 agents
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search ? `%${req.query.search.toLowerCase()}%` : null;

        let queryParams = [];
        let whereClause = `WHERE u.role = 'agent' AND u.status = 'active'`;
        let paramIndex = 1;

        if (searchTerm) {
            whereClause += ` AND (LOWER(u.full_name) ILIKE $${paramIndex} OR LOWER(u.email) ILIKE $${paramIndex} OR LOWER(a.name) ILIKE $${paramIndex} OR LOWER(a.address) ILIKE $${paramIndex})`;
            queryParams.push(searchTerm);
            paramIndex++;
        }

        // Count total agents matching the criteria
        const countResult = await db.query(
            `SELECT COUNT(u.user_id)
             FROM users u
             LEFT JOIN agencies a ON u.agency_id = a.agency_id
             ${whereClause}`,
            queryParams
        );
        const totalAgents = parseInt(countResult.rows[0].count, 10);

        // Fetch paginated agents
        const result = await db.query(
            `SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.profile_picture_url,
                u.bio,
                u.location,
                u.date_joined,
                u.status,
                u.agency_id,
                a.name AS agency_name,
                a.logo_url AS agency_logo_url,
                a.address AS agency_address,
                ap.avg_rating,
                ap.deals_closed,
                ap.properties_assigned
            FROM users u
            LEFT JOIN agencies a ON u.agency_id = a.agency_id
            LEFT JOIN agent_performance ap ON u.user_id = ap.user_id
            ${whereClause}
            ORDER BY u.full_name ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...queryParams, limit, offset]
        );

        res.status(200).json({
            agents: result.rows,
            total: totalAgents,
            page,
            limit,
            totalPages: Math.ceil(totalAgents / limit)
        });
    } catch (err) {
        console.error('Error fetching all agents for client:', err);
        res.status(500).json({ error: 'Failed to fetch agents.' });
    }
};


module.exports = {
  getClientsForAgent,
  getClientProfileDetails,
  getClientPreferences,
  updateClientPreferences,
  getRecommendedListings,
  getRecommendedListingsByAgentForClient,
  addRecommendedListing,
  removeRecommendedListing,
  sendConnectionRequestToAgent,
  getConnectionStatus,
  disconnectFromAgent,
  getClientIncomingRequests,
  getClientOutgoingRequests,
  acceptConnectionRequestFromAgent,
  rejectConnectionRequestFromAgent,
  sendEmailToClient,
  respondToInquiry,
  addNoteToClient, // Keeping addNoteToClient as requested
  toggleVipFlag,
  sendMessageToClient,
  archiveClient,
  getArchivedClients,
  restoreClient,
  deleteArchivedClient,
  getClientsByAgencyId,
  getClientPendingAgentRequests,
  getConnectedAgentDetails, // Added here
  getAllAgentsForClient // Added here
};

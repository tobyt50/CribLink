const db = require('../db');
// const logActivity = require('../utils/logActivity'); // Assuming you have this utility if needed

// Get Agent Profile Details
exports.getAgentProfile = async (req, res) => {
    const { agentId } = req.params;
    console.log('[agentController.getAgentProfile] Entering function. req.user:', req.user); // <-- ADDED LOG

    try {
        // Fetch agent's user details from the 'users' table
        const userResult = await db.query(
            `SELECT user_id, full_name, email, phone, profile_picture_url, date_joined, last_login, status AS user_status,
                    agency, bio, location, social_links
             FROM users WHERE user_id = $1 AND role = 'agent'`,
            [agentId]
        );

        if (userResult.rows.length === 0) {
            console.warn('[agentController.getAgentProfile] Agent not found or user is not an agent for ID:', agentId); // <-- ADDED LOG
            return res.status(404).json({ message: 'Agent not found or user is not an agent.' });
        }
        const agentDetails = userResult.rows[0];

        // Fetch agent's performance data if available
        const performanceResult = await db.query(
            `SELECT deals_closed, revenue, avg_rating, properties_assigned, client_feedback, region, commission_earned
             FROM agent_performance WHERE user_id = $1`,
            [agentId]
        );

        const agentPerformance = performanceResult.rows.length > 0 ? performanceResult.rows[0] : {};

        // Combine all agent data
        const combinedAgentData = {
            ...agentDetails,
            ...agentPerformance
        };

        // Optional: Log activity
        // await logActivity(`${req.user.name} viewed agent profile: ${combinedAgentData.full_name} (ID: ${combinedAgentData.user_id})`, req.user, 'agent_profile_view');

        res.status(200).json(combinedAgentData);

    } catch (err) {
        console.error('[agentController.getAgentProfile] Error fetching agent profile details:', err); // <-- MODIFIED LOG
        res.status(500).json({ message: 'Failed to fetch agent profile details.', error: err.message });
    }
};

// NEW: sendConnectionRequestToClient - Agent sends a connection request to a client
exports.sendConnectionRequestToClient = async (req, res) => {
    const { clientId } = req.params; // The client the agent wants to connect with
    const agentId = req.user.user_id; // The authenticated agent sending the request
    const { message } = req.body; // Optional message
    console.log('[agentController.sendConnectionRequestToClient] Entering function. req.user:', req.user); // <-- ADDED LOG

    // Authorization: Only authenticated agents can send requests to clients
    if (req.user.role !== 'agent') {
        console.warn('[agentController.sendConnectionRequestToClient] Forbidden: User role is not agent:', req.user.role); // <-- ADDED LOG
        return res.status(403).json({ message: 'Forbidden: Only agents can send connection requests to clients.' });
    }
    if (parseInt(clientId) === agentId) {
        console.warn('[agentController.sendConnectionRequestToClient] Cannot send request to self.'); // <-- ADDED LOG
        return res.status(400).json({ message: 'You cannot send a connection request to yourself.' });
    }

    try {
        // Check if the recipient is actually a client
        const clientCheck = await db.query(`SELECT user_id FROM users WHERE user_id = $1 AND role = 'client'`, [clientId]);
        if (clientCheck.rows.length === 0) {
            console.warn('[agentController.sendConnectionRequestToClient] Recipient is not a valid client:', clientId); // <-- ADDED LOG
            return res.status(404).json({ message: 'The specified recipient is not a valid client.' });
        }

        // Check for existing relationship in agent_clients (already connected)
        const existingAgentClientRelationship = await db.query(
            `SELECT * FROM agent_clients WHERE agent_id = $1 AND client_id = $2`,
            [agentId, clientId]
        );
        if (existingAgentClientRelationship.rows.length > 0) {
            console.log('[agentController.sendConnectionRequestToClient] Already connected with client:', clientId); // <-- ADDED LOG
            return res.status(200).json({ message: 'You are already connected with this client.', status: 'connected' });
        }

        // Check for existing pending request (either way)
        const existingRequest = await db.query(
            `SELECT * FROM agent_client_requests
             WHERE (sender_id = $1 AND receiver_id = $2)
             OR (sender_id = $2 AND receiver_id = $1 AND status = 'pending')`, // Check for client-to-agent pending request
            [agentId, clientId]
        );

        if (existingRequest.rows.length > 0) {
            const reqStatus = existingRequest.rows[0].status;
            console.log('[agentController.sendConnectionRequestToClient] Existing request found. Status:', reqStatus); // <-- ADDED LOG
            if (reqStatus === 'pending') {
                if (existingRequest.rows[0].sender_id === agentId) {
                    return res.status(200).json({ message: 'Connection request already sent and pending.', status: 'pending_sent' });
                } else {
                    return res.status(200).json({ message: 'This client has already sent you a connection request. Check your incoming requests.', status: 'pending_received' });
                }
            } else if (reqStatus === 'accepted') {
                return res.status(200).json({ message: 'You are already connected with this client.', status: 'connected' });
            }
        }

        // Insert new connection request
        await db.query(
            `INSERT INTO agent_client_requests (sender_id, receiver_id, sender_role, receiver_role, status, message)
             VALUES ($1, $2, 'agent', 'client', 'pending', $3)`,
            [agentId, clientId, message]
        );

        console.log('[agentController.sendConnectionRequestToClient] Connection request sent successfully to client:', clientId); // <-- ADDED LOG
        res.status(201).json({ message: 'Connection request sent successfully to client.', status: 'pending_sent' });

    } catch (err) {
        console.error('Error sending connection request to client:', err); // <-- MODIFIED LOG
        res.status(500).json({ error: 'Failed to send connection request to client.', details: err.message });
    }
};

// NEW: getAgentIncomingRequests - Get connection requests sent TO the authenticated agent (from clients)
exports.getAgentIncomingRequests = async (req, res) => {
    const agentId = req.user.user_id; // The authenticated agent
    const agentRole = req.user.role;
    console.log('[agentController.getAgentIncomingRequests] Entering function. req.user:', req.user); // <-- ADDED LOG

    if (agentRole !== 'agent') {
        console.warn('[agentController.getAgentIncomingRequests] Forbidden: User role is not agent:', agentRole); // <-- ADDED LOG
        return res.status(403).json({ message: 'Forbidden: This endpoint is for agents only.' });
    }

    try {
        const result = await db.query(
            `SELECT acr.request_id, acr.sender_id AS client_id, u.full_name AS client_name, u.email AS client_email,
                    u.profile_picture_url AS client_profile_picture_url, acr.message, acr.created_at, acr.status
             FROM agent_client_requests acr
             JOIN users u ON acr.sender_id = u.user_id
             WHERE acr.receiver_id = $1 AND acr.receiver_role = 'agent' AND acr.status = 'pending'
             ORDER BY acr.created_at DESC`,
            [agentId]
        );
        console.log('[agentController.getAgentIncomingRequests] Fetched incoming requests count:', result.rows.length); // <-- ADDED LOG
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching agent incoming requests:', err); // <-- MODIFIED LOG
        res.status(500).json({ error: 'Failed to fetch incoming connection requests.', details: err.message });
    }
};

// NEW: getAgentOutgoingRequests - Get connection requests sent BY the authenticated agent (to clients)
exports.getAgentOutgoingRequests = async (req, res) => {
    const agentId = req.user.user_id; // The authenticated agent
    const agentRole = req.user.role;
    console.log('[agentController.getAgentOutgoingRequests] Entering function. req.user:', req.user); // <-- ADDED LOG

    if (agentRole !== 'agent') {
        console.warn('[agentController.getAgentOutgoingRequests] Forbidden: User role is not agent:', agentRole); // <-- ADDED LOG
        return res.status(403).json({ message: 'Forbidden: This endpoint is for agents only.' });
    }

    try {
        const result = await db.query(
            `SELECT acr.request_id, acr.receiver_id AS client_id, u.full_name AS client_name, u.email AS client_email,
                    u.profile_picture_url AS client_profile_picture_url, acr.message, acr.created_at, acr.status
             FROM agent_client_requests acr
             JOIN users u ON acr.receiver_id = u.user_id
             WHERE acr.sender_id = $1 AND acr.sender_role = 'agent'
             ORDER BY acr.created_at DESC`,
            [agentId]
        );
        console.log('[agentController.getAgentOutgoingRequests] Fetched outgoing requests count:', result.rows.length); // <-- ADDED LOG
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching agent outgoing requests:', err); // <-- MODIFIED LOG
        res.status(500).json({ error: 'Failed to fetch outgoing connection requests.', details: err.message });
    }
};

// NEW: acceptConnectionRequestFromClient - Agent accepts a connection request from a client
exports.acceptConnectionRequestFromClient = async (req, res) => {
    const { requestId } = req.params;
    const agentId = req.user.user_id;
    const agentRole = req.user.role;
    console.log('[agentController.acceptConnectionRequestFromClient] Entering function. req.user:', req.user); // <-- ADDED LOG

    if (agentRole !== 'agent') {
        console.warn('[agentController.acceptConnectionRequestFromClient] Forbidden: User role is not agent:', agentRole); // <-- ADDED LOG
        return res.status(403).json({ message: 'Forbidden: Only agents can accept connection requests.' });
    }

    try {
        await db.query('BEGIN'); // Start transaction

        // 1. Update the request status to 'accepted'
        const requestUpdateResult = await db.query(
            `UPDATE agent_client_requests
             SET status = 'accepted', updated_at = NOW()
             WHERE request_id = $1 AND receiver_id = $2 AND receiver_role = 'agent' AND status = 'pending'
             RETURNING sender_id, receiver_id;`,
            [requestId, agentId]
        );

        if (requestUpdateResult.rows.length === 0) {
            await db.query('ROLLBACK');
            console.warn('[agentController.acceptConnectionRequestFromClient] Request not found, already accepted, or not pending:', requestId); // <-- ADDED LOG
            return res.status(404).json({ message: 'Connection request not found, already accepted, or not pending.' });
        }

        const { sender_id: clientId, receiver_id: acceptedAgentId } = requestUpdateResult.rows[0];
        console.log(`[agentController.acceptConnectionRequestFromClient] Request ${requestId} updated to accepted. Client: ${clientId}, Agent: ${acceptedAgentId}`); // <-- ADDED LOG

        // 2. Insert into agent_clients table if not already present (establishing the primary relationship)
        await db.query(
            `INSERT INTO agent_clients (agent_id, client_id, status, request_status)
             VALUES ($1, $2, 'regular', 'accepted')
             ON CONFLICT (agent_id, client_id) DO UPDATE SET request_status = 'accepted', status = 'regular';`, // Update if already exists but status might be different
            [acceptedAgentId, clientId]
        );
        console.log(`[agentController.acceptConnectionRequestFromClient] Relationship added/updated in agent_clients for Agent: ${acceptedAgentId}, Client: ${clientId}`); // <-- ADDED LOG

        await db.query('COMMIT'); // Commit transaction

        // Optional: Log activity
        // await logActivity(`Agent (ID: ${agentId}) accepted connection request from Client (ID: ${clientId})`, req.user, 'connection_accepted');

        res.status(200).json({ message: 'Connection request accepted successfully.' });

    } catch (err) {
        await db.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error accepting connection request:', err); // <-- MODIFIED LOG
        res.status(500).json({ error: 'Failed to accept connection request.', details: err.message });
    }
};

// NEW: rejectConnectionRequestFromClient - Agent rejects a connection request from a client
exports.rejectConnectionRequestFromClient = async (req, res) => {
    const { requestId } = req.params;
    const agentId = req.user.user_id;
    const agentRole = req.user.role;
    console.log('[agentController.rejectConnectionRequestFromClient] Entering function. req.user:', req.user); // <-- ADDED LOG

    if (agentRole !== 'agent') {
        console.warn('[agentController.rejectConnectionRequestFromClient] Forbidden: User role is not agent:', agentRole); // <-- ADDED LOG
        return res.status(403).json({ message: 'Forbidden: Only agents can reject connection requests.' });
    }

    try {
        const result = await db.query(
            `UPDATE agent_client_requests
             SET status = 'rejected', updated_at = NOW()
             WHERE request_id = $1 AND receiver_id = $2 AND receiver_role = 'agent' AND status = 'pending'
             RETURNING request_id;`,
            [requestId, agentId]
        );

        if (result.rows.length === 0) {
            console.warn('[agentController.rejectConnectionRequestFromClient] Request not found, already processed, or not pending:', requestId); // <-- ADDED LOG
            return res.status(404).json({ message: 'Connection request not found, already processed, or not pending.' });
        }

        // Optional: Log activity
        // await logActivity(`Agent (ID: ${agentId}) rejected connection request (ID: ${requestId})`, req.user, 'connection_rejected');
        console.log('[agentController.rejectConnectionRequestFromClient] Connection request rejected successfully:', requestId); // <-- ADDED LOG
        res.status(200).json({ message: 'Connection request rejected successfully.' });

    } catch (err) {
        console.error('Error rejecting connection request:', err); // <-- MODIFIED LOG
        res.status(500).json({ error: 'Failed to reject connection request.', details: err.message });
    }
};

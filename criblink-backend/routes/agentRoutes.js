const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController'); // Import the agent controller
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // Ensure authenticateToken and authorizeRoles are imported

// Route to get a single agent's profile details (publicly viewable but may have enhanced features for logged in users)
// authenticateToken is sufficient here, as agentController.getAgentProfile handles no specific authorization, it just fetches data.
router.get('/profile/:agentId', authenticateToken, agentController.getAgentProfile);

// NEW: Connection Request Features (Agent as Sender/Receiver)
// Agent sends a request to a client - only agents can do this
router.post('/:agentId/connection-requests/send-to-client/:clientId', authenticateToken, authorizeRoles(['agent']), agentController.sendConnectionRequestToClient);
// Get incoming requests for an agent - only the agent can see their incoming requests
router.get('/:agentId/connection-requests/incoming', authenticateToken, authorizeRoles(['agent']), agentController.getAgentIncomingRequests);
// Get outgoing requests from an agent - only the agent can see their outgoing requests
router.get('/:agentId/connection-requests/outgoing', authenticateToken, authorizeRoles(['agent']), agentController.getAgentOutgoingRequests);
// Agent accepts a request from a client - only the agent can accept requests sent to them
router.post('/:agentId/connection-requests/:requestId/accept-from-client', authenticateToken, authorizeRoles(['agent']), agentController.acceptConnectionRequestFromClient);
// Agent rejects a request from a client - only the agent can reject requests sent to them
router.post('/:agentId/connection-requests/:requestId/reject-from-client', authenticateToken, authorizeRoles(['agent']), agentController.rejectConnectionRequestFromClient);


// Add any other existing agent-related routes here, e.g.:
// router.get('/dashboard-stats', authenticateToken, authorizeRole(['agent', 'admin']), agentController.getDashboardStats);
// router.get('/listings', authenticateToken, authorizeRole(['agent']), agentController.getAgentListings);

module.exports = router;

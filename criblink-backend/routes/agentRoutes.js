const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController'); // Import the agent controller
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // Ensure authenticateToken and authorizeRoles are imported

// Route to get a single agent's profile details (publicly viewable but may have enhanced features for logged in users)
// authenticateToken is sufficient here, as agentController.getAgentProfile handles no specific authorization, it just fetches data.
router.get('/profile/:agentId', authenticateToken, agentController.getAgentProfile);

// NEW: Connection Request Features (Agent as Sender/Receiver)
// Agent sends a request to a client - only agents or agency_admins can do this
router.post('/:agentId/connection-requests/send-to-client/:clientId', authenticateToken, authorizeRoles(['agent', 'agency_admin']), agentController.sendConnectionRequestToClient); // NEW: Added agency_admin
// Get incoming requests for an agent - only the agent or agency_admin can see their incoming requests
router.get('/:agentId/connection-requests/incoming', authenticateToken, authorizeRoles(['agent', 'agency_admin']), agentController.getAgentIncomingRequests); // NEW: Added agency_admin
// Get outgoing requests from an agent - only the agent or agency_admin can see their outgoing requests
router.get('/:agentId/connection-requests/outgoing', authenticateToken, authorizeRoles(['agent', 'agency_admin']), agentController.getAgentOutgoingRequests); // NEW: Added agency_admin
// Agent accepts a request from a client - only the agent or agency_admin can accept requests sent to them
router.post('/:agentId/connection-requests/:requestId/accept-from-client', authenticateToken, authorizeRoles(['agent', 'agency_admin']), agentController.acceptConnectionRequestFromClient); // NEW: Added agency_admin
// Agent rejects a request from a client - only the agent or agency_admin can reject requests sent to them
router.post('/:agentId/connection-requests/:requestId/reject-from-client', authenticateToken, authorizeRoles(['agent', 'agency_admin']), agentController.rejectConnectionRequestFromClient); // NEW: Added agency_admin


// Add any other existing agent-related routes here, e.g.:
// router.get('/dashboard-stats', authenticateToken, authorizeRole(['agent', 'admin']), agentController.getDashboardStats);
// router.get('/listings', authenticateToken, authorizeRole(['agent']), agentController.getAgentListings);

module.exports = router;

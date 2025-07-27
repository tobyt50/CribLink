const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // Import authorizeRoles

// NEW: Get all agents for a client to browse (MUST BE BEFORE /:clientId)
router.get('/all-agents', authenticateToken, authorizeRoles(['client']), clientController.getAllAgentsForClient);

// Core
router.get('/agent/:agentId/clients', authenticateToken, authorizeRoles(['agent', 'admin', 'agency_admin']), clientController.getClientsForAgent); // Only agents/admins can get clients for an agent
router.get('/:clientId', authenticateToken, clientController.getClientProfileDetails); // Auth token required, internal logic handles client-agent relationship

// Client Property Preferences (requires authentication as a client)
router.get('/:clientId/preferences', authenticateToken, clientController.getClientPreferences);
router.put('/:clientId/preferences', authenticateToken, clientController.updateClientPreferences);

// Agent Recommended Listings (requires authentication as an agent)
router.get('/:clientId/recommendations', authenticateToken, authorizeRoles(['agent']), clientController.getRecommendedListings);
router.post('/:clientId/recommendations/:propertyId', authenticateToken, authorizeRoles(['agent']), clientController.addRecommendedListing);
router.delete('/:clientId/recommendations/:propertyId', authenticateToken, authorizeRoles(['agent']), clientController.removeRecommendedListing);

// NEW ROUTE: Get Recommended Listings for a Client from a Specific Agent
// This route allows a client to see listings recommended to them by a particular agent.
router.get('/:clientId/recommendations/agent/:agentId', authenticateToken, authorizeRoles(['client', 'admin']), clientController.getRecommendedListingsByAgentForClient);


// NEW: Connection Request Features (Client as Sender/Receiver)
// Client sends a request to an agent - only clients can do this
router.post('/:clientId/connection-requests/send-to-agent/:agentId', authenticateToken, authorizeRoles(['client']), clientController.sendConnectionRequestToAgent);
// Get incoming requests for a client - only the client can see their incoming requests
router.get('/:clientId/connection-requests/incoming', authenticateToken, authorizeRoles(['client']), clientController.getClientIncomingRequests);
// Get outgoing requests from a client - only the client can see their outgoing requests
router.get('/:clientId/connection-requests/outgoing', authenticateToken, authorizeRoles(['client']), clientController.getClientOutgoingRequests);
// NEW: Get all pending requests (incoming and outgoing) for a client
router.get('/:clientId/pending-agent-requests', authenticateToken, authorizeRoles(['client']), clientController.getClientPendingAgentRequests); // NEW ROUTE
// Client accepts a request from an agent - only the client can accept requests sent to them
router.post('/:clientId/connection-requests/:requestId/accept-from-agent', authenticateToken, authorizeRoles(['client']), clientController.acceptConnectionRequestFromAgent);
// Client rejects a request from an agent - only the client can reject requests sent to them
router.post('/:clientId/connection-requests/:requestId/reject-from-agent', authenticateToken, authorizeRoles(['client']), clientController.rejectConnectionRequestFromAgent);

// NEW: Get connection status between a client and an agent
router.get('/:clientId/connection-requests/status/:agentId', authenticateToken, authorizeRoles(['client', 'agent', 'admin']), clientController.getConnectionStatus);

// NEW: Client disconnects from an agent
router.post('/:clientId/disconnect-agent/:agentId', authenticateToken, authorizeRoles(['client']), clientController.disconnectFromAgent); // NEW ROUTE

// NEW: Get details of the authenticated client's connected agent(s)
router.get('/:clientId/connected-agent', authenticateToken, authorizeRoles(['client']), clientController.getConnectedAgentDetails);


// Actions (These are typically agent actions on clients, so require agent role)
router.post('/agent/:agentId/clients/:clientId/email', authenticateToken, authorizeRoles(['agent', 'admin']), clientController.sendEmailToClient);
router.post('/agent/:agentId/clients/:clientId/respond', authenticateToken, authorizeRoles(['agent', 'admin']), clientController.respondToInquiry);
// CHANGED: From router.post to router.put for addNoteToClient
router.put('/agent/:agentId/clients/:clientId/note', authenticateToken, authorizeRoles('agent'), clientController.addNoteToClient); // Updated authorization to 'agent'
router.post('/agent/:agentId/clients/:clientId/message', authenticateToken, authorizeRoles(['agent', 'admin']), clientController.sendMessageToClient);
router.put('/agent/:agentId/clients/:clientId/vip', authenticateToken, authorizeRoles('agent'), clientController.toggleVipFlag); // Updated authorization to 'agent'
router.delete('/agent/:agentId/clients/:clientId', authenticateToken, authorizeRoles('agent'), clientController.archiveClient); // Updated authorization to 'agent'
router.delete('/agent/:agentId/archived-clients/:clientId', authenticateToken, authorizeRoles(['agent', 'admin']), clientController.deleteArchivedClient);
router.get('/agent/:agentId/archived-clients', authenticateToken, authorizeRoles(['agent', 'admin']), clientController.getArchivedClients);
router.post('/agent/:agentId/archived-clients/:clientId/restore', authenticateToken, authorizeRoles('agent'), clientController.restoreClient); // Updated authorization to 'agent'

// NEW: Agency Admin related client routes
router.get('/agency/:agencyId/clients', authenticateToken, authorizeRoles(['agency_admin', 'admin']), clientController.getClientsByAgencyId);

module.exports = router;

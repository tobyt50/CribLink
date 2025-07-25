const express = require('express');
const router = express.Router();
const inquiriesController = require('../controllers/inquiriesController');
const clientController = require('../controllers/clientController'); // Import clientController
const { authenticateToken, authorizeRoles, optionalAuthenticateToken } = require('../middleware/authMiddleware');

/* -------------------------
   BASE ROUTES (mounted as /inquiries)
------------------------- */

// POST /inquiries/ — Create a new inquiry (guest or client) for a specific property
router.post('/', optionalAuthenticateToken, inquiriesController.createInquiry);

// POST /inquiries/general — Create a new general inquiry (initiated by agent from client profile)
router.post('/general', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.createGeneralInquiry);


// POST /inquiries/message — Send message within conversation (client or agent)
router.post('/message', authenticateToken, inquiriesController.sendMessageInquiry);

/* -------------------------------------------
   CLIENT ROUTES (mounted as /inquiries/client)
------------------------------------------- */

// GET /inquiries/client/ — Fetch all inquiries for a client
router.get('/client', authenticateToken, authorizeRoles('client'), inquiriesController.getAllInquiriesForClient);

// PUT /inquiries/client/mark-read/:conversationId — Mark all messages as read by client
router.put('/client/mark-read/:conversationId', authenticateToken, authorizeRoles('client'), inquiriesController.markMessagesAsRead);

// DELETE /inquiries/client/delete-conversation/:conversationId — Delete conversation (client)
router.delete('/client/delete-conversation/:conversationId', authenticateToken, authorizeRoles('client'), inquiriesController.deleteConversation);

// NEW: PUT /clients/:clientId/connection-requests/disconnect/:agentId - Client disconnects from an agent
router.put('/clients/:clientId/connection-requests/disconnect/:agentId', authenticateToken, authorizeRoles('client'), clientController.disconnectFromAgent);


/* -------------------------------------------
   AGENT/ADMIN ROUTES (mounted as /inquiries/agent)
------------------------------------------- */

// GET /inquiries/agent/ — Fetch all inquiries for agent or admin or agency_admin (active ones)
router.get('/agent', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.getAllInquiriesForAgent);

// NEW: GET /inquiries/agent/archived — Fetch all archived inquiries for agent or admin or agency_admin
router.get('/agent/archived', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.getArchivedInquiriesForAgent);

// NEW: PUT /inquiries/:conversationId/archive-for-agent - Archive an inquiry for the current agent
router.put('/:conversationId/archive-for-agent', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.archiveInquiryForAgent);

// NEW: PUT /inquiries/:conversationId/restore-for-agent - Restore an inquiry for the current agent
router.put('/:conversationId/restore-for-agent', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.restoreInquiryForAgent);

// NEW: DELETE /inquiries/:conversationId/permanently-delete - Permanently delete an inquiry (admin/agency_admin only)
router.delete('/:conversationId/permanently-delete', authenticateToken, authorizeRoles('admin', 'agency_admin'), inquiriesController.permanentlyDeleteInquiry);


// NEW: GET /inquiries/agent/:agentId/client/:clientId/conversation - Fetch a specific conversation between an agent and a client
// This route is needed by Clients.js to open the AgentInquiryModal with existing conversation data.
router.get('/agent/:agentId/client/:clientId/conversation', authenticateToken, authorizeRoles(['agent', 'admin', 'client', 'agency_admin']), inquiriesController.getAgentClientConversation);

// PUT /inquiries/agent/assign/:inquiryId — Assign an inquiry to an agent
router.put('/agent/assign/:inquiryId', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.assignInquiry);

// PUT /inquiries/agent/mark-read/:conversationId — Mark messages as read by agent
router.put('/agent/mark-read/:conversationId', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.markMessagesAsRead);

// PUT /inquiries/agent/mark-opened/:conversationId — Mark conversation as opened by agent
router.put('/agent/mark-opened/:conversationId', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.markConversationOpened);

// PUT /inquiries/agent/mark-responded/:conversationId — Mark conversation as responded by agent
router.put('/agent/mark-responded/:conversationId', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.markConversationResponded);

// DELETE /inquiries/agent/delete-conversation/:conversationId — Delete conversation (agent/admin/agency_admin)
// This route now calls the soft-delete/hide logic in inquiriesController.deleteConversation
router.delete('/agent/delete-conversation/:conversationId', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.deleteConversation);

// GET /inquiries/agent/count/client-inquiries — Get total client inquiries (for agent/admin/agency_admin)
router.get('/agent/count/all-inquiries', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.countAllInquiries);

// GET /inquiries/agent/count/agent-responses — Get total agent responses (for agent/admin/agency_admin)
router.get('/agent/count/agent-responses', authenticateToken, authorizeRoles('agent', 'admin', 'agency_admin'), inquiriesController.countAgentResponses);

/* -------------------------------------------
   AGENCY ADMIN ROUTES (mounted as /inquiries/agency-admin)
------------------------------------------- */

// PUT /inquiries/agency-admin/reassign/:conversationId - Reassign an inquiry to another agent
router.put('/agency-admin/reassign/:conversationId', authenticateToken, authorizeRoles('agency_admin', 'admin'), inquiriesController.reassignInquiry);


module.exports = router;

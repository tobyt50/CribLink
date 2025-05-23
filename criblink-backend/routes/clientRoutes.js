const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticateToken } = require('../middleware/authMiddleware'); // ✅ fixed import

// Core
router.get('/agent/:agentId/clients', authenticateToken, clientController.getClientsForAgent);

// Actions
router.post('/agent/:agentId/clients/:clientId/email', authenticateToken, clientController.sendEmailToClient);
router.post('/agent/:agentId/clients/:clientId/respond', authenticateToken, clientController.respondToInquiry);
router.post('/agent/:agentId/clients/:clientId/note', authenticateToken, clientController.addNoteToClient);
router.post('/agent/:agentId/clients/:clientId/message', authenticateToken, clientController.sendMessageToClient);
router.put('/agent/:agentId/clients/:clientId/vip', authenticateToken, clientController.toggleVipFlag);
router.delete('/agent/:agentId/clients/:clientId', authenticateToken, clientController.archiveClient);
router.delete('/agent/:agentId/archived-clients/:clientId', authenticateToken, clientController.deleteArchivedClient);
router.get('/agent/:agentId/archived-clients', authenticateToken, clientController.getArchivedClients);
router.post('/agent/:agentId/archived-clients/:clientId/restore', authenticateToken, clientController.restoreClient);

module.exports = router;

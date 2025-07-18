// criblink-backend/routes/agencyRoutes.js
const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agencyController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @route POST /api/agencies
 * @desc Create a new agency (Admin only)
 * @access Private (Admin only)
 */
router.post('/', authenticateToken, authorizeRoles(['admin']), agencyController.createAgency);

/**
 * @route POST /api/agencies/register-agent-agency
 * @desc Agent registers a new agency and becomes agency_admin
 * @access Private (Agent only)
 */
router.post('/register-agent-agency', authenticateToken, authorizeRoles(['agent']), agencyController.registerAgentAgency);


/**
 * @route GET /api/agencies
 * @desc Get all agencies
 * @access Public (for agent signup dropdown, etc.)
 */
router.get('/', agencyController.getAllAgencies);

/**
 * @route GET /api/agencies/:id
 * @desc Get a single agency by ID
 * @access Public (for agency profile pages)
 */
router.get('/:id', agencyController.getAgencyById);

/**
 * @route PUT /api/agencies/:id
 * @desc Update an agency's details
 * @access Private (Agency Admin or Super Admin)
 */
router.put('/:id', authenticateToken, authorizeRoles(['agency_admin', 'admin']), agencyController.updateAgency);

/**
 * @route DELETE /api/agencies/:id
 * @desc Delete an agency
 * @access Private (Super Admin only)
 */
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), agencyController.deleteAgency);

/**
 * @route POST /api/agencies/request-to-join
 * @desc Agent requests to join an agency
 * @access Private (Agent only)
 */
router.post('/request-to-join', authenticateToken, authorizeRoles(['agent']), agencyController.requestToJoinAgency);

/**
 * @route PUT /api/agencies/approve-join-request/:requestId
 * @desc Agency Admin approves an agent's request to join
 * @access Private (Agency Admin or Super Admin)
 */
router.put('/approve-join-request/:requestId', authenticateToken, authorizeRoles(['agency_admin', 'admin']), agencyController.approveJoinRequest);

/**
 * @route PUT /api/agencies/reject-join-request/:requestId
 * @desc Agency Admin rejects an agent's request to join
 * @access Private (Agency Admin or Super Admin)
 */
router.put('/reject-join-request/:requestId', authenticateToken, authorizeRoles(['agency_admin', 'admin']), agencyController.rejectJoinRequest);

/**
 * @route GET /api/agencies/:agencyId/agents
 * @desc Get all agents (members) for a specific agency
 * @access Private (Agency Admin or Super Admin for that agency)
 */
router.get('/:agencyId/agents', authenticateToken, authorizeRoles(['agency_admin', 'admin']), agencyController.getAgentsByAgencyId);

/**
 * @route GET /api/agencies/:agencyId/pending-requests
 * @desc Get pending join requests for a specific agency
 * @access Private (Agency Admin or Super Admin for that agency)
 */
router.get('/:agencyId/pending-requests', authenticateToken, authorizeRoles(['agency_admin', 'admin']), agencyController.getPendingAgencyJoinRequests);

/**
 * @route GET /api/agencies/agent/:agentId/pending-requests
 * @desc Get pending join requests for a specific agent (for General.js to check status)
 * @access Private (Agent or Agency Admin for that agent)
 */
router.get('/agent/:agentId/pending-requests', authenticateToken, authorizeRoles(['agent', 'agency_admin', 'admin']), agencyController.getAgentPendingRequests);


/**
 * @route DELETE /api/agencies/:agencyId/members/:agentId
 * @desc Remove an agent from an agency (by agency admin, super admin, or the agent themselves)
 * @access Private (Agency Admin, Super Admin, or the Agent themselves)
 */
router.delete(
  '/:agencyId/members/:agentId',
  authenticateToken,
  authorizeRoles(['agency_admin', 'admin', 'agent']), // Added 'agent' role to allow self-removal
  agencyController.removeAgencyMember
);

/**
 * @route DELETE /api/agencies/:agencyId/admin-delete
 * @desc Agency Admin deletes their agency (forces role reversion)
 * @access Private (Agency Admin only)
 */
router.delete('/:agencyId/admin-delete', authenticateToken, authorizeRoles(['agency_admin']), agencyController.adminDeleteAgency);

// --- NEW: Promote/Demote Member Roles within Agency (Moved from userRoutes) ---
/**
 * @route PUT /api/agencies/:agencyId/members/:memberId/promote-to-admin
 * @desc Promotes a member within an agency to 'agency_admin' role.
 * @access Private (Agency Admin or Super Admin)
 */
router.put(
  '/:agencyId/members/:memberId/promote-to-admin',
  authenticateToken,
  authorizeRoles(['agency_admin', 'admin']), // Allow super admin to promote/demote
  agencyController.promoteMemberToAdmin // Renamed function
);

/**
 * @route PUT /api/agencies/:agencyId/members/:memberId/demote-to-agent
 * @desc Demotes a member within an agency from 'agency_admin' to 'agent' role.
 * @access Private (Agency Admin or Super Admin)
 */
router.put(
  '/:agencyId/members/:memberId/demote-to-agent',
  authenticateToken,
  authorizeRoles(['agency_admin', 'admin']), // Allow super admin to promote/demote
  agencyController.demoteMemberToAgent // Renamed function
);

// --- NEW: Update Member Status (VIP/Regular) ---
/**
 * @route PUT /api/agencies/:agencyId/members/:memberId/status
 * @desc Updates a member's status (e.g., 'vip', 'regular') within an agency.
 * @access Private (Agency Admin or Super Admin)
 */
router.put(
  '/:agencyId/members/:memberId/status',
  authenticateToken,
  authorizeRoles(['agency_admin', 'admin']),
  agencyController.updateMemberStatus
);

module.exports = router;

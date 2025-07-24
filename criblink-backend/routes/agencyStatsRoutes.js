const express = require('express');
const router = express.Router();
const agencyStatsController = require('../controllers/agencyStatsController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// All agency stats routes require authentication and agency_admin or admin role
router.use(authenticateToken, authorizeRoles(['agency_admin', 'admin']));

/**
 * @route GET /api/agency-stats/:agencyId/agents/count
 * @desc Get count of agents affiliated with a specific agency
 * @access Private (Agency Admin or Super Admin)
 */
router.get('/:agencyId/agents/count', agencyStatsController.getAgencyAgentCount);

/**
 * @route GET /api/agency-stats/:agencyId/admins/count
 * @desc Get count of agency administrators for a specific agency
 * @access Private (Agency Admin or Super Admin)
 */
router.get('/:agencyId/admins/count', agencyStatsController.getAgencyAdminCount); // NEW ROUTE

/**
 * @route GET /api/agency-stats/:agencyId/clients/count
 * @desc Get count of clients who have inquired with agents from a specific agency
 * @access Private (Agency Admin or Super Admin)
 */
router.get('/:agencyId/clients/count', agencyStatsController.getAgencyClientCount);

/**
 * @route GET /api/agency-stats/:agencyId/listings/count
 * @desc Get count of listings associated with a specific agency
 * @access Private (Agency Admin or Super Admin)
 */
router.get('/:agencyId/listings/count', agencyStatsController.getAgencyListingsCount);

/**
 * @route GET /api/agency-stats/:agencyId/listings/pending-approvals
 * @desc Get count of pending listings for a specific agency
 * @access Private (Agency Admin or Super Admin)
 */
router.get('/:agencyId/listings/pending-approvals', agencyStatsController.getAgencyPendingApprovalsCount);

/**
 * @route GET /api/agency-stats/:agencyId/recent-activity
 * @desc Get recent activity for a specific agency (inquiries, new agents, listings)
 * @access Private (Agency Admin or Super Admin)
 */
router.get('/:agencyId/recent-activity', agencyStatsController.getAgencyRecentActivity);

module.exports = router;

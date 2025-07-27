const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const {
    getTotalUsersCount,
    getAgenciesCount,
    getAgentCount,
    getClientsCount,
    getListingsCount,
    getAvailableListingsCount,
    getSoldListingsCount,
    getAllInquiriesCount, // Corrected import name
    getAgentResponsesCount,
    getDocumentsCount,
    getPlatformActivity, // Import new activity function
} = require('../../controllers/adminStatsController');

// Protect all admin routes
router.use(authenticateToken, authorizeRoles('admin'));

// Dashboard stat endpoints
router.get('/users/count', getTotalUsersCount); // Total users
router.get('/agencies/count', getAgenciesCount); // Total agencies
router.get('/agents/count', getAgentCount); // Total agents
router.get('/clients/count', getClientsCount); // Total clients

router.get('/listings/count', getListingsCount); // Total listings
router.get('/listings/available/count', getAvailableListingsCount); // Total available listings
router.get('/listings/sold/count', getSoldListingsCount); // Total sold listings

router.get('/inquiries/count', getAllInquiriesCount); // Total inquiries (conversations)
router.get('/inquiries/responses/count', getAgentResponsesCount); // Total agent responses

router.get('/documents/count', getDocumentsCount); // Total legal documents

router.get('/activity/recent-activity', getPlatformActivity); // Platform-wide recent activity

// Existing routes (ensure they are still needed or remove if replaced by more specific ones)
// router.get('/users', getAllUsers); // This might be for a detailed user list, not just count
// router.get('/listings/pending-approvals', getPendingApprovalsCount); // This can be added back if needed for a specific card

module.exports = router;

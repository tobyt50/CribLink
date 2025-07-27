const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
    getAllAgents,
    getAgentDashboardStats,
    getAgentActivity,
    getAgentUnderOfferListingsCount, // Import the new function
    getAgentSoldListingsCount,       // Import the new function
} = require('../controllers/agentStatsController');

// All agent routes require authentication
router.use(authenticateToken);

// Dashboard stats (total listings, total inquiries)
router.get('/dashboard/stats', getAgentDashboardStats);

// Agent's recent activity
router.get('/dashboard/activity', getAgentActivity);

// ✅ NEW: Agent's under offer listings count
router.get('/listings/under-offer/count', getAgentUnderOfferListingsCount);

// ✅ NEW: Agent's sold listings count
router.get('/listings/sold/count', getAgentSoldListingsCount);

// (Optional) Full agent performance listing
router.get('/all', getAllAgents);

module.exports = router;

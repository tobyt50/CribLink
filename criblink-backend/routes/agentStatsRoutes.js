const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
    getAllAgents,
    getAgentDashboardStats,
    getAgentActivity,
} = require('../controllers/agentStatsController');

// All agent routes require authentication
router.use(authenticateToken);

// Dashboard stats (total listings, total inquiries)
router.get('/dashboard/stats', getAgentDashboardStats);

// Agent's recent activity
router.get('/dashboard/activity', getAgentActivity);

// (Optional) Full agent performance listing
router.get('/all', getAllAgents);

module.exports = router;

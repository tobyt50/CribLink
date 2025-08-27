const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getAllAgents,
  getAgentDashboardStats,
  getAgentActivity,
  getAgentUnderOfferListingsCount, // Import the new function
  getAgentSoldListingsCount,
  getAgentPendingListingsCount, // Import the new function
} = require("../controllers/agentStatsController");

// All agent routes require authentication
router.use(authenticateToken);

// Dashboard stats (total listings, total inquiries)
router.get("/dashboard/stats", getAgentDashboardStats);

// Agent's recent activity
router.get("/dashboard/activity", getAgentActivity);

// ✅ NEW: Agent's under offer listings count
router.get("/listings/under-offer/count", getAgentUnderOfferListingsCount);

// ✅ NEW: Agent's sold listings count
router.get("/listings/sold/count", getAgentSoldListingsCount);

// ✅ NEW: Agent's pending listings count
router.get("/listings/pending/count", getAgentPendingListingsCount);

// (Optional) Full agent performance listing
router.get("/all", getAllAgents);

module.exports = router;

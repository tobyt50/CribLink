const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const clientStatsController = require("../controllers/clientStatsController");
const clientController = require("../controllers/clientController"); // For sendConnectionRequestToAgent
const inquiriesController = require("../controllers/inquiriesController"); // NEW: Import inquiriesController

// All client stats routes require authentication and client role
router.use(authenticateToken, authorizeRoles(["client"]));

// Get count of saved listings for the authenticated client
router.get(
  "/saved-listings/count",
  clientStatsController.getSavedListingsCount,
);

// Get count of recommended listings for the authenticated client from a specific agent
router.get(
  "/:clientId/recommendations/agent/:agentId/count",
  clientStatsController.getRecommendedListingsCountForClient,
);

// Get recent activity for the authenticated client
router.get(
  "/activity/recent-activity",
  clientStatsController.getClientRecentActivity,
);

// Client sends a connection request to an agent
router.post(
  "/connect-agent/:agentId",
  clientController.sendConnectionRequestToAgent,
);

// NEW: Get total inquiries count for the authenticated client
router.get(
  "/inquiries/client/count/all-inquiries",
  inquiriesController.countAllInquiries,
);

module.exports = router;

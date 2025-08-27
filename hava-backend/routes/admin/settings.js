// routes/admin/settings.js
const express = require("express");
const {
  getAdminSettings,
  updateAdminSettings,
  clearApplicationCache,
  backupDatabase,
  viewErrorLogs,
} = require("../../controllers/settingsController"); // Path to your new settings controller
const {
  authenticateToken,
  authorizeRoles,
} = require("../../middleware/authMiddleware"); // Your auth middleware

const router = express.Router();

// Routes for Admin Settings
router
  .route("/")
  .get(authenticateToken, authorizeRoles("admin"), getAdminSettings)
  .put(authenticateToken, authorizeRoles("admin"), updateAdminSettings);

// Routes for System & Maintenance actions
// Ensure these are correctly referenced as functions
router.post(
  "/clear-cache",
  authenticateToken,
  authorizeRoles("admin"),
  clearApplicationCache,
);
router.post(
  "/backup-database",
  authenticateToken,
  authorizeRoles("admin"),
  backupDatabase,
);
router.get(
  "/error-logs",
  authenticateToken,
  authorizeRoles("admin"),
  viewErrorLogs,
);

module.exports = router;

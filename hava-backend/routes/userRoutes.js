const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// --- Auth & Profile Routes ---
router.post("/signup", userController.signupUser);
router.post("/signin", userController.signinUser);
router.get("/profile", authenticateToken, userController.getProfile);
router.put("/update", authenticateToken, userController.updateProfile);

// --- NEW: Subscription Management Route ---
/**
 * @route PUT /api/users/:id/subscription
 * @desc Updates a user's subscription plan.
 * @access Private (Admin only)
 */
router.put(
  "/:id/subscription",
  authenticateToken,
  authorizeRoles("admin"), // Protects this route, allowing only users with the 'admin' role
  userController.updateSubscription,
);

// --- Password Recovery ---
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);

// --- Profile Picture Management (no multer middleware) ---
router.put(
  "/profile/picture/upload",
  authenticateToken,
  userController.uploadProfilePicture,
);

router.delete(
  "/profile/picture",
  authenticateToken,
  userController.deleteProfilePicture,
);

router.put(
  "/profile/picture/url",
  authenticateToken,
  userController.updateProfilePictureUrl,
);

// --- Session Management ---
router.get(
  "/sessions/active",
  authenticateToken,
  userController.getActiveSessions,
);
router.delete(
  "/sessions/:sessionId",
  authenticateToken,
  userController.revokeSession,
);

// --- Login History ---
router.get("/login-history", authenticateToken, userController.getLoginHistory);

// --- Get Current User ---
router.get("/me", authenticateToken, userController.getCurrentUser);

// --- Revert Agency Admin to Agent ---
router.put(
  "/revert-to-agent",
  authenticateToken,
  authorizeRoles(["agency_admin"]),
  userController.revertToAgent,
);

// --- Get User Agency Status ---
router.get(
  "/:userId/agency-status",
  authenticateToken,
  userController.getUserAgencyStatus,
);

/**
 * @route GET /api/users/listing-stats
 * @desc Gets the current user's active and featured listing counts.
 * @access Private
 */
router.get("/listing-stats", authenticateToken, userController.getListingStats);

/**
 * @route PUT /api/users/change-to-agent
 * @desc Changes the current user's role from 'client' to 'agent'.
 * @access Private (Clients only)
 */
router.put(
    "/change-to-agent",
    authenticateToken,
    authorizeRoles(["client"]),
    userController.changeRoleToAgent
);

router.put(
  "/revert-to-client",
  authenticateToken,
  authorizeRoles(["agent"]),
  userController.revertToClient
);

module.exports = router;

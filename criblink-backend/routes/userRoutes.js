const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// --- Auth & Profile Routes ---
router.post('/signup', userController.signupUser);
router.post('/signin', userController.signinUser);
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/update', authenticateToken, userController.updateProfile);

// --- Password Recovery ---
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// --- Profile Picture Management (no multer middleware) ---
router.put(
  '/profile/picture/upload',
  authenticateToken,
  userController.uploadProfilePicture
);

router.delete(
  '/profile/picture',
  authenticateToken,
  userController.deleteProfilePicture
);

router.put(
  '/profile/picture/url',
  authenticateToken,
  userController.updateProfilePictureUrl
);

// --- Session Management ---
router.get('/sessions/active', authenticateToken, userController.getActiveSessions);
router.delete('/sessions/:sessionId', authenticateToken, userController.revokeSession);

// --- Login History ---
router.get('/login-history', authenticateToken, userController.getLoginHistory);

// --- NEW: Get Current User ---
/**
 * @route GET /api/users/me
 * @desc Gets the authenticated user's details.
 * @access Private
 */
router.get('/me', authenticateToken, userController.getCurrentUser);

// --- NEW: Revert Agency Admin to Agent ---
/**
 * @route PUT /api/users/revert-to-agent
 * @desc Allows an agency admin to revert their role to a regular agent.
 * @access Private (Agency Admin only)
 */
router.put(
  '/revert-to-agent',
  authenticateToken,
  authorizeRoles(['agency_admin']),
  userController.revertToAgent
);

// --- NEW: Get User Agency Status ---
/**
 * @route GET /api/users/:userId/agency-status
 * @desc Gets the current agency membership status for a user (connected, pending, rejected, none).
 * @access Private (User can only check their own status)
 */
router.get(
    '/:userId/agency-status',
    authenticateToken,
    userController.getUserAgencyStatus
);

module.exports = router;
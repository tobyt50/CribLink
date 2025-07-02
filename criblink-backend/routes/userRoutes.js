const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware'); // FIX: Removed authorizeRole from import

// --- Auth & Profile Routes ---
router.post('/signup', userController.signupUser);
router.post('/signin', userController.signinUser);
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/update', authenticateToken, userController.updateProfile);

// NOTE: The route for getting a single agent's profile has been moved to agentRoutes.js

// --- Password Recovery ---
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// --- Profile Picture Management ---
router.put(
  '/profile/picture/upload',
  authenticateToken,
  upload.single('profile_picture'),
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

module.exports = router;

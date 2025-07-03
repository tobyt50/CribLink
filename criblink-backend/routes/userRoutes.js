const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// Removed: const upload = require('../middleware/uploadMiddleware'); // No longer needed
const { authenticateToken } = require('../middleware/authMiddleware');

// --- Auth & Profile Routes ---
router.post('/signup', userController.signupUser);
router.post('/signin', userController.signinUser);
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/update', authenticateToken, userController.updateProfile);

// --- Password Recovery ---
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// --- Profile Picture Management (no multer middleware) ---
// Expects base64 image data in the request body
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

module.exports = router;

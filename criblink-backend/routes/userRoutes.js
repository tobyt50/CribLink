const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const pool = require('../db'); // Assuming pool is used for database connection, though not directly in routes

router.post('/signup', userController.signupUser);
router.post('/signin', userController.signinUser);
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/update', authenticateToken, userController.updateProfile);

// New routes for password recovery
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// --- New routes for Profile Picture functionality ---
// Route for uploading/updating profile picture.
// It uses userController.uploadMiddleware (which contains multer) to process the file
// before passing it to userController.uploadProfilePicture.
router.put('/profile/picture/upload', authenticateToken, userController.uploadMiddleware, userController.uploadProfilePicture);

// Route for deleting a user's profile picture.
router.delete('/profile/picture', authenticateToken, userController.deleteProfilePicture);

// Route for updating a user's profile picture URL directly (if no file is being uploaded).
router.put('/profile/picture/url', authenticateToken, userController.updateProfilePictureUrl);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const pool = require('../db');

router.post('/signup', userController.signupUser);
router.post('/signin', userController.signinUser);
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/update', authenticateToken, userController.updateProfile);

// New routes for password recovery
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

module.exports = router;

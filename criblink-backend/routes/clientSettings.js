const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController'); // Adjust path as needed
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // Assuming you have an authentication middleware

// Route to get client's personalized settings
// Requires authentication to get the user_id and authorization for 'client' role
router.get(
  '/',
  authenticateToken,
  authorizeRoles('client'), // Ensure only clients can access their own settings
  settingsController.getClientSettings
);

// Route to update client's personalized settings
// Requires authentication to get the user_id and authorization for 'client' role
router.put(
  '/',
  authenticateToken,
  authorizeRoles('client'), // Ensure only clients can update their own settings
  settingsController.updateClientSettings
);

module.exports = router;

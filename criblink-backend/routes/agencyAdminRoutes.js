const express = require('express');
const router = express.Router();
const agencyAdminController = require('../controllers/agencyAdminController'); // Import the new controller
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // Ensure auth middleware is imported

// Route to get a single agency admin's profile details
// This route should typically be protected, only allowing agency_admin themselves or platform admins to view it.
// For now, we'll allow agency_admin to view their own profile.
router.get('/profile/:adminId', authenticateToken, authorizeRoles(['agency_admin', 'admin', 'agent']), agencyAdminController.getAgencyAdminProfile);

// Add other agency admin specific routes here as needed
// router.post('/members/:memberId/promote', authenticateToken, authorizeRoles(['agency_admin']), agencyAdminController.promoteMember);

module.exports = router;

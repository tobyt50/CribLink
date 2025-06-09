// routes/inquiriesRoutes.js
const express = require('express');
const router = express.Router();
const inquiriesController = require('../controllers/inquiriesController');
const { authenticateToken, authorizeRoles, optionalAuthenticateToken } = require('../middleware/authMiddleware');

// Route for clients/guests to create an inquiry
// This will be accessible at POST /agent/inquiries/
router.post('/', optionalAuthenticateToken, inquiriesController.createInquiry);

// AGENT/ADMIN ONLY ROUTES (mounted under /agent/inquiries)

// GET all inquiries for the authenticated agent/admin
// Accessible at GET /agent/inquiries/
// Corrected: Spreading the array into individual arguments for authorizeRoles
router.get('/', authenticateToken, authorizeRoles('agent', 'admin'), inquiriesController.getAllInquiries);

// PUT (assign) an inquiry
// Accessible at PUT /agent/inquiries/:id/assign
// Corrected: Spreading the array into individual arguments for authorizeRoles
router.put('/:id/assign', authenticateToken, authorizeRoles('agent', 'admin'), inquiriesController.assignInquiry);

// PUT (resolve) an inquiry
// Accessible at PUT /agent/inquiries/:id/resolve
// Corrected: Spreading the array into individual arguments for authorizeRoles
router.put('/:id/resolve', authenticateToken, authorizeRoles('agent', 'admin'), inquiriesController.resolveInquiry);

// DELETE an inquiry
// Accessible at DELETE /agent/inquiries/:id
// Corrected: Spreading the array into individual arguments for authorizeRoles
router.delete('/:id', authenticateToken, authorizeRoles('agent', 'admin'), inquiriesController.deleteInquiry);

module.exports = router;

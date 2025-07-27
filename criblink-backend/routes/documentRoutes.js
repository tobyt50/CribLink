const express = require('express');
const router = express.Router();
const { uploadLegalDocument, getLegalDocuments, deleteLegalDocument } = require('../controllers/documentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Route to upload a new legal document
// Accessible to admin and agency_admin
router.post('/upload', authenticateToken, authorizeRoles(['admin', 'agency_admin']), uploadLegalDocument);

// Route to get all legal documents (with optional filters/pagination)
// Accessible to admin and agency_admin
router.get('/', authenticateToken, authorizeRoles(['admin', 'agency_admin']), getLegalDocuments);

// Route to delete a legal document by ID
// Accessible to admin and agency_admin (with additional logic in controller for agency_admin)
router.delete('/:id', authenticateToken, authorizeRoles(['admin', 'agency_admin']), deleteLegalDocument);

module.exports = router;

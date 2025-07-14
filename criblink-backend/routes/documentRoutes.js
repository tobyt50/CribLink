const express = require('express');
const router = express.Router();
const { uploadLegalDocument, getLegalDocuments, deleteLegalDocument } = require('../controllers/documentController');
// FIX: Changed 'authorize' to 'authorizeRoles' to match the export from authMiddleware.js
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Route to upload a new legal document
router.post('/upload', authenticateToken, authorizeRoles(['admin', 'agent']), uploadLegalDocument);

// Route to get all legal documents (with optional filters/pagination)
router.get('/', authenticateToken, authorizeRoles(['admin', 'agent']), getLegalDocuments);

// Route to delete a legal document by ID
router.delete('/:id', authenticateToken, authorizeRoles(['admin', 'agent']), deleteLegalDocument);

module.exports = router;

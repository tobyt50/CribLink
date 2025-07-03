const express = require('express');
const router = express.Router();

const {
    getAllListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    getPurchaseCategories,
} = require('../controllers/listingsController');
// Import both authenticateToken and optionalAuthenticateToken
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware'); // <--- MODIFIED LINE

// Public Routes
router.get('/categories', getPurchaseCategories);
router.get('/:id', getListingById);

// The main listings route now uses optionalAuthenticateToken.
// This allows guests to view available listings, and logged-in users
// to have req.user populated for role-based filtering in the controller.
router.get('/', optionalAuthenticateToken, getAllListings); // <--- MODIFIED LINE

// Protected Routes (require authentication)
router.post(
    '/',
    authenticateToken,
    createListing
);

// Route for updating an existing listing (requires authentication and file upload handling)
router.put(
    '/:id',
    authenticateToken,
    updateListing
);

// Route for deleting a listing (requires authentication)
router.delete('/:id', authenticateToken, deleteListing);

module.exports = router;

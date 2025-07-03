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
    upload.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'galleryImages', maxCount: 10 }
    ]),
    createListing
);

// Route for updating an existing listing (requires authentication and file upload handling)
router.put(
    '/:id', // Listing ID in the URL parameters
    authenticateToken, // Authenticate the user
    upload.fields([
        { name: 'mainImageFile', maxCount: 1 },
        { name: 'newImages', maxCount: 10 },
    ]),
    updateListing // The controller function to handle updating the listing
);

// Route for deleting a listing (requires authentication)
router.delete('/:id', authenticateToken, deleteListing);

module.exports = router;

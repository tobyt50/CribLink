const express = require('express');
const router = express.Router();
// Removed: const upload = require('../middleware/uploadMiddleware'); // No longer needed

const {
    getAllListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    getPurchaseCategories,
} = require('../controllers/listingsController');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware');

// Public Routes
router.get('/categories', getPurchaseCategories);
router.get('/:id', getListingById);

router.get('/', optionalAuthenticateToken, getAllListings);

// Protected Routes (require authentication)
// Image data will be sent as base64 in the request body, no multer needed.
router.post(
    '/',
    authenticateToken,
    createListing
);

// Route for updating an existing listing (requires authentication)
// Image data will be sent as base64 in the request body, no multer needed.
router.put(
    '/:id', // Listing ID in the URL parameters
    authenticateToken, // Authenticate the user
    updateListing // The controller function to handle updating the listing
);

// Route for deleting a listing (requires authentication)
router.delete('/:id', authenticateToken, deleteListing);

module.exports = router;

const express = require('express');
const router = express.Router();
// Assuming upload middleware is correctly configured for multer
const upload = require('../middleware/uploadMiddleware');

const {
    getAllListings,
    getListingById,
    // Corrected import: Use createListing instead of addListing
    createListing,
    updateListing, // Make sure updateListing is imported
    deleteListing,
    // Also include the new getPurchaseCategories endpoint if you've added it to your controller
    getPurchaseCategories, // Assuming you've added this to listingsController.js
} = require('../controllers/listingsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public Routes
router.get('/categories', getPurchaseCategories);
router.get('/', getAllListings);
router.get('/:id', getListingById);

// Protected Routes (require authentication)
router.post(
    '/',
    authenticateToken,
    upload.fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'galleryImages', maxCount: 10 }
    ]),
    // Corrected handler: Use createListing
    createListing
);

// Route for updating an existing listing (requires authentication and file upload handling)
router.put(
    '/:id', // Listing ID in the URL parameters
    authenticateToken, // Authenticate the user
    // === ADDED: Middleware to handle multipart/form-data for file uploads and other form fields ===
    upload.fields([
        // 'mainImageFile' if you're sending the new thumbnail as a file from the frontend
        { name: 'mainImageFile', maxCount: 1 },
        // 'newImages' for any new gallery files being uploaded from the frontend
        { name: 'newImages', maxCount: 10 }, // Adjust maxCount as needed
        // Other non-file fields sent in the FormData (like title, location, etc.)
        // will be automatically parsed into req.body by this middleware.
    ]),
    // ==========================================================================================
    updateListing // The controller function to handle updating the listing
);

// Route for deleting a listing (requires authentication)
router.delete('/:id', authenticateToken, deleteListing);

module.exports = router;

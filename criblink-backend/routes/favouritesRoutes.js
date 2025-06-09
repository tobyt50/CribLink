const express = require('express');
const router = express.Router();
const favouritesController = require('../controllers/favouritesController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All favourite routes require authentication
router.use(authenticateToken);

// Add a listing to favourites
router.post('/', favouritesController.addFavourite);

// Remove a listing from favourites
router.delete('/:property_id', favouritesController.removeFavourite);

// Get all favourite listings for the authenticated user
router.get('/', favouritesController.getFavourites);

// Check if a specific listing is favourited by the authenticated user
router.get('/status/:property_id', favouritesController.getFavouriteStatus);

module.exports = router;

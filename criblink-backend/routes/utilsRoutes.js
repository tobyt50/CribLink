// criblink-backend/routes/utilsRoutes.js
const express = require("express");
const router = express.Router();
const utilsController = require("../controllers/utilsController");

/**
 * @route   GET /api/utils/reverse-geocode
 * @desc    Get location data (city, state, etc.) from latitude and longitude.
 * @access  Public
 * @query   lat - The latitude of the location.
 * @query   lon - The longitude of the location.
 */
router.get("/reverse-geocode", utilsController.reverseGeocode);

module.exports = router;

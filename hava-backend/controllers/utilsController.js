// hava-backend/controllers/utilsController.js
const axios = require("axios");
const GEOCODING_API_KEY = process.env.OPENCAGE_GEOCODING_API_KEY;

/**
 * @desc   Performs reverse geocoding to get raw location data from coordinates.
 * @route  GET /api/utils/reverse-geocode
 * @access Public
 */
exports.reverseGeocode = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({
        message:
          "Latitude (lat) and Longitude (lon) are required query parameters.",
      });
  }

  if (!GEOCODING_API_KEY) {
    console.error(
      "SERVER ERROR: OpenCage Geocoding API Key is not set on the backend.",
    );
    // Do not expose the specific error to the client, just fail gracefully.
    return res
      .status(500)
      .json({ message: "Location service is currently unavailable." });
  }

  try {
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${GEOCODING_API_KEY}`,
    );

    if (response.data.results.length > 0) {
      // Send back the entire first result object.
      // This gives the frontend maximum flexibility to extract what it needs (state, city, country, etc.).
      res.status(200).json(response.data.results[0]);
    } else {
      res
        .status(404)
        .json({ message: "No location found for the provided coordinates." });
    }
  } catch (error) {
    console.error(
      "Error during OpenCage API call from backend utility:",
      error.message,
    );
    res.status(500).json({ message: "Failed to perform reverse geocoding." });
  }
};

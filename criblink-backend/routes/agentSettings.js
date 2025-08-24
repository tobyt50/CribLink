const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController"); // Adjust path as needed
const { authenticateToken } = require("../middleware/authMiddleware"); // Correctly import authenticateToken

// Route to get agent's personalized settings
// Requires authentication to get the user_id
router.get("/", authenticateToken, settingsController.getAgentSettings);

// Route to update agent's personalized settings
// Requires authentication to get the user_id
router.put("/", authenticateToken, settingsController.updateAgentSettings);

module.exports = router;

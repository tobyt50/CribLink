const express = require("express");
const router = express.Router();
const favouritesController = require("../controllers/favouritesController");
const { authenticateToken } = require("../middleware/authMiddleware");

// All favourite routes require authentication
router.use(authenticateToken);

// --- Property Favourites ---
// Add a listing to favourites
router.post("/properties", favouritesController.addFavouriteProperty);
// Remove a listing from favourites
router.delete(
  "/properties/:property_id",
  favouritesController.removeFavouriteProperty,
);
// Get all favourite listings for the authenticated user
router.get("/properties", favouritesController.getFavouriteProperties);
// Check if a specific listing is favourited by the authenticated user
router.get(
  "/properties/status/:property_id",
  favouritesController.getFavouritePropertyStatus,
);

// --- Agent Favourites ---
// Add an agent to favourites
router.post("/agents", favouritesController.addFavouriteAgent);
// Remove an agent from favourites
router.delete("/agents/:agent_id", favouritesController.removeFavouriteAgent);
// Get all favourite agents for the authenticated user
router.get("/agents", favouritesController.getFavouriteAgents);
// Check if a specific agent is favourited by the authenticated user
router.get(
  "/agents/status/:agent_id",
  favouritesController.getFavouriteAgentStatus,
);

// --- Client Favourites --- (Primarily for Agents/Agency Admins to favourite clients)
// Add a client to favourites
router.post("/clients", favouritesController.addFavouriteClient);
// Remove a client from favourites
router.delete(
  "/clients/:client_id",
  favouritesController.removeFavouriteClient,
);
// Get all favourite clients for the authenticated user
router.get("/clients", favouritesController.getFavouriteClients);
// Check if a specific client is favourited by the authenticated user
router.get(
  "/clients/status/:client_id",
  favouritesController.getFavouriteClientStatus,
);

// --- Agency Favourites ---
// Add an agency to favourites
router.post("/agencies", favouritesController.addFavouriteAgency);
// Remove an agency from favourites
router.delete(
  "/agencies/:agency_id",
  favouritesController.removeFavouriteAgency,
);
// Get all favourite agencies for the authenticated user
router.get("/agencies", favouritesController.getFavouriteAgencies);
// Check if a specific agency is favourited by the authenticated user
router.get(
  "/agencies/status/:agency_id",
  favouritesController.getFavouriteAgencyStatus,
);

module.exports = router;

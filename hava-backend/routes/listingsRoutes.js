const express = require("express");
const router = express.Router();

const {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getPurchaseCategories,
  getFeaturedListings,
  incrementViewCount
} = require("../controllers/listingsController");

// --- NEW: Import middleware ---
const {
  authenticateToken,
  optionalAuthenticateToken,
} = require("../middleware/authMiddleware");
const {
  enforceSubscriptionLimit,
} = require("../middleware/subscriptionEnforcer");

// Public Routes
router.get("/categories", getPurchaseCategories);
router.get("/featured", getFeaturedListings);
router.get("/:id", getListingById);
router.post("/:id/view", incrementViewCount);
router.get("/", optionalAuthenticateToken, getAllListings);

// Protected Routes (require authentication)

// UPDATE: Added 'enforceSubscriptionLimit' middleware to the creation route.
// This will check if the user is allowed to create a new listing based on their plan's maxListings limit.
router.post(
  "/",
  authenticateToken,
  enforceSubscriptionLimit("addListing"), // Middleware runs before the controller
  createListing,
);

// The update route remains the same. Complex checks (like featuring a listing)
// are handled inside the controller for more accuracy.
router.put("/:id", authenticateToken, updateListing);

// Route for deleting a listing (requires authentication)
router.delete("/:id", authenticateToken, deleteListing);

module.exports = router;

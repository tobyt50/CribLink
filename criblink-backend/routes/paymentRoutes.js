const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticateToken } = require("../middleware/authMiddleware");

// This route MUST be protected. Only logged-in users can create payments.
router.post(
  "/create-payment-intent",
  authenticateToken,
  paymentController.createPaymentIntent,
);

module.exports = router;

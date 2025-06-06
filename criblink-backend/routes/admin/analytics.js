// routes/admin/analytics.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/analyticsController');
const adminStatsController = require('../../controllers/adminStatsController'); // To use existing admin stats
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware'); // Assuming you have this middleware

// All analytics routes should be protected and typically only accessible by admins
router.use(authenticateToken);
// You might want to add authorizeRoles('admin') here if only admins can access analytics
// router.use(authorizeRoles('admin'));

// Overview Stats (combining existing and new)
router.get('/stats/listings-count', adminStatsController.getListingsCount); // Existing
router.get('/stats/inquiries-count', adminStatsController.getInquiriesCount); // Existing
router.get('/total-users-count', analyticsController.getTotalUsersCount); // New
router.get('/revenue-sold-listings', analyticsController.getRevenueSoldListings); // New
router.get('/total-deals-closed', analyticsController.getTotalDealsClosed); // New

// Detailed Analytics Charts
router.get('/listing-status', analyticsController.getListingStatusDistribution);
router.get('/listings-over-time', analyticsController.getListingsOverTime);
router.get('/user-registrations', analyticsController.getUserRegistrationTrends);
router.get('/inquiry-trends', analyticsController.getInquiryTrends);
router.get('/property-types', analyticsController.getPropertyTypeDistribution);
router.get('/listing-price-distribution', analyticsController.getListingPriceDistribution);
router.get('/top-locations', analyticsController.getTopLocations);
router.get('/agent-performance', analyticsController.getAgentPerformanceMetrics);

module.exports = router;

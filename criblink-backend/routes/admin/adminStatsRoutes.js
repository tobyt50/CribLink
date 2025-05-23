const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const {
    getAllUsers,
    getAgentCount,
    getListingsCount,
    getInquiriesCount,
    getPendingApprovalsCount,
} = require('../../controllers/adminStatsController');

// Protect all admin routes
router.use(authenticateToken, authorizeRoles('admin'));

// Dashboard stat endpoints
router.get('/users', getAllUsers); // all users
router.get('/agents/count', getAgentCount); // total agents
router.get('/listings/count', getListingsCount); // total listings
router.get('/inquiries/count', getInquiriesCount);
router.get('/listings/pending-approvals', getPendingApprovalsCount); // pending listings


module.exports = router;

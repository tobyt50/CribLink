// routes/admin/agentPerformanceRoutes.js
const express = require('express');
const router = express.Router();
// Correct path to controller assuming it's in the 'controllers' directory at the root
const AgentPerformanceController = require('../../controllers/agentPerformanceController');
// Correct path to middleware assuming it's in the 'middleware' directory at the root
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

// These routes will be mounted under '/admin/agent' in app.js
// So, '/performance' will be accessed as '/admin/agent/performance'

router.get('/performance',
    authenticateToken,
    authorizeRoles('admin'),
    AgentPerformanceController.getAgentPerformance
);

router.post('/performance',
    authenticateToken,
    authorizeRoles('admin'),
    AgentPerformanceController.addAgentPerformance
);

router.put('/performance/:userId',
    authenticateToken,
    authorizeRoles('admin'),
    AgentPerformanceController.updateAgentPerformance
);

router.delete('/performance/:userId',
    authenticateToken,
    authorizeRoles('admin'),
    AgentPerformanceController.deleteAgentPerformance
);

module.exports = router;

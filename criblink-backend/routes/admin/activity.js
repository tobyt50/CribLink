const express = require("express");
const router = express.Router();
const { getRecentActivity } = require("../../controllers/activityController");

router.get("/recent-activity", getRecentActivity);

module.exports = router;

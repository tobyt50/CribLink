const express = require("express");
const router = express.Router();

// Health check (no DB hit, just keeps service warm)
router.get("/", (req, res) => {
  res.status(200).json({ status: "ok", service: "criblink-backend" });
});

// DB health check (optional, useful for monitoring Neon)
router.get("/db", async (req, res) => {
  try {
    await req.db.raw("SELECT 1"); // knex query
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("DB health failed:", err);
    res.status(500).json({ status: "error", db: "unreachable" });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../../db');
const authenticate = require('../../middleware/authenticate');
const authenticateAdmin = require('../../middleware/authenticateAdmin');

// GET admin settings
router.get('/', authenticate, authenticateAdmin, async(req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM admin_settings WHERE user_id = $1', [req.user.user_id]
        );

        res.json(result.rows[0] || {});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// UPDATE admin settings
router.put('/', authenticate, authenticateAdmin, async(req, res) => {
    const { commission_rate, notifications_enabled } = req.body;

    try {
        await pool.query(
            `
      INSERT INTO admin_settings (user_id, commission_rate, notifications_enabled)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
      SET commission_rate = EXCLUDED.commission_rate,
          notifications_enabled = EXCLUDED.notifications_enabled
      `, [req.user.user_id, commission_rate, notifications_enabled]
        );

        res.json({ message: 'Settings updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

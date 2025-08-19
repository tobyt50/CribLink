// jobs/expireFeatured.js
const { query } = require('../db'); // adjust path if needed

async function expireFeaturedListings() {
  await query(
    `UPDATE property_listings
     SET is_featured = false,
         featured_expires_at = NULL
     WHERE is_featured = true
       AND featured_expires_at < NOW()`
  );
}

module.exports = expireFeaturedListings;

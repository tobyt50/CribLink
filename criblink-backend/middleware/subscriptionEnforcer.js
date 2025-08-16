const SUBSCRIPTION_TIERS = require('../config/subscriptionConfig');

function enforceSubscriptionLimit(action) {
  return async (req, res, next) => {
    const user = req.user; // Assumes auth middleware sets req.user
    const tierConfig = SUBSCRIPTION_TIERS[user.subscription_type || 'basic'];

    try {
      if (action === 'addListing') {
        const activeListings = await req.db('property_listings')
          .where({ agent_id: user.user_id, status: 'available' })
          .count('property_id as count')
          .first();

        if (activeListings.count >= tierConfig.maxListings) {
          return res.status(403).json({
            error: `Your plan allows only ${tierConfig.maxListings} active listings. Upgrade to add more.`
          });
        }
      }

      if (action === 'featureListing') {
        if (tierConfig.maxFeatured === 0) {
          return res.status(403).json({ error: 'Your plan does not allow featured listings.' });
        }

        const activeFeatured = await req.db('property_listings')
          .where({ agent_id: user.user_id, is_featured: true })
          .andWhere('featured_expires_at', '>', req.db.fn.now())
          .count('property_id as count')
          .first();

        if (activeFeatured.count >= tierConfig.maxFeatured) {
          return res.status(403).json({
            error: `Your plan allows only ${tierConfig.maxFeatured} featured listings at once.`
          });
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { enforceSubscriptionLimit };
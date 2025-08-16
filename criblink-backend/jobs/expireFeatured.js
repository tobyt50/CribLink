async function expireFeaturedListings(db) {
    await db('property_listings')
      .where('is_featured', true)
      .andWhere('featured_expires_at', '<', db.fn.now())
      .update({ is_featured: false, featured_expires_at: null });
  }
  
  module.exports = expireFeaturedListings;
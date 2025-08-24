const SUBSCRIPTION_TIERS = {
  basic: {
    maxListings: 5,
    featuredPriority: 0,
    maxFeatured: 0,
    featuredDays: 0,
    maxImages: 5,
    videoTours: 0,
    analytics: "basic",
  },
  pro: {
    maxListings: 20,
    featuredPriority: 6,
    maxFeatured: 5,
    featuredDays: 14,
    maxImages: 15,
    videoTours: 1,
    analytics: "moderate",
  },
  enterprise: {
    maxListings: Infinity,
    featuredPriority: 10,
    maxFeatured: 10,
    featuredDays: 30,
    maxImages: Infinity,
    videoTours: Infinity,
    analytics: "advanced",
  },
};
module.exports = SUBSCRIPTION_TIERS;

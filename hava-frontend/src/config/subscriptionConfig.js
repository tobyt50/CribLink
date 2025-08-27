// src/config/subscriptionConfig.js

export const SUBSCRIPTION_TIERS = {
  basic: {
    name: "Basic",
    maxListings: 5,
    maxFeatured: 0,
    maxImages: 5,
    videoTours: 0,
  },
  pro: {
    name: "Pro",
    maxListings: 20,
    maxFeatured: 5,
    maxImages: 15,
    videoTours: 1,
  },
  enterprise: {
    name: "Enterprise",
    maxListings: Infinity,
    maxFeatured: 10,
    maxImages: Infinity,
    videoTours: Infinity,
  },
};

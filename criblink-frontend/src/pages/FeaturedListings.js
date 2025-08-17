import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTheme } from "../layouts/AppShell";
import { useMessage } from "../context/MessageContext";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
// REMOVED: import axios from 'axios'; // No longer needed for direct 3rd party calls
import axiosInstance from '../api/axiosInstance';
import HomeSearchFilters from "../components/HomeSearchFilters";
import { useAuth } from "../context/AuthContext";

const ITEMS_PER_PAGE = 20;
const MIN_LISTINGS_FOR_CATEGORY = 1;
const MAX_DYNAMIC_CATEGORIES = 4;// Normalize state names from geocoder to match DB format

// --- Helpers ---
const normalizeState = (s) => {
  if (!s) return "";
  let clean = s.trim();
  if (clean.endsWith(" State")) {
    clean = clean.replace(/ State$/i, "").trim();
  }
  if (clean === "Federal Capital Territory" || clean === "Abuja Federal Capital Territory") {
    return "Abuja";
  }
  return clean;
};

const getGroupsBy = (listings, key) =>
  listings.reduce((acc, l) => {
    if (l[key]) {
      acc[l[key]] = (acc[l[key]] || []).concat(l);
    }
    return acc;
  }, {});

// Zone-based fallbacks
const ZONE_FALLBACKS = {
  NorthCentral: ["Abuja", "Nasarawa", "Kogi", "Niger", "Benue", "Kwara", "Plateau"],
  NorthEast: ["Borno", "Bauchi", "Adamawa", "Gombe", "Taraba", "Yobe"],
  NorthWest: ["Kano", "Kaduna", "Katsina", "Kebbi", "Sokoto", "Zamfara", "Jigawa"],
  SouthEast: ["Anambra", "Abia", "Ebonyi", "Enugu", "Imo"],
  SouthSouth: ["Rivers", "Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo"],
  SouthWest: ["Lagos", "Ekiti", "Ogun", "Ondo", "Osun", "Oyo"],
};

// Map each state → dominant hub in its zone
const ZONE_HUBS = {
  ...Object.fromEntries(
    Object.entries(ZONE_FALLBACKS).flatMap(([zone, states]) =>
      states.map((st) => [st, states[0]]) // pick the 1st as hub
    )
  ),
};


// Skeleton component remains the same
const ListingCardSkeleton = ({ darkMode }) => (
  <div className={`rounded-xl shadow-lg p-4 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
    <div className={`w-full h-32 rounded-lg ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
    <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-2`}></div>
    <div className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
    <div className="flex justify-between items-center">
      <div className={`h-8 w-1/3 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </div>
  </div>
);

// Apple-style smooth scroll animation
const animateScroll = (element, to, duration = 800, onComplete) => {
  const start = element.scrollLeft;
  const change = to - start;
  const startTime = performance.now();

  const spring = (t) => 1 - Math.cos(t * 4.5 * Math.PI) * Math.exp(-t * 6);

  const animate = (time) => {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    element.scrollLeft = start + change * spring(progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };

  requestAnimationFrame(animate);
};


// Carousel row component remains the same
const FeaturedCategoryRow = ({ title, listings, searchLink, userFavourites, onFavoriteToggle, ...otherProps }) => {
  const { darkMode } = useTheme();
  const carouselRef = useRef(null);
  const autoSwipeIntervalRef = useRef(null);

  const isCarousel = listings.length > 1;

  // ✅ New auto-swipe logic
  useEffect(() => {
    if (!isCarousel || !carouselRef.current) return;
    const carousel = carouselRef.current;

    const itemElement = carousel.querySelector(".featured-card-item");
    if (!itemElement) return;

    const itemStyle = window.getComputedStyle(itemElement);
    const itemMarginLeft = parseFloat(itemStyle.marginLeft);
    const itemMarginRight = parseFloat(itemStyle.marginRight);
    const itemWidthWithMargins =
      itemElement.offsetWidth + itemMarginLeft + itemMarginRight;

    let index = 0;
    autoSwipeIntervalRef.current = setInterval(() => {
      index = (index + 1) % listings.length; // loop over real items
      const newScrollTarget = index * itemWidthWithMargins;
      animateScroll(carousel, newScrollTarget, 800);
    }, 3000);

    return () => clearInterval(autoSwipeIntervalRef.current);
  }, [isCarousel, listings.length]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-4">
        <Link to={searchLink} className="group">
          <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"} group-hover:text-green-900 dark:group-hover:text-green-400 transition-colors`}>
            {title}
          </h3>
        </Link>
      </div>
      <div
        ref={carouselRef}
        className={`flex flex-nowrap pb-4 -mb-4 ${
          isCarousel ? "overflow-x-scroll no-scrollbar" : "justify-center"
        }`}
      >
        {listings.map((listing) => (
          <div
            key={listing.property_id}
            className={`featured-card-item flex-shrink-0 ${
              isCarousel
                ? "w-[45%] sm:w-[45%] px-2 md:w-1/3 lg:w-1/5"
                : "w-full max-w-sm px-2"
            }`}
          >
            <ListingCard
              listing={listing}
              isFavorited={userFavourites.includes(listing.property_id)}
              onFavoriteToggle={onFavoriteToggle}
              {...otherProps}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};


// --- START OF UPDATE ---
// Geocoding helper function now calls the secure backend endpoint
const reverseGeocode = async (latitude, longitude) => {
    try {
        // Use axiosInstance to call your new, secure backend endpoint at /api/utils/reverse-geocode
        const response = await axiosInstance.get(`/utils/reverse-geocode`, {
            params: {
                lat: latitude,
                lon: longitude
            }
        });
        // The backend sends the full result, we just extract the state
        return response.data?.components.state || null;
    } catch (error) {
        console.error('Error fetching location from backend geocoder:', error.message);
        return null;
    }
};
// --- END OF UPDATE ---

function FeaturedListings() {
  const [allFeaturedListings, setAllFeaturedListings] = useState([]);
  const [paginatedListings, setPaginatedListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("date_listed_desc");
  const [loading, setLoading] = useState(true);
  const [userFavourites, setUserFavourites] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState({
    location: "", propertyType: "", subtype: "", bedrooms: "", bathrooms: "",
    minPrice: "", maxPrice: "", purchaseCategory: "",
  });
  const [userState, setUserState] = useState(null);

  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const currentUserRole = user?.role || 'guest';
  const currentUserId = user?.user_id || null;
  const currentUserAgencyId = user?.agency_id || null;

  const getRoleBasePath = useCallback(() => {
    if (currentUserRole === 'admin') return '/admin';
    if (currentUserRole === 'agency_admin') return '/agency';
    if (currentUserRole === 'agent') return '/agent';
    return '';
  }, [currentUserRole]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const state = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (state) setUserState(state);
      },
      (error) => console.warn("Could not get user location:", error.message),
      { timeout: 5000, enableHighAccuracy: false }
    );
  }, []);

  const dynamicCategories = useMemo(() => {
    if (loading || authLoading || !allFeaturedListings.length) return [];
  
    // 1. Work out a safe effective state
    const normalizedUserState = normalizeState(userState);
  
    const effectiveUserState = normalizedUserState || (() => {
      const counts = allFeaturedListings.reduce((acc, l) => {
        const st = normalizeState(l.state);
        if (!st) return acc;
        acc[st] = (acc[st] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Lagos";
    })();
  
    // 2. Work out the zone
    const zoneName = Object.entries(ZONE_FALLBACKS)
      .find(([, states]) => states.includes(effectiveUserState))?.[0];
  
    // 3. Build an ordered list of states to try
    const statesToTry = [
      effectiveUserState,
      ZONE_HUBS[effectiveUserState],
      ...(zoneName ? ZONE_FALLBACKS[zoneName] : []),
    ]
      .filter(Boolean)
      .filter((s, i, arr) => arr.indexOf(s) === i);
  
    // 4. Helper to get listings by category
    const getListingsInZone = (filterFn) => {
      for (const st of statesToTry) {
        const hits = allFeaturedListings.filter(
          (l) => normalizeState(l.state) === st && filterFn(l)
        );
        if (hits.length >= MIN_LISTINGS_FOR_CATEGORY) return hits;
      }
      return allFeaturedListings.filter(filterFn); // global fallback
    };
  
    // 5. Build categories WITH search links
    const categories = [];
  
    const addCategory = (title, filterFn, paramsBuilder) => {
      const listings = getListingsInZone(filterFn);
      if (!listings.length) return;
  
      const sample = listings[0];
      const state = sample.state;
      const location = sample.location;
  
      const params = paramsBuilder({ state, location, sample });
      const searchLink = `/search?${params.toString()}`;
  
      categories.push({
        title: `${title} →`,
        listings,
        searchLink,
      });
    };
  
    addCategory(
      "Bungalows Near You",
      (l) => (l.property_type || "").toLowerCase() === "bungalow",
      ({ state }) => new URLSearchParams({ status: "featured", property_type: "bungalow", state })
    );
  
    addCategory(
      "Duplexes Near You",
      (l) => (l.property_type || "").toLowerCase() === "duplex",
      ({ state }) => new URLSearchParams({ status: "featured", property_type: "duplex", state })
    );
  
    addCategory(
      "Rentals Near You",
      (l) => (l.purchase_category || "").toLowerCase() === "rent",
      ({ state }) => new URLSearchParams({ status: "featured", purchase_category: "rent", state })
    );
  
    addCategory(
      "Properties for Sale Near You",
      (l) => (l.purchase_category || "").toLowerCase() === "sale",
      ({ state }) => new URLSearchParams({ status: "featured", purchase_category: "sale", state })
    );
  
    return categories.slice(0, MAX_DYNAMIC_CATEGORIES);
  }, [loading, authLoading, userState, allFeaturedListings]);
  
  
  
  const fetchUserFavourites = useCallback(async () => {
    if (!isAuthenticated) { setUserFavourites([]); return; }
    try {
      const response = await axiosInstance.get(`/favourites/properties`);
      setUserFavourites(response.data.favourites.map(fav => fav.property_id));
    } catch (error) { setUserFavourites([]); }
  }, [isAuthenticated]);

  const fetchAllFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/listings/featured`);
      const allListings = response.data.listings || [];
      // Filter for listings that are either 'available' or 'under offer'
      const filteredListings = allListings.filter(l => l.status === 'available' || l.status === 'under offer');
      
      setAllFeaturedListings(filteredListings);
      setTotalPages(Math.ceil(filteredListings.length / ITEMS_PER_PAGE));
      setPaginatedListings(filteredListings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE));
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to fetch featured listings.', 'error');
      setAllFeaturedListings([]); setPaginatedListings([]); setTotalPages(1);
    } finally { setLoading(false); }
  }, [showMessage, currentPage]);

  const handleFavoriteToggle = useCallback(async (propertyId, isCurrentlyFavorited) => {
    if (!isAuthenticated) { showMessage("Please log in to manage your favorites.", "error"); navigate('/signin'); return; }
    try {
      if (isCurrentlyFavorited) {
        await axiosInstance.delete(`/favourites/properties/${propertyId}`);
        showMessage("Removed from favorites!", "success");
      } else {
        await axiosInstance.post(`/favourites/properties`, { property_id: propertyId });
        showMessage("Added to favorites!", "success");
      }
      fetchUserFavourites();
    } catch (error) { showMessage(error.response?.data?.message || 'Failed to update favorites.', 'error'); }
  }, [isAuthenticated, fetchUserFavourites, showMessage, navigate]);
  
  const handleDeleteListing = useCallback((listingId) => {
    showConfirm({
        title: "Delete Listing", message: "Are you sure you want to delete this listing permanently?",
        onConfirm: async () => {
            try {
                await axiosInstance.delete(`/listings/${listingId}`);
                showMessage('Listing deleted successfully!', 'success');
                fetchAllFeatured();
            } catch (error) { showMessage('Failed to delete listing. Please try again.', 'error'); }
        },
    });
  }, [showConfirm, showMessage, fetchAllFeatured]);

  useEffect(() => {
    if (!authLoading) {
      fetchAllFeatured();
    }
  }, [currentPage, authLoading, fetchAllFeatured]);
  
  useEffect(() => {
    if(!authLoading) {
        fetchUserFavourites();
    }
  }, [authLoading, fetchUserFavourites]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams({ status: "featured" });
    if (searchTerm.trim()) queryParams.set("search", searchTerm.trim());
    if (advancedFilters.purchaseCategory) queryParams.set("purchase_category", advancedFilters.purchaseCategory);
    if (advancedFilters.location) queryParams.set("location", advancedFilters.location);
    if (advancedFilters.propertyType) queryParams.set("property_type", advancedFilters.propertyType);
    if (advancedFilters.bedrooms) queryParams.set("bedrooms", advancedFilters.bedrooms);
    if (advancedFilters.bathrooms) queryParams.set("bathrooms", advancedFilters.bathrooms);
    if (advancedFilters.minPrice) queryParams.set("min_price", advancedFilters.minPrice);
    if (advancedFilters.maxPrice) queryParams.set("max_price", advancedFilters.maxPrice);
    if (sortBy) queryParams.set("sortBy", sortBy);
    navigate(`/search?${queryParams.toString()}`);
  }, [searchTerm, advancedFilters, sortBy, navigate]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  }, [totalPages]);

  return (
    <>
      <div className={`pt-0 -mt-6 pb-10 px-4 md:px-8 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <motion.div className="text-center max-w-4xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className={`text-2xl md:text-3xl font-extrabold mb-1 flex items-center justify-center gap-3 ${darkMode ? "text-green-400" : "text-green-700"}`}>
          <Star size={15} className="text-yellow-400 fill-current" />
            Featured Properties
            <Star size={15} className="text-yellow-400 fill-current" />
          </h1>
          <div className="w-full max-w-4xl mx-auto mt-2">
            <HomeSearchFilters
              filters={advancedFilters}
              setFilters={setAdvancedFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearch={handleSearch}
            />
          </div>
        </motion.div>

        <div className="space-y-8 my-4">
            {dynamicCategories.map(category => (
                <FeaturedCategoryRow
                    key={category.title}
                    title={category.title}
                    listings={category.listings}
                    searchLink={category.searchLink}
                    userFavourites={userFavourites}
                    onFavoriteToggle={handleFavoriteToggle}
                    userRole={currentUserRole}
                    userId={currentUserId}
                    userAgencyId={currentUserAgencyId}
                    getRoleBasePath={getRoleBasePath}
                    onDeleteListing={handleDeleteListing}
                />
            ))}
        </div>

        <div className="border-t pt-4 mt-4 border-dashed border-gray-300 dark:border-gray-700">
            <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>All Featured Listings</h2>
            <motion.div className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}>
            {loading ? (
                [...Array(ITEMS_PER_PAGE)].map((_, i) => (
                <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.4 }}>
                    <ListingCardSkeleton darkMode={darkMode} />
                </motion.div>
                ))
            ) : paginatedListings.length > 0 ? (
                paginatedListings.map((listing) => (
                <motion.div key={listing.property_id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.4 }}>
                    <ListingCard
                      listing={listing}
                      isFavorited={userFavourites.includes(listing.property_id)}
                      onFavoriteToggle={handleFavoriteToggle}
                      userRole={currentUserRole}
                      userId={currentUserId}
                      userAgencyId={currentUserAgencyId}
                      getRoleBasePath={getRoleBasePath}
                      onDeleteListing={handleDeleteListing}
                    />
                </motion.div>
                ))
            ) : (
                <motion.div className={`col-span-full text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-600"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  No featured listings found.
                </motion.div>
            )}
            </motion.div>

            {totalPages > 1 && !loading && (
            <div className="flex justify-center items-center gap-4 mt-10 pb-8">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 focus:ring-green-400" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-green-600"}`}>
                  <ChevronLeft size={18} /> Prev
                </button>
                <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Page {currentPage} of {totalPages}
                </span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 focus:ring-green-400" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-green-600"}`}>
                  Next <ChevronRight size={18} />
                </button>
            </div>
            )}
        </div>
      </div>
    </>
  );
}

export default FeaturedListings;
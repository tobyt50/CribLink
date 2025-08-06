import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import API_BASE_URL from "../config";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowDownUp, Search, Star, ArrowLeftCircleIcon, ArrowRightCircleIcon, SlidersHorizontal } from "lucide-react";
import { useTheme } from "../layouts/AppShell";
import { useMessage } from "../context/MessageContext";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import axiosInstance from '../api/axiosInstance';
import HomeSearchFilters from "../components/HomeSearchFilters";

const ITEMS_PER_PAGE = 20;

// Skeleton for a Listing Card (graphical view)
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

// New Skeleton for Headers
const HeaderSkeleton = ({ darkMode, widthClass, heightClass }) => (
  <div className={`animate-pulse rounded-xl ${widthClass} ${heightClass} ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
);


function Home() {
  const [listings, setListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("date_listed_desc");
  const searchInputRef = useRef(null);
  const searchContextRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const featuredCarouselRef = useRef(null);
  const autoSwipeIntervalRef = useRef(null);
  const initialScrollSet = useRef(false); // New ref to ensure initial scroll happens once
  const [loading, setLoading] = useState(true);

  const [showSearchContext, setShowSearchContext] = useState(false);
  const [userFavourites, setUserFavourites] = useState([]);

  const [advancedFilters, setAdvancedFilters] = useState({
    location: "",
    propertyType: "",
    subtype: "",
    bedrooms: "",
    bathrooms: "",
    minPrice: "",
    maxPrice: "",
    purchaseCategory: "",
  });

  // Define how many featured items are visible at once on different screen sizes
  // This might not be directly used for the new mobile partial view, but kept for larger screens.
  const FEATURED_ITEMS_PER_VIEW = {
    sm: 2, // On small screens (sm), show 2 items
    lg: 4, // On large screens (lg), show 4 items
    default: 2 // Default for extra small screens, now shows 2 items
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const currentUserRole = user?.role || 'guest';
  const currentUserId = user?.user_id || null;
  const currentUserAgencyId = user?.agency_id || null;

  const getRoleBasePath = () => {
      if (currentUserRole === 'admin') return '/admin';
      if (currentUserRole === 'agency_admin') return '/agency';
      if (currentUserRole === 'agent') return '/agent';
      return '';
  };

  const fetchUserFavourites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserFavourites([]);
      return;
    }
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/favourites/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserFavourites(response.data.favourites.map(fav => fav.property_id));
    } catch (error) {
      console.error("Failed to fetch user favourites:", error);
      setUserFavourites([]);
    }
  }, []);

  const handleFavoriteToggle = useCallback(async (propertyId, isCurrentlyFavorited) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Please log in to manage your favorites.", "error");
      navigate('/signin');
      return;
    }

    try {
      if (isCurrentlyFavorited) {
        await axiosInstance.delete(`${API_BASE_URL}/favourites/properties/${propertyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showMessage("Removed from favorites!", "success");
      } else {
        await axiosInstance.post(`${API_BASE_URL}/favourites/properties`, { property_id: propertyId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showMessage("Added to favorites!", "success");
      }
      fetchUserFavourites();
    } catch (error) {
      console.error("Failed to toggle favorite status:", error);
      let errorMessage = 'Failed to update favorites. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  }, [fetchUserFavourites, showMessage, navigate]);

  const handleDeleteListing = async (listingId) => {
    showConfirm({
        title: "Delete Listing",
        message: "Are you sure you want to delete this listing permanently? This action cannot be undone.",
        onConfirm: async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Authentication token not found. Please sign in.', 'error');
                return;
            }
            try {
                await axiosInstance.delete(`${API_BASE_URL}/listings/${listingId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                showMessage('Listing deleted successfully!', 'success');
                fetchListings();
            } catch (error) {
                console.error('Error deleting listing:', error.response?.data || error.message);
                showMessage('Failed to delete listing. Please try again.', 'error');
            }
        },
        confirmLabel: "Delete",
        cancelLabel: "Cancel"
    });
  };

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (advancedFilters.purchaseCategory) {
      params.append("purchase_category", advancedFilters.purchaseCategory);
    } else if (category) {
      params.append("purchase_category", category);
    }

    if (searchTerm) params.append("search", searchTerm);
    params.append("page", currentPage);
    params.append("limit", ITEMS_PER_PAGE);
    params.append("sortBy", sortBy);

    if (advancedFilters.location) params.append("location", advancedFilters.location);
    if (advancedFilters.propertyType) params.append("property_type", advancedFilters.propertyType);
    if (advancedFilters.bedrooms) params.append("bedrooms", advancedFilters.bedrooms);
    if (advancedFilters.bathrooms) params.append("bathrooms", advancedFilters.bathrooms);
    if (advancedFilters.minPrice) params.append("min_price", advancedFilters.minPrice);
    if (advancedFilters.maxPrice) params.append("max_price", advancedFilters.maxPrice);

    const url = `${API_BASE_URL}/listings?${params.toString()}`;
    console.log("Fetching listings with URL:", url);

    const featuredParams = new URLSearchParams();
    featuredParams.append("status", "Featured");
    featuredParams.append("limit", 12);

    if (advancedFilters.purchaseCategory) {
        featuredParams.append("purchase_category", advancedFilters.purchaseCategory);
    } else if (category) {
        featuredParams.append("purchase_category", advancedFilters.purchaseCategory);
    }
    if (searchTerm) featuredParams.append("search", searchTerm);
    if (advancedFilters.location) featuredParams.append("location", advancedFilters.location);
    if (advancedFilters.propertyType) featuredParams.append("property_type", advancedFilters.propertyType);
    if (advancedFilters.bedrooms) featuredParams.append("bedrooms", advancedFilters.bedrooms);
    if (advancedFilters.bathrooms) featuredParams.append("bathrooms", advancedFilters.bathrooms);
    if (advancedFilters.minPrice) params.append("min_price", advancedFilters.minPrice);
    if (advancedFilters.maxPrice) params.append("max_price", advancedFilters.maxPrice);

    const featuredUrl = `${API_BASE_URL}/listings?${featuredParams.toString()}`;

    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await axiosInstance.get(url, { headers });
      const allListings = response.data.listings || [];
      setTotalPages(response.data.totalPages || 1);

      const featuredResponse = await axiosInstance.get(featuredUrl, { headers });
      const fetchedFeaturedListings = featuredResponse.data.listings || [];
      setFeaturedListings(fetchedFeaturedListings);

      const combinedListings = [...allListings];
      fetchedFeaturedListings.forEach(featuredListing => {
        if (!combinedListings.some(l => l.property_id === featuredListing.property_id)) {
          combinedListings.push(featuredListing);
        }
      });
      setListings(combinedListings);

    } catch (error) {
      let errorMessage = 'Failed to fetch listings. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
      setListings([]);
      setFeaturedListings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [category, searchTerm, currentPage, sortBy, showMessage, advancedFilters]);

  useEffect(() => {
    setCurrentPage(1);
    fetchListings();
    fetchUserFavourites();
  }, [category, searchTerm, sortBy, advancedFilters, fetchListings, fetchUserFavourites]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();

    if (searchTerm.trim()) {
      queryParams.append("query", encodeURIComponent(searchTerm.trim()));
    }
    if (advancedFilters.purchaseCategory) {
      queryParams.append("category", encodeURIComponent(advancedFilters.purchaseCategory));
    } else if (category) {
      queryParams.append("category", encodeURIComponent(category));
    }

    if (advancedFilters.location) queryParams.append("location", encodeURIComponent(advancedFilters.location));
    if (advancedFilters.propertyType) queryParams.append("property_type", encodeURIComponent(advancedFilters.propertyType));
    if (advancedFilters.subtype) queryParams.append("subtype", encodeURIComponent(advancedFilters.subtype));
    if (advancedFilters.bedrooms) queryParams.append("bedrooms", encodeURIComponent(advancedFilters.bedrooms));
    if (advancedFilters.bathrooms) queryParams.append("bathrooms", encodeURIComponent(advancedFilters.bathrooms));
    if (advancedFilters.minPrice) queryParams.append("min_price", encodeURIComponent(advancedFilters.minPrice));
    if (advancedFilters.maxPrice) queryParams.append("max_price", encodeURIComponent(advancedFilters.maxPrice));

    if (searchTerm.trim() || advancedFilters.purchaseCategory || Object.values(advancedFilters).some(filter => filter)) {
      navigate(`/search?${queryParams.toString()}`);
    } else {
      showMessage('Please enter a search term or select a category/filter.', 'info');
    }
    setShowSearchContext(false);
  }, [searchTerm, category, advancedFilters, navigate, showMessage]);

  const handleSortToggle = useCallback(() => {
    setSortBy((prev) => (prev === "date_listed_desc" ? "date_listed_asc" : "date_listed_desc"));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  // Effect to set initial scroll position to the middle set of duplicated items
  useEffect(() => {
    if (featuredCarouselRef.current && featuredListings.length > 0 && !initialScrollSet.current) {
      const carousel = featuredCarouselRef.current;
      const itemElement = carousel.querySelector('.featured-card-item');
      if (itemElement) {
        const itemStyle = window.getComputedStyle(itemElement);
        const itemMarginLeft = parseFloat(itemStyle.marginLeft);
        const itemMarginRight = parseFloat(itemStyle.marginRight);
        const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;

        const numOriginalItems = featuredListings.length;
        const totalOriginalListWidth = numOriginalItems * itemWidthWithMargins;

        // Scroll to the beginning of the second set of items
        carousel.scrollLeft = totalOriginalListWidth;
        initialScrollSet.current = true; // Mark as set
      }
    }
  }, [featuredListings.length]); // Re-run if the number of featured listings changes

  // Function to scroll the featured carousel with continuous loop
  const scrollFeatured = useCallback((direction) => {
    if (featuredCarouselRef.current && featuredListings.length > 0) {
      const carousel = featuredCarouselRef.current;
      const currentScrollLeft = carousel.scrollLeft;

      const itemElement = carousel.querySelector('.featured-card-item');
      if (!itemElement) return;

      const itemStyle = window.getComputedStyle(itemElement);
      const itemMarginLeft = parseFloat(itemStyle.marginLeft);
      const itemMarginRight = parseFloat(itemStyle.marginRight);
      const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;

      const numOriginalItems = featuredListings.length;
      const totalOriginalListWidth = numOriginalItems * itemWidthWithMargins;

      let newScrollTarget = currentScrollLeft;

      if (direction === 'next') {
        newScrollTarget += itemWidthWithMargins;
        // If we've scrolled past the end of the second set (into the third set)
        if (newScrollTarget >= 2 * totalOriginalListWidth) {
          // Instantly snap back to the equivalent position in the second set
          carousel.scrollLeft = currentScrollLeft - totalOriginalListWidth;
          newScrollTarget = carousel.scrollLeft + itemWidthWithMargins; // Adjust target based on new snapped position
        }
      } else { // 'prev'
        newScrollTarget -= itemWidthWithMargins;
        // If we've scrolled before the beginning of the second set (into the first set)
        if (newScrollTarget < totalOriginalListWidth) {
          // Instantly snap forward to the equivalent position in the second set
          carousel.scrollLeft = currentScrollLeft + totalOriginalListWidth;
          newScrollTarget = carousel.scrollLeft - itemWidthWithMargins; // Adjust target based on new snapped position
        }
      }

      carousel.scrollTo({
        left: newScrollTarget,
        behavior: 'smooth',
      });
    }
  }, [featuredListings.length]); // Dependency added: featuredListings.length

  // Effect for auto-swiping featured listings
  useEffect(() => {
    if (autoSwipeIntervalRef.current) {
      clearInterval(autoSwipeIntervalRef.current);
    }

    // Only enable auto-swipe if there are more items than can be displayed at once
    // For continuous scroll, we always want auto-swipe if there's at least one item
    if (featuredListings.length > 0) {
      autoSwipeIntervalRef.current = setInterval(() => {
        scrollFeatured('next');
      }, 3000); // Auto-swipe every 3 seconds for a faster animation
    }

    return () => {
      if (autoSwipeIntervalRef.current) {
        clearInterval(autoSwipeIntervalRef.current);
      }
    };
  }, [featuredListings.length, scrollFeatured]);

  // Touch handlers to stop/restart auto-swipe on manual interaction
  const handleTouchStart = useCallback(() => {
    if (autoSwipeIntervalRef.current) {
      clearInterval(autoSwipeIntervalRef.current);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Restart auto-swipe after a short delay if no further interaction
    // This will be handled by the useEffect for auto-swipe when dependencies change or component mounts
    // For now, simply let the useEffect re-evaluate and set the interval if needed.
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchContext && searchContextRef.current && !searchContextRef.current.contains(event.target)) {
        setShowSearchContext(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchContext, advancedFilters]);


  return (
    <>
      <div className={`pt-0 -mt-6 px-4 md:px-8 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <motion.div
          className="text-center max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {loading ? (
            <div className="flex justify-center mb-2">
              <HeaderSkeleton darkMode={darkMode} widthClass="w-3/4 md:w-1/2" heightClass="h-8" />
            </div>
          ) : (
            <h1
              className={`font-script text-xl md:text-2xl mb-2 ${
                darkMode ? "text-green-400" : "text-green-700"
              }`}
            >
              Find Your Dream Property
            </h1>
          )}

          <div className="w-full max-w-4xl mx-auto">
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

        {/* Featured Listings Section */}
        <motion.div
          className={`-mt-4 mb-0 sm:mb-2 sm:py-2 relative overflow-hidden sm:px-6 sm:rounded-3xl sm:shadow-xl sm:border ${
            darkMode
              ? "sm:bg-gradient-to-br sm:from-gray-800 sm:to-gray-900 sm:border-green-700"
              : "sm:bg-gradient-to-br sm:from-green-50 sm:to-green-100 sm:border-green-200"
          }`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="flex justify-center mb-2">
              <HeaderSkeleton darkMode={darkMode} widthClass="w-2/3 md:w-1/3" heightClass="h-7" />
            </div>
          ) : (
            <h2
              className={`text-1.5xl md:text-2xl font-bold text-center py-0 mb-2 flex items-center justify-center gap-3 ${
                darkMode ? "text-green-400" : "text-green-800"
              }`}
            >
              <Star size={20} className="text-yellow-400 fill-current" />
              Featured Properties
              <Star size={20} className="text-yellow-400 fill-current" />
            </h2>
          )}
          <div className="relative">
            {/* This is the new scrollable container */}
            <style>{`
              /* Hide scrollbar for Chrome, Safari and Opera */
              .no-scrollbar::-webkit-scrollbar {
                  display: none;
              }
              /* Hide scrollbar for IE, Edge and Firefox */
              .no-scrollbar {
                  -ms-overflow-style: none;  /* IE and Edge */
                  scrollbar-width: none;  /* Firefox */
              }
            `}</style>
            <div
              ref={featuredCarouselRef}
              // Apply mobile-specific padding, then reset for larger screens
              className="flex overflow-x-scroll snap-x snap-mandatory pb-4 -mb-4 no-scrollbar pl-[25vw] pr-[25vw] md:pl-0 md:pr-0"
            >
              {loading ? (
                // Render skeletons for featured listings
                [...Array(FEATURED_ITEMS_PER_VIEW.lg)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 snap-center w-[50vw] px-2 md:w-1/2 lg:w-1/4 featured-card-item">
                    <ListingCardSkeleton darkMode={darkMode} />
                  </div>
                ))
              ) : featuredListings.length > 0 ? (
                // Duplicate listings three times to create a continuous loop effect
                [...featuredListings, ...featuredListings, ...featuredListings].map((listing, index) => (
                  <div
                    key={`featured-${listing.property_id}-${index}`} // Unique key for duplicated items
                    // Mobile: w-[50vw] px-2 for partial view and consistent sizing
                    // Desktop (md and lg): w-1/2 and w-1/4 for previous layout
                    className="flex-shrink-0 snap-center w-[50vw] px-2 md:w-1/2 lg:w-1/4 featured-card-item"
                  >
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
                  </div>
                ))
              ) : (
                <div className={`col-span-full text-center py-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  No featured listings found.
                </div>
              )}
            </div>

            {/* Navigation buttons for featured listings are removed */}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center pt-4 pb-0 mb-2">
            <HeaderSkeleton darkMode={darkMode} widthClass="w-2/3 md:w-1/3" heightClass="h-7" />
          </div>
        ) : (
          <h2 className={`text-1.5xl md:text-2xl font-bold text-center pt-4 pb-0 mb-2 ${darkMode ? "text-green-400" : "text-green-800"}`}>
            Available Listings
          </h2>
        )}
        <motion.div
          className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {loading ? (
            // Render skeletons for available listings
            [...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}
              >
                <ListingCardSkeleton darkMode={darkMode} />
              </motion.div>
            ))
          ) : listings.length > 0 ? (
            listings.map((listing) => (
              <motion.div
                key={listing.property_id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}
              >
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
            <motion.div
              className={`col-span-full text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No listings found.
            </motion.div>
          )}
        </motion.div>

        {totalPages > 1 && !loading && (
          <div className="flex justify-center items-center gap-4 mt-10 pb-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 focus:ring-green-400"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-green-600"
              }`}
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 focus:ring-green-400"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-green-600"
              }`}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Home;

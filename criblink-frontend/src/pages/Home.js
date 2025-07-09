import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PurchaseCategoryFilter from "../components/PurchaseCategoryFilter";
import ListingCard from "../components/ListingCard";
import API_BASE_URL from "../config";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, ArrowDownUp, Search, Star, ArrowLeftCircleIcon, ArrowRightCircleIcon } from "lucide-react"; // Added Star and Arrow icons
import { useTheme } from "../layouts/AppShell";
import { useMessage } from "../context/MessageContext";
import axiosInstance from '../api/axiosInstance';

const ITEMS_PER_PAGE = 12; // Items per page for regular listings

function Home() {
  const [listings, setListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]); // New state for featured listings
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("date_listed_desc");
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();

  // State for featured listings pagination and auto-swipe
  const [currentFeaturedPage, setCurrentFeaturedPage] = useState(0);
  const featuredCarouselRef = useRef(null);
  const autoSwipeIntervalRef = useRef(null);
  const [loading, setLoading] = useState(true); // Added loading state

  // Define how many featured listings to display per page (for carousel)
  const FEATURED_ITEMS_PER_PAGE = 3; // Changed from 4 to 5

  // 1. useEffect for user setup + input focus
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

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true); // Set loading to true when fetching starts
    const params = new URLSearchParams();
    if (category) params.append("purchase_category", category);
    if (searchTerm) params.append("search", searchTerm);
    params.append("page", currentPage);
    params.append("limit", ITEMS_PER_PAGE);
    params.append("sortBy", sortBy);

    const url = `${API_BASE_URL}/listings?${params.toString()}`;
    const featuredUrl = `${API_BASE_URL}/listings?status=Featured&limit=12`; // New URL for featured listings

    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      // Fetch all listings
      const response = await axiosInstance.get(url, { headers });
      const allListings = response.data.listings || [];
      setTotalPages(response.data.totalPages || 1);

      // Fetch featured listings separately
      const featuredResponse = await axiosInstance.get(featuredUrl, { headers });
      const fetchedFeaturedListings = featuredResponse.data.listings || [];
      setFeaturedListings(fetchedFeaturedListings);

      setListings(allListings); // Don't exclude featured listings from general listings


    } catch (error) {
      let errorMessage = 'Failed to fetch listings. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
      setListings([]);
      setFeaturedListings([]); // Clear featured listings on error
      setTotalPages(1);
    } finally {
      setLoading(false); // Set loading to false when fetching completes (success or error)
    }
  }, [category, searchTerm, currentPage, sortBy, showMessage]);

  // 2. Fixed useEffect fetch trigger
  useEffect(() => {
    fetchListings();
  }, [fetchListings]); // Depend on fetchListings which is now useCallback

  useEffect(() => {
    setCurrentPage(1);
  }, [category, searchTerm]);

  // 3. Updated useEffect for Auto Swipe
  useEffect(() => {
    clearInterval(autoSwipeIntervalRef.current); // Prevent duplicate intervals

    const totalFeaturedPages = Math.ceil(featuredListings.length / FEATURED_ITEMS_PER_PAGE);
    if (totalFeaturedPages > 1) {
      autoSwipeIntervalRef.current = setInterval(() => {
        setCurrentFeaturedPage((prevPage) => (prevPage + 1) % totalFeaturedPages);
      }, 7000);
    }

    return () => clearInterval(autoSwipeIntervalRef.current);
  }, [featuredListings]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
      navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    } else {
      setSearchTerm("");
      showMessage('Search term cannot be empty.', 'info');
    }
  }, [searchTerm, navigate, showMessage]);

  const handleSortToggle = useCallback(() => {
    setSortBy((prev) => (prev === "date_listed_desc" ? "date_listed_asc" : "date_listed_desc"));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  // Featured listings navigation
  // 7. Optimize with useCallback
  const handlePrevFeatured = useCallback(() => {
    setCurrentFeaturedPage((prevPage) =>
      prevPage === 0 ? Math.ceil(featuredListings.length / FEATURED_ITEMS_PER_PAGE) - 1 : prevPage - 1
    );
    clearInterval(autoSwipeIntervalRef.current);
  }, [featuredListings.length]);

  const handleNextFeatured = useCallback(() => {
    setCurrentFeaturedPage((prevPage) =>
      (prevPage + 1) % Math.ceil(featuredListings.length / FEATURED_ITEMS_PER_PAGE)
    );
    clearInterval(autoSwipeIntervalRef.current);
  }, [featuredListings.length]);

  // Calculate displayed featured listings based on currentFeaturedPage
  const startIndex = currentFeaturedPage * FEATURED_ITEMS_PER_PAGE;
  const displayedFeaturedListings = featuredListings.slice(startIndex, startIndex + FEATURED_ITEMS_PER_PAGE);


  // Handle swipe gestures for featured listings
  const handleTouchStart = useCallback((e) => {
    clearInterval(autoSwipeIntervalRef.current); // Stop auto-swipe on touch start
    if (featuredCarouselRef.current) {
      featuredCarouselRef.current.startX = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!featuredCarouselRef.current || featuredCarouselRef.current.startX === undefined) return;

    const currentX = e.touches[0].clientX;
    const diffX = featuredCarouselRef.current.startX - currentX;

    // Prevent vertical scrolling interference
    if (Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!featuredCarouselRef.current || featuredCarouselRef.current.startX === undefined) return;

    const endX = e.changedTouches[0].clientX;
    const diffX = featuredCarouselRef.current.startX - endX;
    const swipeThreshold = 50; // Minimum pixels for a swipe

    if (diffX > swipeThreshold) {
      handleNextFeatured();
    } else if (diffX < -swipeThreshold) {
      handlePrevFeatured();
    }
    featuredCarouselRef.current.startX = undefined; // Reset startX
  }, [handleNextFeatured, handlePrevFeatured]);


  return (
    <>
      <div className={`pt-0 -mt-6 px-4 md:px-8 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <motion.div
          className="text-center max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className={`font-script text-2xl md:text-3xl mb-4 ${
              darkMode ? "text-green-400" : "text-green-700"
            }`}
          >
            Find Your Dream Property
          </h1>

          <div className="w-full max-w-4xl mx-auto">
            {/* Desktop Filter/Search/Sort Controls */}
            <div className="hidden sm:flex items-center gap-4 mt-4 mb-6">
              <div className="flex-[0.6]">
                <PurchaseCategoryFilter
                  selectedCategory={category}
                  onChange={setCategory}
                  className="w-full"
                  buttonClassName={`h-[42px] focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode ? "focus:ring-green-400" : "focus:ring-green-600"
                  }`}
                  renderInlineLabel
                  variant="home"
                />
              </div>

              <form onSubmit={handleSearch} className="flex-[1.4] relative">
                <input
                  type="text"
                  ref={searchInputRef} // Auto-focused the search input on load
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by keyword, location, or type..."
                  className={`w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                />
                <button
                  type="submit"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    darkMode ? "text-gray-400 hover:text-green-300" : "text-gray-500 hover:text-green-600"
                  }`}
                >
                  <Search size={18} />
                </button>
              </form>

              <button
                onClick={handleSortToggle}
                className={`h-[42px] px-4 flex items-center justify-center gap-2 border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-400 focus:ring-green-400"
                    : "bg-white border-gray-300 text-gray-600 hover:border-green-500 focus:ring-green-600"
                }`}
                title={sortBy === "date_listed_desc" ? "Sort by Oldest First" : "Sort by Newest First"}
              >
                <Clock size={16} />
                <ArrowDownUp size={16} className={sortBy === "date_listed_desc" ? "rotate-180" : ""} />
                <span className="text-sm hidden lg:inline">
                  {sortBy === "date_listed_desc" ? "Newest" : "Oldest"}
                </span>
              </button>
            </div>

            {/* Mobile Filter/Search/Sort Controls */}
            <div className="sm:hidden mt-4 flex items-center gap-2 mb-6">
              <div className="flex-none w-12">
                <PurchaseCategoryFilter
                  selectedCategory={category}
                  onChange={setCategory}
                  className="w-full"
                  buttonClassName={`h-[42px] flex items-center justify-center focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode ? "focus:ring-green-400" : "focus:ring-green-600"
                  }`}
                  variant="home"
                  renderInlineLabel={false}
                  dropdownContentClassName="min-w-[12rem]"
                />
              </div>
              <form onSubmit={handleSearch} className="relative flex-grow">
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search listings..."
                  className={`w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                />
                <button
                  type="submit"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    darkMode ? "text-gray-400 hover:text-green-300" : "text-gray-500 hover:text-green-600"
                  }`}
                >
                  <Search size={16} />
                </button>
              </form>
              <button
                onClick={handleSortToggle}
                className={`flex-none w-12 h-[42px] flex items-center justify-center rounded-xl border shadow-sm transition-all duration-200 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-400 focus:ring-green-400"
                    : "bg-white border-gray-300 text-gray-600 hover:border-green-500 focus:ring-green-600"
                }`}
                title="Sort by Date"
              >
                <Clock size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Featured Listings Section */}
        {featuredListings.length > 0 && (
          <motion.div
            // Removed mb-12 for mobile, added sm:mb-12 to keep it for desktop
            // Removed py-2 for mobile, added sm:py-2 to keep it for desktop
            // Removed px-6, rounded-3xl, shadow-xl, border classes for mobile
            // Added -mt-4 for mobile to shift it up, sm:mt-0 to reset for desktop
            className={`-mt-4 mb-8 sm:mb-12 sm:py-2 relative overflow-hidden sm:px-6 sm:rounded-3xl sm:shadow-xl sm:border ${
              darkMode
                ? "sm:bg-gradient-to-br sm:from-gray-800 sm:to-gray-900 sm:border-green-700"
                : "sm:bg-gradient-to-br sm:from-green-50 sm:to-green-100 sm:border-green-200"
            }`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            ref={featuredCarouselRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <h2
              className={`text-1.5xl md:text-2xl font-bold text-center py-0 mb-2 flex items-center justify-center gap-3 ${
                darkMode ? "text-green-400" : "text-green-800"
              }`}
            >
              <Star size={20} className="text-yellow-400 fill-current" />
              Featured Properties
              <Star size={20} className="text-yellow-400 fill-current" />
            </h2>
            <div className="relative">
              {/* Changed lg:grid-cols-4 to lg:grid-cols-5 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="wait">
                  {displayedFeaturedListings.map((listing) => (
                    <motion.div
                      key={`featured-${listing.property_id}`}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                      // Removed explicit background, border, and shadow classes from this wrapper
                      // ListingCard is now responsible for its own styling
                      className="relative transform"
                    >
                      <ListingCard listing={listing} isFeatured={true} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {/* Updated pagination button disabled logic to use FEATURED_ITEMS_PER_PAGE */}
              {Math.ceil(featuredListings.length / FEATURED_ITEMS_PER_PAGE) > 1 && (
                <div className="flex justify-center mt-6 space-x-4">
                  <button
                    onClick={handlePrevFeatured}
                    disabled={featuredListings.length <= FEATURED_ITEMS_PER_PAGE} // 4. Fix Button Disable Logic
                    aria-label="Previous Featured Properties" // Added aria-label for accessibility
                    className={`p-2 rounded-full shadow-md transition-all duration-200
                      ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                      ${featuredListings.length <= FEATURED_ITEMS_PER_PAGE ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ArrowLeftCircleIcon className="h-8 w-8" />
                  </button>
                  <button
                    onClick={handleNextFeatured}
                    disabled={featuredListings.length <= FEATURED_ITEMS_PER_PAGE} // 4. Fix Button Disable Logic
                    aria-label="Next Featured Properties" // Added aria-label for accessibility
                    className={`p-2 rounded-full shadow-md transition-all duration-200
                      ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                      ${featuredListings.length <= FEATURED_ITEMS_PER_PAGE ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ArrowRightCircleIcon className="h-8 w-8" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* All Listings */}
        <h2 className={`text-1.5xl md:text-2xl font-bold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-800"}`}>
          Available Listings
        </h2>
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
          {loading ? ( // 6. Display Loading or Fallback UI
            [...Array(10)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"></div>
            ))
          ) : listings.length > 0 ? (
            listings.map((listing) => (
              <motion.div
                key={listing.property_id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}
              >
                <ListingCard listing={listing} />
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

        {/* Pagination */}
        {totalPages > 1 && (
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

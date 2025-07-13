import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import API_BASE_URL from "../config";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowDownUp, Search, Star, ArrowLeftCircleIcon, ArrowRightCircleIcon, SlidersHorizontal } from "lucide-react";
import { useTheme } from "../layouts/AppShell";
import { useMessage } from "../context/MessageContext";
import axiosInstance from '../api/axiosInstance';
import HomeSearchFilters from "../components/HomeSearchFilters";

const ITEMS_PER_PAGE = 20;

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

  const [currentFeaturedPage, setCurrentFeaturedPage] = useState(0);
  const featuredCarouselRef = useRef(null);
  const autoSwipeIntervalRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const [showSearchContext, setShowSearchContext] = useState(false);

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

  const FEATURED_ITEMS_PER_PAGE = 4;

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

    const featuredUrl = `${API_BASE_URL}/listings?status=Featured&limit=12`;
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

      setListings(allListings);

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
  }, [category, searchTerm, sortBy, advancedFilters, fetchListings]);

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

  const handlePrevFeatured = useCallback(() => {
    setCurrentFeaturedPage((prevPage) =>
      prevPage === 0 ? Math.ceil(featuredListings.length / FEATURED_ITEMS_PER_PAGE) - 1 : prevPage - 1
    );
    clearInterval(autoSwipeIntervalRef.current);
  }, [featuredListings.length, FEATURED_ITEMS_PER_PAGE]);

  const handleNextFeatured = useCallback(() => {
    setCurrentFeaturedPage((prevPage) =>
      (prevPage + 1) % Math.ceil(featuredListings.length / FEATURED_ITEMS_PER_PAGE)
    );
    clearInterval(autoSwipeIntervalRef.current);
  }, [featuredListings.length, FEATURED_ITEMS_PER_PAGE]);

  const startIndex = currentFeaturedPage * FEATURED_ITEMS_PER_PAGE;
  const displayedFeaturedListings = featuredListings.slice(startIndex, startIndex + FEATURED_ITEMS_PER_PAGE);

  const handleTouchStart = useCallback((e) => {
    clearInterval(autoSwipeIntervalRef.current);
    if (featuredCarouselRef.current) {
      featuredCarouselRef.current.startX = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!featuredCarouselRef.current || featuredCarouselRef.current.startX === undefined) return;
    const currentX = e.touches[0].clientX;
    const diffX = featuredCarouselRef.current.startX - currentX;
    if (Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!featuredCarouselRef.current || featuredCarouselRef.current.startX === undefined) return;
    const endX = e.changedTouches[0].clientX;
    const diffX = featuredCarouselRef.current.startX - endX;
    const swipeThreshold = 50;
    if (diffX > swipeThreshold) {
      handleNextFeatured();
    } else if (diffX < -swipeThreshold) {
      handlePrevFeatured();
    }
    featuredCarouselRef.current.startX = undefined;
  }, [handleNextFeatured, handlePrevFeatured]);

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
          <h1
            className={`font-script text-2xl md:text-3xl mb-4 ${
              darkMode ? "text-green-400" : "text-green-700"
            }`}
          >
            Find Your Dream Property
          </h1>

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

        {featuredListings.length > 0 && (
          <motion.div
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
            <AnimatePresence mode="wait">
  <motion.div
    key={`page-${currentFeaturedPage}`}
    initial={{ opacity: 0, x: 100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -100 }}
    transition={{ duration: 0.6, ease: "easeInOut" }}
    className="grid grid-cols-2 gap-6 lg:grid-cols-4"
  >
    {displayedFeaturedListings.map((listing) => (
      <div key={`featured-${listing.property_id}`} className="relative transform hover:scale-[1.03] transition-transform duration-200">
        <ListingCard listing={listing} />
      </div>
    ))}
  </motion.div>
</AnimatePresence>

              {Math.ceil(featuredListings.length / FEATURED_ITEMS_PER_PAGE) > 1 && (
                <div className="flex justify-center mt-6 space-x-4">
                  <button
                    onClick={handlePrevFeatured}
                    disabled={featuredListings.length <= FEATURED_ITEMS_PER_PAGE}
                    aria-label="Previous Featured Properties"
                    className={`p-2 rounded-full shadow-md transition-all duration-200
                      ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                      ${featuredListings.length <= FEATURED_ITEMS_PER_PAGE ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ArrowLeftCircleIcon className="h-8 w-8" />
                  </button>
                  <button
                    onClick={handleNextFeatured}
                    disabled={featuredListings.length <= FEATURED_ITEMS_PER_PAGE}
                    aria-label="Next Featured Properties"
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
          {loading ? (
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

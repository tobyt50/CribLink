import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import API_BASE_URL from "../config";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
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

function Home() {
  const [listings, setListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("date_listed_desc");
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const featuredCarouselRef = useRef(null);
  const autoSwipeIntervalRef = useRef(null);
  const initialScrollSet = useRef(false);
  const [loading, setLoading] = useState(true);

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

  // FIX: Determine if the carousel functionality should be active.
  const isCarousel = featuredListings.length > 1;

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

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      setFeaturedLoading(true);
      try {
        const response = await axiosInstance.get(`${API_BASE_URL}/listings/featured`);
        setFeaturedListings(response.data.listings || []);
      } catch (error) {
        console.error("Failed to fetch featured listings:", error);
        setFeaturedListings([]);
      } finally {
        setFeaturedLoading(false);
      }
    };
    fetchFeaturedListings();
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (advancedFilters.purchaseCategory) params.append("purchase_category", advancedFilters.purchaseCategory);
    else if (category) params.append("purchase_category", category);
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
    const token = localStorage.getItem("token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    try {
      const response = await axiosInstance.get(url, { headers });
      setListings(response.data.listings || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch listings.';
      showMessage(errorMessage, 'error');
      setListings([]);
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
    if (searchTerm.trim()) queryParams.append("query", searchTerm.trim());
    if (advancedFilters.purchaseCategory || category) queryParams.append("category", advancedFilters.purchaseCategory || category);
    if (advancedFilters.location) queryParams.append("location", advancedFilters.location);
    if (advancedFilters.propertyType) queryParams.append("property_type", advancedFilters.propertyType);
    if (advancedFilters.subtype) queryParams.append("subtype", advancedFilters.subtype);
    if (advancedFilters.bedrooms) queryParams.append("bedrooms", advancedFilters.bedrooms);
    if (advancedFilters.bathrooms) queryParams.append("bathrooms", advancedFilters.bathrooms);
    if (advancedFilters.minPrice) queryParams.append("min_price", advancedFilters.minPrice);
    if (advancedFilters.maxPrice) queryParams.append("max_price", advancedFilters.maxPrice);

    if (queryParams.toString()) {
      navigate(`/search?${queryParams.toString()}`);
    } else {
      showMessage('Please enter a search term or select a category/filter.', 'info');
    }
  }, [searchTerm, category, advancedFilters, navigate, showMessage]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  useEffect(() => {
    if (isCarousel && featuredCarouselRef.current && !initialScrollSet.current) {
      const carousel = featuredCarouselRef.current;
      const itemElement = carousel.querySelector('.featured-card-item');
      if (itemElement) {
        const itemStyle = window.getComputedStyle(itemElement);
        const itemMarginLeft = parseFloat(itemStyle.marginLeft);
        const itemMarginRight = parseFloat(itemStyle.marginRight);
        const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;
        const numOriginalItems = featuredListings.length;
        carousel.scrollLeft = numOriginalItems * itemWidthWithMargins;
        initialScrollSet.current = true;
      }
    }
  }, [featuredListings.length, isCarousel]);

  const scrollFeatured = useCallback((direction) => {
    if (!isCarousel || !featuredCarouselRef.current) return;

    const carousel = featuredCarouselRef.current;
    const itemElement = carousel.querySelector('.featured-card-item');
    if (!itemElement) return;

    const itemStyle = window.getComputedStyle(itemElement);
    const itemMarginLeft = parseFloat(itemStyle.marginLeft);
    const itemMarginRight = parseFloat(itemStyle.marginRight);
    const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;
    const numOriginalItems = featuredListings.length;
    const totalOriginalListWidth = numOriginalItems * itemWidthWithMargins;
    let newScrollTarget = carousel.scrollLeft;

    if (direction === 'next') {
      newScrollTarget += itemWidthWithMargins;
      if (newScrollTarget >= 2 * totalOriginalListWidth) {
        carousel.scrollLeft = carousel.scrollLeft - totalOriginalListWidth;
        newScrollTarget = carousel.scrollLeft + itemWidthWithMargins;
      }
    } else {
      newScrollTarget -= itemWidthWithMargins;
      if (newScrollTarget < totalOriginalListWidth) {
        carousel.scrollLeft = carousel.scrollLeft + totalOriginalListWidth;
        newScrollTarget = carousel.scrollLeft - itemWidthWithMargins;
      }
    }
    carousel.scrollTo({ left: newScrollTarget, behavior: 'smooth' });
  }, [featuredListings.length, isCarousel]);

  useEffect(() => {
    if (autoSwipeIntervalRef.current) clearInterval(autoSwipeIntervalRef.current);
    // FIX: Only start auto-swipe if it is a carousel
    if (isCarousel) {
      autoSwipeIntervalRef.current = setInterval(() => scrollFeatured('next'), 3000);
    }
    return () => {
      if (autoSwipeIntervalRef.current) clearInterval(autoSwipeIntervalRef.current);
    };
  }, [isCarousel, scrollFeatured]);

  const handleTouchStart = useCallback(() => {
    if (autoSwipeIntervalRef.current) clearInterval(autoSwipeIntervalRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isCarousel) {
      autoSwipeIntervalRef.current = setInterval(() => scrollFeatured('next'), 3000);
    }
  }, [isCarousel, scrollFeatured]);

  return (
    <>
      <div className={`pt-0 -mt-6 px-4 md:px-8 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <motion.div
          className="text-center max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={`font-script text-xl md:text-2xl mb-2 ${darkMode ? "text-green-400" : "text-green-700"}`}>
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
            className={`-mt-4 mb-0 sm:mb-2 sm:py-2 relative overflow-hidden sm:px-6 sm:rounded-3xl sm:shadow-xl sm:border ${darkMode ? "sm:bg-gradient-to-br sm:from-gray-800 sm:to-gray-900 sm:border-green-700" : "sm:bg-gradient-to-br sm:from-green-50 sm:to-green-100 sm:border-green-200"}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            onTouchStart={isCarousel ? handleTouchStart : undefined}
            onTouchEnd={isCarousel ? handleTouchEnd : undefined}
          >
            <h2 className={`text-1.5xl md:text-2xl font-bold text-center py-0 mb-2 flex items-center justify-center gap-3 ${darkMode ? "text-green-400" : "text-green-800"}`}>
              <Star size={20} className="text-yellow-400 fill-current" />
              Featured Properties
              <Star size={20} className="text-yellow-400 fill-current" />
            </h2>
            <div className="relative">
              <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
              
              {/* FIX: Add navigation buttons only for carousel view */}
              {isCarousel && (
                <>
                  <button onClick={() => scrollFeatured('prev')} className={`absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full shadow-md transition-colors ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-200'}`} aria-label="Previous featured item">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={() => scrollFeatured('next')} className={`absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full shadow-md transition-colors ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-200'}`} aria-label="Next featured item">
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <div
                ref={featuredCarouselRef}
                className={`flex pb-4 -mb-4 ${isCarousel ? 'overflow-x-scroll snap-x snap-mandatory no-scrollbar pl-[25vw] pr-[25vw] md:pl-0 md:pr-0' : 'justify-center'}`}
              >
                {featuredLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 snap-center w-[50vw] px-2 md:w-1/2 lg:w-1/4 featured-card-item">
                      <ListingCardSkeleton darkMode={darkMode} />
                    </div>
                  ))
                ) : (
                  // FIX: Conditionally duplicate listings for carousel effect
                  (isCarousel ? [...featuredListings, ...featuredListings, ...featuredListings] : featuredListings).map((listing, index) => (
                    <div
                      key={`featured-${listing.property_id}-${index}`}
                      className={`flex-shrink-0 ${isCarousel ? 'snap-center w-[50vw] px-2 md:w-1/2 lg:w-1/4 featured-card-item' : 'w-full max-w-sm px-2'}`}
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
                )}
              </div>
            </div>
          </motion.div>
        )}

        {!loading && (
          <h2 className={`text-1.5xl md:text-2xl font-bold text-center pt-4 pb-0 mb-2 ${darkMode ? "text-green-400" : "text-green-800"}`}>
            Available Listings
          </h2>
        )}
        <motion.div
          className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
        >
          {loading ? (
            [...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.4 }}>
                <ListingCardSkeleton darkMode={darkMode} />
              </motion.div>
            ))
          ) : listings.length > 0 ? (
            listings.map((listing) => (
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
              No listings found.
            </motion.div>
          )}
        </motion.div>

        {totalPages > 1 && !loading && (
          <div className="flex justify-center items-center gap-4 mt-10 pb-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 focus:ring-green-400" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-green-600"}`}
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 focus:ring-green-400" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-green-600"}`}
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

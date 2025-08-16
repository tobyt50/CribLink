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
const MAX_DYNAMIC_CATEGORIES = 4;
// REMOVED: const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY; // This is no longer needed

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

// Carousel row component remains the same
const FeaturedCategoryRow = ({ title, listings, searchLink, userFavourites, onFavoriteToggle, ...otherProps }) => {
    const { darkMode } = useTheme();
    const carouselRef = useRef(null);
    const autoSwipeIntervalRef = useRef(null);
    const initialScrollSet = useRef(false);
    
    const isCarousel = listings.length > 1;

    const scrollCarousel = useCallback((direction) => {
        if (!isCarousel || !carouselRef.current) return;
        const carousel = carouselRef.current;
        const itemElement = carousel.querySelector('.carousel-item');
        if (!itemElement) return;

        const itemStyle = window.getComputedStyle(itemElement);
        const itemMarginLeft = parseFloat(itemStyle.marginLeft);
        const itemMarginRight = parseFloat(itemStyle.marginRight);
        const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;
        const numOriginalItems = listings.length;
        const totalOriginalListWidth = numOriginalItems * itemWidthWithMargins;
        let newScrollTarget = carousel.scrollLeft;

        if (direction === 'next') {
            newScrollTarget += itemWidthWithMargins;
            if (newScrollTarget >= 2 * totalOriginalListWidth) {
                carousel.scrollLeft -= totalOriginalListWidth;
                newScrollTarget = carousel.scrollLeft + itemWidthWithMargins;
            }
        } else {
            newScrollTarget -= itemWidthWithMargins;
            if (newScrollTarget < totalOriginalListWidth) {
                carousel.scrollLeft += totalOriginalListWidth;
                newScrollTarget = carousel.scrollLeft - itemWidthWithMargins;
            }
        }
        carousel.scrollTo({ left: newScrollTarget, behavior: 'smooth' });
    }, [listings.length, isCarousel]);

    useEffect(() => {
        if (isCarousel && carouselRef.current && !initialScrollSet.current) {
            const carousel = carouselRef.current;
            const itemElement = carousel.querySelector('.carousel-item');
            if (itemElement) {
                const itemStyle = window.getComputedStyle(itemElement);
                const itemMarginLeft = parseFloat(itemStyle.marginLeft);
                const itemMarginRight = parseFloat(itemStyle.marginRight);
                const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;
                const numOriginalItems = listings.length;
                carousel.scrollLeft = numOriginalItems * itemWidthWithMargins;
                initialScrollSet.current = true;
            }
        }
    }, [listings.length, isCarousel]);

    useEffect(() => {
        if (autoSwipeIntervalRef.current) clearInterval(autoSwipeIntervalRef.current);
        if (isCarousel) {
            autoSwipeIntervalRef.current = setInterval(() => scrollCarousel('next'), 4000);
        }
        return () => {
            if (autoSwipeIntervalRef.current) clearInterval(autoSwipeIntervalRef.current);
        };
    }, [isCarousel, scrollCarousel]);

    const handleTouchStart = useCallback(() => {
        if (autoSwipeIntervalRef.current) clearInterval(autoSwipeIntervalRef.current);
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (isCarousel) {
            autoSwipeIntervalRef.current = setInterval(() => scrollCarousel('next'), 4000);
        }
    }, [isCarousel, scrollCarousel]);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex justify-between items-center mb-4">
                <Link to={searchLink} className="group">
                    <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"} group-hover:text-green-900 dark:group-hover:text-green-400 transition-colors`}>
                        {title}
                    </h3>
                </Link>
                {isCarousel && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => scrollCarousel('prev')} className={`p-1 rounded-full shadow-md transition-colors ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-200'}`} aria-label="Previous item"><ChevronLeft size={20} /></button>
                        <button onClick={() => scrollCarousel('next')} className={`p-1 rounded-full shadow-md transition-colors ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-200'}`} aria-label="Next item"><ChevronRight size={20} /></button>
                    </div>
                )}
            </div>
            <div 
                ref={carouselRef} 
                className={`flex pb-4 -mb-4 ${isCarousel ? 'overflow-x-scroll snap-x snap-mandatory no-scrollbar pl-[25vw] pr-[25vw] md:pl-0 md:pr-0' : 'justify-center'}`}
                onTouchStart={isCarousel ? handleTouchStart : undefined}
                onTouchEnd={isCarousel ? handleTouchEnd : undefined}
            >
                {(isCarousel ? [...listings, ...listings, ...listings] : listings).map((listing, index) => (
                    <div key={`${listing.property_id}-${index}`} className={`flex-shrink-0 carousel-item ${isCarousel ? 'snap-center w-[50vw] px-2 md:w-1/2 lg:w-1/4' : 'w-full max-w-sm px-2'}`}>
                        <ListingCard listing={listing} isFavorited={userFavourites.includes(listing.property_id)} onFavoriteToggle={onFavoriteToggle} {...otherProps} />
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
    if (loading || authLoading || allFeaturedListings.length === 0) return [];
  
    const categories = [];
    const usedLocations = new Set();
  
    const getGroupsBy = (listings, key) => listings.reduce((acc, l) => {
      if (l[key]) {
        acc[l[key]] = (acc[l[key]] || []).concat(l);
      }
      return acc;
    }, {});
  
    if (userState) {
      const localListings = allFeaturedListings.filter(l => l.state === userState);
      const localGroups = getGroupsBy(localListings, 'location');
      const mostPopulousLocal = Object.values(localGroups).sort((a,b) => b.length - a.length)[0];
  
      if (mostPopulousLocal && mostPopulousLocal.length >= MIN_LISTINGS_FOR_CATEGORY) {
        const location = mostPopulousLocal[0].location;
        const state = mostPopulousLocal[0].state;
        const params = new URLSearchParams({ status: 'featured', location, state });
        categories.push({
          title: `Top Picks in ${location}, ${state} →`,
          listings: mostPopulousLocal,
          searchLink: `/search?${params.toString()}`
        });
        usedLocations.add(location);
      }
    }
  
    if (categories.length < MAX_DYNAMIC_CATEGORIES) {
      const remaining = allFeaturedListings.filter(l => !usedLocations.has(l.location));
      const allGroups = getGroupsBy(remaining, 'location');
      const mostPopulousOverall = Object.values(allGroups).sort((a,b) => b.length - a.length)[0];
  
      if (mostPopulousOverall && mostPopulousOverall.length >= MIN_LISTINGS_FOR_CATEGORY) {
        const location = mostPopulousOverall[0].location;
        const state = mostPopulousOverall[0].state;
        const params = new URLSearchParams({ status: 'featured', location, state });
        categories.push({
          title: `Popular in ${location}, ${state} →`,
          listings: mostPopulousOverall,
          searchLink: `/search?${params.toString()}`
        });
        usedLocations.add(location);
      }
    }
  
    if (categories.length < MAX_DYNAMIC_CATEGORIES) {
      const remaining = allFeaturedListings.filter(l => !usedLocations.has(l.location));
      const types = getGroupsBy(remaining, 'property_type');
      const mostPopularType = Object.entries(types).sort((a,b) => b[1].length - a[1].length)[0];
  
      if (mostPopularType) {
        const [type, listings] = mostPopularType;
        const locationsInType = getGroupsBy(listings, 'location');
        const mostPopulousLocationForType = Object.values(locationsInType).sort((a,b) => b.length - a.length)[0];
        
        if (mostPopulousLocationForType && mostPopulousLocationForType.length >= MIN_LISTINGS_FOR_CATEGORY) {
            const location = mostPopulousLocationForType[0].location;
            const state = mostPopulousLocationForType[0].state;
            const params = new URLSearchParams({ status: 'featured', property_type: type, location });
            categories.push({
                title: `Best ${type} Properties in ${location}, ${state} →`,
                listings: mostPopulousLocationForType,
                searchLink: `/search?${params.toString()}`
            });
            usedLocations.add(location);
        }
      }
    }
  
    if (categories.length < MAX_DYNAMIC_CATEGORIES) {
        const remaining = allFeaturedListings.filter(l => !usedLocations.has(l.location));
        const cats = getGroupsBy(remaining, 'purchase_category');
        const mostPopularCat = Object.entries(cats).sort((a,b) => b[1].length - a[1].length)[0];
    
        if (mostPopularCat) {
            const [cat, listings] = mostPopularCat;
            const locationsInCat = getGroupsBy(listings, 'location');
            const mostPopulousLocationForCat = Object.values(locationsInCat).sort((a,b) => b.length - a.length)[0];

            if (mostPopulousLocationForCat && mostPopulousLocationForCat.length >= MIN_LISTINGS_FOR_CATEGORY) {
                const location = mostPopulousLocationForCat[0].location;
                const state = mostPopulousLocationForCat[0].state;
                const params = new URLSearchParams({ status: 'featured', purchase_category: cat, location });
                categories.push({
                    title: `Best Properties for ${cat} in ${location}, ${state} →`,
                    listings: mostPopulousLocationForCat,
                    searchLink: `/search?${params.toString()}`
                });
                usedLocations.add(location);
            }
        }
    }
    return categories;
  }, [allFeaturedListings, userState, loading, authLoading]);
  
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
            <Star size={25} className="text-yellow-400 fill-current" />
            Featured Properties
            <Star size={25} className="text-yellow-400 fill-current" />
          </h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mb-1`}>
            Explore premium listings with top visibility.
          </p>
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
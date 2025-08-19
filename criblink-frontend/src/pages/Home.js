import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Bed, Hotel, Building2, LandPlot, Home as HomeIcon, Building } from "lucide-react";
import { useTheme } from "../layouts/AppShell";
import { useMessage } from "../context/MessageContext";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import axiosInstance from '../api/axiosInstance';
import HomeSearchFilters from "../components/HomeSearchFilters";
import { useAuth } from "../context/AuthContext";

const ITEMS_PER_PAGE = 20;
const FEATURED_CAROUSEL_LIMIT = 20;
const MIN_LISTINGS_FOR_CATEGORY = 3;

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

// Skeleton component
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

// Carousel row component
const FeaturedCategoryRow = ({ title, listings, searchLink, userFavourites, onFavoriteToggle, icon: Icon, ...otherProps }) => {
  const { darkMode } = useTheme();
  const carouselRef = useRef(null);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const isCarousel = listings.length > 1;

  // Track scroll position to show/hide arrows
  const updateArrows = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setShowLeftArrow(scrollLeft > 5); // small threshold
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
  };

  // Attach scroll listener
  useEffect(() => {
    if (!isCarousel || !carouselRef.current) return;
    const carousel = carouselRef.current;
    updateArrows();
    carousel.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows); // recalc on resize
    return () => {
      carousel.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [isCarousel, listings.length]);

  // Scroll by one card width
  const scrollByCard = (direction) => {
    if (!carouselRef.current) return;
    const itemElement = carouselRef.current.querySelector(".featured-card-item");
    if (!itemElement) return;

    const itemStyle = window.getComputedStyle(itemElement);
    const itemMarginLeft = parseFloat(itemStyle.marginLeft);
    const itemMarginRight = parseFloat(itemStyle.marginRight);
    const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;

    const newScrollLeft = carouselRef.current.scrollLeft + itemWidthWithMargins * direction;
    carouselRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center -mt-6 mb-2">
        <Link to={searchLink} className="group">
          <h3 className={`flex items-center gap-2 text-sm md:text-lg font-bold ${darkMode ? "text-green-400" : "text-green-700"} group-hover:text-green-900 dark:group-hover:text-green-400 transition-colors`}>
            {Icon && <Icon size={18} />}
            {title}
          </h3>
        </Link>
      </div>

      <div className="relative">
        {showLeftArrow && (
          <button
            type="button"
            className="absolute left-2 top-[40%] -translate-y-1/2 z-20 text-white opacity-65 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              scrollByCard(-1);
            }}
          >
            <span className="text-[8rem] leading-none select-none">‹</span>
          </button>
        )}

        <div
          ref={carouselRef}
          className={`flex flex-nowrap pb-4 -mb-4 ${isCarousel ? "overflow-x-scroll no-scrollbar" : "justify-center"}`}
        >
          {listings.map((listing) => (
            <div
              key={listing.property_id}
              className={`featured-card-item flex-shrink-0 ${isCarousel ? "w-[45%] sm:w-[45%] px-2 md:w-1/3 lg:w-1/5" : "w-full max-w-sm px-2"}`}
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

        {showRightArrow && (
          <button
            type="button"
            className="absolute right-2 top-[40%] -translate-y-1/2 z-20 text-white opacity-65 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              scrollByCard(1);
            }}
          >
            <span className="text-[8rem] leading-none select-none">›</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Geocoding helper function
const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axiosInstance.get(`/utils/reverse-geocode`, {
      params: {
        lat: latitude,
        lon: longitude
      }
    });
    return response.data?.components.state || null;
  } catch (error) {
    console.error('Error fetching location from backend geocoder:', error.message);
    return null;
  }
};

function Home() {
  const [listings, setListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
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
  const [categoryListings, setCategoryListings] = useState({});

  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const featuredCarouselRef = useRef(null);
  const autoSwipeIntervalRef = useRef(null);
  const initialScrollSet = useRef(false);

  const isCarousel = featuredListings.length > 1;
  const currentUserRole = user?.role || 'guest';
  const currentUserId = user?.user_id || null;
  const currentUserAgencyId = user?.agency_id || null;

  const getRoleBasePath = useCallback(() => {
    if (currentUserRole === 'admin') return '/admin';
    if (currentUserRole === 'agency_admin') return '/agency';
    if (currentUserRole === 'agent') return '/agent';
    return '';
  }, [currentUserRole]);

  const categoryDefinitions = useMemo(() => ([
    { title: "Self-Contain for Rent Near You",  property_type: "Self-Contain", purchase_category: "Rent" },
    { title: "Self-Contain for Sale Near You",  property_type: "Self-Contain", purchase_category: "Sale" },
    { title: "Short-Lets Near You",             property_type: "Short-Let" },
    { title: "Apartments Near You",             property_type: "Apartment" },
    { title: "Land for Sale Near You",          property_type: "Land", purchase_category: "Sale" },
    { title: "Bungalows for Rent Near You",     property_type: "Bungalow", purchase_category: "Rent" },
    { title: "Bungalows for Sale Near You",     property_type: "Bungalow", purchase_category: "Sale" },
    { title: "Duplexes for Rent Near You",      property_type: "Duplex", purchase_category: "Rent" },
    { title: "Duplexes for Sale Near You",      property_type: "Duplex", purchase_category: "Sale" },
  ]), []);

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

  useEffect(() => {
    const fetchCategoryListings = async () => {
      const normalizedUserState = normalizeState(userState);

      const effectiveUserState = normalizedUserState || (() => {
        const counts = featuredListings.reduce((acc, l) => {
          const st = normalizeState(l.state);
          if (!st) return acc;
          acc[st] = (acc[st] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Lagos";
      })();

      for (const def of categoryDefinitions) {
        let fetchedListings = [];
        const st = effectiveUserState;
        const params = new URLSearchParams({
          limit: 20,
          ...(def.property_type ? { property_type: def.property_type } : {}),
          ...(def.purchase_category ? { purchase_category: def.purchase_category } : {}),
          state: st,
        });

        try {
          const res = await axiosInstance.get(`/listings?${params.toString()}`);
          const filtered = (res.data.listings || []).filter(l => l.status === 'available' || l.status === 'under offer');
          if (filtered.length >= MIN_LISTINGS_FOR_CATEGORY) {
            fetchedListings = filtered;
          }
        } catch (err) {
          console.warn("Error fetching category with state", st, def.title, err.message);
        }

        setCategoryListings(prev => ({
          ...prev,
          [def.title]: fetchedListings,
        }));
      }
    };

    fetchCategoryListings();
  }, [userState, featuredListings, categoryDefinitions]);

  const fetchUserFavourites = useCallback(async () => {
    if (!isAuthenticated) {
      setUserFavourites([]);
      return;
    }
    try {
      const response = await axiosInstance.get(`/favourites/properties`);
      setUserFavourites(response.data.favourites.map(fav => fav.property_id));
    } catch (error) {
      console.error("Failed to fetch user favourites:", error);
      setUserFavourites([]);
    }
  }, [isAuthenticated]);

  const fetchFeaturedListings = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const response = await axiosInstance.get(`/listings/featured?limit=${FEATURED_CAROUSEL_LIMIT}`);
      const listings = response.data.listings || [];
      const filtered = listings.filter(l => l.status === 'available' || l.status === 'under offer');
      setFeaturedListings(filtered);
    } catch (error) {
      console.error("Failed to fetch featured listings:", error);
      setFeaturedListings([]);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  const fetchListings = useCallback(async (page = 1) => {
    setLoading(true);

    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", ITEMS_PER_PAGE);
    params.append("sortBy", sortBy || "date_listed_desc");
    params.append("context", "home");

    // Immediate presets → Home feed
    if (advancedFilters.purchaseCategory) params.append("purchase_category", advancedFilters.purchaseCategory);
    if (advancedFilters.location)         params.append("location", advancedFilters.location);
    if (advancedFilters.propertyType)     params.append("property_type", advancedFilters.propertyType);
    if (advancedFilters.bedrooms)         params.append("bedrooms", advancedFilters.bedrooms);
    if (advancedFilters.bathrooms)        params.append("bathrooms", advancedFilters.bathrooms);

    // Price range: allow 0..N; only send if explicitly set
    if (advancedFilters.minPrice !== "" && advancedFilters.minPrice !== undefined && advancedFilters.minPrice !== null) {
      params.append("min_price", advancedFilters.minPrice);
    }
    if (advancedFilters.maxPrice !== "" && advancedFilters.maxPrice !== undefined && advancedFilters.maxPrice !== null) {
      params.append("max_price", advancedFilters.maxPrice);
    }

    try {
      const response = await axiosInstance.get(`/listings?${params.toString()}`);
      setListings(response.data.listings || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch listings.';
      showMessage(errorMessage, 'error');
      setListings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [showMessage, advancedFilters, sortBy]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
  
    // 🔎 Always let backend handle parsing of state/city from free-text
    if (searchTerm.trim()) {
      queryParams.append("search", searchTerm.trim());
    }
  
    // Advanced filters (only if explicitly selected by user)
    if (advancedFilters.purchaseCategory) {
      queryParams.append("purchase_category", advancedFilters.purchaseCategory);
    }
    if (advancedFilters.propertyType) {
      queryParams.append("property_type", advancedFilters.propertyType);
    }
    if (advancedFilters.bedrooms) {
      queryParams.append("bedrooms", advancedFilters.bedrooms);
    }
    if (advancedFilters.bathrooms) {
      queryParams.append("bathrooms", advancedFilters.bathrooms);
    }
    if (advancedFilters.minPrice) {
      queryParams.append("min_price", advancedFilters.minPrice);
    }
    if (advancedFilters.maxPrice) {
      queryParams.append("max_price", advancedFilters.maxPrice);
    }
  
    // Only send location/state if chosen from advanced filters (not free-text search)
    if (advancedFilters.location) {
      queryParams.append("location", advancedFilters.location);
    }
    if (advancedFilters.state) {
      queryParams.append("state", advancedFilters.state);
    }
  
    if (sortBy) {
      queryParams.append("sortBy", sortBy);
    }
  
    if (queryParams.toString()) {
      navigate(`/search?${queryParams.toString()}`);
    } else {
      showMessage('Please enter a search term or select a filter.', 'info');
    }
  }, [searchTerm, advancedFilters, sortBy, navigate, showMessage]);
  

  const handleFavoriteToggle = useCallback(async (propertyId, isCurrentlyFavorited) => {
    if (!isAuthenticated) {
      showMessage("Please log in to manage your favorites.", "error");
      navigate('/signin');
      return;
    }
    try {
      if (isCurrentlyFavorited) {
        await axiosInstance.delete(`/favourites/properties/${propertyId}`);
        showMessage("Removed from favorites!", "success");
      } else {
        await axiosInstance.post(`/favourites/properties`, { property_id: propertyId });
        showMessage("Added to favorites!", "success");
      }
      fetchUserFavourites();
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update favorites.', 'error');
    }
  }, [isAuthenticated, fetchUserFavourites, showMessage, navigate]);

  const handleDeleteListing = useCallback((listingId) => {
    showConfirm({
        title: "Delete Listing",
        message: "Are you sure you want to delete this listing permanently?",
        onConfirm: async () => {
            try {
                await axiosInstance.delete(`/listings/${listingId}`);
                showMessage('Listing deleted successfully!', 'success');
                fetchListings(currentPage);
                fetchFeaturedListings();
            } catch (error) {
                showMessage('Failed to delete listing. Please try again.', 'error');
            }
        },
    });
  }, [showConfirm, showMessage, fetchListings, fetchFeaturedListings, currentPage]);

  useEffect(() => {
    fetchFeaturedListings();
  }, [fetchFeaturedListings]);

  useEffect(() => {
    if (!authLoading) {
        fetchListings(currentPage);
        fetchUserFavourites();
    }
  }, [currentPage, authLoading, fetchListings, fetchUserFavourites]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [advancedFilters, sortBy]);

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

  const scrollFeatured = useCallback(
    (direction) => {
      if (!isCarousel || !featuredCarouselRef.current) return;
      const carousel = featuredCarouselRef.current;
      const itemElement = carousel.querySelector(".featured-card-item");
      if (!itemElement) return;

      const itemStyle = window.getComputedStyle(itemElement);
      const itemMarginLeft = parseFloat(itemStyle.marginLeft);
      const itemMarginRight = parseFloat(itemStyle.marginRight);
      const itemWidthWithMargins =
        itemElement.offsetWidth + itemMarginLeft + itemMarginRight;
      const numOriginalItems = featuredListings.length;
      const totalOriginalListWidth = numOriginalItems * itemWidthWithMargins;

      const sign = direction === 'next' ? 1 : -1;
      let newScrollTarget =
        carousel.scrollLeft + sign * itemWidthWithMargins;

      // Always animate first
      animateScroll(carousel, newScrollTarget, 800, () => {
        // After animation, silently reset if we’ve drifted too far
        if (carousel.scrollLeft >= 2 * totalOriginalListWidth) {
          carousel.scrollLeft -= totalOriginalListWidth;
        } else if (carousel.scrollLeft < totalOriginalListWidth) {
          carousel.scrollLeft += totalOriginalListWidth;
        }
      });
    },
    [featuredListings.length, isCarousel]
  );

  // Re-align carousel when window resizes (fixes partial cards after switching breakpoints)
  useEffect(() => {
    const handleResize = () => {
      if (!featuredCarouselRef.current) return;
      const carousel = featuredCarouselRef.current;
      const itemElement = carousel.querySelector(".featured-card-item");
      if (!itemElement) return;

      const itemStyle = window.getComputedStyle(itemElement);
      const itemMarginLeft = parseFloat(itemStyle.marginLeft);
      const itemMarginRight = parseFloat(itemStyle.marginRight);
      const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;
      const numOriginalItems = featuredListings.length;

      // Reset to the "middle clone set" after resize
      carousel.scrollLeft = numOriginalItems * itemWidthWithMargins;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [featuredListings.length]);

  useEffect(() => {
    if (autoSwipeIntervalRef.current) clearInterval(autoSwipeIntervalRef.current);
    if (isCarousel) {
      autoSwipeIntervalRef.current = setInterval(() => scrollFeatured('next'), 2500);
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
      autoSwipeIntervalRef.current = setInterval(() => scrollFeatured('next'), 2500);
    }
  }, [isCarousel, scrollFeatured]);

  const hasActiveFilters = Object.values(advancedFilters).some(v => !!v);

  return (
    <>
      <div className={`pt-0 -mt-6 px-4 md:px-8 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <motion.div
          className="text-center max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={`font-script text-xl mb-2 ${darkMode ? "text-green-400" : "text-green-700"}`}>
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
            className={`
              ${darkMode 
                ? "sm:bg-gradient-to-br sm:from-gray-800 sm:to-gray-900 sm:border-green-700" 
                : "sm:bg-gradient-to-br sm:from-green-50 sm:to-green-100 sm:border-green-200"}
              relative overflow-hidden sm:px-6 sm:rounded-3xl sm:shadow-xl sm:border
              -mt-6 mb-2   // 🔥 reduced top (-mt-2) and bottom (mb-2) padding for mobile
              sm:-mt-4 sm:mb-6 sm:py-4   // keep desktop spacing as-is
            `}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            onTouchStart={isCarousel ? handleTouchStart : undefined}
            onTouchEnd={isCarousel ? handleTouchEnd : undefined}
          >
            <h2 className={`text-sm md:text-lg font-bold text-center mb-2 flex items-center justify-center gap-3 ${darkMode ? "text-green-400" : "text-green-700"}`}>
              <Star size={13} className="text-yellow-400 fill-current" />
              Featured properties
              <Star size={13} className="text-yellow-400 fill-current" />
            </h2>

            <div className="relative">
              <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

              <div
                ref={featuredCarouselRef}
                className={`flex pb-4 -mb-4 ${isCarousel ? 'overflow-x-scroll no-scrollbar' : 'justify-center'}`}
              >
                {featuredLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 snap-center w-[45vw] px-2 md:w-1/3 lg:w-1/5 featured-card-item">
                      <ListingCardSkeleton darkMode={darkMode} />
                    </div>
                  ))
                ) : (
                  (isCarousel ? [...featuredListings, ...featuredListings, ...featuredListings] : featuredListings).map((listing, index) => (
                    <div
                      key={`featured-${listing.property_id}-${index}`}
                      className={`flex-shrink-0 ${
                        isCarousel
                          ? 'snap-start w-[45%] px-2 md:w-1/3 lg:w-1/5 featured-card-item -mb-4'
                          : 'w-full max-w-sm px-2'
                      }`}
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
            <div className="text-center text-sm mt-6">
              <Link to="/featured-listings" className={`inline-block pt-0 pb-0 px-6 rounded-full font-semibold transition-transform duration-200 hover:scale-105 bg-transparent ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}>
                  See all featured &rarr;
              </Link>
            </div>
          </motion.div>
        )}

        {!hasActiveFilters && (
          <div className="space-y-8 my-8">
            {categoryDefinitions.map(def => {
              const listings = categoryListings[def.title] || [];
              if (!listings.length) return null;

              const normalizedUserState = normalizeState(userState);

              const effectiveUserState = normalizedUserState || (() => {
                const counts = featuredListings.reduce((acc, l) => {
                  const st = normalizeState(l.state);
                  if (!st) return acc;
                  acc[st] = (acc[st] || 0) + 1;
                  return acc;
                }, {});
                return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Lagos";
              })();

              const params = new URLSearchParams({
                ...(def.property_type ? { property_type: def.property_type } : {}),
                ...(def.purchase_category ? { purchase_category: def.purchase_category } : {}),
                state: effectiveUserState,
              });

              const searchLink = `/search?${params.toString()}`;

              let Icon = null;
              switch (def.property_type) {
                case "Self-Contain":
                  Icon = Bed;
                  break;
                case "Short-Let":
                  Icon = Hotel;
                  break;
                case "Apartment":
                  Icon = Building2;
                  break;
                case "Land":
                  Icon = LandPlot;
                  break;
                case "Bungalow":
                  Icon = HomeIcon;
                  break;
                case "Duplex":
                  Icon = Building;
                  break;
                default:
                  break;
              }

              return (
                <FeaturedCategoryRow
                  key={def.title}
                  title={`${def.title} →`}
                  listings={listings}
                  searchLink={searchLink}
                  userFavourites={userFavourites}
                  onFavoriteToggle={handleFavoriteToggle}
                  userRole={currentUserRole}
                  userId={currentUserId}
                  userAgencyId={currentUserAgencyId}
                  getRoleBasePath={getRoleBasePath}
                  onDeleteListing={handleDeleteListing}
                  icon={Icon}
                />
              );
            })}
          </div>
        )}

<h2 className={`text-sm md:text-lg font-bold text-center pt-0 pb-0 -mt-6 mb-2 ${darkMode ? "text-green-400" : "text-green-700"}`}>
            Explore other listings
          </h2>        
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
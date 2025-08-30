// src/pages/SearchPage.js
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import ListingCard from "../components/ListingCard";
import SearchFilters from "../components/SearchFilters";
import { useAuth } from "../context/AuthContext";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import { useMessage } from "../context/MessageContext";
import { useTheme } from "../layouts/AppShell";

const ITEMS_PER_PAGE = 20;

// Reusing the same skeleton component for consistency
const ListingCardSkeleton = ({ darkMode }) => (
  <div
    className={`rounded-xl shadow-lg p-4 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
  >
    <div
      className={`w-full h-32 rounded-lg ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}
    ></div>
    <div
      className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-2`}
    ></div>
    <div
      className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}
    ></div>
    <div className="flex justify-between items-center">
      <div
        className={`h-8 w-1/3 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
      ></div>
      <div
        className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
      ></div>
    </div>
  </div>
);

function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null);
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [userFavourites, setUserFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  // State for all search and filter parameters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    location: "",
    state: "",
    propertyType: "",
    subtype: "",
    bedrooms: "",
    bathrooms: "",
    livingRooms: "",
    kitchens: "",
    minPrice: "",
    maxPrice: "",
    purchaseCategory: "",
  });
  const [sortBy, setSortBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryTitle, setCategoryTitle] = useState("");
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  const currentUserRole = user?.role || "guest";
  const currentUserId = user?.user_id || null;
  const currentUserAgencyId = user?.agency_id || null;

  const getRoleBasePath = useCallback(() => {
    if (currentUserRole === "admin") return "/admin";
    if (currentUserRole === "agency_admin") return "/agency";
    if (currentUserRole === "agent") return "/agent";
    return "";
  }, [currentUserRole]);

  const fetchUserFavourites = useCallback(async () => {
    if (!isAuthenticated) {
      setUserFavourites([]);
      return;
    }
    try {
      const response = await axiosInstance.get(`/favourites/properties`);
      setUserFavourites(response.data.favourites.map((fav) => fav.property_id));
    } catch (error) {
      console.error("Failed to fetch user favourites:", error);
      setUserFavourites([]);
    }
  }, [isAuthenticated]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(location.search);
    params.set("page", currentPage.toString());
    params.set("limit", ITEMS_PER_PAGE.toString());

    try {
      const response = await axiosInstance.get(
        `/listings?${params.toString()}`,
      );
      setResults(response.data.listings || []);
      setTotalResults(response.data.total || 0);
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to fetch search results.",
        "error",
      );
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [location.search, currentPage, showMessage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("search") || "");
    setFilters({
      location: params.get("location") || "",
      state: params.get("state") || "",
      propertyType: params.get("property_type") || "",
      subtype: params.get("subtype") || "",
      bedrooms: params.get("bedrooms") || "",
      bathrooms: params.get("bathrooms") || "",
      livingRooms: params.get("living_rooms") || "",
      kitchens: params.get("kitchens") || "",
      minPrice: params.get("min_price") || "",
      maxPrice: params.get("max_price") || "",
      purchaseCategory: params.get("purchase_category") || "",
    });

    setSortBy(params.get("sortBy") || "");
    setCurrentPage(parseInt(params.get("page") || "1", 10));
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const propertyType = params.get("property_type");
    const purchaseCategory = params.get("purchase_category");
    const state = params.get("state");
    const sortBy = params.get("sortBy");
  
    const formatString = (str) =>
      str
        ? str
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "";
  
    // Handle "Trending" case first
    if (sortBy === "view_count_desc") {
      const formattedState = state ? `in ${formatString(state)}` : "";
      setCategoryTitle(`Trending Properties ${formattedState}`);
  
    // Handle other specific category cases
    } else if (propertyType && purchaseCategory && state) {
      const formattedType = formatString(propertyType);
      const pluralType = formattedType.endsWith("s")
        ? formattedType
        : `${formattedType}s`;
      const formattedCategory = `for ${formatString(purchaseCategory)}`;
      const formattedState = `in ${formatString(state)}`;
  
      setCategoryTitle(`${pluralType} ${formattedCategory} ${formattedState}`);
    
    // Fallback for general searches
    } else {
      setCategoryTitle("");
    }
  }, [location.search]);

  useEffect(() => {
    if (!authLoading) {
      fetchResults();
      fetchUserFavourites();
    }
  }, [authLoading, fetchResults, fetchUserFavourites]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (filters.purchaseCategory)
      params.set("purchase_category", filters.purchaseCategory);
    if (filters.location) params.set("location", filters.location);
    if (filters.state) params.set("state", filters.state);
    if (filters.propertyType) params.set("property_type", filters.propertyType);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
    if (filters.bathrooms) params.set("bathrooms", filters.bathrooms);
    if (filters.livingRooms) params.set("living_rooms", filters.livingRooms);
    if (filters.kitchens) params.set("kitchens", filters.kitchens);
    if (filters.minPrice) params.set("min_price", filters.minPrice);
    if (filters.maxPrice) params.set("max_price", filters.maxPrice);
    if (sortBy) params.set("sortBy", sortBy);

    navigate(`/search?${params.toString()}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const params = new URLSearchParams(location.search);
      params.set("page", newPage.toString());
      navigate(`${location.pathname}?${params.toString()}`);
    }
  };

  const handleFavouriteToggle = useCallback(
    async (propertyId, isCurrentlyFavourited) => {
      if (!isAuthenticated) {
        showMessage("Please log in to manage your favourites.", "error");
        navigate("/signin");
        return;
      }
      try {
        if (isCurrentlyFavourited) {
          await axiosInstance.delete(`/favourites/properties/${propertyId}`);
          showMessage("Removed from favourites!", "success");
        } else {
          await axiosInstance.post(`/favourites/properties`, {
            property_id: propertyId,
          });
          showMessage("Added to favourites!", "success");
        }
        fetchUserFavourites();
      } catch (error) {
        showMessage(
          error.response?.data?.message || "Failed to update favourites.",
          "error",
        );
      }
    },
    [isAuthenticated, fetchUserFavourites, showMessage, navigate],
  );

  const handleDeleteListing = useCallback(
    (listingId) => {
      showConfirm({
        title: "Delete Listing",
        message: "Are you sure you want to delete this listing permanently?",
        onConfirm: async () => {
          try {
            await axiosInstance.delete(`/listings/${listingId}`);
            showMessage("Listing deleted successfully!", "success");
            fetchResults();
          } catch (error) {
            showMessage("Failed to delete listing. Please try again.", "error");
          }
        },
      });
    },
    [showConfirm, showMessage, fetchResults],
  );

  return (
    <div
      className={`pt-0 -mt-6 pb-10 px-4 md:px-10 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <motion.div
        className="relative w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-3 mt-2 mb-4 flex items-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <form onSubmit={handleSearchSubmit} className="relative flex-grow">
          <input
            type="text"
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, location, state..."
            className={`w-full py-2.5 pl-3 pr-14 rounded-2xl shadow-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
              darkMode
                ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
                : "bg-white text-gray-900 placeholder-gray-500 focus:ring-green-600"
            }`}
          />
          <button
            type="submit"
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-2xl shadow-md transition-all duration-200 ${darkMode ? "bg-green-700 text-white hover:bg-green-600" : "bg-green-500 text-white hover:bg-green-600"}`}
            title="Search"
          >
            <Search size={20} />
          </button>
        </form>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl text-white shadow-md h-10 w-10 flex items-center justify-center flex-shrink-0 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-green-700 hover:bg-green-600 focus:ring-green-400" : "bg-green-500 hover:bg-green-600 focus:ring-green-600"}`}
          title="Open Filters"
        >
          <SlidersHorizontal size={20} />
        </button>
      </motion.div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="mb-4 max-w-4xl mx-auto"
          >
            <SearchFilters
              filters={filters}
              setFilters={setFilters}
              onSearch={handleSearchSubmit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {totalResults > 0 &&
        !loading &&
        (categoryTitle ? (
          <motion.div
            className={`text-center mb-4 text-lg font-semibold flex items-center justify-center gap-2 ${darkMode ? "text-green-500" : "text-green-600"}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span>
        {categoryTitle}
        {/* Only show count if the title does NOT start with "Trending" */}
        {!categoryTitle.startsWith("Trending") && (
          <>
            : <strong className="font-bold">{totalResults} found</strong>
          </>
        )}
      </span>
          </motion.div>
        ) : (
          <motion.div
            className={`text-center mb-4 text-lg font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Found {totalResults} matching properties
          </motion.div>
        ))}

      <motion.div
        className="grid gap-2 md:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
      >
        {loading ? (
          [...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <ListingCardSkeleton darkMode={darkMode} />
            </motion.div>
          ))
        ) : results.length > 0 ? (
          results.map((listing) => (
            <motion.div
              key={listing.property_id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <ListingCard
                listing={listing}
                isFavourited={userFavourites.includes(listing.property_id)}
                onFavouriteToggle={handleFavouriteToggle}
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
            No matching properties found. Try adjusting your search or filters.
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
          <span
            className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
          >
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
  );
}

export default SearchPage;
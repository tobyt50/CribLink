// src/pages/SearchPage.js
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ListingCard from "../components/ListingCard";
import SearchFilters from "../components/SearchFilters";
import API_BASE_URL from "../config";
import { SlidersHorizontal, Search } from "lucide-react"; // Import Search icon
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook
import axiosInstance from '../api/axiosInstance'; // Use your configured axios instance
import { useMessage } from '../context/MessageContext'; // Import useMessage hook

function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null); // Ref for the search input
  const { darkMode } = useTheme(); // Use the dark mode context
  const { showMessage } = useMessage(); // Initialize useMessage

  const [filters, setFilters] = useState({
    location: "",
    propertyType: "",
    subtype: "",
    bedrooms: "",
    bathrooms: "",
    minPrice: "",
    maxPrice: "",
    purchaseCategory: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // 20 items per page

  useEffect(() => {
    const queryParam = new URLSearchParams(location.search).get("query") || "";
    setSearchTerm(queryParam);
    if (queryParam.trim()) {
      fetchResults(queryParam);
    } else {
      setResults([]);
      setFilteredResults([]);
    }
  }, [location.search]);

  useEffect(() => {
    // Reset to first page whenever filters or results change
    setCurrentPage(1);
  }, [filters, results]);

  const fetchResults = async (term) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/listings?search=${encodeURIComponent(term)}`);
      const data = response.data; // Axios automatically parses JSON
      setResults(data.listings);

      const lowerTerm = term.toLowerCase();
      const initialFiltered = data.listings.filter(listing =>
        listing.title?.toLowerCase().includes(lowerTerm) ||
        listing.location?.toLowerCase().includes(lowerTerm) ||
        listing.state?.toLowerCase().includes(lowerTerm) ||
        listing.property_type?.toLowerCase().includes(lowerTerm)
      );

      setFilteredResults(initialFiltered);
    } catch (error) {
      console.error("Search results fetch error:", error);
      let errorMessage = 'Failed to fetch search results. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error'); // Display error message
      setResults([]);
      setFilteredResults([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    if (filters.location.trim()) {
      const match = filters.location.toLowerCase();
      filtered = filtered.filter(
        l => l.location.toLowerCase().includes(match) || l.state.toLowerCase().includes(match)
      );
    }

    if (filters.propertyType) {
      filtered = filtered.filter(l => l.property_type === filters.propertyType);
    }

    if (filters.subtype) {
      filtered = filtered.filter(l => l.subtype === filters.subtype);
    }

    if (filters.bedrooms) {
      filtered = filtered.filter(l => l.bedrooms == filters.bedrooms);
    }

    if (filters.bathrooms) {
      filtered = filtered.filter(l => l.bathrooms == filters.bathrooms);
    }

    if (filters.purchaseCategory) {
      filtered = filtered.filter(
        l => String(l.purchase_category).toLowerCase() === filters.purchaseCategory.toLowerCase()
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter(l => Number(l.price) >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(l => Number(l.price) <= Number(l.maxPrice));
    }

    setFilteredResults(filtered);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
      navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    } else {
      showMessage('Please enter a search term.', 'info'); // Display info message
      setSearchTerm("");
      setResults([]);
      setFilteredResults([]);
      navigate("/search");
    }
  };

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredResults.slice(indexOfFirstItem, indexOfLastItem);

  // Calculate total pages
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} px-4 md:px-10 py-2 min-h-screen`}>
      {/* Search Bar + Filter Toggle */}
      <motion.div
        className="max-w-2xl mx-auto mb-2 flex items-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Search bar styled like Home.js */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow">
          <input
            type="text"
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // Removed placeholder text
            className={`w-full py-2.5 px-3 rounded-2xl shadow-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
            darkMode
              ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
              : "bg-white text-gray-900 placeholder-gray-500 focus:ring-green-600"
          }`}
          />
          <button
            type="submit"
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-2xl shadow-md transition-all duration-200 ${
              darkMode ? "bg-green-700 text-white hover:bg-green-600" : "bg-green-500 text-white hover:bg-green-600"
            }`}
            title="Search"
          >
            <Search size={20} />
          </button>
        </form>

        {/* Filter button from Listings.js */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl text-white shadow-md h-10 w-10 flex items-center justify-center flex-shrink-0 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${
            darkMode ? "bg-green-700 hover:bg-green-600 focus:ring-green-400" : "bg-green-500 hover:bg-green-600 focus:ring-green-600"
          }`}
          title="Open Filters"
        >
          <SlidersHorizontal size={20} />
        </button>
      </motion.div>

      {/* Filters Section */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="mb-8 max-w-4xl mx-auto"
          >
            <SearchFilters filters={filters} setFilters={setFilters} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count Display */}
      {searchTerm && (filteredResults.length > 0 || currentPage > 1) && (
        <motion.div
          className={`text-center mb-2 text-green-700 text-2xl font-bold`} /* Reduced py-0.5 to py-0 and mb-6 to mb-4 */
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {filteredResults.length} results for "{searchTerm}"
        </motion.div>
      )}

      {/* Listings */}
      <motion.div
        className="grid gap-6 grid-cols-2 lg:grid-cols-5" // 2 columns on mobile, 5 on desktop
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
      >
        {currentItems.length > 0 ? (
          currentItems.map((listing) => (
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
            className={`col-span-full text-center py-10 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No matching properties found.
          </motion.div>
        )}
      </motion.div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-xl shadow-md ${
              darkMode
                ? "bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                : "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            }`}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`px-4 py-2 rounded-xl shadow-md ${
                currentPage === page
                  ? darkMode
                    ? "bg-green-700 text-white"
                    : "bg-green-600 text-white"
                  : darkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-xl shadow-md ${
              darkMode
                ? "bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                : "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchPage;

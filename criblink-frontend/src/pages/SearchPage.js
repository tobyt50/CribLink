// src/pages/SearchPage.js
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ListingCard from "../components/ListingCard";
import SearchFilters from "../components/SearchFilters";
import API_BASE_URL from "../config";
import { SlidersHorizontal, Search } from "lucide-react"; // Import Search icon
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook

function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null); // Ref for the search input
  const { darkMode } = useTheme(); // Use the dark mode context

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

  const fetchResults = async (term) => {
    try {
      const response = await fetch(`${API_BASE_URL}/listings?search=${encodeURIComponent(term)}`);
      const data = await response.json();
      setResults(data.listings);

      const lowerTerm = term.toLowerCase();
      const initialFiltered = data.listings.filter(listing =>
        listing.title?.toLowerCase().includes(lowerTerm) ||
        listing.location?.toLowerCase().includes(lowerTerm) ||
        listing.state?.toLowerCase().includes(lowerTerm) ||
        listing.property_type?.toLowerCase().includes(lowerTerm)
      );

      setFilteredResults(initialFiltered);
    } catch (err) {
      console.error("Search fetch error:", err);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, results]);

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
      // If search term is empty, clear results and navigate to search page without query
      setSearchTerm("");
      setResults([]);
      setFilteredResults([]);
      navigate("/search");
    }
  };

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} px-4 md:px-10 py-2 min-h-screen`}>
      {/* Search Bar + Filter Toggle */}
      <motion.div
        className="max-w-2xl mx-auto mb-6 flex items-center gap-4" // Changed max-w-4xl to max-w-2xl
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Search bar from Home.js */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow">
          <input
            type="text"
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keyword, location, or type..."
            className={`w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${
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

        {/* Filter button from Listings.js */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl text-white shadow-md h-10 w-10 flex items-center justify-center flex-shrink-0 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${
            darkMode ? "bg-green-700 hover:bg-green-600 focus:ring-green-400" : "bg-green-500 hover:bg-green-600 focus:ring-green-600"
          }`} // Added flex-shrink-0 to prevent resizing
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
            // Removed overflow-hidden to allow dropdown content to render fully
            className="mb-8 max-w-4xl mx-auto"
          >
            <SearchFilters filters={filters} setFilters={setFilters} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listings */}
      <motion.div
        className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
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
        {filteredResults.length > 0 ? (
          filteredResults.map((listing) => (
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
    </div>
  );
}

export default SearchPage;

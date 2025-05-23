// src/pages/SearchPage.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ListingCard from "../components/ListingCard";
import SearchFilters from "../components/SearchFilters";
import API_BASE_URL from "../config";
import { SlidersHorizontal } from "lucide-react";

function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

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
      setResults(data);

      const lowerTerm = term.toLowerCase();
      const initialFiltered = data.filter(listing =>
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
      filtered = filtered.filter(l => Number(l.price) <= Number(filters.maxPrice));
    }

    setFilteredResults(filtered);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
      navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="bg-gray-50 px-4 md:px-10 py-2">
      {/* Search Bar + Filter Toggle */}
      <motion.div
        className="max-w-4xl mx-auto mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-full shadow-sm border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-sm transition-all w-full sm:w-auto"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-5 py-2 bg-white border border-green-600 text-green-700 rounded-full hover:bg-green-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">{showFilters ? "Hide Filters" : "Filters"}</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* Filters Section */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 max-w-4xl mx-auto"
        >
          <SearchFilters filters={filters} setFilters={setFilters} />
        </motion.div>
      )}

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
            className="col-span-full text-center text-gray-500 py-10"
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

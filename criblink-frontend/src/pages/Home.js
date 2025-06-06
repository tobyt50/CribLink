<<<<<<< HEAD
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PurchaseCategoryFilter from "../components/PurchaseCategoryFilter";
import ListingCard from "../components/ListingCard";
import API_BASE_URL from "../config";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, ArrowDownUp, Search } from "lucide-react";
import { useTheme } from "../layouts/AppShell"; // Import useTheme hook
=======
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PurchaseCategoryFilter from "../components/PurchaseCategoryFilter";
import ListingCard from "../components/ListingCard";
import SearchBar from "../components/SearchBar";
import API_BASE_URL from "../config";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

const ITEMS_PER_PAGE = 12;

function Home() {
  const [listings, setListings] = useState([]);
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
<<<<<<< HEAD
  const [user, setUser] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("date_listed_desc");
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context

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

  useEffect(() => {
    fetchListings();
  }, [category, searchTerm, user, currentPage, sortBy]);

=======
  const navigate = useNavigate();

  // Effect to fetch listings whenever category or search term changes
  useEffect(() => {
    fetchListings();
  }, [category, searchTerm]);

  // Effect to reset current page to 1 whenever category or search term changes
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  useEffect(() => {
    setCurrentPage(1);
  }, [category, searchTerm]);

<<<<<<< HEAD
  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.append("purchase_category", category);
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", currentPage);
      params.append("limit", ITEMS_PER_PAGE);
      params.append("sortBy", sortBy);

      const url = `${API_BASE_URL}/listings?${params.toString()}`;

      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.message || "Server error"}`);
      }

      const responseData = await response.json();
      setListings(responseData.listings || []);
      setTotalPages(responseData.totalPages || 1);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
      setTotalPages(1);
    }
  };

=======
  // Function to fetch listings from the API
  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      // Append category to params if it exists
      if (category) params.append("purchase_category", category);
      // Append search term to params if it exists
      if (searchTerm) params.append("search", searchTerm);

      // Construct the URL with parameters
      const url = `${API_BASE_URL}/listings?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      setListings(data); // Update listings state with fetched data
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]); // Set listings to empty array on error
    }
  };

  // Handler for search submission
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
<<<<<<< HEAD
      navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    } else {
      setSearchTerm("");
    }
  };

  const handleSortToggle = () => {
    setSortBy((prev) => (prev === "date_listed_desc" ? "date_listed_asc" : "date_listed_desc"));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
=======
      // Navigate to search results page if search term is not empty
      navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    } else {
      setSearchTerm(""); // Clear search term if it's empty
    }
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(listings.length / ITEMS_PER_PAGE);
  // Get listings for the current page
  const paginatedListings = listings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handler for page change in pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage); // Update current page
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
    }
  };

  return (
<<<<<<< HEAD
    <>
      <div className={`pt-0 -mt-6 px-4 md:px-8 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <motion.div
          className="text-center max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={`text-3xl md:text-3xl font-extrabold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
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
                  buttonClassName="h-[42px]"
                  renderInlineLabel
                  variant="home"
                />
              </div>

              <form onSubmit={handleSearch} className="flex-[1.4] relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by keyword, location, or type..."
                  className={`w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-gray-300 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
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
                className={`h-[42px] px-4 flex items-center justify-center gap-2 border rounded-xl shadow-sm transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-gray-300 hover:border-green-400"
                    : "bg-white border-gray-300 text-gray-600 hover:border-green-500"
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
            <div className="sm:hidden mt-4 flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-1/4">
                  <PurchaseCategoryFilter
                    selectedCategory={category}
                    onChange={setCategory}
                    className="w-full"
                    buttonClassName="h-[42px]"
                    variant="home"
                  />
                </div>
                <form onSubmit={handleSearch} className="relative flex-grow">
                  <input
                    type="text"
                    ref={searchInputRef}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by keyword, location, or type..."
                    className={`w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-gray-300 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
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
                  className={`p-2 rounded-xl border shadow-sm ml-1 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-800 border-gray-600 text-gray-300 hover:border-green-400"
                      : "bg-white border-gray-300 text-gray-600 hover:border-green-500"
                  }`}
                  title="Sort by Date"
                >
                  <Clock size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Listings */}
        <motion.div
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
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
          {listings.length > 0 ? (
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
          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
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
              className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
=======
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      {/* Hero + Search */}
      <motion.div
        className="text-center max-w-4xl mx-auto mb-6" // Changed mb-10 to mb-6
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl md:text-3xl font-extrabold text-green-700 mb-4">
          Find Your Dream Property
        </h1>
        {/* Flex container for Category Filter and Search Bar */}
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          {/* Category Filter - ensure it doesn't shrink and takes full width on small screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-full sm:w-auto sm:flex-shrink-0 mt-2"
          >
            <PurchaseCategoryFilter
              selectedCategory={category}
              onChange={setCategory}
              renderInlineLabel
            />
          </motion.div>
          {/* Search Bar - allow it to grow and take remaining space */}
          <div className="w-full sm:flex-grow">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearch={handleSearch}
            />
          </div>
        </div>
      </motion.div>

      {/* Listings */}
      <motion.div
        className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
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
        {paginatedListings.length > 0 ? (
          paginatedListings.map((listing) => (
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
            className="col-span-full text-center text-gray-600 py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No listings found.
          </motion.div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-full shadow-sm hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <span className="text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-full shadow-sm hover:bg-gray-100 disabled:opacity-40"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  );
}

export default Home;

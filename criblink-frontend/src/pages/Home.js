import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PurchaseCategoryFilter from "../components/PurchaseCategoryFilter";
import ListingCard from "../components/ListingCard";
import API_BASE_URL from "../config";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, ArrowDownUp, Search } from "lucide-react";
import { useTheme } from "../layouts/AppShell"; // Import useTheme hook

const ITEMS_PER_PAGE = 12;

function Home() {
  const [listings, setListings] = useState([]);
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [category, searchTerm]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
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
    }
  };

  return (
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by keyword, location, or type..."
                  className={`w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${ // Added transition-all duration-200
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
            <div className="sm:hidden mt-4 flex items-center gap-2 mb-6"> {/* Changed to flex items-center and reduced gap for better alignment */}
              <div className="flex-none w-12"> {/* flex-shrink-0 removed, fixed width w-12 */}
                <PurchaseCategoryFilter
                  selectedCategory={category}
                  onChange={setCategory}
                  className="w-full"
                  buttonClassName={`h-[42px] flex items-center justify-center focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode ? "focus:ring-green-400" : "focus:ring-green-600"
                  }`} // Ensure button height matches search bar and center icon
                  variant="home"
                  renderInlineLabel={false} // Removed text label for mobile
                  dropdownContentClassName="min-w-[12rem]" // Added to make the dropdown menu wider
                />
              </div>
              <form onSubmit={handleSearch} className="relative flex-grow">
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by keyword, location, or type..."
                  className={`w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${ // Added transition-all duration-200
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
                // Changed p-2 to h-[42px] and added flex classes for consistent height and alignment
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

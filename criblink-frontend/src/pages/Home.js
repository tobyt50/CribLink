import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PurchaseCategoryFilter from "../components/PurchaseCategoryFilter";
import ListingCard from "../components/ListingCard";
import SearchBar from "../components/SearchBar";
import API_BASE_URL from "../config";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 12;

function Home() {
  const [listings, setListings] = useState([]);
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Effect to fetch listings whenever category or search term changes
  useEffect(() => {
    fetchListings();
  }, [category, searchTerm]);

  // Effect to reset current page to 1 whenever category or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [category, searchTerm]);

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
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
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
    }
  };

  return (
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
  );
}

export default Home;

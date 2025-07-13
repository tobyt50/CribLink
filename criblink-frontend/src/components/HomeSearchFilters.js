import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../layouts/AppShell";
import { ArrowDown, ArrowUp, SlidersHorizontal, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PROPERTY_TYPES = ["Duplex", "Bungalow", "Apartment", "Penthouse", "Detached House", "Semi-Detached House", "Condo", "Land", "Commercial", "Other"];
const BED_BATH_COUNTS = ["1", "2", "3", "4", "5+"];
const PURCHASE_CATEGORIES = ["Rent", "Sale", "Lease", "Shortlet", "Longlet"];

function HomeSearchFilters({ filters, setFilters, sortBy, setSortBy, searchTerm, setSearchTerm, handleSearch }) {
  const { darkMode } = useTheme();

  const [minPriceValue, setMinPriceValue] = useState(filters.minPrice || 0);
  const [maxPriceValue, setMaxPriceValue] = useState(filters.maxPrice || 1000000000);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // Controls visibility of the main filter dropdown
  const [showMoreAdvancedFilters, setShowMoreAdvancedFilters] = useState(false); // Controls visibility of deeper advanced filters
  const [hasEditedFilters, setHasEditedFilters] = useState(false); // New state to track if filters have been edited
  const [placeholderText, setPlaceholderText] = useState("Search listings..."); // New state for dynamic placeholder text
  const searchFilterRef = useRef(null); // Ref for the entire HomeSearchFilters component

  // Sync local slider state with external filters prop and manage filter visibility
  useEffect(() => {
    setMinPriceValue(filters.minPrice === "" ? 0 : Number(filters.minPrice));
    setMaxPriceValue(filters.maxPrice === "" ? 1000000000 : Number(filters.maxPrice));

    const hasActiveDeepAdvancedFilter =
      (filters.propertyType !== "" && filters.propertyType !== undefined) ||
      (filters.bedrooms !== "" && filters.bedrooms !== undefined) ||
      (filters.bathrooms !== "" && filters.bathrooms !== undefined) ||
      (filters.minPrice !== 0 && filters.minPrice !== "" && filters.minPrice !== undefined) ||
      (filters.maxPrice !== 1000000000 && filters.maxPrice !== "" && filters.maxPrice !== undefined);

    // If any deep advanced filter is active, ensure both main and deep sections are open
    if (hasActiveDeepAdvancedFilter) {
      setShowAdvancedFilters(true);
      setShowMoreAdvancedFilters(true);
    } else if (filters.purchaseCategory !== "" && filters.purchaseCategory !== undefined) {
      // If only purchase category is active, show only the initial filters (sort and category)
      setShowAdvancedFilters(true);
      setShowMoreAdvancedFilters(false); // Ensure deep filters are hidden if only category is active
    } else {
      // If no filters are active, hide everything
      // This part ensures that if no filters are active, the dropdown is closed
      // However, we need to manage `showMoreAdvancedFilters` based on `hasEditedFilters`
      // when the dropdown is *opened* by clicking the search bar.
      setShowAdvancedFilters(false);
      setShowMoreAdvancedFilters(false);
    }
  }, [
    filters.minPrice,
    filters.maxPrice,
    filters.propertyType,
    filters.bedrooms,
    filters.bathrooms,
    filters.purchaseCategory
  ]);

  // Effect to manage showMoreAdvancedFilters based on hasEditedFilters when the main dropdown opens
  useEffect(() => {
    if (showAdvancedFilters) {
      // If the main dropdown is opened, and filters were edited, show more advanced filters
      if (hasEditedFilters) {
        setShowMoreAdvancedFilters(true);
      } else {
        // If no edits, and no active deep filters, hide the more advanced section
        const hasActiveDeepAdvancedFilter =
          (filters.propertyType !== "" && filters.propertyType !== undefined) ||
          (filters.bedrooms !== "" && filters.bedrooms !== undefined) ||
          (filters.bathrooms !== "" && filters.bathrooms !== undefined) ||
          (filters.minPrice !== 0 && filters.minPrice !== "" && filters.minPrice !== undefined) ||
          (filters.maxPrice !== 1000000000 && filters.maxPrice !== "" && filters.maxPrice !== undefined);

        if (!hasActiveDeepAdvancedFilter) {
          setShowMoreAdvancedFilters(false);
        }
      }
    } else {
      // When the main dropdown closes, reset hasEditedFilters
      setHasEditedFilters(false);
    }
  }, [showAdvancedFilters, hasEditedFilters, filters]);

  // Effect to handle responsive placeholder text
  useEffect(() => {
    const handleResize = () => {
      // Tailwind's 'md' breakpoint is typically 768px
      if (window.innerWidth >= 768) {
        setPlaceholderText("Search by keyword, location, or type...");
      } else {
        setPlaceholderText("Search listings...");
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial value on component mount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: prevFilters[filterName] === value ? "" : value,
    }));
    setHasEditedFilters(true); // Mark as edited
  }, [setFilters]);

  const handlePriceChange = useCallback((e, type) => {
    const value = Number(e.target.value);
    if (type === "min") {
      setMinPriceValue(value);
      setFilters((prevFilters) => ({
        ...prevFilters,
        minPrice: value,
      }));
    } else {
      setMaxPriceValue(value);
      setFilters((prevFilters) => ({
        ...prevFilters,
        maxPrice: value,
      }));
    }
    setHasEditedFilters(true); // Mark as edited
  }, [setFilters]);

  const handleSortToggle = useCallback((type) => {
    setSortBy(prevSortBy => {
      let newSortBy = prevSortBy;
      if (type === 'date') {
        if (prevSortBy === 'date_listed_desc') {
          newSortBy = 'date_listed_asc';
        } else {
          newSortBy = 'date_listed_desc';
        }
      } else if (type === 'price') {
        if (prevSortBy === 'price_desc') {
          newSortBy = 'price_asc';
        } else {
          newSortBy = 'price_desc';
        }
      }
      setHasEditedFilters(true); // Mark as edited
      return newSortBy;
    });
  }, [setSortBy]);

  const getButtonClass = useCallback((isActive) => {
    return `px-3 py-1.5 rounded-2xl border text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1 ${
      isActive
        ? darkMode
          ? "bg-green-500 text-white border-green-500 shadow-sm" // Changed shadow-lg to shadow-sm
          : "bg-green-600 text-white border-green-600 shadow-sm" // Changed shadow-lg to shadow-sm
        : darkMode
          ? "text-gray-300 border-gray-600 hover:bg-gray-700 shadow-sm" // Changed shadow-md to shadow-sm
          : "text-gray-700 border-gray-300 hover:bg-gray-100 shadow-sm" // Changed shadow-md to shadow-sm
    }`;
  }, [darkMode]);

  const getSortTextAndIcon = useCallback((sortType) => {
    if (sortType === 'date') {
      if (sortBy === 'date_listed_desc') {
        return <>Latest<ArrowDown size={14} /></>;
      } else {
        return <>Oldest<ArrowUp size={14} /></>;
      }
    } else if (sortType === 'price') {
      if (sortBy === 'price_desc') {
        return <>Highest Price<ArrowDown size={14} /></>;
      } else {
        return <>Lowest Price<ArrowUp size={14} /></>;
      }
    }
    return null;
  }, [sortBy]);

  // Handle clicks outside the entire filter component to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchFilterRef.current && !searchFilterRef.current.contains(event.target)) {
        setShowAdvancedFilters(false);
        // showMoreAdvancedFilters will be handled by the new useEffect when showAdvancedFilters becomes false
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={searchFilterRef} className="relative w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-3"> {/* Adjusted max-width for responsiveness and added px-3 */}
      {/* Search Bar - Always persistent */}
      <form onSubmit={handleSearch} className="relative w-full mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholderText} // Using dynamic placeholder text
          className={`w-full py-2.5 px-3 rounded-2xl shadow-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
            darkMode
              ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
              : "bg-white text-gray-900 placeholder-gray-500 focus:ring-green-600"
          }`}
          onClick={() => setShowAdvancedFilters(true)}
        />
        <button
          type="submit"
          className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl p-2 shadow-lg
            ${darkMode ? "bg-green-600 text-white hover:bg-green-700" : "bg-green-600 text-white hover:bg-green-700"}
          `}
        >
          <Search size={18} />
        </button>
      </form>

      {/* Main Filter Dropdown - Conditionally rendered */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className={`absolute top-full mt-4 p-4 rounded-2xl shadow-2xl z-20
  w-[calc(100%-24px)] sm:w-[calc(100%-24px)] md:w-[calc(100%-24px)]
  ${darkMode ? "bg-gray-800 border border-green-700" : "bg-white border border-green-200"}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Sort Listings Section */}
            <div className="mb-3 flex flex-col sm:flex-row sm:items-baseline items-start w-full">
                <p className={`text-sm font-medium mb-2 sm:mb-0 sm:mr-4 flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Sort Listings:
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => handleSortToggle("date")}
                        className={getButtonClass(sortBy.startsWith("date_listed_"))}
                    >
                        {getSortTextAndIcon("date")}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSortToggle("price")}
                        className={getButtonClass(sortBy.startsWith("price_"))}
                    >
                        {getSortTextAndIcon("price")}
                    </button>
                </div>
            </div>

            {/* Purchase Category Filter */}
            <div className="mb-3 flex flex-col sm:flex-row sm:items-baseline items-start w-full">
              <p className={`text-sm font-medium mb-2 sm:mb-0 sm:mr-4 flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Purchase Category:
              </p>
              <div className="flex flex-wrap gap-2">
                {PURCHASE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleFilterChange("purchaseCategory", cat)}
                    className={getButtonClass(filters.purchaseCategory === cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle for Deeper Advanced Filters */}
            {!showMoreAdvancedFilters ? (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowMoreAdvancedFilters(true)}
                  className={`inline-flex items-center gap-1 text-sm font-medium
                    ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"}
                  `}
                >
                  <SlidersHorizontal size={16} /> Advanced Filters
                </button>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <hr className={`my-2 ${darkMode ? "border-gray-700" : "border-gray-200"}`} />


                  {/* Property Type Filter */}
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-baseline items-start w-full">
                    <p className={`text-sm font-medium mb-2 sm:mb-0 sm:mr-4 flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Property Type:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTY_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            handleFilterChange("propertyType", type);
                          }}
                          className={getButtonClass(filters.propertyType === type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bedrooms Filter */}
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-baseline items-start w-full">
                    <p className={`text-sm font-medium mb-2 sm:mb-0 sm:mr-4 flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Bedrooms:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BED_BATH_COUNTS.map((count) => (
                        <button
                          key={`bed-${count}`}
                          type="button"
                          onClick={() => handleFilterChange("bedrooms", count)}
                          className={getButtonClass(filters.bedrooms === count)}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bathrooms Filter */}
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-baseline items-start w-full">
                    <p className={`text-sm font-medium mb-2 sm:mb-0 sm:mr-4 flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Bathrooms:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BED_BATH_COUNTS.map((count) => (
                        <button
                          key={`bath-${count}`}
                          type="button"
                          onClick={() => handleFilterChange("bathrooms", count)}
                          className={getButtonClass(filters.bathrooms === count)}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Slider */}
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-baseline items-start w-full">
                    <p className={`text-sm font-medium mb-2 sm:mb-0 sm:mr-4 flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Price Range:
                    </p>
                    <div className="flex-grow w-full sm:w-auto">
                      <div className="relative pt-2">
                        <input
                          type="range"
                          min="0"
                          max="1000000000"
                          step="100000"
                          value={minPriceValue}
                          onChange={(e) => handlePriceChange(e, "min")}
                          className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                            darkMode ? "bg-gray-700" : "bg-gray-300"
                          } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-500 [&::-moz-range-thumb]:shadow-md`}
                          style={{ zIndex: minPriceValue > maxPriceValue - 100000 ? 3 : 2 }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000000000"
                          step="100000"
                          value={maxPriceValue}
                          onChange={(e) => handlePriceChange(e, "max")}
                          className={`w-full h-2 rounded-lg appearance-none cursor-pointer absolute top-1 left-0 ${
                            darkMode ? "bg-gray-700" : "bg-gray-300"
                          } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-500 [&::-moz-range-thumb]:shadow-md`}
                          style={{ zIndex: 1 }}
                        />
                        <div
                          className="absolute h-2 rounded-lg bg-green-500 top-1"
                          style={{
                            left: `${(minPriceValue / 1000000000) * 100}%`,
                            width: `${((maxPriceValue - minPriceValue) / 1000000000) * 100}%`,
                            zIndex: 2,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2 text-sm">
                        <span className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Min: ₦{minPriceValue.toLocaleString()}
                        </span>
                        <span className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Max: ₦{maxPriceValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-right">
                    <button
                      type="button"
                      onClick={() => setShowMoreAdvancedFilters(false)}
                      className={`inline-flex items-center gap-1 text-sm font-medium
                        ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"}
                      `}
                    >
                      Hide Advanced Filters
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HomeSearchFilters;

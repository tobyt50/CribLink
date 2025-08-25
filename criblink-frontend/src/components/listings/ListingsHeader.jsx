// src/components/listings/ListingsHeader.jsx
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// Import icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { FileText, LayoutGrid, LayoutList, Plus, SlidersHorizontal, } from "lucide-react";
import { useTheme } from "../../layouts/AppShell";
import PurchaseCategoryFilter from "../PurchaseCategoryFilter"; // Assuming this path is correct
import Dropdown from "./Dropdown";

const ListingsHeader = ({
  isMobile,
  searchTerm,
  handleSearchChange,
  purchaseCategoryFilter,
  handlePurchaseCategoryChange,
  statusFilter,
  handleStatusChange,
  statusOptions,
  minPriceFilter,
  handleMinPriceChange,
  maxPriceFilter,
  handleMaxPriceChange,
  viewMode,
  setViewMode,
  shouldShowAddExportButtons,
  handleExportCsv,
  getRoleBasePath,
}) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  // State and ref for UI elements are kept within this component
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
  const [showSearchBarFilters, setShowSearchBarFilters] = useState(false);
  const filterAreaRef = useRef(null);

  // Effect to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportDropdownOpen(false);
      }
      if (filterAreaRef.current && !filterAreaRef.current.contains(e.target)) {
        setShowSearchBarFilters(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsExportDropdownOpen(false);
        setShowSearchBarFilters(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filterContent = (
    <>
      <div>
        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Purchase Category</label>
        <PurchaseCategoryFilter selectedCategory={purchaseCategoryFilter} onChange={handlePurchaseCategoryChange} className="w-full" buttonClassName={`py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
        <Dropdown placeholder="Select Status" options={statusOptions} value={statusFilter} onChange={handleStatusChange} className="w-full" />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Min Price</label>
        <div className="relative">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
          <input type="number" placeholder="Min Price" value={minPriceFilter} onChange={handleMinPriceChange} className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
        </div>
      </div>
      <div>
        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Max Price</label>
        <div className="relative">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
          <input type="number" placeholder="Max Price" value={maxPriceFilter} onChange={handleMaxPriceChange} className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative" ref={filterAreaRef}>
            <input type="text" placeholder="Search listings..." value={searchTerm} onChange={handleSearchChange} className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
            <button onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters((prev) => !prev); }} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`} title="Filter Listings">
              <SlidersHorizontal size={20} />
            </button>
            <AnimatePresence>
              {showSearchBarFilters && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                  {filterContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {shouldShowAddExportButtons && (
            <>
              <button className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center flex-shrink-0" onClick={() => navigate(`${getRoleBasePath()}/add-listing`)} title="Add New Listing">
                <Plus size={20} />
              </button>
              <div className="relative inline-block text-left flex-shrink-0" ref={exportDropdownRef}>
                <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center" title="Export">
                  <FileText size={20} />
                </button>
                {isExportDropdownOpen && (
                  <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                    <div className="py-1">
                      <button onClick={() => handleExportCsv("current")} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                      <button onClick={() => handleExportCsv("all")} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Listings</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-center gap-2 w-full">
          <button className={`flex-1 p-2 rounded-xl h-10 flex items-center justify-center ${viewMode === "simple" ? "bg-green-700 text-white" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`} onClick={() => { setViewMode("simple"); localStorage.setItem("defaultListingsView", "simple"); }} title="List View">
            <LayoutList className="h-5 w-5 mr-2" /> List View
          </button>
          <button className={`flex-1 p-2 rounded-xl h-10 flex items-center justify-center ${viewMode === "graphical" ? "bg-green-700 text-white" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`} onClick={() => { setViewMode("graphical"); localStorage.setItem("defaultListingsView", "graphical"); }} title="Grid View">
            <LayoutGrid className="h-5 w-5 mr-2" /> Grid View
          </button>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-4 w-full">
        <div className="w-full relative max-w-[28rem]" ref={filterAreaRef}>
          <input type="text" placeholder="Search listings..." value={searchTerm} onChange={handleSearchChange} className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
          <button onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters((prev) => !prev); }} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`} title="Filter Listings">
            <SlidersHorizontal size={20} />
          </button>
          <AnimatePresence>
            {showSearchBarFilters && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                {filterContent}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {shouldShowAddExportButtons && (
          <>
            <button className="bg-green-500 text-white flex items-center justify-center px-4 h-10 rounded-xl hover:bg-green-600 text-sm font-medium" onClick={() => navigate(`${getRoleBasePath()}/add-listing`)}>
              +Add
            </button>
            <div className="relative inline-block text-left" ref={exportDropdownRef}>
              <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10">
                Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
              </button>
              {isExportDropdownOpen && (
                <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                  <div className="py-1">
                    <button onClick={() => handleExportCsv("current")} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                    <button onClick={() => handleExportCsv("all")} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Listings</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <button className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === "simple" ? "bg-green-700 text-white" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`} onClick={() => { setViewMode("simple"); localStorage.setItem("defaultListingsView", "simple"); }} title="List View">
          <LayoutList className="h-6 w-6" />
        </button>
        <button className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === "graphical" ? "bg-green-700 text-white" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`} onClick={() => { setViewMode("graphical"); localStorage.setItem("defaultListingsView", "graphical"); }} title="Grid View">
          <LayoutGrid className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default ListingsHeader;
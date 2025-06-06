import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import API_BASE_URL from '../config';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react"; // Import Search icon
import { useTheme } from "../layouts/AppShell"; // Import useTheme hook

// Reusable Dropdown Component (embedded directly here for self-containment)
const Dropdown = ({ options, value, onChange, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme(); // Use the dark mode context within the dropdown

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        delayChildren: 0.05,
        staggerChildren: 0.02,
      },
    },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: "easeOut" } },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const selectedOptionLabel = options.find(option => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        // Unified styling for the dropdown button to match input fields
        className={`flex items-center justify-between w-full py-2 px-4 border rounded-xl shadow-sm focus:ring focus:ring-green-100 transition-all duration-200
          ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500" : "bg-white border-gray-300 text-gray-700 hover:border-green-500"}`}
      >
        <span>{selectedOptionLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 overflow-hidden transform origin-top
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                variants={itemVariants}
                whileHover={{ x: 5 }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200
                  ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


function SearchFilters({ filters, setFilters }) {
  const { darkMode } = useTheme(); // Use the dark mode context
  const [purchaseCategoryOptions, setPurchaseCategoryOptions] = useState([]);

  // Category map from original PurchaseCategoryFilter.js
  const categoryMap = {
    "All categories": "",
    "For sale": "Sale",
    "For rent": "Rent",
    "For lease": "Lease",
    "For short let": "Short Let",
    "For long let": "Long Let"
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // This API call might not be strictly necessary if categoryMap is static
        // However, keeping it for consistency with original PurchaseCategoryFilter.js
        const response = await axios.get(`${API_BASE_URL}/listings/categories`);
        const options = Object.keys(categoryMap).map(label => ({
          value: categoryMap[label],
          label: label
        }));
        setPurchaseCategoryOptions(options);
      } catch (error) {
        console.error("Error fetching purchase categories:", error);
        const options = Object.keys(categoryMap).map(label => ({
          value: categoryMap[label],
          label: label
        }));
        setPurchaseCategoryOptions(options); // Changed to setPurchaseCategoryOptions
      }
    };

    fetchCategories();
  }, []);

import React, { useEffect, useState } from "react";
import axios from 'axios';
import API_BASE_URL from '../config'; // Assuming API_BASE_URL is defined here
import PurchaseCategoryFilter from './PurchaseCategoryFilter';

function SearchFilters({ filters, setFilters }) {

  const resetFilters = () => {
    setFilters({
      location: "",
      propertyType: "",
      subtype: "",
      subtype: "", // Assuming subtype is a filter option
      bedrooms: "",
      bathrooms: "",
      minPrice: "",
      maxPrice: "",
      purchaseCategory: "",
    });
  };

  const propertyTypeOptions = [
    { value: "", label: "All Types" },
    { value: "Duplex", label: "Duplex" },
    { value: "Bungalow", label: "Bungalow" },
    { value: "Apartment", label: "Apartment" },
    { value: "Penthouse", label: "Penthouse" },
    { value: "Detached House", label: "Detached House" },
    { value: "Semi-Detached House", label: "Semi-Detached House" },
    { value: "Condo", label: "Condo" },
  ];

  const bedroomOptions = [
    { value: "", label: "Any Bedrooms" },
    ...[1, 2, 3, 4, 5].map((num) => ({ value: String(num), label: `${num} Bedroom(s)` })),
  ];

  const bathroomOptions = [
    { value: "", label: "Any Bathrooms" },
    ...[1, 2, 3, 4, 5].map((num) => ({ value: String(num), label: `${num} Bathroom(s)` })),
  ];


  return (
    <div className={`border rounded-3xl p-4 mb-6 shadow-lg ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="relative">
          <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
          <input
            type="text"
            placeholder="Enter location or state"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:ring focus:ring-green-100
              ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
          />
        </div>


        <Dropdown
          placeholder="Select Property Type"
          options={propertyTypeOptions}
          value={filters.propertyType}
          onChange={(value) => setFilters({ ...filters, propertyType: value })}
          className="w-full" // Apply width class to the Dropdown container
        />

        <Dropdown
          placeholder="Select Bedrooms"
          options={bedroomOptions}
          value={filters.bedrooms}
          onChange={(value) => setFilters({ ...filters, bedrooms: value })}
          className="w-full" // Apply width class to the Dropdown container
        />

        <Dropdown
          placeholder="Select Bathrooms"
          options={bathroomOptions}
          value={filters.bathrooms}
          onChange={(value) => setFilters({ ...filters, bathrooms: value })}
          className="w-full" // Apply width class to the Dropdown container
        />

        {/* Purchase Category Dropdown using the embedded Dropdown component */}
        <Dropdown
          placeholder="Select Purchase Category"
          options={purchaseCategoryOptions}
          value={filters.purchaseCategory}
          onChange={(value) => setFilters({ ...filters, purchaseCategory: value })}
          className="w-full" // Apply width class to the Dropdown container
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2 col-span-1 sm:col-span-2 md:col-span-1">
      purchaseCategory: "", // Reset purchase category filter
    });
  };

  return (
    <div className="border rounded-3xl p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Enter location or state"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          className="p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
        />

        <select
          value={filters.propertyType}
          onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
          className="p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          <option value="">All Types</option>
          {/* Example hardcoded property types - you might want to fetch these dynamically too */}
          <option value="Duplex">Duplex</option>
          <option value="Bungalow">Bungalow</option>
          <option value="Apartment">Apartment</option>
          <option value="Penthouse">Penthouse</option>
          <option value="Detached House">Detached House</option>
          <option value="Semi-Detached House">Semi-Detached House</option>
          <option value="Condo">Condo</option>
        </select>

        <select
          value={filters.bedrooms}
          onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
          className="p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          <option value="">Any Bedrooms</option>
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>{num} Bedroom(s)</option>
          ))}
        </select>

        <select
          value={filters.bathrooms}
          onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
          className="p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          <option value="">Any Bathrooms</option>
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>{num} Bathroom(s)</option>
          ))}
        </select>

        {/* Purchase Category Dropdown using dynamically fetched categories */}
        <PurchaseCategoryFilter
          selectedCategory={filters.purchaseCategory}
          onChange={(value) => setFilters({ ...filters, purchaseCategory: value })}
          className="p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
          label={null}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2">
          <input
            type="number"
            placeholder="Min Price (₦)"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className={`w-full sm:w-1/2 py-2 px-4 border rounded-xl shadow-sm focus:ring focus:ring-green-100
              ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
            className="p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none w-full sm:w-1/2"
          />
          <input
            type="number"
            placeholder="Max Price (₦)"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className={`w-full sm:w-1/2 py-2 px-4 border rounded-xl shadow-sm focus:ring focus:ring-green-100
              ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`}
            className="p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none w-full sm:w-1/2"
          />
        </div>
      </div>

      <div className="text-right mt-4">
        <button
          onClick={resetFilters}
          className={`px-6 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg
            ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
      <div className="text-right">
        <button
          onClick={resetFilters}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-full transition"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

export default SearchFilters;

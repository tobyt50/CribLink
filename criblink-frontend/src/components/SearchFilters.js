import React, { useEffect, useState } from "react";
import axios from 'axios';
import API_BASE_URL from '../config'; // Assuming API_BASE_URL is defined here
import PurchaseCategoryFilter from './PurchaseCategoryFilter';

function SearchFilters({ filters, setFilters }) {

  const resetFilters = () => {
    setFilters({
      location: "",
      propertyType: "",
      subtype: "", // Assuming subtype is a filter option
      bedrooms: "",
      bathrooms: "",
      minPrice: "",
      maxPrice: "",
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
            className="p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none w-full sm:w-1/2"
          />
          <input
            type="number"
            placeholder="Max Price (₦)"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none w-full sm:w-1/2"
          />
        </div>
      </div>

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

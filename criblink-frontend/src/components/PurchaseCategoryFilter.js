import React, { useEffect, useState } from "react";
import axios from 'axios';
import API_BASE_URL from '../config';

function PurchaseCategoryFilter({
  selectedCategory,
  onChange,
  className = "",
  renderInlineLabel = false, // when true, render <label> beside the <select>
}) {
  const categoryMap = {
    "All categories": "",
    "For sale": "Sale",
    "For rent": "Rent",
    "For lease": "Lease",
    "For short let": "Short Let",
    "For long let": "Long Let"
  };

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/listings/categories`);
        setCategories(Object.keys(categoryMap));
      } catch (error) {
        console.error("Error fetching purchase categories:", error);
        setCategories(Object.keys(categoryMap));
      }
    };

    fetchCategories();
  }, []);

  if (renderInlineLabel) {
    return (
      <div className="flex items-center space-x-3 mb-6">
        <label className="text-green-700 font-semibold">Filter by:</label>
        <select
          value={selectedCategory}
          onChange={(e) => onChange(e.target.value)}
          className="p-2 rounded-full border border-green-300 focus:ring-2 focus:ring-green-500 focus:outline-none" // Changed rounded-lg to rounded-full
        >
          {categories.map((label) => (
            <option key={label} value={categoryMap[label]}>
              {label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <select
      value={selectedCategory}
      onChange={(e) => onChange(e.target.value)}
      className={`p-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none ${className}`} // Changed rounded-lg to rounded-full
    >
      {categories.map((label) => (
        <option key={label} value={categoryMap[label]}>
          {label}
        </option>
      ))}
    </select>
  );
}

export default PurchaseCategoryFilter;

import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import API_BASE_URL from '../config';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

function PurchaseCategoryFilter({
  selectedCategory,
  onChange,
  className = "", // Accept className prop for external styling (for the wrapper div)
  buttonClassName = "", // Prop to style the internal button
  renderInlineLabel = false,
  variant = "",
  dropdownContentClassName = "" // New prop to control the dropdown content's width
}) {
  // Reusable Dropdown Component (embedded directly here for self-containment)
  const DropdownInternal = ({ options, value, onChange, placeholder, internalClassName = "", buttonInternalClassName = "", dropdownContentClassName = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

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
      <div className={`relative ${internalClassName}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          // Added dark mode classes for background, border, and text
          className={`flex items-center w-full px-4 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:ring focus:ring-green-100 dark:focus:ring-green-800 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-500 dark:hover:border-green-400 transition-all duration-200 text-left ${buttonInternalClassName}`}
        >
          <span className="flex-grow truncate overflow-hidden whitespace-nowrap">{selectedOptionLabel}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            {/* Added dark mode class for icon color */}
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              // Added dark mode classes for background, border, and shadow
              // Apply the dropdownContentClassName here
              className={`absolute left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50 overflow-hidden transform origin-top ${dropdownContentClassName}`}
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
                  // Added dark mode classes for text and hover states
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200"
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
  // End of embedded DropdownInternal

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
        const options = Object.keys(categoryMap).map(label => ({
          value: categoryMap[label],
          label: label
        }));
        setCategories(options);
      } catch (error) {
        console.error("Error fetching purchase categories:", error);
        const options = Object.keys(categoryMap).map(label => ({
          value: categoryMap[label],
          label: label
        }));
        setCategories(options);
      }
    };

    fetchCategories();
  }, []);

  if (renderInlineLabel) {
    return (
      <div className={`flex items-center space-x-3 ${variant === "home" ? "mb-0" : "mb-6"} ${className}`}>
        {/* Added dark mode class for label text */}
        <label className="text-green-700 dark:text-green-400 font-semibold whitespace-nowrap">Show:</label>
        <DropdownInternal
          placeholder="Select Category"
          options={categories}
          value={selectedCategory}
          onChange={onChange}
          internalClassName="w-full"
          buttonInternalClassName={buttonClassName}
          dropdownContentClassName={dropdownContentClassName} // Pass the prop down
        />
      </div>
    );
  }

  return (
    <DropdownInternal
      placeholder="Select Purchase Category"
      options={categories}
      value={selectedCategory}
      onChange={onChange}
      internalClassName={className}
      buttonInternalClassName={buttonClassName}
      dropdownContentClassName={dropdownContentClassName} // Pass the prop down
    />
  );
}

export default PurchaseCategoryFilter;

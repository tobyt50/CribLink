import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../layouts/AppShell";
import { ReactFitty } from "react-fitty";

// StatCard component now accepts onClick and textCentered props
const StatCard = ({ label, value, onClick, textCentered }) => {
  const { darkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      // Apply text-center conditionally based on textCentered prop
      // Apply cursor-pointer and hover effects if onClick is provided
      className={`p-4 rounded-xl shadow 
        ${textCentered ? "text-center" : ""} 
        ${onClick ? "cursor-pointer transition-all duration-200 hover:scale-[1.02]" : ""}
        ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
      onClick={onClick} // Attach the onClick handler
    >
      <ReactFitty maxSize={16} minSize={10}>
        <h2
          className={`font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}
        >
          {label}
        </h2>
      </ReactFitty>
      <ReactFitty maxSize={12} minSize={8}>
        <p
          className={`text-3xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}
        >
          {value}
        </p>
      </ReactFitty>
    </motion.div>
  );
};

export default StatCard;

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

export default function Card({ children, className = '', onClick }) {
  const { darkMode } = useTheme(); // Use the dark mode context

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 200 }}
      onClick={onClick}
      className={`rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 text-center ${className}
        ${darkMode ? "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700" : "bg-white text-gray-900 border border-gray-200"}`}
    >
      {children}
    </motion.div>
  );
}

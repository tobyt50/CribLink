import React from 'react';
import { motion } from 'framer-motion';
<<<<<<< HEAD
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

export default function Card({ children, className = '', onClick }) {
  const { darkMode } = useTheme(); // Use the dark mode context

=======

export default function Card({ children, className = '', onClick }) {
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 200 }}
      onClick={onClick}
<<<<<<< HEAD
      className={`rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 text-center ${className}
        ${darkMode ? "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700" : "bg-white text-gray-900 border border-gray-200"}`}
=======
      className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 text-center ${className}`}
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
    >
      {children}
    </motion.div>
  );
}

// /components/admin/StatCard.js
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

const StatCard = ({ label, value }) => {
  const { darkMode } = useTheme(); // Use the dark mode context

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-xl shadow text-center
        ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-green-100"}`}
    >
      <h2 className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</h2>
      <p className={`text-3xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>{value}</p>
    </motion.div>
  );
};

export default StatCard;

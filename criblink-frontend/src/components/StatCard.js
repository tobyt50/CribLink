import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../layouts/AppShell';

const StatCard = ({ label, value }) => {
  const { darkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-xl shadow text-center 
        ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
    >
      <h2 className={`font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>
        {label}
      </h2>
      <p className={`text-3xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
        {value}
      </p>
    </motion.div>
  );
};

export default StatCard;

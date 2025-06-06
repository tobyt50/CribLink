// /components/admin/StatCard.js
import React from 'react';
import { motion } from 'framer-motion';
<<<<<<< HEAD
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

const StatCard = ({ label, value }) => {
  const { darkMode } = useTheme(); // Use the dark mode context

=======

const StatCard = ({ label, value }) => {
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
<<<<<<< HEAD
      className={`p-4 rounded-xl shadow text-center
        ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-green-100"}`}
    >
      <h2 className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</h2>
      <p className={`text-3xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>{value}</p>
=======
      className="bg-green-100 p-4 rounded-xl shadow text-center"
    >
      <h2 className="font-semibold text-gray-700">{label}</h2>
      <p className="text-3xl text-green-700 font-bold">{value}</p>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
    </motion.div>
  );
};

export default StatCard;

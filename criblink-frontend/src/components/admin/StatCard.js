// /components/admin/StatCard.js
import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ label, value }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-green-100 p-4 rounded-xl shadow text-center"
    >
      <h2 className="font-semibold text-gray-700">{label}</h2>
      <p className="text-3xl text-green-700 font-bold">{value}</p>
    </motion.div>
  );
};

export default StatCard;

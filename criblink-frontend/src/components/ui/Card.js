import React from 'react';
import { motion } from 'framer-motion';

export default function Card({ children, className = '', onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 200 }}
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 text-center ${className}`}
    >
      {children}
    </motion.div>
  );
}

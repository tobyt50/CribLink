import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../layouts/AppShell';

function Settings({ activeSection }) {
  const { darkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className={`text-center italic py-12 text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}
    >
      {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}{" "}
      section coming soon...
    </motion.div>
  );
}

export default Settings;

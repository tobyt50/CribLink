// /components/admin/Header.js
import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
<<<<<<< HEAD
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

const AdminHeader = ({ title, onToggleSidebar }) => {
  const { darkMode } = useTheme(); // Use the dark mode context

  return (
    <div className={`flex items-center justify-between mb-6 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
      {/* Hamburger menu - only on small screens */}
      <button
        onClick={onToggleSidebar}
        className={`md:hidden focus:outline-none ${darkMode ? "text-gray-200" : "text-gray-700"}`}
=======

const AdminHeader = ({ title, onToggleSidebar }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Hamburger menu - only on small screens */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden text-gray-700 focus:outline-none"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
        aria-label="Toggle sidebar"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

<<<<<<< HEAD
      <h1 className={`text-2xl font-semibold ${darkMode ? "text-green-400" : "text-green-700"}`}>{title}</h1>
=======
      <h1 className="text-2xl font-semibold text-green-700">{title}</h1>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
    </div>
  );
};

export default AdminHeader;

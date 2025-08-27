// /components/admin/Header.js
import React from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useTheme } from "../../layouts/AppShell"; // Import useTheme hook

const AdminHeader = ({ title, onToggleSidebar }) => {
  const { darkMode } = useTheme(); // Use the dark mode context

  return (
    <div
      className={`flex items-center justify-between mb-6 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
    >
      {/* Hamburger menu - only on small screens */}
      <button
        onClick={onToggleSidebar}
        className={`md:hidden focus:outline-none ${darkMode ? "text-gray-200" : "text-gray-700"}`}
        aria-label="Toggle sidebar"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <h1
        className={`text-2xl font-semibold ${darkMode ? "text-green-400" : "text-green-700"}`}
      >
        {title}
      </h1>
    </div>
  );
};

export default AdminHeader;

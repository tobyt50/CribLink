// src/components/LoadingSpinner.js
import React from "react";
import { useLoading } from "../context/LoadingContext"; // Adjust path as needed
import { Loader } from "lucide-react"; // Import the Loader icon
import { useTheme } from "../layouts/AppShell"; // Import useTheme to access darkMode

const LoadingSpinner = () => {
  const { loading } = useLoading();
  const { darkMode } = useTheme(); // Get darkMode from theme context

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* The simple Loader icon with spin animation */}
      <Loader
        className={`animate-spin w-12 h-12 ${darkMode ? "text-green-400" : "text-green-600"}`}
      />
      {/* The loading text has been removed as per your request */}
    </div>
  );
};

export default LoadingSpinner;

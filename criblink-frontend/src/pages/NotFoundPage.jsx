import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from "../layouts/AppShell"; // Import useTheme hook

/**
 * NotFoundPage Component
 * Renders a simple 404 Not Found page for unmatched routes,
 * styled to match the application's color scheme and dark mode.
 */
const NotFoundPage = () => {
  const { darkMode } = useTheme(); // Use the dark mode context

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-800"
      }`}
    >
      <h1
        className={`text-9xl font-extrabold ${
          darkMode ? "text-indigo-400" : "text-indigo-600"
        }`}
      >
        404
      </h1>
      <p
        className={`text-2xl md:text-3xl font-light mt-4 mb-8 text-center ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className={`px-6 py-3 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 ${
          darkMode
            ? "bg-indigo-700 text-white hover:bg-indigo-600 focus:ring-indigo-400"
            : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
        }`}
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;

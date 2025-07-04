// src/context/LoadingContext.js
import React, { createContext, useContext, useState } from 'react';

// Create the Loading Context
const LoadingContext = createContext();

// Custom hook to use the loading context
export const useLoading = () => useContext(LoadingContext);

// Loading Provider component
export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  // Function to show the loading spinner
  const showLoading = () => {
    setLoadingCount((prevCount) => {
      const newCount = prevCount + 1;
      if (newCount === 1) { // Only set loading to true when the first request starts
        setLoading(true);
      }
      return newCount;
    });
  };

  // Function to hide the loading spinner
  const hideLoading = () => {
    setLoadingCount((prevCount) => {
      const newCount = Math.max(0, prevCount - 1); // Ensure count doesn't go below 0
      if (newCount === 0) { // Only set loading to false when all requests have finished
        setLoading(false);
      }
      return newCount;
    });
  };

  return (
    <LoadingContext.Provider value={{ loading, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

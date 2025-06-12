// src/layouts/AppShell.js
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const AppShell = ({ children }) => {
  // themePreference will store 'light', 'dark', or 'system'
  const [themePreference, setThemePreference] = useState(() => {
    // Initialize from localStorage, default to 'system' if not set
    return localStorage.getItem("themePreference") || "system";
  });

  // darkMode state reflects the currently active mode (true for dark, false for light)
  // This will be derived from themePreference and system settings
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const applyTheme = () => {
      // Determine the effective mode based on themePreference
      let effectiveDarkMode = false;
      if (themePreference === "dark") {
        effectiveDarkMode = true;
      } else if (themePreference === "light") {
        effectiveDarkMode = false;
      } else { // themePreference === "system"
        effectiveDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      // Update the darkMode state
      setDarkMode(effectiveDarkMode);

      // Apply/remove dark class on document element
      if (effectiveDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Save the user's preference (light, dark, or system)
      localStorage.setItem("themePreference", themePreference);
    };

    // Apply theme on component mount and when themePreference changes
    applyTheme();

    // Listen for system theme changes if preference is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themePreference === "system") {
        applyTheme(); // Re-apply theme if system preference changes
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themePreference]); // Rerun effect when themePreference changes

  // Expose darkMode, themePreference, and setThemePreference to consumers
  return (
    <ThemeContext.Provider value={{ darkMode, themePreference, setThemePreference }}>
      <div className={`${darkMode ? "dark bg-gray-900 text-white" : "bg-white text-gray-900"} min-h-screen`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default AppShell;

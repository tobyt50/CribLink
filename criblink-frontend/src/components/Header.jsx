// src/components/Header.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
// Import both logos
import lightLogo from "../assets/logo-light.svg";
import darkLogo from "../assets/logo-dark.svg";
import { Menu, X, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import ProfileMenu from "./ProfileMenu";
import { useTheme } from "../layouts/AppShell";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/", label: "Listings" },
  { to: "/agencies", label: "Agencies" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
];

function Header() {
  const { user } = useAuth();
  const { darkMode, setThemePreference } = useTheme();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  const handleToggleTheme = () => {
    setThemePreference(darkMode ? "light" : "dark");
  };

  // Determine which logo to use based on darkMode state
  const currentLogo = darkMode ? darkLogo : lightLogo;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] backdrop-blur-md border-b shadow-sm ${
        darkMode ? "bg-gray-900/80 text-white border-gray-800" : "bg-white/70 text-gray-900 border-gray-200"
      }`}
    >
      <div 
  className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 flex justify-between items-center"
  style={{ '--header-height': '96px' }}
>

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          {/* Use the dynamically selected logo */}
          <img src={currentLogo} alt="CribLink Logo" className="h-9 w-auto" />
        </Link>

        {/* Desktop Navigation */}
<nav className="hidden md:flex items-center h-full text-sm font-medium">
  {NAV_LINKS.map(({ to, label }) => {
    const isActive = location.pathname === to;

    return (
      <Link
        key={to}
        to={to}
        className={`relative h-full flex items-center px-4 transition-colors duration-300
          ${isActive
            ? "text-yellow-400 bg-yellow-400/10 border-b-2 border-yellow-400"
            : darkMode
              ? "text-gray-300 hover:text-yellow-300 hover:bg-white/5"
              : "text-gray-700 hover:text-yellow-500 hover:bg-yellow-400/10"}
        `}
      >
        {label}
      </Link>
    );
  })}
</nav>


        {/* Right-side actions */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-md hover:bg-white/10 dark:hover:bg-gray-800 transition"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Desktop Profile */}
          <div className="hidden md:block">
            <ProfileMenu user={user} />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-white/10 dark:hover:bg-gray-800 transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
  <motion.div
    ref={mobileMenuRef}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: "easeInOut" }}
    className={`md:hidden px-6 py-4 space-y-4 text-sm font-medium shadow-inner z-[99] ${
      darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"
    }`}
  >
    <nav className="space-y-2">
      {NAV_LINKS.map(({ to, label }) => {
        const isActive = location.pathname === to;

        return (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileMenuOpen(false)}
            className={`relative block px-2 py-2 rounded transition-colors ${
              isActive
                ? "text-yellow-400 bg-yellow-400/10 border-r-4 border-yellow-400"
                : darkMode
                ? "text-gray-300 hover:text-yellow-300"
                : "text-gray-700 hover:text-yellow-600"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>

    <div className={`pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
      <ProfileMenu user={user} onCloseMobileHeaderMenu={setMobileMenuOpen} />
    </div>
  </motion.div>
)}

    </header>
  );
}

export default Header;

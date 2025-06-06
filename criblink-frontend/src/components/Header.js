// src/components/Header.js
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/criblink-logo.png";
import { Menu, X, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import ProfileMenu from "./ProfileMenu";
import { useTheme } from "../layouts/AppShell"; // ✅ Import theme context

function Header() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const { darkMode, toggleDark } = useTheme(); // ✅ Access global dark mode

  const syncUser = () => {
    const storedUser = localStorage.getItem("user");
    try {
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    syncUser();
    window.addEventListener("authChange", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("authChange", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] shadow ${darkMode ? "bg-gray-800 text-white" : "bg-green-600 text-white"}`}>
      <div className="flex items-center justify-between px-6 h-14">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="CribLink Logo" className="h-9 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-stretch space-x-6 text-sm font-medium h-full">
          {[
            { to: "/", label: "Listings" },
            { to: "/about", label: "About Us" },
            { to: "/contact", label: "Contact Us" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`relative px-3 group transition-all duration-300 ease-in-out overflow-hidden h-full flex items-center
                ${darkMode ? "text-gray-200 hover:text-yellow-300" : "text-white"}`}
            >
              {label}
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-yellow-300 transition-all duration-300 transform scale-x-0 group-hover:scale-x-100" />
              <span className={`absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity ${darkMode ? "from-gray-700" : ""}`} />
            </Link>
          ))}
        </nav>

        {/* Right-side actions */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle - Desktop */}
          <button
            onClick={toggleDark}
            className="hidden md:inline-block text-white hover:text-yellow-300 transition"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Dark Mode Toggle - Mobile (Moved out of hamburger menu) */}
          <button
            onClick={toggleDark}
            className="md:hidden text-white hover:text-yellow-300 transition"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Profile or Menu Toggle */}
          <div className="hidden md:block">
            <ProfileMenu user={user} />
          </div>

          <button
            className="md:hidden text-white"
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, duration: 0.25 }}
          className={`md:hidden px-6 py-4 space-y-4 text-sm font-medium shadow-inner relative z-[100]
            ${darkMode ? "bg-gray-700 text-gray-200" : "bg-green-700 text-white"}`}
        >
          <Link to="/" className={`block hover:text-yellow-300 ${darkMode ? "text-gray-200" : "text-white"}`} onClick={() => setMobileMenuOpen(false)}>
            Listings
          </Link>
          <Link to="/about" className={`block hover:text-yellow-300 ${darkMode ? "text-gray-200" : "text-white"}`} onClick={() => setMobileMenuOpen(false)}>
            About Us
          </Link>
          <Link to="/contact" className={`block hover:text-yellow-300 ${darkMode ? "text-gray-200" : "text-white"}`} onClick={() => setMobileMenuOpen(false)}>
            Contact Us
          </Link>

          {/* Dark mode toggle for mobile - REMOVED from here as per instructions */}

          <div className={`pt-2 border-t ${darkMode ? "border-gray-600" : "border-white/20"}`}>
            <ProfileMenu user={user} onCloseMobileHeaderMenu={setMobileMenuOpen} />
          </div>
        </motion.div>
      )}
    </header>
  );
}

export default Header;

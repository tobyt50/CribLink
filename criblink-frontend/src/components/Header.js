// src/components/Header.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/criblink-logo.png";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import ProfileMenu from "./ProfileMenu";

function Header() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white shadow">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 h-14">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="CribLink Logo" className="h-9 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-stretch space-x-6 text-sm font-medium h-full">
          <Link
            to="/"
            // Removed py-2, added h-full and flex items-center for vertical centering
            className="relative px-3 group transition-all duration-300 ease-in-out overflow-hidden text-white h-full flex items-center"
          >
            Home
            {/* Adjusted bottom position to be immediately outside the link */}
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-yellow-300 transition-all duration-300 ease-in-out transform scale-x-0 group-hover:scale-x-100"></span>
            {/* Faded box now spans full height and fades more on top */}
            <span className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 ease-in-out"></span>
          </Link>
          <Link
            to="/about"
            // Removed py-2, added h-full and flex items-center for vertical centering
            className="relative px-3 group transition-all duration-300 ease-in-out overflow-hidden text-white h-full flex items-center"
          >
            About Us
            {/* Adjusted bottom position to be immediately outside the link */}
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-yellow-300 transition-all duration-300 ease-in-out transform scale-x-0 group-hover:scale-x-100"></span>
            {/* Faded box now spans full height and fades more on top */}
            <span className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 ease-in-out"></span>
          </Link>
          <Link
            to="/contact"
            // Removed py-2, added h-full and flex items-center for vertical centering
            className="relative px-3 group transition-all duration-300 ease-in-out overflow-hidden text-white h-full flex items-center"
          >
            Contact Us
            {/* Adjusted bottom position to be immediately outside the link */}
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-yellow-300 transition-all duration-300 ease-in-out transform scale-x-0 group-hover:scale-x-100"></span>
            {/* Faded box now spans full height and fades more on top */}
            <span className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 ease-in-out"></span>
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
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

      {/* Mobile Menu (No exit animation — instant close) */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            duration: 0.25,
          }}
          className="md:hidden bg-green-700 px-6 py-4 space-y-4 text-sm font-medium shadow-inner"
        >
          <Link
            to="/"
            className="block text-white hover:text-yellow-300 transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/about"
            className="block text-white hover:text-yellow-300 transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            About Us
          </Link>
          <Link
            to="/contact"
            className="block text-white hover:text-yellow-300 transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact Us
          </Link>
          <div className="pt-2 border-t border-white/20">
            <ProfileMenu user={user} />
          </div>
        </motion.div>
      )}
    </header>
  );
}

export default Header;

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
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link to="/" className="hover:text-yellow-300 transition">Home</Link>
          <Link to="/about" className="hover:text-yellow-300 transition">About Us</Link>
          <Link to="/contact" className="hover:text-yellow-300 transition">Contact Us</Link>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <ProfileMenu user={user} />
          </div>
          <button
            className="md:hidden"
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
            className="block hover:text-yellow-300 transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/about"
            className="block hover:text-yellow-300 transition"
            onClick={() => setMobileMenuOpen(false)}
          >
            About Us
          </Link>
          <Link
            to="/contact"
            className="block hover:text-yellow-300 transition"
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

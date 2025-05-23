import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LogIn,
  Settings,
  UserPlus,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

function ProfileMenu({ user }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close the menu when clicking outside of it or pressing the Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      // If the menu is open and the click is outside the menu, close it
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    const handleEscape = (e) => {
      // If the Escape key is pressed, close the menu
      if (e.key === "Escape") {
        setShowMenu(false);
      }
    };

    // Add event listeners when the menu is shown
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    // Clean up event listeners when the component unmounts or menu is hidden
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showMenu]); // Re-run effect when showMenu state changes

  // Handles user logout
  const handleLogout = () => {
    // Remove user token and data from local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Dispatch a custom event to notify other parts of the app about auth change
    window.dispatchEvent(new Event("authChange"));
    setShowMenu(false); // Close the menu
    navigate("/signin"); // Redirect to the sign-in page
  };

  // Handles redirection to the appropriate dashboard based on user role
  const handleDashboardRedirect = () => {
    if (!user?.role) return; // If no user role, do nothing
    const role = user.role.toLowerCase(); // Get user role in lowercase
    // Check if the role is one of the allowed roles
    if (["admin", "agent", "client"].includes(role)) {
      navigate(`/${role}/dashboard`); // Navigate to the specific dashboard
      setShowMenu(false); // Close the menu
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Button to toggle the profile menu */}
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="flex items-center gap-2 text-white hover:text-yellow-300 transition-all duration-300 ease-in-out focus:outline-none"
      >
        {user ? (
          <>
            {/* Display user's initial if logged in */}
            <div className="bg-gradient-to-br from-green-500 to-green-700 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shadow-md">
              {user.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            {/* Display user's first name */}
            <span className="text-base font-semibold hidden md:inline">
              {user.full_name?.split(" ")[0]}
            </span>
          </>
        ) : (
          // Display a generic user icon if not logged in
          <User className="w-7 h-7 text-white" />
        )}
        {/* Chevron icon for dropdown indication */}
        <motion.div
          animate={{ rotate: showMenu ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </motion.div>
      </button>

      {/* AnimatePresence for smooth mounting/unmounting of the menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-60 bg-white text-green-800 border border-gray-200 rounded-xl shadow-xl py-2 z-50 overflow-hidden transform origin-top-right"
          >
            {user ? (
              <>
                {/* User role display */}
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                  {user.role}
                </div>

                {/* Dashboard button */}
                <motion.button
                  whileHover={{ x: 5 }}
                  onClick={handleDashboardRedirect}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </motion.button>

                {/* Manage Profile link */}
                <motion.div whileHover={{ x: 5 }}>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings className="w-4 h-4" /> Manage Profile
                  </Link>
                </motion.div>

                {/* Log Out button */}
                <motion.button
                  whileHover={{ x: 5 }}
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </motion.button>
              </>
            ) : (
              <>
                {/* Login link */}
                <motion.div whileHover={{ x: 5 }}>
                  <Link
                    to="/signin"
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
                    onClick={() => setShowMenu(false)}
                  >
                    <LogIn className="w-4 h-4" /> Login
                  </Link>
                </motion.div>

                {/* Create Account link */}
                <motion.div whileHover={{ x: 5 }}>
                  <Link
                    to="/select-role"
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
                    onClick={() => setShowMenu(false)}
                  >
                    <UserPlus className="w-4 h-4" /> Create Account
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileMenu;

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Moon, Sun, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import newLogo from "../assets/newlogo.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../layouts/AppShell";
import DashboardSidebar from "./DashboardSidebar";
import MobileSidebar from "./MobileSidebar";
import ProfileMenu from "./ProfileMenu";

function Header() {
  const { user } = useAuth();
  const { darkMode, setThemePreference } = useTheme();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashboardSidebarOpen, setDashboardSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
const [isSupportMenuLocked, setIsSupportMenuLocked] = useState(false);

  // --- Mutual Exclusivity Logic ---
  const handleDashboardToggle = () => {
    if (user) {
      if (mobileSidebarOpen) setMobileSidebarOpen(false);
      setDashboardSidebarOpen((prev) => !prev);
    }
  };

  const handleMobileSidebarOpen = () => {
    if (dashboardSidebarOpen) setDashboardSidebarOpen(false);
    setMobileSidebarOpen(true);
  };

  const handleSupportToggleClick = () => {
    const newLockState = !isSupportMenuLocked;
    setIsSupportMenuLocked(newLockState);
    setSupportOpen(newLockState); // If we lock it, we show it. If we unlock, we hide.
  };

  const handleLogoClick = () => {
    if (dashboardSidebarOpen) setDashboardSidebarOpen(false);
    if (mobileSidebarOpen) setMobileSidebarOpen(false);
  };

  const handleToggleTheme = () => {
    setThemePreference(darkMode ? "light" : "dark");
  };

  return (
    <>
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        setIsOpen={setMobileSidebarOpen}
      />
      <DashboardSidebar
        isOpen={dashboardSidebarOpen}
        setIsOpen={setDashboardSidebarOpen}
      />

      <header
        className={`fixed top-0 left-0 right-0 z-[100] backdrop-blur-md border-b shadow-sm ${
          darkMode
            ? "bg-gray-900/80 text-white border-gray-800"
            : "bg-white/70 text-gray-900 border-gray-200"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 flex justify-between items-center">
          {/* --- Mobile View --- */}
          <div className="md:hidden grid grid-cols-3 w-full items-center">
            <div className="flex justify-start">
              <button
                onClick={handleDashboardToggle}
                className="p-2 rounded-md hover:bg-white/10 dark:hover:bg-gray-800 transition relative h-10 w-10 flex items-center justify-center"
                title="Toggle Dashboard Menu"
                style={{ visibility: user?.role ? "visible" : "hidden" }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={dashboardSidebarOpen ? "close" : "menu"}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.1 }}
                  >
                    {dashboardSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>

            <div className="flex justify-center">
              <Link to="/" onClick={handleLogoClick}>
                <img src={newLogo} alt="Havo Logo" className="h-12 w-auto" />
              </Link>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleMobileSidebarOpen}
                className="flex items-center justify-center h-9 w-9 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                {user ? (
                  user.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-green-500 to-green-700 text-white w-full h-full rounded-full flex items-center justify-center font-bold text-base">
                      {user.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )
                ) : (
                  <User
                    className={`w-6 h-6 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  />
                )}
              </button>
            </div>
          </div>

                    {/* --- DESKTOP VIEW --- */}
                    <div className="hidden md:grid md:grid-cols-3 w-full items-center">
            {/* Left Side: Logo */}
            <div className="flex justify-start">
              <Link to="/" onClick={handleLogoClick} className="flex items-center space-x-2">
                <img src={newLogo} alt="Havo Logo" className="h-12 w-auto" />
              </Link>
            </div>

            {/* Center: Navigation Links */}
            <div className="flex justify-center">
              <nav className="flex items-center h-14 text-sm font-medium space-x-1">
                {/* Listings */}
                <Link
                  to="/"
                  className={`relative h-full flex items-center px-4 transition-colors duration-300 ${
                    location.pathname === "/"
                      ? "text-yellow-400 bg-yellow-400/10 border-b-2 border-yellow-400"
                      : darkMode
                        ? "text-gray-300 hover:text-yellow-300 hover:bg-white/5"
                        : "text-gray-700 hover:text-yellow-500 hover:bg-yellow-400/10"
                  }`}
                >
                  Listings
                </Link>

                {/* Dashboard */}
                {user && (
                  <Link
                    to={`/${user.role === "agency_admin" ? "agency" : user.role}/dashboard`}
                    className={`relative h-full flex items-center px-4 transition-colors duration-300 ${
                      location.pathname.includes("/dashboard")
                        ? "text-yellow-400 bg-yellow-400/10 border-b-2 border-yellow-400"
                        : darkMode
                          ? "text-gray-300 hover:text-yellow-300 hover:bg-white/5"
                          : "text-gray-700 hover:text-yellow-500 hover:bg-yellow-400/10"
                    }`}
                  >
                    Dashboard
                  </Link>
                )}

                {/* Agencies */}
                <Link
                  to="/agencies"
                  className={`relative h-full flex items-center px-4 transition-colors duration-300 ${
                    location.pathname === "/agencies"
                      ? "text-yellow-400 bg-yellow-400/10 border-b-2 border-yellow-400"
                      : darkMode
                        ? "text-gray-300 hover:text-yellow-300 hover:bg-white/5"
                        : "text-gray-700 hover:text-yellow-500 hover:bg-yellow-400/10"
                  }`}
                >
                  Agencies
                </Link>

                {/* Support dropdown */}
<div
  className="relative h-full"
  onMouseEnter={() => setSupportOpen(true)}
  onMouseLeave={() => setSupportOpen(false)}
>
  {/* The main button, now styled exactly like the other nav links */}
  <button
    onClick={handleSupportToggleClick}
    className={`relative h-full flex items-center px-4 transition-colors duration-300 focus:outline-none ${
      ["/about", "/contact"].includes(location.pathname)
        ? "text-yellow-400 bg-yellow-400/10 border-b-2 border-yellow-400"
        : darkMode
          ? "text-gray-300 hover:text-yellow-300 hover:bg-white/5"
          : "text-gray-700 hover:text-yellow-500 hover:bg-yellow-400/10"
    }`}
  >
    Support
    <ChevronDown
      className={`w-4 h-4 ml-1 transition-transform duration-200 ${
        supportOpen ? "rotate-180" : ""
      }`}
    />
  </button>

  <AnimatePresence>
    {supportOpen && (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className={`absolute left-0 mt-1 w-48 rounded-xl shadow-lg border z-50 overflow-hidden ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Dropdown menu item for "About Us" */}
        <Link
          to="/about"
          className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
            location.pathname === "/about"
              ? "text-yellow-400" // Active state for the link itself
              : darkMode
                ? "text-gray-300 hover:text-yellow-300 hover:bg-white/5"
                : "text-gray-700 hover:text-yellow-500 hover:bg-yellow-400/10"
          }`}
          onClick={() => setSupportOpen(false)}
        >
          About Us
        </Link>

        {/* Dropdown menu item for "Contact Us" */}
        <Link
          to="/contact"
          className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
            location.pathname === "/contact"
              ? "text-yellow-400" // Active state for the link itself
              : darkMode
                ? "text-gray-300 hover:text-yellow-300 hover:bg-white/5"
                : "text-gray-700 hover:text-yellow-500 hover:bg-yellow-400/10"
          }`}
          onClick={() => setSupportOpen(false)}
        >
          Contact Us
        </Link>
      </motion.div>
    )}
  </AnimatePresence>
</div>
              </nav>
            </div>

            {/* Right Side: Actions */}
            <div className="flex justify-end">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleTheme}
                  className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 
                    ${
                      darkMode
                        ? "text-gray-400 hover:text-yellow-300 focus-visible:ring-offset-gray-900"
                        : "text-gray-500 hover:text-yellow-500 focus-visible:ring-offset-white"
                    }`}
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={darkMode ? "moon" : "sun"}
                      initial={{ y: -15, opacity: 0, rotate: -30 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      exit={{ y: 15, opacity: 0, rotate: 30 }}
                      transition={{ duration: 0.2 }}
                    >
                      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.div>
                  </AnimatePresence>
                </button>

                <ProfileMenu />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;

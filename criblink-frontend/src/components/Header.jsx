import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import newLogo from "../assets/newlogo.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../layouts/AppShell";
import DashboardSidebar from "./DashboardSidebar";
import MobileSidebar from "./MobileSidebar";
import ProfileMenu from "./ProfileMenu";

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

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dashboardSidebarOpen, setDashboardSidebarOpen] = useState(false);

  // --- NEW: LOGIC TO HANDLE MUTUAL EXCLUSIVITY ---

  // Toggles the left (dashboard) sidebar
  const handleDashboardToggle = () => {
    if (user) {
      // If the right sidebar is open, close it first
      if (mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
      // Then toggle the left sidebar
      setDashboardSidebarOpen((prev) => !prev);
    }
  };

  // Opens the right (mobile) sidebar
  const handleMobileSidebarOpen = () => {
    // If the left sidebar is open, close it first
    if (dashboardSidebarOpen) {
      setDashboardSidebarOpen(false);
    }
    // Then open the right sidebar
    setMobileSidebarOpen(true);
  };

  // Closes any open sidebar, for the logo link
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
                onClick={handleDashboardToggle} // Use the new handler
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
                    {dashboardSidebarOpen ? (
                      <X size={24} />
                    ) : (
                      <Menu size={24} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>

            <div className="flex justify-center">
              <Link to="/" onClick={handleLogoClick}> {/* Use the new handler */}
                <img src={newLogo} alt="Havo Logo" className="h-12 w-auto" />
              </Link>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleMobileSidebarOpen} // Use the new handler
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
          <div className="hidden md:flex w-full justify-between items-center">
            <Link to="/" onClick={handleLogoClick} className="flex items-center space-x-2"> {/* Use the new handler */}
              <img src={newLogo} alt="Havo Logo" className="h-12 w-auto" />
            </Link>

            <nav className="flex items-center h-14 text-sm font-medium">
              {NAV_LINKS.map(({ to, label }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative h-full flex items-center px-4 transition-colors duration-300
                      ${
                        isActive
                          ? "text-yellow-400 bg-yellow-400/10 border-b-2 border-yellow-400"
                          : darkMode
                            ? "text-gray-300 hover:text-yellow-300 hover:bg-white/5"
                            : "text-gray-700 hover:text-yellow-500 hover:bg-yellow-400/10"
                      }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-md hover:bg-white/10 dark:hover:bg-gray-800 transition"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
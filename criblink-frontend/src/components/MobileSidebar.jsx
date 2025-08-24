import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import { useTheme } from "../layouts/AppShell";
// Import the swipe hook
import { useSwipeable } from "react-swipeable";

import {
  Building,
  ChevronDown,
  LifeBuoy,
  LogIn,
  LogOut,
  Moon,
  Settings,
  Star,
  Sun,
  UserPlus,
  X,
} from "lucide-react";

const MobileSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { darkMode, setThemePreference } = useTheme();
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // --- Swipe Gesture Handlers for the sidebar panel ---
  const swipeHandlers = useSwipeable({
    // This sidebar comes from the right, so a swipe right closes it.
    onSwipedRight: () => setIsOpen(false),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  // Effect to handle swipe-to-open from the right edge of the screen
  useEffect(() => {
    const handleTouchStart = (e) => {
      // Check if swipe starts from the right edge of the screen
      if (!isOpen && e.touches[0].clientX > window.innerWidth - 20) {
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
      }
    };

    const handleTouchMove = (e) => {
      // If user swipes left, open the sidebar
      if (e.changedTouches[0].clientX < window.innerWidth - 50) {
        setIsOpen(true);
        handleTouchEnd(); // Clean up listeners
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isOpen, setIsOpen]);

  const handleLogout = useCallback(() => {
    logout();
    setIsOpen(false);
    navigate("/signin");
    showMessage("You have been logged out.", "info", 3000);
  }, [logout, setIsOpen, navigate, showMessage]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const handleToggleTheme = () => {
    setThemePreference(darkMode ? "light" : "dark");
  };

  const menuLinkClasses = (isActive) => `
    flex items-center gap-4 w-full px-6 py-2.5 transition-all
    ${
      isActive
        ? darkMode
          ? "bg-gray-900 text-green-200 font-semibold border-r-4 border-green-400"
          : "bg-green-100 text-green-800 font-semibold border-r-4 border-green-600"
        : darkMode
          ? "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
    }`;

  const GuestMenu = () => (
    <>
      <div className="flex justify-between items-center p-4">
        <button
          onClick={handleToggleTheme}
          className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
        >
          <X size={24} />
        </button>
      </div>
      <nav className="flex-grow overflow-y-auto pt-8">
        <NavLink
          to="/signin"
          onClick={handleLinkClick}
          className={({ isActive }) => menuLinkClasses(isActive)}
        >
          <LogIn size={24} /> <span>Login</span>
        </NavLink>
        <hr
          className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`}
        />
        <NavLink
          to="/select-role"
          onClick={handleLinkClick}
          className={({ isActive }) => menuLinkClasses(isActive)}
        >
          <UserPlus size={24} /> <span>Create Account</span>
        </NavLink>
        <hr
          className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`}
        />
        <NavLink
          to="/agencies"
          onClick={handleLinkClick}
          className={({ isActive }) => menuLinkClasses(isActive)}
        >
          <Building size={24} /> <span>Agencies</span>
        </NavLink>
        <hr
          className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`}
        />
        <div>
          <button
            onClick={() => setIsSupportOpen((prev) => !prev)}
            className={`flex items-center justify-between gap-4 w-full px-6 py-2.5 transition-all ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <span className="flex items-center gap-4">
              <LifeBuoy size={24} /> <span>Support</span>
            </span>
            <motion.div animate={{ rotate: isSupportOpen ? 180 : 0 }}>
              <ChevronDown size={20} />
            </motion.div>
          </button>
          <AnimatePresence>
            {isSupportOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden pl-10"
              >
                <NavLink
                  to="/about"
                  onClick={handleLinkClick}
                  className={({ isActive }) => menuLinkClasses(isActive)}
                >
                  About Us
                </NavLink>
                <NavLink
                  to="/contact"
                  onClick={handleLinkClick}
                  className={({ isActive }) => menuLinkClasses(isActive)}
                >
                  Contact Us
                </NavLink>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );

  const UserMenu = () => (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto">
        <div
          className={`relative p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <button
            onClick={handleToggleTheme}
            className={`absolute top-4 left-4 p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            <X size={24} />
          </button>
          <div className="flex flex-col items-center text-center pt-4">
  <NavLink
    to="/settings?category=profile"
    onClick={handleLinkClick}
    className="rounded-full transition-transform hover:scale-105"
  >
    {user?.profile_picture_url ? (
      <img
        src={user.profile_picture_url}
        alt="Profile"
        className="w-28 h-28 rounded-full object-cover shadow-md border-2 border-green-500"
      />
    ) : (
      <div className="bg-gradient-to-br from-green-500 to-green-700 text-white w-28 h-28 rounded-full flex items-center justify-center font-bold text-4xl shadow-md">
        {user?.full_name?.charAt(0).toUpperCase() || "U"}
      </div>
    )}
  </NavLink>
  <div className="mt-2">
    <NavLink
      to="/settings?category=profile"
      onClick={handleLinkClick}
      className={`block rounded-md px-1 py-0.5 transition ${
        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
      }`}
    >
      <p className="font-semibold text-lg">{user?.full_name}</p>
    </NavLink>
    <NavLink
      to="/settings?category=profile"
      onClick={handleLinkClick}
      className={`block rounded-md px-1 py-0.5 transition ${
        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
      }`}
    >
      <p
        className={`text-sm ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {user?.email}
      </p>
    </NavLink>
    <p
      className={`text-xs mt-1 font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
        darkMode ? "bg-gray-700 text-green-300" : "bg-green-100 text-green-800"
      }`}
    >
      {user?.role?.replace("_", " ")}
    </p>
  </div>
</div>

        </div>

        <nav className="pt-2">
          <hr
            className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`}
          />
          <NavLink
            to="/agencies"
            onClick={handleLinkClick}
            className={({ isActive }) => menuLinkClasses(isActive)}
          >
            <Building size={24} /> <span>Agencies</span>
          </NavLink>
          <hr
            className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`}
          />
          <NavLink
            to="/subscriptions"
            onClick={handleLinkClick}
            className={({ isActive }) => menuLinkClasses(isActive)}
          >
            <Star size={24} /> <span>Subscriptions</span>
          </NavLink>
          <hr
            className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`}
          />
          <NavLink
            to="/settings"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              menuLinkClasses(
                isActive || location.pathname.startsWith("/settings"),
              )
            }
          >
            <Settings size={24} /> <span>Account & Settings</span>
          </NavLink>

          <div>
            <button
              onClick={() => setIsSupportOpen((prev) => !prev)}
              className={`flex items-center justify-between gap-4 w-full px-6 py-2.5 transition-all ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <span className="flex items-center gap-4">
                <LifeBuoy size={24} /> <span>Support</span>
              </span>
              <motion.div animate={{ rotate: isSupportOpen ? 180 : 0 }}>
                <ChevronDown size={20} />
              </motion.div>
            </button>
            <AnimatePresence>
              {isSupportOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-10"
                >
                  <NavLink
                    to="/about"
                    onClick={handleLinkClick}
                    className={({ isActive }) => menuLinkClasses(isActive)}
                  >
                    About Us
                  </NavLink>
                  <NavLink
                    to="/contact"
                    onClick={handleLinkClick}
                    className={({ isActive }) => menuLinkClasses(isActive)}
                  >
                    Contact Us
                  </NavLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      <div
        className={`mt-auto border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 w-full px-6 py-4 transition-all ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
        >
          <LogOut size={24} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-black/60 z-[199] md:hidden"
          />
          {/* Attach swipe handlers to the main motion.div */}
          <motion.div
            {...swipeHandlers}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 right-0 h-full w-full flex flex-col z-[200] md:hidden shadow-2xl ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}
          >
            {user ? <UserMenu /> : <GuestMenu />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSidebar;

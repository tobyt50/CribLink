import { AnimatePresence, motion } from "framer-motion";
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
import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import { useTheme } from "../layouts/AppShell";

const MobileSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { darkMode, setThemePreference } = useTheme();
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Close on ESC key
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isOpen, setIsOpen]);

// Close on browser back button
useEffect(() => {
  if (!isOpen) return;

  // Push temporary state into history so Back closes the sidebar
  window.history.pushState({ sidebar: true }, "");

  const handlePopState = (e) => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  window.addEventListener("popstate", handlePopState);
  return () => {
    window.removeEventListener("popstate", handlePopState);

    // Remove the extra history entry if sidebar closed normally
    if (window.history.state?.sidebar) {
      window.history.back();
    }
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

  const menuLinkClasses = (isActive) =>
    `group flex items-center gap-4 w-full px-6 py-3 transition-all rounded-lg
    ${
      isActive
        ? darkMode
          ? "bg-gray-800 text-green-300"
          : "bg-green-50 text-green-700"
        : darkMode
          ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const iconProps = { size: 22, strokeWidth: 1.8 };

  const SupportMenu = () => (
    <>
      <button
        onClick={() => setIsSupportOpen((prev) => !prev)}
        className={`group flex items-center justify-between gap-4 w-full px-6 py-3 transition-all rounded-lg ${
          darkMode
            ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <span className="flex items-center gap-4">
          <LifeBuoy {...iconProps} />
          <span className="text-base font-medium">Support</span>
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
            className="overflow-hidden"
          >
            <div className="pl-10">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  const GuestMenu = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between w-full p-4 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
        <h2 className={`text-lg font-semibold tracking-tight ${darkMode ? "text-green-300" : "text-green-700"}`}>
          Menu
        </h2>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-full">
          <X size={24} className={darkMode ? "text-gray-400" : "text-gray-600"} />
        </button>
      </div>
      <nav className="flex flex-col w-full flex-grow overflow-y-auto p-3">
        
        <NavLink to="/agencies" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>
          <Building {...iconProps} />
          <span className="text-base font-medium">Agencies</span>
        </NavLink>
        <SupportMenu />
        <NavLink to="/signin" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>
          <LogIn {...iconProps} />
          <span className="text-base font-medium">Login</span>
        </NavLink>
        <NavLink to="/select-role" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>
          <UserPlus {...iconProps} />
          <span className="text-base font-medium">Create Account</span>
        </NavLink>
        <div className={`border-t my-3 ${darkMode ? "border-gray-800" : "border-gray-100"}`} />
        <button onClick={handleToggleTheme} className={menuLinkClasses(false)}>
          {darkMode ? <Sun {...iconProps} /> : <Moon {...iconProps} />}
          <span className="text-base font-medium">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </nav>
    </div>
  );

  const UserMenu = () => (
    <div className="flex flex-col h-full">
      <div className={`relative p-4 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
        <button
          onClick={() => setIsOpen(false)}
          className={`absolute top-4 right-4 p-1 rounded-full ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
        >
          <X size={24} className={darkMode ? "text-gray-400" : "text-gray-600"} />
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
                className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-green-500"
              />
            ) : (
              <div className="bg-gradient-to-br from-green-500 to-green-700 text-white w-24 h-24 rounded-full flex items-center justify-center font-bold text-4xl shadow-md">
                {user?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </NavLink>
          <div className="mt-2">
            <p className="font-semibold text-lg">{user?.full_name}</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{user?.email}</p>
            <p className={`text-xs mt-1 font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${darkMode ? "bg-gray-700 text-green-300" : "bg-green-100 text-green-800"}`}>
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex flex-col w-full flex-grow overflow-y-auto p-3">
      <NavLink
          to="/settings"
          onClick={handleLinkClick}
          className={({ isActive }) => menuLinkClasses(isActive || location.pathname.startsWith("/settings"))}
        >
          <Settings {...iconProps} />
          <span className="text-base font-medium">Account Settings</span>
        </NavLink>
        <NavLink to="/subscriptions" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>
          <Star {...iconProps} />
          <span className="text-base font-medium">Subscriptions</span>
        </NavLink>
        <NavLink to="/agencies" onClick={handleLinkClick} className={({ isActive }) => menuLinkClasses(isActive)}>
          <Building {...iconProps} />
          <span className="text-base font-medium">Agencies</span>
        </NavLink>
        <SupportMenu />
        <div className={`border-t my-3 ${darkMode ? "border-gray-800" : "border-gray-100"}`} />
        <button onClick={handleToggleTheme} className={menuLinkClasses(false)}>
          {darkMode ? <Sun {...iconProps} /> : <Moon {...iconProps} />}
          <span className="text-base font-medium">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
        <button onClick={handleLogout} className={menuLinkClasses(false)}>
          <LogOut {...iconProps} />
          <span className="text-base font-medium">Sign Out</span>
        </button>
      </nav>
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
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[199] md:hidden backdrop-blur-sm transition-colors ${darkMode ? "bg-gray-900/70" : "bg-black/30"}`}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 right-0 h-full w-full flex flex-col z-[200] md:hidden shadow-2xl ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"}`}
          >
            {user ? <UserMenu /> : <GuestMenu />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSidebar;
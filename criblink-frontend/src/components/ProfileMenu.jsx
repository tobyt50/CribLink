import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  LogIn,
  LogOut,
  Settings,
  Star,
  User,
  UserPlus
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import { useTheme } from "../layouts/AppShell";

// Desktop-only ProfileMenu
function ProfileMenu() {
  const [isMenuLockedOpen, setIsMenuLockedOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [hovering, setHovering] = useState(false); // for flicker-free hover
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setShowMenu(false);
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showMenu]);

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate("/signin");
    showMessage("You have been logged out.", "info", 3000);
  };

  const menuVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        delayChildren: 0.1,
        staggerChildren: 0.05,
      },
    },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2, ease: "easeOut" } },
  };

  const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  const handleToggleClick = () => {
    const newLockState = !isMenuLockedOpen;
    setIsMenuLockedOpen(newLockState);
    setShowMenu(newLockState); // If we lock it, we show it. If we unlock, we hide.
  };

  // flicker-free hover handling
  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setHovering(true);
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHovering(false);
      setShowMenu(false);
    }, 150); // short delay prevents flicker
  };

  const hoverClasses = darkMode
    ? "hover:text-yellow-300 hover:bg-gray-700"
    : "hover:text-yellow-500 hover:bg-yellow-400/10";

  const buttonHoverClasses = darkMode
    ? "hover:text-yellow-300 hover:bg-white/5"
    : "hover:text-yellow-500 hover:bg-yellow-400/10";

  return (
    <div
      className="relative"
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
  onClick={handleToggleClick}
  className={`flex items-center gap-2 h-14 transition-all duration-300 ease-in-out`}
>
  {user ? (
    <>
      {user.profile_picture_url ? (
        <img
          src={user.profile_picture_url}
          alt="Profile"
          className="w-9 h-9 rounded-full object-cover shadow-md"
        />
      ) : (
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shadow-md">
          {user.full_name?.charAt(0).toUpperCase() || "U"}
        </div>
      )}

      <div
        className={`flex items-center gap-1 px-2 h-full transition-colors duration-200 cursor-pointer ${
          darkMode ? "hover:text-yellow-300 text-gray-200" : "hover:text-yellow-500 text-gray-700"
        }`}
      >
        <span className="text-sm font-semibold">
          {user.full_name?.split(" ")[0]}
        </span>
        <motion.div animate={{ rotate: showMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </div>
    </>
  ) : (
    <User
      className={`w-7 h-7 transition-colors duration-200 ${
        darkMode ? "hover:text-yellow-300" : "hover:text-yellow-500"
      }`}
    />
  )}
</button>

<AnimatePresence>
        {showMenu && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute right-0 top-full mt-1 w-60 border rounded-xl shadow-xl py-2 z-50 overflow-hidden transform origin-top-right
              ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-800 border-gray-200"}`}
          >
            {user ? (
              <>
                <div className={`px-4 py-2 text-xs uppercase tracking-wider border-b mb-1 ${darkMode ? "text-gray-400 border-gray-700" : "text-gray-500 border-gray-100"}`}>
                  {user.role}
                </div>

                <motion.div variants={itemVariants} whileHover={{ x: 0 }}>
                  <Link
                    to="/settings"
                    className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200 w-full ${hoverClasses}`}
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings className="w-4 h-4" /> Account Settings
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ x: 0 }}>
                  <Link
                    to="/subscriptions"
                    className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200 w-full ${hoverClasses}`}
                    onClick={() => setShowMenu(false)}
                  >
                    <Star className="w-4 h-4" /> Subscriptions
                  </Link>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  whileHover={{ x: 0 }}
                  onClick={handleLogout}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200 ${darkMode ? "text-gray-200 hover:bg-gray-700 hover:text-red-300" : "text-gray-700 hover:bg-red-50 hover:text-red-600"}`}
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </motion.button>
              </>
            ) : (
              <>
                <motion.div variants={itemVariants} whileHover={{ x: 0 }}>
                  <Link
                    to="/signin"
                    className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200 w-full ${hoverClasses}`}
                    onClick={() => setShowMenu(false)}
                  >
                    <LogIn className="w-4 h-4" /> Login
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ x: 0 }}>
                  <Link
                    to="/select-role"
                    className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200 w-full ${hoverClasses}`}
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

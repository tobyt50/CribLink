import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ChevronLeft, X, User, Shield, Lock, Settings } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import { useSidebarState } from '../../hooks/useSidebarState'; // Correct path

// Define menu items for the sidebar
const MENU_ITEMS = [
  { name: 'General', icon: <User size={24} />, key: 'general' },
  { name: 'Security', icon: <Shield size={24} />, key: 'security' },
  { name: 'Privacy', icon: <Lock size={24} />, key: 'privacy' },
  { name: 'Settings', icon: <Settings size={24} />, key: 'settings' },
];

function Sidebar({ activeSection, setActiveSection, userInfo, children }) {
  const { darkMode } = useTheme();
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();

  // Helper function to get initials from full name
  const getInitials = (name) => {
    if (!name) return "";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0]?.toUpperCase() || "";
    return ((names[0]?.[0] || "") + (names[names.length - 1]?.[0] || "")).toUpperCase();
  };

  return (
    <>
      {/* Mobile Sidebar Toggle Button (fixed on the main content area) */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-white"}`}
          initial={false}
          animate={{ rotate: isSidebarOpen ? 180 : 0, opacity: 1 }}
          transition={{ duration: 0.05 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isSidebarOpen ? 'close' : 'menu'}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.05 }}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      )}

      {/* Sidebar */}
      <motion.div
        className={`transition-all duration-300 shadow-2xl border-r
          flex flex-col items-start pb-10 h-screen fixed left-0 z-40 overflow-y-auto
          ${isMobile ? (isSidebarOpen ? 'translate-x-0 w-64 top-14' : '-translate-x-full w-64 top-14') : (isCollapsed ? 'w-20 top-14' : 'w-64 top-14')}
          ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
        `}
        initial={false}
        animate={{
          x: isMobile ? (isSidebarOpen ? 0 : -256) : 0, // 256px is w-64
          width: isMobile ? 256 : (isCollapsed ? 80 : 256)
        }}
        transition={{ duration: 0.05 }}
      >
        {/* Close/Collapse Button for Sidebar (only desktop) */}
        {!isMobile && (
          <button
            onClick={() => {
              setIsCollapsed(prev => {
                const newCollapsedState = !prev;
                // Persist sidebar state
                localStorage.setItem('sidebarPermanentlyExpanded', JSON.stringify(!newCollapsedState));
                return newCollapsedState;
              });
            }}
            aria-label="Toggle sidebar"
            className={`flex flex-col items-center py-3 mb-6 border-b w-full px-6 transition-colors duration-200 ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100"}`}
          >
            {isCollapsed ? (
              <>
                <Menu className={`${darkMode ? "text-gray-200" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold select-none ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Expand</span>
              </>
            ) : (
              <>
                <ChevronLeft className={`${darkMode ? "text-gray-200" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold select-none ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Collapse</span>
              </>
            )}
          </button>
        )}

        {/* Profile Section (from original ManageProfile.js) */}
        <motion.div
          className={`flex flex-col items-center text-center px-4 mb-8 w-full`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Profile Picture slot - children will render DisplayPicture */}
          {children}

          {/* Profile Details */}
          {(isMobile || !isCollapsed) ? (
            <>
              <p className={`mt-4 font-semibold truncate max-w-full text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                {userInfo.full_name}
              </p>
              <p className={`text-sm truncate max-w-full ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {userInfo.email}
              </p>
              <p className={`text-xs uppercase mt-1 ${darkMode ? "text-green-400" : "text-green-600"}`}>{userInfo.role}</p>
            </>
          ) : (
            <p className={`mt-3 font-bold select-none text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
              {getInitials(userInfo.full_name)}
            </p>
          )}
        </motion.div>

        {/* Menu Items */}
        <nav className="flex flex-col w-full">
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <button
                onClick={() => {
                  setActiveSection(item.key);
                  if (isMobile) setIsSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`flex items-center gap-4 w-full px-6 py-3 transition-all duration-150 ease-in-out
                  ${
                    activeSection === item.key
                      ? `font-semibold border-l-4 border-green-600 ${darkMode ? "bg-gray-900 text-green-200" : "bg-green-100 text-green-800"}`
                      : `${darkMode ? "text-gray-300 hover:bg-gray-700 hover:text-gray-100" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}`
                  }`}
              >
                <span>
                  {React.cloneElement(item.icon, { size: 24, className: `${darkMode ? "text-green-400" : ""}` })}
                </span>
                {(isMobile || !isCollapsed) && <span>{item.name}</span>}
              </button>
              {/* Divider line */}
              {idx < MENU_ITEMS.length - 1 && (
                <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />
              )}
            </React.Fragment>
          ))}
        </nav>
      </motion.div>

      {/* Backdrop on mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}

export default Sidebar;

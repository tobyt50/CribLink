import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Menu,
  ChevronLeft,
  Home,
  Bookmark, // Changed Heart to Bookmark for Favourites icon
  Settings,
  LogOut, // Keep LogOut for now, but it's removed from the UI below.
  MessageSquare, // For Inquiries
  Search, // For Saved Searches
  X,
} from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import { AnimatePresence, motion } from 'framer-motion';

const MENU_ITEMS = [
  { name: 'Dashboard', to: '/client/dashboard', icon: <Home />, key: 'client-dashboard' },
  { name: 'Favourites', to: '/client/favourites', icon: <Bookmark />, key: 'client-favourites' },
  { name: 'Inquiries', to: '/client/inquiries', icon: <MessageSquare />, key: 'client-inquiries' },
  { name: 'Saved Searches', to: '/client/saved-searches', icon: <Search />, key: 'client-saved-searches' }, // Replaced 'Profile' with 'Saved Searches'
  { name: 'Settings', to: '/client/settings', icon: <Settings />, key: 'client-settings' },
];

const ClientSidebar = ({
  isMobile = false,
  isSidebarOpen = true,
  setIsSidebarOpen = () => {},
  collapsed, // Now received as a prop
  setCollapsed, // Now received as a prop
}) => {
  const { darkMode } = useTheme();
  const location = useLocation();

  const sidebarWidthClass = isMobile ? 'w-64' : collapsed ? 'w-20' : 'w-64';

  const sidebarClasses = `
    transition-all duration-300 /* Consistent transition duration with AdminSidebar */
    flex flex-col items-start ${isMobile ? 'pt-8' : 'pt-0'} pb-10
    h-screen fixed top-14 left-0 z-40
    ${sidebarWidthClass}
    ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}
    ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
  `;

  // Consistent transition for Framer Motion components (0.3s)
  const consistentTransition = { duration: 0.1, ease: 'easeInOut' };

  return (
    <>
      <motion.div
        className={sidebarClasses}
        initial={isMobile ? { x: '-100%' } : false}
        animate={isMobile ? { x: isSidebarOpen ? '0%' : '-100%' } : {}}
        transition={consistentTransition} /* Applied consistent transition */
      >
        {/* Sidebar Header - consistent with AdminSidebar's toggle button area */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            className={`flex flex-col items-center py-3 mb-6 w-full border-b px-6 hover:bg-gray-100
              ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200"}`}
          >
            {collapsed ? (
              <>
                <Menu className={`${darkMode ? "text-gray-300" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Expand</span>
              </>
            ) : (
              <>
                <ChevronLeft className={`${darkMode ? "text-gray-300" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Collapse</span>
              </>
            )}
          </button>
        )}
         {/* Mobile close button: repositioned for mobile-first approach */}
         {isMobile && (
            <div className="w-full flex px-6 mb-2">
                <button onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar" className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <X size={24} />
                </button>
            </div>
        )}

        {/* Navigation */}
        <nav className="flex flex-col w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <NavLink
                to={item.to}
                onClick={() => {
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center gap-4 w-full px-6 py-3 transition-all duration-200
                    ${isActive
                      ? (darkMode ? 'bg-gray-900 text-green-200 font-semibold border-l-4 border-green-400' : 'bg-green-100 text-green-800 font-semibold border-l-4 border-green-600')
                      : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')
                    }`
                }
              >
                <span>{React.cloneElement(item.icon, { size: 24 })}</span>
                {(isMobile || !collapsed) && <span className="text-sm font-medium">{item.name}</span>}
              </NavLink>
              {/* Add hr separator only if not the last item and not in collapsed mode (on desktop) */}
              {idx < MENU_ITEMS.length - 1 && (!collapsed || isMobile) && <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />}
            </React.Fragment>
          ))}
        </nav>
        {/* Removed Logout Button from here */}
      </motion.div>

      {/* Backdrop on mobile */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            transition={consistentTransition} /* Applied consistent transition */
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ClientSidebar;

import React from 'react';
import { NavLink } from 'react-router-dom';
// motion and AnimatePresence are not directly used in the current component logic
// but are kept as they were in the original file. If not used by visual animations
// within the sidebar, they could be removed to reduce bundle size.
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  ChevronLeft,
  Home,
  Users, // For Clients
  LayoutGrid, // For Listings
  Inbox, // For Inquiries
  BarChart2, // For Analytics
  FileText, // For Reports
  Archive, // For Archive
  Settings, // For Settings
  X,
  Bookmark
} from 'lucide-react'; // Using lucide-react for icons
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

// Define the navigation links with lucide-react icons
const MENU_ITEMS = [
  { name: 'Dashboard', to: '/agent/dashboard', icon: <Home />, key: 'dashboard' },
  { name: 'Clients', to: '/agent/clients', icon: <Users />, key: 'clients' },
  { name: 'Listings', to: '/agent/listings', icon: <LayoutGrid />, key: 'listings' },
  { name: 'Inquiries', to: '/agent/inquiries', icon: <Inbox />, key: 'inquiries' },
  { name: 'Analytics', to: '/agent/analytics', icon: <BarChart2 />, key: 'analytics' },
  { name: 'Favourites', to: '/favourites', icon: <Bookmark />, key: 'favourites' },
  { name: 'Archive', to: '/agent/archived-clients', icon: <Archive />, key: 'archive' },
  { name: 'Settings', to: '/agent/settings', icon: <Settings />, key: 'settings' },
];

/**
 * AgentSidebar Component
 * @param {object} props - The component props.
 * @param {boolean} props.collapsed - State indicating if the sidebar is collapsed (for desktop).
 * @param {function} props.setCollapsed - Function to toggle the collapsed state.
 * @param {string} props.activeSection - The currently active section key.
 * @param {function} props.setActiveSection - Function to set the active section.
 * @param {boolean} props.isMobile - State indicating if the current view is mobile.
 * @param {boolean} props.isSidebarOpen - State controlling the sidebar's visibility on mobile.
 * @param {function} props.setIsSidebarOpen - Function to toggle the sidebar's visibility on mobile.
 */
const AgentSidebar = ({
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
  isMobile,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { darkMode } = useTheme(); // Use the dark mode context

  // Determine sidebar width based on mobile view or collapsed state
  const sidebarWidthClass = isMobile ? 'w-64' : collapsed ? 'w-20' : 'w-64';

  // Define dynamic CSS classes for the sidebar container
  const sidebarClasses = `
    transition-all duration-300 shadow-2xl border-r
    flex flex-col items-start ${isMobile ? 'pt-8' : 'pt-0'} pb-10
    h-screen fixed top-14 left-0 z-50
    ${sidebarWidthClass}
    ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}
    ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
  `;

  return (
    <>
      <div className={sidebarClasses}>
        {/* Mobile close button - only visible on mobile when sidebar is open */}
        {isMobile && (
          <div className="w-full flex px-6 mb-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
              className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Toggle Button - only desktop */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            className={`flex flex-col items-center py-3 mb-6 w-full border-b px-6 hover:bg-gray-100
              ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200"}`}
          >
            {collapsed ? (
              // Display Menu icon and 'Expand' text when collapsed
              <>
                <Menu className={`${darkMode ? "text-gray-300" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Expand</span>
              </>
            ) : (
              // Display ChevronLeft icon and 'Collapse' text when expanded
              <>
                <ChevronLeft className={`${darkMode ? "text-gray-300" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Collapse</span>
              </>
            )}
          </button>
        )}

        {/* Navigation links */}
        <nav className="flex flex-col w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <NavLink
                to={item.to}
                onClick={() => {
                  // Set active section and close sidebar on mobile if applicable
                  if (typeof setActiveSection === 'function') {
                    setActiveSection(item.key);
                  }
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  // Apply dynamic styling based on active state and dark mode
                  `flex items-center gap-4 w-full px-6 py-3 transition-all ${
                    isActive || activeSection === item.key
                      ? (darkMode ? 'bg-gray-900 text-green-200 font-semibold border-l-4 border-green-400' : 'bg-green-100 text-green-800 font-semibold border-l-4 border-green-600')
                      : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')
                  }`
                }
              >
                {/* Render the icon and name for the menu item */}
                <span>{React.cloneElement(item.icon, { size: 24 })}</span>
                {(isMobile || !collapsed) && <span>{item.name}</span>}
              </NavLink>
              {/* Add a horizontal rule between menu items, except for the last one */}
              {idx < MENU_ITEMS.length - 1 && <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Backdrop on mobile - visible when sidebar is open on mobile to close it on click outside */}
      {isMobile && isSidebarOpen && (
        <div
          className={`fixed inset-0 z-40 md:hidden ${darkMode ? 'bg-gray-900 bg-opacity-70' : 'bg-black bg-opacity-20'}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default AgentSidebar;

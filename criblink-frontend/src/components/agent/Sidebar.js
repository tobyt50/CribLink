import React from 'react';
import { NavLink } from 'react-router-dom';
<<<<<<< HEAD
import { motion, AnimatePresence } from 'framer-motion';
=======
import { motion } from 'framer-motion';
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
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
<<<<<<< HEAD
  X, // Import X icon for mobile close button
} from 'lucide-react'; // Using lucide-react for icons
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

// Define the navigation links with lucide-react icons
const MENU_ITEMS = [ // Renamed to MENU_ITEMS for consistency with AdminSidebar
=======
} from 'lucide-react'; // Using lucide-react for icons

// Define the navigation links with lucide-react icons
const links = [
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  { name: 'Dashboard', to: '/agent/dashboard', icon: <Home />, key: 'dashboard' },
  { name: 'Clients', to: '/agent/clients', icon: <Users />, key: 'clients' },
  { name: 'Listings', to: '/agent/listings', icon: <LayoutGrid />, key: 'listings' },
  { name: 'Inquiries', to: '/agent/inquiries', icon: <Inbox />, key: 'inquiries' },
  { name: 'Analytics', to: '/agent/analytics', icon: <BarChart2 />, key: 'analytics' },
  { name: 'Reports', to: '/agent/reports', icon: <FileText />, key: 'reports' },
  { name: 'Archive', to: '/agent/archived-clients', icon: <Archive />, key: 'archive' },
  { name: 'Settings', to: '/agent/settings', icon: <Settings />, key: 'settings' },
];

const AgentSidebar = ({
<<<<<<< HEAD
  collapsed, // Expecting collapsed state from parent (for desktop)
  setCollapsed, // Expecting setCollapsed function from parent (for desktop)
  activeSection, // Expecting activeSection state from parent
  setActiveSection, // Expecting setActiveSection function from parent
  isMobile = false, // New prop: indicates if current view is mobile
  isSidebarOpen = true, // New prop: controls sidebar visibility on mobile
  setIsSidebarOpen = () => {}, // New prop: function to toggle sidebar on mobile
}) => {
  const { darkMode } = useTheme(); // Use the dark mode context

  // On mobile: always expanded (no collapse)
  // On desktop: respect collapsed state
  const sidebarWidthClass = isMobile ? 'w-64' : collapsed ? 'w-20' : 'w-64';

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
            <button onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar" className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
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

        {/* Navigation */}
        <nav className="flex flex-col w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <NavLink
                to={item.to}
                onClick={() => {
                  setActiveSection(item.key);
                  if (isMobile) setIsSidebarOpen(false); // Close sidebar on mobile after clicking a link
                }}
                className={({ isActive }) =>
                  `flex items-center gap-4 w-full px-6 py-3 transition-all ${
                    isActive || activeSection === item.key
                      ? (darkMode ? 'bg-green-700 text-green-200 font-semibold border-l-4 border-green-400' : 'bg-green-100 text-green-800 font-semibold border-l-4 border-green-600')
                      : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')
                  }`
                }
              >
                <span>{React.cloneElement(item.icon, { size: 24 })}</span>
                {(isMobile || !collapsed) && <span>{item.name}</span>}
              </NavLink>
              {idx < MENU_ITEMS.length - 1 && <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Backdrop on mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
=======
  collapsed, // Expecting collapsed state from parent
  setCollapsed, // Expecting setCollapsed function from parent
  activeSection, // Expecting activeSection state from parent
  setActiveSection, // Expecting setActiveSection function from parent
}) => {
  return (
    <div
      className={`transition-all duration-300 bg-white shadow-2xl border-r border-gray-200
        ${collapsed ? "w-20" : "w-64"} flex flex-col items-start pt-6 pb-10 h-screen fixed top-0 left-0 z-40`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
        className="flex flex-col items-center py-3 mb-8 focus:outline-none border-b border-gray-200 w-full px-6 transition duration-150 ease-in-out hover:bg-gray-100"
      >
        {collapsed ? (
          <>
            <Menu className="text-gray-700" size={24} />
            <span className="mt-1 text-xs font-semibold text-gray-600 select-none">Menu</span>
          </>
        ) : (
          <>
            <ChevronLeft className="text-gray-700" size={24} />
            <span className="mt-1 text-xs font-semibold text-gray-600 select-none">Close</span>
          </>
        )}
      </button>

      {/* Menu Items - Scrollable section */}
      <nav className="flex flex-col w-full flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 scrollbar-track-transparent">
        {links.map((item, idx) => (
          <React.Fragment key={item.key}>
            <NavLink
              to={item.to}
              onClick={() => setActiveSection(item.key)}
              className={({ isActive }) =>
                `flex items-center gap-4 w-full px-6 py-3 transition-all duration-150 ease-in-out ${
                  isActive || activeSection === item.key // Use activeSection for consistency
                    ? "bg-green-100 text-green-800 font-semibold border-l-4 border-green-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`
              }
            >
              <span>{React.cloneElement(item.icon, { size: 24 })}</span>
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
            {idx < links.length - 1 && <hr className="border-gray-100 mx-6" />}
          </React.Fragment>
        ))}
      </nav>
    </div>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  );
};

export default AgentSidebar;

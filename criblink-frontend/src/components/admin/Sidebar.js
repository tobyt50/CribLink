import React from 'react';
import { NavLink } from 'react-router-dom';
<<<<<<< HEAD
import {
  Menu,
  ChevronLeft,
  Home,
  Users,
  Shield,
  LayoutGrid,
  Inbox,
  BarChart2,
  FileText,
  Settings,
  X,
} from 'lucide-react';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

=======
import { motion } from 'framer-motion';
import {
  Menu,
  ChevronLeft,
  Home, // For Dashboard
  Users, // For Users
  Shield, // For Staff
  LayoutGrid, // For Listings
  Inbox, // For Inquiries
  BarChart2, // For Analytics
  FileText, // For Reports
  Settings, // For Settings
} from 'lucide-react'; // Using lucide-react for icons

// Define the navigation links with lucide-react icons
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
const MENU_ITEMS = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: <Home />, key: 'dashboard' },
  { name: 'Users', to: '/admin/users', icon: <Users />, key: 'users' },
  { name: 'Staff', to: '/admin/staff', icon: <Shield />, key: 'staff' },
  { name: 'Listings', to: '/admin/listings', icon: <LayoutGrid />, key: 'listings' },
  { name: 'Inquiries', to: '/admin/inquiries', icon: <Inbox />, key: 'inquiries' },
  { name: 'Analytics', to: '/admin/analytics', icon: <BarChart2 />, key: 'analytics' },
  { name: 'Reports', to: '/admin/reports', icon: <FileText />, key: 'reports' },
  { name: 'Settings', to: '/admin/settings', icon: <Settings />, key: 'settings' },
];

const AdminSidebar = ({
<<<<<<< HEAD
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
  isMobile = false,
  isSidebarOpen = true,
  setIsSidebarOpen = () => {},
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
        {/* Mobile close button */}
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
                  if (isMobile) setIsSidebarOpen(false);
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

      {/* Profile area removed as requested */}

      {/* Menu Items - Scrollable section */}
      <nav className="flex flex-col w-full flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 scrollbar-track-transparent">
        {MENU_ITEMS.map((item, idx) => (
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
            {idx < MENU_ITEMS.length - 1 && <hr className="border-gray-100 mx-6" />}
          </React.Fragment>
        ))}
      </nav>
    </div>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  );
};

export default AdminSidebar;

import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  ChevronLeft,
  Home,
  LayoutGrid, // For Listings
  Users, // For Members and Clients
  Settings, // For Settings
  X,
  Shield,
  FileText,
  Landmark, // For Agency Info
  MessageSquare // For Inquiries
} from 'lucide-react';
import { useTheme } from '../../layouts/AppShell.js';

// Define the menu items specifically for Agency Admin
const MENU_ITEMS = [
  { name: 'Dashboard', to: '/agency/dashboard', icon: <Home />, key: 'dashboard' },
  { name: 'Listings', to: '/agency/listings', icon: <LayoutGrid />, key: 'listings' }, // Updated path
  { name: 'Members', to: '/agency/members', icon: <Users />, key: 'members' },
  { name: 'Clients', to: '/agency/clients', icon: <Shield />, key: 'clients' }, // Added Clients
  { name: 'Legal Docs', to: '/documents', icon: <FileText />, key: 'documents' },
  { name: 'Inquiries', to: '/agency/inquiries', icon: <MessageSquare />, key: 'inquiries' }, // NEW: Added Inquiries
  // Note: Properties route is not explicitly in App.js agencyAdminRoutes, but added here for completeness if it exists
  // { name: 'Properties', to: '/agency/properties', icon: <Home />, key: 'properties' },
  { name: 'Settings', to: '/agency/settings', icon: <Settings />, key: 'settings' },
];

const AgencyAdminSidebar = ({
  collapsed, // Now directly receives the collapsed state from parent
  setCollapsed, // Receives the setter function from parent
  activeSection,
  setActiveSection,
  isMobile = false,
  isSidebarOpen = true,
  setIsSidebarOpen = () => {},
}) => {
  const { darkMode } = useTheme();

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
            onClick={() => setCollapsed(!collapsed)} // Use the passed setCollapsed
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
                  if (typeof setActiveSection === 'function') {
                    setActiveSection(item.key);
                  }
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center gap-4 w-full px-6 py-3 transition-all ${
                    isActive || activeSection === item.key
                      ? (darkMode ? 'bg-gray-900 text-green-200 font-semibold border-l-4 border-green-400' : 'bg-green-100 text-green-800 font-semibold border-l-4 border-green-600')
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
          className={`fixed inset-0 z-40 md:hidden ${darkMode ? 'bg-gray-900 bg-opacity-70' : 'bg-black bg-opacity-20'}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default AgencyAdminSidebar;

import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  ChevronLeft,
  Home,
  Bookmark,
  Settings,
  MessageSquare,
  Search,
  X,
  Users, // NEW: Import Users icon for Agents page
} from 'lucide-react';
import { useTheme } from '../../layouts/AppShell'; // Ensure .js extension for consistency

const MENU_ITEMS = [
  { name: 'Dashboard', to: '/client/dashboard', icon: <Home />, key: 'client-dashboard' },
  { name: 'Favourites', to: '/favourites', icon: <Bookmark />, key: 'client-favourites' },
  { name: 'Agents', to: '/client/agents', icon: <Users />, key: 'client-agents' }, // NEW: Added Agents page link
  { name: 'Inquiries', to: '/client/inquiries', icon: <MessageSquare />, key: 'client-inquiries' },
];

const ClientSidebar = ({
  isMobile = false,
  isSidebarOpen = true,
  setIsSidebarOpen = () => {},
  collapsed,
  setCollapsed,
  activeSection, // New prop for active section
  setActiveSection, // New prop for setting active section
}) => {
  const { darkMode } = useTheme();

  // On mobile: always expanded (no collapse)
  // On desktop: respect collapsed state
  const sidebarWidthClass = isMobile ? 'w-64' : collapsed ? 'w-20' : 'w-64';

  const sidebarClasses = `
    transition-all duration-300 shadow-2xl border-r
    flex flex-col items-start pb-10
    h-screen fixed top-14 left-0 z-50 /* Z-index changed to 50 for consistency */
    ${sidebarWidthClass}
    ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}
    ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
  `;

  // No Framer Motion on the outer div for consistency with AdminSidebar
  return (
    <>
      <div className={sidebarClasses}>

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
                  if (typeof setActiveSection === 'function') {
                    setActiveSection(item.key);
                  }
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center gap-4 w-full px-6 py-3 transition-all ${
                    isActive || activeSection === item.key // Use activeSection for styling
                      ? (darkMode ? 'bg-gray-900 text-green-200 font-semibold border-l-4 border-green-400' : 'bg-green-100 text-green-800 font-semibold border-l-4 border-green-600')
                      : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-gray-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')
                  }`
                }
              >
                <span>{React.cloneElement(item.icon, { size: 24 })}</span>
                {(isMobile || !collapsed) && <span>{item.name}</span>} {/* Removed font-medium for consistency */}
              </NavLink>
              {idx < MENU_ITEMS.length - 1 && <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />} {/* Simplified condition */}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Backdrop on mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className={`fixed inset-0 z-40 md:hidden ${darkMode ? 'bg-gray-900 bg-opacity-70' : 'bg-black bg-opacity-20'}`} // Styling for backdrop
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default ClientSidebar;

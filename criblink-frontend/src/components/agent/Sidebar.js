import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'lucide-react'; // Using lucide-react for icons

// Define the navigation links with lucide-react icons
const links = [
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
  );
};

export default AgentSidebar;

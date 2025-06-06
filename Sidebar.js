import React from 'react';
import { NavLink } from 'react-router-dom';
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
  );
};

export default AdminSidebar;

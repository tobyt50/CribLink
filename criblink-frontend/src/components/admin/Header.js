// /components/admin/Header.js
import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

const AdminHeader = ({ title, onToggleSidebar }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Hamburger menu - only on small screens */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden text-gray-700 focus:outline-none"
        aria-label="Toggle sidebar"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <h1 className="text-2xl font-semibold text-green-700">{title}</h1>
    </div>
  );
};

export default AdminHeader;

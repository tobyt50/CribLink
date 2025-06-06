import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, X, FileText } from 'lucide-react'; // Import Menu, X, and FileText icons
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

// Reusable Dropdown Component (embedded directly in Staff.js)
const Dropdown = ({ options, value, onChange, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme(); // Use the dark mode context within the dropdown

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        delayChildren: 0.05,
        staggerChildren: 0.02,
      },
    },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: "easeOut" } },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const selectedOptionLabel = options.find(option => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:ring focus:ring-green-100 transition-all duration-200
          ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500" : "bg-white border-gray-300 text-gray-500 hover:border-green-500"}`}
      >
        <span className="overflow-hidden truncate">{selectedOptionLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 overflow-hidden transform origin-top
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                variants={itemVariants}
                whileHover={{ x: 5 }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200
                  ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { motion } from 'framer-motion';
// Removed AdminHeader as it's no longer needed with the new sidebar structure
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalStaff, setTotalStaff] = useState(0);
  const { darkMode } = useTheme(); // Use the dark mode context

  // State for sidebar visibility and collapse, consistent with Dashboard.js and Listings.js
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for active section in the sidebar, consistent with Dashboard.js and Listings.js
  const [activeSection, setActiveSection] = useState('staff'); // Set default active section for Staff page

  const [actionSelections, setActionSelections] = useState({});
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const exportDropdownRef = useRef(null);
  const limit = 10;

  // State for mobile view and sidebar open/close, consistent with Inquiries.js
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const fetchStaff = async () => {
    const params = new URLSearchParams({ search, page, limit, sort: sortKey, direction: sortDirection });
    try {
      const res = await fetch(`http://localhost:5000/admin/staff?${params.toString()}`);
      const data = await res.json();
      setStaffList(data.staff);
      setTotalStaff(data.total);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setStaffList([]); // Ensure staffList is empty on error
      setTotalStaff(0); // Ensure totalStaff is 0 on error
    }
  };

  useEffect(() => { fetchStaff(); }, [search, page, sortKey, sortDirection]);

  // Handle window resize for mobile view, consistent with Inquiries.js
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Close sidebar on mobile, open on desktop
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Removed the resize effect as AdminSidebar is now fixed and manages its own collapse state.

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortClick = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setPage(1);
  };

  // Render sort icon based on current sort key and direction, consistent with Inquiries.js
  const renderSortIcon = (key) =>
    sortKey === key ? (
      sortDirection === 'asc' ? (
        <ArrowUpIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      ) : (
        <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      )
    ) : (
      <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
    );

  const handleExportCsv = async (scope) => {
    if ((scope === 'current' && staffList.length === 0) || (scope === 'all' && totalStaff === 0)) {
      // Replaced alert with a custom message or modal if needed in a real app
      console.log(`No staff data found for ${scope} export.`);
  const renderPersistentSortIcon = (key) => {
    const isSorted = sortKey === key;
    const iconClass = 'h-4 w-4';
    if (!isSorted) return <ArrowDownIcon className={`${iconClass} text-gray-400`} />;
    return sortDirection === 'asc'
      ? <ArrowUpIcon className={`${iconClass} text-green-700`} />
      : <ArrowDownIcon className={`${iconClass} text-green-700`} />;
  };

  const handleExportCsv = async (scope) => {
    if ((scope === 'current' && staffList.length === 0) || (scope === 'all' && totalStaff === 0)) {
      alert(`No staff data found for ${scope} export.`);
      setIsExportDropdownOpen(false);
      return;
    }
    let data = staffList;
    if (scope === 'all') {
      const params = new URLSearchParams({ search, sort: sortKey, direction: sortDirection });
      try {
        const res = await fetch(`http://localhost:5000/admin/staff?${params.toString()}`);
        const fullData = await res.json();
        data = fullData.staff || fullData;
      } catch (err) {
        console.error('Export fetch error:', err);
        // Replaced alert with a custom message or modal if needed in a real app
        alert('Export failed.');
        return;
      }
    }

    const headers = ['Staff ID', 'Full Name', 'Role', 'Department', 'Email', 'Phone', 'Start Date', 'Status', 'User ID'];
    const headers = ['Employee ID', 'Full Name', 'Role', 'Department', 'Email', 'Phone', 'Start Date', 'Status', 'User ID'];
    const csvRows = data.map(s => [
      s.employee_id, s.full_name, s.role, s.department, s.email, s.phone,
      formatDate(s.start_date), s.status || 'N/A', s.user_id || 'N/A'
    ].map(f => `"${String(f).replace(/"/g, '""')}"`));

    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'staff_directory.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
  };

  const handleDelete = async (id) => {
    // Replaced window.confirm with a custom message or modal if needed in a real app
    console.log('Delete functionality not yet implemented.');
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      alert('Delete functionality not yet implemented.');
    }
  };

  const handleStatusToggle = async (id, status) => {
    const newStatus = status === 'active' ? 'suspended' : 'active';
    // Replaced alert with a custom message or modal if needed in a real app
    console.log(`Status toggle to: ${newStatus} not yet implemented.`);
  };

  const handleResetPassword = async (id) => {
    // Replaced alert with a custom message or modal if needed in a real app
    console.log(`Reset password for ${id} not yet implemented.`);
    alert(`Status toggle to: ${newStatus} not yet implemented.`);
  };

  const handleResetPassword = async (id) => {
    alert(`Reset password for ${id} not yet implemented.`);
  };

  const handleActionApply = (staff) => {
    const action = actionSelections[staff.employee_id];
    if (!action) return;
    if (action === 'suspend' || action === 'activate') handleStatusToggle(staff.employee_id, staff.status);
    else if (action === 'delete') handleDelete(staff.employee_id);
    else if (action === 'reset-password') handleResetPassword(staff.employee_id);
    setActionSelections(prev => ({ ...prev, [staff.employee_id]: '' }));
  };

  const totalPages = Math.ceil(totalStaff / limit);
  // Adjust contentShift based on isCollapsed state, consistent with Inquiries.js
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;
  // Adjust contentShift based on isCollapsed state, consistent with Dashboard.js and Listings.js
  const contentShift = isCollapsed ? 80 : 256;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
  };

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle - consistent with Inquiries.js */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className={`fixed top-20 left-4 z-50 p-2 rounded-full shadow-md ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
          initial={false}
          animate={{ rotate: isSidebarOpen ? 180 : 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isSidebarOpen ? 'close' : 'menu'}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      )}

      {/* AdminSidebar now receives collapsed, setCollapsed, activeSection, setActiveSection, isMobile, isSidebarOpen, setIsSidebarOpen */}
      <AdminSidebar
        collapsed={isMobile ? false : isCollapsed} // Sidebar is never collapsed in mobile view
        setCollapsed={isMobile ? () => {} : setIsCollapsed} // Disable setCollapsed on mobile
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile} // Pass isMobile prop
        isSidebarOpen={isSidebarOpen} // Pass isSidebarOpen prop
        setIsSidebarOpen={setIsSidebarOpen} // Pass setIsSidebarOpen prop
      />
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'} // Key for re-animation on mobile/desktop switch
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3 }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0" // Added overflow-auto and min-w-0
        style={{ minWidth: `calc(100% - ${contentShift}px)` }} // Ensure content doesn't shrink
      >
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Staff Directory</h1>
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      {/* AdminSidebar now receives collapsed, setCollapsed, activeSection, setActiveSection */}
      <AdminSidebar
        collapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <motion.div animate={{ marginLeft: contentShift }} transition={{ duration: 0.3 }} className="flex-1 p-4 md:p-6">
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className="text-2xl font-extrabold text-green-700 text-center">Staff Directory</h1>
        </div>
        {/* Desktop-only centered title, consistent with Dashboard.js and Listings.js */}
        <div className="hidden md:block mb-6">
          {/* Centered heading for desktop */}
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Staff Directory</h1>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`rounded-3xl p-6 shadow space-y-4 max-w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          {/* Mobile Controls */}
          {isMobile && (
            <div className="flex justify-between items-center mb-4">
              {/* Always open Search Bar for Mobile */}
              <div className={`flex items-center flex-grow rounded-xl shadow-sm border overflow-hidden mr-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`flex-grow py-2 px-4 focus:outline-none rounded-xl ${darkMode ? "bg-gray-700 text-white placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500"}`}
                />
              </div>

              {/* Export Dropdown for Mobile */}
              <div className="relative inline-block text-left" ref={exportDropdownRef}>
                <button
                  onClick={() => setIsExportDropdownOpen(p => !p)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-500 text-white shadow-md" // Added h-10 w-10 for height
                  title="Export"
                >
                  <FileText size={20} />
                </button>
                {isExportDropdownOpen && (
                  <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                    <div className="py-1">
                      <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current Page</button>
                      <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Staff</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desktop Filters and Controls */}
          {!isMobile && (
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className={`w-full md:w-1/3 py-2 px-4 border rounded-xl ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`} />
              <div className="relative inline-block text-left" ref={exportDropdownRef}>
                <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10">
                  Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
                </button>
                {isExportDropdownOpen && (
                  <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                    <div className="py-1">
                      <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current Page</button>
                      <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Staff</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Table container with horizontal scroll - consistent with Inquiries.js */}
          <div className="overflow-x-auto">
            <table className={`w-full mt-4 text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}> {/* Added min-w-max */}
              <thead>
                <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {["employee_id", "full_name", "role", "department", "email", "phone", "start_date", "status"].map(key => (
                    <th
                      key={key}
                      onClick={() => handleSortClick(key)}
                      className={`py-2 px-2 cursor-pointer select-none ${
                        sortKey === key ? (darkMode ? 'text-green-400' : 'text-green-700') : ''
                      }`}
                      // Set fixed widths for columns for better mobile formatting
                      style={{
                        width:
                          key === 'employee_id' ? '90px' :
                          key === 'full_name' ? '120px' :
                          key === 'role' ? '120px' :
                          key === 'department' ? '90px' : // Further reduced width for department
                          key === 'email' ? '160px' :
                          key === 'phone' ? '120px' :
                          key === 'start_date' ? '120px' :
                          key === 'status' ? '80px' : 'auto'
                      }}
                    >
                      <div className="flex items-center gap-1"> {/* Changed gap to 1 */}
                        <span>
                          {key === 'employee_id' ? 'Staff ID' : key === 'department' ? 'Dept.' : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {key !== 'actions' && renderSortIcon(key)}
                      </div>
                    </th>
                  ))}
                  <th className={`py-2 px-2 text-left whitespace-nowrap ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}> {/* Added divide-y and divide-gray-200 */}
                {staffList.length > 0 ? (
                  staffList.map(staff => (
                    <tr key={staff.employee_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}> {/* Added max-w-full break-words */}
                      <td className="py-2 px-2 max-w-[90px] truncate" title={staff.employee_id && staff.employee_id.length > 10 ? staff.employee_id : ''}>{staff.employee_id}</td> {/* Added max-w and truncate */}
                      <td className="py-2 px-2 max-w-[120px] truncate" title={staff.full_name && staff.full_name.length > 15 ? staff.full_name : ''}>{staff.full_name}</td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={staff.role && staff.role.length > 15 ? staff.role : ''}>{staff.role}</td>
                      <td className="py-2 px-2 max-w-[90px] truncate" title={staff.department && staff.department.length > 10 ? staff.department : ''}>{staff.department}</td> {/* Reduced max-w for department and adjusted truncation condition */}
                      <td className="py-2 px-2 max-w-[160px] truncate" title={staff.email && staff.email.length > 20 ? staff.email : ''}>{staff.email}</td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={staff.phone && staff.phone.length > 15 ? staff.phone : ''}>{staff.phone}</td>
                      <td className="py-2 px-2 max-w-[120px] truncate" title={formatDate(staff.start_date) && formatDate(staff.start_date).length > 15 ? formatDate(staff.start_date) : ''}>{formatDate(staff.start_date)}</td>
                      <td className={`py-2 px-2 max-w-[80px] truncate font-semibold ${
                          staff.status === 'active'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`} title={staff.status && staff.status.length > 10 ? staff.status : ''}>{staff.status || 'N/A'}</td> {/* Added styling for status */}
                      <td className="py-2 px-2 space-x-2 max-w-[150px]"> {/* Adjusted max-w */}
                        <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
                          <Dropdown
                            placeholder="Select Action"
                            options={[
                              { value: "", label: "Select Action" },
                              { value: staff.status === 'active' ? 'suspend' : 'activate', label: staff.status === 'active' ? 'Suspend' : 'Activate' },
                              { value: "reset-password", label: "Reset Password" },
                              { value: "delete", label: "Delete" },
                            ]}
                            value={actionSelections[staff.employee_id] || ''}
                            onChange={e => setActionSelections(prev => ({ ...prev, [staff.employee_id]: e }))}
                            className="w-full"
                          />
                          <button onClick={() => handleActionApply(staff)} className="text-xs text-white bg-green-500 hover:bg-green-600 rounded-lg px-2 py-1 w-full mt-0.5">Apply</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}> {/* Adjusted colSpan */}
                      No staff members found.
                    </td>
                  </tr>
          <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">Staff Directory</h1>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-3xl p-6 shadow space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full md:w-1/3 py-2 px-4 border border-gray-300 rounded-xl" />
            <div className="relative inline-block text-left" ref={exportDropdownRef}>
              <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-400 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
              </button>
              {isExportDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button onClick={() => handleExportCsv('current')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-xl">Current Page</button>
                    <button onClick={() => handleExportCsv('all')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-xl">All Staff</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full mt-4 text-sm table-fixed">
              <thead>
                <tr className="text-gray-500">
                  {["employee_id", "full_name", "role", "department", "email", "phone", "start_date", "status"].map(key => (
                    <th key={key} onClick={() => handleSortClick(key)} className="py-2 px-2 cursor-pointer text-left hover:text-green-700 align-middle">
                      <div className="flex items-center gap-2">
                        <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        {renderPersistentSortIcon(key)}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-2 text-left whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => (
                  <tr key={staff.employee_id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-2">{staff.employee_id}</td>
                    <td className="py-2 px-2">{staff.full_name}</td>
                    <td className="py-2 px-2 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={staff.role}>{staff.role}</td>
                    <td className="py-2 px-2">{staff.department}</td>
                    <td className="py-2 px-2 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={staff.email}>{staff.email}</td>
                    <td className="py-2 px-2">{staff.phone}</td>
                    <td className="py-2 px-2">{formatDate(staff.start_date)}</td>
                    <td className="py-2 px-2">{staff.status || 'N/A'}</td>
                    <td className="text-left px-2">
                      <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
                        <select className="py-1 px-2 border rounded-xl text-sm w-full" value={actionSelections[staff.employee_id] || ''} onChange={e => setActionSelections(prev => ({ ...prev, [staff.employee_id]: e.target.value }))}>
                          <option value="">Select Action</option>
                          <option value={staff.status === 'active' ? 'suspend' : 'activate'}>{staff.status === 'active' ? 'Suspend' : 'Activate'}</option>
                          <option value="reset-password">Reset Password</option>
                          <option value="delete">Delete</option>
                        </select>
                        <button onClick={() => handleActionApply(staff)} className="text-xs text-white bg-green-400 hover:bg-green-500 rounded-xl px-2 py-1 w-full">Apply</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-gray-400">No staff members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - consistent with Users.js */}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
            >
              Prev
            </button>
            <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
          <div className="flex justify-between items-center pt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 rounded-xl bg-gray-100 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(prev => prev + 1)}
              className="px-4 py-2 rounded-xl bg-gray-100 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Staff;

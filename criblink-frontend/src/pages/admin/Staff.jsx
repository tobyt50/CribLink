import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, X, FileText, LayoutGrid, LayoutList, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import axiosInstance from '../../api/axiosInstance';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import StaffCard from '../../components/admin/StaffCard'; // Import the new StaffCard component
import API_BASE_URL from '../../config'; // Assuming API_BASE_URL is defined here or imported

// Reusable Dropdown Component (embedded directly in Staff.js)
const Dropdown = ({ options, value, onChange, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme();

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
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
          ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
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

// Skeleton component for Staff page
const StaffSkeleton = ({ darkMode, viewMode }) => (
  <div className={`animate-pulse space-y-4`}>
       {/* Content Skeleton based on viewMode */}
    {viewMode === 'graphical' ? (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => ( // 9 skeleton cards for graphical view
          <div key={i} className={`rounded-xl p-4 shadow-sm h-48 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <div className={`w-20 h-20 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <div className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="overflow-x-auto" style={{ overflow: "visible" }}>
        <table className={`w-full mt-4 text-sm  table-auto`}>
          <thead>
            <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {[...Array(9)].map((_, i) => ( // 9 skeleton table headers
                <th key={i} className={`py-2 px-2`}>
                  <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
            {[...Array(10)].map((_, i) => ( // 10 skeleton table rows
              <tr key={i} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                {[...Array(9)].map((_, j) => ( // 9 skeleton cells per row
                  <td key={j} className="py-2 px-2">
                    <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Pagination Skeleton */}
    <div className="flex justify-center items-center space-x-4 mt-4">
      <div className={`h-8 w-16 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-8 w-16 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    </div>
  </div>
);


const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('start_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalStaff, setTotalStaff] = useState(0);
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state

  // Initialize viewMode from localStorage, influenced by 'defaultListingsView'
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultListingsView') || 'simple');

  // Use the useSidebarState hook
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('staff');

  const [actionSelections, setActionSelections] = useState({});
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const exportDropdownRef = useRef(null);
  const limit = viewMode === 'simple' ? 10 : 9; // 10 for table, 9 for grid (3x3)

  /**
   * Formats an ISO date string into a localized date string.
   * @param {string} isoDate - The ISO date string to format.
   * @returns {string} The formatted date string or 'Invalid Date' if parsing fails.
   */
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const fetchStaff = useCallback(async () => {
    setIsLoading(true); // Set loading to true when fetching starts
    const params = new URLSearchParams({ search, page, limit, sort: sortKey, direction: sortDirection });
    const token = localStorage.getItem('token');
    try {
        const res = await axiosInstance.get(`${API_BASE_URL}/admin/staff?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = res.data;

        const staffWithProfilePictures = data.staff.map(staff => {
          let profilePictureUrl = staff.profile_picture_url;
          // Fallback to a placeholder if profilePictureUrl is null, undefined, or empty
          if (!profilePictureUrl) {
            profilePictureUrl = `https://placehold.co/80x80/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${staff.full_name.charAt(0).toUpperCase()}`;
          }
          return { ...staff, profile_picture_url: profilePictureUrl };
        });

        setStaffList(staffWithProfilePictures);
        setTotalStaff(data.total);
    } catch (error) {
        let errorMessage = 'Failed to fetch staff data. Please try again.';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        showMessage(errorMessage, 'error');
        setStaffList([]);
        setTotalStaff(0);
    } finally {
        setIsLoading(false); // Set loading to false when fetching is complete (success or error)
    }
  }, [search, page, limit, sortKey, sortDirection, showMessage, darkMode]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

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

  const renderSortIcon = (key) =>
    sortKey === key ? (
      sortDirection === 'asc' ? (
        <ArrowUpIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      ) : (
        <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      )
    ) : (
      <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
    );

  const handleExportCsv = async (scope) => {
    if ((scope === 'current' && staffList.length === 0) || (scope === 'all' && totalStaff === 0)) {
      showMessage(`No staff data found for ${scope} export.`, 'info');
      setIsExportDropdownOpen(false);
      return;
    }
    let data = staffList;
    try {
        if (scope === 'all') {
          const params = new URLSearchParams({ search, sort: sortKey, direction: sortDirection });
          const res = await axiosInstance.get(`${API_BASE_URL}/admin/staff?${params.toString()}`);
          const fullData = res.data;
          data = fullData.staff || fullData;
        }

        const headers = ['Staff ID', 'Full Name', 'Role', 'Department', 'Email', 'Phone', 'Start Date', 'Status', 'User ID', 'Profile Picture URL'];
        const csvRows = data.map(s => [
          s.employee_id, s.full_name, s.role, s.department, s.email, s.phone,
          formatDate(s.start_date), s.status || 'N/A', s.user_id || 'N/A', s.profile_picture_url || 'N/A'
        ].map(f => `"${String(f).replace(/"/g, '""')}"`));

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
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
        showMessage('Staff data exported successfully!', 'success');
    } catch (error) {
        let errorMessage = 'Failed to export staff to CSV. Please try again.';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        showMessage(errorMessage, 'error');
    }
  };

  const performDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showMessage('Authentication token not found. Please sign in.', 'error');
      return;
    }
    try {
        await axiosInstance.delete(`${API_BASE_URL}/admin/staff/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        showMessage(`Staff member ${id} deleted successfully.`, 'success');
        fetchStaff();
    } catch (error) {
        let errorMessage = 'Failed to delete staff member. Please try again.';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        showMessage(errorMessage, 'error');
    }
  };

  const handleDelete = (staffId) => {
    showConfirm({
      title: "Delete Staff Member",
      message: `Are you sure you want to permanently delete staff member ${staffId}? This action cannot be undone.`,
      onConfirm: () => performDelete(staffId),
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
  };

  const performStatusToggle = async (id, status) => {
    const newStatus = status === 'active' ? 'suspended' : 'active';
    const token = localStorage.getItem('token');
    if (!token) {
      showMessage('Authentication token not found. Please sign in.', 'error');
      return;
    }
    try {
        await axiosInstance.put(`${API_BASE_URL}/admin/staff/${id}/status`, { status: newStatus }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        showMessage(`Staff member ${id} status changed to ${newStatus}.`, 'success');
        fetchStaff();
    } catch (error) {
        let errorMessage = `Failed to change status for staff member ${id}. Please try again.`;
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        showMessage(errorMessage, 'error');
    }
  };

  const handleStatusToggle = (staff) => {
    const actionText = staff.status === 'active' ? 'suspend' : 'activate';
    const message = staff.status === 'active'
      ? `Are you sure you want to suspend staff member ${staff.full_name}? They will lose access to the system.`
      : `Are you sure you want to activate staff member ${staff.full_name}? They will regain access to the system.`;
    showConfirm({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Staff Member`,
      message: message,
      onConfirm: () => performStatusToggle(staff.employee_id, staff.status),
      confirmLabel: actionText.charAt(0).toUpperCase() + actionText.slice(1),
      cancelLabel: "Cancel"
    });
  };

  const performResetPassword = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showMessage('Authentication token not found. Please sign in.', 'error');
      return;
    }
    try {
        await axiosInstance.post(`${API_BASE_URL}/admin/staff/${id}/reset-password`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        showMessage(`Password reset link sent for staff member ${id}.`, 'success');
    } catch (error) {
        let errorMessage = `Failed to send password reset link for staff member ${id}. Please try again.`;
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        showMessage(errorMessage, 'error');
    }
  };

  const handleResetPassword = (staffId) => {
    showConfirm({
      title: "Reset Password",
      message: `Are you sure you want to send a password reset link to staff member ${staffId}?`,
      onConfirm: () => performResetPassword(staffId),
      confirmLabel: "Send Link",
      cancelLabel: "Cancel"
    });
  };


  const handleActionApply = (staff, action) => {
    if (!action) {
        showMessage('Please select an action to apply.', 'info');
        return;
    }
    if (action === 'suspend' || action === 'activate') handleStatusToggle(staff);
    else if (action === 'delete') handleDelete(staff.employee_id);
    else if (action === 'reset-password') handleResetPassword(staff.employee_id);
    setActionSelections(prev => ({ ...prev, [staff.employee_id]: '' }));
  };

  const totalPages = Math.ceil(totalStaff / limit);
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-4 md:px-0 min-h-screen flex flex-col`}>
      <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className={`absolute left-4 mt-5 p-2 rounded-lg shadow-sm transition hover:scale-105
            ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}
        >
          <ArrowLeft size={20} />
        </button>

      <AdminSidebar
        collapsed={isMobile ? false : isCollapsed}
        setCollapsed={isMobile ? () => {} : setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3 }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Staff Directory</h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Staff Directory</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
        >
          {/* Mobile Controls */}
          {isMobile && (
            <div className="flex justify-between items-center mb-4">
              <div className={`flex items-center flex-grow rounded-xl shadow-sm border overflow-hidden mr-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`flex-grow py-2 px-4 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 rounded-xl ${darkMode ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                />
              </div>

              <div className="flex gap-2 ml-2 items-center">
                <div className="relative inline-block text-left" ref={exportDropdownRef}>
                  <button
                    onClick={() => setIsExportDropdownOpen(p => !p)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-500 text-white shadow-md"
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
                <button
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                  onClick={() => { setViewMode('simple'); localStorage.setItem('defaultListingsView', 'simple'); }}
                  title="List View"
                >
                  <LayoutList className="h-5 w-5" />
                </button>
                <button
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                  onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultListingsView', 'graphical'); }}
                  title="Grid View"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop Filters and Controls */}
          {!isMobile && (
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className={`w-full md:w-1/3 py-2 px-4 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`} />
              <div className="flex gap-2 items-center">
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
                <button onClick={() => { setViewMode('simple'); localStorage.setItem('defaultListingsView', 'simple'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <LayoutList className="h-6 w-6" />
                </button>
                <button onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultListingsView', 'graphical'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <LayoutGrid className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {isLoading ? ( // Conditionally render skeleton when loading
            <StaffSkeleton darkMode={darkMode} viewMode={viewMode} />
          ) : staffList.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              No staff members found matching your criteria.
            </div>
          ) : (
            viewMode === 'graphical' ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {staffList.map(staff => (
                  <StaffCard
                    key={staff.employee_id}
                    staff={staff}
                    onActionApply={(staff, action) => handleActionApply(staff, action)}
                    actionSelections={actionSelections}
                    setActionSelections={setActionSelections}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ overflow: "visible" }}>
                <table className={`w-full mt-4 text-sm  table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <thead>
                    <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {["employee_id", "full_name", "role", "department", "email", "phone", "start_date", "status"].map(key => (
                        <th
                          key={key}
                          onClick={() => handleSortClick(key)}
                          className={`py-2 px-2 cursor-pointer select-none ${
                            sortKey === key ? (darkMode ? 'text-green-400' : 'text-green-700') : ''
                          }`}
                          style={{
                            width:
                              key === 'employee_id' ? '90px' :
                              key === 'full_name' ? '120px' :
                              key === 'role' ? '120px' :
                              key === 'department' ? '90px' :
                              key === 'email' ? '160px' :
                              key === 'phone' ? '120px' :
                              key === 'start_date' ? '120px' :
                              key === 'status' ? '80px' : 'auto'
                          }}
                        >
                          <div className="flex items-center gap-1">
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
                  <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                    {staffList.length > 0 ? (
                      staffList.map(staff => (
                        <tr key={staff.employee_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                          <td className="py-2 px-2 max-w-[90px] truncate" title={staff.employee_id && staff.employee_id.length > 10 ? staff.employee_id : ''}>{staff.employee_id}</td>
                          <td className="py-2 px-2 max-w-[120px] truncate" title={staff.full_name && staff.full_name.length > 15 ? staff.full_name : ''}>{staff.full_name}</td>
                          <td className="py-2 px-2 max-w-[120px] truncate" title={staff.role && staff.role.length > 15 ? staff.role : ''}>{staff.role}</td>
                          <td className="py-2 px-2 max-w-[90px] truncate" title={staff.department && staff.department.length > 10 ? staff.department : ''}>{staff.department}</td>
                          <td className="py-2 px-2 max-w-[160px] truncate" title={staff.email && staff.email.length > 20 ? staff.email : ''}>{staff.email}</td>
                          <td className="py-2 px-2 max-w-[120px] truncate" title={staff.phone && staff.phone.length > 15 ? staff.phone : ''}>{staff.phone}</td>
                          <td className="py-2 px-2 max-w-[120px] truncate" title={formatDate(staff.start_date) && formatDate(staff.start_date).length > 15 ? formatDate(staff.start_date) : ''}>{formatDate(staff.start_date)}</td>
                          <td className={`py-2 px-2 max-w-[80px] truncate font-semibold ${
                              staff.status === 'active'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`} title={staff.status && staff.status.length > 10 ? staff.status : ''}>{staff.status || 'N/A'}</td>
                          <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
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
                              {actionSelections[staff.employee_id] && (
                                <button
                                  onClick={() => handleActionApply(staff, actionSelections[staff.employee_id])}
                                  className="text-xs text-white bg-green-500 hover:bg-green-600 rounded-lg px-2 py-1 w-full mt-0.5"
                                >
                                  Apply
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          No staff members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}

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

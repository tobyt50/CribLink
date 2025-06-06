import React, { useEffect, useState, useRef } from 'react';
<<<<<<< HEAD
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, X, Search, FileText } from 'lucide-react'; // Import Menu, X, Search, and FileText icons
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

// Reusable Dropdown Component (embedded directly in Users.js)
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

=======
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortKey, setSortKey] = useState('date_joined');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
<<<<<<< HEAD
  const { darkMode } = useTheme(); // Use the dark mode context

  // State for sidebar responsiveness, matching Dashboard.js
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(false); // Only used on desktop
  const [activeSection, setActiveSection] = useState('users'); // Set active section to 'users'
=======

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('users');
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

  const [actionSelections, setActionSelections] = useState({});
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const exportDropdownRef = useRef(null);
  const limit = 10;

  // State for the confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState('');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
<<<<<<< HEAD
  // Corrected useState initialization for confirmModalAction
=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  const [confirmModalAction, setConfirmModalAction] = useState(() => () => {}); // Function to execute on confirmation

  // State for the alert modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [alertModalType, setAlertModalType] = useState('success'); // 'success' or 'error'

<<<<<<< HEAD

=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  // Function to show the alert modal
  const showCustomAlert = (message, type) => {
    setAlertModalMessage(message);
    setAlertModalType(type);
    setShowAlertModal(true);
  };

  // Function to close the alert modal
  const closeAlertModal = () => {
    setShowAlertModal(false);
    setAlertModalMessage('');
    setAlertModalType('success');
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  // Function to fetch users from the backend
  const fetchUsers = async () => {
    const params = new URLSearchParams({ search, role: roleFilter, page, limit, sort: sortKey, direction: sortDirection });
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setUsers(data.users); // Update the users state with the fetched data
      setTotalUsers(data.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showCustomAlert('Failed to fetch users. Please try again later.', 'error');
<<<<<<< HEAD
      setUsers([]); // Ensure users list is empty on error
      setTotalUsers(0); // Ensure total users is 0 on error
=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
    }
  };

  const location = useLocation();

<<<<<<< HEAD
  // Effect to handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Open on desktop, closed on mobile
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
  useEffect(() => {
    if (location.state?.roleFilter) {
      setRoleFilter(location.state.roleFilter);
    }
    if (location.state?.sortKey) {
      setSortKey(location.state.sortKey);
    }
    if (location.state?.sortDirection) {
      setSortDirection(location.state.sortDirection);
    }
  }, [location.state]);

  // Effect to re-fetch users whenever search, filter, pagination, or sort parameters change
  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page, sortKey, sortDirection]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) setIsExportDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortClick = (key) => {
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortKey(key);
    setPage(1);
  };

  const renderSortIcon = (key) => sortKey === key
    ? sortDirection === 'asc'
<<<<<<< HEAD
      ? <ArrowUpIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      : <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
    : <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;
=======
      ? <ArrowUpIcon className="h-4 w-4 inline text-green-700" />
      : <ArrowDownIcon className="h-4 w-4 inline text-green-700" />
    : <ArrowDownIcon className="h-4 w-4 inline text-gray-400" />;
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

  const handleExportCsv = async (scope) => {
    if ((scope === 'current' && users.length === 0) || (scope === 'all' && totalUsers === 0)) {
      showCustomAlert(scope === 'current' ? 'No user data on the current page.' : 'No user data found for full export.', 'error');
      setIsExportDropdownOpen(false);
      return;
    }

    let dataToExport = users;
    const token = localStorage.getItem('token');

    if (scope === 'all') {
      const params = new URLSearchParams({ search, role: roleFilter, sort: sortKey, direction: sortDirection });
      try {
        const res = await fetch(`http://localhost:5000/admin/users?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        dataToExport = data.users || data;
      } catch (err) {
        console.error('Export error:', err);
        showCustomAlert('Failed to fetch all user data for export.', 'error');
        setIsExportDropdownOpen(false);
        return;
      }
    }

    setIsExportDropdownOpen(false);
    const headers = ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Date Joined'];
    const csv = [headers.join(','), ...dataToExport.map(u => [u.user_id, u.full_name, u.email, u.role, u.status || 'active', formatDate(u.date_joined)].map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users_directory.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showCustomAlert('Export successful!', 'success');
  };

  // Function to handle user deletion logic
  const performDelete = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
        showCustomAlert('User deleted successfully.', 'success');
      } else {
        const errorData = await response.json();
        showCustomAlert(`Failed to delete user: ${errorData.message || response.statusText}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomAlert('An error occurred while trying to delete the user.', 'error');
    }
  };

  // Function to trigger delete confirmation
  const handleDelete = (userId) => {
    setConfirmModalTitle('Confirm Deletion');
    setConfirmModalContent('Are you sure you want to delete this user? This action cannot be undone.');
    setConfirmModalAction(() => () => performDelete(userId));
    setShowConfirmModal(true);
  };

  // Function to handle ban/unban logic
  const performBanToggle = async (userId, currentStatus) => {
    const actionText = currentStatus === 'banned' ? 'unban' : 'ban';
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
        showCustomAlert(`User ${actionText}ned successfully.`, 'success');
      } else {
        const errorData = await res.json();
        showCustomAlert(`Failed to ${actionText} user: ${errorData.message || res.statusText}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomAlert(`An error occurred while trying to ${actionText} the user.`, 'error');
    }
  };

  // Function to trigger ban/unban confirmation
  const handleBanToggle = (userId, status) => {
    const actionText = status === 'banned' ? 'unban' : 'ban';
    setConfirmModalTitle(`Confirm ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`);
    setConfirmModalContent(`Are you sure you want to ${actionText} this user?`);
    setConfirmModalAction(() => () => performBanToggle(userId, status));
    setShowConfirmModal(true);
  };

  // Function to handle role change logic
  const performRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    try {
      // Updated to use PUT method and /admin/users/:userId/role endpoint
      const res = await fetch(`http://localhost:5000/admin/users/${userId}/role`, {
        method: 'PUT', // Changed to PUT
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newRole: newRole }) // Ensure newRole is sent in the body
      });
      const data = await res.json();
      if (res.ok) {
        showCustomAlert(`Role changed to ${newRole} successfully.`, 'success');
      } else {
        showCustomAlert(data.error || 'Failed to change role', 'error');
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      showCustomAlert('An error occurred while trying to change the user role.', 'error');
    }
  };

  // Function to trigger role change confirmation
  const handleRoleChange = (userId, role) => {
    setConfirmModalTitle('Confirm Role Change');
    setConfirmModalContent(`Are you sure you want to change this user's role to ${role}?`);
    setConfirmModalAction(() => () => performRoleChange(userId, role));
    setShowConfirmModal(true);
  };

  const handleActionApply = (user) => {
    const action = actionSelections[user.user_id];
    if (!action) return;
    if (action === 'ban' || action === 'unban') handleBanToggle(user.user_id, user.status);
    else if (action === 'delete') handleDelete(user.user_id);
    else if (action.startsWith('role:')) handleRoleChange(user.user_id, action.split(':')[1]);
    setActionSelections(prev => ({ ...prev, [user.user_id]: '' }));
  };

  const totalPages = Math.ceil(totalUsers / limit);
<<<<<<< HEAD
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256; // Adjust content shift based on mobile and collapsed state
=======
  const contentShift = isCollapsed ? 80 : 256;
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

  // Confirmation Modal Component
  const ConfirmModal = ({ show, title, message, onConfirm, onCancel }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
<<<<<<< HEAD
        <div className={`p-6 rounded-xl shadow-xl max-w-sm w-full mx-4 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-gray-800"}`}>{title}</h2>
          <p className={`mb-6 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className={`px-4 py-2 rounded-xl transition-colors ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
=======
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
          <p className="mb-6 text-gray-700">{message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Alert Modal Component
  const AlertModal = ({ show, message, type, onClose }) => {
    if (!show) return null;

    const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className={`p-4 rounded-xl shadow-xl max-w-sm w-full mx-4 border-l-4 ${bgColor} ${borderColor}`}>
          <div className="flex justify-between items-center">
            <p className={`font-semibold ${textColor}`}>{message}</p>
            <button onClick={onClose} className={`text-lg font-bold ${textColor} hover:opacity-75`}>
              &times;
            </button>
          </div>
        </div>
      </div>
    );
  };

<<<<<<< HEAD
  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "agent", label: "Agent" },
    { value: "client", label: "Client" },
  ];

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}> {/* Added min-h-screen and flex-col */}
      {/* Mobile Sidebar Toggle Button */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen(prev => !prev)}
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

      {/* Sidebar */}
      <AdminSidebar
        collapsed={isMobile ? false : isCollapsed}
        setCollapsed={isMobile ? () => {} : setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3 }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0" // Added flex-1, overflow-auto, min-w-0
        style={{ minWidth: `calc(100% - ${contentShift}px)` }} // Ensure content doesn't shrink
      >
        {/* Headers */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Users</h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Users</h1>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`rounded-3xl p-6 shadow space-y-4 max-w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}> {/* Added max-w-full */}
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
                  className={`flex-grow py-2 px-4 focus:outline-none ${darkMode ? "bg-gray-700 text-white placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-500"}`}
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
                      <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Users</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Desktop Filters and Controls */}
          {!isMobile && (
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full md:w-1/3 py-2 px-4 border rounded-xl ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`} />
              
              {/* Removed the role filter dropdown from here */}

              <div className="relative inline-block text-left" ref={exportDropdownRef}>
                <button onClick={() => setIsExportDropdownOpen(p => !p)} className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10"> {/* Added h-10 for consistent height */}
                  Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
                </button>
                {isExportDropdownOpen && (
                  <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                    <div className="py-1">
                      <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current Page</button>
                      <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Users</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto"> {/* Added overflow-x-auto */}
            <table className={`w-full mt-4 text-left text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}> {/* Added table-fixed and min-w-max */}
              <thead>
                <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {['user_id', 'full_name', 'email', 'status', 'date_joined'].map((k) => (
                    <th
                      key={k}
                      onClick={() => handleSortClick(k)}
                      // Reduced horizontal padding from px-3 to px-2
                      className={`py-2 px-2 cursor-pointer select-none ${sortKey === k ? (darkMode ? 'text-green-400' : 'text-green-700') : ''}`} // Adjusted padding and added select-none
                      style={{
                        width:
                          k === 'user_id' ? '90px' :
                          k === 'full_name' ? '120px' :
                          k === 'email' ? '160px' :
                          k === 'status' ? '80px' :
                          k === 'date_joined' ? '120px' : 'auto'
                      }}
                    >
                      <div className="flex items-center gap-1"> {/* Changed gap to 1 */}
=======
  return (
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      <AdminSidebar
        collapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <motion.div animate={{ marginLeft: contentShift }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="flex-1 p-4 md:p-6">
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className="text-2xl font-extrabold text-green-700 text-center">Users</h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">Users</h1>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-3xl p-6 shadow space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full md:w-1/3 py-2 px-4 border border-gray-300 rounded-xl" />
            <div className="relative inline-block text-left" ref={exportDropdownRef}>
              <button onClick={() => setIsExportDropdownOpen(p => !p)} className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-400 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
              </button>
              {isExportDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button onClick={() => handleExportCsv('current')} className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-xl">Current Page</button>
                    <button onClick={() => handleExportCsv('all')} className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 rounded-xl">All Users</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full mt-4 text-left text-sm table-fixed">
              <thead>
                <tr className="text-gray-500">
                  {['user_id', 'full_name', 'email', 'status', 'date_joined'].map((k) => (
                    <th key={k} onClick={() => handleSortClick(k)} className="py-2 px-2 cursor-pointer hover:text-green-700 whitespace-nowrap text-left">
                      <div className="flex items-center justify-start gap-1">
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
                        <span>{k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        {renderSortIcon(k)}
                      </div>
                    </th>
                  ))}
<<<<<<< HEAD
                  <th className={`py-2 px-2 text-left ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ width: '90px' }}> {/* Adjusted padding and width */}
                    <Dropdown
                      placeholder="All Roles"
                      options={roleOptions}
                      value={roleFilter}
                      onChange={(value) => { setRoleFilter(value); setPage(1); }}
                      className="w-full"
                    />
                  </th>
                  <th className={`py-2 px-2 text-left whitespace-nowrap ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ width: '150px' }}>Actions</th> {/* Adjusted padding and width */}
                </tr>
              </thead>
              <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}> {/* Added divide-y and divide-gray-200 */}
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.user_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}> {/* Added cursor-default, max-w-full, break-words */}
                      <td className="py-2 px-2 max-w-[90px] truncate" title={user.user_id && user.user_id.length > 10 ? user.user_id : ''}>{user.user_id}</td> {/* Adjusted padding, max-w, truncate */}
                      <td title={user.full_name && user.full_name.length > 15 ? user.full_name : ''} className="py-2 px-2 max-w-[120px] truncate">{user.full_name}</td> {/* Adjusted padding, max-w, truncate */}
                      <td title={user.email && user.email.length > 20 ? user.email : ''} className="py-2 px-2 max-w-[160px] truncate">{user.email}</td> {/* Adjusted padding, max-w, truncate */}
                      <td className={`py-2 px-2 max-w-[80px] truncate font-semibold ${
                          user.status === 'banned'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`} title={user.status && user.status.length > 10 ? user.status : ''}>{user.status || 'active'}</td> {/* Adjusted padding, max-w, truncate and added styling for status */}
                      <td className="py-2 px-2 max-w-[120px] truncate" title={formatDate(user.date_joined) && formatDate(user.date_joined).length > 15 ? formatDate(user.date_joined) : ''}>{formatDate(user.date_joined)}</td> {/* Adjusted padding, max-w, truncate */}
                      <td className="py-2 px-2 max-w-[90px] truncate" title={user.role === 'user' ? 'Client' : user.role.charAt(0).toUpperCase() + user.role.slice(1) && user.role.length > 10 ? user.role : ''}>{user.role === 'user' ? 'Client' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td> {/* Adjusted padding, max-w, truncate */}
                      <td className="py-2 px-2 space-x-2 max-w-[150px]"> {/* Adjusted padding, space-x, max-w */}
                        <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
                          <Dropdown
                            placeholder="Select Action"
                            options={[
                              { value: "", label: "Select Action" },
                              ...(user.role === 'client' || user.role === 'agent' ? [{ value: "role:admin", label: "Promote to Admin" }] : []),
                              ...(user.role === 'client' ? [{ value: "role:agent", label: "Promote to Agent" }] : []),
                              ...(user.role === 'admin' ? [{ value: "role:agent", label: "Demote to Agent" }] : []),
                              ...(user.role === 'admin' || user.role === 'agent' ? [{ value: "role:client", label: "Demote to Client" }] : []),
                              { value: user.status === 'banned' ? 'unban' : 'ban', label: user.status === 'banned' ? 'Unban' : 'Ban' },
                              { value: "delete", label: "Delete" },
                            ]}
                            value={actionSelections[user.user_id] || ''}
                            onChange={(value) => setActionSelections(prev => ({ ...prev, [user.user_id]: value }))}
                            className="w-full"
                          />
                          {/* Further reduced margin-top from mt-1 to mt-0.5 to reduce the gap */}
                          <button onClick={() => handleActionApply(user)} className="text-xs text-white bg-green-500 hover:bg-green-600 rounded-lg px-2 py-1 w-full mt-0.5">Apply</button> {/* Changed to rounded-lg and added margin-top */}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No users found.</td> {/* Adjusted colSpan */}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center space-x-4 mt-4"> {/* Adjusted to justify-center and items-center */}
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
            >Prev</button>
            <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {page} of {totalPages}</span> {/* Added text-gray-700 and font-semibold */}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
            >Next</button>
=======
                  <th className="py-2 px-2 text-left">
                    <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="py-1 px-2 border rounded-xl text-sm w-24 bg-transparent focus:outline-none">
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="agent">Agent</option>
                      <option value="client">Client</option>
                    </select>
                  </th>
                  <th className="px-6 py-2 text-left whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-2 text-left">{user.user_id}</td>
                    <td title={user.full_name} className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-2 text-left">{user.full_name}</td>
                    <td title={user.email} className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-2 text-left">{user.email}</td>
                    <td className="px-2 text-left">{user.status || 'active'}</td>
                    <td className="px-2 text-left">{formatDate(user.date_joined)}</td>
                    <td className="px-2 text-left">{user.role === 'user' ? 'Client' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                    <td className="text-left px-2">
                      <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
                        <select className="py-1 px-2 border rounded-xl text-sm w-full" value={actionSelections[user.user_id] || ''} onChange={(e) => setActionSelections(prev => ({ ...prev, [user.user_id]: e.target.value }))}>
                          <option value="">Select Action</option>
                          {(user.role === 'client' || user.role === 'agent') && <option value="role:admin">Promote to Admin</option>}
                          {user.role === 'client' && <option value="role:agent">Promote to Agent</option>}
                          {user.role === 'admin' && <option value="role:agent">Demote to Agent</option>}
                          {(user.role === 'admin' || user.role === 'agent') && <option value="role:client">Demote to Client</option>}
                          <option value={user.status === 'banned' ? 'unban' : 'ban'}>{user.status === 'banned' ? 'Unban' : 'Ban'}</option>
                          <option value="delete">Delete</option>
                        </select>
                        <button onClick={() => handleActionApply(user)} className="text-xs text-white bg-green-400 hover:bg-green-500 rounded-xl px-2 py-1 w-full">Apply</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="7" className="text-center py-4 text-gray-400">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center pt-4">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(p - 1, 1))} className="px-4 py-2 rounded-xl bg-gray-100 text-sm disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl bg-gray-100 text-sm disabled:opacity-50">Next</button>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmModal
        show={showConfirmModal}
        title={confirmModalTitle}
        message={confirmModalContent}
        onConfirm={() => { confirmModalAction(); setShowConfirmModal(false); }}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        show={showAlertModal}
        message={alertModalMessage}
        type={alertModalType}
        onClose={closeAlertModal}
      />
    </div>
  );
};

export default Users;

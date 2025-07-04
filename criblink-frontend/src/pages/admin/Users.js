import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, X, Search, FileText, LayoutGrid, LayoutList } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import axiosInstance from '../../api/axiosInstance';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import Card from '../../components/ui/Card'; // Assuming you have a reusable Card component
import UserCard from '../../components/admin/UserCard'; // Import the new UserCard component
import API_BASE_URL from '../../config'; // Assuming API_BASE_URL is defined here or imported

// Reusable Dropdown Component (embedded directly in Users.js)
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
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
          darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
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


const Users = () => {
  // State for user data and table controls
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortKey, setSortKey] = useState('date_joined');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Initialize viewMode from localStorage based on 'defaultListingsView'
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultListingsView') || 'simple');


  // Theme, message, and confirmation dialog hooks
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  // Sidebar state management using the custom hook
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('users'); // Set active section to 'users'

  // State for dropdown selections and export functionality
  const [actionSelections, setActionSelections] = useState({});
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Refs for dropdowns
  const exportDropdownRef = useRef(null);

  // Pagination limit
  const limit = viewMode === 'simple' ? 10 : 9; // 10 for table, 9 for grid (3x3)

  // Hook for location object to read route state
  const location = useLocation();

  /**
   * Formats an ISO date string into a localized date string.
   * @param {string} isoDate - The ISO date string to format.
   * @returns {string} The formatted date string or 'Invalid Date' if parsing fails.
   */
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  /**
   * Fetches users from the backend API based on current filters, search, sorting, and pagination.
   * Displays success or error messages using the MessageContext.
   */
  const fetchUsers = useCallback(async () => {
    // Construct query parameters
    const params = new URLSearchParams({ search, role: roleFilter, page, limit, sort: sortKey, direction: sortDirection });
    const token = localStorage.getItem('token'); // Retrieve auth token from local storage

    try {
      const res = await axiosInstance.get(`${API_BASE_URL}/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}` // Attach token to request headers
        }
      });
      const data = res.data;

      // The profile_picture_url should already be included in the user object
      // returned by the /admin/users endpoint if the backend is correctly configured.
      // If it's not present, the UserCard will use a placeholder.
      const usersWithProfilePictures = data.users.map(user => {
        let profilePictureUrl = user.profile_picture_url;
        // Fallback to a placeholder if profilePictureUrl is null, undefined, or empty
        if (!profilePictureUrl) {
          profilePictureUrl = `https://placehold.co/80x80/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${user.full_name.charAt(0).toUpperCase()}`;
        }
        return { ...user, profile_picture_url: profilePictureUrl };
      });

      setUsers(usersWithProfilePictures);
      setTotalUsers(data.total);
    } catch (error) {
      console.error("Error fetching users:", error);
      let errorMessage = 'Failed to fetch users. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error'); // Display error message
      setUsers([]); // Clear users on error
      setTotalUsers(0); // Reset total users on error
    }
  }, [search, roleFilter, page, limit, sortKey, sortDirection, showMessage, darkMode]); // Added darkMode to dependencies

  // Effect to apply initial filters/sorting from location state
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
  }, [fetchUsers]); // fetchUsers is now a useCallback, so it's stable

  // Effect to handle clicks outside the export dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) setIsExportDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handles sorting when a table header is clicked. Toggles sort direction.
   * @param {string} key - The key (column name) to sort by.
   */
  const handleSortClick = (key) => {
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortKey(key);
    setPage(1); // Reset to first page on sort change
  };

  /**
   * Renders the appropriate sort icon (up/down arrow) based on current sort key and direction.
   * @param {string} key - The column key.
   * @returns {JSX.Element} The sort icon component.
   */
  const renderSortIcon = (key) => sortKey === key
    ? sortDirection === 'asc'
      ? <ArrowUpIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      : <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
    : <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;

  /**
   * Handles exporting user data to a CSV file.
   * @param {'current' | 'all'} scope - Whether to export current page data or all filtered data.
   */
  const handleExportCsv = async (scope) => {
    // Prevent export if no data is available
    if ((scope === 'current' && users.length === 0) || (scope === 'all' && totalUsers === 0)) {
      showMessage(scope === 'current' ? 'No user data on the current page.' : 'No user data found for full export.', 'info');
      setIsExportDropdownOpen(false);
      return;
    }

    let dataToExport = users;
    const token = localStorage.getItem('token');

    try {
      // If exporting all users, fetch all data without pagination
      if (scope === 'all') {
        const params = new URLSearchParams({ search, role: roleFilter, sort: sortKey, direction: sortDirection });
        const res = await axiosInstance.get(`${API_BASE_URL}/admin/users?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = res.data;
        dataToExport = data.users || data;
      }

      setIsExportDropdownOpen(false); // Close dropdown after selection

      // Define CSV headers and map user data to CSV format
      const headers = ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Date Joined', 'Profile Picture URL'];
      const csv = [
        headers.join(','),
        ...dataToExport.map(u =>
          [u.user_id, u.full_name, u.email, u.role, u.status || 'active', formatDate(u.date_joined), u.profile_picture_url || 'N/A']
            .map(f => `"${String(f).replace(/"/g, '""')}"`) // Escape double quotes and wrap in quotes
            .join(',')
        )
      ].join('\n');

      // Create a Blob and a download link for the CSV file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'users_directory.csv'; // Set download file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); // Clean up the link
      showMessage('Export successful!', 'success');
    } catch (error) {
      console.error("Error exporting CSV:", error);
      let errorMessage = 'Failed to export users to CSV. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  /**
   * Performs the user deletion API call.
   * @param {string} userId - The ID of the user to delete.
   */
  const performDelete = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.delete(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      showMessage('User deleted successfully.', 'success');
      fetchUsers(); // Refresh user list after deletion
    } catch (error) {
      console.error("Error deleting user:", error);
      let errorMessage = 'Failed to delete user. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  /**
   * Triggers the confirmation dialog for user deletion.
   * @param {object} user - The user object to be deleted.
   */
  const handleDelete = (user) => {
    showConfirm({
      title: `Delete User: ${user.full_name}`,
      message: `Are you sure you want to permanently delete ${user.full_name}? This action cannot be undone.`,
      onConfirm: () => performDelete(user.user_id), // Call performDelete on confirmation
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
  };

  /**
   * Performs the ban/unban API call for a user.
   * @param {string} userId - The ID of the user.
   * @param {string} currentStatus - The current status of the user ('banned' or 'active').
   */
  const performBanToggle = async (userId, currentStatus) => {
    const actionText = currentStatus === 'banned' ? 'unban' : 'ban';
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.put(`${API_BASE_URL}/admin/users/${userId}/status`,
        { status: newStatus },
        { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
      );
      showMessage(`User ${actionText}ned successfully.`, 'success');
      fetchUsers(); // Refresh user list after status change
    } catch (error) {
      console.error("Error toggling user ban status:", error);
      let errorMessage = `Failed to ${actionText} user. Please try again.`;
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  /**
   * Triggers the confirmation dialog for ban/unban actions.
   * @param {object} user - The user object whose status is to be toggled.
   */
  const handleBanToggle = (user) => {
    const actionText = user.status === 'banned' ? 'unban' : 'ban';
    const message = user.status === 'banned'
      ? `Are you sure you want to unban ${user.full_name}? They will regain access to the system.`
      : `Are you sure you want to ban ${user.full_name}? They will lose access to the system.`;
    showConfirm({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User: ${user.full_name}`,
      message: message,
      onConfirm: () => performBanToggle(user.user_id, user.status),
      confirmLabel: actionText.charAt(0).toUpperCase() + actionText.slice(1),
      cancelLabel: "Cancel"
    });
  };

  /**
   * Performs the reactivate API call for a user.
   * @param {string} userId - The ID of the user.
   */
  const performReactivate = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.put(`${API_BASE_URL}/admin/users/${userId}/status`,
        { status: 'active' }, // Set status to 'active'
        { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
      );
      showMessage(`User reactivated successfully.`, 'success');
      fetchUsers(); // Refresh user list after status change
    } catch (error) {
      console.error("Error reactivating user:", error);
      let errorMessage = `Failed to reactivate user. Please try again.`;
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  /**
   * Triggers the confirmation dialog for reactivating an account.
   * @param {object} user - The user object whose account is to be reactivated.
   */
  const handleReactivate = (user) => {
    showConfirm({
      title: `Reactivate User: ${user.full_name}`,
      message: `Are you sure you want to reactivate ${user.full_name}'s account? They will regain full access to the system.`,
      onConfirm: () => performReactivate(user.user_id),
      confirmLabel: "Reactivate",
      cancelLabel: "Cancel"
    });
  };


  /**
   * Performs the role change API call for a user.
   * @param {string} userId - The ID of the user.
   * @param {string} newRole - The new role to assign ('admin', 'agent', or 'client').
   */
  const performRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.put(`${API_BASE_URL}/admin/users/${userId}/role`,
        { newRole: newRole }, // Ensure newRole is sent in the body
        { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
      );
      showMessage(`Role changed to ${newRole} successfully.`, 'success');
      fetchUsers(); // Refresh user list after role change
    } catch (error) {
      console.error("Error changing user role:", error);
      let errorMessage = `Failed to change role to ${newRole}. Please try again.`;
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  /**
   * Triggers the confirmation dialog for role change.
   * @param {object} user - The user object whose role is to be changed.
   * @param {string} newRole - The new role selected.
   */
  const handleRoleChange = (user, newRole) => {
    showConfirm({
      title: `Change Role for ${user.full_name}`,
      message: `Are you sure you want to change ${user.full_name}'s role to ${newRole}?`,
      onConfirm: () => performRoleChange(user.user_id, newRole),
      confirmLabel: `Change to ${newRole}`,
      cancelLabel: "Cancel"
    });
  };

  /**
   * Applies the selected action (ban/unban, reactivate, delete, role change) for a specific user.
   * @param {object} user - The user object on whom the action is to be applied.
   * @param {string} action - The action value selected from the dropdown or button.
   */
  const handleActionApply = (user, action) => {
    if (!action) {
      showMessage('Please select an action to apply.', 'info');
      return;
    }

    if (action === 'ban' || action === 'unban') handleBanToggle(user);
    else if (action === 'reactivate') handleReactivate(user);
    else if (action === 'delete') handleDelete(user);
    else if (action.startsWith('role:')) handleRoleChange(user, action.split(':')[1]);
    setActionSelections(prev => ({ ...prev, [user.user_id]: '' })); // Clear selection after initiating action
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalUsers / limit);
  // Adjust content shift based on mobile and collapsed state of sidebar
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  // Options for the role filter dropdown
  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "agent", label: "Agent" },
    { value: "client", label: "Client" },
  ];

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle Button */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-white"}`}
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
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        {/* Headers */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Users</h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Users</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          // Conditionally apply classes based on mobile view
          className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
        >
          {/* Mobile Controls */}
          {isMobile && (
            <div className="flex justify-between items-center mb-4">
              {/* Always open Search Bar for Mobile */}
              <div className={`flex items-center flex-grow rounded-xl shadow-sm border overflow-hidden mr-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`flex-grow py-2 px-4 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                />
              </div>

              {/* Export and View Mode Toggle for Mobile */}
              <div className="flex gap-2 ml-2 items-center"> {/* Added items-center for alignment */}
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
                        <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Users</button>
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
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full md:w-1/3 py-2 px-4 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                  darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`} />

              <div className="flex gap-2 items-center"> {/* Grouped Export and View Mode Toggles */}
                <div className="relative inline-block text-left" ref={exportDropdownRef}>
                  <button onClick={() => setIsExportDropdownOpen(p => !p)} className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10">
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
                <button onClick={() => { setViewMode('simple'); localStorage.setItem('defaultListingsView', 'simple'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <LayoutList className="h-6 w-6" />
                </button>
                <button onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultListingsView', 'graphical'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <LayoutGrid className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {users.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              No users found matching your criteria.
            </div>
          ) : (
            viewMode === 'graphical' ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {users.map(user => (
                  <UserCard
                    key={user.user_id}
                    user={user}
                    onActionApply={(user, action) => handleActionApply(user, action)}
                    actionSelections={actionSelections}
                    setActionSelections={setActionSelections}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full mt-4 text-left text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <thead>
                    <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {['user_id', 'full_name', 'email', 'status', 'date_joined'].map((k) => (
                        <th
                          key={k}
                          onClick={() => handleSortClick(k)}
                          className={`py-2 px-2 cursor-pointer select-none ${sortKey === k ? (darkMode ? 'text-green-400' : 'text-green-700') : ''}`}
                          style={{
                            width:
                              k === 'user_id' ? '90px' :
                              k === 'full_name' ? '120px' :
                              k === 'email' ? '160px' :
                              k === 'status' ? '80px' :
                              k === 'date_joined' ? '120px' : 'auto'
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span>{k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            {renderSortIcon(k)}
                          </div>
                        </th>
                      ))}
                      <th className={`py-2 px-2 text-left whitespace-nowrap ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ width: '90px' }}>
                        <Dropdown
                          placeholder="All Roles"
                          options={roleOptions}
                          value={roleFilter}
                          onChange={(value) => { setRoleFilter(value); setPage(1); }}
                          className="w-full"
                        />
                      </th>
                      <th className={`py-2 px-2 text-left whitespace-nowrap ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                    {users.length > 0 ? (
                      users.map(user => (
                        <tr key={user.user_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                          <td className="py-2 px-2 max-w-[90px] truncate" title={user.user_id && user.user_id.length > 10 ? user.user_id : ''}>{user.user_id}</td>
                          <td title={user.full_name && user.full_name.length > 15 ? user.full_name : ''} className="py-2 px-2 max-w-[120px] truncate">{user.full_name}</td>
                          <td title={user.email && user.email.length > 20 ? user.email : ''} className="py-2 px-2 max-w-[160px] truncate">{user.email}</td>
                          <td className={`py-2 px-2 max-w-[80px] truncate font-semibold ${
                              user.status === 'banned'
                                ? 'text-red-600'
                                : user.status === 'deactivated'
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`} title={user.status && user.status.length > 10 ? user.status : ''}>{user.status || 'active'}</td>
                          <td className="py-2 px-2 max-w-[120px] truncate" title={formatDate(user.date_joined) && formatDate(user.date_joined).length > 15 ? formatDate(user.date_joined) : ''}>{formatDate(user.date_joined)}</td>
                          <td className="py-2 px-2 max-w-[90px] truncate" title={user.role === 'user' ? 'Client' : user.role.charAt(0).toUpperCase() + user.role.slice(1) && user.role.length > 10 ? user.role : ''}>{user.role === 'user' ? 'Client' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}</td>
                          <td className="py-2 px-2 space-x-2 max-w-[150px]">
                            <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
                              <Dropdown
                                placeholder="Select Action"
                                options={[
                                  { value: "", label: "Select Action" },
                                  // Role change options
                                  ...(user.role === 'client' || user.role === 'agent' ? [{ value: "role:admin", label: "Promote to Admin" }] : []),
                                  ...(user.role === 'client' ? [{ value: "role:agent", label: "Promote to Agent" }] : []),
                                  ...(user.role === 'admin' ? [{ value: "role:agent", label: "Demote to Agent" }] : []),
                                  ...(user.role === 'admin' || user.role === 'agent' ? [{ value: "role:client", label: "Demote to Client" }] : []),
                                  // Status change options
                                  ...(user.status === 'deactivated' ? [{ value: "reactivate", label: "Reactivate" }] : []),
                                  { value: user.status === 'banned' ? 'unban' : 'ban', label: user.status === 'banned' ? 'Unban' : 'Ban' },
                                  { value: "delete", label: "Delete" },
                                ]}
                                value={actionSelections[user.user_id] || ''}
                                onChange={(value) => setActionSelections(prev => ({ ...prev, [user.user_id]: value }))}
                                className="w-full"
                              />
                              <button onClick={() => handleActionApply(user, actionSelections[user.user_id])} className="text-xs text-white bg-green-500 hover:bg-green-600 rounded-lg px-2 py-1 w-full mt-0.5">Apply</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
            >Prev</button>
            <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
            >Next</button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Users;

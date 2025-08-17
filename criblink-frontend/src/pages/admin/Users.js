import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, X, Search, FileText, LayoutGrid, LayoutList, SlidersHorizontal, Plus } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import axiosInstance from '../../api/axiosInstance';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import UserCard from '../../components/admin/UserCard';
import API_BASE_URL from '../../config';

// Reusable Dropdown Component
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptionLabel = options.find(option => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10 ${
          darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
      >
        <span className="overflow-hidden truncate">{selectedOptionLabel}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDownIcon className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 overflow-hidden ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                onClick={(e) => { e.stopPropagation(); onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"} `}
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

// Skeleton component for Users page
const UsersSkeleton = ({ darkMode, viewMode }) => (
  <div className={`animate-pulse space-y-4`}>
    {viewMode === 'graphical' ? (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
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
              {[...Array(7)].map((_, i) => (
                <th key={i} className={`py-2 px-2`}>
                  <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
            {[...Array(10)].map((_, i) => (
              <tr key={i} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                {[...Array(7)].map((_, j) => (
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
    <div className="flex justify-center items-center space-x-4 mt-4">
      <div className={`h-8 w-16 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-8 w-16 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    </div>
  </div>
);

const Users = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const [sortKey, setSortKey] = useState('date_joined');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultListingsView') || 'simple');
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const navigate = useNavigate();
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('users');
  const [actionSelections, setActionSelections] = useState({});
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
  const [showSearchBarFilters, setShowSearchBarFilters] = useState(false);
  const filterAreaRef = useRef(null);
  const limit = viewMode === 'simple' ? 10 : 9;
  const location = useLocation();

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'agent', label: 'Agent' },
    { value: 'client', label: 'Client' },
    { value: 'agency_admin', label: 'Agency Admin' },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'banned', label: 'Banned' },
    { value: 'deactivated', label: 'Deactivated' }
  ];

  const subscriptionOptions = [
    { value: '', label: 'Any Subscription' },
    { value: 'none', label: 'None' },
    { value: 'basic', label: 'Basic' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  const subscriptionOptionsForTable = [
    { value: '', label: 'None' },
    { value: 'basic', label: 'Basic' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({
      search,
      role: roleFilter,
      status: statusFilter,
      subscription: subscriptionFilter,
      page,
      limit,
      sort: sortKey,
      direction: sortDirection,
    });
    try {
      const res = await axiosInstance.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users);
      setTotalUsers(res.data.total);
    } catch (error) {
      console.error("Error fetching users:", error);
      showMessage(error.response?.data?.message || 'Failed to fetch users.', 'error');
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, subscriptionFilter, page, limit, sortKey, sortDirection, showMessage]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axiosInstance.get('/users/me');
        setCurrentUser(res.data.user);
      } catch (error) {
        console.error("Error fetching current user:", error);
        showMessage('Failed to fetch current user.', 'error');
      }
    };
    fetchCurrentUser();
    fetchUsers();
  }, [fetchUsers]);

  const handleSortClick = (key) => {
    const sortableKeys = ['user_id', 'full_name', 'email', 'status', 'date_joined', 'role'];
    if (!sortableKeys.includes(key)) return;

    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const renderSortIcon = (key) => {
    const iconColor = sortKey === key ? (darkMode ? 'text-green-400' : 'text-green-700') : 'text-gray-400';
    if (sortKey === key) {
        return sortDirection === 'asc' ? <ArrowUpIcon className={`w-4 h-4 ml-1 ${iconColor}`} /> : <ArrowDownIcon className={`w-4 h-4 ml-1 ${iconColor}`} />;
    }
    return <ArrowDownIcon className={`w-4 h-4 ml-1 text-gray-400 opacity-50`} />;
  };

  const totalPages = Math.ceil(totalUsers / limit);

  const handleUserClick = (user) => {
    const role = user.role || user.user_role;
    switch (role) {
      case 'client':
        navigate(`/client-profile/${user.user_id}`);
        break;
      case 'agent':
        navigate(`/agent-profile/${user.user_id}`);
        break;
      case 'agency_admin':
        navigate(`/agency-admin-profile/${user.user_id}`);
        break;
      case 'admin':
        navigate(`/admin/users/${user.user_id}`);
        break;
      default:
        navigate(`/admin/users/${user.user_id}`);
        break;
    }
  };

  const handleActionApply = async (user, action) => {
    if (!action) return;
    try {
      if (action.startsWith('role:')) {
        const newRole = action.split(':')[1];
        const actionText = newRole === 'admin' ? 'promote to Admin' : newRole === 'agent' ? 'change to Agent' : newRole === 'client' ? 'change to Client' : 'change to Agency Admin';
        showConfirm({
            title: `Confirm Role Change`,
            message: `Are you sure you want to ${actionText} for ${user.full_name}?`,
            onConfirm: async () => {
                await axiosInstance.put(`/admin/users/${user.user_id}/role`, { newRole });
                showMessage(`User role updated to ${newRole}.`, 'success');
                setActionSelections(prev => ({ ...prev, [user.user_id]: '' }));
                fetchUsers();
            }
        });
      } else if (action === 'ban' || action === 'unban') {
        const newStatus = action === 'ban' ? 'banned' : 'active';
        showConfirm({
            title: `Confirm Status Change`,
            message: `Are you sure you want to ${action} ${user.full_name}?`,
            onConfirm: async () => {
                await axiosInstance.put(`/admin/users/${user.user_id}/status`, { status: newStatus });
                showMessage(`User ${action}ned successfully.`, 'success');
                setActionSelections(prev => ({ ...prev, [user.user_id]: '' }));
                fetchUsers();
            }
        });
      } else if (action === 'delete') {
        showConfirm({
            title: `Confirm Deletion`,
            message: `Are you sure you want to delete ${user.full_name}? This action cannot be undone.`,
            onConfirm: async () => {
                await axiosInstance.delete(`/admin/users/${user.user_id}`);
                showMessage('User deleted successfully.', 'success');
                setActionSelections(prev => ({ ...prev, [user.user_id]: '' }));
                fetchUsers();
            }
        });
      }
    } catch (error) {
      console.error("Error applying action:", error);
      showMessage(error.response?.data?.message || 'Failed to apply action.', 'error');
    }
  };

  const handleSubscriptionChange = async (user, subscriptionType) => {
    try {
      await axiosInstance.put(`/admin/users/${user.user_id}/subscription`, { subscription_type: subscriptionType });
      showMessage('Subscription updated successfully.', 'success');
      fetchUsers();
    } catch (error) {
      console.error("Error updating subscription:", error);
      showMessage(error.response?.data?.message || 'Failed to update subscription.', 'error');
    }
  };

  const handleExportCsv = async (scope) => {
    if ((scope === 'current' && users.length === 0) || (scope === 'all' && totalUsers === 0)) {
      showMessage(`No user data found for ${scope} export.`, 'info');
      setIsExportDropdownOpen(false);
      return;
    }
    let data = users;
    try {
        if (scope === 'all') {
          const params = new URLSearchParams({ 
            search, 
            role: roleFilter, 
            status: statusFilter, 
            subscription: subscriptionFilter, 
            sort: sortKey, 
            direction: sortDirection 
          });
          const res = await axiosInstance.get(`${API_BASE_URL}/admin/users?${params.toString()}`);
          const fullData = res.data;
          data = fullData.users || fullData;
        }

        const headers = ['User ID', 'Full Name', 'Email', 'Status', 'Role', 'Date Joined', 'Subscription'];
        const csvRows = data.map(user => [
          user.user_id, 
          user.full_name, 
          user.email, 
          user.status || 'N/A', 
          (user.role || user.user_role) || 'N/A', 
          formatDate(user.date_joined), 
          user.subscription_type || 'N/A'
        ].map(f => `"${String(f).replace(/"/g, '""')}"`));

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'users_directory.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportDropdownOpen(false);
        showMessage('User data exported successfully!', 'success');
    } catch (error) {
        let errorMessage = 'Failed to export users to CSV. Please try again.';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        showMessage(errorMessage, 'error');
        setIsExportDropdownOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
      }
      if (filterAreaRef.current && !filterAreaRef.current.contains(event.target)) {
        setShowSearchBarFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };
  
  const handleRoleChange = (value) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleSubscriptionChangeForFilter = (value) => {
    setSubscriptionFilter(value);
    setPage(1);
  };

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;
  const tableHeaders = ['user_id', 'full_name', 'email', 'status', 'role', 'date_joined'];

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-4 md:px-0 min-h-screen flex flex-col`}>
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
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
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Users</h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Users</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
        >
          {isMobile && (
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative" ref={filterAreaRef}>
                  <input type="text" placeholder="Search users..." value={search} onChange={handleSearchChange} className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`} />
                  <button onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters(prev => !prev); }} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`} title="Filter Users">
                    <SlidersHorizontal size={20} />
                  </button>
                  <AnimatePresence>
                    {showSearchBarFilters && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Role</label>
                          <Dropdown placeholder="Select Role" options={roleOptions} value={roleFilter} onChange={handleRoleChange} className="w-full" />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
                          <Dropdown placeholder="Select Status" options={statusOptions} value={statusFilter} onChange={handleStatusChange} className="w-full" />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Subscription</label>
                          <Dropdown placeholder="Select Subscription" options={subscriptionOptions} value={subscriptionFilter} onChange={handleSubscriptionChangeForFilter} className="w-full" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="relative inline-block text-left flex-shrink-0" ref={exportDropdownRef}>
                  <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center" title="Export">
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
              <div className="flex justify-center gap-2 w-full">
                <button className={`flex-1 p-2 rounded-xl h-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`} onClick={() => { setViewMode('simple'); localStorage.setItem('defaultListingsView', 'simple'); }} title="List View">
                  <LayoutList className="h-5 w-5 mr-2" /> List View
                </button>
                <button className={`flex-1 p-2 rounded-xl h-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`} onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultListingsView', 'graphical'); }} title="Grid View">
                  <LayoutGrid className="h-5 w-5 mr-2" /> Grid View
                </button>
              </div>
            </div>
          )}
          {!isMobile && (
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full">
                <div className="w-full relative max-w-[28rem]" ref={filterAreaRef}>
                  <input type="text" placeholder="Search by name, email, or ID..." value={search} onChange={handleSearchChange} className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}/>
                  <button onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters(prev => !prev); }} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`} title="Filter Users">
                    <SlidersHorizontal size={20} />
                  </button>
                  <AnimatePresence>
                    {showSearchBarFilters && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4 w-96 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Role</label>
                          <Dropdown placeholder="Select Role" options={roleOptions} value={roleFilter} onChange={handleRoleChange} className="w-full"/>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
                          <Dropdown placeholder="Select Status" options={statusOptions} value={statusFilter} onChange={handleStatusChange} className="w-full"/>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Subscription</label>
                          <Dropdown placeholder="Select Subscription" options={subscriptionOptions} value={subscriptionFilter} onChange={handleSubscriptionChangeForFilter} className="w-full" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="relative inline-block text-left" ref={exportDropdownRef}>
                  <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10">
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
                <button onClick={() => { setViewMode('simple'); localStorage.setItem('defaultListingsView', 'simple'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`} title="List View">
                  <LayoutList className="h-6 w-6" />
                </button>
                <button onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultListingsView', 'graphical'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`} title="Grid View">
                  <LayoutGrid className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
          {isLoading ? (
            <UsersSkeleton darkMode={darkMode} viewMode={viewMode} />
          ) : users.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No users found matching your criteria.</div>
          ) : viewMode === 'graphical' ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {users.map(user => (
                <UserCard key={user.user_id} user={user} onActionApply={handleActionApply} onCardClick={handleUserClick} currentUser={currentUser} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ overflow: "visible" }}>
              <table className={`w-full mt-4 text-left text-sm table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <thead>
                  <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {tableHeaders.map((k) => (
                      <th key={k} onClick={() => handleSortClick(k)} className={`py-2 px-2 cursor-pointer select-none`}>
                        <div className="flex items-center gap-1"><span>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>{renderSortIcon(k)}</div>
                      </th>
                    ))}
                    <th className="py-2 px-2">Subscription</th>
                    <th className="py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                  {users.map(user => (
                    <tr key={user.user_id} className={`border-t cursor-pointer ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`} onClick={() => handleUserClick(user)}>
                      <td className="py-2 px-2 truncate">{user.user_id}</td>
                      <td className="py-2 px-2 truncate">{user.full_name}</td>
                      <td className="py-2 px-2 truncate">{user.email}</td>
                      <td className={`py-2 px-2 truncate font-semibold ${user.status === 'banned' ? 'text-red-600' : user.status === 'deactivated' ? 'text-yellow-600' : 'text-green-600'}`}>{user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active'}</td>
                      <td className="py-2 px-2 truncate">{(user.role || user.user_role)?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                      <td className="py-2 px-2 truncate">{formatDate(user.date_joined)}</td>
                      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                        {currentUser?.role === 'admin' && ((user.role || user.user_role) === 'agent' || (user.role || user.user_role) === 'agency_admin') ? (
                          <Dropdown
                            placeholder="None"
                            options={subscriptionOptionsForTable}
                            value={user.subscription_type ?? ''}
                            onChange={(value) => handleSubscriptionChange(user, value)}
                            className="w-full"
                          />
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
                          <Dropdown
                            placeholder="Select Action"
                            options={[
                              { value: "", label: "Select Action" },
                              ...(user.role !== 'admin' ? [{ value: "role:admin", label: "To Admin" }] : []),
                              ...(user.role !== 'agent' ? [{ value: "role:agent", label: "To Agent" }] : []),
                              ...(user.role !== 'client' ? [{ value: "role:client", label: "To Client" }] : []),
                              ...(user.role !== 'agency_admin' ? [{ value: "role:agency_admin", label: "To Agency Admin" }] : []),
                              ...(user.status === 'deactivated' ? [{ value: "reactivate", label: "Reactivate" }] : []),
                              { value: user.status === 'banned' ? 'unban' : 'ban', label: user.status === 'banned' ? 'Unban' : 'Ban' },
                              { value: "delete", label: "Delete" },
                            ]}
                            value={actionSelections[user.user_id] || ''}
                            onChange={(value) => setActionSelections(prev => ({ ...prev, [user.user_id]: value }))}
                            className="w-full"
                          />
                          {actionSelections[user.user_id] && (
                            <button
                              onClick={() => handleActionApply(user, actionSelections[user.user_id])}
                              className="text-xs text-white bg-green-500 hover:bg-green-600 rounded-lg px-2 py-1 w-full mt-0.5"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}>Prev</button>
            <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages || totalPages === 0} className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}>Next</button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Users;
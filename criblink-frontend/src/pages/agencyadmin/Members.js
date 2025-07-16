import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon,
  TableCellsIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import AgencyAdminSidebar from '../../components/agencyadmin/Sidebar';
import API_BASE_URL from '../../config';
import { Menu, X, Search, SlidersHorizontal, FileText, LayoutGrid, LayoutList, Plus, UserPlus, UserMinus } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useAuth } from '../../context/AuthContext';

// Import the refactored MemberCard component
import MemberCard from '../../components/agencyadmin/MemberCard'; // Adjust path as needed based on your file structure

// Reusable Dropdown Component (copied for self-containment)
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
                className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10
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

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultMembersView') || 'graphical');
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { user } = useAuth();
  const agencyId = user?.agency_id;

  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('members');

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const [pendingRequests, setPendingRequests] = useState([]);
  const [filteredPendingRequests, setFilteredPendingRequests] = useState([]);
  const [showPendingRequests, setShowPendingRequests] = useState(false);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [memberStatusFilter, setMemberStatusFilter] = useState('all'); // New state for member status filter

  // Helper to capitalize the first letter of a string
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMembersAndRequests = useCallback(async () => {
    if (!agencyId) {
      showMessage('Agency ID not available. Cannot fetch members.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const membersRes = await axios.get(`${API_BASE_URL}/agencies/${agencyId}/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(membersRes.data);

      const requestsRes = await axios.get(`${API_BASE_URL}/agencies/${agencyId}/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRequests(requestsRes.data);

    } catch (err) {
      console.error('Failed to fetch agency members or requests:', err);
      showMessage('Failed to fetch agency members or requests. Please try again.', 'error');
    }
  }, [agencyId, showMessage]);

  useEffect(() => {
    if (agencyId) {
      fetchMembersAndRequests();
    }
  }, [fetchMembersAndRequests, agencyId]);

  useEffect(() => {
    if (!showPendingRequests) {
      let currentMembers = [...members];

      if (searchTerm) {
        currentMembers = currentMembers.filter((a) =>
          a.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply member status filter
      if (memberStatusFilter !== 'all') {
        currentMembers = currentMembers.filter((member) => {
          return (member.member_status || 'regular').toLowerCase() === memberStatusFilter;
        });
      }

      currentMembers.sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        if (typeof aValue === 'string') return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });

      setFilteredMembers(currentMembers);
      setPage(1);
    }
  }, [searchTerm, members, sortKey, sortDirection, showPendingRequests, memberStatusFilter]);

  useEffect(() => {
    if (showPendingRequests) {
      let currentRequests = [...pendingRequests];

      if (searchTerm) {
        currentRequests = currentRequests.filter((r) =>
          r.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.agent_email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      currentRequests.sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        if (typeof aValue === 'string') return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });

      setFilteredPendingRequests(currentRequests);
      setPage(1);
    }
  }, [searchTerm, pendingRequests, sortKey, sortDirection, showPendingRequests]);

  const handleSortClick = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (key) => {
    if (sortKey === key) {
      return sortDirection === 'asc' ? (
        <ArrowUpIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      ) : (
        <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      );
    }
    return <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;
  };

  const handleExportCsv = (scope) => {
    const dataToExport = showPendingRequests ? (scope === 'current' ? filteredPendingRequests : pendingRequests) : (scope === 'current' ? filteredMembers : members);
    if (dataToExport.length === 0) {
      showMessage(`No data found for ${scope} export.`, 'info');
      setIsExportDropdownOpen(false);
      return;
    }

    const headers = showPendingRequests
      ? ['request_id', 'member_id', 'member_name', 'member_email', 'requested_at', 'status']
      : ['user_id', 'full_name', 'email', 'phone', 'agency_role', 'joined_at', 'user_status', 'member_status'];

    const csvRows = dataToExport.map((item) => {
      if (showPendingRequests) {
        return [
          item.request_id,
          item.agent_id,
          item.agent_name,
          item.agent_email,
          new Date(item.requested_at).toLocaleDateString(),
          item.request_status || '',
        ].map(field => `"${String(field).replace(/"/g, '""')}"`);
      } else {
        return [
          item.user_id,
          item.full_name,
          item.email,
          item.phone || '',
          item.agency_role || '',
          new Date(item.joined_at).toLocaleDateString(),
          item.user_status || '',
          item.member_status || '', // Include member_status in export
        ].map(field => `"${String(field).replace(/"/g, '""')}"`);
      }
    });

    const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = showPendingRequests ? 'pending_member_requests.csv' : 'agency_members.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
    showMessage("Data exported successfully!", 'success');
  };

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  const handleAcceptRequest = async (requestId, memberIdToApprove) => {
    showConfirm({
      title: "Accept Member Request",
      message: `Are you sure you want to accept this member's request to join your agency?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(`${API_BASE_URL}/agencies/approve-join-request/${requestId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Member request accepted!', 'success');
          fetchMembersAndRequests();
        } catch (err) {
          console.error("Failed to accept request:", err);
          showMessage(`Failed to accept request: ${err.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Accept",
      cancelLabel: "Cancel"
    });
  };

  const handleRejectRequest = async (requestId) => {
    showConfirm({
      title: "Reject Member Request",
      message: `Are you sure you want to reject this member's request to join your agency?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(`${API_BASE_URL}/agencies/reject-join-request/${requestId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Member request rejected.', 'info');
          fetchMembersAndRequests();
        } catch (err) {
          console.error("Failed to reject request:", err);
          showMessage(`Failed to reject request: ${err.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Reject",
      cancelLabel: "Cancel"
    });
  };

  const handleRemoveMember = async (memberIdToRemove) => {
    // Safeguard: Prevent the last agency_admin from removing themselves
    if (user && user.user_id === memberIdToRemove && user.role === 'agency_admin') {
      const adminMembers = members.filter(member => member.agency_role === 'agency_admin');
      if (adminMembers.length === 1 && adminMembers[0].user_id === user.user_id) {
        showMessage('You cannot remove yourself as you are the last agency administrator. Please assign another member as an administrator before removing yourself.', 'error');
        return;
      }
    }

    showConfirm({
      title: "Remove Member from Agency",
      message: `Are you sure you want to remove this member from your agency?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_BASE_URL}/agencies/${agencyId}/members/${memberIdToRemove}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Member removed from agency successfully!', 'success');
          fetchMembersAndRequests();
        } catch (err) {
          console.error("Failed to remove member:", err);
          showMessage(`Failed to remove member: ${err.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Remove",
      cancelLabel: "Cancel"
    });
  };

  const handlePromoteMember = async (memberIdToPromote) => {
    showConfirm({
      title: "Promote Member to Admin",
      message: `Are you sure you want to promote this member to an agency administrator?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          // Using the new endpoint for agency-specific promotion
          await axios.put(`${API_BASE_URL}/agencies/${agencyId}/members/${memberIdToPromote}/promote-to-admin`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Member promoted to administrator successfully!', 'success');
          fetchMembersAndRequests(); // Refresh data
        } catch (err) {
          console.error("Failed to promote member:", err);
          showMessage(`Failed to promote member: ${err.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Promote",
      cancelLabel: "Cancel"
    });
  };

  const handleDemoteMember = async (memberIdToDemote) => {
    // Safeguard: Prevent the last agency_admin from demoting themselves
    if (user && user.user_id === memberIdToDemote && user.role === 'agency_admin') {
      const adminMembers = members.filter(member => member.agency_role === 'agency_admin');
      if (adminMembers.length === 1 && adminMembers[0].user_id === user.user_id) {
        showMessage('You cannot demote yourself as you are the last agency administrator. Please assign another member as an administrator before stepping down.', 'error');
        return;
      }
    }

    showConfirm({
      title: "Demote Member to Agent",
      message: `Are you sure you want to demote this administrator to a regular agent?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          // Using the new endpoint for agency-specific demotion
          await axios.put(`${API_BASE_URL}/agencies/${agencyId}/members/${memberIdToDemote}/demote-to-agent`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Member demoted to agent successfully!', 'success');
          fetchMembersAndRequests(); // Refresh data
        } catch (err) {
          console.error("Failed to demote member:", err);
          showMessage(`Failed to demote member: ${err.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Demote",
      cancelLabel: "Cancel"
    });
  };

  // New: Handle toggling member VIP/Regular status
  const handleToggleMemberStatus = async (memberId, currentStatus) => {
    const newStatus = currentStatus === 'vip' ? 'regular' : 'vip';
    showConfirm({
      title: "Change Member Status",
      message: `Are you sure you want to change this member's status to ${capitalizeFirstLetter(newStatus)}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(`${API_BASE_URL}/agencies/${agencyId}/members/${memberId}/status`, { status: newStatus }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setMembers((prev) => prev.map((m) => m.user_id === memberId ? { ...m, member_status: newStatus } : m));
          setFilteredMembers((prev) => prev.map((m) => m.user_id === memberId ? { ...m, member_status: newStatus } : m));
          showMessage(`Member status updated to ${capitalizeFirstLetter(newStatus)}.`, 'success');
        } catch (err) {
          console.error("Failed to update member status:", err);
          showMessage(`Failed to update member status: ${err.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Change Status",
      cancelLabel: "Cancel"
    });
  };


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // New: Handler for member status filter change
  const handleMemberStatusChange = (value) => {
    setMemberStatusFilter(value);
    setPage(1); // Reset page on filter change
  };

  const totalItems = showPendingRequests ? filteredPendingRequests.length : filteredMembers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = showPendingRequests
    ? filteredPendingRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : filteredMembers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const totalAdmins = members.filter(member => member.agency_role === 'agency_admin').length;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
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

      <AgencyAdminSidebar
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
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Agency Members</h1>
        </div>

        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Agency Members</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}>
          {isMobile && (
            <div className="flex justify-between items-center mb-4">
              <button
                className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                onClick={() => setIsFilterModalOpen(true)}
                title="Open Filters"
              >
                <SlidersHorizontal size={20} />
              </button>
              <div className="relative inline-block text-left" ref={exportDropdownRef}>
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                  title="Export"
                >
                  <FileText size={20} />
                </button>
                {isExportDropdownOpen && (
                  <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-900"}`}>
                    <div className="py-1">
                      <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                      <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Members</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                  onClick={() => { setViewMode('simple'); localStorage.setItem('defaultMembersView', 'simple'); }}
                  title="List View"
                >
                  <LayoutList className="h-5 w-5" />
                </button>
                <button
                  onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultMembersView', 'graphical'); }}
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                >
                  <Squares2X2Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {!isMobile && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={`w-full md:w-1/3 px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
              />

              {/* Desktop Member Status Filter */}
              <div className="w-full md:w-1/6">
                <Dropdown
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'vip', label: 'VIP' },
                    { value: 'regular', label: 'Regular' },
                  ]}
                  value={memberStatusFilter}
                  onChange={handleMemberStatusChange}
                  placeholder="Filter by Status"
                  className="w-full"
                />
              </div>

              <div className="flex gap-2 items-center">
                <div className="relative inline-block text-left" ref={exportDropdownRef}>
                  <button
                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                    className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10"
                    title="Export to CSV"
                  >
                    Export to CSV <FileText className="ml-2 h-5 w-5" />
                  </button>
                  {isExportDropdownOpen && (
                    <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-900"}`}>
                      <div className="py-1">
                        <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                        <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Members</button>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => { setViewMode('simple'); localStorage.setItem('defaultMembersView', 'simple'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <TableCellsIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultMembersView', 'graphical'); }}
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                >
                  <Squares2X2Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-center mb-6">
            <button
              onClick={() => { setShowPendingRequests(false); setPage(1); }}
              className={`px-6 py-2 rounded-l-xl text-lg font-semibold transition-colors duration-200
                      ${!showPendingRequests ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
            >
              Your Members ({members.length})
            </button>
            <button
              onClick={() => { setShowPendingRequests(true); setPage(1); }}
              className={`px-6 py-2 rounded-r-xl text-lg font-semibold transition-colors duration-200
                      ${showPendingRequests ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
            >
              Pending Requests ({pendingRequests.length})
            </button>
          </div>

          {showPendingRequests ? (
            paginatedData.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No pending member join requests found for your agency.
              </div>
            ) : (
              viewMode === 'graphical' ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedData.map(request => (
                    <MemberCard
                      key={request.request_id}
                      member={{
                        user_id: request.agent_id,
                        full_name: request.agent_name,
                        email: request.agent_email,
                        profile_picture_url: request.agent_profile_picture_url,
                        requested_at: request.requested_at,
                        request_status: request.request_status,
                        request_id: request.request_id,
                        agency_role: 'pending',
                        user_status: 'pending',
                        member_status: request.member_status || 'regular', // Pass member_status for pending
                      }}
                      acceptAction={handleAcceptRequest}
                      rejectAction={handleRejectRequest}
                      isPendingRequestCard={true}
                      darkMode={darkMode}
                      user={user} // Pass user for role checks
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm table-fixed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <thead>
                      <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <th onClick={() => handleSortClick('agent_name')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '25%' }}>Name {renderSortIcon('agent_name')}</th>
                        <th onClick={() => handleSortClick('agent_email')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '30%' }}>Email {renderSortIcon('agent_email')}</th>
                        <th onClick={() => handleSortClick('requested_at')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '20%' }}>Requested At {renderSortIcon('requested_at')}</th>
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '25%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                      {paginatedData.map(request => (
                        <tr key={request.request_id} className={`border-t cursor-default break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                          <td className="px-1 py-2" title={request.agent_name}>{request.agent_name}</td>
                          <td className="px-1 py-2" title={request.agent_email}>{request.agent_email}</td>
                          <td className="px-1 py-2">{new Date(request.requested_at).toLocaleDateString()}</td>
                          <td className="px-1 py-2 flex gap-1">
                            <button className="text-green-600 hover:border-green-700 p-1 border border-transparent" onClick={() => handleAcceptRequest(request.request_id, request.agent_id)} title="Accept Request">
                              <CheckCircleIcon className="h-6 w-6" />
                            </button>
                            <button className="text-red-600 hover:border-red-700 p-1 border border-transparent" onClick={() => handleRejectRequest(request.request_id)} title="Reject Request">
                              <XCircleIcon className="h-6 w-6" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )
          ) : (
            paginatedData.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No members found in your agency.
              </div>
            ) : (
              viewMode === 'graphical' ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedData.map(member => (
                    <MemberCard
                      key={member.user_id}
                      member={{
                        ...member,
                        current_user_id: user?.user_id,
                        total_admins: totalAdmins,
                        user_status: member.user_status || 'active',
                        member_status: member.member_status || 'regular', // Ensure member_status is passed
                      }}
                      onViewProfile={() => { /* Implement view member profile logic if needed */ showMessage(`Viewing profile for ${member.full_name}`, 'info'); }}
                      onRemoveMember={handleRemoveMember}
                      onPromoteMember={handlePromoteMember}
                      onDemoteMember={handleDemoteMember}
                      onToggleMemberStatus={handleToggleMemberStatus} // Pass the new toggle function
                      isPendingRequestCard={false}
                      darkMode={darkMode}
                      user={user} // Pass user for role checks
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm table-fixed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <thead>
                      <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <th onClick={() => handleSortClick('full_name')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '20%' }}>Name {renderSortIcon('full_name')}</th>
                        <th onClick={() => handleSortClick('email')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '25%' }}>Email {renderSortIcon('email')}</th>
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '10%' }}>Role</th>
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '10%' }}>Status</th>
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '10%' }}>Member Status</th> {/* New column for member status */}
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '25%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                      {paginatedData.map(member => (
                        <tr key={member.user_id} className={`border-t cursor-default break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                          <td className="px-1 py-2" title={member.full_name}>{member.full_name}</td>
                          <td className="px-1 py-2" title={member.email}>{member.email}</td>
                          <td className={`px-1 py-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} title={member.agency_role || 'agent'}>{member.agency_role === 'agency_admin' ? 'Admin' : (member.agency_role || 'Agent')}</td>
                          <td className={`px-1 py-2 font-semibold ${member.user_status === 'banned' ? 'text-red-600' : member.user_status === 'deactivated' ? 'text-yellow-600' : 'text-green-600'}`} title={member.user_status || 'active'}>{(member.user_status || 'active').charAt(0).toUpperCase() + (member.user_status || 'active').slice(1)}</td>
                          {/* Display Member Status */}
                          <td className="px-1 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                                ${member.member_status === 'vip' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                              {capitalizeFirstLetter(member.member_status || 'regular')}
                            </span>
                          </td>
                          <td className="px-1 py-2 flex gap-1 items-center">
                            <button onClick={() => { /* Implement view member profile logic */ showMessage(`Viewing profile for ${member.full_name}`, 'info'); }} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-blue-500 hover:border-blue-600 border border-transparent`}>View</button>

                            {member.agency_role === 'agent' && (
                              <button
                                onClick={() => handlePromoteMember(member.user_id)}
                                title="Promote to Admin"
                                className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-purple-500 hover:border-purple-600 border border-transparent`}
                              >
                                Promote
                              </button>
                            )}
                            {member.agency_role === 'agency_admin' && member.user_id !== user?.user_id && (
                              <button
                                onClick={() => handleDemoteMember(member.user_id)}
                                title="Demote to Agent"
                                className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-orange-500 hover:border-orange-600 border border-transparent`}
                              >
                                Demote
                              </button>
                            )}

                            {/* Toggle Member Status Button (only for admins, not self) */}
                            {user?.role === 'agency_admin' && user?.user_id !== member.user_id && (
                                <button
                                    onClick={() => handleToggleMemberStatus(member.user_id, member.member_status)}
                                    title={member.member_status === 'vip' ? 'Make Regular' : 'Make VIP'}
                                    className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-yellow-500 hover:border-yellow-600 border border-transparent`}
                                >
                                    {member.member_status === 'vip' ? 'Reg' : 'VIP'}
                                </button>
                            )}

                            {(user && user.user_id === member.user_id && user.role === 'agency_admin' && totalAdmins === 1) ? (
                                <button
                                  disabled
                                  className={`rounded-xl p-1 h-8 w-8 flex items-center justify-center text-red-500 opacity-50 cursor-not-allowed border border-transparent`}
                                  title="You cannot remove yourself as you are the last agency administrator."
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  
                                </button>
                            ) : (
                                <button onClick={() => handleRemoveMember(member.user_id)} title="Remove member" className={`rounded-xl p-1 h-8 w-8 flex items-center justify-center text-red-500 hover:border-red-600 border border-transparent`}>
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )
          )}
          {totalItems > 0 && (
            <div className="flex justify-center items-center space-x-4 mt-4">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
              >Prev</button>
              <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || totalPages === 0}
                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
              >Next</button>
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isFilterModalOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed inset-0 z-50 flex flex-col bg-white text-gray-900`}
          >
            <div className={`flex items-center justify-between p-4`}>
              <h2 className="text-xl font-bold">Filter Members</h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className={`p-2 rounded-full transition-colors duration-200 ${darkMode ? "hover:bg-gray-200 text-gray-700" : "hover:bg-gray-200 text-gray-700"}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
              <div>
                <label htmlFor="search" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-700" : "text-gray-700"}`}>
                  Search Members
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                  </div>
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                  />
                </div>
              </div>

              {/* Status Dropdown for Mobile */}
              <div>
                <label htmlFor="member-status-filter" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-700" : "text-gray-700"}`}>
                  Member Status
                </label>
                <Dropdown
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'vip', label: 'VIP' },
                    { value: 'regular', label: 'Regular' },
                  ]}
                  value={memberStatusFilter}
                  onChange={handleMemberStatusChange}
                  placeholder="Select Status"
                  className="w-full"
                />
              </div>

            </div>

            <div className={`p-4`}>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Members;

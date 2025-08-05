import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate, useLocation, useParams } from 'react-router-dom'; // Import useParams
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
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} // Added e.stopPropagation() here
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
                                onClick={(e) => {
                                    e.stopPropagation(); // Stop propagation to prevent parent from closing
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

// Skeleton component for Members page
const MembersSkeleton = ({ darkMode, viewMode }) => (
  <div className={`animate-pulse space-y-4`}>
    {/* Controls Skeleton */}
    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
      <div className={`h-10 w-full md:w-1/3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-10 w-full md:w-1/3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className="flex gap-2">
        <div className={`h-10 w-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-10 w-10 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-10 w-10 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      </div>
    </div>

    {/* Content Skeleton */}
    {viewMode === 'graphical' ? (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => ( // 6 skeleton cards
          <div key={i} className={`p-4 rounded-xl shadow-md h-56 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <div className="flex items-center mb-4">
              <div className={`w-16 h-16 rounded-full mr-4 ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <div className="flex-1 space-y-2">
                <div className={`h-6 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
                <div className={`h-4 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <div className={`h-4 w-2/3 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <div className={`h-4 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <div className={`h-8 w-20 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <div className={`h-8 w-8 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className={`w-full text-sm min-w-max`}>
          <thead>
            <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {[...Array(7)].map((_, i) => ( // 7 skeleton table headers
                <th key={i} className={`py-2 px-2`}>
                  <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
            {[...Array(10)].map((_, i) => ( // 10 skeleton table rows
              <tr key={i} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                {[...Array(7)].map((_, j) => ( // 7 skeleton cells per row
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
      <div className={`h-8 w-20 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-8 w-20 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    </div>
  </div>
);


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
  // NEW: Get agencyId from URL params if present (for admin role)
  const { agencyId: paramAgencyId } = useParams();
  // Determine the agencyId to use: if user is 'admin', use paramAgencyId, else use user's agency_id
  const agencyId = user?.role === 'admin' ? paramAgencyId : user?.agency_id;

  const navigate = useNavigate();
  const location = useLocation();

  // Conditionally use useSidebarState based on user role
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = user?.role === 'agency_admin' ? useSidebarState() : {
    isMobile: false, // Assume not mobile if no sidebar
    isSidebarOpen: false,
    setIsSidebarOpen: () => {},
    isCollapsed: false,
    setIsCollapsed: () => {}
  };

  const [activeSection, setActiveSection] = useState('members');

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const [pendingRequests, setPendingRequests] = useState([]);
  const [filteredPendingRequests, setFilteredPendingRequests] = useState([]);
  const [showPendingRequests, setShowPendingRequests] = useState(false); // State to toggle between members and pending requests

  // New state for controlling filter dropdown visibility within search bar
  const [showSearchBarFilters, setShowSearchBarFilters] = useState(false);
  const filterAreaRef = useRef(null); // Ref for the entire filter area (search bar + dropdowns)

  const [memberStatusFilter, setMemberStatusFilter] = useState('all');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state

  // Helper to capitalize the first letter of a string
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        filterAreaRef.current &&
        !filterAreaRef.current.contains(e.target)
      ) {
        setShowSearchBarFilters(false);
      }
    };
  
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowSearchBarFilters(false);
      }
    };
  
    document.addEventListener('click', handleClickOutside); // ← changed
    document.addEventListener('keydown', handleEscape);
  
    return () => {
      document.removeEventListener('click', handleClickOutside); // ← changed
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  

  // Effect to set initial role filter or show pending requests from navigation state
  useEffect(() => {
    if (location.state?.roleFilter) {
      setMemberRoleFilter(location.state.roleFilter);
      setShowPendingRequests(false); // Ensure we are on the members tab
      navigate(location.pathname, { replace: true, state: {} }); // Clear the state
    } else if (location.state?.showPendingRequests) {
      setShowPendingRequests(true); // Switch to pending requests tab
      navigate(location.pathname, { replace: true, state: {} }); // Clear the state
    }
  }, [location.state, navigate, location.pathname]);


  const fetchMembersAndRequests = useCallback(async () => {
    setIsLoading(true); // Set loading to true
    // Ensure agencyId is available before fetching
    if (!agencyId) {
      // If an admin navigates directly without an agencyId, or agency_admin has no agencyId
      showMessage('Agency ID not available. Cannot fetch members.', 'error');
      setMembers([]);
      setPendingRequests([]);
      setIsLoading(false); // Stop loading if no agencyId
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Fetch all members (agents and agency_admins) for the agency
      // Assuming the backend endpoint returns users with a 'role' property (e.g., 'agent', 'admin' from agency_members table)
      const membersRes = await axios.get(`${API_BASE_URL}/agencies/${agencyId}/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Map the incoming data to ensure 'agency_role' is consistently available
      // and maps 'admin' from backend to 'agency_admin' for frontend display/filter.
      const fetchedMembers = membersRes.data.map(member => ({
        ...member,
        // If backend sends 'admin' for agency_members.role, map it to 'agency_admin' for frontend
        agency_role: member.agency_role === 'admin' ? 'agency_admin' : (member.agency_role || 'agent'),
        // Ensure member_status is also present, defaulting to 'regular' if not provided
        member_status: member.member_status || 'regular',
      }));

      setMembers(fetchedMembers);

      const requestsRes = await axios.get(`${API_BASE_URL}/agencies/${agencyId}/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRequests(requestsRes.data);

    } catch (err) {
      console.error('Failed to fetch agency members or requests:', err);
      showMessage('Failed to fetch agency members or requests. Please try again.', 'error');
    } finally {
      setIsLoading(false); // Set loading to false
    }
  }, [agencyId, showMessage]); // Dependency on agencyId

  useEffect(() => {
    // Fetch data only if agencyId is available
    if (agencyId) {
      fetchMembersAndRequests();
    } else if (user?.role === 'admin' && !paramAgencyId) {
        // If it's a super admin, but no agencyId is provided in params,
        // we might want to show a message or redirect.
        // For now, just ensure no fetch happens.
        showMessage('Please select an agency to view its members.', 'info');
        setMembers([]);
        setPendingRequests([]);
        setIsLoading(false); // Stop loading immediately
    }
  }, [fetchMembersAndRequests, agencyId, user?.role, paramAgencyId, showMessage]); // Dependencies updated

  useEffect(() => {
    if (!showPendingRequests) {
      let currentMembers = [...members];

      if (searchTerm) {
        currentMembers = currentMembers.filter((a) =>
          a.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.phone?.toLowerCase().includes(searchTerm.toLowerCase()) // Include phone in search
        );
      }

      // Apply member status filter
      if (memberStatusFilter !== 'all') {
        currentMembers = currentMembers.filter((member) => {
          return (member.member_status || 'regular').toLowerCase() === memberStatusFilter;
        });
      }

      // Apply member role filter
      if (memberRoleFilter !== 'all') {
        currentMembers = currentMembers.filter((member) => {
          return (member.agency_role).toLowerCase() === memberRoleFilter;
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
  }, [searchTerm, members, sortKey, sortDirection, showPendingRequests, memberStatusFilter, memberRoleFilter]);

  useEffect(() => {
    if (showPendingRequests) {
      let currentRequests = [...pendingRequests];

      if (searchTerm) {
        currentRequests = currentRequests.filter((r) =>
          r.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.agent_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.agent_phone?.toLowerCase().includes(searchTerm.toLowerCase()) // Include phone in search
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
          item.agency_role || '', // Use the mapped agency_role
          new Date(item.joined_at).toLocaleDateString(),
          item.user_status || '',
          item.member_status || '',
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

  // Calculate contentShift based on user role
  const contentShift = (user?.role === 'agency_admin' && !isMobile) ? (isCollapsed ? 80 : 256) : 0;


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
          // Update the members state directly to reflect the change
          setMembers((prev) => prev.map((m) => m.user_id === memberId ? { ...m, member_status: newStatus } : m));
          // Also update filteredMembers to ensure the current view is consistent
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

  // New: Handler for member role filter change
  const handleMemberRoleChange = (value) => {
    setMemberRoleFilter(value);
    setPage(1); // Reset page on filter change
  };

  // Function to navigate to agent profile
  const handleViewProfile = (memberId, agencyRole) => {
    if (agencyRole === 'agency_admin') {
      navigate(`/agency-admin-profile/${memberId}`);
    } else {
      navigate(`/agent-profile/${memberId}`);
    }
  };

  const totalItems = showPendingRequests ? filteredPendingRequests.length : filteredMembers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = showPendingRequests
    ? filteredPendingRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : filteredMembers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const totalAdmins = members.filter(member => member.agency_role === 'agency_admin').length;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Conditionally render sidebar for agency_admin role */}
      {user?.role === 'agency_admin' && (
        <>
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
        </>
      )}
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

          {/* Desktop View: Search, Tabs, View Mode on one line */}
          <div className="hidden md:grid grid-cols-3 items-center gap-4 mb-6 max-w-[1344px] mx-auto">
            {/* Search Bar (Left) */}
            <div className="flex justify-start w-full relative">
  <div className="w-full relative" ref={filterAreaRef}> {/* Expanded ref scope here */}
    <input
      type="text"
      placeholder="Search members by name or email..."
      value={searchTerm}
      onChange={handleSearchChange}
      className={`w-full max-w-[28rem] px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
    />
    <button
      onClick={(e) => {
        e.stopPropagation();
        setTimeout(() => {
          setShowSearchBarFilters(prev => !prev);
        }, 0); // Delay prevents event clash
      }}
      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`}
      title="Filter Members"
    >
      <SlidersHorizontal size={20} />
    </button>

    <AnimatePresence>
      {showSearchBarFilters && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4
            ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
        >
          <div>
            <label htmlFor="member-role-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Member Role
            </label>
            <Dropdown
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'agent', label: 'Agents' },
                { value: 'agency_admin', label: 'Admins' },
              ]}
              value={memberRoleFilter}
              onChange={handleMemberRoleChange}
              placeholder="Select Role"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="member-status-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Rank
            </label>
            <Dropdown
              options={[
                { value: 'all', label: 'All Ranks' },
                { value: 'vip', label: 'VIP' },
                { value: 'regular', label: 'Regular' },
              ]}
              value={memberStatusFilter}
              onChange={handleMemberStatusChange}
              placeholder="Select Rank"
              className="w-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div>


            {/* Tabs for Your Members / Pending Requests (Center) */}
            <div className="flex justify-center w-full max-w-[28rem] whitespace-nowrap">
              <button
                onClick={() => { setShowPendingRequests(false); setPage(1); }}
                className={`w-1/2 px-4 py-[11px] text-sm font-semibold rounded-l-xl truncate transition-colors duration-200
                        ${!showPendingRequests ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
              >
                Your Members ({members.length})
              </button>
              <button
                onClick={() => { setShowPendingRequests(true); setPage(1); }}
                className={`w-1/2 px-4 py-[11px] text-sm font-semibold rounded-r-xl truncate transition-colors duration-200
                        ${showPendingRequests ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
              >
                Pending Requests ({pendingRequests.length})
              </button>
            </div>

            {/* View Mode Controls (Right) */}
            <div className="flex justify-end gap-2 items-center">
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
                <LayoutList className="h-6 w-6" />
              </button>
              <button
                onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultMembersView', 'graphical'); }}
                className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
              >
                <Squares2X2Icon className="h-6 w-6" />
              </button>
            </div>
          </div>


          {/* Mobile View: Search and View Mode on one line, Tabs below */}
          <div className="md:hidden flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              {/* Search Bar with integrated Filter Icon */}
              <div className="flex-1 relative" ref={filterAreaRef}> {/* Wrapped search and filter in one ref */}
                <input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters(prev => !prev); }} // Stop propagation here
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`}
                  title="Filter Members"
                >
                  <SlidersHorizontal size={20} />
                </button>
                <AnimatePresence>
                  {showSearchBarFilters && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4
                        ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
                    >
                      <div>
                        <label htmlFor="member-role-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Member Role
                        </label>
                        <Dropdown
                          options={[
                            { value: 'all', label: 'All Roles' },
                            { value: 'agent', label: 'Agents' },
                            { value: 'agency_admin', label: 'Admins' },
                          ]}
                          value={memberRoleFilter}
                          onChange={handleMemberRoleChange}
                          placeholder="Select Role"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="member-status-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Rank
                        </label>
                        <Dropdown
                          options={[
                            { value: 'all', label: 'All Ranks' },
                            { value: 'vip', label: 'VIP' },
                            { value: 'regular', label: 'Regular' },
                          ]}
                          value={memberStatusFilter}
                          onChange={handleMemberStatusChange}
                          placeholder="Select Rank"
                          className="w-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View Mode Controls (Right) */}
              <div className="flex gap-2 items-center flex-shrink-0">
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
                <button onClick={() => { setViewMode('simple'); localStorage.setItem('defaultMembersView', 'simple'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <LayoutList className="h-6 w-6" />
                </button>
                <button
                  onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultMembersView', 'graphical'); }}
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                >
                  <Squares2X2Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
            {/* Tabs for Your Members / Pending Requests (Below) */}
            <div className="flex justify-center">
              <button
                onClick={() => { setShowPendingRequests(false); setPage(1); }}
                className={`px-6 py-2 rounded-l-xl text-lg font-semibold transition-colors duration-200 flex-1 whitespace-nowrap flex-shrink-0
                          ${!showPendingRequests ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
              >
                Your Members ({members.length})
              </button>
              <button
                onClick={() => { setShowPendingRequests(true); setPage(1); }}
                className={`px-6 py-2 rounded-r-xl text-lg font-semibold transition-colors duration-200 flex-1 whitespace-nowrap flex-shrink-0
                          ${showPendingRequests ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
              >
                Pending Requests ({pendingRequests.length})
              </button>
            </div>
          </div>

          {isLoading ? ( // Conditionally render skeleton when loading
            <MembersSkeleton darkMode={darkMode} viewMode={viewMode} />
          ) : showPendingRequests ? (
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
                        phone: request.agent_phone, // Pass phone for pending requests
                        profile_picture_url: request.agent_profile_picture_url,
                        requested_at: request.requested_at,
                        request_status: request.request_status,
                        request_id: request.request_id,
                        agency_role: 'pending', // Pending requests don't have a role yet in the agency
                        user_status: 'pending',
                        member_status: request.member_status || 'regular',
                      }}
                      acceptAction={handleAcceptRequest}
                      rejectAction={handleRejectRequest}
                      isPendingRequestCard={true}
                      darkMode={darkMode}
                      user={user}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}> {/* Removed table-fixed */}
                    <thead>
                      <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <th onClick={() => handleSortClick('agent_name')} className="cursor-pointer text-left py-2 px-2 whitespace-nowrap min-w-[120px]">Name {renderSortIcon('agent_name')}</th>
                        <th onClick={() => handleSortClick('agent_email')} className="cursor-pointer text-left py-2 px-2 whitespace-nowrap min-w-[150px]">Email {renderSortIcon('agent_email')}</th>
                        <th className="text-left py-2 px-2 whitespace-nowrap min-w-[100px]">Phone</th> {/* New Phone Header */}
                        <th onClick={() => handleSortClick('requested_at')} className="cursor-pointer text-left py-2 px-2 whitespace-nowrap min-w-[100px]">Requested At {renderSortIcon('requested_at')}</th>
                        <th className="text-left py-2 px-2 whitespace-nowrap min-w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                      {paginatedData.map(request => (
                        <tr
                          key={request.request_id}
                          className={`border-t cursor-pointer ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                          onClick={() => handleViewProfile(request.agent_id, 'pending')} // Pass 'pending' as role for consistent handling
                        >
                          <td className="px-2 py-2 break-words" title={request.agent_name}>{request.agent_name}</td>
                          <td className="px-2 py-2 break-words" title={request.agent_email}>{request.agent_email}</td>
                          <td className="px-2 py-2 break-words" title={request.agent_phone}>{request.agent_phone || 'N/A'}</td> {/* New Phone Data */}
                          <td className="px-2 py-2 break-words">{new Date(request.requested_at).toLocaleDateString()}</td>
                          <td className="px-2 py-2 flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}> {/* Stop propagation for action buttons */}
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
                        member_status: member.member_status || 'regular',
                      }}
                      onViewProfile={handleViewProfile}
                      onRemoveMember={handleRemoveMember}
                      onPromoteMember={handlePromoteMember}
                      onDemoteMember={handleDemoteMember}
                      onToggleMemberStatus={handleToggleMemberStatus}
                      isPendingRequestCard={false}
                      darkMode={darkMode}
                      user={user}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}> {/* Removed table-fixed */}
                    <thead>
                      <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <th onClick={() => handleSortClick('full_name')} className="cursor-pointer text-left py-2 px-2 whitespace-nowrap min-w-[120px]">Name {renderSortIcon('full_name')}</th>
                        <th onClick={() => handleSortClick('email')} className="cursor-pointer text-left py-2 px-2 whitespace-nowrap min-w-[150px]">Email {renderSortIcon('email')}</th>
                        <th className="text-left py-2 px-2 whitespace-nowrap min-w-[100px]">Phone</th> {/* New Phone Header */}
                        <th onClick={() => handleSortClick('agency_role')} className="cursor-pointer text-left py-2 px-2 whitespace-nowrap min-w-[80px]">Role {renderSortIcon('agency_role')}</th>
                        <th onClick={() => handleSortClick('user_status')} className="cursor-pointer text-left py-2 px-2 whitespace-nowrap min-w-[80px]">Status {renderSortIcon('user_status')}</th>
                        <th onClick={() => handleSortClick('member_status')} className="cursor-pointer text-left py-2 px-2 whitespace-nowrap min-w-[80px]">Rank {renderSortIcon('member_status')}</th>
                        <th className="text-left py-2 px-2 whitespace-nowrap min-w-[150px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                      {paginatedData.map(member => (
                        <tr
                          key={member.user_id}
                          className={`border-t cursor-pointer ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                          onClick={() => handleViewProfile(member.user_id, member.agency_role)}
                        >
                          <td className="px-2 py-2 break-words" title={member.full_name}>{member.full_name}</td>
                          <td className="px-2 py-2 break-words" title={member.email}>{member.email}</td>
                          <td className="px-2 py-2 break-words" title={member.phone}>{member.phone || 'N/A'}</td> {/* New Phone Data */}
                          <td className={`px-2 py-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} break-words`} title={member.agency_role || 'agent'}>{member.agency_role === 'agency_admin' ? 'Admin' : (member.agency_role || 'Agent')}</td>
                          <td className={`px-2 py-2 font-semibold ${member.user_status === 'banned' ? 'text-red-600' : member.user_status === 'deactivated' ? 'text-yellow-600' : 'text-green-600'} break-words`} title={member.user_status || 'active'}>{(member.user_status || 'active').charAt(0).toUpperCase() + (member.user_status || 'active').slice(1)}</td>
                          <td className="px-2 py-2 break-words">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                                ${member.member_status === 'vip' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                              {capitalizeFirstLetter(member.member_status || 'regular')}
                            </span>
                          </td>
                          <td className="px-2 py-2 flex gap-1 items-center flex-wrap" onClick={(e) => e.stopPropagation()}> {/* Stop propagation for action buttons */}
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
    </div>
  );
};

export default Members;

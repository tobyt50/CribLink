import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import AgentSidebar from '../../components/agent/Sidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'; // Added ArchiveBoxIcon
import { Menu, X, Users, MessageSquare, RefreshCw, Building, Tag, Clock, User } from 'lucide-react'; // Added Clock, User for consistency
import { useTheme } from '../../layouts/AppShell';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import AgentInquiryModal from '../../components/AgentInquiryModal'; // Import AgentInquiryModal

// Skeleton loader for a single client row
const ClientTableRowSkeleton = ({ darkMode }) => (
  <tr className={`border-t animate-pulse ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
    <td className="px-2 py-2">
      <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
    <td className="px-2 py-2">
      <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
    <td className="px-2 py-2">
      <div className={`h-4 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
    <td className="px-2 py-2">
      <div className={`h-4 w-2/3 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
    <td className="px-2 py-2 flex gap-2">
      <div className={`h-8 w-16 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
  </tr>
);

// Skeleton loader for a single inquiry card (mobile view)
const InquiryCardSkeleton = ({ darkMode }) => (
  <div className={`p-4 rounded-xl shadow-md animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-full mr-4 ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
        <div className={`h-6 w-32 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      </div>
      <div className={`h-6 w-20 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </div>
    <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-1`}></div>
    <div className={`h-4 w-2/3 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-1`}></div>
    <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-1`}></div>
    <div className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    <div className="mt-2 flex gap-2 justify-end">
      <div className={`h-8 w-16 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </div>
  </div>
);

// Skeleton loader for a single inquiry table row (desktop view)
const InquiryTableRowSkeleton = ({ darkMode }) => (
  <tr className={`border-t animate-pulse ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
    <td className="py-2 px-2">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full mr-3 ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
        <div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      </div>
    </td>
    <td className="py-2 px-2">
      <div className={`h-4 w-32 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
    <td className="py-2 px-2">
      <div className={`h-4 w-40 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
    <td className="py-2 px-2">
      <div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
    <td className="py-2 px-2">
      <div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
    <td className="py-2 px-2">
      <div className={`h-4 w-20 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
    <td className="py-2 px-2 flex gap-2">
      <div className={`h-8 w-16 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </td>
  </tr>
);


const Archive = () => {
  const [clients, setClients] = useState([]);
  const [inquiries, setInquiries] = useState([]); // New state for archived inquiries
  const [agentId, setAgentId] = useState(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('archive'); // Set default active section for sidebar

  // Keep activeTab initialized to 'clients'
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'inquiries'

  // State for sorting clients
  const [sortKeyClients, setSortKeyClients] = useState('archived_at');
  const [sortDirectionClients, setSortDirectionClients] = useState('desc');

  // State for sorting inquiries
  const [sortKeyInquiries, setSortKeyInquiries] = useState('last_message_timestamp'); // Default sort for inquiries
  const [sortDirectionInquiries, setSortDirectionInquiries] = useState('desc');

  // States for AgentInquiryModal and profile picture expansion
  const [isAgentInquiryModalOpen, setIsAgentInquiryModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null); // To track which conversation is currently open in modal
  const [isProfilePicExpanded, setIsProfilePicExpanded] = useState(false);
  const [expandedProfilePicUrl, setExpandedProfilePicUrl] = useState('');
  const [expandedProfilePicName, setExpandedProfilePicName] = useState('');
  const profilePicRef = useRef(null);

  // Loading states
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInquiries, setLoadingInquiries] = useState(true);


  // Memoize selected conversation for the modal
  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return inquiries.find(conv => conv.id === selectedConversationId);
  }, [selectedConversationId, inquiries]);

  // Helper to get initial for placeholder images
  const getInitial = (name) => {
    const safeName = String(name || '');
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : 'N/A';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgentId(data.user_id);
      } catch (err) {
        console.error("Failed to fetch agent profile:", err);
        showMessage('Failed to load profile. Please sign in again.', 'error');
        navigate('/signin');
      }
    };
    fetchProfile();
  }, [navigate, showMessage]);

  const fetchArchivedClients = useCallback(async () => {
    if (!agentId) return;
    setLoadingClients(true); // Start loading for clients
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.get(`${API_BASE_URL}/clients/agent/${agentId}/archived-clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(data);
    } catch (err) {
      console.error('Fetch archived clients error:', err);
      showMessage('Failed to fetch archived clients.', 'error');
    } finally {
      setLoadingClients(false); // End loading for clients
    }
  }, [agentId, showMessage]);

  const fetchArchivedInquiries = useCallback(async () => {
    if (!agentId) return;
    setLoadingInquiries(true); // Start loading for inquiries
    const token = localStorage.getItem('token');
    try {
      // Assuming a new endpoint for archived inquiries for the agent
      const res = await fetch(`${API_BASE_URL}/inquiries/agent/archived?sort=${sortKeyInquiries}&direction=${sortDirectionInquiries}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch (err) {
      console.error('Fetch archived inquiries error:', err);
      showMessage('Failed to fetch archived inquiries.', 'error');
    } finally {
      setLoadingInquiries(false); // End loading for inquiries
    }
  }, [agentId, showMessage, sortKeyInquiries, sortDirectionInquiries]);

  // Modified useEffect to fetch both clients and inquiries once agentId is available
  useEffect(() => {
    if (agentId) {
      fetchArchivedClients();
      fetchArchivedInquiries();
    }
  }, [agentId, fetchArchivedClients, fetchArchivedInquiries]); // Removed activeTab from dependencies

  // Effect to handle clicks outside the expanded profile picture
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profilePicRef.current && !profilePicRef.current.contains(event.target)) {
        setIsProfilePicExpanded(false);
      }
    };

    if (isProfilePicExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfilePicExpanded]);

  const handleRestoreClient = async (clientId) => {
    const token = localStorage.getItem('token');
    showConfirm({
      title: "Restore Client",
      message: "Are you sure you want to restore this client?",
      onConfirm: async () => {
        try {
          await axios.post(`${API_BASE_URL}/clients/agent/${agentId}/archived-clients/${clientId}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setClients((prev) => prev.filter((c) => c.user_id !== clientId));
          showMessage('Client restored successfully!', 'success');
        } catch (err) {
          console.error('Restore failed:', err);
          showMessage('Failed to restore client. Please try again.', 'error');
        }
      },
      confirmLabel: "Restore",
      cancelLabel: "Cancel"
    });
  };

  const handleDeleteClientPermanently = async (clientId) => {
    showConfirm({
      title: "Permanently Delete Client",
      message: "Are you sure you want to permanently delete this archived client? This action cannot be undone.",
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          showMessage('Authentication token not found. Please sign in.', 'error');
          navigate('/signin');
          return;
        }

        try {
          await axios.delete(`${API_BASE_URL}/clients/agent/${agentId}/archived-clients/${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setClients((prev) => prev.filter((c) => c.user_id !== clientId));
          showMessage('Archived client deleted permanently.', 'success');
        } catch (err) {
          console.error('Delete failed:', err);
          showMessage('Failed to permanently delete client. Please try again.', 'error');
        }
      },
      confirmLabel: "Delete Permanently",
      cancelLabel: "Cancel"
    });
  };

  const handleRestoreInquiry = async (conversationId) => {
    const token = localStorage.getItem('token');
    showConfirm({
      title: "Restore Inquiry",
      message: "Are you sure you want to restore this inquiry to your active list?",
      onConfirm: async () => {
        try {
          // Assuming an endpoint to unarchive an inquiry for the current agent
          await axios.put(`${API_BASE_URL}/inquiries/${conversationId}/restore-for-agent`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setInquiries((prev) => prev.filter((inq) => inq.id !== conversationId));
          showMessage('Inquiry restored successfully!', 'success');
          // If the modal is open for this conversation, close it after restoring
          if (selectedConversationId === conversationId) {
            setIsAgentInquiryModalOpen(false);
            setSelectedConversationId(null);
            setOpenedConversationId(null);
          }
        } catch (err) {
          console.error('Restore inquiry failed:', err);
          showMessage('Failed to restore inquiry. Please try again.', 'error');
        }
      },
      confirmLabel: "Restore",
      cancelLabel: "Cancel"
    });
  };

  const handleDeleteInquiry = async (conversationId, isReassignedFromMe) => {
    showConfirm({
      title: isReassignedFromMe ? "Remove from Archive" : "Delete Inquiry",
      message: isReassignedFromMe ? "Are you sure you want to remove this reassigned chat from your archive? It will be permanently deleted if the client also deletes it." : "Are you sure you want to delete this inquiry from your archive? It will be permanently deleted if the client also deletes it.",
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          showMessage('Authentication token not found. Please sign in.', 'error');
          navigate('/signin');
          return;
        }

        try {
          // Use the soft-delete endpoint available to agents
          await axios.delete(`${API_BASE_URL}/inquiries/agent/delete-conversation/${conversationId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setInquiries((prev) => prev.filter((inq) => inq.id !== conversationId));
          showMessage('Inquiry deleted from archive.', 'success');
          // If the modal is open for this conversation, close it after deleting
          if (selectedConversationId === conversationId) {
            setIsAgentInquiryModalOpen(false);
            setSelectedConversationId(null);
            setOpenedConversationId(null);
          }
        } catch (err) {
          console.error('Delete inquiry failed:', err);
          showMessage('Failed to delete inquiry. Please try again.', 'error');
        }
      },
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
  };

  // Function to handle opening the inquiry modal
  const handleViewConversation = useCallback(async (conversation) => {
    setSelectedConversationId(conversation.id);
    setIsAgentInquiryModalOpen(true);
    setOpenedConversationId(conversation.id); // Set the conversation as opened
    // For archived inquiries, marking as read/opened might not be necessary on view,
    // but keeping the structure similar for consistency.
    // If you need to mark archived inquiries as 'viewed', add an API call here.
  }, []);

  const handleProfilePicClick = (url, name) => {
    setExpandedProfilePicUrl(url);
    setExpandedProfilePicName(name);
    setIsProfilePicExpanded(true);
  };

  const handleSendMessageToConversation = async (conversationId, messageText) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/inquiries/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          conversation_id: conversationId,
          property_id: selectedConversation?.property_id,
          message_content: messageText,
          recipient_id: selectedConversation?.client_id,
          message_type: 'agent_reply',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showMessage('Message sent successfully!', 'success');

      // After sending the message, unarchive the chat
      await axios.put(`${API_BASE_URL}/inquiries/${conversationId}/restore-for-agent`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage('Chat unarchived successfully!', 'success');

      // Close the modal and refetch archived inquiries to update the list
      setIsAgentInquiryModalOpen(false);
      setSelectedConversationId(null);
      setOpenedConversationId(null);
      fetchArchivedInquiries();

    } catch (error) {
      console.error("Failed to send message or unarchive chat:", error);
      showMessage("Failed to send message or unarchive chat. Please try again.", 'error');
    }
  };


  const handleSortClick = (key, type) => {
    if (type === 'clients') {
      const sortableColumns = ['full_name', 'email', 'client_status', 'archived_at'];
      if (!sortableColumns.includes(key)) return;

      if (sortKeyClients === key) {
        setSortDirectionClients(sortDirectionClients === 'asc' ? 'desc' : 'asc');
      } else {
        setSortKeyClients(key);
        setSortDirectionClients('asc');
      }
    } else { // type === 'inquiries'
      const sortableColumns = ['clientName', 'propertyTitle', 'lastMessageTimestamp', 'agent_name', 'reassigned_at'];
      if (!sortableColumns.includes(key)) return;

      if (sortKeyInquiries === key) {
        setSortDirectionInquiries(sortDirectionInquiries === 'asc' ? 'desc' : 'asc');
      } else {
        setSortKeyInquiries(key);
        setSortDirectionInquiries('asc');
      }
    }
  };

  const renderSortIcon = (key, type) => {
    const currentSortKey = type === 'clients' ? sortKeyClients : sortKeyInquiries;
    const currentSortDirection = type === 'clients' ? sortDirectionClients : sortDirectionInquiries;

    if (currentSortKey === key) {
      return currentSortDirection === 'asc' ? (
        <ArrowUpIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      ) : (
        <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      );
    }
    return <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;
  };

  const sortedClients = [...clients].sort((a, b) => {
    const aValue = a[sortKeyClients];
    const bValue = b[sortKeyClients];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirectionClients === 'asc' ? -1 : 1;
    if (bValue == null) return sortDirectionClients === 'asc' ? 1 : -1;

    const typeA = typeof aValue;
    const typeB = typeof bValue;

    if (typeA === 'string' && typeB === 'string') {
      return sortDirectionClients === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (typeA === 'number' && typeB === 'number') {
      return sortDirectionClients === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (sortKeyClients === 'archived_at') {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortDirectionClients === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    }
    if (aValue < bValue) {
      return sortDirectionClients === 'asc' ? -1 : 1;
    } else if (aValue > bValue) {
      return sortDirectionClients === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const sortedInquiries = [...inquiries].sort((a, b) => {
    let aValue, bValue;

    if (sortKeyInquiries === 'clientName') {
      aValue = a.clientName || '';
      bValue = b.clientName || '';
    } else if (sortKeyInquiries === 'propertyTitle') {
      aValue = a.propertyTitle || '';
      bValue = b.propertyTitle || '';
    } else if (sortKeyInquiries === 'lastMessageTimestamp') {
      aValue = new Date(a.lastMessageTimestamp || 0).getTime();
      bValue = new Date(b.lastMessageTimestamp || 0).getTime();
    } else if (sortKeyInquiries === 'agent_name') {
      aValue = a.agent_name || '';
      bValue = b.agent_name || '';
    } else if (sortKeyInquiries === 'reassigned_at') {
      aValue = new Date(a.reassigned_at || 0).getTime();
      bValue = new Date(b.reassigned_at || 0).getTime();
    } else {
      aValue = a[sortKeyInquiries];
      bValue = b[sortKeyInquiries];
    }

    if (typeof aValue === 'string' || typeof bValue === 'string') {
      return sortDirectionInquiries === 'asc' ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
    }
    return sortDirectionInquiries === 'asc' ? aValue - bValue : bValue - aValue;
  });


  // Adjust contentShift based on isCollapsed and isMobile states, consistent with other agent pages
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-4 md:px-0 min-h-screen flex flex-col`}>
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

      <AgentSidebar
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
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Archive</h1>
        </div>
        {/* Desktop-only centered title */}
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Archive</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}>

          {/* Tab Buttons for Clients and Inquiries */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-6 py-2 rounded-l-xl text-sm font-semibold transition-colors duration-200
                        ${activeTab === 'clients' ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
            >
              Clients ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-6 py-2 rounded-r-xl text-sm font-semibold transition-colors duration-200
                        ${activeTab === 'inquiries' ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
            >
              Inquiries ({inquiries.length})
            </button>
          </div>

          {activeTab === 'clients' ? (
            loadingClients ? (
              <div className="overflow-x-auto">
                <table className={`w-full text-sm  table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <thead>
                    <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      <th className="text-left px-2 py-2 whitespace-nowrap">Name</th>
                      <th className="text-left px-2 py-2 whitespace-nowrap">Email</th>
                      <th className="text-left px-2 py-2 whitespace-nowrap">Status</th>
                      <th className="text-left px-2 py-2 whitespace-nowrap">Archived</th>
                      <th className="text-left px-2 py-2 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                    {[...Array(5)].map((_, i) => <ClientTableRowSkeleton key={i} darkMode={darkMode} />)}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full text-sm  table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <thead>
                    <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {['full_name', 'email', 'client_status', 'archived_at', 'Actions'].map((key) => (
                          <th
                              key={key}
                              onClick={key !== 'Actions' ? () => handleSortClick(key, 'clients') : undefined}
                              className={`text-left px-2 py-2 whitespace-nowrap ${key !== 'Actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                          >
                              <div className="flex items-center gap-1">
                                  <span className="truncate">
                                      {{
                                          full_name: 'Name',
                                          client_status: 'Status',
                                          archived_at: 'Archived',
                                      }[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                  {renderSortIcon(key, 'clients')}
                              </div>
                          </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                    {sortedClients.map(client => (
                      <tr key={client.user_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                        <td className="px-2 py-2 whitespace-nowrap max-w-[150px] truncate" title={client.full_name}>
                          {/* Client Name clickable */}
                          {client.user_id ? (
                              <span
                                  className="cursor-pointer hover:underline"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/agent/client-profile/${client.user_id}`); }}
                              >
                                  {client.full_name}
                              </span>
                          ) : (
                              <span>{client.full_name}</span>
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap max-w-[200px] truncate" title={client.email}>{client.email}</td>
                        <td className={`px-2 py-2 whitespace-nowrap max-w-[100px] truncate ${
                            client.client_status === 'vip' ? 'text-green-600' :
                            client.client_status === 'regular' ? 'text-gray-600' :
                            (darkMode ? 'text-gray-300' : 'text-gray-700')
                        }`} title={client.client_status}>{client.client_status}</td>
                        <td className="px-2 py-2 whitespace-nowrap max-w-[120px] truncate" title={new Date(client.archived_at).toLocaleDateString()}>{new Date(client.archived_at).toLocaleDateString()}</td>
                        <td className="px-2 py-2 whitespace-nowrap flex items-center gap-2">
                          <button
                            onClick={() => handleRestoreClient(client.user_id)}
                            className={`text-sm hover:underline ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-700 hover:text-green-800"}`}
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleDeleteClientPermanently(client.user_id)}
                            className={`p-1 ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
                            title="Permanently Delete Client"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedClients.length === 0 && (
                      <tr>
                        <td colSpan={5} className={`text-center py-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          No archived clients found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Inquiries tab content
            loadingInquiries ? (
              isMobile ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <InquiryCardSkeleton key={i} darkMode={darkMode} />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm  table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <thead>
                      <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <th className="text-left px-2 py-2 whitespace-nowrap">Client</th>
                        <th className="text-left px-2 py-2 whitespace-nowrap">Property</th>
                        <th className="text-left px-2 py-2 whitespace-nowrap">Last Message</th>
                        <th className="text-left px-2 py-2 whitespace-nowrap">Last Activity</th>
                        <th className="text-left px-2 py-2 whitespace-nowrap">Archived By</th>
                        <th className="text-left px-2 py-2 whitespace-nowrap">Reassigned At</th>
                        <th className="text-left px-2 py-2 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                      {[...Array(5)].map((_, i) => <InquiryTableRowSkeleton key={i} darkMode={darkMode} />)}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <>
                {isMobile ? (
                  // Mobile-friendly list view for inquiries
                  <div className="space-y-4">
                    {sortedInquiries.length > 0 ? (
                      sortedInquiries.map(inq => {
                        const isReassignedFromMe = inq.isReassignedFromMe; // Use the flag from the backend
                        return (
                          <div
                            key={inq.id}
                            className={`p-4 rounded-xl shadow-md cursor-pointer ${darkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-800"} ${isReassignedFromMe ? 'opacity-60 border-l-4 border-yellow-500' : ''}`}
                            onClick={() => handleViewConversation(inq)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <img
                                  src={inq.clientProfilePictureUrl || `https://placehold.co/40x40/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(inq.clientName)}`}
                                  alt="Client Profile"
                                  className="w-12 h-12 rounded-full mr-4 object-cover cursor-pointer"
                                  onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/40x40/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(inq.clientName)}`; }}
                                  onClick={(e) => { e.stopPropagation(); handleProfilePicClick(inq.clientProfilePictureUrl, inq.clientName); }}
                                />
                                <h4 className={`text-lg font-semibold`}>
                                  {/* Client Name clickable */}
                                  {inq.client_id ? (
                                      <span
                                          className="cursor-pointer hover:underline"
                                          onClick={(e) => { e.stopPropagation(); navigate(`/agent/client-profile/${inq.client_id}`); }}
                                      >
                                          {inq.clientName}
                                      </span>
                                  ) : (
                                      <span>{inq.clientName}</span>
                                  )}
                                </h4>
                              </div>
                              {isReassignedFromMe && (
                                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  Reassigned
                                </span>
                              )}
                            </div>
                            <div>
                              <p className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <Building size={14} className="inline-block mr-1" />
                                <span className="font-medium">{inq.propertyTitle || 'General Inquiry'}</span>
                                {inq.property_id && (
                                  <button
                                    onClick={e => { e.stopPropagation(); navigate(`/listings/${inq.property_id}`); }}
                                    className="ml-2 py-0.5 px-1.5 bg-blue-500 text-white rounded-md text-xs"
                                  >
                                    View Property
                                  </button>
                                )}
                              </p>
                              <p className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <User size={14} className="inline-block mr-1" />
                                Archived By: {/* Agent Name clickable */}
                                <span
                                  className={`font-medium ${inq.agent_id ? 'cursor-pointer hover:underline' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (inq.agent_id) navigate(`/agent-profile/${inq.agent_id}`);
                                  }}
                                >
                                  {inq.agent_name || 'N/A'}
                                </span>
                              </p>
                              {isReassignedFromMe && inq.reassigned_by_admin_name && inq.reassigned_at && (
                                <p className={`text-xs mb-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                  <Tag size={12} className="inline-block mr-1" />
                                  Reassigned to {inq.agent_name} by {/* Admin Name clickable */}
                                  {inq.reassigned_by_admin_id ? (
                                      <span
                                          className="cursor-pointer hover:underline"
                                          onClick={(e) => { e.stopPropagation(); navigate(`/agency-admin-profile/${inq.reassigned_by_admin_id}`); }}
                                      >
                                          {inq.reassigned_by_admin_name}
                                      </span>
                                  ) : (
                                      <span>{inq.reassigned_by_admin_name}</span>
                                  )}
                                  on {new Date(inq.reassigned_at).toLocaleDateString()}
                                </p>
                              )}
                              <p className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <MessageSquare size={14} className="inline-block mr-1" />
                                Last Message: {inq.lastMessage || 'No messages yet'}
                              </p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Clock size={12} className="inline-block mr-1" />
                                {new Date(inq.lastMessageTimestamp).toLocaleString()}
                              </p>
                              <div className="mt-2 flex gap-2 justify-end">
                                  <button
                                      onClick={(e) => { e.stopPropagation(); handleRestoreInquiry(inq.id); }}
                                      className={`text-sm hover:underline ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-700 hover:text-green-800"}`}
                                  >
                                      Restore
                                  </button>
                                  <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteInquiry(inq.id, isReassignedFromMe); }}
                                      className={`p-1 ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
                                      title="Delete Inquiry"
                                  >
                                      <TrashIcon className="h-5 w-5" />
                                  </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No archived inquiries found.</p>
                    )}
                  </div>
                ) : (
                  // Desktop table view for inquiries (existing code)
                  <div className="overflow-x-auto">
                    <table className={`w-full text-sm  table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <thead>
                        <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {[{key: 'clientName', label: 'Client'}, {key: 'propertyTitle', label: 'Property'}, {key: 'lastMessage', label: 'Last Message'}, {key: 'lastMessageTimestamp', label: 'Last Activity'}, {key: 'agent_name', label: 'Archived By'}, {key: 'reassigned_at', label: 'Reassigned At'}, {key: 'Actions', label: 'Actions'}].map(c => (
                              <th
                                  key={c.key}
                                  onClick={c.key !== 'Actions' ? () => handleSortClick(c.key, 'inquiries') : undefined}
                                  className={`text-left px-2 py-2 whitespace-nowrap ${c.key !== 'Actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                              >
                                  <div className="flex items-center gap-1">
                                      <span className="truncate">{c.label}</span>
                                      {renderSortIcon(c.key, 'inquiries')}
                                  </div>
                              </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                        {sortedInquiries.map(inq => {
                          const isReassignedFromMe = inq.isReassignedFromMe; // Use the flag from the backend
                          return (
                            <tr key={inq.id} className={`border-t cursor-pointer max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"} ${isReassignedFromMe ? 'opacity-60 bg-yellow-100 dark:bg-yellow-900' : ''}`} onClick={() => handleViewConversation(inq)}>
                              <td className="px-2 py-2 truncate" title={inq.clientName}>
                                <div className="flex items-center">
                                    <img
                                        src={inq.clientProfilePictureUrl || `https://placehold.co/40x40/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(inq.clientName)}`}
                                        alt="Client Profile"
                                        className="w-8 h-8 rounded-full mr-3 object-cover cursor-pointer"
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/40x40/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(inq.clientName)}`; }}
                                        onClick={(e) => { e.stopPropagation(); handleProfilePicClick(inq.clientProfilePictureUrl, inq.clientName); }}
                                    />
                                    <span className="flex items-center">
                                      {/* Client Name clickable */}
                                      {inq.client_id ? (
                                          <span
                                              className="cursor-pointer hover:underline"
                                              onClick={e => { e.stopPropagation(); navigate(`/agent/client-profile/${inq.client_id}`) }}
                                          >
                                              {inq.clientName}
                                          </span>
                                      ) : (
                                          <span>{inq.clientName}</span>
                                      )}
                                      {isReassignedFromMe && (
                                        <span className="ml-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                          Reassigned
                                        </span>
                                      )}
                                    </span>
                                </div> {/* Closing div for flex items-center */}
                              </td>
                              <td className="px-2 py-2 truncate" title={inq.propertyTitle}>
                                <span className="flex items-center">{inq.propertyTitle || 'General Inquiry'}
                                    {inq.property_id && (
                                        <button
                                            onClick={e => { e.stopPropagation(); navigate(`/listings/${inq.property_id}`); }}
                                            className="ml-2 py-1 px-2 bg-blue-500 text-white rounded-xl text-xs"
                                        >
                                            View
                                        </button>
                                    )}
                                </span>
                              </td>
                              <td className="px-2 py-2 truncate" title={inq.lastMessage}>{inq.lastMessage || 'No messages'}</td>
                              <td className="px-2 py-2 truncate">{new Date(inq.lastMessageTimestamp).toLocaleString()}</td>
                              <td className="px-2 py-2 truncate" title={inq.agent_name}>
                                {/* Agent Name clickable */}
                                <span
                                  className={`font-medium ${inq.agent_id ? 'cursor-pointer hover:underline' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (inq.agent_id) navigate(`/agent-profile/${inq.agent_id}`);
                                  }}
                                >
                                  {inq.agent_name || 'N/A'}
                                </span>
                                {isReassignedFromMe && inq.reassigned_by_admin_name && inq.reassigned_at && (
                                  <p className={`text-xs ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                    (from {inq.original_agent_name} by {/* Admin Name clickable */}
                                    {inq.reassigned_by_admin_id ? (
                                        <span
                                            className="cursor-pointer hover:underline"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/agency-admin-profile/${inq.reassigned_by_admin_id}`); }}
                                        >
                                            {inq.reassigned_by_admin_name}
                                        </span>
                                    ) : (
                                        <span>{inq.reassigned_by_admin_name}</span>
                                    )}
                                    )
                                  </p>
                                )}
                              </td>
                              <td className="px-2 py-2 truncate">{inq.reassigned_at ? new Date(inq.reassigned_at).toLocaleDateString() : 'N/A'}</td>
                              <td className="px-2 py-2 whitespace-nowrap flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRestoreInquiry(inq.id); }}
                                  className={`text-sm hover:underline ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-700 hover:text-green-800"}`}
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteInquiry(inq.id, isReassignedFromMe); }}
                                  className={`p-1 ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
                                  title="Delete Inquiry"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {sortedInquiries.length === 0 && (
                          <tr>
                            <td colSpan={7} className={`text-center py-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              No archived inquiries found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isAgentInquiryModalOpen && selectedConversation && (
          <AgentInquiryModal
            isOpen={isAgentInquiryModalOpen}
            onClose={() => {
              setIsAgentInquiryModalOpen(false);
              setSelectedConversationId(null);
              setOpenedConversationId(null); // Clear opened conversation ID when modal closes
              fetchArchivedInquiries(); // Refetch inquiries to ensure latest state
            }}
            conversation={selectedConversation}
            darkMode={darkMode}
            onViewProperty={(id) => navigate(`/listings/${id}`)}
            // For archived inquiries, 'onDelete' should trigger permanent delete or restore
            // Here, we'll map it to permanent delete as per the original Archive.js logic
            onDelete={() => handleDeleteInquiry(selectedConversation.id, selectedConversation.isReassignedFromMe)}
            onSendMessage={handleSendMessageToConversation}
            // isReassignedForCurrentAgent might not be directly relevant for archived,
            // but pass it if your archived inquiry data includes this context.
            isReassignedForCurrentAgent={selectedConversation.isReassignedFromMe || false}
          />
        )}

        {/* Expanded Profile Picture Modal */}
        {isProfilePicExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setIsProfilePicExpanded(false)} // Close on click outside
          >
            <motion.img
              ref={profilePicRef}
              src={expandedProfilePicUrl || `https://placehold.co/400x400/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(expandedProfilePicName)}`}
              alt={`${expandedProfilePicName} Profile Expanded`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl cursor-pointer"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Archive;

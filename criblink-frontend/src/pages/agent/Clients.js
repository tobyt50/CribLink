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
  ChevronDownIcon, // Import ChevronDownIcon for the Dropdown component
  PhoneIcon, // Import PhoneIcon for call action
  EnvelopeIcon, // Import EnvelopeIcon for email button
} from '@heroicons/react/24/outline';
import AgentSidebar from '../../components/agent/Sidebar';
import AgencyAdminSidebar from '../../components/agencyadmin/Sidebar'; // Import AgencyAdminSidebar
import API_BASE_URL from '../../config';
import { Menu, X, Search, SlidersHorizontal, FileText, LayoutGrid, LayoutList, Plus, UserPlus, UserMinus } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import ClientCard from '../../components/agent/ClientCard';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import AgentInquiryModal from '../../components/AgentInquiryModal';
import socket from '../../socket';

import { v4 as uuidv4 } from 'uuid';

// Reusable Dropdown Component (embedded directly in Clients.js)
// This component is copied from Listings.js to provide consistent dropdown functionality.
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


const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultListingsView') || 'simple');
  const [currentUserId, setCurrentUserId] = useState(null); // Renamed from agentId to currentUserId
  const [userRole, setUserRole] = useState('');
  const [agencyId, setAgencyId] = useState(null); // New state for agencyId
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('clients');

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
  const navigate = useNavigate();

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editedNoteContent, setEditedNoteContent] = useState('');

  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const [pendingRequests, setPendingRequests] = useState([]);
  const [filteredPendingRequests, setFilteredPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('your_clients'); // 'your_clients' or 'pending_requests'

  // States for AgentInquiryModal
  const [isAgentInquiryModalOpen, setIsAgentInquiryModalOpen] = useState(false);
  const [conversationForModal, setConversationForModal] = useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null);

  // New state for favorite clients
  const [favoriteClientsStatus, setFavoriteClientsStatus] = useState(new Set());


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to get the current authenticated user's ID and role from token
  const getAuthenticatedUserInfo = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return { userId: null, role: 'guest', agencyId: null };
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return { userId: decoded.user_id, role: decoded.role, agencyId: decoded.agency_id }; // Get agency_id from token
    } catch (error) {
      console.error("Error decoding token for authenticated user info:", error);
      return { userId: null, role: 'guest', agencyId: null };
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          showMessage('You are not logged in. Please sign in.', 'error');
          navigate('/signin');
          return;
        }

        const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data && data.user_id) {
          setCurrentUserId(data.user_id);
          const { userId, role, agencyId } = getAuthenticatedUserInfo();
          setUserRole(role);
          setAgencyId(agencyId); // Set agencyId
        } else {
          showMessage('Invalid user data. Please sign in again.', 'error');
          navigate('/signin');
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        showMessage('Failed to load user profile. Please sign in.', 'error');
        navigate('/signin');
      }
    };
    fetchProfile();
  }, [navigate, showMessage, getAuthenticatedUserInfo]);

  const fetchClientsAndRequests = useCallback(async () => {
    if (!currentUserId) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let clientsRes;

      if (userRole === 'agency_admin' && agencyId) {
        // Fetch all clients for the agency if user is agency_admin
        clientsRes = await axios.get(`${API_BASE_URL}/clients/agency/${agencyId}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (userRole === 'agent') {
        // Fetch clients for the specific agent
        clientsRes = await axios.get(`${API_BASE_URL}/clients/agent/${currentUserId}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // If not agent or agency_admin, clear clients and return
        setClients([]);
        setPendingRequests([]);
        return;
      }

      setClients(clientsRes.data);

      // Only fetch pending requests if the user is an agent
      if (userRole === 'agent') {
        const requestsRes = await axios.get(`${API_BASE_URL}/agents/${currentUserId}/connection-requests/incoming`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPendingRequests(requestsRes.data);
      } else {
        setPendingRequests([]); // Agency admins don't manage individual agent's pending requests here
      }

    } catch (err) {
      console.error('Failed to fetch data:', err);
      showMessage('Failed to fetch clients or requests. Please try again.', 'error');
    }
  }, [currentUserId, userRole, agencyId, showMessage]);

  // Fetch favorite clients
  const fetchFavoriteClients = useCallback(async () => {
    if (!currentUserId || (userRole !== 'agent' && userRole !== 'agency_admin')) {
      setFavoriteClientsStatus(new Set());
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/favourites/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const favoritedIds = new Set(response.data.favourites.map(fav => fav.user_id));
      setFavoriteClientsStatus(favoritedIds);
    } catch (error) {
      console.error("Error fetching favorite clients:", error.response?.data || error.message);
      // showMessage("Failed to load favorite clients.", "error"); // Suppress for cleaner UX
      setFavoriteClientsStatus(new Set());
    }
  }, [currentUserId, userRole]);


  useEffect(() => {
    fetchClientsAndRequests();
  }, [fetchClientsAndRequests, activeTab, userRole]); // Added userRole to dependencies

  useEffect(() => {
    fetchFavoriteClients();
  }, [fetchFavoriteClients, currentUserId, userRole]);


  // New: Fetch conversation for a specific client
  const fetchConversationForClient = useCallback(async (clientIdToFetch, agentIdForConversation) => {
    if (!clientIdToFetch || !agentIdForConversation) {
      console.log('Client ID or Agent ID not available for conversation fetch.');
      return null;
    }

    try {
      const token = localStorage.getItem('token');
      // The API endpoint now takes both agentId and clientId
      const res = await fetch(`${API_BASE_URL}/inquiries/agent/${agentIdForConversation}/client/${clientIdToFetch}/conversation`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();

        if (data && data.conversation) {
          const conv = data.conversation;

          const formattedMessages = conv.messages.map(msg => {
            const rawTimestamp = msg.timestamp || msg.created_at;
            const parsed = Date.parse(rawTimestamp);

            return {
              ...msg,
              sender: msg.sender_id === conv.client_id ? 'Client' : 'Agent',
              read: msg.read,
              timestamp: isNaN(parsed) ? null : new Date(parsed).toISOString(),
            };
          });

          return {
            id: conv.id,
            client_id: conv.client_id,
            agent_id: conv.agent_id,
            property_id: conv.property_id,
            // Find client details from the 'clients' state
            clientName: clients.find(c => c.user_id === conv.client_id)?.full_name || conv.client_full_name,
            clientEmail: clients.find(c => c.user_id === conv.client_id)?.email || conv.client_email,
            clientPhone: clients.find(c => c.user_id === conv.client_id)?.phone || conv.client_phone,
            propertyTitle: conv.property_title,
            messages: formattedMessages,
            lastMessage: conv.last_message,
            lastMessageTimestamp: conv.last_message_timestamp,
            is_agent_responded: conv.is_agent_responded,
            unreadCount: conv.unread_messages_count,
          };
        }

        return null;
      }
       else if (res.status === 404) {
        return null;
      } else {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to fetch client conversation:", err);
      showMessage('Failed to load client conversation.', 'error');
      return null;
    }
  }, [clients, showMessage]); // Removed agentId from dependencies, now passed as param


  // Effect to filter and sort clients
  useEffect(() => {
    let currentData = activeTab === 'your_clients' ? [...clients] : [...pendingRequests];

    if (searchTerm) {
      currentData = currentData.filter((item) => {
        if (activeTab === 'your_clients') {
          return (
            item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (userRole === 'agency_admin' && item.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        } else { // pending_requests
          return (
            item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.client_phone?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      });
    }

    currentData.sort((a, b) => {
      const aValue = activeTab === 'your_clients' ? a[sortKey] : a[`client_${sortKey}`] || a[sortKey]; // Handle client_name, client_email for pending
      const bValue = activeTab === 'your_clients' ? b[sortKey] : b[`client_${sortKey}`] || b[sortKey];

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    if (activeTab === 'your_clients') {
      setFilteredClients(currentData);
    } else {
      setFilteredPendingRequests(currentData);
    }
    setPage(1);
  }, [searchTerm, clients, pendingRequests, sortKey, sortDirection, activeTab, userRole]);


  const handleSendEmail = (client) => {
    // Directly open mail client
    if (client && client.email) {
      window.location.href = `mailto:${client.email}`;
    } else {
      showMessage('Email address not available for this client.', 'info');
    }
  };

  const handleCallClient = (phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      showMessage('Phone number not available for this client.', 'info');
    }
  };

  const handleOpenChat = useCallback(async (clientToChat) => {
    if (!clientToChat || !clientToChat.user_id) {
      showMessage('Client data is missing for chat. Please wait or refresh.', 'info');
      return;
    }
    // Determine the agent ID for the conversation.
    // If agency_admin, use the agent_id associated with the client.
    // If agent, use their own currentUserId.
    const agentIdForConversation = userRole === 'agency_admin' ? clientToChat.agent_id : currentUserId;

    if (!agentIdForConversation) {
      showMessage('Agent ID not available for conversation. Please try again later.', 'info');
      return;
    }

    let conversationToOpen = await fetchConversationForClient(clientToChat.user_id, agentIdForConversation);

    if (!conversationToOpen) {
      try {
        const token = localStorage.getItem('token');
        const createRes = await fetch(`${API_BASE_URL}/inquiries/general`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            client_id: clientToChat.user_id,
            agent_id: agentIdForConversation, // Use the determined agentIdForConversation
            message_content: null // Initial message content can be null for general inquiry
          })
        });

        if (createRes.ok) {
          const newConversationData = await createRes.json();
          const conversation = newConversationData.conversation;

          if (!conversation) {
            showMessage("No conversation data returned from backend.", "error");
            return;
          }

          conversationToOpen = {
            id: conversation.id,
            client_id: conversation.client_id,
            agent_id: conversation.agent_id,
            property_id: conversation.property_id,
            clientName: clients.find(c => c.user_id === conversation.client_id)?.full_name || conversation.client_full_name, // Corrected to use conversation.client_id
            clientEmail: clients.find(c => c.user_id === conversation.client_id)?.email || conversation.client_email, // Corrected to use conversation.client_id
            clientPhone: clients.find(c => c.user_id === conversation.client_id)?.phone || conversation.client_phone, // Corrected to use conversation.client_id
            propertyTitle: conversation.property_title || 'General Inquiry',
            messages: Array.isArray(conversation.messages)
              ? conversation.messages.map(msg => ({
                  inquiry_id: msg.inquiry_id,
                  sender: msg.sender_id === agentIdForConversation ? 'Agent' : 'Client', // Use agentIdForConversation here
                  sender_id: msg.sender_id,
                  message: msg.message,
                  timestamp: msg.timestamp,
                  read: msg.read
                }))
              : [],
            lastMessage: conversation.last_message,
            lastMessageTimestamp: conversation.last_message_timestamp,
            is_agent_responded: conversation.is_agent_responded,
            is_opened: conversation.is_opened,
            unreadCount: conversation.unread_messages_count || 0
          };

          showMessage('New general conversation started!', 'success');
        } else {
          const errorData = await createRes.json();
          showMessage(`Failed to start new general conversation: ${errorData.message || createRes.statusText}`, 'error');
          return;
        }
      } catch (err) {
        console.error("Error creating new general conversation:", err);
        showMessage('Failed to start new general conversation. Please try again.', 'error');
        return;
      }
    }

    console.log("🧾 Chat conversation being opened:", conversationToOpen);

    setConversationForModal({ ...conversationToOpen });
    setIsAgentInquiryModalOpen(true);
    setOpenedConversationId(conversationToOpen.id);

    if (conversationToOpen.unreadCount > 0) {
      const token = localStorage.getItem('token');
      try {
        await fetch(`${API_BASE_URL}/inquiries/agent/mark-read/${conversationToOpen.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        socket.emit('message_read', { conversationId: conversationToOpen.id, userId: currentUserId, role: userRole }); // Use currentUserId and userRole
        setConversationForModal(prev => prev ? { ...prev, unreadCount: 0 } : null);
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
        showMessage("Failed to mark messages as read.", 'error');
      }
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/inquiries/agent/mark-opened/${conversationToOpen.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Failed to mark conversation as opened:", error);
    }
  }, [currentUserId, userRole, fetchConversationForClient, showMessage, clients]); // Added userRole to dependencies

  const handleDeleteInquiry = useCallback(() => {
    if (!conversationForModal) return;
    showConfirm({
      title: "Delete Conversation",
      message: `Are you sure you want to delete this conversation with ${conversationForModal.clientName}? This is irreversible.`,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/inquiries/agent/delete-conversation/${conversationForModal.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          showMessage('Conversation deleted.', 'success');
          setIsAgentInquiryModalOpen(false);
          setConversationForModal(null);
          setOpenedConversationId(null);
          fetchClientsAndRequests(); // Refresh client data to update conversation status
        } else {
          showMessage('Failed to delete conversation.', 'error');
        }
      }
    });
  }, [conversationForModal, showConfirm, showMessage, fetchClientsAndRequests]);

  const handleSendMessageToConversation = useCallback(async (conversationId, messageText) => {
    const token = localStorage.getItem('token');

    console.log('🚀 Sending message with payload:', {
      conversation_id: conversationId,
      property_id: conversationForModal?.property_id,
      message_content: messageText,
      recipient_id: conversationForModal?.client_id,
      message_type: 'agent_reply',
    });

    const response = await fetch(`${API_BASE_URL}/inquiries/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        property_id: conversationForModal?.property_id,
        message_content: messageText,
        recipient_id: conversationForModal?.client_id,
        message_type: 'agent_reply',
      }),
    });

    console.log('🧾 Message POST response:', response.status, response.statusText);


    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/inquiries/agent/mark-responded/${conversationId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updatedConversation = await fetchConversationForClient(conversationForModal?.client_id, conversationForModal?.agent_id); // Pass agent_id
      if (updatedConversation) {
        setConversationForModal(updatedConversation);
      }
    } catch (error) {
      console.error("Failed to mark conversation as responded:", error);
    }
  }, [conversationForModal, fetchConversationForClient]);

  // Socket.io integration for real-time updates
  useEffect(() => {
    if (!socket.connected) socket.connect();

    if (conversationForModal?.id && currentUserId) { // Use currentUserId
      socket.emit('join_conversation', conversationForModal.id);
    }

    const handleNewMessage = async (newMessage) => {
      if (!conversationForModal || newMessage.conversationId !== conversationForModal.id) return;

      const updatedConversation = await fetchConversationForClient(conversationForModal?.client_id, conversationForModal?.agent_id); // Pass agent_id
      if (updatedConversation) {
        setConversationForModal(updatedConversation);
      }

      const expectedClientId = Number(newMessage.clientId || newMessage.client_id || conversationForModal.client_id);
      const senderId = Number(newMessage.senderId);
      const isFromClient = senderId === expectedClientId;

      if (isFromClient && openedConversationId === conversationForModal.id) {
        const token = localStorage.getItem('token');
        if (token && currentUserId) { // Use currentUserId
          fetch(`${API_BASE_URL}/inquiries/agent/mark-read/${conversationForModal.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })
            .then(res => {
              if (res.ok) {
                socket.emit('message_read', {
                  conversationId: conversationForModal.id,
                  userId: currentUserId, // Use currentUserId
                  role: userRole // Use userRole
                });
              }
            })
            .catch(err => console.error("Error marking message as read:", err));
        }
      }
    };

    const handleReadAck = async ({ conversationId, readerId, role }) => {
      if (conversationId === conversationForModal?.id) {
        const updatedConversation = await fetchConversationForClient(conversationForModal?.client_id, conversationForModal?.agent_id); // Pass agent_id
        if (updatedConversation) {
          setConversationForModal(updatedConversation);
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_read_ack', handleReadAck);

    return () => {
      if (conversationForModal?.id && currentUserId) { // Use currentUserId
        socket.emit('leave_conversation', conversationForModal.id);
      }
      socket.off('new_message', handleNewMessage);
      socket.off('message_read_ack', handleReadAck);
    };
  }, [conversationForModal, openedConversationId, currentUserId, userRole, showMessage, fetchConversationForClient]);


  const handleViewProfile = (clientId) => {
    // Dynamically determine the base path based on userRole
    const basePath = userRole === 'agency_admin' ? '/agency' : '/agent';
    navigate(`${basePath}/client-profile/${clientId}`);
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/listings/${propertyId}`);
  };

  const handleRemoveClient = async (clientId) => {
    // Only agents can remove clients
    if (userRole !== 'agent') {
      showMessage('Only agents can remove clients.', 'error');
      return;
    }
    showConfirm({
      title: "Archive Client",
      message: "Are you sure you want to archive this client? You can restore them later from 'Archived Clients'.",
      onConfirm: async () => {
        const removed = clients.find((c) => c.user_id === clientId);
        setClients((prev) => prev.filter((c) => c.user_id !== clientId));
        setFilteredClients((prev) => prev.filter((c) => c.user_id !== clientId));

        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_BASE_URL}/clients/agent/${currentUserId}/clients/${clientId}`, { // Use currentUserId
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage("Client archived successfully!", 'success');
        } catch (err) {
          console.error("Failed to archive client:", err);
          showMessage("Failed to archive client. Please try again.", 'error', 7000, [{
            label: 'Undo',
            onClick: () => {
              setClients((prev) => [...prev, removed]);
              setFilteredClients((prev) => [...prev, removed]);
              showMessage('Archiving undone.', 'info');
            }
          }]);
          setClients((prev) => [...prev, removed]);
          setFilteredClients((prev) => [...prev, removed]);
        }
      },
      confirmLabel: "Archive",
      cancelLabel: "Cancel"
    });
  };


  const handleToggleStatus = async (clientId, currentStatus) => {
    // Only agents can toggle client status
    if (userRole !== 'agent') {
      showMessage('Only agents can change client statuses.', 'error');
      return;
    }
    const newStatus = currentStatus === 'vip' ? 'regular' : 'vip';
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/clients/agent/${currentUserId}/clients/${clientId}/vip`, { status: newStatus }, { // Use currentUserId
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients((prev) => prev.map((c) => c.user_id === clientId ? { ...c, client_status: newStatus } : c));
      setFilteredClients((prev) => prev.map((c) => c.user_id === clientId ? { ...c, client_status: newStatus } : c));
      showMessage(`Client status updated to ${newStatus.toUpperCase()}.`, 'success');
    } catch (err) {
      console.error("Failed to update status:", err);
      showMessage("Failed to update status. Please try again.", 'error');
    }
  };

  // Handle adding/removing client from favorites
  const handleFavoriteToggle = useCallback(async (clientId, isCurrentlyFavorited) => {
    if (!currentUserId || (userRole !== 'agent' && userRole !== 'agency_admin')) {
      showMessage("Only agents and agency administrators can add clients to favorites.", "info");
      return;
    }

    const token = localStorage.getItem('token');
    try {
      if (isCurrentlyFavorited) {
        await axios.delete(`${API_BASE_URL}/favourites/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavoriteClientsStatus(prev => {
          const newState = new Set(prev);
          newState.delete(clientId);
          return newState;
        });
        showMessage("Client removed from favorites!", "success");
      } else {
        await axios.post(`${API_BASE_URL}/favourites/clients`, { client_id: clientId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavoriteClientsStatus(prev => new Set(prev).add(clientId));
        showMessage("Client added to favorites!", "success");
      }
    } catch (error) {
      console.error("Error toggling favorite client status:", error.response?.data || error.message);
      showMessage(`Failed to update favorite status: ${error.response?.data?.message || 'Please try again.'}`, "error");
      fetchFavoriteClients(); // Re-fetch to ensure UI consistency on error
    }
  }, [currentUserId, userRole, showMessage, fetchFavoriteClients]);


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
    const dataToExport = activeTab === 'your_clients' ? (scope === 'current' ? filteredClients : clients) : (scope === 'current' ? filteredPendingRequests : pendingRequests);
    if (dataToExport.length === 0) {
      showMessage(`No data found for ${scope} export.`, 'info');
      setIsExportDropdownOpen(false);
      return;
    }

    const headers = activeTab === 'pending_requests'
      ? ['request_id', 'client_id', 'client_name', 'client_email', 'client_phone', 'message', 'created_at', 'status']
      : (userRole === 'agency_admin'
        ? ['user_id', 'full_name', 'email', 'phone', 'date_joined', 'status', 'notes', 'client_status', 'agent_name', 'agent_email']
        : ['user_id', 'full_name', 'email', 'phone', 'date_joined', 'status', 'notes', 'client_status']);

    const csvRows = dataToExport.map((item) => {
      if (activeTab === 'pending_requests') {
        return [
          item.request_id,
          item.client_id,
          item.client_name,
          item.client_email,
          item.client_phone || '',
          item.message || '',
          new Date(item.created_at).toLocaleDateString(),
          item.status || '',
        ].map(field => `"${String(field).replace(/"/g, '""')}"`);
      } else {
        const baseFields = [
          item.user_id,
          item.full_name,
          item.email,
          item.phone || '',
          new Date(item.date_joined).toLocaleDateString(),
          item.status,
          item.notes || '',
          item.client_status || '',
        ];
        if (userRole === 'agency_admin') {
          return [...baseFields, item.agent_name || '', item.agent_email || ''].map(field => `"${String(field).replace(/"/g, '""')}"`);
        }
        return baseFields.map(field => `"${String(field).replace(/"/g, '""')}"`);
      }
    });

    const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = activeTab === 'pending_requests' ? 'pending_requests.csv' : (userRole === 'agency_admin' ? 'agency_clients.csv' : 'clients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
    showMessage("Data exported successfully!", 'success');
  };

  // Adjust contentShift based on userRole
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : (userRole === 'agency_admin' ? 256 : 256); // Assuming agency sidebar is also 256px when expanded

  const handleEditNote = useCallback((clientId, currentNote) => {
    // Only agents can edit notes
    if (userRole !== 'agent') {
      showMessage('Only agents can edit client notes.', 'error');
      return;
    }
    setEditingNoteId(clientId);
    setEditedNoteContent(currentNote || '');
  }, [userRole, showMessage]);

  const handleSaveNote = useCallback(async (clientId) => {
    // Only agents can save notes
    if (userRole !== 'agent') {
      showMessage('Only agents can save client notes.', 'error');
      setEditingNoteId(null);
      setEditedNoteContent('');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/clients/agent/${currentUserId}/clients/${clientId}/note`, { // Use currentUserId
        note: editedNoteContent,
      }, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      setClients((prev) =>
        prev.map((c) => (c.user_id === clientId ? { ...c, notes: editedNoteContent } : c))
      );
      // Re-filter and sort clients to update the displayed list immediately
      setFilteredClients((prev) =>
        prev.map((c) => (c.user_id === clientId ? { ...c, notes: editedNoteContent } : c))
      );
      showMessage('Note updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update note:', err);
      showMessage('Failed to update note. Please try again.', 'error');
    } finally {
      setEditingNoteId(null);
      setEditedNoteContent('');
    }
  }, [currentUserId, editedNoteContent, clients, showMessage, userRole]);

  const handleCancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditedNoteContent('');
  }, []);

  const handleAcceptRequest = async (requestId, clientIdToAccept) => {
    // Only agents can accept requests
    if (userRole !== 'agent') {
      showMessage('Only agents can accept connection requests.', 'error');
      return;
    }
    showConfirm({
      title: "Accept Connection Request",
      message: `Are you sure you want to accept this connection request from ${pendingRequests.find(r => r.request_id === requestId)?.client_name || 'this client'}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(`${API_BASE_URL}/agents/${currentUserId}/connection-requests/${requestId}/accept-from-client`, {}, { // Use currentUserId
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Connection request accepted!', 'success');
          fetchClientsAndRequests();
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
    // Only agents can reject requests
    if (userRole !== 'agent') {
      showMessage('Only agents can reject connection requests.', 'error');
      return;
    }
    showConfirm({
      title: "Reject Connection Request",
      message: `Are you sure you want to reject this connection request?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(`${API_BASE_URL}/agents/${currentUserId}/connection-requests/${requestId}/reject-from-client`, {}, { // Use currentUserId
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Connection request rejected.', 'info');
          fetchClientsAndRequests();
        } catch (err) {
          console.error("Failed to reject request:", err);
          showMessage(`Failed to reject request: ${err.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Reject",
      cancelLabel: "Cancel"
    });
  };

  // Handlers for search and tab changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset page on search
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setSearchTerm(''); // Clear search when switching tabs
    setPage(1); // Reset page when switching tabs
  };

  const totalItems = activeTab === 'your_clients' ? filteredClients.length : filteredPendingRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = activeTab === 'your_clients'
    ? filteredClients.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : filteredPendingRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);


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

      {userRole === 'agency_admin' ? (
        <AgencyAdminSidebar
          collapsed={isMobile ? false : isCollapsed}
          setCollapsed={isMobile ? () => {} : setIsCollapsed}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isMobile={isMobile}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      ) : (
        <AgentSidebar
          collapsed={isMobile ? false : isCollapsed}
          setCollapsed={isMobile ? () => {} : setIsCollapsed}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isMobile={isMobile}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
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
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Clients</h1>
        </div>

        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Clients</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}>

          {/* Desktop View: Search, Tabs, View Mode on one line */}
          <div className="hidden md:grid grid-cols-3 items-center gap-4 mb-6 max-w-[1344px] mx-auto">
            {/* Search Bar (Left) */}
            <input
              type="text"
              placeholder={userRole === 'agency_admin' ? "Search clients by name, email, phone, or agent..." : "Search clients by name, email, or phone..."}
              value={searchTerm}
              onChange={handleSearchChange}
              className={`w-full max-w-[28rem] px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
            />

            {/* Tabs for Your Clients / Pending Requests (Center) */}
            {userRole === 'agent' && (
              <div className="flex justify-center w-full max-w-[28rem] whitespace-nowrap">
                <button
                  onClick={() => handleTabClick('your_clients')}
                  className={`w-1/2 px-4 py-[11px] text-sm font-semibold rounded-l-xl truncate transition-colors duration-200
                    ${activeTab === 'your_clients' ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                >
                  Your Clients ({clients.length})
                </button>
                <button
                  onClick={() => handleTabClick('pending_requests')}
                  className={`w-1/2 px-4 py-[11px] text-sm font-semibold rounded-r-xl truncate transition-colors duration-200
                    ${activeTab === 'pending_requests' ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                >
                  Pending Requests ({pendingRequests.length})
                </button>
              </div>
            )}
            {userRole === 'agency_admin' && (
                <div className="flex justify-center w-full max-w-[28rem] whitespace-nowrap">
                    <span className={`px-4 py-[11px] text-sm font-semibold rounded-xl truncate
                        ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        All Clients ({clients.length})
                    </span>
                </div>
            )}

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
                        <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Clients</button>
                      </div>
                    </div>
                  )}
                </div>
              <button onClick={() => { setViewMode('simple'); localStorage.setItem('defaultListingsView', 'simple'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                <LayoutList className="h-6 w-6" />
              </button>
              <button
                onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultListingsView', 'graphical'); }}
                className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
              >
                <Squares2X2Icon className="h-6 w-6" />
              </button>
            </div>
          </div>


          {/* Mobile View: Search and View Mode on one line, Tabs below */}
          <div className="md:hidden flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              {/* Search Bar (Left) */}
              <input
                type="text"
                placeholder={userRole === 'agency_admin' ? "Search clients by name, email, phone, or agent..." : "Search clients by name, email, or phone..."}
                value={searchTerm}
                onChange={handleSearchChange}
                className={`w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
              />
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
                        <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Clients</button>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => { setViewMode('simple'); localStorage.setItem('defaultListingsView', 'simple'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <LayoutList className="h-6 w-6" />
                </button>
                <button
                  onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultListingsView', 'graphical'); }}
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                >
                  <Squares2X2Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
            {/* Tabs for Your Clients / Pending Requests (Below) */}
            {userRole === 'agent' && (
              <div className="flex justify-center">
                <button
                  onClick={() => handleTabClick('your_clients')}
                  className={`px-6 py-2 rounded-l-xl text-lg font-semibold transition-colors duration-200 flex-1
                            ${activeTab === 'your_clients' ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                >
                  Your Clients ({clients.length})
                </button>
                <button
                  onClick={() => handleTabClick('pending_requests')}
                  className={`px-6 py-2 rounded-r-xl text-lg font-semibold transition-colors duration-200 flex-1
                            ${activeTab === 'pending_requests' ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                >
                  Pending ({pendingRequests.length})
                </button>
              </div>
            )}
             {userRole === 'agency_admin' && (
                <div className="flex justify-center">
                    <span className={`px-6 py-2 rounded-xl text-lg font-semibold
                        ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        All Clients ({clients.length})
                    </span>
                </div>
            )}
          </div>


          {activeTab === 'pending_requests' && userRole === 'agent' ? (
            paginatedData.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No pending connection requests found.
              </div>
            ) : (
              viewMode === 'graphical' ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedData.map(request => (
                    <ClientCard
                      key={request.request_id}
                      client={{
                        user_id: request.client_id,
                        full_name: request.client_name,
                        email: request.client_email,
                        phone: request.client_phone,
                        profile_picture_url: request.client_profile_picture_url,
                        date_joined: request.created_at,
                        status: request.status,
                        client_status: 'pending',
                        notes: request.message,
                      }}
                      onViewProfile={handleViewProfile}
                      onCallClient={handleCallClient}
                      onRespondInquiry={() => handleOpenChat({ user_id: request.client_id, full_name: request.client_name, email: request.client_email, phone: request.client_phone, agent_id: currentUserId })}
                      onToggleStatus={() => showMessage('Cannot toggle status for pending requests.', 'info')}
                      onRemoveClient={() => handleRejectRequest(request.request_id)}
                      editingNoteId={null}
                      editedNoteContent={''}
                      onEditNote={() => showMessage('Cannot edit notes for pending requests.', 'info')}
                      onSaveNote={() => { }}
                      onCancelEdit={() => { }}
                      acceptAction={() => handleAcceptRequest(request.request_id, request.client_id)}
                      rejectAction={() => handleRejectRequest(request.request_id)}
                      isPendingRequestCard={true}
                      userRole={userRole}
                      onFavoriteToggle={handleFavoriteToggle} // Pass the handler
                      isFavorited={favoriteClientsStatus.has(request.client_id)} // Pass favorite status
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm table-fixed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <thead>
                      <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <th onClick={() => handleSortClick('client_name')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '15%' }}>Name {renderSortIcon('client_name')}</th>
                        <th onClick={() => handleSortClick('client_email')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '20%' }}>Email {renderSortIcon('client_email')}</th>
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '15%' }}>Phone</th>
                        <th onClick={() => handleSortClick('created_at')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '15%' }}>Requested At {renderSortIcon('created_at')}</th>
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '25%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                      {paginatedData.map(request => (
                        <tr
                          key={request.request_id}
                          className={`border-t cursor-pointer break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                          onClick={() => handleViewProfile(request.client_id)}
                        >
                          <td className="px-1 py-2" title={request.client_name}>{request.client_name}</td>
                          <td className="px-1 py-2" title={request.client_email}>{request.client_email}</td>
                          <td className="px-1 py-2" title={request.client_phone}>{request.client_phone || 'N/A'}</td>
                          <td className="px-1 py-2">{new Date(request.created_at).toLocaleDateString()}</td>
                          <td className="px-1 py-2 flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                            <button className="text-green-600 hover:border-green-700 p-1 border border-transparent" onClick={() => handleAcceptRequest(request.request_id, request.client_id)} title="Accept Request">
                              <CheckCircleIcon className="h-6 w-6" />
                            </button>
                            <button className="text-red-600 hover:border-red-700 p-1 border border-transparent" onClick={() => handleRejectRequest(request.request_id)} title="Reject Request">
                              <XCircleIcon className="h-6 w-6" />
                            </button>
                            {request.client_phone && (
                              <button
                                  onClick={() => handleCallClient(request.client_phone)}
                                  className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center
                                  text-green-500 hover:border-green-600 border border-transparent`}
                                  title="Call client"
                              >
                                  <PhoneIcon className="h-4 w-4 mr-1" />Call
                              </button>
                            )}
                            <button
                                onClick={() => handleOpenChat({ user_id: request.client_id, full_name: request.client_name, email: request.client_email, phone: request.client_phone, agent_id: currentUserId })}
                                className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center
                                text-blue-500 hover:border-blue-600 border border-transparent`}
                                title="Chat with client"
                            >
                                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />Chat
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
                No clients found matching your criteria.
              </div>
            ) : (
              viewMode === 'graphical' ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedData.map(client => (
                    <ClientCard
                      key={client.user_id}
                      client={client}
                      onViewProfile={handleViewProfile}
                      onCallClient={handleCallClient}
                      onRespondInquiry={() => handleOpenChat(client)}
                      onToggleStatus={handleToggleStatus}
                      onRemoveClient={handleRemoveClient}
                      editingNoteId={editingNoteId}
                      editedNoteContent={editedNoteContent}
                      onEditNote={(id, content) => {
                        setEditingNoteId(id);
                        setEditedNoteContent(content);
                      }}
                      onSaveNote={handleSaveNote}
                      onCancelEdit={handleCancelEdit}
                      userRole={userRole}
                      onFavoriteToggle={handleFavoriteToggle} // Pass the handler
                      isFavorited={favoriteClientsStatus.has(client.user_id)} // Pass favorite status
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm table-fixed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <thead>
                      <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <th onClick={() => handleSortClick('full_name')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: userRole === 'agency_admin' ? '15%' : '15%' }}>Name {renderSortIcon('full_name')}</th>
                        <th onClick={() => handleSortClick('email')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: userRole === 'agency_admin' ? '15%' : '15%' }}>Email {renderSortIcon('email')}</th>
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '15%' }}>Phone</th>
                        {userRole === 'agency_admin' && (
                          <th onClick={() => handleSortClick('agent_name')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '15%' }}>Agent {renderSortIcon('agent_name')}</th>
                        )}
                        <th onClick={() => handleSortClick('client_status')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '10%' }}>Status {renderSortIcon('client_status')}</th>
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: userRole === 'agency_admin' ? '25%' : '30%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                      {paginatedData.map(client => (
                        <tr
                          key={client.user_id}
                          className={`border-t cursor-pointer break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                          onClick={() => handleViewProfile(client.user_id)}
                        >
                          <td className="px-1 py-2" title={client.full_name}>{client.full_name}</td>
                          <td className="px-1 py-2" title={client.email}>{client.email}</td>
                          <td className="px-1 py-2" title={client.phone}>{client.phone || 'N/A'}</td>
                          {userRole === 'agency_admin' && (
                            <td className="px-1 py-2" title={client.agent_name}>{client.agent_name || 'N/A'}</td>
                          )}
                          <td className={`px-1 py-2 font-semibold ${
                            client.client_status === 'vip'
                              ? 'text-green-600'
                              : (darkMode ? 'text-gray-300' : 'text-gray-600')
                            }`} title={client.client_status || 'regular'}>{client.client_status || 'regular'}</td>
                          <td className="px-1 py-2 flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleSendEmail(client)} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-blue-500 hover:border-blue-600 border border-transparent`}>
                              <EnvelopeIcon className="h-4 w-4 mr-1" />Email
                            </button>
                            {client.phone && (
                              <button
                                onClick={() => handleCallClient(client.phone)}
                                className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center
                                text-green-500 hover:border-green-600 border border-transparent`}
                                title="Call client"
                              >
                                <PhoneIcon className="h-4 w-4 mr-1" />Call
                              </button>
                            )}
                            <button
                                onClick={() => handleOpenChat(client)}
                                className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center
                                text-blue-500 hover:border-blue-600 border border-transparent`}
                                title="Chat with client"
                            >
                                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />Chat
                            </button>
                            {userRole === 'agent' && (
                              <>
                                <button onClick={() => handleToggleStatus(client.user_id, client.client_status)} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-yellow-500 hover:border-yellow-600 border border-transparent`}>
                                  {client.client_status === 'vip' ? 'Make Regular' : 'Make VIP'}
                                </button>
                                <button onClick={() => handleRemoveClient(client.user_id)} title="Remove client" className={`rounded-xl p-1 h-8 w-8 flex items-center justify-center text-red-500 hover:border-red-600 border border-transparent`}>
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {userRole === 'agency_admin' && (
                              <>
                                <button
                                  className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-yellow-300 border border-transparent cursor-not-allowed opacity-50`}
                                  title="Only assigned agent can change client status"
                                  disabled
                                >
                                  {client.client_status === 'vip' ? 'Make Regular' : 'Make VIP'}
                                </button>
                                <button
                                  title="Only assigned agent can remove client"
                                  className={`rounded-xl p-1 h-8 w-8 flex items-center justify-center text-red-300 border border-transparent cursor-not-allowed opacity-50`}
                                  disabled
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
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
        {isAgentInquiryModalOpen && conversationForModal && (
          <AgentInquiryModal
            isOpen={isAgentInquiryModalOpen}
            onClose={() => {
              setIsAgentInquiryModalOpen(false);
              setConversationForModal(null);
              setOpenedConversationId(null);
            }}
            conversation={conversationForModal}
            darkMode={darkMode}
            onViewProperty={handleViewProperty}
            onDelete={handleDeleteInquiry}
            onSendMessage={handleSendMessageToConversation}
            userRole={userRole}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;


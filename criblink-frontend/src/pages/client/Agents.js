import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon, // For disconnect button
  PhoneIcon, // For call action
  EnvelopeIcon, // For email button
  ChatBubbleLeftRightIcon, // For chat button
  CheckCircleIcon, // For accept request
  XCircleIcon, // For reject request
} from '@heroicons/react/24/outline';
import ClientSidebar from '../../components/client/Sidebar';
import API_BASE_URL from '../../config';
import { Menu, X, Search, LayoutGrid, LayoutList, Plus, X as XMarkIcon } from 'lucide-react'; // Added Plus and XMarkIcon
import { useTheme } from '../../layouts/AppShell';
import AgentCard from '../../components/client/AgentCard';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog }
 from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useAuth } from '../../context/AuthContext';
import ClientInquiryModal from '../../components/ClientInquiryModal'; // Added this import
import socket from '../../socket'; // Import socket

// Reusable Dropdown Component (embedded directly, similar to Clients.js)
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
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
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


const Agents = () => {
  // Raw data states from API fetches
  const [connectedAgentsRaw, setConnectedAgentsRaw] = useState([]);
  const [allAgentsRaw, setAllAgentsRaw] = useState([]); // All agents from /client-stats/all-agents
  const [pendingRequestsRaw, setPendingRequestsRaw] = useState([]); // Requests sent by client, or to client

  // UI related states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultAgentsView') || 'graphical');
  const [activeTab, setActiveTab] = useState('connected'); // 'connected' or 'pending'
  const [page, setPage] = useState(1); // For pagination when searching globally
  const itemsPerPage = 12;

  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('agents');

  // Ref for infinite scroll (no longer used for in-container scroll)
  const scrollContainerRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // State for chat modal
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null); // Track the ID of the conversation currently open in the modal

  // New state for favorite agents
  const [favoriteAgentsStatus, setFavoriteAgentsStatus] = useState(new Set());


  // --- Data Fetching Callbacks ---

  const fetchConnectedAgents = useCallback(async () => {
    if (!user?.user_id || !token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/${user.user_id}/connected-agent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Ensure agency_id and agency_address are included
      setConnectedAgentsRaw(response.data.agents.map(agent => ({
        ...agent,
        agency_id: agent.agency_id || null, // Ensure agency_id is present
        agency_address: agent.agency_address || null
      })) || []);
    } catch (err) {
      console.error('Error fetching connected agents:', err);
      showMessage('Failed to load connected agents.', 'error');
      setConnectedAgentsRaw([]);
    }
  }, [user, token, showMessage]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user?.user_id || !token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/${user.user_id}/pending-agent-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Ensure agency_id and agency_address are included for pending requests
      setPendingRequestsRaw(response.data.requests.map(req => ({
        ...req,
        agency_id: req.agency_id || null, // Assuming agency_id might be in the request object
        agency_address: req.agency_address || null
      })) || []);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      showMessage('Failed to load pending requests.', 'error');
      setPendingRequestsRaw([]);
    }
  }, [user, token, showMessage]);

  const fetchAllAgents = useCallback(async (pageToFetch, search, append = false) => {
    if (!token) return;
    setIsLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/all-agents?page=${pageToFetch}&limit=${itemsPerPage}&search=${search}`, { headers });
      const newAgents = response.data.agents.map(agent => ({
        ...agent,
        agency_id: agent.agency_id || null, // Ensure agency_id is present
        agency_address: agent.agency_address || null, // Ensure agency_address is present
        phone: agent.phone || null, // Ensure phone is present
      })); // Map to ensure agency_id, agency_address, and phone are included
      const totalPages = response.data.totalPages;

      if (append) {
        setAllAgentsRaw(prev => [...prev, ...newAgents]);
      } else {
        setAllAgentsRaw(newAgents);
      }
      setHasMore(pageToFetch < totalPages);
    } catch (error) {
      console.error("Error fetching all agents:", error);
      showMessage("Failed to load agents.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token, showMessage]);

  // Fetch favorite agents
  const fetchFavoriteAgents = useCallback(async () => {
    if (!user?.user_id) {
      setFavoriteAgentsStatus(new Set());
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/favourites/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const favoritedIds = new Set(response.data.favourites.map(fav => fav.user_id));
      setFavoriteAgentsStatus(favoritedIds);
    } catch (error) {
      console.error("Error fetching favorite agents:", error.response?.data || error.message);
      // showMessage("Failed to load favorite agents.", "error"); // Suppress for cleaner UX
      setFavoriteAgentsStatus(new Set());
    }
  }, [user?.user_id]);


  // --- Initial Data Fetch on Component Mount ---
  useEffect(() => {
    fetchConnectedAgents();
    fetchPendingRequests();
    // Always fetch all agents initially, as the search will operate on this full list
    fetchAllAgents(1, '', false);
  }, [fetchConnectedAgents, fetchPendingRequests, fetchAllAgents]);

  useEffect(() => {
    fetchFavoriteAgents();
  }, [fetchFavoriteAgents, user?.user_id]);


  // --- Helper to determine agent connection status ---
  const getAgentConnectionStatus = useCallback((agentIdToCheck) => {
    const isConnected = connectedAgentsRaw.some(a => a.user_id === agentIdToCheck);
    if (isConnected) return 'connected';

    const pendingSent = pendingRequestsRaw.find(req => req.agent_id === agentIdToCheck && req.is_outgoing);
    if (pendingSent) return 'pending_sent';

    const pendingReceived = pendingRequestsRaw.find(req => req.agent_id === agentIdToCheck && req.is_incoming);
    if (pendingReceived) return 'pending_received';

    return 'none';
  }, [connectedAgentsRaw, pendingRequestsRaw]);


  // --- Combined and Filtered/Sorted Agents for Display ---
  const displayedAgents = useMemo(() => {
    let combinedAgents = [];

    // Create a comprehensive map of all agents with their connection status
    const allUniqueAgentsMap = new Map();

    // Add connected agents
    connectedAgentsRaw.forEach(agent => {
      allUniqueAgentsMap.set(agent.user_id, { ...agent, connectionStatus: 'connected' });
    });

    // Add pending requests, ensuring full agent details are available
    pendingRequestsRaw.forEach(req => {
      const agentId = req.agent_id || req.sender_id;
      // Use existing properties or default to null/undefined if not present
      const agentName = req.agent_name || req.full_name;
      const agentEmail = req.agent_email || req.email;
      const agentProfilePicture = req.agent_profile_picture_url || req.profile_picture_url;
      const agencyName = req.agency_name || null;
      const agencyId = req.agency_id || null; // Ensure agency_id is picked from pending requests
      const agencyAddress = req.agency_address || null; // Ensure agency_address is picked from pending requests
      const agentPhone = req.phone || null; // Ensure phone is picked from pending requests

      if (!allUniqueAgentsMap.has(agentId) || allUniqueAgentsMap.get(agentId).connectionStatus !== 'connected') {
        allUniqueAgentsMap.set(agentId, {
          user_id: agentId,
          full_name: agentName,
          email: agentEmail,
          phone: agentPhone, // Pass phone
          profile_picture_url: agentProfilePicture,
          agency_name: agencyName,
          agency_id: agencyId, // Pass agency_id
          agency_address: agencyAddress, // Pass agency_address
          connectionStatus: req.is_outgoing ? 'pending_sent' : 'pending_received',
          requestId: req.request_id, // Include request_id for pending actions
        });
      }
    });

    // Add all other agents from allAgentsRaw (discoverable)
    allAgentsRaw.forEach(agent => {
      if (!allUniqueAgentsMap.has(agent.user_id)) {
        allUniqueAgentsMap.set(agent.user_id, { ...agent, connectionStatus: getAgentConnectionStatus(agent.user_id) });
      }
    });

    combinedAgents = Array.from(allUniqueAgentsMap.values());

    let finalDisplayedData = combinedAgents;

    // Apply search filter if a search term exists. This overrides tab filtering.
    if (searchTerm) {
      finalDisplayedData = combinedAgents.filter((item) =>
        item.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) || // Include phone in search
        item.agency_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.agency_address?.toLowerCase().includes(searchTerm.toLowerCase()) // Include agency_address in search
      );
    } else {
      // If no search term, apply tab filtering
      if (activeTab === 'connected') {
        finalDisplayedData = combinedAgents.filter(agent => agent.connectionStatus === 'connected');
      } else if (activeTab === 'pending') {
        finalDisplayedData = combinedAgents.filter(agent =>
          agent.connectionStatus === 'pending_sent' || agent.connectionStatus === 'pending_received'
        );
      }
    }

    // Apply sort to the final data set
    finalDisplayedData.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (typeof aValue === 'string') return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return finalDisplayedData;
  }, [connectedAgentsRaw, pendingRequestsRaw, allAgentsRaw, searchTerm, sortKey, sortDirection, activeTab, getAgentConnectionStatus]);


  // --- Chat Functionality ---

  // Fetches a conversation and formats its messages for the modal
  const fetchAndFormatConversation = useCallback(async (agentIdToChatWith) => {
    if (!user?.user_id || !agentIdToChatWith) {
        console.log('Current User ID or Agent ID not available for conversation fetch.');
        return null;
    }

    try {
        const res = await axios.get(`${API_BASE_URL}/inquiries/agent/${agentIdToChatWith}/client/${user.user_id}/conversation`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.data && res.data.conversation) {
            const conv = res.data.conversation;
            const formattedMessages = conv.messages.map(msg => {
                const rawTimestamp = msg.timestamp || msg.created_at;
                const parsed = Date.parse(rawTimestamp);
                return {
                    ...msg,
                    // Determine sender based on client_id in conversation
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
                clientName: user.full_name, // Ensure client name is always current user's
                clientEmail: user.email,
                clientPhone: user.phone,
                agentName: conv.agentName, // Agent name from conversation or agent object
                agentEmail: conv.agentEmail,
                agentPhone: conv.agentPhone, // Ensure agent phone is passed
                propertyTitle: conv.property_title,
                messages: formattedMessages,
                lastMessage: conv.last_message,
                lastMessageTimestamp: conv.last_message_timestamp,
                is_agent_responded: conv.is_agent_responded,
                unreadCount: conv.unread_messages_count,
            };
        }
        return null;
    } catch (err) {
        if (err.response?.status === 404) {
            return null; // No existing conversation
        }
        console.error("Failed to fetch client-agent conversation:", err.response?.data || err.message);
        showMessage('Failed to load conversation with agent.', 'error');
        return null;
    }
  }, [user, token, showMessage]);


  const handleChatAgent = useCallback(async (agent) => {
    if (!user?.user_id) {
        showMessage('Please log in to chat with agents.', 'info');
        return;
    }

    setIsLoading(true); // Indicate loading for conversation fetch
    let conversationToOpen = null;

    try {
        conversationToOpen = await fetchAndFormatConversation(agent.user_id);

        if (!conversationToOpen) {
            // If no existing conversation, create a new general inquiry
            const createRes = await axios.post(`${API_BASE_URL}/inquiries/general`, {
                client_id: user.user_id,
                agent_id: agent.user_id,
                message_content: "::shell::" // Placeholder message to initiate general inquiry
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (createRes.data.conversation_id) {
                // Fetch the newly created conversation to get full details and formatted messages
                conversationToOpen = await fetchAndFormatConversation(agent.user_id);
                if (!conversationToOpen) {
                    showMessage("Failed to retrieve new conversation data after creation.", "error");
                    setIsLoading(false);
                    return;
                }
                showMessage('New general conversation started!', 'success');
            } else {
                showMessage(`Failed to start new general conversation: ${createRes.data.message || createRes.statusText}`, 'error');
                setIsLoading(false);
                return;
            }
        }

        // Ensure agent details are up-to-date from the agent object passed,
        // as conversationData from backend might not have all details (e.g., latest phone number).
        conversationToOpen = {
            ...conversationToOpen,
            agentName: agent.full_name,
            agentEmail: agent.email,
            agentPhone: agent.phone,
        };

        setSelectedConversation(conversationToOpen);
        setIsChatModalOpen(true);
        setOpenedConversationId(conversationToOpen.id); // Set the ID of the opened conversation

        // Mark messages as read if there are unread messages from the agent
        if (conversationToOpen.unreadCount > 0) {
            try {
                await axios.put(`${API_BASE_URL}/inquiries/client/mark-read/${conversationToOpen.id}`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                socket.emit('message_read', { conversationId: conversationToOpen.id, userId: user.user_id, role: 'client' });
                // Optimistically update unread count in the modal's conversation object
                setSelectedConversation(prev => prev ? { ...prev, unreadCount: 0 } : null);
            } catch (error) {
                console.error("Failed to mark messages as read:", error);
                showMessage("Failed to mark messages as read.", 'error');
            }
        }

    } catch (error) {
        console.error("Error handling chat agent:", error.response?.data || error.message);
        showMessage(error.response?.data?.message || 'Failed to open chat.', 'error');
    } finally {
        setIsLoading(false);
    }
  }, [user, token, showMessage, fetchAndFormatConversation]);


  const handleSendMessage = useCallback(async (conversationId, messageContent, guestName, guestEmail, guestPhone) => {
      // The ClientInquiryModal now handles optimistic updates directly.
      // This function only needs to send the message to the backend.
      if (!user?.user_id && !guestName) { // Allow guest to send without user_id
          showMessage('You must be logged in or provide guest details to send messages.', 'error');
          return;
      }
      if (!selectedConversation?.agent_id && !selectedConversation?.id) { // Ensure there's an agent or a conversation to send to
          showMessage('Cannot send message: No agent or conversation identified.', 'error');
          return;
      }

      try {
          const payload = {
              conversation_id: conversationId || selectedConversation.id,
              message_content: messageContent,
              recipient_id: selectedConversation.agent_id,
              message_type: 'client_reply',
              property_id: selectedConversation.property_id || null,
              // Include guest info if applicable
              ...(guestName && { name: guestName, email: guestEmail, phone: guestPhone })
          };

          const response = await axios.post(`${API_BASE_URL}/inquiries/message`, payload, {
              headers: { Authorization: `Bearer ${token}` },
          });

          // If it was a new conversation (id was null in selectedConversation), update its ID
          if (!selectedConversation.id && response.data.conversation_id) {
              setSelectedConversation(prev => ({ ...prev, id: response.data.conversation_id }));
          }

          console.log("Message sent successfully:", response.data);
          // The modal will update its own state via optimistic update and socket listener
      } catch (error) {
          console.error("Error sending message:", error.response?.data || error.message);
          showMessage(error.response?.data?.message || 'Failed to send message.', 'error');
          throw error; // Re-throw to allow modal to handle optimistic update rollback
      }
  }, [user, token, selectedConversation, showMessage]);


  const handleDeleteConversation = useCallback(async () => {
      if (!selectedConversation?.id) {
          showMessage('No conversation selected to delete.', 'error');
          return;
      }
      showConfirm({
          title: "Delete Conversation",
          message: "Are you sure you want to delete this conversation? This action cannot be undone.",
          onConfirm: async () => {
              try {
                  await axios.delete(`${API_BASE_URL}/inquiries/client/delete-conversation/${selectedConversation.id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                  });
                  showMessage('Conversation deleted successfully!', 'success');
                  setIsChatModalOpen(false);
                  setSelectedConversation(null);
                  setOpenedConversationId(null); // Clear opened conversation ID
                  // Re-fetch data to update lists if necessary (e.g., if a conversation disappears)
                  fetchConnectedAgents();
                  fetchPendingRequests();
                  fetchAllAgents(1, searchTerm, false);
              } catch (error) {
                  console.error("Error deleting conversation:", error.response?.data || error.message);
                  showMessage(error.response?.data?.message || 'Failed to delete conversation.', 'error');
              }
          },
          confirmLabel: "Delete",
          cancelLabel: "Cancel"
      });
  }, [selectedConversation, token, showConfirm, showMessage, fetchConnectedAgents, fetchPendingRequests, fetchAllAgents, searchTerm]);


  // Socket.IO listeners for real-time updates
  useEffect(() => {
    if (!socket.connected) socket.connect();

    // Join the specific conversation room when the modal is open
    if (openedConversationId && user?.user_id) {
        socket.emit('join_conversation', openedConversationId);
    }

    const handleNewMessage = async (newMessage) => {
        // Only process messages for the currently opened conversation
        if (newMessage.conversationId !== openedConversationId) return;

        // Fetch the updated conversation to get the latest state including read status
        const updatedConversation = await fetchAndFormatConversation(selectedConversation?.agent_id || newMessage.agent_id);

        if (updatedConversation) {
            // MERGE agent details from the existing selectedConversation if they are missing in the fetched data
            const finalConversationState = {
                ...updatedConversation, // Start with the newly fetched data
                agentName: updatedConversation.agentName || selectedConversation?.agentName,
                agentEmail: updatedConversation.agentEmail || selectedConversation?.agentEmail,
                agentPhone: updatedConversation.agentPhone || selectedConversation?.agentPhone,
                // Also ensure client details are consistent if needed (assuming user object is consistent)
                clientName: user?.full_name,
                clientEmail: user?.email,
                clientPhone: user?.phone,
            };
            setSelectedConversation(finalConversationState); // Update the modal's conversation prop
            // If the new message is from the agent and the modal is open, mark it as read
            const isFromAgent = newMessage.senderId === finalConversationState.agent_id;
            if (isFromAgent && openedConversationId === finalConversationState.id) {
                try {
                    await axios.put(`${API_BASE_URL}/inquiries/client/mark-read/${finalConversationState.id}`, {}, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    socket.emit('message_read', { conversationId: finalConversationState.id, userId: user.user_id, role: 'client' });
                } catch (error) {
                    console.error("Error marking message as read via socket handler:", error);
                }
            }
        }
    };

    const handleReadAck = async ({ conversationId, readerId, role }) => {
        // If the agent read our message in the currently open conversation, refresh to show read status
        if (conversationId === openedConversationId && role === 'agent') {
            const updatedConversation = await fetchAndFormatConversation(selectedConversation?.agent_id);
            if (updatedConversation) {
                setSelectedConversation(prev => {
                    if (!prev) return prev;
                    // Preserve agent details when updating from read ack
                    return {
                        ...updatedConversation,
                        agentName: updatedConversation.agentName || prev.agentName,
                        agentEmail: updatedConversation.agentEmail || prev.agentEmail,
                        agentPhone: updatedConversation.agentPhone || prev.agentPhone,
                        clientName: user?.full_name,
                        clientEmail: user?.email,
                        clientPhone: user?.phone,
                    };
                });
            }
        }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_read_ack', handleReadAck);

    return () => {
        // Leave the conversation room when the component unmounts or conversation changes
        if (openedConversationId && user?.user_id) {
            socket.emit('leave_conversation', openedConversationId);
        }
        socket.off('new_message', handleNewMessage);
        socket.off('message_read_ack', handleReadAck);
    };
  }, [openedConversationId, user?.user_id, token, selectedConversation?.agent_id, fetchAndFormatConversation]);


  // --- Other Event Handlers ---

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setPage(1); // Reset pagination on new search
    // When search term changes, always re-fetch all agents to ensure discoverability
    fetchAllAgents(1, term, false);
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setSearchTerm(''); // Clear search when switching tabs to revert to tab-specific view
    setPage(1); // Reset page when switching tabs
    // No need to call fetchAllAgents here, useMemo will re-evaluate with new activeTab
  };

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

  const handleViewProfile = (agentId) => {
    navigate(`/client/agent-profile/${agentId}`);
  };

  const handleSendEmail = (agent) => {
    if (agent && agent.email) {
      window.location.href = `mailto:${agent.email}`;
    } else {
      showMessage('Email address not available for this agent.', 'info');
    }
  };

  const handleCallAgent = (phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      showMessage('Phone number not available for this agent.', 'info');
    }
  };

  const handleConnectAgent = async (agentId) => {
    if (!user?.user_id) {
      showMessage('Please log in to send connection requests.', 'info');
      return;
    }
    showConfirm({
      title: "Send Connection Request",
      message: "Do you want to send a connection request to this agent?",
      onConfirm: async () => {
        try {
          const response = await axios.post(`${API_BASE_URL}/clients/${user.user_id}/connection-requests/send-to-agent/${agentId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage(response.data.message, 'success');
          // Refresh all data after sending request
          fetchConnectedAgents();
          fetchPendingRequests();
          fetchAllAgents(1, searchTerm, false); // Re-fetch all agents to update status
        } catch (error) {
          console.error("Error sending connection request:", error.response?.data || error.message);
          showMessage(error.response?.data?.message || 'Failed to send connection request.', 'error');
        }
      },
      confirmLabel: "Send Request",
      cancelLabel: "Cancel"
    });
  };

  const handleCancelRequest = async (agentId) => {
    if (!user?.user_id) return;
    showConfirm({
      title: "Cancel Connection Request",
      message: "Are you sure you want to cancel this pending connection request?",
      onConfirm: async () => {
        try {
          const requestToCancel = pendingRequestsRaw.find(req => req.agent_id === agentId && req.is_outgoing);
          if (requestToCancel) {
             await axios.post(`${API_BASE_URL}/clients/${user.user_id}/connection-requests/${requestToCancel.request_id}/reject-from-agent`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage('Connection request cancelled successfully!', 'success');
            fetchConnectedAgents();
            fetchPendingRequests();
            fetchAllAgents(1, searchTerm, false);
          } else {
            showMessage('Outgoing request not found to cancel.', 'error');
          }
        } catch (error) {
          console.error("Error cancelling connection request:", error.response?.data || error.message);
          showMessage(error.response?.data?.message || 'Failed to cancel connection request.', 'error');
        }
      },
      confirmLabel: "Cancel Request",
      cancelLabel: "Keep"
    });
  };

  const handleDisconnectAgent = async (agentId) => {
    if (!user?.user_id) return;
    showConfirm({
      title: "Disconnect from Agent",
      message: "Are you sure you want to disconnect from this agent?",
      onConfirm: async () => {
        try {
          await axios.post(`${API_BASE_URL}/clients/${user.user_id}/disconnect-agent/${agentId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Disconnected from agent successfully!', 'success');
          fetchConnectedAgents();
          fetchPendingRequests();
          fetchAllAgents(1, searchTerm, false);
        } catch (error) {
          console.error("Error disconnecting from agent:", error.response?.data || error.message);
          showMessage(error.response?.data?.message || 'Failed to disconnect from agent.', 'error');
        }
      },
      confirmLabel: "Disconnect",
      cancelLabel: "Cancel"
    });
  };

  const handleAcceptIncomingRequest = async (requestId, agentId) => {
    if (!user?.user_id) return;
    showConfirm({
      title: "Accept Incoming Request",
      message: "Are you sure you want to accept this incoming connection request?",
      onConfirm: async () => {
        try {
          await axios.post(`${API_BASE_URL}/clients/${user.user_id}/connection-requests/${requestId}/accept-from-agent`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Incoming request accepted!', 'success');
          fetchConnectedAgents();
          fetchPendingRequests();
          fetchAllAgents(1, searchTerm, false);
        } catch (error) {
          console.error("Error accepting incoming request:", error.response?.data || error.message);
          showMessage(error.response?.data?.message || 'Failed to accept incoming request.', 'error');
        }
      },
      confirmLabel: "Accept",
      cancelLabel: "Cancel"
    });
  };

  const handleRejectIncomingRequest = async (requestId) => {
    if (!user?.user_id) return;
    showConfirm({
      title: "Reject Incoming Request",
      message: "Are you sure you want to reject this incoming connection request?",
      onConfirm: async () => {
        try {
          await axios.post(`${API_BASE_URL}/clients/${user.user_id}/connection-requests/${requestId}/reject-from-agent`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Incoming request rejected.', 'info');
          fetchConnectedAgents();
          fetchPendingRequests();
          fetchAllAgents(1, searchTerm, false);
        } catch (error) {
          console.error("Error rejecting incoming request:", error.response?.data || error.message);
          showMessage(error.response?.data?.message || 'Failed to reject incoming request.', 'error');
        }
      },
      confirmLabel: "Reject",
      cancelLabel: "Cancel"
    });
  };

  // Handle adding/removing agent from favorites
  const handleFavoriteToggle = useCallback(async (agentId, isCurrentlyFavorited) => {
    if (!user?.user_id) {
      showMessage("Please log in to add agents to favorites.", "info");
      return;
    }

    const token = localStorage.getItem('token');
    try {
      if (isCurrentlyFavorited) {
        await axios.delete(`${API_BASE_URL}/favourites/agents/${agentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavoriteAgentsStatus(prev => {
          const newState = new Set(prev);
          newState.delete(agentId);
          return newState;
        });
        showMessage("Agent removed from favorites!", "success");
      } else {
        await axios.post(`${API_BASE_URL}/favourites/agents`, { agent_id: agentId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavoriteAgentsStatus(prev => new Set(prev).add(agentId));
        showMessage("Agent added to favorites!", "success");
      }
    } catch (error) {
      console.error("Error toggling favorite agent status:", error.response?.data || error.message);
      showMessage(`Failed to update favorite status: ${error.response?.data?.message || 'Please try again.'}`, "error");
      fetchFavoriteAgents(); // Re-fetch to ensure UI consistency on error
    }
  }, [user?.user_id, showMessage, fetchFavoriteAgents]);


  // Modified handleScroll to listen to window scroll
  const handleScroll = useCallback(() => {
    // Only trigger load more if a search term is active
    if (searchTerm && !isLoading && hasMore) {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100) { // 100px from bottom
        setPage(prev => prev + 1);
      }
    }
  }, [searchTerm, isLoading, hasMore]);

  // Attach and detach window scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]); // Re-attach if handleScroll changes due to its dependencies


  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  // Calculate total counts for display
  const totalConnectedAgents = connectedAgentsRaw.length;
  const totalPendingRequests = pendingRequestsRaw.length;


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

      <ClientSidebar
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
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Agents</h1>
        </div>

        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Agents</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}>

          {/* Desktop View: Search, Tabs, View Mode on one line */}
          <div className="hidden md:grid grid-cols-3 items-center gap-4 mb-6 max-w-[1344px] mx-auto">

  {/* Search Bar (Left) */}
  <div className="flex justify-start w-full">
  <input
    type="text"
    placeholder="Search agents by name, email, phone, or agency..."
    value={searchTerm}
    onChange={handleSearchChange}
    className={`w-full max-w-[28rem] px-4 py-2 border rounded-xl shadow-sm ...`}
  />
</div>


  {/* Tabs for Connected / Pending Requests (Center) */}
  <div className="flex justify-center w-full max-w-[28rem] whitespace-nowrap">
  <button
  onClick={() => handleTabClick('connected')}
  className={`w-1/2 px-4 py-[11px] text-sm font-semibold rounded-l-xl truncate transition-colors duration-200
    ${activeTab === 'connected' && !searchTerm ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
>
  Connected Agents ({totalConnectedAgents})
</button>
<button
  onClick={() => handleTabClick('pending')}
  className={`w-1/2 px-4 py-[11px] text-sm font-semibold rounded-r-xl truncate transition-colors duration-200
    ${activeTab === 'pending' && !searchTerm ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
>
  Pending Requests ({totalPendingRequests})
</button>

</div>


  {/* View Mode Controls (Right) */}
  <div className="flex justify-end gap-2 items-center">
    <button onClick={() => { setViewMode('simple'); localStorage.setItem('defaultAgentsView', 'simple'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
      <LayoutList className="h-6 w-6" />
    </button>
    <button
      onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultAgentsView', 'graphical'); }}
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
                placeholder="Search agents by name, email, phone, or agency..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={`w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
              />
              {/* View Mode Controls (Right) */}
              <div className="flex gap-2 items-center flex-shrink-0">
                <button onClick={() => { setViewMode('simple'); localStorage.setItem('defaultAgentsView', 'simple'); }} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                  <LayoutList className="h-6 w-6" />
                </button>
                <button
                  onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultAgentsView', 'graphical'); }}
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                >
                  <Squares2X2Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
            {/* Tabs for Connected / Pending Requests (Below) */}
            <div className="flex justify-center">
              <button
                onClick={() => handleTabClick('connected')}
                className={`px-6 py-2 rounded-l-xl text-lg font-semibold transition-colors duration-200 flex-1
                          ${activeTab === 'connected' && !searchTerm ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
              >
                Connected ({totalConnectedAgents})
              </button>
              <button
                onClick={() => handleTabClick('pending')}
                className={`px-6 py-2 rounded-r-xl text-lg font-semibold transition-colors duration-200 flex-1
                          ${activeTab === 'pending' && !searchTerm ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
              >
                Pending ({totalPendingRequests})
              </button>
            </div>
          </div>

          {/* Displayed Agents List (combined, filtered, and sorted) */}
          {displayedAgents.length === 0 && !isLoading ? (
            <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {searchTerm ? "No agents found matching your search criteria." : "No agents in this category."}
            </div>
          ) : (
            <div
              // Removed ref={scrollContainerRef} and onScroll={handleScroll}
              className="space-y-6 pr-2" // Removed max-h-[70vh] and overflow-y-auto
            >
              {viewMode === 'graphical' ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedAgents.map(agent => (
                    <AgentCard
                      key={agent.user_id}
                      agent={agent}
                      onViewProfile={handleViewProfile}
                      connectionStatus={agent.connectionStatus} // Use the status derived in useMemo
                      onConnectAgent={handleConnectAgent}
                      onCancelRequest={handleCancelRequest}
                      onAcceptRequest={handleAcceptIncomingRequest}
                      onRejectRequest={handleRejectIncomingRequest}
                      onDisconnectAgent={handleDisconnectAgent}
                      onChatAgent={handleChatAgent} // Added this prop
                      // Pass request_id if it's a pending request
                      requestId={agent.requestId}
                      onFavoriteToggle={handleFavoriteToggle} // Pass the new handler
                      isFavorited={favoriteAgentsStatus.has(agent.user_id)} // Pass favorite status
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm table-fixed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <thead>
                      <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <th onClick={() => handleSortClick('full_name')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '18%' }}>Name {renderSortIcon('full_name')}</th>
                        <th onClick={() => handleSortClick('email')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '22%' }}>Email {renderSortIcon('email')}</th>
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '15%' }}>Phone</th> {/* New Phone Header */}
                        <th onClick={() => handleSortClick('agency_name')} className="cursor-pointer text-left py-2 px-1 whitespace-nowrap" style={{ width: '18%' }}>Agency {renderSortIcon('agency_name')}</th>
                        {/* Removed Status column header */}
                        <th className="text-left py-2 px-1 whitespace-nowrap" style={{ width: '27%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                      {displayedAgents.map(agent => (
                        <tr
                          key={agent.user_id}
                          className={`border-t cursor-pointer break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                          onClick={() => handleViewProfile(agent.user_id)} // Make row clickable
                        >
                          <td className="px-1 py-2" title={agent.full_name}>{agent.full_name}</td>
                          <td className="px-1 py-2" title={agent.email}>{agent.email}</td>
                          <td className="px-1 py-2" title={agent.phone}>{agent.phone || 'N/A'}</td> {/* New Phone Data */}
                          <td className="px-1 py-2" title={agent.agency_name}>{agent.agency_name || 'N/A'}</td>
                          {/* Removed Status column data */}
                          <td className="px-1 py-2 flex gap-1" onClick={(e) => e.stopPropagation()}> {/* Stop propagation for action buttons */}
                            {/* Actions based on connection status */}
                            {agent.connectionStatus === 'none' && (
                              <button onClick={() => handleConnectAgent(agent.user_id)} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-purple-500 hover:border-purple-600 border border-transparent`} title="Send Connection Request">
                                <Plus className="h-4 w-4 mr-1" />Connect
                              </button>
                            )}
                            {agent.connectionStatus === 'pending_sent' && (
                              <button onClick={() => handleCancelRequest(agent.user_id)} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-yellow-500 hover:border-yellow-600 border border-transparent`} title="Cancel Sent Request">
                                <XMarkIcon className="h-4 w-4 mr-1" />Cancel
                              </button>
                            )}
                            {agent.connectionStatus === 'pending_received' && (
                              <>
                                <button onClick={() => handleAcceptIncomingRequest(agent.requestId, agent.user_id)} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-green-500 hover:border-green-600 border border-transparent`} title="Accept Incoming Request">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />Accept
                                </button>
                                <button onClick={() => handleRejectIncomingRequest(agent.requestId)} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-red-500 hover:border-red-600 border border-transparent`} title="Reject Incoming Request">
                                  <XCircleIcon className="h-4 w-4 mr-1" />Reject
                                </button>
                              </>
                            )}
                            {agent.connectionStatus === 'connected' && (
                              <>
                                <button onClick={() => handleSendEmail(agent)} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-blue-500 hover:border-blue-600 border border-transparent`} title="Send Email">
                                  <EnvelopeIcon className="h-4 w-4 mr-1" />Email
                                </button>
                                {agent.phone && (
                                  <button onClick={() => handleCallAgent(agent.phone)} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-green-500 hover:border-green-600 border border-transparent`} title="Call Agent">
                                    <PhoneIcon className="h-4 w-4 mr-1" />Call
                                  </button>
                                )}
                                <button onClick={() => handleChatAgent(agent)} className={`text-sm rounded-xl px-2 py-1 h-8 flex items-center justify-center text-blue-500 hover:border-blue-600 border border-transparent`} title="Chat with Agent">
                                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />Chat
                                </button>
                                <button onClick={() => handleDisconnectAgent(agent.user_id)} className={`text-sm rounded-xl p-1 h-8 w-8 flex items-center justify-center text-red-500 hover:border-red-600 border border-transparent`} title="Disconnect">
                                  <TrashIcon className="h-5 w-5" /> {/* Icon only for disconnect */}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {isLoading && <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading more agents...</p>}
              {!hasMore && !isLoading && displayedAgents.length > 0 && searchTerm && (
                <p className={`text-center text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>End of list.</p>
              )}
            </div>
          )}

          {/* Pagination for the unified list (only visible when search is active) */}
          {displayedAgents.length > 0 && searchTerm && (
            <div className="flex justify-center items-center space-x-4 mt-4">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
              >Prev</button>
              <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {page}</span>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={!hasMore || isLoading}
                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
              >Next</button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Client Inquiry Modal */}
      <AnimatePresence>
        {isChatModalOpen && selectedConversation && (
            <ClientInquiryModal
                isOpen={isChatModalOpen}
                onClose={() => {
                    setIsChatModalOpen(false);
                    setSelectedConversation(null); // Clear conversation on close
                    setOpenedConversationId(null); // Clear opened conversation ID
                }}
                darkMode={darkMode}
                conversation={selectedConversation}
                onSendMessage={handleSendMessage}
                onDelete={handleDeleteConversation}
                onViewProperty={() => showMessage('Property viewing not implemented yet.', 'info')} // Placeholder for onViewProperty
                isGuest={false} // This is a logged-in client
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Agents;

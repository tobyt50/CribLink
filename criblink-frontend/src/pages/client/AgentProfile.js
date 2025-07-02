import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../../config';
import { useTheme } from '../../layouts/AppShell';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import ListingCard from '../../components/ListingCard';
import ClientInquiryModal from '../../components/ClientInquiryModal';
import socket from '../../socket';


import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  StarIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';
import { Menu, X } from 'lucide-react';

const AgentProfile = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const [agent, setAgent] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserPhone, setCurrentUserPhone] = useState('');

  // Set recommendedListingsPerPage to 4 for a 2x2 grid
  const [recommendedListings, setRecommendedListings] = useState([]);
  const [recommendedListingStartIndex, setRecommendedListingStartIndex] = useState(0);
  const recommendedListingsPerPage = 4;

  const [agentListings, setAgentListings] = useState([]);
  const [agentListingStartIndex, setAgentListingStartIndex] = useState(0);
  const agentListingsPerPage = 4;

  const [isMobile, setIsMobile] = useState(false);

  const [isClientInquiryModalOpen, setIsClientInquiryModalOpen] = useState(false);
  const [conversationForModal, setConversationForModal] = useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const contentShift = 0;


  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserRole('guest');
        return;
      }
      try {
        const { data } = await axiosInstance.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(data.role);
        setCurrentUserId(data.user_id);
        setCurrentUserName(data.full_name || data.username || 'Client');
        setCurrentUserEmail(data.email || '');
        setCurrentUserPhone(data.phone || '');

      } catch (error) {
        console.error("Error fetching current user profile:", error);
        setUserRole('guest');
        setCurrentUserId(null);
        setCurrentUserName('');
        setCurrentUserEmail('');
        setCurrentUserPhone('');
        showMessage('Failed to load user profile. Please log in again.', 'error');
      }
    };
    fetchCurrentUserProfile();
  }, [navigate, showMessage]);


  const getInitial = (name) => {
    const safeName = String(name || '');
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : 'N/A';
  };


  const fetchAgentData = useCallback(async () => {
    if (!agentId) return;

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const agentRes = await axiosInstance.get(`${API_BASE_URL}/agents/profile/${agentId}`, {
        headers: headers,
      });
      setAgent(agentRes.data);

    } catch (error) {
      console.error("Error fetching agent profile:", error);
      if (error.response) {
        showMessage(`Failed to load agent profile: ${error.response.data.message || 'Server error'}`, 'error');
      } else {
        showMessage('Failed to load agent profile. Please try again.', 'error');
      }
      setAgent(null);
    }
  }, [agentId, showMessage]);


  const fetchRecommendedListings = useCallback(async () => {
    if (agentId && userRole === 'client' && currentUserId) {
      try {
        const token = localStorage.getItem('token');
        const response = await axiosInstance.get(`${API_BASE_URL}/clients/${currentUserId}/recommendations/agent/${agentId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setRecommendedListings(response.data.recommendations || []);
      } catch (error) {
        console.error("Error fetching recommended listings:", error.response?.data || error.message);
        showMessage('Failed to load recommended listings.', 'error');
        setRecommendedListings([]);
      }
    } else {
      setRecommendedListings([]);
    }
  }, [agentId, userRole, currentUserId, showMessage]);


  const fetchAgentListings = useCallback(async () => {
    if (!agentId) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axiosInstance.get(`${API_BASE_URL}/listings?agent_id=${agentId}&limit=${agentListingsPerPage}&page=1`, { headers });
      setAgentListings(response.data.listings || []);
    } catch (error) {
      console.error("Error fetching agent's listings:", error);
      setAgentListings([]);
    }
  }, [agentId]);


  const fetchConversationForAgent = useCallback(async () => {
    if (!currentUserId || !agentId) {
        console.log('Current User ID or Agent ID not available for conversation fetch.');
        return null;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/inquiries/agent/${agentId}/client/${currentUserId}/conversation`, {
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
                    agentName: conv.agentName || agent?.full_name,
                    agentEmail: conv.agentEmail || agent?.email,
                    agentPhone: agent?.phone,
                    propertyTitle: conv.property_title,
                    messages: formattedMessages,
                    lastMessage: conv.last_message,
                    lastMessageTimestamp: conv.last_message_timestamp,
                    is_agent_responded: conv.is_agent_responded,
                    unreadCount: conv.unread_messages_count,
                };
            }
            return null;
        } else if (res.status === 404) {
            return null;
        } else {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
    } catch (err) {
        console.error("Failed to fetch client-agent conversation:", err);
        showMessage('Failed to load conversation with agent.', 'error');
        return null;
    }
}, [currentUserId, agentId, agent, showMessage]);


  const handleOpenChat = useCallback(async () => {
    if (userRole !== 'client' || !agentId || !currentUserId) {
        showMessage('Please log in as a client to chat with this agent.', 'info');
        return;
    }

    let conversationToOpen = await fetchConversationForAgent();

    if (!conversationToOpen) {
        try {
            const token = localStorage.getItem('token');
            const createRes = await fetch(`${API_BASE_URL}/inquiries/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    client_id: currentUserId,
                    agent_id: agentId,
                    property_id: null,
                    message_content: "::shell::"
                })
            });

            if (createRes.ok) {
                conversationToOpen = await fetchConversationForAgent();
                if (!conversationToOpen) {
                    showMessage("Failed to retrieve new conversation data.", "error");
                    return;
                }
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

    setConversationForModal({ ...conversationToOpen });
    setIsClientInquiryModalOpen(true);
    setOpenedConversationId(conversationToOpen.id);

    if (conversationToOpen.unreadCount > 0) {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_BASE_URL}/inquiries/client/mark-read/${conversationToOpen.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            socket.emit('message_read', { conversationId: conversationToOpen.id, userId: currentUserId, role: 'client' });
            setConversationForModal(prev => prev ? { ...prev, unreadCount: 0 } : null);
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
            showMessage("Failed to mark messages as read.", 'error');
        }
    }
}, [userRole, currentUserId, agentId, fetchConversationForAgent, showMessage]);


  const handleDeleteInquiry = useCallback(async () => {
    if (!conversationForModal) return;
    showConfirm({
      title: "Delete Conversation",
      message: `Are you sure you want to delete this conversation with ${conversationForModal.agentName}? This is irreversible.`,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/inquiries/client/delete-conversation/${conversationForModal.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          showMessage('Conversation deleted.', 'success');
          setIsClientInquiryModalOpen(false);
          setConversationForModal(null);
          setOpenedConversationId(null);
        } else {
          showMessage('Failed to delete conversation.', 'error');
        }
      }
    });
  }, [conversationForModal, showConfirm, showMessage]);

  const handleSendMessageToConversation = useCallback(async (conversationId, messageText) => {
    const token = localStorage.getItem('token');
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
        recipient_id: conversationForModal?.agent_id,
        message_type: 'client_reply',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      showMessage(`Failed to send message: ${errorData.message || response.statusText}`, 'error');
    } else {
    }
  }, [conversationForModal, showMessage]);


  useEffect(() => {
    if (currentUserId !== null || userRole === 'guest') {
      fetchAgentData();
      fetchAgentListings();
    }
  }, [currentUserId, userRole, fetchAgentData, fetchAgentListings]);

  useEffect(() => {
    if (userRole === 'client' && currentUserId && agentId) {
      fetchRecommendedListings();
    } else {
      setRecommendedListings([]);
    }
  }, [fetchRecommendedListings, userRole, currentUserId, agentId]);


  useEffect(() => {
    if (!socket.connected) socket.connect();

    if (conversationForModal?.id && currentUserId) {
        socket.emit('join_conversation', conversationForModal.id);
    }

    const handleNewMessage = async (newMessage) => {
        if (!conversationForModal || newMessage.conversationId !== conversationForModal.id) return;

        const updatedConversation = await fetchConversationForAgent();
        if (updatedConversation) {
            setConversationForModal(updatedConversation);
        }

        const expectedAgentId = Number(newMessage.agentId || newMessage.agent_id || conversationForModal.agent_id);
        const senderId = Number(newMessage.senderId);
        const isFromAgent = senderId === expectedAgentId;

        if (isFromAgent && openedConversationId === conversationForModal.id) {
            const token = localStorage.getItem('token');
            if (token && currentUserId) {
                fetch(`${API_BASE_URL}/inquiries/client/mark-read/${conversationForModal.id}`, {
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
                                userId: currentUserId,
                                role: 'client'
                            });
                        }
                    })
                    .catch(err => console.error("Error marking message as read:", err));
            }
        }
    };

    const handleReadAck = async ({ conversationId, readerId, role }) => {
        if (conversationId === conversationForModal?.id && role === 'agent') {
            const updatedConversation = await fetchConversationForAgent();
            if (updatedConversation) {
                setConversationForModal(updatedConversation);
            }
        }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_read_ack', handleReadAck);

    return () => {
        if (conversationForModal?.id && currentUserId) {
            socket.emit('leave_conversation', conversationForModal.id);
        }
        socket.off('new_message', handleNewMessage);
        socket.off('message_read_ack', handleReadAck);
    };
  }, [conversationForModal, openedConversationId, currentUserId, showMessage, fetchConversationForAgent]);


  const handleViewProperty = (propertyId) => {
    navigate(`/listings/${propertyId}`);
  };

  const handlePrevAgentListing = () => {
    setAgentListingStartIndex((prevIndex) => Math.max(0, prevIndex - agentListingsPerPage));
  };

  const handleNextAgentListing = () => {
    setAgentListingStartIndex((prevIndex) => Math.min(agentListings.length - agentListingsPerPage, prevIndex + agentListingsPerPage));
  };

  const displayedAgentListings = agentListings.slice(
    agentListingStartIndex,
    agentListingStartIndex + agentListingsPerPage
  );

  const handlePrevRecommendedAgent = () => {
    setRecommendedListingStartIndex((prevIndex) => Math.max(0, prevIndex - recommendedListingsPerPage));
  };

  const handleNextRecommendedAgent = () => {
    setRecommendedListingStartIndex((prevIndex) => Math.min(recommendedListings.length - recommendedListingsPerPage, prevIndex + recommendedListingsPerPage));
  };

  const displayedRecommendedListings = recommendedListings.slice(
    recommendedListingStartIndex,
    recommendedListingStartIndex + recommendedListingsPerPage
  );

  if (!agent) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
        Loading agent profile...
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Agent Profile</h1>

        <div className="flex flex-col lg:flex-row gap-8 lg:max-w-7xl lg:mx-auto">
          <div className="w-full lg:w-3/5 space-y-8">
            <motion.div
              className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} space-y-4 ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className={`text-xl md:text-2xl font-extrabold mb-4 ${darkMode ? "text-green-400" : "text-green-800"}`}>
                {agent.full_name}
              </h2>

              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={agent.profile_picture_url || `https://placehold.co/120x120/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(agent.full_name)}`}
                  alt="Agent Profile"
                  className="w-32 h-32 rounded-full object-cover border-2 border-green-500 shadow-md"
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/120x120/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(agent.full_name)}`; }}
                />
                <div>
                  <p className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agent.full_name}</p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Agent ID: {agent.user_id}</p>
                  {agent.agency && <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Agency: {agent.agency}</p>}
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Status: <span className={`font-medium ${agent.user_status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{agent.user_status?.toUpperCase() || 'N/A'}</span></p>
                </div>
              </div>

              <div className={`space-y-3 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
                <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Contact Information</h3>
                <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  ✉️ <strong>Email:</strong> <a href={`mailto:${agent.email}`} className="text-blue-500 hover:underline">{agent.email}</a>
                </p>
                <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  📞 <strong>Phone:</strong> {agent.phone || 'N/A'}
                </p>
              </div>

              <div className={`space-y-3 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
                <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>About {agent.full_name}</h3>
                {agent.bio && (
                  <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
                    {agent.bio}
                  </p>
                )}
                {agent.location && (
                  <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <MapPinIcon className="h-5 w-5 text-green-500" /> <strong>Based In:</strong> {agent.location}
                  </p>
                )}
              </div>

              {agent.deals_closed !== undefined && (
                <div className={`space-y-3 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
                  <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Performance Overview</h3>
                  <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <UsersIcon className="h-5 w-5 text-green-500" /> <strong>Deals Closed:</strong> {agent.deals_closed || 0}
                  </p>
                  <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <StarIcon className="h-5 w-5 text-green-500" /> <strong>Average Rating:</strong> {agent.avg_rating || 'N/A'}
                  </p>
                  <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Revenue Generated:</strong> {agent.revenue ? `₦${agent.revenue.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>General Information</h3>
                <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}><strong>Joined Platform:</strong> {new Date(agent.date_joined).toLocaleDateString()}</p>
                <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}><strong>Last Active:</strong> {agent.last_login ? new Date(agent.last_login).toLocaleString() : 'N/A'}</p>
              </div>
            </motion.div>

            {isMobile && (
                <motion.div
                    className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} flex flex-col items-center justify-center text-center ${isMobile ? 'mt-8' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    style={{ minHeight: isMobile ? 'auto' : '150px' }}
                >
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                  <ChatBubbleLeftRightIcon className="h-6 w-6 inline-block mr-2" />
                        Chat with {agent.full_name}
                    </h2>
                    {userRole === 'client' ? (
                        <>
                            <button
                                onClick={handleOpenChat}
                                disabled={userRole !== 'client' || !agentId || !currentUserId}
                                className={`py-2 px-6 rounded-xl transition font-semibold shadow ${userRole !== 'client' || !agentId || !currentUserId ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                Open Chat
                            </button>
                        </>
                    ) : (
                        <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            Please <a href="/signin" className="text-blue-500 hover:underline">log in</a> as a client to interact with this agent.
                        </p>
                    )}
                </motion.div>
            )}

            {isMobile && userRole === 'client' && (
                <motion.div
                  className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} flex flex-col ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                        Recommended for You by {agent.full_name}
                    </h2>
                    {recommendedListings.length > 0 ? (
                        <div className="flex flex-col items-center w-full">
                            {/* Changed grid to 2x2 for desktop, 1x2 for mobile */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 p-2 -mx-2">
                                {displayedRecommendedListings.map(listing => (
                                    <div key={listing.property_id} className="w-full">
                                        <ListingCard listing={listing} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center mt-4 space-x-4">
                                <button
                                    onClick={handlePrevRecommendedAgent}
                                    disabled={recommendedListingStartIndex === 0}
                                    className={`p-2 rounded-full shadow-md transition-all duration-200
                                        ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                                        ${recommendedListingStartIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <ArrowLeftCircleIcon className="h-8 w-8" />
                                </button>
                                <button
                                    onClick={handleNextRecommendedAgent}
                                    disabled={recommendedListingStartIndex >= recommendedListings.length - recommendedListingsPerPage}
                                    className={`p-2 rounded-full shadow-md transition-all duration-200
                                        ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                                        ${recommendedListingStartIndex >= recommendedListings.length - recommendedListingsPerPage ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <ArrowRightCircleIcon className="h-8 w-8" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            No listings recommended by this agent yet.
                        </p>
                    )}
                </motion.div>
            )}

            <motion.div
              className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} flex flex-col ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                Agent's Listings
              </h2>
              {agentListings.length > 0 ? (
                  <div className="flex flex-col items-center w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4 p-2 -mx-2">
                          {displayedAgentListings.map(listing => (
                              <div key={listing.property_id} className="w-full">
                                  <ListingCard
                                      listing={listing}
                                      darkMode={darkMode}
                                      onViewProperty={handleViewProperty}
                                      showAgentName={false}
                                  />
                              </div>
                          ))}
                      </div>
                      <div className="flex justify-center mt-4 space-x-4">
                          <button
                              onClick={handlePrevAgentListing}
                              disabled={agentListingStartIndex === 0}
                              className={`p-2 rounded-full shadow-md transition-all duration-200
                                  ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                                  ${agentListingStartIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                              <ArrowLeftCircleIcon className="h-8 w-8" />
                          </button>
                          <button
                              onClick={handleNextAgentListing}
                              disabled={agentListingStartIndex >= agentListings.length - agentListingsPerPage}
                              className={`p-2 rounded-full shadow-md transition-all duration-200
                                  ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                                  ${agentListingStartIndex >= agentListings.length - agentListingsPerPage ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                              <ArrowRightCircleIcon className="h-8 w-8" />
                          </button>
                      </div>
                  </div>
              ) : (
                  <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      No listings available from this agent yet. (Backend endpoint required: `/api/agents/${agentId}/listings`)
                  </p>
              )}
            </motion.div>

            <motion.div
              className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} flex flex-col ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                Client Reviews
              </h2>
              <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Client reviews for this agent will appear here. (Requires new API endpoint)
                  </p>
              </div>
            </motion.div>

          </div>

          <div className="w-full lg:w-2/5 space-y-8">
            {!isMobile && (
                <motion.div
                    className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} flex flex-col items-center justify-center text-center ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    style={{ minHeight: '150px' }}
                >
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                  <ChatBubbleLeftRightIcon className="h-6 w-6 inline-block mr-2" />
                        Chat with {agent.full_name}
                    </h2>
                    {userRole === 'client' ? (
                        <>
                            <button
                                onClick={handleOpenChat}
                                disabled={userRole !== 'client' || !agentId || !currentUserId}
                                className={`py-2 px-6 rounded-xl transition font-semibold shadow ${userRole !== 'client' || !agentId || !currentUserId ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                Open Chat
                            </button>
                        </>
                    ) : (
                        <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            Please <a href="/signin" className="text-blue-500 hover:underline">log in</a> as a client to interact with this agent.
                        </p>
                    )}
                </motion.div>
            )}

            {!isMobile && userRole === 'client' && (
                <motion.div
                  className={'p-6 rounded-2xl shadow-xl flex flex-col ' + (darkMode ? "bg-gray-800" : "bg-white")}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                        Recommended for You by {agent.full_name}
                    </h2>
                    {recommendedListings.length > 0 ? (
                        <div className="flex flex-col items-center w-full">
                            {/* Changed grid to 2x2 for desktop, 1x2 for mobile */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 p-2 -mx-2">
                                {displayedRecommendedListings.map(listing => (
                                    <div key={listing.property_id} className="w-full">
                                        <ListingCard listing={listing} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center mt-4 space-x-4">
                                <button
                                    onClick={handlePrevRecommendedAgent}
                                    disabled={recommendedListingStartIndex === 0}
                                    className={`p-2 rounded-full shadow-md transition-all duration-200
                                        ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                                        ${recommendedListingStartIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <ArrowLeftCircleIcon className="h-8 w-8" />
                                </button>
                                <button
                                    onClick={handleNextRecommendedAgent}
                                    disabled={recommendedListingStartIndex >= recommendedListings.length - recommendedListingsPerPage}
                                    className={`p-2 rounded-full shadow-md transition-all duration-200
                                        ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                                        ${recommendedListingStartIndex >= recommendedListings.length - recommendedListingsPerPage ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <ArrowRightCircleIcon className="h-8 w-8" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            No listings recommended by this agent yet.
                        </p>
                    )}
                </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isClientInquiryModalOpen && conversationForModal && (
          <ClientInquiryModal
            isOpen={isClientInquiryModalOpen}
            onClose={() => {
              setIsClientInquiryModalOpen(false);
              setConversationForModal(null);
              setOpenedConversationId(null);
            }}
            conversation={conversationForModal}
            darkMode={darkMode}
            onViewProperty={handleViewProperty}
            onDelete={handleDeleteInquiry}
            onSendMessage={handleSendMessageToConversation}
            isGuest={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentProfile;

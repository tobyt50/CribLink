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

  // State for expanded profile picture
  const [isProfilePicExpanded, setIsProfilePicExpanded] = useState(false);
  const profilePicRef = useRef(null);


  // Set recommendedListingsPerPage to 4 for a 2x2 grid
  const [recommendedListings, setRecommendedListings] = useState([]);
  const [recommendedListingStartIndex, setRecommendedListingStartIndex] = useState(0);
  const recommendedListingsPerPage = 4; // For a 2x2 grid

  const [agentListings, setAgentListings] = useState([]);
  const [agentListingStartIndex, setAgentListingStartIndex] = useState(0);
  const agentListingsPerPage = 4; // For a 2x2 grid

  const [isMobile, setIsMobile] = useState(false);

  const [isClientInquiryModalOpen, setIsClientInquiryModalOpen] = useState(false);
  const [conversationForModal, setConversationForModal] = useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null);

  // Refs for auto-swipe functionality
  const agentCarouselRef = useRef(null);
  const autoSwipeAgentIntervalRef = useRef(null);
  const recommendedCarouselRef = useRef(null);
  const autoSwipeRecommendedIntervalRef = useRef(null);

  // New state for the current user's (client's) favorite properties
  const [clientFavoriteProperties, setClientFavoriteProperties] = useState([]);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  // Function to convert string to sentence case
  const toSentenceCase = (str) => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
        // Removed limit and page parameters to fetch all recommendations
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

      // Fetch listings specifically for this agent, removed limit and page parameters
      const response = await axiosInstance.get(`${API_BASE_URL}/listings?agent_id=${agentId}`, { headers });
      setAgentListings(response.data.listings || []);
    } catch (error) {
      console.error("Error fetching agent's listings:", error);
      showMessage("Failed to load agent's listings.", 'error'); // Added error message for user
      setAgentListings([]);
    }
  }, [agentId, showMessage]); // Added showMessage to dependencies


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

  // New: Function to fetch client's own favorite properties
  const fetchClientFavoriteProperties = useCallback(async () => {
    if (userRole === 'client' && currentUserId) {
      try {
        const token = localStorage.getItem('token');
        const response = await axiosInstance.get(`${API_BASE_URL}/favourites/properties`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClientFavoriteProperties(response.data.favourites.map(fav => fav.property_id) || []);
      } catch (error) {
        console.error("Error fetching client's favorite properties:", error);
        showMessage("Failed to load your favorite properties.", 'error');
        setClientFavoriteProperties([]);
      }
    } else {
      setClientFavoriteProperties([]);
    }
  }, [userRole, currentUserId, showMessage]);

  // New: Function to toggle client's favorite status for a property
  const handleToggleClientFavoriteProperty = async (propertyId, isCurrentlyFavorited) => {
    console.log(`Attempting to toggle favorite for propertyId: ${propertyId}, current status: ${isCurrentlyFavorited}`); // Debug log
    if (userRole !== 'client' || !currentUserId) {
      showMessage('You must be logged in as a client to favorite properties.', 'info');
      console.log('User is not a client or currentUserId is missing.'); // Debug log
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      showMessage("Authentication token not found. Please log in.", 'error');
      console.log('Authentication token not found.'); // Debug log
      return;
    }

    try {
      if (isCurrentlyFavorited) {
        console.log(`Sending DELETE request for propertyId: ${propertyId}`); // Debug log
        await axiosInstance.delete(`${API_BASE_URL}/favourites/properties/${propertyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClientFavoriteProperties(prev => prev.filter(id => id !== propertyId));
        showMessage('Removed listing from your favorites!', 'info');
      } else {
        console.log(`Sending POST request for propertyId: ${propertyId}`); // Debug log
        await axiosInstance.post(`${API_BASE_URL}/favourites/properties`, { property_id: propertyId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClientFavoriteProperties(prev => [...prev, propertyId]);
        showMessage('Added listing to your favorites!', 'success');
      }
      console.log('Client favorite properties after toggle:', clientFavoriteProperties); // Debug log
    } catch (err) {
      console.error('Error toggling property favorite status:', err.response?.data || err.message);
      let errorMessage = 'Failed to update property favorite status. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showMessage(errorMessage, 'error');
    }
  };


  useEffect(() => {
    if (currentUserId !== null || userRole === 'guest') {
      fetchAgentData();
      fetchAgentListings(); // Ensure this is called
    }
  }, [currentUserId, userRole, fetchAgentData, fetchAgentListings]);

  useEffect(() => {
    if (userRole === 'client' && currentUserId && agentId) {
      fetchRecommendedListings();
      fetchClientFavoriteProperties(); // Fetch client's favorite properties
    } else {
      setRecommendedListings([]);
      setClientFavoriteProperties([]); // Clear client's favorite properties
    }
  }, [fetchRecommendedListings, fetchClientFavoriteProperties, userRole, currentUserId, agentId]);


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
    clearInterval(autoSwipeAgentIntervalRef.current); // Stop auto-swipe on manual interaction
  };

  const handleNextAgentListing = () => {
    setAgentListingStartIndex((prevIndex) => {
      const totalPages = Math.ceil(agentListings.length / agentListingsPerPage);
      const currentPage = prevIndex / agentListingsPerPage;
      const nextPage = (currentPage + 1) % totalPages;
      return nextPage * agentListingsPerPage;
    });
    clearInterval(autoSwipeAgentIntervalRef.current); // Stop auto-swipe on manual interaction
  };

  const displayedAgentListings = agentListings.slice(
    agentListingStartIndex,
    agentListingStartIndex + agentListingsPerPage
  );

  const handlePrevRecommendedAgent = () => {
    setRecommendedListingStartIndex((prevIndex) => Math.max(0, prevIndex - recommendedListingsPerPage));
    clearInterval(autoSwipeRecommendedIntervalRef.current); // Stop auto-swipe on manual interaction
  };

  const handleNextRecommendedAgent = () => {
    setRecommendedListingStartIndex((prevIndex) => {
      const totalPages = Math.ceil(recommendedListings.length / recommendedListingsPerPage);
      const currentPage = prevIndex / recommendedListingsPerPage;
      const nextPage = (currentPage + 1) % totalPages;
      return nextPage * recommendedListingsPerPage;
    });
    clearInterval(autoSwipeRecommendedIntervalRef.current); // Stop auto-swipe on manual interaction
  };

  const displayedRecommendedListings = recommendedListings.slice(
    recommendedListingStartIndex,
    recommendedListingStartIndex + recommendedListingsPerPage
  );

  // Auto-swipe for Agent's Listings
  useEffect(() => {
    if (autoSwipeAgentIntervalRef.current) {
      clearInterval(autoSwipeAgentIntervalRef.current);
    }

    if (agentListings.length > agentListingsPerPage) {
      autoSwipeAgentIntervalRef.current = setInterval(() => {
        setAgentListingStartIndex((prevIndex) => {
          const totalPages = Math.ceil(agentListings.length / agentListingsPerPage);
          const currentPage = prevIndex / agentListingsPerPage;
          const nextPage = (currentPage + 1) % totalPages;
          return nextPage * agentListingsPerPage;
        });
      }, 5000); // Change every 5 seconds
    }

    return () => {
      if (autoSwipeAgentIntervalRef.current) {
        clearInterval(autoSwipeAgentIntervalRef.current);
      }
    };
  }, [agentListings, agentListingsPerPage]);

  // Auto-swipe for Recommended Listings
  useEffect(() => {
    if (autoSwipeRecommendedIntervalRef.current) {
      clearInterval(autoSwipeRecommendedIntervalRef.current);
    }

    if (recommendedListings.length > recommendedListingsPerPage) {
      autoSwipeRecommendedIntervalRef.current = setInterval(() => {
        setRecommendedListingStartIndex((prevIndex) => {
          const totalPages = Math.ceil(recommendedListings.length / recommendedListingsPerPage);
          const currentPage = prevIndex / recommendedListingsPerPage;
          const nextPage = (currentPage + 1) % totalPages;
          return nextPage * recommendedListingsPerPage;
        });
      }, 5000); // Change every 5 seconds
    }

    return () => {
      if (autoSwipeRecommendedIntervalRef.current) {
        clearInterval(autoSwipeRecommendedIntervalRef.current);
      }
    };
  }, [recommendedListings, recommendedListingsPerPage]);


  // Touch event handlers for Agent's Listings
  const handleTouchStartAgent = useCallback((e) => {
    clearInterval(autoSwipeAgentIntervalRef.current);
    if (agentCarouselRef.current) {
      agentCarouselRef.current.startX = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMoveAgent = useCallback((e) => {
    if (!agentCarouselRef.current || agentCarouselRef.current.startX === undefined) return;
    const currentX = e.touches[0].clientX;
    const diffX = agentCarouselRef.current.startX - currentX;
    if (Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEndAgent = useCallback((e) => {
    if (!agentCarouselRef.current || agentCarouselRef.current.startX === undefined) return;
    const endX = e.changedTouches[0].clientX;
    const diffX = agentCarouselRef.current.startX - endX;
    const swipeThreshold = 50;
    if (diffX > swipeThreshold) {
      handleNextAgentListing();
    } else if (diffX < -swipeThreshold) {
      handlePrevAgentListing();
    }
    agentCarouselRef.current.startX = undefined;
  }, [handleNextAgentListing, handlePrevAgentListing]);

  // Touch event handlers for Recommended Listings
  const handleTouchStartRecommended = useCallback((e) => {
    clearInterval(autoSwipeRecommendedIntervalRef.current);
    if (recommendedCarouselRef.current) {
      recommendedCarouselRef.current.startX = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMoveRecommended = useCallback((e) => {
    if (!recommendedCarouselRef.current || recommendedCarouselRef.current.startX === undefined) return;
    const currentX = e.touches[0].clientX;
    const diffX = recommendedCarouselRef.current.startX - currentX;
    if (Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEndRecommended = useCallback((e) => {
    if (!recommendedCarouselRef.current || recommendedCarouselRef.current.startX === undefined) return;
    const endX = e.changedTouches[0].clientX;
    const diffX = recommendedCarouselRef.current.startX - endX;
    const swipeThreshold = 50;
    if (diffX > swipeThreshold) {
      handleNextRecommendedAgent();
    } else if (diffX < -swipeThreshold) {
      handlePrevRecommendedAgent();
    }
    recommendedCarouselRef.current.startX = undefined;
  }, [handleNextRecommendedAgent, handlePrevRecommendedAgent]);


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
          {/* Left Column */}
          <div className="w-full lg:w-3/5 space-y-8">
            <motion.div
              className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} space-y-4 ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Agent Name and Status */}
              <h2 className={`text-xl md:text-2xl font-extrabold mb-4 ${darkMode ? "text-green-400" : "text-green-800"} flex items-center`}>
                {agent.full_name}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${agent.user_status === 'active' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}
                  ${darkMode ? (agent.user_status === 'active' ? 'dark:bg-green-700 dark:text-green-200' : 'dark:bg-red-700 dark:text-red-200') : ''}`}>
                  {toSentenceCase(agent.user_status) || 'N/A'}
                </span>
              </h2>

              <div className="flex items-start space-x-4 mb-6">
                {/* Profile Picture */}
                <div className="relative cursor-pointer" onClick={() => setIsProfilePicExpanded(true)}>
                  <img
                    src={agent.profile_picture_url || `https://placehold.co/150x150/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(agent.full_name)}`}
                    alt="Agent Profile"
                    className="w-40 h-40 rounded-full object-cover border-2 border-green-500 shadow-md"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x150/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(agent.full_name)}`; }}
                  />
                </div>
                {/* Agent ID, Agency, and Contact Information */}
                <div className="flex-1">
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Agent ID: {agent.user_id}</p>
                  {agent.agency && <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Agency: {agent.agency}</p>}

                  <div className={`space-y-3 pt-4 ${darkMode ? "border-gray-700" : "border-gray-200"} border-t`}>
                    <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Contact Information</h3>
                    <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      ✉️ <strong>Email:</strong> <a href={`mailto:${agent.email}`} className="text-blue-500 hover:underline">{agent.email}</a>
                    </p>
                    <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      📞 <strong>Phone:</strong> {agent.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expanded Profile Picture Modal */}
              <AnimatePresence>
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
                      src={agent.profile_picture_url || `https://placehold.co/400x400/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(agent.full_name)}`}
                      alt="Agent Profile Expanded"
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

            {/* Chat with Agent section for mobile */}
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

            {/* Agency Overview Panel - Moved here for mobile */}
            {isMobile && agent.agency_info && (
              <motion.div
                // Refactored: Removed bg-white, rounded-2xl, and shadow-xl for mobile view.
                // They are now applied only on medium (md) screens and up.
                className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} space-y-4 ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                  <BuildingOfficeIcon className="h-6 w-6 inline-block mr-2" /> Agency Overview
                </h2>
                {agent.agency_info ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    {agent.agency_info.logo_url ? (
                      <img
                        src={agent.agency_info.logo_url}
                        alt={`${agent.agency_info.agency_name} Logo`}
                        className="w-16 h-16 rounded-full object-cover border border-gray-300"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/64x64/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(agent.agency_info.agency_name)}`; }}
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${darkMode ? "bg-gray-700 text-green-400" : "bg-green-100 text-green-700"}`}>
                        {getInitial(agent.agency_info.agency_name)}
                      </div>
                    )}
                    <p className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"} flex items-center`}>
                      {agent.agency_info.agency_name}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${agent.agency_info.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}
                        ${darkMode ? (agent.agency_info.status === 'active' ? 'dark:bg-green-700 dark:text-green-200' : 'dark:bg-red-700 dark:text-red-200') : ''}`}>
                        {toSentenceCase(agent.agency_info.status) || 'N/A'}
                      </span>
                    </p>
                  </div>
                  <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Location:</strong> {agent.agency_info.location || 'N/A'}
                  </p>
                  <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Date Founded:</strong> {formatDate(agent.agency_info.date_founded)}
                  </p>
                  <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Total Agents:</strong> {agent.agency_info.total_agents || 'N/A'}
                  </p>
                  <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Total Listings:</strong> {agent.agency_info.total_listings || 'N/A'}
                  </p>
                  <div className="flex justify-center"> {/* Centering the button */}
                    <button
                      onClick={() => navigate(`/agencies/${agent.agency_info.agency_id}`)} /* Link to agency profile page */
                      className={`mt-4 py-2 px-4 rounded-xl transition font-semibold shadow ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                      View Agency Profile
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No agency information available.</p>
              )}
              </motion.div>
            )}

            {/* "Recommended for You" section for mobile */}
            {isMobile && userRole === 'client' && (
                <motion.div
                  className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} flex flex-col ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  ref={recommendedCarouselRef}
                  onTouchStart={handleTouchStartRecommended}
                  onTouchMove={handleTouchMoveRecommended}
                  onTouchEnd={handleTouchEndRecommended}
                >
                    <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                        Recommended for You by {agent.full_name}
                    </h2>
                    {recommendedListings.length > 0 ? (
                        <div className="flex flex-col items-center w-full">
                            {/* Removed fixed height container for auto-swipe */}
                            <div className="relative w-full overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`recommended-page-${recommendedListingStartIndex}`}
                                        initial={{ opacity: 0, x: 100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ duration: 0.6, ease: "easeInOut" }}
                                        className="grid grid-cols-2 md:grid-cols-2 gap-4 w-full"
                                    >
                                        {displayedRecommendedListings.map(listing => (
                                            <div key={listing.property_id} className="w-full">
                                                <ListingCard
                                                  listing={listing}
                                                  isFavorited={clientFavoriteProperties.includes(listing.property_id)}
                                                  onFavoriteToggle={(propertyId, isCurrentlyFavorited) => handleToggleClientFavoriteProperty(propertyId, isCurrentlyFavorited)}
                                                />
                                            </div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
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
              ref={agentCarouselRef}
              onTouchStart={handleTouchStartAgent}
              onTouchMove={handleTouchMoveAgent}
              onTouchEnd={handleTouchEndAgent}
            >
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                Agent's Listings
              </h2>
              {agentListings.length > 0 ? (
                  <div className="flex flex-col items-center w-full">
                      {/* Removed fixed height container for auto-swipe */}
                      <div className="relative w-full overflow-hidden">
                          <AnimatePresence mode="wait">
                              <motion.div
                                  key={`agent-page-${agentListingStartIndex}`}
                                  initial={{ opacity: 0, x: 100 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -100 }}
                                  transition={{ duration: 0.6, ease: "easeInOut" }}
                                  className="grid grid-cols-2 md:grid-cols-2 gap-4 w-full"
                              >
                                  {displayedAgentListings.map(listing => (
                                      <div key={listing.property_id} className="w-full">
                                          <ListingCard
                                              listing={listing}
                                              darkMode={darkMode}
                                              onViewProperty={handleViewProperty}
                                              showAgentName={false}
                                              isFavorited={clientFavoriteProperties.includes(listing.property_id)}
                                              onFavoriteToggle={(propertyId, isCurrentlyFavorited) => handleToggleClientFavoriteProperty(propertyId, isCurrentlyFavorited)}
                                          />
                                      </div>
                                  ))}
                              </motion.div>
                          </AnimatePresence>
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
                      No listings available from this agent yet.
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

          {/* Right Column */}
          <div className="w-full lg:w-2/5 space-y-8">
            {!isMobile && (
                <motion.div
                    className={'p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center ' + (darkMode ? "bg-gray-800" : "bg-white")}
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

            {/* Agency Overview Panel - Moved here for desktop */}
            {!isMobile && agent.agency_info && (
              <motion.div
                className={`p-6 rounded-2xl shadow-xl space-y-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                  <BuildingOfficeIcon className="h-6 w-6 inline-block mr-2" /> Agency Overview
                </h2>
                {agent.agency_info ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    {agent.agency_info.logo_url ? (
                      <img
                        src={agent.agency_info.logo_url}
                        alt={`${agent.agency_info.agency_name} Logo`}
                        className="w-16 h-16 rounded-full object-cover border border-gray-300"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/64x64/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(agent.agency_info.agency_name)}`; }}
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${darkMode ? "bg-gray-700 text-green-400" : "bg-green-100 text-green-700"}`}>
                        {getInitial(agent.agency_info.agency_name)}
                      </div>
                    )}
                    <p className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"} flex items-center`}>
                      {agent.agency_info.agency_name}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${agent.agency_info.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}
                        ${darkMode ? (agent.agency_info.status === 'active' ? 'dark:bg-green-700 dark:text-green-200' : 'dark:bg-red-700 dark:text-red-200') : ''}`}>
                        {toSentenceCase(agent.agency_info.status) || 'N/A'}
                      </span>
                    </p>
                  </div>
                  <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Location:</strong> {agent.agency_info.location || 'N/A'}
                  </p>
                  <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Date Founded:</strong> {formatDate(agent.agency_info.date_founded)}
                  </p>
                  <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Total Agents:</strong> {agent.agency_info.total_agents || 'N/A'}
                  </p>
                  <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <strong>Total Listings:</strong> {agent.agency_info.total_listings || 'N/A'}
                  </p>
                  <div className="flex justify-center"> {/* Centering the button */}
                    <button
                      onClick={() => navigate(`/agencies/${agent.agency_info.agency_id}`)} /* Link to agency profile page */
                      className={`mt-4 py-2 px-4 rounded-xl transition font-semibold shadow ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                      View Agency Profile
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No agency information available.</p>
              )}
              </motion.div>
            )}

            {/* "Recommended for You" section for desktop */}
            {!isMobile && userRole === 'client' && (
                <motion.div
                  className={'p-6 rounded-2xl shadow-xl flex flex-col ' + (darkMode ? "bg-gray-800" : "bg-white")}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  ref={recommendedCarouselRef}
                  onTouchStart={handleTouchStartRecommended}
                  onTouchMove={handleTouchMoveRecommended}
                  onTouchEnd={handleTouchEndRecommended}
                >
                    <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                        Recommended for You by {agent.full_name}
                    </h2>
                    {recommendedListings.length > 0 ? (
                        <div className="flex flex-col items-center w-full">
                            {/* Removed fixed height container for auto-swipe */}
                            <div className="relative w-full overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`recommended-page-${recommendedListingStartIndex}`}
                                        initial={{ opacity: 0, x: 100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ duration: 0.6, ease: "easeInOut" }}
                                        className="grid grid-cols-2 md:grid-cols-2 gap-4 w-full"
                                    >
                                        {displayedRecommendedListings.map(listing => (
                                            <div key={listing.property_id} className="w-full">
                                                <ListingCard
                                                  listing={listing}
                                                  isFavorited={clientFavoriteProperties.includes(listing.property_id)}
                                                  onFavoriteToggle={(propertyId, isCurrentlyFavorited) => handleToggleClientFavoriteProperty(propertyId, isCurrentlyFavorited)}
                                                />
                                            </div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
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

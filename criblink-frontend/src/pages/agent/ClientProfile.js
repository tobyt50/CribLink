import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../../config';
import { useTheme } from '../../layouts/AppShell';
import { useMessage } from '../../context/MessageContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import AgentInquiryModal from '../../components/AgentInquiryModal';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import socket from '../../socket';
import ListingCard from '../../components/ListingCard';

import { ChatBubbleLeftRightIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Added PencilIcon, CheckIcon, XMarkIcon
import {
  Menu,
  X,
  BookmarkIcon, // Using BookmarkIcon from lucide-react
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  StarIcon,
} from 'lucide-react';
import AgentSidebar from '../../components/agent/Sidebar';

// Skeleton for a general content block (used for Chat skeleton)
const ContentBlockSkeleton = ({ darkMode, height = 'h-40' }) => (
  <div className={`p-6 rounded-2xl shadow-xl animate-pulse ${darkMode ? "bg-gray-800" : "bg-white"} ${height}`}>
    <div className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div>
    <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-2`}></div>
    <div className={`h-4 w-5/6 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
  </div>
);

// REVISED Skeleton for Client Info section for better accuracy
const ClientInfoSkeleton = ({ darkMode }) => (
  <div className={`p-6 rounded-2xl shadow-xl animate-pulse ${darkMode ? "bg-gray-800" : "bg-white"}`}>
    {/* Header: Name and Bookmark */}
    <div className="flex justify-between items-center mb-6">
      <div className={`h-8 w-48 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    </div>

    {/* Profile Pic & Contact Info */}
    <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
      <div className={`w-32 h-32 rounded-full flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className="flex-1 w-full space-y-3">
        <div className={`h-4 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-px w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} my-2`}></div>
        <div className={`h-5 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      </div>
    </div>

    {/* Other Details, Notes, and Preferences Sections Placeholder */}
    <div className={`h-px w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} my-6`}></div>
    <div className={`h-5 w-1/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-3`}></div>
    <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-2`}></div>
    <div className={`h-4 w-5/6 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-6`}></div>
    
    <div className={`h-px w-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} my-6`}></div>
    <div className={`h-5 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-3`}></div>
    <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-2`}></div>
    <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
  </div>
);

// Skeleton for Listing Card (used in Favourites and Recommended)
const ListingCardSkeleton = ({ darkMode }) => (
  <div className={`rounded-xl shadow-lg p-4 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
    <div className={`w-full h-32 rounded-lg ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
    <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-2`}></div>
    <div className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
    <div className="flex justify-between items-center">
      <div className={`h-8 w-1/3 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </div>
  </div>
);

// NEW Skeleton for Listings sections (Favourites, Recommended)
const ListingsSectionSkeleton = ({ darkMode }) => (
    <div className={`p-6 rounded-2xl shadow-xl animate-pulse ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => ( // Showing 2 is enough to represent the grid without taking too much vertical space
          <ListingCardSkeleton key={i} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );


const ClientProfile = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const [client, setClient] = useState(null);
  const [agentId, setAgentId] = useState(null); // This will store the current authenticated agent's ID
  const [userRole, setUserRole] = useState('');

  const [isAgentInquiryModalOpen, setIsAgentInquiryModalOpen] = useState(false);
  const [conversationForModal, setConversationForModal] = useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null);

  const { isCollapsed, setIsCollapsed, isMobile, isSidebarOpen, setIsSidebarOpen } = useSidebarState();
  const [activeSection, setActiveSection] = useState('clients');

  const [clientPreferences, setClientPreferences] = useState({
    preferred_property_type: 'Any',
    preferred_location: 'Any',
    min_price: null,
    max_price: null,
    bedrooms: null,
    bathrooms: null,
  });

  const [canViewPropertyPreferences, setCanViewPropertyPreferences] = useState(false); // New state for property preferences visibility
  const [favouriteListings, setFavouriteListings] = useState([]);
  const [showFavourites, setShowFavourites] = useState(false);

  const [favouriteListingStartIndex, setFavouriteListingStartIndex] = useState(0);
  const listingsPerPage = 4; // Changed to 4 for 2x2 layout

  const [recommendedListings, setRecommendedListings] = useState([]);
  const [recommendedListingStartIndex, setRecommendedListingStartIndex] = useState(0);
  const recommendedListingsPerPage = 4; // Changed to 4 for 2x2 layout

  // State for client favorite status (for agents to favorite clients)
  const [isClientFavorited, setIsClientFavorited] = useState(false);

  // New state for the current agent's favorite properties
  const [agentFavoriteProperties, setAgentFavoriteProperties] = useState([]);

  // State for notes editing
  const [editingNote, setEditingNote] = useState(false);
  const [editedNoteContent, setEditedNoteContent] = useState('');

  // Loading state
  const [loading, setLoading] = useState(true);


  // Conditionally set contentShift to 0 if the user is not an agent
  const contentShift = userRole === 'agent' && !isMobile ? (isCollapsed ? 80 : 256) : 0;

  const getAuthenticatedUserInfo = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return { userId: null, role: 'guest' };
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return { userId: decoded.user_id, role: decoded.role };
    } catch (error) {
      console.error("Error decoding token for authenticated user info:", error);
      return { userId: null, role: 'guest' };
    }
  }, []);

  useEffect(() => {
    const { userId, role } = getAuthenticatedUserInfo();
    setAgentId(userId);
    setUserRole(role);
  }, [getAuthenticatedUserInfo]);

  // Determine the base path for add/edit listing based on role
  const getRoleBasePath = () => {
      if (userRole === 'admin') return '/admin';
      if (userRole === 'agency_admin') return '/agency';
      if (userRole === 'agent') return '/agent';
      return ''; // Default or handle unauthorized access
  };

  const getInitial = (name) => {
    const safeName = String(name || '');
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : 'N/A';
  };

  const fetchClientData = useCallback(async () => {
    if (!clientId) {
      console.log('Client ID not available, skipping client profile fetch.');
      return;
    }
    setLoading(true); // Start loading

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const clientRes = await axiosInstance.get(`${API_BASE_URL}/clients/${clientId}`, { headers });
      setClient(clientRes.data);
      setEditedNoteContent(clientRes.data.notes || ''); // Initialize editedNoteContent
      console.log("Client data fetched:", clientRes.data);

      // Check if agent can view property preferences
      const clientSharePropertyPreferences = clientRes.data.share_property_preferences_with_agents ?? false;
      setCanViewPropertyPreferences(clientSharePropertyPreferences);

      if (clientSharePropertyPreferences) {
        try {
          const preferencesRes = await axiosInstance.get(`${API_BASE_URL}/clients/${clientId}/preferences`, { headers });
          setClientPreferences({
            preferred_property_type: preferencesRes.data.preferred_property_type || 'Any',
            preferred_location: preferencesRes.data.preferred_location || 'Any',
            min_price: preferencesRes.data.min_price || null,
            max_price: preferencesRes.data.max_price || null,
            bedrooms: preferencesRes.data.min_bedrooms || null, // Assuming min_bedrooms is used for display
            bathrooms: preferencesRes.data.min_bathrooms || null, // Assuming min_bathrooms is used for display
          });
          console.log("Client preferences fetched:", preferencesRes.data);
        } catch (prefErr) {
          console.error("Failed to fetch client property preferences:", prefErr);
          if (prefErr.response && prefErr.response.status === 403) {
            showMessage('Client has restricted access to their property preferences.', 'info');
          } else if (clientSharePropertyPreferences) {
            showMessage('Failed to load client\'s property preferences.', 'error');
          }
          setClientPreferences({
            preferred_property_type: 'Any',
            preferred_location: 'Any',
            min_price: null,
            max_price: null,
            bedrooms: null,
            bathrooms: null,
          });
        }
      } else {
        setClientPreferences({
          preferred_property_type: 'Any',
          preferred_location: 'Any',
          min_price: null,
          max_price: null,
          bedrooms: null,
          bathrooms: null,
        });
      }

      const clientShareFavourites = clientRes.data.share_favourites_with_agents ?? false;
      setShowFavourites(clientShareFavourites);
      console.log("Client share_favourites_with_agents:", clientShareFavourites);

      if (clientShareFavourites) {
        try {
          const favouritesRes = await axiosInstance.get(`${API_BASE_URL}/favourites/properties`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Target-User-Id': clientId
            },
          });
          setFavouriteListings(favouritesRes.data.favourites || []);
          console.log("Favourite listings fetched:", favouritesRes.data.favourites);
        } catch (favErr) {
          console.error("Failed to fetch favourite listings:", favErr);
          if (favErr.response && favErr.response.status === 403) {
            showMessage('Client has restricted access to their favourite listings.', 'info');
          } else if (clientShareFavourites) {
            showMessage('Failed to load client\'s favourite listings.', 'error');
          }
          setFavouriteListings([]);
        }
      } else {
        setFavouriteListings([]);
      }

    } catch (err) {
      console.error("Failed to fetch client data:", err);
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
        showMessage(`Failed to load client profile: ${err.response.data.message || 'Server error'}`, 'error');
      } else {
        showMessage('Failed to load client profile. Please try again.', 'error');
      }
      setClient(null);
      setFavouriteListings([]);
      setClientPreferences({
        preferred_property_type: 'Any',
        preferred_location: 'Any',
        min_price: null,
        max_price: null,
        bedrooms: null,
        bathrooms: null,
      });
    } finally {
      setLoading(false); // End loading
    }
  }, [clientId, showMessage]);

  const fetchRecommendedListings = useCallback(async () => {
    if (userRole === 'agent' && agentId && clientId) {
      try {
        const token = localStorage.getItem('token');
        const recommendedRes = await axiosInstance.get(`${API_BASE_URL}/clients/${clientId}/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecommendedListings(recommendedRes.data.recommendations || []);
        console.log("Agent recommended listings fetched:", recommendedRes.data.recommendations);
      } catch (err) {
        console.error("Failed to fetch agent recommended listings:", err);
        showMessage('Failed to load agent recommended listings.', 'error');
        setRecommendedListings([]);
      }
    } else {
      setRecommendedListings([]);
    }
  }, [userRole, agentId, clientId, showMessage]);


  const fetchConversationForClient = useCallback(async () => {
    if (!clientId || !agentId) {
      console.log('Client ID or Agent ID not available for conversation fetch.');
      return null;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/inquiries/agent/${agentId}/client/${clientId}/conversation`, {
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
            clientName: conv.client_full_name || client?.full_name,
            clientEmail: conv.client_email || client?.email,
            clientPhone: conv.client_phone || client?.phone,
            propertyTitle: conv.property_title,
            messages: formattedMessages,
            lastMessage: conv.last_message,
            lastMessageTimestamp: conv.last_message_timestamp,
            is_agent_responded: conv.is_agent_responded,
            is_opened: conv.is_opened,
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
  }, [clientId, agentId, client, showMessage]);

  const handleOpenChat = useCallback(async () => {
    if (!client) {
      showMessage('Client profile data is still loading. Please wait.', 'info');
      return;
    }
    if (!agentId) {
      showMessage('Agent profile data is still loading. Please wait.', 'info');
      return;
    }

    let conversationToOpen = await fetchConversationForClient();

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
            client_id: clientId,
            agent_id: agentId,
            message_content: null
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
            clientName: client.full_name,
            clientEmail: client.email,
            clientPhone: client.phone,
            propertyTitle: conversation.property_title || 'General Inquiry',
            messages: Array.isArray(conversation.messages)
              ? conversation.messages.map(msg => ({
                  inquiry_id: msg.inquiry_id,
                  sender: msg.sender_id === agentId ? 'Agent' : 'Client',
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
        await fetch(`${API_BASE_URL}/inquiries/agent/mark-read/${conversationToOpen.id}`, { // Use conversationToOpen.id
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        socket.emit('message_read', { conversationId: conversationToOpen.id, userId: agentId, role: 'agent' }); // Use conversationToOpen.id
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
  }, [clientId, client, agentId, fetchConversationForClient, showMessage]);

  const handleDeleteInquiry = useCallback(async () => {
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
        } else {
          showMessage('Failed to delete conversation.', 'error');
        }
      }
    });
  }, [conversationForModal, showConfirm, showMessage]);

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
      const updatedConversation = await fetchConversationForClient();
      if (updatedConversation) {
        setConversationForModal(updatedConversation);
      }
    } catch (error) {
      console.error("Failed to mark conversation as responded:", error);
    }
  }, [conversationForModal, fetchConversationForClient]);

  // Function to check if client is favorited by the current agent
  const checkFavoriteClientStatus = useCallback(async () => {
    if (agentId && clientId && userRole === 'agent') {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsClientFavorited(false);
        return;
      }
      try {
        const response = await axiosInstance.get(`${API_BASE_URL}/favourites/clients/status/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsClientFavorited(response.data.isFavorited);
      } catch (error) {
        console.error("Error checking favorite client status:", error);
        showMessage('Failed to check client favorite status.', 'error');
        setIsClientFavorited(false);
      }
    } else {
      setIsClientFavorited(false);
    }
  }, [agentId, clientId, userRole, showMessage]);

  // Function to toggle client favorite status by the current agent
  const handleToggleFavoriteClient = async () => {
    if (!agentId || !clientId || userRole !== 'agent') {
      showMessage('Please log in as an agent to add clients to favorites.', 'info');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showMessage("Authentication token not found. Please log in.", 'error');
        return;
    }

    try {
      if (isClientFavorited) {
        await axiosInstance.delete(`${API_BASE_URL}/favourites/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsClientFavorited(false);
        showMessage('Removed client from favorites!', 'info');
      } else {
        await axiosInstance.post(`${API_BASE_URL}/favourites/clients`, { client_id: clientId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsClientFavorited(true);
        showMessage('Added client to favorites!', 'success');
      }
    } catch (err) {
      console.error('Error toggling client favorite status:', err.response?.data || err.message);
      let errorMessage = 'Failed to update client favorite status. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  // New: Function to fetch agent's own favorite properties
  const fetchAgentFavoriteProperties = useCallback(async () => {
    if (userRole === 'agent' && agentId) {
      try {
        const token = localStorage.getItem('token');
        const response = await axiosInstance.get(`${API_BASE_URL}/favourites/properties`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Assuming the response data is an array of favorite property objects
        setAgentFavoriteProperties(response.data.favourites.map(fav => fav.property_id) || []);
      } catch (error) {
        console.error("Error fetching agent's favorite properties:", error);
        showMessage("Failed to load your favorite properties.", 'error');
        setAgentFavoriteProperties([]);
      }
    } else {
      setAgentFavoriteProperties([]);
    }
  }, [userRole, agentId, showMessage]);

  // New: Function to toggle agent's favorite status for a property
  const handleToggleAgentFavoriteProperty = async (propertyId, isCurrentlyFavorited) => {
    console.log(`Attempting to toggle favorite for propertyId: ${propertyId}, current status: ${isCurrentlyFavorited}`); // Debug log
    if (userRole !== 'agent' || !agentId) {
      showMessage('You must be logged in as an agent to favorite properties.', 'info');
      console.log('User is not an agent or agentId is missing.'); // Debug log
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
        setAgentFavoriteProperties(prev => prev.filter(id => id !== propertyId));
        showMessage('Removed listing from your favorites!', 'info');
      } else {
        console.log(`Sending POST request for propertyId: ${propertyId}`, { property_id: propertyId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgentFavoriteProperties(prev => [...prev, propertyId]);
        showMessage('Added listing to your favorites!', 'success');
      }
      console.log('Agent favorite properties after toggle:', agentFavoriteProperties); // Debug log
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

  // Function to handle deleting a listing from either favorite or recommended lists
  const handleDeleteListing = async (listingId) => {
    showConfirm({
        title: "Delete Listing",
        message: "Are you sure you want to delete this listing permanently? This action cannot be undone.",
        onConfirm: async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                showMessage('Authentication token not found. Please sign in.', 'error');
                return;
            }
            try {
                await axiosInstance.delete(`${API_BASE_URL}/listings/${listingId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                showMessage('Listing deleted successfully!', 'success');
                // Refresh both favourite and recommended lists after deletion
                fetchClientData();
                fetchRecommendedListings();
            } catch (error) {
                console.error('Error deleting listing:', error.response?.data || error.message);
                showMessage('Failed to delete listing. Please try again.', 'error');
            }
        },
        confirmLabel: "Delete",
        cancelLabel: "Cancel"
    });
  };

  // Function to toggle client status (VIP/Regular)
  const handleToggleClientStatus = useCallback(async () => {
    if (!client || !agentId || userRole !== 'agent') {
      showMessage('You must be logged in as an agent to change client status.', 'info');
      return;
    }

    const newStatus = client.client_status === 'vip' ? 'regular' : 'vip';
    showConfirm({
      title: "Change Client Status",
      message: `Are you sure you want to change ${client.full_name}'s status to ${newStatus.toUpperCase()}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          // Corrected endpoint for status update to match Clients.js
          await axiosInstance.put(`${API_BASE_URL}/clients/agent/${agentId}/clients/${clientId}/vip`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setClient(prevClient => ({ ...prevClient, client_status: newStatus }));
          showMessage(`Client status updated to ${newStatus.toUpperCase()}!`, 'success');
        } catch (error) {
          console.error('Error updating client status:', error.response?.data || error.message);
          showMessage('Failed to update client status. Please try again.', 'error');
        }
      }
    });
  }, [client, clientId, agentId, userRole, showConfirm, showMessage]);

  // Handle editing notes
  const handleEditNote = () => {
    setEditingNote(true);
  };

  const handleSaveNote = async () => {
    if (userRole !== 'agent') {
      showMessage('Only agents can save client notes.', 'error');
      setEditingNote(false);
      setEditedNoteContent(client.notes || '');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Corrected endpoint for notes update to match Clients.js
      await axiosInstance.put(`${API_BASE_URL}/clients/agent/${agentId}/clients/${clientId}/note`,
        { note: editedNoteContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClient(prevClient => ({ ...prevClient, notes: editedNoteContent }));
      setEditingNote(false);
      showMessage('Client notes updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving notes:', error.response?.data || error.message);
      showMessage('Failed to save notes. Please try again.', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditedNoteContent(client.notes || ''); // Revert to original notes
    setEditingNote(false);
  };


  useEffect(() => {
    if (clientId) {
      fetchClientData();
      fetchRecommendedListings();
    }
  }, [clientId, fetchClientData, fetchRecommendedListings]);

  useEffect(() => {
    if (userRole === 'agent' && agentId && clientId) {
      checkFavoriteClientStatus(); // Check client favorite status when component mounts or dependencies change
      fetchAgentFavoriteProperties(); // Fetch agent's favorite properties
    } else {
      setIsClientFavorited(false); // Reset favorite status if not an agent or no user/client ID
      setAgentFavoriteProperties([]); // Clear agent's favorite properties
    }
  }, [userRole, agentId, clientId, checkFavoriteClientStatus, fetchAgentFavoriteProperties]);


  const handleViewProperty = (propertyId) => {
    navigate(`/listings/${propertyId}`);
  };

  useEffect(() => {
    if (!socket.connected) socket.connect();

    if (conversationForModal?.id && agentId) {
      socket.emit('join_conversation', conversationForModal.id);
    }

    const handleNewMessage = async (newMessage) => {
      if (!conversationForModal || newMessage.conversationId !== conversationForModal.id) return;

      const updatedConversation = await fetchConversationForClient();
      if (updatedConversation) {
        setConversationForModal(updatedConversation);
      }

      const expectedClientId = Number(newMessage.clientId || newMessage.client_id || conversationForModal.client_id);
      const senderId = Number(newMessage.senderId);
      const isFromClient = senderId === expectedClientId;

      if (isFromClient && openedConversationId === conversationForModal.id) {
        const token = localStorage.getItem('token');
        if (token && agentId) {
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
                  userId: agentId,
                  role: 'agent'
                });
              }
            })
            .catch(err => console.error("Error marking message as read:", err));
        }
      }
    };

    const handleReadAck = async ({ conversationId, readerId, role }) => {
      if (conversationId === conversationForModal?.id) {
        const updatedConversation = await fetchConversationForClient();
        if (updatedConversation) {
          setConversationForModal(updatedConversation);
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_read_ack', handleReadAck);

    return () => {
      if (conversationForModal?.id && agentId) {
        socket.emit('leave_conversation', conversationForModal.id);
      }
      socket.off('new_message', handleNewMessage);
      socket.off('message_read_ack', handleReadAck);
    };
  }, [conversationForModal, openedConversationId, agentId, showMessage, fetchConversationForClient]);

  const handlePrevFavourite = () => {
    setFavouriteListingStartIndex((prevIndex) => Math.max(0, prevIndex - listingsPerPage));
  };

  const handleNextFavourite = () => {
    setFavouriteListingStartIndex((prevIndex) => Math.min(favouriteListings.length - listingsPerPage, prevIndex + listingsPerPage));
  };

  const displayedFavouriteListings = favouriteListings.slice(
    favouriteListingStartIndex,
    favouriteListingStartIndex + listingsPerPage
  );

  const handlePrevRecommended = () => {
    setRecommendedListingStartIndex((prevIndex) => Math.max(0, prevIndex - recommendedListingsPerPage));
  };

  const handleNextRecommended = () => {
    setRecommendedListingStartIndex((prevIndex) => Math.min(recommendedListings.length - recommendedListingsPerPage, prevIndex + recommendedListingsPerPage));
  };

  const displayedRecommendedListings = recommendedListings.slice(
    recommendedListingStartIndex,
    recommendedListingStartIndex + recommendedListingsPerPage
  );


  if (loading) {
    return (
      // FIX: Removed px-4 from outer container to prevent double padding and potential overflow
      <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 min-h-screen flex flex-col`}>
        {/* Sidebar placeholder */}
        {userRole === 'agent' && (
          <div className={`fixed top-0 left-0 h-full ${isCollapsed ? 'w-20' : 'w-64'} ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300`}>
            <div className={`h-full animate-pulse flex flex-col p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`h-8 w-3/4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-6`}></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-10 w-full rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-3`}></div>
              ))}
            </div>
          </div>
        )}

        <motion.div
          animate={{ marginLeft: contentShift }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          initial={false}
          // FIX: Removed problematic `style` prop. `min-w-0` and `flex-1` are sufficient for flexbox to handle resizing.
          className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        >
          <div className={`h-10 w-1/2 md:w-1/4 rounded mx-auto mb-6 animate-pulse ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}></div>

          <div className="flex flex-col lg:flex-row gap-8 lg:max-w-7xl lg:mx-auto">
            <div className="w-full lg:w-3/5 space-y-8">
              {/* ACCURACY: Use the more detailed ClientInfoSkeleton */}
              <ClientInfoSkeleton darkMode={darkMode} />
              
              {/* Chat skeleton for mobile */}
              {isMobile && userRole === 'agent' && <ContentBlockSkeleton darkMode={darkMode} height="h-32" />}
              
              {/* ACCURACY: Use the new ListingsSectionSkeleton for Favourites */}
              <ListingsSectionSkeleton darkMode={darkMode} />
            </div>
            <div className="w-full lg:w-2/5 space-y-8">
              {/* Chat skeleton for desktop */}
              {!isMobile && userRole === 'agent' && <ContentBlockSkeleton darkMode={darkMode} height="h-32" />}
              
              {/* ACCURACY: Use the new ListingsSectionSkeleton for Recommended */}
              <ListingsSectionSkeleton darkMode={darkMode} />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  const isChatButtonDisabled = !client || !agentId;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Conditionally render the mobile menu button for the sidebar */}
      {isMobile && userRole === 'agent' && (
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

      {/* Conditionally render the AgentSidebar */}
      {userRole === 'agent' && (
        <AgentSidebar
          collapsed={isMobile ? false : isCollapsed}
          setCollapsed={isMobile ? () => { } : setIsCollapsed}
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
        <h1 className={`text-2xl md:text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Client Profile</h1>

        <div className="flex flex-col lg:flex-row gap-8 lg:max-w-7xl lg:mx-auto">
          <div className="w-full lg:w-3/5 space-y-8">
            <motion.div
              className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} space-y-4 ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Client Name and Bookmark Button */}
              <div className="flex justify-between items-center flex-wrap mb-4">
                <h2 className={`text-xl md:text-2xl font-extrabold ${darkMode ? "text-green-400" : "text-green-800"} flex items-center`}>
                  {client.full_name}
                  {userRole === 'agent' ? ( // Only agents can click to change status
                    <span
                      onClick={handleToggleClientStatus}
                      className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer
                        ${client.client_status === 'vip' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}
                        ${darkMode ? (client.client_status === 'vip' ? 'dark:bg-green-700 dark:text-green-200' : 'dark:bg-yellow-700 dark:text-yellow-200') : ''}`}
                      title={client.client_status === 'vip' ? 'Click to make Regular' : 'Click to make VIP'}
                    >
                      {client.client_status === 'vip' ? 'VIP' : 'Regular'}
                    </span>
                  ) : ( // For non-agents, display without clickability
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                      ${client.client_status === 'vip' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}
                      ${darkMode ? (client.client_status === 'vip' ? 'dark:bg-green-700 dark:text-green-200' : 'dark:bg-yellow-700 dark:text-yellow-200') : ''}`}>
                      {client.client_status === 'vip' ? 'VIP' : 'Regular'}
                    </span>
                  )}
                </h2>
                {userRole === 'agent' && agentId && ( // Only show if logged in as agent
                    <button
                        onClick={handleToggleFavoriteClient}
                        className={`p-2 rounded-full shadow-md transition-all duration-200 ${
                            isClientFavorited
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                        }`}
                        title={isClientFavorited ? "Remove from Saved Clients" : "Save Client to Favourites"}
                    >
                        <BookmarkIcon size={20} fill={isClientFavorited ? "currentColor" : "none"} />
                    </button>
                )}
              </div>

              <div className="flex items-start space-x-4 mb-6">
                {/* Profile Picture */}
                <img
                  src={client.profile_picture_url || `https://placehold.co/120x120/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(client.full_name)}`}
                  alt="Client Profile"
                  className="w-32 h-32 rounded-full object-cover border-2 border-green-500 shadow-md"
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/120x120/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(client.full_name)}`; }}
                />
                {/* Client ID and Contact Information */}
                <div className="flex-1 min-w-0 break-words">
  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
    Client ID: {client.user_id}
  </p>

  <div
    className={`space-y-3 pt-4 border-t ${
      darkMode ? "border-gray-700" : "border-gray-200"
    }`}
  >
    <h3
      className={`text-xl font-bold ${
        darkMode ? "text-green-400" : "text-green-700"
      }`}
    >
      Contact
    </h3>

    <p
      className={`flex items-center gap-2 text-base ${
        darkMode ? "text-gray-300" : "text-gray-700"
      }`}
    >
      ✉️{" "}
      <a
        href={`mailto:${client.email}`}
        className="text-blue-500 hover:underline break-all"
      >
        {client.email}
      </a>
    </p>

    <p
      className={`flex items-center gap-2 text-base ${
        darkMode ? "text-gray-300" : "text-gray-700"
      }`}
    >
      📞{" "}
      {client.phone ? (
        <a
          href={`tel:${client.phone}`}
          className="text-blue-500 hover:underline break-all"
        >
          {client.phone}
        </a>
      ) : (
        "N/A"
      )}
    </p>
  </div>
</div>

              </div>

              <div className={`space-y-3 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
                <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Other Details</h3>
                <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}><strong>Date Joined:</strong> {new Date(client.date_joined).toLocaleDateString()}</p>
                <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}><strong>Last Login:</strong> {client.last_login ? new Date(client.last_login).toLocaleString() : 'N/A'}</p>
              </div>

              <div className={`space-y-3 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
  <div className="flex items-center gap-2">
    <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Notes</h3>
    {userRole === 'agent' && !editingNote && (
      <button
        onClick={handleEditNote}
        className={`p-1 rounded-full ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
        title="Edit Note"
        aria-label="Edit Note"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
    )}
  </div>

  {editingNote ? (
    <div className="flex flex-col w-full">
      <textarea
        className={`w-full p-2 border rounded-md text-sm resize-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 overflow-y-auto ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-gray-800"}`}
        value={editedNoteContent}
        onChange={(e) => setEditedNoteContent(e.target.value)}
        rows="4"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSaveNote}
          className={`p-1 rounded-full ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"}`}
          title="Save Note"
          aria-label="Save Note"
        >
          <CheckIcon className="h-5 w-5" />
        </button>
        <button
          onClick={handleCancelEdit}
          className={`p-1 rounded-full ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
          title="Cancel Edit"
          aria-label="Cancel Edit"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  ) : (
    <div className="relative text-sm text-gray-500 dark:text-gray-400">
      <span className="italic break-words block leading-tight">{client.notes || 'No notes yet.'}</span>
    </div>
  )}
</div>


              {/* Property Preferences Section - Dynamically rendered based on client's privacy setting */}
              {canViewPropertyPreferences ? (
                <div className={`space-y-3 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
                  <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>
                    🏡 Property Preferences
                  </h3>
                  <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    🏘️ <strong>Property Type:</strong> {clientPreferences.preferred_property_type || 'Any'}
                  </p>
                  <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    📍 <strong>Location:</strong> {clientPreferences.preferred_location || 'Any'}
                  </p>
                  <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    💰 <strong>Price Range:</strong> {clientPreferences.min_price ? `₦${clientPreferences.min_price.toLocaleString()}` : 'Any'} - {clientPreferences.max_price ? `₦${clientPreferences.max_price.toLocaleString()}` : 'Any'}
                  </p>
                  <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    🛏️ <strong>Bedrooms:</strong> {clientPreferences.bedrooms > 0 ? clientPreferences.bedrooms : 'Any'}
                  </p>
                  <p className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    🛁 <strong>Bathrooms:</strong> {clientPreferences.bathrooms > 0 ? clientPreferences.bathrooms : 'Any'}
                  </p>
                </div>
              ) : (
                <div className={`space-y-3 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
                  <h3 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>
                    🏡 Property Preferences
                  </h3>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Client has chosen not to share their property preferences with agents.
                  </p>
                </div>
              )}


            </motion.div>

            {/* Conditionally render chat button for mobile if user is agent */}
            {isMobile && userRole === 'agent' && (
              <motion.div
                className={`flex flex-col items-center justify-center text-center ${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ minHeight: isMobile ? 'auto' : '150px' }}
              >
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                  <ChatBubbleLeftRightIcon className="h-6 w-6 inline-block mr-2" />
                  Chat with {client.full_name}
                </h2>
                <button
                  onClick={handleOpenChat}
                  disabled={isChatButtonDisabled}
                  className={`py-2 px-6 rounded-xl transition font-semibold shadow ${isChatButtonDisabled ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Open Chat
                </button>
              </motion.div>
            )}

            <motion.div
              className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} flex flex-col ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                <BookmarkIcon className="h-6 w-6 inline-block mr-2" />
                Favourite Listings
              </h3>
              {showFavourites ? (
                favouriteListings.length > 0 ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="grid grid-cols-2 gap-4 p-2 -mx-2"> {/* Changed to grid-cols-2 for mobile and desktop */}
                      {displayedFavouriteListings.map(listing => (
                        <div key={listing.property_id} className="w-full">
                          <ListingCard
                            key={listing.property_id}
                            listing={{ ...listing, agent_id: agentId }} // <-- inject agentId
                            userRole={userRole}
                            userId={agentId}
                            userAgencyId={null}
                            getRoleBasePath={getRoleBasePath}
                            onFavoriteToggle={handleToggleAgentFavoriteProperty}
                            isFavorited={agentFavoriteProperties.includes(listing.property_id)}
                            onDeleteListing={handleDeleteListing}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center mt-4 space-x-4">
                      <button
                        onClick={handlePrevFavourite}
                        disabled={favouriteListingStartIndex === 0}
                        className={`p-2 rounded-full shadow-md transition-all duration-200
                          ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                          ${favouriteListingStartIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <ArrowLeftCircleIcon className="h-8 w-8" />
                      </button>
                      <button
                        onClick={handleNextFavourite}
                        disabled={favouriteListingStartIndex >= favouriteListings.length - listingsPerPage}
                        className={`p-2 rounded-full shadow-md transition-all duration-200
                          ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                          ${favouriteListingStartIndex >= favouriteListings.length - listingsPerPage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <ArrowRightCircleIcon className="h-8 w-8" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Client has no favourited listings yet.</p>
                )
              ) : (
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Client has chosen not to share their favourited listings with agents.
                </p>
              )}
            </motion.div>

          </div>

          <div className="w-full lg:w-2/5 space-y-8">
            {/* Conditionally render chat button for desktop if user is agent */}
            {!isMobile && userRole === 'agent' && (
              <motion.div
                className={'p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center ' + (darkMode ? "bg-gray-800" : "bg-white")}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ minHeight: '150px' }}
              >
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                  <ChatBubbleLeftRightIcon className="h-6 w-6 inline-block mr-2" />
                  Chat with {client.full_name}
                </h2>
                <button
                  onClick={handleOpenChat}
                  disabled={isChatButtonDisabled}
                  className={`py-2 px-6 rounded-xl transition font-semibold shadow ${isChatButtonDisabled ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Open Chat
                </button>
              </motion.div>
            )}

            <motion.div
              className={`${isMobile ? '' : 'p-6 rounded-2xl shadow-xl'} ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>
                <StarIcon className="h-6 w-6 inline-block mr-2" />
                Agent Recommended Listings
              </h2>
              {userRole === 'agent' && Array.isArray(recommendedListings) && recommendedListings.length > 0 ? (
                <div className="flex flex-col items-center w-full">
                  <div className="grid grid-cols-2 gap-4 p-2 -mx-2"> {/* Changed to grid-cols-2 for mobile and desktop */}
                    {displayedRecommendedListings.map(listing => (
                      <div key={listing.property_id} className="w-full">
                        <ListingCard
                          key={listing.property_id}
                          listing={{ ...listing, agent_id: agentId }} // <-- inject agentId
                          userRole={userRole}
                          userId={agentId}
                          userAgencyId={null}
                          getRoleBasePath={getRoleBasePath}
                          onFavoriteToggle={handleToggleAgentFavoriteProperty}
                          isFavorited={agentFavoriteProperties.includes(listing.property_id)}
                          onDeleteListing={handleDeleteListing}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4 space-x-4">
                    <button
                      onClick={handlePrevRecommended}
                      disabled={recommendedListingStartIndex === 0}
                      className={`p-2 rounded-full shadow-md transition-all duration-200
                        ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                        ${recommendedListingStartIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ArrowLeftCircleIcon className="h-8 w-8" />
                    </button>
                    <button
                      onClick={handleNextRecommended}
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
                userRole === 'agent' ? (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{!Array.isArray(recommendedListings) ? 'Loading recommended listings or error occurred.' : 'No listings recommended for this client yet.'}</p>
                ) : (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>This section is for agents to manage recommended listings.</p>
                )
              )}
            </motion.div>
          </div>
        </div>
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientProfile;

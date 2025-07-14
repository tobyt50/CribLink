import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import ListingCard from '../components/ListingCard';
import { useTheme } from '../layouts/AppShell';
import {
  X, Bookmark,
  UserPlus, Hourglass, UserRoundCheck, CheckCircle, UserX, EllipsisVertical,
  Share2, MessageSquareText // Added MessageSquareText for chat icon
} from 'lucide-react';
import ShareModal from '../components/ShareModal';
import ClientInquiryModal from '../components/ClientInquiryModal'; // Import ClientInquiryModal
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import socket from '../socket';

import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';


const ListingDetails = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [images, setImages] = useState([]);
  const [mainIndex, setMainIndex] = useState(0);
  const [direction, setDirection] = useState(0); // For image swiping animation
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [agentInfo, setAgentInfo] = useState(null);
  const [similarListings, setSimilarListings] = useState([]);
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const [isFavorited, setIsFavorited] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef(null);

  const [similarListingStartIndex, setSimilarListingStartIndex] = useState(0);
  // Changed listingsPerPage for similar listings: 5 for desktop, 2 for mobile grid (2x2)
  const listingsPerPageDesktop = 5;
  const listingsPerPageMobile = 4; // For 2x2 grid, we need 4 items to show
  const [currentListingsPerPage, setCurrentListingsPerPage] = useState(listingsPerPageDesktop);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [agentClients, setAgentClients] = useState([]);

  // NEW: State for ClientInquiryModal
  const [isClientInquiryModalOpen, setIsClientInquiryModalOpen] = useState(false);
  const [conversationForClientModal, setConversationForClientModal] = useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null); // To track the conversation opened by the user

  const similarCarouselRef = useRef(null); // Ref for similar listings carousel
  const autoSwipeSimilarIntervalRef = useRef(null); // Ref for similar listings auto-swipe interval

  // Determine if the property is land
  const isLandProperty = listing?.property_type?.toLowerCase() === 'land';

  // Determine listings per page based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint is 768px
        setCurrentListingsPerPage(listingsPerPageMobile);
      } else {
        setCurrentListingsPerPage(listingsPerPageDesktop);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserRole('guest');
        setUserId(null);
        return;
      }

      try {
        const { data } = await axiosInstance.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data) {
          setUserRole(data.role);
          setUserId(data.user_id);
          setClientName(data.full_name || '');
          setClientEmail(data.email || '');
          setClientPhone(data.phone || '');
        } else {
          // If token exists but user profile fetch fails, treat as guest.
          // This might happen if the token is invalid or expired.
          setUserRole('guest');
          setUserId(null);
          localStorage.removeItem('token'); // Clear invalid token
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error("Error fetching user profile in ListingDetails:", error);
        let errorMessage = 'Failed to load user profile. Please try again.';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        showMessage(errorMessage, 'error');
        setUserRole('guest');
        setUserId(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    };
    fetchUser();
  }, [showMessage]);

  const fetchAgentClients = useCallback(async () => {
    if (userRole === 'agent' && userId) {
      try {
        const token = localStorage.getItem('token');
        const response = await axiosInstance.get(`${API_BASE_URL}/clients/agent/${userId}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAgentClients(response.data);
      } catch (error) {
        console.error("Error fetching agent's clients:", error);
        showMessage('Failed to load your clients list.', 'error');
        setAgentClients([]);
      }
    } else {
      setAgentClients([]);
    }
  }, [userRole, userId, showMessage]);


  const fetchListing = useCallback(async () => {
    if (!id || userRole === '') return; // Wait for userRole to be set

    try {
      const { data } = await axiosInstance.get(`${API_BASE_URL}/listings/${id}`);
      setListing(data);

      const mainImage = data.image_url ? [data.image_url] : [];
      const gallery = data.gallery_images || [];
      setImages([...mainImage, ...gallery]);

      if (data.agent_name || data.agent_email || data.agent_phone) {
        setAgentInfo({
          id: data.agent_id,
          name: data.agent_name || 'N/A',
          email: data.agent_email || 'N/A',
          phone: data.agent_phone || 'N/A',
          agency: data.agent_agency || 'N/A',
          profilePic: `https://placehold.co/100x100/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=${(data.agent_name || 'JD').split(' ').map(n => n[0]).join('').toUpperCase()}`
        });
      } else {
        setAgentInfo(null);
      }

      const allListingsResponse = await axiosInstance.get(`${API_BASE_URL}/listings`);
      const allListings = allListingsResponse.data.listings;

      const filteredSimilar = allListings.filter(
        (item) => item.property_id !== data.property_id
      );
      setSimilarListings(filteredSimilar);

    } catch (error) {
      console.error("Error fetching listing details or similar listings:", error);
      let errorMessage = 'Failed to load listing details.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
      setListing(null);
      setSimilarListings([]);
      setAgentInfo(null);
    }
  }, [id, darkMode, showMessage, userRole]); // Added userRole to dependencies

  const fetchConnectionStatus = useCallback(async () => {
    if (userRole === 'client' && userId && agentInfo && agentInfo.id) {
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              setConnectionStatus('none');
              return;
          }
          const response = await axiosInstance.get(`${API_BASE_URL}/clients/${userId}/connection-requests/status/${agentInfo.id}`, {
              headers: { Authorization: `Bearer ${token}` },
          });
          setConnectionStatus(response.data.status);
      } catch (error) {
          console.error("Error fetching connection status:", error.response?.data || error.message);
          setConnectionStatus('none');
      }
    } else if (userRole === 'guest' || userRole === 'agent' || !agentInfo) {
      setConnectionStatus('none');
    }
  }, [userRole, userId, agentInfo, API_BASE_URL]);

  // Effect to fetch listing details when component mounts or ID changes
  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Effect to fetch connection status when userRole, userId, or agentInfo changes
  useEffect(() => {
    if (userRole && userId && agentInfo && agentInfo.id) {
      fetchConnectionStatus();
    }
  }, [userRole, userId, agentInfo, fetchConnectionStatus]);

  // Effect to fetch agent clients (only if current user is an an agent)
  useEffect(() => {
    if (userRole === 'agent' && userId) {
      fetchAgentClients();
    }
  }, [userRole, userId, fetchAgentClients]);


  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (userId && listing && userRole !== 'guest') {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsFavorited(false);
          return;
        }
        try {
          const response = await axiosInstance.get(`${API_BASE_URL}/favourites/status/${listing.property_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsFavorited(response.data.isFavorited);
        } catch (error) {
          console.error("Error checking favorite status:", error);
          let errorMessage = 'Failed to check favorite status.';
          if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          showMessage(errorMessage, 'error');
          setIsFavorited(false);
        }
      } else {
        setIsFavorited(false);
      }
    };
    checkFavoriteStatus();
  }, [userId, listing, userRole, showMessage]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowPreview(false);
        setShowOptionsMenu(false);
        setIsShareModalOpen(false);
        setIsClientInquiryModalOpen(false); // Close inquiry modal on escape
      }
    };

    const handleClickOutside = (e) => {
      // If the preview is showing and the click is outside the previewRef element
      if (showPreview && previewRef.current && !previewRef.current.contains(e.target)) {
        setShowPreview(false);
      }
      if (showOptionsMenu && optionsMenuRef.current && !optionsMenuRef.current.contains(e.target)) {
        setShowOptionsMenu(false);
      }
      if (isShareModalOpen && !e.target.closest('.relative.max-w-md')) {
        setIsShareModalOpen(false);
      }
      // For inquiry modal, ClientInquiryModal handles its own outside clicks
    };

    if (showPreview || showOptionsMenu || isShareModalOpen || isClientInquiryModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }


    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPreview, showOptionsMenu, isShareModalOpen, isClientInquiryModalOpen]);

  const formatPrice = (price, category) => {
    if (price == null) return 'Price not available';
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
    switch (category) {
      case 'Rent': return `${formatted} / Year`;
      case 'Short Let': return `${formatted} / Night`;
      case 'Long Let': return `${formatted} / Month`;
      default: return formatted;
    }
  };

  // Function to get the icon and format the status text
  const getStatusLabel = (status) => {
    const statusText = (status || '').toLowerCase();
    switch (statusText) {
      case 'available': return '✅ Available';
      case 'sold': return '🔴 Sold';
      case 'under offer': return '🤝 Under offer';
      case 'pending': return '⏳ Pending';
      case 'approved': return '👍 Approved';
      case 'rejected': return '❌ Rejected';
      case 'featured': return '⭐ Featured';
      default: return '❓ Unknown';
    }
  };

  // Function to get the background color for the status label
  const getStatusColor = (status) => {
    const statusText = (status || '').toLowerCase();
    switch (statusText) {
      case 'sold': return 'bg-red-600';
      case 'available': return 'bg-green-600';
      case 'pending': return 'bg-green-400';
      case 'featured': return 'bg-amber-500';
      case 'under offer': return 'bg-gray-500';
      case 'approved': return 'bg-purple-500';
      case 'rejected': return 'bg-red-800';
      default: return 'bg-gray-500';
    }
  };

  // Function to get the icon and format the category text
  const getCategoryLabel = (cat) => {
    const categoryText = (cat || '').toLowerCase();
    switch (categoryText) {
      case 'sale': return '💰 For Sale';
      case 'rent': return '🏠 For Rent';
      case 'lease': return '📜 For Lease';
      case 'short let': return '🏖️ Short Let';
      case 'long let': return '🗓️ Long Let';
      default: return '🏡 Property';
    }
  };

  const paginateImage = (newDirection) => {
    setDirection(newDirection);
    setMainIndex((prev) =>
      (prev + newDirection + images.length) % images.length
    );
  };

  const handleThumbClick = (index) => {
    setMainIndex(index);
  };

  const handleImageClick = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  const handleToggleFavorite = async () => {
    if (!userId || !listing || userRole === 'guest') {
      showMessage('Please log in to add to favorites.', 'info');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showMessage("Authentication token not found. Please log in.", 'error');
        return;
    }

    try {
      if (isFavorited) {
        await axiosInstance.delete(`${API_BASE_URL}/favourites/${listing.property_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorited(false);
        showMessage('Removed from favorites!', 'info');
      } else {
        await axiosInstance.post(`${API_BASE_URL}/favourites`, { property_id: listing.property_id }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorited(true);
        showMessage('Added to favorites!', 'success');
      }
    } catch (err) {
      console.error('Error toggling favorite status:', err.response?.data || err.message);
      let errorMessage = 'Failed to update favorite status. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  const handlePrevSimilar = useCallback(() => {
    setSimilarListingStartIndex((prevIndex) => Math.max(0, prevIndex - currentListingsPerPage));
    clearInterval(autoSwipeSimilarIntervalRef.current); // Stop auto-swipe on manual interaction
  }, [currentListingsPerPage]);

  const handleNextSimilar = useCallback(() => {
    setSimilarListingStartIndex((prevIndex) => {
      const totalPages = Math.ceil(similarListings.length / currentListingsPerPage);
      const nextPage = (prevIndex / currentListingsPerPage + 1) % totalPages;
      return nextPage * currentListingsPerPage;
    });
    clearInterval(autoSwipeSimilarIntervalRef.current); // Stop auto-swipe on manual interaction
  }, [similarListings.length, currentListingsPerPage]);

  // Auto-swipe for similar listings (adapted from Home.js)
  useEffect(() => {
    // Clear any existing interval before setting a new one
    if (autoSwipeSimilarIntervalRef.current) {
      clearInterval(autoSwipeSimilarIntervalRef.current);
    }

    if (similarListings.length > currentListingsPerPage) {
      autoSwipeSimilarIntervalRef.current = setInterval(() => {
        setSimilarListingStartIndex((prevIndex) => {
          const totalPages = Math.ceil(similarListings.length / currentListingsPerPage);
          const currentPage = prevIndex / currentListingsPerPage;
          const nextPage = (currentPage + 1) % totalPages;
          return nextPage * currentListingsPerPage;
        });
      }, 5000); // Change every 5 seconds (adjust as needed)
    }

    // Cleanup function: clear interval when component unmounts or dependencies change
    return () => {
      if (autoSwipeSimilarIntervalRef.current) {
        clearInterval(autoSwipeSimilarIntervalRef.current);
      }
    };
  }, [similarListings, currentListingsPerPage]);


  const handleTouchStartSimilar = useCallback((e) => {
    clearInterval(autoSwipeSimilarIntervalRef.current);
    if (similarCarouselRef.current) {
      similarCarouselRef.current.startX = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMoveSimilar = useCallback((e) => {
    if (!similarCarouselRef.current || similarCarouselRef.current.startX === undefined) return;
    const currentX = e.touches[0].clientX;
    const diffX = similarCarouselRef.current.startX - currentX;
    if (Math.abs(diffX) > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEndSimilar = useCallback((e) => {
    if (!similarCarouselRef.current || similarCarouselRef.current.startX === undefined) return;
    const endX = e.changedTouches[0].clientX;
    const diffX = similarCarouselRef.current.startX - endX;
    const swipeThreshold = 50;
    if (diffX > swipeThreshold) {
      handleNextSimilar();
    } else if (diffX < -swipeThreshold) {
      handlePrevSimilar();
    }
    similarCarouselRef.current.startX = undefined;
  }, [handleNextSimilar, handlePrevSimilar]);


  const handleSendConnectionRequest = async () => {
    if (userRole !== 'client' || !userId || !agentInfo || !agentInfo.id) {
      showMessage("Please log in as a client to send connection requests.", 'info');
      return;
    }
    if (userId === agentInfo.id) {
        showMessage("You cannot send a connection request to yourself.", 'warning');
        return;
    }

    if (connectionStatus === 'pending_sent' || connectionStatus === 'pending_received' || connectionStatus === 'connected') {
        showMessage(`A connection request is already ${connectionStatus.replace('_', ' ')}.`, 'info');
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const message = `Hello, I'm interested in connecting with you regarding property ID ${listing.property_id || 'N/A'}.`;
      const response = await axiosInstance.post(
        `${API_BASE_URL}/clients/${userId}/connection-requests/send-to-agent/${agentInfo.id}`,
        { message: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201 || response.status === 200) {
        showMessage(response.data.message, 'success');
        setConnectionStatus(response.data.status || 'pending_sent');
      }
    } catch (error) {
      console.error("Error sending connection request:", error.response?.data || error.message);
      showMessage(`Failed to send connection request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
      fetchConnectionStatus();
    }
  };

  const handleDisconnectFromAgent = async () => {
    if (userRole !== 'client' || !userId || !agentInfo || !agentInfo.id || connectionStatus !== 'connected') {
      showMessage("You are not connected to this agent.", 'info');
      return;
    }

    showConfirm({
      title: "Disconnect from Agent",
      message: `Are you sure you want to disconnect from ${agentInfo.name}? You can send a new request later.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axiosInstance.put(
            `${API_BASE_URL}/clients/${userId}/connection-requests/disconnect/${agentInfo.id}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.status === 200) {
            showMessage('Disconnected from agent successfully.', 'success');
            setConnectionStatus('none');
            setShowOptionsMenu(false);
          } else {
            showMessage('Failed to disconnect from agent. Please try again.', 'error');
          }
        } catch (error) {
          console.error("Error disconnecting from agent:", error.response?.data || error.message);
          showMessage(`Failed to disconnect: ${error.response?.data?.message || 'Please try again.'}`, 'error');
          fetchConnectionStatus();
        }
      },
      confirmLabel: "Disconnect",
      cancelLabel: "Cancel"
    });
  };

  const handleViewProperty = useCallback((propertyId) => {
    navigate(`/listings/${propertyId}`);
  }, [navigate]);

  const displayedSimilarListings = similarListings.slice(
    similarListingStartIndex,
    similarListingStartIndex + currentListingsPerPage
  );


  // NEW: Inquiry Modal Functions
  const fetchConversationForClientAndAgent = useCallback(async () => {
    if (!userId || !agentInfo || !agentInfo.id) {
      console.log('Client ID or Agent ID not available for conversation fetch.');
      return null;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/inquiries/agent/${agentInfo.id}/client/${userId}/conversation`, {
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
            clientName: conv.clientName || clientName, // Use existing clientName state as fallback
            clientEmail: conv.clientEmail || clientEmail,
            clientPhone: conv.clientPhone || clientPhone,
            agentName: conv.agentName || agentInfo.name,
            agentEmail: conv.agentEmail || agentInfo.email,
            propertyTitle: conv.propertyTitle || listing.title, // Use listing title as fallback
            messages: formattedMessages,
            lastMessage: conv.last_message,
            lastMessageTimestamp: conv.last_message_timestamp,
            is_agent_responded: conv.is_agent_responded,
            unreadCount: conv.unread_messages_count,
          };
        }
        return null;
      } else if (res.status === 404) {
        return null; // No conversation found
      } else {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to fetch client conversation:", err);
      showMessage('Failed to load client conversation.', 'error');
      return null;
    }
  }, [userId, agentInfo, clientName, clientEmail, clientPhone, listing?.title, showMessage]);

  const handleOpenChat = useCallback(async () => {
    if (!listing || !agentInfo) {
      showMessage('Listing or agent information is not available yet.', 'info');
      return;
    }
    // For guest users, the modal itself handles the initial inquiry creation.
    if (userRole === 'guest') {
      // Provide basic info needed by modal to create a guest inquiry
      setConversationForClientModal({
        isGuest: true,
        property_id: listing.property_id,
        agent_id: agentInfo.id,
        propertyTitle: listing.title,
        agentName: agentInfo.name,
        messages: [] // Start with an empty message array for guest
      });
      setIsClientInquiryModalOpen(true);
      return;
    }

    if (userRole !== 'client' || !userId) {
      showMessage('You must be logged in as a client to start a chat.', 'info');
      return;
    }

    let conversationToOpen = await fetchConversationForClientAndAgent();

    if (!conversationToOpen) {
      try {
        const token = localStorage.getItem('token');
        // Create an initial inquiry associated with this property and agent
        const createRes = await axiosInstance.post(`${API_BASE_URL}/inquiries/`, {
          client_id: userId,
          agent_id: agentInfo.id,
          property_id: listing.property_id,
          message_content: "::shell::", // A placeholder message to initiate the conversation without user input
          // name, email, phone are taken from the authenticated user's profile if client_id is provided
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (createRes.status === 201) {
          const newInquiry = createRes.data;
          // After creating the initial inquiry, fetch the full conversation details
          // The backend query will group all inquiries into one conversation_id
          conversationToOpen = await fetchConversationForClientAndAgent();
          if (!conversationToOpen) {
            showMessage("Failed to retrieve new conversation details.", "error");
            return;
          }
          showMessage('New conversation started!', 'success');
        } else {
          showMessage(`Failed to start new conversation: ${createRes.data.message || createRes.statusText}`, 'error');
          return;
        }
      } catch (err) {
        console.error("Error creating new property inquiry:", err.response?.data || err.message);
        showMessage(`Failed to start new conversation: ${err.response?.data?.error || 'Please try again.'}`, 'error');
        return;
      }
    }

    console.log("🧾 Chat conversation being opened:", conversationToOpen);
    setConversationForClientModal({ ...conversationToOpen });
    setIsClientInquiryModalOpen(true);
    setOpenedConversationId(conversationToOpen.id);

    // Mark messages as read if there are unread messages when opening the chat
    if (conversationToOpen.unreadCount > 0) {
      const token = localStorage.getItem('token');
      try {
        await axiosInstance.put(`${API_BASE_URL}/inquiries/client/mark-read/${conversationToOpen.id}`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        // Emit socket event for agent to receive read receipt
        socket.emit('message_read', { conversationId: conversationToOpen.id, userId: userId, role: 'client' });
        setConversationForClientModal(prev => prev ? { ...prev, unreadCount: 0 } : null); // Optimistically update UI
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
        showMessage("Failed to mark messages as read.", 'error');
      }
    }
  }, [listing, agentInfo, userRole, userId, clientName, clientEmail, clientPhone, showMessage, fetchConversationForClientAndAgent]);

  const handleDeleteInquiry = useCallback(async () => {
    if (!conversationForClientModal) return;
    showConfirm({
      title: "Delete Conversation",
      message: `Are you sure you want to delete this conversation with ${conversationForClientModal.agentName}? This is irreversible.`,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await axiosInstance.delete(`${API_BASE_URL}/inquiries/client/delete-conversation/${conversationForClientModal.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.status === 200) {
            showMessage('Conversation deleted.', 'success');
            setIsClientInquiryModalOpen(false);
            setConversationForClientModal(null);
            setOpenedConversationId(null);
          } else {
            showMessage('Failed to delete conversation.', 'error');
          }
        } catch (error) {
          console.error('Error deleting conversation:', error.response?.data || error.message);
          showMessage(`Failed to delete conversation: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      }
    });
  }, [conversationForClientModal, showConfirm, showMessage]);

  const handleSendMessageToConversation = useCallback(async (conversationId, messageText, guestDetails = null) => {
    const token = localStorage.getItem('token');
    let payload;
    let endpoint;
    let headers = { 'Content-Type': 'application/json' };

    if (userRole === 'guest' && guestDetails) {
        // For guest's first message (initial inquiry with details)
        // If the conversationId is not yet established (meaning it's the very first message for a guest)
        if (!conversationId) {
          endpoint = `${API_BASE_URL}/inquiries`; // Create initial inquiry
          payload = {
              property_id: listing.property_id,
              agent_id: agentInfo.id,
              name: guestDetails.name,
              email: guestDetails.email,
              phone: guestDetails.phone,
              message_content: messageText,
              // client_id is null for guest
          };
        } else {
          // If guest continues messaging in an existing temporary conversation (unlikely for first message)
          // This path should ideally not be hit if guest creates new conv on first message
          endpoint = `${API_BASE_URL}/inquiries/message`;
          payload = {
              conversation_id: conversationId,
              property_id: listing.property_id,
              message_content: messageText,
              recipient_id: agentInfo.id,
              message_type: 'client_reply',
              // sender_id for guest is still null, name/email/phone from initial inquiry
          };
        }
    } else if (userRole === 'client') {
        endpoint = `${API_BASE_URL}/inquiries/message`;
        payload = {
            conversation_id: conversationId,
            property_id: listing.property_id, // Always associate with the listing ID
            message_content: messageText,
            recipient_id: agentInfo.id, // Recipient is the agent
            message_type: 'client_reply', // Client is sending the message
            // sender_id is automatically picked from token
        };
    } else {
        showMessage('Unauthorized action.', 'error');
        return;
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await axiosInstance.post(endpoint, payload, { headers });

        if (response.status === 201 || response.status === 200) {
            showMessage('Message sent!', 'success');
            // If it was an initial guest inquiry, the response will contain the new conversation ID
            // We need to update the conversationForClientModal to include this ID for subsequent messages
            if (userRole === 'guest' && !conversationId && response.data.conversation_id) {
                // Fetch the newly created conversation by its ID to get full details
                // This is crucial to get the grouped messages and correct structure
                const updatedConversation = await fetchConversationForClientAndAgent();
                if (updatedConversation) {
                    setConversationForClientModal(updatedConversation);
                    setOpenedConversationId(updatedConversation.id); // Set the new conversation ID
                }
            } else {
                // For existing conversations, just re-fetch to update history with read status etc.
                const updatedConversation = await fetchConversationForClientAndAgent();
                if (updatedConversation) {
                    setConversationForClientModal(updatedConversation);
                }
            }
        } else {
            showMessage(`Failed to send message: ${response.data.message || response.statusText}`, 'error');
        }
    } catch (error) {
        console.error("Error sending message:", error.response?.data || error.message);
        showMessage(`Failed to send message: ${error.response?.data?.error || 'Please try again.'}`, 'error');
    }
}, [userRole, userId, listing, agentInfo, showMessage, fetchConversationForClientAndAgent]);


  // Socket.IO integration for real-time chat updates
  useEffect(() => {
    // Only connect if the modal is open and we have a conversation ID
    if (!socket.connected) {
      socket.connect();
    }

    if (conversationForClientModal?.id && userId) {
      socket.emit('join_conversation', conversationForClientModal.id);
    }

    const handleNewMessage = async (newMessage) => {
      // Ensure the message belongs to the currently open conversation
      if (!conversationForClientModal || newMessage.conversationId !== conversationForClientModal.id) {
        return;
      }

      // Re-fetch the conversation to get the updated chat history including the new message
      // and ensure read statuses are correct from the backend's perspective.
      const updatedConversation = await fetchConversationForClientAndAgent();
      if (updatedConversation) {
        setConversationForClientModal(updatedConversation);
      }

      const expectedAgentId = Number(newMessage.agentId || newMessage.agent_id || conversationForClientModal.agent_id);
      const senderId = Number(newMessage.senderId);
      const isFromAgent = senderId === expectedAgentId;

      // If the new message is from the agent and the modal is currently open for this conversation,
      // mark it as read by the client immediately.
      if (isFromAgent && openedConversationId === conversationForClientModal.id) {
        const token = localStorage.getItem('token');
        if (token && userId) {
          axiosInstance.put(`${API_BASE_URL}/inquiries/client/mark-read/${conversationForClientModal.id}`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => {
              if (res.status === 200) {
                // Emit a message_read event to notify the agent that their message has been read
                socket.emit('message_read', {
                  conversationId: conversationForClientModal.id,
                  userId: userId,
                  role: 'client'
                });
              }
            })
            .catch(err => console.error("Error marking message as read via socket:", err));
        }
      }
    };

    // Listener for read acknowledgements (when agent marks messages as read)
    const handleReadAck = async ({ conversationId, readerId, role }) => {
      // If the read ack is for the current conversation and from the agent
      if (conversationId === conversationForClientModal?.id && role === 'agent') {
        const updatedConversation = await fetchConversationForClientAndAgent();
        if (updatedConversation) {
          setConversationForClientModal(updatedConversation);
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_read_ack', handleReadAck);

    return () => {
      // Clean up: leave conversation room and remove listeners when modal closes or component unmounts
      if (conversationForClientModal?.id && userId) {
        socket.emit('leave_conversation', conversationForClientModal.id);
      }
      socket.off('new_message', handleNewMessage);
      socket.off('message_read_ack', handleReadAck);
    };
  }, [conversationForClientModal, openedConversationId, userId, fetchConversationForClientAndAgent]);


  if (!listing) return <div className={`p-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading listing...</div>;

  return (
    <motion.div
      // For mobile mode, set padding to pt-0 and a negative margin-top to pull content up.
      // For desktop, keep md:p-6
      className={`min-h-screen pt-0 -mt-6 px-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:max-w-7xl lg:mx-auto">
        <motion.div
          className={`w-full lg:w-3/5 space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex justify-between items-center flex-wrap mt-0 mb-1">
            <h1 className={`text-2xl md:text-2xl font-extrabold ${darkMode ? "text-green-400" : "text-green-800"}`}>
              {listing.title}
            </h1>
          </div>

          {images.length > 0 && (
            <div>
              <div className={`relative w-full h-80 md:h-96 rounded-xl overflow-hidden mb-4 shadow-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <AnimatePresence initial={false} custom={direction}>
                  <motion.img
                    key={mainIndex}
                    src={images[mainIndex]}
                    alt={`Main ${mainIndex}`}
                    className="absolute w-full h-full object-cover cursor-pointer select-none"
                    onClick={handleImageClick}
                    custom={direction}
                    initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: direction < 0 ? 300 : -300, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, info) => {
                      if (info.offset.x < -50) paginateImage(1);
                      else if (info.offset.x > 50) paginateImage(-1);
                    }}
                    style={{ touchAction: "pan-y" }} // Allow vertical scrolling, but handle horizontal drag
                    draggable={false} // Prevent default browser drag behavior
                  />
                </AnimatePresence>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => paginateImage(-1)}
                      className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <span className="sr-only">Previous image</span>←
                    </button>
                    <button
                      onClick={() => paginateImage(1)}
                      className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <span className="sr-only">Next image</span>→
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {images.slice(0, 6).map((img, i) => (
                  <motion.img
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.2 }}
                    key={i}
                    src={img}
                    alt={`Thumb ${i}`}
                    className={`h-16 w-full object-cover rounded-md cursor-pointer border-2 transition-all duration-200 ${i === mainIndex ? 'border-green-600 ring-2 ring-green-400' : 'border-transparent'
                      }`}
                    onClick={() => handleThumbClick(i)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
            <div className="flex gap-2 items-center flex-wrap">
              {/* Status Label (styled like ListingCard) */}
              <span className={`text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm ${getStatusColor(listing.status)}`}>
                {getStatusLabel(listing.status)}
              </span>
              {/* Category Label (styled like ListingCard) */}
              <span className="bg-green-600 text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                {getCategoryLabel(listing.purchase_category)}
              </span>
              {userRole !== 'guest' && (
                  <button
                      onClick={handleToggleFavorite}
                      className={`p-2 rounded-full shadow-md transition-all duration-200 ml-2 ${
                          isFavorited
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                      }`}
                      title={isFavorited ? "Remove from Saved" : "Save to Favourites"}
                  >
                      <Bookmark size={20} fill={isFavorited ? "currentColor" : "none"} />
                  </button>
              )}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className={`p-2 rounded-full shadow-md transition-all duration-200 ml-2 ${
                    darkMode ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
                title="Share Listing"
              >
                <Share2 size={20} />
              </button>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>
              {formatPrice(listing.price, listing.purchase_category)}
            </p>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <p><strong>📍 Location:</strong> {listing.location}, {listing.state}</p>
              <p><strong>🏡 Property Type:</strong> {listing.property_type}</p>
              {/* Conditionally display bedrooms and bathrooms */}
              {!isLandProperty && listing.bedrooms != null && (
                <p><strong>🛏️ Bedrooms:</strong> {listing.bedrooms}</p>
              )}
              {!isLandProperty && listing.bathrooms != null && (
                <p><strong>🛁 Bathrooms:</strong> {listing.bathrooms}</p>
              )}
              <p><strong>📅 Listed:</strong> {new Date(listing.date_listed).toLocaleDateString()}</p>
            </div>

            {(userRole === 'admin' || (userRole === 'agent' && userId === listing.agent_id)) && (
              <button
                onClick={() => navigate(`/edit-listing/${listing.property_id}`)}
                className="mt-6 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors duration-300 shadow-md"
              >
                ✏️ Edit Listing
              </button>
            )}
          </div>

          {/* Conditionally render amenities section */}
          {!isLandProperty && listing.amenities && (
            <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.split(',').map((amenity, index) => (
                  <span key={index} className={`text-sm font-medium px-3 py-1 rounded-full shadow-sm ${darkMode ? "bg-green-700" : "bg-green-100 text-green-800"}`}>
                    {amenity.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Key Features</h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {/* Conditionally display square footage, year built, heating, cooling, parking */}
              {!isLandProperty && listing.square_footage && (
                <p><strong>📐 Square Footage:</strong> {listing.square_footage} sqft</p>
              )}
              {/* Lot size can apply to both land and non-land properties */}
              {listing.lot_size && (
                <p><strong>🌳 Lot Size:</strong> {listing.lot_size} acres</p>
              )}
              {!isLandProperty && listing.year_built && (
                <p><strong>🏗️ Year Built:</strong> {listing.year_built}</p>
              )}
              {!isLandProperty && listing.heating_type && (
                <p><strong>🔥 Heating:</strong> {listing.heating_type}</p>
              )}
              {!isLandProperty && listing.cooling_type && (
                <p><strong>❄️ Cooling:</strong> {listing.cooling_type}</p>
              )}
              {!isLandProperty && listing.parking && (
                <p><strong>🚗 Parking:</strong> {listing.parking}</p>
              )}
              {/* New land-specific fields */}
              {isLandProperty && listing.land_size && (
                <p><strong>📐 Land Size:</strong> {listing.land_size} sqft/acres</p>
              )}
              {isLandProperty && listing.zoning_type && (
                <p><strong>🗺️ Zoning:</strong> {listing.zoning_type}</p>
              )}
              {isLandProperty && listing.title_type && (
                <p><strong>📜 Title Type:</strong> {listing.title_type}</p>
              )}
            </div>
          </div>

          {listing.description && (
            <div className="space-y-2">
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Description</h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>{listing.description}</p>
            </div>
          )}
        </motion.div>

        <motion.div
          className="w-full lg:w-2/5 space-y-8 p-4 md:p-0"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {agentInfo && (
  <div className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}>
    <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Contact Agent</h2>

    <div className="flex items-center space-x-4">
      <img
        src={agentInfo.profilePic}
        alt={agentInfo.name}
        className={`w-16 h-16 rounded-full object-cover border-2 shadow-sm ${darkMode ? "border-green-700" : "border-green-300"}`}
      />
      <div className="flex flex-col">
        <p className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          {agentInfo.name}
          {userRole === 'client' && agentInfo.id && userId !== agentInfo.id && (
            <span className="ml-2 inline-block align-middle relative" ref={optionsMenuRef}>
              {(connectionStatus === 'none' || connectionStatus === 'rejected') && (
                <button
                  onClick={handleSendConnectionRequest}
                  className={`p-1.5 rounded-full transition-all duration-200
                      ${darkMode ? "text-purple-400 hover:bg-gray-700" : "text-purple-600 hover:bg-gray-200"}`}
                  title="Send Connection Request"
                >
                  <UserPlus size={20} />
                </button>
              )}
              {connectionStatus === 'pending_sent' && (
                <button
                  disabled
                  className={`p-1.5 rounded-full cursor-not-allowed ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                  title="Connection Request Sent (Pending)"
                >
                  <Hourglass size={20} />
                </button>
              )}
              {connectionStatus === 'pending_received' && (
                <button
                  onClick={() => navigate(`/client/dashboard/requests`)}
                  className={`p-1.5 rounded-full transition-all duration-200
                      ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-200"}`}
                  title="Respond to Agent Request"
                >
                  <UserRoundCheck size={20} />
                </button>
              )}
              {connectionStatus === 'connected' && (
                <>
                  <button
                    disabled
                    className={`p-1.5 rounded-full cursor-not-allowed ${darkMode ? "text-green-500" : "text-green-600"}`}
                    title="Already Connected"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(!showOptionsMenu); }}
                    className={`ml-1 p-1.5 rounded-full transition-all duration-200
                      ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"}`}
                    title="More Options"
                  >
                    <EllipsisVertical size={20} />
                  </button>
                  {showOptionsMenu && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10
                      ${darkMode ? "bg-gray-700 ring-1 ring-gray-600" : "bg-white ring-1 ring-gray-200"}`}>
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                          onClick={handleDisconnectFromAgent}
                          className={`flex items-center w-full px-4 py-2 text-sm
                            ${darkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-100"}`}
                          role="menuitem"
                        >
                          <UserX size={16} className="mr-2" /> Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </span>
          )}
        </p>
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Property Agent</p>
        {agentInfo.agency !== 'N/A' && (
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{agentInfo.agency}</p>
        )}
      </div>
    </div>

    <div className="space-y-3 pt-2">
      {agentInfo.phone !== 'N/A' && userRole !== 'guest' && (
        <a
          href={`tel:${agentInfo.phone}`}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 shadow-md w-full
            ${darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}
        >
          📞 Call Agent
        </a>
      )}

      {agentInfo.email !== 'N/A' && (
          <a
            href={`mailto:${agentInfo.email}`}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 shadow-md w-full
              ${darkMode ? "bg-green-600 text-white hover:bg-green-500" : "bg-green-500 text-white hover:bg-green-600"}`}
          >
            📧 Email Agent
          </a>
        )
      }
      {/* NEW: Chat with Agent Button */}
      {agentInfo.id && (userRole === 'client' || userRole === 'guest') && (
        <button
          onClick={handleOpenChat}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 shadow-md w-full
            ${darkMode ? "bg-purple-600 text-white hover:bg-purple-500" : "bg-purple-500 text-white hover:bg-purple-600"}`}
        >
          <MessageSquareText size={20} /> Chat with Agent
        </button>
      )}

      {userRole === 'client' && agentInfo.id && userId !== agentInfo.id && (
        <button
          onClick={() => navigate(`/client/agent-profile/${agentInfo.id}`)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 shadow-md w-full
            ${darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-500 text-white hover:bg-gray-600"}`}
        >
          👤 View Agent Profile
        </button>
      )}
    </div>
  </div>
)}


          <div className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>More Actions</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                  onClick={() => setIsShareModalOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors duration-300 shadow-sm ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800"}`}
              >
                  <Share2 size={20} /> Share / Recommend
              </button>
            </div>
          </div>

          <div className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Location Map</h2>
            <a
              href={`http://maps.google.com/?q=${listing.location}, ${listing.state}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full h-48 rounded-xl overflow-hidden shadow-inner relative group ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            >
              <img
                src={`https://placehold.co/600x400/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=Map+of+${listing.location}`}
                alt="Map Placeholder"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-opacity duration-300">
                <span className="text-white text-lg font-semibold">View on Google Maps</span>
              </div>
            </a>
          </div>
        </motion.div>
      </div>

      {similarListings.length > 0 && (
        <motion.div
          className={`max-w-7xl mx-auto mt-12 space-y-6 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          ref={similarCarouselRef} // Add ref for touch events
          onTouchStart={handleTouchStartSimilar} // Add touch start listener
          onTouchMove={handleTouchMoveSimilar}   // Add touch move listener
          onTouchEnd={handleTouchEndSimilar}     // Add touch end listener
        >
          <h2 className={`text-xl md:text-2xl font-bold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Similar Listings You Might Like</h2>
          <div className="flex flex-col items-center w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`similar-page-${similarListingStartIndex}`} // Key for AnimatePresence
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="grid grid-cols-2 md:grid-cols-5 gap-6 w-full" // Ensure grid applies inside motion.div
                >
                  {displayedSimilarListings.map((similarListing) => (
                    <div key={similarListing.property_id} className="w-full">
                      <ListingCard key={similarListing.property_id} listing={similarListing} darkMode={darkMode} />
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>

            <div className="flex justify-center mt-4 space-x-4">
              <button
                onClick={handlePrevSimilar}
                disabled={similarListingStartIndex === 0}
                className={`p-2 rounded-full shadow-md transition-all duration-200
                  ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                  ${similarListingStartIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ArrowLeftCircleIcon className="h-8 w-8" />
              </button>

              <button
                onClick={handleNextSimilar}
                disabled={similarListingStartIndex >= similarListings.length - currentListingsPerPage}
                className={`p-2 rounded-full shadow-md transition-all duration-200
                  ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
                  ${similarListingStartIndex >= similarListings.length - currentListingsPerPage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ArrowRightCircleIcon className="h-8 w-8" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showPreview && (
          <motion.div
            // Use an empty div as the direct ref target for outside clicks
            onClick={closePreview} // Clicks on the overlay outside the image will close the preview
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          >
            {/* The actual image container, prevent clicks on this from closing the modal */}
            <div
              ref={previewRef} // This ref is now on the image container
              onClick={(e) => e.stopPropagation()} // Stop propagation so clicks on the image itself don't close the modal
              className="relative w-full max-w-4xl max-h-full flex items-center justify-center"
            >
              <img
                src={images[mainIndex]}
                alt="Enlarged preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => paginateImage(-1)}
                    className="absolute left-0 top-0 bottom-0 flex items-center w-12 text-white text-5xl bg-transparent hover:bg-black hover:bg-opacity-30 transition-all duration-200 rounded-lg"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => paginateImage(1)}
                    className="absolute right-0 top-0 bottom-0 flex items-center w-12 text-white text-5xl bg-transparent hover:bg-black hover:bg-opacity-30 transition-all duration-200 rounded-lg"
                  >
                    →
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
        {isShareModalOpen && listing && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            clients={agentClients}
            listing={listing}
            darkMode={darkMode}
            currentAgentId={userId}
            userRole={userRole}
          />
        )}
        {/* NEW: Client Inquiry Modal */}
        {isClientInquiryModalOpen && conversationForClientModal && (
          <ClientInquiryModal
            isOpen={isClientInquiryModalOpen}
            onClose={() => {
              setIsClientInquiryModalOpen(false);
              setConversationForClientModal(null);
              setOpenedConversationId(null);
            }}
            conversation={conversationForClientModal}
            darkMode={darkMode}
            onViewProperty={handleViewProperty}
            onDelete={handleDeleteInquiry}
            onSendMessage={handleSendMessageToConversation}
            isGuest={userRole === 'guest'}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ListingDetails;


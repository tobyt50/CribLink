import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import ListingCard from '../components/ListingCard'; // Import ListingCard to display agency listings
import {
  X, Edit, Trash2, UserPlus, UserMinus, Crown, Shield, Check, XCircle,
  Mail, Phone, Globe, MapPin, Users, UserCheck, UserX, Clock, Star, UserRound,
  FileText, Home as HomeIcon, EllipsisVertical, Image as ImageIcon,
  Hourglass, UserRoundCheck, CheckCircle, Loader, Bookmark // Import Bookmark icon
} from 'lucide-react';

import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';


const AgencyProfile = () => {
  const { id } = useParams(); // Agency ID from URL
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { user, isAuthenticated, updateUser } = useAuth(); // Get user, isAuthenticated, and updateUser from AuthContext

  const [agency, setAgency] = useState(null);
  const [agencyMembers, setAgencyMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [agencyListings, setAgencyListings] = useState([]);
  const [isCurrentUserAgencyAdmin, setIsCurrentUserAgencyAdmin] = useState(false);
  const [isCurrentUserAffiliatedAgent, setIsCurrentUserAffiliatedAgent] = useState(false);
  const [showMemberOptionsMenu, setShowMemberOptionsMenu] = useState(null);
  const optionsMenuRef = useRef(null);

  // New states for current user's agency memberships (connected, pending, rejected)
  const [currentUserMemberships, setCurrentUserMemberships] = useState([]);
  const [loadingCurrentUserMemberships, setLoadingCurrentUserMemberships] = useState(true);
  const [isCurrentUserLastAdminOfThisAgency, setIsCurrentUserLastAdminOfThisAgency] = useState(false);

  // State for in-page editing
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '', // Added address
    description: '',
    logoBase64: null,
    logoOriginalname: null,
  });
  const fileInputRef = useRef(null);

  // Loading state for agency details
  const [loadingAgencyDetails, setLoadingAgencyDetails] = useState(true);

  // State for agency favorite status
  const [isAgencyFavorited, setIsAgencyFavorited] = useState(false);

  // New state for the current user's (client's) favorite properties
  const [clientFavoriteProperties, setClientFavoriteProperties] = useState([]);


  // State for carousel functionality (copied from ListingDetails.js)
  const [listingStartIndex, setListingStartIndex] = useState(0);
  // Listings per page: 5 for desktop (5x1), 4 for mobile (2x2)
  const listingsPerPageDesktop = 5;
  const listingsPerPageMobile = 4;
  const [currentListingsPerPage, setCurrentListingsPerPage] = useState(listingsPerPageDesktop);

  const agencyListingsCarouselRef = useRef(null);
  const autoSwipeAgencyListingsIntervalRef = useRef(null);
  const initialScrollSetAgencyListings = useRef(null); // Changed to null, not used for auto-scroll

  // State to determine if the current view is mobile
  const [isMobileView, setIsMobileView] = useState(false);


  // Determine if the current user is an admin of this agency
  useEffect(() => {
    if (user && agency) {
      setIsCurrentUserAgencyAdmin(user.role === 'agency_admin' && user.agency_id === parseInt(id));
    } else {
      setIsCurrentUserAgencyAdmin(false);
    }
  }, [user, agency, id]);

  // Determine if the current user is an affiliated agent (accepted status)
  useEffect(() => {
    if (user && agency && user.role === 'agent') {
      // Check if the user's agency_id matches the current agency's ID
      // This implies an 'accepted' status from the backend's perspective for agents
      setIsCurrentUserAffiliatedAgent(user.agency_id === parseInt(id));
    } else {
      setIsCurrentUserAffiliatedAgent(false);
    }
  }, [user, agency, id]);


  // Determine listings per page based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint is 768px
        setCurrentListingsPerPage(listingsPerPageMobile);
        setIsMobileView(true);
      } else {
        setCurrentListingsPerPage(listingsPerPageDesktop);
        setIsMobileView(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch agency details
  const fetchAgencyDetails = useCallback(async () => {
    if (!id) return;
    setLoadingAgencyDetails(true); // Start loading
    try {
      const { data } = await axiosInstance.get(`${API_BASE_URL}/agencies/${id}`);
      setAgency(data);
      // Initialize edit form data when agency details are fetched
      setEditFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        address: data.address || '', // Initialize address
        description: data.description || '',
        logoBase64: null, // Don't pre-fill base64, only set on new upload
        logoOriginalname: null,
      });
    } catch (error) {
      console.error("Error fetching agency details:", error);
      showMessage('Failed to load agency details.', 'error');
      setAgency(null);
    } finally {
      setLoadingAgencyDetails(false); // End loading
    }
  }, [id, showMessage]);

  // Fetch agency members
  const fetchAgencyMembers = useCallback(async () => {
    // Only fetch if current user is agency admin or super admin for this agency
    if (!id || (!isCurrentUserAgencyAdmin && user?.role !== 'admin')) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axiosInstance.get(`${API_BASE_URL}/agencies/${id}/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgencyMembers(data);
    } catch (error) {
      console.error("Error fetching agency members:", error.response?.data || error.message);
      showMessage('Failed to load agency members.', 'error');
      setAgencyMembers([]);
    }
  }, [id, isCurrentUserAgencyAdmin, user?.role, showMessage]);

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    // Only fetch if current user is agency admin or super admin for this agency
    if (!id || (!isCurrentUserAgencyAdmin && user?.role !== 'admin')) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axiosInstance.get(`${API_BASE_URL}/agencies/${id}/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingRequests(data);
    } catch (error) {
      console.error("Error fetching pending requests:", error.response?.data || error.message);
      showMessage('Failed to load pending requests.', 'error');
      setPendingRequests([]);
    }
  }, [id, isCurrentUserAgencyAdmin, user?.role, showMessage]);

  // New fetch function for agency listings
  const fetchAgencyListings = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await axiosInstance.get(`${API_BASE_URL}/agencies/${id}/listings`);
      setAgencyListings(data);
    } catch (error) {
      console.error("Error fetching agency listings:", error.response?.data || error.message);
      showMessage('Failed to load agency listings.', 'error');
      setAgencyListings([]);
    }
  }, [id, showMessage]);

  // New: Fetch current user's agency memberships (connected, pending, rejected)
  const fetchCurrentUserAgencyMemberships = useCallback(async () => {
    if (!user?.user_id || user?.role === 'client') {
      setCurrentUserMemberships([]);
      setLoadingCurrentUserMemberships(false);
      setIsCurrentUserLastAdminOfThisAgency(false);
      return;
    }

    setLoadingCurrentUserMemberships(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`${API_BASE_URL}/agencies/${user.user_id}/agency-memberships`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserMemberships(response.data || []);

      // If the user is an agency_admin of THIS agency, check if they are the last admin
      if (user?.role === 'agency_admin' && user?.agency_id === parseInt(id)) {
        try {
          const adminCountResponse = await axiosInstance.get(
            `${API_BASE_URL}/agencies/${user.agency_id}/admin-count`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const adminCount = adminCountResponse.data.admin_count;
          setIsCurrentUserLastAdminOfThisAgency(adminCount <= 1);
        } catch (error) {
          console.error("Error checking admin count for disconnect button:", error);
          setIsCurrentUserLastAdminOfThisAgency(false);
        }
      } else {
        setIsCurrentUserLastAdminOfThisAgency(false);
      }

    } catch (error) {
      console.error("Error fetching current user agency memberships:", error.response?.data || error.message);
      showMessage("Failed to load your agency affiliations.", "error");
      setCurrentUserMemberships([]);
      setIsCurrentUserLastAdminOfThisAgency(false);
    } finally {
      setLoadingCurrentUserMemberships(false);
    }
  }, [user?.user_id, user?.role, user?.agency_id, id, showMessage]);

  // Function to check if agency is favorited
  const checkFavoriteAgencyStatus = useCallback(async () => {
    if (user?.user_id && id && user?.role === 'client') {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAgencyFavorited(false);
        return;
      }
      try {
        const response = await axiosInstance.get(`${API_BASE_URL}/favourites/agencies/status/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAgencyFavorited(response.data.isFavorited);
      } catch (error) {
        console.error("Error checking favorite agency status:", error);
        showMessage('Failed to check agency favorite status.', 'error');
        setIsAgencyFavorited(false);
      }
    } else {
      setIsAgencyFavorited(false);
    }
  }, [user?.user_id, id, user?.role, showMessage]);

  // Function to toggle agency favorite status
  const handleToggleFavoriteAgency = async () => {
    if (!user?.user_id || !id || user?.role !== 'client') {
      showMessage('Please log in as a client to add agencies to favorites.', 'info');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showMessage("Authentication token not found. Please log in.", 'error');
        return;
    }

    try {
      if (isAgencyFavorited) {
        await axiosInstance.delete(`${API_BASE_URL}/favourites/agencies/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAgencyFavorited(false);
        showMessage('Removed agency from favorites!', 'info');
      } else {
        await axiosInstance.post(`${API_BASE_URL}/favourites/agencies`, { agency_id: id }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAgencyFavorited(true);
        showMessage('Added agency to favorites!', 'success');
      }
    } catch (err) {
      console.error('Error toggling agency favorite status:', err.response?.data || err.message);
      let errorMessage = 'Failed to update agency favorite status. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  // New: Function to fetch client's own favorite properties
  const fetchClientFavoriteProperties = useCallback(async () => {
    if (user?.role === 'client' && user?.user_id) {
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
  }, [user?.role, user?.user_id, showMessage]);

  // New: Function to toggle client's favorite status for a property
  const handleToggleClientFavoriteProperty = async (propertyId, isCurrentlyFavorited) => {
    console.log(`Attempting to toggle favorite for propertyId: ${propertyId}, current status: ${isCurrentlyFavorited}`); // Debug log
    if (user?.role !== 'client' || !user?.user_id) {
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


  // Effects to trigger data fetching
  useEffect(() => {
    fetchAgencyDetails();
    fetchAgencyListings(); // Fetch listings for all users
  }, [fetchAgencyDetails, fetchAgencyListings]);

  useEffect(() => {
    // Fetch members and pending requests only when authorized and agency details are loaded
    if ((isCurrentUserAgencyAdmin || user?.role === 'admin') && agency) {
      fetchAgencyMembers();
      fetchPendingRequests();
    }
  }, [isCurrentUserAgencyAdmin, user?.role, agency, fetchAgencyMembers, fetchPendingRequests]);

  useEffect(() => {
    fetchCurrentUserAgencyMemberships();
    if (user?.role === 'client' && user?.user_id) {
      fetchClientFavoriteProperties(); // Fetch client's favorite properties
    } else {
      setClientFavoriteProperties([]); // Clear if not a client or not logged in
    }
  }, [fetchCurrentUserAgencyMemberships, fetchClientFavoriteProperties, user?.user_id, user?.role, id]);

  useEffect(() => {
    if (user?.role === 'client' && user?.user_id && id) {
      checkFavoriteAgencyStatus(); // Check agency favorite status when component mounts or dependencies change
    } else {
      setIsAgencyFavorited(false); // Reset favorite status if not a client or no user/agency ID
    }
  }, [user?.role, user?.user_id, id, checkFavoriteAgencyStatus]);


  // Handle outside clicks for member options menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowMemberOptionsMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMemberOptionsMenu]);


  // Action Handlers for Agency Admins
  const handlePromoteToAdmin = async (memberId, memberName) => {
    showConfirm({
      title: "Promote to Admin",
      message: `Are you sure you want to promote ${memberName} to an Agency Administrator?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axiosInstance.put(`${API_BASE_URL}/agencies/${id}/members/${memberId}/promote-to-admin`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage(`${memberName} promoted to administrator successfully!`, 'success');
          fetchAgencyMembers(); // Refresh members list
          setShowMemberOptionsMenu(null);
        } catch (error) {
          console.error("Error promoting member:", error.response?.data || error.message);
          showMessage(`Failed to promote ${memberName}: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Promote",
      cancelLabel: "Cancel"
    });
  };

  const handleDemoteToAgent = async (memberId, memberName) => {
    showConfirm({
      title: "Demote to Agent",
      message: `Are you sure you want to demote ${memberName} to a regular Agent?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axiosInstance.put(`${API_BASE_URL}/agencies/${id}/members/${memberId}/demote-to-agent`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage(`${memberName} demoted to agent successfully!`, 'success');
          fetchAgencyMembers(); // Refresh members list
          setShowMemberOptionsMenu(null);
        } catch (error) {
          console.error("Error demoting member:", error.response?.data || error.message);
          showMessage(`Failed to demote ${memberName}: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Demote",
      cancelLabel: "Cancel"
    });
  };

  const handleUpdateMemberStatus = async (memberId, memberName, status) => {
    showConfirm({
      title: `Set ${memberName} as ${status === 'vip' ? 'VIP' : 'Regular'}`,
      message: `Are you sure you want to set ${memberName}'s status to ${status}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axiosInstance.put(`${API_BASE_URL}/agencies/${id}/members/${memberId}/status`, { status }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage(`${memberName}'s status updated to ${status} successfully!`, 'success');
          fetchAgencyMembers(); // Refresh members list
          setShowMemberOptionsMenu(null);
        } catch (error) {
          console.error("Error updating member status:", error.response?.data || error.message);
          showMessage(`Failed to update ${memberName}'s status: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Update Status",
      cancelLabel: "Cancel"
    });
  };

  const handleRemoveMember = async (memberId, memberName) => {
    showConfirm({
      title: "Remove Member",
      message: `Are you sure you want to remove ${memberName} from this agency? This action is irreversible.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axiosInstance.delete(`${API_BASE_URL}/agencies/${id}/members/${memberId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage(`${memberName} removed from agency successfully.`, 'success');
          fetchAgencyMembers(); // Refresh members list
          setShowMemberOptionsMenu(null);
        } catch (error) {
          console.error("Error removing member:", error.response?.data || error.message);
          showMessage(`Failed to remove ${memberName}: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Remove",
      cancelLabel: "Cancel"
    });
  };

  const handleApproveRequest = async (requestId, agentName) => {
    showConfirm({
      title: "Approve Request",
      message: `Are you sure you want to approve ${agentName}'s request to join?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axiosInstance.put(`${API_BASE_URL}/agencies/approve-join-request/${requestId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage(`${agentName}'s request approved!`, 'success');
          fetchPendingRequests(); // Refresh pending requests
          fetchAgencyMembers(); // Also refresh members as a new one might have joined
          fetchCurrentUserAgencyMemberships(); // Update current user's status if it was their request
        } catch (error) {
          console.error("Error approving request:", error.response?.data || error.message);
          showMessage(`Failed to approve ${agentName}'s request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Approve",
      cancelLabel: "Cancel"
    });
  };

  const handleRejectRequest = async (requestId, agentName) => {
    showConfirm({
      title: "Reject Request",
      message: `Are you sure you want to reject ${agentName}'s request to join?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axiosInstance.put(`${API_BASE_URL}/agencies/reject-join-request/${requestId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage(`${agentName}'s request rejected.`, 'info');
          fetchPendingRequests(); // Refresh pending requests
          fetchCurrentUserAgencyMemberships(); // Update current user's status if it was their request
        } catch (error) {
          console.error("Error rejecting request:", error.response?.data || error.message);
          showMessage(`Failed to reject ${agentName}'s request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Reject",
      cancelLabel: "Cancel"
    });
  };

  // New function to handle reverting from agency_admin to agent
  const handleRevertToAgent = async () => {
    // Check if the user is the last admin of their agency
    if (user?.role === 'agency_admin' && user?.agency_id === parseInt(id)) {
      try {
        const token = localStorage.getItem('token');
        const response = await axiosInstance.get(
          `${API_BASE_URL}/agencies/${user.agency_id}/admin-count`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const adminCount = response.data.admin_count;

        if (adminCount <= 1) {
          showMessage("You cannot step down as you are the last agency administrator. Please promote another agent to admin first.", 'error');
          return false; // Indicate that the action was blocked
        }
      } catch (error) {
        console.error("Error checking admin count:", error.response?.data || error.message);
        showMessage("Failed to verify admin status. Please try again.", 'error');
        return false; // Indicate that the action was blocked
      }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.put(
        `${API_BASE_URL}/users/revert-to-agent`, // Assuming this endpoint exists and handles the role change and agency disassociation
        {}, // No body needed for this request
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        showMessage(response.data.message, 'success');
        updateUser(response.data.user); // Update user context with the new user info from the response
        fetchCurrentUserAgencyMemberships(); // Re-fetch memberships to reflect new role
        fetchAgencyMembers(); // Refresh members list for the agency
        return true; // Indicate success
      }
    } catch (error) {
      console.error("Error reverting role:", error.response?.data || error.message);
      showMessage(`Failed to step down as admin: ${error.response?.data?.message || 'Please try again.'}`, 'error');
      return false; // Indicate failure
    }
  };

  const handleDisconnectFromThisAgency = async () => {
    if (!user?.user_id || !id) {
      showMessage("You are not authorized to disconnect from this agency at this time.", 'info');
      return;
    }

    const currentAffiliation = currentUserMemberships.find(m => m.agency_id === parseInt(id));
    const agencyName = agency?.name || 'this agency';

    let confirmMessage = `Are you sure you want to disconnect from ${agencyName}? You can send a new request later.`;
    let confirmTitle = "Disconnect from Agency";

    if (user?.role === 'agency_admin' && user?.agency_id === parseInt(id)) {
      confirmMessage = `Are you sure you want to step down as administrator and disconnect from ${agencyName}? This action cannot be undone and will require you to resend a connection request.`;
      confirmTitle = "Step Down & Disconnect";

      // If agency_admin is the last admin, prevent the action before showing confirm
      if (isCurrentUserLastAdminOfThisAgency) {
        showMessage("You cannot disconnect as you are the last agency administrator. Please promote another agent to admin first.", 'error');
        return;
      }
    }

    showConfirm({
      title: confirmTitle,
      message: confirmMessage,
      onConfirm: async () => {
        if (user?.role === 'agency_admin' && user?.agency_id === parseInt(id)) {
          // For agency_admin, call handleRevertToAgent which also handles the disconnect
          await handleRevertToAgent();
        } else {
          // For agent, proceed with direct disconnect
          try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.delete(
              `${API_BASE_URL}/agencies/${id}/members/${user.user_id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
              showMessage('Disconnected from agency successfully.', 'success');
              updateUser({ ...user, agency_id: null, agency: null, role: 'agent' }); // Clear agency info from user context
              fetchCurrentUserAgencyMemberships(); // Re-fetch to ensure state consistency
            } else {
              showMessage('Failed to disconnect from agency. Please try again.', 'error');
            }
          } catch (error) {
            console.error("Error disconnecting from agency:", error.response?.data || error.message);
            showMessage(`Failed to disconnect: ${error.response?.data?.message || 'Please try again.'}`, 'error');
            fetchCurrentUserAgencyMemberships(); // Re-fetch to ensure state consistency
          }
        }
      },
      confirmLabel: user?.role === 'agency_admin' && user?.agency_id === parseInt(id) ? "Yes, Step Down & Disconnect" : "Disconnect",
      cancelLabel: "Cancel"
    });
  };

  const handleClearRejectedStatus = async () => {
    // To clear a rejected status, we will send a new request to join that agency.
    // The backend will handle updating the status from 'rejected' to 'pending'.
    await handleRequestToJoin(); // Re-use existing join request logic
  };

  const handleCancelPendingRequest = async () => {
    if (!user?.user_id || !id) {
      showMessage("You are not authorized to cancel this request.", 'info');
      return;
    }

    showConfirm({
      title: "Cancel Pending Request",
      message: `Are you sure you want to cancel your pending request to join ${agency?.name}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          // Use the existing DELETE endpoint to remove the pending membership
          const response = await axiosInstance.delete(
            `${API_BASE_URL}/agencies/${id}/members/${user.user_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.status === 200) {
            showMessage('Pending request cancelled successfully.', 'success');
            fetchCurrentUserAgencyMemberships(); // Re-fetch memberships to ensure state consistency
          } else {
            showMessage('Failed to cancel pending request. Please try again.', 'error');
          }
        } catch (error) {
          console.error("Error canceling pending request:", error.response?.data || error.message);
          showMessage(`Failed to cancel request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
          fetchCurrentUserAgencyMemberships(); // Re-fetch to ensure state consistency
        }
      },
      confirmLabel: "Yes, Cancel",
      cancelLabel: "No"
    });
  };


  const handleRequestToJoin = async () => {
    if (!isAuthenticated || user?.role !== 'agent') {
      showMessage('You must be logged in as an agent to send a join request.', 'info');
      return;
    }

    // Client-side check for existing affiliation before sending a new request
    const hasAnyAffiliation = currentUserMemberships.some(m => m.request_status === 'accepted' || m.request_status === 'pending');
    if (hasAnyAffiliation) {
      showMessage("You are already affiliated with an agency (connected or pending). An agent can only be affiliated with one agency at a time.", 'info');
      return;
    }

    showConfirm({
      title: "Request to Join Agency",
      message: `Do you want to send a request to join ${agency.name}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axiosInstance.post(`${API_BASE_URL}/agencies/request-to-join`, { agency_id: id }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage(response.data.message, 'success');
          fetchCurrentUserAgencyMemberships(); // Update current user's status to pending
        } catch (error) {
          console.error("Error sending join request:", error.response?.data || error.message);
          showMessage(`Failed to send join request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
          fetchCurrentUserAgencyMemberships(); // Re-fetch to ensure state consistency
        }
      },
      confirmLabel: "Send Request",
      cancelLabel: "Cancel"
    });
  };

  // Handlers for in-page editing
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

      if (file.size > MAX_FILE_SIZE) {
        showMessage('File size exceeds 5MB limit. Please choose a smaller image.', 'error');
        e.target.value = ''; // Clear the file input
        setEditFormData(prev => ({ ...prev, logoBase64: null, logoOriginalname: null }));
        return;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showMessage('Invalid file type. Only JPG, PNG, and GIF images are allowed.', 'error');
        e.target.value = ''; // Clear the file input
        setEditFormData(prev => ({ ...prev, logoBase64: null, logoOriginalname: null }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({
          ...prev,
          logoBase64: reader.result.split(',')[1], // Get base64 string without data:image/jpeg;base64,
          logoOriginalname: file.name,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setEditFormData(prev => ({
        ...prev,
        logoBase64: null,
        logoOriginalname: null,
      }));
    }
  };

  const handleSaveEdit = async () => {
    showConfirm({
      title: "Save Changes",
      message: "Are you sure you want to save these changes to the agency details?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const payload = { ...editFormData };
          // If logoBase64 is null, explicitly send it as null to clear the logo
          if (editFormData.logoBase64 === null && agency.logo_url) {
            payload.logoBase64 = null;
            payload.logoOriginalname = null;
          } else if (editFormData.logoBase64 === null && !agency.logo_url) {
            // If no logo was there and no new one is uploaded, remove these fields from payload
            delete payload.logoBase64;
            delete payload.logoOriginalname;
          }

          const { data } = await axiosInstance.put(`${API_BASE_URL}/agencies/${id}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAgency(data); // Update agency state with new data
          setIsEditing(false); // Close edit mode
          showMessage('Agency details updated successfully!', 'success');
        } catch (error) {
          console.error("Error updating agency details:", error.response?.data || error.message);
          showMessage(`Failed to update agency details: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Save",
      cancelLabel: "Cancel"
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Revert form data to current agency data
    setEditFormData({
      name: agency.name || '',
      email: agency.email || '',
      phone: agency.phone || '',
      website: agency.website || '',
      address: agency.address || '', // Revert address
      description: agency.description || '',
      logoBase64: null,
      logoOriginalname: null,
    });
  };


  // Carousel navigation for agency listings - REMOVED AUTO SCROLL AND BUTTONS
  const scrollAgencyListings = useCallback((direction) => {
    // This function is no longer used for auto-scrolling or buttons, but kept for potential manual use if needed.
  }, [agencyListings.length]);

  const handlePrevListing = useCallback(() => {
    // No longer needed
  }, []);

  const handleNextListing = useCallback(() => {
    // No longer needed
  }, []);

  // Auto-swipe for agency listings - REMOVED
  useEffect(() => {
    // Clear any existing interval before setting a new one
    if (autoSwipeAgencyListingsIntervalRef.current) {
      clearInterval(autoSwipeAgencyListingsIntervalRef.current);
    }
    // No auto-swipe
    return () => {
      if (autoSwipeAgencyListingsIntervalRef.current) {
        clearInterval(autoSwipeAgencyListingsIntervalRef.current);
      }
    };
  }, [agencyListings.length, scrollAgencyListings, isMobileView]);

  // Touch event handlers for carousel - REMOVED
  const handleTouchStartAgencyListings = useCallback((e) => {
    // No longer needed
  }, []);

  const handleTouchMoveAgencyListings = useCallback((e) => {
    // No longer needed
  }, []);

  const handleTouchEndAgencyListings = useCallback((e) => {
    // No longer needed
  }, []);

  // Effect to set initial scroll position to the middle set of duplicated items - REMOVED
  useEffect(() => {
    // No longer needed
  }, [agencyListings.length, isMobileView]);

  // Determine the current user's affiliation status with THIS agency
  const currentUserAffiliationWithThisAgency = currentUserMemberships.find(
    (m) => m.agency_id === parseInt(id)
  );
  const isConnectedToThisAgency = currentUserAffiliationWithThisAgency?.request_status === 'accepted';
  const isPendingWithThisAgency = currentUserAffiliationWithThisAgency?.request_status === 'pending';
  const isRejectedByThisAgency = currentUserAffiliationWithThisAgency?.request_status === 'rejected';

  // Check if the user has ANY affiliation (connected or pending) with ANY agency
  const hasAnyAffiliation = currentUserMemberships.some(
    (m) => m.request_status === 'accepted' || m.request_status === 'pending'
  );


  const defaultLogo = `https://placehold.co/100x100/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0EC0" : "047857"}?text=${agency?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AG'}`;

  // Styles for input fields, copied from Settings.js search bar
  const inputFieldStyle = `w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`;
  const labelStyle = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;


  return (
    <motion.div
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
              {loadingAgencyDetails ? (
                <div className={`h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse`}></div>
              ) : (
                agency.name
              )}
            </h1>
            {isAuthenticated && user?.role === 'client' && ( // Only show if logged in as client
                <button
                    onClick={handleToggleFavoriteAgency}
                    className={`p-2 rounded-full shadow-md transition-all duration-200 ${
                        isAgencyFavorited
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    }`}
                    title={isAgencyFavorited ? "Remove from Saved Agencies" : "Save Agency to Favourites"}
                >
                    <Bookmark size={20} fill={isAgencyFavorited ? "currentColor" : "none"} />
                </button>
            )}
          </div>

          <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
            <div className="flex items-center space-x-4">
              {loadingAgencyDetails ? (
                <div className={`w-24 h-24 rounded-full animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
              ) : (
                <img
                  src={editFormData.logoBase64 ? `data:image/png;base64,${editFormData.logoBase64}` : (agency.logo_url || defaultLogo)}
                  alt={`${agency.name} Logo`}
                  className={`w-24 h-24 rounded-full object-cover border-2 shadow-sm ${darkMode ? "border-green-700" : "border-green-300"}`}
                />
              )}
              <div className="flex flex-col">
                {loadingAgencyDetails ? (
                  <>
                    <div className={`h-6 bg-gray-300 dark:bg-gray-700 rounded w-40 animate-pulse`}></div>
                    <div className={`h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mt-2 animate-pulse`}></div>
                  </>
                ) : (
                  <>
                    <p className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                      {agency.name}
                    </p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Real Estate Agency</p>
                  </>
                )}
              </div>
            </div>

            {/* Agency Details Display / Edit Form */}
            {loadingAgencyDetails ? (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className={`h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 animate-pulse`}></div>
                      <div className={`h-10 bg-gray-300 dark:bg-gray-700 rounded-xl w-full animate-pulse`}></div>
                    </div>
                  ))}
                  <div className="sm:col-span-2 space-y-2">
                    <div className={`h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 animate-pulse`}></div>
                    <div className={`h-24 bg-gray-300 dark:bg-gray-700 rounded-xl w-full animate-pulse`}></div>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <div className={`h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 animate-pulse`}></div>
                    <div className={`h-10 bg-gray-300 dark:bg-gray-700 rounded-xl w-full animate-pulse`}></div>
                  </div>
                </div>
              </div>
            ) : isEditing ? (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className={labelStyle}>Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      className={inputFieldStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelStyle}>Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
                      className={inputFieldStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelStyle}>Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditChange}
                      className={inputFieldStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="website" className={labelStyle}>Website</label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={editFormData.website}
                      onChange={handleEditChange}
                      className={inputFieldStyle}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className={labelStyle}>Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={editFormData.address}
                      onChange={handleEditChange}
                      className={inputFieldStyle}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="description" className={labelStyle}>Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditChange}
                      rows="3"
                      className={inputFieldStyle}
                    ></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="logo" className={labelStyle}>Agency Logo</label>
                    <input
                      type="file"
                      id="logo"
                      name="logo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      ref={fileInputRef}
                      className={`w-full p-2 border rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${darkMode ? "file:bg-green-500 file:text-white text-gray-200 bg-gray-700 border-gray-600" : "file:bg-green-50 file:text-green-700 text-gray-800 bg-white border-gray-300"}`}
                    />
                    {agency.logo_url && (
                      <button
                        onClick={() => {
                          setEditFormData(prev => ({ ...prev, logoBase64: null, logoOriginalname: null }));
                          if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
                        }}
                        className="mt-2 text-red-500 hover:underline text-sm flex items-center gap-1"
                      >
                        <XCircle size={16} /> Remove Current Logo
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={handleCancelEdit}
                    className={`px-4 py-2 rounded-full border transition-colors duration-300 shadow-md ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-colors duration-300 shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <p className="flex items-center gap-2">
  <Mail size={18} /> <strong>Email:</strong>{" "}
  <a href={`mailto:${agency.email}`} className="text-blue-500">
    {agency.email}
  </a>
</p>
<p className="flex items-center gap-2">
  <Phone size={18} /> <strong>Phone:</strong>{" "}
  <a href={`tel:${agency.phone}`} className="text-blue-500">
    {agency.phone}
  </a>
</p>
                {agency.website && (
                  <p className="flex items-center gap-2"><Globe size={18} /> <strong>Website:</strong> <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{agency.website}</a></p>
                )}
                {agency.address && (
                  <p className="flex items-center gap-2"><MapPin size={18} /> <strong>Address:</strong> {agency.address}</p>
                )}
                {agency.description && (
                  <div className="sm:col-span-2 space-y-2 pt-4">
                    <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"} flex items-center gap-2`}>
                      <FileText size={20} /> Description
                    </h2>
                    <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>{agency.description}</p>
                  </div>
                )}
              </div>
            )}


            {/* Action Buttons for Agency Admins / Super Admins */}
            {loadingAgencyDetails ? (
              <div className={`h-10 bg-gray-300 dark:bg-gray-700 rounded-full w-48 animate-pulse mt-6`}></div>
            ) : (isCurrentUserAgencyAdmin || user?.role === 'admin') && (
              <div className="flex flex-wrap gap-4 mt-6">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors duration-300 shadow-md flex items-center gap-2"
                  >
                    <Edit size={20} /> Edit Agency Details
                  </button>
                )}
              </div>
            )}

            {/* Current User's Affiliation Status with THIS Agency */}
            {isAuthenticated && user?.role !== 'client' && loadingCurrentUserMemberships && (
              <div className={`mt-6 p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-50"} flex items-center justify-center`}>
                <Loader size={20} className="animate-spin mr-2" /> Loading your agency affiliation...
              </div>
            )}

            {isAuthenticated && user?.role !== 'client' && !loadingCurrentUserMemberships && (
              <>
                {isConnectedToThisAgency && (
                  <div className={`mt-6 p-4 rounded-xl ${darkMode ? "bg-green-800/20 text-green-200 border-green-700" : "bg-green-100 text-green-800 border-green-200"} flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} /> You are {user?.role === 'agency_admin' ? 'an administrator' : 'an agent'} affiliated with this agency.
                    </div>
                    <button
                      onClick={handleDisconnectFromThisAgency}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition duration-200
                        ${darkMode ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"}
                        ${user?.role === 'agency_admin' && isCurrentUserLastAdminOfThisAgency ? 'opacity-50 cursor-not-allowed' : ''}`
                      }
                      title={user?.role === 'agency_admin' && isCurrentUserLastAdminOfThisAgency ? "Cannot disconnect: You are the last agency administrator." : (user?.role === 'agency_admin' ? "Step down as admin and disconnect" : "Disconnect")}
                      disabled={user?.role === 'agency_admin' && isCurrentUserLastAdminOfThisAgency}
                    >
                      <UserX size={16} className="inline-block mr-1" /> Disconnect
                    </button>
                  </div>
                )}

                {isPendingWithThisAgency && (
                  <div className={`mt-6 p-4 rounded-xl ${darkMode ? "bg-yellow-800/20 text-yellow-200 border-yellow-700" : "bg-yellow-100 text-yellow-800 border-yellow-200"} flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2">
                      <Hourglass size={20} className="animate-pulse" /> Your request to join this agency is pending.
                    </div>
                    <button
                      onClick={handleCancelPendingRequest}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition duration-200
                        ${darkMode ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                    >
                      <X size={16} className="inline-block mr-1" /> Cancel Request
                    </button>
                  </div>
                )}

                {isRejectedByThisAgency && (
                  <div className={`mt-6 p-4 rounded-xl ${darkMode ? "bg-red-800/20 text-red-200 border-red-700" : "bg-red-100 text-red-800 border-red-200"} flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2">
                      <UserX size={20} /> Your request to join this agency was rejected.
                    </div>
                    <button
                      onClick={handleClearRejectedStatus}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition duration-200
                        ${darkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                    >
                      Re-send Request
                    </button>
                  </div>
                )}

                {/* Show Request to Join button ONLY if not already connected, pending, or rejected with ANY agency */}
                {user?.role === 'agent' && !hasAnyAffiliation && (
                  <div className="mt-6">
                    <button
                      onClick={handleRequestToJoin}
                      className={`bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-md flex items-center gap-2`}
                    >
                      <UserPlus size={20} /> Request to Join Agency
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Agency Members Section (Visible to Agency Admin/Super Admin) */}
          {(isCurrentUserAgencyAdmin || user?.role === 'admin') && (
            <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"} flex items-center gap-2`}>
                <Users size={20} /> Agency Members ({agencyMembers.length})
              </h2>
              {agencyMembers.length > 0 ? (
                <ul className="space-y-3">
                  {agencyMembers.slice(0, 3).map((member) => ( // Show max 3 members
                    <li key={member.user_id} className={`flex items-center justify-between p-3 rounded-lg shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                      <div className="flex items-center space-x-3">
                        <img
                          src={member.profile_picture_url || `https://placehold.co/50x50/${darkMode ? "4A5568" : "CBD5E0"}/${darkMode ? "E2E8F0" : "4A5568"}?text=${member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}`}
                          alt={member.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{member.full_name}</p>
                          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{member.email}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${member.agency_role === 'admin' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                              {member.agency_role === 'admin' ? 'Agency Admin' : 'Agent'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full ${member.member_status === 'vip' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}>
                              {member.member_status === 'vip' ? 'VIP' : 'Regular'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {user?.user_id !== member.user_id && ( // Cannot manage self
                        <div className="relative" ref={showMemberOptionsMenu === member.user_id ? optionsMenuRef : null}>
                          <button
                            onClick={() => setShowMemberOptionsMenu(showMemberOptionsMenu === member.user_id ? null : member.user_id)}
                            className={`p-1.5 rounded-full ${darkMode ? "text-gray-400 hover:bg-gray-600" : "text-gray-600 hover:bg-gray-200"}`}
                          >
                            <EllipsisVertical size={20} />
                          </button>
                          {showMemberOptionsMenu === member.user_id && (
                            <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10
                              ${darkMode ? "bg-gray-700 ring-1 ring-gray-600" : "bg-white ring-1 ring-gray-200"}`}>
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                {member.agency_role !== 'admin' ? (
                                  <button
                                    onClick={() => handlePromoteToAdmin(member.user_id, member.full_name)}
                                    className={`flex items-center w-full px-4 py-2 text-sm
                                      ${darkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-100"}`}
                                    role="menuitem"
                                  >
                                    <Crown size={16} className="mr-2" /> Promote to Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleDemoteToAgent(member.user_id, member.full_name)}
                                    className={`flex items-center w-full px-4 py-2 text-sm
                                      ${darkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-100"}`}
                                    role="menuitem"
                                  >
                                    <UserMinus size={16} className="mr-2" /> Demote to Agent
                                  </button>
                                )}
                                {member.member_status !== 'vip' && (
                                  <button
                                    onClick={() => handleUpdateMemberStatus(member.user_id, member.full_name, 'vip')}
                                    className={`flex items-center w-full px-4 py-2 text-sm
                                      ${darkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-100"}`}
                                    role="menuitem"
                                  >
                                    <Star size={16} className="mr-2" /> Set as VIP
                                  </button>
                                )}
                                {member.member_status !== 'regular' && (
                                  <button
                                    onClick={() => handleUpdateMemberStatus(member.user_id, member.full_name, 'regular')}
                                    className={`flex items-center w-full px-4 py-2 text-sm
                                      ${darkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-100"}`}
                                    role="menuitem"
                                  >
                                    <UserRound size={16} className="mr-2" /> Set as Regular
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveMember(member.user_id, member.full_name)}
                                  className={`flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-100
                                    ${darkMode ? "hover:bg-red-900 hover:text-red-100" : ""}`}
                                  role="menuitem"
                                >
                                  <UserX size={16} className="mr-2" /> Remove Member
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No active members found.</p>
              )}
              {(isCurrentUserAgencyAdmin || user?.role === 'admin') && agencyMembers.length > 0 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      // Conditionally navigate based on user role
                      if (user?.role === 'admin') {
                        navigate(`/admin/agencies/${id}/members`); // Navigate to admin-specific route
                      } else {
                        navigate('/agency/members'); // Navigate to agency_admin route
                      }
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-md flex items-center justify-center gap-2 mx-auto"
                  >
                    <Users size={20} /> View All Members
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pending Requests Section (Visible to Agency Admin/Super Admin) */}
          {(isCurrentUserAgencyAdmin || user?.role === 'admin') && (
            <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"} flex items-center gap-2`}>
                <Clock size={20} /> Pending Join Requests ({pendingRequests.length})
              </h2>
              {pendingRequests.length > 0 ? (
                <ul className="space-y-3">
                  {pendingRequests.slice(0, 3).map((request) => ( // Show max 3 pending requests
                    <li key={request.request_id} className={`flex items-center justify-between p-3 rounded-lg shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                      <div className="flex items-center space-x-3">
                        <img
                          src={request.agent_profile_picture_url || `https://placehold.co/50x50/${darkMode ? "4A5568" : "CBD5E0"}/${darkMode ? "E2E8F0" : "4A5568"}?text=${request.agent_name.split(' ').map(n => n[0]).join('').toUpperCase()}`}
                          alt={request.agent_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{request.agent_name}</p>
                          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{request.agent_email}</p>
                          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Requested: {new Date(request.requested_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveRequest(request.request_id, request.agent_name)}
                          className={`p-2 rounded-full ${darkMode ? "bg-green-600 hover:bg-green-500" : "bg-green-500 hover:bg-green-600"} text-white transition-colors duration-200`}
                          title="Approve Request"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.request_id, request.agent_name)}
                          className={`p-2 rounded-full ${darkMode ? "bg-red-600 hover:bg-red-500" : "bg-red-500 hover:bg-red-600"} text-white transition-colors duration-200`}
                          title="Reject Request"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No pending join requests.</p>
              )}
            </div>
          )}

        </motion.div>

        <motion.div
          className="w-full lg:w-2/5 space-y-8 p-4 md:p-0"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Contact Agency Section */}
              <div className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}>
                <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Contact {agency?.name || 'Agency'}</h2>
                {loadingAgencyDetails ? (
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`h-16 w-24 rounded-xl animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <a
                      href={`tel:${agency.phone}`}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl font-semibold transition-colors duration-300 shadow-md flex-1 min-w-[100px] max-w-[calc(33%-0.75rem)]
                        ${darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                      title="Call Agency"
                    >
                      <Phone size={24} />
                      <span className="text-xs mt-1">Call</span>
                    </a>
                    <a
                      href={`mailto:${agency.email}`}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl font-semibold transition-colors duration-300 shadow-md flex-1 min-w-[100px] max-w-[calc(33%-0.75rem)]
                        ${darkMode ? "bg-green-600 text-white hover:bg-green-500" : "bg-green-500 text-white hover:bg-green-600"}`}
                      title="Email Agency"
                    >
                      <Mail size={24} />
                      <span className="text-xs mt-1">Email</span>
                    </a>
                    {agency.website && (
                      <a
                        href={agency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex flex-col items-center justify-center p-2 rounded-xl font-semibold transition-colors duration-300 shadow-md flex-1 min-w-[100px] max-w-[calc(33%-0.75rem)]
                          ${darkMode ? "bg-purple-600 text-white hover:bg-purple-500" : "bg-purple-500 text-white hover:bg-purple-600"}`}
                        title="Visit Website"
                      >
                        <Globe size={24} />
                        <span className="text-xs mt-1">Website</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

          {/* Location Map Section */}
          <div className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Location Map</h2>
            {loadingAgencyDetails ? (
              <div className={`block w-full h-48 rounded-xl animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
            ) : (
              <a
                href={`http://maps.google.com/?q=${agency.address || agency.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full h-48 rounded-xl overflow-hidden shadow-inner relative group ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
              >
                <img
                  src={`https://placehold.co/600x400/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=Map+of+${agency.name}`}
                  alt="Map Placeholder"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-opacity duration-300">
                  <span className="text-white text-lg font-semibold">View on Google Maps</span>
                </div>
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* Agency Listings Section */}
      {agencyListings.length > 0 && (
        <motion.div
          className={`max-w-7xl mx-auto mt-12 space-y-6 p-0 sm:py-2 relative ${isMobileView ? '' : 'overflow-hidden'} sm:px-6 sm:rounded-3xl sm:shadow-xl sm:border ${
            // Removed container background for mobile
            isMobileView ? '' : (darkMode ? "bg-white border-gray-200" : "bg-white border-gray-200")
          }`}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          // Removed touch events
        >
          <h2 className={`text-xl md:text-2xl font-bold text-center py-0 mb-2 flex items-center justify-center gap-3 ${
            darkMode ? "text-green-400" : "text-green-800"
          }`}>
            <HomeIcon size={24} /> Listings by {agency?.name || 'Agency'}
          </h2>

          {isMobileView ? ( // Mobile layout (2x2 grid)
            <div className="grid grid-cols-2 gap-4 p-4">
              {agencyListings.slice(0, 4).map((listing, index) => ( // Show max 4 listings for 2x2 grid
                <motion.div
                  key={`agency-listing-mobile-${listing.property_id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ListingCard
                    listing={{ ...listing, agency_id: user?.agency_id }}
                    darkMode={darkMode}
                    userRole={user?.role}
                    userId={user?.user_id}
                    userAgencyId={user?.agency_id}
                    getRoleBasePath={() => '/agency'}
                    isFavorited={user?.role === 'client' && clientFavoriteProperties.includes(listing.property_id)}
                    onFavoriteToggle={(propertyId, isCurrentlyFavorited) =>
                      handleToggleClientFavoriteProperty(propertyId, isCurrentlyFavorited)
                    }
                  />
                </motion.div>
              ))}
              {agencyListings.length > 0 && ( // Always show "View All Listings" if there are any listings
                <div className="col-span-2 text-center mt-4">
                  <button
                    onClick={() => navigate(`/listings/agency/${id}`)} // Navigate to Listings.js with agencyId in URL
                    className={`px-6 py-2 rounded-2xl font-semibold transition-colors duration-300 shadow-md bg-green-600 text-white hover:bg-green-700`}
                  >
                    View All Listings ({agencyListings.length})
                  </button>
                </div>
              )}
            </div>
          ) : ( // Desktop layout (1x5 carousel)
            <>
              <style>{`
                /* Hide scrollbar for Chrome, Safari and Opera */
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                .no-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
              `}</style>
              <div className="relative">
                <div
                  ref={agencyListingsCarouselRef}
                  className="flex overflow-x-scroll snap-x snap-mandatory pb-4 -mb-4 no-scrollbar md:pl-0 md:pr-0"
                >
                  {/* Duplicate listings three times to create a continuous loop effect */}
                  {[...agencyListings, ...agencyListings, ...agencyListings].map((listing, index) => {
                    return (
                      <div
                        key={`agency-listing-desktop-${listing.property_id}-${index}`} // Unique key for duplicated items
                        className="flex-shrink-0 snap-center w-1/5 px-2 agency-listing-card-item" // w-1/5 for 5 columns
                      >
                        <ListingCard
                          listing={{ ...listing, agency_id: user?.agency_id }}
                          darkMode={darkMode}
                          userRole={user?.role}
                          userId={user?.user_id}
                          userAgencyId={user?.agency_id}
                          getRoleBasePath={() => '/agency'}
                          isFavorited={user?.role === 'client' && clientFavoriteProperties.includes(listing.property_id)}
                          onFavoriteToggle={(propertyId, isCurrentlyFavorited) =>
                            handleToggleClientFavoriteProperty(propertyId, isCurrentlyFavorited)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                {agencyListings.length > 0 && ( // Always show "View All Listings" if there are any listings
                  <div className="flex justify-center mt-4 space-x-4">
                    <button
                      onClick={() => navigate(`/listings/agency/${id}`)} // Navigate to Listings.js with agencyId in URL
                      className={`px-6 py-2 rounded-2xl font-semibold transition-colors duration-300 shadow-md bg-green-600 text-white hover:bg-green-700`}
                    >
                      View All Listings ({agencyListings.length})
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AgencyProfile;

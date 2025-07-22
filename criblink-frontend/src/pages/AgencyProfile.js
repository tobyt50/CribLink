import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import ListingCard from '../components/ListingCard'; // Import ListingCard to display agency listings
import {
  X, Edit, Trash2, UserPlus, UserMinus, Crown, Shield, Check, XCircle,
  Mail, Phone, Globe, MapPin, Users, UserCheck, UserX, Clock, Star, UserRound,
  FileText, Home as HomeIcon, EllipsisVertical // Added EllipsisVertical
} from 'lucide-react'; // Added FileText for description icon, HomeIcon for listings

const AgencyProfile = () => {
  const { id } = useParams(); // Agency ID from URL
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const [agency, setAgency] = useState(null);
  const [agencyMembers, setAgencyMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [agencyListings, setAgencyListings] = useState([]); // New state for agency listings
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [isAgencyAdmin, setIsAgencyAdmin] = useState(false);
  const [showMemberOptionsMenu, setShowMemberOptionsMenu] = useState(null); // Tracks which member's options menu is open
  const optionsMenuRef = useRef(null); // Ref for member options menu

  // Determine if the current user is an admin of this agency
  const isCurrentUserAgencyAdmin = useCallback(() => {
    return userRole === 'agency_admin' && userId && agency && agency.agency_admin_id === userId;
  }, [userRole, userId, agency]);

  // Fetch user details on component mount
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
          if (data.role === 'agency_admin' && data.agency_id === parseInt(id)) {
            setIsAgencyAdmin(true);
          } else {
            setIsAgencyAdmin(false);
          }
        } else {
          setUserRole('guest');
          setUserId(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error("Error fetching user profile in AgencyProfile:", error);
        showMessage('Failed to load user profile.', 'error');
        setUserRole('guest');
        setUserId(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    };
    fetchUser();
  }, [showMessage, id]);

  // Fetch agency details
  const fetchAgencyDetails = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await axiosInstance.get(`${API_BASE_URL}/agencies/${id}`);
      setAgency(data);
    } catch (error) {
      console.error("Error fetching agency details:", error);
      showMessage('Failed to load agency details.', 'error');
      setAgency(null);
    }
  }, [id, showMessage]);

  // Fetch agency members
  const fetchAgencyMembers = useCallback(async () => {
    if (!id || (!isAgencyAdmin && userRole !== 'admin')) return; // Only fetch if current user is agency admin or super admin
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
  }, [id, isAgencyAdmin, userRole, showMessage]);

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    if (!id || (!isAgencyAdmin && userRole !== 'admin')) return; // Only fetch if current user is agency admin or super admin
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
  }, [id, isAgencyAdmin, userRole, showMessage]);

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

  // Effects to trigger data fetching
  useEffect(() => {
    fetchAgencyDetails();
    fetchAgencyListings(); // Fetch listings for all users
  }, [fetchAgencyDetails, fetchAgencyListings]);

  useEffect(() => {
    // Re-evaluate isAgencyAdmin when agency or userId changes
    if (agency && userId) {
      setIsAgencyAdmin(userRole === 'agency_admin' && agency.agency_admin_id === userId);
    }
  }, [agency, userId, userRole]);

  useEffect(() => {
    // Fetch members and pending requests only when authorized
    if (isAgencyAdmin || userRole === 'admin') {
      fetchAgencyMembers();
      fetchPendingRequests();
    }
  }, [isAgencyAdmin, userRole, fetchAgencyMembers, fetchPendingRequests]);


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
        } catch (error) {
          console.error("Error rejecting request:", error.response?.data || error.message);
          showMessage(`Failed to reject ${agentName}'s request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Reject",
      cancelLabel: "Cancel"
    });
  };

  const handleDeleteAgency = async () => {
    showConfirm({
      title: "Delete Agency",
      message: "Are you absolutely sure you want to delete this agency? This action is irreversible and will disassociate all agents. Your own role will revert to 'agent'.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axiosInstance.delete(`${API_BASE_URL}/agencies/${id}/admin-delete`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage(response.data.message, 'success');
          // Update local storage with new token and user role
          localStorage.setItem('token', response.data.token);
          // You might need to refresh user context or navigate to a different page
          navigate('/dashboard'); // Or home page after deletion
        } catch (error) {
          console.error("Error deleting agency:", error.response?.data || error.message);
          showMessage(`Failed to delete agency: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Delete Agency",
      cancelLabel: "Cancel"
    });
  };

  const handleRequestToJoin = async () => {
    if (userRole !== 'agent' || !userId) {
      showMessage('You must be logged in as an agent to send a join request.', 'info');
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
          // Optionally, update UI to show pending status for the agent
        } catch (error) {
          console.error("Error sending join request:", error.response?.data || error.message);
          showMessage(`Failed to send join request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Send Request",
      cancelLabel: "Cancel"
    });
  };


  if (!agency) return <div className={`p-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading agency details...</div>;

  const defaultLogo = `https://placehold.co/100x100/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=${agency.name.split(' ').map(n => n[0]).join('').toUpperCase()}`;

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
              {agency.name}
            </h1>
          </div>

          <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
            <div className="flex items-center space-x-4">
              <img
                src={agency.logo_url || defaultLogo}
                alt={`${agency.name} Logo`}
                className={`w-24 h-24 rounded-full object-cover border-2 shadow-sm ${darkMode ? "border-green-700" : "border-green-300"}`}
              />
              <div className="flex flex-col">
                <p className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {agency.name}
                </p>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Real Estate Agency</p>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <p className="flex items-center gap-2"><Mail size={18} /> <strong>Email:</strong> {agency.email}</p>
              <p className="flex items-center gap-2"><Phone size={18} /> <strong>Phone:</strong> {agency.phone}</p>
              {agency.website && (
                <p className="flex items-center gap-2"><Globe size={18} /> <strong>Website:</strong> <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{agency.website}</a></p>
              )}
              {agency.address && (
                <p className="flex items-center gap-2"><MapPin size={18} /> <strong>Address:</strong> {agency.address}</p>
              )}
            </div>

            {agency.description && (
              <div className="space-y-2 pt-4">
                <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"} flex items-center gap-2`}>
                  <FileText size={20} /> Description
                </h2>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>{agency.description}</p>
              </div>
            )}

            {/* Action Buttons for Agency Admins / Super Admins */}
            {(isAgencyAdmin || userRole === 'admin') && (
              <div className="flex flex-wrap gap-4 mt-6">
                <button
                  onClick={() => navigate(`/edit-agency/${agency.agency_id}`)}
                  className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors duration-300 shadow-md flex items-center gap-2"
                >
                  <Edit size={20} /> Edit Agency Details
                </button>
                {isAgencyAdmin && ( // Only agency admin can delete their own agency
                  <button
                    onClick={handleDeleteAgency}
                    className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors duration-300 shadow-md flex items-center gap-2"
                  >
                    <Trash2 size={20} /> Delete My Agency
                  </button>
                )}
              </div>
            )}

            {/* Action Button for Agents not affiliated with this agency */}
            {userRole === 'agent' && !isAgencyAdmin && (
              <div className="mt-6">
                <button
                  onClick={handleRequestToJoin}
                  className={`bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-md flex items-center gap-2`}
                >
                  <UserPlus size={20} /> Request to Join Agency
                </button>
              </div>
            )}
          </div>

          {/* Agency Members Section (Visible to Agency Admin/Super Admin) */}
          {(isAgencyAdmin || userRole === 'admin') && (
            <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"} flex items-center gap-2`}>
                <Users size={20} /> Agency Members ({agencyMembers.length})
              </h2>
              {agencyMembers.length > 0 ? (
                <ul className="space-y-3">
                  {agencyMembers.map((member) => (
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
                      {userId !== member.user_id && ( // Cannot manage self
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
            </div>
          )}

          {/* Pending Requests Section (Visible to Agency Admin/Super Admin) */}
          {(isAgencyAdmin || userRole === 'admin') && (
            <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"} flex items-center gap-2`}>
                <Clock size={20} /> Pending Join Requests ({pendingRequests.length})
              </h2>
              {pendingRequests.length > 0 ? (
                <ul className="space-y-3">
                  {pendingRequests.map((request) => (
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
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Contact {agency.name}</h2>
            <div className="space-y-3 pt-2">
              <a
                href={`tel:${agency.phone}`}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 shadow-md w-full
                  ${darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-500 text-white hover:bg-blue-600"}`}
              >
                📞 Call Agency
              </a>
              <a
                href={`mailto:${agency.email}`}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 shadow-md w-full
                  ${darkMode ? "bg-green-600 text-white hover:bg-green-500" : "bg-green-500 text-white hover:bg-green-600"}`}
              >
                📧 Email Agency
              </a>
              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors duration-300 shadow-md w-full
                    ${darkMode ? "bg-purple-600 text-white hover:bg-purple-500" : "bg-purple-500 text-white hover:bg-purple-600"}`}
                >
                  🌐 Visit Website
                </a>
              )}
            </div>
          </div>

          {/* Location Map Section */}
          <div className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Location Map</h2>
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
          </div>
        </motion.div>
      </div>

      {/* Agency Listings Section */}
      {agencyListings.length > 0 && (
        <motion.div
          className={`max-w-7xl mx-auto mt-12 space-y-6 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className={`text-xl md:text-2xl font-bold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"} flex items-center justify-center gap-2`}>
            <HomeIcon size={24} /> Listings by {agency.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencyListings.map((listing) => (
              <ListingCard key={listing.property_id} listing={listing} darkMode={darkMode} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AgencyProfile;

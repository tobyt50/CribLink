import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import { motion } from "framer-motion";
import { Search, UserPlus, UserX, Hourglass, CheckCircle } from "lucide-react"; // Import Hourglass and CheckCircle
import { useTheme } from "../layouts/AppShell";
import { useMessage } from "../context/MessageContext";
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import AgencyCard from '../components/AgencyCard';
import { useConfirmDialog } from "../context/ConfirmDialogContext";

function Agencies() {
  const [agencies, setAgencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user, updateUser } = useAuth();
  const { showConfirm } = useConfirmDialog();

  // New state for agent's agency memberships (connected, pending, rejected)
  const [agentMemberships, setAgentMemberships] = useState([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  // New state for last admin safeguard
  const [isLastAdminOfOwnAgency, setIsLastAdminOfOwnAgency] = useState(false);
  const [loadingAdminCount, setLoadingAdminCount] = useState(false);
  // New state for favorite agencies
  const [favoriteAgenciesStatus, setFavoriteAgenciesStatus] = useState(new Set());


  const MAX_AGENCY_AFFILIATIONS = 5; // Maximum number of agencies an agent can be affiliated with (connected or pending)


  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      const url = `${API_BASE_URL}/agencies?${params.toString()}`;
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await axiosInstance.get(url, { headers });
      setAgencies(response.data || []);
    } catch (error) {
      let errorMessage = 'Failed to fetch agencies. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showMessage]);

  // Fetch agent's current agency connection status (now comprehensive memberships)
  const fetchAgentMemberships = useCallback(async () => {
    if (!user?.user_id || user?.role === 'client') { // Clients don't have agency memberships here
        setAgentMemberships([]);
        setLoadingMemberships(false);
        return;
    }

    setLoadingMemberships(true);
    try {
        const token = localStorage.getItem('token');
        const response = await axiosInstance.get(`${API_BASE_URL}/agencies/${user.user_id}/agency-memberships`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setAgentMemberships(response.data || []);
    } catch (error) {
        console.error("Error fetching agent agency memberships:", error.response?.data || error.message);
        showMessage("Failed to load your agency affiliations.", "error");
        setAgentMemberships([]);
    } finally {
        setLoadingMemberships(false);
    }
  }, [user?.user_id, user?.role, showMessage]);

  // Fetch count of agency admins for the current user's agency (if they are an admin)
  const fetchAgencyAdminCount = useCallback(async () => {
    if (user?.role === 'agency_admin' && user?.agency_id) {
      setLoadingAdminCount(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axiosInstance.get(`${API_BASE_URL}/agencies/${user.agency_id}/admin-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsLastAdminOfOwnAgency(response.data.admin_count === 1);
      } catch (error) {
        console.error("Error fetching agency admin count:", error.response?.data || error.message);
        showMessage("Failed to verify agency admin status.", "error");
        setIsLastAdminOfOwnAgency(false); // Assume not last admin on error
      } finally {
        setLoadingAdminCount(false);
      }
    } else {
      setIsLastAdminOfOwnAgency(false);
    }
  }, [user?.role, user?.agency_id, showMessage]);

  // Fetch favorite agencies
  const fetchFavoriteAgencies = useCallback(async () => {
    if (!user?.user_id) {
      setFavoriteAgenciesStatus(new Set());
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`${API_BASE_URL}/favourites/agencies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const favoritedIds = new Set(response.data.favourites.map(fav => fav.agency_id));
      setFavoriteAgenciesStatus(favoritedIds);
    } catch (error) {
      console.error("Error fetching favorite agencies:", error.response?.data || error.message);
      // showMessage("Failed to load favorite agencies.", "error"); // Suppress for cleaner UX
      setFavoriteAgenciesStatus(new Set());
    }
  }, [user?.user_id]);


  useEffect(() => {
    fetchAgencies();
  }, [searchTerm, fetchAgencies]);

  useEffect(() => {
    fetchAgentMemberships();
  }, [fetchAgentMemberships, user?.user_id, user?.role]);

  useEffect(() => {
    fetchAgencyAdminCount();
  }, [fetchAgencyAdminCount, user?.role, user?.agency_id]); // Re-run if user role or agency changes

  useEffect(() => {
    fetchFavoriteAgencies();
  }, [fetchFavoriteAgencies, user?.user_id]); // Re-fetch favorites when user changes


  const handleSearch = useCallback((e) => {
    e.preventDefault();
    fetchAgencies();
  }, [fetchAgencies]);

  const handleAgencyClick = (agencyId) => {
    console.log("Clicked agency:", agencyId);
    // Navigate to the agency detail page
    navigate(`/agencies/${agencyId}`);
  };

  // Handler for agent to send a request to join an agency
  const handleConnectToAgency = async (targetAgencyId) => {
    if (user?.role !== 'agent') {
      showMessage("Only agents can connect to agencies.", 'info');
      return;
    }

    // Check if already connected or pending with this specific agency
    const existingAffiliation = agentMemberships.find(m => m.agency_id === targetAgencyId);
    if (existingAffiliation) {
        if (existingAffiliation.request_status === 'pending') {
            showMessage("Your request to join this agency is already pending.", 'info');
        } else if (existingAffiliation.request_status === 'accepted') {
            showMessage("You are already connected to this agency.", 'info');
        } else if (existingAffiliation.request_status === 'rejected') {
            showMessage("Your request to this agency was rejected. You can re-send a request.", 'info');
        }
        return;
    }

    // Check if the user has reached the maximum number of affiliations
    if (agentMemberships.length >= MAX_AGENCY_AFFILIATIONS) {
        showMessage(`You can only be affiliated with a maximum of ${MAX_AGENCY_AFFILIATIONS} agencies (connected or pending requests). Please disconnect from an existing agency to join a new one.`, 'info');
        return;
    }


    showConfirm({
      title: "Connect to Agency",
      message: `Are you sure you want to send a request to join this agency?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axiosInstance.post(
            `${API_BASE_URL}/agencies/request-to-join`,
            { agency_id: targetAgencyId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showMessage(response.data.message, 'success');
          // Update agentMemberships state optimistically
          const joinedAgency = agencies.find(a => a.agency_id === targetAgencyId);
          if (joinedAgency) {
              setAgentMemberships(prev => [
                  ...prev.filter(m => m.agency_id !== targetAgencyId), // Remove old status if exists (e.g., rejected)
                  {
                      agency_id: joinedAgency.agency_id,
                      agency_name: joinedAgency.name,
                      logo_url: joinedAgency.logo_url,
                      request_status: 'pending', // New request is always pending
                      member_status: 'regular', // Default member status
                      joined_at: new Date().toISOString(), // Mock timestamp
                      updated_at: new Date().toISOString(), // Mock timestamp
                  }
              ]);
          }
          // Re-fetch memberships and admin count to ensure state consistency after a change
          fetchAgentMemberships();
          fetchAgencyAdminCount();
        } catch (error) {
          console.error("Error sending agency connection request:", error.response?.data || error.message);
          showMessage(`Failed to send agency connection request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
          fetchAgentMemberships(); // Re-fetch to ensure state consistency
        }
      },
      confirmLabel: "Send Request",
      cancelLabel: "Cancel"
    });
  };

  // Handler for agent or agency admin to disconnect from an agency
  const handleDisconnectFromAgency = async (agencyIdToDisconnect) => {
    if (!user?.user_id || !agencyIdToDisconnect) {
      showMessage("User not identified or agency not specified.", 'info');
      return;
    }

    // Determine if the user is an admin of the agency they are trying to disconnect from
    const isDisconnectingFromOwnAdminAgency = (user.role === 'agency_admin' && user.agency_id === agencyIdToDisconnect);

    // Safeguard for last admin
    if (isDisconnectingFromOwnAdminAgency && isLastAdminOfOwnAgency) {
      showMessage("You cannot disconnect from your agency as you are the last administrator. Please assign another admin first.", 'error');
      return;
    }

    // Find the agency name for the confirmation message
    const agencyToDisconnect = agentMemberships.find(m => m.agency_id === agencyIdToDisconnect) || agencies.find(a => a.agency_id === agencyIdToDisconnect);
    const agencyName = agencyToDisconnect ? agencyToDisconnect.name || agencyToDisconnect.agency_name : 'the agency';

    showConfirm({
      title: "Disconnect from Agency",
      message: `Are you sure you want to disconnect from ${agencyName}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          // This endpoint is for an admin removing a member, but can be reused if the agent removes themselves
          // or if an admin wants to step down (handled by backend logic).
          await axiosInstance.delete(
            `${API_BASE_URL}/agencies/${agencyIdToDisconnect}/members/${user.user_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showMessage('Disconnected from agency successfully.', 'success');
          // Update local state by filtering out the disconnected agency
          setAgentMemberships(prev => prev.filter(m => m.agency_id !== agencyIdToDisconnect));
          // Trigger a global auth change event to ensure user context is fully refreshed
          // This is crucial if an admin steps down and their role changes.
          window.dispatchEvent(new Event("authChange"));
          fetchAgencyAdminCount(); // Re-check admin count after potential role change
        } catch (error) {
          console.error("Error disconnecting from agency:", error.response?.data || error.message);
          showMessage(`Failed to disconnect: ${error.response?.data?.message || 'Please try again.'}`, 'error');
          fetchAgentMemberships(); // Re-fetch to ensure state consistency
        }
      },
      confirmLabel: "Disconnect",
      cancelLabel: "Cancel"
    });
  };

  // New function to handle canceling a pending request
  const handleCancelPendingRequest = async (agencyIdToCancel, agencyName) => {
    if (user?.role !== 'agent' || !user?.user_id || !agencyIdToCancel) {
        showMessage("You are not authorized to cancel this request.", 'info');
        return;
    }

    showConfirm({
        title: "Cancel Pending Request",
        message: `Are you sure you want to cancel your pending request to join ${agencyName}?`,
        onConfirm: async () => {
            try {
                const token = localStorage.getItem('token');
                // Use the existing DELETE endpoint to remove the pending membership
                const response = await axiosInstance.delete(
                    `${API_BASE_URL}/agencies/${agencyIdToCancel}/members/${user.user_id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.status === 200) {
                    showMessage('Pending request cancelled successfully.', 'success');
                    // Update local state by filtering out the cancelled request
                    setAgentMemberships(prev => prev.filter(m => m.agency_id !== agencyIdToCancel));
                    window.dispatchEvent(new Event("authChange")); // Notify AuthContext
                    fetchAgencyAdminCount(); // Re-check admin count
                } else {
                    showMessage('Failed to cancel pending request. Please try again.', 'error');
                }
            } catch (error) {
                console.error("Error canceling pending request:", error.response?.data || error.message);
                showMessage(`Failed to cancel request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
                fetchAgentMemberships(); // Re-fetch to ensure state consistency
            }
        },
        confirmLabel: "Yes, Cancel",
        cancelLabel: "No"
    });
  };

  // Handle adding/removing agency from favorites
  const handleFavoriteToggle = useCallback(async (agencyId, isCurrentlyFavorited) => {
    if (!user?.user_id) {
      showMessage("Please log in to add agencies to favorites.", "info");
      return;
    }

    const token = localStorage.getItem('token');
    try {
      if (isCurrentlyFavorited) {
        await axiosInstance.delete(`${API_BASE_URL}/favourites/agencies/${agencyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavoriteAgenciesStatus(prev => {
          const newState = new Set(prev);
          newState.delete(agencyId);
          return newState;
        });
        showMessage("Agency removed from favorites!", "success");
      } else {
        await axiosInstance.post(`${API_BASE_URL}/favourites/agencies`, { agency_id: agencyId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavoriteAgenciesStatus(prev => new Set(prev).add(agencyId));
        showMessage("Agency added to favorites!", "success");
      }
    } catch (error) {
      console.error("Error toggling favorite agency status:", error.response?.data || error.message);
      showMessage(`Failed to update favorite status: ${error.response?.data?.message || 'Please try again.'}`, "error");
      fetchFavoriteAgencies(); // Re-fetch to ensure UI consistency on error
    }
  }, [user?.user_id, showMessage, fetchFavoriteAgencies]);


  return (
    <>
      <div className={`pt-0 -mt-6 px-4 md:px-8 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <motion.div
          className="text-center max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className={`font-script text-2xl md:text-3xl mb-4 ${
              darkMode ? "text-green-400" : "text-green-700"
            }`}
          >
            Explore Agencies
          </h1>
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-3">
          <form onSubmit={handleSearch} className="relative w-full mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search agencies..."
                    className={`w-full py-2.5 px-3 rounded-2xl shadow-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                      darkMode
                        ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
                        : "bg-white text-gray-900 placeholder-gray-500 focus:ring-green-600"
                    }`}
                  />
                  <button
                    type="submit"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl p-2 shadow-lg
                      ${darkMode ? "bg-green-600 text-white hover:bg-green-700" : "bg-green-600 text-white hover:bg-green-700"}
                    `}
                  >
                    <Search size={18} />
                  </button>
            </form>
            </div>
        </motion.div>

        <motion.div
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {loading || loadingMemberships || loadingAdminCount ? (
            // Loading Skeleton
            [...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"></div>
            ))
          ) : agencies.length > 0 ? (
            agencies.map((agency) => (
              <AgencyCard
                key={agency.agency_id}
                agency={agency}
                onClick={handleAgencyClick}
                isCurrentUserAgent={user?.role === 'agent'}
                isCurrentUserAgencyAdmin={user?.role === 'agency_admin'} // Pass admin status
                currentUserAgencyId={user?.agency_id} // Pass current user's agency ID
                isLastAdminOfOwnAgency={isLastAdminOfOwnAgency} // Pass last admin status
                agentMemberships={agentMemberships} // Pass all memberships
                maxAgencyAffiliations={MAX_AGENCY_AFFILIATIONS} // Pass the limit
                onConnectClick={handleConnectToAgency}
                onDisconnectClick={handleDisconnectFromAgency}
                onCancelRequestClick={handleCancelPendingRequest} // Pass the new handler
                onFavoriteToggle={handleFavoriteToggle} // Pass the new handler
                isFavorited={favoriteAgenciesStatus.has(agency.agency_id)} // Pass favorite status
              />
            ))
          ) : (
            <motion.div
              className={`col-span-full text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No agencies found.
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default Agencies;

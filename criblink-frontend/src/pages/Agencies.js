import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import { motion } from "framer-motion";
import { Search, UserPlus, UserX } from "lucide-react"; // Import UserPlus and UserX
import { useTheme } from "../layouts/AppShell";
import { useMessage } from "../context/MessageContext";
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import AgencyCard from '../components/AgencyCard'; // Import AgencyCard
import { useConfirmDialog } from "../context/ConfirmDialogContext"; // Import useConfirmDialog

function Agencies() {
  const [agencies, setAgencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  // Destructure updateUser instead of setUser from AuthContext
  const { user, updateUser } = useAuth(); 
  const { showConfirm } = useConfirmDialog();


  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    try {
      // Allow all roles to view agencies, but connect/disconnect actions are for agents
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

  useEffect(() => {
    fetchAgencies();
  }, [searchTerm, fetchAgencies]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // Trigger fetchAgencies with the current searchTerm
    fetchAgencies();
  }, [fetchAgencies]);

  const handleAgencyClick = (agencyId) => {
    // You can navigate to an agency details page if needed
    // For now, let's just log it or navigate to a placeholder
    console.log("Clicked agency:", agencyId);
    // navigate(`/agencies/${agencyId}`); // Example navigation
  };

  // Handler for agent to send a request to join an agency
  const handleConnectToAgency = async (targetAgencyId) => {
    if (user?.role !== 'agent') {
      showMessage("Only agents can connect to agencies.", 'info');
      return;
    }
    if (user?.agency_id) {
      showMessage("You are already connected to an agency.", 'info');
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
          // Update user context after successful request using updateUser
          updateUser({
            ...user, // Spread existing user data
            agency_id: targetAgencyId,
            agency_request_status: 'pending'
          });
          fetchAgencies(); // Re-fetch agencies to update card states
        } catch (error) {
          console.error("Error sending agency connection request:", error.response?.data || error.message);
          showMessage(`Failed to send agency connection request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Send Request",
      cancelLabel: "Cancel"
    });
  };

  // Handler for agent to disconnect from their current agency
  const handleDisconnectFromAgency = async () => {
    if (user?.role !== 'agent' || !user?.agency_id) {
      showMessage("You are not connected to an agency or cannot disconnect at this time.", 'info');
      return;
    }

    showConfirm({
      title: "Disconnect from Agency",
      message: `Are you sure you want to disconnect from ${user.agency_name || 'your current agency'}?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          // This endpoint is for an admin removing a member, but can be reused if the agent removes themselves
          await axiosInstance.delete(
            `${API_BASE_URL}/agencies/${user.agency_id}/members/${user.user_id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showMessage('Disconnected from agency successfully.', 'success');
          // Update user context after successful disconnection using updateUser
          updateUser({
            ...user, // Spread existing user data
            agency_id: null,
            agency_name: null,
            agency_role: 'agent', // Reset to default agent role
            agency_request_status: 'none'
          });
          fetchAgencies(); // Re-fetch agencies to update card states
        } catch (error) {
          console.error("Error disconnecting from agency:", error.response?.data || error.message);
          showMessage(`Failed to disconnect: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        }
      },
      confirmLabel: "Disconnect",
      cancelLabel: "Cancel"
    });
  };


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

        {/* Removed "Available Agencies" heading */}
        <motion.div
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-8" /* Added pb-8 for bottom padding */
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
          {loading ? (
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
                currentUserAgencyId={user?.agency_id}
                currentUserAgencyRequestStatus={user?.agency_request_status || 'none'}
                onConnectClick={handleConnectToAgency}
                onDisconnectClick={handleDisconnectFromAgency}
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

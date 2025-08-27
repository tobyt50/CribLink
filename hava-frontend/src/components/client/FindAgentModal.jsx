import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Phone,
  Mail,
  UserPlus,
  Landmark,
  ArrowLeft,
  Hourglass,
  UserRoundCheck,
  CheckCircle,
  UserX,
  EllipsisVertical,
  ArrowRight,
  Users,
  User,
  MessageSquare,
  PlusCircle,
  Trash2,
  Link,
  LogOut,
} from "lucide-react";
import Card from "../ui/Card";
import axiosInstance from "../../api/axiosInstance";
import { useMessage } from "../../context/MessageContext";
import { useAuth } from "../../context/AuthContext";

const FindAgentModal = ({
  isOpen,
  onClose,
  connectedAgents: propConnectedAgents,
  fetchClientDashboardData,
}) => {
  const { darkMode } = useAuth(); // Assuming darkMode is available from useAuth or passed down
  const { showMessage } = useMessage();
  const { user } = useAuth(); // Get authenticated user details
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("find"); // 'connected' or 'find'
  const [allAgents, setAllAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const [selectedAgentForConnection, setSelectedAgentForConnection] =
    useState(null);
  const [selectedAgentConnectionStatus, setSelectedAgentConnectionStatus] =
    useState("none");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Local state for connected agents to manage disconnects without immediate prop mutation
  const [localConnectedAgents, setLocalConnectedAgents] =
    useState(propConnectedAgents);

  const scrollContainerRef = useRef(null);

  // Define inputFieldStyles here so it's accessible within the component
  const inputFieldStyles = `w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
    darkMode
      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
      : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
  }`;

  // Update local connected agents when prop changes
  useEffect(() => {
    setLocalConnectedAgents(propConnectedAgents);
  }, [propConnectedAgents]);

  const fetchAgents = useCallback(
    async (page, search, append = false) => {
      if (!token) return;
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const response = await axiosInstance.get(
          `/clients/all-agents?page=${page}&limit=5&search=${search}`,
          { headers },
        );
        const newAgents = response.data.agents;
        const totalPages = response.data.totalPages;

        // Filter out agents that are already connected or have pending requests
        const alreadyInvolvedAgentIds = new Set(
          localConnectedAgents.map((agent) => agent.user_id),
        );

        // Fetch pending requests separately to accurately filter
        const pendingRequestsRes = await axiosInstance.get(
          `/clients/${user.user_id}/pending-agent-requests`,
          { headers },
        );
        pendingRequestsRes.data.requests.forEach((req) =>
          alreadyInvolvedAgentIds.add(req.agent_id),
        );

        const filteredNewAgents = newAgents.filter(
          (agent) => !alreadyInvolvedAgentIds.has(agent.user_id),
        );

        if (append) {
          setAllAgents((prev) => [...prev, ...filteredNewAgents]);
          setFilteredAgents((prev) => [...prev, ...filteredNewAgents]);
        } else {
          setAllAgents(filteredNewAgents);
          setFilteredAgents(filteredNewAgents);
        }
        setHasMore(page < totalPages);
      } catch (error) {
        console.error("Error fetching agents:", error);
        showMessage("Failed to load agents.", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [token, showMessage, localConnectedAgents, user],
  );

  useEffect(() => {
    if (isOpen && activeTab === "find") {
      setCurrentPage(1); // Reset page when modal opens or tab changes
      setAgentSearchTerm(""); // Clear search term
      fetchAgents(1, "", false); // Initial fetch
    }
  }, [isOpen, activeTab, fetchAgents]);

  const handleAgentSearchChange = (e) => {
    const term = e.target.value;
    setAgentSearchTerm(term);
    setCurrentPage(1); // Reset pagination on new search
    fetchAgents(1, term, false);
  };

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    if (
      scrollHeight - scrollTop <= clientHeight + 50 &&
      hasMore &&
      !isLoading
    ) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (currentPage > 1 && activeTab === "find") {
      fetchAgents(currentPage, agentSearchTerm, true);
    }
  }, [currentPage, activeTab, agentSearchTerm, fetchAgents]);

  const handleSelectAgentForConnection = async (agent) => {
    setSelectedAgentForConnection(agent);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axiosInstance.get(
        `/clients/${user.user_id}/connection-requests/status/${agent.user_id}`,
        { headers },
      );
      setSelectedAgentConnectionStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching agent connection status:", error);
      setSelectedAgentConnectionStatus("none");
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!selectedAgentForConnection || !user) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axiosInstance.post(
        `/clients/${user.user_id}/connection-requests/send-to-agent/${selectedAgentForConnection.user_id}`,
        {},
        { headers },
      );
      showMessage(response.data.message, "success");
      setSelectedAgentConnectionStatus(response.data.status);
      fetchClientDashboardData(); // Refresh dashboard data
      // Re-fetch agents for the "Find Agents" tab to update status
      fetchAgents(1, agentSearchTerm, false);
    } catch (error) {
      console.error("Error sending connection request:", error);
      showMessage(
        error.response?.data?.message || "Failed to send connection request.",
        "error",
      );
    }
  };

  const handleDisconnectAgent = async (agentId) => {
    if (!user) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      // Assuming a backend endpoint for disconnecting
      await axiosInstance.post(
        `/clients/${user.user_id}/disconnect-agent/${agentId}`,
        {},
        { headers },
      );
      showMessage("Disconnected from agent successfully!", "success");
      fetchClientDashboardData(); // Refresh dashboard data
      setLocalConnectedAgents((prev) =>
        prev.filter((agent) => agent.user_id !== agentId),
      ); // Optimistic update
      // Re-fetch agents for the "Find Agents" tab to make this agent available again
      fetchAgents(1, agentSearchTerm, false);
    } catch (error) {
      console.error("Error disconnecting from agent:", error);
      showMessage(
        error.response?.data?.message || "Failed to disconnect from agent.",
        "error",
      );
    }
  };

  const handleCancelConnectionRequest = async (agentId) => {
    if (!user) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      // Find the request ID for the outgoing pending request to this agent
      const pendingRequestsRes = await axiosInstance.get(
        `/clients/${user.user_id}/pending-agent-requests`,
        { headers },
      );
      const outgoingRequest = pendingRequestsRes.data.requests.find(
        (req) => req.agent_id === agentId && req.is_outgoing,
      );

      if (outgoingRequest) {
        await axiosInstance.post(
          `/clients/${user.user_id}/connection-requests/${outgoingRequest.request_id}/reject-from-agent`,
          {},
          { headers },
        );
        showMessage("Connection request cancelled successfully!", "success");
        fetchClientDashboardData(); // Refresh dashboard data
        // Re-fetch agents for the "Find Agents" tab to update status
        fetchAgents(1, agentSearchTerm, false);
      } else {
        showMessage("Outgoing request not found to cancel.", "error");
      }
    } catch (error) {
      console.error("Error cancelling connection request:", error);
      showMessage(
        error.response?.data?.message || "Failed to cancel connection request.",
        "error",
      );
    }
  };

  const renderConnectionButton = () => {
    const isAlreadyConnected = localConnectedAgents.some(
      (a) => a.user_id === selectedAgentForConnection.user_id,
    );

    if (isAlreadyConnected) {
      return (
        <button
          className="w-full py-2 bg-green-600 text-white font-medium rounded-xl opacity-50 cursor-not-allowed"
          disabled
        >
          <CheckCircle size={20} className="inline-block mr-2" /> Connected
        </button>
      );
    }

    switch (selectedAgentConnectionStatus) {
      case "pending_sent":
        return (
          <button
            className="w-full py-2 bg-yellow-600 text-white font-medium rounded-xl opacity-50 cursor-not-allowed"
            disabled
          >
            <Hourglass size={20} className="inline-block mr-2" /> Request Sent
          </button>
        );
      case "pending_received":
        return (
          <button
            className="w-full py-2 bg-blue-600 text-white font-medium rounded-xl opacity-50 cursor-not-allowed"
            disabled
          >
            <UserRoundCheck size={20} className="inline-block mr-2" /> Incoming
            Request
          </button>
        );
      case "none":
      case "rejected":
        return (
          <button
            onClick={handleSendConnectionRequest}
            className="w-full py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
          >
            <UserPlus size={20} className="inline-block mr-2" /> Connect with
            this Agent
          </button>
        );
      default:
        return null;
    }
  };

  const renderConnectedAgentsTab = () => (
    <div className="space-y-4">
      {localConnectedAgents.length > 0 ? (
        <ul className="space-y-3">
          {localConnectedAgents.map((agent) => (
            <li
              key={agent.user_id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200
                ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
            >
              <div className="flex items-center gap-3">
                {agent.profile_picture_url ? (
                  <img
                    src={agent.profile_picture_url}
                    alt={agent.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User
                    size={24}
                    className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  />
                )}
                <div>
                  <p
                    className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}
                  >
                    {agent.full_name}
                  </p>
                  {agent.agency_name && (
                    <p
                      className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {agent.agency_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="relative group">
                {" "}
                {/* Added group for hover effect */}
                <EllipsisVertical size={20} className="cursor-pointer" />
                {/* Dropdown for Disconnect option */}
                <div
                  className={`absolute right-0 mt-2 w-32 rounded-md shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
                    ${darkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"}`}
                >
                  <button
                    onClick={() => handleDisconnectAgent(agent.user_id)}
                    className={`flex items-center w-full px-4 py-2 text-left text-sm
                      hover:${darkMode ? "bg-red-600" : "bg-red-100"} rounded-md`}
                  >
                    <Trash2 size={16} className="inline-block mr-2" />{" "}
                    Disconnect
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          You are not connected to any agents yet.
        </p>
      )}
    </div>
  );

  const renderFindAgentsTab = () => (
    <div className="space-y-4">
      <div className="relative mb-4">
        <Search
          size={20}
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        />
        <input
          type="text"
          placeholder="Search agents by name, email, or agency..."
          value={agentSearchTerm}
          onChange={handleAgentSearchChange}
          className={`${inputFieldStyles} pl-10`}
        />
        {agentSearchTerm && (
          <button
            type="button"
            onClick={() => {
              setAgentSearchTerm("");
              fetchAgents(1, "", false);
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {selectedAgentForConnection ? (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <button
            type="button"
            onClick={() => setSelectedAgentForConnection(null)}
            className={`flex items-center text-sm font-medium ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition`}
          >
            <ArrowLeft size={16} className="mr-1" /> Back to agent list
          </button>
          <Card className="p-4 flex flex-col items-center text-center">
            {selectedAgentForConnection.profile_picture_url ? (
              <img
                src={selectedAgentForConnection.profile_picture_url}
                alt={selectedAgentForConnection.full_name}
                className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-green-500"
              />
            ) : (
              <User
                size={64}
                className={`mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              />
            )}
            <h3
              className={`text-xl font-bold ${darkMode ? "text-gray-100" : "text-gray-800"}`}
            >
              {selectedAgentForConnection.full_name}
            </h3>
            <p
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              {selectedAgentForConnection.email}
            </p>
            {selectedAgentForConnection.phone && (
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                <Phone size={14} className="inline-block mr-1" />{" "}
                {selectedAgentForConnection.phone}
              </p>
            )}
            {selectedAgentForConnection.agency_name && (
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                <Landmark size={14} className="inline-block mr-1" />{" "}
                {selectedAgentForConnection.agency_name}
              </p>
            )}
            {selectedAgentForConnection.bio && (
              <p
                className={`text-sm italic mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                "{selectedAgentForConnection.bio}"
              </p>
            )}
            <div className="mt-4 w-full">{renderConnectionButton()}</div>
          </Card>
        </motion.div>
      ) : (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="space-y-3 max-h-[40vh] overflow-y-auto pr-2" // Added pr-2 for scrollbar spacing
        >
          {filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => (
              <li
                key={agent.user_id}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                  ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
                onClick={() => handleSelectAgentForConnection(agent)}
              >
                <div className="flex items-center gap-3">
                  {agent.profile_picture_url ? (
                    <img
                      src={agent.profile_picture_url}
                      alt={agent.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User
                      size={24}
                      className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    />
                  )}
                  <div>
                    <p
                      className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}
                    >
                      {agent.full_name}
                    </p>
                    {agent.agency_name && (
                      <p
                        className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {agent.agency_name}
                      </p>
                    )}
                  </div>
                </div>
                {agent.connection_status === "pending_sent" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelConnectionRequest(agent.user_id);
                    }}
                    className="flex items-center text-sm text-yellow-500 hover:text-yellow-600"
                    title="Cancel Pending Request"
                  >
                    <Hourglass size={16} className="mr-1" /> Pending
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`p-2 rounded-full ${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-300"}`}
                    title="View Agent"
                  >
                    <ArrowRight size={20} />
                  </button>
                )}
              </li>
            ))
          ) : (
            <p
              className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              No agents found matching your search.
            </p>
          )}
          {isLoading && (
            <p
              className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Loading more agents...
            </p>
          )}
          {!hasMore && !isLoading && filteredAgents.length > 0 && (
            <p
              className={`text-center text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}
            >
              End of list.
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        onClick={onClose}
      >
        <motion.div
          className={`relative ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"} rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
          initial={{ y: "-100vh", opacity: 0 }}
          animate={{ y: "0", opacity: 1 }}
          exit={{ y: "100vh", opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            <X size={20} />
          </button>
          <h2
            className={`text-2xl font-bold mb-6 text-center ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Manage Agents
          </h2>

          {/* Tabs */}
          <div
            className={`flex border-b ${darkMode ? "border-gray-700" : "border-gray-200"} mb-4`}
          >
            <button
              className={`flex-1 py-2 text-center font-medium ${activeTab === "connected" ? `${darkMode ? "text-green-400 border-green-400" : "text-green-700 border-green-700"} border-b-2` : `${darkMode ? "text-gray-400" : "text-gray-600"} hover:${darkMode ? "text-gray-300" : "text-gray-800"}`}`}
              onClick={() => {
                setActiveTab("connected");
                setSelectedAgentForConnection(null); // Clear selection when switching tabs
                setAgentSearchTerm(""); // Clear search when switching tabs
              }}
            >
              <Users size={18} className="inline-block mr-2" /> Connected Agents
            </button>
            <button
              className={`flex-1 py-2 text-center font-medium ${activeTab === "find" ? `${darkMode ? "text-green-400 border-green-400" : "text-green-700 border-green-700"} border-b-2` : `${darkMode ? "text-gray-400" : "text-gray-600"} hover:${darkMode ? "text-gray-300" : "text-gray-800"}`}`}
              onClick={() => {
                setActiveTab("find");
                setSelectedAgentForConnection(null); // Clear selection when switching tabs
                setAgentSearchTerm(""); // Clear search when switching tabs
              }}
            >
              <Search size={18} className="inline-block mr-2" /> Find Agents
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "connected"
              ? renderConnectedAgentsTab()
              : renderFindAgentsTab()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FindAgentModal;

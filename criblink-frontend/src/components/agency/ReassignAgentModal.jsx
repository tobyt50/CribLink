import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCheck, Search } from "lucide-react";
import API_BASE_URL from "../../config";
import { useMessage } from "../../context/MessageContext";

const ReassignAgentModal = ({
  isOpen,
  onClose,
  darkMode,
  conversationId,
  currentAssignedAgentId,
  onReassign,
}) => {
  const { showMessage } = useMessage();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Function to get the agency ID from the token
  const getAgencyIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).agency_id;
    } catch (error) {
      console.error("Error decoding token for agency ID:", error);
      return null;
    }
  };

  const agencyId = getAgencyIdFromToken();

  useEffect(() => {
    if (!isOpen || !agencyId) {
      setAgents([]);
      setSelectedAgent(null);
      setSearchTerm("");
      return;
    }

    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        const token = localStorage.getItem("token");
        // Fetch only 'agent' role members from the agency
        const res = await fetch(
          `${API_BASE_URL}/agencies/${agencyId}/agents?role=agent`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setAgents(data);
        // Pre-select the currently assigned agent if available
        const currentAgent = data.find(
          (agent) => agent.user_id === currentAssignedAgentId,
        );
        if (currentAgent) {
          setSelectedAgent(currentAgent);
        }
      } catch (err) {
        showMessage("Failed to fetch agents for reassignment.", "error");
        console.error("Error fetching agents:", err);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [isOpen, agencyId, showMessage, currentAssignedAgentId]);

  if (!isOpen) return null;

  const handleReassignClick = () => {
    if (!selectedAgent) {
      showMessage("Please select an agent to reassign to.", "warning");
      return;
    }
    onReassign(conversationId, selectedAgent.user_id);
    onClose();
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose} // Close when clicking on the overlay
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full max-w-md p-6 rounded-xl shadow-xl ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-2 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
        >
          <X size={20} />
        </button>
        <h3
          className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
        >
          Reassign Inquiry
        </h3>

        <div
          className={`relative mb-4 flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          <div className="relative flex-grow">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="Search agents by name or email..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 ${
                darkMode
                  ? "bg-gray-700 focus:ring-green-500"
                  : "bg-gray-100 focus:ring-green-600"
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loadingAgents ? (
          <p
            className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-center`}
          >
            Loading agents...
          </p>
        ) : filteredAgents.length === 0 ? (
          <p
            className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-center`}
          >
            {searchTerm
              ? "No agents found matching your search."
              : "No agents available in your agency."}
          </p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            {filteredAgents.map((agent) => {
              const isSelected =
                selectedAgent && selectedAgent.user_id === agent.user_id;
              return (
                <div
                  key={agent.user_id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`flex items-center p-3 rounded-xl transition-colors duration-200 cursor-pointer ${
                    isSelected
                      ? darkMode
                        ? "bg-green-700 text-white"
                        : "bg-green-100 text-green-800"
                      : darkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <label
                    className={`relative flex-shrink-0 h-5 w-5 rounded-full border-2 ${
                      isSelected
                        ? darkMode
                          ? "border-green-500 bg-green-600"
                          : "border-green-600 bg-green-600"
                        : darkMode
                          ? "border-gray-500"
                          : "border-gray-400"
                    } flex items-center justify-center mr-3 transition-colors duration-200 cursor-pointer`}
                  >
                    <input
                      type="radio"
                      name="agent"
                      value={agent.user_id}
                      checked={isSelected}
                      onChange={() => setSelectedAgent(agent)}
                      className="absolute h-full w-full opacity-0 cursor-pointer"
                    />
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </label>
                  <span className="font-semibold">{agent.full_name}</span>
                  <span
                    className={`ml-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                  >
                    {agent.email}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={handleReassignClick}
          disabled={!selectedAgent || loadingAgents}
          className={`mt-6 w-full py-2 px-4 rounded-xl font-semibold transition-colors duration-300 ${
            !selectedAgent || loadingAgents
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          Reassign Inquiry
        </button>
      </motion.div>
    </div>
  );
};

export default ReassignAgentModal;

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  UserCheck,
  Share2,
  Copy,
  Facebook,
  Twitter,
  Search,
} from "lucide-react";
import axiosInstance from "./../api/axiosInstance";
import API_BASE_URL from "./../config";
import { useMessage } from "./../context/MessageContext";

const ShareModal = ({
  isOpen,
  onClose,
  clients,
  listing,
  darkMode,
  currentAgentId,
  userRole,
}) => {
  const { showMessage } = useMessage();
  const [selectedClients, setSelectedClients] = useState([]);
  const [activeTab, setActiveTab] = useState(
    userRole === "agent" ? "recommend" : "share",
  );
  const [searchTerm, setSearchTerm] = useState("");
  // isBatchSelectMode state removed as per request

  if (!isOpen) return null;

  // Function to handle recommending a listing to multiple clients
  const handleRecommendListing = async () => {
    if (
      !listing ||
      !listing.property_id ||
      !currentAgentId ||
      selectedClients.length === 0
    ) {
      showMessage("Please select at least one client to recommend.", "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Authentication required to recommend listings.", "error");
      return;
    }

    let successCount = 0;
    let failCount = 0;
    const failedClients = [];

    for (const client of selectedClients) {
      try {
        const response = await axiosInstance.post(
          `${API_BASE_URL}/clients/${client.user_id}/recommendations/${listing.property_id}`,
          {}, // No body needed for this endpoint
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.status === 201 || response.status === 200) {
          // Backend might return 200 if already recommended
          successCount++;
        } else {
          failCount++;
          failedClients.push(client.full_name);
        }
      } catch (error) {
        console.error(
          `Error recommending to ${client.full_name}:`,
          error.response?.data || error.message,
        );
        failCount++;
        failedClients.push(client.full_name);
      }
    }

    if (successCount > 0 && failCount === 0) {
      showMessage(
        "Listing recommended to all selected clients successfully!",
        "success",
      );
    } else if (successCount > 0 && failCount > 0) {
      showMessage(
        `Recommended to ${successCount} clients. Failed for: ${failedClients.join(", ")}.`,
        "warning",
        7000,
      );
    } else {
      showMessage(
        "Failed to recommend listing to any selected client. Please try again.",
        "error",
      );
    }
    onClose(); // Close modal after attempting recommendations
  };

  const currentListingUrl = listing
    ? `${window.location.origin}/listings/${listing.property_id}`
    : window.location.href;
  const shareTitle = listing
    ? `Check out this amazing property: ${listing.title}!`
    : "Check out this amazing property!";

  const handleCopyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(currentListingUrl)
        .then(() => {
          showMessage("Link copied to clipboard!", "success", 3000);
        })
        .catch((err) => {
          console.error("Failed to copy link using clipboard API: ", err);
          const el = document.createElement("textarea");
          el.value = currentListingUrl;
          document.body.appendChild(el);
          el.select();
          try {
            document.execCommand("copy");
            showMessage("Link copied to clipboard (fallback)!", "info", 3000);
          } catch (execErr) {
            console.error("Fallback copy failed: ", execErr);
            showMessage("Could not copy link to clipboard.", "error", 3000);
          } finally {
            document.body.removeChild(el);
          }
        });
    } else {
      const el = document.createElement("textarea");
      el.value = currentListingUrl;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
        showMessage("Link copied to clipboard (fallback)!", "info", 3000);
      } catch (execErr) {
        console.error("Fallback copy failed: ", execErr);
        showMessage("Could not copy link to clipboard.", "error", 3000);
      } finally {
        document.body.removeChild(el);
      }
    }
  };

  // Handler for *checkbox* click - always toggles multiple selections
  const handleCheckboxClick = (client, e) => {
    e.stopPropagation(); // Prevent the parent div's onClick from firing
    setSelectedClients((prevSelected) => {
      if (prevSelected.some((c) => c.user_id === client.user_id)) {
        return prevSelected.filter((c) => c.user_id !== client.user_id);
      } else {
        return [...prevSelected, client];
      }
    });
  };

  // Handler for *row* click (not on checkbox) - always singular selection
  const handleRowClick = (client) => {
    // If this client is already the only selected one, deselect it
    if (
      selectedClients.some((c) => c.user_id === client.user_id) &&
      selectedClients.length === 1
    ) {
      setSelectedClients([]);
    } else {
      // Otherwise, select only this client (clearing others if any)
      setSelectedClients([client]);
    }
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(
    (client) =>
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full max-w-md p-6 rounded-xl shadow-xl ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}
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
          {activeTab === "recommend" ? "Recommend Listing" : "Share Listing"}
        </h3>

        {/* Tabs */}
        <div
          className={`flex mb-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          {userRole === "agent" && (
            <button
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-200 ${
                activeTab === "recommend"
                  ? darkMode
                    ? "text-green-400 border-b-2 border-green-400"
                    : "text-green-700 border-b-2 border-green-700"
                  : darkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => {
                setActiveTab("recommend");
                setSelectedClients([]); // Clear selection when switching to recommend tab
              }}
            >
              <UserCheck size={18} className="inline-block mr-2" /> Recommend to
              Client
            </button>
          )}
          <button
            className={`flex-1 py-2 text-center font-semibold transition-colors duration-200 ${
              activeTab === "share"
                ? darkMode
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-green-700 border-b-2 border-green-700"
                : darkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-600 hover:text-gray-900"
            }`}
            onClick={() => {
              setActiveTab("share");
              setSelectedClients([]); // Clear selection when switching to share tab
            }}
          >
            <Share2 size={18} className="inline-block mr-2" /> Share Publicly
          </button>
        </div>

        {activeTab === "recommend" && userRole === "agent" && (
          <div>
            {/* Search Input */}
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
                  placeholder="Search clients by name or email..."
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

            {filteredClients.length === 0 ? (
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {searchTerm
                  ? "No clients found matching your search."
                  : "You have no active clients to recommend this listing to."}
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                {filteredClients.map((client) => {
                  const isSelected = selectedClients.some(
                    (c) => c.user_id === client.user_id,
                  );
                  return (
                    <div
                      key={client.user_id}
                      onClick={() => handleRowClick(client)} // Row click for singular selection
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
                      {/* Custom Round Checkbox - always clickable for multi-select */}
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
                        onClick={(e) => handleCheckboxClick(client, e)} // Checkbox click for multi-select
                      >
                        <input
                          type="checkbox"
                          name="client"
                          value={client.user_id}
                          checked={isSelected}
                          onChange={() => {}} // onChange is handled by the label's onClick
                          className="absolute h-full w-full opacity-0 cursor-pointer" // This input is hidden, only for state management
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
                      <span className="font-semibold">{client.full_name}</span>
                      <span
                        className={`ml-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-500"}`}
                      >
                        {client.email}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleRecommendListing}
              disabled={selectedClients.length === 0}
              className={`mt-6 w-full py-2 px-4 rounded-xl font-semibold transition-colors duration-300 ${
                selectedClients.length === 0
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              Recommend Listing
            </button>
          </div>
        )}

        {activeTab === "share" && (
          <div className="space-y-4">
            <button
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors duration-300 shadow-md w-full
                ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
            >
              <Copy size={18} /> Copy Link
            </button>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentListingUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors duration-300 shadow-md w-full"
            >
              <Facebook size={18} /> Share on Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentListingUrl)}&text=${encodeURIComponent(shareTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition-colors duration-300 shadow-md w-full"
            >
              <Twitter size={18} /> Share on X
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + currentListingUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors duration-300 shadow-md w-full"
            >
              <span className="font-bold text-lg">WhatsApp</span>
            </a>
            <p
              className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              (Direct sharing to Instagram posts is not supported via web
              links.)
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ShareModal;

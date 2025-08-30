import {
    ArrowDownIcon,
    ArrowUpIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    Building,
    Clock,
    MessageSquare,
    RefreshCw
} from "lucide-react"; // Added icons for mobile view
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ClientSidebar from "../../components/client/Sidebar";
import ClientInquiryModal from "../../components/ClientInquiryModal";
import API_BASE_URL from "../../config";
import { useConfirmDialog } from "../../context/ConfirmDialogContext";
import { useMessage } from "../../context/MessageContext";
import { useSidebarState } from "../../hooks/useSidebarState";
import { useTheme } from "../../layouts/AppShell";
import socket from "../../socket";

// Skeleton component for ClientInquiries page
const ClientInquiriesSkeleton = ({ darkMode }) => (
  <div className={`animate-pulse space-y-4`}>
    {/* Content Skeleton (mimicking graphical view for simplicity) */}
    <div className="space-y-4">
      {[...Array(5)].map(
        (
          _,
          i, // 5 skeleton cards
        ) => (
          <div
            key={i}
            className={`p-4 rounded-xl shadow-md h-48 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full mr-4 ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
                ></div>
                <div
                  className={`h-6 w-32 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
                ></div>
              </div>
              <div
                className={`h-6 w-16 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
              ></div>
            </div>
            <div className="space-y-2">
              <div
                className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
              ></div>
              <div
                className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
              ></div>
              <div
                className={`h-4 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
              ></div>
            </div>
            <div className="flex justify-end mt-3">
              <div
                className={`h-8 w-24 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
              ></div>
            </div>
          </div>
        ),
      )}
    </div>

    {/* Pagination Skeleton */}
    <div className="flex justify-center items-center space-x-4 mt-4">
      <div
        className={`h-8 w-20 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
      ></div>
      <div
        className={`h-4 w-24 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
      ></div>
      <div
        className={`h-8 w-20 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
      ></div>
    </div>
  </div>
);

const ClientInquiries = () => {
  const location = useLocation();

  const handleBack = () => {
    const fromAuthPage =
      location.key === "default" || // direct load (no history)
      location.state?.fromAuth ||
      ["/signin", "/signup"].includes(document.referrer.split("/").pop());

    if (fromAuthPage) {
      // if last page was sign in/up, go to home or dashboard instead
      navigate("/");
    } else {
      navigate(-1);
    }
  };
  const [groupedConversations, setGroupedConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("last_message_timestamp");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalConversations, setTotalConversations] = useState(0);
  const limit = 10;
  const {
    isMobile,
    isSidebarOpen,
    setIsSidebarOpen,
    isCollapsed,
    setIsCollapsed,
  } = useSidebarState();
  const [activeSection, setActiveSection] = useState("client-inquiries");
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const [isClientInquiryModalOpen, setIsClientInquiryModalOpen] =
    useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state

  // State for expanded profile picture
  const [isProfilePicExpanded, setIsProfilePicExpanded] = useState(false);
  const [expandedProfilePicUrl, setExpandedProfilePicUrl] = useState("");
  const [expandedProfilePicName, setExpandedProfilePicName] = useState("");
  const profilePicRef = useRef(null);

  const getClientUserId = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).userId;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }, []);

  const clientUserId = getClientUserId();

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return groupedConversations.find(
      (conv) => conv.id === selectedConversationId,
    );
  }, [selectedConversationId, groupedConversations]);

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true); // Set loading to true
    const params = new URLSearchParams({
      search,
      sort: sortKey,
      direction: sortDirection,
      page,
      limit,
    });
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showMessage("Authentication token not found. Please login.", "error");
        navigate("/signin");
        return;
      }
      const res = await fetch(`${API_BASE_URL}/inquiries/client?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setGroupedConversations(data.inquiries || []);
      setTotalConversations(data.total);
    } catch (err) {
      console.error("Failed to fetch inquiries:", err);
      showMessage("Failed to fetch inquiries. Please try again.", "error");
    } finally {
      setIsLoading(false); // Set loading to false
    }
  }, [search, page, sortKey, sortDirection, showMessage, navigate]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Effect to handle clicks outside the expanded profile picture
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profilePicRef.current &&
        !profilePicRef.current.contains(event.target)
      ) {
        setIsProfilePicExpanded(false);
      }
    };

    if (isProfilePicExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfilePicExpanded]);

  // Real-time functionality with sockets
  useEffect(() => {
    if (!socket.connected) socket.connect();

    groupedConversations.forEach((conv) =>
      socket.emit("join_conversation", conv.id),
    );

    const handleNewMessage = (newMessage) => {
      setGroupedConversations((prev) => {
        let conversationExists = false;
        const updatedConversations = prev.map((conv) => {
          if (conv.id === newMessage.conversationId) {
            conversationExists = true;
            if (
              conv.messages.some(
                (msg) => msg.inquiry_id === newMessage.inquiryId,
              )
            )
              return conv;

            const updatedConv = {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  ...newMessage,
                  sender:
                    newMessage.senderId === conv.agent_id ? "Agent" : "Client",
                },
              ],
              lastMessage: newMessage.message,
              lastMessageTimestamp: newMessage.timestamp,
              lastMessageSenderId: newMessage.senderId,
              // Increment unread count only if the message is from the agent AND client is NOT the sender
              unreadCount:
                newMessage.senderId === conv.agent_id &&
                newMessage.senderId !== clientUserId
                  ? conv.unreadCount + 1
                  : conv.unreadCount,
            };

            return updatedConv;
          }
          return conv;
        });
        if (!conversationExists) fetchInquiries();
        return updatedConversations.sort(
          (a, b) =>
            new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp),
        );
      });
    };

    const handleReadAck = ({ conversationId, readerId, role }) => {
      if (readerId === clientUserId && role === "client") {
        setGroupedConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.sender_id === conv.agent_id
                    ? { ...msg, read: true }
                    : msg,
                ),
                unreadCount: 0, // Clear unread count when current user reads
              };
            }
            return conv;
          }),
        );
        if (
          selectedConversation &&
          selectedConversation.id === conversationId
        ) {
          setSelectedConversationId((prevId) => prevId);
        }
      } else if (role === "agent") {
        setGroupedConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.sender_id === clientUserId ? { ...msg, read: true } : msg,
                ),
              };
            }
            return conv;
          }),
        );
        if (
          selectedConversation &&
          selectedConversation.id === conversationId
        ) {
          setSelectedConversationId((prevId) => prevId);
        }
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_read_ack", handleReadAck);
    socket.on("conversation_deleted", () => fetchInquiries());
    socket.on("inquiry_list_changed", () => fetchInquiries());

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_read_ack", handleReadAck);
      socket.off("conversation_deleted");
      socket.off("inquiry_list_changed");
    };
  }, [
    groupedConversations,
    clientUserId,
    fetchInquiries,
    openedConversationId,
    selectedConversationId,
    selectedConversation,
  ]);

  const handleSortClick = (key) => {
    setSortDirection(
      sortKey === key && sortDirection === "asc" ? "desc" : "asc",
    );
    setSortKey(key);
    setPage(1);
  };

  const renderSortIcon = (key) =>
    sortKey === key ? (
      sortDirection === "asc" ? (
        <ArrowUpIcon
          className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`}
        />
      ) : (
        <ArrowDownIcon
          className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`}
        />
      )
    ) : (
      <ArrowDownIcon
        className={`h-4 w-4 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`}
      />
    );

  const handleViewConversation = useCallback(
    async (conversation) => {
      setSelectedConversationId(conversation.id);
      setIsClientInquiryModalOpen(true);
      setOpenedConversationId(conversation.id); // Set the conversation as opened

      // Only mark as read if there are unread messages. Status remains "New Message" until client sends reply.
      if (conversation.unreadCount > 0) {
        const token = localStorage.getItem("token");
        try {
          await fetch(
            `${API_BASE_URL}/inquiries/client/mark-read/${conversation.id}`,
            { method: "PUT", headers: { Authorization: `Bearer ${token}` } },
          );
          socket.emit("message_read", {
            conversationId: conversation.id,
            userId: clientUserId,
            role: "client",
          });

          // Optimistically update the unreadCount to 0, but status remains 'New Message'
          setGroupedConversations((prev) =>
            prev.map((c) =>
              c.id === conversation.id ? { ...c, unreadCount: 0 } : c,
            ),
          );
        } catch (error) {
          console.error("Failed to mark messages as read:", error);
          showMessage("Failed to mark messages as read.", "error");
        }
      }
    },
    [clientUserId, showMessage],
  );

  const handleDeleteInquiry = useCallback(async () => {
    if (!selectedConversation) return;
    showConfirm({
      title: "Delete Conversation",
      message: `Are you sure you want to delete this conversation with ${selectedConversation.agentName}? This is irreversible.`,
      onConfirm: async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}/inquiries/client/delete-conversation/${selectedConversation.id}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          showMessage("Conversation deleted successfully.", "success");
          setIsClientInquiryModalOpen(false);
          setOpenedConversationId(null); // Clear opened conversation ID
          fetchInquiries();
        } else {
          showMessage("Failed to delete conversation.", "error");
        }
      },
    });
  }, [selectedConversation, showConfirm, showMessage, fetchInquiries]);

  const handleSendMessageToConversation = useCallback(
    async (conversationId, messageText, guestDetails = {}) => {
      const token = localStorage.getItem("token");
      const recipientId = selectedConversation?.agent_id;

      if (!conversationId) {
        const payload = {
          message_content: messageText,
          agent_id: recipientId,
          property_id: selectedConversation?.property_id,
          name: guestDetails.name,
          email: guestDetails.email,
          phone: guestDetails.phone,
        };
        try {
          const res = await fetch(`${API_BASE_URL}/inquiries`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const newInquiry = await res.json();
            showMessage("Inquiry sent successfully!", "success");
          } else {
            const errorData = await res.json();
            showMessage(errorData.error || "Failed to send inquiry.", "error");
          }
        } catch (error) {
          console.error("Error sending initial inquiry:", error);
          showMessage(
            "Failed to send initial inquiry due to network error.",
            "error",
          );
        }
      } else {
        // Existing conversation reply
        await fetch(`${API_BASE_URL}/inquiries/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            property_id: selectedConversation?.property_id,
            message_content: messageText,
            recipient_id: recipientId,
            message_type: "client_reply",
          }),
        });

        // Add call to mark conversation as responded by client
        try {
          await fetch(
            `${API_BASE_URL}/inquiries/client/mark-responded/${conversationId}`,
            {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          // Optimistically update local state to 'Responded' after sending a message
          setGroupedConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId ? { ...c, is_client_responded: true } : c,
            ),
          );
        } catch (error) {
          console.error("Failed to mark conversation as responded:", error);
        }
      }
    },
    [selectedConversation, showMessage],
  );

  const totalPages = Math.ceil(totalConversations / limit);
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  const getInitial = (name) => {
    const safeName = String(name || "");
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : "N/A";
  };

  const handleProfilePicClick = (url, name) => {
    setExpandedProfilePicUrl(url);
    setExpandedProfilePicName(name);
    setIsProfilePicExpanded(true);
  };

  return (
    <div
      className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-0 md:px-0 min-h-screen flex flex-col`}
    >
      <button
        onClick={handleBack}
        aria-label="Go back"
        className={`absolute left-4 mt-5 p-2 rounded-lg shadow-sm transition hover:scale-105
    ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}
      >
        <ArrowLeft size={20} />
      </button>

      <ClientSidebar
        collapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <motion.div
        key={isMobile ? "mobile" : "desktop"}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3 }}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
      >
        <div className="flex items-center justify-center mb-4 md:hidden">
          <h1
            className={`text-2xl font-extrabold ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Inquiries
          </h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1
            className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Inquiries
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${isMobile ? "" : "rounded-3xl p-6 shadow"} space-y-4 max-w-full ${isMobile ? "" : darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search..."
              className={`w-full md:w-1/3 py-2 px-4 border rounded-xl h-10 focus:outline-none focus:border-transparent focus:ring-1 ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 focus:ring-600"}`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {/* Mobile: Refresh and Sort buttons side-by-side */}
            {isMobile && (
              <div className="flex gap-4 w-full">
                <button
                  onClick={fetchInquiries}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 w-1/2 ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                >
                  <RefreshCw size={16} /> Refresh
                </button>
                <button
                  onClick={() => handleSortClick("last_message_timestamp")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 w-1/2 ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                >
                  Sort by Date {renderSortIcon("last_message_timestamp")}
                </button>
              </div>
            )}
            {/* Desktop: Refresh button (already there) */}
            {!isMobile && (
              <button
                onClick={fetchInquiries}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
              >
                <RefreshCw size={16} /> Refresh
              </button>
            )}
          </div>
          {isLoading ? ( // Conditionally render skeleton when loading
            <ClientInquiriesSkeleton darkMode={darkMode} />
          ) : isMobile ? (
            // Mobile-friendly list view
            <div className="space-y-4">
              {groupedConversations.length > 0 ? (
                groupedConversations.map((conv) => {
                  // Determine if the conversation has unread messages FOR THE CLIENT
                  const hasUnreadMessagesForClient = conv.messages.some(
                    (msg) => msg.sender_id === conv.agent_id && !msg.read,
                  );

                  // Determine the sender of the very last message in the conversation
                  const lastMessageSender =
                    conv.messages.length > 0
                      ? conv.messages[conv.messages.length - 1].sender
                      : null;

                  // Determine display status based on the last message sender
                  let displayStatus;
                  if (lastMessageSender === "Client") {
                    displayStatus = "Responded";
                  } else {
                    displayStatus = "New Message";
                  }

                  // Text bolding logic: bold if new message status AND modal is not open for this conversation
                  const isBold =
                    hasUnreadMessagesForClient &&
                    openedConversationId !== conv.id;

                  return (
                    <div
                      key={conv.id}
                      className={`p-4 rounded-xl shadow-md cursor-pointer relative ${darkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-800"} border-l-4 border-green-500`}
                      onClick={() => handleViewConversation(conv)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <img
                            src={
                              conv.agentProfilePictureUrl ||
                              `https://placehold.co/40x40/${darkMode ? "374151" : "E0F7FA"}/${darkMode ? "D1D5DB" : "004D40"}?text=${getInitial(conv.agentName)}`
                            }
                            alt="Agent Profile"
                            className="w-12 h-12 rounded-full mr-4 object-cover cursor-pointer" // Increased size and margin
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://placehold.co/40x40/${darkMode ? "374151" : "E0F7FA"}/${darkMode ? "D1D5DB" : "004D40"}?text=${getInitial(conv.agentName)}`;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProfilePicClick(
                                conv.agentProfilePictureUrl,
                                conv.agentName,
                              );
                            }}
                          />
                          <h4
                            className={`text-lg font-semibold ${isBold ? "text-green-400" : ""} ${darkMode ? "text-green-400" : "text-green-600"}`}
                          >
                            {/* Agent Name clickable */}
                            {conv.agent_id ? (
                              <span
                                className="cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/client/agent-profile/${conv.agent_id}`,
                                  );
                                }}
                              >
                                {conv.agentName}
                              </span>
                            ) : (
                              <span>{conv.agentName}</span>
                            )}
                          </h4>
                        </div>
                        {/* Status tag moved to top right and made conditional */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`${displayStatus === "New Message" ? "bg-red-500" : "bg-green-500"} text-white text-xs font-bold px-2 py-1 rounded-full`}
                          >
                            {displayStatus}
                          </span>
                        </div>
                      </div>
                      <div>
                        {" "}
                        {/* No ml-16 here */}
                        <p
                          className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                        >
                          <Building size={14} className="inline-block mr-1" />
                          <span className="font-medium">
                            {conv.propertyTitle || "General Inquiry"}
                          </span>
                          {conv.property_id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/listings/${conv.property_id}`);
                              }}
                              className="ml-2 py-0.5 px-1.5 bg-blue-500 text-white rounded-md text-xs"
                            >
                              View Property
                            </button>
                          )}
                        </p>
                        <p
                          className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                        >
                          <MessageSquare
                            size={14}
                            className="inline-block mr-1"
                          />
                          Last Message:{" "}
                          <span
                            className={`${darkMode ? "text-green-400" : "text-green-600"} ${isBold ? "font-semibold" : ""}`}
                          >
                            {conv.lastMessage || "No messages yet"}
                          </span>
                        </p>
                        <p
                          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          <Clock size={12} className="inline-block mr-1" />
                          {new Date(conv.lastMessageTimestamp).toLocaleString()}
                        </p>
                        <div className="mt-2 flex gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInquiry(conv.id);
                            }}
                            className={`p-1 rounded-full ${darkMode ? "text-gray-400 hover:text-red-300" : "text-gray-600 hover:text-red-700"}`}
                            title="Delete Conversation"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p
                  className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  No conversations found.
                </p>
              )}
            </div>
          ) : (
            // Desktop table view
            <div className="overflow-x-auto">
              <table
                className={`w-full mt-4 text-left text-sm  table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                <thead>
                  <tr
                    className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {[
                      { key: "agent_name", label: "Agent" },
                      { key: "property_title", label: "Property" },
                      { key: "last_message", label: "Last Message" },
                      { key: "last_message_timestamp", label: "Last Activity" },
                      { key: "status", label: "Status" },
                    ].map((c) => (
                      <th
                        key={c.key}
                        onClick={() => handleSortClick(c.key)}
                        className={`py-2 px-2 cursor-pointer select-none ${sortKey === c.key ? (darkMode ? "text-green-400" : "text-green-700") : ""}`}
                        style={{
                          width: c.key === "last_message" ? "200px" : "150px",
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>{c.label}</span>
                          {renderSortIcon(c.key)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}
                >
                  {groupedConversations.length > 0 ? (
                    groupedConversations.map((conv) => {
                      // Determine if the conversation has unread messages FOR THE CLIENT
                      const hasUnreadMessagesForClient = conv.messages.some(
                        (msg) => msg.sender_id === conv.agent_id && !msg.read,
                      );

                      // Determine the sender of the very last message in the conversation
                      const lastMessageSender =
                        conv.messages.length > 0
                          ? conv.messages[conv.messages.length - 1].sender
                          : null;

                      // Determine display status based on the last message sender
                      let displayStatus;
                      if (lastMessageSender === "Client") {
                        displayStatus = "Responded";
                      } else {
                        displayStatus = "New Message";
                      }

                      // Text bolding logic: bold if new message status AND modal is not open for this conversation
                      const isBold =
                        hasUnreadMessagesForClient &&
                        openedConversationId !== conv.id;

                      return (
                        <tr
                          key={conv.id}
                          className={`border-t cursor-pointer ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"} ${isBold ? "font-bold" : "font-normal"}`}
                          onClick={() => handleViewConversation(conv)}
                        >
                          <td
                            className="py-2 px-2 truncate"
                            title={conv.agentName}
                          >
                            <div className="flex items-center">
                              <img
                                src={
                                  conv.agentProfilePictureUrl ||
                                  `https://placehold.co/40x40/${darkMode ? "374151" : "E0F7FA"}/${darkMode ? "D1D5DB" : "004D40"}?text=${getInitial(conv.agentName)}`
                                }
                                alt="Agent Profile"
                                className="w-8 h-8 rounded-full mr-3 object-cover cursor-pointer"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://placehold.co/40x40/${darkMode ? "374151" : "E0F7FA"}/${darkMode ? "D1D5DB" : "004D40"}?text=${getInitial(conv.agentName)}`;
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProfilePicClick(
                                    conv.agentProfilePictureUrl,
                                    conv.agentName,
                                  );
                                }}
                              />
                              <span
                                className={`flex items-center ${darkMode ? "text-green-400" : "text-green-600"}`}
                              >
                                {conv.agentName || "Unassigned"}
                                {conv.agent_id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/client/agent-profile/${conv.agent_id}`,
                                      );
                                    }}
                                    className="ml-2 py-1 px-2 bg-purple-500 text-white rounded-xl text-xs"
                                  >
                                    View
                                  </button>
                                )}
                              </span>
                            </div>
                          </td>
                          <td
                            className="py-2 px-2 truncate"
                            title={conv.propertyTitle}
                          >
                            <span className="flex items-center">
                              {conv.propertyTitle || "General Inquiry"}
                              {conv.property_id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/listings/${conv.property_id}`);
                                  }}
                                  className="ml-2 py-1 px-2 bg-blue-500 text-white rounded-xl text-xs"
                                >
                                  View
                                </button>
                              )}
                            </span>
                          </td>
                          <td
                            className="py-2 px-2 truncate"
                            title={conv.lastMessage}
                          >
                            <span
                              className={`${darkMode ? "text-green-400" : "text-green-600"} ${isBold ? "font-semibold" : ""}`}
                            >
                              {conv.lastMessage || "No messages yet."}
                            </span>
                          </td>
                          <td
                            className="py-2 px-2 truncate"
                            title={new Date(
                              conv.lastMessageTimestamp,
                            ).toLocaleString()}
                          >
                            {new Date(
                              conv.lastMessageTimestamp,
                            ).toLocaleString()}
                          </td>
                          <td
                            className={`py-2 px-2 truncate font-semibold ${displayStatus === "New Message" ? "text-red-600" : darkMode ? "text-green-400" : "text-green-700"}`}
                          >
                            {displayStatus}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-gray-500"
                      >
                        No conversations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100"}`}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100"}`}
            >
              Next
            </button>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isClientInquiryModalOpen && selectedConversation && (
          <ClientInquiryModal
            isOpen={isClientInquiryModalOpen}
            onClose={() => {
              setIsClientInquiryModalOpen(false);
              setOpenedConversationId(null); // Clear opened conversation ID when modal closes
              fetchInquiries(); // Refetch inquiries to get latest read status from backend
            }}
            conversation={selectedConversation}
            darkMode={darkMode}
            onViewProperty={(id) => navigate(`/listings/${id}`)}
            onDelete={handleDeleteInquiry}
            onSendMessage={handleSendMessageToConversation}
          />
        )}

        {/* Expanded Profile Picture Modal */}
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
              src={
                expandedProfilePicUrl ||
                `https://placehold.co/400x400/${darkMode ? "374151" : "E0F7FA"}/${darkMode ? "D1D5DB" : "004D40"}?text=${getInitial(expandedProfilePicName)}`
              }
              alt={`${expandedProfilePicName} Profile Expanded`}
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
    </div>
  );
};

export default ClientInquiries;

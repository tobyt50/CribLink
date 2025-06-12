import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import AgentSidebar from '../../components/agent/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import AgentInquiryModal from '../../components/AgentInquiryModal';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState'; // Import the useSidebarState hook

const AgentInquiries = () => {
  // State to hold grouped conversations
  const [groupedConversations, setGroupedConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('created_at'); // Default sort key for conversations
  const [sortDirection, setSortDirection] = useState('desc');

  const [page, setPage] = useState(1);
  // Total conversations, not total individual inquiries
  const [totalConversations, setTotalConversations] = useState(0);
  const limit = 10; // Number of conversations per page

  // Use the useSidebarState hook
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('inquiries');
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  // State for the AgentInquiryModal (for viewing/responding/deleting inquiries)
  const [isAgentInquiryModalOpen, setIsAgentInquiryModalOpen] = useState(false);
  // The selected conversation object for the modal
  const [selectedConversation, setSelectedConversation] = useState(null);
  // This will now hold the agent's message for the current chat, not just a resolution
  const [currentAgentReply, setCurrentAgentReply] = useState('');

  const navigate = useNavigate();

  // Helper to format date for display
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const fetchInquiries = async () => {
    // Define pageNum and limitNum locally within the function
    const pageNum = page;
    const limitNum = limit;

    const params = new URLSearchParams({
      search,
      sort: sortKey,
      direction: sortDirection,
    });

    try {
      const token = localStorage.getItem('token');
      // Fetch all inquiries to group them locally
      const res = await fetch(`http://localhost:5000/agent/inquiries?${params}&limit=1000&page=1`, { // Fetch a large number or all
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          showMessage("Authentication or Authorization error. Please login.", 'error');
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const allInquiries = data.inquiries || [];

      // Group inquiries into conversations
      const conversationsMap = new Map(); // Key: client_id-property_id
      allInquiries.forEach(inq => {
        const conversationKey = `${inq.client_id || 'guest'}-${inq.property_id}`;
        if (!conversationsMap.has(conversationKey)) {
          conversationsMap.set(conversationKey, {
            id: conversationKey,
            client_id: inq.client_id,
            property_id: inq.property_id,
            clientName: inq.name,
            clientEmail: inq.email,
            clientPhone: inq.phone,
            propertyTitle: inq.property_title || `Property ${inq.property_id}`, // Assuming property_title might be available or can be fetched
            messages: [], // Array to hold all messages in this conversation
            lastMessage: null,
            lastMessageTimestamp: null,
            unreadCount: 0, // Simulated unread count
          });
        }
        const conversation = conversationsMap.get(conversationKey);

        // Add message to conversation, mark as read for agent's messages
        conversation.messages.push({
          inquiry_id: inq.inquiry_id,
          sender: inq.agent_response ? 'Agent' : 'Client', // Simple logic to determine sender
          message: inq.message,
          response: inq.agent_response, // Keep agent's response for chat history
          timestamp: inq.created_at, // Use created_at for initial message
          read: inq.status === 'resolved' || inq.status === 'assigned', // Simulate read status
        });

        // If agent responded, add their response as a separate message entry
        if (inq.agent_response) {
          conversation.messages.push({
            inquiry_id: inq.inquiry_id, // Link to original inquiry if needed
            sender: 'Agent',
            message: inq.agent_response,
            timestamp: inq.updated_at || inq.created_at, // Use updated_at for agent's response
            read: true, // Agent's own messages are always read
          });
        }
      });

      // Convert map to array and sort conversations
      let sortedConversations = Array.from(conversationsMap.values());

      sortedConversations.forEach(conv => {
        // Sort messages within each conversation by timestamp
        conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Determine last message and its timestamp
        if (conv.messages.length > 0) {
          const lastMsg = conv.messages[conv.messages.length - 1];
          conv.lastMessage = lastMsg.message;
          conv.lastMessageTimestamp = lastMsg.timestamp;
        }

        // Calculate unread count (simplified: client's unread messages)
        conv.unreadCount = conv.messages.filter(msg => msg.sender === 'Client' && !msg.read).length;
      });

      // Sort conversations by last message timestamp
      sortedConversations.sort((a, b) => {
        const dateA = new Date(a.lastMessageTimestamp);
        const dateB = new Date(b.lastMessageTimestamp);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });


      // Paginate the grouped conversations
      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum;
      const paginatedConversations = sortedConversations.slice(start, end);

      setGroupedConversations(paginatedConversations);
      setTotalConversations(sortedConversations.length);

    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
      showMessage('Failed to fetch inquiries. Please try again.', 'error');
      setGroupedConversations([]);
      setTotalConversations(0);
    }
  };

  const location = useLocation();

  useEffect(() => {
    if (location.state?.sortKey) setSortKey(location.state.sortKey);
    if (location.state?.sortDirection) setSortDirection(location.state.sortDirection);
  }, [location.state]);

  useEffect(() => {
    fetchInquiries();
  }, [search, page, sortKey, sortDirection, showMessage]); // Re-fetch on changes


  const handleSortClick = (key) => {
    if (key !== 'message_action' && key !== 'view_property') {
      setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
      setSortKey(key);
      setPage(1);
    }
  };

  const renderSortIcon = (key) =>
    sortKey === key ? (
      sortDirection === 'asc' ? (
        <ArrowUpIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      ) : (
        <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
      )
    ) : (
      <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
    );

  // Clicking a conversation entry opens AgentInquiryModal with full chat history
  const handleViewConversation = (conversation) => {
    setSelectedConversation(conversation);
    // Set currentAgentReply to an empty string to ensure the chat input is empty
    setCurrentAgentReply('');
    setIsAgentInquiryModalOpen(true);

    // Simulate marking client's messages in this conversation as read
    const updatedConversations = groupedConversations.map(conv => {
      if (conv.id === conversation.id) {
        return {
          ...conv,
          messages: conv.messages.map(msg => ({ ...msg, read: true })), // Mark all messages as read
          unreadCount: 0
        };
      }
      return conv;
    });
    setGroupedConversations(updatedConversations);
  };

  const handleDeleteInquiry = async () => {
    // This now deletes the entire conversation or the most recent inquiry within it
    if (!selectedConversation) return;

    showConfirm({
      title: "Delete Conversation",
      message: `Are you sure you want to delete this conversation with ${selectedConversation.clientName} about Property ${selectedConversation.property_id}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          // For simplicity, delete the last inquiry in the conversation to represent deleting the thread.
          // In a real scenario, this would involve a backend endpoint to delete all messages/the conversation.
          const lastInquiryId = selectedConversation.messages[selectedConversation.messages.length - 1]?.inquiry_id;
          if (lastInquiryId) {
            const res = await fetch(`http://localhost:5000/agent/inquiries/${lastInquiryId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (res.ok) {
              showMessage(`Conversation with ${selectedConversation.clientName} deleted successfully.`, 'success');
              setIsAgentInquiryModalOpen(false); // Close modal
              setSelectedConversation(null);
              fetchInquiries(); // Re-fetch conversations
            } else {
              showMessage('Failed to delete conversation. Please try again.', 'error');
              console.error('Failed to delete conversation.');
            }
          } else {
            showMessage('No messages found in this conversation to delete.', 'info');
          }
        } catch (err) {
          showMessage('Error deleting conversation. Please check your connection.', 'error');
          console.error('Error deleting conversation:', err);
        }
      },
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
  };


  // This function simulates sending a new message from the agent.
  // In a real app, this would hit a new backend API endpoint to add a message to the conversation.
  const handleSendMessageToConversation = async (conversationId, newMessageText) => {
    if (!newMessageText.trim()) {
      showMessage('Message cannot be empty.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // For this refactor, we'll simulate sending by updating the *most recent* inquiry.
      // This is a workaround since the backend doesn't support chat messages directly.
      // In a real application, you'd send to a new endpoint like /agent/inquiries/:conversationId/messages
      const lastInquiry = selectedConversation.messages.filter(msg => msg.sender === 'Client').pop();
      if (lastInquiry) {
         const res = await fetch(`http://localhost:5000/agent/inquiries/${lastInquiry.inquiry_id}/resolve`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              agent_response: newMessageText, // Update agent_response field
              client_email: selectedConversation.clientEmail,
            }),
          });

          if (res.ok) {
            showMessage('Message sent and inquiry updated.', 'success');
            // Update the local conversation state to reflect the new message
            setSelectedConversation(prevConv => {
              const updatedMessages = [...prevConv.messages];
              // Find the last agent message to update it, or add new
              const existingAgentMessageIndex = updatedMessages.findIndex(msg => msg.sender === 'Agent' && msg.inquiry_id === lastInquiry.inquiry_id);

              if (existingAgentMessageIndex !== -1) {
                updatedMessages[existingAgentMessageIndex] = {
                  ...updatedMessages[existingAgentMessageIndex],
                  message: newMessageText,
                  timestamp: new Date().toISOString(), // Update timestamp to now
                  read: true,
                };
              } else {
                updatedMessages.push({
                  inquiry_id: lastInquiry.inquiry_id,
                  sender: 'Agent',
                  message: newMessageText,
                  timestamp: new Date().toISOString(),
                  read: true,
                });
              }
              // Sort again to ensure correct order
              updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

              return {
                ...prevConv,
                messages: updatedMessages,
                lastMessage: newMessageText, // Update last message shown in list view
                lastMessageTimestamp: new Date().toISOString(),
                unreadCount: 0, // Agent sent a message, so no unread for client
              };
            });
            setCurrentAgentReply(''); // Clear input after sending
            fetchInquiries(); // Re-fetch to update the main list
          } else {
            showMessage('Failed to send message. Please try again.', 'error');
            console.error('Failed to send message.');
          }
      } else {
        showMessage('Cannot send message: no client inquiry found to respond to.', 'error');
      }
    } catch (err) {
      showMessage('Error sending message. Please check your connection.', 'error');
      console.error('Error sending message:', err);
    }
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/listings/${propertyId}`);
  };

  const totalPages = Math.ceil(totalConversations / limit);

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;


  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
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

      {/* Sidebar */}
      <AgentSidebar
        collapsed={isMobile ? false : isCollapsed}
        setCollapsed={isMobile ? () => {} : setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main content with smooth margin-left shift and min width so content doesn't shrink */}
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3 }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        {/* Headers */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Inquiries</h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Inquiries</h1>
        </div>

        {/* Card container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
        >
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search conversations by client name or property ID..."
              className={`w-full md:w-1/3 py-2 px-4 border rounded-xl h-10 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
              }`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Table container with horizontal scroll */}
          <div className="overflow-x-auto">
            <table className={`w-full mt-4 text-left text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <thead>
                <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {[
                    'client_name',
                    'client_id',
                    'last_message',
                    'property_id',
                    'last_message_timestamp',
                    'status',
                  ].map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSortClick(key)}
                      className={`py-2 px-2 cursor-pointer select-none ${
                        sortKey === key ? (darkMode ? 'text-green-400' : 'text-green-700') : ''
                      }`}
                      style={{
                        width:
                          key === 'client_name' ? '150px' :
                          key === 'client_id' ? '100px' :
                          key === 'last_message' ? '200px' :
                          key === 'property_id' ? '120px' :
                          key === 'last_message_timestamp' ? '150px' :
                          key === 'status' ? '100px' :
                          'auto'
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>
                          {key === 'client_name' ? 'Client' :
                           key === 'client_id' ? 'Client ID' :
                           key === 'last_message' ? 'Last Message' :
                           key === 'property_id' ? 'Property' :
                           key === 'last_message_timestamp' ? 'Last Activity' :
                           key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {(key === 'last_message_timestamp' || key === 'client_name' || key === 'status') && renderSortIcon(key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                {groupedConversations.length > 0 ? (
                  groupedConversations.map((conv) => (
                    <tr
                      key={conv.id}
                      className={`border-t cursor-pointer ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"} ${conv.unreadCount > 0 ? 'font-bold' : ''}`}
                      onClick={() => handleViewConversation(conv)}
                    >
                      <td className="py-2 px-2 max-w-[150px] truncate" title={conv.clientName}>{conv.clientName}</td>
                      <td className="py-2 px-2 max-w-[100px] truncate" title={conv.client_id || 'N/A'}>{conv.client_id || 'Guest'}</td>
                      {/* Conditional styling for last message based on unread status */}
                      <td
                          className={`py-2 px-2 max-w-[200px] truncate ${
                            conv.unreadCount > 0
                              ? 'text-green-600 font-semibold'
                              : darkMode
                              ? 'text-gray-300'
                              : 'text-gray-700'
                          }`}
                          title={conv.lastMessage}
                          >
                          {conv.lastMessage || 'No messages yet.'}
                      </td>

                      <td className="py-2 px-2 max-w-[120px] truncate" title={conv.propertyTitle || conv.property_id}>
                        {conv.propertyTitle || conv.property_id}
                        {conv.property_id && (
                            <button
                                onClick={(e) => {e.stopPropagation(); handleViewProperty(conv.property_id);}}
                                className="ml-2 py-1 px-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-xs"
                                title="View Property"
                            >
                                View
                            </button>
                        )}
                      </td>
                      <td className="py-2 px-2 max-w-[150px] truncate" title={new Date(conv.lastMessageTimestamp).toLocaleString()}>
                        {conv.lastMessageTimestamp ? new Date(conv.lastMessageTimestamp).toLocaleString() : 'N/A'}
                      </td>
                       <td
                        className={`py-2 px-2 max-w-[100px] truncate font-semibold ${
                          conv.unreadCount > 0
                            ? 'text-red-600'
                            : (darkMode ? 'text-green-400' : 'text-green-700')
                        }`}
                        title={conv.unreadCount > 0 ? 'New/Unresponded' : 'Responded'}
                      >
                        {conv.unreadCount > 0 ? 'New' : 'Responded'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      No conversations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
            >
              Previous
            </button>
            <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
            >
              Next
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* AgentInquiryModal (for viewing, resolving, and deleting) */}
      <AnimatePresence>
        {isAgentInquiryModalOpen && selectedConversation && (
          <AgentInquiryModal
            isOpen={isAgentInquiryModalOpen}
            onClose={() => setIsAgentInquiryModalOpen(false)}
            // Pass the entire conversation object to the modal
            conversation={selectedConversation}
            initialAgentMessage={currentAgentReply}
            darkMode={darkMode}
            onViewProperty={handleViewProperty}
            onDelete={handleDeleteInquiry}
            // Pass the send message handler
            onSendMessage={handleSendMessageToConversation}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentInquiries;

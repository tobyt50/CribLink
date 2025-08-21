import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import AgencyAdminSidebar from '../../components/agency/Sidebar'; // Assuming a new sidebar for agency admin
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Menu, X, Users, RefreshCw, MessageSquare, Clock, Building, User, Tag } from 'lucide-react'; // Added icons for mobile view
import { useTheme } from '../../layouts/AppShell';
import AgentInquiryModal from '../../components/AgentInquiryModal'; // Reusing AgentInquiryModal for display
import ReassignAgentModal from '../../components/agency/ReassignAgentModal'; // New component for reassigning
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import API_BASE_URL from '../../config';
import socket from '../../socket';

// Skeleton component for AgencyInquiries page
const AgencyInquiriesSkeleton = ({ darkMode }) => (
  <div className={`animate-pulse space-y-4`}>
    {/* Controls Skeleton */}
    <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
      <div className={`h-10 w-full md:w-1/3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-10 w-full md:w-1/3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className="flex gap-2 w-full md:w-auto">
        <div className={`h-10 w-1/2 md:w-28 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-10 w-1/2 md:w-28 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      </div>
    </div>

    {/* Content Skeleton (mimicking graphical view for simplicity) */}
    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-1">
      {[...Array(5)].map((_, i) => ( // 5 skeleton cards
        <div key={i} className={`p-4 rounded-xl shadow-md h-48 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 rounded-full mr-4 ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            <div className="flex-1 space-y-2">
              <div className={`h-6 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <div className={`h-4 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            <div className={`h-4 w-2/3 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            <div className={`h-4 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
          </div>
          <div className="flex justify-end mt-4">
            <div className={`h-8 w-24 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
          </div>
        </div>
      ))}
    </div>

    {/* Pagination Skeleton */}
    <div className="flex justify-center items-center space-x-4 mt-4">
      <div className={`h-8 w-20 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      <div className={`h-8 w-20 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    </div>
  </div>
);


const AgencyInquiries = () => {
  const [groupedConversations, setGroupedConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('last_message_timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalConversations, setTotalConversations] = useState(0);
  const limit = 10;
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('inquiries');
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const [isAgentInquiryModalOpen, setIsAgentInquiryModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state

  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false); // State for reassign modal
  const [inquiryToReassign, setInquiryToReassign] = useState(null); // Holds conversation for reassignment

  // State for expanded profile picture
  const [isProfilePicExpanded, setIsProfilePicExpanded] = useState(false);
  const [expandedProfilePicUrl, setExpandedProfilePicUrl] = useState('');
  const [expandedProfilePicName, setExpandedProfilePicName] = useState('');
  const profilePicRef = useRef(null);

  const getAgencyAdminUserId = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      // Assuming agency admin userId is stored similarly in JWT
      return JSON.parse(atob(token.split('.')[1])).userId;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }, []);

  const agencyAdminUserId = getAgencyAdminUserId();


  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return groupedConversations.find(conv => conv.id === selectedConversationId);
  }, [selectedConversationId, groupedConversations]);

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true); // Set loading to true
    const params = new URLSearchParams({ search, sort: sortKey, direction: sortDirection, page, limit });
    try {
      const token = localStorage.getItem('token');
      // Endpoint to fetch all inquiries for the agency admin
      // The backend `getAllInquiriesForAgent` already handles the 'agency_admin' role
      const res = await fetch(`${API_BASE_URL}/inquiries/agent?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setGroupedConversations(data.inquiries || []);
      setTotalConversations(data.total);
    } catch (err) {
      showMessage('Failed to fetch inquiries.', 'error');
      console.error("Error fetching agency inquiries:", err);
    } finally {
      setIsLoading(false); // Set loading to false
    }
  }, [search, page, sortKey, sortDirection, showMessage]);

  useEffect(() => {
    if (location.state?.sortKey) setSortKey(location.state.sortKey);
    if (location.state?.sortDirection) setSortDirection(location.state.sortDirection);
  }, [location.state]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Effect to handle clicks outside the expanded profile picture
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profilePicRef.current && !profilePicRef.current.contains(event.target)) {
        setIsProfilePicExpanded(false);
      }
    };

    if (isProfilePicExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfilePicExpanded]);

  // Real-time functionality (similar to AgentInquiries but adjusted for admin view)
  useEffect(() => {
    if (!socket.connected) socket.connect();

    // Join all conversation rooms relevant to the fetched inquiries
    groupedConversations.forEach(conv => socket.emit('join_conversation', conv.id));

    const handleNewMessage = (newMessage) => {
        setGroupedConversations(prev => {
            let conversationExists = false;
            const updatedConversations = prev.map(conv => {
                if (conv.id === newMessage.conversationId) {
                    conversationExists = true;
                    // Prevent duplicate messages if already present
                    if (conv.messages.some(msg => msg.inquiry_id === newMessage.inquiryId)) return conv;

                    const messageToAdd = {
                        ...newMessage,
                        sender: newMessage.senderId === conv.client_id ? 'Client' : (newMessage.senderId === conv.agent_id ? 'Agent' : 'Unknown'), // Identify sender
                        // Messages are considered read by admin if modal is open for this conv
                        read: (openedConversationId === conv.id) ? true : newMessage.read
                    };

                    const updatedConv = {
                        ...conv,
                        messages: [...conv.messages, messageToAdd],
                        lastMessage: newMessage.message,
                        lastMessageTimestamp: newMessage.timestamp,
                        lastMessageSenderId: newMessage.senderId,
                        // Unread count for admin view: any message not from current admin and not read by admin
                        unreadCount: (newMessage.senderId !== agencyAdminUserId && !messageToAdd.read) ? conv.unreadCount + 1 : conv.unreadCount,
                        // is_agent_responded logic remains tied to the assigned agent
                        is_agent_responded: newMessage.senderId === conv.agent_id ? true : conv.is_agent_responded, // Use conv.agent_id for assigned agent
                    };
                    return updatedConv;
                }
                return conv;
            });

            // If a new conversation appears relevant to this admin's agency, refetch
            // (e.g., if a new inquiry is created under a listing associated with their agency)
            if (!conversationExists) {
                fetchInquiries();
                return prev;
            }
            const sortedConversations = updatedConversations.sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));

            if (selectedConversationId && sortedConversations.some(c => c.id === selectedConversationId)) {
                setSelectedConversationId(prevId => prevId); // Keep the selected conversation active
            }

            return sortedConversations;
        });
    };

    const handleReadAck = ({ conversationId, readerId, role }) => {
        // For agency admin, if *any* relevant party (client or agent) reads, update state
        setGroupedConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
                return {
                    ...conv,
                    messages: conv.messages.map(msg => ({ ...msg, read: true })), // Mark all messages as read for admin view
                    unreadCount: 0 // Clear unread count when an acknowledgment comes
                };
            }
            return conv;
        }));
        if (selectedConversationId && selectedConversationId === conversationId) {
            setSelectedConversationId(prevId => prevId);
        }
    };

    const handleReassignment = (data) => {
      showMessage(`Inquiry ${data.conversationId} reassigned to new agent.`, 'info');
      fetchInquiries(); // Refresh list to reflect new assignment
    };


    socket.on('new_message', handleNewMessage);
    socket.on('new_inquiry_for_agent', fetchInquiries); // Still listen for this as it might create new entries for the agency
    socket.on('message_read_ack', handleReadAck);
    socket.on('conversation_deleted', fetchInquiries);
    socket.on('inquiry_list_changed', fetchInquiries); // Listen for general changes, including reassignments
    socket.on('inquiry_reassigned', handleReassignment);


    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_inquiry_for_agent', fetchInquiries);
      socket.off('message_read_ack', handleReadAck);
      socket.off('conversation_deleted', fetchInquiries);
      socket.off('inquiry_list_changed', fetchInquiries);
      socket.off('inquiry_reassigned', handleReassignment);
    };
  }, [groupedConversations, agencyAdminUserId, fetchInquiries, openedConversationId, selectedConversationId, showMessage]);

  const handleSortClick = (key) => {
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortKey(key);
    setPage(1);
  };

  const renderSortIcon = (key) => sortKey === key ? (sortDirection === 'asc' ? <ArrowUpIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} /> : <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />) : <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;

  const handleViewConversation = useCallback(async (conversation) => {
    setSelectedConversationId(conversation.id);
    setIsAgentInquiryModalOpen(true);
    setOpenedConversationId(conversation.id); // Set the conversation as opened for admin
    
    // Mark messages as read for admin view if there are unread messages from client or agent
    if (conversation.unreadCount > 0) {
      const token = localStorage.getItem('token');
      try {
        await fetch(`${API_BASE_URL}/inquiries/agent/mark-read/${conversation.id}`, { // Reusing agent endpoint, which handles agency_admin role
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // Emit read ack for admin's view
        socket.emit('message_read', { conversationId: conversation.id, userId: agencyAdminUserId, role: 'agency_admin' });
        setGroupedConversations(prev => prev.map(c =>
            c.id === conversation.id ? { ...c, unreadCount: 0 } : c
        ));
      } catch (error) {
        console.error("Failed to mark messages as read for admin:", error);
        showMessage("Failed to mark messages as read.", 'error');
      }
    }

    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/inquiries/agent/mark-opened/${conversation.id}`, { // Reusing agent endpoint, which handles agency_admin role
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        console.error("Failed to mark conversation as opened by admin:", error);
    }
  }, [agencyAdminUserId, showMessage]);

  const handleDeleteInquiry = async () => {
    if (!selectedConversation) return;
    showConfirm({
      title: "Delete Conversation",
      message: `Are you sure you want to delete this conversation with ${selectedConversation.clientName}? This is irreversible.`,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        // Admin can delete any conversation under their agency
        const res = await fetch(`${API_BASE_URL}/inquiries/agent/delete-conversation/${selectedConversation.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); // Reusing agent endpoint, which handles agency_admin role
        if (res.ok) {
          showMessage('Conversation deleted.', 'success');
          setIsAgentInquiryModalOpen(false);
          setOpenedConversationId(null);
          fetchInquiries();
        } else {
          showMessage('Failed to delete conversation.', 'error');
        }
      }
    });
  };

  const handleSendMessageToConversation = async (conversationId, messageText) => {
    // Agency admin can also send messages, which would be from the agency's perspective
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/inquiries/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        conversation_id: conversationId,
        property_id: selectedConversation?.property_id,
        message_content: messageText,
        recipient_id: selectedConversation?.client_id, // Still sent to the client
        message_type: 'agency_admin_reply', // New message type, handled by backend
      }),
    });
    // This will implicitly update the conversation via socket.io 'new_message' event
  };

  const handleReassignInquiry = useCallback(async (conversationId, newAgentId) => {
    if (!conversationId || !newAgentId) {
      showMessage('Invalid reassign request.', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/inquiries/agency-admin/reassign/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ new_agent_id: newAgentId })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      showMessage('Inquiry reassigned successfully!', 'success');
      setIsReassignModalOpen(false);
      fetchInquiries(); // Re-fetch to update the assigned agent displayed
      socket.emit('inquiry_reassigned', { conversationId, newAgentId }); // Emit for real-time update
    } catch (error) {
      console.error("Failed to reassign inquiry:", error);
      showMessage('Failed to reassign inquiry.', 'error');
    }
  }, [showMessage, fetchInquiries]);

  const totalPages = Math.ceil(totalConversations / limit);
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  // Default placeholder image for client profile
  const defaultProfilePicture = "https://placehold.co/40x40/aabbcc/ffffff?text=User";
  const getInitial = (name) => {
    const safeName = String(name || '');
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : 'N/A';
  };

  const handleProfilePicClick = (url, name) => {
    setExpandedProfilePicUrl(url);
    setExpandedProfilePicName(name);
    setIsProfilePicExpanded(true);
  };


  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-4 md:px-0 min-h-screen flex flex-col`}>
      {isMobile && <motion.button onClick={() => setIsSidebarOpen(p => !p)} className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-white"}`}><AnimatePresence mode="wait"><motion.div key={isSidebarOpen ? 'x' : 'm'} initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</motion.div></AnimatePresence></motion.button>}
      <AgencyAdminSidebar collapsed={isCollapsed} setCollapsed={setIsCollapsed} activeSection={activeSection} setActiveSection={setActiveSection} isMobile={isMobile} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <motion.div key={isMobile ? 'mobile' : 'desktop'} animate={{ marginLeft: contentShift }} transition={{ duration: 0.3 }} className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0">
        <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Agency Inquiries</h1>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input type="text" placeholder="Search..." className={`w-full md:w-1/3 py-2 px-4 border rounded-xl h-10 focus:outline-none focus:ring-1 ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-green-400" : "bg-white border-gray-300 focus:ring-green-600"}`} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
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
                    onClick={() => handleSortClick('last_message_timestamp')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 w-1/2 ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                >
                    Sort by Date {renderSortIcon('last_message_timestamp')}
                </button>
              </div>
            )}
            {/* Desktop: Refresh button (already there) */}
            {!isMobile && (
              <button
                  onClick={fetchInquiries}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
              >
                  <RefreshCw size={16} /> Refresh
              </button>
            )}
          </div>
          
          {isLoading ? ( // Conditionally render skeleton when loading
            <AgencyInquiriesSkeleton darkMode={darkMode} />
          ) : (
            isMobile ? (
              // Mobile-friendly list view
              <div className="space-y-4">
                {groupedConversations.length > 0 ? (
                  groupedConversations.map(conv => {
                    const hasUnreadMessagesForAdmin = conv.messages.some(msg =>
                      msg.sender_id !== agencyAdminUserId && !msg.read
                    );
                    const displayStatus = conv.is_agent_responded ? 'Responded' : (hasUnreadMessagesForAdmin ? 'New Message' : 'Open');
                    const isBold = hasUnreadMessagesForAdmin && openedConversationId !== conv.id;

                    return (
                      <div
                        key={conv.id}
                        className={`p-4 rounded-xl shadow-md cursor-pointer ${darkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-800"} ${isBold ? 'border-l-4 border-green-500' : ''}`}
                        onClick={() => handleViewConversation(conv)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <img
                              src={conv.clientProfilePictureUrl || `https://placehold.co/40x40/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(conv.clientName)}`}
                              alt="Client Profile"
                              className="w-12 h-12 rounded-full mr-4 object-cover cursor-pointer" // Increased size and margin
                              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/40x40/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(conv.clientName)}`; }}
                              onClick={(e) => { e.stopPropagation(); handleProfilePicClick(conv.clientProfilePictureUrl, conv.clientName); }}
                            />
                            <h4 className={`text-lg font-semibold ${isBold ? 'text-green-400' : ''}`}>
                              {/* Client Name clickable */}
                              {conv.client_id ? (
                                  <span
                                      className="cursor-pointer hover:underline"
                                      onClick={(e) => { e.stopPropagation(); navigate(`/agency/client-profile/${conv.client_id}`); }}
                                  >
                                      {conv.clientName}
                                  </span>
                              ) : (
                                  <span>{conv.clientName}</span>
                              )}
                            </h4>
                          </div>
                          {hasUnreadMessagesForAdmin && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        {/* Content below the profile picture and name, no longer shifted right */}
                        <div> 
                          <p className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <Building size={14} className="inline-block mr-1" />
                            <span className="font-medium">{conv.propertyTitle || 'General Inquiry'}</span>
                            {conv.property_id && (
                              <button
                                onClick={e => { e.stopPropagation(); navigate(`/listings/${conv.property_id}`); }}
                                className="ml-2 py-0.5 px-1.5 bg-blue-500 text-white rounded-md text-xs"
                              >
                                View Property
                              </button>
                            )}
                          </p>
                          <p className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <Users size={14} className="inline-block mr-1" />
                            Assigned: {/* Agent Name clickable */}
                            <span
                              className={`font-medium ${conv.agent_id ? 'cursor-pointer hover:underline' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (conv.agent_id) navigate(`/agent-profile/${conv.agent_id}`); // Corrected path
                              }}
                            >
                              {conv.agent_name || 'Unassigned'}
                            </span>
                          </p>
                          <p className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <MessageSquare size={14} className="inline-block mr-1" />
                            Last Message: <span className={`${isBold ? 'text-red-400 font-semibold' : ''}`}>{conv.lastMessage || 'No messages yet'}</span>
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Clock size={12} className="inline-block mr-1" />
                            {new Date(conv.lastMessageTimestamp).toLocaleString()}
                          </p>
                          <div className="flex justify-end mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening the conversation modal
                                setInquiryToReassign(conv);
                                setIsReassignModalOpen(true);
                              }}
                              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                              <Tag size={14} /> Reassign
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className={`py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No conversations.</p>
                )}
              </div>
            ) : (
              // Desktop table view
              <div className="overflow-x-auto">
                <table className={`w-full mt-4 text-left text-sm  table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <thead><tr className={darkMode ? "text-gray-400" : "text-gray-500"}>{[{key: 'client_name', label: 'Client'}, {key: 'property_title', label: 'Property'}, {key: 'assigned_agent', label: 'Assigned Agent'}, {key: 'last_message', label: 'Last Message'}, {key: 'last_message_timestamp', label: 'Last Activity'}, {key: 'status', label: 'Status'}, {key: 'actions', label: 'Actions'}].map(c => <th key={c.key} onClick={() => c.key !== 'actions' && handleSortClick(c.key)} className={`py-2 px-2 ${c.key !== 'actions' ? 'cursor-pointer select-none' : ''} ${sortKey === c.key ? (darkMode ? 'text-green-400' : 'text-green-700') : ''}`} style={{width: c.key === 'last_message' ? '200px' : '150px'}}><div className="flex items-center gap-1"><span>{c.label}</span>{c.key !== 'actions' && renderSortIcon(c.key)}</div></th>)}</tr></thead>
                  <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                    {groupedConversations.length > 0 ? groupedConversations.map(conv => {
                      // Determine if the conversation has unread messages FOR THE ADMIN (any message not from admin and not read by admin)
                      const hasUnreadMessagesForAdmin = conv.messages.some(msg =>
                        msg.sender_id !== agencyAdminUserId && !msg.read
                      );

                      const displayStatus = conv.is_agent_responded ? 'Responded' : (hasUnreadMessagesForAdmin ? 'New Message' : 'Open');

                      // Text bolding logic: bold if new message status AND modal is not open for this conversation
                      const isBold = hasUnreadMessagesForAdmin && openedConversationId !== conv.id;

                      return (
                        <tr key={conv.id} className={`border-t cursor-pointer ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"} ${isBold ? 'font-bold' : 'font-normal'}`} onClick={() => handleViewConversation(conv)}>
                          <td className="py-2 px-2 truncate" title={conv.clientName}>
                            <div className="flex items-center">
                              <img
                                src={conv.clientProfilePictureUrl || `https://placehold.co/40x40/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(conv.clientName)}`}
                                alt="Client Profile"
                                className="w-8 h-8 rounded-full mr-3 object-cover cursor-pointer"
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/40x40/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(conv.clientName)}`; }}
                                onClick={(e) => { e.stopPropagation(); handleProfilePicClick(conv.clientProfilePictureUrl, conv.clientName); }}
                              />
                              {/* Client Name clickable */}
                              <span className="flex items-center">
                                  {conv.client_id ? (
                                      <span
                                          className="cursor-pointer hover:underline"
                                          onClick={e => { e.stopPropagation(); navigate(`/agency/client-profile/${conv.client_id}`) }}
                                      >
                                          {conv.clientName}
                                      </span>
                                  ) : (
                                      <span>{conv.clientName}</span>
                                  )}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2 truncate" title={conv.propertyTitle}><span className="flex items-center">{conv.propertyTitle || 'General'}{conv.property_id && <button onClick={e => { e.stopPropagation(); navigate(`/listings/${conv.property_id}`) }} className="ml-2 py-1 px-2 bg-blue-500 text-white rounded-xl text-xs">View</button>}</span></td>
                          <td className="py-2 px-2 truncate" title={conv.agent_name || 'Unassigned'}>
                            {/* Agent Name clickable */}
                            <span
                              className={`font-medium ${conv.agent_id ? 'cursor-pointer hover:underline' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (conv.agent_id) navigate(`/agent-profile/${conv.agent_id}`); // Corrected path
                              }}
                            >
                              {conv.agent_name || 'Unassigned'}
                            </span>
                          </td>
                          <td className={`py-2 px-2 truncate ${isBold ? 'text-red-600 font-semibold' : ''}`} title={conv.lastMessage}>{conv.lastMessage || '...'}</td>
                          <td className="py-2 px-2 truncate">{new Date(conv.lastMessageTimestamp).toLocaleString()}</td>
                          <td className={`py-2 px-2 truncate font-semibold ${displayStatus === 'New Message' ? 'text-red-600' : (darkMode ? 'text-green-400' : 'text-green-700')}`}>{displayStatus}</td>
                          <td className="py-2 px-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening the conversation modal
                                setInquiryToReassign(conv);
                                setIsReassignModalOpen(true);
                              }}
                              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                              <Users size={14} /> Reassign
                            </button>
                          </td>
                        </tr>
                      )
                    }) : <tr><td colSpan="7" className="py-8 text-center text-gray-500">No conversations.</td></tr>}
                  </tbody>
                </table>
              </div>
            )
          )}
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100"}`}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages || totalPages === 0} className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100"}`}>Next</button>
          </div>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {isAgentInquiryModalOpen && selectedConversation && (
          <AgentInquiryModal
            isOpen={isAgentInquiryModalOpen}
            onClose={() => {
              setIsAgentInquiryModalOpen(false);
              setOpenedConversationId(null); // Clear opened conversation ID when modal closes
              fetchInquiries(); // Refetch inquiries to get latest read status from backend
            }}
            conversation={selectedConversation}
            darkMode={darkMode}
            onViewProperty={(id) => navigate(`/listings/${id}`)}
            onDelete={handleDeleteInquiry}
            onSendMessage={handleSendMessageToConversation}
            // Add a prop to indicate the user's role opening the modal
            // This will allow AgentInquiryModal to conditionally enable/disable features
            // and adjust navigation based on the role.
            userRole="agency_admin"
          />
        )}
        {isReassignModalOpen && inquiryToReassign && (
          <ReassignAgentModal
            isOpen={isReassignModalOpen}
            onClose={() => setIsReassignModalOpen(false)}
            darkMode={darkMode}
            conversationId={inquiryToReassign.id}
            currentAssignedAgentId={inquiryToReassign.agent_id}
            onReassign={handleReassignInquiry}
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
              src={expandedProfilePicUrl || `https://placehold.co/400x400/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(expandedProfilePicName)}`}
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

export default AgencyInquiries;

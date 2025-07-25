import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import AgentSidebar from '../../components/agent/Sidebar';
import { ArrowUpIcon, ArrowDownIcon, ArchiveBoxIcon, TrashIcon } from '@heroicons/react/24/outline'; // Added ArchiveBoxIcon, TrashIcon
import { Menu, X, Users, RefreshCw, MessageSquare, Clock, Building, User, Tag } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import AgentInquiryModal from '../../components/AgentInquiryModal';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import API_BASE_URL from '../../config';
import socket from '../../socket';

const AgentInquiries = () => {
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

  // State for expanded profile picture
  const [isProfilePicExpanded, setIsProfilePicExpanded] = useState(false);
  const [expandedProfilePicUrl, setExpandedProfilePicUrl] = useState('');
  const [expandedProfilePicName, setExpandedProfilePicName] = useState('');
  const profilePicRef = useRef(null);

  const getAgentUserId = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).userId;
    } catch (error) {
      return null;
    }
  }, []);

  // NEW: Function to get the user's role from the token
  const getUserRole = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).role; // Assuming 'role' is in the token payload
    } catch (error) {
      return null;
    }
  }, []);

  const agentUserId = getAgentUserId();
  const currentUserRole = getUserRole(); // NEW: Get the current user's role

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return groupedConversations.find(conv => conv.id === selectedConversationId);
  }, [selectedConversationId, groupedConversations]);


  const fetchInquiries = useCallback(async () => {
    const params = new URLSearchParams({ search, sort: sortKey, direction: sortDirection, page, limit });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/inquiries/agent?${params}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setGroupedConversations(data.inquiries || []);
      setTotalConversations(data.total);
    } catch (err) {
      showMessage('Failed to fetch inquiries.', 'error');
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

  // Real-time functionality
  useEffect(() => {
    if (!socket.connected) socket.connect();

    groupedConversations.forEach(conv => socket.emit('join_conversation', conv.id));

    const handleNewMessage = (newMessage) => {
        setGroupedConversations(prev => {
            let conversationExists = false;
            const updatedConversations = prev.map(conv => {
                if (conv.id === newMessage.conversationId) {
                    conversationExists = true;
                    if (conv.messages.some(msg => msg.inquiry_id === newMessage.inquiryId)) return conv;

                    const messageToAdd = {
                        ...newMessage,
                        sender: newMessage.senderId === conv.client_id ? 'Client' : 'Agent',
                        // Message is considered read if the modal for this conversation is currently open
                        read: (openedConversationId === conv.id && newMessage.senderId === conv.client_id) ? true : newMessage.read
                    };

                    const updatedConv = {
                        ...conv,
                        messages: [...conv.messages, messageToAdd],
                        lastMessage: newMessage.message,
                        lastMessageTimestamp: newMessage.timestamp,
                        lastMessageSenderId: newMessage.senderId,
                        // Increment unread count only if the message is from the client AND it's NOT read by agent
                        unreadCount: (newMessage.senderId === conv.client_id && !messageToAdd.read) ? conv.unreadCount + 1 : conv.unreadCount,
                        // Update is_agent_responded only if the agent sends a reply
                        is_agent_responded: newMessage.senderId === agentUserId ? true : conv.is_agent_responded,
                    };
                    return updatedConv;
                }
                return conv;
            });

            if (!conversationExists && (newMessage.agentId === agentUserId || !newMessage.agentId)) {
                fetchInquiries();
                return prev;
            }
            const sortedConversations = updatedConversations.sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));

            if (selectedConversationId && sortedConversations.some(c => c.id === selectedConversationId)) {
                setSelectedConversationId(prevId => prevId);
            }

            return sortedConversations;
        });
    };

    const handleReadAck = ({ conversationId, readerId, role }) => {
        if (readerId === agentUserId && role === 'agent') {
            setGroupedConversations(prev => prev.map(conv => {
                if (conv.id === conversationId) {
                    return {
                        ...conv,
                        messages: conv.messages.map(msg => msg.sender_id === conv.client_id ? { ...msg, read: true } : msg),
                        unreadCount: 0 // Clear unread count when current user reads
                    };
                }
                return conv;
            }));
            if (selectedConversationId && selectedConversationId === conversationId) {
                setSelectedConversationId(prevId => prevId);
            }
        }
        else if (role === 'client') {
             setGroupedConversations(prev => prev.map(conv => {
                if (conv.id === conversationId) {
                    return {
                        ...conv,
                        messages: conv.messages.map(msg => msg.sender_id === agentUserId ? { ...msg, read: true } : msg),
                    };
                }
                return conv;
            }));
            if (selectedConversationId && selectedConversationId === conversationId) {
                setSelectedConversationId(prevId => prevId);
            }
        }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_inquiry_for_agent', fetchInquiries);
    socket.on('message_read_ack', handleReadAck);
    socket.on('conversation_deleted', fetchInquiries);
    socket.on('inquiry_list_changed', fetchInquiries);
    // NEW: Listen for reassignment events to trigger a refetch
    socket.on('inquiry_reassigned', fetchInquiries);


    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_inquiry_for_agent', fetchInquiries);
      socket.off('message_read_ack', handleReadAck);
      socket.off('conversation_deleted', fetchInquiries);
      socket.off('inquiry_list_changed', fetchInquiries);
      socket.off('inquiry_reassigned', fetchInquiries); // NEW
    };
  }, [groupedConversations, agentUserId, fetchInquiries, openedConversationId, selectedConversationId]);

  const handleSortClick = (key) => {
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortKey(key);
    setPage(1);
  };

  const renderSortIcon = (key) => sortKey === key ? (sortDirection === 'asc' ? <ArrowUpIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} /> : <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />) : <ArrowDownIcon className={`h-4 w-4 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;

  const handleViewConversation = useCallback(async (conversation) => {
    setSelectedConversationId(conversation.id);
    setIsAgentInquiryModalOpen(true);
    setOpenedConversationId(conversation.id); // Set the conversation as opened

    // Only mark as read if there are unread messages AND it's not reassigned from current agent
    if (conversation.unreadCount > 0 && !conversation.isReassignedFromMe) {
      const token = localStorage.getItem('token');
      try {
        await fetch(`${API_BASE_URL}/inquiries/agent/mark-read/${conversation.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        socket.emit('message_read', { conversationId: conversation.id, userId: agentUserId, role: 'agent' });
        // Optimistically update the unreadCount to 0, but status remains 'New Message'
        setGroupedConversations(prev => prev.map(c =>
            c.id === conversation.id ? { ...c, unreadCount: 0 } : c
        ));
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
        showMessage("Failed to mark messages as read.", 'error');
      }
    }

    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/inquiries/agent/mark-opened/${conversation.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        console.error("Failed to mark conversation as opened:", error);
    }
  }, [agentUserId, showMessage]);

  const handleArchiveConversation = async (conversationId, isReassignedFromMe) => {
    showConfirm({
      title: isReassignedFromMe ? "Remove from List" : "Archive Conversation",
      message: isReassignedFromMe ? "Are you sure you want to remove this reassigned chat from your active list? It will still be accessible in the Archive." : `Are you sure you want to archive this conversation? It will be moved to your Archive and you can restore it later.`,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        try {
          // This endpoint will set hidden_from_agent = TRUE for the current agent
          const res = await fetch(`${API_BASE_URL}/inquiries/${conversationId}/archive-for-agent`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showMessage(isReassignedFromMe ? 'Chat removed from list.' : 'Conversation archived.', 'success');
            setIsAgentInquiryModalOpen(false);
            setOpenedConversationId(null); // Clear opened conversation ID
            fetchInquiries(); // Refetch to update the list
          } else {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
        } catch (error) {
          console.error('Failed to archive/remove conversation:', error);
          showMessage(isReassignedFromMe ? 'Failed to remove chat from list.' : 'Failed to archive conversation.', 'error');
        }
      }
    });
  };

  const handleSendMessageToConversation = async (conversationId, messageText) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/inquiries/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        conversation_id: conversationId,
        property_id: selectedConversation?.property_id,
        message_content: messageText,
        recipient_id: selectedConversation?.client_id,
        message_type: 'agent_reply',
      }),
    });

    // Mark as responded when agent sends a message
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/inquiries/agent/mark-responded/${conversationId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // Optimistically update local state to 'Responded' after sending a message
        setGroupedConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, is_agent_responded: true } : c
        ));
    } catch (error) {
        console.error("Failed to mark conversation as responded:", error);
    }
  };

  const totalPages = Math.ceil(totalConversations / limit);
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

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
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {isMobile && <motion.button onClick={() => setIsSidebarOpen(p => !p)} className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-white"}`}><AnimatePresence mode="wait"><motion.div key={isSidebarOpen ? 'x' : 'm'} initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</motion.div></AnimatePresence></motion.button>}
      <AgentSidebar collapsed={isCollapsed} setCollapsed={setIsCollapsed} activeSection={activeSection} setActiveSection={setActiveSection} isMobile={isMobile} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <motion.div key={isMobile ? 'mobile' : 'desktop'} animate={{ marginLeft: contentShift }} transition={{ duration: 0.3 }} className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0">
        <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Inquiries</h1>
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
          
          {isMobile ? (
            // Mobile-friendly list view
            <div className="space-y-4">
              {groupedConversations.length > 0 ? (
                groupedConversations.map(conv => {
                  // Determine if the conversation has unread messages FOR THE AGENT
                  const hasUnreadMessagesForAgent = conv.messages.some(msg =>
                    msg.sender_id === conv.client_id && !msg.read
                  );

                  // Determine display status: "New Message" if unread messages OR if agent hasn't responded yet
                  // "Responded" only if agent has sent a message AND all client messages are read
                  const displayStatus = conv.is_agent_responded ? 'Responded' : 'New Message';

                  // Text bolding logic: bold if new message status AND modal is not open for this conversation
                  const isBold = hasUnreadMessagesForAgent && openedConversationId !== conv.id;

                  // NEW: Determine if this inquiry was reassigned FROM the current agent
                  const isReassignedFromMe = conv.isReassignedFromMe;

                  return (
                    <div
                      key={conv.id}
                      className={`p-4 rounded-xl shadow-md cursor-pointer ${darkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-800"} ${isBold ? 'border-l-4 border-green-500' : ''} ${isReassignedFromMe ? 'opacity-60 border-l-4 border-yellow-500' : ''}`}
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
                                    onClick={(e) => { e.stopPropagation(); navigate(`/agent/client-profile/${conv.client_id}`); }}
                                >
                                    {conv.clientName}
                                </span>
                            ) : (
                                <span>{conv.clientName}</span>
                            )}
                          </h4>
                        </div>
                        {hasUnreadMessagesForAgent && !isReassignedFromMe && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            New
                          </span>
                        )}
                        {isReassignedFromMe && (
                          <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            Reassigned
                          </span>
                        )}
                      </div>
                      <div> {/* No ml-16 here */}
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
                              if (conv.agent_id) navigate(`/agent-profile/${conv.agent_id}`);
                            }}
                          >
                            {conv.agent_name || 'Unassigned'}
                          </span>
                        </p>
                        {isReassignedFromMe && conv.reassigned_by_admin_name && conv.reassigned_at && (
                          <p className={`text-xs mb-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                            <Tag size={12} className="inline-block mr-1" />
                            Reassigned to {conv.agent_name} by {/* Admin Name clickable */}
                            {conv.reassigned_by_admin_id ? (
                                <span
                                    className="cursor-pointer hover:underline"
                                    onClick={(e) => { e.stopPropagation(); navigate(`/agency-admin-profile/${conv.reassigned_by_admin_id}`); }}
                                >
                                    {conv.reassigned_by_admin_name}
                                </span>
                            ) : (
                                <span>{conv.reassigned_by_admin_name}</span>
                            )}
                            on {new Date(conv.reassigned_at).toLocaleDateString()}
                          </p>
                        )}
                        <p className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <MessageSquare size={14} className="inline-block mr-1" />
                          Last Message: <span className={`${isBold && !isReassignedFromMe ? 'text-red-400 font-semibold' : ''}`}>{conv.lastMessage || 'No messages yet'}</span>
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Clock size={12} className="inline-block mr-1" />
                          {new Date(conv.lastMessageTimestamp).toLocaleString()}
                        </p>
                        <div className="mt-2 flex gap-2 justify-end">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleArchiveConversation(conv.id, isReassignedFromMe); }}
                                className={`p-1 rounded-full ${darkMode ? "text-gray-400 hover:text-green-300" : "text-gray-600 hover:text-green-700"}`}
                                title={isReassignedFromMe ? "Remove from my list" : "Archive Conversation"}
                            >
                                {isReassignedFromMe ? <TrashIcon className="h-5 w-5" /> : <ArchiveBoxIcon className="h-5 w-5" />}
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
              <table className={`w-full mt-4 text-left text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <thead><tr className={darkMode ? "text-gray-400" : "text-gray-500"}>{[{key: 'client_name', label: 'Client'}, {key: 'property_title', label: 'Property'}, {key: 'last_message', label: 'Last Message'}, {key: 'last_message_timestamp', label: 'Last Activity'}, {key: 'assigned_agent', label: 'Assigned To'}, {key: 'status', label: 'Status'}, {key: 'actions', label: 'Actions'}].map(c => <th key={c.key} onClick={() => handleSortClick(c.key)} className={`py-2 px-2 cursor-pointer select-none ${sortKey === c.key ? (darkMode ? 'text-green-400' : 'text-green-700') : ''}`} style={{width: c.key === 'last_message' ? '200px' : '150px'}}><div className="flex items-center gap-1"><span>{c.label}</span>{renderSortIcon(c.key)}</div></th>)}</tr></thead>
                <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                  {groupedConversations.length > 0 ? groupedConversations.map(conv => {
                    // Determine if the conversation has unread messages FOR THE AGENT
                    const hasUnreadMessagesForAgent = conv.messages.some(msg =>
                      msg.sender_id === conv.client_id && !msg.read
                    );

                    // Determine display status: "New Message" if unread messages OR if agent hasn't responded yet
                    // "Responded" only if agent has sent a message AND all client messages are read
                    let displayStatus = conv.is_agent_responded ? 'Responded' : 'New Message';

                    // Text bolding logic: bold if new message status AND modal is not open for this conversation
                    const isBold = hasUnreadMessagesForAgent && openedConversationId !== conv.id;

                    // NEW: Determine if this inquiry was reassigned FROM the current agent
                    const isReassignedFromMe = conv.isReassignedFromMe;
                    if (isReassignedFromMe) {
                      displayStatus = 'Reassigned';
                    }

                    return (
                      <tr key={conv.id} className={`border-t cursor-pointer ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"} ${isBold && !isReassignedFromMe ? 'font-bold' : 'font-normal'} ${isReassignedFromMe ? 'opacity-60 bg-yellow-100 dark:bg-yellow-900' : ''}`} onClick={() => handleViewConversation(conv)}>
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
                                        onClick={e => { e.stopPropagation(); navigate(`/agent/client-profile/${conv.client_id}`) }}
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
                        <td className={`py-2 px-2 truncate ${isBold && !isReassignedFromMe ? 'text-red-600 font-semibold' : ''}`} title={conv.lastMessage}>{conv.lastMessage || '...'}</td>
                        <td className="py-2 px-2 truncate">{new Date(conv.lastMessageTimestamp).toLocaleString()}</td>
                        <td className="py-2 px-2 truncate">
                          {/* Agent Name clickable */}
                          <span
                            className={`font-medium ${conv.agent_id ? 'cursor-pointer hover:underline' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (conv.agent_id) navigate(`/agent-profile/${conv.agent_id}`);
                            }}
                          >
                            {conv.agent_name || 'Unassigned'}
                          </span>
                          {isReassignedFromMe && conv.reassigned_by_admin_name && conv.reassigned_at && (
                            <p className={`text-xs ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                              (from {conv.original_agent_name} by {/* Admin Name clickable */}
                              {conv.reassigned_by_admin_id ? (
                                  <span
                                      className="cursor-pointer hover:underline"
                                      onClick={(e) => { e.stopPropagation(); navigate(`/agency-admin-profile/${conv.reassigned_by_admin_id}`); }}
                                  >
                                      {conv.reassigned_by_admin_name}
                                  </span>
                              ) : (
                                  <span>{conv.reassigned_by_admin_name}</span>
                              )}{" "}
                              on {new Date(conv.reassigned_at).toLocaleDateString()})
                            </p>
                          )}
                        </td>
                        <td className={`py-2 px-2 truncate font-semibold ${displayStatus === 'New Message' ? 'text-red-600' : (displayStatus === 'Reassigned' ? (darkMode ? 'text-yellow-400' : 'text-yellow-700') : (darkMode ? 'text-green-400' : 'text-green-700'))}`}>{displayStatus}</td>
                        <td className="py-2 px-2 text-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleArchiveConversation(conv.id, isReassignedFromMe); }}
                                className={`p-1 rounded-full ${darkMode ? "text-gray-400 hover:text-green-300" : "text-gray-600 hover:text-green-700"}`}
                                title={isReassignedFromMe ? "Remove from my list" : "Archive Conversation"}
                            >
                                {isReassignedFromMe ? <TrashIcon className="h-5 w-5" /> : <ArchiveBoxIcon className="h-5 w-5" />}
                            </button>
                        </td>
                      </tr>
                    )
                  }) : <tr><td colSpan="7" className="py-8 text-center text-gray-500">No conversations.</td></tr>}
                </tbody>
              </table>
            </div>
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
            onDelete={() => handleArchiveConversation(selectedConversation.id, selectedConversation.isReassignedFromMe)} // Now calls archive
            onSendMessage={handleSendMessageToConversation}
            isReassignedForCurrentAgent={selectedConversation.isReassignedFromMe} // NEW PROP
            userRole={currentUserRole} // NEW: Pass the userRole to the modal
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

export default AgentInquiries;

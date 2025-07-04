import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import AgentSidebar from '../../components/agent/Sidebar';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Menu, X } from 'lucide-react';
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
  // New state to track which conversation is currently opened in the modal
  const [openedConversationId, setOpenedConversationId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getAgentUserId = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).userId;
    } catch (error) {
      return null;
    }
  }, []);

  const agentUserId = getAgentUserId();

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


    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_inquiry_for_agent', fetchInquiries);
      socket.off('message_read_ack', handleReadAck);
      socket.off('conversation_deleted', fetchInquiries);
      socket.off('inquiry_list_changed', fetchInquiries);
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

    // Only mark as read if there are unread messages. Status remains "New Message" until agent sends reply.
    if (conversation.unreadCount > 0) {
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

  const handleDeleteInquiry = async () => {
    if (!selectedConversation) return;
    showConfirm({
      title: "Delete Conversation",
      message: `Are you sure you want to delete this conversation with ${selectedConversation.clientName}? This is irreversible.`,
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/inquiries/agent/delete-conversation/${selectedConversation.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          showMessage('Conversation deleted.', 'success');
          setIsAgentInquiryModalOpen(false);
          setOpenedConversationId(null); // Clear opened conversation ID
          fetchInquiries();
        } else {
          showMessage('Failed to delete conversation.', 'error');
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

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {isMobile && <motion.button onClick={() => setIsSidebarOpen(p => !p)} className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-white"}`}><AnimatePresence mode="wait"><motion.div key={isSidebarOpen ? 'x' : 'm'} initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</motion.div></AnimatePresence></motion.button>}
      <AgentSidebar collapsed={isCollapsed} setCollapsed={setIsCollapsed} activeSection={activeSection} setActiveSection={setActiveSection} isMobile={isMobile} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <motion.div key={isMobile ? 'mobile' : 'desktop'} animate={{ marginLeft: contentShift }} transition={{ duration: 0.3 }} className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0">
        <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Inquiries</h1>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input type="text" placeholder="Search..." className={`w-full md:w-1/3 py-2 px-4 border rounded-xl h-10 focus:outline-none focus:ring-1 ${darkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-green-400" : "bg-white border-gray-300 focus:ring-green-600"}`} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full mt-4 text-left text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <thead><tr className={darkMode ? "text-gray-400" : "text-gray-500"}>{[{key: 'client_name', label: 'Client'}, {key: 'property_title', label: 'Property'}, {key: 'last_message', label: 'Last Message'}, {key: 'last_message_timestamp', label: 'Last Activity'}, {key: 'status', label: 'Status'}].map(c => <th key={c.key} onClick={() => handleSortClick(c.key)} className={`py-2 px-2 cursor-pointer select-none ${sortKey === c.key ? (darkMode ? 'text-green-400' : 'text-green-700') : ''}`} style={{width: c.key === 'last_message' ? '200px' : '150px'}}><div className="flex items-center gap-1"><span>{c.label}</span>{renderSortIcon(c.key)}</div></th>)}</tr></thead>
              <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                {groupedConversations.length > 0 ? groupedConversations.map(conv => {
                  // Determine if the conversation has unread messages FOR THE AGENT
                  const hasUnreadMessagesForAgent = conv.messages.some(msg =>
                    msg.sender_id === conv.client_id && !msg.read
                  );

                  // Determine display status: "New Message" if unread messages OR if agent hasn't responded yet
                  // "Responded" only if agent has sent a message AND all client messages are read
                  const displayStatus = conv.is_agent_responded ? 'Responded' : 'New Message';

                  // Text bolding logic: bold if new message status AND modal is not open for this conversation
                  const isBold = hasUnreadMessagesForAgent && openedConversationId !== conv.id;

                  return (
                    <tr key={conv.id} className={`border-t cursor-pointer ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"} ${isBold ? 'font-bold' : 'font-normal'}`} onClick={() => handleViewConversation(conv)}>
                      <td className="py-2 px-2 truncate" title={conv.clientName}><span className="flex items-center">{conv.clientName}{conv.client_id && <button onClick={e => { e.stopPropagation(); navigate(`/agent/client-profile/${conv.client_id}`) }} className="ml-2 py-1 px-2 bg-purple-500 text-white rounded-xl text-xs">View</button>}</span></td>
                      <td className="py-2 px-2 truncate" title={conv.propertyTitle}><span className="flex items-center">{conv.propertyTitle || 'General'}{conv.property_id && <button onClick={e => { e.stopPropagation(); navigate(`/listings/${conv.property_id}`) }} className="ml-2 py-1 px-2 bg-blue-500 text-white rounded-xl text-xs">View</button>}</span></td>
                      <td className={`py-2 px-2 truncate ${isBold ? 'text-red-600 font-semibold' : ''}`} title={conv.lastMessage}>{conv.lastMessage || '...'}</td>
                      <td className="py-2 px-2 truncate">{new Date(conv.lastMessageTimestamp).toLocaleString()}</td>
                      <td className={`py-2 px-2 truncate font-semibold ${displayStatus === 'New Message' ? 'text-red-600' : (darkMode ? 'text-green-400' : 'text-green-700')}`}>{displayStatus}</td>
                    </tr>
                  )
                }) : <tr><td colSpan="5" className="py-8 text-center text-gray-500">No conversations.</td></tr>}
              </tbody>
            </table>
          </div>
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentInquiries;

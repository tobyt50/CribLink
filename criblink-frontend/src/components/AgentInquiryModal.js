import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Trash2, EllipsisVertical, Copy, Phone, Mail, Tag } from 'lucide-react'; // Added Tag icon
import { useMessage } from '../context/MessageContext';
import socket from '../socket';
import API_BASE_URL from '../config'; // Ensure this import path is correct
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const AgentInquiryModal = ({ isOpen, onClose, darkMode, conversation, onViewProperty, onDelete, onSendMessage, isReassignedForCurrentAgent, userRole }) => {
  if (!isOpen) return null;

  const navigate = useNavigate(); // Initialize useNavigate hook

  // chatHistory is used for optimistic updates and real-time appending of messages.
  // It is initialized from the 'conversation' prop and updated locally.
  const [chatHistory, setChatHistory] = useState(conversation?.messages || []);
  const [agentMessage, setAgentMessage] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const { showMessage } = useMessage();
  const modalRef = useRef(null);
  const chatEndRef = useRef(null);
  const optionsMenuRef = useRef(null);
  const isGuestConversation = conversation && !conversation.client_id;

  // Determine if the current user can send messages
  // Agency admins can also send messages now
  const canSendMessage = !isReassignedForCurrentAgent && (userRole === 'agent' || userRole === 'agency_admin');

  // Effect to reset chat history when conversation prop changes (e.g., a new conversation is selected,
  // or the parent 'AgentInquiries' updates the conversation data from a socket event).
  // This ensures the modal's internal chat history is always aligned with the latest data from the parent.
  useEffect(() => {
    setChatHistory(conversation?.messages || []);
  }, [conversation]);

  // Effect to scroll to the bottom of the chat history when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [chatHistory]);

  // Effect to close modal and options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) onClose();
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) setShowOptionsMenu(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Effect to mark messages as read when the modal opens or the conversation changes.
  // This ensures that when the agent/admin opens the chat, the client's messages are marked as read by them.
  // Importantly, it also emits a socket event to inform the client that messages have been read.
  useEffect(() => {
    if (isOpen && conversation?.id && !isReassignedForCurrentAgent) { // Only mark as read if not reassigned from current agent
      const roleToMarkAsRead = userRole === 'agency_admin' ? 'agency_admin' : 'agent'; // Use 'agency_admin' role if applicable
      const token = localStorage.getItem('token');
      if (token) { // Only attempt to mark as read if a token exists
        fetch(`${API_BASE_URL}/inquiries/${roleToMarkAsRead}/mark-read/${conversation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).then(response => {
          if (!response.ok) {
            console.error('Failed to mark messages as read on modal open:', response.statusText);
          } else {
            // Emit socket event to notify the other party (client) that messages have been read by the agent/admin.
            const currentUserId = JSON.parse(atob(token.split('.')[1])).userId; // Get current user's userId from token
            socket.emit('message_read', { conversationId: conversation.id, userId: currentUserId, role: roleToMarkAsRead });
          }
        }).catch(error => console.error('Error marking messages as read on modal open:', error));
      }
    }
  }, [isOpen, conversation?.id, isReassignedForCurrentAgent, userRole]); // Re-run effect if modal open state, conversation ID, or userRole changes

  // Real-time listeners for new messages and read acknowledgements
  useEffect(() => {
    if (!isOpen || !conversation?.id) return;

    // Join the specific conversation room to receive real-time updates
    socket.emit('join_conversation', conversation.id);

    const handleNewMessage = (newMessage) => {
      if (newMessage.conversationId === conversation.id) {
        setChatHistory(prev => {
            // Prevent adding duplicate messages and update chat history
            const updatedHistory = prev.some(msg => msg.inquiry_id === newMessage.inquiryId) ? prev : [...prev, {
                ...newMessage,
                sender: newMessage.senderId === conversation.client_id ? 'Client' : (newMessage.senderId === conversation.agent_id ? 'Agent' : 'Agency Admin'), // Distinguish senders
                // If the message is from the client while the modal is open, it's immediately read by the agent/admin
                read: newMessage.senderId === conversation.client_id ? true : newMessage.read
            }];

            // If the incoming message is from the client, mark it as read on the backend.
            // This will trigger a 'message_read_ack' for the client (sender).
            if (newMessage.senderId === conversation.client_id && !isReassignedForCurrentAgent) { // Only mark as read if not reassigned
                const roleToMarkAsRead = userRole === 'agency_admin' ? 'agency_admin' : 'agent';
                const token = localStorage.getItem('token');
                if (token) {
                    fetch(`${API_BASE_URL}/inquiries/${roleToMarkAsRead}/mark-read/${conversation.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    }).then(response => {
                        if (!response.ok) console.error('Failed to mark messages as read on new message receipt:', response.statusText);
                        else {
                            // Emit socket event to inform the client that their message has been read by the agent/admin.
                            const currentUserId = JSON.parse(atob(token.split('.')[1])).userId; // Get current user's userId from token
                            socket.emit('message_read', { conversationId: conversation.id, userId: currentUserId, role: roleToMarkAsRead });
                        }
                    }).catch(error => console.error('Error marking messages as read on new message receipt:', error));
                }
            }
            return updatedHistory;
        });
      }
    };

    // Listener for read acknowledgements from the client
    // This updates the 'read' status of messages sent by the Agent/Admin in the current chat.
    const handleReadAck = ({ conversationId, role }) => {
      // If the client has read messages in this conversation, mark agent's/admin's sent messages as read
      if (conversationId === conversation.id && role === 'client') {
        setChatHistory(prev => prev.map(msg => (msg.sender === 'Agent' || msg.sender === 'Agency Admin') ? { ...msg, read: true } : msg));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_read_ack', handleReadAck);

    return () => {
      // Leave the conversation room and remove listeners on component unmount or modal close
      socket.emit('leave_conversation', conversation.id);
      socket.off('new_message', handleNewMessage);
      socket.off('message_read_ack', handleReadAck);
    };
  }, [isOpen, conversation, conversation?.id, isReassignedForCurrentAgent, userRole]); // Re-run effect if modal open state or conversation changes

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!agentMessage.trim()) return showMessage('Please enter a message.', 'error');
    if (!canSendMessage) return showMessage('You do not have permission to reply to this inquiry.', 'warning'); // Prevent sending message if not allowed

    // Optimistically add the message to the chat history for immediate display
    const optimisticMessage = {
      inquiry_id: Date.now(), // Temporary ID for optimistic update
      sender: userRole === 'agency_admin' ? 'Agency Admin' : 'Agent', // Set sender based on current user's role
      message: agentMessage,
      timestamp: new Date().toISOString(),
      read: false, // This message is new, read status is for the other party (client)
      sender_id: userRole === 'agency_admin' ? conversation.agency_admin_id : conversation.agent_id // Assuming the conversation object has agency_admin_id or agent_id
    };
    setChatHistory(prev => [...prev, optimisticMessage]);

    // Send message via prop function (which calls the API and emits socket event)
    await onSendMessage(conversation.id, agentMessage);
    setAgentMessage(''); // Clear the input field
  };

  const handleCopyToClipboard = (text) => {
    // Copies text to clipboard, uses fallback if navigator.clipboard is not available
    document.execCommand('copy', false, text);
    showMessage('Copied to clipboard!', 'success');
  };

  const handleViewClientProfile = () => {
    if (conversation?.client_id) {
      if (userRole === 'agent') navigate(`/agent/client-profile/${conversation.client_id}`);
      else if (userRole === 'agency_admin') navigate(`/agency/client-profile/${conversation.client_id}`);
    } else {
      showMessage('Client ID not available.', 'error');
    }
  };

  // Groups messages by date for display in the chat history
  const groupMessagesByDate = (messages) => {
    return messages.reduce((acc, msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {});
  };

  const groupedChatHistory = groupMessagesByDate(chatHistory);
  // Determines message bubble styling based on sender and dark mode
  const bubbleStyle = (sender) => {
    if (sender === 'Agent' || sender === 'Agency Admin') { // Both agent and agency admin messages appear on the right
      return darkMode ? 'bg-green-600 text-white self-end rounded-br-none' : 'bg-green-500 text-white self-end rounded-br-none';
    } else { // Client messages appear on the left
      return darkMode ? 'bg-gray-700 text-gray-100 self-start rounded-bl-none' : 'bg-gray-200 text-gray-800 self-start rounded-bl-none';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div ref={modalRef} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`relative rounded-3xl p-6 shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'}`}>
        {/* Close and Options Menu buttons */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <div className="relative" ref={optionsMenuRef}>
            <button onClick={() => setShowOptionsMenu(s => !s)} className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}><EllipsisVertical size={20} /></button>
            {showOptionsMenu && <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${darkMode ? 'bg-gray-700' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
              <button onClick={() => { onDelete(); setShowOptionsMenu(false); }} className={`flex items-center w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-red-300 hover:bg-gray-600' : 'text-red-700 hover:bg-gray-100'}`} disabled={isReassignedForCurrentAgent}> {/* Disable delete if reassigned */}
                <Trash2 size={16} className="mr-2" /> Delete Conversation
              </button>
            </motion.div>}
          </div>
          <button onClick={onClose} className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}><X size={20} /></button>
        </div>
        {/* Conversation Header/Details */}
        <div className="flex-shrink-0">
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
            Chat with {conversation.client_id ? (
                <span
                    className="cursor-pointer hover:underline"
                    // Allow navigation to client profile based on userRole
                    onClick={(e) => {
                        e.stopPropagation();
                        if (userRole === 'agent') navigate(`/agent/client-profile/${conversation.client_id}`);
                        else if (userRole === 'agency_admin') navigate(`/agency/client-profile/${conversation.client_id}`);
                    }}
                >
                    {conversation.clientName || 'Client'}
                </span>
            ) : (
                <span>{conversation.clientName || 'Client'}</span>
            )}
          </h2>
          <div className="text-sm mb-2 space-y-2">
            <p className="flex items-center">
                <strong>Client:</strong>&nbsp;
                {conversation.client_id ? (
                    <span
                        className="cursor-pointer hover:underline"
                        // Allow navigation to client profile based on userRole
                        onClick={(e) => {
                            e.stopPropagation();
                            if (userRole === 'agent') navigate(`/agent/client-profile/${conversation.client_id}`);
                            else if (userRole === 'agency_admin') navigate(`/agency/client-profile/${conversation.client_id}`);
                        }}
                    >
                        {conversation.clientName || 'N/A'}
                    </span>
                ) : (
                    <span>{conversation.clientName || 'N/A'}</span>
                )}
                {conversation.client_id && ( // Only show "View Profile" button if client_id exists
                  <button 
                    onClick={handleViewClientProfile} 
                    className="ml-2 py-1 px-2 bg-purple-500 text-white rounded-xl text-xs"
                  >
                    View Profile
                  </button>
                )}
            </p>
            {conversation.clientEmail && (
              <p className="flex items-center">
                <strong>Email:</strong>&nbsp;
                <a href={`mailto:${conversation.clientEmail}`} className={`hover:underline ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {conversation.clientEmail}
                </a>
                {isGuestConversation && (
                  <>
                    <button onClick={() => handleCopyToClipboard(conversation.clientEmail)} className={`ml-2 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <Copy size={16} />
                    </button>
                    <a href={`mailto:${conversation.clientEmail}`} className={`ml-2 p-1 rounded-full ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}>
                      <Mail size={16} />
                    </a>
                  </>
                )}
              </p>
            )}
            {conversation.clientPhone && (
              <p className="flex items-center">
                <strong>Phone:</strong>&nbsp;
                <a href={`tel:${conversation.clientPhone}`} className={`hover:underline ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {conversation.clientPhone}
                </a>
                {isGuestConversation && (
                  <>
                    <button onClick={() => handleCopyToClipboard(conversation.clientPhone)} className={`ml-2 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <Copy size={16} />
                    </button>
                    <a href={`tel:${conversation.clientPhone}`} className={`ml-2 p-1 rounded-full ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}>
                      <Phone size={16} />
                    </a>
                  </>
                )}
              </p>
            )}
            {conversation.property_id && <p className="flex items-center"><strong>Property:</strong>&nbsp;<span className="truncate max-w-[calc(100%-120px)]" title={conversation.propertyTitle}>{conversation.propertyTitle}</span><button onClick={() => onViewProperty(conversation.property_id)} className="ml-2 py-1 px-3 bg-blue-500 text-white rounded-xl text-xs">View</button></p>}
          </div>
          {isReassignedForCurrentAgent && conversation.reassigned_by_admin_name && conversation.reassigned_at && (
            <div className={`mt-2 p-2 rounded-xl ${darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'} flex items-center text-sm`}>
              <Tag size={16} className="mr-2 flex-shrink-0" />
              <span>
  This inquiry was reassigned to{" "}
  {conversation.agent_id ? (
    <span
      className="font-semibold cursor-pointer hover:underline"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/agent-profile/${conversation.agent_id}`);
      }}
    >
      {conversation.agent_name}
    </span>
  ) : (
    <span className="font-semibold">{conversation.agent_name}</span>
  )}{" "}
  by{" "}
  {conversation.reassigned_by_admin_id ? (
    <span
      className="font-semibold cursor-pointer hover:underline"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/agency-admin-profile/${conversation.reassigned_by_admin_id}`);
      }}
    >
      {conversation.reassigned_by_admin_name}
    </span>
  ) : (
    <span className="font-semibold">{conversation.reassigned_by_admin_name}</span>
  )}{" "}
  on{" "}
  {new Date(conversation.reassigned_at).toLocaleDateString()}.{" "}
  You have view-only access.
</span>

            </div>
          )}
        </div>
        {/* Chat History Area */}
        <div className="flex-grow overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-4 space-y-4 h-[200px] backdrop-blur-sm bg-gray-50 dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">

          {Object.entries(groupedChatHistory).map(([date, messagesForDate]) => (
            <div key={date}>
              <div className="relative text-center my-4"><span className={`px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>{date}</span></div>
              {messagesForDate.map((entry, index) => (
                <div key={entry.inquiry_id || index} className={`flex items-end max-w-[80%] my-2 ${entry.sender === 'Agent' || entry.sender === 'Agency Admin' ? 'self-end justify-end ml-auto' : 'self-start justify-start mr-auto'}`}>
                  <div className={`flex flex-col px-3 py-2 rounded-2xl shadow-md ${bubbleStyle(entry.sender)}`}><p className="text-sm whitespace-pre-wrap">{entry.message}</p><div className="flex justify-end items-center text-xs mt-1 opacity-70"><span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>{(entry.sender === 'Agent' || entry.sender === 'Agency Admin') && <span className={`ml-1 ${entry.read ? 'text-green-400' : 'text-gray-400'}`}>{entry.read ? '✓✓' : '✓'}</span>}</div></div>
                </div>
              ))}
            </div>
          ))}
          <div ref={chatEndRef}></div> {/* Scroll target */}
        </div>
        {/* Message Input Form */}
        {!isGuestConversation && (
          <form onSubmit={handleSendMessage} className="flex-shrink-0 flex items-center mt-2">
            <textarea
              value={agentMessage}
              onChange={e => setAgentMessage(e.target.value)}
              rows="1"
              placeholder={!canSendMessage ? "You do not have permission to reply." : "Type your message..."}
              className={`flex-grow p-3 border rounded-full resize-none focus:outline-none focus:ring-1 mr-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-green-400' : 'bg-white border-gray-300 focus:ring-green-600'} ${!canSendMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={!canSendMessage} // Disable input if not allowed to send message
            />
            <button
              type="submit"
              className={`flex-shrink-0 bg-green-500 text-white rounded-full p-3 hover:bg-green-600 transition shadow-lg ${!canSendMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canSendMessage} // Disable button if not allowed to send message
            >
              <Send size={20} />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default AgentInquiryModal;

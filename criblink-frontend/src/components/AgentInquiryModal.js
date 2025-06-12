// components/AgentInquiryModal.js
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMessage } from '../context/MessageContext';

const AgentInquiryModal = ({
  isOpen,
  onClose,
  darkMode,
  conversation, // Now receives a conversation object
  initialAgentMessage,
  onViewProperty,
  onDelete,
  onSendMessage, // New prop for sending messages
}) => {
  if (!isOpen) return null;

  const [chatHistory, setChatHistory] = useState([]);
  const [agentMessage, setAgentMessage] = useState('');
  const { showMessage } = useMessage();
  const modalRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Flatten and enrich messages from the conversation prop
    if (conversation && conversation.messages) {
      const messages = conversation.messages.map(msg => ({
        sender: msg.sender,
        message: msg.message || msg.response, // Use 'message' or 'response' field
        timestamp: msg.timestamp,
        read: msg.read, // Inherit read status from parent
      }));
      setChatHistory(messages);
    }
    setAgentMessage(initialAgentMessage || '');
  }, [isOpen, conversation, initialAgentMessage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!agentMessage.trim()) {
      showMessage('Please enter a response to send.', 'error');
      return;
    }

    // Call the parent's onSendMessage handler
    await onSendMessage(conversation.id, agentMessage);

    // After successful send, update local chat history to reflect the new message
    const newMessage = {
      sender: 'Agent',
      message: agentMessage,
      timestamp: new Date().toISOString(),
      read: true, // Agent's own message is read
      // Simulate client read status after sending, assuming client sees it eventually
      delivered: true, // Simulate delivered status
      seen: false // Simulate seen status (could be updated by backend later)
    };
    setChatHistory(prevHistory => {
        const updatedHistory = [...prevHistory, newMessage];
        // Ensure messages are sorted by timestamp
        return updatedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    });
    setAgentMessage(''); // Clear input
    showMessage('Message sent successfully.', 'success');
  };

  const bubbleStyle = (sender) =>
    sender === 'Agent'
      ? darkMode
        ? 'bg-green-600 text-white self-end rounded-br-none' // Agent messages on right, rounded corners
        : 'bg-green-500 text-white self-end rounded-br-none'
      : darkMode
        ? 'bg-gray-700 text-gray-100 self-start rounded-bl-none' // Client messages on left
        : 'bg-gray-200 text-gray-800 self-start rounded-bl-none';

  // Helper to group messages by date
  const groupMessagesByDate = (messages) => {
    const grouped = new Map(); // Map<DateString, Array<Message>>
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date).push(msg);
    });
    return Array.from(grouped.entries()); // [[dateString, messagesArray], ...]
  };

  const groupedChatHistory = groupMessagesByDate(chatHistory);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative rounded-3xl p-6 shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col ${ // Changed max-w-2xl to max-w-lg
          darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${
            darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <X size={20} />
        </button>

        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
          Chat with {conversation.clientName}
        </h2>

        <div className="text-sm mb-2">
          <p>
            <strong>Email:</strong> {conversation.clientEmail}
          </p>
          {conversation.clientPhone && (
            <p>
              <strong>Phone:</strong> {conversation.clientPhone}
            </p>
          )}
          {conversation.property_id && (
            <p className="flex items-center">
              <strong>Property:</strong>&nbsp;
              <span className="truncate max-w-[calc(100%-120px)]" title={conversation.propertyTitle || conversation.property_id}>
                {conversation.propertyTitle || conversation.property_id}
              </span>
              <button
                onClick={() => onViewProperty(conversation.property_id)}
                className="ml-2 py-1 px-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-xs"
              >
                View
              </button>
            </p>
          )}
        </div>

        {/* Chat History Display */}
        <div className="flex-1 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-xl p-4 mb-4 space-y-4 bg-opacity-30 backdrop-blur-sm">
          {groupedChatHistory.map(([date, messagesForDate]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="relative text-center my-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                  {date}
                </span>
              </div>
              {messagesForDate.map((entry, index) => (
                <div
                  key={index} // Use a more unique key if possible in real app
                  className={`flex items-end max-w-[80%] my-2 ${entry.sender === 'Agent' ? 'self-end justify-end ml-auto' : 'self-start justify-start mr-auto'}`}
                >
                  <div className={`flex flex-col px-3 py-2 rounded-2xl shadow-md ${bubbleStyle(entry.sender)}`}>
                    <p className="text-sm whitespace-pre-wrap">{entry.message}</p>
                    <div className="flex justify-end items-center text-xs mt-1 opacity-70">
                      <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {entry.sender === 'Agent' && (
                        // Simulate read status icons
                        <span className="ml-1 text-xs">
                          {entry.read ? '✓✓' : '✓'} {/* Double tick for read, single for sent */}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={chatEndRef}></div> {/* For auto-scrolling to bottom */}
        </div>

        {/* Message Input and Actions */}
        <form onSubmit={handleSendMessage} className="mt-auto">
          <textarea
            value={agentMessage}
            onChange={(e) => setAgentMessage(e.target.value)}
            rows="2" // Reduced rows from 3 to 2
            placeholder="Type your message..."
            className={`w-full p-3 border rounded-xl resize-none focus:outline-none focus:ring-1 transition-all duration-200 mb-3 ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:ring-green-400'
                : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500 focus:ring-green-600'
            }`}
          />
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onDelete} // This now deletes the conversation
              className="py-2 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold"
            >
              Delete Conversation
            </button>
            <button
              type="submit"
              className="py-2 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold"
            >
              Send Message
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AgentInquiryModal;

// components/AgentInquiryModal.js
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const AgentInquiryModal = ({
  isOpen,
  onClose,
  onSubmit, // This handler will be the one in Inquiries.js (handleSubmitResolution)
  darkMode,
  inquiry, // The inquiry object
  initialAgentMessage, // Pre-fill for 'resolve' mode
  onViewProperty, // Handler to view the property listing
  onDelete, // Handler for deleting the inquiry
}) => {
  if (!isOpen) return null;

  // Local state for agent's response
  const [agentResponse, setAgentResponse] = useState(initialAgentMessage || '');

  // Local state for inquiry submission status within the modal
  const [inquiryStatus, setInquiryStatus] = useState(null); // 'success', 'error', or null

  // Ref for the modal content to detect clicks outside
  const modalRef = useRef(null);

  useEffect(() => {
    // Populate agent response for 'resolve' mode
    if (initialAgentMessage) {
      setAgentResponse(initialAgentMessage);
    } else {
      setAgentResponse(''); // Clear on open if no initial message
    }
    setInquiryStatus(null); // Reset status when modal opens
  }, [isOpen, initialAgentMessage]);


  const handleFormSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!agentResponse.trim()) {
      setInquiryStatus('error');
      return;
    }
    // Pass the inquiry object and agent's response for resolution
    onSubmit(inquiry, agentResponse, setInquiryStatus);
  };

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        ref={modalRef} // Assign ref to the modal content
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative rounded-3xl p-8 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
        >
          <X size={20} />
        </button>

        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Inquiry from {inquiry.name}</h2>

        {/* Status Messages */}
        {inquiryStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 mb-4 text-center text-green-700 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200"
          >
            Resolution sent successfully!
          </motion.div>
        )}
        {inquiryStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 mb-4 text-center text-red-700 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200"
          >
            Failed to send resolution. Please try again.
          </motion.div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <p className="mb-2">You are responding to: <span className="font-semibold">{inquiry.name} ({inquiry.email})</span></p>
          {inquiry.phone && <p className="mb-2">Phone: <span className="font-semibold">{inquiry.phone}</span></p>}
          {inquiry.property_id && (
            <p className="mb-2 flex items-center">
              <strong>About Property ID:</strong>{' '}
              <span className="truncate max-w-[calc(100%-120px)] inline-block ml-1" title={inquiry.property_id}>{inquiry.property_id}</span>
              <button
                onClick={() => onViewProperty(inquiry.property_id)}
                className="ml-2 py-1 px-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-xs"
              >
                View
              </button>
            </p>
          )}
          <h3 className={`text-lg font-bold mb-2 ${darkMode ? "text-green-300" : "text-green-600"}`}>Original Message:</h3>
          <p className="whitespace-pre-wrap rounded-lg p-3 border border-gray-300 dark:border-gray-600 mb-4 max-h-40 overflow-y-auto">
            {inquiry.message}
          </p>
          <div>
            <label htmlFor="agentResponse" className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Your Response:</label>
            <textarea
              id="agentResponse"
              value={agentResponse}
              onChange={(e) => setAgentResponse(e.target.value)}
              rows="3" // Adjusted height from 6 to 4 rows
              required
              className={`w-full p-3 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
              }`}
              placeholder="Type your message to the client here..."
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button" // Change to type="button" to prevent form submission
              onClick={onDelete}
              className="py-2 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold"
            >
              Delete
            </button>
            <button
              type="submit"
              className="py-2 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold"
            >
              Send Resolution
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AgentInquiryModal;

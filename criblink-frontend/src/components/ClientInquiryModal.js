// components/InquiryModal.js
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const InquiryModal = ({ isOpen, onClose, onSubmit, listingTitle, darkMode, userRole, clientName, clientEmail, clientPhone }) => {
  if (!isOpen) return null;

  const isClientAuthenticated = userRole === 'client';

  // Local states for form fields
  const [localInquiryName, setLocalInquiryName] = useState(isClientAuthenticated ? clientName : '');
  const [localInquiryEmail, setLocalInquiryEmail] = useState(isClientAuthenticated ? clientEmail : '');
  const [localInquiryPhone, setLocalInquiryPhone] = useState(isClientAuthenticated ? clientPhone : '');
  const [localInquiryMessage, setLocalInquiryMessage] = useState('');

  // Local state for inquiry submission status within the modal
  const [inquiryStatus, setInquiryStatus] = useState(null); // 'success', 'error', or null

  // Ref for the inquiry modal content to detect clicks outside
  const inquiryModalRef = useRef(null);

  // Update local state when authenticated client's info changes (e.g., initial fetch)
  useEffect(() => {
    if (isClientAuthenticated) {
      setLocalInquiryName(clientName);
      setLocalInquiryEmail(clientEmail);
      setLocalInquiryPhone(clientPhone);
    }
    // Also reset status when modal opens or user context changes
    setInquiryStatus(null);
  }, [isClientAuthenticated, clientName, clientEmail, clientPhone, isOpen]); // Add isOpen to dependency array

  const handleFormSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    const inquiryData = {
      name: localInquiryName,
      email: localInquiryEmail,
      phone: localInquiryPhone,
      message: localInquiryMessage,
    };
    // Pass local form data and local status setter to parent's onSubmit handler
    // The parent (App component) will handle the API call and update the status via this callback
    onSubmit(inquiryData, setInquiryStatus);

    // Clear local message field after submission attempt
    setLocalInquiryMessage('');
    // For guest users, also clear other fields, but only if submission was successful or if no error occurred
    // This is handled by the parent component's success logic, so we don't clear here immediately.
  };

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inquiryModalRef.current && !inquiryModalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]); // Depend on isOpen and onClose

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        ref={inquiryModalRef} // Assign ref to the modal content
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        // Adjusted max-h and overflow-y for vertical responsiveness
        className={`relative rounded-3xl p-8 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
        >
          <X size={20} />
        </button>
        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Inquire About "{listingTitle}"</h2>

        {/* Conditional display of inquiry status messages */}
        {inquiryStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 mb-4 text-center text-green-700 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200"
          >
            Inquiry sent successfully!
          </motion.div>
        )}
        {inquiryStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 mb-4 text-center text-red-700 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200"
          >
            Failed to send inquiry. Please try again.
          </motion.div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {isClientAuthenticated ? (
            <div className={`p-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"}`}>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Sending as: <strong className="font-semibold">{localInquiryName} ({localInquiryEmail})</strong>
                {localInquiryPhone && <span className="block text-sm">Phone: {localInquiryPhone}</span>}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="name" className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Name</label>
                <input
                  type="text"
                  id="name"
                  value={localInquiryName}
                  onChange={(e) => setLocalInquiryName(e.target.value)}
                  required
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                />
              </div>
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Email</label>
                <input
                  type="email"
                  id="email"
                  value={localInquiryEmail}
                  onChange={(e) => setLocalInquiryEmail(e.target.value)}
                  required
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                />
              </div>
              <div>
                <label htmlFor="phone" className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Phone (Optional)</label>
                <input
                  type="tel"
                  id="phone"
                  value={localInquiryPhone}
                  onChange={(e) => setLocalInquiryPhone(e.target.value)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="message" className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Message</label>
            <textarea
              id="message"
              value={localInquiryMessage}
              onChange={(e) => setLocalInquiryMessage(e.target.value)}
              rows="4"
              required
              className={`w-full p-3 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
              }`}
              placeholder="I am interested in this property..."
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="py-2 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold"
            >
              Send Inquiry
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default InquiryModal;

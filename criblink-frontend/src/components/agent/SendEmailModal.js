import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
<<<<<<< HEAD
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook
=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

const SendEmailModal = ({ isOpen, onClose, agentId, client, onSent }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
<<<<<<< HEAD
  const { darkMode } = useTheme(); // Use the dark mode context
=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

  if (!isOpen || !client) return null;

  const handleSend = async () => {
    try {
      setSending(true);
      await axios.post(
        `${API_BASE_URL}/clients/agent/${agentId}/clients/${client.user_id}/email`,
        { subject, message },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      onSent();
      onClose();
    } catch (err) {
      console.error('Failed to send email:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
<<<<<<< HEAD
      <div className={`rounded-xl p-6 w-full max-w-lg shadow-lg relative ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}>
        <button
          className={`absolute top-3 right-3 hover:text-red-500 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
=======
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          onClick={onClose}
        >
          ✕
        </button>
<<<<<<< HEAD
        <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Send Email to {client.full_name}</h2>
=======
        <h2 className="text-xl font-bold mb-4 text-green-700">Send Email to {client.full_name}</h2>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
<<<<<<< HEAD
          className={`w-full mb-3 px-4 py-2 border rounded
            ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"}`}
=======
          className="w-full mb-3 px-4 py-2 border border-gray-300 rounded"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
        />
        <textarea
          rows="5"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
<<<<<<< HEAD
          className={`w-full mb-4 px-4 py-2 border rounded
            ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"}`}
=======
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
        />
        <button
          onClick={handleSend}
          disabled={sending}
<<<<<<< HEAD
          className={`hover:bg-green-600 text-white py-2 px-4 rounded ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500"}`}
=======
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default SendEmailModal;

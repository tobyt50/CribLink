import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';

const SendEmailModal = ({ isOpen, onClose, agentId, client, onSent }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

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
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-green-700">Send Email to {client.full_name}</h2>

        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full mb-3 px-4 py-2 border border-gray-300 rounded"
        />
        <textarea
          rows="5"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default SendEmailModal;

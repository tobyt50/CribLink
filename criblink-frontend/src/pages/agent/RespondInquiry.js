import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API_BASE_URL from '../../config';

const RespondInquiry = () => {
  const { clientId } = useParams();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const sendMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/clients/agent/yourAgentId/clients/${clientId}/respond`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSent(true);
    } catch (err) {
      console.error('Failed to respond', err);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4 text-green-700">Respond to Client Inquiry</h2>
      <textarea
        rows="5"
        className="w-full p-4 border border-gray-300 rounded mb-4"
        placeholder="Write your message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={sendMessage}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Send Response
      </button>
      {sent && <p className="mt-4 text-green-600">Response sent successfully!</p>}
    </div>
  );
};

export default RespondInquiry;

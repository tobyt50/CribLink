import React, { useState, useEffect } from 'react';
import {
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

const ClientCard = ({ client, onSendEmail, onRespondInquiry, onViewProfile, onRemove, onToggleStatus }) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(client.notes || '');
  const [status, setStatus] = useState(client.client_status || 'regular');
  const { darkMode } = useTheme(); // Use the dark mode context

  useEffect(() => {
    setStatus(client.client_status || 'regular');
  }, [client.client_status]);

  const toggleVip = () => {
    if (onToggleStatus) {
      onToggleStatus();
    }
  };

  const saveNotes = () => {
    setIsEditingNotes(false);
    // Add API call here if needed
  };

  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-4 shadow ${darkMode ? "bg-gray-800 text-gray-200 border border-gray-700" : "bg-white border border-gray-200"}`}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className={`text-lg font-semibold ${darkMode ? "text-green-400" : "text-gray-900"}`}>{client.full_name}</h2>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{client.email}</p>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{new Date(client.date_joined).toLocaleDateString()}</p>
        </div>
        <button
          onClick={toggleVip}
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            status === 'vip'
              ? (darkMode ? 'bg-yellow-700 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
              : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500')
          }`}
          title="Click to change status"
        >
          {status === 'vip' ? 'VIP' : 'Regular'}
        </button>
      </div>

      <div>
        {isEditingNotes ? (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`w-full p-2 border rounded-lg text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-white border-gray-300"}`}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={saveNotes}
                className={`text-sm px-3 py-1 rounded ${darkMode ? "bg-green-700 text-white hover:bg-green-600" : "bg-green-600 text-white hover:bg-green-700"}`}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingNotes(false);
                  setNotes(client.notes || '');
                }}
                className={`text-sm px-3 py-1 rounded ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div
            className={`text-sm p-2 rounded cursor-pointer ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"}`}
            onClick={() => setIsEditingNotes(true)}
          >
            {notes || <span className={`italic ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Click to add notes</span>}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-2">
        <button
          onClick={onViewProfile}
          className={`flex items-center gap-1 text-sm hover:underline ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-800"}`}
        >
          <EyeIcon className="h-4 w-4" />
          View
        </button>
        <button
          onClick={onSendEmail}
          className={`flex items-center gap-1 text-sm hover:underline ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
        >
          <EnvelopeIcon className="h-4 w-4" />
          Email
        </button>
        <button
          onClick={onRespondInquiry}
          className={`flex items-center gap-1 text-sm hover:underline ${darkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-800"}`}
        >
          <ChatBubbleLeftIcon className="h-4 w-4" />
          Respond
        </button>
        <button
          onClick={onRemove}
          className={`flex items-center gap-1 text-sm hover:text-red-700 ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-500"}`}
          title="Remove client"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ClientCard;

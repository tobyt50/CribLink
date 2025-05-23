import React, { useState, useEffect } from 'react';
import {
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const ClientCard = ({ client, onSendEmail, onRespondInquiry, onViewProfile, onRemove, onToggleStatus }) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(client.notes || '');
  const [status, setStatus] = useState(client.client_status || 'regular');

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
    <div className="bg-white rounded-2xl shadow p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{client.full_name}</h2>
          <p className="text-sm text-gray-500">{client.email}</p>
          <p className="text-sm text-gray-400 mt-1">{new Date(client.date_joined).toLocaleDateString()}</p>
        </div>
        <button
          onClick={toggleVip}
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            status === 'vip' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'
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
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={saveNotes}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingNotes(false);
                  setNotes(client.notes || '');
                }}
                className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div
            className="text-sm text-gray-600 bg-gray-50 p-2 rounded cursor-pointer"
            onClick={() => setIsEditingNotes(true)}
          >
            {notes || <span className="italic text-gray-400">Click to add notes</span>}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-2">
        <button
          onClick={onViewProfile}
          className="flex items-center gap-1 text-sm text-green-600 hover:underline"
        >
          <EyeIcon className="h-4 w-4" />
          View
        </button>
        <button
          onClick={onSendEmail}
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <EnvelopeIcon className="h-4 w-4" />
          Email
        </button>
        <button
          onClick={onRespondInquiry}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
        >
          <ChatBubbleLeftIcon className="h-4 w-4" />
          Respond
        </button>
        <button
          onClick={onRemove}
          className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
          title="Remove client"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ClientCard;

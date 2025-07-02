import React from 'react';
import { useTheme } from '../../layouts/AppShell';
import {
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';

const ClientCard = ({
  client,
  onViewProfile,
  onSendEmail,
  onRespondInquiry,
  onToggleStatus,
  onRemoveClient,
  editingNoteId,
  editedNoteContent,
  onEditNote,
  onSaveNote,
  onCancelEdit,
  acceptAction,
  rejectAction,
  isPendingRequestCard
}) => {
  const { darkMode } = useTheme();

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const getInitial = (name) => {
    const safeName = String(name || '');
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : 'N/A';
  };

  const formatStatus = (status) => {
    if (!status) return 'Regular';
    if (status.toLowerCase() === 'vip') return 'VIP';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const profilePicUrl = client.profile_picture_url;
  const nameForInitial = client.full_name;

  return (
    <Card
      className="p-4 flex flex-col justify-between min-h-[250px] max-w-md"
      onClick={() => { !isPendingRequestCard && onViewProfile(client.user_id); }}
    >
      <div className="flex flex-row-reverse items-start gap-4 mb-4">
        <div className="flex-shrink-0 flex flex-col items-center">
          <img
            src={profilePicUrl || `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(nameForInitial)}`}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-2 border-green-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(nameForInitial)}`;
            }}
          />
          <div className={`text-sm mt-2 font-medium ${
            isPendingRequestCard
              ? (darkMode ? 'text-blue-400' : 'text-blue-600')
              : (client.client_status === 'vip' ? 'text-green-600' : (darkMode ? 'text-gray-300' : 'text-gray-600'))
          }`}>
            Status: {isPendingRequestCard ? 'Pending' : formatStatus(client.client_status)}
          </div>
        </div>

        <div className="flex-grow text-left">
          <div className="text-lg font-semibold mb-1">{client.full_name}</div>
          <div className="text-sm mb-1 text-gray-600 dark:text-gray-300">{client.email}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isPendingRequestCard ? `Requested: ${formatDate(client.date_joined)}` : `Joined: ${formatDate(client.date_joined)}`}
          </div>

          {/* Notes Section */}
          <div className="w-full mt-4 px-2">
            {isPendingRequestCard ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Message:</span>
                <span className="italic break-words block whitespace-pre-wrap">{client.notes || 'No message provided.'}</span>
              </div>
            ) : (
              editingNoteId === client.user_id ? (
                <div className="flex flex-col w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes:</span>
                  </div>
                  <textarea
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    className={`w-full p-2 border rounded-md text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-gray-800"}`}
                    value={editedNoteContent}
                    onChange={(e) => onEditNote(client.user_id, e.target.value)}
                    rows="2"
                    style={{ minHeight: '2rem', maxHeight: '5rem', overflowY: 'auto' }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSaveNote(client.user_id); }}
                      className={`p-1 rounded-full ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"}`}
                      title="Save Note"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onCancelEdit(); }}
                      className={`p-1 rounded-full ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
                      title="Cancel Edit"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 relative pr-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes:</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditNote(client.user_id, client.notes); }}
                      className={`p-1 rounded-full ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                      title="Edit Note"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="italic break-words block whitespace-pre-wrap">{client.notes || 'No notes yet.'}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-2 w-full pt-4 border-t border-gray-200 dark:border-gray-700">
        {isPendingRequestCard ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); acceptAction(); }}
              className={`flex items-center gap-1 rounded-xl px-3 py-1 text-sm transition-colors
                ${darkMode ? "text-green-400 hover:text-green-300 hover:bg-gray-700" : "text-green-700 hover:text-green-800 hover:bg-gray-100"} border border-transparent hover:border-green-500`}
              title="Accept Request"
            >
              <CheckCircleIcon className="h-5 w-5" /> Accept
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); rejectAction(); }}
              className={`flex items-center gap-1 rounded-xl px-3 py-1 text-sm transition-colors
                ${darkMode ? "text-red-400 hover:text-red-300 hover:bg-gray-700" : "text-red-700 hover:text-red-800 hover:bg-gray-100"} border border-transparent hover:border-red-500`}
              title="Reject Request"
            >
              <XCircleIcon className="h-5 w-5" /> Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onSendEmail(client); }}
              className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-700 hover:bg-gray-100"} border border-transparent hover:border-blue-500`}
            >
              Email
            </button>
            {/* Dynamic Respond/Chat button based on hasUnreadMessagesFromClient */}
            <button
                onClick={(e) => { e.stopPropagation(); onRespondInquiry(client); }}
                className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                ${client.hasUnreadMessagesFromClient
                    ? 'text-red-500 hover:text-red-600' // Respond (new message from client)
                    : 'text-blue-500 hover:text-blue-600' // Chat (agent initiates or continues chat, or starts new)
                } border border-transparent ${client.hasUnreadMessagesFromClient ? 'hover:border-red-500' : 'hover:border-blue-500'}`}
            >
                {client.hasUnreadMessagesFromClient ? 'Respond' : 'Chat'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStatus(client.user_id, client.client_status); }}
              className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`}
            >
              {client.client_status === 'vip' ? 'Make Regular' : 'Make VIP'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveClient(client.user_id); }}
              className={`h-8 w-8 flex items-center justify-center rounded-full ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-700 hover:bg-gray-100"} border border-transparent hover:border-red-500`}
              title="Remove Client"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </Card>
  );
};

export default ClientCard;

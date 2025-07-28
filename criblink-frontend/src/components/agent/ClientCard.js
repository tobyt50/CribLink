import React, { useState, useCallback } from 'react'; // Added useState and useCallback back
import { motion } from 'framer-motion';
import {
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon, // Import PhoneIcon
  StarIcon, // New import for VIP medal
  UserCircleIcon, // New import for Regular medal
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card'; // Assuming Card component path is correct
import { useTheme } from '../../layouts/AppShell'; // Ensure useTheme is imported correctly

// Separator component for buttons
const Separator = ({ darkMode }) => (
  <div className={`w-px h-6 ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
);

const ClientCard = ({
  client,
  onViewProfile,
  onSendEmail, // This prop is no longer used directly in ClientCard, but kept for compatibility
  onCallClient, // New prop for call action
  onRespondInquiry,
  onToggleStatus,
  onRemoveClient,
  editingNoteId, // This prop is now used for conditional rendering within ClientCard
  editedNoteContent, // This prop is now used for textarea value within ClientCard
  onEditNote, // This prop is now expected to update parent state for editingNoteId and editedNoteContent
  onSaveNote, // This prop is now used for button click within ClientCard
  onCancelEdit, // This prop is now used for button click within ClientCard
  acceptAction,
  rejectAction,
  isPendingRequestCard = false,
  userRole, // Pass userRole to control button visibility
  onFavoriteToggle, // New prop
  isFavorited = false, // New prop
}) => {
  const { darkMode } = useTheme(); // Use the hook directly
  const [isHovered, setIsHovered] = useState(false); // State for favorite button hover

  const isEditing = editingNoteId === client.user_id; // Reverted to use editingNoteId prop

  // Reverted handleNoteChange, handleSave, handleCancel to local scope
  const handleNoteChange = useCallback((e) => {
    onEditNote(client.user_id, e.target.value);
  }, [client.user_id, onEditNote]);

  const handleSave = useCallback(() => {
    onSaveNote(client.user_id);
  }, [client.user_id, onSaveNote]);

  const handleCancel = useCallback(() => {
    onCancelEdit();
  }, [onCancelEdit]);

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

  // Determine if actions are disabled for agency_admin
  const isAgencyAdmin = userRole === 'agency_admin';

  // Define button classes based on AgentCard.js
  const baseButtonClasses = `flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.7rem] font-medium transition-all duration-200 flex-shrink-0 whitespace-nowrap h-6`;
  const iconOnlyButtonClasses = `flex items-center justify-center rounded-xl px-1.5 py-0.5 h-6 flex-shrink-0 text-[0.7rem]`;

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent card click from triggering
    if (onFavoriteToggle) {
      onFavoriteToggle(client.user_id, isFavorited);
    }
  };


  return (
    <Card
      className="px-4 pt-4 pb-2 flex flex-col justify-between min-h-[200px] w-full lg:max-w-md break-words overflow-x-hidden"
      onClick={() => { !isPendingRequestCard && onViewProfile(client.user_id); }}
    >
      <div className="flex flex-row-reverse items-start gap-4 mb-4">
        <div className="flex-shrink-0 flex flex-col items-center relative">
          <img
            src={profilePicUrl || `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(nameForInitial)}`}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-2 border-green-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(nameForInitial)}`;
            }}
          />
          {onFavoriteToggle && ( // Only show favorite button if onFavoriteToggle is provided
            <button
              onClick={handleFavoriteClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`absolute top-0 right-0 p-1 rounded-full transition-colors`}
              title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-all duration-200" viewBox="0 0 20 20"
                fill={
                  isFavorited || isHovered // If favorited OR hovered, it's blue
                    ? (darkMode ? "rgb(96, 165, 250)" : "rgb(59, 130, 246)") // Tailwind blue-400/500
                    : "none" // Transparent fill when not favorited and not hovered
                }
                stroke={
                  isFavorited || isHovered // If favorited OR hovered, no stroke
                    ? "none"
                    : "rgb(156, 163, 175)" // Gray-400 for stroke when not favorited and not hovered
                }
                strokeWidth={isFavorited || isHovered ? "0" : "1"}
              >
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            </button>
          )}
          {/* Status aligned directly under profile picture with UserCard styling and distinct colors */}
          <div className="w-28 text-center text-xs font-medium mt-4"> {/* Increased mt-4 for more space */}
            <span className={
              isPendingRequestCard
                ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                : (client.client_status === 'vip'
                    ? 'text-green-600 dark:text-green-400' // VIP color
                    : (darkMode ? 'text-gray-500' : 'text-gray-500')) // Regular color for both light/dark
            }>
              {isPendingRequestCard ? 'Pending' : formatStatus(client.client_status)}
            </span>
          </div>
        </div>

        <div className="flex-grow text-left min-w-0 break-words">
          <div className="text-lg font-semibold mb-1 break-words">{client.full_name}</div>
          <div className="text-xs mb-1 text-gray-600 dark:text-gray-300 break-words"> {/* Reduced font size to text-xs */}
            <a href={`mailto:${client.email}`} className="text-gray-600 dark:text-gray-300 hover:underline"> {/* Changed text-blue-500 to gray */}
              {client.email}
            </a>
          </div>
          <div className="text-xs mb-1 text-gray-600 dark:text-gray-300 break-words"> {/* Reduced font size to text-xs */}
            {client.phone ? (
              <a href={`tel:${client.phone}`} className="text-gray-600 dark:text-gray-300 hover:underline"> {/* Changed text-blue-500 to gray */}
                {client.phone}
              </a>
            ) : <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>} {/* Reduced N/A font size */}
          </div>
          {client.date_joined && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isPendingRequestCard ? `Requested: ${formatDate(client.date_joined)}` : `Joined: ${formatDate(client.date_joined)}`}
            </div>
          )}
          {isAgencyAdmin && client.agent_name && ( // Display assigned agent for agency admins
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Agent: <span className="font-medium text-green-600 dark:text-green-400">{client.agent_name}</span>
            </div>
          )}

          <div className="w-full mt-4">
            {isPendingRequestCard ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} block mb-1`}>Message:</span>
                <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 pr-1 w-full overflow-hidden">
                  <span className="italic break-words block">
                    {client.notes || 'No message provided.'}
                  </span>
                </div>
              </div>
            ) : (
              isEditing && !isAgencyAdmin ? ( // Only allow editing if not agency admin
                <div className="flex flex-col w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes:</span>
                  </div>
                  <textarea
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    className={`w-full p-2 border rounded-md text-sm resize-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 overflow-y-auto ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-gray-800"}`}
                    value={editedNoteContent}
                    onChange={handleNoteChange} // Use local handler
                    rows="3"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSave(); }} // Use local handler
                      className={`p-1 rounded-full ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"}`}
                      title="Save Note"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancel(); }} // Use local handler
                      className={`p-1 rounded-full ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
                      title="Cancel Edit"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 relative break-words min-w-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes:</span>
                    {!isAgencyAdmin && ( // Only show edit button if not agency admin
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditNote(client.user_id, client.notes); }}
                        className={`p-1 rounded-full ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                        title="Edit Note"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {isAgencyAdmin && ( // Tooltip for agency admin
                      <span className="text-xs text-gray-400 ml-2" title="Only assigned agent can edit notes."></span>
                    )}
                  </div>
                  <div className="w-full max-h-[3.75rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 pr-1 overflow-hidden">
                    <span className="italic block break-words">
                      {client.notes || 'No notes yet.'}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-nowrap justify-center gap-0.5 w-full pt-1 pb-0 border-t border-gray-200 dark:border-gray-700 overflow-x-auto max-w-full"> {/* Changed pb-1 to pb-0 */}
        {isPendingRequestCard ? (
          <>
            {!isAgencyAdmin && ( // Only agents can accept/reject requests
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); acceptAction(); }}
                  className={`${baseButtonClasses} bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500`}
                  title="Accept Request"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" /> Accept
                </button>
                <Separator darkMode={darkMode} />
                <button
                  onClick={(e) => { e.stopPropagation(); rejectAction(); }}
                  className={`${baseButtonClasses} bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500`}
                  title="Reject Request"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" /> Reject
                </button>
                <Separator darkMode={darkMode} />
              </>
            )}
            {/* Removed Call button for pending requests */}
            <button
                onClick={(e) => { e.stopPropagation(); onRespondInquiry(client); }}
                className={`${iconOnlyButtonClasses} ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"} border border-transparent ${darkMode ? '' : 'hover:border-blue-500'}`}
                title="Chat with client"
            >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />Chat
            </button>
          </>
        ) : (
          <div className="flex gap-1 flex-nowrap overflow-x-auto pb-1">
            <button
              onClick={(e) => { e.stopPropagation(); onRespondInquiry(client); }}
              className={`${iconOnlyButtonClasses} ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"} border border-transparent ${darkMode ? '' : 'hover:border-blue-500'}`}
              title="Chat with client"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />Chat
            </button>
            <Separator darkMode={darkMode} />
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStatus(client.user_id, client.client_status); }}
              className={`${iconOnlyButtonClasses} ${isAgencyAdmin ? 'text-yellow-300 cursor-not-allowed opacity-50' : (darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-600 hover:bg-gray-100")} border border-transparent ${isAgencyAdmin ? '' : 'hover:border-yellow-500'}`}
              title={isAgencyAdmin ? "Only assigned agent can change client status" : (client.client_status === 'vip' ? 'Make Regular' : 'Make VIP')}
              disabled={isAgencyAdmin}
            >
              {client.client_status === 'vip' ? (
                <>
                  <UserCircleIcon className="h-4 w-4 mr-1" />Make Regular
                </>
              ) : (
                <>
                  <StarIcon className="h-4 w-4 mr-1" />Make VIP
                </>
              )}
            </button>
            <Separator darkMode={darkMode} />
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveClient(client.user_id); }}
              className={`${iconOnlyButtonClasses} ${isAgencyAdmin ? 'text-red-300 cursor-not-allowed opacity-50' : (darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-700 hover:bg-gray-100")} border border-transparent ${isAgencyAdmin ? '' : 'hover:border-red-500'}`}
              title={isAgencyAdmin ? "Only assigned agent can remove client" : "Disconnect client"}
              disabled={isAgencyAdmin}
            >
              <TrashIcon className="h-4 w-4 mr-1" />Disconnect
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClientCard;

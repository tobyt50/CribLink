import React, { useEffect } from 'react';
import { useTheme } from '../../layouts/AppShell';
import { User, Phone, Mail, Landmark, Star, Users, Hourglass, UserRoundCheck, CheckCircle, UserPlus, XCircle, X as XIcon, Flag } from 'lucide-react'; // Import Flag icon, renamed X to XIcon to avoid conflict
import { TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'; // Import TrashIcon for disconnect, ChatBubbleLeftRightIcon for chat
import Card from '../ui/Card';
import { useNavigate } from 'react-router-dom';

// Separator component for buttons
const Separator = ({ darkMode }) => (
  <div className={`w-px h-6 ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
);

const AgentCard = ({
  agent,
  onViewProfile,
  onConnectAgent,
  onCancelRequest,
  connectionStatus,
  isPendingRequestCard = false,
  onAcceptRequest,
  onRejectRequest,
  onDisconnectAgent,
  onReportAgent, // New prop for reporting
  onChatAgent, // New prop for chat
}) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  // --- Console Log for Debugging ---
  useEffect(() => {
    console.log("AgentCard: Agent data received:", agent);
    if (!agent.agency_id) {
      console.warn("AgentCard: Agent does not have an agency_id:", agent.full_name);
    }
  }, [agent]);
  // --- End Console Log ---

  const getInitial = (name) => {
    const safeName = String(name || '');
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : 'N/A';
  };

  const profilePicUrl = agent.profile_picture_url;
  const nameForInitial = agent.full_name;

  // Function to handle agency name click
  const handleAgencyClick = (e) => {
    e.stopPropagation(); // Prevent card's onViewProfile from triggering
    console.log("Agency click detected for agent:", agent.full_name, "Agency ID:", agent.agency_id);
    if (agent.agency_id) {
      navigate(`/agencies/${agent.agency_id}`); // Redirect to AgencyProfile page
    } else {
      console.warn("Cannot navigate to agency profile: agent.agency_id is missing or null.", agent);
    }
  };

  const renderActionButton = () => {
    // Base classes for all buttons for consistent styling
    // Reduced padding and fixed height for a smaller visual size
    // Further reduced font size to text-[0.65rem] (approximately 10.4px)
    const baseButtonClasses = `flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.7rem] font-medium transition-all duration-200 flex-shrink-0 whitespace-nowrap h-6`;
    // Applied same reduced padding and fixed height for consistency
    const iconOnlyButtonClasses = `flex items-center justify-center rounded-xl px-1.5 py-0.5 h-6 flex-shrink-0 text-[0.7rem]`; // Apply font size here too

    if (isPendingRequestCard) {
      if (connectionStatus === 'pending_received') {
        return (
          <div className="flex gap-2 justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); onAcceptRequest(agent.request_id, agent.user_id); }}
              className={`${baseButtonClasses} bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500`}
              title="Accept Request"
            >
              <CheckCircle size={12} /> Accept
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRejectRequest(agent.request_id); }}
              className={`${baseButtonClasses} bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500`}
              title="Reject Request"
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        );
      } else if (connectionStatus === 'pending_sent') {
        return (
          <button
            onClick={(e) => { e.stopPropagation(); onCancelRequest(agent.user_id); }}
            className={`${baseButtonClasses} bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500`}
            title="Cancel Pending Request"
          >
            <Hourglass size={12} /> Cancel
          </button>
        );
      }
    } else {
      switch (connectionStatus) {
        case 'connected':
          return (
            <div className="flex gap-1 justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); onChatAgent(agent); }} // Call onChatAgent with the agent object
                className={`${iconOnlyButtonClasses} ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-gray-100"} border border-transparent ${darkMode ? '' : 'hover:border-blue-500'}`}
                title="Chat with Agent"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />Chat
              </button>
              <Separator darkMode={darkMode} />
              <button
                onClick={(e) => { e.stopPropagation(); onReportAgent(agent.user_id); }}
                className={`${iconOnlyButtonClasses} ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"} border border-transparent ${darkMode ? '' : 'hover:border-red-500'}`}
                title="Report Agent"
              >
                <Flag size={14} className="mr-1" />Report
              </button>
              <Separator darkMode={darkMode} />
              <button
                onClick={(e) => { e.stopPropagation(); onDisconnectAgent(agent.user_id); }}
                className={`${iconOnlyButtonClasses} ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"} border border-transparent ${darkMode ? '' : 'hover:border-red-500'}`}
                title="Disconnect from Agent"
              >
                <TrashIcon className="h-4 w-4 mr-1" />Disconnect
              </button>
            </div>
          );
        case 'pending_sent':
          return (
            <button
              onClick={(e) => { e.stopPropagation(); onCancelRequest(agent.user_id); }}
              className={`${baseButtonClasses} bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500`}
              title="Cancel Pending Request"
            >
              <Hourglass size={12} /> Pending
            </button>
          );
        case 'pending_received':
          return (
            <button
              disabled
              className={`${baseButtonClasses} bg-blue-500 text-white opacity-70 cursor-not-allowed dark:bg-blue-600`}
              title="Incoming Request"
            >
              <UserRoundCheck size={12} /> Incoming
            </button>
          );
        case 'none':
        case 'rejected':
          return (
            <button
              onClick={(e) => { e.stopPropagation(); onConnectAgent(agent.user_id); }}
              className={`${baseButtonClasses} bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600`}
              title="Connect with Agent"
            >
              <UserPlus size={12} /> Connect
            </button>
          );
        default:
          return null;
      }
    }
  };

  return (
    <Card
      className="px-4 pt-4 pb-0 flex flex-col justify-between min-h-[200px] w-full lg:max-w-md break-words overflow-x-hidden cursor-pointer"
      onClick={() => onViewProfile(agent.user_id)}
    >
      <div className="flex flex-row-reverse items-start gap-4 mb-4">
        <div className="flex-shrink-0 flex flex-col items-center">
          <img
            src={profilePicUrl || `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(nameForInitial)}`}
            alt="Agent Profile"
            className="w-28 h-28 rounded-full object-cover border-2 border-green-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(nameForInitial)}`;
            }}
          />
          {/* Agent Rating and Deals Closed */}
          {agent.avg_rating && (
            <div className="w-28 text-center text-xs font-medium mt-2">
              <span className={`flex items-center justify-center ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                <Star size={14} className="mr-1" /> {agent.avg_rating.toFixed(1)} Avg. Rating
              </span>
            </div>
          )}
          {agent.deals_closed !== undefined && (
            <div className="w-28 text-center text-xs font-medium mt-1">
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Users size={14} className="mr-1 inline-block" /> {agent.deals_closed} Deals Closed
              </span>
            </div>
          )}
        </div>

        <div className="flex-grow text-left min-w-0 break-words flex flex-col justify-between">
          <div>
            <div className={`text-lg font-semibold mb-1 break-words ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{agent.full_name}</div>

            {/* Clickable Email - Now with inline-flex and no mb-1 */}
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                onClick={(e) => e.stopPropagation()}
                className={`text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} break-words inline-flex items-center gap-1 transition-colors duration-200`}
                title={`Email ${agent.full_name}`}
              >
                <Mail size={14} /> {agent.email}
              </a>
            )}

            {/* Clickable Phone Number - Now with inline-flex and no mb-1 */}
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                onClick={(e) => e.stopPropagation()}
                className={`text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} inline-flex items-center gap-1 transition-colors duration-200`}
                title={`Call ${agent.full_name}`}
              >
                <Phone size={14} /> {agent.phone}
              </a>
            )}

            {agent.location && (
              <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-700"} flex items-center gap-1 mt-1`}>
                📍 {agent.location}
              </div>
            )}
          </div>

          {/* Bottom block: Agency Name and Address (combined and clickable) */}
          {(agent.agency_name || agent.agency_address) && (
            <button
              onClick={handleAgencyClick}
              className={`text-left mt-auto pt-2 ${darkMode ? "text-gray-300 hover:text-green-400" : "text-gray-700 hover:text-green-700"} flex flex-col gap-0.5 transition-colors duration-200`}
              title={`View ${agent.agency_name || 'Agency'} Profile`}
            >
              {agent.agency_name && (
                <span className="text-xs font-semibold flex items-center gap-1">
                  <Landmark size={14} /> {agent.agency_name}
                </span>
              )}
              {agent.agency_address && (
                <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-700"} flex items-center gap-1`}>
                  📍 {agent.agency_address}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-nowrap justify-center items-center gap-0.5 w-full py-2 border-t border-gray-200 dark:border-gray-700 overflow-x-auto max-w-full">
        {renderActionButton()}
      </div>
    </Card>
  );
};

export default AgentCard;

// src/components/AgencyCard.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../layouts/AppShell';
import Card from './ui/Card'; // Assuming you have a Card component in ui folder
import { UserPlus, UserX, Hourglass, CheckCircle, X } from 'lucide-react'; // Import all necessary icons

/**
 * AgencyCard component displays individual agency details in a card format.
 * It is designed to be reusable and styled consistently, similar to UserCard.
 *
 * @param {object} props - The component props.
 * @param {object} props.agency - The agency object containing details like name, email, phone, website, logo_url, description.
 * @param {function} props.onClick - Function to call when the card is clicked, receives agency.agency_id.
 * @param {boolean} [props.isCurrentUserAgent=false] - True if the currently logged-in user is an agent (regular agent).
 * @param {boolean} [props.isCurrentUserAgencyAdmin=false] - True if the currently logged-in user is an agency admin.
 * @param {string|null} [props.currentUserAgencyId=null] - The agency_id of the agency the current user is an admin of, if any.
 * @param {boolean} [props.isLastAdminOfOwnAgency=false] - True if the current user is the last admin of their own agency.
 * @param {Array<object>} [props.agentMemberships=[]] - Array of all agency memberships for the current agent.
 * @param {number} [props.maxAgencyAffiliations=5] - Maximum number of agencies an agent can be affiliated with.
 * @param {function} [props.onConnectClick] - Function to call when connect button is clicked (for agents).
 * @param {function} [props.onDisconnectClick] - Function to call when disconnect button is clicked (for agents).
 * @param {function} [props.onCancelRequestClick] - Function to call when cancel pending request button is clicked (for agents).
 * @param {function} [props.onFavoriteToggle] - Function to call when favorite button is clicked.
 * @param {boolean} [props.isFavorited=false] - Indicates if the agency is currently favorited.
 */
function AgencyCard({
  agency,
  onClick,
  isCurrentUserAgent = false,
  isCurrentUserAgencyAdmin = false, // New prop
  currentUserAgencyId = null, // New prop
  isLastAdminOfOwnAgency = false, // New prop
  agentMemberships = [],
  maxAgencyAffiliations = 5,
  onConnectClick,
  onDisconnectClick,
  onCancelRequestClick,
  onFavoriteToggle, // New prop
  isFavorited = false, // New prop
}) {
  const { darkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false); // State for favorite button hover

  // Determine the current agent's affiliation status with THIS specific agency
  const currentAffiliation = agentMemberships.find(m => m.agency_id === agency.agency_id);
  const isConnected = currentAffiliation?.request_status === 'accepted';
  const isPending = currentAffiliation?.request_status === 'pending';
  const isRejected = currentAffiliation?.request_status === 'rejected';

  // Determine if the current user is an admin of THIS specific agency
  const isThisAgencyCurrentUsersAdminAgency = isCurrentUserAgencyAdmin && (agency.agency_id === currentUserAgencyId);

  // Determine if the agent has reached the maximum number of affiliations (connected or pending)
  const hasReachedMaxAffiliations = agentMemberships.filter(m => m.request_status === 'accepted' || m.request_status === 'pending').length >= maxAgencyAffiliations;

  // Determine if the "Connect" button should be disabled
  const isConnectDisabled = !isCurrentUserAgent || isConnected || isPending || hasReachedMaxAffiliations || isThisAgencyCurrentUsersAdminAgency;

  // Determine if the "Disconnect" button should be disabled for an admin
  const isDisconnectDisabledForAdmin = isThisAgencyCurrentUsersAdminAgency && isLastAdminOfOwnAgency;

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent card click from triggering
    if (onFavoriteToggle) { // Ensure onFavoriteToggle is provided
      onFavoriteToggle(agency.agency_id, isFavorited);
    }
  };

  // Helper function to get the first character of the agency name, or 'N/A' if undefined/null
  const getAgencyInitial = (name) => {
    const safeName = String(name || '');
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : 'N/A';
  };

  return (
    <Card
      className="px-4 pt-4 pb-2 flex flex-col justify-between min-h-[200px] max-w-md cursor-pointer" // Added cursor-pointer
      onClick={() => onClick(agency.agency_id)} // Make the entire card clickable
    >
      {/* Agency Logo and Main Details Section */}
      <div className="flex flex-row-reverse items-start gap-4 mb-2">
        {/* Right side: Logo */}
        <div className="flex-shrink-0 flex flex-col items-center mt-8 relative"> {/* Increased pt- to lower logo further */}
          {agency.logo_url ? (
            <img
              src={agency.logo_url}
              alt={`${agency.name} Logo`}
              className="w-24 h-24 rounded-full object-cover border-2 border-green-500"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/96x96/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${getAgencyInitial(agency.name)}`; }}
            />
          ) : (
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-green-500
              ${darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-600"}`}>
              {getAgencyInitial(agency.name)}
            </div>
          )}
        </div>

        {/* Left side: Agency Details (name, email, phone, website) */}
        <div className="flex-grow text-left min-w-0">
          <div className="text-lg font-semibold mb-5 whitespace-nowrap overflow-visible">
            {agency.name}
          </div>
          <div className="space-y-1">
            {/* Email now clickable and normal color */}
            <div className="text-sm mb-1 text-gray-600 dark:text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap">
              <a href={`mailto:${agency.email}`} className={`${darkMode ? "text-gray-300" : "text-gray-600"} hover:underline`} onClick={(e) => e.stopPropagation()}>
                {agency.email}
              </a>
            </div>
            {/* Phone number brought back, clickable, and normal color */}
            {agency.phone && (
              <div className="text-xs text-gray-600 dark:text-gray-300">
                <a href={`tel:${agency.phone}`} className={`${darkMode ? "text-gray-300" : "text-gray-600"} hover:underline`} onClick={(e) => e.stopPropagation()}>
                  {agency.phone}
                </a>
              </div>
            )}
            {agency.website && (
              <div className="text-xs text-blue-500 hover:underline overflow-hidden text-ellipsis whitespace-nowrap">
                <a href={agency.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  {agency.website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agency Description - shifted left and scrollable */}
      {agency.description && (
        <div className="w-full mb-2">
          <p className={`text-xs text-left italic overflow-y-auto max-h-10 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
            {agency.description}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center w-full border-t border-gray-200 dark:border-gray-700 pt-2">
        <div className="flex flex-nowrap gap-0.5 overflow-x-auto">
          {isCurrentUserAgent || isCurrentUserAgencyAdmin ? ( // Show buttons if user is agent or admin
            <>
              {isThisAgencyCurrentUsersAdminAgency ? ( // If the current user is an admin of THIS agency
                <button
                  onClick={(e) => { e.stopPropagation(); onDisconnectClick(agency.agency_id); }}
                  disabled={isDisconnectDisabledForAdmin}
                  className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                    ${isDisconnectDisabledForAdmin ? "opacity-50 cursor-not-allowed" : ""}
                    ${darkMode ? "text-red-400 hover:bg-gray-700 hover:border hover:border-red-500" : "text-red-700 hover:bg-gray-100 hover:border hover:border-red-500"} border-transparent`}
                  title={isDisconnectDisabledForAdmin ? "You are the last admin of this agency. Please assign another admin before disconnecting." : "Disconnect from Agency"}
                >
                  <UserX className="h-4 w-4 mr-1" /> Disconnect
                </button>
              ) : isConnected ? ( // If connected as a regular agent
                <button
                  onClick={(e) => { e.stopPropagation(); onDisconnectClick(agency.agency_id); }}
                  className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                    ${darkMode ? "text-red-400 hover:bg-gray-700 hover:border hover:border-red-500" : "text-red-700 hover:bg-gray-100 hover:border hover:border-red-500"} border-transparent`}
                  title="Disconnect from Agency"
                >
                  <UserX className="h-4 w-4 mr-1" /> Disconnect
                </button>
              ) : isPending ? (
                <div className="flex items-center space-x-2">
                  <button
                    disabled
                    className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center opacity-50 cursor-not-allowed
                      ${darkMode ? "text-yellow-400 bg-gray-700" : "text-yellow-700 bg-gray-100"} border border-transparent`}
                    title="Pending Request"
                  >
                    <Hourglass className="h-4 w-4 mr-1 animate-pulse" /> Pending
                  </button>
                  {onCancelRequestClick && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCancelRequestClick(agency.agency_id, agency.name); }}
                      className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                        ${darkMode ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"} border-transparent`}
                      title="Cancel Pending Request"
                    >
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </button>
                  )}
                </div>
              ) : isRejected ? (
                <button
                  disabled
                  className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center opacity-50 cursor-not-allowed
                    ${darkMode ? "text-red-400 bg-gray-700" : "text-red-700 bg-gray-100"} border border-transparent`}
                  title="Request Rejected"
                >
                  <UserX className="h-4 w-4 mr-1" /> Rejected
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onConnectClick(agency.agency_id); }}
                  disabled={isConnectDisabled}
                  className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                    ${isConnectDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    ${darkMode ? "text-green-400 hover:bg-gray-700 hover:border hover:border-green-500" : "text-green-700 hover:bg-gray-100 hover:border hover:border-green-500"} border-transparent`}
                  title={isConnectDisabled ? (hasReachedMaxAffiliations ? `You can only affiliate with ${maxAgencyAffiliations} agencies.` : "Already connected or pending with this agency.") : "Connect to Agency"}
                >
                  <UserPlus className="h-4 w-4 mr-1" /> Connect
                </button>
              )}
            </>
          ) : (
            // For non-agents/non-admins, the entire card is now clickable for navigation,
            // so this "View Details" button is no longer needed.
            // The parent <Card> component now handles the onClick.
            null
          )}
        </div>
        {/* Bookmark icon - always present at the bottom, aligned to the right */}
        <button
          onClick={handleFavoriteClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`p-1 rounded-full transition-colors flex-shrink-0`}
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
      </div>
    </Card>
  );
}

export default AgencyCard;

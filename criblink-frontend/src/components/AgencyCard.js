// src/components/AgencyCard.js
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../layouts/AppShell';
import Card from './ui/Card'; // Assuming you have a Card component in ui folder
import { UserPlus, UserX, Hourglass } from 'lucide-react'; // Import connect/disconnect icons and Hourglass

/**
 * AgencyCard component displays individual agency details in a card format.
 * It is designed to be reusable and styled consistently, similar to UserCard.
 *
 * @param {object} props - The component props.
 * @param {object} props.agency - The agency object containing details like name, email, phone, website, logo_url, description.
 * @param {function} props.onClick - Function to call when the card is clicked, receives agency.agency_id.
 * @param {boolean} [props.isCurrentUserAgent=false] - True if the currently logged-in user is an agent.
 * @param {string} [props.currentUserAgencyId=null] - The agency_id the current user is connected to (if any).
 * @param {string} [props.currentUserAgencyRequestStatus='none'] - The request status of the current user to an agency ('accepted', 'pending', 'none').
 * @param {function} [props.onConnectClick] - Function to call when connect button is clicked (for agents).
 * @param {function} [props.onDisconnectClick] - Function to call when disconnect button is clicked (for agents).
 */
function AgencyCard({
  agency,
  onClick,
  isCurrentUserAgent = false,
  currentUserAgencyId = null,
  currentUserAgencyRequestStatus = 'none',
  onConnectClick,
  onDisconnectClick,
}) {
  const { darkMode } = useTheme();

  // Determine if the current agency is the one the current agent is connected to
  const isAgentConnectedToThisAgency = isCurrentUserAgent && currentUserAgencyId === agency.agency_id && currentUserAgencyRequestStatus === 'accepted';
  // Determine if the current agency is the one the current agent has a pending request to
  const isAgentPendingToThisAgency = isCurrentUserAgent && currentUserAgencyId === agency.agency_id && currentUserAgencyRequestStatus === 'pending';
  // Determine if the current agent is not connected to any agency
  const isAgentNotConnectedToAnyAgency = isCurrentUserAgent && !currentUserAgencyId;

  return (
    <Card className="px-4 pt-4 pb-2 flex flex-col justify-between min-h-[200px] max-w-md">
      {/* Agency Logo and Main Details Section */}
      <div className="flex flex-row-reverse items-start gap-4 mb-2">
        {/* Right side: Logo */}
        <div className="flex-shrink-0 flex flex-col items-center mt-8"> {/* Increased pt- to lower logo further */}
          {agency.logo_url ? (
            <img
              src={agency.logo_url}
              alt={`${agency.name} Logo`}
              className="w-24 h-24 rounded-full object-cover border-2 border-green-500"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/96x96/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${agency.name.charAt(0).toUpperCase()}`; }}
            />
          ) : (
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-green-500
              ${darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-600"}`}>
              {agency.name.charAt(0).toUpperCase()}
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
            <a href={`mailto:${agency.email}`} className={`${darkMode ? "text-gray-300" : "text-gray-600"} hover:underline`}>
              {agency.email}
            </a>
          </div>
          {/* Phone number brought back, clickable, and normal color */}
          {agency.phone && (
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <a href={`tel:${agency.phone}`} className={`${darkMode ? "text-gray-300" : "text-gray-600"} hover:underline`}>
                {agency.phone}
              </a>
            </div>
          )}
          {agency.website && (
            <div className="text-xs text-blue-500 hover:underline overflow-hidden text-ellipsis whitespace-nowrap">
              <a href={agency.website} target="_blank" rel="noopener noreferrer">
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
      <div className="flex justify-center w-full border-t border-gray-200 dark:border-gray-700 pt-2">
        {isCurrentUserAgent ? (
          <>
            {isAgentConnectedToThisAgency ? (
              <button
                onClick={(e) => { e.stopPropagation(); onDisconnectClick(); }}
                className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                  ${darkMode ? "text-red-400 hover:bg-gray-700 hover:border hover:border-red-500" : "text-red-700 hover:bg-gray-100 hover:border hover:border-red-500"} border-transparent`}
                title="Disconnect from Agency"
              >
                <UserX className="h-4 w-4 mr-1" /> Disconnect
              </button>
            ) : isAgentPendingToThisAgency ? (
              // This block correctly displays the Hourglass icon and "Pending" text
              <button
                disabled
                className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center opacity-50 cursor-not-allowed
                  ${darkMode ? "text-yellow-400 bg-gray-700" : "text-yellow-700 bg-gray-100"} border border-transparent`}
                title="Pending Request"
              >
                <Hourglass className="h-4 w-4 mr-1" /> Pending
              </button>
            ) : isAgentNotConnectedToAnyAgency && onConnectClick ? (
              <button
                onClick={(e) => { e.stopPropagation(); onConnectClick(agency.agency_id); }}
                className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                  ${darkMode ? "text-green-400 hover:bg-gray-700 hover:border hover:border-green-500" : "text-green-700 hover:bg-gray-100 hover:border hover:border-green-500"} border-transparent`}
                title="Connect to Agency"
              >
                <UserPlus className="h-4 w-4 mr-1" /> Connect
              </button>
            ) : (
              // Fallback for agents who are already connected to a *different* agency
              <button
                onClick={(e) => { e.stopPropagation(); onClick(agency.agency_id); }}
                className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
                  ${darkMode ? "text-blue-400 hover:bg-gray-700 hover:border hover:border-blue-500" : "text-blue-700 hover:bg-gray-100 hover:border hover:border-blue-500"} border-transparent`}
                title="View Details"
              >
                View Details
              </button>
            )}
          </>
        ) : (
          // Default for non-agents or if connect/disconnect logic not applicable
          <button
            onClick={(e) => { e.stopPropagation(); onClick(agency.agency_id); }}
            className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
              ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-700 hover:bg-gray-100"} border border-transparent hover:border-green-500`}
          >
            View Details
          </button>
        )}
      </div>
    </Card>
  );
}

export default AgencyCard;

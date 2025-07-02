import React from 'react';
import { useTheme } from '../../layouts/AppShell';
import {
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';

const UserCard = ({ user, onActionApply, actionSelections, setActionSelections }) => {
  const { darkMode } = useTheme();

  // Helper to format date
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  // Determine available actions based on user's current status and role
  const getActionOptions = (currentUser) => {
    const options = [
      { value: "", label: "Select Action" },
    ];

    // Role change options
    if (currentUser.role === 'client' || currentUser.role === 'agent') {
      options.push({ value: "role:admin", label: "Promote to Admin" });
    }
    if (currentUser.role === 'client') {
      options.push({ value: "role:agent", label: "Promote to Agent" });
    }
    if (currentUser.role === 'admin') {
      options.push({ value: "role:agent", label: "Demote to Agent" });
    }
    if (currentUser.role === 'admin' || currentUser.role === 'agent') {
      options.push({ value: "role:client", label: "Demote to Client" });
    }

    // Status change options
    if (currentUser.status === 'deactivated') {
      options.push({ value: "reactivate", label: "Reactivate" });
    }
    options.push({ value: currentUser.status === 'banned' ? 'unban' : 'ban', label: currentUser.status === 'banned' ? 'Unban' : 'Ban' });
    options.push({ value: "delete", label: "Delete" });

    return options;
  };

  const actionOptions = getActionOptions(user);

  return (
    <Card className="p-4 flex flex-col justify-between min-h-[250px] max-w-md">
      {/* Profile Picture and Main Details Section */}
      <div className="flex flex-row-reverse items-start gap-4 mb-4">
        {/* Right side: Profile Picture and Status (stacked vertically) */}
        <div className="flex-shrink-0 flex flex-col items-center"> {/* flex-col stacks items, items-center centers them horizontally */}
          <img
            // Increased picture size to w-28 h-28 and updated placeholder
            src={user.profile_picture_url || `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${user.full_name.charAt(0).toUpperCase()}`}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-2 border-green-500"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${user.full_name.charAt(0).toUpperCase()}`; }}
          />
          {/* User Status - remains under the picture */}
          <div className={`text-sm mt-2 font-medium ${
              user.status === 'banned'
                ? 'text-red-600'
                : user.status === 'deactivated'
                  ? 'text-yellow-600'
                  : 'text-green-600'
            }`}>
            Status: {user.status || 'active'}
          </div>
        </div>

        {/* Left side: User Details (name, email, joined) - text-left ensures non-centered alignment */}
        <div className="flex-grow text-left">
          <div className="text-lg font-semibold mb-1">
            {user.full_name}
          </div>
          <div className="text-sm mb-1 text-gray-600 dark:text-gray-300">{user.email}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Joined: {formatDate(user.date_joined)}
          </div>
        </div>
      </div>

      {/* User Role - moved to the bottom left before action buttons */}
      {/* Changed justify-end to justify-start */}
      <div className="w-full flex justify-start mb-4">
        <div className="text-xs font-semibold px-2 py-0.5 rounded-full
            ${user.role === 'admin' ? (darkMode ? 'bg-blue-700 text-blue-200' : 'bg-blue-100 text-blue-800') :
              user.role === 'agent' ? (darkMode ? 'bg-purple-700 text-purple-200' : 'bg-purple-100 text-purple-800') :
              (darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700')
            }">
          Role: {user.role === 'user' ? 'Client' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </div>
      </div>

      {/* Action Buttons - background removed and delete is icon only */}
      <div className="flex flex-wrap justify-center gap-2 w-full pt-4 border-t border-gray-200 dark:border-gray-700">
        {actionOptions.filter(option => option.value !== "" && option.value !== "delete" && option.value !== "ban" && option.value !== "unban" && option.value !== "reactivate").map(option => (
          <button
            key={option.value}
            onClick={() => onActionApply(user, option.value)}
            className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center
              ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-700 hover:bg-gray-100"} border border-transparent hover:border-green-500`}
          >
            {option.label}
          </button>
        ))}
        {user.status === 'banned' ? (
          <button
            onClick={() => onActionApply(user, 'unban')}
            className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-700 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`}
            title="Unban User"
          >
            <CheckCircleIcon className="h-4 w-4 mr-1" /> Unban
          </button>
        ) : (
          <button
            onClick={() => onActionApply(user, 'ban')}
            className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-700 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`}
            title="Ban User"
          >
            <NoSymbolIcon className="h-4 w-4 mr-1" /> Ban
          </button>
        )}
        {user.status === 'deactivated' && (
          <button
            onClick={() => onActionApply(user, 'reactivate')}
            className={`text-xs rounded-xl px-3 py-1 h-8 flex items-center justify-center ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-700 hover:bg-gray-100"} border border-transparent hover:border-blue-500`}
            title="Reactivate User"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" /> Reactivate
          </button>
        )}
        <button
          onClick={() => onActionApply(user, 'delete')}
          className={`h-8 w-8 flex items-center justify-center rounded-full ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-700 hover:bg-gray-100"} border border-transparent hover:border-red-500`}
          title="Delete User"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
};

export default UserCard;

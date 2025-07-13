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

  // Helper to render a vertical separator
  const Separator = () => (
    <div className="w-px bg-gray-200 dark:bg-gray-700 h-6 self-center mx-0.5"></div>
  );

  return (
    <Card className="px-4 pt-4 pb-2 flex flex-col justify-between min-h-[200px] max-w-md">
      {/* Profile Picture and Main Details Section */}
      <div className="flex flex-row-reverse items-start gap-4 mb-4">
        {/* Right side: Profile Picture only (Status moved) */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <img
            src={user.profile_picture_url || `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${user.full_name.charAt(0).toUpperCase()}`}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-2 border-green-500"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${user.full_name.charAt(0).toUpperCase()}`; }}
          />
        </div>

        {/* Left side: User Details (name, email, joined) */}
        <div className="flex-grow text-left min-w-0">
          <div className="text-lg font-semibold mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {user.full_name}
          </div>
          <div className="text-sm mb-1 text-gray-600 dark:text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Joined: {formatDate(user.date_joined)}
          </div>
        </div>
      </div>

      {/* Role on left, Status centered under profile picture */}
<div className="flex items-center justify-between w-full mb-2">
  {/* Role on the left */}
  <div className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
    {user.role === 'user' ? 'Client' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
  </div>

  {/* Status aligned under profile picture */}
  <div className="w-28 text-center text-xs font-medium">
    <span className={
      user.status === 'banned'
        ? 'text-red-600'
        : user.status === 'deactivated'
          ? 'text-yellow-600'
          : 'text-green-600'
    }>
      {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
    </span>
  </div>
</div>


      {/* Action Buttons */}
      <div className="flex flex-nowrap justify-center gap-0.5 w-full pt-1 pb-1 border-t border-gray-200 dark:border-gray-700">
        {actionOptions.filter(option => option.value !== "" && option.value !== "delete" && option.value !== "ban" && option.value !== "unban" && option.value !== "reactivate").map((option, index, arr) => (
          <React.Fragment key={option.value}>
            <button
              onClick={() => onActionApply(user, option.value)}
              className={`text-xs rounded-xl px-1 py-1 h-8 flex-shrink-0 flex items-center justify-center
                ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-700 hover:bg-gray-100"} border border-transparent hover:border-green-500`}
            >
              {option.label}
            </button>
            {index < arr.length - 1 && <Separator />}
          </React.Fragment>
        ))}

        {/* Separator before Ban/Unban if there are other role actions */}
        {actionOptions.filter(option => option.value !== "" && option.value !== "delete" && option.value !== "ban" && option.value !== "unban" && option.value !== "reactivate").length > 0 && <Separator />}

        {user.status === 'banned' ? (
          <React.Fragment>
            <button
              onClick={() => onActionApply(user, 'unban')}
              className={`text-xs rounded-xl px-1 py-1 h-8 flex-shrink-0 flex items-center justify-center ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-700 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`}
              title="Unban User"
            >
              <CheckCircleIcon className="h-4 w-4 mr-0.5" /> Unban
            </button>
            <Separator />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <button
              onClick={() => onActionApply(user, 'ban')}
              className={`text-xs rounded-xl px-1 py-1 h-8 flex-shrink-0 flex items-center justify-center ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-700 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`}
              title="Ban User"
            >
              <NoSymbolIcon className="h-4 w-4 mr-0.5" /> Ban
            </button>
            <Separator />
          </React.Fragment>
        )}

        {user.status === 'deactivated' && (
          <React.Fragment>
            <button
              onClick={() => onActionApply(user, 'reactivate')}
              className={`text-xs rounded-xl px-1 py-1 h-8 flex-shrink-0 flex items-center justify-center ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-700 hover:bg-gray-100"} border border-transparent hover:border-blue-500`}
              title="Reactivate User"
            >
              <ArrowPathIcon className="h-4 w-4 mr-0.5" /> Reactivate
            </button>
            <Separator />
          </React.Fragment>
        )}

        <button
          onClick={() => onActionApply(user, 'delete')}
          className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-700 hover:bg-gray-100"} border border-transparent hover:border-red-500`}
          title="Delete User"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
};

export default UserCard;
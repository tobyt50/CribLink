import React from 'react';
import { useTheme } from '../../layouts/AppShell';
import {
  TrashIcon,
  NoSymbolIcon, // For Ban
  CheckCircleIcon, // For Unban
  ArrowPathIcon, // For Reactivate
  ShieldCheckIcon, // For Promote to Admin
  UserPlusIcon, // For Promote to Agent
  UserMinusIcon, // For Demote to Agent
  UserIcon, // For Demote to Client
  BuildingOffice2Icon // For Promote to Agency Admin
} from '@heroicons/react/24/outline'; // Using Heroicons for all
import Card from '../../components/ui/Card';

const UserCard = ({ user, onActionApply, actionSelections, setActionSelections, onCardClick }) => {
  const { darkMode } = useTheme();

  // Helper to format date
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  // Determine available actions based on user's current status and role
  const getActionOptions = (currentUser) => {
    const options = [
      // No "Select Action" option here as we're directly rendering buttons
    ];

    // Role change options
    if (currentUser.role === 'client' || currentUser.role === 'agent' || currentUser.role === 'agency_admin') {
      options.push({ value: "role:admin", title: "Promote to Admin", icon: ShieldCheckIcon, color: "text-green-500 hover:bg-green-100" });
    }
    if (currentUser.role === 'client') {
      options.push({ value: "role:agent", title: "Promote to Agent", icon: UserPlusIcon, color: "text-blue-500 hover:bg-blue-100" });
    }
    if (currentUser.role === 'admin' || currentUser.role === 'agency_admin') {
      options.push({ value: "role:agent", title: "Demote to Agent", icon: UserMinusIcon, color: "text-orange-500 hover:bg-orange-100" });
    }
    if (currentUser.role === 'admin' || currentUser.role === 'agent' || currentUser.role === 'agency_admin') {
      options.push({ value: "role:client", title: "Demote to Client", icon: UserIcon, color: "text-purple-500 hover:bg-purple-100" });
    }
    if (currentUser.role === 'admin' || currentUser.role === 'agent' || currentUser.role === 'client') {
      options.push({ value: "role:agency_admin", title: "Promote to Agency Admin", icon: BuildingOffice2Icon, color: "text-indigo-500 hover:bg-indigo-100" });
    }

    return options;
  };

  const actionOptions = getActionOptions(user);

  // Helper to render a vertical separator
  const Separator = () => (
    <div className="w-[0.5px] bg-gray-300 dark:bg-gray-600 h-5 self-center mx-2"></div>
  );

  return (
    <Card
      className="px-4 pt-4 pb-2 flex flex-col justify-between min-h-[200px] max-w-md cursor-pointer"
      onClick={() => onCardClick(user)} // Add onClick to the Card component
    >
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
      <div className="flex flex-nowrap justify-center w-full border-t border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-nowrap px-0 items-center" onClick={(e) => e.stopPropagation()}> {/* Prevent card click when interacting with buttons */}

        {actionOptions.map((option, index, arr) => {
          const IconComponent = option.icon;
          return (
            <React.Fragment key={option.value}>
              <button
                onClick={() => onActionApply(user, option.value)}
                className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200
                  ${darkMode ? `hover:bg-gray-700 ${option.color.split(' ')[0]}` : `hover:bg-gray-100 ${option.color.split(' ')[0]}`} border border-transparent hover:border-current`}
                title={option.title} // Tooltip for hover/long tap
              >
                {IconComponent && <IconComponent className="h-5 w-5" />}
              </button>
              {index < arr.length - 1 && <Separator />}
            </React.Fragment>
          );
        })}

        {/* Separators for status and delete actions, if applicable */}
        {actionOptions.length > 0 && <Separator />}

        {user.status === 'banned' ? (
          <React.Fragment>
            <button
              onClick={() => onActionApply(user, 'unban')}
              className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-700 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`}
              title="Unban User"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
            <Separator />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <button
              onClick={() => onActionApply(user, 'ban')}
              className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-700 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`}
              title="Ban User"
            >
              <NoSymbolIcon className="h-5 w-5" />
            </button>
            <Separator />
          </React.Fragment>
        )}

        {user.status === 'deactivated' && (
          <React.Fragment>
            <button
              onClick={() => onActionApply(user, 'reactivate')}
              className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-700 hover:bg-gray-100"} border border-transparent hover:border-blue-500`}
              title="Reactivate User"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <Separator />
          </React.Fragment>
        )}

        <button
          onClick={() => onActionApply(user, 'delete')}
          className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-700 hover:bg-gray-100"} border border-transparent hover:border-red-500`}
          title="Delete User"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
};

export default UserCard;

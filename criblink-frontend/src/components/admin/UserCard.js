import React from 'react';
import { useTheme } from '../../layouts/AppShell';
import {
  TrashIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UserMinusIcon,
  UserIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid'; // Changed to solid StarIcon
import Card from '../../components/ui/Card';

const UserCard = ({ user, onActionApply, onCardClick, currentUser }) => {
  const { darkMode } = useTheme();

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const getActionOptions = (currentUserForActions) => {
    const options = [];
    const role = currentUserForActions.role || currentUserForActions.user_role;

    if (role !== 'admin') options.push({ value: "role:admin", title: "Promote to Admin", icon: ShieldCheckIcon });
    if (role !== 'agent') options.push({ value: "role:agent", title: "Promote to Agent", icon: UserPlusIcon });
    if (role !== 'client') options.push({ value: "role:client", title: "Demote to Client", icon: UserIcon });
    if (role !== 'agency_admin') options.push({ value: "role:agency_admin", title: "To Agency Admin", icon: BuildingOffice2Icon });

    return options;
  };

  const actionOptions = getActionOptions(user);
  const Separator = () => <div className="w-[0.5px] bg-gray-300 dark:bg-gray-600 h-5 self-center mx-2"></div>;
  const userRole = user.role || user.user_role;

  // Determine the star color based on subscription type
  const getStarColor = (subscription) => {
    switch (subscription) {
      case 'basic':
        return 'text-green-500';
      case 'pro':
        return 'text-purple-500';
      case 'enterprise':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card
      className="px-4 pt-4 pb-2 flex flex-col justify-between min-h-[220px] max-w-md cursor-pointer"
      onClick={() => onCardClick(user)}
    >
      <div>
        <div className="flex flex-row-reverse items-start gap-4 mb-4">
          <div className="flex-shrink-0 flex flex-col items-center">
            <img
              src={user.profile_picture_url || `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${user.full_name.charAt(0).toUpperCase()}`}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-2 border-green-500"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${user.full_name.charAt(0).toUpperCase()}`; }}
            />
          </div>
          <div className="flex-grow text-left min-w-0">
            <div className="text-lg font-semibold mb-1 overflow-hidden text-ellipsis whitespace-nowrap">{user.full_name}</div>
            <div className="text-sm mb-1 text-gray-600 dark:text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Joined: {formatDate(user.date_joined)}</div>
            {user.subscription_type && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                <span className="mr-2">Subscription:</span>
                <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 normal-case">
                  <StarIcon className={`h-3 w-3 mr-1 ${getStarColor(user.subscription_type)}`} />
                  {user.subscription_type.charAt(0).toUpperCase() + user.subscription_type.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between w-full mb-2">
          <div className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"} flex items-center`}>
            {userRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
          <div className="w-28 text-center text-xs font-medium">
            <span className={user.status === 'banned' ? 'text-red-600' : user.status === 'deactivated' ? 'text-yellow-600' : 'text-green-600'}>
              {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-nowrap justify-center w-full border-t border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-nowrap px-0 items-center mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
        {actionOptions.map((option, index, arr) => (
          <React.Fragment key={option.value}>
            <button onClick={() => onActionApply(user, option.value)} className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${darkMode ? `hover:bg-gray-700 text-gray-300` : `hover:bg-gray-100 text-gray-600`} border border-transparent hover:border-current`} title={option.title}>
              {option.icon && <option.icon className="h-5 w-5" />}
            </button>
            {index < arr.length - 1 && <Separator />}
          </React.Fragment>
        ))}
        {actionOptions.length > 0 && <Separator />}
        {user.status === 'banned' ? (
          <button onClick={() => onActionApply(user, 'unban')} className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-700 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`} title="Unban User">
            <CheckCircleIcon className="h-5 w-5" />
          </button>
        ) : (
          <button onClick={() => onActionApply(user, 'ban')} className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-700 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`} title="Ban User">
            <NoSymbolIcon className="h-5 w-5" />
          </button>
        )}
        <Separator />
        {user.status === 'deactivated' && (
          <>
            <button onClick={() => onActionApply(user, 'reactivate')} className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-700 hover:bg-gray-100"} border border-transparent hover:border-blue-500`} title="Reactivate User">
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <Separator />
          </>
        )}
        <button onClick={() => onActionApply(user, 'delete')} className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-700 hover:bg-gray-100"} border border-transparent hover:border-red-500`} title="Delete User">
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
};

export default UserCard;

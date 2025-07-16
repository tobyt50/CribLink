import React from 'react';
import { useTheme } from '../../layouts/AppShell';
import {
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';

const MemberCard = ({
  member,
  onViewProfile,
  onRemoveMember,
  acceptAction,
  rejectAction,
  onPromoteMember,
  onDemoteMember,
  onToggleMemberStatus,
  isPendingRequestCard,
  darkMode,
  user
}) => {
  const { darkMode: contextDarkMode } = useTheme();
  const currentDarkMode = darkMode !== undefined ? darkMode : contextDarkMode;

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const getInitial = (name) => {
    const safeName = String(name || '');
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : 'AG';
  };

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  const profilePicUrl = member.profile_picture_url;
  const nameForInitial = member.full_name;

  const isCurrentUser = user && user.user_id === member.user_id;
  const isCurrentUserAdmin = user && user.role === 'agency_admin';
  const isMemberAdmin = member.agency_role === 'agency_admin';
  const isRemoveDisabled = isCurrentUser && isCurrentUserAdmin && member.total_admins === 1;
  const isDemoteDisabled = isRemoveDisabled;

  const statusColorClass = isPendingRequestCard
    ? (currentDarkMode ? 'text-blue-400' : 'text-blue-600')
    : member.user_status === 'banned'
      ? 'text-red-600'
      : member.user_status === 'deactivated'
        ? 'text-yellow-600'
        : 'text-green-600';

  return (
    <Card
      className="px-4 pt-4 pb-2 flex flex-col justify-between min-h-[200px] w-full lg:max-w-md break-words overflow-x-hidden"
      onClick={() => { !isPendingRequestCard && onViewProfile(member.user_id); }}
    >
      {/* Top Section: Avatar + Info */}
      <div className="flex flex-row-reverse items-start gap-4 mb-4">
        <div className="flex-shrink-0 flex flex-col items-center">
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt={nameForInitial}
              className="w-28 h-28 rounded-full object-cover border-2 border-green-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/112x112/${currentDarkMode ? '374151' : 'E0F7FA'}/${currentDarkMode ? 'D1D5DB' : '004D40'}?text=${getInitial(nameForInitial)}`;
              }}
            />
          ) : (
            <div className={`w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold ${currentDarkMode ? "bg-gray-700 text-green-400" : "bg-green-100 text-green-700"}`}>
              {getInitial(nameForInitial)}
            </div>
          )}
        </div>

        <div className="flex-grow min-w-0 break-words">
          <div className="flex items-center gap-2 text-lg font-semibold mb-1">
            <span className="truncate">{member.full_name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${member.member_status === 'vip' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
              {capitalize(member.member_status || 'Regular')}
            </span>
          </div>

          <div className="flex flex-col items-start">
  <div className="text-sm text-gray-600 dark:text-gray-300 break-words">{member.email}</div>
  <div className="text-xs text-gray-500 dark:text-gray-400">
    {isPendingRequestCard ? `Requested: ${formatDate(member.requested_at)}` : `Joined: ${formatDate(member.joined_at)}`}
  </div>
</div>

        </div>
      </div>

      {/* Role & Status Row */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
          {isMemberAdmin ? 'Admin' : (member.agency_role || 'Agent')}
        </div>
        <div className="w-28 text-center text-xs font-medium">
          <span className={statusColorClass}>
            {isPendingRequestCard ? capitalize(member.request_status) : capitalize(member.user_status || 'active')}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-nowrap justify-center gap-1 w-full pt-1 pb-1 border-t border-gray-200 dark:border-gray-700 overflow-x-auto max-w-full">
        {isPendingRequestCard ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); acceptAction(member.request_id, member.user_id); }}
              className={`flex items-center gap-1 rounded-xl px-1 py-1 h-8 text-sm flex-shrink-0 transition-colors
                ${currentDarkMode ? "text-green-400 hover:bg-gray-700 hover:border hover:border-green-500" : "text-green-700 hover:bg-gray-100 hover:border hover:border-green-500"} border-transparent`}
            >
              <CheckCircleIcon className="h-5 w-5" /> Accept
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); rejectAction(member.request_id); }}
              className={`flex items-center gap-1 rounded-xl px-1 py-1 h-8 text-sm flex-shrink-0 transition-colors
                ${currentDarkMode ? "text-red-400 hover:bg-gray-700 hover:border hover:border-red-500" : "text-red-700 hover:bg-gray-100 hover:border hover:border-red-500"} border-transparent`}
            >
              <XCircleIcon className="h-5 w-5" /> Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onViewProfile(member.user_id); }}
              className={`text-xs rounded-xl px-1 py-1 h-8 flex items-center justify-center flex-shrink-0
                ${currentDarkMode ? "text-blue-400 hover:bg-gray-700 hover:border hover:border-blue-500" : "text-blue-700 hover:bg-gray-100 hover:border hover:border-blue-500"} border-transparent`}
            >
              View Profile
            </button>

            {isCurrentUserAdmin && !isCurrentUser && (
              <>
                {member.agency_role === 'agent' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPromoteMember(member.user_id); }}
                    className={`text-xs rounded-xl px-1 py-1 h-8 flex items-center justify-center flex-shrink-0
                      ${currentDarkMode ? "text-purple-400 hover:bg-gray-700 hover:border hover:border-purple-500" : "text-purple-700 hover:bg-gray-100 hover:border hover:border-purple-500"} border-transparent`}
                    title="Promote to Admin"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-0.5" /> Promote
                  </button>
                )}
                {member.agency_role === 'agency_admin' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDemoteMember(member.user_id); }}
                    className={`text-xs rounded-xl px-1 py-1 h-8 flex items-center justify-center flex-shrink-0
                      ${currentDarkMode ? "text-orange-400 hover:bg-gray-700 hover:border hover:border-orange-500" : "text-orange-700 hover:bg-gray-100 hover:border hover:border-orange-500"} border-transparent`}
                    title="Demote to Agent"
                    disabled={isDemoteDisabled}
                  >
                    <UserMinusIcon className="h-4 w-4 mr-0.5" /> Demote
                  </button>
                )}
              </>
            )}

            {isCurrentUserAdmin && !isCurrentUser && onToggleMemberStatus && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleMemberStatus(member.user_id, member.member_status); }}
                className={`text-xs rounded-xl px-1 py-1 h-8 flex items-center justify-center flex-shrink-0
                  ${currentDarkMode ? "text-yellow-400 hover:bg-gray-700 hover:border hover:border-yellow-500" : "text-yellow-700 hover:bg-gray-100 hover:border hover:border-yellow-500"} border-transparent`}
                title={member.member_status === 'vip' ? 'Make Regular' : 'Make VIP'}
              >
                {member.member_status === 'vip' ? 'Reg' : 'VIP'}
              </button>
            )}

            {(member.user_id !== user.user_id || member.total_admins > 1) ? (
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveMember(member.user_id); }}
                className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full
                  ${currentDarkMode ? "text-red-400 hover:bg-gray-700 hover:border hover:border-red-500" : "text-red-700 hover:bg-gray-100 hover:border hover:border-red-500"} border-transparent`}
                title="Remove Member"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                disabled
                className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full opacity-50 cursor-not-allowed
                  ${currentDarkMode ? "text-red-400" : "text-red-700"} border border-transparent`}
                title="You cannot remove yourself as the last agency admin"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default MemberCard;

import React from 'react';
import { useTheme } from '../../layouts/AppShell';
import {
  TrashIcon,
  NoSymbolIcon, // Using NoSymbolIcon for suspend
  CheckCircleIcon, // Using CheckCircleIcon for activate
  ArrowPathIcon, // Using ArrowPathIcon for reset password
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';

const StaffCard = ({ staff, onActionApply, actionSelections, setActionSelections }) => {
  const { darkMode } = useTheme();

  // Helper to format date
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  // Determine available actions based on staff's current status
  const getActionOptions = (currentStaff) => {
    const options = [
      { value: "", label: "Select Action" },
    ];

    // Status change options
    options.push({ value: currentStaff.status === 'active' ? 'suspend' : 'activate', label: currentStaff.status === 'active' ? 'Suspend' : 'Activate' });
    options.push({ value: "reset-password", label: "Reset Password" });
    options.push({ value: "delete", label: "Delete" });

    return options;
  };

  const actionOptions = getActionOptions(staff);

  // Placeholder for profile picture if not available
  const profilePictureUrl = staff.profile_picture_url || `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${staff.full_name.charAt(0).toUpperCase()}`;

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
            src={profilePictureUrl}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-2 border-green-500"
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/112x112/${darkMode ? '374151' : 'E0F7FA'}/${darkMode ? 'D1D5DB' : '004D40'}?text=${staff.full_name.charAt(0).toUpperCase()}`; }}
          />
        </div>

        {/* Left side: Staff Details (name, email, start date) - text-left ensures non-centered alignment */}
        <div className="flex-grow text-left min-w-0"> {/* Added min-w-0 here */}
          <div className="text-lg font-semibold mb-1 overflow-hidden text-ellipsis whitespace-nowrap"> {/* Added text truncation classes */}
            {staff.full_name}
          </div>
          <div className="text-sm mb-1 text-gray-600 dark:text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap">{staff.email}</div> {/* Added text truncation classes */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Start Date: {formatDate(staff.start_date)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap"> {/* Added text truncation classes */}
            Department: {staff.department || 'N/A'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap"> {/* Added text truncation classes */}
            Phone: {staff.phone || 'N/A'}
          </div>
        </div>
      </div>

      {/* Role on left, Status centered under profile picture */}
      <div className="flex items-center justify-between w-full mb-2">
        {/* Role on the left */}
        <div className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
        </div>

        {/* Status aligned under profile picture */}
        <div className="w-28 text-center text-xs font-medium">
          <span className={
            staff.status === 'active'
              ? 'text-green-600'
              : 'text-yellow-600' // Assuming 'suspended' or other non-active states would be yellow
          }>
            {(staff.status || 'active').charAt(0).toUpperCase() + (staff.status || 'active').slice(1)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-nowrap justify-center gap-0.5 w-full pt-1 pb-1 border-t border-gray-200 dark:border-gray-700"> {/* Adjusted padding and gap */}
        {staff.status === 'active' ? (
          <>
            <button
              onClick={() => onActionApply(staff, 'suspend')}
              className={`text-xs rounded-xl px-1 py-1 h-8 flex-shrink-0 flex items-center justify-center ${darkMode ? "text-yellow-400 hover:bg-gray-700" : "text-yellow-700 hover:bg-gray-100"} border border-transparent hover:border-yellow-500`}
              title="Suspend Staff"
            >
              <NoSymbolIcon className="h-4 w-4 mr-0.5" /> Suspend
            </button>
            <Separator />
          </>
        ) : (
          <>
            <button
              onClick={() => onActionApply(staff, 'activate')}
              className={`text-xs rounded-xl px-1 py-1 h-8 flex-shrink-0 flex items-center justify-center ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-700 hover:bg-gray-100"} border border-transparent hover:border-green-500`}
              title="Activate Staff"
            >
              <CheckCircleIcon className="h-4 w-4 mr-0.5" /> Activate
            </button>
            <Separator />
          </>
        )}
        <button
          onClick={() => onActionApply(staff, 'reset-password')}
          className={`text-xs rounded-xl px-1 py-1 h-8 flex-shrink-0 flex items-center justify-center ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-700 hover:bg-gray-100"} border border-transparent hover:border-blue-500`}
          title="Reset Password"
        >
          <ArrowPathIcon className="h-4 w-4 mr-0.5" /> Reset Password
        </button>
        <Separator />
        <button
          onClick={() => onActionApply(staff, 'delete')}
          className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-700 hover:bg-gray-100"} border border-transparent hover:border-red-500`}
          title="Delete Staff"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
};

export default StaffCard;
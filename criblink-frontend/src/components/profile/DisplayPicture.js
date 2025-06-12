import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader, Upload, Trash2, ImageOff } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import { useSidebarState } from '../../hooks/useSidebarState'; // Correct path

function DisplayPicture({ userInfo, uploadingPicture, deletingPicture, uploadProfilePicture, handleDeleteProfilePicture }) {
  const { darkMode } = useTheme();
  const { isMobile, isCollapsed } = useSidebarState(); // Use the hook to get sidebar state
  const fileInputRef = useRef(null);

  // Helper function to get initials from full name
  const getInitials = (name) => {
    if (!name) return "";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0]?.toUpperCase() || "";
    return ((names[0]?.[0] || "") + (names[names.length - 1]?.[0] || "")).toUpperCase();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadProfilePicture(file);
    }
  };

  return (
    <div className="relative group">
      {userInfo.profile_picture_url ? (
        <img
          src={userInfo.profile_picture_url}
          alt="Profile"
          className={`rounded-full object-cover border-2 shadow-md
            ${(isMobile || !isCollapsed) ? "w-20 h-20" : "w-16 h-16 mx-auto"} ${darkMode ? "border-gray-700" : "border-white"}`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.full_name)}&background=${darkMode ? "2D3748" : "10B981"}&color=fff&size=128`;
          }}
        />
      ) : (
        <div className={`rounded-full object-cover border-2 shadow-md flex items-center justify-center
          ${(isMobile || !isCollapsed) ? "w-20 h-20 text-4xl" : "w-16 h-16 mx-auto text-3xl"} ${darkMode ? "border-gray-700 bg-gray-600 text-gray-300" : "border-white bg-green-100 text-green-700"}`}>
          {userInfo.full_name ? getInitials(userInfo.full_name) : <ImageOff size={40} />}
        </div>
      )}

      {/* Show upload/delete buttons only when sidebar is not collapsed (or on mobile) */}
      {(isMobile || !isCollapsed) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={uploadingPicture}
            aria-label="Change profile picture"
            title="Upload New Picture"
          >
            {uploadingPicture ? (
               <Loader size={20} className="animate-spin" />
            ) : (
              <Upload size={20} />
            )}
          </button>
          {userInfo.profile_picture_url && (
            <button
              onClick={handleDeleteProfilePicture}
              className="p-2 rounded-full hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              disabled={deletingPicture}
              aria-label="Delete profile picture"
              title="Delete Picture"
            >
              {deletingPicture ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Trash2 size={20} />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default DisplayPicture;

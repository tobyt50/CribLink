// src/components/Sidebar.js
import React, { useRef } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  User,
  Shield,
  Lock,
  Settings,
  Pencil,
  ChevronLeft,
  Loader,
} from "lucide-react";

const MENU_ITEMS = [
  { name: "General", icon: <User />, key: "general" },
  { name: "Security", icon: <Shield />, key: "security" },
  { name: "Privacy", icon: <Lock />, key: "privacy" },
  { name: "Settings", icon: <Settings />, key: "settings" },
];

const Sidebar = ({
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
  userInfo,
  uploadingPicture,
  uploadProfilePicture,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) uploadProfilePicture(file);
  };

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[1][0]).toUpperCase();
  };

  return (
    <div
      className={`transition-all duration-300 bg-white shadow-2xl border-r border-gray-200
        ${collapsed ? "w-20" : "w-64"} flex flex-col items-start pt-6 pb-10 h-screen fixed top-0 left-0 z-40`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
        className="flex flex-col items-center py-3 mb-8 focus:outline-none border-b border-gray-200 w-full px-6 transition duration-150 ease-in-out hover:bg-gray-100"
      >
        {collapsed ? (
          <>
            <Menu className="text-gray-700" size={24} />
            <span className="mt-1 text-xs font-semibold text-gray-600 select-none">Menu</span>
          </>
        ) : (
          <>
            <ChevronLeft className="text-gray-700" size={24} />
            <span className="mt-1 text-xs font-semibold text-gray-600 select-none">Close</span>
          </>
        )}
      </button>

      {/* Profile Info */}
      <motion.div
        className="flex flex-col items-center text-center px-4 mb-8 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative group">
          <img
            src={
              userInfo.profile_picture
                ? userInfo.profile_picture
                : `https://ui-avatars.com/api/?name=${userInfo.full_name}&background=10B981&color=fff&size=128`
            }
            alt="Profile"
            className={`rounded-full object-cover border-2 border-white shadow-md ${
              collapsed ? "w-16 h-16 mx-auto" : "w-20 h-20"
            }`}
          />
          {!collapsed && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploadingPicture}
                aria-label="Change profile picture"
              >
                {uploadingPicture ? (
                  <Loader size={24} className="animate-spin" />
                ) : (
                  <Pencil size={24} />
                )}
              </button>
            </>
          )}
        </div>

        {!collapsed ? (
          <>
            <p className="mt-4 text-gray-800 font-semibold truncate max-w-full text-lg">
              {userInfo.full_name}
            </p>
            <p className="text-sm text-gray-600 truncate max-w-full">{userInfo.email}</p>
            <p className="text-xs text-green-600 uppercase mt-1">{userInfo.role}</p>
          </>
        ) : (
          <p className="mt-3 text-gray-800 font-bold select-none text-lg">
            {getInitials(userInfo.full_name)}
          </p>
        )}
      </motion.div>

      {/* Menu Items */}
      <nav className="flex flex-col w-full">
        {MENU_ITEMS.map((item, idx) => (
          <React.Fragment key={item.key}>
            <button
              onClick={() => setActiveSection(item.key)}
              className={`flex items-center gap-4 w-full px-6 py-3 transition-all duration-150 ease-in-out ${
                activeSection === item.key
                  ? "bg-green-100 text-green-800 font-semibold border-l-4 border-green-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <span>{React.cloneElement(item.icon, { size: 24 })}</span>
              {!collapsed && <span>{item.name}</span>}
            </button>
            {idx < MENU_ITEMS.length - 1 && <hr className="border-gray-100 mx-6" />}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

export default ProfileSidebar;

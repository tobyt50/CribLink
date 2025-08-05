import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { motion } from "framer-motion";
import API_BASE_URL from "../config";
import { useTheme } from "../layouts/AppShell";
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { useSidebarState } from '../hooks/useSidebarState';

import Sidebar from '../components/profile/Sidebar';
import DisplayPicture from '../components/profile/DisplayPicture';
import General from './profile/General';
import Security from './profile/Security';
import Privacy from './profile/Privacy';

// Skeleton for the entire Manage Profile page layout
const ProfilePageSkeleton = ({ darkMode, isMobile, isCollapsed }) => {
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;
  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-4 min-h-screen flex flex-col`}>
      {/* Sidebar Skeleton */}
      <div className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ${isMobile ? 'w-0' : (isCollapsed ? 'w-20' : 'w-64')} ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
        <div className="p-4 flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-4`}></div>
          <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-2`}></div>
          <div className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}></div>
        </div>
        <div className="mt-8 space-y-4 px-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-8 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}></div>
          ))}
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <motion.main
        className={`flex-grow transition-all duration-300 pt-0 -mt-6 px-4 md:px-0 ${isMobile ? "w-full" : "ml-0"}`}
        style={!isMobile ? { marginLeft: contentShift } : { marginLeft: 0 }}
        animate={!isMobile ? { marginLeft: contentShift } : { marginLeft: 0 }}
        transition={{ duration: 0.05 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`
            w-full mx-auto space-y-8
            ${isMobile
              ? "p-4"
              : `max-w-4xl p-6 md:p-10 rounded-xl shadow-xl
                 ${darkMode ? "bg-gray-800" : "bg-white"}`
            }
          `}
        >
          <div className={`h-8 w-1/2 mx-auto rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-6`}></div>
          <div className={`h-48 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-6`}></div>
          <div className={`h-32 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-6`}></div>
          <div className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}></div>
        </motion.div>
      </motion.main>
    </div>
  );
};


function ManageProfile() {
  const [form, setForm] = useState({
    full_name: "", username: "", email: "", bio: "",
    location: "", phone: "", agency: "", agency_id: null, // NEW: Added agency_id
    current_password: "", new_password: "", confirm_password: "",
    social_links: [],
    profile_picture_base64: null,
    profile_picture_originalname: null,
  });

  const [userInfo, setUserInfo] = useState({
    user_id: null, // ADDED: Initialize user_id here
    full_name: "", username: "", email: "", role: "",
    profile_picture_url: "", bio: "", location: "",
    phone: "", agency: "", agency_id: null, // NEW: Added agency_id
    social_links: [],
    default_landing_page: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [deletingPicture, setDeletingPicture] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [currentSessionIdFromToken, setCurrentSessionIdFromToken] = useState(null);

  const token = localStorage.getItem("token");
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { isMobile, isCollapsed } = useSidebarState();

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm(prevForm => ({
        ...prevForm,
        full_name: res.data.full_name || "",
        username: res.data.username || "",
        email: res.data.email || "",
        bio: res.data.bio || "",
        location: res.data.location || "",
        phone: res.data.phone || "",
        agency: res.data.agency || "",
        agency_id: res.data.agency_id || null, // NEW: Populate agency_id
        social_links: res.data.social_links || [],
        profile_picture_base64: null,
        profile_picture_originalname: null,
      }));
      setUserInfo({
        user_id: res.data.user_id || null, // ADDED: Populate user_id from response
        full_name: res.data.full_name || "",
        username: res.data.username || "",
        email: res.data.email || "",
        role: res.data.role || "",
        profile_picture_url: res.data.profile_picture_url || "",
        bio: res.data.bio || "",
        location: res.data.location || "",
        phone: res.data.phone || "",
        agency: res.data.agency || "",
        agency_id: res.data.agency_id || null, // NEW: Populate agency_id
        social_links: res.data.social_links || [],
        default_landing_page: res.data.default_landing_page || "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      showMessage(error?.response?.data?.message || error.message || 'Failed to load profile data.', 'error');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePictureDataChange = (base64, originalname) => {
    setForm((prev) => ({
      ...prev,
      profile_picture_base64: base64,
      profile_picture_originalname: originalname,
    }));
  };

  const handleUpdate = async (updatedSettings) => {
    const token = localStorage.getItem("token");

    try {
      setUpdating(true);

      if (form.profile_picture_base64 && form.profile_picture_originalname) {
        setUploadingPicture(true);
        const uploadRes = await axiosInstance.put(
          `${API_BASE_URL}/users/profile/picture/upload`,
          {
            profile_picture_base64: form.profile_picture_base64,
            originalname: form.profile_picture_originalname,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        showMessage("Profile picture uploaded successfully", "success");

        setUserInfo((prev) => ({
          ...prev,
          profile_picture_url: uploadRes.data.profile_picture_url,
        }));

        setForm((prev) => ({ ...prev, profile_picture_base64: null, profile_picture_originalname: null }));
      }

      const updateData = { ...form, ...updatedSettings };
      delete updateData.profile_picture_base64;
      delete updateData.profile_picture_originalname;

      // Ensure agency_id is sent as a number or null if present
      if (updateData.agency_id !== undefined && updateData.agency_id !== null) {
        updateData.agency_id = parseInt(updateData.agency_id);
      } else if (updateData.agency_id === '') { // Treat empty string as null for backend
        updateData.agency_id = null;
      }


      const updateRes = await axiosInstance.put(
        `${API_BASE_URL}/users/update`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showMessage("Profile updated successfully!", "success");
      setUserInfo(updateRes.data.user);
      localStorage.setItem('user', JSON.stringify(updateRes.data.user));
    } catch (error) {
      console.error("Update failed:", error);
      showMessage(
        error.response?.data?.message || "Failed to update profile",
        "error"
      );
    } finally {
      setUpdating(false);
      setUploadingPicture(false);
    }
  };

  const uploadProfilePicture = async (file) => {
    setUploadingPicture(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        const res = await axiosInstance.put(`${API_BASE_URL}/users/profile/picture/upload`,
          { profile_picture_base64: base64data, originalname: file.name },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setUserInfo((prev) => ({ ...prev, profile_picture_url: res.data.profile_picture_url }));
        showMessage("Profile picture updated successfully", 'success');
      };
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      showMessage(error?.response?.data?.message || error.message || 'Failed to upload profile picture.', 'error');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDeleteProfilePicture = () => {
    showConfirm({
      title: "Delete Profile Picture",
      message: "Are you sure you want to delete your profile picture? This action cannot be undone.",
      onConfirm: async () => {
        setDeletingPicture(true);
        try {
          await axiosInstance.delete(`${API_BASE_URL}/users/profile/picture`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserInfo((prev) => ({ ...prev, profile_picture_url: null }));
          showMessage("Profile picture deleted successfully", 'success');
        } catch (error) {
          console.error("Error deleting profile picture:", error);
          showMessage(error?.response?.data?.message || error.message || 'Failed to delete profile picture.', 'error');
        } finally {
          setDeletingPicture(false);
        }
      },
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
  };

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (decodedToken && decodedToken.session_id) {
          setCurrentSessionIdFromToken(decodedToken.session_id);
        }
      } catch (e) {
        console.error("Error decoding token:", e);
      }
      fetchProfile();
    } else {
      showMessage("Authentication token not found. Please sign in.", 'error');
      setLoading(false);
    }
  }, [token]);

  const MENU_ITEMS = [
    { name: "General", key: "general" },
    { name: "Security", key: "security" },
    { name: "Privacy", key: "privacy" },
  ];
  const activeSectionName = MENU_ITEMS.find(item => item.key === activeSection)?.name || "Manage Profile";

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  if (loading) {
      return <ProfilePageSkeleton darkMode={darkMode} isMobile={isMobile} isCollapsed={isCollapsed} />;
  }

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-4 min-h-screen flex flex-col`}>
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        userInfo={userInfo}
        menuItems={MENU_ITEMS} // Pass menu items to Sidebar
      >
        <DisplayPicture
          userInfo={userInfo}
          uploadingPicture={uploadingPicture}
          deletingPicture={deletingPicture}
          uploadProfilePicture={uploadProfilePicture}
          handleDeleteProfilePicture={handleDeleteProfilePicture}
        />
      </Sidebar>

      <motion.main
        className={`flex-grow transition-all duration-300 pt-0 -mt-6 px-4 md:px-0 ${isMobile ? "w-full" : "ml-0"}`}
        style={!isMobile ? { marginLeft: contentShift } : { marginLeft: 0 }}
        animate={!isMobile ? { marginLeft: contentShift } : { marginLeft: 0 }}
        transition={{ duration: 0.05 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`
            w-full mx-auto space-y-8
            ${isMobile
              ? "p-4"
              : `max-w-4xl p-6 md:p-10 rounded-xl shadow-xl
                 ${darkMode ? "bg-gray-800" : "bg-white"}`
            }
          `}
        >
          <motion.h2
            className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {activeSectionName}
          </motion.h2>

          {activeSection === "general" && (
            <General
              form={form}
              handleChange={handleChange}
              handleUpdate={handleUpdate}
              updating={updating}
              userInfo={userInfo}
              onProfilePictureDataChange={handleProfilePictureDataChange}
              loading={loading} // Pass loading state
            />
          )}

          {activeSection === "security" && (
            <Security
              form={form}
              handleChange={handleChange}
              handleUpdate={handleUpdate}
              updating={updating}
              currentSessionIdFromToken={currentSessionIdFromToken}
              loading={loading} // Pass loading state
            />
          )}

          {activeSection === "privacy" && (
            <Privacy
              form={form}
              handleChange={handleChange}
              handleUpdate={handleUpdate}
              updating={updating}
              activeSection={activeSection}
              loading={loading} // Pass loading state
            />
          )}
  
        </motion.div>
      </motion.main>
    </div>
  );
}

export default ManageProfile;

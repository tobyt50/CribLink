import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
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
import Settings from './profile/Settings';

function ManageProfile() {
  const [form, setForm] = useState({
    full_name: "", username: "", email: "", bio: "",
    location: "", phone: "", agency: "", current_password: "",
    new_password: "", confirm_password: "",
    social_links: [], // Initialize social_links in the form state
    profile_picture_base64: null, // New: to store base64 for upload
    profile_picture_originalname: null, // New: to store original name for upload
  });

  const [userInfo, setUserInfo] = useState({
    full_name: "", username: "", email: "", role: "",
    profile_picture_url: "", bio: "", location: "",
    phone: "", agency: "",
    social_links: [], // Initialize social_links in userInfo
    default_landing_page: "", // Ensure default_landing_page is initialized here
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
        social_links: res.data.social_links || [],
        profile_picture_base64: null, // Clear base64 on fetch
        profile_picture_originalname: null, // Clear originalname on fetch
      }));
      setUserInfo({
        full_name: res.data.full_name || "",
        username: res.data.username || "",
        email: res.data.email || "",
        role: res.data.role || "",
        profile_picture_url: res.data.profile_picture_url || "",
        bio: res.data.bio || "",
        location: res.data.location || "",
        phone: res.data.phone || "",
        agency: res.data.agency || "",
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
    // This handleChange is now simplified as file handling is more direct in General.js
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // New handler for profile picture data (base64 and original name)
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

      // 1. Upload profile picture if new base64 data is present
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
              "Content-Type": "application/json", // Sending JSON with base64
            },
          }
        );

        showMessage("Profile picture uploaded successfully", "success");

        // Update the userInfo state with new picture URL
        setUserInfo((prev) => ({
          ...prev,
          profile_picture_url: uploadRes.data.profile_picture_url,
        }));

        // Clear base64 data from form after successful upload
        setForm((prev) => ({ ...prev, profile_picture_base64: null, profile_picture_originalname: null }));
      }

      // 2. Prepare update data by merging existing form state with updatedSettings
      const updateData = { ...form, ...updatedSettings };
      // Remove profile picture related fields as they are handled separately
      delete updateData.profile_picture_base64;
      delete updateData.profile_picture_originalname;

      // 3. Send profile update request
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
      // Read file as base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result;
        const res = await axiosInstance.put(`${API_BASE_URL}/users/profile/picture/upload`,
          { profile_picture_base64: base64data, originalname: file.name },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json", // Sending JSON with base64
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
    { name: "Settings", key: "settings" },
  ];
  const activeSectionName = MENU_ITEMS.find(item => item.key === activeSection)?.name || "Manage Profile";

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-4 min-h-screen flex flex-col`}>
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        userInfo={userInfo}
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
              onProfilePictureDataChange={handleProfilePictureDataChange} // Pass new handler
            />
          )}

          {activeSection === "security" && (
            <Security
              form={form}
              handleChange={handleChange}
              handleUpdate={handleUpdate}
              updating={updating}
              currentSessionIdFromToken={currentSessionIdFromToken}
            />
          )}

          {activeSection === "privacy" && (
            <Privacy
              form={form}
              handleChange={handleChange}
              handleUpdate={handleUpdate}
              updating={updating}
              activeSection={activeSection}
            />
          )}

          {activeSection === "settings" && (
            <Settings
              form={form}
              handleChange={handleChange}
              handleUpdate={handleUpdate}
              updating={updating}
              activeSection={activeSection}
              userInfo={userInfo}
            />
          )}
        </motion.div>
      </motion.main>
    </div>
  );
}

export default ManageProfile;

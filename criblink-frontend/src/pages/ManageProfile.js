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
  });

  const [userInfo, setUserInfo] = useState({
    full_name: "", username: "", email: "", role: "",
    profile_picture_url: "", bio: "", location: "",
    phone: "", agency: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [deletingPicture, setDeletingPicture] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

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
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      showMessage(error?.response?.data?.message || error.message || 'Failed to load profile data.', 'error');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      let updateData = {};
      if (activeSection === "general") {
        updateData = {
          full_name: form.full_name,
          username: form.username,
          bio: form.bio,
          location: form.location,
          phone: form.phone,
        };
        if (userInfo.role === 'agent') {
          updateData.agency = form.agency;
        }
      } else if (activeSection === "security") {
        if (form.new_password || form.current_password || form.confirm_password) {
          if (form.new_password !== form.confirm_password) {
            showMessage("New password and confirm password do not match.", 'error');
            setUpdating(false);
            return;
          }
          if (!form.current_password) {
            showMessage("Please enter your current password to change it.", 'error');
            setUpdating(false);
            return;
          }
          updateData = {
            password: form.new_password,
            current_password_check: form.current_password
          };
        } else {
          showMessage("No changes to save in Security section.", 'info');
          setUpdating(false);
          return;
        }
      }

      await axiosInstance.put(`${API_BASE_URL}/users/update`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showMessage(
        activeSection === "general"
          ? "General profile updated successfully"
          : "Password updated successfully",
        'success'
      );

      if (activeSection === "general") fetchProfile();
      if (activeSection === "security") {
        setForm((prev) => ({
          ...prev, current_password: "", new_password: "", confirm_password: ""
        }));
      }
    } catch (err) {
      console.error("Update error:", err);
      showMessage(err?.response?.data?.message || err.message || 'Failed to update profile.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const uploadProfilePicture = async (file) => {
    setUploadingPicture(true);
    try {
      const res = await axiosInstance.put(`${API_BASE_URL}/users/profile/picture/upload`, file, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type,
        },
      });
      setUserInfo((prev) => ({ ...prev, profile_picture_url: res.data.profile_picture_url }));
      showMessage("Profile picture updated successfully", 'success');
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
              ? "p-4" // mobile: no card styling
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
            />
          )}

          {activeSection === "security" && (
            <Security
              form={form}
              handleChange={handleChange}
              handleUpdate={handleUpdate}
              updating={updating}
            />
          )}

          {activeSection === "privacy" && (
            <Privacy activeSection={activeSection} />
          )}

          {activeSection === "settings" && (
            <Settings activeSection={activeSection} />
          )}
        </motion.div>
      </motion.main>
    </div>
  );
}

export default ManageProfile;

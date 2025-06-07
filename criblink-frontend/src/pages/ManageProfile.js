import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader,
  Save,
  Menu, // Keep Menu for desktop expand AND mobile toggle
  User,
  Shield,
  Lock,
  Settings,
  Pencil,
  ChevronLeft, // Keep ChevronLeft for desktop collapse
  Upload,
  X, // Added X for close button
  Trash2, // Added Trash2 icon for delete
  ImageOff // Added ImageOff for when there's no picture
} from "lucide-react";
import API_BASE_URL from "../config";
import { useTheme } from "../layouts/AppShell"; // Import useTheme hook

// Define menu items for the sidebar
const MENU_ITEMS = [
  { name: "General", icon: <User size={24} />, key: "general" },
  { name: "Security", icon: <Shield size={24} />, key: "security" },
  { name: "Privacy", icon: <Lock size={24} />, key: "privacy" },
  { name: "Settings", icon: <Settings size={24} />, key: "settings" },
];

function ManageProfile() {
  // State for form inputs (for general settings and password changes)
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    phone: "",
    agency: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // State for user information displayed in profile section (including profile picture URL)
  const [userInfo, setUserInfo] = useState({
    full_name: "",
    username: "",
    email: "",
    role: "",
    profile_picture_url: "", // Changed from 'profile_picture' to 'profile_picture_url' for clarity
    bio: "",
    location: "",
    phone: "",
    agency: "",
  });

  // Loading states for data fetching and updates
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [deletingPicture, setDeletingPicture] = useState(false); // New state for deleting picture
  const [message, setMessage] = useState(""); // User feedback messages

  // State for active section in the profile management
  const [activeSection, setActiveSection] = useState("general");

  // States for responsive sidebar behavior
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Open by default on desktop, closed on mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // Only used on desktop for collapsing sidebar

  // Ref for file input for profile picture upload
  const fileInputRef = useRef(null);

  // Get authentication token from local storage
  const token = localStorage.getItem("token");
  const { darkMode } = useTheme(); // Use the dark mode context

  // Effect hook to handle window resizing for responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Open sidebar on desktop, close on mobile
      setIsCollapsed(false); // Reset collapsed state on resize to avoid weird transitions
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to fetch user profile data
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update form and userInfo states with fetched data
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
        profile_picture_url: res.data.profile_picture_url || "", // Ensure this maps correctly from backend
        bio: res.data.bio || "",
        location: res.data.location || "",
        phone: res.data.phone || "",
        agency: res.data.agency || "",
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setMessage("Failed to fetch profile");
    } finally {
      setLoading(false); // Set loading to false after fetch attempt
    }
  };

  // Handle input changes for form fields
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle profile update submission
  const handleUpdate = async () => {
    setUpdating(true);
    setMessage(""); // Clear previous messages
    try {
      let updateData = {};

      // Prepare data based on the active section
      if (activeSection === "general") {
        updateData = {
          full_name: form.full_name,
          username: form.username,
          bio: form.bio,
          location: form.location,
          phone: form.phone,
        };
        // Only include agency if the user's role is 'agent'
        if (userInfo.role === 'agent') {
            updateData.agency = form.agency;
        }
      } else if (activeSection === "security") {
        // Handle password change logic
        if (form.new_password || form.current_password || form.confirm_password) {
             if (form.new_password !== form.confirm_password) {
                 setMessage("New password and confirm password do not match.");
                 setUpdating(false);
                 return;
             }
             if (!form.current_password) {
                  setMessage("Please enter your current password to change it.");
                  setUpdating(false);
                  return;
             }
             updateData = {
                 password: form.new_password, // Send new_password as 'password' to backend
                 current_password_check: form.current_password // Backend needs to verify this
             };
        } else {
             setMessage("No changes to save in Security section.");
             setUpdating(false);
             return;
        }
      }

      // Send update request to the backend
      await axios.put(`${API_BASE_URL}/users/update`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Provide feedback based on the updated section
      if (activeSection === "general") {
        setMessage("General profile updated successfully");
        fetchProfile(); // Re-fetch profile to update displayed info
      } else if (activeSection === "security") {
        setMessage("Password updated successfully");
        // Clear password fields after successful update
        setForm((prev) => ({ ...prev, current_password: "", new_password: "", confirm_password: "" }));
      }

    } catch (err) {
      console.error("Update error:", err);
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false); // End updating state
    }
  };

  // Handle file selection for profile picture
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadProfilePicture(file);
    }
  };

  // Upload profile picture to the server
  const uploadProfilePicture = async (file) => {
    setUploadingPicture(true);
    setMessage("");
    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      // Corrected: Use PUT method and the specific profile picture upload endpoint
      const res = await axios.put(`${API_BASE_URL}/users/profile/picture/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setUserInfo((prev) => ({ ...prev, profile_picture_url: res.data.profile_picture_url }));
      setMessage("Profile picture updated successfully");
    } catch (err) {
      console.error("Profile picture upload error:", err);
      setMessage(err.response?.data?.message || "Profile picture upload failed");
    } finally {
      setUploadingPicture(false);
      // Clear file input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle deleting profile picture
  const handleDeleteProfilePicture = async () => {
    setDeletingPicture(true);
    setMessage("");
    try {
      await axios.delete(`${API_BASE_URL}/users/profile/picture`, { // DELETE request
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserInfo((prev) => ({ ...prev, profile_picture_url: null })); // Set to null after deletion
      setMessage("Profile picture deleted successfully");
    } catch (err) {
      console.error("Profile picture deletion error:", err);
      setMessage(err.response?.data?.message || "Profile picture deletion failed");
    } finally {
      setDeletingPicture(false);
    }
  };

  // Effect hook to fetch profile data on component mount or token change
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setMessage("Authentication token not found. Please sign in.");
      setLoading(false);
    }
  }, [token]);

  // Styles for form elements
  // Updated inputFieldStyles to match the focus border and transition from Home.js
  const inputFieldStyles =
    `mt-1 block w-full py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
      darkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;
  const inputGroupStyles = "flex flex-col";

  // Display loading spinner while data is being fetched
  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
    );
  }

  // Helper function to get initials from full name
  const getInitials = (name) => {
    if (!name) return "";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0]?.toUpperCase() || "";
    return ((names[0]?.[0] || "") + (names[names.length - 1]?.[0] || "")).toUpperCase();
  };

  // Get the display name for the active section
  const activeSectionName = MENU_ITEMS.find(item => item.key === activeSection)?.name || "Manage Profile";

  // Calculate content shift based on sidebar state
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex`}>
      {/* Mobile Sidebar Toggle Button (fixed on the main content area) */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className={`fixed top-20 left-4 z-50 p-2 rounded-full shadow-md ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
          initial={false}
          animate={{ rotate: isSidebarOpen ? 180 : 0, opacity: 1 }}
          transition={{ duration: 0.05 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isSidebarOpen ? 'close' : 'menu'}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.05 }}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      )}

      {/* Sidebar */}
      <motion.div
        className={`transition-all duration-300 shadow-2xl border-r
          flex flex-col items-start pb-10 h-screen fixed left-0 z-40 overflow-y-auto
          ${isMobile ? (isSidebarOpen ? 'translate-x-0 w-64 top-14' : '-translate-x-full w-64 top-14') : (isCollapsed ? 'w-20 top-14' : 'w-64 top-14')}
          ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
        `}
        initial={false}
        animate={{
          x: isMobile ? (isSidebarOpen ? 0 : -256) : 0, // 256px is w-64
          width: isMobile ? 256 : (isCollapsed ? 80 : 256)
        }}
        transition={{ duration: 0.05 }}
      >
        {/* Close/Collapse Button for Sidebar (only desktop) */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            aria-label="Toggle sidebar"
            className={`flex flex-col items-center py-3 mb-6 border-b w-full px-6 transition-colors duration-200 ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100"}`}
          >
            {isCollapsed ? (
              <>
                <Menu className={`${darkMode ? "text-gray-200" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold select-none ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Expand</span>
              </>
            ) : (
              <>
                <ChevronLeft className={`${darkMode ? "text-gray-200" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold select-none ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Collapse</span>
              </>
            )}
          </button>
        )}

        {/* Profile Section */}
        <motion.div
          className={`flex flex-col items-center text-center px-4 mb-8 w-full`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Profile Picture */}
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

          {/* Profile Details */}
          {(isMobile || !isCollapsed) ? (
            <>
              <p className={`mt-4 font-semibold truncate max-w-full text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                {userInfo.full_name}
              </p>
              <p className={`text-sm truncate max-w-full ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {userInfo.email}
              </p>
              <p className={`text-xs uppercase mt-1 ${darkMode ? "text-green-400" : "text-green-600"}`}>{userInfo.role}</p>
            </>
          ) : (
            <p className={`mt-3 font-bold select-none text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
              {getInitials(userInfo.full_name)}
            </p>
          )}
        </motion.div>

        {/* Menu Items */}
        <nav className="flex flex-col w-full">
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <button
                onClick={() => {
                  setActiveSection(item.key);
                  if (isMobile) setIsSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`flex items-center gap-4 w-full px-6 py-3 transition-all duration-150 ease-in-out
                  ${
                    activeSection === item.key
                      ? `font-semibold border-l-4 border-green-600 ${darkMode ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"}`
                      : `${darkMode ? "text-gray-300 hover:bg-gray-700 hover:text-gray-100" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"}`
                  }`}
              >
                <span>
                  {React.cloneElement(item.icon, { size: 24, className: `${darkMode ? "text-green-400" : ""}` })}
                </span>
                {(isMobile || !isCollapsed) && <span>{item.name}</span>}
              </button>
              {/* Divider line */}
              {idx < MENU_ITEMS.length - 1 && (
                <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />
              )}
            </React.Fragment>
          ))}
        </nav>
      </motion.div>

      {/* Backdrop on mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <motion.main
        className={`flex-grow transition-all duration-300 pt-6 px-4 md:px-8`}
        style={{ marginLeft: contentShift }}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.05 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`rounded-xl shadow-xl w-full max-w-4xl p-6 md:p-10 space-y-8 mx-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <motion.h2
            className={`text-3xl font-extrabold text-center pb-6 mb-8 border-b ${darkMode ? "text-green-400 border-gray-700" : "text-green-700 border-gray-200"}`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {activeSectionName}
          </motion.h2>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 text-sm text-center rounded-lg p-4 shadow-sm border ${
                message.includes("successfully")
                  ? `${darkMode ? "bg-green-900 text-green-200 border-green-700" : "bg-green-100 text-green-800 border-green-200"}`
                  : `${darkMode ? "bg-red-900 text-red-200 border-red-700" : "bg-red-100 text-red-800 border-red-200"}`
              }`}
            >
            <div dangerouslySetInnerHTML={{ __html: message }} />
            </motion.div>
          )}

          {activeSection === "general" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="space-y-6"
            >
              {/* General Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input group for Full Name */}
                <div className={inputGroupStyles}>
                  <label className={labelStyles} htmlFor="full_name">Full Name</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    className={inputFieldStyles}
                    autoComplete="name"
                  />
                </div>
                {/* Input group for Username */}
                <div className={inputGroupStyles}>
                  <label className={labelStyles} htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className={inputFieldStyles}
                    autoComplete="username"
                  />
                </div>
                {/* Input group for Email */}
                <div className={inputGroupStyles}>
                  <label className={labelStyles} htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`${inputFieldStyles} cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100"}`}
                    disabled
                    autoComplete="email"
                  />
                </div>
                 {/* Input group for Phone Number */}
                 <div className={inputGroupStyles}>
                  <label className={labelStyles} htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputFieldStyles}
                    autoComplete="tel"
                  />
                </div>
                 {/* Input group for Location */}
                 <div className={inputGroupStyles}>
                  <label className={labelStyles} htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className={inputFieldStyles}
                    autoComplete="address-level1"
                  />
                </div>
                {/* Input group for Agency Name (only for agents) */}
                {userInfo.role === 'agent' && (
                  <div className={inputGroupStyles}>
                    <label className={labelStyles} htmlFor="agency">Agency Name</label>
                    <input
                      type="text"
                      id="agency"
                      name="agency"
                      value={form.agency}
                      onChange={handleChange}
                      className={inputFieldStyles}
                      autoComplete="organization"
                    />
                  </div>
                )}
              </div>

              {/* Bio Section */}
              <div className={inputGroupStyles}>
                <label className={labelStyles} htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  className={`${inputFieldStyles} h-28 resize-none`}
                  placeholder="Tell us a little about yourself..."
                ></textarea>
              </div>

              <div className="flex justify-center pt-8">
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
                >
                  {updating ? (
                      <Loader size={20} className="animate-spin mr-2 inline-block" />
                  ) : (
                    <Save size={20} className="mr-2 inline-block" />
                  )}
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>

            </motion.div>
          )}

          {activeSection === "security" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="space-y-6"
              >
                {/* Change Password Section */}
                <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Change Password</h3>
                  <div className="space-y-4">
                      <div className={inputGroupStyles}>
                          <label className={labelStyles} htmlFor="current_password">Current Password</label>
                          <input
                              type="password"
                              id="current_password"
                              name="current_password"
                              value={form.current_password}
                              onChange={handleChange}
                              className={inputFieldStyles}
                              autoComplete="current-password"
                          />
                      </div>
                      <div className={inputGroupStyles}>
                          <label className={labelStyles} htmlFor="new_password">New Password</label>
                          <input
                              type="password"
                              id="new_password"
                              name="new_password"
                              value={form.new_password}
                              onChange={handleChange}
                              className={inputFieldStyles}
                              autoComplete="new-password"
                          />
                      </div>
                      <div className={inputGroupStyles}>
                          <label className={labelStyles} htmlFor="confirm_password">Confirm New Password</label>
                          <input
                              type="password"
                              id="confirm_password"
                              name="confirm_password"
                              value={form.confirm_password}
                              onChange={handleChange}
                              className={inputFieldStyles}
                              autoComplete="new-password"
                          />
                      </div>
                  </div>
                </div>

                {/* Two-Factor Authentication Section (Placeholder) */}
                <div>
                   <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Two-Factor Authentication (2FA)</h3>
                   <div className={`p-5 rounded-lg border text-sm ${darkMode ? "bg-green-900 border-green-700 text-green-200" : "bg-green-50 border-green-200 text-green-700"}`}>
                       <p className="mb-2 font-medium">Enhance your account security by enabling Two-Factor Authentication.</p>
                       <p>This section is under development. Please check back later to set up 2FA.</p>
                   </div>
                </div>

                <div className="flex justify-center pt-8">
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105"
                  >
                    {updating ? (
                      <Loader size={20} className="animate-spin mr-2 inline-block" />
                    ) : (
                      <Save size={20} className="mr-2 inline-block" />
                    )}
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>

              </motion.div>
          )}

          {/* For other sections (privacy, settings), display coming soon message */}
          {activeSection !== "general" && activeSection !== "security" && (
            <div className={`text-center italic py-12 text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}{" "}
              section coming soon...
            </div>
          )}
        </motion.div>
      </motion.main>
    </div>
  );
}

export default ManageProfile;

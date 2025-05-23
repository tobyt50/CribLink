import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Loader,
  Save,
  Menu,
  User,
  Shield,
  Lock,
  Settings,
  Pencil,
  ChevronLeft,
  Upload
} from "lucide-react";
import API_BASE_URL from "../config";

const MENU_ITEMS = [
  { name: "General", icon: <User size={24} />, key: "general" },
  { name: "Security", icon: <Shield size={24} />, key: "security" },
  { name: "Privacy", icon: <Lock size={24} />, key: "privacy" },
  { name: "Settings", icon: <Settings size={24} />, key: "settings" },
];

function ManageProfile() {
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    bio: "",
    location: "",
    phone: "", // Changed from phone_number to phone to match backend
    agency: "", // Added agency field
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [userInfo, setUserInfo] = useState({
    full_name: "",
    username: "",
    email: "",
    role: "",
    profile_picture: "",
    bio: "",
    location: "",
    phone: "", // Changed from phone_number to phone
    agency: "", // Added agency field
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("general");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm(prevForm => ({
        ...prevForm,
        full_name: res.data.full_name || "",
        username: res.data.username || "",
        email: res.data.email || "",
        bio: res.data.bio || "",
        location: res.data.location || "",
        phone: res.data.phone || "", // Use 'phone' from backend
        agency: res.data.agency || "", // Use 'agency' from backend
      }));
      setUserInfo({
        full_name: res.data.full_name || "",
        username: res.data.username || "",
        email: res.data.email || "",
        role: res.data.role || "",
        profile_picture: res.data.profile_picture || "",
        bio: res.data.bio || "",
        location: res.data.location || "",
        phone: res.data.phone || "", // Use 'phone' from backend
        agency: res.data.agency || "", // Use 'agency' from backend
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setMessage("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setMessage("");
    try {
      let updateData = {};

      if (activeSection === "general") {
        updateData = {
          full_name: form.full_name,
          username: form.username,
          bio: form.bio,
          location: form.location,
          phone: form.phone, // Use 'phone' for update
        };
        // Only include agency if the user is an agent
        if (userInfo.role === 'agent') {
            updateData.agency = form.agency;
        }
      } else if (activeSection === "security") {
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
                 current_password: form.current_password,
                 new_password: form.new_password,
             };
        } else {
             setMessage("No changes to save in Security section.");
             setUpdating(false);
             return;
        }
      }

      await axios.put(`${API_BASE_URL}/users/update`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (activeSection === "general") {
        setMessage("General profile updated successfully");
        fetchProfile();
      } else if (activeSection === "security") {
        setMessage("Password updated successfully");
        setForm((prev) => ({ ...prev, current_password: "", new_password: "", confirm_password: "" }));
      }

    } catch (err) {
      console.error("Update error:", err);
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadProfilePicture(file);
    }
  };

  const uploadProfilePicture = async (file) => {
    setUploadingPicture(true);
    setMessage("");
    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axios.post(`${API_BASE_URL}/users/profile-picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setUserInfo((prev) => ({ ...prev, profile_picture: res.data.profile_picture_url }));
      setMessage("Profile picture updated successfully");
    } catch (err) {
      console.error("Profile picture upload error:", err);
      setMessage(err.response?.data?.message || "Profile picture upload failed");
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setMessage("Authentication token not found. Please sign in.");
      setLoading(false);
    }
  }, [token]);

  // Refined styles for input fields (keeping original green background)
  const inputFieldStyles =
    "mt-1 block w-full py-2.5 px-4 bg-green-50 border border-green-200 text-gray-800 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-base transition duration-150 ease-in-out";
  // Refined styles for labels
  const labelStyles = "block text-sm font-medium text-gray-700 mb-1";
  // Container for label and input
  const inputGroupStyles = "flex flex-col";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader className="animate-spin w-12 h-12 text-green-600" />
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[1][0]).toUpperCase();
  };

  const activeSectionName = MENU_ITEMS.find(item => item.key === activeSection)?.name || "Manage Profile";


  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 bg-white shadow-2xl border-r border-gray-200
          ${sidebarCollapsed ? "w-20" : "w-64"}
          flex flex-col items-start pt-6 pb-10 h-screen fixed top-0 left-0 z-40`}
      >
        {/* Hamburger Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label="Toggle sidebar"
          className={`flex flex-col items-center py-3 mb-8 focus:outline-none border-b border-gray-200 w-full px-6 transition duration-150 ease-in-out hover:bg-gray-100`}
        >
          {sidebarCollapsed ? (
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


        {/* Profile Section */}
        <motion.div
          className={`flex flex-col items-center text-center px-4 mb-8 w-full`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Profile Picture */}
          <div className="relative group">
            <img
              src={
                userInfo.profile_picture
                  ? userInfo.profile_picture
                  : `https://ui-avatars.com/api/?name=${userInfo.full_name}&background=10B981&color=fff&size=128`
              }
              alt="Profile"
              className={`rounded-full object-cover border-2 border-white shadow-md
                ${sidebarCollapsed ? "w-16 h-16 mx-auto" : "w-20 h-20"}`}
            />
            {!sidebarCollapsed && (
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

          {/* Profile Details */}
          {!sidebarCollapsed ? (
            <>
              <p className="mt-4 text-gray-800 font-semibold truncate max-w-full text-lg">
                {userInfo.full_name}
              </p>
              <p className="text-sm text-gray-600 truncate max-w-full">
                {userInfo.email}
              </p>
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
                className={`flex items-center gap-4 w-full px-6 py-3 transition-all duration-150 ease-in-out
                  ${
                    activeSection === item.key
                      ? "bg-green-100 text-green-800 font-semibold border-l-4 border-green-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`}
              >
                <span>
                  {React.cloneElement(item.icon, { size: 24 })}
                </span>
                {!sidebarCollapsed && <span>{item.name}</span>}
              </button>
              {/* Divider line */}
              {idx < MENU_ITEMS.length - 1 && (
                <hr className="border-gray-100 mx-6" />
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main
        className={`flex-grow transition-all duration-300
          ${sidebarCollapsed ? "ml-20" : "ml-64"} p-8`}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-10 space-y-8 mx-auto"
        >
          <motion.h2
            className="text-3xl font-extrabold text-green-700 text-center border-b pb-6 mb-8 border-gray-200"
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
              className="mb-6 text-sm text-center text-green-800 bg-green-100 rounded-lg p-4 shadow-sm border border-green-200"
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
                    className={`${inputFieldStyles} cursor-not-allowed bg-gray-100`}
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
                  className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105" // Adjusted padding here
                >
                  {updating ? (
                    <Loader size={20} className="animate-spin mr-2 inline-block" /> // Adjusted icon size and margin
                  ) : (
                    <Save size={20} className="mr-2 inline-block" /> // Adjusted icon size and margin
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
                <div className="border-b border-gray-200 pb-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
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
                   <h3 className="text-xl font-semibold text-gray-800 mb-4">Two-Factor Authentication (2FA)</h3>
                   <div className="bg-green-50 p-5 rounded-lg border border-green-200 text-sm text-green-700">
                       <p className="mb-2 font-medium">Enhance your account security by enabling Two-Factor Authentication.</p>
                       <p>This section is under development. Please check back later to set up 2FA.</p>
                       {/* You would typically have a button here to initiate 2FA setup */}
                       {/* <button className="mt-4 bg-green-600 text-white py-2.5 px-5 rounded-md text-sm hover:bg-green-700 transition duration-150 ease-in-out">Enable 2FA</button> */}
                   </div>
                </div>


                <div className="flex justify-center pt-8">
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105" // Adjusted padding here
                  >
                    {updating ? (
                      <Loader size={20} className="animate-spin mr-2 inline-block" /> // Adjusted icon size and margin
                    ) : (
                      <Save size={20} className="mr-2 inline-block" /> // Adjusted icon size and margin
                    )}
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>

              </motion.div>
          )}

          {/* For other sections (privacy, settings), you can add content similarly */}
          {activeSection !== "general" && activeSection !== "security" && (
            <div className="text-center text-gray-500 italic py-12 text-lg">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}{" "}
              section coming soon...
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default ManageProfile;

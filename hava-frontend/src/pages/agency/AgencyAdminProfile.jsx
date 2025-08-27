import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../../config";
import { useTheme } from "../../layouts/AppShell";
import { useMessage } from "../../context/MessageContext";

import {
  BuildingOfficeIcon,
  UsersIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  ArrowPathIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// Skeleton component for Agency Admin Profile page
const AgencyAdminProfileSkeleton = ({ darkMode }) => (
  <div className={`animate-pulse space-y-8 lg:flex lg:space-x-8 lg:space-y-0`}>
    {/* Left Column Skeleton: Admin Details */}
    <div className="w-full lg:w-3/5 space-y-8">
      <div
        className={`p-6 space-y-4 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
      >
        {/* Admin Name and Status */}
        <div
          className={`h-8 w-2/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div className="flex items-start space-x-4 mb-6">
          {/* Profile Picture */}
          <div
            className={`w-40 h-40 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
          {/* Admin ID and Contact Information */}
          <div className="flex-1 space-y-3">
            <div
              className={`h-4 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-6 w-1/3 rounded mt-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
          </div>
        </div>
        {/* About Admin */}
        <div
          className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-4 w-2/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        {/* System Information */}
        <div
          className={`h-6 w-1/3 rounded mt-6 ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </div>
    </div>

    {/* Right Column Skeleton: Agency Overview, Agent Management, Listings Management */}
    <div className="w-full lg:w-2/5 space-y-8">
      {/* Agency Overview Panel */}
      <div
        className={`p-6 space-y-4 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
      >
        <div
          className={`h-8 w-2/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
          <div
            className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        </div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-10 w-full rounded-xl mt-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </div>

      {/* Agent Management Overview */}
      <div
        className={`p-6 space-y-4 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
      >
        <div
          className={`h-8 w-2/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-6 w-1/2 rounded mt-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        ))}
        <div
          className={`h-6 w-1/2 rounded mt-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        ))}
      </div>

      {/* Listings Management Overview */}
      <div
        className={`p-6 space-y-4 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
      >
        <div
          className={`h-8 w-2/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-6 w-1/2 rounded mt-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        ))}
        <div
          className={`h-6 w-1/2 rounded mt-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

const AgencyAdminProfile = () => {
  const { adminId } = useParams(); // Get the admin ID from the URL
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for expanded profile picture
  const [isProfilePicExpanded, setIsProfilePicExpanded] = useState(false);
  const profilePicRef = useRef(null);

  const getInitial = (name) => {
    const safeName = String(name || "");
    return safeName.length > 0 ? safeName.charAt(0).toUpperCase() : "AA";
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  };

  const formatDateTime = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
  };

  // Function to convert string to sentence case
  const toSentenceCase = (str) => {
    if (!str) return "N/A";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Call the new backend endpoint for agency admin profiles
      const adminRes = await axiosInstance.get(
        `${API_BASE_URL}/agency-admins/profile/${adminId}`,
        {
          headers: headers,
        },
      );
      setAdmin(adminRes.data);
    } catch (err) {
      console.error("Error fetching agency admin profile:", err);
      setError(
        err.response?.data?.message || "Failed to load agency admin profile.",
      );
      showMessage(
        err.response?.data?.message || "Failed to load agency admin profile.",
        "error",
      );
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, [adminId, showMessage]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Effect to handle clicks outside the expanded profile picture
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profilePicRef.current &&
        !profilePicRef.current.contains(event.target)
      ) {
        setIsProfilePicExpanded(false);
      }
    };

    if (isProfilePicExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfilePicExpanded]);

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900 text-red-400" : "bg-gray-50 text-red-600"}`}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div
      className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-4 md:px-0 min-h-screen flex flex-col`}
    >
      <motion.div
        key="agency-admin-profile-content"
        transition={{ duration: 0.3, ease: "easeInOut" }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
      >
        <h1
          className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}
        >
          Agency Administrator Profile
        </h1>

        {loading ? (
          <AgencyAdminProfileSkeleton darkMode={darkMode} />
        ) : !admin ? (
          <div
            className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-500"}`}
          >
            Agency administrator profile not found.
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:max-w-7xl lg:mx-auto">
            {/* Left Column: Admin Details */}
            <div className="w-full lg:w-3/5 space-y-8">
              <motion.div
                // Refactored: Removed bg-white, rounded-2xl, and shadow-xl for mobile view.
                // They are now applied only on medium (md) screens and up.
                className={`p-6 space-y-4 ${darkMode ? "bg-gray-800" : "md:bg-white"} md:rounded-2xl md:shadow-xl`}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Admin Name and Status */}
                <h2
                  className={`text-xl md:text-2xl font-extrabold mb-4 ${darkMode ? "text-green-400" : "text-green-800"} flex items-center`}
                >
                  {admin.full_name}
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                    ${admin.user_status === "active" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}
                    ${darkMode ? (admin.user_status === "active" ? "dark:bg-green-700 dark:text-green-200" : "dark:bg-red-700 dark:text-red-200") : ""}`}
                  >
                    {toSentenceCase(admin.user_status) || "N/A"}
                  </span>
                </h2>

                <div className="flex items-start space-x-4 mb-6">
                  {/* Profile Picture */}
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setIsProfilePicExpanded(true)}
                  >
                    <img
                      src={
                        admin.profile_picture_url ||
                        `https://placehold.co/150x150/${darkMode ? "374151" : "E0F7FA"}/${darkMode ? "D1D5DB" : "004D40"}?text=${getInitial(admin.full_name)}`
                      }
                      alt="Admin Profile"
                      className="w-40 h-40 rounded-full object-cover border-2 border-green-500 shadow-md"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/150x150/${darkMode ? "374151" : "E0F7FA"}/${darkMode ? "D1D5DB" : "004D40"}?text=${getInitial(admin.full_name)}`;
                      }}
                    />
                  </div>
                  {/* Admin ID and Contact Information */}
                  <div className="flex-1">
                    <p
                      className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Admin ID: {admin.user_id}
                    </p>
                    {/* Refactored line to display agency name from agency_info */}
                    <p
                      className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Agency: {admin.agency_info?.agency_name || "N/A"}
                    </p>
                    <div
                      className={`space-y-3 pt-4 ${darkMode ? "border-gray-700" : "border-gray-200"} border-t`}
                    >
                      <h3
                        className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}
                      >
                        Contact Information
                      </h3>
                      <p
                        className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        <EnvelopeIcon className="h-5 w-5 text-green-500" />{" "}
                        <strong>Email:</strong>{" "}
                        <a
                          href={`mailto:${admin.email}`}
                          className="text-blue-500 hover:underline"
                        >
                          {admin.email}
                        </a>
                      </p>
                      <p
                        className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        <PhoneIcon className="h-5 w-5 text-green-500" />{" "}
                        <strong>Phone:</strong> {admin.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Profile Picture Modal */}
                <AnimatePresence>
                  {isProfilePicExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                      onClick={() => setIsProfilePicExpanded(false)} // Close on click outside
                    >
                      <motion.img
                        ref={profilePicRef}
                        src={
                          admin.profile_picture_url ||
                          `https://placehold.co/400x400/${darkMode ? "374151" : "E0F7FA"}/${darkMode ? "D1D5DB" : "004D40"}?text=${getInitial(admin.full_name)}`
                        }
                        alt="Admin Profile Expanded"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl cursor-pointer"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  className={`space-y-3 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}
                >
                  <h3
                    className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}
                  >
                    About {admin.full_name}
                  </h3>
                  {admin.bio && (
                    <p
                      className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}
                    >
                      {admin.bio}
                    </p>
                  )}
                  {admin.location && (
                    <p
                      className={`flex items-center gap-2 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <MapPinIcon className="h-5 w-5 text-green-500" />{" "}
                      <strong>Based In:</strong> {admin.location}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <h3
                    className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}
                  >
                    System Information
                  </h3>
                  <p
                    className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    <strong>Joined Platform:</strong>{" "}
                    {formatDate(admin.date_joined)}
                  </p>
                  <p
                    className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    <strong>Last Active:</strong>{" "}
                    {formatDateTime(admin.last_login)}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Agency Overview, Agent Management, Listings Management */}
            <div className="w-full lg:w-2/5 space-y-8">
              {/* Agency Overview Panel */}
              <motion.div
                // Refactored: Removed bg-white, rounded-2xl, and shadow-xl for mobile view.
                // They are now applied only on medium (md) screens and up.
                className={`p-6 space-y-4 ${darkMode ? "bg-gray-800" : "md:bg-white"} md:rounded-2xl md:shadow-xl`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2
                  className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
                >
                  <BuildingOfficeIcon className="h-6 w-6 inline-block mr-2" />{" "}
                  Agency Overview
                </h2>
                {admin.agency_info ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      {admin.agency_info.logo_url ? (
                        <img
                          src={admin.agency_info.logo_url}
                          alt={`${admin.agency_info.agency_name} Logo`}
                          className="w-16 h-16 rounded-full object-cover border border-gray-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://placehold.co/64x64/${darkMode ? "374151" : "E0F7FA"}/${darkMode ? "D1D5DB" : "004D40"}?text=${getInitial(admin.agency_info.agency_name)}`;
                          }}
                        />
                      ) : (
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${darkMode ? "bg-gray-700 text-green-400" : "bg-green-100 text-green-700"}`}
                        >
                          {getInitial(admin.agency_info.agency_name)}
                        </div>
                      )}
                      <p
                        className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"} flex items-center`}
                      >
                        {admin.agency_info.agency_name}
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                          ${admin.agency_info.status === "active" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}
                          ${darkMode ? (admin.agency_info.status === "active" ? "dark:bg-green-700 dark:text-green-200" : "dark:bg-red-700 dark:text-red-200") : ""}`}
                        >
                          {toSentenceCase(admin.agency_info.status) || "N/A"}
                        </span>
                      </p>
                    </div>
                    <p
                      className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <strong>Location:</strong>{" "}
                      {admin.agency_info.location || "N/A"}
                    </p>
                    <p
                      className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <strong>Date Founded:</strong>{" "}
                      {formatDate(admin.agency_info.date_founded)}
                    </p>
                    <p
                      className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <strong>Total Agents:</strong>{" "}
                      {admin.agent_management.total_agents || "N/A"}
                    </p>
                    <p
                      className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <strong>Total Listings:</strong>{" "}
                      {admin.listings_management.total_listings || "N/A"}
                    </p>
                    <div className="flex justify-center">
                      {" "}
                      {/* Centering the button */}
                      <button
                        onClick={() =>
                          navigate(`/agencies/${admin.agency_info.agency_id}`)
                        } /* Link to agency profile page */
                        className={`mt-4 py-2 px-4 rounded-xl transition font-semibold shadow ${darkMode ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                      >
                        View Agency Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No agency information available.
                  </p>
                )}
              </motion.div>

              {/* Agent Management Overview */}
              <motion.div
                // Refactored: Removed bg-white, rounded-2xl, and shadow-xl for mobile view.
                // They are now applied only on medium (md) screens and up.
                className={`p-6 space-y-4 ${darkMode ? "bg-gray-800" : "md:bg-white"} md:rounded-2xl md:shadow-xl`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2
                  className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
                >
                  <UsersIcon className="h-6 w-6 inline-block mr-2" /> Agent
                  Management
                </h2>
                <p
                  className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  <strong>Current Agents:</strong>{" "}
                  {admin.agent_management.total_agents}
                </p>

                <div className="mt-4">
                  <h3
                    className={`text-lg font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Recent Join Requests:
                  </h3>
                  {admin.agent_management.recent_agent_join_requests &&
                  admin.agent_management.recent_agent_join_requests.length >
                    0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {admin.agent_management.recent_agent_join_requests.map(
                        (req, index) => (
                          <li
                            key={index}
                            className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            {" "}
                            {/* Changed from text-gray-400/600 to text-gray-300/700 */}
                            {req.agent_name} -{" "}
                            <span
                              className={`font-medium ${req.status === "pending" ? "text-yellow-500" : "text-green-500"}`}
                            >
                              {toSentenceCase(req.status)}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p
                      className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      No recent join requests.
                    </p>
                  )}
                </div>

                {admin.agent_management.last_agent_invited && (
                  <p
                    className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    <strong>Last Agent Invited:</strong>{" "}
                    {admin.agent_management.last_agent_invited.full_name}{" "}
                    (Joined:{" "}
                    {formatDate(
                      admin.agent_management.last_agent_invited.date_joined,
                    )}
                    )
                  </p>
                )}

                <div className="mt-4">
                  <h3
                    className={`text-lg font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Recent Actions:
                  </h3>
                  {admin.agent_management.actions_performed &&
                  admin.agent_management.actions_performed.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {admin.agent_management.actions_performed.map(
                        (action, index) => (
                          <li
                            key={index}
                            className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            {" "}
                            {/* Changed from text-gray-400/600 to text-gray-300/700 */}
                            {action.description} (on{" "}
                            {formatDate(action.timestamp)})
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p
                      className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      No recent actions recorded.
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Listings Management Overview */}
              <motion.div
                // Refactored: Removed bg-white, rounded-2xl, and shadow-xl for mobile view.
                // They are now applied only on medium (md) screens and up.
                className={`p-6 space-y-4 ${darkMode ? "bg-gray-800" : "md:bg-white"} md:rounded-2xl md:shadow-xl`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h2
                  className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
                >
                  <ListBulletIcon className="h-6 w-6 inline-block mr-2" />{" "}
                  Listings Management
                </h2>
                <p
                  className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  <strong>Total Listings:</strong>{" "}
                  {admin.listings_management.total_listings}
                </p>
                <p
                  className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  <strong>Published:</strong>{" "}
                  {admin.listings_management.published_listings}
                </p>
                <p
                  className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  <strong>Unpublished/Drafts:</strong>{" "}
                  {admin.listings_management.unpublished_listings}
                </p>

                <div className="mt-4">
                  <h3
                    className={`text-lg font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Recently Modified:
                  </h3>
                  {admin.listings_management.recently_modified_listings &&
                  admin.listings_management.recently_modified_listings.length >
                    0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {admin.listings_management.recently_modified_listings.map(
                        (listing, index) => (
                          <li
                            key={index}
                            className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            {" "}
                            {/* Changed from text-gray-400/600 to text-gray-300/700 */}
                            {listing.title} (Last Updated:{" "}
                            {formatDate(listing.updated_at)})
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p
                      className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      No recently modified listings.
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <h3
                    className={`text-lg font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Top-performing Listings:
                  </h3>
                  {admin.listings_management.top_performing_listings &&
                  admin.listings_management.top_performing_listings.length >
                    0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {admin.listings_management.top_performing_listings.map(
                        (listing, index) => (
                          <li
                            key={index}
                            className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            {" "}
                            {/* Changed from text-gray-400/600 to text-gray-300/700 */}
                            {listing.title} (Inquiries: {listing.inquiries},
                            Views: {listing.views})
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p
                      className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      No top-performing listings data.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AgencyAdminProfile;

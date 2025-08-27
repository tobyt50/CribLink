import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Loader,
  Save,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  KeyRound,
  Clock,
} from "lucide-react";
import { useTheme } from "../../../layouts/AppShell";
import axiosInstance from "../../../api/axiosInstance";
import { useMessage } from "../../../context/MessageContext";
import { useConfirmDialog } from "../../../context/ConfirmDialogContext";

// --- Skeleton for Security section ---
const SecuritySectionSkeleton = ({ darkMode }) => (
  <div className="space-y-8 animate-pulse">
    {/* Change Password Skeleton */}
    <div
      className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div
        className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div
              className={`h-10 w-full rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
            ></div>
          </div>
        ))}
      </div>
      <div
        className={`h-10 w-48 rounded-full mt-4 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
      ></div>
    </div>
    {/* 2FA Skeleton */}
    <div
      className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div
        className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div
        className={`h-32 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
      ></div>
    </div>
    {/* Active Sessions Skeleton */}
    <div
      className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div
        className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl h-24 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          ></div>
        ))}
      </div>
    </div>
    {/* Login History Skeleton */}
    <div className={`pb-6 mb-6`}>
      <div
        className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl h-20 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          ></div>
        ))}
      </div>
    </div>
    {/* Deactivation Skeleton */}
    <div className={`pb-6 mb-6`}>
      <div
        className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div
        className={`h-32 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
      ></div>
    </div>
  </div>
);

function Security() {
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [updating, setUpdating] = useState(false);

  const [deactivating, setDeactivating] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const token = localStorage.getItem("token");
  const currentSessionIdFromToken = token
    ? JSON.parse(atob(token.split(".")[1])).session_id
    : null;

  // Fetch Active Sessions
  const fetchActiveSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const response = await axiosInstance.get("/users/sessions/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sorted = response.data.sort((a, b) => {
        if (a.session_id === currentSessionIdFromToken) return -1;
        if (b.session_id === currentSessionIdFromToken) return 1;
        return new Date(b.login_time) - new Date(a.login_time);
      });
      setActiveSessions(sorted);
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to load active sessions.",
        "error",
      );
    } finally {
      setSessionsLoading(false);
    }
  }, [token, showMessage, currentSessionIdFromToken]);

  // Fetch Login History
  const fetchLoginHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await axiosInstance.get("/users/login-history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoginHistory(response.data);
    } catch (error) {
      showMessage(
        error?.response?.data?.message || "Failed to load login history.",
        "error",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [token, showMessage]);

  // Corrected useEffect to trigger fetches on mount
  useEffect(() => {
    if (token) {
      fetchActiveSessions();
      fetchLoginHistory();
    }
  }, [token, fetchActiveSessions, fetchLoginHistory]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordUpdate = async () => {
    if (!form.new_password || !form.current_password) {
      showMessage("Please fill out all password fields.", "error");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      showMessage("New passwords do not match.", "error");
      return;
    }
    setUpdating(true);
    try {
      await axiosInstance.put(
        "/users/update-password",
        {
          current_password: form.current_password,
          new_password: form.new_password,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showMessage("Password updated successfully!", "success");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to update password.",
        "error",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    handlePasswordUpdate();
  };

  const handleRevokeSession = (sessionId) => {
    /* ... unchanged ... */
  };
  const handleSignOutAllOtherDevices = () => {
    /* ... unchanged ... */
  };
  const handleDeactivateAccount = () => {
    /* ... unchanged ... */
  };
  const formatDateTime = (timestamp) =>
    timestamp ? new Date(timestamp).toLocaleString() : "N/A";

  const inputFieldStyles = `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

  // Show the main skeleton if either of the data sections is loading
  if (sessionsLoading || historyLoading) {
    return <SecuritySectionSkeleton darkMode={darkMode} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <form
        onSubmit={handlePasswordSubmit}
        className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3
          className={`text-lg md:text-xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          <KeyRound className="mr-3 text-blue-500" /> Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelStyles}>Current Password</label>
            <input
              type="password"
              name="current_password"
              value={form.current_password}
              onChange={handleChange}
              className={inputFieldStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>New Password</label>
            <input
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              className={inputFieldStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              className={inputFieldStyles}
            />
          </div>
        </div>
        <div className="flex justify-start pt-6">
          <button
            type="submit"
            disabled={updating}
            className="bg-green-600 text-white py-2 px-6 rounded-full hover:bg-green-700 text-md font-semibold disabled:opacity-50 flex items-center"
          >
            {updating ? (
              <Loader size={20} className="animate-spin mr-2" />
            ) : (
              <Save size={20} className="mr-2" />
            )}
            {updating ? "Saving..." : "Save Password"}
          </button>
        </div>
      </form>

      <div
        className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3
          className={`text-lg md:text-xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          <ShieldCheck className="mr-3 text-green-500" /> Two-Factor
          Authentication (2FA)
        </h3>
        <div
          className={`p-6 rounded-lg border ${darkMode ? "bg-gray-900 border-green-700 text-green-200" : "bg-green-50 border-green-200 text-green-700"}`}
        >
          <p className="font-medium mb-3">
            Enhance security by requiring a code from your mobile device to log
            in.
          </p>
          <p className="mb-3">
            <strong>Status:</strong>{" "}
            <span className="font-bold text-orange-500">Not Enabled</span>
          </p>
          <button
            type="button"
            onClick={() =>
              showMessage("2FA setup is not yet implemented.", "info")
            }
            className="bg-green-600 text-white py-2 px-4 rounded-full font-semibold"
          >
            Enable 2FA
          </button>
        </div>
      </div>

      <div
        className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3
          className={`text-lg md:text-xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          <LogOut className="mr-3 text-red-500" /> Active Sessions
        </h3>
        <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
          {/* This section now renders correctly without its own loader */}
          {activeSessions.length > 0 ? (
            activeSessions.map((session) => (
              <div
                key={session.session_id}
                className={`p-4 rounded-xl border flex justify-between items-center ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
              >
                <div>
                  <p className="font-semibold">
                    {session.device || "Unknown Device"}{" "}
                    {session.session_id === currentSessionIdFromToken && (
                      <span className="text-green-500 text-xs">(Current)</span>
                    )}
                  </p>
                  <p className="text-sm">
                    {session.location || "N/A Location"} &bull;{" "}
                    {session.ip_address}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last Activity: {formatDateTime(session.login_time)}
                  </p>
                </div>
                {session.session_id !== currentSessionIdFromToken && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(session.session_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-full font-semibold"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              No other active sessions.
            </p>
          )}
        </div>
        {activeSessions.length > 1 && (
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={handleSignOutAllOtherDevices}
              className="bg-red-600 text-white py-2 px-4 rounded-full font-semibold"
            >
              <LogOut size={18} className="mr-2 inline" />
              Sign Out All Other Devices
            </button>
          </div>
        )}
      </div>

      <div
        className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3
          className={`text-lg md:text-xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          <Clock className="mr-3 text-yellow-500" /> Login History
        </h3>
        <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
          {/* This section also renders correctly now */}
          {loginHistory.length > 0 ? (
            loginHistory.map((log) => (
              <div
                key={log.history_id}
                className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
              >
                <div>
                  <p className="font-semibold">{log.device || "Unknown"}</p>
                  <p className="text-sm">
                    {log.location || "N/A"} &bull; {log.ip_address}
                  </p>
                  <p className="text-xs text-gray-500">
                    Time: {formatDateTime(log.login_time)}
                  </p>
                </div>
                <span
                  className={`font-semibold ${log.status === "Success" ? "text-green-500" : "text-red-500"}`}
                >
                  {log.status}
                </span>
              </div>
            ))
          ) : (
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              No login history available.
            </p>
          )}
        </div>
      </div>

      <div className={`pb-6 mb-6`}>
        <h3
          className={`text-lg md:text-xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          <AlertTriangle className="mr-3 text-red-500" /> Account Deactivation
        </h3>
        <div
          className={`p-6 rounded-lg border ${darkMode ? "bg-gray-900 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          <p className="mb-3 font-medium">
            Deactivating your account will temporarily disable your profile. For
            full deletion, contact an administrator.
          </p>
          <button
            type="button"
            onClick={handleDeactivateAccount}
            disabled={deactivating}
            className="bg-red-600 text-white py-2 px-4 rounded-full font-semibold flex items-center"
          >
            {deactivating ? (
              <Loader size={18} className="mr-2 animate-spin" />
            ) : (
              <Trash2 size={18} className="mr-2" />
            )}
            {deactivating ? "Deactivating..." : "Deactivate Account"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default Security;

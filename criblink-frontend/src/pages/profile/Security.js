import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader, Save, Info, LogOut, ShieldCheck, Mail, AlertTriangle, Trash2, KeyRound, Clock } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import axiosInstance from '../../api/axiosInstance';
import API_BASE_URL from '../../config';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';

function Security({ form, handleChange, handleUpdate, updating, currentSessionIdFromToken }) {
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const [deactivating, setDeactivating] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Fetch Active Sessions
  const fetchActiveSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/users/sessions/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort sessions to put the current one first, then by last activity
      const sortedSessions = response.data.sort((a, b) => {
        // Prioritize the session matching currentSessionIdFromToken if available
        if (currentSessionIdFromToken) {
          if (a.session_id === currentSessionIdFromToken && b.session_id !== currentSessionIdFromToken) return -1;
          if (a.session_id !== currentSessionIdFromToken && b.session_id === currentSessionIdFromToken) return 1;
        }
        // Fallback to backend's is_current and then last_activity
        if (a.is_current && !b.is_current) return -1;
        if (!a.is_current && b.is_current) return 1;
        return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
      });
      setActiveSessions(sortedSessions);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      showMessage(error?.response?.data?.message || 'Failed to load active sessions.', 'error');
    } finally {
      setSessionsLoading(false);
    }
  }, [token, showMessage, currentSessionIdFromToken]);

  // Fetch Login History
  const fetchLoginHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/users/login-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoginHistory(response.data);
    } catch (error) {
      console.error('Error fetching login history:', error);
      showMessage(error?.response?.data?.message || 'Failed to load login history.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [token, showMessage]);

  useEffect(() => {
    if (token) {
      fetchActiveSessions();
      fetchLoginHistory();
    }
  }, [token, fetchActiveSessions, fetchLoginHistory]);

  // Styles for form elements
  const inputFieldStyles =
    `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
      darkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;
  const inputGroupStyles = "flex flex-col";

  // Function to handle revoking a session
  const handleRevokeSession = (sessionId) => {
    showConfirm({
      title: "Revoke Session",
      message: "Are you sure you want to revoke this session? The user on that device will be logged out.",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`${API_BASE_URL}/users/sessions/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Session revoked successfully.', 'success');
          fetchActiveSessions(); // Refresh active sessions after revocation
        } catch (error) {
          console.error(`Error revoking session ${sessionId}:`, error);
          showMessage(error?.response?.data?.message || 'Failed to revoke session.', 'error');
        }
      },
      confirmLabel: "Revoke",
      cancelLabel: "Cancel"
    });
  };

  // Function to handle account deactivation
  const handleDeactivateAccount = () => {
    showConfirm({
      title: "Confirm Account Deactivation",
      message: "Are you sure you want to deactivate your account? You can reactivate it later.", // Updated message here
      onConfirm: async () => {
        setDeactivating(true);
        try {
          await axiosInstance.put(`${API_BASE_URL}/users/update`, { status: 'deactivated' }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showMessage('Your account has been successfully deactivated. You will be logged out.', 'success');
          localStorage.removeItem("token");
          window.location.href = '/signin';
        } catch (error) {
          console.error('Error deactivating account:', error);
          showMessage(error?.response?.data?.message || 'Failed to deactivate account.', 'error');
        } finally {
          setDeactivating(false);
        }
      },
      confirmLabel: deactivating ? "Deactivating..." : "Deactivate",
      cancelLabel: "Cancel",
      isConfirmDisabled: deactivating,
    });
  };

  // Helper to format date and time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="space-y-8 p-4 bg-transparent dark:bg-transparent rounded-none shadow-none max-w-full mx-auto my-0
                 md:p-0 md:bg-transparent md:dark:bg-transparent md:rounded-none md:shadow-none md:max-w-none md:mx-0 md:my-0"
    >
      {/* Change Password Section */}
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <KeyRound className="mr-3 text-blue-500" size={24} /> Change Password
        </h3>
        <div className="space-y-4">
            <div className={inputGroupStyles}>
                <label className={labelStyles} htmlFor="current_password">Current Password</label>
                <input
                    type="password"
                    id="current_password"
                    name="current_password"
                    value={form.current_password || ''}
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
                    value={form.new_password || ''}
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
                    value={form.confirm_password || ''}
                    onChange={handleChange}
                    className={inputFieldStyles}
                    autoComplete="new-password"
                />
            </div>
        </div>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
         <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
            <ShieldCheck className="mr-3 text-green-500" size={24} /> Two-Factor Authentication (2FA)
         </h3>
         <div className={`p-6 rounded-lg border text-sm ${darkMode ? "bg-gray-900 border-green-700 text-green-200" : "bg-green-50 border-green-200 text-green-700"}`}>
             <p className="mb-3 font-medium">Enhance your account security by enabling Two-Factor Authentication. This adds an extra layer of protection by requiring a code from your mobile device.</p>
             <p className="mb-3">
                 <strong className="font-semibold">Current Status:</strong> <span className="font-bold text-orange-500">Not Enabled</span>
             </p>
             <button
                 onClick={() => showMessage('2FA setup process would start here. This will involve QR code scanning or manual key entry.', 'info')}
                 className="bg-green-600 text-white py-2 px-4 rounded-full hover:bg-green-700 text-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow transition duration-200 ease-in-out transform hover:scale-105"
             >
                 Enable 2FA
             </button>
             <p className="mt-4 text-xs italic opacity-80">
                 Note: You will need a compatible authenticator app (e.g., Google Authenticator, Authy) on your smartphone.
             </p>
         </div>
      </div>

      {/* Active Sessions Section */}
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <LogOut className="mr-3 text-red-500" size={24} /> Active Sessions
        </h3>
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Manage devices currently logged into your account. Revoke any unfamiliar sessions immediately.
        </p>
        <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
          {sessionsLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader className="animate-spin w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          ) : activeSessions.length > 0 ? (
            activeSessions.map((session) => (
              <div
                key={session.session_id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
              >
                <div className="flex-grow mb-2 md:mb-0">
                  <p className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                    {session.device} {(session.is_current || session.session_id === currentSessionIdFromToken) && <span className="text-green-500 text-xs">(Current Session)</span>}
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {session.location} &bull; {session.ip_address}
                  </p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Last Activity: {formatDateTime(session.last_activity)}
                  </p>
                </div>
                {!(session.is_current || session.session_id === currentSessionIdFromToken) && (
                  <button
                    onClick={() => handleRevokeSession(session.session_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-full font-semibold shadow hover:bg-red-700 transition duration-200 ease-in-out transform hover:scale-105"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>No other active sessions.</p>
          )}
        </div>
      </div>

      {/* Login History Section */}
      <div className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <Clock className="mr-3 text-yellow-500" size={24} /> Login History
        </h3>
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Review your recent login activity for suspicious events.
        </p>
        <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
          {historyLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader className="animate-spin w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          ) : loginHistory.length > 0 ? (
            loginHistory.map((log) => (
              <div
                key={log.history_id}
                className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
              >
                <div className="flex-grow mb-1 md:mb-0">
                  <p className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{log.device}</p>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {log.location} &bull; {log.ip_address}
                  </p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Time: {formatDateTime(log.login_time)}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${log.status === 'Success' ? 'text-green-500' : 'text-red-500'}`}>
                  {log.status}
                </span>
              </div>
            ))
          ) : (
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>No login history available.</p>
          )}
        </div>
      </div>

      {/* Account Deactivation */}
      <div className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <AlertTriangle className="mr-3 text-red-500" size={24} /> Account Deactivation
        </h3>
        <div className={`p-6 rounded-lg border text-sm ${darkMode ? "bg-gray-900 border-red-700 text-red-200" : "bg-red-50 border-red-200 text-red-700"}`}>
          <p className="mb-3 font-medium">
            Deactivating your account will temporarily disable your profile and prevent logins. You can reactivate it later by contacting an administrator. For full account deletion, a separate process with administrator contact may be required as per our privacy policy.
          </p>
          <button
            onClick={handleDeactivateAccount}
            disabled={deactivating}
            className="bg-red-600 text-white py-2 px-4 rounded-full hover:bg-red-700 text-md font-semibold shadow transition duration-200 ease-in-out transform hover:scale-105 flex items-center"
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

      {/* Save Changes Button */}
      <div className="flex justify-center pt-8">
        <button
          onClick={() => handleUpdate({})}
          disabled={updating}
          className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105 flex items-center"
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
  );
}

export default Security;

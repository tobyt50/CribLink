// src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance'; // Use your configured axios instance
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react'; // For password visibility toggle
import API_BASE_URL from '../config'; // Assuming you have a config file for your API base URL
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook
import { useMessage } from '../context/MessageContext'; // Import useMessage hook

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme(); // Use the dark mode context
  const { showMessage } = useMessage(); // Initialize useMessage

  const location = useLocation(); // Hook to access URL query parameters
  const navigate = useNavigate();

  // Extract token from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    // Optional: You might want to validate the token's existence immediately
    if (!token) {
      showMessage('Invalid or missing password reset token.', 'error'); // Use showMessage
    }
  }, [token, showMessage]); // Add showMessage to dependency array

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!token) {
      showMessage('Password reset token is missing.', 'error'); // Use showMessage
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match.', 'error'); // Use showMessage
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) { // Example: enforce minimum password length
      showMessage('New password must be at least 6 characters long.', 'error'); // Use showMessage
      setLoading(false);
      return;
    }

    try {
      // Use axiosInstance instead of direct axios
      const response = await axiosInstance.post(`${API_BASE_URL}/users/reset-password`, {
        token,
        newPassword,
      });
      showMessage(response.data.message, 'success'); // Use showMessage
      // Optionally redirect to sign-in page after a short delay
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (error) {
      console.error("Reset password error caught locally:", error);
      let errorMessage = 'Failed to reset password. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false); // Ensure loading is false after attempt
    }
  };

  return (
    <div className={`flex items-start justify-center min-h-screen px-4 pt-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <h1 className={`text-3xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Reset Password</h1>
        <p className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Enter your new password.</p>

        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
            } pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className={`absolute top-1/2 right-4 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
            } pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className={`absolute top-1/2 right-4 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </motion.form>
    </div>
  );
}

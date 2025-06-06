// src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react'; // For password visibility toggle
import API_BASE_URL from '../config'; // Assuming you have a config file for your API base URL
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme(); // Use the dark mode context

  const location = useLocation(); // Hook to access URL query parameters
  const navigate = useNavigate();

  // Extract token from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    // Optional: You might want to validate the token's existence immediately
    if (!token) {
      setMessage('Invalid or missing password reset token.');
      setMessageType('error');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    setMessageType('');
    setLoading(true);

    if (!token) {
      setMessage('Password reset token is missing.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) { // Example: enforce minimum password length
      setMessage('New password must be at least 6 characters long.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/users/reset-password`, {
        token,
        newPassword,
      });
      setMessage(response.data.message);
      setMessageType('success');
      // Optionally redirect to sign-in page after a short delay
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to reset password. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-start justify-center min-h-screen px-4 pt-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
    <div className="flex items-start justify-center min-h-screen bg-gray-50 px-4 pt-16">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <h1 className={`text-3xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Reset Password</h1>
        <p className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Enter your new password.</p>

        {message && (
          <div className={`p-3 rounded-xl text-center ${messageType === 'success' ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700')}`}>
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-green-700">Reset Password</h1>
        <p className="text-sm text-center text-gray-500">Enter your new password.</p>

        {message && (
          <div className={`p-3 rounded-xl text-center ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
            } pr-12`}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className={`absolute top-1/2 right-4 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500"
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
            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
            } pr-12`}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className={`absolute top-1/2 right-4 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500"
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

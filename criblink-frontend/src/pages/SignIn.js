// src/pages/SignIn.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect } from 'react';
<<<<<<< HEAD
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook
=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordMessageType, setForgotPasswordMessageType] = useState(''); // 'success' or 'error'

  const navigate = useNavigate();
<<<<<<< HEAD
  const { darkMode } = useTheme(); // Use the dark mode context
=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'agent':
          navigate('/agent/dashboard');
          break;
        default:
          navigate('/home');
      }
    }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5000/users/signin', form);

      // Check if the user is banned (this check is now redundant if backend handles 403, but kept for robustness)
      if (data.user.status === 'banned') {
<<<<<<< HEAD
        // Use a custom message box instead of alert
        console.error('Your account has been banned.');
=======
        alert('Your account has been banned.');
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
        // Clear any potentially stored token/user data if the backend sent it before status check
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return; // Stop the sign-in process
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Tell the app "auth state changed"
      window.dispatchEvent(new Event("authChange"));
      switch (data.user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'agent':
          navigate('/agent/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      // Check for specific error message from the backend
      if (err.response && err.response.status === 403 && err.response.data && err.response.data.message) {
<<<<<<< HEAD
        // Use a custom message box instead of alert
        console.error(err.response.data.message); // Display the specific message from the server (e.g., "Your account has been banned.")
      } else {
        // Generic error message for other failures
        // Use a custom message box instead of alert
        console.error('Sign-in failed. Please check your email and password.');
=======
        alert(err.response.data.message); // Display the specific message from the server (e.g., "Your account has been banned.")
      } else {
        // Generic error message for other failures
        alert('Sign-in failed. Please check your email and password.');
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
      }
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage(''); // Clear previous messages
    setForgotPasswordMessageType('');

    try {
      const response = await axios.post('http://localhost:5000/users/forgot-password', { email: forgotPasswordEmail });
      setForgotPasswordMessage(response.data.message);
      setForgotPasswordMessageType('success');
    } catch (error) {
      setForgotPasswordMessage(error.response?.data?.message || 'Failed to send reset link. Please try again.');
      setForgotPasswordMessageType('error');
    }
  };

  return (
<<<<<<< HEAD
    <div className={`flex items-start justify-center min-h-screen px-4 pt-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
=======
    <div className="flex items-start justify-center min-h-screen bg-gray-50 px-4 pt-16">
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
<<<<<<< HEAD
        className={`rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <h1 className={`text-3xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Welcome Back</h1>
        <p className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sign in to continue</p>
=======
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-green-700">Welcome Back</h1>
        <p className="text-sm text-center text-gray-500">Sign in to continue</p>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
<<<<<<< HEAD
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
          }`}
=======
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
<<<<<<< HEAD
            className={`w-full px-4 py-2 border rounded-xl pr-12 focus:outline-none focus:ring-2 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
            }`}
=======
            className="w-full px-4 py-2 border border-gray-300 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-green-400"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
<<<<<<< HEAD
            className={`absolute top-1/2 right-4 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
=======
            className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
        >
          Sign In
        </button>

<<<<<<< HEAD
        <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
=======
        <div className="text-center text-sm text-gray-500">
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          <button
            type="button"
            onClick={() => setShowForgotPasswordModal(true)}
            className="text-green-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

<<<<<<< HEAD
        <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
=======
        <div className="text-center text-sm text-gray-500">
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          Don’t have an account?{' '}
          <a href="/signup" className="text-green-600 hover:underline">
            Sign Up
          </a>
        </div>
      </motion.form>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
<<<<<<< HEAD
            className={`rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <h2 className={`text-2xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Forgot Password</h2>
            <p className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Enter your email to receive a password reset link.</p>
=======
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6"
          >
            <h2 className="text-2xl font-bold text-center text-green-700">Forgot Password</h2>
            <p className="text-sm text-center text-gray-500">Enter your email to receive a password reset link.</p>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Your Email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
<<<<<<< HEAD
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
                }`}
              />
              {forgotPasswordMessage && (
                <p className={`text-sm text-center ${forgotPasswordMessageType === 'success' ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
=======
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {forgotPasswordMessage && (
                <p className={`text-sm text-center ${forgotPasswordMessageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
                  {forgotPasswordMessage}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordMessage('');
                  setForgotPasswordEmail('');
                }}
<<<<<<< HEAD
                className={`w-full py-2 rounded-xl font-medium hover:bg-gray-300 transition ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-700"}`}
=======
                className="w-full py-2 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
              >
                Cancel
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

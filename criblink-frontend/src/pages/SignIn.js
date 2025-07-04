// src/pages/SignIn.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { isAuthenticated, user, loading } = useAuth(); // Get isAuthenticated, user, and loading from AuthContext

  // Function to determine the redirection path
  const getRedirectPath = (userData) => {
    if (userData && userData.default_landing_page) {
      return userData.default_landing_page; // Prioritize user's saved landing page
    }

    if (userData && userData.role) {
      switch (userData.role) {
        case 'admin':
          return '/admin/dashboard';
        case 'agent':
          return '/agent/dashboard';
        case 'client':
          return '/client/inquiries'; // Specific client dashboard path
        default:
          return '/profile/general'; // General fallback for authenticated users
      }
    }
    return '/'; // Fallback for unhandled roles or no user data
  };

  // This useEffect now handles ALL redirections for authenticated users,
  // both on initial load and after a successful sign-in.
  useEffect(() => {
    // Only attempt redirection if authentication status has been determined
    if (!loading && isAuthenticated) {
      // Use the 'user' object from AuthContext for redirection path
      navigate(getRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, loading, user, navigate]); // Depend on isAuthenticated, loading, and user

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axiosInstance.post('/users/signin', form);

      if (data.user.status === 'banned') {
        showMessage('Your account has been banned.', 'error', 7000);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // No need to dispatch authChange here, as it's a ban, not a successful auth.
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // Store the full user object including default_landing_page

      // Dispatch a custom event to notify AuthContext to re-evaluate its state.
      // This is crucial. AuthContext will now update 'user', 'isAuthenticated', and 'loading'.
      window.dispatchEvent(new Event("authChange"));

      showMessage('Sign-in successful!', 'success', 3000);

      // IMPORTANT: Remove the direct navigate call here.
      // The useEffect above, which watches 'isAuthenticated', 'loading', and 'user',
      // will handle the navigation once AuthContext has fully updated.
      // navigate(getRedirectPath(data.user)); // REMOVE THIS LINE

    } catch (error) {
      console.error("Sign-in error caught locally:", error);
      let errorMessage = 'An unexpected error occurred during sign-in.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/users/forgot-password', { email: forgotPasswordEmail });
      showMessage(response.data.message, 'success', 5000);
      setForgotPasswordEmail('');
      setShowForgotPasswordModal(false);
    } catch (error) {
      console.error("Forgot password error caught locally:", error);
      let errorMessage = 'Failed to send reset link. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  };

  const handleOpenForgotPasswordModal = () => {
    setShowForgotPasswordModal(true);
  };

  // Render a loading state or nothing if authentication is still being processed
  // or if the user is already authenticated (and the useEffect will redirect them).
  if (loading || isAuthenticated) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {loading ? "Checking session..." : "Redirecting..."}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex items-start justify-center min-h-screen px-4 pt-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <h1 className={`text-3xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Welcome Back</h1>
        <p className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sign in to continue</p>

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
          }`}
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className={`w-full px-4 py-2 border rounded-xl pr-12 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={`absolute top-1/2 right-4 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
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

        <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          <button
            type="button"
            onClick={handleOpenForgotPasswordModal}
            className="text-green-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Don’t have an account?{' '}
          <a href="/signup" className="text-green-600 hover:underline">
            Sign Up
          </a>
        </div>
      </motion.form>

      {/* Forgot Password Modal (still rendered conditionally) */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <h2 className={`text-2xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Forgot Password</h2>
            <p className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Enter your email to receive a password reset link.</p>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Your Email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                }`}
              />
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
                  setForgotPasswordEmail('');
                }}
                className={`w-full py-2 rounded-xl font-medium hover:bg-gray-300 transition ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-700"}`}
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

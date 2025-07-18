// src/pages/SignIn.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'; // Added ArrowLeft icon
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth - assuming AuthContext is now in Auth folder

export default function SignIn() {
  // Changed 'email' to 'identifier' to accommodate both email and username
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(''); // This remains email-specific
  const [loginStep, setLoginStep] = useState(1); // 1 for identifier/social, 2 for password

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
        case 'agency_admin': // Redirect agency_admin to their dashboard
          return '/agency/dashboard'; // Assuming an agency dashboard route
        case 'client': // Changed 'user' to 'client'
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

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (loginStep === 1) {
      if (!form.identifier) {
        showMessage('Please enter your email or username.', 'error');
        return;
      }
      // For now, we'll just proceed to the password step.
      // In a real application, you might want to make an API call here
      // to check if the identifier exists and is valid before asking for password.
      setLoginStep(2);
    } else {
      // This block will be the actual sign-in logic when loginStep is 2
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission if called from handleNextStep
    try {
      // Send 'identifier' instead of 'email' to the backend
      const { data } = await axiosInstance.post('/users/signin', form);

      if (data.user.status === 'banned') {
        showMessage('Your account has been banned.', 'error', 7000);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // Store the full user object including default_landing_page

      // Dispatch a custom event to notify AuthContext to re-evaluate its state.
      // This is crucial. AuthContext will now update 'user', 'isAuthenticated', and 'loading'.
      window.dispatchEvent(new Event("authChange"));

      showMessage('Sign-in successful!', 'success', 3000);

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

  // Placeholder functions for social logins
  const handleGoogleSignIn = () => {
    showMessage('Google Sign-In is not yet implemented.', 'info');
    // Implement Google OAuth logic here
  };

  const handleFacebookSignIn = () => {
    showMessage('Facebook Sign-In is not yet implemented.', 'info');
    // Implement Facebook OAuth logic here
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
    <div className={`flex items-start justify-center min-h-screen pt-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"} sm:px-4`}>
      <motion.form
        onSubmit={handleNextStep} // Submit button now calls handleNextStep
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-md space-y-6
          bg-transparent sm:rounded-2xl sm:shadow-2xl sm:p-8
          ${darkMode ? "sm:bg-gray-800" : "sm:bg-white"}
          px-4 pt-4`}
      >
        <h1 className={`text-3xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Welcome Back</h1>
        <p className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sign in to continue</p>

        {loginStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Social Login Buttons */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className={`w-full py-2 border rounded-xl font-medium transition flex items-center justify-center space-x-2
                ${darkMode
                  ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
            >
              {/* Google SVG Icon - More accurate path */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.5-.19-2.22H12v4.26h6.01a5.05 5.05 0 0 1-2.18 3.32v2.79h3.6c2.11-1.94 3.33-4.8 3.33-8.15z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.93l-3.6-2.79c-1.01.69-2.31 1.09-4.33 1.09-3.35 0-6.18-2.27-7.2-5.33H1.2v2.86C3.25 20.53 7.31 23 12 23z"/>
                <path fill="#FBBC04" d="M4.8 14.1c-.2-.69-.31-1.44-.31-2.19s.11-1.5.31-2.19V6.95H1.2C.44 8.35 0 10.12 0 12c0 1.88.44 3.65 1.2 5.05L4.8 14.1z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.59 1.79l3.2-3.2C17.95 1.08 15.24 0 12 0 7.31 0 3.25 2.47 1.2 6.95l3.6 2.8C5.82 7.02 8.65 4.75 12 4.75z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleFacebookSignIn}
              className={`w-full py-2 border rounded-xl font-medium transition flex items-center justify-center space-x-2
                ${darkMode
                  ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
            >
              {/* Facebook SVG Icon - More accurate path */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#1877F2" d="M12 0C5.373 0 0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.42H7.078v-3.413h3.047V9.43c0-3.007 1.792-4.661 4.533-4.661 1.306 0 2.68.235 2.68.235v2.953h-1.519c-1.493 0-1.956.925-1.956 1.879v2.273h3.297l-.527 3.413h-2.77V24C19.612 22.954 24 17.99 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Continue with Facebook</span>
            </button>

            {/* OR Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className={`flex-shrink mx-4 text-gray-500 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>

            <input
              type="text" // Changed type from email to text
              name="identifier" // Changed name from email to identifier
              placeholder="Email or Username" // Updated placeholder
              value={form.identifier} // Bind value to state
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
                ${darkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
                  : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                }`}
            />

            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
            >
              Continue
            </button>

            <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Don’t have an account?{' '}
              <a href="/signup" className="text-green-600 hover:underline">
                Sign Up
              </a>
            </div>
          </motion.div>
        )}

        {loginStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={() => setLoginStep(1)}
              className={`flex items-center text-sm font-medium ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition`}
            >
              <ArrowLeft size={16} className="mr-1" /> Back
            </button>

            <input
              type="text" // Keep as text as it could be username
              name="identifier"
              placeholder="Email or Username"
              value={form.identifier}
              readOnly // Make identifier read-only on the password step
              className={`w-full px-4 py-2 border rounded-xl cursor-not-allowed
                ${darkMode
                  ? "bg-gray-700 border-gray-600 text-gray-300"
                  : "bg-gray-200 border-gray-300 text-gray-700"
                }`}
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-xl pr-12 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
                  ${darkMode
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
                    : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
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
          </motion.div>
        )}
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

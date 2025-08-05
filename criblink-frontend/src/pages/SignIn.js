// src/pages/SignIn.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { useAuth } from '../context/AuthContext';

// Skeleton for the SignIn page
const SignInSkeleton = ({ darkMode }) => (
  <div className={`flex items-start justify-center min-h-screen pt-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"} sm:px-4`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full max-w-md space-y-6
        bg-transparent sm:rounded-2xl sm:shadow-2xl sm:p-8
        ${darkMode ? "sm:bg-gray-800" : "sm:bg-white"}
        px-4 pt-4 animate-pulse`}
    >
      <div className={`h-8 w-3/4 mx-auto rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-2`}></div>
      <div className={`h-4 w-1/2 mx-auto rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-6`}></div>

      {/* Input fields and buttons skeletons */}
      <div className="space-y-4">
        <div className={`h-10 w-full rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-10 w-full rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-10 w-full rounded-xl ${darkMode ? "bg-green-700" : "bg-green-200"}`}></div>
        <div className="relative flex items-center py-1">
          <div className={`flex-grow border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`}></div>
          <div className={`flex-shrink mx-4 h-4 w-1/6 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
          <div className={`flex-grow border-t ${darkMode ? "border-gray-700" : "border-gray-300"}`}></div>
        </div>
        <div className={`h-10 w-full rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-10 w-full rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        <div className={`h-4 w-1/3 mx-auto rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      </div>
    </motion.div>
  </div>
);

export default function SignIn() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [loginStep, setLoginStep] = useState(0); // 0 for initial choice, 1 for social, 2 for identifier/password
  const [loadingLogin, setLoadingLogin] = useState(false);

  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { isAuthenticated, user, loading } = useAuth();

  const getRedirectPath = (userData) => {
    if (userData && userData.default_landing_page) {
      return userData.default_landing_page;
    }

    if (userData && userData.role) {
      switch (userData.role) {
        case 'admin':
          return '/admin/dashboard';
        case 'agent':
          return '/agent/dashboard';
        case 'agency_admin':
          return '/agency/dashboard';
        case 'client':
          return '/client/inquiries';
        default:
          return '/profile/general';
      }
    }
    return '/';
  };

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, loading, user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleShowEmailPassword = () => {
    setLoginStep(2); // Directly go to the email/password form
  };

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10';
    else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (userAgent.includes('Windows NT 6.2')) os = 'Windows 8';
    else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone')) os = 'iOS (iPhone)';
    else if (userAgent.includes('iPad')) os = 'iOS (iPad)';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('CrOS')) os = 'Chrome OS';

    if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer';

    let deviceType = '';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      deviceType = 'Tablet';
    } else if (/(kindle|webos|hpwos|fennec|blackberry|mobile|iphone|ipod|iemobile|windows phone|android|iemobile|opera mini|opera mobi|palmos|webos|series60|symbianos)/i.test(userAgent)) {
      deviceType = 'Mobile';
    } else {
      deviceType = 'Desktop';
    }

    return `${browser} on ${os} (${deviceType})`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingLogin(true);

    let deviceInfo = getDeviceInfo();
    let locationInfo = 'Unknown Location';

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: false });
      });
      locationInfo = `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`;
    } catch (err) {
      console.warn('Could not get location info:', err);
      if (err.code === err.PERMISSION_DENIED) {
        locationInfo = 'Location permission denied by user';
      } else if (err.code === err.TIMEOUT) {
        locationInfo = 'Location request timed out';
      } else {
        locationInfo = `Location error: ${err.message}`;
      }
    }

    try {
      const { data } = await axiosInstance.post('/users/signin', {
        identifier: form.identifier,
        password: form.password,
        device_info: deviceInfo,
        location_info: locationInfo,
      });

      if (data.user.status === 'banned') {
        showMessage('Your account has been banned.', 'error', 7000);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

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
    } finally {
      setLoadingLogin(false);
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

  const handleGoogleSignIn = () => {
    showMessage('Google Sign-In is not yet implemented.', 'info');
  };

  const handleFacebookSignIn = () => {
    showMessage('Facebook Sign-In is not yet implemented.', 'info');
  };

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
      <motion.div
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

        {loginStep === 0 && ( // Initial choice screen
          <motion.div
            key="choice"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="space-y-4" // Changed space-y-6 to space-y-4
          >
            <div class="flex justify-center">
  <button
    type="button"
    onClick={handleShowEmailPassword}
    className="px-6 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
  >
    Email and Password
  </button>
</div>

            {/* OR Divider */}
            <div className="relative flex items-center py-1"> {/* Changed py-2 to py-1 */}
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className={`flex-shrink mx-4 text-gray-500 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>

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
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#1877F2" d="M12 0C5.373 0 0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.42H7.078v-3.413h3.047V9.43c0-3.007 1.792-4.661 4.533-4.661 1.306 0 2.68.235 2.68.235v2.953h-1.519c-1.493 0-1.956.925-1.956 1.879v2.273h3.297l-.527 3.413h-2.77V24C19.612 22.954 24 17.99 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Continue with Facebook</span>
            </button>

            <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} pt-1`}> {/* Added pt-1 */}
              Don’t have an account?{' '}
              <a href="/signup" className="text-green-600 hover:underline">
                Sign Up
              </a>
            </div>
          </motion.div>
        )}

        {loginStep === 2 && ( // Email and Password Sign-in Form
          <motion.form
            key="email-password-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-4" // Changed space-y-6 to space-y-4
          >
            <button
              type="button"
              onClick={() => setLoginStep(0)} // Go back to the initial choice
              className={`flex items-center text-sm font-medium ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition`}
            >
              <ArrowLeft size={16} className="mr-1" /> Back to choices
            </button>

            <input
              type="text"
              name="identifier"
              placeholder="Email or Username"
              value={form.identifier}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
                ${darkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
                  : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                }`}
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={form.password} // Bind password value to state
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
              disabled={loadingLogin}
              className="w-full py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
            >
              {loadingLogin ? 'Signing In...' : 'Sign In'}
            </button>

            <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} pt-1`}> {/* Added pt-1 */}
              <button
                type="button"
                onClick={handleOpenForgotPasswordModal}
                className="text-green-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} pt-1`}> {/* Added pt-1 */}
              Don’t have an account?{' '}
              <a href="/signup" className="text-green-600 hover:underline">
                Sign Up
              </a>
            </div>
          </motion.form>
        )}
      </motion.div>

      {/* Forgot Password Modal (remains unchanged) */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-2 ${darkMode ? "bg-gray-800" : "bg-white"}`} /* Changed space-y-6 to space-y-4 */
          >
            <h2 className={`text-2xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Forgot Password</h2>
            <p className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Enter your email to receive a password reset link.</p>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4"> {/* Changed space-y-4 (children) to space-y-2 */}
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

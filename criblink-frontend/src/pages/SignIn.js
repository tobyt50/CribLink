// src/pages/SignIn.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  // --- STATE MANAGEMENT ---
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [loginStep, setLoginStep] = useState(0); // 0 for initial choice, 2 for identifier/password
  const [loadingLogin, setLoadingLogin] = useState(false);

  // --- HOOKS ---
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { isAuthenticated, user, loading } = useAuth();

  // --- REDIRECTION LOGIC ---
  const getRedirectPath = (userData) => {
    if (userData?.default_landing_page) return userData.default_landing_page;
    if (userData?.role) {
      switch (userData.role) {
        case 'admin': return '/admin/dashboard';
        case 'agent': return '/agent/dashboard';
        case 'agency_admin': return '/agency/dashboard';
        case 'client': return '/client/inquiries';
        default: return '/profile/general';
      }
    }
    return '/';
  };

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(getRedirectPath(user), { replace: true });
    }
  }, [isAuthenticated, loading, user, navigate]);

  // --- HANDLERS ---
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getDeviceInfo = () => {
    // This function remains unchanged, it correctly gathers device info.
    const userAgent = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone')) os = 'iOS (iPhone)';
    else if (userAgent.includes('Linux')) os = 'Linux';

    if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    
    let deviceType = 'Desktop';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      deviceType = 'Tablet';
    } else if (/(mobile|iphone|ipod|iemobile|windows phone)/i.test(userAgent)) {
      deviceType = 'Mobile';
    }
    
    return `${browser} on ${os} (${deviceType})`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingLogin(true);

    const deviceInfo = getDeviceInfo();
    let locationInfo = 'Location info not available'; // Default message

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          timeout: 10000, 
          enableHighAccuracy: true,
          maximumAge: 0
        });
      });
    
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
    
      if (process.env.NODE_ENV === "development") {
        console.log("📍 Raw coords:", { lat, lon });
      }
    
      // 🔄 Call your backend instead of OpenCage directly
      const res = await fetch(`/api/utils/reverse-geocode?lat=${lat}&lon=${lon}`);
      const data = await res.json();
    
      if (res.ok && data) {
        const { components, confidence, geometry } = data;
        const { city, town, village, state, country } = components || {};
        const lat = geometry?.lat || position.coords.latitude;
        const lon = geometry?.lng || position.coords.longitude;
      
        if (process.env.NODE_ENV === "development") {
          console.log("🛰️ Backend reverseGeocode result:", data);
          console.log("🔎 Confidence score:", confidence);
        }
      
        // --- Abuja fallback zone ---
        const abujaLat = 9.08;
        const abujaLon = 7.49;
        const haversine = (lat1, lon1, lat2, lon2) => {
          const toRad = (deg) => (deg * Math.PI) / 180;
          const R = 6371; // Earth radius in km
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
              Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c; // km
        };
      
        const distanceFromAbuja = haversine(lat, lon, abujaLat, abujaLon);
      
        if (confidence >= 7 && (city || town || village)) {
          locationInfo = `${city || town || village}, ${state || ""}, ${country}`;
        } else if (distanceFromAbuja <= 50) {
          locationInfo = "Abuja, FCT, Nigeria";
        } else {
          locationInfo = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)} (${state || country})`;
        }
      
        if (process.env.NODE_ENV === "development") {
          console.log("📏 Distance from Abuja:", distanceFromAbuja, "km");
          console.log("✅ Final location string:", locationInfo);
        }
      } else {
        locationInfo = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
        if (process.env.NODE_ENV === "development") {
          console.log("⚠️ No valid geocode result, using raw coords:", locationInfo);
        }
      }
      
    } catch (err) {
      console.warn("❌ Could not get precise location:", err.message);
    }
    

    try {
      const { data } = await axiosInstance.post('/users/signin', { ...form, device_info: deviceInfo, location_info: locationInfo });
      if (data.user.status === 'banned') {
        showMessage('Your account has been banned.', 'error', 7000);
        localStorage.clear();
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChange"));
      showMessage('Sign-in successful!', 'success', 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
      showMessage(errorMessage, 'error');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axiosInstance.post('/users/forgot-password', { email: forgotPasswordEmail });
      showMessage(data.message, 'success', 5000);
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset link.';
      showMessage(errorMessage, 'error');
    }
  };

  // --- UI RENDERING ---

  // Loading or authenticated state
  if (loading || isAuthenticated) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {loading ? "Checking session..." : "Redirecting..."}
        </p>
      </div>
    );
  }

  // --- MAIN COMPONENT RENDER ---
  return (
    <div
  className={`min-h-screen flex items-start justify-center p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
  style={{ minHeight: "100vh", paddingTop: "4rem" }} // push it up ~64px
>
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className={`w-full max-w-md p-6 sm:p-8 space-y-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
  >
        {/* --- HEADER --- */}
        <div className="text-center">
          <h1 className={`text-3xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>Welcome Back</h1>
          <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sign in to continue your journey.</p>
        </div>

        <AnimatePresence mode="wait">
          {/* --- STEP 0: LOGIN CHOICE --- */}
          {loginStep === 0 && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.1 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setLoginStep(2)}
                className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-green-600 text-white hover:bg-green-700 transition"
              >
                <Mail className="w-4 h-4" />
                Continue with Email
              </button>
              
              <div className="relative flex items-center py-2">
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                <span className={`flex-shrink mx-4 text-xs uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Or</span>
                <div className={`flex-grow border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
              </div>

              {/* Social Logins */}
              <button
                onClick={() => showMessage('Google Sign-In is not yet implemented.', 'info')}
                className={`w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border transition ${darkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.5-.19-2.22H12v4.26h6.01a5.05 5.05 0 0 1-2.18 3.32v2.79h3.6c2.11-1.94 3.33-4.8 3.33-8.15z"/><path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.93l-3.6-2.79c-1.01.69-2.31 1.09-4.33 1.09-3.35 0-6.18-2.27-7.2-5.33H1.2v2.86C3.25 20.53 7.31 23 12 23z"/><path fill="#FBBC04" d="M4.8 14.1c-.2-.69-.31-1.44-.31-2.19s.11-1.5.31-2.19V6.95H1.2C.44 8.35 0 10.12 0 12c0 1.88.44 3.65 1.2 5.05L4.8 14.1z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.59 1.79l3.2-3.2C17.95 1.08 15.24 0 12 0 7.31 0 3.25 2.47 1.2 6.95l3.6 2.8C5.82 7.02 8.65 4.75 12 4.75z"/></svg>
                Continue with Google
              </button>

              <div className={`text-center text-sm pt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Don’t have an account?{' '}
                <a href="/signup" className="font-medium text-green-500 hover:underline">Sign Up</a>
              </div>
            </motion.div>
          )}

          {/* --- STEP 2: EMAIL & PASSWORD FORM --- */}
          {loginStep === 2 && (
            <motion.form
              key="email-password-form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setLoginStep(0)}
                className={`flex items-center text-sm font-medium transition ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`}
              >
                <ArrowLeft size={16} className="mr-1" /> Back to choices
              </button>

              <input
                type="text" name="identifier" placeholder="Email or Username"
                value={form.identifier} onChange={handleChange} required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                }`}
                
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} name="password" placeholder="Password"
                  value={form.password} onChange={handleChange} required
                  className={`w-full px-4 py-3 border rounded-lg pr-12 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                  
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className={`absolute top-1/2 right-4 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loadingLogin} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {loadingLogin ? 'Signing In...' : 'Sign In'}
                </button>
              </div>

              <div className={`flex justify-between items-center text-sm pt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                <a href="/signup" className="font-medium text-green-500 hover:underline">Create an account</a>
                <button type="button" onClick={() => setShowForgotPasswordModal(true)} className="font-medium text-green-500 hover:underline">Forgot password?</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md space-y-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="text-center">
                <h2 className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Forgot Password</h2>
                <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Enter your email to get a reset link.</p>
            </div>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-2">
              <input
                type="email" placeholder="Your Email" value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)} required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                }`}
                
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setShowForgotPasswordModal(false)} className={`w-full py-2.5 rounded-lg font-semibold transition ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                  Cancel
                </button>
                <button type="submit" className="w-full py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                  Send Link
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

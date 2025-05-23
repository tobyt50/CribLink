// src/pages/SignIn.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect } from 'react';

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordMessageType, setForgotPasswordMessageType] = useState(''); // 'success' or 'error'

  const navigate = useNavigate();

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
        alert('Your account has been banned.');
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
        alert(err.response.data.message); // Display the specific message from the server (e.g., "Your account has been banned.")
      } else {
        // Generic error message for other failures
        alert('Sign-in failed. Please check your email and password.');
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
    <div className="flex items-start justify-center min-h-screen bg-gray-50 px-4 pt-16">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-green-700">Welcome Back</h1>
        <p className="text-sm text-center text-gray-500">Sign in to continue</p>

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl pr-12 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500"
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

        <div className="text-center text-sm text-gray-500">
          <button
            type="button"
            onClick={() => setShowForgotPasswordModal(true)}
            className="text-green-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <div className="text-center text-sm text-gray-500">
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
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6"
          >
            <h2 className="text-2xl font-bold text-center text-green-700">Forgot Password</h2>
            <p className="text-sm text-center text-gray-500">Enter your email to receive a password reset link.</p>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Your Email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {forgotPasswordMessage && (
                <p className={`text-sm text-center ${forgotPasswordMessageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
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
                className="w-full py-2 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition"
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

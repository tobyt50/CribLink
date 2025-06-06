// src/pages/SignUp.js
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook

// Assuming API_BASE_URL is defined in a config file
import API_BASE_URL from '../config';

export default function SignUp() {
  const location = useLocation();
  // Initialize selectedRole from location state if available, otherwise default to 'user'
  const [selectedRole, setSelectedRole] = useState(location.state?.role || 'user');

  // State for form data, initialized with common fields
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '', // Added for password confirmation
    // Add potential agent-specific fields, initialized as empty
    phone_number: '', // Example agent field
    agency_name: '', // Example agent field
    // Add other agent fields as needed based on your backend schema
  });

  // State for displaying password validation errors
  const [passwordError, setPasswordError] = useState('');
  // State for general form submission errors
  const [generalError, setGeneralError] = useState('');

  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context

  // Effect to check for existing token and redirect authenticated users
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
  }, [navigate]); // Add navigate to dependency array

  // Handle input changes, updating the form state
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear password error when user types
    if (e.target.name === 'password' || e.target.name === 'confirm_password') {
      setPasswordError('');
    }
    // Clear general error when user types
    setGeneralError('');
  };

  // Handle role switch
  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
    // Optionally reset form fields when switching roles if needed
    // setForm({ full_name: '', email: '', password: '', confirm_password: '', phone_number: '', agency_name: '' });
    setPasswordError(''); // Clear errors on role switch
    setGeneralError('');
  };

  // Function to validate password strength
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    // Only require at least one number
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number.';
    }
    return ''; // No error
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(''); // Clear previous password errors
    setGeneralError(''); // Clear previous general errors

    // Client-side password validation
    if (form.password !== form.confirm_password) {
      setPasswordError('Passwords do not match.');
      return; // Stop form submission
    }

    const passwordStrengthError = validatePassword(form.password);
    if (passwordStrengthError) {
      setPasswordError(passwordStrengthError);
      return; // Stop form submission
    }

    // Construct the payload based on the selected role
    const payload = {
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      role: selectedRole, // Include the selected role in the payload
    };

    // Add agent-specific fields to the payload if the role is 'agent'
    if (selectedRole === 'agent') {
      payload.phone_number = form.phone_number;
      payload.agency_name = form.agency_name;
      // Add other agent fields from form state to payload here
    }

    try {
      // Send signup data to the backend endpoint
      await axios.post(`${API_BASE_URL}/users/signup`, payload);

      // On successful signup, automatically sign in the user
      const { data } = await axios.post(`${API_BASE_URL}/users/signin`, {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Tell the app "auth state changed"
      window.dispatchEvent(new Event("authChange"));

      // Redirect based on role or to home
      switch (data.user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'agent':
          navigate('/agent/dashboard');
          break;
        default:
          navigate('/'); // Redirect to home page
      }
    } catch (err) {
      console.error('Registration or Sign-in failed:', err.response?.data || err.message);
      // Display a more informative error if available from the backend
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred during registration or sign-in.';
      setGeneralError(errorMessage); // Set general error state
    }
  };

  return (
    <div className={`flex items-start justify-center min-h-screen px-4 pt-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} // Main form space-y-6
      >
        <h1 className={`text-3xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>
          Create Account
        </h1>

        {/* Role Selection Section */}
        <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Sign up as{' '}
          {/* Buttons to switch roles */}
          <button
            type="button" // Use type="button" to prevent form submission
            className={`text-green-600 hover:underline font-medium ${selectedRole === 'user' ? 'underline' : ''}`}
            onClick={() => handleRoleSwitch('user')}
          >
            Client
          </button>{' '}
          |{' '}
          <button
            type="button" // Use type="button" to prevent form submission
            className={`text-green-600 hover:underline font-medium ${selectedRole === 'agent' ? 'underline' : ''}`}
            onClick={() => handleRoleSwitch('agent')}
          >
            Agent
          </button>
        </div>

        {/* Common Form Fields */}
        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name} // Bind value to state
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
          }`}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email} // Bind value to state
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
          }`}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password} // Bind value to state
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
          }`}
        />
        <input
          type="password"
          name="confirm_password"
          placeholder="Confirm Password"
          value={form.confirm_password} // Bind value to state
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
            darkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
          }`}
        />

        {/* Display password validation error */}
        {passwordError && (
          <p className={`text-sm text-center ${darkMode ? "text-red-400" : "text-red-500"}`}>{passwordError}</p>
        )}

        {/* Agent-Specific Form Fields (Conditionally Rendered) */}
        {selectedRole === 'agent' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="space-y-6 overflow-hidden" // Changed space-y-4 to space-y-6 here for consistent spacing
          >
            <input
              type="text"
              name="phone_number"
              placeholder="Phone Number"
              value={form.phone_number} // Bind value to state
              onChange={handleChange}
              required // Make agent-specific fields required for agents
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
              }`}
            />
            <input
              type="text"
              name="agency_name"
              placeholder="Agency Name (Optional)"
              value={form.agency_name} // Bind value to state
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-700"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-400"
              }`}
            />
            {/* Add more agent-specific fields here */}
          </motion.div>
        )}

        {/* Display general form submission error */}
        {generalError && (
          <p className={`text-sm text-center ${darkMode ? "text-red-400" : "text-red-500"}`}>{generalError}</p>
        )}

        <button
          type="submit"
          className="w-full py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
        >
          Create Account
        </button>

        <div className={`text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Already have an account?{' '}
          <a href="/signin" className="text-green-600 hover:underline">
            Sign In
          </a>
        </div>
      </motion.form>
    </div>
  );
}

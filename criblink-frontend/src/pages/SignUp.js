// src/pages/SignUp.js
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance'; // Use your configured axios instance
import { motion } from 'framer-motion';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
// API_BASE_URL is not needed here if axiosInstance is configured with a base URL
// import API_BASE_URL from '../config'; 

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

  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context
  const { showMessage } = useMessage(); // Use the showMessage function from MessageContext

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
          navigate('/');
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
  };

  // Handle role switch
  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
    // Optionally reset form fields when switching roles if needed
    // setForm({ full_name: '', email: '', password: '', confirm_password: '', phone_number: '', agency_name: '' });
    setPasswordError(''); // Clear errors on role switch
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

    // Client-side password validation
    if (form.password !== form.confirm_password) {
      setPasswordError('Passwords do not match.');
      showMessage('Passwords do not match.', 'error'); // Also show as a toast
      return; // Stop form submission
    }

    const passwordStrengthError = validatePassword(form.password);
    if (passwordStrengthError) {
      setPasswordError(passwordStrengthError);
      showMessage(passwordStrengthError, 'error'); // Also show as a toast
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
      // Send signup data to the backend endpoint using axiosInstance
      await axiosInstance.post('/users/signup', payload);
      showMessage('Account created successfully!', 'success', 3000); // Show success message for signup

      // On successful signup, automatically sign in the user using axiosInstance
      const { data } = await axiosInstance.post('/users/signin', {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Tell the app "auth state changed"
      window.dispatchEvent(new Event("authChange"));
      showMessage('Signed in automatically!', 'success', 3000); // Show success message for auto-signin


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
      console.error('Signup error caught locally:', err); // Log the error for debugging
      // Display a user-friendly error message using showMessage
      let errorMessage = 'An unexpected error occurred during signup.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showMessage(errorMessage, 'error'); 
    }
  };

  return (
    <div className={`flex items-start justify-center min-h-screen px-4 pt-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        // Conditional styling for the form container:
        // On mobile (no sm: prefix), it will be transparent (bg-transparent) and have no shadow/padding.
        // On small screens and up (sm: prefix), it will have the white/gray background, rounded corners, shadow, and padding.
        className={`w-full max-w-md space-y-6
          bg-transparent sm:rounded-2xl sm:shadow-2xl sm:p-8
          ${darkMode ? "sm:bg-gray-800" : "sm:bg-white"}
          px-4 pt-4`}
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
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
              : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
          }`}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email} // Bind value to state
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
              : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
          }`}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password} // Bind value to state
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
              : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
          }`}
        />
        <input
          type="password"
          name="confirm_password"
          placeholder="Confirm Password"
          value={form.confirm_password} // Bind value to state
          onChange={handleChange}
          required
          className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
              : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
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
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
                  : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
              }`}
            />
            <input
              type="text"
              name="agency_name"
              placeholder="Agency Name (Optional)"
              value={form.agency_name} // Bind value to state
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
                  : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
              }`}
            />
            {/* Add more agent-specific fields here */}
          </motion.div>
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

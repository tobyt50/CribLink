// src/pages/SignUp.js
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../api/axiosInstance'; // Use your configured axios instance
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
import API_BASE_URL from '../config'; // Import API_BASE_URL
import { Loader, UserPlus, Hourglass, UserRoundCheck, CheckCircle, UserX, EllipsisVertical, Landmark, Search, X, ArrowLeft } from 'lucide-react'; // Import necessary icons, added ArrowLeft

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
    phone_number: '', // Example agent field
    // agency_id and new_agency_details will NOT be part of the initial signup payload
    // They will be sent in a separate request after basic user signup.
  });

  // State for displaying password validation errors
  const [passwordError, setPasswordError] = useState('');
  const [signupStep, setSignupStep] = useState(1); // 1 for basic info, 2 for password/agency

  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context
  const { showMessage } = useMessage(); // Use the showMessage function from MessageContext

  // Agency specific states
  const [agencies, setAgencies] = useState([]);
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [agencySearchTerm, setAgencySearchTerm] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);
  const [agencyConnectionStatus, setAgencyConnectionStatus] = useState('none'); // 'none', 'pending', 'connected', 'rejected', 'selected', 'new_agency_pending'
  const [showOptionsMenu, setShowOptionsMenu] = useState(false); // Not directly used here, but kept for consistency if needed later
  const optionsMenuRef = useRef(null); // Not directly used here

  // State for new agency registration form
  const [showRegisterAgencyForm, setShowRegisterAgencyForm] = useState(false);
  const [newAgencyForm, setNewAgencyForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    logoBase64: null,
    logoOriginalname: null,
  });
  const [newAgencyLogoPreview, setNewAgencyLogoPreview] = useState('');
  const [registeringAgency, setRegisteringAgency] = useState(false);

  // New state to control visibility of the agency affiliation options
  const [showAgencyAffiliationOptions, setShowAgencyAffiliationOptions] = useState(false);


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
  }, [navigate]);

  // Fetch all agencies for the dropdown and search
  const fetchAgencies = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/agencies`);
      setAgencies(response.data);
      setFilteredAgencies(response.data); // Initialize filtered agencies
    } catch (error) {
      console.error("Error fetching agencies:", error);
      showMessage("Failed to load agencies.", "error");
    }
  }, [showMessage]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

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
    setSignupStep(1); // Reset to first step on role switch
    // Reset agent-specific fields when switching to user role
    if (role === 'user') {
      setForm(prev => ({ ...prev, phone_number: '' }));
      setSelectedAgencyId(null);
      setAgencyConnectionStatus('none');
      setShowRegisterAgencyForm(false); // Hide agency registration form
      setNewAgencyForm({ // Reset new agency form
        name: '', address: '', phone: '', email: '', website: '', description: '', logoBase64: null, logoOriginalname: null,
      });
      setNewAgencyLogoPreview('');
      setShowAgencyAffiliationOptions(false); // Reset this too
    }
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

  const handleAgencySearchChange = (e) => {
    const term = e.target.value;
    setAgencySearchTerm(term);
    if (term) {
      setFilteredAgencies(
        agencies.filter(agency =>
          agency.name.toLowerCase().includes(term.toLowerCase()) ||
          agency.email.toLowerCase().includes(term.toLowerCase())
        )
      );
    } else {
      setFilteredAgencies(agencies);
    }
  };

  const handleAgencySelect = (agencyId) => {
    setSelectedAgencyId(agencyId);
    setAgencyConnectionStatus('selected'); // Indicate an agency has been selected
    setShowRegisterAgencyForm(false); // Hide new agency form if an existing one is selected
  };

  // Handle changes for the new agency registration form
  const handleNewAgencyFormChange = (e) => {
    const { name, value } = e.target;
    setNewAgencyForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle logo upload for new agency
  const handleNewAgencyLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAgencyLogoPreview(reader.result);
        setNewAgencyForm(prev => ({
          ...prev,
          logoBase64: reader.result,
          logoOriginalname: file.name,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setNewAgencyLogoPreview('');
      setNewAgencyForm(prev => ({
        ...prev,
        logoBase64: null,
        logoOriginalname: null,
      }));
    }
  };

  // Clear new agency logo preview
  const handleClearNewAgencyLogo = () => {
    setNewAgencyLogoPreview('');
    setNewAgencyForm(prev => ({
      ...prev,
      logoBase64: null,
      logoOriginalname: null,
    }));
  };

  // Function to toggle the visibility of agency affiliation options
  const toggleAgencyAffiliationOptions = () => {
    setShowAgencyAffiliationOptions(prev => !prev);
    if (showAgencyAffiliationOptions) { // If it's about to be hidden
      setSelectedAgencyId(null);
      setAgencyConnectionStatus('none');
      setShowRegisterAgencyForm(false);
      setNewAgencyForm({
        name: '', address: '', phone: '', email: '', website: '', description: '', logoBase64: null, logoOriginalname: null,
      });
      setNewAgencyLogoPreview('');
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (signupStep === 1) {
      // Validate fields for Step 1 based on role
      if (!form.full_name || !form.email) {
        showMessage('Full Name and Email are required.', 'error');
        return;
      }
      if (selectedRole === 'agent' && !form.phone_number) {
        showMessage('Phone Number is required for agents.', 'error');
        return;
      }
      setSignupStep(2); // Move to the next step
    } else {
      // This is the final step, proceed with actual submission
      handleSubmit(e);
    }
  };

  // Handle form submission (actual API call)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission if called from handleNextStep
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

    // Construct the payload for basic user signup
    const userSignupPayload = {
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      role: selectedRole,
    };

    if (selectedRole === 'agent') {
      userSignupPayload.phone_number = form.phone_number;
      // Do NOT include agency_id or new_agency_details here.
      // They will be handled in subsequent calls.
    }

    try {
      // Step 1: Sign up the user (basic account creation)
      const signupResponse = await axiosInstance.post('/users/signup', userSignupPayload);
      showMessage('Account created successfully!', 'success', 3000);

      const newUser = signupResponse.data.user;
      const newToken = signupResponse.data.token;

      // Store token and user data from the initial signup response
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      window.dispatchEvent(new Event("authChange")); // Notify AuthContext

      // Step 2: Handle agency affiliation if applicable and user is an agent
      if (selectedRole === 'agent' && showAgencyAffiliationOptions) {
        if (selectedAgencyId === 'new_agency_pending') {
          // Register a new agency and become admin
          setRegisteringAgency(true); // Set loading state for this specific action
          try {
            const registerAgencyPayload = {
              ...newAgencyForm,
              // Ensure logoBase64 and logoOriginalname are correctly passed
              logoBase64: newAgencyForm.logoBase64,
              logoOriginalname: newAgencyForm.logoOriginalname,
            };
            const registerResponse = await axiosInstance.post(
              `${API_BASE_URL}/agencies/register-agent-agency`,
              registerAgencyPayload,
              { headers: { Authorization: `Bearer ${newToken}` } } // Use the new token
            );
            showMessage("Agency registered and profile updated successfully!", "success");

            // Update local storage with the new user data (role and agency_id will be updated)
            localStorage.setItem('token', registerResponse.data.token);
            localStorage.setItem('user', JSON.stringify(registerResponse.data.user));
            window.dispatchEvent(new Event("authChange"));

          } catch (agencyError) {
            console.error("Error registering new agency during signup:", agencyError.response?.data || agencyError.message);
            showMessage(`Failed to register agency: ${agencyError.response?.data?.message || 'Please try again.'}`, 'error');
            // Even if agency registration fails, the user account is created.
            // They can try to affiliate later from their profile settings.
          } finally {
            setRegisteringAgency(false);
          }
        } else if (selectedAgencyId) {
          // Send request to join existing agency
          try {
            await axiosInstance.post(
              `${API_BASE_URL}/agencies/request-to-join`,
              { agency_id: selectedAgencyId },
              { headers: { Authorization: `Bearer ${newToken}` } } // Use the new token
            );
            showMessage('Agency join request sent successfully. Awaiting approval.', 'success');
          } catch (joinError) {
            console.error("Error sending agency join request during signup:", joinError.response?.data || joinError.message);
            showMessage(`Failed to send agency join request: ${joinError.response?.data?.message || 'Please try again.'}`, 'error');
          }
        }
      }

      showMessage('Signed in automatically!', 'success', 3000); // Show success message for auto-signin

      // Redirect based on role or to home (use the latest user info from localStorage)
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      switch (updatedUser.role) {
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

  // Placeholder functions for social sign-up
  const handleGoogleSignUp = () => {
    showMessage('Google Sign-Up is not yet implemented.', 'info');
    // Implement Google OAuth logic here
  };

  const handleFacebookSignUp = () => {
    showMessage('Facebook Sign-Up is not yet implemented.', 'info');
    // Implement Facebook OAuth logic here
  };


  const inputFieldStyles =
    `w-full px-4 py-2 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
      darkMode
        ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400"
        : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;

  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;
  const inputGroupStyles = "flex flex-col";

  return (
    <div className={`flex items-start justify-center min-h-screen px-4 sm:pt-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
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

        {/* Multi-part Form Fields */}
        {signupStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Common fields for all roles - Part 1 */}
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleChange}
              required
              className={inputFieldStyles}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className={inputFieldStyles}
            />

            {/* Agent-Specific Field - Part 1 */}
            {selectedRole === 'agent' && (
              <input
                type="text"
                name="phone_number"
                placeholder="Phone Number"
                value={form.phone_number}
                onChange={handleChange}
                required
                className={inputFieldStyles}
              />
            )}

            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
            >
              Continue
            </button>
          </motion.div>
        )}

        {signupStep === 2 && (
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
              onClick={() => setSignupStep(1)}
              className={`flex items-center text-sm font-medium ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"} transition`}
            >
              <ArrowLeft size={16} className="mr-1" /> Back
            </button>

            {/* Common fields for all roles - Part 2 */}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className={inputFieldStyles}
            />
            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              value={form.confirm_password}
              onChange={handleChange}
              required
              className={inputFieldStyles}
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
                className="space-y-6 overflow-hidden"
              >
                {/* Toggle for Agency Affiliation Options */}
                <div className="flex items-center justify-between mt-4">
                  <span className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>Affiliate with an agency?</span>
                  <button
                    type="button"
                    onClick={toggleAgencyAffiliationOptions}
                    className={`px-4 py-2 rounded-full font-semibold transition duration-200 flex items-center
                      ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
                  >
                    {showAgencyAffiliationOptions ? 'Hide Options' : 'Show Options'}
                  </button>
                </div>

                {/* Agency Section (Conditionally Rendered) */}
                {showAgencyAffiliationOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 overflow-hidden"
                  >
                    <div className={`pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                      <h3 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                        <Landmark className="mr-2 text-orange-500" size={20} /> Agency Affiliation
                      </h3>

                      {agencyConnectionStatus === 'new_agency_pending' && (
                        <div className={`p-4 rounded-xl border ${darkMode ? "border-green-700 bg-green-900/20" : "border-green-200 bg-green-50"}`}>
                          <p className={`font-semibold ${darkMode ? "text-green-300" : "text-green-800"} flex items-center`}>
                            <CheckCircle size={20} className="mr-2" /> New Agency Details Captured
                          </p>
                          <p className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            Your new agency details are ready. Complete signup to register it.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowRegisterAgencyForm(true);
                              setAgencyConnectionStatus('none'); // Allow editing again
                              setSelectedAgencyId(null);
                            }}
                            className={`mt-4 px-4 py-2 rounded-full font-semibold transition duration-200 flex items-center
                              ${darkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                          >
                            Edit New Agency
                          </button>
                        </div>
                      )}

                      {selectedAgencyId && selectedAgencyId !== 'new_agency_pending' && (
                        <div className={`p-4 rounded-xl border ${darkMode ? "border-green-700 bg-green-900/20" : "border-green-50"}`}>
                          <p className={`font-semibold ${darkMode ? "text-green-300" : "text-green-800"} flex items-center`}>
                            <UserRoundCheck size={20} className="mr-2" /> Selected Agency: {agencies.find(a => a.agency_id === selectedAgencyId)?.name || 'N/A'}
                          </p>
                          <p className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            You will send a request to join this agency upon account creation.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAgencyId(null);
                              setAgencyConnectionStatus('none');
                            }}
                            className={`mt-4 px-4 py-2 rounded-full font-semibold transition duration-200 flex items-center
                              ${darkMode ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                          >
                            Clear Selection
                          </button>
                        </div>
                      )}

                      {(agencyConnectionStatus === 'none' || (selectedAgencyId === null && agencyConnectionStatus !== 'new_agency_pending')) && (
                        <div className="space-y-6">
                          <AnimatePresence>
                            {showRegisterAgencyForm && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`relative mb-6 p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-green-50"}`}
                              >
                                <h4 className={`text-lg font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Register New Agency</h4>
                                <button
                                  type="button"
                                  onClick={() => setShowRegisterAgencyForm(false)}
                                  className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"}`}
                                  aria-label="Close form"
                                >
                                  <X size={20} />
                                </button>
                                <div className="space-y-4">
                                  <div className={inputGroupStyles}>
                                    <label className={labelStyles} htmlFor="new_agency_name">Agency Name <span className="text-red-500">*</span></label>
                                    <input
                                      type="text"
                                      id="new_agency_name"
                                      name="name"
                                      value={newAgencyForm.name}
                                      onChange={handleNewAgencyFormChange}
                                      className={inputFieldStyles}
                                      placeholder="e.g., Elite Properties Inc."
                                      required
                                    />
                                  </div>
                                  <div className={inputGroupStyles}>
                                    <label className={labelStyles} htmlFor="new_agency_email">Agency Email <span className="text-red-500">*</span></label>
                                    <input
                                      type="email"
                                      id="new_agency_email"
                                      name="email"
                                      value={newAgencyForm.email}
                                      onChange={handleNewAgencyFormChange}
                                      className={inputFieldStyles}
                                      placeholder="contact@eliteproperties.com"
                                      required
                                    />
                                  </div>
                                  <div className={inputGroupStyles}>
                                    <label className={labelStyles} htmlFor="new_agency_phone">Agency Phone <span className="text-red-500">*</span></label>
                                    <input
                                      type="tel"
                                      id="new_agency_phone"
                                      name="phone"
                                      value={newAgencyForm.phone}
                                      onChange={handleNewAgencyFormChange}
                                      className={inputFieldStyles}
                                      placeholder="+1234567890"
                                      required
                                    />
                                  </div>
                                  <div className={inputGroupStyles}>
                                    <label className={labelStyles} htmlFor="new_agency_address">Address</label>
                                    <input
                                      type="text"
                                      id="new_agency_address"
                                      name="address"
                                      value={newAgencyForm.address}
                                      onChange={handleNewAgencyFormChange}
                                      className={inputFieldStyles}
                                      placeholder="123 Main St, City, Country"
                                    />
                                  </div>
                                  <div className={inputGroupStyles}>
                                    <label className={labelStyles} htmlFor="new_agency_website">Website</label>
                                    <input
                                      type="url"
                                      id="new_agency_website"
                                      name="website"
                                      value={newAgencyForm.website}
                                      onChange={handleNewAgencyFormChange}
                                      className={inputFieldStyles}
                                      placeholder="https://www.eliteproperties.com"
                                    />
                                  </div>
                                  <div className={inputGroupStyles}>
                                    <label className={labelStyles} htmlFor="new_agency_description">Description</label>
                                    <textarea
                                      id="new_agency_description"
                                      name="description"
                                      value={newAgencyForm.description}
                                      onChange={handleNewAgencyFormChange}
                                      rows="3"
                                      className={`${inputFieldStyles} min-h-[80px]`}
                                      placeholder="Brief description of your agency..."
                                    ></textarea>
                                  </div>

                                  {/* Agency Logo Upload */}
                                  <div className={inputGroupStyles}>
                                    <label className={labelStyles} htmlFor="new_agency_logo">Agency Logo</label>
                                    <div className="flex flex-col items-center space-y-4 mt-2">
                                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        {newAgencyLogoPreview ? (
                                          <img
                                            src={newAgencyLogoPreview}
                                            alt="Agency Logo"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <Landmark className="w-12 h-12 text-gray-400" />
                                        )}
                                        {newAgencyLogoPreview && (
                                          <button
                                            type="button"
                                            onClick={handleClearNewAgencyLogo}
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                            aria-label="Clear agency logo"
                                          >
                                            <X size={16} />
                                          </button>
                                        )}
                                      </div>
                                      <input
                                        type="file"
                                        id="new_agency_logo"
                                        name="new_agency_logo"
                                        accept="image/*"
                                        onChange={handleNewAgencyLogoChange}
                                        className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${darkMode ? "file:bg-green-600 file:text-white file:hover:bg-green-700 text-gray-300" : "file:bg-green-50 file:text-green-700 hover:file:bg-green-50 text-gray-700"}`}
                                      />
                                      <p className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                        PNG, JPG, or GIF up to 5MB.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-4 mt-6">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // This button now just "captures" the details and sets the status
                                      // Actual API call happens in handleSubmit
                                      if (!newAgencyForm.name || !newAgencyForm.email || !newAgencyForm.phone) {
                                        showMessage("Agency name, email, and phone are required.", "error");
                                        return;
                                      }
                                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAgencyForm.email)) {
                                        showMessage("Please enter a valid email address for the agency.", "error");
                                        return;
                                      }
                                      showMessage("Agency details captured. Proceed with account creation.", "info");
                                      setShowRegisterAgencyForm(false);
                                      setSelectedAgencyId('new_agency_pending');
                                      setAgencyConnectionStatus('new_agency_pending');
                                    }}
                                    disabled={registeringAgency}
                                    className={`px-6 py-2 font-semibold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                                      ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                                  >
                                    {registeringAgency ? (
                                      <Loader size={20} className="animate-spin mr-2" />
                                    ) : (
                                      <Landmark size={20} className="mr-2" />
                                    )}
                                    {registeringAgency ? "Capturing..." : "Confirm Agency Details"}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {!showRegisterAgencyForm && !selectedAgencyId && ( // Only show this button if the form is not open and no agency is selected
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => setShowRegisterAgencyForm(true)}
                                className={`font-semibold transition duration-200 flex items-center justify-center
                                  ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"} hover:underline`}
                              >
                                <Landmark size={20} className="mr-2" /> Register Your Agency
                              </button>
                            </div>
                          )}

                          {!showRegisterAgencyForm && !selectedAgencyId && (
                            <div className="relative">
                              <h4 className={`text-lg font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Or Join an Existing Agency</h4>
                              <div className="relative mb-4">
                                <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                                <input
                                  type="text"
                                  placeholder="Search agencies by name or email..."
                                  value={agencySearchTerm}
                                  onChange={handleAgencySearchChange}
                                  className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-green-400" : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                />
                              </div>

                              {filteredAgencies.length > 0 ? (
                                <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar"> {/* Added max-h-60 and overflow-y-auto */}
                                  {filteredAgencies.map(agency => (
                                    <li
                                      key={agency.agency_id}
                                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors duration-200
                                        ${darkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        {agency.logo_url ? (
                                          <img src={agency.logo_url} alt={agency.name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                          <Landmark size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                                        )}
                                        <div>
                                          <p className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{agency.name}</p>
                                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{agency.email}</p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleAgencySelect(agency.agency_id)}
                                        className={`p-2 rounded-full transition-colors duration-200
                                          ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                                        title="Select Agency"
                                      >
                                        <UserPlus size={20} />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No agencies found matching your search.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
            >
              Create Account
            </button>
          </motion.div>
        )}

        {/* OR Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          <span className={`flex-shrink mx-4 text-gray-500 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>OR</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
        </div>

        {/* Social Sign-up Buttons */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className={`w-full py-2 border rounded-xl font-medium transition flex items-center justify-center space-x-2
            ${darkMode
              ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
            }`}
        >
          {/* Google SVG Icon */}
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
          onClick={handleFacebookSignUp}
          className={`w-full py-2 border rounded-xl font-medium transition flex items-center justify-center space-x-2
            ${darkMode
              ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
            }`}
        >
          {/* Facebook SVG Icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path fill="#1877F2" d="M12 0C5.373 0 0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.42H7.078v-3.413h3.047V9.43c0-3.007 1.792-4.661 4.533-4.661 1.306 0 2.68.235 2.68.235v2.953h-1.519c-1.493 0-1.956.925-1.956 1.879v2.273h3.297l-.527 3.413h-2.77V24C19.612 22.954 24 17.99 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>Continue with Facebook</span>
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

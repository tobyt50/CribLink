import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../layouts/AppShell";
import { useMessage } from "../context/MessageContext";
import API_BASE_URL from "../config";
import {
  Loader,
  UserPlus,
  Hourglass,
  UserRoundCheck,
  CheckCircle,
  UserX,
  EllipsisVertical,
  Landmark,
  Search,
  X,
  Eye,
  ArrowLeft,
  Mail,
} from "lucide-react";

export default function SignUp() {
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState(
    location.state?.role || "user",
  );
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone_number: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [signupStep, setSignupStep] = useState(0);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const [agencies, setAgencies] = useState([]);
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [agencySearchTerm, setAgencySearchTerm] = useState("");
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);
  const [agencyConnectionStatus, setAgencyConnectionStatus] = useState("none");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef(null);
  const [showRegisterAgencyForm, setShowRegisterAgencyForm] = useState(false);
  const [newAgencyForm, setNewAgencyForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    logoBase64: null,
    logoOriginalname: null,
  });
  const [newAgencyLogoPreview, setNewAgencyLogoPreview] = useState("");
  const [registeringAgency, setRegisteringAgency] = useState(false);
  const [showAgencyAffiliationOptions, setShowAgencyAffiliationOptions] =
    useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (token && user) {
      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "agent":
          navigate("/agent/dashboard");
          break;
        default:
          navigate("/");
      }
    }
  }, [navigate]);

  const fetchAgencies = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/agencies`);
      setAgencies(response.data);
      setFilteredAgencies(response.data);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      showMessage("Failed to load agencies.", "error");
    }
  }, [showMessage]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "password" || e.target.name === "confirm_password") {
      setPasswordError("");
    }
  };

  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
    if (role === "user") {
      setForm((prev) => ({ ...prev, phone_number: "" }));
      setSelectedAgencyId(null);
      setAgencyConnectionStatus("none");
      setShowRegisterAgencyForm(false);
      setNewAgencyForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        description: "",
        logoBase64: null,
        logoOriginalname: null,
      });
      setNewAgencyLogoPreview("");
      setShowAgencyAffiliationOptions(false);
    }
    setPasswordError("");
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number.";
    }
    return "";
  };

  const handleAgencySearchChange = (e) => {
    const term = e.target.value;
    setAgencySearchTerm(term);
    if (term) {
      setFilteredAgencies(
        agencies.filter(
          (agency) =>
            agency.name.toLowerCase().includes(term.toLowerCase()) ||
            agency.email.toLowerCase().includes(term.toLowerCase()),
        ),
      );
    } else {
      setFilteredAgencies(agencies);
    }
  };

  const handleAgencySelect = (agencyId) => {
    setSelectedAgencyId(agencyId);
    setAgencyConnectionStatus("selected");
    setShowRegisterAgencyForm(false);
  };

  const handleNewAgencyFormChange = (e) => {
    const { name, value } = e.target;
    setNewAgencyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewAgencyLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAgencyLogoPreview(reader.result);
        setNewAgencyForm((prev) => ({
          ...prev,
          logoBase64: reader.result,
          logoOriginalname: file.name,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setNewAgencyLogoPreview("");
      setNewAgencyForm((prev) => ({
        ...prev,
        logoBase64: null,
        logoOriginalname: null,
      }));
    }
  };

  const handleClearNewAgencyLogo = () => {
    setNewAgencyLogoPreview("");
    setNewAgencyForm((prev) => ({
      ...prev,
      logoBase64: null,
      logoOriginalname: null,
    }));
  };

  const toggleAgencyAffiliationOptions = () => {
    setShowAgencyAffiliationOptions((prev) => !prev);
    if (showAgencyAffiliationOptions) {
      setSelectedAgencyId(null);
      setAgencyConnectionStatus("none");
      setShowRegisterAgencyForm(false);
      setNewAgencyForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        description: "",
        logoBase64: null,
        logoOriginalname: null,
      });
      setNewAgencyLogoPreview("");
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (signupStep === 0) {
      setSignupStep(1);
    } else {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (
      !form.full_name ||
      !form.email ||
      !form.password ||
      !form.confirm_password
    ) {
      showMessage("All fields are required.", "error");
      return;
    }
    if (selectedRole === "agent" && !form.phone_number) {
      showMessage("Phone Number is required for agents.", "error");
      return;
    }

    if (form.password !== form.confirm_password) {
      setPasswordError("Passwords do not match.");
      showMessage("Passwords do not match.", "error");
      return;
    }

    const passwordStrengthError = validatePassword(form.password);
    if (passwordStrengthError) {
      setPasswordError(passwordStrengthError);
      showMessage(passwordStrengthError, "error");
      return;
    }

    const userSignupPayload = {
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      role: selectedRole,
    };

    if (selectedRole === "agent") {
      userSignupPayload.phone_number = form.phone_number;
    }

    try {
      const signupResponse = await axiosInstance.post(
        "/users/signup",
        userSignupPayload,
      );
      showMessage("Account created successfully!", "success", 3000);

      const newUser = signupResponse.data.user;
      const newToken = signupResponse.data.token;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      window.dispatchEvent(new Event("authChange"));

      if (selectedRole === "agent" && showAgencyAffiliationOptions) {
        if (selectedAgencyId === "new_agency_pending") {
          setRegisteringAgency(true);
          try {
            const registerAgencyPayload = {
              ...newAgencyForm,
              logoBase64: newAgencyForm.logoBase64,
              logoOriginalname: newAgencyForm.logoOriginalname,
            };
            const registerResponse = await axiosInstance.post(
              `${API_BASE_URL}/agencies/register-agent-agency`,
              registerAgencyPayload,
              { headers: { Authorization: `Bearer ${newToken}` } },
            );
            showMessage(
              "Agency registered and profile updated successfully!",
              "success",
            );

            localStorage.setItem("token", registerResponse.data.token);
            localStorage.setItem(
              "user",
              JSON.stringify(registerResponse.data.user),
            );
            window.dispatchEvent(new Event("authChange"));
          } catch (agencyError) {
            console.error(
              "Error registering new agency during signup:",
              agencyError.response?.data || agencyError.message,
            );
            showMessage(
              `Failed to register agency: ${agencyError.response?.data?.message || "Please try again."}`,
              "error",
            );
          } finally {
            setRegisteringAgency(false);
          }
        } else if (selectedAgencyId) {
          try {
            await axiosInstance.post(
              `${API_BASE_URL}/agencies/request-to-join`,
              { agency_id: selectedAgencyId },
              { headers: { Authorization: `Bearer ${newToken}` } },
            );
            showMessage(
              "Agency join request sent successfully. Awaiting approval.",
              "success",
            );
          } catch (joinError) {
            console.error(
              "Error sending agency join request during signup:",
              joinError.response?.data || joinError.message,
            );
            showMessage(
              `Failed to send agency join request: ${joinError.response?.data?.message || "Please try again."}`,
              "error",
            );
          }
        }
      }

      showMessage("Signed in automatically!", "success", 3000);
      const updatedUser = JSON.parse(localStorage.getItem("user"));
      switch (updatedUser.role) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "agent":
          navigate("/agent/dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      console.error("Signup error caught locally:", err);
      let errorMessage = "An unexpected error occurred during signup.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showMessage(errorMessage, "error");
    }
  };

  const handleGoogleSignUp = () => {
    showMessage("Google Sign-Up is not yet implemented.", "info");
  };

  const handleFacebookSignUp = () => {
    showMessage("Facebook Sign-Up is not yet implemented.", "info");
  };

  return (
    <div
      className={`min-h-screen flex items-start justify-center p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      style={{ minHeight: "100vh", paddingTop: "4rem" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`w-full max-w-md p-6 sm:p-8 space-y-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="text-center">
          <h1
            className={`text-3xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}
          >
            Create Account
          </h1>
          <p
            className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Sign up to start your journey.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {signupStep === 0 && (
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
                onClick={() => setSignupStep(1)}
                className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-green-600 text-white hover:bg-green-700 transition"
              >
                <Mail className="w-4 h-4" />
                Continue with Email
              </button>

              <div className="relative flex items-center py-2">
                <div
                  className={`flex-grow border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                ></div>
                <span
                  className={`flex-shrink mx-4 text-xs uppercase ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                  Or
                </span>
                <div
                  className={`flex-grow border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                ></div>
              </div>

              <button
                onClick={handleGoogleSignUp}
                className={`w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border transition ${darkMode ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600" : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50"}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.5-.19-2.22H12v4.26h6.01a5.05 5.05 0 0 1-2.18 3.32v2.79h3.6c2.11-1.94 3.33-4.8 3.33-8.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.95-1.08 7.93-2.93l-3.6-2.79c-1.01.69-2.31 1.09-4.33 1.09-3.35 0-6.18-2.27-7.2-5.33H1.2v2.86C3.25 20.53 7.31 23 12 23z"
                  />
                  <path
                    fill="#FBBC04"
                    d="M4.8 14.1c-.2-.69-.31-1.44-.31-2.19s.11-1.5.31-2.19V6.95H1.2C.44 8.35 0 10.12 0 12c0 1.88.44 3.65 1.2 5.05L4.8 14.1z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.59 1.79l3.2-3.2C17.95 1.08 15.24 0 12 0 7.31 0 3.25 2.47 1.2 6.95l3.6 2.8C5.82 7.02 8.65 4.75 12 4.75z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleFacebookSignUp}
                className={`w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border transition ${darkMode ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600" : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50"}`}
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fill="#1877F2"
                    d="M12 0C5.373 0 0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.42H7.078v-3.413h3.047V9.43c0-3.007 1.792-4.661 4.533-4.661 1.306 0 2.68.235 2.68.235v2.953h-1.519c-1.493 0-1.956.925-1.956 1.879v2.273h3.297l-.527 3.413h-2.77V24C19.612 22.954 24 17.99 24 12c0-6.627-5.373-12-12-12z"
                  />
                </svg>
                Continue with Facebook
              </button>

              <div
                className={`text-center text-sm pt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Already have an account?{" "}
                <a
                  href="/signin"
                  className="font-medium text-green-500 hover:underline"
                >
                  Sign In
                </a>
              </div>
            </motion.div>
          )}

          {signupStep === 1 && (
            <motion.form
              key="signup-form"
              onSubmit={handleNextStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setSignupStep(0)}
                className={`flex items-center text-sm font-medium transition ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`}
              >
                <ArrowLeft size={16} className="mr-1" /> Back to choices
              </button>

              <div className="text-center text-sm">
                Sign up as{" "}
                <button
                  type="button"
                  className={`font-medium text-green-500 hover:underline ${selectedRole === "user" ? "underline" : ""}`}
                  onClick={() => handleRoleSwitch("user")}
                >
                  Client
                </button>{" "}
                |{" "}
                <button
                  type="button"
                  className={`font-medium text-green-500 hover:underline ${selectedRole === "agent" ? "underline" : ""}`}
                  onClick={() => handleRoleSwitch("agent")}
                >
                  Agent
                </button>
              </div>

              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={form.full_name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                }`}
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                }`}
              />

              {selectedRole === "agent" && (
                <input
                  type="text"
                  name="phone_number"
                  placeholder="Phone Number"
                  value={form.phone_number}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                />
              )}

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg pr-12 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className={`absolute top-1/2 right-4 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirm_password"
                  placeholder="Confirm Password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg pr-12 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className={`absolute top-1/2 right-4 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {passwordError && (
                <p
                  className={`text-sm text-center ${darkMode ? "text-red-400" : "text-red-500"}`}
                >
                  {passwordError}
                </p>
              )}

              {selectedRole === "agent" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Affiliate with an agency?
                    </span>
                    <button
                      type="button"
                      onClick={toggleAgencyAffiliationOptions}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                    >
                      {showAgencyAffiliationOptions
                        ? "Hide Options"
                        : "Show Options"}
                    </button>
                  </div>

                  {showAgencyAffiliationOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="pb-6">
                        <h3
                          className={`text-xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                        >
                          <Landmark
                            className="mr-2 text-orange-500"
                            size={20}
                          />{" "}
                          Agency Affiliation
                        </h3>

                        {agencyConnectionStatus === "new_agency_pending" && (
                          <div
                            className={`p-4 rounded-lg border ${darkMode ? "border-green-700 bg-green-900/20" : "border-green-200 bg-green-50"}`}
                          >
                            <p
                              className={`font-semibold ${darkMode ? "text-green-300" : "text-green-800"} flex items-center`}
                            >
                              <CheckCircle size={20} className="mr-2" /> New
                              Agency Details Captured
                            </p>
                            <p
                              className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                            >
                              Your new agency details are ready. Complete signup
                              to register it.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setShowRegisterAgencyForm(true);
                                setAgencyConnectionStatus("none");
                                setSelectedAgencyId(null);
                              }}
                              className={`mt-4 px-4 py-2 rounded-lg font-semibold transition ${darkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                            >
                              Edit New Agency
                            </button>
                          </div>
                        )}

                        {selectedAgencyId &&
                          selectedAgencyId !== "new_agency_pending" && (
                            <div
                              className={`p-4 rounded-lg border ${darkMode ? "border-green-700 bg-green-900/20" : "border-green-50"}`}
                            >
                              <p
                                className={`font-semibold ${darkMode ? "text-green-300" : "text-green-800"} flex items-center`}
                              >
                                <UserRoundCheck size={20} className="mr-2" />{" "}
                                Selected Agency:{" "}
                                {agencies.find(
                                  (a) => a.agency_id === selectedAgencyId,
                                )?.name || "N/A"}
                              </p>
                              <p
                                className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                              >
                                You will send a request to join this agency upon
                                account creation.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAgencyId(null);
                                  setAgencyConnectionStatus("none");
                                }}
                                className={`mt-4 px-4 py-2 rounded-lg font-semibold transition ${darkMode ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                              >
                                Clear Selection
                              </button>
                            </div>
                          )}

                        {(agencyConnectionStatus === "none" ||
                          (selectedAgencyId === null &&
                            agencyConnectionStatus !==
                              "new_agency_pending")) && (
                          <div className="space-y-4">
                            {showRegisterAgencyForm && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className={`relative p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
                              >
                                <h4
                                  className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}
                                >
                                  Register New Agency
                                </h4>
                                <p
                                  className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                >
                                  Enter details to create a new agency.
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowRegisterAgencyForm(false)
                                  }
                                  className={`absolute top-4 right-4 ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`}
                                  aria-label="Close form"
                                >
                                  <X size={20} />
                                </button>
                                <div className="space-y-4 mt-4">
                                  <div>
                                    <input
                                      type="text"
                                      name="name"
                                      placeholder="Agency Name"
                                      value={newAgencyForm.name}
                                      onChange={handleNewAgencyFormChange}
                                      required
                                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                        darkMode
                                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="email"
                                      name="email"
                                      placeholder="Agency Email"
                                      value={newAgencyForm.email}
                                      onChange={handleNewAgencyFormChange}
                                      required
                                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                        darkMode
                                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="tel"
                                      name="phone"
                                      placeholder="Agency Phone"
                                      value={newAgencyForm.phone}
                                      onChange={handleNewAgencyFormChange}
                                      required
                                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                        darkMode
                                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      name="address"
                                      placeholder="Address"
                                      value={newAgencyForm.address}
                                      onChange={handleNewAgencyFormChange}
                                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                        darkMode
                                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="url"
                                      name="website"
                                      placeholder="Website"
                                      value={newAgencyForm.website}
                                      onChange={handleNewAgencyFormChange}
                                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                        darkMode
                                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <textarea
                                      name="description"
                                      placeholder="Brief description of your agency..."
                                      value={newAgencyForm.description}
                                      onChange={handleNewAgencyFormChange}
                                      rows="3"
                                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                        darkMode
                                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                      }`}
                                    ></textarea>
                                  </div>
                                  <div>
                                    <input
                                      type="file"
                                      name="new_agency_logo"
                                      accept="image/*"
                                      onChange={handleNewAgencyLogoChange}
                                      className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${darkMode ? "file:bg-green-600 file:text-white file:hover:bg-green-700 text-gray-300" : "file:bg-green-50 file:text-green-700 hover:file:bg-green-50 text-gray-700"}`}
                                    />
                                    {newAgencyLogoPreview && (
                                      <div className="mt-4 flex items-center space-x-4">
                                        <img
                                          src={newAgencyLogoPreview}
                                          alt="Agency Logo"
                                          className="w-24 h-24 rounded-lg object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={handleClearNewAgencyLogo}
                                          className={`px-4 py-2 rounded-lg font-semibold transition ${darkMode ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                                        >
                                          Clear Logo
                                        </button>
                                      </div>
                                    )}
                                    <p
                                      className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                      PNG, JPG, or GIF up to 5MB.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowRegisterAgencyForm(false)
                                    }
                                    className={`w-full py-2.5 rounded-lg font-semibold transition ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        !newAgencyForm.name ||
                                        !newAgencyForm.email ||
                                        !newAgencyForm.phone
                                      ) {
                                        showMessage(
                                          "Agency name, email, and phone are required.",
                                          "error",
                                        );
                                        return;
                                      }
                                      if (
                                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                          newAgencyForm.email,
                                        )
                                      ) {
                                        showMessage(
                                          "Please enter a valid email address for the agency.",
                                          "error",
                                        );
                                        return;
                                      }
                                      showMessage(
                                        "Agency details captured. Proceed with account creation.",
                                        "info",
                                      );
                                      setShowRegisterAgencyForm(false);
                                      setSelectedAgencyId("new_agency_pending");
                                      setAgencyConnectionStatus(
                                        "new_agency_pending",
                                      );
                                    }}
                                    disabled={registeringAgency}
                                    className={`w-full py-2.5 rounded-lg font-semibold transition ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"} disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {registeringAgency
                                      ? "Capturing..."
                                      : "Confirm Details"}
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {!showRegisterAgencyForm && !selectedAgencyId && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowRegisterAgencyForm(true)
                                  }
                                  className={`w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-green-600 text-white hover:bg-green-700 transition`}
                                >
                                  <Landmark className="w-4 h-4" /> Register Your
                                  Agency
                                </button>
                              </div>
                            )}

                            {!showRegisterAgencyForm && !selectedAgencyId && (
                              <div className="space-y-4">
                                <h4
                                  className={`text-lg font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                                >
                                  Or Join an Existing Agency
                                </h4>
                                <div className="relative mb-4">
                                  <input
                                    type="text"
                                    placeholder="Search agencies by name or email..."
                                    value={agencySearchTerm}
                                    onChange={handleAgencySearchChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                      darkMode
                                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                    }`}
                                  />
                                </div>

                                {filteredAgencies.length > 0 ? (
                                  <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {filteredAgencies.map((agency) => (
                                      <li
                                        key={agency.agency_id}
                                        className={`p-3 rounded-lg border flex items-center justify-between transition-colors duration-200 ${darkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                                      >
                                        <div className="flex items-center space-x-3">
                                          {agency.logo_url ? (
                                            <img
                                              src={agency.logo_url}
                                              alt={agency.name}
                                              className="w-8 h-8 rounded-full object-cover"
                                            />
                                          ) : (
                                            <Landmark
                                              size={24}
                                              className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                            />
                                          )}
                                          <div>
                                            <p
                                              className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}
                                            >
                                              {agency.name}
                                            </p>
                                            <p
                                              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                            >
                                              {agency.email}
                                            </p>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleAgencySelect(agency.agency_id)
                                          }
                                          className={`p-2 rounded-lg transition-colors duration-200 ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                                          title="Select Agency"
                                        >
                                          <UserPlus size={20} />
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p
                                    className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                  >
                                    No agencies found matching your search.
                                  </p>
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

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Account
                </button>
              </div>

              <div
                className={`flex justify-between items-center text-sm pt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                <span>Already have an account?</span>
                <a
                  href="/signin"
                  className="font-medium text-green-500 hover:underline"
                >
                  Sign In
                </a>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

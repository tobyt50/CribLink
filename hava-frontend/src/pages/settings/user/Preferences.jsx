import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../layouts/AppShell";
import { useMessage } from "../../../context/MessageContext";
import { useAuth } from "../../../context/AuthContext";
import { useSidebarState } from "../../../hooks/useSidebarState"; // <-- CORRECTLY IMPORTED
import axiosInstance from "../../../api/axiosInstance";
import {
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  LayoutList,
  ChevronDownIcon,
  Globe,
  Home,
} from "lucide-react";

// --- Reusable Dropdown Component (Unchanged) ---
const Dropdown = ({
  options,
  value,
  onChange,
  placeholder,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptionLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm h-10 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-white border-gray-300 text-gray-500"}`}
      >
        <span className="overflow-hidden truncate">{selectedOptionLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ x: 5 }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50"}`}
              >
                {option.icon} {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Reusable Switch Component (Unchanged) ---
const Switch = ({ isOn, handleToggle, label, description }) => {
  const { darkMode } = useTheme();
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border h-full ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}
    >
      <div>
        <span
          className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}
        >
          {label}
        </span>
        {description && (
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}
          >
            {description}
          </p>
        )}
      </div>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? "bg-green-600" : darkMode ? "bg-gray-600" : "bg-gray-200"}`}
        role="switch"
        aria-checked={isOn}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOn ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
};

// --- NEW: Skeleton for Preferences page ---
const PreferencesSkeleton = ({ darkMode }) => (
  <div className="space-y-8 animate-pulse">
    <div
      className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
    >
      <div
        className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          ></div>
        ))}
      </div>
    </div>
    <div className={`pb-6 mb-6`}>
      <div
        className={`h-6 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"} mb-5`}
      ></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

const Preferences = () => {
  const { darkMode, themePreference, setThemePreference } = useTheme();
  const { showMessage } = useMessage();
  const { user } = useAuth();
  const { setIsCollapsed } = useSidebarState(); // <-- CORRECTLY INSTANTIATED
  const token = localStorage.getItem("token");

  // UI State stored in localStorage
  const [defaultListView, setDefaultListView] = useState(
    () => localStorage.getItem("defaultListingsView") || "simple",
  );
  const [sidebarPermanentlyExpanded, setSidebarPermanentlyExpanded] = useState(
    () => localStorage.getItem("sidebarPermanentlyExpanded") === "true",
  );

  // User-specific settings from DB
  const [userSettings, setUserSettings] = useState({
    language: "en",
    timezone: "UTC+1",
    currency: "NGN",
    default_landing_page: "/",
  });
  const [loading, setLoading] = useState(true);

  const fetchUserSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users/profile");
      const userData = response.data;
      setUserSettings({
        language: userData.language || "en",
        timezone: userData.timezone || "UTC+1",
        currency: userData.currency || "NGN",
        default_landing_page: userData.default_landing_page || "/",
      });
    } catch (error) {
      showMessage("Failed to load user preferences.", "error");
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchUserSettings();
  }, [fetchUserSettings]);

  const handleSettingUpdate = async (name, value) => {
    setUserSettings((prev) => ({ ...prev, [name]: value }));
    try {
      await axiosInstance.put(
        "/users/update",
        { [name]: value },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showMessage(
        `${name.replace(/_/g, " ")} updated successfully!`,
        "success",
      );
    } catch (error) {
      showMessage(`Failed to save ${name.replace(/_/g, " ")}.`, "error");
      fetchUserSettings(); // Revert on failure
    }
  };

  const handleThemeChange = (value) => {
    setThemePreference(value);
    showMessage(`Theme set to ${value}.`, "success");
  };

  const handleDefaultListViewChange = (value) => {
    setDefaultListView(value);
    localStorage.setItem("defaultListingsView", value);
    showMessage("Default listings view updated.", "success");
  };

  // --- CORRECTED: Sidebar toggle now updates global and local state ---
  const handleSidebarToggle = () => {
    const newState = !sidebarPermanentlyExpanded;
    setSidebarPermanentlyExpanded(newState); // Update local state for the switch
    setIsCollapsed(!newState); // Update global state to actually change the sidebar
    localStorage.setItem("sidebarPermanentlyExpanded", String(newState));
    showMessage(
      `Sidebar permanently ${newState ? "expanded" : "collapsed"}.`,
      "success",
    );
  };

  const themeOptions = [
    { value: "light", label: "Light", icon: <Sun size={20} /> },
    { value: "dark", label: "Dark", icon: <Moon size={20} /> },
    { value: "system", label: "System", icon: <Monitor size={20} /> },
  ];
  const listViewOptions = [
    { value: "simple", label: "Table View", icon: <LayoutList size={20} /> },
    { value: "graphical", label: "Grid View", icon: <LayoutGrid size={20} /> },
  ];
  const languageOptions = [
    { value: "en", label: "English", icon: <Globe size={20} /> },
    { value: "es", label: "Spanish", icon: <Globe size={20} /> },
    { value: "fr", label: "French", icon: <Globe size={20} /> },
    { value: "de", label: "German", icon: <Globe size={20} /> },
  ];
  const timezoneOptions = [
    { value: "UTC+01", label: "West Central Africa (UTC+1)" },
  ];
  const currencyOptions = [
    { value: "NGN", label: "₦ Nigerian Naira" },
    { value: "USD", label: "$ US Dollar" },
    { value: "EUR", label: "€ Euro" },
  ];
  const landingPageOptions = useCallback(() => {
    const base = [{ value: "/", label: "Home", icon: <Home size={20} /> }];
    if (user?.role === "admin")
      base.push({ value: "/admin/dashboard", label: "Admin Dashboard" });
    if (user?.role === "agent" || user?.role === "agency_admin")
      base.push({ value: "/agent/dashboard", label: "Agent Dashboard" });
    if (user?.role === "client")
      base.push({ value: "/client/dashboard", label: "Client Dashboard" });
    return base;
  }, [user?.role]);

  if (loading) {
    return <PreferencesSkeleton darkMode={darkMode} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div
        className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3
          className={`text-lg md:text-xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          Display & Language
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <label className="block text-lg font-semibold mb-3">Theme</label>
            <Dropdown
              options={themeOptions}
              value={themePreference}
              onChange={handleThemeChange}
            />
          </div>
          <div
            className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <label className="block text-lg font-semibold mb-3">
              Default Listings View
            </label>
            <Dropdown
              options={listViewOptions}
              value={defaultListView}
              onChange={handleDefaultListViewChange}
            />
          </div>
          <div
            className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <label className="block text-lg font-semibold mb-3">Language</label>
            <Dropdown
              options={languageOptions}
              value={userSettings.language}
              onChange={(v) => handleSettingUpdate("language", v)}
            />
          </div>
          <div
            className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <label className="block text-lg font-semibold mb-3">Timezone</label>
            <Dropdown
              options={timezoneOptions}
              value={userSettings.timezone}
              onChange={(v) => handleSettingUpdate("timezone", v)}
            />
          </div>
        </div>
      </div>

      <div className={`pb-6 mb-6`}>
        <h3
          className={`text-lg md:text-xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          Application Behavior
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <label className="block text-lg font-semibold mb-3">
              Default Landing Page
            </label>
            <Dropdown
              options={landingPageOptions()}
              value={userSettings.default_landing_page}
              onChange={(v) => handleSettingUpdate("default_landing_page", v)}
            />
          </div>
          <div
            className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <label className="block text-lg font-semibold mb-3">
              Default Currency
            </label>
            <Dropdown
              options={currencyOptions}
              value={userSettings.currency}
              onChange={(v) => handleSettingUpdate("currency", v)}
            />
          </div>
          <Switch
            label="Permanently Expand Sidebar"
            description="Keep the sidebar expanded on desktop."
            isOn={sidebarPermanentlyExpanded}
            handleToggle={handleSidebarToggle}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Preferences;

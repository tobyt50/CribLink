import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Sun, Bell, Layout, Languages, Palette,
  Loader, Save,
  Link, // Re-added Link as it was in the original context you provided for 'Other Account Settings'
  ChevronDown,
  Landmark
} from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import axiosInstance from '../../api/axiosInstance';
import API_BASE_URL from '../../config';
import { useMessage } from '../../context/MessageContext';
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook

// Reusable Dropdown Component (embedded directly here for self-containation)
const Dropdown = ({ options, value, onChange, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        delayChildren: 0.05,
        staggerChildren: 0.02,
      },
    },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: "easeOut" } },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const selectedOptionLabel = options.find(option => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
          ${darkMode
            ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400"
            : "bg-white border-gray-300 text-gray-700 hover:border-green-500 focus:ring-600"
          }`}
      >
        <span>{selectedOptionLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 transform origin-top max-h-60 overflow-y-auto
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {options.map((option) => (
              <motion.button
              type="button"
              key={option.value}
              variants={itemVariants}
              whileHover={{ x: 5 }}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200
                ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
            >
              {option.label}
            </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


function Settings({ form, handleChange, handleUpdate, updating }) {
  const { darkMode, toggleTheme } = useTheme();
  const { showMessage } = useMessage();
  const { user } = useAuth(); // Get user from AuthContext
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Initial form state for user-specific settings, will be updated from fetched data
  const [userSettings, setUserSettings] = useState({
    language: 'en',
    notifications_settings: {
      email_alerts: true,
      push_notifications: true,
      in_app_messages: true,
    },
    timezone: 'UTC+1',
    currency: 'NGN',
    default_landing_page: '/', // This will be overridden by fetched data
    notification_email: '',
    preferred_communication_channel: 'email',
  });

  const token = localStorage.getItem("token");

  // Fetch User Settings
  const fetchUserSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data;

      setUserSettings(prevSettings => ({
        ...prevSettings,
        language: userData.language || prevSettings.language,
        notifications_settings: {
          email_alerts: userData.notifications_settings?.email_alerts ?? true,
          push_notifications: userData.notifications_settings?.push_notifications ?? true,
          in_app_messages: userData.notifications_settings?.in_app_messages ?? true,
        },
        timezone: userData.timezone || prevSettings.timezone,
        currency: userData.currency || prevSettings.currency,
        default_landing_page: userData.default_landing_page || prevSettings.default_landing_page,
        notification_email: userData.notification_email || '',
        preferred_communication_channel: userData.preferred_communication_channel || prevSettings.preferred_communication_channel,
      }));

    } catch (error) {
      console.error('Error fetching user settings:', error);
      showMessage(error?.response?.data?.message || 'Failed to load settings.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  }, [token, showMessage]);

  useEffect(() => {
    if (token) {
      fetchUserSettings();
    }
  }, [token, fetchUserSettings]);

  const handleSettingsChange = (name, value) => {
    if (name.startsWith('notifications_settings.')) {
      const notificationType = name.split('.')[1];
      setUserSettings(prev => ({
        ...prev,
        notifications_settings: {
          ...prev.notifications_settings,
          [notificationType]: value,
        },
      }));
    } else {
      setUserSettings(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const inputFieldStyles =
    `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
      darkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;
  const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;
  const inputGroupStyles = "flex flex-col";

  // Currency options for the dropdown
  const currencyOptions = [
    { value: 'NGN', label: '₦ Nigerian Naira' },
    { value: 'USD', label: '$ US Dollar' },
    { value: 'EUR', label: '€ Euro' },
    { value: 'GBP', label: '£ British Pound' },
    { value: 'JPY', label: '¥ Japanese Yen' },
  ];

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  // Timezone options (example for UTC+1, assuming Lagos, Nigeria)
  const timezoneOptions = [
    { value: 'UTC-12', label: '(UTC-12:00) International Date Line West' },
    { value: 'UTC-11', label: '(UTC-11:00) Coordinated Universal Time-11' },
    { value: 'UTC-10', label: '(UTC-10:00) Hawaii' },
    { value: 'UTC-09', label: '(UTC-09:00) Alaska' },
    { value: 'UTC-08', label: '(UTC-08:00) Pacific Time (US & Canada)' },
    { value: 'UTC-07', label: '(UTC-07:00) Mountain Time (US & Canada)' },
    { value: 'UTC-06', label: '(UTC-06:00) Central Time (US & Canada)' },
    { value: 'UTC-05', label: '(UTC-05:00) Eastern Time (US & Canada)' },
    { value: 'UTC-04', label: '(UTC-04:00) Atlantic Time (Canada)' },
    { value: 'UTC-03', label: '(UTC-03:00) Buenos Aires, Georgetown' },
    { value: 'UTC-02', label: '(UTC-02:00) Mid-Atlantic' },
    { value: 'UTC-01', label: '(UTC-01:00) Azores, Cape Verde Is.' },
    { value: 'UTC+00', label: '(UTC+00:00) Dublin, Edinburgh, Lisbon, London' },
    { value: 'UTC+01', label: '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna (West Central Africa)' }, // Adjusted for Lagos
    { value: 'UTC+02', label: '(UTC+02:00) Athens, Bucharest, Istanbul' },
    { value: 'UTC+03', label: '(UTC+03:00) Baghdad, Kuwait, Riyadh' },
    { value: 'UTC+04', label: '(UTC+04:00) Abu Dhabi, Muscat' },
    { value: 'UTC+05', label: '(UTC+05:00) Islamabad, Karachi, Tashkent' },
    { value: 'UTC+05:30', label: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
    { value: 'UTC+06', label: '(UTC+06:00) Astana, Dhaka' },
    { value: 'UTC+07', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
    { value: 'UTC+08', label: '(UTC+08:00) Beijing, Hong Kong, Perth, Singapore, Taipei' },
    { value: 'UTC+09', label: '(UTC+09:00) Osaka, Sapporo, Tokyo' },
    { value: 'UTC+10', label: '(UTC+10:00) Canberra, Melbourne, Sydney' },
    { value: 'UTC+11', label: '(UTC+11:00) Magadan, Solomon Is., New Caledonia' },
    { value: 'UTC+12', label: '(UTC+12:00) Auckland, Wellington, Fiji' },
  ];

  // Dynamically generate Default Landing Page options based on user role
  const defaultLandingPageOptions = useCallback(() => {
    const options = [
      { value: '/', label: 'Home' },
      { value: '/profile/general', label: 'Profile' },
      // Add other general landing pages if applicable
    ];

    if (user?.role) {
      let dashboardPath = '';
      let inquiriesPath = ''; // New variable for inquiries path
      switch (user.role) {
        case 'admin':
          dashboardPath = '/admin/dashboard';
          inquiriesPath = '/admin/inquiries'; // Assuming admin inquiries path
          break;
        case 'agent':
          dashboardPath = '/agent/dashboard';
          inquiriesPath = '/agent/inquiries';
          break;
        case 'client':
          dashboardPath = '/client/dashboard'; // While SignIn might redirect to /client/inquiries, clients can still have a dashboard
          inquiriesPath = '/client/inquiries';
          break;
        default:
          dashboardPath = '/'; // Fallback generic dashboard if role is unknown
          inquiriesPath = '/'; // Fallback for inquiries
      }
      
      // Add Dashboard option
      options.unshift({ value: dashboardPath, label: 'Dashboard' }); 
      
      // Add Inquiries option if a specific path is determined
      if (inquiriesPath && inquiriesPath !== '/') { // Avoid adding duplicate '/'
        options.unshift({ value: inquiriesPath, label: 'Inquiries' });
      }
    }
    return options;
  }, [user?.role]);


  // Preferred Communication Channel options
  const preferredCommunicationChannelOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'in-app', label: 'In-App Messages' },
  ];

  if (settingsLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader className="animate-spin w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="space-y-8 p-4 bg-transparent dark:bg-transparent rounded-none shadow-none max-w-full mx-auto my-0
                 md:p-0 md:bg-transparent md:dark:bg-transparent md:rounded-none md:shadow-none md:max-w-none md:mx-0 md:my-0"
    >
      {/* General App Settings */}
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <SettingsIcon className="mr-3 text-blue-500" size={24} /> General App Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Language */}
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="language">Language</label>
            <Dropdown
              options={languageOptions}
              value={userSettings.language}
              onChange={(value) => handleSettingsChange('language', value)}
              placeholder="Select Language"
            />
          </div>

          {/* Timezone (Display or Select) */}
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="timezone">Timezone</label>
            <Dropdown
              options={timezoneOptions}
              value={userSettings.timezone}
              onChange={(value) => handleSettingsChange('timezone', value)}
              placeholder="Select Timezone"
            />
          </div>

          {/* Currency (Display or Select) */}
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="currency">Default Currency</label>
            <Dropdown
              options={currencyOptions}
              value={userSettings.currency}
              onChange={(value) => handleSettingsChange('currency', value)}
              placeholder="Select Currency"
            />
          </div>

        </div>
      </div>

      {/* Notification Settings */}
      <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <Bell className="mr-3 text-red-500" size={24} /> Notification Preferences
        </h3>
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Manage how you receive notifications from our app.
        </p>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="notifications_settings.email_alerts"
              name="notifications_settings.email_alerts"
              checked={userSettings.notifications_settings.email_alerts}
              onChange={(e) => handleSettingsChange('notifications_settings.email_alerts', e.target.checked)}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="notifications_settings.email_alerts" className={labelStyles}>
              Email Alerts
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="notifications_settings.push_notifications"
              name="notifications_settings.push_notifications"
              checked={userSettings.notifications_settings.push_notifications}
              onChange={(e) => handleSettingsChange('notifications_settings.push_notifications', e.target.checked)}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="notifications_settings.push_notifications" className={labelStyles}>
              Push Notifications
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="notifications_settings.in_app_messages"
              name="notifications_settings.in_app_messages"
              checked={userSettings.notifications_settings.in_app_messages}
              onChange={(e) => handleSettingsChange('notifications_settings.in_app_messages', e.target.checked)}
              className={`h-5 w-5 rounded-md ${darkMode ? "form-checkbox text-green-500 bg-gray-700 border-gray-600 focus:ring-green-400" : "form-checkbox text-green-600 bg-white border-gray-300 focus:ring-green-600"}`}
            />
            <label htmlFor="notifications_settings.in_app_messages" className={labelStyles}>
              In-App Messages
            </label>
          </div>
          {/* Email for Notifications */}
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="notification_email">Email for Notifications</label>
            <input
              type="email"
              id="notification_email"
              name="notification_email"
              value={userSettings.notification_email}
              onChange={(e) => handleSettingsChange('notification_email', e.target.value)}
              className={inputFieldStyles}
              placeholder="your-email@example.com"
            />
            <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              This email will be used for sending you alerts and updates.
            </p>
          </div>
          {/* Preferred Communication Channel */}
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="preferred_communication_channel">Preferred Communication Channel</label>
            <Dropdown
              options={preferredCommunicationChannelOptions}
              value={userSettings.preferred_communication_channel}
              onChange={(value) => handleSettingsChange('preferred_communication_channel', value)}
              placeholder="Select Channel"
            />
            <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Choose your primary channel for important app communications.
            </p>
          </div>
        </div>
      </div>

      {/* Other Account Settings */}
      <div className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <h3 className={`text-2xl font-bold mb-4 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
          <Link className="mr-3 text-orange-500" size={24} /> Other Account Settings
        </h3>
        <div className="space-y-4">
          {/* Default Landing Page */}
          <div className={inputGroupStyles}>
            <label className={labelStyles} htmlFor="default_landing_page">Default Landing Page</label>
            <Dropdown
              options={defaultLandingPageOptions()} // Call the function to get dynamic options
              value={userSettings.default_landing_page}
              onChange={(value) => handleSettingsChange('default_landing_page', value)}
              placeholder="Select Landing Page"
            />
          </div>

          {/* Quick link to Privacy settings */}
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"} mt-4`}>
            For detailed privacy controls and data management, visit the <a href="/settings/privacy" className="text-blue-500 hover:underline">Privacy Dashboard</a>.
          </p>
        </div>
      </div>

      {/* Save Changes Button */}
      <div className="flex justify-center pt-8">
        <button
          onClick={() => handleUpdate(userSettings)}
          disabled={updating || settingsLoading}
          className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105 flex items-center"
        >
          {updating || settingsLoading ? (
            <Loader size={20} className="animate-spin mr-2 inline-block" />
          ) : (
            <Save size={20} className="mr-2 inline-block" />
          )}
          {updating ? "Saving..." : settingsLoading ? "Loading..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}

export default Settings;

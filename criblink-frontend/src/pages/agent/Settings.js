import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Bell, Settings, Sun, Moon, Monitor, LayoutGrid, LayoutList, ChevronDownIcon, Mail, MessageSquare, Briefcase, Globe, CheckCircle, XCircle, Search, X, Menu, Languages, Palette, Link, Landmark, Loader, Save } from 'lucide-react'; // Added new icons
import AgentSidebar from '../../components/agent/Sidebar';
import { useTheme } from '../../layouts/AppShell';
import { useMessage } from '../../context/MessageContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook


// Custom Alert/Message Box Component (instead of alert())
const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
  const icon = type === 'success' ? <CheckCircle size={20} className="mr-2" /> : <XCircle size={20} className="mr-2" />;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg flex items-center border ${bgColor}`} role="alert">
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none">
        <X size={18} /> {/* Using X from lucide-react, now imported */}
      </button>
    </div>
  );
};

// Reusable Dropdown Component (copied from AdminSettings.js for consistency)
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
                className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10
                  ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
            >
                <span className="overflow-hidden truncate">{selectedOptionLabel}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {options.find(option => option.value === value)?.icon || <ChevronDownIcon className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />}
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 overflow-hidden transform origin-top
                          ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                        {options.map((option) => (
                            <motion.button
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
                                {option.icon && <span>{option.icon}</span>}
                                {option.label}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Reusable Switch component (copied from AdminSettings.js for consistency)
const Switch = ({ isOn, handleToggle, label, description }) => {
    const { darkMode } = useTheme();
    return (
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ease-in-out h-full ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
            <div>
                <span className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{label}</span>
                {description && <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>{description}</p>}
            </div>
            <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
                    ${isOn ? 'bg-green-600' : (darkMode ? 'bg-gray-600' : 'bg-gray-200')}`}
                role="switch"
                aria-checked={isOn}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
                        ${isOn ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
};

// Skeleton for a dropdown input
const DropdownSkeleton = ({ darkMode }) => (
  <div className={`h-10 w-full rounded-xl animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
);

// Skeleton for a switch component
const SwitchSkeleton = ({ darkMode }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border animate-pulse h-full ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
    <div className={`h-6 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    <div className={`h-6 w-11 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
  </div>
);

// Skeleton for a textarea and button
const TextAreaWithButtonSkeleton = ({ darkMode }) => (
  <div>
    <div className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-2`}></div>
    <div className={`h-24 w-full rounded-xl animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-2`}></div>
    <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-4`}></div>
    <div className={`h-10 w-32 rounded-xl animate-pulse ${darkMode ? "bg-green-700" : "bg-green-200"}`}></div>
  </div>
);


const AgentSettings = () => {
    const { darkMode, themePreference, setThemePreference } = useTheme();
    const { showMessage } = useMessage(); // Destructure showMessage from useMessage
    const { user } = useAuth(); // Get user from AuthContext

    // State for agent settings
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // State for general user settings (moved from ProfileSettings.js)
    const [userSettings, setUserSettings] = useState({
        language: 'en',
        timezone: 'UTC+1',
        currency: 'NGN',
        default_landing_page: '/',
        notification_email: '', // Added for consistency
        preferred_communication_channel: 'email', // Added for consistency
    });
    const [userSettingsLoading, setUserSettingsLoading] = useState(true); // For userSettings fetch

    // Sidebar State (from other agent files like Dashboard.js, Listings.js)
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
    const [activeSection, setActiveSection] = useState('settings'); // Default active section for Agent Settings

    const token = localStorage.getItem('token');

    // Fetch User Settings (from ProfileSettings.js)
    const fetchUserSettings = useCallback(async () => {
        setUserSettingsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = response.data;

            setUserSettings(prevSettings => ({
                ...prevSettings,
                language: userData.language || prevSettings.language,
                timezone: userData.timezone || prevSettings.timezone,
                currency: userData.currency || prevSettings.currency,
                default_landing_page: userData.default_landing_page || prevSettings.default_landing_page,
                notification_email: userData.notification_email || '',
                preferred_communication_channel: userData.preferred_communication_channel || prevSettings.preferred_communication_channel,
            }));

        } catch (error) {
            console.error('Error fetching user settings:', error);
            showMessage(error?.response?.data?.message || 'Failed to load general settings.', 'error');
        } finally {
            setUserSettingsLoading(false);
        }
    }, [token, showMessage]);


    useEffect(() => {
        const fetchAgentSettings = async () => {
            try {
                setLoading(true);
                if (!token) {
                    showMessage('Authentication token not found. Please log in.', 'error'); // Using showMessage
                    setLoading(false);
                    return; // Prevent further execution if no token
                }

                // Fetch agent profile for name, email, profile picture
                const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const profileData = profileResponse.data;

                let agentSpecificSettings = {};
                try {
                    const agentSettingsResponse = await axios.get(`${API_BASE_URL}/agent/settings`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    agentSpecificSettings = agentSettingsResponse.data;
                } catch (error) {
                    // If agent settings endpoint doesn't exist or returns error (e.g., 404/500)
                    console.warn("Agent specific settings endpoint not found or error fetching. Using defaults.", error);
                    // Initialize with defaults if no settings are found for the user
                    agentSpecificSettings = {
                        two_factor_enabled: false,
                        email_notifications: true,
                        in_app_notifications: true,
                        new_inquiry_alert: true,
                        ticket_update_alert: true,
                        is_available: true,
                        default_signature: '',
                        auto_assign_inquiries: false,
                        theme: 'system',
                        default_list_view: 'simple',
                        sidebar_permanently_expanded: false,
                        language: 'en',
                    };
                }


                const fetchedSettings = {
                    profile: { // This section is for display only, not directly editable here
                        name: profileData.full_name || 'N/A',
                        email: profileData.email || 'N/A',
                        profilePicture: profileData.profile_picture_url || `https://placehold.co/100x100/A0D9D4/004D40?text=${profileData.full_name?.charAt(0).toUpperCase() || 'A'}`,
                    },
                    security: {
                        twoFactorEnabled: agentSpecificSettings.two_factor_enabled,
                    },
                    notifications: {
                        emailNotifications: agentSpecificSettings.email_notifications,
                        inAppNotifications: agentSpecificSettings.in_app_notifications,
                        newTicketAlert: agentSpecificSettings.new_inquiry_alert, // Renamed in DB
                        ticketUpdateAlert: agentSpecificSettings.ticket_update_alert, // Renamed in DB
                    },
                    agentPreferences: {
                        isAvailable: agentSpecificSettings.is_available,
                        defaultSignature: agentSpecificSettings.default_signature || '',
                        autoAssignTickets: agentSpecificSettings.auto_assign_inquiries, // Renamed in DB
                    },
                    display: {
                        theme: agentSpecificSettings.theme || localStorage.getItem('themePreference') || 'system',
                        defaultListView: agentSpecificSettings.default_list_view || localStorage.getItem('defaultListingsView') || 'simple',
                        sidebarPermanentlyExpanded: agentSpecificSettings.sidebar_permanently_expanded || localStorage.getItem('sidebarPermanentlyExpanded') === 'true',
                        language: agentSpecificSettings.language || localStorage.getItem('agentLanguage') || 'en',
                    },
                };
                setSettings(fetchedSettings);
                // Also update local storage for the values that are synced client-side,
                // ensuring consistency for other components relying on these global settings.
                localStorage.setItem('themePreference', fetchedSettings.display.theme);
                localStorage.setItem('defaultListingsView', fetchedSettings.display.defaultListView);
                localStorage.setItem('sidebarPermanentlyExpanded', fetchedSettings.display.sidebarPermanentlyExpanded);
                localStorage.setItem('agentLanguage', fetchedSettings.display.language);

            } catch (error) {
                console.error('Error fetching agent settings:', error);
                if (error.response && error.response.status === 401) {
                    showMessage('Session expired or unauthorized. Please log in again.', 'error');
                } else {
                    showMessage('Failed to load settings. Please try again.', 'error');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAgentSettings();
        fetchUserSettings(); // Fetch general user settings
    }, [token, fetchUserSettings]);

    // Sync settings to localStorage whenever they change
    // This is for display settings which might be used globally across the app
    useEffect(() => {
      if (settings) {
        localStorage.setItem('themePreference', settings.display.theme);
        localStorage.setItem('defaultListingsView', settings.display.defaultListView);
        localStorage.setItem('sidebarPermanentlyExpanded', settings.display.sidebarPermanentlyExpanded);
        localStorage.setItem('agentLanguage', settings.display.language);
      }
    }, [settings]);

    const handleInputChange = (e, section, key) => {
        const { value, type, checked } = e.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [section]: {
                ...prevSettings[section],
                [key]: type === 'checkbox' ? checked : value,
            },
        }));
    };

    // New handler to update user settings and save immediately
    const handleUserSettingsUpdate = async (name, value) => {
        setUserSettings(prev => ({
            ...prev,
            [name]: value,
        }));
        try {
            // No need for userSettingsLoading state for individual saves as it's quick
            const payload = { [name]: value }; // Send only the changed setting
            await axios.put(`${API_BASE_URL}/users/update`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage(`${name.replace(/_/g, ' ')} updated successfully!`, "success");
        } catch (error) {
            console.error(`Failed to save ${name}:`, error);
            showMessage(`Failed to save ${name.replace(/_/g, ' ')}. Please try again.`, "error");
            // Optionally revert UI on error if needed, but for simple settings,
            // it might be better to let the user see the change and try again.
        }
    };

    const createToggleHandler = (section, key, messageLabel, dbKey = key) => async () => {
        const newState = !settings[section][key]; // Get new state based on current
        setSettings(prevSettings => ({ // Optimistic UI update
            ...prevSettings,
            [section]: {
                ...prevSettings[section],
                [key]: newState,
            },
        }));

        try {
            if (!token) { // Double check token before sending request
                showMessage('Authentication token missing. Please log in.', 'error');
                setSettings(prevSettings => ({ // Revert UI on missing token
                    ...prevSettings,
                    [section]: { ...prevSettings[section], [key]: !newState },
                }));
                return;
            }
            // Backend expects snake_case for DB columns
            const payloadKey = dbKey.replace(/([A-Z])/g, '_$1').toLowerCase(); // Converts camelCase to snake_case
            await axios.put(`${API_BASE_URL}/agent/settings`, {
                [payloadKey]: newState,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage(`${messageLabel} ${newState ? 'enabled' : 'disabled'}.`, 'success');
        } catch (error) {
            console.error(`Error toggling ${messageLabel}:`, error);
            showMessage(`Failed to update ${messageLabel}. Please try again.`, 'error');
            // Revert UI on error
            setSettings(prevSettings => ({
                ...prevSettings,
                [section]: {
                    ...prevSettings[section],
                    [key]: !newState, // Revert to previous state
                },
            }));
        }
    };

    const handleSaveSettings = async (settingName, sectionToSave) => {
        try {
            if (!settings) return;
            setLoading(true);
            if (!token) { // Double check token before sending request
                showMessage('Authentication token missing. Please log in.', 'error');
                setLoading(false);
                return;
            }
            let payload = {};

            // Map frontend camelCase to backend snake_case for the payload
            if (sectionToSave === 'agentPreferences') {
                payload = {
                    is_available: settings.agentPreferences.isAvailable,
                    default_signature: settings.agentPreferences.defaultSignature,
                    auto_assign_inquiries: settings.agentPreferences.autoAssignTickets,
                };
            } else if (sectionToSave === 'display') {
                 payload = {
                    theme: settings.display.theme,
                    default_list_view: settings.display.defaultListView,
                    sidebar_permanently_expanded: settings.display.sidebarPermanently_expanded,
                    language: settings.display.language,
                 };
            }
            // Add other sections here as needed for specific 'Save' buttons

            await axios.put(`${API_BASE_URL}/agent/settings`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage(`${settingName} saved successfully!`, 'success'); // Using showMessage
        } catch (error) {
            console.error(`Error saving ${settingName} settings:`, error);
            showMessage(`Failed to save ${settingName}. Please try again.`, 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleThemeChange = (value) => {
        setThemePreference(value); // Update global theme context
        setSettings(prevSettings => ({
            ...prevSettings,
            display: {
                ...prevSettings.display,
                theme: value,
            },
        }));
        handleSaveSettings('Theme', 'display'); // Save immediately
    };

    const handleDefaultListViewChange = (value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            display: {
                ...prevSettings.display,
                defaultListView: value,
            },
        }));
        handleSaveSettings('Default Listings View', 'display'); // Save immediately
    };

    const handleSidebarToggle = createToggleHandler('display', 'sidebarPermanentlyExpanded', 'Sidebar permanently expanded', 'sidebar_permanently_expanded');
    // We update the global sidebar state when the setting is toggled
    useEffect(() => {
        if (settings && setIsCollapsed) {
            setIsCollapsed(!settings.display.sidebarPermanentlyExpanded);
        }
    }, [settings?.display.sidebarPermanentlyExpanded, setIsCollapsed]);


    const handleLanguageChange = (value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            display: {
                ...prevSettings.display,
                language: value,
            },
        }));
        handleSaveSettings('Language', 'display'); // Save immediately
    };


    // Options for dropdowns
    const themeOptions = [
        { value: 'light', label: 'Light', icon: <Sun size={20} /> },
        { value: 'dark', label: 'Dark', icon: <Moon size={20} /> },
        { value: 'system', label: 'System', icon: <Monitor size={20} /> },
    ];

    const defaultListViewOptions = [
        { value: 'simple', label: 'Table View', icon: <LayoutList size={20} /> },
        { value: 'graphical', label: 'Grid View', icon: <LayoutGrid size={20} /> },
    ];

    const languageOptions = [
        { value: 'en', label: 'English', icon: <Globe size={20} /> },
        { value: 'es', label: 'Spanish', icon: <Globe size={20} /> },
        { value: 'fr', label: 'French', icon: <Globe size={20} /> },
    ];

    // Timezone options (example for UTC+1, assuming Lagos, Nigeria) (from ProfileSettings.js)
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

    // Currency options for the dropdown (from ProfileSettings.js)
    const currencyOptions = [
        { value: 'NGN', label: '₦ Nigerian Naira' },
        { value: 'USD', label: '$ US Dollar' },
        { value: 'EUR', label: '€ Euro' },
        { value: 'GBP', label: '£ British Pound' },
        { value: 'JPY', label: '¥ Japanese Yen' },
    ];

    // Dynamically generate Default Landing Page options based on user role (from ProfileSettings.js)
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


    // Search term for settings
    const [searchTerm, setSearchTerm] = useState('');

    // Comprehensive list of searchable items, grouped by section for robust filtering
    const searchableContent = {
        "General": [ // Renamed from "Display"
            "Display Settings", "Customize the application's appearance.", "Theme", "Choose your preferred theme (Light, Dark, System).", "Default Listings Display", "Select how listings are displayed by default (Table, Grid).", "Permanently Expand Sidebar (Desktop Only)", "Keep the sidebar expanded by default on desktop.", "Language", "Select your preferred language.",
            "Timezone", "Select Timezone", // Added from ProfileSettings
            "Default Currency", "Select Currency", "Nigerian Naira", "US Dollar", "Euro", "British Pound", "Japanese Yen", // Added from ProfileSettings
            "Default Landing Page", "Select Landing Page", "Home", "Profile", "Dashboard", "Inquiries", // Added from ProfileSettings
        ],
        "Security": [
            "Security", "Manage your account security.", "Two-Factor Authentication (2FA)", "Add an extra layer of security to your account.", "Change Password", "Update your account password."
        ],
        "Notifications": [
            "Notifications", "Control how you receive alerts.", "Email Notifications", "Receive updates via email.", "In-App Notifications", "See notifications directly in the dashboard.", "New Inquiry Alert", "Get notified about new client inquiries.", "Ticket Update Alert", "Receive alerts when an inquiry you're handling is updated."
        ],
        "AgentPreferences": [
            "Agent Preferences", "Personalize your agent workflow.", "Availability Status", "Set your availability for new inquiries and assignments.", "Default Email Signature", "Customize your default signature for outgoing emails.", "Auto-Assign New Inquiries", "Automatically accept new client inquiries assigned to you."
        ]
    };

    // Filter sections based on search term
    const filterSection = (sectionKey) => {
        if (!searchTerm) {
            return true; // Show all sections if no search term
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const content = searchableContent[sectionKey];
        if (!content) {
            return false;
        }
        return content.some(item => item.toLowerCase().includes(lowerCaseSearchTerm));
    };


    // Adjusted contentShift based on isCollapsed and isMobile states, consistent with other agent pages
    const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

    if (loading || userSettingsLoading) {
        return (
            <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
                {/* Sidebar placeholder */}
                <div className={`fixed top-0 left-0 h-full ${isCollapsed ? 'w-20' : 'w-64'} ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300`}>
                  <div className={`h-full animate-pulse flex flex-col p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`h-8 w-3/4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-6`}></div>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={`h-10 w-full rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-3`}></div>
                    ))}
                  </div>
                </div>

                <motion.div
                    animate={{ marginLeft: contentShift }}
                    transition={{ duration: 0.3 }}
                    initial={false}
                    className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
                    style={{ minWidth: `calc(100% - ${contentShift}px)` }}
                >
                    <div className={`h-10 w-1/2 md:w-1/4 rounded mx-auto mb-6 animate-pulse ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}></div>

                    <div className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-6 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}>
                        <div className="flex justify-between items-center">
                            <div className={`h-8 w-32 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                            <div className={`h-10 w-1/3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
                        </div>

                        {/* General Settings Skeleton */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DropdownSkeleton darkMode={darkMode} />
                                <DropdownSkeleton darkMode={darkMode} />
                                <SwitchSkeleton darkMode={darkMode} />
                                <DropdownSkeleton darkMode={darkMode} />
                                <DropdownSkeleton darkMode={darkMode} />
                                <DropdownSkeleton darkMode={darkMode} />
                                <DropdownSkeleton darkMode={darkMode} />
                                <DropdownSkeleton darkMode={darkMode} />
                            </div>
                        </div>

                        {/* Notifications Skeleton */}
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className={`h-8 w-40 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <SwitchSkeleton darkMode={darkMode} />
                                <SwitchSkeleton darkMode={darkMode} />
                                <SwitchSkeleton darkMode={darkMode} />
                                <SwitchSkeleton darkMode={darkMode} />
                            </div>
                        </div>

                        {/* Agent Preferences Skeleton */}
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className={`h-8 w-48 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <SwitchSkeleton darkMode={darkMode} />
                                <TextAreaWithButtonSkeleton darkMode={darkMode} />
                                <SwitchSkeleton darkMode={darkMode} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-xl font-semibold text-red-500">Error: Settings data not available.</div>
            </div>
        );
    }


    return (
        <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
            {/* Mobile Sidebar Toggle Button */}
            {isMobile && (
                <motion.button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-white"}`}
                    initial={false}
                    animate={{ rotate: isSidebarOpen ? 180 : 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={isSidebarOpen ? 'close' : 'menu'} initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </motion.div>
                    </AnimatePresence>
                </motion.button>
            )}

            <AgentSidebar
                collapsed={isMobile ? false : isCollapsed}
                setCollapsed={setIsCollapsed}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <motion.div
                key={isMobile ? 'mobile' : 'desktop'}
                animate={{ marginLeft: contentShift }}
                transition={{ duration: 0.3 }}
                initial={false}
                className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
                style={{ minWidth: `calc(100% - ${contentShift}px)` }}
            >
                {/* Mobile View Main Header */}
                <div className="md:hidden flex items-center justify-center mb-4">
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Settings</h1>
                </div>

                {/* Desktop View Main Header */}
                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Settings</h1>
                </div>

                {/* MessageBox is now conditionally rendered based on message state from MessageContext */}
                {/* No direct message state needed here as MessageContext takes over */}
                {/* <MessageBox message={message} type={messageType} onClose={() => setMessage('')} /> */}

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-6 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                >
                    {/* General Settings Section Header & Search */}
                    <div className="flex justify-between items-center">
                        <h3 className={`text-xl md:text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>General</h3>
                        <div className="relative w-full md:w-1/3 ml-4">
                            <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                            />
                        </div>
                    </div>

                    {filterSection("General") && ( // Filter on the new "General" section
                        <div className="space-y-6"> {/* Removed pt-6 and border-t from the first section */}
                            {/* Display Settings (now directly under General, no subheading) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Theme</label>
                                    <Dropdown placeholder="Select Theme" options={themeOptions} value={settings.display.theme} onChange={handleThemeChange} className="w-full" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Choose your preferred theme.</p>
                                </div>
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Default Listings Display</label>
                                    <Dropdown placeholder="Select View Mode" options={defaultListViewOptions} value={settings.display.defaultListView} onChange={handleDefaultListViewChange} className="w-full" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select how listings are displayed by default.</p>
                                </div>
                                <Switch label="Permanently Expand Sidebar (Desktop Only)" description="Keep the sidebar expanded by default on desktop." isOn={settings.display.sidebarPermanentlyExpanded} handleToggle={handleSidebarToggle} />
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Language</label>
                                    <Dropdown placeholder="Select Language" options={languageOptions} value={settings.display.language} onChange={handleLanguageChange} className="w-full" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select your preferred language.</p>
                                </div>

                                {/* General App Settings from ProfileSettings.js */}
                                {/* Language */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`} htmlFor="user_language">Language</label>
                                    <Dropdown
                                        options={languageOptions}
                                        value={userSettings.language}
                                        onChange={(value) => handleUserSettingsUpdate('language', value)}
                                        placeholder="Select Language"
                                        className="w-full"
                                    />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Set your preferred language for the application.</p>
                                </div>

                                {/* Timezone */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`} htmlFor="user_timezone">Timezone</label>
                                    <Dropdown
                                        options={timezoneOptions}
                                        value={userSettings.timezone}
                                        onChange={(value) => handleUserSettingsUpdate('timezone', value)}
                                        placeholder="Select Timezone"
                                        className="w-full"
                                    />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Choose your local timezone for accurate timestamps.</p>
                                </div>

                                {/* Currency */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`} htmlFor="user_currency">Default Currency</label>
                                    <Dropdown
                                        options={currencyOptions}
                                        value={userSettings.currency}
                                        onChange={(value) => handleUserSettingsUpdate('currency', value)}
                                        placeholder="Select Currency"
                                        className="w-full"
                                    />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select the default currency for financial displays.</p>
                                </div>

                                {/* Default Landing Page */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`} htmlFor="user_default_landing_page">Default Landing Page</label>
                                    <Dropdown
                                        options={defaultLandingPageOptions()} // Call the function to get dynamic options
                                        value={userSettings.default_landing_page}
                                        onChange={(value) => handleUserSettingsUpdate('default_landing_page', value)}
                                        placeholder="Select Landing Page"
                                        className="w-full"
                                    />
                                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-2`}>
                                        Choose the page you see after logging in.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {filterSection("Notifications") && (
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Notifications</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Switch
                                    label="Email Notifications"
                                    description="Receive updates via email."
                                    isOn={settings.notifications.emailNotifications}
                                    handleToggle={createToggleHandler('notifications', 'emailNotifications', 'Email notifications', 'email_notifications')}
                                />
                                <Switch
                                    label="In-App Notifications"
                                    description="See notifications directly in the dashboard."
                                    isOn={settings.notifications.inAppNotifications}
                                    handleToggle={createToggleHandler('notifications', 'inAppNotifications', 'In-App notifications', 'in_app_notifications')}
                                />
                                <Switch
                                    label="New Inquiry Alert"
                                    description="Get notified about new client inquiries."
                                    isOn={settings.notifications.newTicketAlert}
                                    handleToggle={createToggleHandler('notifications', 'newTicketAlert', 'New Inquiry Alert', 'new_inquiry_alert')}
                                />
                                <Switch
                                    label="Ticket Update Alert"
                                    description="Receive alerts when an inquiry you're handling is updated."
                                    isOn={settings.notifications.ticketUpdateAlert}
                                    handleToggle={createToggleHandler('notifications', 'ticketUpdateAlert', 'Ticket Update Alert', 'ticket_update_alert')}
                                />
                            </div>
                        </div>
                    )}

                    {filterSection("AgentPreferences") && (
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Agent Preferences</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <Switch
                                    label="Availability Status"
                                    description="Set your availability for new inquiries and assignments."
                                    isOn={settings.agentPreferences.isAvailable}
                                    handleToggle={createToggleHandler('agentPreferences', 'isAvailable', 'Availability status', 'is_available')}
                                />
                                <div>
                                    <label htmlFor="defaultSignature" className={`block text-lg font-semibold mb-2 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Default Email Signature</label>
                                    <textarea
                                        id="defaultSignature"
                                        value={settings.agentPreferences.defaultSignature} // This will now be an empty string if null/undefined
                                        onChange={(e) => handleInputChange(e, 'agentPreferences', 'defaultSignature')}
                                        className={`w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                        rows="3"
                                        placeholder="Your default email signature"
                                    />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Customize your default signature for outgoing emails.</p>
                                    <button onClick={() => handleSaveSettings('Default Email Signature', 'agentPreferences')} className="w-full md:w-auto mt-4 py-2 px-6 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-colors">Save Signature</button>
                                </div>
                                <Switch
                                    label="Auto-Assign New Inquiries"
                                    description="Automatically accept new client inquiries assigned to you."
                                    isOn={settings.agentPreferences.autoAssignTickets}
                                    handleToggle={createToggleHandler('agentPreferences', 'autoAssignTickets', 'Auto-assign tickets', 'auto_assign_inquiries')}
                                />
                            </div>
                        </div>
                    )}

                </motion.div>
            </motion.div>
        </div>
    );
};

export default AgentSettings;

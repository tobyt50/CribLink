import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Menu, X, Monitor, Sun, Moon, LayoutGrid, LayoutList, ChevronDownIcon, Bell, Mail, Shield, Zap, Megaphone, Server, Key, HardDrive, Clock, ClipboardList, Search, Languages, Palette, Link, Landmark, Loader, Save } from 'lucide-react'; // Added new icons
import AdminSidebar from '../../components/admin/Sidebar.js';
import { useTheme } from '../../layouts/AppShell.js';
import { useMessage } from '../../context/MessageContext.js';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook
import axiosInstance from '../../api/axiosInstance'; // Import axiosInstance

// Dropdown component from other admin files
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

// Reusable Switch component
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

const AdminSettings = () => {
    // Destructure themePreference and setThemePreference from useTheme
    const { darkMode, themePreference, setThemePreference } = useTheme();
    const { showMessage } = useMessage();
    const { user } = useAuth(); // Get user from AuthContext

    // UI State
    const [defaultListView, setDefaultListView] = useState(() => localStorage.getItem('defaultListingsView') || 'simple');
    const [sidebarPermanentlyExpanded, setSidebarPermanentlyExpanded] = useState(() => localStorage.getItem('sidebarPermanentlyExpanded') === 'true');

    // Notification Settings State
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [inAppNotifications, setInAppNotifications] = useState(true);

    // Email Settings State
    const [senderEmail, setSenderEmail] = useState('admin@example.com');
    const [smtpHost, setSmtpHost] = useState('smtp.example.com');

    // Security Settings State
    const [require2FA, setRequire2FA] = useState(false);
    const [minPasswordLength, setMinPasswordLength] = useState(() => parseInt(localStorage.getItem('minPasswordLength')) || 8);

    // Integrations Settings State
    const [crmIntegrationEnabled, setCrmIntegrationEnabled] = useState(false);
    const [analyticsId, setAnalyticsId] = useState(() => localStorage.getItem('analyticsId') || '');

    // Content Moderation
    const [autoApproveListings, setAutoApproveListings] = useState(() => localStorage.getItem('autoApproveListings') === 'true');
    const [enableComments, setEnableComments] = useState(() => localStorage.getItem('enableComments') === 'true');

    // System Maintenance
    const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('maintenanceMode') === 'true');
    const [databaseBackupScheduled, setDatabaseBackupScheduled] = useState(() => localStorage.getItem('databaseBackupScheduled') === 'true');

    // State for general user settings (moved from ProfileSettings.js)
    const [userSettings, setUserSettings] = useState({
        language: 'en',
        timezone: 'UTC+1',
        currency: 'NGN',
        default_landing_page: '/',
        notification_email: '', // Added for consistency, though not used in ProfileSettings.js notifications
        preferred_communication_channel: 'email', // Added for consistency
    });
    const [userSettingsLoading, setUserSettingsLoading] = useState(true); // For userSettings fetch

    // Search term for settings
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('settingsSearchTerm') || '');
    // State for mobile search bar expansion
    const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

    const token = localStorage.getItem("token");

    // Fetch User Settings (from ProfileSettings.js)
    const fetchUserSettings = useCallback(async () => {
        setUserSettingsLoading(true);
        try {
            const response = await axiosInstance.get(`${process.env.REACT_APP_API_BASE_URL}/users/profile`, {
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
        if (token) {
            fetchUserSettings();
        }
    }, [token, fetchUserSettings]);

    // New handler to update user settings and save immediately
    const handleUserSettingsUpdate = async (name, value) => {
        setUserSettings(prev => ({
            ...prev,
            [name]: value,
        }));
        try {
            // No need for userSettingsLoading state for individual saves as it's quick
            const payload = { [name]: value }; // Send only the changed setting
            await axiosInstance.put(`${process.env.REACT_APP_API_BASE_URL}/users/update`, payload, {
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


    // Dark Mode Options
    const darkModeOptions = [
        { value: 'light', label: 'Light', icon: <Sun size={20} /> },
        { value: 'dark', label: 'Dark', icon: <Moon size={20} /> },
        { value: 'system', label: 'System', icon: <Monitor size={20} /> },
    ];

    // Language options (from ProfileSettings.js)
    const languageOptions = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
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


    // Sidebar State
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
    const [activeSection, setActiveSection] = useState('settings');

    useEffect(() => {
        if (!isMobile) {
            setIsCollapsed(!sidebarPermanentlyExpanded);
        }
    }, [sidebarPermanentlyExpanded, isMobile, setIsCollapsed]);


    // LocalStorage Sync Effect
    useEffect(() => {
        localStorage.setItem('defaultListingsView', defaultListView);
        localStorage.setItem('sidebarPermanentlyExpanded', sidebarPermanentlyExpanded);
        localStorage.setItem('minPasswordLength', minPasswordLength);
        localStorage.setItem('analyticsId', analyticsId);
        localStorage.setItem('autoApproveListings', autoApproveListings);
        localStorage.setItem('enableComments', enableComments);
        localStorage.setItem('maintenanceMode', maintenanceMode);
        localStorage.setItem('databaseBackupScheduled', databaseBackupScheduled);
        localStorage.setItem('settingsSearchTerm', searchTerm);
    }, [defaultListView, sidebarPermanentlyExpanded, minPasswordLength, analyticsId, autoApproveListings, enableComments, maintenanceMode, databaseBackupScheduled, searchTerm]);

    // Handlers
    const handleDefaultListViewChange = (value) => {
        setDefaultListView(value);
        showMessage('Default listings view updated.', 'success');
    };

    const handleSidebarToggle = () => {
        setSidebarPermanentlyExpanded(prev => {
            const newState = !prev;
            setIsCollapsed(!newState);
            showMessage(`Sidebar permanently ${newState ? 'expanded' : 'collapsed'}`, 'success');
            return newState;
        });
    };

    const handleDarkModeChange = (value) => {
        // Use setThemePreference from AppShell to update the theme
        setThemePreference(value);
        showMessage(`Theme set to ${value}.`, 'success');
    };

    const createToggleHandler = (setter, name) => () => {
        setter(prev => {
            const newState = !prev;
            showMessage(`${name} ${newState ? 'enabled' : 'disabled'}.`, 'success');
            return newState;
        });
    };

    const handleEmailNotificationsToggle = createToggleHandler(setEmailNotifications, 'Email notifications');
    const handleSmsNotificationsToggle = createToggleHandler(setSmsNotifications, 'SMS notifications');
    const handleInAppNotificationsToggle = createToggleHandler(setInAppNotifications, 'In-app notifications');
    const handleRequire2FAToggle = createToggleHandler(setRequire2FA, '2FA requirement');
    const handleCrmIntegrationToggle = createToggleHandler(setCrmIntegrationEnabled, 'CRM Integration');
    const handleAutoApproveListingsToggle = createToggleHandler(setAutoApproveListings, 'Auto-approve listings');
    const handleEnableCommentsToggle = createToggleHandler(setEnableComments, 'Comments');
    const handleMaintenanceModeToggle = createToggleHandler(setMaintenanceMode, 'Maintenance mode');
    const handleToggleDatabaseBackupScheduling = createToggleHandler(setDatabaseBackupScheduled, 'Database backup scheduling');

    const handleSaveSettings = (settingName) => () => {
        showMessage(`${settingName} saved (frontend simulation).`, 'success');
    };


    const handleClearCache = () => showMessage('Cache cleared successfully!', 'success');
    const handleBackupDatabase = () => showMessage('Database backup initiated.', 'info');
    const handleViewErrorLogs = () => showMessage('Opening error logs (simulated).', 'info');

    const inputFieldStyles =
        `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
        darkMode
            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
        }`;
    const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;
    const inputGroupStyles = "flex flex-col";


    // Comprehensive list of searchable items, grouped by section for robust filtering
    const searchableContent = {
        "General": [
            "General Settings", // Section title
            "Theme", "Choose your preferred theme.",
            "Default Listings Display", "Select how listings are displayed by default.",
            "Table View", "Grid View",
            "Permanently Expand Sidebar (Desktop Only)", "Keep the sidebar expanded by default on desktop.",
            "Language", "Select Language", "English", "Spanish", "French", "German", // Added from ProfileSettings
            "Timezone", "Select Timezone", // Added from ProfileSettings
            "Default Currency", "Select Currency", "Nigerian Naira", "US Dollar", "Euro", "British Pound", "Japanese Yen", // Added from ProfileSettings
            "Default Landing Page", "Select Landing Page", "Home", "Profile", "Dashboard", "Inquiries", // Added from ProfileSettings
        ],
        "Notifications": [
            "Notifications", // Section title
            "Email Notifications", "Receive updates via email.",
            "SMS Notifications", "Get alerts on your phone.",
            "In-App Notifications", "See notifications in the dashboard."
        ],
        "Email": [
            "Email Settings", // Section title
            "Sender Email Address", "SMTP Host",
            "Save Email Settings"
        ],
        "Security": [
            "Security", // Section title
            "Require 2FA for Admin Login", "Enhance security for all admin accounts.",
            "Minimum Password Length", "Set the minimum characters for user passwords.",
            "Save Policy"
        ],
        "Integrations": [
            "Integrations", // Section title
            "Enable CRM Integration", "Sync data with your external CRM.",
            "Google Analytics ID", "Integrate Google Analytics for traffic monitoring.",
            "Save Analytics"
        ],
        "Content Moderation": [
            "Content Moderation", // Section title
            "Auto-Approve New Listings", "Approve new agent listings automatically.",
            "Enable User Comments", "Allow comments on property listings."
        ],
        "System": [
            "System & Maintenance", // Section title
            "Enable Maintenance Mode", "Take the site offline for updates.",
            "Application Cache", "Clear temporary data.", "Clear",
            "Automated Database Backups", "Schedule regular database backups.",
            "Manual Backup", "Create an on-demand backup.", "Backup",
            "View Error Logs", "Access system error logs for debugging.", "View Logs"
        ]
    };

    // Filter sections based on search term, matching any letter and any case
    const filterSection = (sectionKey) => {
        // If no search term, always show the section
        if (!searchTerm) {
            return true;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const content = searchableContent[sectionKey];

        // If the section key doesn't have defined searchable content, hide it when searching
        if (!content) {
            return false;
        }

        // Check if any of the content strings for this section match the search term
        // This includes the section title, labels, and descriptions
        return content.some(item => item.toLowerCase().includes(lowerCaseSearchTerm));
    };

    const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

    return (
        <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
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

            <AdminSidebar
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

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-8 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                >
                    {/* General Settings Section Header & Search - Now consistent for both mobile and desktop */}
                    <div className="flex justify-between items-center">
                        <h3 className={`text-xl md:text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>General</h3> {/* Changed to h3, text-xl for mobile, md:text-2xl for desktop */}
                        <div className="relative w-full md:w-1/3 ml-4"> {/* md:w-1/2 for desktop width matching the card */}
                            <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                            <input
                                type="text"
                                placeholder="Search settings..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                            />
                        </div>
                    </div>

                    {filterSection("General") && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Existing Theme Setting */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Theme</label>
                                    {/* Use themePreference for the value, and handleDarkModeChange to set the new preference */}
                                    <Dropdown placeholder="Select Theme" options={darkModeOptions} value={themePreference} onChange={handleDarkModeChange} className="w-full" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Choose your preferred theme.</p>
                                </div>
                                {/* Existing Default Listings Display */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Default Listings Display</label>
                                    <Dropdown placeholder="Select View Mode" options={[{ value: 'simple', label: 'Table View', icon: <LayoutList size={20} /> }, { value: 'graphical', label: 'Grid View', icon: <LayoutGrid size={20} /> }]} value={defaultListView} onChange={handleDefaultListViewChange} className="w-full" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select how listings are displayed by default.</p>
                                </div>
                                {/* Existing Sidebar Toggle */}
                                <Switch label="Permanently Expand/Collapse Sidebar" description="Keep the sidebar expanded by default on desktop." isOn={sidebarPermanentlyExpanded} handleToggle={handleSidebarToggle} />

                                {/* General App Settings from ProfileSettings.js */}
                                {/* Language */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={labelStyles} htmlFor="language">Language</label>
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
                                    <label className={labelStyles} htmlFor="timezone">Timezone</label>
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
                                    <label className={labelStyles} htmlFor="currency">Default Currency</label>
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
                                    <label className={labelStyles} htmlFor="default_landing_page">Default Landing Page</label>
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
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Notifications</h3> {/* Changed to h3, text-xl for mobile, md:text-2xl for desktop */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Switch label="Email Notifications" description="Receive updates via email." isOn={emailNotifications} handleToggle={handleEmailNotificationsToggle} />
                                <Switch label="SMS Notifications" description="Get alerts on your phone." isOn={smsNotifications} handleToggle={handleSmsNotificationsToggle} />
                                <Switch label="In-App Notifications" description="See notifications in the dashboard." isOn={inAppNotifications} handleToggle={handleInAppNotificationsToggle} />
                            </div>
                        </div>
                    )}

                    {filterSection("Email") && (
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Email Settings</h3> {/* Changed to h3, text-xl for mobile, md:text-2xl for desktop */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="senderEmail" className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Sender Email Address</label>
                                    <input type="email" id="senderEmail" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className={`w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} placeholder="e.g., noreply@yourdomain.com" />
                                </div>
                                <div>
                                    <label htmlFor="smtpHost" className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>SMTP Host</label>
                                    <input type="text" id="smtpHost" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className={`w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} placeholder="e.g., smtp.gmail.com" />
                                </div>
                            </div>
                            <button onClick={handleSaveSettings('Email settings')} className="w-full md:w-auto mt-4 py-2 px-6 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-colors">Save Email Settings</button>
                        </div>
                    )}

                    {filterSection("Security") && (
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Security</h3> {/* Changed to h3, text-xl for mobile, md:text-2xl for desktop */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <Switch label="Require 2FA for Admin Login" description="Enhance security for all admin accounts." isOn={require2FA} handleToggle={handleRequire2FAToggle} />
                                <div>
                                    <label htmlFor="minPasswordLength" className={`block text-lg font-semibold mb-2 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Minimum Password Length</label>
                                    <input type="number" id="minPasswordLength" value={minPasswordLength} onChange={(e) => setMinPasswordLength(parseInt(e.target.value))} className={`w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} min="1" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Set the minimum characters for user passwords.</p>
                                    <button onClick={handleSaveSettings('Password policy')} className="w-full md:w-auto mt-4 py-2 px-6 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-colors">Save Policy</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {filterSection("Integrations") && (
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Integrations</h3> {/* Changed to h3, text-xl for mobile, md:text-2xl for desktop */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <Switch label="Enable CRM Integration" description="Sync data with your external CRM." isOn={crmIntegrationEnabled} handleToggle={handleCrmIntegrationToggle} />
                                <div>
                                    <label htmlFor="analyticsId" className={`block text-lg font-semibold mb-2 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Google Analytics ID</label>
                                    <input type="text" id="analyticsId" value={analyticsId} onChange={(e) => setAnalyticsId(e.target.value)} className={`w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} placeholder="UA-XXXXX-Y" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Integrate Google Analytics for traffic monitoring.</p>
                                    <button onClick={handleSaveSettings('Analytics settings')} className="w-full md:w-auto mt-4 py-2 px-6 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-colors">Save Analytics</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {filterSection("Content Moderation") && (
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Content Moderation</h3> {/* Changed to h3, text-xl for mobile, md:text-2xl for desktop */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <Switch label="Auto-Approve New Listings" description="Approve new agent listings automatically." isOn={autoApproveListings} handleToggle={handleAutoApproveListingsToggle} />
                                <Switch label="Enable User Comments" description="Allow comments on property listings." isOn={enableComments} handleToggle={handleEnableCommentsToggle} />
                            </div>
                        </div>
                    )}

                    {filterSection("System") && (
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>System & Maintenance</h3> {/* Changed to h3, text-xl for mobile, md:text-2xl for desktop */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Switch label="Enable Maintenance Mode" description="Take the site offline for updates." isOn={maintenanceMode} handleToggle={handleMaintenanceModeToggle} />
                                <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <div>
                                        <span className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Application Cache</span>
                                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>Clear temporary data.</p>
                                    </div>
                                    <button onClick={handleClearCache} className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700">Clear</button>
                                </div>
                                <Switch label="Automated Database Backups" description="Schedule regular database backups." isOn={databaseBackupScheduled} handleToggle={handleToggleDatabaseBackupScheduling} />
                                <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <div>
                                        <span className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Manual Backup</span>
                                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>Create an on-demand backup.</p>
                                    </div>
                                    <button onClick={handleBackupDatabase} className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700">Backup</button>
                                </div>
                                <div className={`md:col-span-2 p-4 rounded-xl border flex items-center justify-between ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <div>
                                        <span className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>View Error Logs</span>
                                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>Access system error logs for debugging.</p>
                                    </div>
                                    <button onClick={handleViewErrorLogs} className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold shadow-md hover:bg-green-700">View Logs</button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AdminSettings;

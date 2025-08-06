import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { useTheme } from '../../layouts/AppShell';
import { useMessage } from '../../context/MessageContext';
import {
  User, Shield, Bell, Settings as SettingsIcon, Sun, Moon, Monitor, LayoutGrid, LayoutList,
  ChevronDownIcon, Mail, Home, Tag, MapPin, DollarSign, Search, X, Menu, Globe, CheckCircle, XCircle,
  Bed, Bath, Languages, Palette, Link, Landmark, Loader, Save
} from 'lucide-react';
import ClientSidebar from '../../components/client/Sidebar';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useAuth } from '../../context/AuthContext';

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
        <X size={18} />
      </button>
    </div>
  );
};

// Reusable Dropdown Component
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
const Switch = ({ isOn, handleToggle, label, description, darkMode }) => { // Added darkMode prop
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

// Loading Skeleton Component
const LoadingSkeleton = ({ darkMode, userRole }) => {
    const skeletonBgClass = darkMode ? "bg-gray-700" : "bg-gray-200";
    const skeletonPulseClass = "animate-pulse";

    const renderSectionSkeleton = (title, items, isGrid = true) => (
        <div className="space-y-6">
            <div className={`h-8 w-48 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}></div> {/* Section Title */}
            <div className={`${isGrid ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}`}>
                {items.map((item, index) => (
                    <div key={index} className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                        <div className={`h-6 w-3/4 rounded-md mb-3 ${skeletonBgClass} ${skeletonPulseClass}`}></div> {/* Label */}
                        {item.type === 'dropdown' && (
                            <div className={`h-10 w-full rounded-xl ${skeletonBgClass} ${skeletonPulseClass}`}></div>
                        )}
                        {item.type === 'switch' && (
                            <div className="flex items-center justify-between">
                                <div className={`h-6 w-3/4 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}></div>
                                <div className={`h-6 w-11 rounded-full ${skeletonBgClass} ${skeletonPulseClass}`}></div>
                            </div>
                        )}
                        {item.type === 'input' && (
                            <div className={`h-10 w-full rounded-xl ${skeletonBgClass} ${skeletonPulseClass}`}></div>
                        )}
                        <div className={`h-4 w-1/2 rounded-md mt-2 ${skeletonBgClass} ${skeletonPulseClass}`}></div> {/* Description */}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-3xl p-6 shadow space-y-8 max-w-full`}
        >
            {/* General Settings Skeleton */}
            {renderSectionSkeleton("General", [
                { type: 'dropdown' }, { type: 'dropdown' }, { type: 'switch' }, { type: 'dropdown' },
                { type: 'dropdown' }, { type: 'dropdown' }, { type: 'dropdown' }, { type: 'dropdown' }
            ])}

            {/* Notifications Skeleton */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
                {renderSectionSkeleton("Notifications", [
                    { type: 'switch' }, { type: 'switch' }, { type: 'switch' },
                    { type: 'switch' }, { type: 'switch' }
                ], true)}
            </div>

            {/* Property Preferences Skeleton (only for client role) */}
            {userRole === 'client' && (
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
                    <div className={`h-8 w-64 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}></div> {/* Property Preferences Title */}
                    <div className={`h-4 w-3/4 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}></div> {/* Description */}
                    {renderSectionSkeleton("Property Preferences", [
                        { type: 'dropdown' }, { type: 'input' }, { type: 'input' },
                        { type: 'input' }, { type: 'dropdown' }, { type: 'dropdown' }
                    ], true)}
                    <div className="flex justify-center mt-6">
                        <div className={`h-12 w-64 rounded-xl ${skeletonBgClass} ${skeletonPulseClass}`}></div> {/* Save Button */}
                    </div>
                </div>
            )}
        </motion.div>
    );
};


const ClientSettings = () => {
    const { darkMode, themePreference, setThemePreference } = useTheme();
    const { showMessage } = useMessage();
    const { user } = useAuth();

    // Initialize settings state with defaults, including sidebar_permanently_expanded from localStorage
    const [settings, setSettings] = useState(() => ({
        profile: { name: 'N/A', email: 'N/A' },
        notifications: {
            emailNotifications: true,
            inAppNotifications: true,
            newListingAlert: true,
            priceDropAlert: true,
            favouriteUpdateAlert: true,
        },
        preferences: {
            preferred_property_type: 'any',
            preferred_location: '',
            min_price: 0,
            max_price: 1000000000,
            min_bedrooms: 0,
            min_bathrooms: 0,
        },
        display: {
            theme: localStorage.getItem('themePreference') || 'system',
            defaultListView: localStorage.getItem('defaultListingsView') || 'graphical',
            sidebar_permanently_expanded: localStorage.getItem('sidebarPermanentlyExpanded') === 'true' || false, // Initialize from localStorage
            language: localStorage.getItem('clientLanguage') || 'en',
        },
    }));
    const [loading, setLoading] = useState(true);

    const [userSettings, setUserSettings] = useState({
        language: 'en',
        timezone: 'UTC+1',
        currency: 'NGN',
        default_landing_page: '/',
        notification_email: '',
        preferred_communication_channel: 'email',
    });
    const [userSettingsLoading, setUserSettingsLoading] = useState(true);

    // Get isCollapsed and setIsCollapsed from useSidebarState
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
    const [activeSection, setActiveSection] = useState('client-settings');

    const token = localStorage.getItem('token');

    const propertyTypeOptions = [
      { value: "any", label: "Any Property Type" },
      { value: "Duplex", label: "Duplex" },
      { value: "Bungalow", label: "Bungalow" },
      { value: "Apartment", label: "Apartment" },
      { value: "Penthouse", label: "Penthouse" },
      { value: "Detached House", label: "Detached House" },
      { value: "Semi-Detached House", label: "Semi-Detached House" },
      { value: "Condo", label: "Condo" },
    ];

    const bedroomOptions = [
      { value: 0, label: "Any Bedrooms" },
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => ({ value: num, label: `${num} Bedroom(s)` })),
    ];

    const bathroomOptions = [
      { value: 0, label: "Any Bathrooms" },
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => ({ value: num, label: `${num} Bathroom(s)` })),
    ];

    const languageOptions = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
    ];

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
        { value: 'UTC+01', label: '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna (West Central Africa)' },
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

    const currencyOptions = [
        { value: 'NGN', label: '₦ Nigerian Naira' },
        { value: 'USD', label: '$ US Dollar' },
        { value: 'EUR', label: '€ Euro' },
        { value: 'GBP', label: '£ British Pound' },
        { value: 'JPY', label: '¥ Japanese Yen' },
    ];

    const defaultLandingPageOptions = useCallback(() => {
        const options = [
            { value: '/', label: 'Home' },
            { value: '/profile/general', label: 'Profile' },
        ];

        if (user?.role) {
            let dashboardPath = '';
            let inquiriesPath = '';
            switch (user.role) {
                case 'admin':
                    dashboardPath = '/admin/dashboard';
                    inquiriesPath = '/admin/inquiries';
                    break;
                case 'agent':
                    dashboardPath = '/agent/dashboard';
                    inquiriesPath = '/agent/inquiries';
                    break;
                case 'client':
                    dashboardPath = '/client/dashboard';
                    inquiriesPath = '/client/inquiries';
                    break;
                default:
                    dashboardPath = '/';
                    inquiriesPath = '/';
            }

            options.unshift({ value: dashboardPath, label: 'Dashboard' });

            if (inquiriesPath && inquiriesPath !== '/') {
                options.unshift({ value: inquiriesPath, label: 'Inquiries' });
            }
        }
        return options;
    }, [user?.role]);

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
        const fetchClientSettings = async () => {
            try {
                setLoading(true);
                if (!token) {
                    showMessage('Authentication token not found. Please log in.', 'error');
                    setLoading(false);
                    return;
                }

                const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const profileData = profileResponse.data;

                let clientSpecificSettings = {};
                let clientPreferences = {};

                try {
                    const clientSettingsResponse = await axios.get(`${API_BASE_URL}/client/settings`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    clientSpecificSettings = clientSettingsResponse.data;
                } catch (error) {
                    console.warn("Client general settings endpoint not found or error fetching. Using defaults.", error);
                    clientSpecificSettings = {
                        email_notifications: true,
                        in_app_notifications: true,
                        new_listing_alert: true,
                        price_drop_alert: true,
                        favourite_update_alert: true,
                        theme: 'system',
                        default_list_view: 'graphical',
                        language: 'en',
                        sidebar_permanently_expanded: false,
                    };
                }

                if (user?.role === 'client') {
                    try {
                        const clientPreferencesRes = await axios.get(`${API_BASE_URL}/clients/${user.user_id}/preferences`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        clientPreferences = clientPreferencesRes.data;
                    } catch (prefError) {
                        console.warn('No client property preferences found or failed to fetch, using defaults.', prefError);
                        clientPreferences = {
                            preferred_property_type: 'any',
                            preferred_location: '',
                            min_price: 0,
                            max_price: 1000000000,
                            min_bedrooms: 0,
                            min_bathrooms: 0,
                        };
                    }
                }

                const fetchedSettings = {
                    profile: {
                        name: profileData.full_name || 'N/A',
                        email: profileData.email || 'N/A',
                    },
                    notifications: {
                        emailNotifications: clientSpecificSettings.email_notifications,
                        inAppNotifications: clientSpecificSettings.in_app_notifications,
                        newListingAlert: clientSpecificSettings.new_listing_alert,
                        priceDropAlert: clientSpecificSettings.price_drop_alert,
                        favouriteUpdateAlert: clientSpecificSettings.favourite_update_alert,
                    },
                    preferences: {
                        preferred_property_type: clientPreferences.preferred_property_type ?? 'any',
                        preferred_location: clientPreferences.preferred_location ?? '',
                        min_price: clientPreferences.min_price ?? 0,
                        max_price: clientPreferences.max_price ?? 1000000000,
                        min_bedrooms: clientPreferences.min_bedrooms ?? 0,
                        min_bathrooms: clientPreferences.min_bathrooms ?? 0,
                    },
                    display: {
                        theme: clientSpecificSettings.theme || localStorage.getItem('themePreference') || 'system',
                        defaultListView: clientSpecificSettings.default_list_view || localStorage.getItem('defaultListingsView') || 'graphical',
                        sidebar_permanently_expanded: clientSpecificSettings.sidebar_permanently_expanded ?? (localStorage.getItem('sidebarPermanentlyExpanded') === 'true' || false),
                        language: clientSpecificSettings.language || localStorage.getItem('clientLanguage') || 'en',
                    },
                };
                setSettings(fetchedSettings);
                // ADDED LOG: Check the value received from the backend
                console.log("Fetched client display settings (from backend):", fetchedSettings.display.sidebar_permanently_expanded);

                // Update local storage for synced values
                localStorage.setItem('themePreference', fetchedSettings.display.theme);
                localStorage.setItem('defaultListingsView', fetchedSettings.display.defaultListView);
                localStorage.setItem('clientLanguage', fetchedSettings.display.language);
                localStorage.setItem('sidebarPermanentlyExpanded', fetchedSettings.display.sidebar_permanently_expanded);

            } catch (error) {
                console.error('Error fetching client settings:', error);
                if (error.response && error.response.status === 401) {
                    showMessage('Session expired or unauthorized. Please log in again.', 'error');
                } else {
                    showMessage('Failed to load settings. Please try again.', 'error');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchClientSettings();
        fetchUserSettings();
    }, [user?.role, token, fetchUserSettings, showMessage]);

    // Sync display settings to localStorage whenever they change
    useEffect(() => {
        if (settings) {
            localStorage.setItem('themePreference', settings.display.theme);
            localStorage.setItem('defaultListingsView', settings.display.defaultListView);
            localStorage.setItem('clientLanguage', settings.display.language);
            localStorage.setItem('sidebarPermanentlyExpanded', settings.display.sidebar_permanently_expanded);
        }
    }, [settings]);

    // This useEffect ensures the sidebar's visual state (isCollapsed) matches the fetched setting on load/setting change
    useEffect(() => {
        if (settings && setIsCollapsed) {
            // If sidebar_permanently_expanded is true, isCollapsed should be false (expanded)
            // If sidebar_permanently_expanded is false, isCollapsed should be true (collapsed)
            setIsCollapsed(!settings.display.sidebar_permanently_expanded);
        }
    }, [settings?.display.sidebar_permanently_expanded, setIsCollapsed]);


    const handleInputChange = (e, section, key) => {
        const { value, type, checked } = e.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [section]: {
                ...prevSettings[section],
                [key]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
            },
        }));
    };

    const handleUserSettingsUpdate = async (name, value) => {
        setUserSettings(prev => ({
            ...prev,
            [name]: value,
        }));
        try {
            const payload = { [name]: value };
            await axios.put(`${API_BASE_URL}/users/update`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage(`${name.replace(/_/g, ' ')} updated successfully!`, "success");
        } catch (error) {
            console.error(`Failed to save ${name}:`, error);
            showMessage(`Failed to save ${name.replace(/_/g, ' ')}. Please try again.`, "error");
        }
    };


    const createToggleHandler = (section, key, messageLabel, dbKey = key) => async () => {
        const newState = !settings[section][key];
        // Optimistically update the UI
        setSettings(prevSettings => ({
            ...prevSettings,
            [section]: {
                ...prevSettings[section],
                [key]: newState,
            },
        }));

        try {
            if (!token) {
                showMessage('Authentication token missing. Please log in.', 'error');
                // Revert UI if token is missing
                setSettings(prevSettings => ({
                    ...prevSettings,
                    [section]: { ...prevSettings[section], [key]: !newState },
                }));
                return;
            }

            const payloadKey = dbKey.replace(/([A-Z])/g, '_$1').toLowerCase(); // e.g., 'sidebar_permanently_expanded'

            let payloadToSend;
            if (section === 'display') {
                // For display section toggles, send the entire display object with the updated toggle
                // Use the *current* state of settings.display, but override the specific toggled key
                const currentDisplaySettings = settings.display; // Get the most recent settings.display
                payloadToSend = {
                    theme: currentDisplaySettings.theme,
                    default_list_view: currentDisplaySettings.defaultListView,
                    language: currentDisplaySettings.language,
                    sidebar_permanently_expanded: newState, // This is the key change: use newState for the toggled item
                };
            } else {
                // For other sections (like notifications), send only the specific toggled field
                payloadToSend = {
                    [payloadKey]: newState,
                };
            }

            console.log(`Payload being sent for toggle (${messageLabel}):`, payloadToSend); // New log

            await axios.put(`${API_BASE_URL}/client/settings`, payloadToSend, {
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
                    [key]: !newState,
                },
            }));
        }
    };

    const handleSaveSettings = async (settingName, sectionToSave, updatedFields = {}) => {
        try {
            if (!settings) return;
            setLoading(true);
            if (!token) {
                showMessage('Authentication token missing. Please log in.', 'error');
                setLoading(false);
                return;
            }
            let payload = {};
            let endpoint = `${API_BASE_URL}/client/settings`;

            if (sectionToSave === 'preferences') {
                payload = {
                    preferred_property_type: settings.preferences.preferred_property_type,
                    preferred_location: settings.preferences.preferred_location,
                    min_price: settings.preferences.min_price,
                    max_price: settings.preferences.max_price,
                    min_bedrooms: settings.preferences.min_bedrooms,
                    min_bathrooms: settings.preferences.min_bathrooms,
                };
                endpoint = `${API_BASE_URL}/clients/${user.user_id}/preferences`;
            } else if (sectionToSave === 'display') {
                 // Merge current settings with any explicitly updated fields
                 const currentDisplaySettings = settings.display;
                 const mergedDisplaySettings = { ...currentDisplaySettings, ...updatedFields };

                 payload = {
                    theme: mergedDisplaySettings.theme,
                    default_list_view: mergedDisplaySettings.defaultListView,
                    language: mergedDisplaySettings.language,
                    sidebar_permanently_expanded: mergedDisplaySettings.sidebar_permanently_expanded,
                 };
                 console.log("Payload for display settings (before axios.put):", payload);
            }

            await axios.put(endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage(`${settingName} saved successfully!`, 'success');
        } catch (error) {
            console.error(`Error saving ${settingName} settings:`, error);
            showMessage(`Failed to save ${settingName}. Please try again.`, 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleThemeChange = (value) => {
        setThemePreference(value);
        setSettings(prevSettings => ({
            ...prevSettings,
            display: { ...prevSettings.display, theme: value },
        }));
        // Pass the specific updated field directly
        handleSaveSettings('Theme', 'display', { theme: value });
    };

    const handleDefaultListViewChange = (value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            display: { ...prevSettings.display, defaultListView: value },
        }));
        // Pass the specific updated field directly
        handleSaveSettings('Default Listings View', 'display', { defaultListView: value });
    };

    const handleLanguageChange = (value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            display: { ...prevSettings.display, language: value },
        }));
        // Pass the specific updated field directly
        handleSaveSettings('Language', 'display', { language: value });
    };

    // Modified handleSidebarToggle to directly interact with useSidebarState
    const handleSidebarToggle = () => {
        setSettings(prevSettings => {
            const newSidebarState = !prevSettings.display.sidebar_permanently_expanded;
            // Immediately update the actual sidebar state via useSidebarState hook
            setIsCollapsed(!newSidebarState); // If newSidebarState is true (expanded), isCollapsed should be false

            // Trigger the save to backend, passing the new state for sidebar_permanently_expanded
            handleSaveSettings('Sidebar permanently expanded', 'display', { sidebar_permanently_expanded: newSidebarState });

            // Return the updated settings state for React's state management
            return {
                ...prevSettings,
                display: {
                    ...prevSettings.display,
                    sidebar_permanently_expanded: newSidebarState,
                },
            };
        });
    };


    const themeOptions = [
        { value: 'light', label: 'Light', icon: <Sun size={20} /> },
        { value: 'dark', label: 'Dark', icon: <Moon size={20} /> },
        { value: 'system', label: 'System', icon: <Monitor size={20} /> },
    ];

    const defaultListViewOptions = [
        { value: 'simple', label: 'Table View', icon: <LayoutList size={20} /> },
        { value: 'graphical', label: 'Grid View', icon: <LayoutGrid size={20} /> },
    ];

    const [searchTerm, setSearchTerm] = useState('');

    const searchableContent = {
        "General": [
            "Display Settings", "Customize the application's appearance.", "Theme", "Choose your preferred theme (Light, Dark, System).", "Default Listings Display", "Select how listings are displayed by default (Table, Grid).", "Permanently Expand Sidebar (Desktop Only)", "Keep the sidebar expanded by default on desktop.", "Language", "Select your preferred language.",
            "Timezone", "Select Timezone",
            "Default Currency", "Select Currency", "Nigerian Naira", "US Dollar", "Euro", "British Pound", "Japanese Yen",
            "Default Landing Page", "Select Landing Page", "Home", "Profile", "Dashboard", "Inquiries",
        ],
        "Notifications": [
            "Notifications", "Control how you receive alerts.", "Email Notifications", "Receive updates via email.", "In-App Notifications", "See notifications directly in the dashboard.", "New Listing Alert", "Get notified about new property listings matching your criteria.", "Price Drop Alert", "Receive alerts for price reductions on favorite or saved listings.", "Favorite Update Alert", "Get notified when there are updates to your favorited properties."
        ],
        "Property Preferences": [
            "Property Preferences", "Set your preferences for property recommendations and alerts.", "Property Type", "Any Property Type", "Duplex", "Bungalow", "Apartment", "Penthouse", "Detached House", "Semi-Detached House", "Condo", "Preferred Location", "Min Price", "Max Price", "Min Bedrooms", "Min Bathrooms"
        ]
    };

    const filterSection = (sectionKey) => {
        if (!searchTerm) {
            return true;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const content = searchableContent[sectionKey];
        if (!content) {
            return false;
        }
        return content.some(item => item.toLowerCase().includes(lowerCaseSearchTerm));
    };

    const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

    if (loading || userSettingsLoading) {
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

                <ClientSidebar
                    collapsed={isMobile ? false : (settings ? !settings.display.sidebar_permanently_expanded : isCollapsed)}
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
                    <div className="md:hidden flex items-center justify-center mb-4">
                        <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Settings</h1>
                    </div>

                    <div className="hidden md:block mb-6">
                        <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Settings</h1>
                    </div>
                    <LoadingSkeleton darkMode={darkMode} userRole={user?.role} />
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

    const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

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

            <ClientSidebar
                collapsed={isMobile ? false : (settings ? !settings.display.sidebar_permanently_expanded : isCollapsed)}
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
                <div className="md:hidden flex items-center justify-center mb-4">
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Settings</h1>
                </div>

                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Settings</h1>
                </div>

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

                    {filterSection("General") && (
                        <div className="space-y-6">
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
                                <Switch label="Permanently Expand Sidebar (Desktop Only)" description="Keep the sidebar expanded by default on desktop." isOn={settings.display.sidebar_permanently_expanded} handleToggle={handleSidebarToggle} darkMode={darkMode} /> {/* Passed darkMode prop */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Language</label>
                                    <Dropdown placeholder="Select Language" options={languageOptions} value={settings.display.language} onChange={handleLanguageChange} className="w-full" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select your preferred language.</p>
                                </div>

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

                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`} htmlFor="user_default_landing_page">Default Landing Page</label>
                                    <Dropdown
                                        options={defaultLandingPageOptions()}
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
                                    label="New Listing Alert"
                                    description="Get notified about new property listings matching your criteria."
                                    isOn={settings.notifications.newListingAlert}
                                    handleToggle={createToggleHandler('notifications', 'newListingAlert', 'New Listing Alert', 'new_listing_alert')}
                                />
                                <Switch
                                    label="Price Drop Alert"
                                    description="Receive alerts for price reductions on favorite or saved listings."
                                    isOn={settings.notifications.priceDropAlert}
                                    handleToggle={createToggleHandler('notifications', 'priceDropAlert', 'Price Drop Alert', 'price_drop_alert')}
                                />
                                <Switch
                                    label="Favorite Update Alert"
                                    description="Get notified when there are updates to your favorited properties."
                                    isOn={settings.notifications.favouriteUpdateAlert}
                                    handleToggle={createToggleHandler('notifications', 'favouriteUpdateAlert', 'Favorite Update Alert', 'favourite_update_alert')}
                                />
                            </div>
                        </div>
                    )}

                    {user?.role === 'client' && filterSection("Property Preferences") && (
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 flex items-center ${darkMode ? "text-green-400" : "text-green-700"}`}>
                                <Home className="mr-3 text-purple-500" size={24} /> Property Preferences
                            </h3>
                            <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                Set your preferences for property recommendations and alerts.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`} htmlFor="preferred_property_type">Property Type</label>
                                    <Dropdown
                                        options={propertyTypeOptions}
                                        value={settings.preferences.preferred_property_type}
                                        onChange={(value) => setSettings(prev => ({...prev, preferences: {...prev.preferences, preferred_property_type: value}}))}
                                        placeholder="Any Property Type"
                                        className="w-full"
                                    />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Filter listings by your ideal property type.</p>
                                </div>

                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label htmlFor="preferred_location" className={`block text-lg font-semibold mb-2 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Preferred Location</label>
                                    <input
                                        id="preferred_location"
                                        type="text"
                                        value={settings.preferences.preferred_location}
                                        onChange={(e) => handleInputChange(e, 'preferences', 'preferred_location')}
                                        className={`w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                        placeholder="e.g., Lagos, Lekki"
                                    />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Set a default location for property searches.</p>
                                </div>

                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label htmlFor="min_price" className={`block text-lg font-semibold mb-2 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Min Price (₦)</label>
                                    <div className="relative">
                                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
                                        <input
                                            id="min_price"
                                            type="number"
                                            value={settings.preferences.min_price}
                                            onChange={(e) => handleInputChange(e, 'preferences', 'min_price')}
                                            className={`w-full py-2.5 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                            placeholder="0"
                                        />
                                    </div>
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Set a minimum price for property recommendations.</p>
                                </div>

                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label htmlFor="max_price" className={`block text-lg font-semibold mb-2 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Max Price (₦)</label>
                                    <div className="relative">
                                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
                                        <input
                                            id="max_price"
                                            type="number"
                                            value={settings.preferences.max_price}
                                            onChange={(e) => handleInputChange(e, 'preferences', 'max_price')}
                                            className={`w-full py-2.5 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                            placeholder="1000000000"
                                        />
                                    </div>
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Set a maximum price for property recommendations.</p>
                                </div>

                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`} htmlFor="min_bedrooms">Min Bedrooms</label>
                                    <Dropdown
                                        options={bedroomOptions}
                                        value={settings.preferences.min_bedrooms}
                                        onChange={(value) => setSettings(prev => ({...prev, preferences: {...prev.preferences, min_bedrooms: value}}))}
                                        placeholder="Any"
                                        className="w-full"
                                    />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Set the minimum number of bedrooms.</p>
                                </div>

                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`} htmlFor="min_bathrooms">Min Bathrooms</label>
                                    <Dropdown
                                        options={bathroomOptions}
                                        value={settings.preferences.min_bathrooms}
                                        onChange={(value) => setSettings(prev => ({...prev, preferences: {...prev.preferences, min_bathrooms: value}}))}
                                        placeholder="Any"
                                        className="w-full"
                                    />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Set the minimum number of bathrooms.</p>
                                </div>
                            </div>
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => handleSaveSettings('Property Preferences', 'preferences')}
                                    className="py-2.5 px-8 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-colors"
                                >
                                    Save Property Preferences
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ClientSettings;

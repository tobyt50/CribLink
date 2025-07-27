import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Menu, X, Monitor, Sun, Moon, LayoutGrid, LayoutList, ChevronDownIcon, Bell, Mail, Shield, Zap, Megaphone, Server, Key, HardDrive, Clock, ClipboardList, Search, Languages, Palette, Link, Landmark, Loader, Save, UserPlus, Hourglass, UserRoundCheck, UserX, Trash2, ShieldAlert, CheckCircle, PencilIcon } from 'lucide-react'; // Added new icons and CheckCircle
import AgencyAdminSidebar from '../../components/agencyadmin/Sidebar.js'; // Import the new AgencyAdminSidebar
import { useTheme } from '../../layouts/AppShell.js';
import { useMessage } from '../../context/MessageContext.js';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook
import { useConfirmDialog } from '../../context/ConfirmDialogContext'; // Import useConfirmDialog
import axiosInstance from '../../api/axiosInstance'; // Import axiosInstance
import API_BASE_URL from '../../config'; // Import API_BASE_URL

// Reusable Dropdown Component (copied from General.js/Settings.js)
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
                    <ChevronDownIcon className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
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


const AgencyAdminSettings = () => {
    const { darkMode, themePreference, setThemePreference } = useTheme();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();
    const { user, isAuthenticated, logout } = useAuth(); // Get user info and logout from AuthContext
    const { isSidebarOpen, setIsSidebarOpen, isMobile, isCollapsed, setIsCollapsed } = useSidebarState(); // Use useSidebarState

    const [activeSection, setActiveSection] = useState('agencyInfo'); // Default to agency info
    const [agencyInfo, setAgencyInfo] = useState(null);
    const [editingAgencyInfo, setEditingAgencyInfo] = useState(false);
    const [agencyForm, setAgencyForm] = useState({
        name: '',
        email: '',
        phone: '',
        website: '',
        address: '', // Added address
        description: '',
        logoBase64: null,
        logoOriginalname: null,
    });
    const [newLogoPreview, setNewLogoPreview] = useState('');
    const [updatingAgency, setUpdatingAgency] = useState(false);

    const [agencyMembers, setAgencyMembers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    const mainContentRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');

    // UI State for general settings (from AdminSettings)
    const [defaultListingsView, setDefaultListingsView] = useState(() => localStorage.getItem('defaultListingsView') || 'simple');
    const [sidebarPermanentlyExpanded, setSidebarPermanentlyExpanded] = useState(() => localStorage.getItem('sidebarPermanentlyExpanded') === 'true');

    // Notification Settings State (from AdminSettings)
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [inAppNotifications, setInAppNotifications] = useState(true);

    // Email Settings State (from AdminSettings)
    const [senderEmail, setSenderEmail] = useState('admin@example.com');
    const [smtpHost, setSmtpHost] = useState('smtp.example.com');

    // Security Settings State (from AdminSettings)
    const [require2FA, setRequire2FA] = useState(false);
    const [minPasswordLength, setMinPasswordLength] = useState(() => parseInt(localStorage.getItem('minPasswordLength')) || 8);

    // Integrations Settings State (from AdminSettings)
    const [crmIntegrationEnabled, setCrmIntegrationEnabled] = useState(false);
    const [analyticsId, setAnalyticsId] = useState(() => localStorage.getItem('analyticsId') || '');

    // Content Moderation (from AdminSettings)
    const [autoApproveListings, setAutoApproveListings] = useState(() => localStorage.getItem('autoApproveListings') === 'true');
    const [enableComments, setEnableComments] = useState(() => localStorage.getItem('enableComments') === 'true');

    // System Maintenance (from AdminSettings)
    const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('maintenanceMode') === 'true');
    const [databaseBackupScheduled, setDatabaseBackupScheduled] = useState(() => localStorage.getItem('databaseBackupScheduled') === 'true');

    // State for general user settings (from AdminSettings, originally ProfileSettings.js)
    const [userSettings, setUserSettings] = useState({
        language: 'en',
        timezone: 'UTC+1',
        currency: 'NGN',
        default_landing_page: '/',
        notification_email: '',
        preferred_communication_channel: 'email',
    });
    const [userSettingsLoading, setUserSettingsLoading] = useState(true);

    const token = localStorage.getItem("token"); // Assuming token is available here

    // Dynamic section titles
    const getSectionTitle = (section) => {
        switch (section) {
            case 'agencyInfo': return 'Agency Information';
            case 'members': return 'Agency Members';
            case 'requests': return 'Pending Join Requests';
            case 'general': return 'General Settings';
            case 'notifications': return 'Notification Settings';
            case 'email': return 'Email Settings';
            case 'security': return 'Security';
            case 'integrations': return 'Integrations';
            case 'contentModeration': return 'Content Moderation';
            case 'system': return 'System & Maintenance';
            case 'dangerZone': return 'Danger Zone';
            default: return 'Settings';
        }
    };

    const inputFieldStyles = `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
        darkMode
            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;
    const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;
    const inputGroupStyles = "flex flex-col";

    // Dark Mode Options (copied from AdminSettings)
    const darkModeOptions = [
        { value: 'light', label: 'Light', icon: <Sun size={20} /> },
        { value: 'dark', label: 'Dark', icon: <Moon size={20} /> },
        { value: 'system', label: 'System', icon: <Monitor size={20} /> },
    ];

    // Default Listings Display Options (copied from AdminSettings)
    const defaultListingsViewOptions = [
        { value: 'simple', label: 'Table View', icon: <LayoutList size={20} /> },
        { value: 'graphical', label: 'Grid View', icon: <LayoutGrid size={20} /> }
    ];

    // Language options (from AdminSettings, originally ProfileSettings.js)
    const languageOptions = [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
    ];

    // Timezone options (from AdminSettings, originally ProfileSettings.js)
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

    // Currency options (from AdminSettings, originally ProfileSettings.js)
    const currencyOptions = [
        { value: 'NGN', label: '₦ Nigerian Naira' },
        { value: 'USD', label: '$ US Dollar' },
        { value: 'EUR', label: '€ Euro' },
        { value: 'GBP', label: '£ British Pound' },
        { value: 'JPY', label: '¥ Japanese Yen' },
    ];

    // Dynamically generate Default Landing Page options based on user role (from AdminSettings, originally ProfileSettings.js)
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
                case 'agency_admin': // Added for agency_admin
                    dashboardPath = '/agency-admin/dashboard';
                    inquiriesPath = '/agency-admin/inquiries';
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

    // Fetch Agency Information
    const fetchAgencyInfo = useCallback(async () => {
        if (!user?.agency_id) {
            showMessage("You are not associated with an agency.", "info");
            return;
        }
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/agencies/${user.agency_id}`);
            setAgencyInfo(response.data);
            setAgencyForm({
                name: response.data.name || '',
                email: response.data.email || '',
                phone: response.data.phone || '',
                website: response.data.website || '',
                address: response.data.address || '', // Fetch address
                description: response.data.description || '',
                logoBase64: null, // Not fetched, only for new upload
                logoOriginalname: null, // Not fetched, only for new upload
            });
            if (response.data.logo_url) {
                setNewLogoPreview(response.data.logo_url);
            } else {
                setNewLogoPreview('');
            }
        } catch (error) {
            console.error("Error fetching agency info:", error);
            showMessage("Failed to load agency information.", "error");
        }
    }, [user, showMessage]);

    // Fetch Agency Members
    const fetchAgencyMembers = useCallback(async () => {
        if (!user?.agency_id) return;
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/agencies/${user.agency_id}/agents`);
            setAgencyMembers(response.data);
        } catch (error) {
            console.error("Error fetching agency members:", error);
            showMessage("Failed to load agency members.", "error");
        }
    }, [user, showMessage]);

    // Fetch Pending Join Requests
    const fetchPendingRequests = useCallback(async () => {
        if (!user?.agency_id) return;
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/agencies/${user.agency_id}/pending-requests`);
            setPendingRequests(response.data);
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            showMessage("Failed to load pending join requests.", "error");
        }
    }, [user, showMessage]);

    // Fetch User Settings (from AdminSettings.js)
    const fetchUserSettings = useCallback(async () => {
        setUserSettingsLoading(true);
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/users/profile`, {
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
        if (user?.agency_id && isAuthenticated && user?.role === 'agency_admin') {
            fetchAgencyInfo();
            fetchAgencyMembers();
            fetchPendingRequests();
            fetchUserSettings(); // Fetch user settings for general options
        }
    }, [user, isAuthenticated, fetchAgencyInfo, fetchAgencyMembers, fetchPendingRequests, fetchUserSettings]);

    // LocalStorage Sync Effect for general settings (from AdminSettings)
    useEffect(() => {
        localStorage.setItem('defaultListingsView', defaultListingsView);
        localStorage.setItem('sidebarPermanentlyExpanded', sidebarPermanentlyExpanded);
        localStorage.setItem('minPasswordLength', minPasswordLength);
        localStorage.setItem('analyticsId', analyticsId);
        localStorage.setItem('autoApproveListings', autoApproveListings);
        localStorage.setItem('enableComments', enableComments);
        localStorage.setItem('maintenanceMode', maintenanceMode);
        localStorage.setItem('databaseBackupScheduled', databaseBackupScheduled);
        localStorage.setItem('settingsSearchTerm', searchTerm);
    }, [defaultListingsView, sidebarPermanentlyExpanded, minPasswordLength, analyticsId, autoApproveListings, enableComments, maintenanceMode, databaseBackupScheduled, searchTerm]);

    // This useEffect is updated to prevent the quick collapse issue.
    // It should only run once on mount or when isMobile changes to set the *initial* collapsed state.
    // The sidebarPermanentlyExpanded state is now directly controlled by handleSidebarToggle.
    useEffect(() => {
        if (!isMobile) {
            setIsCollapsed(!sidebarPermanentlyExpanded);
        }
    }, [isMobile, setIsCollapsed]);


    const handleAgencyFormChange = (e) => {
        const { name, value } = e.target;
        setAgencyForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewLogoPreview(reader.result);
                setAgencyForm(prev => ({
                    ...prev,
                    logoBase64: reader.result,
                    logoOriginalname: file.name,
                }));
            };
            reader.readAsDataURL(file);
        } else {
            setNewLogoPreview('');
            setAgencyForm(prev => ({
                ...prev,
                logoBase64: null,
                logoOriginalname: null,
            }));
        }
    };

    const handleClearLogo = () => {
        setNewLogoPreview('');
        setAgencyForm(prev => ({
            ...prev,
            logoBase64: null,
            logoOriginalname: null,
        }));
    };

    const handleUpdateAgencyInfo = async () => {
        if (!user?.agency_id) {
            showMessage("No agency associated with your account.", "error");
            return;
        }
        setUpdatingAgency(true);
        try {
            const payload = { ...agencyForm };
            // Remove originalname as it's not needed for the backend update endpoint directly
            delete payload.logoOriginalname;

            const response = await axiosInstance.put(
                `${API_BASE_URL}/agencies/${user.agency_id}`,
                payload
            );
            setAgencyInfo(response.data); // Update displayed info
            setEditingAgencyInfo(false); // Exit editing mode
            showMessage("Agency information updated successfully!", "success");
        } catch (error) {
            console.error("Error updating agency info:", error.response?.data || error.message);
            showMessage(`Failed to update agency info: ${error.response?.data?.message || 'Please try again.'}`, "error");
        } finally {
            setUpdatingAgency(false);
        }
    };

    const handleApproveRequest = async (requestId) => {
        showConfirm({
            title: "Approve Join Request",
            message: "Are you sure you want to approve this agent's request to join your agency?",
            onConfirm: async () => {
                try {
                    await axiosInstance.put(`${API_BASE_URL}/agencies/approve-join-request/${requestId}`);
                    showMessage("Agent request approved successfully!", "success");
                    fetchPendingRequests(); // Refresh pending requests
                    fetchAgencyMembers(); // Refresh members list
                } catch (error) {
                    console.error("Error approving request:", error.response?.data || error.message);
                    showMessage(`Failed to approve request: ${error.response?.data?.message || 'Please try again.'}`, "error");
                }
            }
        });
    };

    const handleRejectRequest = async (requestId) => {
        showConfirm({
            title: "Reject Join Request",
            message: "Are you sure you want to reject this agent's request to join your agency?",
            onConfirm: async () => {
                try {
                    await axiosInstance.put(`${API_BASE_URL}/agencies/reject-join-request/${requestId}`);
                    showMessage("Agent request rejected.", "info");
                    fetchPendingRequests(); // Refresh pending requests
                } catch (error) {
                    console.error("Error rejecting request:", error.response?.data || error.message);
                    showMessage(`Failed to reject request: ${error.response?.data?.message || 'Please try again.'}`, "error");
                }
            }
        });
    };

    const handleRemoveAgent = async (agentIdToRemove, agentName) => {
        showConfirm({
            title: "Remove Agency Member",
            message: `Are you sure you want to remove ${agentName} from your agency? They will no longer be affiliated with your agency.`,
            onConfirm: async () => {
                try {
                    await axiosInstance.delete(`${API_BASE_URL}/agencies/${user.agency_id}/members/${agentIdToRemove}`);
                    showMessage(`${agentName} removed from agency successfully.`, "success");
                    fetchAgencyMembers(); // Refresh members list
                }
                catch (error) {
                    console.error("Error removing agent:", error.response?.data || error.message);
                    showMessage(`Failed to remove agent: ${error.response?.data?.message || 'Please try again.'}`, "error");
                }
            },
            confirmLabel: "Yes, Remove",
            cancelLabel: "Cancel"
        });
    };

    const handleDeleteAgency = async () => {
        if (!user?.agency_id) {
            showMessage("No agency associated with your account to delete.", "error");
            return;
        }

        showConfirm({
            title: "Confirm Agency Deletion",
            message: (
                <div className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <p className="mb-4">
                        This action is irreversible. Deleting your agency will:
                    </p>
                    <ul className="list-disc list-inside space-y-1 mb-4">
                        <li>Permanently remove all agency data.</li>
                        <li>Disconnect all associated agents from this agency.</li>
                        <li>**Revert your role to a regular agent.**</li>
                    </ul>
                    <p className="font-bold text-red-500">
                        Are you absolutely sure you want to proceed?
                    </p>
                </div>
            ),
            onConfirm: () => {
                // Add a small delay before showing the second confirmation to ensure the first one closes
                setTimeout(() => {
                    showConfirm({
                        title: "Final Confirmation: Delete Agency",
                        message: (
                            <div className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                <p className="mb-4">
                                    Type <span className="font-bold text-red-500">DELETE MY AGENCY</span> to confirm.
                                </p>
                                <input
                                    type="text"
                                    className={`w-full p-2 border rounded-md ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                                    placeholder="DELETE MY AGENCY"
                                    id="deleteAgencyConfirmInput" // Add an ID for easier access if needed
                                />
                            </div>
                        ),
                        onConfirm: async () => {
                            const confirmInput = document.getElementById('deleteAgencyConfirmInput')?.value;
                            if (confirmInput !== "DELETE MY AGENCY") {
                                showMessage("Confirmation text did not match. Agency not deleted.", "error");
                                return;
                            }

                            try {
                                // Call the new backend endpoint for agency admin to delete agency
                                const response = await axiosInstance.delete(`${API_BASE_URL}/agencies/${user.agency_id}/admin-delete`);

                                if (response.status === 200) {
                                    showMessage("Agency deleted and your role reverted successfully!", "success");
                                    // Clear local storage and sign out to force re-login with new role
                                    logout(); // This should clear local storage and redirect to sign-in
                                }
                            } catch (error) {
                                console.error("Error deleting agency:", error.response?.data || error.message);
                                showMessage(`Failed to delete agency: ${error.response?.data?.message || 'Please try again.'}`, "error");
                            }
                        },
                        confirmLabel: "Delete Agency Permanently",
                        cancelLabel: "Cancel",
                        isDangerous: true,
                        requiresInput: true // Indicate that input is required for confirmation
                    });
                }, 100); // 100ms delay
            },
            confirmLabel: "Proceed to Final Confirmation",
            cancelLabel: "Cancel",
            isDangerous: true
        });
    };

    // Handlers for general settings (from AdminSettings)
    const handleThemeChange = (value) => {
        setThemePreference(value);
        showMessage(`Theme set to ${value}.`, 'success');
    };

    const handleDefaultListingsViewChange = (value) => {
        setDefaultListingsView(value);
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

    // New handler to update user settings and save immediately (from AdminSettings)
    const handleUserSettingsUpdate = async (name, value) => {
        setUserSettings(prev => ({
            ...prev,
            [name]: value,
        }));
        try {
            const payload = { [name]: value };
            await axiosInstance.put(`${API_BASE_URL}/users/update`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage(`${name.replace(/_/g, ' ')} updated successfully!`, "success");
        } catch (error) {
            console.error(`Failed to save ${name}:`, error);
            showMessage(`Failed to save ${name.replace(/_/g, ' ')}. Please try again.`, "error");
        }
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


    const sidebarItems = [
        { id: 'agencyInfo', label: 'Agency Info', icon: Landmark },
        { id: 'members', label: 'Agency Members', icon: UserRoundCheck },
        { id: 'requests', label: 'Join Requests', icon: Hourglass },
        { id: 'general', label: 'General Settings', icon: SettingsIcon },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'email', label: 'Email Settings', icon: Mail },
        { id: 'security', label: 'Security', icon: Key },
        { id: 'integrations', label: 'Integrations', icon: Link },
        { id: 'contentModeration', label: 'Content Moderation', icon: ClipboardList },
        { id: 'system', label: 'System & Maintenance', icon: Server },
        { id: 'dangerZone', label: 'Danger Zone', icon: ShieldAlert },
    ];

    // Comprehensive list of searchable items, grouped by section for robust filtering
    const searchableContent = {
        "agencyInfo": [
            "Agency Information", "Agency Name", "Email", "Phone", "Website", "Description", "Agency ID", "Edit Information", "Address" // Added Address
        ],
        "members": [
            "Agency Members", "Remove", "Agent", "Email", "Role",
        ],
        "requests": [
            "Pending Join Requests", "Approve", "Reject", "Agent Name", "Agent Email", "Message",
        ],
        "general": [
            "General Settings", "Theme", "Choose your preferred theme.", "Default Listings Display", "Select how listings are displayed by default.", "Table View", "Grid View",
            "Permanently Expand Sidebar (Desktop Only)", "Keep the sidebar expanded by default on desktop.",
            "Language", "Select Language", "English", "Spanish", "French", "German",
            "Timezone", "Select Timezone",
            "Default Currency", "Select Currency", "Nigerian Naira", "US Dollar", "Euro", "British Pound", "Japanese Yen",
            "Default Landing Page", "Select Landing Page", "Home", "Profile", "Dashboard", "Inquiries",
        ],
        "notifications": [
            "Notification Settings", "Email Notifications", "Receive updates via email.", "SMS Notifications", "Get alerts on your phone.", "In-App Notifications", "See notifications in the dashboard."
        ],
        "email": [
            "Email Settings", "Sender Email Address", "SMTP Host", "Save Email Settings"
        ],
        "security": [
            "Security", "Require 2FA for Admin Login", "Enhance security for all admin accounts.", "Minimum Password Length", "Set the minimum characters for user passwords.", "Save Policy"
        ],
        "integrations": [
            "Integrations", "Enable CRM Integration", "Sync data with your external CRM.", "Google Analytics ID", "Integrate Google Analytics for traffic monitoring.", "Save Analytics"
        ],
        "contentModeration": [
            "Content Moderation", "Auto-Approve New Listings", "Approve new agent listings automatically.", "Enable User Comments", "Allow comments on property listings."
        ],
        "system": [
            "System & Maintenance", "Enable Maintenance Mode", "Take the site offline for updates.", "Application Cache", "Clear temporary data.", "Clear", "Automated Database Backups", "Schedule regular database backups.", "Manual Backup", "Create an on-demand backup.", "Backup", "View Error Logs", "Access system error logs for debugging.", "View Logs"
        ],
        "dangerZone": [
            "Danger Zone", "Delete Agency", "Permanently delete your agency and all associated data.", "This action cannot be undone.", "Disconnect all associated agents from this agency.", "Revert your role to a regular agent.", "Delete Agency Permanently", "Confirm Agency Deletion", "Final Confirmation", "DELETE MY AGENCY"
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

    if (!isAuthenticated || user?.role !== 'agency_admin') {
        return (
            <div className={`flex items-center justify-center h-screen ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
                <p>Access Denied. You must be an Agency Administrator to view this page.</p>
            </div>
        );
    }

    return (
        <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
            {isMobile && (
                <motion.button
                    onClick={() => setIsSidebarOpen(prev => !prev)} // Changed this line
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

            <AgencyAdminSidebar
                collapsed={isMobile ? false : isCollapsed}
                setCollapsed={setIsCollapsed}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen} // Keep this as is
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
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Agency Settings</h1>
                </div>

                {/* Desktop View Main Header */}
                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Agency Settings</h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-8 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                >
                    {/* Search Bar */}
                    <div className="flex justify-end items-center mb-6">
                        <div className="relative w-full md:w-1/3">
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

                    {/* Agency Information Section */}
                    {filterSection("agencyInfo") && agencyInfo && (
                        <div className="pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-green-400" : "text-green-700"}`}>
                                <Landmark className="mr-3 text-orange-500" size={24} /> Agency Information
                            </h3>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        {newLogoPreview ? (
                                            <img src={newLogoPreview} alt="Agency Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Landmark className="w-16 h-16 text-gray-400" />
                                        )}
                                        {editingAgencyInfo && newLogoPreview && (
                                            <button
                                                type="button"
                                                onClick={handleClearLogo}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                                aria-label="Clear agency logo"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {editingAgencyInfo && (
                                        <input
                                            type="file"
                                            id="agency_logo"
                                            name="agency_logo"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className={`mt-4 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${darkMode ? "file:bg-green-600 file:text-white file:hover:bg-green-700 text-gray-300" : "file:bg-green-50 file:text-green-700 hover:file:bg-green-100 text-gray-700"}`}
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={inputGroupStyles}>
                                        <label className={labelStyles}>Agency Name</label>
                                        {editingAgencyInfo ? (
                                            <input type="text" name="name" value={agencyForm.name} onChange={handleAgencyFormChange} className={inputFieldStyles} />
                                        ) : (
                                            <p className={`text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agencyInfo.name}</p>
                                        )}
                                    </div>
                                    <div className={inputGroupStyles}>
                                        <label className={labelStyles}>Email</label>
                                        {editingAgencyInfo ? (
                                            <input type="email" name="email" value={agencyForm.email} onChange={handleAgencyFormChange} className={inputFieldStyles} />
                                        ) : (
                                            <p className={`text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agencyInfo.email}</p>
                                        )}
                                    </div>
                                    <div className={inputGroupStyles}>
                                        <label className={labelStyles}>Phone</label>
                                        {editingAgencyInfo ? (
                                            <input type="tel" name="phone" value={agencyForm.phone} onChange={handleAgencyFormChange} className={inputFieldStyles} />
                                        ) : (
                                            <p className={`text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agencyInfo.phone}</p>
                                        )}
                                    </div>
                                    <div className={inputGroupStyles}>
                                        <label className={labelStyles}>Website</label>
                                        {editingAgencyInfo ? (
                                            <input type="url" name="website" value={agencyForm.website} onChange={handleAgencyFormChange} className={inputFieldStyles} />
                                        ) : (
                                            <p className={`text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agencyInfo.website || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div className={inputGroupStyles}>
                                        <label className={labelStyles}>Address</label> {/* Added Address field */}
                                        {editingAgencyInfo ? (
                                            <input type="text" name="address" value={agencyForm.address} onChange={handleAgencyFormChange} className={inputFieldStyles} />
                                        ) : (
                                            <p className={`text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agencyInfo.address || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div className={inputGroupStyles}>
                                        <label className={labelStyles}>Description</label>
                                        {editingAgencyInfo ? (
                                            <textarea name="description" value={agencyForm.description} onChange={handleAgencyFormChange} className={`${inputFieldStyles} min-h-[100px]`} rows="4"></textarea>
                                        ) : (
                                            <p className={`text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agencyInfo.description || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div className={inputGroupStyles}>
                                        <label className={labelStyles}>Agency ID</label>
                                        <p className={`text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agencyInfo.agency_id}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4 mt-6">
                                    {editingAgencyInfo ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditingAgencyInfo(false);
                                                    fetchAgencyInfo(); // Revert changes
                                                }}
                                                className={`px-6 py-2 rounded-full font-semibold transition duration-200 ${darkMode ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateAgencyInfo}
                                                disabled={updatingAgency}
                                                className={`px-6 py-2 font-semibold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                                                    ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                                            >
                                                {updatingAgency ? <Loader size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                                                {updatingAgency ? "Saving..." : "Save Changes"}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setEditingAgencyInfo(true)}
                                            className={`px-6 py-2 rounded-full font-semibold transition duration-200 flex items-center
                                                ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                                        >
                                            <PencilIcon size={20} className="mr-2" />
                                            Edit Info
                                        </button>

                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Agency Members Section */}
                    {filterSection("members") && (
                        <div className="pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-green-400" : "text-green-700"}`}>
                                <UserRoundCheck className="mr-3 text-blue-500" size={24} /> Agency Members
                            </h3>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-4"
                            >
                                {agencyMembers.length > 0 ? (
                                    <ul className="space-y-4">
                                        {agencyMembers.map(member => (
                                            <li key={member.user_id} className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                                <div className="flex items-center space-x-4">
                                                    <img
                                                        src={member.profile_picture_url || `https://placehold.co/40x40/${darkMode ? '374151' : 'e5e7eb'}/${darkMode ? 'd1d5db' : '6b7280'}?text=${member.full_name.charAt(0)}`}
                                                        alt={member.full_name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <p className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{member.full_name} ({member.agency_role})</p>
                                                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{member.email}</p>
                                                    </div>
                                                </div>
                                                {member.user_id !== user.user_id && ( // Cannot remove self from here
                                                    <button
                                                        onClick={() => handleRemoveAgent(member.user_id, member.full_name)}
                                                        className={`px-3 py-1 rounded-full text-sm font-semibold transition duration-200 ${darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-100 hover:bg-red-200 text-red-600"}`}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>No agents currently in your agency.</p>
                                )}
                            </motion.div>
                        </div>
                    )}

                    {/* Pending Join Requests Section */}
                    {filterSection("requests") && (
                        <div className="pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-green-400" : "text-green-700"}`}>
                                <Hourglass className="mr-3 text-yellow-500" size={24} /> Pending Join Requests
                            </h3>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-4"
                            >
                                {pendingRequests.length > 0 ? (
                                    <ul className="space-y-4">
                                        {pendingRequests.map(request => (
                                            <li key={request.request_id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                                <div className="flex items-center space-x-4 mb-3 md:mb-0">
                                                    <img
                                                        src={request.agent_profile_picture_url || `https://placehold.co/40x40/${darkMode ? '374151' : 'e5e7eb'}/${darkMode ? 'd1d5db' : '6b7280'}?text=${request.agent_name.charAt(0)}`}
                                                        alt={request.agent_name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <p className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{request.agent_name}</p>
                                                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{request.agent_email}</p>
                                                        {/* Safely access request.message */}
                                                        {request.message && <p className={`text-xs italic ${darkMode ? "text-gray-500" : "text-gray-500"}`}>"{request.message}"</p>}
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleApproveRequest(request.request_id)}
                                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition duration-200 flex items-center ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                                                    >
                                                        <CheckCircle size={16} className="mr-1" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(request.request_id)}
                                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition duration-200 flex items-center ${darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-100 hover:bg-red-200 text-red-600"}`}
                                                    >
                                                        <X size={16} className="mr-1" /> Reject
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>No pending join requests.</p>
                                )}
                            </motion.div>
                        </div>
                    )}

                    {/* General Settings Section */}
                    {filterSection("general") && (
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>General Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Theme Setting */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Theme</label>
                                    <Dropdown placeholder="Select Theme" options={darkModeOptions} value={themePreference} onChange={handleThemeChange} className="w-full" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Choose your preferred theme.</p>
                                </div>
                                {/* Default Listings Display */}
                                <div className={`p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                                    <label className={`block text-lg font-semibold mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>Default Listings Display</label>
                                    <Dropdown placeholder="Select View Mode" options={defaultListingsViewOptions} value={defaultListingsView} onChange={handleDefaultListingsViewChange} className="w-full" />
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select how listings are displayed by default.</p>
                                </div>
                                {/* Sidebar Toggle */}
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

                    {/* Notification Settings Section */}
                    {filterSection("notifications") && (
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Notification Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Switch label="Email Notifications" description="Receive updates via email." isOn={emailNotifications} handleToggle={handleEmailNotificationsToggle} />
                                <Switch label="SMS Notifications" description="Get alerts on your phone." isOn={smsNotifications} handleToggle={handleSmsNotificationsToggle} />
                                <Switch label="In-App Notifications" description="See notifications in the dashboard." isOn={inAppNotifications} handleToggle={handleInAppNotificationsToggle} />
                            </div>
                        </div>
                    )}

                    {filterSection("email") && (
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Email Settings</h3>
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

                    {filterSection("security") && (
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Security</h3>
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

                    {filterSection("integrations") && (
                        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Integrations</h3>
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

                    {filterSection("contentModeration") && (
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Content Moderation</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <Switch label="Auto-Approve New Listings" description="Approve new agent listings automatically." isOn={autoApproveListings} handleToggle={handleAutoApproveListingsToggle} />
                                <Switch label="Enable User Comments" description="Allow comments on property listings." isOn={enableComments} handleToggle={handleEnableCommentsToggle} />
                            </div>
                        </div>
                    )}

                    {filterSection("system") && (
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>System & Maintenance</h3>
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

                    {filterSection("dangerZone") && (
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Danger Zone</h3>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-6"
                            >
                                <div className={`p-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950`}>
                                    <h3 className={`text-xl font-bold mb-4 flex items-center ${darkMode ? "text-red-300" : "text-red-800"}`}>
                                        <ShieldAlert className="mr-2" size={24} /> Delete Agency
                                    </h3>
                                    <p className={`mb-4 ${darkMode ? "text-red-200" : "text-red-700"}`}>
                                        Permanently delete your agency and all associated data. This action cannot be undone.
                                        All agents currently linked to this agency will be unlinked, and your role will be reverted to a regular agent.
                                    </p>
                                    <button
                                        onClick={handleDeleteAgency}
                                        className={`px-6 py-3 bg-red-600 text-white font-semibold rounded-xl shadow-md hover:bg-red-700 transition duration-200 flex items-center`}
                                    >
                                        <Trash2 size={20} className="mr-2" /> Delete Agency Permanently
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AgencyAdminSettings;

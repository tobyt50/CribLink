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
    const { isSidebarOpen, toggleSidebar, isMobile, isCollapsed, setIsCollapsed } = useSidebarState(); // Use useSidebarState

    const [activeSection, setActiveSection] = useState('agencyInfo'); // Default to agency info
    const [agencyInfo, setAgencyInfo] = useState(null);
    const [editingAgencyInfo, setEditingAgencyInfo] = useState(false);
    const [agencyForm, setAgencyForm] = useState({
        name: '',
        email: '',
        phone: '',
        website: '',
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

    // UI State for agency admin settings
    const [defaultListingsView, setDefaultListingsView] = useState('simple'); // Placeholder for a setting
    const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Placeholder for a setting

    // Dynamic section titles
    const getSectionTitle = (section) => {
        switch (section) {
            case 'agencyInfo': return 'Agency Information';
            case 'members': return 'Agency Members';
            case 'requests': return 'Pending Join Requests';
            case 'general': return 'General Settings';
            case 'notifications': return 'Notification Settings';
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

    useEffect(() => {
        if (user?.agency_id && isAuthenticated && user?.role === 'agency_admin') {
            fetchAgencyInfo();
            fetchAgencyMembers();
            fetchPendingRequests();
        }
    }, [user, isAuthenticated, fetchAgencyInfo, fetchAgencyMembers, fetchPendingRequests]);

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

    const handleThemeChange = (value) => {
        setThemePreference(value);
        showMessage(`Theme set to ${value}.`, 'success');
    };

    const handleDefaultListingsViewChange = (value) => {
        setDefaultListingsView(value);
        showMessage('Default listings view updated.', 'success');
    };

    const handleNotificationsToggle = (setter, name) => () => {
        setter(prev => {
            const newState = !prev;
            showMessage(`${name} ${newState ? 'enabled' : 'disabled'}.`, 'success');
            return newState;
        });
    };


    const sidebarItems = [
        { id: 'agencyInfo', label: 'Agency Info', icon: Landmark },
        { id: 'members', label: 'Agency Members', icon: UserRoundCheck },
        { id: 'requests', label: 'Join Requests', icon: Hourglass },
        { id: 'general', label: 'General Settings', icon: SettingsIcon },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'dangerZone', label: 'Danger Zone', icon: ShieldAlert },
    ];

    // Comprehensive list of searchable items, grouped by section for robust filtering
    const searchableContent = {
        "agencyInfo": [
            "Agency Information", "Agency Name", "Email", "Phone", "Website", "Description", "Agency ID", "Edit Information",
        ],
        "members": [
            "Agency Members", "Remove", "Agent", "Email", "Role",
        ],
        "requests": [
            "Pending Join Requests", "Approve", "Reject", "Agent Name", "Agent Email", "Message",
        ],
        "general": [
            "General Settings", "Theme", "Choose your preferred theme.", "Default Listings Display", "Select how listings are displayed by default.", "Table View", "Grid View",
        ],
        "notifications": [
            "Notification Settings", "Email Notifications", "Receive updates via email.", "SMS Notifications", "Get alerts on your phone.", "In-App Notifications", "See notifications in the dashboard."
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
                    onClick={() => toggleSidebar()} // Use toggleSidebar from useSidebarState
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
                setIsSidebarOpen={toggleSidebar} // Pass toggleSidebar here
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
                            </div>
                        </div>
                    )}

                    {/* Notification Settings Section */}
                    {filterSection("notifications") && (
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className={`text-xl md:text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Notification Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Switch label="Email Notifications" description="Receive updates via email." isOn={notificationsEnabled} handleToggle={handleNotificationsToggle(setNotificationsEnabled, 'Email notifications')} />
                                {/* Add more notification types as needed, e.g., SMS, In-App */}
                            </div>
                        </div>
                    )}

                    {/* Danger Zone Section */}
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

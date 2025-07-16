import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, Save, User, Image, Link, X, UserPlus, Hourglass, UserRoundCheck, CheckCircle, UserX, EllipsisVertical, MessageSquareText, Landmark, ChevronDownIcon, Search } from 'lucide-react'; // Added Search for agency search
import { useTheme } from '../../layouts/AppShell';
import axiosInstance from '../../api/axiosInstance';
import API_BASE_URL from '../../config';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';

// Reusable Dropdown Component (copied from Clients.js/Settings.js)
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


function General({ form, handleChange, handleUpdate, updating, userInfo, onProfilePictureDataChange }) {
    const { darkMode } = useTheme();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();

    const [profilePicturePreview, setProfilePicturePreview] = useState('');
    const [agencies, setAgencies] = useState([]);
    const [filteredAgencies, setFilteredAgencies] = useState([]); // For search
    const [agencySearchTerm, setAgencySearchTerm] = useState(''); // For agency search
    const [selectedAgencyId, setSelectedAgencyId] = useState(null); // This state is now primarily for displaying selection, not for triggering request
    const [agencyConnectionStatus, setAgencyConnectionStatus] = useState('loading'); // 'loading', 'none', 'pending', 'connected', 'rejected'
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const optionsMenuRef = useRef(null);

    // State for new agency registration form
    const [showRegisterAgencyForm, setShowRegisterAgencyAgencyForm] = useState(false); // Renamed to avoid conflict
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


    useEffect(() => {
        if (userInfo?.profile_picture_url) {
            setProfilePicturePreview(userInfo.profile_picture_url);
        } else {
            setProfilePicturePreview('');
        }
    }, [userInfo?.profile_picture_url]);

    const [socialLinks, setSocialLinks] = useState([]);

    useEffect(() => {
        if (userInfo?.social_links && Array.isArray(userInfo.social_links)) {
            setSocialLinks(userInfo.social_links);
        } else {
            setSocialLinks([{ platform: '', url: '' }]);
        }
    }, [userInfo?.social_links]);

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

    // Fetch agent's current agency connection status
    const fetchAgencyConnectionStatus = useCallback(async () => {
        if (!userInfo.user_id) {
            setAgencyConnectionStatus('none'); // No user, no connection
            setSelectedAgencyId(null);
            return;
        }

        // If user is agency_admin, they are always 'connected' to their agency
        if (userInfo.role === 'agency_admin' && userInfo.agency_id) {
            setAgencyConnectionStatus('connected');
            setSelectedAgencyId(userInfo.agency_id);
            return;
        }

        // For regular agents, check their status via the new endpoint
        if (userInfo.role === 'agent') {
            try {
                const token = localStorage.getItem('token');
                const response = await axiosInstance.get(`${API_BASE_URL}/users/${userInfo.user_id}/agency-status`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data && response.data.status) {
                    setAgencyConnectionStatus(response.data.status);
                    setSelectedAgencyId(response.data.agency_id);
                } else {
                    setAgencyConnectionStatus('none');
                    setSelectedAgencyId(null);
                }
            } catch (error) {
                console.error("Error fetching agency connection status:", error.response?.data || error.message);
                setAgencyConnectionStatus('none');
                setSelectedAgencyId(null);
            }
        } else {
            // Client or other roles don't manage agency affiliation here
            setAgencyConnectionStatus('none');
            setSelectedAgencyId(null);
        }
    }, [userInfo.role, userInfo.user_id, userInfo.agency_id, showMessage]);

    useEffect(() => {
        fetchAgencies();
    }, [fetchAgencies]);

    useEffect(() => {
        fetchAgencyConnectionStatus();
    }, [fetchAgencyConnectionStatus, userInfo.agency_id, userInfo.role]); // Re-fetch when user role/agency_id changes

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showOptionsMenu && optionsMenuRef.current && !optionsMenuRef.current.contains(e.target)) {
                setShowOptionsMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showOptionsMenu]);


    const inputFieldStyles =
        `mt-1 block w-full py-2.5 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
            darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
        }`;
    const labelStyles = `block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`;
    const inputGroupStyles = "flex flex-col";

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result); // Set preview from data URL
                onProfilePictureDataChange(reader.result, file.name); // Pass base64 and original name to parent
            };
            reader.readAsDataURL(file);
        } else {
            setProfilePicturePreview('');
            onProfilePictureDataChange(null, null); // Clear base64 data in parent
        }
    };

    const handleClearProfilePicture = () => {
        setProfilePicturePreview(''); // Clear the preview
        onProfilePictureDataChange(null, null); // Signal to parent to clear base64 data
    };

    const addSocialLink = () => {
        const newSocialLinks = [...socialLinks, { platform: '', url: '' }];
        setSocialLinks(newSocialLinks);
        handleChange({ target: { name: 'social_links', value: newSocialLinks } });
    };

    const handleSocialLinkChange = (index, field, value) => {
        const newSocialLinks = [...socialLinks];
        newSocialLinks[index][field] = value;
        setSocialLinks(newSocialLinks);
        handleChange({ target: { name: 'social_links', value: newSocialLinks } });
    };

    const removeSocialLink = (index) => {
        const newSocialLinks = socialLinks.filter((_, i) => i !== index);
        setSocialLinks(newSocialLinks);
        handleChange({ target: { name: 'social_links', value: newSocialLinks } });
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

    // This function is no longer directly used to trigger the request, but can be for selection display if needed
    const handleAgencySelect = (agencyId) => {
        setSelectedAgencyId(agencyId);
    };

    const handleSendAgencyConnectionRequest = async (agencyIdToJoin) => { // Modified to accept agencyId
        // Debugging logs:
        console.log("handleSendAgencyConnectionRequest called with agencyIdToJoin:", agencyIdToJoin);
        console.log("userInfo.role:", userInfo.role);
        console.log("userInfo.user_id:", userInfo.user_id); // This is the problematic line

        if (userInfo.role !== 'agent' || !userInfo.user_id) { // Ensure user_id is present
            showMessage("Please ensure you are logged in as an agent and your user ID is available.", 'info'); // Updated message for clarity
            return;
        }
        if (!agencyIdToJoin) {
             showMessage("No agency selected for joining.", 'info');
             return;
        }

        // Check current status against the agency being clicked
        if (userInfo.agency_id === agencyIdToJoin) {
            if (agencyConnectionStatus === 'pending') {
                showMessage("Your request to join this agency is already pending.", 'info');
            } else if (agencyConnectionStatus === 'connected') {
                showMessage("You are already connected to this agency.", 'info');
            }
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.post(
                `${API_BASE_URL}/agencies/request-to-join`,
                { agency_id: agencyIdToJoin }, // Use agencyIdToJoin
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 201 || response.status === 200) {
                showMessage(response.data.message, 'success');
                // Optimistically update status for the selected agency
                setAgencyConnectionStatus('pending');
                setSelectedAgencyId(agencyIdToJoin); // Set this as the pending agency
                window.dispatchEvent(new Event("authChange"));
            }
        } catch (error) {
            console.error("Error sending agency connection request:", error.response?.data || error.message);
            showMessage(`Failed to send agency connection request: ${error.response?.data?.message || 'Please try again.'}`, 'error');
            fetchAgencyConnectionStatus();
        }
    };

    const handleDisconnectFromAgency = async () => {
        if (userInfo.role !== 'agent' || !userInfo.user_id || !selectedAgencyId || agencyConnectionStatus !== 'connected') {
            showMessage("You are not connected to an agency or cannot disconnect at this time.", 'info');
            return;
        }

        showConfirm({
            title: "Disconnect from Agency",
            message: `Are you sure you want to disconnect from ${userInfo.agency}? You can send a new request later.`,
            onConfirm: async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axiosInstance.delete(
                        `${API_BASE_URL}/agencies/${selectedAgencyId}/members/${userInfo.user_id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (response.status === 200) {
                        showMessage('Disconnected from agency successfully.', 'success');
                        setAgencyConnectionStatus('none');
                        setSelectedAgencyId(null);
                        // Update local user info to reflect no agency connection
                        // This will be handled by the AuthContext's authChange listener
                        window.dispatchEvent(new Event("authChange")); // Notify AuthContext
                    } else {
                        showMessage('Failed to disconnect from agency. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error("Error disconnecting from agency:", error.response?.data || error.message);
                    showMessage(`Failed to disconnect: ${error.response?.data?.message || 'Please try again.'}`, 'error');
                    fetchAgencyConnectionStatus();
                }
            },
            confirmLabel: "Disconnect",
            cancelLabel: "Cancel"
        });
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

    // Handle agency registration submission
    const handleRegisterAgency = async () => {
        // Client-side validation
        if (!newAgencyForm.name || !newAgencyForm.email || !newAgencyForm.phone) {
            showMessage("Agency name, email, and phone are required.", "error");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAgencyForm.email)) {
            showMessage("Please enter a valid email address for the agency.", "error");
            return;
        }

        setRegisteringAgency(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: newAgencyForm.name,
                address: newAgencyForm.address,
                phone: newAgencyForm.phone,
                email: newAgencyForm.email,
                website: newAgencyForm.website,
                description: newAgencyForm.description,
                logoBase64: newAgencyForm.logoBase64, // Pass base64 data
                logoOriginalname: newAgencyForm.logoOriginalname // Pass original name
            };

            // Call the new backend endpoint for agency registration by agent
            const response = await axiosInstance.post(
                `${API_BASE_URL}/agencies/register-agent-agency`, // This endpoint handles creation and role update
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showMessage("Agency registered and profile updated successfully!", "success");
            // Update local storage and AuthContext with the new token and user info
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            window.dispatchEvent(new Event("authChange")); // Notify AuthContext

            setShowRegisterAgencyAgencyForm(false); // Hide the form
            setNewAgencyForm({ // Reset form
                name: '', address: '', phone: '', email: '', website: '', description: '', logoBase64: null, logoOriginalname: null
            });
            setNewAgencyLogoPreview('');
            // Re-fetch connection status to reflect new role
            fetchAgencyConnectionStatus();

        } catch (error) {
            console.error("Error registering agency:", error.response?.data || error.message);
            showMessage(`Failed to register agency: ${error.response?.data?.message || 'Please try again.'}`, 'error');
        } finally {
            setRegisteringAgency(false);
        }
    };

    // New function to handle reverting from agency_admin to agent
    const handleRevertToAgent = async () => {
        showConfirm({
            title: "Revert to Agent Role",
            message: `Are you sure you want to step down as agency administrator and revert to a regular agent role? You will lose administrative privileges for ${userInfo.agency}.`,
            onConfirm: async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axiosInstance.put(
                        `${API_BASE_URL}/users/revert-to-agent`,
                        {}, // No body needed for this request
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (response.status === 200) {
                        showMessage(response.data.message, 'success');
                        // Update local storage and AuthContext with the new token and user info
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        window.dispatchEvent(new Event("authChange")); // Notify AuthContext
                        // Re-fetch connection status to reflect new role
                        fetchAgencyConnectionStatus();
                    }
                } catch (error) {
                    console.error("Error reverting role:", error.response?.data || error.message);
                    showMessage(`Failed to revert role: ${error.response?.data?.message || 'Please try again.'}`, 'error');
                }
            },
            confirmLabel: "Yes, Revert",
            cancelLabel: "Cancel"
        });
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="space-y-8 p-4 bg-transparent dark:bg-transparent rounded-none shadow-none max-w-full mx-auto my-0
                 md:p-0 md:bg-transparent md:dark:bg-transparent md:rounded-none md:shadow-none md:max-w-none md:mx-0 md:my-0"
        >
            <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    <User className="mr-3 text-green-500" size={24} /> General Information
                </h3>

                <div className="flex flex-col md:flex-row md:space-x-8 mb-6">
                    <div className="md:w-1/2 mb-6 md:mb-0">
                        <label className={labelStyles} htmlFor="profile_picture">Profile Picture</label>
                        <div className="flex flex-col items-center space-y-4 mt-2">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                {profilePicturePreview ? (
                                    <img
                                        src={profilePicturePreview}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-16 h-16 text-gray-400" />
                                )}
                                {profilePicturePreview && (
                                    <button
                                        type="button"
                                        onClick={handleClearProfilePicture}
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                        aria-label="Clear profile picture"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <input
                                type="file"
                                id="profile_picture"
                                name="profile_picture"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${darkMode ? "file:bg-green-600 file:text-white file:hover:bg-green-700 text-gray-300" : "file:bg-green-50 file:text-green-700 hover:file:bg-green-50 text-gray-700"}`}
                            />
                            <p className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                PNG, JPG, or GIF up to 5MB.
                            </p>
                        </div>
                    </div>

                    <div className="md:w-1/2">
                        <div className={inputGroupStyles}>
                            <label className={labelStyles} htmlFor="bio">About Me</label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={form.bio || ''}
                                onChange={handleChange}
                                rows="5"
                                className={`${inputFieldStyles} min-h-[100px]`}
                                placeholder="Tell us a little about yourself, your interests, or your professional background..."
                            ></textarea>
                            <p className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                A short description about yourself visible on your public profile.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={inputGroupStyles}>
                        <label className={labelStyles} htmlFor="full_name">Full Name</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            value={form.full_name || ''}
                            onChange={handleChange}
                            className={inputFieldStyles}
                            autoComplete="name"
                        />
                    </div>
                    <div className={inputGroupStyles}>
                        <label className={labelStyles} htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={form.username || ''}
                            onChange={handleChange}
                            className={inputFieldStyles}
                            autoComplete="username"
                        />
                    </div>
                    <div className={inputGroupStyles}>
                        <label className={labelStyles} htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={userInfo.email || ''}
                            className={`${inputFieldStyles} cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 text-gray-500"}`}
                            disabled
                            autoComplete="email"
                        />
                    </div>
                    <div className={inputGroupStyles}>
                        <label className={labelStyles} htmlFor="phone">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={form.phone || ''}
                            onChange={handleChange}
                            className={inputFieldStyles}
                            autoComplete="tel"
                        />
                    </div>
                    <div className={inputGroupStyles}>
                        <label className={labelStyles} htmlFor="location">Location</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={form.location || ''}
                            onChange={handleChange}
                            className={inputFieldStyles}
                            autoComplete="address-level1"
                        />
                    </div>
                    <div className={inputGroupStyles}>
                        <label className={labelStyles}>Date Joined</label>
                        <input
                            type="text"
                            value={userInfo.date_joined ? new Date(userInfo.date_joined).toLocaleDateString() : 'N/A'}
                            className={`${inputFieldStyles} cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 text-gray-500"}`}
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Agency Section (Refactored) */}
            {(userInfo.role === 'agent' || userInfo.role === 'agency_admin') && (
                <div className={`pb-6 mb-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                        <Landmark className="mr-3 text-orange-500" size={24} /> Agency
                    </h3>

                    {agencyConnectionStatus === 'loading' && (
                         <div className={`p-4 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"} flex items-center justify-center`}>
                            <Loader size={20} className="animate-spin mr-2" /> Loading agency status...
                        </div>
                    )}

                    {userInfo.role === 'agency_admin' && ( // Always show this if agency_admin
                        <div className="space-y-4">
                            <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                As an Agency Admin, you are associated with:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={inputGroupStyles}>
                                    <label className={labelStyles} htmlFor="agency_name_display">Agency Name</label>
                                    <input
                                        type="text"
                                        id="agency_name_display"
                                        value={userInfo.agency || 'N/A'}
                                        className={`${inputFieldStyles} cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 text-gray-500"}`}
                                        disabled
                                    />
                                </div>
                                <div className={inputGroupStyles}>
                                    <label className={labelStyles} htmlFor="agency_id_display">Agency ID</label>
                                    <input
                                        type="text"
                                        id="agency_id_display"
                                        value={userInfo.agency_id || 'N/A'}
                                        className={`${inputFieldStyles} cursor-not-allowed ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 text-gray-500"}`}
                                        disabled
                                    />
                                </div>
                            </div>
                            <p className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                To change your agency affiliation, you can step down as admin.
                            </p>
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={handleRevertToAgent}
                                    className={`px-6 py-2 rounded-full font-semibold transition duration-200 flex items-center justify-center
                                        ${darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                                >
                                    <UserX size={20} className="mr-2" /> Step Down as Admin
                                </button>
                            </div>
                        </div>
                    )}

                    {userInfo.role === 'agent' && ( // Only show this section if user is a regular agent
                        <div className="space-y-4">
                            <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                Manage your agency affiliation here.
                            </p>
                            {agencyConnectionStatus === 'connected' && userInfo.agency_id && (
                                <div className={`p-4 rounded-xl border ${darkMode ? "border-green-700 bg-green-900/20" : "border-green-200 bg-green-50"}`}>
                                    <p className={`font-semibold ${darkMode ? "text-green-300" : "text-green-800"} flex items-center`}>
                                        <CheckCircle size={20} className="mr-2" /> Connected to: {userInfo.agency} (ID: {userInfo.agency_id})
                                    </p>
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        You are an active member of this agency.
                                    </p>
                                    <div className="relative mt-4" ref={optionsMenuRef}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(!showOptionsMenu); }}
                                            className={`ml-1 p-1.5 rounded-full transition-all duration-200
                        ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"}`}
                                            title="More Options"
                                        >
                                            <EllipsisVertical size={20} />
                                        </button>
                                        {showOptionsMenu && (
                                            <div className={`absolute left-0 mt-2 w-48 rounded-md shadow-lg z-10
                        ${darkMode ? "bg-gray-700 ring-1 ring-gray-600" : "bg-white ring-1 ring-gray-200"}`}>
                                                <div className="py-1" role="menu" aria-orientation="vertical">
                                                    <button
                                                        onClick={handleDisconnectFromAgency}
                                                        className={`flex items-center w-full px-4 py-2 text-sm
                              ${darkMode ? "text-gray-200 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-100"}`}
                                                        role="menuitem"
                                                    >
                                                        <UserX size={16} className="mr-2" /> Disconnect
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {agencyConnectionStatus === 'pending' && userInfo.agency_id && (
                                <div className={`p-4 rounded-xl border ${darkMode ? "border-yellow-700 bg-yellow-900/20" : "border-yellow-200 bg-yellow-50"}`}>
                                    <p className={`font-semibold ${darkMode ? "text-yellow-300" : "text-yellow-800"} flex items-center`}>
                                        <Hourglass size={20} className="mr-2" /> Pending Request for: {userInfo.agency} (ID: {userInfo.agency_id})
                                    </p>
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Your request to join this agency is awaiting approval.
                                    </p>
                                </div>
                            )}

                            {agencyConnectionStatus === 'rejected' && userInfo.agency_id && (
                                <div className={`p-4 rounded-xl border ${darkMode ? "border-red-700 bg-red-900/20" : "border-red-200 bg-red-50"}`}>
                                    <p className={`font-semibold ${darkMode ? "text-red-300" : "text-red-800"} flex items-center`}>
                                        <UserX size={20} className="mr-2" /> Request Rejected by: {userInfo.agency} (ID: {userInfo.agency_id})
                                    </p>
                                    <p className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Your previous request to join this agency was rejected. You can try again or select another agency.
                                    </p>
                                    <button
                                        onClick={() => {
                                            // Clear the rejected status and allow re-request
                                            setAgencyConnectionStatus('none');
                                            setSelectedAgencyId(null);
                                            // The backend will handle clearing agency_id/agency from user profile when rejecting
                                            // For now, just trigger authChange to re-fetch user info
                                            window.dispatchEvent(new Event("authChange"));
                                        }}
                                        className={`mt-4 px-4 py-2 rounded-full font-semibold transition duration-200 flex items-center
                      ${darkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                                    >
                                        Clear Rejected Status
                                    </button>
                                </div>
                            )}

                            {/* Conditional visibility for "Register Your Agency" / "Select Agency to Join" */}
                            {agencyConnectionStatus === 'none' && (
                                <div className="space-y-6">
                                    {/* New Agency Registration Form (Modal/Expandable Section) */}
                                    <AnimatePresence>
                                        {showRegisterAgencyForm && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className={`relative mb-6 p-6 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-green-50"}`}
                                            >
                                                <h4 className={`text-xl font-bold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Register New Agency</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRegisterAgencyAgencyForm(false)}
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
                                                                    <Image className="w-12 h-12 text-gray-400" />
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
                                                        onClick={handleRegisterAgency}
                                                        disabled={registeringAgency}
                                                        className={`px-6 py-2 font-semibold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                                                            ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                                                    >
                                                        {registeringAgency ? (
                                                            <Loader size={20} className="animate-spin mr-2" />
                                                        ) : (
                                                            <Landmark size={20} className="mr-2" />
                                                        )}
                                                        {registeringAgency ? "Registering..." : "Register Agency"}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {!showRegisterAgencyForm && ( // Only show this button if the form is not open
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => setShowRegisterAgencyAgencyForm(true)}
                                                className={`px-6 py-2 rounded-full font-semibold transition duration-200 flex items-center justify-center
                                                    ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                                            >
                                                <Landmark size={20} className="mr-2" /> Register Your Agency
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <h4 className={`text-lg font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Or Join an Existing Agency</h4>
                                        <div className="relative mb-4">
                                            <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                                            <input
                                                type="text"
                                                placeholder="Search agencies by name or email..."
                                                value={agencySearchTerm}
                                                onChange={handleAgencySearchChange}
                                                className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                            />
                                        </div>

                                        {filteredAgencies.length > 0 ? (
                                            <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                                {filteredAgencies.map(agency => (
                                                    <li
                                                        key={agency.agency_id}
                                                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors duration-200
                                                            ${(userInfo.agency_id === agency.agency_id) ? (darkMode ? "bg-green-800 border-green-700" : "bg-green-100 border-green-200") : (darkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-white border-gray-200 hover:bg-gray-50")}`}
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
                                                        {/* Conditional action button/icon */}
                                                        {userInfo.agency_id === agency.agency_id ? (
                                                            // If this is the user's current agency
                                                            agencyConnectionStatus === 'connected' ? (
                                                                <CheckCircle size={24} className={`${darkMode ? "text-green-400" : "text-green-600"}`} title="Connected" />
                                                            ) : agencyConnectionStatus === 'pending' ? (
                                                                <Hourglass size={24} className={`${darkMode ? "text-yellow-400" : "text-yellow-600"} animate-pulse`} title="Pending Approval" />
                                                            ) : agencyConnectionStatus === 'rejected' ? (
                                                                <UserX size={24} className={`${darkMode ? "text-red-400" : "text-red-600"}`} title="Request Rejected" />
                                                            ) : null // Should not happen if agency_id matches
                                                        ) : (
                                                            // If this is another agency, and user is a regular agent not connected/pending
                                                            userInfo.role === 'agent' && agencyConnectionStatus === 'none' ? (
                                                                <button
                                                                    onClick={() => handleSendAgencyConnectionRequest(agency.agency_id)}
                                                                    className={`p-2 rounded-full transition-colors duration-200
                                                                        ${darkMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                                                                    title="Send Join Request"
                                                                >
                                                                    <UserPlus size={20} />
                                                                </button>
                                                            ) : null // For clients or agents already connected/pending elsewhere
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No agencies found matching your search.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className={`pb-6 mb-6 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-2xl font-bold mb-5 flex items-center ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    <Link className="mr-3 text-cyan-500" size={24} /> Social Media & Websites
                </h3>
                <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Add links to your social media profiles or personal websites.
                </p>
                <div className="space-y-4">
                    {socialLinks.map((link, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-3 md:items-end">
                            <div className="flex-grow">
                                <label className={labelStyles} htmlFor={`platform-${index}`}>Platform</label>
                                <input
                                    type="text"
                                    id={`platform-${index}`}
                                    value={link.platform}
                                    onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                                    className={inputFieldStyles}
                                    placeholder="e.g., LinkedIn, Twitter, Personal Website"
                                />
                            </div>
                            <div className="flex-grow-[2]">
                                <label className={labelStyles} htmlFor={`url-${index}`}>URL</label>
                                <input
                                    type="url"
                                    id={`url-${index}`}
                                    value={link.url}
                                    onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                    className={inputFieldStyles}
                                    placeholder="https://example.com/your-profile"
                                />
                            </div>
                            {socialLinks.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeSocialLink(index)}
                                    className={`flex-shrink-0 p-2 rounded-full ${darkMode ? "bg-red-700 hover:bg-red-600 text-white" : "bg-red-100 hover:bg-red-200 text-red-600"}`}
                                    aria-label="Remove social link"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addSocialLink}
                        className={`mt-4 px-4 py-2 rounded-full font-semibold transition duration-200 flex items-center ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
                    >
                        <Link size={18} className="mr-2" /> Add Another Link
                    </button>
                </div>
            </div>


            <div className="flex justify-center pt-8">
                <button
                    onClick={() => handleUpdate({})}
                    disabled={updating}
                    className="bg-green-600 text-white py-2.5 px-4 rounded-full hover:bg-green-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition duration-200 ease-in-out transform hover:scale-105 flex items-center"
                >

                    {updating ? (
                        <Loader size={20} className="animate-spin mr-2 inline-block" />
                    ) : (
                        <Save size={20} className="mr-2 inline-block" />
                    )}
                    {updating ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </motion.div>
    );
}

export default General;

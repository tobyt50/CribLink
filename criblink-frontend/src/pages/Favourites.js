import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard'; // Re-use ListingCard
import AgentCard from '../components/client/AgentCard'; // New: For displaying agents
import AgencyCard from '../components/AgencyCard'; // New: For displaying agencies
import ClientCard from '../components/agent/ClientCard'; // New: For displaying clients (re-used from agent dashboard)
import axiosInstance from '../api/axiosInstance'; // Use axiosInstance
import API_BASE_URL from '../config';
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook
import AdminSidebar from '../components/admin/Sidebar'; // Import AdminSidebar
import AgentSidebar from '../components/agent/Sidebar'; // Import AgentSidebar
import ClientSidebar from '../components/client/Sidebar'; // Import ClientSidebar
import AgencyAdminSidebar from '../components/agencyadmin/Sidebar'; // Import AgencyAdminSidebar
import { useMessage } from '../context/MessageContext'; // Import useMessage hook
import { useConfirmDialog } from '../context/ConfirmDialogContext'; // Import useConfirmDialog hook
import { useSidebarState } from '../hooks/useSidebarState'; // Import the hook
import PurchaseCategoryFilter from '../components/PurchaseCategoryFilter'; // Import PurchaseCategoryFilter

// Import necessary icons
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Menu, X, Search, SlidersHorizontal, FileText, LayoutGrid, LayoutList, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'; // Added ChevronLeft, ChevronRight for pagination

// Reusable Dropdown Component (copied and adapted from Listings.js)
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

        document.addEventListener("click", handleClickOutside); // Changed from mousedown to click
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("click", handleClickOutside); // Changed from mousedown to click
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
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} // Added e.stopPropagation() here
                className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10
                  ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
            >
                <span className="overflow-hidden truncate">{selectedOptionLabel}</span>
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
                        className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 overflow-hidden transform origin-top
                          ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                        {options.map((option) => (
                            <motion.button
                                key={option.value}
                                variants={itemVariants}
                                whileHover={{ x: 5 }}
                                onClick={(e) => {
                                    e.stopPropagation(); // Stop propagation to prevent parent from closing
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


const ITEMS_PER_PAGE = 20; // Define items per page

const Favourites = () => {
    const [favouriteListings, setFavouriteListings] = useState([]);
    const [favouriteAgents, setFavouriteAgents] = useState([]); // New state for favourite agents
    const [favouriteAgencies, setFavouriteAgencies] = useState([]); // New state for favourite agencies
    const [favouriteClients, setFavouriteClients] = useState([]); // New state for favourite clients (for agents/agency_admins)

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultListingsView') || 'graphical');
    const [sortKey, setSortKey] = useState('date_listed');
    const [sortDirection, setSortDirection] = useState('desc');
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState('');
    const [agencyId, setAgencyId] = useState(null); // New state for agencyId
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();

    // Filter states
    const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState('');
    const [minPriceFilter, setMinPriceFilter] = useState('');
    const [maxPriceFilter, setMaxPriceFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [agentStatusFilter, setAgentStatusFilter] = useState('all'); // For agents tab
    const [agencyStatusFilter, setAgencyStatusFilter] = useState('all'); // For agencies tab

    // Modal and export dropdown states
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    // New state for controlling filter dropdown visibility within search bar
    const [showSearchBarFilters, setShowSearchBarFilters] = useState(false);
    const filterAreaRef = useRef(null); // Ref for the entire filter area (search bar + dropdowns)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1); // Renamed from 'page' to 'currentPage' for consistency with Home.js
    const [totalItems, setTotalItems] = useState(0); // Total items for the active tab
    const [totalPages, setTotalPages] = useState(1);

    // Use the useSidebarState hook
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
    const [activeSection, setActiveSection] = useState('favourites'); // Set active section for sidebar

    // New: Active tab state
    const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'agents', 'agencies', 'clients'

    // Consistent transition for main content motion (0.3s)
    const mainContentTransition = { duration: 0.3, ease: 'easeInOut' };

    // Fetch user details on component mount
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setUserRole('guest');
                showMessage("Authentication token not found. Please sign in.", 'error');
                navigate('/signin'); // Redirect if no token
                return;
            }
            try {
                const { data } = await axiosInstance.get(`${API_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (data && data.user_id && data.role) {
                    setUserId(data.user_id);
                    setUserRole(data.role);
                    setAgencyId(data.agency_id); // Set agency ID
                } else {
                    showMessage("User ID or role not found in profile data. Please sign in.", 'error');
                    navigate('/signin');
                }
            } catch (error) {
                let errorMessage = 'Failed to fetch user data. Please try again.';
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                showMessage(errorMessage, 'error');
                navigate('/signin');
            }
        };
        fetchUser();
    }, [navigate, showMessage]);

    // Effect to update localStorage when viewMode changes
    useEffect(() => {
        localStorage.setItem('defaultListingsView', viewMode);
    }, [viewMode]);

    // Effect for handling click outside export dropdown and search bar filters
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setIsExportDropdownOpen(false);
            }
            // Close search bar filters if click outside
            if (filterAreaRef.current && !filterAreaRef.current.contains(e.target)) {
                setShowSearchBarFilters(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsExportDropdownOpen(false);
                setShowSearchBarFilters(false);
            }
        };

        document.addEventListener('click', handleClickOutside); // Changed from mousedown to click
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('click', handleClickOutside); // Changed from mousedown to click
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    // Fetch favourite items based on active tab
    const fetchFavourites = useCallback(async () => {
        if (!userId) {
            return;
        }
        const token = localStorage.getItem('token');
        const commonParams = { page: currentPage, limit: ITEMS_PER_PAGE, sort: sortKey, direction: sortDirection, search: searchTerm };
        let url = '';
        let dataKey = '';

        try {
            switch (activeTab) {
                case 'listings':
                    url = `${API_BASE_URL}/favourites?${new URLSearchParams({
                        ...commonParams,
                        purchase_category: purchaseCategoryFilter,
                        min_price: minPriceFilter,
                        max_price: maxPriceFilter,
                        status: statusFilter
                    }).toString()}`;
                    dataKey = 'favourites';
                    break;
                case 'agents':
                    url = `${API_BASE_URL}/favourites/agents?${new URLSearchParams({
                        ...commonParams,
                        status: agentStatusFilter
                    }).toString()}`;
                    dataKey = 'agents';
                    break;
                case 'agencies':
                    url = `${API_BASE_URL}/favourites/agencies?${new URLSearchParams({
                        ...commonParams,
                        status: agencyStatusFilter
                    }).toString()}`;
                    dataKey = 'agencies';
                    break;
                case 'clients':
                    // This tab is for agents/agency_admins to favourite clients
                    url = `${API_BASE_URL}/favourites/clients?${new URLSearchParams(commonParams).toString()}`;
                    dataKey = 'clients';
                    break;
                default:
                    return;
            }

            const response = await axiosInstance.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = response.data[dataKey] || [];
            const total = response.data.total || 0;
            const pages = response.data.totalPages || 1;

            if (activeTab === 'listings') {
                setFavouriteListings(data);
            } else if (activeTab === 'agents') {
                setFavouriteAgents(data);
            } else if (activeTab === 'agencies') {
                setFavouriteAgencies(data);
            } else if (activeTab === 'clients') {
                setFavouriteClients(data);
            }
            setTotalItems(total);
            setTotalPages(pages);

        } catch (error) {
            let errorMessage = `Failed to fetch favourite ${activeTab}. Please try again.`;
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
            if (activeTab === 'listings') setFavouriteListings([]);
            else if (activeTab === 'agents') setFavouriteAgents([]);
            else if (activeTab === 'agencies') setFavouriteAgencies([]);
            else if (activeTab === 'clients') setFavouriteClients([]);
            setTotalItems(0);
            setTotalPages(1);
        }
    }, [userId, currentPage, sortKey, sortDirection, searchTerm, purchaseCategoryFilter, minPriceFilter, maxPriceFilter, statusFilter, agentStatusFilter, agencyStatusFilter, activeTab, showMessage]);

    useEffect(() => {
        fetchFavourites();
    }, [fetchFavourites, activeTab]); // Re-fetch when activeTab changes

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    // Filter handlers
    const handlePurchaseCategoryChange = (value) => {
        setPurchaseCategoryFilter(value);
        setCurrentPage(1);
    };

    const handleMinPriceChange = (e) => {
        setMinPriceFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleMaxPriceChange = (e) => {
        setMaxPriceFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleAgentStatusChange = (value) => {
        setAgentStatusFilter(value);
        setCurrentPage(1);
    };

    const handleAgencyStatusChange = (value) => {
        setAgencyStatusFilter(value);
        setCurrentPage(1);
    };

    const handleSortClick = (key) => {
        const sortableColumns = {
            'listings': ['property_id', 'title', 'location', 'property_type', 'price', 'date_listed', 'status', 'purchase_category', 'bedrooms', 'bathrooms'],
            'agents': ['full_name', 'email', 'phone', 'date_joined', 'user_status', 'agency_name', 'avg_rating'],
            'agencies': ['name', 'email', 'phone', 'created_at', 'status'],
            'clients': ['full_name', 'email', 'phone', 'date_joined', 'user_status', 'client_status']
        };
        if (!sortableColumns[activeTab].includes(key)) return;

        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
        setCurrentPage(1); // Reset to first page on sort change
    };

    const renderSortIcon = (key) => {
        const sortableColumns = {
            'listings': ['property_id', 'title', 'location', 'property_type', 'price', 'date_listed', 'status', 'purchase_category', 'bedrooms', 'bathrooms'],
            'agents': ['full_name', 'email', 'phone', 'date_joined', 'user_status', 'agency_name', 'avg_rating'],
            'agencies': ['name', 'email', 'phone', 'created_at', 'status'],
            'clients': ['full_name', 'email', 'phone', 'date_joined', 'user_status', 'client_status']
        };
        if (!sortableColumns[activeTab].includes(key)) return null;

        if (sortKey === key) {
            return sortDirection === 'asc' ? (
                <ArrowUpIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
            ) : (
                <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
            );
        }
        return <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;
    };

    const performRemoveFavourite = async (id, type) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage("Authentication token not found. Please log in.", 'error');
            return;
        }

        let endpoint = '';
        let successMessage = '';
        let errorMessage = '';

        switch (type) {
            case 'listings':
                endpoint = `${API_BASE_URL}/favourites/${id}`;
                successMessage = `Listing ${id} removed from favourites!`;
                errorMessage = 'Failed to remove listing from favourites.';
                break;
            case 'agents':
                endpoint = `${API_BASE_URL}/favourites/agents/${id}`;
                successMessage = `Agent ${id} removed from favourites!`;
                errorMessage = 'Failed to remove agent from favourites.';
                break;
            case 'agencies':
                endpoint = `${API_BASE_URL}/favourites/agencies/${id}`;
                successMessage = `Agency ${id} removed from favourites!`;
                errorMessage = 'Failed to remove agency from favourites.';
                break;
            case 'clients':
                endpoint = `${API_BASE_URL}/favourites/clients/${id}`;
                successMessage = `Client ${id} removed from favourites!`;
                errorMessage = 'Failed to remove client from favourites.';
                break;
            default:
                showMessage('Invalid favourite type.', 'error');
                return;
        }

        try {
            await axiosInstance.delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage(successMessage, 'info');
            fetchFavourites(); // Refetch items to update the list
        } catch (error) {
            let msg = errorMessage;
            if (error.response && error.response.data && error.response.data.message) {
                msg = error.response.data.message;
            } else if (error.message) {
                msg = error.message;
            }
            showMessage(msg, 'error');
        }
    };

    const handleRemoveFavourite = (id, type) => {
        showConfirm({
            title: `Remove from Favourites (${capitalizeFirstLetter(type)})`,
            message: `Are you sure you want to remove this ${type.slice(0, -1)} from your favourites?`,
            onConfirm: () => performRemoveFavourite(id, type),
            confirmLabel: "Remove",
            cancelLabel: "Cancel"
        });
    };

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    // Calculate contentShift based on collapsed state and isMobile
    const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

    // Conditionally render the sidebar based on userRole
    const renderSidebar = () => {
        const commonSidebarProps = {
            isMobile,
            isSidebarOpen,
            setIsSidebarOpen,
            collapsed: isMobile ? false : isCollapsed, // Sidebar is never collapsed in mobile view
            setCollapsed: isMobile ? () => { } : setIsCollapsed, // Disable setCollapsed on mobile
            activeSection: activeSection,
            setActiveSection: setActiveSection,
        };

        if (userRole === 'admin') {
            return <AdminSidebar {...commonSidebarProps} />;
        } else if (userRole === 'agent') {
            return <AgentSidebar {...commonSidebarProps} />;
        } else if (userRole === 'client') {
            return <ClientSidebar {...commonSidebarProps} />;
        } else if (userRole === 'agency_admin') {
            return <AgencyAdminSidebar {...commonSidebarProps} />;
        }
        return null; // Or a default empty sidebar if needed for other roles
    };

    const statusOptions = [
        { value: "all", label: "All statuses" },
        { value: "available", label: "Available" },
        { value: "sold", label: "Sold" },
        { value: "under offer", label: "Under offer" },
        { value: "pending", label: "Pending" },
        { value: "rejected", label: "Rejected" },
        { value: "featured", label: "Featured" }
    ];

    const agentStatusOptions = [
        { value: "all", label: "All statuses" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "on_leave", label: "On Leave" }
    ];

    const agencyStatusOptions = [
        { value: "all", label: "All statuses" },
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" }
    ];

    const handleExportCsv = async (scope) => {
        let dataToExport = [];
        let headers = [];
        let fileName = '';

        const fetchAllDataForExport = async (tab) => {
            if (!userId) {
                showMessage("User not authenticated to fetch all data for export.", 'error');
                return [];
            }
            const token = localStorage.getItem('token');
            let url = '';
            const commonParams = { limit: 99999, sort: sortKey, direction: sortDirection, search: searchTerm };

            switch (tab) {
                case 'listings':
                    url = `${API_BASE_URL}/favourites?${new URLSearchParams({
                        ...commonParams,
                        purchase_category: purchaseCategoryFilter,
                        min_price: minPriceFilter,
                        max_price: maxPriceFilter,
                        status: statusFilter
                    }).toString()}`;
                    break;
                case 'agents':
                    url = `${API_BASE_URL}/favourites/agents?${new URLSearchParams({
                        ...commonParams,
                        status: agentStatusFilter
                    }).toString()}`;
                    break;
                case 'agencies':
                    url = `${API_BASE_URL}/favourites/agencies?${new URLSearchParams({
                        ...commonParams,
                        status: agencyStatusFilter
                    }).toString()}`;
                    break;
                case 'clients':
                    url = `${API_BASE_URL}/favourites/clients?${new URLSearchParams(commonParams).toString()}`;
                    break;
                default:
                    return [];
            }

            try {
                const response = await axiosInstance.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                return response.data[tab] || [];
            } catch (error) {
                let msg = `Failed to fetch all favourite ${tab} for export.`;
                if (error.response && error.response.data && error.response.data.message) {
                    msg = error.response.data.message;
                } else if (error.message) {
                    msg = error.message;
                }
                showMessage(msg, 'error');
                return [];
            }
        };

        if (scope === 'current') {
            if (activeTab === 'listings') dataToExport = favouriteListings;
            else if (activeTab === 'agents') dataToExport = favouriteAgents;
            else if (activeTab === 'agencies') dataToExport = favouriteAgencies;
            else if (activeTab === 'clients') dataToExport = favouriteClients;
        } else { // scope === 'all'
            dataToExport = await fetchAllDataForExport(activeTab);
        }

        if (dataToExport.length === 0) {
            showMessage(`No favourite ${activeTab} data found for ${scope} export.`, 'info');
            setIsExportDropdownOpen(false);
            return;
        }

        switch (activeTab) {
            case 'listings':
                headers = ['property_id', 'purchase_category', 'title', 'location', 'state', 'price', 'status', 'date_listed', 'property_type', 'bedrooms', 'bathrooms'];
                fileName = 'favourite_listings.csv';
                break;
            case 'agents':
                headers = ['user_id', 'full_name', 'email', 'phone', 'agency_name', 'avg_rating', 'deals_closed', 'date_joined', 'user_status'];
                fileName = 'favourite_agents.csv';
                break;
            case 'agencies':
                headers = ['agency_id', 'name', 'email', 'phone', 'website', 'address', 'description', 'created_at'];
                fileName = 'favourite_agencies.csv';
                break;
            case 'clients':
                headers = ['user_id', 'full_name', 'email', 'phone', 'date_joined', 'status', 'client_status', 'notes'];
                fileName = 'favourite_clients.csv';
                break;
            default:
                return;
        }

        const csvRows = dataToExport.map(item => {
            const row = headers.map(header => {
                let value = item[header];
                if (header === 'date_listed' || header === 'created_at' || header === 'date_joined') {
                    value = value ? new Date(value).toLocaleDateString() : 'N/A';
                } else if (header === 'price') {
                    value = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);
                } else if (header === 'avg_rating' && value != null) {
                    value = parseFloat(value).toFixed(1);
                }
                return `"${String(value || '').replace(/"/g, '""')}"`;
            });
            return row.join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportDropdownOpen(false);
        showMessage(`Favourite ${activeTab} data exported successfully!`, 'success');
    };

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    }, [totalPages]);

    // Handlers for client/agent/agency actions (placeholder for now)
    const handleViewProfile = (id, type) => {
        if (type === 'agents') navigate(`/agents/${id}`);
        else if (type === 'agencies') navigate(`/agencies/${id}`);
        else if (type === 'clients') navigate(`/agent/client-profile/${id}`); // Assuming this path for client profiles
        else if (type === 'listings') navigate(`/listings/${id}`);
    };

    const handleCall = (phone) => {
        if (phone) {
            window.location.href = `tel:${phone}`;
        } else {
            showMessage('Phone number not available.', 'info');
        }
    };

    const handleEmail = (email) => {
        if (email) {
            window.location.href = `mailto:${email}`;
        } else {
            showMessage('Email address not available.', 'info');
        }
    };

    const handleChat = (item, type) => {
        showMessage(`Initiating chat with ${item.full_name || item.name} (${type})... (Functionality to be implemented)`, 'info');
        // Placeholder for chat functionality
        // This would typically open a chat modal or navigate to a chat page
    };

    const getTabOptions = () => {
        if (userRole === 'client' || userRole === 'admin') {
            return [
                { id: 'listings', label: 'Listings' },
                { id: 'agents', label: 'Agents' },
                { id: 'agencies', label: 'Agencies' },
            ];
        } else if (userRole === 'agent') {
            return [
                { id: 'listings', label: 'Listings' },
                { id: 'clients', label: 'Clients' },
                { id: 'agencies', label: 'Agencies' },
            ];
        } else if (userRole === 'agency_admin') {
            return [
                { id: 'listings', label: 'Listings' },
                { id: 'agents', label: 'Agents' },
                { id: 'clients', label: 'Clients' },
            ];
        }
        return [{ id: 'listings', label: 'Listings' }]; // Default for guest or unknown roles
    };

    const renderContent = () => {
        if (userId === null) {
            return (
                <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Loading user data... Please ensure you are logged in to view your favourites.
                </div>
            );
        }

        let dataToDisplay = [];
        let cardComponent = null;
        let tableHeaders = [];
        let tableRowMapper = () => [];

        if (activeTab === 'listings') {
            dataToDisplay = favouriteListings;
            cardComponent = ListingCard;
            tableHeaders = ['property_id', 'title', 'location', 'property_type', 'price', 'date_listed', 'status', 'purchase_category', 'bedrooms', 'bathrooms', 'actions'];
            tableRowMapper = (listing) => (
                <>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[80px]" title={listing.property_id || ''}>{listing.property_id}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[120px]" title={listing.title || ''}>{listing.title}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[120px]" title={listing.location || ''}>{listing.location}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={listing.property_type || ''}>{listing.property_type}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price)}>
                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price)}
                    </td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 'N/A'}>{listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 'N/A'}</td>
                    <td className={`py-2 px-2 max-w-[80px] truncate font-semibold ${
                        listing.status && listing.status.toLowerCase() === 'available' ? 'text-green-600' :
                        listing.status && listing.status.toLowerCase() === 'sold' ? 'text-red-600' :
                        listing.status && listing.status.toLowerCase() === 'under offer' ? 'text-yellow-600' :
                        listing.status && listing.status.toLowerCase() === 'pending' ? 'text-blue-600' :
                        listing.status && listing.status.toLowerCase() === 'rejected' ? 'text-purple-600' :
                        'text-gray-600'
                    }`} title={capitalizeFirstLetter(listing.status)}>{capitalizeFirstLetter(listing.status)}</td>
                    <td className="py-2 px-2 max-w-[100px] truncate" title={listing.purchase_category && listing.purchase_category.length > 12 ? listing.purchase_category : ''}>{listing.purchase_category}</td>
                    <td className="py-2 px-2 max-w-[70px] truncate" title={listing.bedrooms ? listing.bedrooms.toString() : ''}>{listing.bedrooms}</td>
                    <td className="py-2 px-2 max-w-[70px] truncate" title={listing.bathrooms ? listing.bathrooms.toString() : ''}>{listing.bathrooms}</td>
                    <td className="py-2 px-1 whitespace-nowrap max-w-[80px]">
                        <button
                            className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
                            onClick={() => handleRemoveFavourite(listing.property_id, 'listings')}
                            title="Remove from Favourites"
                        >
                            <TrashIcon className="h-6 w-6" />
                        </button>
                    </td>
                </>
            );
        } else if (activeTab === 'agents') {
            dataToDisplay = favouriteAgents;
            cardComponent = AgentCard;
            tableHeaders = ['full_name', 'email', 'phone', 'agency_name', 'avg_rating', 'deals_closed', 'actions'];
            tableRowMapper = (agent) => (
                <>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[120px]" title={agent.full_name || ''}>{agent.full_name}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[150px]" title={agent.email || ''}>{agent.email}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={agent.phone || ''}>{agent.phone || 'N/A'}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[120px]" title={agent.agency_name || ''}>{agent.agency_name || 'N/A'}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[80px]" title={agent.avg_rating != null ? agent.avg_rating.toFixed(1) : 'N/A'}>{agent.avg_rating != null ? agent.avg_rating.toFixed(1) : 'N/A'}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={agent.deals_closed != null ? agent.deals_closed.toString() : 'N/A'}>{agent.deals_closed != null ? agent.deals_closed : 'N/A'}</td>
                    <td className="py-2 px-1 whitespace-nowrap max-w-[150px] flex gap-2">
                        <button
                            className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                            onClick={() => handleViewProfile(agent.user_id, 'agents')}
                            title="View Profile"
                        >
                            <Search className="h-5 w-5" />
                        </button>
                        <button
                            className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
                            onClick={() => handleRemoveFavourite(agent.user_id, 'agents')}
                            title="Remove from Favourites"
                        >
                            <TrashIcon className="h-6 w-6" />
                        </button>
                    </td>
                </>
            );
        } else if (activeTab === 'agencies') {
            dataToDisplay = favouriteAgencies;
            cardComponent = AgencyCard;
            tableHeaders = ['name', 'email', 'phone', 'website', 'address', 'actions'];
            tableRowMapper = (agency) => (
                <>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[150px]" title={agency.name || ''}>{agency.name}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[150px]" title={agency.email || ''}>{agency.email}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={agency.phone || ''}>{agency.phone || 'N/A'}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[150px]" title={agency.website || ''}>{agency.website || 'N/A'}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[150px]" title={agency.address || ''}>{agency.address || 'N/A'}</td>
                    <td className="py-2 px-1 whitespace-nowrap max-w-[150px] flex gap-2">
                        <button
                            className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                            onClick={() => handleViewProfile(agency.agency_id, 'agencies')}
                            title="View Profile"
                        >
                            <Search className="h-5 w-5" />
                        </button>
                        <button
                            className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
                            onClick={() => handleRemoveFavourite(agency.agency_id, 'agencies')}
                            title="Remove from Favourites"
                        >
                            <TrashIcon className="h-6 w-6" />
                        </button>
                    </td>
                </>
            );
        } else if (activeTab === 'clients') { // Only for agent/agency_admin roles
            dataToDisplay = favouriteClients;
            cardComponent = ClientCard;
            tableHeaders = ['full_name', 'email', 'phone', 'client_status', 'notes', 'actions'];
            tableRowMapper = (client) => (
                <>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[120px]" title={client.full_name || ''}>{client.full_name}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[150px]" title={client.email || ''}>{client.email}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={client.phone || ''}>{client.phone || 'N/A'}</td>
                    <td className={`py-2 px-2 max-w-[80px] truncate font-semibold ${
                        client.client_status === 'vip' ? 'text-green-600' :
                        (darkMode ? 'text-gray-300' : 'text-gray-600')
                    }`} title={client.client_status || 'regular'}>{client.client_status || 'regular'}</td>
                    <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[200px]" title={client.notes || ''}>{client.notes || 'N/A'}</td>
                    <td className="py-2 px-1 whitespace-nowrap max-w-[150px] flex gap-2">
                        <button
                            className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                            onClick={() => handleViewProfile(client.user_id, 'clients')}
                            title="View Profile"
                        >
                            <Search className="h-5 w-5" />
                        </button>
                        <button
                            className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
                            onClick={() => handleRemoveFavourite(client.user_id, 'clients')}
                            title="Remove from Favourites"
                        >
                            <TrashIcon className="h-6 w-6" />
                        </button>
                    </td>
                </>
            );
        }

        if (dataToDisplay.length === 0) {
            return (
                <div className={`col-span-full text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    No favourite {activeTab} found.
                </div>
            );
        }

        if (viewMode === 'graphical') {
            return (
                <motion.div
                    layout
                    className="grid gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5" // 2 columns for mobile, 5 for desktop
                >
                    {dataToDisplay.map((item) => {
                        const commonProps = {
                            key: item.property_id || item.user_id || item.agency_id,
                            darkMode: darkMode,
                            onFavoriteToggle: () => handleRemoveFavourite(item.property_id || item.user_id || item.agency_id, activeTab),
                            isFavoritedProp: true, // Always true for favourites page
                        };
                        if (activeTab === 'listings') {
                            return <ListingCard {...commonProps} listing={item} userId={userId} userRole={userRole} />;
                        } else if (activeTab === 'agents') {
                            return <AgentCard {...commonProps} agent={item} onConnect={() => handleChat(item, 'agents')} onEmail={() => handleEmail(item.email)} onCall={() => handleCall(item.phone)} onViewProfile={() => handleViewProfile(item.user_id, 'agents')} />;
                        } else if (activeTab === 'agencies') {
                            return <AgencyCard {...commonProps} agency={item} onViewProfile={() => handleViewProfile(item.agency_id, 'agencies')} />;
                        } else if (activeTab === 'clients') {
                            return <ClientCard {...commonProps} client={item} onViewProfile={() => handleViewProfile(item.user_id, 'clients')} onCallClient={() => handleCall(item.phone)} onRespondInquiry={() => handleChat(item, 'clients')} onToggleStatus={() => {}} onRemoveClient={() => handleRemoveFavourite(item.user_id, 'clients')} userRole={userRole} />;
                        }
                        return null;
                    })}
                </motion.div>
            );
        } else { // Simple (List) view
            return (
                <div className="overflow-x-auto">
                    <table className={`w-full mt-4 text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        <thead>
                            <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {tableHeaders.map((key) => (
                                    <th
                                        key={key}
                                        onClick={key !== 'actions' ? () => handleSortClick(key) : undefined}
                                        className={`py-2 px-1 whitespace-nowrap truncate ${key !== 'actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                                        style={{
                                            width:
                                                key === 'property_id' ? '80px' :
                                                key === 'user_id' || key === 'agency_id' ? '80px' :
                                                key === 'title' || key === 'name' || key === 'full_name' ? '120px' :
                                                key === 'location' || key === 'agency_name' || key === 'email' || key === 'website' || key === 'address' ? '150px' :
                                                key === 'property_type' || key === 'phone' || key === 'status' || key === 'client_status' ? '100px' :
                                                key === 'price' || key === 'date_listed' || key === 'created_at' || key === 'date_joined' || key === 'avg_rating' || key === 'deals_closed' ? '100px' :
                                                key === 'purchase_category' ? '100px' :
                                                key === 'bedrooms' || key === 'bathrooms' ? '70px' :
                                                key === 'notes' ? '200px' :
                                                key === 'actions' ? '150px' : 'auto'
                                        }}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span className="truncate">
                                                {{
                                                    property_id: 'ID',
                                                    user_id: 'ID',
                                                    agency_id: 'ID',
                                                    property_type: 'Type',
                                                    purchase_category: 'Category',
                                                    full_name: 'Name',
                                                    agency_name: 'Agency',
                                                    avg_rating: 'Rating',
                                                    deals_closed: 'Deals',
                                                    client_status: 'Status',
                                                    date_listed: 'Listed Date',
                                                    date_joined: 'Joined Date',
                                                    created_at: 'Created Date',
                                                    actions: 'Actions'
                                                }[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                            {renderSortIcon(key)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                            {dataToDisplay.map((item) => (
                                <tr key={item.property_id || item.user_id || item.agency_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                                    {tableRowMapper(item)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    };

    const tabOptions = getTabOptions();

    return (
        <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex`}>
            {/* Mobile Sidebar Toggle Button */}
            {isMobile && (
                <motion.button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-white"}`}
                    initial={false}
                    animate={{ rotate: isSidebarOpen ? 180 : 0, opacity: 1 }}
                    transition={mainContentTransition}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={isSidebarOpen ? 'close' : 'menu'}
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </motion.div>
                    </AnimatePresence>
                </motion.button>
            )}

            {/* Conditionally rendered Sidebar */}
            {renderSidebar()}

            {/* Main Content Area */}
            <motion.div
                key={isMobile ? 'mobile-content' : 'desktop-content'}
                style={{ marginLeft: contentShift }}
                animate={{ marginLeft: contentShift }}
                transition={mainContentTransition}
                initial={false}
                className="flex-1 overflow-auto pt-6 px-4 md:px-8"
            >
                {/* Headers */}
                <div className="md:hidden flex items-center justify-center mb-4">
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Favourites</h1>
                </div>
                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Favourites</h1>
                </div>

                <main className="space-y-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`space-y-4 max-w-full ${!isMobile ? (darkMode ? "bg-gray-800 rounded-3xl p-6 shadow" : "bg-white rounded-3xl p-6 shadow") : ''}`}>
                        {/* Control Menu - Desktop and Mobile */}
                        {isMobile ? (
                            <div className="flex flex-col gap-4 mb-6">
                                {/* Search Bar, Export, View Mode on one line for mobile */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 relative" ref={filterAreaRef}>
                                        <input
                                            type="text"
                                            placeholder={`Search favourite ${activeTab}...`}
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters(prev => !prev); }}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`}
                                            title="Filter Favourites"
                                        >
                                            <SlidersHorizontal size={20} />
                                        </button>
                                        <AnimatePresence>
                                            {showSearchBarFilters && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4
                                                        ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
                                                >
                                                    {activeTab === 'listings' && (
                                                        <>
                                                            <div>
                                                                <label htmlFor="purchase-category-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                    Purchase Category
                                                                </label>
                                                                <PurchaseCategoryFilter
                                                                    selectedCategory={purchaseCategoryFilter}
                                                                    onChange={handlePurchaseCategoryChange}
                                                                    className="w-full"
                                                                    buttonClassName={`py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                                                        darkMode
                                                                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                                                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                                                    }`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label htmlFor="status-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                    Status
                                                                </label>
                                                                <Dropdown
                                                                    placeholder="Select Status"
                                                                    options={statusOptions}
                                                                    value={statusFilter}
                                                                    onChange={handleStatusChange}
                                                                    className="w-full"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label htmlFor="min-price-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                    Min Price
                                                                </label>
                                                                <div className="relative">
                                                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Min Price"
                                                                        value={minPriceFilter}
                                                                        onChange={handleMinPriceChange}
                                                                        className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                                                            darkMode
                                                                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                                                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                                                        }`}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label htmlFor="max-price-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                    Max Price
                                                                </label>
                                                                <div className="relative">
                                                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Max Price"
                                                                        value={maxPriceFilter}
                                                                        onChange={handleMaxPriceChange}
                                                                        className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                                                            darkMode
                                                                                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                                                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                                                        }`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                    {activeTab === 'agents' && (
                                                        <div>
                                                            <label htmlFor="agent-status-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                Agent Status
                                                            </label>
                                                            <Dropdown
                                                                placeholder="Select Status"
                                                                options={agentStatusOptions}
                                                                value={agentStatusFilter}
                                                                onChange={handleAgentStatusChange}
                                                                className="w-full"
                                                            />
                                                        </div>
                                                    )}
                                                    {activeTab === 'agencies' && (
                                                        <div>
                                                            <label htmlFor="agency-status-filter-mobile" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                Agency Status
                                                            </label>
                                                            <Dropdown
                                                                placeholder="Select Status"
                                                                options={agencyStatusOptions}
                                                                value={agencyStatusFilter}
                                                                onChange={handleAgencyStatusChange}
                                                                className="w-full"
                                                            />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="relative inline-block text-left flex-shrink-0" ref={exportDropdownRef}>
                                        <button
                                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                                            className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                            title="Export"
                                        >
                                            <FileText size={20} />
                                        </button>
                                        {isExportDropdownOpen && (
                                            <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                                                <div className="py-1">
                                                    <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                                                    <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All {capitalizeFirstLetter(activeTab)}</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-shrink-0 flex gap-2">
                                        <button
                                            className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                            onClick={() => setViewMode('graphical')}
                                            title="Grid View"
                                        >
                                            <LayoutGrid className="h-6 w-6" />
                                        </button>
                                        <button
                                            className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                            onClick={() => setViewMode('simple')}
                                            title="List View"
                                        >
                                            <LayoutList className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                                {/* Tabs for Mobile (below search/export/viewmode) */}
                                <div className="flex justify-center w-full">
                                    {tabOptions.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setActiveTab(tab.id); setCurrentPage(1); setSearchTerm(''); setSortKey('date_listed'); setSortDirection('desc'); }}
                                            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-colors duration-200
                                                ${activeTab === tab.id ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}
                                                ${tabOptions.length > 1 ? (tab.id === tabOptions[0].id ? 'rounded-r-none' : tab.id === tabOptions[tabOptions.length - 1].id ? 'rounded-l-none' : 'rounded-none') : ''}
                                            `}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-4 mb-6"> {/* Desktop layout */}
                                {/* Search Bar on the left */}
                                <div className="flex-1 relative max-w-sm" ref={filterAreaRef}>
                                    <input
                                        type="text"
                                        placeholder={`Search favourite ${activeTab}...`}
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters(prev => !prev); }}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`}
                                        title="Filter Favourites"
                                    >
                                        <SlidersHorizontal size={20} />
                                    </button>
                                    <AnimatePresence>
                                        {showSearchBarFilters && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl shadow-lg z-50 space-y-4
                                                    ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
                                            >
                                                {activeTab === 'listings' && (
                                                    <>
                                                        <div>
                                                            <label htmlFor="purchase-category-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                Purchase Category
                                                            </label>
                                                            <PurchaseCategoryFilter
                                                                selectedCategory={purchaseCategoryFilter}
                                                                onChange={handlePurchaseCategoryChange}
                                                                className="w-full"
                                                                buttonClassName={`py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                                                    darkMode
                                                                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                                                }`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="status-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                Status
                                                            </label>
                                                            <Dropdown
                                                                placeholder="Select Status"
                                                                options={statusOptions}
                                                                value={statusFilter}
                                                                onChange={handleStatusChange}
                                                                className="w-full"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="min-price-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                Min Price
                                                            </label>
                                                            <div className="relative">
                                                                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Min Price"
                                                                    value={minPriceFilter}
                                                                    onChange={handleMinPriceChange}
                                                                    className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                                                        darkMode
                                                                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                                                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                                                    }`}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label htmlFor="max-price-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                                Max Price
                                                            </label>
                                                            <div className="relative">
                                                                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Max Price"
                                                                    value={maxPriceFilter}
                                                                    onChange={handleMaxPriceChange}
                                                                    className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                                                        darkMode
                                                                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                                                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                                                    }`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                {activeTab === 'agents' && (
                                                    <div>
                                                        <label htmlFor="agent-status-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                            Agent Status
                                                        </label>
                                                        <Dropdown
                                                            placeholder="Select Status"
                                                            options={agentStatusOptions}
                                                            value={agentStatusFilter}
                                                            onChange={handleAgentStatusChange}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                )}
                                                {activeTab === 'agencies' && (
                                                    <div>
                                                        <label htmlFor="agency-status-filter-desktop" className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                            Agency Status
                                                        </label>
                                                        <Dropdown
                                                            placeholder="Select Status"
                                                            options={agencyStatusOptions}
                                                            value={agencyStatusFilter}
                                                            onChange={handleAgencyStatusChange}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Tabs for Desktop (centered) */}
                                <div className="flex justify-center flex-grow">
                                    {tabOptions.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setActiveTab(tab.id); setCurrentPage(1); setSearchTerm(''); setSortKey('date_listed'); setSortDirection('desc'); }}
                                            className={`px-6 py-2 text-sm font-semibold transition-colors duration-200
                                                ${activeTab === tab.id ? 'bg-green-700 text-white shadow-lg' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}
                                                ${tabOptions.length > 1 ? (tab.id === tabOptions[0].id ? 'rounded-l-xl rounded-r-none' : tab.id === tabOptions[tabOptions.length - 1].id ? 'rounded-r-xl rounded-l-none' : 'rounded-none') : 'rounded-xl'}
                                            `}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Export and View Mode buttons on the far right */}
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <div className="relative inline-block text-left" ref={exportDropdownRef}>
                                        <button
                                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                                            className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10"
                                        >
                                            Export to CSV <ChevronDown className="-mr-1 h-5 w-5 text-white" />
                                        </button>
                                        {isExportDropdownOpen && (
                                            <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                                                <div className="py-1">
                                                    <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                                                    <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All {capitalizeFirstLetter(activeTab)}</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('graphical')}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="h-6 w-6" />
                                    </button>
                                    <button
                                        className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('simple')}
                                        title="List View"
                                    >
                                        <LayoutList className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {renderContent()}

                        {totalItems > 0 && totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-10 pb-8">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${
                                        darkMode
                                            ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 focus:ring-green-400"
                                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-green-600"
                                    }`}
                                >
                                    <ChevronLeft size={18} /> Prev
                                </button>
                                <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm disabled:opacity-40 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 ${
                                        darkMode
                                            ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 focus:ring-green-400"
                                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-green-600"
                                    }`}
                                >
                                    Next <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </main>
            </motion.div>
        </div>
    );
};

export default Favourites;

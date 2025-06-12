import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard'; // Re-use ListingCard
import axiosInstance from '../api/axiosInstance'; // Use axiosInstance
import API_BASE_URL from '../config';
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook
import AdminSidebar from '../components/admin/Sidebar'; // Import AdminSidebar
import AgentSidebar from '../components/agent/Sidebar'; // Import AgentSidebar
import ClientSidebar from '../components/client/Sidebar'; // Import ClientSidebar
import { useMessage } from '../context/MessageContext'; // Import useMessage hook
import { useConfirmDialog } from '../context/ConfirmDialogContext'; // Import useConfirmDialog hook
import { useSidebarState } from '../hooks/useSidebarState'; // Import the hook
import PurchaseCategoryFilter from '../components/PurchaseCategoryFilter'; // Import PurchaseCategoryFilter

// Import necessary icons
import { ArrowUpIcon, ArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Menu, X, Search, SlidersHorizontal, FileText, LayoutGrid, LayoutList, ChevronDown } from 'lucide-react'; // Added SlidersHorizontal, FileText, ChevronDown for filters/export

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
                  ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-700 hover:border-green-500 focus:ring-green-600"}`}
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


const Favourites = () => {
    const [favouriteListings, setFavouriteListings] = useState([]);
    // Removed filteredAndSortedListings as filtering is now primarily API-driven
    const [searchTerm, setSearchTerm] = useState('');
    // Initialize viewMode from localStorage, default to 'graphical'
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultListingsView') || 'graphical');
    const [sortKey, setSortKey] = useState('date_listed');
    const [sortDirection, setSortDirection] = useState('desc');
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState('');
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();

    // Filter states, similar to Listings.js
    const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState('');
    const [minPriceFilter, setMinPriceFilter] = useState('');
    const [maxPriceFilter, setMaxPriceFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // Add status filter

    // Modal and export dropdown states
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isDesktopFilterModalOpen, setIsDesktopFilterModalOpen] = useState(false);


    // Pagination states
    const [page, setPage] = useState(1);
    const limit = 12; // Display 12 items per page
    const [totalFavourites, setTotalFavourites] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Use the useSidebarState hook
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
    const [activeSection, setActiveSection] = useState('favourites'); // Set active section for sidebar


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

    // Effect for handling click outside export dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setIsExportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch favorite listings with pagination and filters
    const fetchFavouriteListings = useCallback(async () => {
        if (!userId) {
            return;
        }
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({ page, limit, sort: sortKey, direction: sortDirection });

        if (searchTerm) {
            params.append('search', searchTerm);
        }
        if (purchaseCategoryFilter && purchaseCategoryFilter.toLowerCase() !== 'all') {
            params.append('purchase_category', purchaseCategoryFilter);
        }
        if (minPriceFilter) {
            params.append('min_price', minPriceFilter);
        }
        if (maxPriceFilter) {
            params.append('max_price', maxPriceFilter);
        }
        if (statusFilter && statusFilter.toLowerCase() !== 'all' && statusFilter.toLowerCase() !== 'all statuses') {
            params.append('status', statusFilter);
        }

        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/favourites?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFavouriteListings(response.data.favourites || []);
            setTotalFavourites(response.data.total || 0);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            let errorMessage = 'Failed to fetch favorite listings. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
            setFavouriteListings([]);
            setTotalFavourites(0);
            setTotalPages(1);
        }
    }, [userId, page, limit, sortKey, sortDirection, searchTerm, purchaseCategoryFilter, minPriceFilter, maxPriceFilter, statusFilter, showMessage]);

    useEffect(() => {
        fetchFavouriteListings();
    }, [fetchFavouriteListings]);

    // The filtering and sorting is now largely handled by the API call,
    // so this client-side sorting is mainly for the current page if needed.
    // However, since the API already returns sorted and filtered data,
    // this function can be simplified or removed, but keeping a basic sort
    // for consistency if API sorts don't perfectly align with UI sort options.
    const applyClientSideSorting = useCallback(() => {
        let currentData = [...favouriteListings];

        currentData.sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            if (sortKey === 'price') {
                const numA = parseFloat(String(aValue).replace(/[^0-9.-]+/g, ''));
                const numB = parseFloat(String(bValue).replace(/[^0-9.-]+/g, ''));
                if (!isNaN(numA) && !isNaN(numB)) {
                    return sortDirection === 'asc' ? numA - numB : numB - numA;
                } else if (!isNaN(numA)) {
                    return sortDirection === 'asc' ? -1 : 1;
                } else if (!isNaN(numB)) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            }

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
            if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

            const typeA = typeof aValue;
            const typeB = typeof bValue;

            if (typeA === 'string' && typeB === 'string') {
                return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else if (typeA === 'number' && typeB === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                const numA = parseFloat(aValue);
                const numB = parseFloat(bValue);

                if (!isNaN(numA) && !isNaN(numB)) {
                    return sortDirection === 'asc' ? numA - numB : numB - numA;
                } else if (aValue < bValue) {
                    return sortDirection === 'asc' ? -1 : 1;
                } else if (aValue > bValue) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            }
        });
        // setFilteredAndSortedListings(currentData); // This state is no longer strictly necessary if data is fetched pre-sorted/filtered
    }, [favouriteListings, sortKey, sortDirection]); // Removed searchTerm from dependencies

    // Re-run client-side sort if favouriteListings change or sort params change
    useEffect(() => {
        applyClientSideSorting();
    }, [applyClientSideSorting]);


    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset to first page on search
    };

    // Filter handlers
    const handlePurchaseCategoryChange = (value) => {
        setPurchaseCategoryFilter(value);
        setPage(1); // Reset to first page on filter change
    };

    const handleMinPriceChange = (e) => {
        setMinPriceFilter(e.target.value);
        setPage(1); // Reset to first page on filter change
    };

    const handleMaxPriceChange = (e) => {
        setMaxPriceFilter(e.target.value);
        setPage(1); // Reset to first page on filter change
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        setPage(1); // Reset to first page on filter change
    };


    const handleSortClick = (key) => {
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'date_listed', 'status', 'purchase_category', 'bedrooms', 'bathrooms'];
        if (!sortableColumns.includes(key)) return;

        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
        setPage(1); // Reset to first page on sort change
    };

    const renderSortIcon = (key) => {
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'date_listed', 'status', 'purchase_category', 'bedrooms', 'bathrooms'];
        if (!sortableColumns.includes(key)) return null;

        if (sortKey === key) {
            return sortDirection === 'asc' ? (
                <ArrowUpIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
            ) : (
                <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />
            );
        }
        return <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;
    };

    const performRemoveFavorite = async (propertyId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage("Authentication token not found. Please log in.", 'error');
            return;
        }

        try {
            await axiosInstance.delete(`${API_BASE_URL}/favourites/${propertyId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showMessage(`Listing ${propertyId} removed from favorites!`, 'info');
            // Refetch listings to update pagination and filters
            fetchFavouriteListings();
        } catch (error) {
            let errorMessage = 'Failed to remove listing from favorites. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    };

    const handleRemoveFavorite = (propertyId) => {
        showConfirm({
            title: "Remove from Favourites",
            message: "Are you sure you want to remove this listing from your favourites?",
            onConfirm: () => performRemoveFavorite(propertyId),
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

    const handleExportCsv = async (scope) => {
        const dataToExport = scope === 'current' ? favouriteListings : await fetchAllFavouritesForExport();

        if (dataToExport.length === 0) {
            showMessage(`No favorite listing data found for ${scope} export.`, 'info');
            setIsExportDropdownOpen(false);
            return;
        }

        const headers = [
            'property_id', 'purchase_category', 'title', 'location', 'state', 'price', 'status', 'user_id', 'date_listed', 'property_type', 'bedrooms', 'bathrooms'
        ];

        const csvRows = dataToExport.map(l => [
            l.property_id,
            l.purchase_category || 'N/A',
            l.title,
            l.location,
            l.state,
            l.price,
            l.status || 'N/A',
            l.user_id,
            l.date_listed ? new Date(l.date_listed).toLocaleDateString() : 'N/A',
            l.property_type,
            l.bedrooms || 'N/A',
            l.bathrooms || 'N/A'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`));

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'favourite_listings.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportDropdownOpen(false);
        showMessage('Favorite listing data exported successfully!', 'success');
    };

    // Function to fetch all favourites for export (without pagination)
    const fetchAllFavouritesForExport = async () => {
        if (!userId) {
            showMessage("User not authenticated to fetch all favourites for export.", 'error');
            return [];
        }
        const token = localStorage.getItem('token');
        try {
            // Fetch all favourites by setting a very high limit or iterating through pages
            // For simplicity, let's assume a single call with a high limit is sufficient for typical favourite counts
            const response = await axiosInstance.get(`${API_BASE_URL}/favourites?limit=99999&search=${searchTerm}&sort=${sortKey}&direction=${sortDirection}&purchase_category=${purchaseCategoryFilter}&min_price=${minPriceFilter}&max_price=${maxPriceFilter}&status=${statusFilter}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.favourites || [];
        } catch (error) {
            let errorMessage = 'Failed to fetch all favorite listings for export. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
            return [];
        }
    };


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
                    {/* Removed rounded-3xl, p-6, shadow, and background color classes for mobile view */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`space-y-4 max-w-full ${!isMobile ? (darkMode ? "bg-gray-800 rounded-3xl p-6 shadow" : "bg-white rounded-3xl p-6 shadow") : ''}`}>
                        {/* Control Menu */}
                        {isMobile ? (
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                    onClick={() => setIsFilterModalOpen(true)}
                                    title="Open Filters"
                                >
                                    <SlidersHorizontal size={20} />
                                </button>
                                <div className="relative inline-block text-left" ref={exportDropdownRef}>
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
                                                <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Favourites</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('simple')}
                                        title="List View"
                                    >
                                        <LayoutList className="h-5 w-5" />
                                    </button>
                                    <button
                                        className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('graphical')}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="relative w-full md:w-1/3"> {/* Changed from md:w-1/3 to w-full md:w-1/3 */}
                                        <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                                        <input
                                            type="text"
                                            placeholder="Search favourites..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                        />
                                    </div>
                                    <button
                                        className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                        onClick={() => setIsDesktopFilterModalOpen(true)}
                                        title="Open Filters"
                                    >
                                        <SlidersHorizontal size={20} />
                                    </button>
                                </div>

                                <div className="flex gap-2 items-center ml-auto">
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
                                                    <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Favourites</button>
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

                        {userId === null ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Loading user data... Please ensure you are logged in to view your favourites.
                            </div>
                        ) : favouriteListings.length === 0 ? ( // Changed to favouriteListings
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                No favorite listings found.
                            </div>
                        ) : viewMode === 'graphical' ? (
                            <motion.div
                                layout
                                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {favouriteListings.map((listing) => ( // Changed to favouriteListings
                                    <ListingCard
                                        key={listing.property_id}
                                        listing={listing}
                                        userId={userId}
                                        userRole={userRole}
                                        onFavoriteToggle={handleRemoveFavorite}
                                        isFavoritedProp={true}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className={`w-full mt-4 text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    <thead>
                                        <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            {['property_id', 'title', 'location', 'property_type', 'price', 'date_listed', 'status', 'purchase_category', 'bedrooms', 'bathrooms', 'actions'].map((key) => (
                                                <th
                                                    key={key}
                                                    onClick={key !== 'actions' ? () => handleSortClick(key) : undefined}
                                                    className={`py-2 px-1 whitespace-nowrap truncate ${key !== 'actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                                                    style={{
                                                        width:
                                                            key === 'property_id' ? '80px' :
                                                                key === 'title' ? '120px' :
                                                                    key === 'location' ? '120px' :
                                                                        key === 'property_type' ? '100px' :
                                                                            key === 'price' ? '100px' :
                                                                                key === 'date_listed' ? '100px' :
                                                                                    key === 'status' ? '80px' :
                                                                                        key === 'purchase_category' ? '100px' :
                                                                                            key === 'bedrooms' ? '70px' :
                                                                                                key === 'bathrooms' ? '70px' :
                                                                                                    key === 'actions' ? '80px' : 'auto'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <span className="truncate">
                                                            {{
                                                                property_id: 'ID',
                                                                property_type: 'Type',
                                                                purchase_category: 'Category',
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
                                        {favouriteListings.map((listing) => ( // Changed to favouriteListings
                                            <tr key={listing.property_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
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
                                                        onClick={() => handleRemoveFavorite(listing.property_id)}
                                                        title="Remove from Favourites"
                                                    >
                                                        <TrashIcon className="h-6 w-6" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-center items-center space-x-4 mt-4">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1}
                                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
                            >
                                Prev
                            </button>
                            <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={page === totalPages || totalPages === 0}
                                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
                            >
                                Next
                            </button>
                        </div>
                    </motion.div>
                </main>
            </motion.div>

            {/* Mobile Filter Modal */}
            <AnimatePresence>
                {isMobile && isFilterModalOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`fixed inset-x-0 top-14 bottom-0 z-50 p-6 flex flex-col overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"}`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Filters</h2>
                            <button onClick={() => setIsFilterModalOpen(false)} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200"}`}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 flex-grow">
                            <div className="relative">
                                <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                                <input
                                    type="text"
                                    placeholder="Search favourites..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                        darkMode
                                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                    }`}
                                />
                            </div>

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

                            <Dropdown
                                placeholder="Select Status"
                                options={statusOptions}
                                value={statusFilter}
                                onChange={handleStatusChange}
                                className="w-full"
                            />

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

                        <button
                            onClick={() => setIsFilterModalOpen(false)}
                            className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-700 transition-colors"
                        >
                            Apply Filters
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Filter Modal */}
            <AnimatePresence>
                {!isMobile && isDesktopFilterModalOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`rounded-3xl p-6 shadow-xl w-full max-w-md mx-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Filters</h2>
                                <button onClick={() => setIsDesktopFilterModalOpen(false)} className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200"}`}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
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

                                <Dropdown
                                    placeholder="Select Status"
                                    options={statusOptions}
                                    value={statusFilter}
                                    onChange={handleStatusChange}
                                    className="w-full"
                                />

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

                            <button
                                onClick={() => setIsDesktopFilterModalOpen(false)}
                                className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Favourites;

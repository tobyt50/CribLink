// Listings.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AgencyAdminSidebar from '../../components/agencyadmin/Sidebar'; // Changed import
import { useLocation } from 'react-router-dom';
import ListingCard from '../../components/ListingCard';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { TableCellsIcon, Squares2X2Icon, ArrowUpIcon, ArrowDownIcon, TrashIcon, PencilIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import API_BASE_URL from '../../config';
import PurchaseCategoryFilter from '../../components/PurchaseCategoryFilter';
import { Menu, X, Search, SlidersHorizontal, DollarSign, ListFilter, Plus, FileText, LayoutGrid, LayoutList } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import { useMessage } from '../../context/MessageContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useSidebarState } from '../../hooks/useSidebarState'; // Import the hook
import { useAuth } from '../../context/AuthContext'; // Import useAuth

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


const Listings = () => {
    const [listings, setListings] = useState([]);
    const [filteredListings, setFilteredListings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    // Initialize viewMode from localStorage, default to 'simple' (table view)
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultListingsView') || 'simple');
    const [sortKey, setSortKey] = useState('date_listed');
    const [sortDirection, setSortDirection] = useState('desc');
    const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState('');
    const [minPriceFilter, setMinPriceFilter] = useState('');
    const [maxPriceFilter, setMaxPriceFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalListings, setTotalListings] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const { showMessage } = useMessage();
    const { showConfirm } = useConfirmDialog();
    const { user } = useAuth(); // Get user from AuthContext

    // Use the useSidebarState hook
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
    const [activeSection, setActiveSection] = useState('listings');

    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isDesktopFilterModalOpen, setIsDesktopFilterModalOpen] = useState(false);

    const location = useLocation();

    const [statusFilter, setStatusFilter] = useState(() => {
        // Set initial status filter from location state, default to 'all'
        return location.state?.statusFilter || 'all';
    });

    useEffect(() => {
        // Update status filter if it changes via location state (e.g., from dashboard click)
        if (location.state?.statusFilter && location.state.statusFilter !== statusFilter) {
            setStatusFilter(location.state.statusFilter);
            setPage(1); // Reset page when filter changes
        }
    }, [location.state?.statusFilter, statusFilter]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setIsExportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const fetchListings = useCallback(async () => {
        const params = new URLSearchParams();

        // Add agency_id to params if user is an agency_admin
        if (user && user.role === 'agency_admin' && user.agency_id) {
            params.append('agency_id', user.agency_id);
        }

        if (purchaseCategoryFilter && purchaseCategoryFilter.toLowerCase() !== 'all') {
            params.append('purchase_category', purchaseCategoryFilter);
        }
        if (searchTerm) {
            params.append('search', searchTerm);
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

        params.append('page', page);
        params.append('limit', limit);

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/listings?${params.toString()}`, { headers });
            setListings(response.data.listings || []);
            setFilteredListings(response.data.listings || []);
            setTotalListings(response.data.total || 0);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            let errorMessage = 'Failed to fetch listings. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
            setListings([]);
            setFilteredListings([]);
            setTotalListings(0);
            setTotalPages(1);
        }
    }, [purchaseCategoryFilter, searchTerm, minPriceFilter, maxPriceFilter, statusFilter, page, limit, showMessage, user]); // Added user to dependencies

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    const filterAndSortListings = useCallback(() => {
        let sortedData = [...listings].sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            if (sortKey === 'price') {
                const cleanPriceA = String(aValue).replace(/[^0-9.-]+/g, '');
                const cleanPriceB = String(bValue).replace(/[^0-9.-]+/g, '');
                const numA = parseFloat(cleanPriceA);
                const numB = parseFloat(cleanPriceB);

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

        setFilteredListings(sortedData);
    }, [listings, sortKey, sortDirection]);

    useEffect(() => {
        filterAndSortListings();
    }, [listings, sortKey, sortDirection, filterAndSortListings]);

    const handleApproveListing = async (listingId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Authentication token not found. Please sign in.', 'error');
            return;
        }

        try {
            await axiosInstance.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Available' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showMessage('Listing approved successfully!', 'success');
            fetchListings();
        } catch (error) {
            let errorMessage = 'Failed to approve listing. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    };

    const handleRejectListing = async (listingId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Authentication token not found. Please sign in.', 'error');
            return;
        }

        try {
            await axiosInstance.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'rejected' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showMessage('Listing rejected successfully!', 'success');
            fetchListings();
        } catch (error) {
            let errorMessage = 'Failed to reject listing. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    };

    const handleMarkAsSold = async (listingId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Authentication token not found. Please sign in.', 'error');
            return;
        }

        try {
            await axiosInstance.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Sold' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showMessage('Listing marked as sold successfully!', 'success');
            fetchListings();
        } catch (error) {
            let errorMessage = 'Failed to mark listing as sold. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    };

    const handleMarkAsFailed = async (listingId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Authentication token not found. Please sign in.', 'error');
            return;
        }

        try {
            await axiosInstance.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Available' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showMessage('Listing status updated to Available (failed deal)!', 'success');
            fetchListings();
        } catch (error) {
            let errorMessage = 'Failed to update listing status. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    };


    const performDeleteListing = async (listingId) => {
        const token = localStorage.getItem('token');

        if (!token) {
            showMessage('Authentication token not found. Please sign in.', 'error');
            return;
        }

        try {
            await axiosInstance.delete(`${API_BASE_URL}/listings/${listingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            showMessage(`Listing ${listingId} deleted successfully!`, 'success');
            fetchListings();
        } catch (error) {
            let errorMessage = 'Failed to delete listing. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    };

    const handleDeleteListing = (listingId) => {
        showConfirm({
            title: "Delete Listing",
            message: "Are you sure you want to permanently delete this listing? This action cannot be undone.",
            onConfirm: () => performDeleteListing(listingId),
            confirmLabel: "Delete",
            cancelLabel: "Cancel"
        });
    };

    const handleExportCsv = async (scope) => {
        const dataToExport = scope === 'current' ? filteredListings : listings;

        if (dataToExport.length === 0) {
            showMessage(`No listing data found for ${scope} export.`, 'info');
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
        link.setAttribute('download', 'property_listings.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportDropdownOpen(false);
        showMessage('Listing data exported successfully!', 'success');
    };


    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleStatusChange = useCallback((value) => {
        setStatusFilter(value);
        setPage(1);
    }, []);

    const handlePurchaseCategoryChange = (value) => {
        setPurchaseCategoryFilter(value);
        setPage(1);
    };

    const handleMinPriceChange = (e) => {
        setMinPriceFilter(e.target.value);
        setPage(1);
    };

    const handleMaxPriceChange = (e) => {
        setMaxPriceFilter(e.target.value);
        setPage(1);
    };


    const handleSortClick = (key) => {
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'status', 'date_listed', 'purchase_category', 'bedrooms', 'bathrooms'];
        if (!sortableColumns.includes(key)) return;

        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };


    const renderSortIcon = (key) => {
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'status', 'date_listed', 'purchase_category', 'bedrooms', 'bathrooms'];
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

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const handleCardClick = (listingId) => {
        navigate(`/listing/${listingId}`);
    };

    const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

    const statusOptions = [
        { value: "all", label: "All statuses" },
        { value: "available", label: "Available" },
        { value: "sold", label: "Sold" },
        { value: "under offer", label: "Under offer" },
        { value: "pending", label: "Pending" },
        { value: "rejected", label: "Rejected" },
        { value: "featured", label: "Featured" }
    ];

    return (
        <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
            {isMobile && (
                <motion.button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
                    initial={false}
                    animate={{ rotate: isSidebarOpen ? 180 : 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
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

            <AgencyAdminSidebar // Changed to AgencyAdminSidebar
                collapsed={isMobile ? false : isCollapsed}
                setCollapsed={isMobile ? () => {} : setIsCollapsed}
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
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Listings</h1>
                </div>

                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Listings</h1>
                </div>

                <main className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        // Conditionally apply classes based on mobile view
                        className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                    >
                        {isMobile && (
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                    onClick={() => navigate('/agency/add-listing')} // Updated path
                                    title="Add New Listing"
                                >
                                    <Plus size={20} />
                                </button>
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
                                                <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Listings</button>
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
                        )}

                        {!isMobile && (
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="flex items-center gap-4 w-full">
                                    <input
                                        type="text"
                                        placeholder="Search listings..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className={`w-full md:w-1/2 py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                          darkMode
                                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                        }`}
                                    />
                                    <button
                                        className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                        onClick={() => setIsDesktopFilterModalOpen(true)}
                                        title="Open Filters"
                                    >
                                        <SlidersHorizontal size={20} />
                                    </button>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <button
                                        className="bg-green-500 text-white flex items-center justify-center px-4 h-10 rounded-xl hover:bg-green-600 text-sm font-medium"
                                        onClick={() => navigate('/agency/add-listing')} // Updated path
                                    >
                                        +Add
                                    </button>

                                    <div className="relative inline-block text-left" ref={exportDropdownRef}>
                                        <button
                                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                                            className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10"
                                        >
                                            Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
                                        </button>
                                        {isExportDropdownOpen && (
                                            <div className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800 text-gray-200 border-gray-700" : "bg-white text-gray-900"}`}>
                                                <div className="py-1">
                                                    <button onClick={() => handleExportCsv('current')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>Current View</button>
                                                    <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Listings</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('simple')}
                                        title="Simple View"
                                    >
                                        <TableCellsIcon className="h-6 w-6" />
                                    </button>
                                    <button
                                        className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => setViewMode('graphical')}
                                        title="Graphical View"
                                    >
                                        <Squares2X2Icon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {filteredListings.length === 0 ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                No listings found matching your criteria.
                            </div>
                        ) : (
                            viewMode === 'graphical' ? (
                                <motion.div
                                    layout
                                    // Modified grid classes for better mobile responsiveness
                                    className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-5"
                                >
                                    {filteredListings.map((listing) => (
                                        <div key={listing.property_id}>
                                            <ListingCard
                                                listing={listing}
                                                onDelete={handleDeleteListing}
                                            />
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className={`w-full mt-4 text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        <thead>
                                            <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                {['property_id', 'title', 'location', 'property_type', 'price', 'status', 'date_listed', 'purchase_category', 'bedrooms', 'bathrooms', 'actions'].map((key) => (
                                                    <th
                                                        key={key}
                                                        onClick={key !== 'actions' ? () => handleSortClick(key) : undefined}
                                                        className={`py-2 px-2 whitespace-nowrap ${key !== 'actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                                                        style={{
                                                            width:
                                                                key === 'property_id' ? '90px' :
                                                                key === 'title' ? '120px' :
                                                                key === 'location' ? '120px' :
                                                                key === 'property_type' ? '90px' :
                                                                key === 'price' ? '120px' :
                                                                key === 'status' ? '80px' :
                                                                key === 'date_listed' ? '120px' :
                                                                key === 'purchase_category' ? '100px' :
                                                                key === 'bedrooms' ? '70px' :
                                                                key === 'bathrooms' ? '70px' :
                                                                key === 'actions' ? '150px' : 'auto'
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
                                            {filteredListings.map((listing) => (
                                                <tr key={listing.property_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                                                    <td className="py-2 px-2 max-w-[90px] truncate" title={listing.property_id && listing.property_id.length > 10 ? listing.property_id : ''}>{listing.property_id}</td>
                                                    <td className="py-2 px-2 max-w-[120px] truncate" title={listing.title && listing.title.length > 15 ? listing.title : ''}>{listing.title}</td>
                                                    <td className="py-2 px-2 max-w-[120px] truncate" title={listing.location && listing.location.length > 15 ? listing.location : ''}>{listing.location}</td>
                                                    <td className="py-2 px-2 max-w-[90px] truncate" title={listing.property_type && listing.property_type.length > 10 ? listing.property_type : ''}>{listing.property_type}</td>
                                                    <td className="py-2 px-2 max-w-[120px] truncate" title={listing.price ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price) : ''}>
                                                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price)}
                                                    </td>
                                                    <td className={`py-2 px-2 max-w-[80px] truncate font-semibold ${
                                                        listing.status && listing.status.toLowerCase() === 'available' ? 'text-green-600' :
                                                        listing.status && listing.status.toLowerCase() === 'sold' ? 'text-red-600' :
                                                        listing.status && listing.status.toLowerCase() === 'under offer' ? 'text-yellow-600' :
                                                        listing.status && listing.status.toLowerCase() === 'pending' ? 'text-blue-600' :
                                                        listing.status && listing.status.toLowerCase() === 'rejected' ? 'text-purple-600' :
                                                        'text-gray-600'
                                                    }`} title={capitalizeFirstLetter(listing.status)}>{capitalizeFirstLetter(listing.status)}</td>
                                                    <td className="py-2 px-2 max-w-[120px] truncate" title={listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : ''}>{listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 'N/A'}</td>
                                                    <td className="py-2 px-2 max-w-[100px] truncate" title={listing.purchase_category && listing.purchase_category.length > 12 ? listing.purchase_category : ''}>{listing.purchase_category}</td>
                                                    <td className="py-2 px-2 max-w-[70px] truncate" title={listing.bedrooms ? listing.bedrooms.toString() : ''}>{listing.bedrooms}</td>
                                                    <td className="py-2 px-2 max-w-[70px] truncate" title={listing.bathrooms ? listing.bathrooms.toString() : ''}>{listing.bathrooms}</td>
                                                    <td className="py-2 px-2 space-x-2 max-w-[150px]">
                                                        {listing.status && listing.status.toLowerCase() === 'pending' ? (
                                                            <div className="flex items-center gap-2">
                                                                <button className="text-green-600 hover:text-green-800 p-1" onClick={() => handleApproveListing(listing.property_id)} title="Approve Listing">
                                                                    <CheckCircleIcon className="h-6 w-6" />
                                                                </button>
                                                                <button className="text-red-600 hover:text-red-800 p-1" onClick={() => handleRejectListing(listing.property_id)} title="Reject Listing">
                                                                    <XCircleIcon className="h-6 w-6" />
                                                                </button>
                                                            </div>
                                                        ) : listing.status && listing.status.toLowerCase() === 'rejected' ? (
                                                            <div className="flex items-center gap-2">
                                                                <button className="text-green-600 hover:text-green-800 p-1" onClick={() => handleApproveListing(listing.property_id)} title="Approve Listing">
                                                                    <CheckCircleIcon className="h-6 w-6" />
                                                                </button>
                                                                <button className="text-red-600 hover:text-red-800 p-1" onClick={() => handleDeleteListing(listing.property_id)} title="Delete Listing">
                                                                    <TrashIcon className="h-6 w-6" />
                                                                </button>
                                                            </div>
                                                        ) : listing.status && listing.status.toLowerCase() === 'under offer' ? (
                                                            <div className="flex items-center gap-2">
                                                                <button className="text-green-600 hover:text-green-800 p-1" onClick={() => handleMarkAsSold(listing.property_id)} title="Mark as Sold">
                                                                    <CurrencyDollarIcon className="h-6 w-6" />
                                                                </button>
                                                                <button className="text-gray-600 hover:text-gray-800 p-1" onClick={() => handleMarkAsFailed(listing.property_id)} title="Mark as Failed (Return to Available)">
                                                                    <ArrowUturnLeftIcon className="h-6 w-6" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    className="bg-green-500 text-white px-3 py-1 rounded-xl hover:bg-green-600 text-xs"
                                                                    onClick={() => navigate(`/agency/edit-listing/${listing.property_id}`)} // Updated path
                                                                    title="Edit Listing"
                                                                >
                                                                    <PencilIcon className="h-4 w-4 inline" />
                                                                    <span className="ml-1">Edit</span>
                                                                </button>
                                                                <button
                                                                    className="text-red-600 hover:text-red-800 p-1"
                                                                    onClick={() => handleDeleteListing(listing.property_id)}
                                                                    title="Delete Listing"
                                                                >
                                                                    <TrashIcon className="h-6 w-6" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>


                                    <div className="flex justify-center items-center space-x-4 mt-4">
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                            className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
                                        >
                                            Prev
                                        </button>
                                        <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {page} of {totalPages}</span>
                                        <button
                                            disabled={page === totalPages || totalPages === 0}
                                            onClick={() => setPage(prev => prev + 1)}
                                            className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )
                        )}
                    </motion.div>
                </main>
            </motion.div>

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
                                    placeholder="Search listings..."
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

export default Listings;

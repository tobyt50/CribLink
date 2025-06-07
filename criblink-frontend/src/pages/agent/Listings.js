// Listings.js (Agent View)
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AgentSidebar from '../../components/agent/Sidebar'; // Changed to AgentSidebar
import { useLocation, useNavigate } from 'react-router-dom';
import ListingCard from '../../components/ListingCard';
import axios from 'axios';
// Import necessary icons
import { TableCellsIcon, Squares2X2Icon, ArrowUpIcon, ArrowDownIcon, TrashIcon, PencilIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import API_BASE_URL from '../../config';
import PurchaseCategoryFilter from '../../components/PurchaseCategoryFilter'; // Correctly importing PurchaseCategoryFilter
import { Menu, X, Search, SlidersHorizontal, DollarSign, ListFilter, Plus, FileText, LayoutGrid, LayoutList } from 'lucide-react'; // Corrected import statement for lucide-react
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

// Reusable Dropdown Component (embedded directly in Listings.js)
const Dropdown = ({ options, value, onChange, placeholder, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { darkMode } = useTheme(); // Use the dark mode context within the dropdown

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
                {/* Added overflow-hidden and truncate to prevent text wrapping */}
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
    const [listings, setListings] = useState([]); // Raw listings from API (paginated)
    const [filteredAndSortedListings, setFilteredAndSortedListings] = useState([]); // For client-side sorting only
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' means no status filter applied by frontend
    const [viewMode, setViewMode] = useState('simple'); // 'simple' or 'graphical'
    const [sortKey, setSortKey] = useState('date_listed');
    const [sortDirection, setSortDirection] = useState('desc');
    const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState('');
    const [minPriceFilter, setMinPriceFilter] = useState('');
    const [maxPriceFilter, setMaxPriceFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalListings, setTotalListings] = useState(0); // Total count from backend
    const [totalPages, setTotalPages] = useState(1); // Total pages from backend
    const limit = 10; // Items per page, sent to backend for pagination
    const navigate = useNavigate();
    const { darkMode } = useTheme(); // Use the dark mode context

    // State and ref for export dropdown
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    // State for sidebar visibility and collapse
    const [isCollapsed, setIsCollapsed] = useState(false);
    // State for active section in the sidebar
    const [activeSection, setActiveSection] = useState('listings');

    // State to hold the signed-in agent's ID
    const [agentId, setAgentId] = useState(null);

    const location = useLocation();

    // State for mobile view and sidebar open/close, consistent with Inquiries.js
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    // State for mobile filter modal
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    // State for desktop filter modal
    const [isDesktopFilterModalOpen, setIsDesktopFilterModalOpen] = useState(false);


    // Effect to set initial status filter from location state (e.g., from dashboard links)
    useEffect(() => {
        if (location.state?.statusFilter) {
            setStatusFilter(location.state.statusFilter);
        }
    }, [location.state]);

    // Effect to handle window resize for mobile responsiveness, consistent with Inquiries.js
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setIsSidebarOpen(!mobile); // Close sidebar on mobile, open on desktop
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect to close export dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setIsExportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Effect to get the agent ID when the component mounts
    useEffect(() => {
        const fetchAgentProfile = async () => {
            try {
                const token = localStorage.getItem('token'); // Assuming token is in local storage
                if (!token) {
                    console.error("Authentication token not found. Please sign in.");
                    navigate('/signin'); // Redirect to login if no token
                    return;
                }
                const { data } = await axios.get(`${API_BASE_URL}/users/profile`, { // Assuming this endpoint returns user details including user_id
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (data && data.user_id) { // Assuming the response includes user_id
                    setAgentId(data.user_id);
                } else {
                    console.error("Agent profile fetched, but user_id not found.");
                    navigate('/signin'); // Redirect if user_id is missing
                }
            } catch (err) {
                console.error("Error fetching agent profile:", err.response?.data || err.message);
                // Handle authentication errors (e.g., expired token)
                if (err.response && err.response.status === 401) {
                    navigate('/signin');
                }
            }
        };
        fetchAgentProfile();
    }, [navigate]); // navigate is a dependency because it's used inside the effect


    // Fetch listings function - now sends all filters and pagination to backend
    const fetchListings = useCallback(async () => {
        // Only fetch listings if agentId is available
        if (agentId === null) {
            console.log("Agent ID not yet available, skipping fetchListings.");
            return;
        }

        try {
            const params = new URLSearchParams();

            // Conditionally append parameters only if they have a value
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
            // Send status filter to backend (even 'all' or 'all statuses' for backend to decide)
            if (statusFilter && statusFilter.toLowerCase() !== 'all statuses') { // Send 'all' as a filter too if needed by backend
                params.append('status', statusFilter);
            }

            // --- Pass agent_id to the backend for filtering ---
            params.append('agent_id', agentId);
            // ---------------------------------------------------

            // Pagination parameters
            params.append('page', page);
            params.append('limit', limit);

            // Get the authentication token from localStorage
            const token = localStorage.getItem('token');
            console.log('[Agent Listings.js] Token retrieved:', token ? 'Exists' : 'Does NOT exist');

            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Use axios for the request
            const response = await axios.get(`${API_BASE_URL}/listings?${params.toString()}`, { headers });
            console.log('[Agent Listings.js] API Response Data:', response.data);

            // Assuming the API returns an object with 'listings' array, 'total' count, and 'totalPages'
            setListings(response.data.listings || []); // Update raw listings state
            setTotalListings(response.data.total || 0); // Update total count
            setTotalPages(response.data.totalPages || 1);

        } catch (err) {
            console.error('Error fetching listings:', err.response?.data || err.message);
            setListings([]);
            setFilteredAndSortedListings([]); // Clear sorted listings on error
            setTotalListings(0);
            setTotalPages(1);
            // Handle authentication errors (e.g., token expired)
            if (err.response && err.response.status === 401) {
                navigate('/signin');
            }
        }
    }, [purchaseCategoryFilter, searchTerm, minPriceFilter, maxPriceFilter, statusFilter, page, limit, agentId, navigate]); // All filters, pagination, and agentId dependencies

    // Effect to fetch listings whenever relevant states change
    useEffect(() => {
        fetchListings();
    }, [fetchListings]); // Depend on the memoized fetchListings

    // Client-side sorting only (status filtering is now backend-handled)
    const applySorting = useCallback(() => {
        let sortedData = [...listings].sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            // Refined Price Sorting Logic
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

            // Handle null or undefined values for other sort keys
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
        setFilteredAndSortedListings(sortedData); // Update state with sorted data
    }, [listings, sortKey, sortDirection]); // Depend on listings, sortKey, sortDirection

    // Apply sorting whenever listings or sort criteria change
    useEffect(() => {
        applySorting();
    }, [listings, sortKey, sortDirection, applySorting]);


    // Function to handle approving a listing (status becomes 'Available')
    const handleApproveListing = async (listingId) => {
        console.log(`Confirming approval for listing ${listingId}`);
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Authentication token not found. Please sign in.');
            return;
        }
        try {
            await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Available' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Listing approved successfully!');
            fetchListings(); // Refresh the list
        } catch (error) {
            console.error('Error approving listing:', error.response?.data || error.message);
        }
    };

    // Function to handle rejecting a listing (status becomes 'rejected')
    const handleRejectListing = async (listingId) => {
        console.log(`Confirming rejection for listing ${listingId}`);
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Authentication token not found. Please sign in.');
            return;
        }
        try {
            await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'rejected' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Listing rejected successfully!');
            fetchListings(); // Refresh the list
        } catch (error) {
            console.error('Error rejecting listing:', error.response?.data || error.message);
        }
    };

    // Function to handle marking an 'under offer' listing as 'sold' (completed)
    const handleMarkAsSold = async (listingId) => {
        console.log(`Confirming mark as sold for listing ${listingId}`);
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Authentication token not found. Please sign in.');
            return;
        }
        try {
            await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Sold' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Listing marked as Sold successfully!');
            fetchListings(); // Refresh the list
        } catch (error) {
            console.error('Error marking listing as sold:', error.response?.data || error.message);
        }
    };

    // Function to handle marking an 'under offer' listing as 'available' (failed)
    const handleMarkAsFailed = async (listingId) => {
        console.log(`Confirming mark as failed for listing ${listingId}`);
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Authentication token not found. Please sign in.');
            return;
        }
        try {
            await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Available' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Listing marked as Failed (Available) successfully!');
            fetchListings(); // Refresh the list
        } catch (error) {
            console.error('Error marking listing as failed:', error.response?.data || error.message);
        }
    };

    const handleDeleteListing = async (listingId) => {
        console.log(`Confirming deletion for listing ${listingId}`);
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Authentication token not found. Please sign in.');
            return;
        }
        try {
            await axios.delete(`${API_BASE_URL}/listings/${listingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Listing deleted successfully!');
            fetchListings();
        } catch (error) {
            console.error('Error deleting listing:', error.response?.data || error.message);
        }
    };

    // Function to handle exporting listings to CSV
    const handleExportCsv = async (scope) => {
        const dataToExport = scope === 'current' ? filteredAndSortedListings : listings; // Use filteredAndSortedListings for current view

        if (dataToExport.length === 0) {
            console.warn(`No listing data found for ${scope} export.`);
            setIsExportDropdownOpen(false);
            return;
        }

        // Define CSV headers based on your table columns
        const headers = [
            'property_id', 'purchase_category', 'title', 'location', 'state', 'price', 'status', 'agent_id', 'date_listed', 'property_type', 'bedrooms', 'bathrooms'
        ];

        // Map listing data to CSV rows
        const csvRows = dataToExport.map(l => [
            l.property_id,
            l.purchase_category || 'N/A',
            l.title,
            l.location,
            l.state,
            l.price,
            l.status || 'N/A',
            l.agent_id, // Use agent_id for agent view
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
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset page on search
    };

    const handleStatusChange = (value) => { // Changed to accept value directly from Dropdown
        setStatusFilter(value);
        setPage(1); // Reset page on status change
    };

    const handlePurchaseCategoryChange = (value) => { // Changed to accept value directly from Dropdown
        setPurchaseCategoryFilter(value);
        setPage(1); // Reset page on category change
    };

    const handleMinPriceChange = (e) => {
        setMinPriceFilter(e.target.value);
        setPage(1); // Reset page on price filter change
    };

    const handleMaxPriceChange = (e) => {
        setMaxPriceFilter(e.target.value);
        setPage(1); // Reset page on price filter change
    };

    const handleSortClick = (key) => {
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'status', 'date_listed', 'purchase_category', 'bedrooms', 'bathrooms']; // Added new sortable columns
        if (!sortableColumns.includes(key)) return;

        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const renderSortIcon = (key) => {
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'status', 'date_listed', 'purchase_category', 'bedrooms', 'bathrooms']; // Added new sortable columns
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

    // Helper function to capitalize the first letter of a string
    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const handleCardClick = (listingId) => {
        navigate(`/listing/${listingId}`);
    };

    // Adjusted contentShift based on mobile and collapsed state
    const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

    // Include all possible statuses for the filter dropdown, formatted for the Dropdown component
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
            {/* Mobile Sidebar Toggle Button */}
            {isMobile && (
                <motion.button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className={`fixed top-20 left-4 z-50 p-2 rounded-full shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
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

            <AgentSidebar
                collapsed={isMobile ? false : isCollapsed}
                setCollapsed={isMobile ? () => {} : setIsCollapsed}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <motion.div
                key={isMobile ? 'mobile' : 'desktop'} // Key for re-animation on mobile/desktop switch
                animate={{ marginLeft: contentShift }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                initial={false}
                className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
                style={{ minWidth: `calc(100% - ${contentShift}px)` }} // Ensure content doesn't shrink
            >
                {/* Mobile-only H1 element */}
                <div className="md:hidden flex items-center justify-center mb-4">
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>My Listings</h1>
                </div>

                {/* Desktop-only centered title */}
                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>My Listings</h1>
                </div>

                <main className="space-y-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`rounded-3xl p-6 shadow space-y-4 max-w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                        {/* Mobile Control Menu */}
                        {isMobile && (
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                    onClick={() => navigate('/add-listing')}
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

                        {/* Desktop Filters and Controls */}
                        {!isMobile && (
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                {/* Search and Filter Button */}
                                <div className="flex items-center gap-4 w-full">
                                    <input
                                        type="text"
                                        placeholder="Search listings..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className={`w-full md:w-1/2 py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                    />
                                    <button
                                        className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                        onClick={() => setIsDesktopFilterModalOpen(true)}
                                        title="Open Filters"
                                    >
                                        <SlidersHorizontal size={20} />
                                    </button>
                                </div>

                                {/* Add, Export, and View Mode Buttons - Grouped together */}
                                <div className="flex gap-2 items-center">
                                    <button
                                        className="bg-green-500 text-white flex items-center justify-center px-4 h-10 rounded-xl hover:bg-green-600 text-sm font-medium"
                                        onClick={() => navigate('/add-listing')}
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

                        {/* Only render listings if agentId is available */}
                        {agentId === null ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Loading agent data...
                            </div>
                        ) : filteredAndSortedListings.length === 0 ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                No listings found matching your criteria.
                            </div>
                        ) : viewMode === 'graphical' ? (
                            <motion.div
                                layout
                                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {filteredAndSortedListings.map((listing) => (
                                    <div key={listing.property_id}>
                                        <ListingCard
                                            listing={listing}
                                            onDelete={handleDeleteListing}
                                            darkMode={darkMode} // Pass darkMode prop
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
                                                    className={`py-2 px-1 whitespace-nowrap truncate ${key !== 'actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                                                    style={{
                                                        width:
                                                            key === 'property_id' ? '80px' :
                                                            key === 'title' ? '100px' :
                                                            key === 'location' ? '100px' :
                                                            key === 'property_type' ? '80px' :
                                                            key === 'price' ? '100px' :
                                                            key === 'status' ? '80px' :
                                                            key === 'date_listed' ? '100px' :
                                                            key === 'purchase_category' ? '100px' :
                                                            key === 'bedrooms' ? '60px' :
                                                            key === 'bathrooms' ? '60px' :
                                                            key === 'actions' ? '180px' : 'auto'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <span className="truncate">
                                                            {{
                                                                property_id: 'ID',
                                                                property_type: 'Type',
                                                                purchase_category: 'Category',
                                                                actions: 'Actions'
                                                            }[key] || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </span>
                                                        {renderSortIcon(key)}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                                        {filteredAndSortedListings.map((listing) => (
                                            <tr key={listing.property_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[80px]" title={listing.property_id || ''}>{listing.property_id}</td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={listing.title || ''}>{listing.title}</td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={listing.location || ''}>{listing.location}</td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[80px]" title={listing.property_type || ''}>{listing.property_type}</td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price)}>
                                                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price)}
                                                </td>
                                                <td className={`py-2 px-1 whitespace-nowrap overflow-hidden truncate max-w-[80px] font-semibold ${
                                                    listing.status && listing.status.toLowerCase() === 'available' ? 'text-green-600' :
                                                    listing.status && listing.status.toLowerCase() === 'sold' ? 'text-red-600' :
                                                    listing.status && listing.status.toLowerCase() === 'under offer' ? 'text-yellow-600' :
                                                    listing.status && listing.status.toLowerCase() === 'pending' ? 'text-blue-600' :
                                                    listing.status && listing.status.toLowerCase() === 'rejected' ? 'text-purple-600' :
                                                    (darkMode ? 'text-gray-300' : 'text-gray-600')
                                                }`} title={listing.status ? capitalizeFirstLetter(listing.status) : ''}>{capitalizeFirstLetter(listing.status)}</td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 'N/A'}>{listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 'N/A'}</td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={listing.purchase_category || ''}>{listing.purchase_category}</td>
                                                <td className="py-2 px-1 w-12 text-left whitespace-nowrap overflow-hidden max-w-[60px]" title={listing.bedrooms || ''}>{listing.bedrooms}</td>
                                                <td className="py-2 px-1 w-12 text-left whitespace-nowrap overflow-hidden max-w-[60px]" title={listing.bathrooms || ''}>{listing.bathrooms}</td>
                                                <td className="py-2 px-1 whitespace-nowrap max-w-[180px]">
                                                    {listing.status && listing.status.toLowerCase() === 'pending' ? (
                                                        <div className="flex items-center gap-2">
                                                            <button className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-800"}`} onClick={() => handleApproveListing(listing.property_id)} title="Approve Listing">
                                                                <CheckCircleIcon className="h-6 w-6" />
                                                            </button>
                                                            <button className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`} onClick={() => handleRejectListing(listing.property_id)} title="Reject Listing">
                                                                <XCircleIcon className="h-6 w-6" />
                                                            </button>
                                                        </div>
                                                    ) : listing.status && listing.status.toLowerCase() === 'rejected' ? (
                                                        <div className="flex items-center gap-2">
                                                            <button className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-800"}`} onClick={() => handleApproveListing(listing.property_id)} title="Approve Listing">
                                                                <CheckCircleIcon className="h-6 w-6" />
                                                            </button>
                                                            <button className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`} onClick={() => handleDeleteListing(listing.property_id)} title="Delete Listing">
                                                                <TrashIcon className="h-6 w-6" />
                                                            </button>
                                                        </div>
                                                    ) : listing.status && listing.status.toLowerCase() === 'under offer' ? (
                                                        <div className="flex items-center gap-2">
                                                            <button className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-800"}`} onClick={() => handleMarkAsSold(listing.property_id)} title="Mark as Sold">
                                                                <CurrencyDollarIcon className="h-6 w-6" />
                                                            </button>
                                                            <button className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"}`} onClick={() => handleMarkAsFailed(listing.property_id)} title="Mark as Failed (Return to Available)">
                                                                <ArrowUturnLeftIcon className="h-6 w-6" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                className={`px-3 py-1 rounded-xl text-xs h-10 flex items-center ${darkMode ? "bg-green-600 text-white hover:bg-green-500" : "bg-green-500 text-white hover:bg-green-600"}`}
                                                                onClick={() => navigate(`/edit-listing/${listing.property_id}`)}
                                                                title="Edit Listing"
                                                            >
                                                                <PencilIcon className="h-4 w-4 inline" />
                                                                <span className="ml-1">Edit</span>
                                                            </button>
                                                            <button
                                                                className={`p-1 rounded-xl h-10 w-10 flex items-center justify-center ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800"}`}
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
                                        className={`px-4 py-2 rounded-xl text-sm disabled:opacity-50 h-10 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
                                    >
                                        Prev
                                    </button>
                                    <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Page {page} of {totalPages}</span>
                                    <button
                                        disabled={page === totalPages || totalPages === 0}
                                        onClick={() => setPage(prev => prev + 1)}
                                        className={`px-4 py-2 rounded-xl text-sm disabled:opacity-50 h-10 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
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
                                    placeholder="Search listings..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                />
                            </div>

                            <PurchaseCategoryFilter
                                selectedCategory={purchaseCategoryFilter}
                                onChange={handlePurchaseCategoryChange}
                                className="w-full"
                                // The buttonClassName for PurchaseCategoryFilter should also adopt the new styles
                                buttonClassName={`py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
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
                                    className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                />
                            </div>

                            <div className="relative">
                                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
                                <input
                                    type="number"
                                    placeholder="Max Price"
                                    value={maxPriceFilter}
                                    onChange={handleMaxPriceChange}
                                    className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
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
                                    // The buttonClassName for PurchaseCategoryFilter should also adopt the new styles
                                    buttonClassName={`py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
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
                                        className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                    />
                                </div>

                                <div className="relative">
                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? "text-gray-400" : "text-gray-400"}`}>₦</span>
                                    <input
                                        type="number"
                                        placeholder="Max Price"
                                        value={maxPriceFilter}
                                        onChange={handleMaxPriceChange}
                                        className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
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

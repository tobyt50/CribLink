// src/pages/Listings.js (Centralized View)
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Import all sidebar components
import AdminSidebar from '../components/admin/Sidebar';
import AgencyAdminSidebar from '../components/agencyadmin/Sidebar';
import AgentSidebar from '../components/agent/Sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import axios from 'axios';
// Import necessary icons from @heroicons/react/24/outline
import { TableCellsIcon, Squares2X2Icon, ArrowUpIcon, ArrowDownIcon, TrashIcon, PencilIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import API_BASE_URL from '../config';
import PurchaseCategoryFilter from '../components/PurchaseCategoryFilter';
// Corrected import statement for lucide-react icons
import { Menu, X, Search, SlidersHorizontal, DollarSign, ListFilter, Plus, FileText, LayoutGrid, LayoutList } from 'lucide-react';
import { useTheme } from '../layouts/AppShell';
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { useSidebarState } from '../hooks/useSidebarState'; // Import the useSidebarState hook
import { useAuth } from '../context/AuthContext'; // Import useAuth hook to get user role

// Reusable Dropdown Component (copied for self-containment and consistency)
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

// Skeleton for a Listing Card (graphical view)
const ListingCardSkeleton = ({ darkMode }) => (
  <div className={`rounded-xl shadow-lg p-4 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
    <div className={`w-full h-32 rounded-lg ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
    <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-2`}></div>
    <div className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
    <div className="flex justify-between items-center">
      <div className={`h-8 w-1/3 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
    </div>
  </div>
);

// Skeleton for a Listing Table Row (simple view)
const ListingTableRowSkeleton = ({ darkMode }) => (
  <tr className={`border-t animate-pulse ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
    <td className="py-2 px-2"><div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2"><div className={`h-4 w-32 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2"><div className={`h-4 w-28 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2"><div className={`h-4 w-20 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2"><div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2"><div className={`h-4 w-16 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2"><div className={`h-4 w-28 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2"><div className={`h-4 w-24 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2"><div className={`h-4 w-12 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2"><div className={`h-4 w-12 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
    <td className="py-2 px-2 flex gap-2"><div className={`h-8 w-16 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div><div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></td>
  </tr>
);


const Listings = () => {
    const [listings, setListings] = useState([]); // Raw listings from API (paginated)
    const [filteredAndSortedListings, setFilteredAndSortedListings] = useState([]); // For client-side sorting only
    const [searchTerm, setSearchTerm] = useState('');
    // Initialize viewMode from localStorage, default to 'simple' (table view)
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('defaultListingsView') || 'simple');
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
    const { showMessage } = useMessage(); // Initialize useMessage
    const { showConfirm } = useConfirmDialog(); // Initialize useConfirmDialog
    const [userFavourites, setUserFavourites] = useState([]); // New state for user's favorited listing IDs

    // Loading state
    const [loading, setLoading] = useState(true);


    // Use the useSidebarState hook for mobile/sidebar state
    const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
    // State for active section in the sidebar
    const [activeSection, setActiveSection] = useState('listings');

    // State and ref for export dropdown
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    // New state for controlling filter dropdown visibility within search bar
    const [showSearchBarFilters, setShowSearchBarFilters] = useState(false);
    const filterAreaRef = useRef(null); // Ref for the entire filter area (search bar + dropdowns)

    // Get user and role from AuthContext
    const { user } = useAuth();
    const userRole = user?.role;
    const userId = user?.user_id;
    const userAgencyId = user?.agency_id;


    const location = useLocation();

    // Effect to set initial status filter from location state (e.g., from dashboard links)
    const [statusFilter, setStatusFilter] = useState(() => {
        return location.state?.statusFilter || 'all';
    });

    useEffect(() => {
        if (location.state?.statusFilter && location.state.statusFilter !== statusFilter) {
            setStatusFilter(location.state.statusFilter);
            setPage(1);
        }
    }, [location.state?.statusFilter, statusFilter]);

    // Effect to close export dropdown and search bar filters when clicking outside
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
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener('click', handleClickOutside); // Changed from mousedown to click
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    // New function to fetch user's favorite listings
    const fetchUserFavourites = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUserFavourites([]); // Clear favorites if not logged in
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/favourites/properties`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserFavourites(response.data.favourites.map(fav => fav.property_id));
        } catch (error) {
            console.error("Failed to fetch user favourites:", error);
            setUserFavourites([]);
        }
    }, []);

    // New function to handle adding/removing a listing from favorites
    const handleFavoriteToggle = useCallback(async (propertyId, isCurrentlyFavorited) => {
        const token = localStorage.getItem("token");
        if (!token) {
            showMessage("Please log in to manage your favorites.", "error");
            navigate('/signin');
            return;
        }

        try {
            if (isCurrentlyFavorited) {
                // Remove from favorites
                await axios.delete(`${API_BASE_URL}/favourites/properties/${propertyId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showMessage("Removed from favorites!", "success");
            } else {
                // Add to favorites
                await axios.post(`${API_BASE_URL}/favourites/properties`, { property_id: propertyId }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showMessage("Added to favorites!", "success");
            }
            // Re-fetch user favorites to update the UI
            fetchUserFavourites();
        } catch (error) {
            console.error("Failed to toggle favorite status:", error);
            let errorMessage = 'Failed to update favorites. Please try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(errorMessage, 'error');
        }
    }, [fetchUserFavourites, showMessage, navigate]);


    // Fetch listings function - now sends all filters and pagination to backend
    const fetchListings = useCallback(async () => {
        // Only fetch listings if user role is available
        if (!userRole) {
            console.log("User role not yet available, skipping fetchListings.");
            return;
        }
        setLoading(true); // Start loading

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

            // --- Pass agent_id or agency_id to the backend for filtering based on role ---
            if (userRole === 'agent' && userId) {
                params.append('agent_id', userId);
            } else if (userRole === 'agency_admin' && userAgencyId) {
                params.append('agency_id', userAgencyId);
            }
            // For 'admin' role, no specific agent_id or agency_id is appended, allowing all listings.
            // -----------------------------------------------------------------------------

            // Pagination parameters
            params.append('page', page);
            params.append('limit', limit);

            // Get the authentication token from localStorage
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Use axios for the request
            const response = await axios.get(`${API_BASE_URL}/listings?${params.toString()}`, { headers });

            // Assuming the API returns an object with 'listings' array, 'total' count, and 'totalPages'
            setListings(response.data.listings || []); // Update raw listings state
            setTotalListings(response.data.total || 0); // Update total count
            setTotalPages(response.data.totalPages || 1);

        } catch (err) {
            console.error('Error fetching listings:', err.response?.data || err.message);
            showMessage('Failed to fetch listings. Please try again.', 'error');
            setListings([]);
            setFilteredAndSortedListings([]); // Clear sorted listings on error
            setTotalListings(0);
            setTotalPages(1);
            // Handle authentication errors (e.g., token expired)
            if (err.response && err.response.status === 401) {
                navigate('/signin');
            }
        } finally {
            setLoading(false); // End loading
        }
    }, [purchaseCategoryFilter, searchTerm, minPriceFilter, maxPriceFilter, statusFilter, page, limit, userRole, userId, userAgencyId, navigate, showMessage]); // All filters, pagination, and user-related dependencies

    // Effect to fetch listings whenever relevant states change
    useEffect(() => {
        fetchListings();
        fetchUserFavourites(); // Fetch favorites when listings are fetched
    }, [fetchListings, fetchUserFavourites]); // Depend on the memoized fetchListings and fetchUserFavourites

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
                return sortDirection === 'asc' ? aValue - bValue : bBvalue - aValue;
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
        showConfirm({
            title: "Approve Listing",
            message: "Are you sure you want to approve this listing and make it available?",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    showMessage('Authentication token not found. Please sign in.', 'error');
                    return;
                }
                try {
                    await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Available' }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    showMessage('Listing approved successfully!', 'success');
                    fetchListings(); // Refresh the list
                } catch (error) {
                    console.error('Error approving listing:', error.response?.data || error.message);
                    showMessage('Failed to approve listing. Please try again.', 'error');
                }
            },
            confirmLabel: "Approve",
            cancelLabel: "Cancel"
        });
    };

    // Function to handle rejecting a listing (status becomes 'rejected')
    const handleRejectListing = async (listingId) => {
        showConfirm({
            title: "Reject Listing",
            message: "Are you sure you want to reject this listing?",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    showMessage('Authentication token not found. Please sign in.', 'error');
                    return;
                }
                try {
                    await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'rejected' }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    showMessage('Listing rejected successfully!', 'success');
                    fetchListings(); // Refresh the list
                } catch (error) {
                    console.error('Error rejecting listing:', error.response?.data || error.message);
                    showMessage('Failed to reject listing. Please try again.', 'error');
                }
            },
            confirmLabel: "Reject",
            cancelLabel: "Cancel"
        });
    };

    // Function to handle marking an 'under offer' listing as 'sold' (completed)
    const handleMarkAsSold = async (listingId) => {
        showConfirm({
            title: "Mark as Sold",
            message: "Are you sure you want to mark this listing as 'Sold'?",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    showMessage('Authentication token not found. Please sign in.', 'error');
                    return;
                }
                try {
                    await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Sold' }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    showMessage('Listing marked as Sold successfully!', 'success');
                    fetchListings(); // Refresh the list
                } catch (error) {
                    console.error('Error marking listing as sold:', error.response?.data || error.message);
                    showMessage('Failed to mark listing as sold. Please try again.', 'error');
                }
            },
            confirmLabel: "Mark Sold",
            cancelLabel: "Cancel"
        });
    };

    // Function to handle marking an 'under offer' listing as 'available' (failed)
    const handleMarkAsFailed = async (listingId) => {
        showConfirm({
            title: "Mark as Available",
            message: "Are you sure you want to mark this listing as 'Available' (undo offer)?",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    showMessage('Authentication token not found. Please sign in.', 'error');
                    return;
                }
                try {
                    await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Available' }, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    showMessage('Listing marked as Available successfully!', 'success');
                    fetchListings(); // Refresh the list
                } catch (error) {
                    console.error('Error marking listing as failed:', error.response?.data || error.message);
                    showMessage('Failed to mark listing as available. Please try again.', 'error');
                }
            },
            confirmLabel: "Mark Available",
            cancelLabel: "Cancel"
        });
    };

    const handleDeleteListing = async (listingId) => {
        showConfirm({
            title: "Delete Listing",
            message: "Are you sure you want to delete this listing permanently? This action cannot be undone.",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    showMessage('Authentication token not found. Please sign in.', 'error');
                    return;
                }
                try {
                    await axios.delete(`${API_BASE_URL}/listings/${listingId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    showMessage('Listing deleted successfully!', 'success');
                    fetchListings();
                } catch (error) {
                    console.error('Error deleting listing:', error.response?.data || error.message);
                    showMessage('Failed to delete listing. Please try again.', 'error');
                }
            },
            confirmLabel: "Delete",
            cancelLabel: "Cancel"
        });
    };

    // Function to handle exporting listings to CSV
    const handleExportCsv = async (scope) => {
        const dataToExport = scope === 'current' ? filteredAndSortedListings : listings; // Use filteredAndSortedListings for current view

        if (dataToExport.length === 0) {
            showMessage(`No listing data found for ${scope} export.`, 'info');
            setIsExportDropdownOpen(false);
            return;
        }

        // Define CSV headers based on your table columns
        const headers = [
            'property_id', 'purchase_category', 'title', 'location', 'state', 'price', 'status', 'user_id', 'date_listed', 'property_type', 'bedrooms', 'bathrooms'
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
            l.user_id, // Use user_id for generic export
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
        showMessage("Listings exported successfully!", 'success');
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset page on search
    };

    const handleStatusChange = useCallback((value) => { // Changed to accept value directly from Dropdown
        setStatusFilter(value);
        setPage(1); // Reset page on status change
    }, []);

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

    // Conditionally render the sidebar based on user role
    const renderSidebar = () => {
        if (userRole === 'admin') {
            return (
                <AdminSidebar
                    collapsed={isMobile ? false : isCollapsed}
                    setCollapsed={isMobile ? () => {} : setIsCollapsed}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    isMobile={isMobile}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
            );
        } else if (userRole === 'agency_admin') {
            return (
                <AgencyAdminSidebar
                    collapsed={isMobile ? false : isCollapsed}
                    setCollapsed={isMobile ? () => {} : setIsCollapsed}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    isMobile={isMobile}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
            );
        } else if (userRole === 'agent') {
            return (
                <AgentSidebar
                    collapsed={isMobile ? false : isCollapsed}
                    setCollapsed={isMobile ? () => {} : setIsCollapsed}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    isMobile={isMobile}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
            );
        }
        return null; // Or a default sidebar if needed for other roles
    };

    // Determine the base path for add/edit listing based on role
    const getRoleBasePath = () => {
        if (userRole === 'admin') return '/admin';
        if (userRole === 'agency_admin') return '/agency';
        if (userRole === 'agent') return '/agent';
        return ''; // Default or handle unauthorized access
    };

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

            {renderSidebar()} {/* Render the appropriate sidebar */}

            <motion.div
                key={isMobile ? 'mobile' : 'desktop'}
                animate={{ marginLeft: contentShift }}
                transition={{ duration: 0.3 }}
                initial={false}
                className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
                style={{ minWidth: `calc(100% - ${contentShift}px)` }}
            >
                {/* Mobile-only H1 element */}
                <div className="md:hidden flex items-center justify-center mb-4">
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Listings</h1>
                </div>

                {/* Desktop-only centered title */}
                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Listings</h1>
                </div>

                <main className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        // Conditionally apply classes based on mobile view (removed main container for mobile)
                        className={`${isMobile ? '' : 'rounded-3xl p-6 shadow'} space-y-4 max-w-full ${isMobile ? '' : (darkMode ? "bg-gray-800" : "bg-white")}`}
                    >
                        {/* Mobile Control Menu */}
                        {isMobile && (
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex items-center justify-between gap-4">
                                    {/* Search Bar with integrated Filter Icon */}
                                    <div className="flex-1 relative" ref={filterAreaRef}>
                                        <input
                                            type="text"
                                            placeholder="Search listings..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters(prev => !prev); }}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`}
                                            title="Filter Listings"
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
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center flex-shrink-0"
                                        onClick={() => navigate(`${getRoleBasePath()}/add-listing`)} // Role-specific path
                                        title="Add New Listing"
                                    >
                                        <Plus size={20} />
                                    </button>
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
                                                    <button onClick={() => handleExportCsv('all')} className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}>All Listings</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* View mode buttons for mobile */}
                                <div className="flex justify-center gap-2 w-full">
                                    <button
                                        className={`flex-1 p-2 rounded-xl h-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => { setViewMode('simple'); localStorage.setItem('defaultListingsView', 'simple'); }}
                                        title="List View"
                                    >
                                        <LayoutList className="h-5 w-5 mr-2" /> List View
                                    </button>
                                    <button
                                        className={`flex-1 p-2 rounded-xl h-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultListingsView', 'graphical'); }}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="h-5 w-5 mr-2" /> Grid View
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Desktop Filters and Controls */}
                        {!isMobile && (
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                {/* Search and Filter Button */}
                                <div className="flex items-center gap-4 w-full">
                                    {/* Search Bar with integrated Filter Icon */}
                                    <div className="w-full relative max-w-[28rem]" ref={filterAreaRef}>
                                        <input
                                            type="text"
                                            placeholder="Search listings..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className={`w-full px-4 py-2 pr-10 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                                                darkMode
                                                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                                            }`}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSearchBarFilters(prev => !prev); }}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${darkMode ? "text-gray-300 hover:bg-gray-600" : "text-gray-700 hover:bg-gray-200"}`}
                                            title="Filter Listings"
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
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Add, Export, and View Mode Buttons - Grouped together */}
                                <div className="flex gap-2 items-center">
                                    <button
                                        className="bg-green-500 text-white flex items-center justify-center px-4 h-10 rounded-xl hover:bg-green-600 text-sm font-medium"
                                        onClick={() => navigate(`${getRoleBasePath()}/add-listing`)} // Role-specific path
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
                                        onClick={() => { setViewMode('simple'); localStorage.setItem('defaultListingsView', 'simple'); }}
                                        title="Simple View"
                                    >
                                        <TableCellsIcon className="h-6 w-6" />
                                    </button>
                                    <button
                                        className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                        onClick={() => { setViewMode('graphical'); localStorage.setItem('defaultListingsView', 'graphical'); }}
                                        title="Graphical View"
                                    >
                                        <Squares2X2Icon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Only render listings if userRole is available */}
                        {!userRole ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Loading user data...
                            </div>
                        ) : loading ? (
                            viewMode === 'graphical' ? (
                                <motion.div
                                    layout
                                    className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-5"
                                >
                                    {[...Array(limit)].map((_, i) => <ListingCardSkeleton key={i} darkMode={darkMode} />)}
                                </motion.div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className={`w-full mt-4 text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        <thead>
                                            <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                {['property_id', 'title', 'location', 'property_type', 'price', 'status', 'date_listed', 'purchase_category', 'bedrooms', 'bathrooms', 'actions'].map((key) => (
                                                    <th
                                                        key={key}
                                                        className={`py-2 px-2 whitespace-nowrap`}
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
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                                            {[...Array(limit)].map((_, i) => <ListingTableRowSkeleton key={i} darkMode={darkMode} />)}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : filteredAndSortedListings.length === 0 ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                No listings found matching your criteria.
                            </div>
                        ) : viewMode === 'graphical' ? (
                            <motion.div
                                layout
                                // Modified grid classes for better mobile responsiveness
                                className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-5"
                            >
                                {filteredAndSortedListings.map((listing) => (
                                    <div key={listing.property_id}>
                                        <ListingCard
                                            listing={listing}
                                            isFavorited={userFavourites.includes(listing.property_id)} // Pass favorite state
                                            onFavoriteToggle={handleFavoriteToggle} // Pass toggle function
                                            // Pass user role, ID, and agency ID to ListingCard
                                            userRole={userRole}
                                            userId={userId}
                                            userAgencyId={userAgencyId}
                                            getRoleBasePath={getRoleBasePath} // Pass the function
                                            onDeleteListing={handleDeleteListing} // Pass the delete function
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
                                        {filteredAndSortedListings.map((listing) => (
                                            <tr key={listing.property_id} className={`border-t cursor-default max-w-full break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-50"}`}>
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
                                                                onClick={() => navigate(`${getRoleBasePath()}/edit-listing/${listing.property_id}`)} // Role-specific path
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
                        )}
                    </motion.div>
                </main>
            </motion.div>
        </div>
    );
};

export default Listings;

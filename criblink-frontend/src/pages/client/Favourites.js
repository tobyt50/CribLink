import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../../components/ListingCard'; // Re-use ListingCard
import axios from 'axios';
import API_BASE_URL from '../../config';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook
import ClientSidebar from '../../components/client/Sidebar'; // Import the ClientSidebar

// Import necessary icons
import { ArrowUpIcon, ArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Menu, X, Search, SlidersHorizontal, LayoutGrid, LayoutList } from 'lucide-react';


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
                    <ArrowDownIcon className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
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
    const [filteredAndSortedListings, setFilteredAndSortedListings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('graphical'); // Default to graphical view
    const [sortKey, setSortKey] = useState('date_listed');
    const [sortDirection, setSortDirection] = useState('desc');
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState('');
    const { darkMode } = useTheme();
    const navigate = useNavigate();

    // Pagination states
    const [page, setPage] = useState(1);
    const limit = 12; // Display 12 items per page
    const [totalFavourites, setTotalFavourites] = useState(0);
    const [totalPages, setTotalPages] = useState(1);


    // Mobile responsiveness states
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [isCollapsed, setIsCollapsed] = useState(false); // State for collapsing sidebar
    const [activeSection, setActiveSection] = useState('client-favourites'); // Set active section for sidebar
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); // Declared isFilterModalOpen

    // Consistent transition for main content motion (0.3s)
    const mainContentTransition = { duration: 0.3, ease: 'easeInOut' };


    // Fetch user details on component mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setUserRole('guest');
                    navigate('/signin'); // Redirect if no token
                    return;
                }
                const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (data && data.user_id && data.role) {
                    setUserId(data.user_id);
                    setUserRole(data.role);
                } else {
                    console.error("User ID or role not found in profile data.");
                    navigate('/signin');
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
                navigate('/signin');
            }
        };
        fetchUser();

        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // On desktop, keep sidebar open; on mobile, keep it closed initially
            setIsSidebarOpen(!mobile);
            // On resize, if it becomes desktop, ensure sidebar is not collapsed
            if (!mobile) {
                setIsCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [navigate]);

    // Fetch favorite listings with pagination
    const fetchFavouriteListings = useCallback(async () => {
        if (!userId) {
            console.log("User ID not available, skipping fetching favourites.");
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({ page, limit, sort: sortKey, direction: sortDirection, search: searchTerm });

            const response = await axios.get(`${API_BASE_URL}/favourites?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFavouriteListings(response.data.favourites || []);
            setTotalFavourites(response.data.total || 0);
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            console.error('Error fetching favourite listings:', err.response?.data || err.message);
            setFavouriteListings([]);
            setTotalFavourites(0);
            setTotalPages(1);
        }
    }, [userId, page, limit, sortKey, sortDirection, searchTerm]); // Add page, limit, sortKey, sortDirection, searchTerm to dependencies

    useEffect(() => {
        fetchFavouriteListings();
    }, [fetchFavouriteListings]);

    // Apply filtering and sorting (now primarily for client-side display after API fetch)
    const applyFilteringAndSorting = useCallback(() => {
        // Since the API is now handling pagination, this function primarily sorts the already paginated data
        let currentData = [...favouriteListings];

        // The search term filter is now handled by the backend API call,
        // but keeping it here for consistency if future needs arise for client-side search on a smaller dataset
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            currentData = currentData.filter(listing =>
                listing.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                listing.location.toLowerCase().includes(lowerCaseSearchTerm) ||
                listing.property_type.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

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
        setFilteredAndSortedListings(currentData);
    }, [favouriteListings, searchTerm, sortKey, sortDirection]);

    useEffect(() => {
        applyFilteringAndSorting();
    }, [applyFilteringAndSorting]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleSortClick = (key) => {
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'date_listed'];
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
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'date_listed'];
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

    const handleRemoveFavorite = async (propertyId) => {
        if (!userId) {
            console.warn('User not authenticated, cannot remove favorite.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error("Authentication token not found.");
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/favourites/${propertyId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log(`Listing ${propertyId} removed from favorites!`);
            // Refetch listings to update pagination
            fetchFavouriteListings();
        } catch (err) {
            console.error('Error removing from favorites:', err.response?.data || err.message);
        }
    };

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    // Calculate contentShift based on collapsed state and isMobile
    const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

    return (
        <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex`}> {/* Added flex to parent div */}
            {/* Mobile Sidebar Toggle Button */}
            {isMobile && (
                <motion.button
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    className={`fixed top-20 left-4 z-50 p-2 rounded-full shadow-md ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
                    initial={false}
                    animate={{ rotate: isSidebarOpen ? 180 : 0, opacity: 1 }}
                    transition={mainContentTransition} // Apply consistent transition
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={isSidebarOpen ? 'close' : 'menu'}
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }} // Consistent with Staff.js mobile toggle icon
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </motion.div>
                    </AnimatePresence>
                </motion.button>
            )}

            {/* Client Sidebar */}
            <ClientSidebar
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                collapsed={isMobile ? false : isCollapsed}
                setCollapsed={setIsCollapsed}
                activeSection={activeSection}
            />

            {/* Main Content Area */}
            <motion.div
                key={isMobile ? 'mobile-content' : 'desktop-content'} // Unique key for motion.div
                style={{ marginLeft: contentShift }}
                animate={{ marginLeft: contentShift }}
                transition={mainContentTransition} // Apply consistent transition
                initial={false}
                className="flex-1 overflow-auto pt-6 px-4 md:px-8" // Removed min-w-0, let flex-1 handle width
            >
                {/* Headers */}
                <div className="md:hidden flex items-center justify-center mb-4">
                    <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>My Favourites</h1>
                </div>
                <div className="hidden md:block mb-6">
                    <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>My Favourites</h1>
                </div>

                <main className="space-y-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`rounded-3xl p-6 shadow space-y-4 max-w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                        {/* Control Menu */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative flex-grow">
                                    <Search size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                                    <input
                                        type="text"
                                        placeholder="Search favourites..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className={`w-full py-2 pl-10 pr-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
                                    />
                                </div>
                                {isMobile && (
                                    <button
                                        className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                                        onClick={() => setIsFilterModalOpen(true)}
                                        title="Open Filters"
                                    >
                                        <SlidersHorizontal size={20} />
                                    </button>
                                )}
                            </div>

                            {/* View Mode Buttons */}
                            <div className="flex gap-2 items-center">
                                <button
                                    className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'graphical' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                    onClick={() => setViewMode('graphical')}
                                    title="Grid View"
                                >
                                    <LayoutGrid className="h-5 w-5" />
                                </button>
                                <button
                                    className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === 'simple' ? 'bg-green-700 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                    onClick={() => setViewMode('simple')}
                                    title="List View"
                                >
                                    <LayoutList className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {userId === null ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Loading user data... Please ensure you are logged in to view your favourites.
                            </div>
                        ) : filteredAndSortedListings.length === 0 ? (
                            <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                No favorite listings found.
                            </div>
                        ) : viewMode === 'graphical' ? (
                            <motion.div
                                layout
                                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {filteredAndSortedListings.map((listing) => (
                                    <ListingCard
                                        key={listing.property_id}
                                        listing={listing}
                                        userId={userId} // Pass userId
                                        userRole={userRole} // Pass userRole
                                        onFavoriteToggle={handleRemoveFavorite} // Pass this to update UI on removal
                                        isFavoritedProp={true} // Always true for listings on this page
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className={`w-full mt-4 text-sm table-fixed min-w-max ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    <thead>
                                        <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            {['property_id', 'title', 'location', 'property_type', 'price', 'date_listed', 'actions'].map((key) => (
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
                                                            key === 'actions' ? '80px' : 'auto'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <span className="truncate">
                                                            {{
                                                                property_id: 'ID',
                                                                property_type: 'Type',
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
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[120px]" title={listing.title || ''}>{listing.title}</td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[120px]" title={listing.location || ''}>{listing.location}</td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={listing.property_type || ''}>{listing.property_type}</td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price)}>
                                                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price)}
                                                </td>
                                                <td className="py-2 px-1 truncate whitespace-nowrap overflow-hidden max-w-[100px]" title={listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 'N/A'}>{listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 'N/A'}</td>
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

                        {/* Pagination - consistent with Listings.js */}
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
                        transition={mainContentTransition} // Apply consistent transition
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
        </div>
    );
};

export default Favourites;

// Listings.js
import React, { useEffect, useState, useRef } from 'react'; // Import useRef
import { motion } from 'framer-motion';
import AgentSidebar from '../../components/agent/Sidebar';
// Removed AgentHeader as it's no longer needed with the new sidebar structure
import { useLocation } from 'react-router-dom';
import ListingCard from '../../components/ListingCard'; // Corrected import path
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
// Import necessary icons
import { TableCellsIcon, Squares2X2Icon, ArrowUpIcon, ArrowDownIcon, TrashIcon, PencilIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/outline'; // Keep ChevronDownIcon for the dropdown
import API_BASE_URL from '../../config'; // Corrected variable name here
import PurchaseCategoryFilter from '../../components/PurchaseCategoryFilter';

const Listings = () => {
    const [listings, setListings] = useState([]);
    const [filteredListings, setFilteredListings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('simple'); // 'simple' or 'graphical'
    const [sortKey, setSortKey] = useState('date_listed');
    const [sortDirection, setSortDirection] = useState('desc');
    const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState('');
    const [minPriceFilter, setMinPriceFilter] = useState('');
    const [maxPriceFilter, setMaxPriceFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalListings, setTotalListings] = useState(0);
    const limit = 10;
    const totalPages = Math.max(1, Math.ceil(totalListings / limit));
    const navigate = useNavigate(); // Initialize useNavigate

    // State and ref for export dropdown
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    // State for sidebar visibility and collapse, consistent with AgentDashboard.js
    const [isCollapsed, setIsCollapsed] = useState(false);
    // State for active section in the sidebar, consistent with AgentDashboard.js
    const [activeSection, setActiveSection] = useState('listings'); // Set default active section for Listings page

    // State to hold the signed-in agent's ID
    const [agentId, setAgentId] = useState(null);


    // Removed the resize effect as AgentSidebar is now fixed and manages its own collapse state.

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
                console.error("Error fetching agent profile:", err);
                // Handle authentication errors (e.g., expired token)
                if (err.response && err.response.status === 401) {
                    navigate('/signin'); // Redirect to login on authentication failure
                }
            }
        };
        fetchAgentProfile();

    }, [navigate]); // navigate is a dependency because it's used inside the effect

    // Effect to fetch listings whenever filters change or component mounts, including agentId
    // This effect will now only run the fetchListings function when agentId is not null
    useEffect(() => {
        // Only fetch listings if agentId is available
        if (agentId !== null) { // Ensure agentId is explicitly not null
            fetchListings();
        }
    }, [purchaseCategoryFilter, searchTerm, minPriceFilter, maxPriceFilter, agentId]); // Dependency array includes filter states and agentId

    // Effect to apply status filter and sorting whenever the fetched listings or status/sort criteria change
    useEffect(() => {
        filterAndSortListings();
    }, [listings, statusFilter, sortKey, sortDirection]); // Dependency array includes listings and filter/sort states

    const fetchListings = async () => {
        try {
            const params = new URLSearchParams();

            // Conditionally append parameters only if they have a value
            if (purchaseCategoryFilter && purchaseCategoryFilter !== 'all') { // Ensure 'all' is not sent as a filter
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

            // --- This is where the agent_id is added to the query parameters ---
            // This will only be added if the agentId state is not null,
            // which is handled by the outer useEffect's dependency array.
            if (agentId !== null) {
                params.append('agent_id', agentId);
            }
            // -----------------------------------------------------------------


            // Use the correct API_BASE_URL
            // IMPORTANT: Your backend API endpoint for /listings MUST be updated
            // to read the 'agent_id' query parameter and filter the database query
            // to only return listings where property_listings.agent_id matches the provided agent_id.
            const response = await axios.get(`${API_BASE_URL}/listings?${params.toString()}`);
            setListings(response.data);
            // Assuming the API returns total listings in the response for pagination
            // setTotalListings(response.data.total); // Uncomment if your API provides total count
        } catch (err) {
            console.error('Error fetching listings:', err.response?.data || err.message);
            setListings([]); // Set to empty array on error
            // setTotalListings(0); // Uncomment if your API provides total count
        }
    };

    const filterAndSortListings = () => {
        let filteredData = listings;

        // Apply status filter (client-side)
        if (statusFilter !== 'all') {
            filteredData = filteredData.filter(l => l.status && l.status.toLowerCase() === statusFilter.toLowerCase());
        }

        // Apply sorting (client-side)
        const sortedData = [...filteredData].sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            // --- Refined Price Sorting Logic ---
            if (sortKey === 'price') {
                // Clean the price string by removing non-numeric characters except decimal point and sign
                const cleanPriceA = String(aValue).replace(/[^0-9.-]+/g, '');
                const cleanPriceB = String(bValue).replace(/[^0-9.-]+/g, '');
                const numA = parseFloat(cleanPriceA);
                const numB = parseFloat(cleanPriceB);

                if (!isNaN(numA) && !isNaN(numB)) {
                    // Both are valid numbers, perform numerical comparison
                    return sortDirection === 'asc' ? numA - numB : numB - aValue;
                } else if (!isNaN(numA)) {
                    // Only aValue is a valid number, sort it before non-numbers in ascending, after in descending
                    return sortDirection === 'asc' ? -1 : 1;
                } else if (!isNaN(numB)) {
                    // Only bValue is a valid number, sort it before non-numbers in ascending, after in descending
                    return sortDirection === 'asc' ? 1 : -1;
                }
                // Both are non-numeric or null/undefined, maintain original order relative to each other
                return 0;
            }
            // --- End Refined Price Sorting Logic ---

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
                // Fallback for mixed types or other non-string/non-number types
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
    };

    // Function to handle approving a listing (status becomes 'Available')
    const handleApproveListing = async (listingId) => {
        // Show a confirmation dialog
        const isConfirmed = window.confirm('Are you sure you want to approve this listing?');

        if (!isConfirmed) {
            return; // Stop if the user cancels
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication token not found. Please sign in.');
                return;
            }

            // Make PUT request to update status to 'Available'
            await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Available' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('Listing approved successfully!');
            fetchListings(); // Refresh the list
        } catch (error) {
            console.error('Error approving listing:', error.response?.data || error.message);
            alert('Failed to approve listing.');
        }
    };

    // Function to handle rejecting a listing (status becomes 'rejected')
    const handleRejectListing = async (listingId) => {
        // Show a confirmation dialog
        const isConfirmed = window.confirm('Are you sure you want to reject this listing?');

        if (!isConfirmed) {
            return; // Stop if the user cancels
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication token not found. Please sign in.');
                return;
            }

            // Make PUT request to update status to 'rejected'
            await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'rejected' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('Listing rejected successfully!');
            fetchListings(); // Refresh the list
        } catch (error) {
            console.error('Error rejecting listing:', error.response?.data || error.message);
            alert('Failed to reject listing.');
        }
    };

    // Function to handle marking an 'under offer' listing as 'sold' (completed)
    const handleMarkAsSold = async (listingId) => {
        // Show a confirmation dialog
        const isConfirmed = window.confirm('Are you sure you want to mark this listing as Sold?');

        if (!isConfirmed) {
            return; // Stop if the user cancels
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication token not found. Please sign in.');
                return;
            }

            // Make PUT request to update status to 'Sold'
            await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Sold' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('Listing marked as Sold successfully!');
            fetchListings(); // Refresh the list
        } catch (error) {
            console.error('Error marking listing as sold:', error.response?.data || error.message);
            alert('Failed to mark listing as sold.');
        }
    };

    // Function to handle marking an 'under offer' listing as 'available' (failed)
    const handleMarkAsFailed = async (listingId) => {
        // Show a confirmation dialog
        const isConfirmed = window.confirm('Are you sure you want to mark this listing as Failed (return to Available)?');

        if (!isConfirmed) {
            return; // Stop if the user cancels
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Authentication token not found. Please sign in.');
                return;
            }

            // Make PUT request to update status to 'Available'
            await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: 'Available' }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('Listing marked as Failed (Available) successfully!');
            fetchListings(); // Refresh the list
        } catch (error) {
            console.error('Error marking listing as failed:', error.response?.data || error.message);
            alert('Failed to mark listing as failed.');
        }
    };


    const handleDeleteListing = async (listingId) => {
        // Show a confirmation dialog
        const isConfirmed = window.confirm('Are you sure you want to delete this listing?');

        if (!isConfirmed) {
            return; // Stop if the user cancels
        }

        try {
            // Retrieve the JWT token from local storage
            const token = localStorage.getItem('token');

            if (!token) {
                alert('Authentication token not found. Please sign in.');
                // Optionally redirect to login page
                // navigate('/signin');
                return;
            }

            // Make the DELETE request to the backend
            await axios.delete(`${API_BASE_URL}/listings/${listingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Include the JWT token
                }
            });

            alert('Listing deleted successfully!');
            // Refresh the listings after successful deletion
            fetchListings();

        } catch (error) {
            console.error('Error deleting listing:', error.response?.data || error.message);
            alert('Failed to delete listing.');
        }
    };

    // Function to handle exporting listings to CSV
    const handleExportCsv = async (scope) => {
        const dataToExport = scope === 'current' ? filteredListings : listings; // Use filteredListings for current page, all listings for all

        if (dataToExport.length === 0) {
            alert(`No listing data found for ${scope} export.`);
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
            l.price, // Price will be exported as is, numerical sorting is for display
            l.status || 'N/A',
            l.agent_id, // Use agent_id here as per your table schema
            l.date_listed ? new Date(l.date_listed).toLocaleDateString() : 'N/A',
            l.property_type,
            l.bedrooms || 'N/A',
            l.bathrooms || 'N/A'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`)); // Enclose fields in quotes and escape existing quotes

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'property_listings.csv'); // Set filename
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExportDropdownOpen(false); // Close dropdown after export
    };


    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const handlePurchaseCategoryChange = (e) => {
        setPurchaseCategoryFilter(e.target.value);
    };

    const handleMinPriceChange = (e) => {
        setMinPriceFilter(e.target.value);
    };

    const handleMaxPriceChange = (e) => {
        setMaxPriceFilter(e.target.value);
    };


    const handleSortClick = (key) => {
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'status', 'date_listed'];
        if (!sortableColumns.includes(key)) return;

        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };


    const renderSortIcon = (key) => {
        const sortableColumns = ['property_id', 'title', 'location', 'property_type', 'price', 'status', 'date_listed'];
        if (!sortableColumns.includes(key)) return null;

        if (sortKey === key) {
            return sortDirection === 'asc' ? (
                <ArrowUpIcon className="h-4 w-4 ml-1 inline text-green-700" />
            ) : (
                <ArrowDownIcon className="h-4 w-4 ml-1 inline text-green-700" />
            );
        }
        return <ArrowDownIcon className="h-4 w-4 ml-1 inline text-gray-400" />;
    };

    // Helper function to capitalize the first letter of a string
    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const handleCardClick = (listingId) => {
        navigate(`/listing/${listingId}`);
    };


    // Adjusted contentShift based on isCollapsed state, consistent with AgentDashboard.js
    const contentShift = isCollapsed ? 80 : 256;

    // Include all possible statuses for the filter dropdown
    const statusOptions = ["all statuses", "available", "sold", "under offer", "pending", "rejected", "featured"];


    return (
        <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
            <AgentSidebar
                collapsed={isCollapsed} // Pass collapsed state
                setCollapsed={setIsCollapsed} // Pass setCollapsed function
                activeSection={activeSection} // Set active section for this page
                setActiveSection={setActiveSection} // Pass setActiveSection to allow sidebar to update active state
            />

            <motion.div
                animate={{ marginLeft: contentShift }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex-1 p-4 md:p-6" // Original padding, not touched
            >
                {/* Mobile-only H1 element */}
                <div className="md:hidden flex items-center justify-center mb-4">
                    <h1 className="text-2xl font-extrabold text-green-700 text-center">My Listings</h1> {/* Changed title */}
                </div>

                {/* Desktop-only centered title */}
                <div className="hidden md:block mb-6">
                    {/* Centered heading for desktop */}
                    <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">My Listings</h1> {/* Changed title */}
                </div>

                <main className="space-y-6">

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-4">
                        <input
                            type="text"
                            placeholder="Search listings..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring focus:ring-green-100"
                        />

                        <PurchaseCategoryFilter
                            selectedCategory={purchaseCategoryFilter}
                            onChange={setPurchaseCategoryFilter}
                            className="w-full md:w-1/6 px-4 py-2 border border-gray-300 rounded-xl shadow-sm"
                        />
                        <select
                            value={statusFilter}
                            onChange={handleStatusChange}
                            className="w-full md:w-1/6 px-4 py-2 border border-gray-300 rounded-xl shadow-sm"
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status === "all statuses" ? "all" : status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            placeholder="Min Price"
                            value={minPriceFilter}
                            onChange={handleMinPriceChange}
                            className="w-full md:w-1/6 px-4 py-2 border border-gray-300 rounded-xl shadow-sm"
                        />

                        <input
                            type="number"
                            placeholder="Max Price"
                            value={maxPriceFilter}
                            onChange={handleMaxPriceChange}
                            className="w-full md:w-1/6 px-4 py-2 border border-gray-300 rounded-xl shadow-sm"
                        />

                        {/* Buttons for Add and Export */}
                        <div className="flex gap-2">
                            <button
                                className="bg-green-400 text-white flex items-center justify-center px-4 h-10 rounded-xl hover:bg-green-500 text-sm font-medium"
                                onClick={() => navigate('/add-listing')}
                            >
                                +Add
                            </button>

                            {/* Export to CSV button and dropdown */}
                            <div className="relative inline-block text-left" ref={exportDropdownRef}>
                                <button
                                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                                    className="flex items-center justify-center h-10 rounded-xl bg-green-400 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500" // Added h-10 for consistent height
                                >
                                    Export to CSV <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" />
                                </button>
                                {isExportDropdownOpen && (
                                    <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                                        <div className="py-1">
                                            <button onClick={() => handleExportCsv('current')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Current View</button> {/* Changed text to Current View */}
                                            <button onClick={() => handleExportCsv('all')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">All Listings</button> {/* Changed text to All Listings */}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                        <div className="flex gap-2">
                            <button
                                className={`p-2 rounded-xl ${viewMode === 'simple' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'}`}
                                onClick={() => setViewMode('simple')}
                                title="Simple View"
                            >
                                <TableCellsIcon className="h-6 w-6" />
                            </button>
                            <button
                                className={`p-2 rounded-xl ${viewMode === 'graphical' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'}`}
                                onClick={() => setViewMode('graphical')}
                                title="Graphical View"
                            >
                                <Squares2X2Icon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Only render listings if agentId is available */}
                    {agentId === null ? (
                        // Display a message while waiting for agentId
                        <div className="text-center text-gray-500 py-8 col-span-full">
                            Loading agent data...
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 col-span-full">
                            No listings found matching your criteria.
                        </div>
                    ) : viewMode === 'graphical' ? (
                        <motion.div
                            layout
                            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {filteredListings.map((listing) => (
                                // Make the ListingCard clickable and navigate to the edit page
                                <div key={listing.property_id}> {/* Added key prop */}
                                    <ListingCard
                                        listing={listing}
                                        onDelete={handleDeleteListing} // Pass the delete handler to the card
                                    // Pass other necessary props to ListingCard
                                    />
                                </div>
                            ))}
                        </motion.div>
                    ) : ( // Render table view
                        <div className="overflow-x-auto bg-white rounded-3xl p-6 shadow">
                            <table className="w-full mt-4 text-sm table-fixed">
                                <thead>
                                    <tr className="text-gray-500">
                                        {['property_id', 'title', 'location', 'property_type', 'price', 'status', 'date_listed', 'purchase_category', 'bedrooms', 'bathrooms', 'actions'].map((key) => (
                                            <th
                                                key={key}
                                                onClick={key !== 'actions' ? () => handleSortClick(key) : undefined}
                                                className={`py-2 px-2 whitespace-nowrap truncate ${key !== 'actions' ? 'cursor-pointer hover:text-green-700' : ''}`}
                                            >
                                                {/* Adjusted flex container to align text and icon closely */}
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
                                <tbody>
                                    {filteredListings.map((listing) => (
                                        <tr key={listing.property_id} className="border-t hover:bg-gray-50">
                                            <td className="py-2 px-2 truncate whitespace-nowrap">{listing.property_id}</td>
                                            {/* Re-added whitespace-nowrap to prevent text wrapping and enable horizontal scroll */}
                                            <td className="py-2 px-2 truncate whitespace-nowrap overflow-hidden" title={listing.title}>{listing.title}</td>
                                            {/* Re-added whitespace-nowrap to prevent text wrapping and enable horizontal scroll */}
                                            <td className="py-2 px-2 truncate whitespace-nowrap overflow-hidden" title={listing.location}>{listing.location}</td>
                                            {/* Re-added whitespace-nowrap to prevent text wrapping and enable horizontal scroll */}
                                            <td className="py-2 px-2 truncate whitespace-nowrap overflow-hidden" title={listing.property_type}>{listing.property_type}</td>
                                            <td className="py-2 px-2 truncate whitespace-nowrap overflow-hidden" title={new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price)}>
                                                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(listing.price)}
                                            </td>
                                            <td className="py-2 px-2 whitespace-nowrap">{capitalizeFirstLetter(listing.status)}</td>
                                            <td className="py-2 px-2 whitespace-nowrap">{listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : 'N/A'}</td>
                                            {/* Re-added whitespace-nowrap to prevent text wrapping and enable horizontal scroll */}
                                            <td className="py-2 px-2 truncate whitespace-nowrap overflow-hidden" title={listing.purchase_category}>{listing.purchase_category}</td>
                                            <td className="py-2 px-2 w-12 text-left whitespace-nowrap">{listing.bedrooms}</td>
                                            <td className="py-2 px-2 w-12 text-left whitespace-nowrap">{listing.bathrooms}</td>
                                            <td className="py-2 px-2 whitespace-nowrap">
                                                {/* Modified the condition for 'pending' status */}
                                                {listing.status && (listing.status.toLowerCase() === 'pending' || listing.status.toLowerCase() === 'rejected') ? (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="bg-green-400 text-white px-3 py-1 rounded-md hover:bg-green-500 text-xs"
                                                            onClick={() => navigate(`/edit-listing/${listing.property_id}`)}
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
                                                ) : listing.status && listing.status.toLowerCase() === 'under offer' ? (
                                                    <div className="flex items-center gap-2">
                                                        <button className="text-green-600 hover:text-green-800 p-1" onClick={() => handleMarkAsSold(listing.property_id)} title="Mark as Sold">
                                                            <CurrencyDollarIcon className="h-6 w-6" />
                                                        </button>
                                                        <button className="text-gray-600 hover:text-gray-800 p-1" onClick={() => handleMarkAsFailed(listing.property_id)} title="Mark as Failed (Return to Available)">
                                                            <ArrowUturnLeftIcon className="h-6 w-6" />
                                                        </button>
                                                    </div>
                                                ) : ( // Default case for 'available', 'sold', 'featured'
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="bg-green-400 text-white px-3 py-1 rounded-md hover:bg-green-500 text-xs"
                                                            onClick={() => navigate(`/edit-listing/${listing.property_id}`)}
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


                            <div className="flex justify-between items-center pt-4">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                    className="px-4 py-2 rounded-lg bg-gray-100 text-sm disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                                <button
                                    disabled={page === totalPages || totalPages === 0}
                                    onClick={() => setPage(prev => prev + 1)}
                                    className="px-4 py-2 rounded-lg bg-gray-100 text-sm disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )
                    }
                </main>
            </motion.div>
        </div>
    );
};

export default Listings;

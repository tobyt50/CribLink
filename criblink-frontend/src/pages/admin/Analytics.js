import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import { CalendarDays, BarChart3, TrendingUp, Users, Home, MessageSquare, BriefcaseBusiness, AlertCircle, Menu, X, ChevronDownIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

// --- START: Imported Components (as per user request) ---
import AdminSidebar from '../../components/admin/Sidebar';
import { useTheme } from '../../layouts/AppShell';
import Card from '../../components/ui/Card';
// --- END: Imported Components ---

// Define the API base URL. In a real application, this would come from a config file (e.g., '../../config')
const API_BASE_URL = 'http://localhost:5000/admin/analytics'; // Assuming backend runs on port 5000 and analytics routes are under /admin/analytics

// Reusable Dropdown Component (embedded directly in Analytics.js)
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


const AdminAnalytics = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('analytics');
  const { darkMode } = useTheme();
  const navigate = useNavigate(); // Initialize useNavigate hook

  const [dateRange, setDateRange] = useState('last30days'); // State for date range filter

  const [listingStatusPieData, setListingStatusPieData] = useState([]); // Separate state for Pie Chart
  // Removed listingStatusBarData state
  const [listingsOverTimeData, setListingsOverTimeData] = useState([]);
  const [userRegistrationData, setUserRegistrationData] = useState([]);
  const [inquiryTrendsData, setInquiryTrendsData] = useState([]);
  const [propertyTypeData, setPropertyTypeData] = useState([]);
  const [listingPriceDistribution, setListingPriceDistribution] = useState([]);
  const [topLocationsData, setTopLocationsData] = useState([]);
  const [agentPerformanceData, setAgentPerformanceData] = useState([]);
  // New states for additional charts
  const [purchaseCategoryData, setPurchaseCategoryData] = useState([]);
  const [bedroomsDistributionData, setBedroomsDistributionData] = useState([]);
  const [bathroomsDistributionData, setBathroomsDistributionData] = useState([]);
  const [userRoleDistributionData, setUserRoleDistributionData] = useState([]); // New state for user role distribution

  const [totalListings, setTotalListings] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [revenueSoldListings, setRevenueSoldListings] = useState(0);
  const [totalDealsClosed, setTotalDealsClosed] = useState(0);
  // Removed totalAgents state

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve token from localStorage
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Effect to handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Function to fetch all analytics data from the backend
  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch Overview Statistics and Detailed Analytics Charts concurrently
      const [
        listingsCountRes,
        inquiriesCountRes,
        totalUsersRes,
        revenueSoldListingsRes,
        totalDealsClosedRes,
        // Removed totalAgentsRes from here
        listingStatusRes, // This will be used for both pie and bar chart
        listingsOverTimeRes,
        userRegistrationRes,
        inquiryTrendsRes,
        propertyTypeRes,
        listingPriceDistributionRes,
        topLocationsRes,
        agentPerformanceRes,
        purchaseCategoryRes,
        bedroomsDistributionRes,
        bathroomsDistributionRes,
        userRoleDistributionRes, // New fetch for user role distribution
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/stats/listings-count`, { headers }),
        axios.get(`${API_BASE_URL}/stats/inquiries-count`, { headers }),
        axios.get(`${API_BASE_URL}/total-users-count`, { headers }),
        axios.get(`${API_BASE_URL}/revenue-sold-listings`, { headers, params: { dateRange } }),
        axios.get(`${API_BASE_URL}/total-deals-closed`, { headers, params: { dateRange } }),
        // Removed axios.get for total agents
        
        // Data for charts that should display all-time accurate values (no dateRange param)
        axios.get(`${API_BASE_URL}/listing-status`, { headers }),
        axios.get(`${API_BASE_URL}/listings-over-time`, { headers, params: { dateRange } }), // Keep dateRange for trends
        axios.get(`${API_BASE_URL}/user-registrations`, { headers, params: { dateRange } }), // Keep dateRange for trends
        axios.get(`${API_BASE_URL}/inquiry-trends`, { headers, params: { dateRange } }), // Keep dateRange for trends
        axios.get(`${API_BASE_URL}/property-types`, { headers }),
        axios.get(`${API_BASE_URL}/listing-price-distribution`, { headers }),
        axios.get(`${API_BASE_URL}/top-locations`, { headers, params: { dateRange } }), // Keep dateRange for top locations over time
        axios.get(`${API_BASE_URL}/agent-performance`, { headers, params: { dateRange } }), // Keep dateRange for agent performance (if backend supports)
        axios.get(`${API_BASE_URL}/listing-purchase-category`, { headers }),
        axios.get(`${API_BASE_URL}/listing-bedrooms-distribution`, { headers }), // Changed to all-time
        axios.get(`${API_BASE_URL}/listing-bathrooms-distribution`, { headers }), // Changed to all-time
        axios.get(`${API_BASE_URL}/user-role-distribution`, { headers }), // New API call
      ]);

      setTotalListings(listingsCountRes.data.count);
      setTotalInquiries(inquiriesCountRes.data.count);
      setTotalUsers(totalUsersRes.data.count);
      setRevenueSoldListings(revenueSoldListingsRes.data.total_revenue || 0);
      setTotalDealsClosed(totalDealsClosedRes.data.total_deals || 0);
      // Removed setTotalAgents(totalAgentsRes.data.count);

      // Process listing status data for the Pie Chart
      const rawListingStatusData = listingStatusRes.data;
      const statusMapForPie = new Map();

      const standardStatusesForPie = {
        'available': 'Available',
        'sold': 'Sold',
        'under offer': 'Under Offer',
        'pending': 'Pending',
        'rejected': 'Rejected',
        'featured': 'Featured'
      };

      Object.values(standardStatusesForPie).forEach(displayStatus => {
          statusMapForPie.set(displayStatus, 0);
      });

      rawListingStatusData.forEach(item => {
          const statusKey = item.status.toLowerCase();
          let displayStatus = standardStatusesForPie[statusKey];
          if (!displayStatus) {
              displayStatus = capitalizeFirstLetter(statusKey);
          }
          statusMapForPie.set(displayStatus, (statusMapForPie.get(displayStatus) || 0) + item.count);
      });

      const finalListingStatusDataForPie = Array.from(statusMapForPie.entries()).map(([status, count]) => ({
          status: status,
          count: count
      }));
      setListingStatusPieData(finalListingStatusDataForPie); // Set for Pie Chart

      // Removed processing for Listing Status Bar Chart

      setListingsOverTimeData(listingsOverTimeRes.data);
      setUserRegistrationData(userRegistrationRes.data);
      setInquiryTrendsData(inquiryTrendsRes.data);

      const processedPropertyTypeData = propertyTypeRes.data.map(item => ({
        type: capitalizeFirstLetter(item.type),
        count: item.count
      }));
      setPropertyTypeData(processedPropertyTypeData);

      setListingPriceDistribution(listingPriceDistributionRes.data);
      setTopLocationsData(topLocationsRes.data);
      setAgentPerformanceData(agentPerformanceRes.data);

      const processedPurchaseCategoryData = purchaseCategoryRes.data.map(item => ({
        category: capitalizeFirstLetter(item.category),
        count: item.count
      }));
      setPurchaseCategoryData(processedPurchaseCategoryData);

      setBedroomsDistributionData(bedroomsDistributionRes.data);
      setBathroomsDistributionData(bathroomsDistributionRes.data);

      // Process user role distribution data
      const processedUserRoleData = userRoleDistributionRes.data.map(item => ({
        role: capitalizeFirstLetter(item.role),
        count: item.count
      }));
      setUserRoleDistributionData(processedUserRoleData);

    } catch (err) {
      console.error('Error fetching analytics data:', err.response?.data || err.message);
      setError('Failed to load analytics data. Please check your network connection and server status.');
      // Reset all data on error
      setTotalListings(0);
      setTotalUsers(0);
      setTotalInquiries(0);
      setRevenueSoldListings(0);
      setTotalDealsClosed(0);
      // Removed totalAgents reset
      setListingStatusPieData([]);
      // Removed listingStatusBarData reset
      setListingsOverTimeData([]);
      setUserRegistrationData([]);
      setInquiryTrendsData([]);
      setPropertyTypeData([]);
      setListingPriceDistribution([]);
      setTopLocationsData([]);
      setAgentPerformanceData([]);
      setPurchaseCategoryData([]);
      setBedroomsDistributionData([]);
      setBathroomsDistributionData([]);
      setUserRoleDistributionData([]); // Reset user role distribution data on error
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, token]); // Re-fetch data when dateRange or token changes

  // Trigger data fetching on component mount and when dateRange/token changes
  useEffect(() => {
    if (token) {
      fetchAnalyticsData();
    } else {
      setError('Authentication token not found. Please log in.');
      setIsLoading(false);
    }
  }, [fetchAnalyticsData, token]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#82ca9d', '#ffc658'];

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  const dateRangeOptions = [
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "last90days", label: "Last 90 Days" },
    { value: "ytd", label: "Year to Date" },
    // Custom range functionality would require additional date picker components
    // { value: "custom", label: "Custom Range (Not implemented)" },
  ];

  // Custom label rendering function for the PieChart
  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, outerRadius, percent, name, status, role }) => {
    const radius = outerRadius * 1.2; // Increase radius to move labels further out
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    let y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    // Specific adjustment for 'Available' label
    if (status && status.toLowerCase() === 'available') {
      y += 10; // Move 'Available' label down by 10 pixels
    }

    const labelText = status ? `${status} (${(percent * 100).toFixed(0)}%)` : `${role} (${(percent * 100).toFixed(0)}%)`;

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className={darkMode ? "text-gray-300" : "text-gray-700"}
      >
        {labelText}
      </text>
    );
  }, [darkMode]);


  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className={`fixed top-20 left-4 z-50 p-2 rounded-full shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}
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

      {/* AdminSidebar component */}
      <AdminSidebar
        collapsed={isMobile ? false : isCollapsed}
        setCollapsed={isMobile ? () => {} : setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main content area with motion animation */}
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 p-4 md:p-6 overflow-auto min-w-0"
        style={{ willChange: 'margin-left', minWidth: `calc(100% - ${contentShift}px)` }}
      >
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Analytics</h1>
        </div>

        {/* Desktop-only centered title */}
        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Analytics</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`rounded-3xl p-6 shadow space-y-6 max-w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          {/* Date Range Filter */}
          <div className="flex flex-col md:flex-row items-center justify-end gap-4 mb-6">
            <label htmlFor="dateRange" className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Date Range:</label>
            <Dropdown
              placeholder="Date Range"
              options={dateRangeOptions}
              value={dateRange}
              onChange={setDateRange}
              className="w-full md:w-auto"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className={`animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 ${darkMode ? "border-green-400" : "border-green-700"}`}></div>
              <p className={`ml-4 text-lg ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Loading analytics data...</p>
            </div>
          ) : error ? (
            <div className={`flex items-center justify-center p-4 rounded-xl ${darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-700"}`}>
              <AlertCircle className="mr-2" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Overview Statistics */}
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Overview Statistics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <Card onClick={() => navigate('/admin/listings')} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center">
                    <Home size={24} className="text-green-500 dark:text-green-400" />
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Listings</p>
                      <p className="text-xl font-semibold">{totalListings.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
                <Card onClick={() => navigate('/admin/users')} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center">
                    <Users size={24} className="text-blue-500 dark:text-blue-400" />
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                      <p className="text-xl font-semibold">{totalUsers.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
                <Card onClick={() => navigate('/admin/inquiries')} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center">
                    <MessageSquare size={24} className="text-purple-500 dark:text-purple-400" />
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Inquiries</p>
                      <p className="text-xl font-semibold">{totalInquiries.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
                <Card onClick={() => navigate('/admin/listings', { state: { statusFilter: 'Sold' } })} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center">
                    <TrendingUp size={24} className="text-orange-500 dark:text-orange-400" />
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue (Sold Listings)</p>
                      <p className="text-xl font-semibold">₦{revenueSoldListings.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
                <Card onClick={() => console.log('Total Deals Closed clicked')} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center">
                    <BriefcaseBusiness size={24} className="text-teal-500 dark:text-teal-400" />
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Deals Closed</p>
                      <p className="text-xl font-semibold">{totalDealsClosed.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
                {/* Removed the "Total Agents" stat card */}
              </div>

              {/* Charts Section */}
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Detailed Analytics</h2>

              <div className="space-y-8">
                {/* Section: Listings & Property Data */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Listing Status Distribution (Pie Chart Restored) */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Listing Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={listingStatusPieData} // Use the new state for Pie Chart
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="status"
                          label={renderCustomizedLabel}
                        >
                          {listingStatusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Listings Added Over Time */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Listings Added Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={listingsOverTimeData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="date" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Line type="monotone" dataKey="count" stroke="#82ca9d" activeDot={{ r: 8 }} name="New Listings" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Property Type Distribution */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Property Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={propertyTypeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="type" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="count" fill="#4CAF50" name="Number of Listings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Listings by Purchase Category Distribution */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Listings by Purchase Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={purchaseCategoryData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="category" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="count" fill="#00BCD4" name="Number of Listings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Removed Listings by Status (Bar) */}

                  {/* Listings by Bedrooms Distribution */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Listings by Bedrooms</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={bedroomsDistributionData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="bedrooms" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="count" fill="#E91E63" name="Number of Listings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Listings by Bathrooms Distribution */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Listings by Bathrooms</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={bathroomsDistributionData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="bathrooms" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="count" fill="#673AB7" name="Number of Listings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>


                  {/* Listing Price Distribution */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Listing Price Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={listingPriceDistribution}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="range" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="count" fill="#FF5722" name="Number of Listings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Locations by Listings */}
                  <div className={`rounded-xl p-4 shadow-sm col-span-1 lg:col-span-2 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Top Locations by Listings</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={topLocationsData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis type="number" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis type="category" dataKey="location" width={100} stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="count" fill="#2196F3" name="Number of Listings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Section: User & Inquiry Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Role Distribution (New Pie Chart) */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>User Role Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={userRoleDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="role"
                          label={renderCustomizedLabel}
                        >
                          {userRoleDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* User Registration Trends */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>User Registration Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={userRegistrationData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="date" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="New Users" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Inquiry Trends */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Inquiry Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={inquiryTrendsData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="date" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Line type="monotone" dataKey="count" stroke="#ffc658" activeDot={{ r: 8 }} name="New Inquiries" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Section: Agent Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Agent Performance - Deals Closed by Agent */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Deals Closed by Agent</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={agentPerformanceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="full_name" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="deals_closed" fill="#8884d8" name="Deals Closed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Agent Performance - Revenue by Agent */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Revenue by Agent</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={agentPerformanceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="full_name" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis formatter={(value) => `₦${value.toLocaleString()}`} stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Agent Performance - Average Rating by Agent */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Average Rating by Agent</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={agentPerformanceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="full_name" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis domain={[0, 5]} stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="avg_rating" fill="#ffc658" name="Average Rating" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Agent Performance - Properties Assigned by Agent */}
                  <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Properties Assigned by Agent</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={agentPerformanceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />
                        <XAxis dataKey="full_name" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                        <Bar dataKey="properties_assigned" fill="#AF19FF" name="Properties Assigned" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              {/* Export Data Section (Optional) */}
              <div className="mt-8 text-right">
                <button
                  onClick={() => console.log('Export functionality not yet implemented.')}
                  className="px-6 py-2 rounded-xl bg-green-400 text-white text-sm font-semibold hover:bg-green-500 transition-colors h-10"
                >
                  Export Analytics Data
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminAnalytics;

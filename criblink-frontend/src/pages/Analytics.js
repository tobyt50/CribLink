import React, { useEffect, useState, useRef } from 'react'; // Added useRef
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '../../components/admin/Sidebar';
import StatCard from '../../components/admin/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import { CalendarDays, BarChart3, TrendingUp, Users, Home, MessageSquare, BriefcaseBusiness, Star, Menu, X, ChevronDownIcon } from 'lucide-react'; // Added ChevronDownIcon
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook

import API_BASE_URL from '../../config'; // Assuming you have a config file for your API base URL

// Reusable Dropdown Component (embedded directly in Analytics.js)
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
                className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:ring focus:ring-green-100 transition-all duration-200 h-10
                  ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500" : "bg-white border-gray-300 text-gray-500 hover:border-green-500"}`}
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
  // State for sidebar collapse/expand, consistent with other admin pages
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for active section in the sidebar, consistent with other admin pages
  const [activeSection, setActiveSection] = useState('analytics'); // Set default active section for Analytics page
  const { darkMode } = useTheme(); // Use the dark mode context

  // State for date range filter
  const [dateRange, setDateRange] = useState('last30days'); // e.g., 'last7days', 'last30days', 'last90days', 'ytd', 'custom'

  // State for analytics data
  const [listingStatusData, setListingStatusData] = useState([]);
  const [listingsOverTimeData, setListingsOverTimeData] = useState([]);
  const [userRegistrationData, setUserRegistrationData] = useState([]);
  const [inquiryTrendsData, setInquiryTrendsData] = useState([]);
  const [propertyTypeData, setPropertyTypeData] = useState([]);
  const [listingPriceDistribution, setListingPriceDistribution] = useState([]);
  const [topLocationsData, setTopLocationsData] = useState([]);
  const [agentPerformanceData, setAgentPerformanceData] = useState([]);

  // Overview Stats
  const [totalListings, setTotalListings] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [revenueSoldListings, setRevenueSoldListings] = useState(0);
  const [totalDealsClosed, setTotalDealsClosed] = useState(0);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // State for mobile view and sidebar open/close, consistent with Inquiries.js
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Effect to handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Open on desktop, closed on mobile
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Function to fetch analytics data based on date range
  const fetchAnalyticsData = async () => {
    try {
      // Fetch overview stats using existing adminStatsController endpoints where applicable
      const [
        listingsCountRes,
        inquiriesCountRes,
        totalUsersRes, // This will be a new endpoint to get total users
        revenueSoldListingsRes, // This will be a new endpoint
        totalDealsClosedRes, // This will be a new endpoint
        listingStatusRes,
        listingsOverTimeRes,
        userRegistrationRes,
        inquiryTrendsRes,
        propertyTypeRes,
        listingPriceRes,
        topLocationsRes,
        agentPerformanceRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/stats/listings-count`, { headers }), // Existing
        axios.get(`${API_BASE_URL}/admin/stats/inquiries-count`, { headers }), // Existing
        axios.get(`${API_BASE_URL}/admin/analytics/total-users-count`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/revenue-sold-listings?range=${dateRange}`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/total-deals-closed?range=${dateRange}`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/listing-status?range=${dateRange}`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/listings-over-time?range=${dateRange}`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/user-registrations?range=${dateRange}`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/inquiry-trends?range=${dateRange}`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/property-types?range=${dateRange}`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/listing-price-distribution?range=${dateRange}`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/top-locations?range=${dateRange}`, { headers }), // New analytics endpoint
        axios.get(`${API_BASE_URL}/admin/analytics/agent-performance?range=${dateRange}`, { headers }), // New analytics endpoint
      ]);

      setTotalListings(listingsCountRes.data.count || 0);
      setTotalInquiries(inquiriesCountRes.data.count || 0);
      setTotalUsers(totalUsersRes.data.count || 0);
      setRevenueSoldListings(revenueSoldListingsRes.data.total_revenue || 0);
      setTotalDealsClosed(totalDealsClosedRes.data.total_deals || 0);

      setListingStatusData(listingStatusRes.data || []);
      setListingsOverTimeData(listingsOverTimeRes.data || []);
      setUserRegistrationData(userRegistrationRes.data || []);
      setInquiryTrendsData(inquiryTrendsRes.data || []);
      setPropertyTypeData(propertyTypeRes.data || []);
      setListingPriceDistribution(listingPriceRes.data || []);
      setTopLocationsData(topLocationsRes.data || []);
      setAgentPerformanceData(agentPerformanceRes.data || []);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Set to 0 or empty arrays on error to prevent crashing
      setTotalListings(0);
      setTotalUsers(0);
      setTotalInquiries(0);
      setRevenueSoldListings(0);
      setTotalDealsClosed(0);
      setListingStatusData([]);
      setListingsOverTimeData([]);
      setUserRegistrationData([]);
      setInquiryTrendsData([]);
      setPropertyTypeData([]);
      setListingPriceDistribution([]);
      setTopLocationsData([]);
      setAgentPerformanceData([]);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]); // Refetch data when date range changes

  // Data for Pie Chart (Listing Status)
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF']; // Example colors for pie chart segments

  // Adjust contentShift based on isCollapsed state, consistent with other admin pages
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256; // Adjusted for mobile

  // Options for date range dropdown
  const dateRangeOptions = [
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "last90days", label: "Last 90 Days" },
    { value: "ytd", label: "Year to Date" },
    { value: "custom", label: "Custom Range (Not implemented)" },
  ];

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle - consistent with Inquiries.js */}
      {isMobile && (
        <motion.button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className={`fixed top-20 left-4 z-50 p-2 rounded-full shadow-md ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white"}`}
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
        collapsed={isMobile ? false : isCollapsed} // Sidebar is never collapsed in mobile view
        setCollapsed={isMobile ? () => {} : setIsCollapsed} // Disable setCollapsed on mobile
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile} // Pass isMobile prop
        isSidebarOpen={isSidebarOpen} // Pass isSidebarOpen prop
        setIsSidebarOpen={setIsSidebarOpen} // Pass setIsSidebarOpen prop
      />

      {/* Main content area with motion animation */}
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'} // Key for re-animation on mobile/desktop switch
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 p-4 md:p-6 overflow-auto min-w-0" // Added overflow-auto and min-w-0
        style={{ willChange: 'margin-left', minWidth: `calc(100% - ${contentShift}px)` }} // Added minWidth
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
          className={`rounded-3xl p-6 shadow space-y-6 max-w-full ${darkMode ? "bg-gray-800" : "bg-white"}`} // Apply dark mode bg
        >
          {/* Date Range Filter */}
          <div className="flex flex-col md:flex-row items-center justify-end gap-4 mb-6"> {/* Adjusted for mobile layout */}
            <label htmlFor="dateRange" className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Date Range:</label>
            <Dropdown
              placeholder="Date Range"
              options={dateRangeOptions}
              value={dateRange}
              onChange={setDateRange}
              className="w-full md:w-auto" // Adjusted width for dropdown
            />
          </div>

          {/* Overview Statistics */}
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Overview Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              label="Total Listings"
              value={totalListings.toLocaleString()}
              icon={<Home size={24} className="text-green-500 dark:text-green-400" />}
            />
            <StatCard
              label="Total Users"
              value={totalUsers.toLocaleString()}
              icon={<Users size={24} className="text-blue-500 dark:text-blue-400" />}
            />
            <StatCard
              label="Total Inquiries"
              value={totalInquiries.toLocaleString()}
              icon={<MessageSquare size={24} className="text-purple-500 dark:text-purple-400" />}
            />
            <StatCard
              label="Revenue (Sold Listings)"
              value={`₦${revenueSoldListings.toLocaleString()}`}
              icon={<TrendingUp size={24} className="text-orange-500 dark:text-orange-400" />}
            />
            <StatCard
              label="Total Deals Closed"
              value={totalDealsClosed.toLocaleString()}
              icon={<BriefcaseBusiness size={24} className="text-teal-500 dark:text-teal-400" />}
            />
          </div>

          {/* Charts Section */}
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Detailed Analytics</h2>

          <div className="space-y-8"> {/* Added space-y-8 for vertical spacing between chart groups */}
            {/* Section: Listings & Property Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Listing Status Distribution */}
              <div className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Listing Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={listingStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {listingStatusData.map((entry, index) => (
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

              {/* Listing Price Distribution (Example - could be a histogram) */}
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
                    <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} contentStyle={{ backgroundColor: darkMode ? '#374151' : '#fff', border: `1px solid ${darkMode ? '#4B5563' : '#E5E7EB'}`, color: darkMode ? '#D1D5DB' : '#374151' }} />
                    <Legend wrapperStyle={{ color: darkMode ? '#D1D5DB' : '#374151' }} />
                    <Bar dataKey="count" fill="#FF5722" name="Number of Listings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Locations by Listings */}
              <div className={`rounded-xl p-4 shadow-sm col-span-1 lg:col-span-2 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}> {/* Make this span full width */}
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Top Locations by Listings</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={topLocationsData}
                    layout="vertical" // Vertical bars for better readability of long labels
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
                    <YAxis domain={[0, 5]} stroke={darkMode ? "#D1D5DB" : "#374151"} /> {/* Assuming rating is out of 5 */}
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

          </div> {/* End of Charts Grouping Container */}

          {/* Export Data Section (Optional) */}
          <div className="mt-8 text-right">
            <button
              onClick={() => console.log('Export functionality not yet implemented.')} // Changed alert to console.log
              className="px-6 py-2 rounded-xl bg-green-400 text-white text-sm font-semibold hover:bg-green-500 transition-colors h-10" // Added h-10
            >
              Export Analytics Data
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminAnalytics;

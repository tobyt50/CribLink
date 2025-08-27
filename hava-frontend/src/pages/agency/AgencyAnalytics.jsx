import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Users,
  Home,
  MessageSquare,
  BriefcaseBusiness,
  AlertCircle,
  Menu,
  X,
  ChevronDownIcon,
  Lock,
  Download,
  ArrowLeft,
} from "lucide-react";

import AgencyAdminSidebar from "../../components/agency/Sidebar"; // Using agency-specific sidebar
import { useTheme } from "../../layouts/AppShell";
import Card from "../../components/ui/Card";
import { useMessage } from "../../context/MessageContext";
import { useSidebarState } from "../../hooks/useSidebarState";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";
import { SUBSCRIPTION_TIERS } from "../../config/subscriptionConfig"; // For frontend tier info

// Dropdown component remains the same for UI consistency
const Dropdown = ({
  options,
  value,
  onChange,
  placeholder,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
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
      transition: { type: "spring", stiffness: 500, damping: 30 },
    },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } },
  };
  const selectedOptionLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
      >
        <span className="overflow-hidden truncate">{selectedOptionLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon
            className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`}
          />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 w-full ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ x: 5 }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200 ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
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

// A dedicated locked view for Basic tier users
const AnalyticsLockedView = () => {
  const { darkMode } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
      <Lock
        size={48}
        className={`mb-4 ${darkMode ? "text-yellow-400" : "text-yellow-500"}`}
      />
      <h2
        className={`text-2xl font-bold mb-2 ${darkMode ? "text-gray-100" : "text-gray-800"}`}
      >
        Advanced Analytics Locked
      </h2>
      <p
        className={`max-w-md mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
      >
        Access detailed performance insights, revenue tracking, and exportable
        reports by upgrading your plan.
      </p>
      <Link
        to="/subscriptions"
        className={`inline-block py-2 px-6 rounded-full font-semibold transition-transform duration-200 hover:scale-105 ${darkMode ? "bg-green-600 text-white hover:bg-green-500" : "bg-green-600 text-white hover:bg-green-700"}`}
      >
        View Subscription Plans
      </Link>
    </div>
  );
};

const AgencyAnalytics = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const fromAuthPage =
      location.key === "default" || // direct load (no history)
      location.state?.fromAuth ||
      ["/signin", "/signup"].includes(document.referrer.split("/").pop());

    if (fromAuthPage) {
      // if last page was sign in/up, go to home or dashboard instead
      navigate("/");
    } else {
      navigate(-1);
    }
  };
  const {
    isMobile,
    isSidebarOpen,
    setIsSidebarOpen,
    isCollapsed,
    setIsCollapsed,
  } = useSidebarState();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user, loading: authLoading } = useAuth();

  const [dateRange, setDateRange] = useState("last30days");
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const tier = useMemo(() => user?.subscription_type || "basic", [user]);

  // Subscription-based feature flags
  const canExportData = useMemo(() => tier === "enterprise", [tier]);
  const dateRangeOptions = useMemo(() => {
    const options = [
      { value: "last7days", label: "Last 7 Days" },
      { value: "last30days", label: "Last 30 Days" },
      { value: "last90days", label: "Last 90 Days" },
    ];
    if (tier === "enterprise") {
      options.push({ value: "ytd", label: "Year to Date" });
    }
    return options;
  }, [tier]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!user?.agency_id) {
      setError("Could not identify your agency. Please log in again.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const agencyId = user.agency_id;
    const statsApiBase = `/api/agency-stats/${agencyId}`;

    try {
      // Fetch all data in parallel
      const [
        agentCountRes,
        clientCountRes,
        listingsCountRes,
        soldListingsCountRes, // Stat Cards
        listingStatusRes,
        agentPerformanceRes,
        listingsOverTimeRes,
        topLocationsRes, // Charts
      ] = await Promise.all([
        axiosInstance.get(`${statsApiBase}/agents/count`),
        axiosInstance.get(`${statsApiBase}/clients/count`),
        axiosInstance.get(`${statsApiBase}/listings/count`),
        axiosInstance.get(`${statsApiBase}/listings/sold/count`),
        // For charts (assuming these endpoints exist and filter by agency)
        axiosInstance.get(`/api/agencies/${agencyId}/listing-status`), // Requires a new endpoint
        axiosInstance.get(`/api/agencies/${agencyId}/performance`, {
          params: { dateRange },
        }), // Requires a new endpoint
        axiosInstance.get(`/api/agencies/${agencyId}/listings-over-time`, {
          params: { dateRange },
        }), // Requires a new endpoint
        axiosInstance.get(`/api/agencies/${agencyId}/top-locations`, {
          params: { dateRange },
        }), // Requires a new endpoint
      ]);

      setStats({
        agents: agentCountRes.data.count,
        clients: clientCountRes.data.count,
        listings: listingsCountRes.data.count,
        dealsClosed: soldListingsCountRes.data.count,
        // Revenue would be another endpoint summing agent performance revenue
        revenue: agentPerformanceRes.data.performance.reduce(
          (acc, agent) => acc + (agent.revenue || 0),
          0,
        ),
      });

      setCharts({
        listingStatus: listingStatusRes.data,
        agentPerformance: agentPerformanceRes.data.performance,
        listingsOverTime: listingsOverTimeRes.data,
        topLocations: topLocationsRes.data,
      });
    } catch (err) {
      console.error("Error fetching agency analytics:", err);
      setError(err.response?.data?.message || "Failed to load analytics data.");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, user?.agency_id]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAnalyticsData();
    }
  }, [fetchAnalyticsData, authLoading, user]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#82ca9d",
  ];
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-4 md:px-0 min-h-screen flex flex-col`}
    >
      <button
        onClick={handleBack}
        aria-label="Go back"
        className={`absolute left-4 mt-5 p-2 rounded-lg shadow-sm transition hover:scale-105
    ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}
      >
        <ArrowLeft size={20} />
      </button>

      <AgencyAdminSidebar
        collapsed={isMobile ? false : isCollapsed}
        setCollapsed={isMobile ? () => {} : setIsCollapsed}
        activeSection="analytics"
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <motion.div
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 p-4 md:p-6 overflow-auto"
        style={{ willChange: "margin-left" }}
      >
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1
            className={`text-2xl font-extrabold ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Agency Analytics
          </h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1
            className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Agency Analytics
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isMobile ? "" : "rounded-3xl p-6 shadow"} space-y-6 ${isMobile ? "" : darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          {tier === "basic" ? (
            <AnalyticsLockedView />
          ) : isLoading ? (
            <div>Loading analytics...</div> // Replace with a proper skeleton if desired
          ) : error ? (
            <div
              className={`flex items-center justify-center p-4 rounded-xl ${darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-700"}`}
            >
              <AlertCircle className="mr-2" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row items-center justify-end gap-4">
                <label
                  className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Date Range:
                </label>
                <Dropdown
                  placeholder="Date Range"
                  options={dateRangeOptions}
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-full md:w-48"
                />
              </div>

              <h2
                className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}
              >
                Agency Overview
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                <Card>
                  <div className="flex items-center">
                    <Home size={24} className="text-green-500 mr-3" />
                    <div className="text-left">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Listings
                      </p>
                      <p className="text-xl font-semibold">
                        {stats.listings?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center">
                    <Users size={24} className="text-blue-500 mr-3" />
                    <div className="text-left">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Agents
                      </p>
                      <p className="text-xl font-semibold">
                        {stats.agents?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center">
                    <MessageSquare size={24} className="text-purple-500 mr-3" />
                    <div className="text-left">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Clients
                      </p>
                      <p className="text-xl font-semibold">
                        {stats.clients?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center">
                    <BriefcaseBusiness
                      size={24}
                      className="text-teal-500 mr-3"
                    />
                    <div className="text-left">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Deals Closed
                      </p>
                      <p className="text-xl font-semibold">
                        {stats.dealsClosed?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center">
                    <TrendingUp size={24} className="text-orange-500 mr-3" />
                    <div className="text-left">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Revenue
                      </p>
                      <p className="text-xl font-semibold">
                        ₦{stats.revenue?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <h2
                className={`text-2xl font-bold pt-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
              >
                Performance Metrics
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Listing Status Distribution">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={charts.listingStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                      >
                        {charts.listingStatus?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="Listings Added Over Time">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={charts.listingsOverTime}>
                      <CartesianGrid />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#82ca9d"
                        name="New Listings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
                <Card
                  title="Top Locations by Listings"
                  className="lg:col-span-2"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart layout="vertical" data={charts.topLocations}>
                      <CartesianGrid />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="location" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#2196F3" name="Listings" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="Revenue by Agent">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={charts.agentPerformance}>
                      <CartesianGrid />
                      <XAxis dataKey="full_name" />
                      <YAxis
                        formatter={(val) => `₦${(val / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        formatter={(val) => `₦${val.toLocaleString()}`}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="Deals Closed by Agent">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={charts.agentPerformance}>
                      <CartesianGrid />
                      <XAxis dataKey="full_name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="deals_closed" fill="#8884d8" name="Deals" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <div className="mt-8 text-right">
                <div
                  title={
                    !canExportData
                      ? `Upgrade to the Enterprise plan to export analytics data.`
                      : ""
                  }
                >
                  <button
                    disabled={!canExportData}
                    onClick={() =>
                      !canExportData
                        ? showMessage(
                            "Export unavailable on your current plan.",
                            "info",
                          )
                        : showMessage(
                            "Export functionality coming soon.",
                            "info",
                          )
                    }
                    className={`px-6 py-2 rounded-xl text-sm font-semibold transition-colors h-10 flex items-center gap-2 ${canExportData ? "bg-green-600 text-white hover:bg-green-500" : "bg-gray-400 text-gray-100 cursor-not-allowed"}`}
                  >
                    {canExportData ? (
                      <Download size={16} />
                    ) : (
                      <Lock size={16} />
                    )}
                    Export Data
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AgencyAnalytics;

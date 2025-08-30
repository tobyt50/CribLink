import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  Home,
  ListChecks,
  MessageSquare,
  Settings,
  Shield,
  Star,
  TrendingUp,
  User,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import AgentSidebar from "../../components/agent/Sidebar";
import StatCard from "../../components/StatCard";
import Card from "../../components/ui/Card";
import { SUBSCRIPTION_TIERS } from "../../config/subscriptionConfig";
import { useAuth } from "../../context/AuthContext";
import { useMessage } from "../../context/MessageContext";
import { useSidebarState } from "../../hooks/useSidebarState";
import { useTheme } from "../../layouts/AppShell";

// --- UPDATED SKELETON TO MATCH NEW LAYOUT ---
const AgentDashboardSkeleton = ({ darkMode }) => (
  <div className={`animate-pulse space-y-6`}>
    {/* Top row skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <div
            className={`h-6 w-1/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
          <div
            className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          {[...Array(4)].map((_, j) => (
            <div
              key={j}
              className={`h-16 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
          ))}
        </div>
      </Card>
      <Card className="lg:col-span-1">
        <div
          className={`h-6 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        <div
          className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-2`}
        ></div>
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        <div
          className={`h-10 w-full rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </Card>
    </div>

    {/* Second row skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div
          className={`h-8 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        <div className="grid grid-cols-2 gap-4 w-full">
          {[...Array(2)].map((_, j) => (
            <div
              key={j}
              className={`h-16 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
          ))}
        </div>
      </Card>
      <Card>
        <div
          className={`h-8 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
        ></div>
        <div
          className={`h-32 w-full rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </Card>
    </div>

    {/* Activity Feed Skeleton */}
    <Card>
      <div
        className={`h-8 w-1/3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}
      ></div>
      <ul className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <li
            key={i}
            className={`h-5 w-full rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          ></li>
        ))}
      </ul>
    </Card>
  </div>
);

const AgentDashboard = () => {
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
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const {
    isCollapsed,
    setIsCollapsed,
    isMobile,
    setIsMobile,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useSidebarState();
  const { user, loading: authLoading } = useAuth(); // Use auth context

  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // --- RESTORED ORIGINAL STATE VARIABLES ---
  const [totalListings, setTotalListings] = useState("--");
  const [underOfferListings, setUnderOfferListings] = useState("--");
  const [soldListings, setSoldListings] = useState("--");
  const [pendingListings, setPendingListings] = useState("--");
  const [totalClientInquiries, setTotalClientInquiries] = useState("--");
  const [totalAgentResponses, setTotalAgentResponses] = useState("--");
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  // --- NEW STATE FOR SUBSCRIPTION-SPECIFIC STATS ---
  const [subscriptionStats, setSubscriptionStats] = useState({
    activeListings: "--",
    activeFeatured: "--",
  });

  const tier = user?.subscription_type || "basic";
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  // Navigation functions remain unchanged
  const goToListings = () => navigate("/agent/listings");
  const goToUnderOfferListings = () =>
    navigate("/agent/listings", { state: { statusFilter: "under offer" } });
  const goToSoldListings = () =>
    navigate("/agent/listings", { state: { statusFilter: "sold" } });
  const goToPendingListings = () =>
    navigate("/agent/listings", { state: { statusFilter: "pending" } });
  const goToClients = () => navigate("/agent/clients");
  const goToSettings = () => navigate("/agent/settings");
  const goToAddListing = () => navigate("/agent/add-listing");
  const goToInquiries = () => navigate("/agent/inquiries");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/signin");
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // --- RESTORED ORIGINAL PROMISE.ALL STRUCTURE & ADDED NEW STATS ENDPOINT ---
        const [
          listingsRes,
          inquiriesRes,
          responsesRes,
          activityRes,
          underOfferRes,
          soldRes,
          pendingRes,
          userListingStatsRes, // New endpoint for subscription stats
        ] = await Promise.all([
          axiosInstance.get(`/agent/dashboard/stats`),
          axiosInstance.get(`/inquiries/agent/count/all-inquiries`),
          axiosInstance.get(`/inquiries/agent/count/agent-responses`),
          axiosInstance.get(`/agent/dashboard/activity`),
          axiosInstance.get(`/agent/listings/under-offer/count`),
          axiosInstance.get(`/agent/listings/sold/count`),
          axiosInstance.get(`/agent/listings/pending/count`),
          axiosInstance.get(`/users/listing-stats`), // New call
        ]);

        // Set original state variables
        setTotalListings(listingsRes.data.totalListings);
        setTotalClientInquiries(inquiriesRes.data.count);
        setTotalAgentResponses(responsesRes.data.count);
        setUnderOfferListings(underOfferRes.data.count);
        setSoldListings(soldRes.data.count);
        setPendingListings(pendingRes.data.count);

        // Set new subscription state variables
        setSubscriptionStats({
          activeListings: userListingStatsRes.data.activeListings,
          activeFeatured: userListingStatsRes.data.activeFeatured,
        });

        // Activity processing remains the same
        const activityData = activityRes.data.activities.map((a) => {
          let IconComponent = User,
            tag = "User",
            color = "gray";
          const msg = a.message?.toLowerCase() || "";
          if (msg.includes("inquiry")) {
            IconComponent = MessageSquare;
            tag = "Inquiry";
            color = "blue";
          } else if (msg.includes("listing") || msg.includes("property")) {
            IconComponent = Home;
            tag = "Listing";
            color = "green";
          }
          return {
            icon: <IconComponent size={16} />,
            tag,
            color,
            message: a.message,
            formattedTime: formatDistanceToNow(new Date(a.timestamp), {
              addSuffix: true,
            }),
          };
        });
        setActivities(activityData);
      } catch (err) {
        console.error("Error fetching agent dashboard data:", err);
        if (err.response?.status === 401) navigate("/signin");
        showMessage(
          "Failed to load dashboard data. Please try again.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authLoading, navigate, showMessage]);

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;
  const visibleActivities = showAllActivities
    ? activities.slice(0, 10)
    : activities.slice(0, 5);

  const getStarColor = (subscription) => {
    if (subscription === "pro") return "text-purple-500";
    if (subscription === "enterprise") return "text-yellow-500";
    return "text-gray-500";
  };

  return (
    <div
      className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-0 md:px-0 min-h-screen flex flex-col`}
    >
      <button
        onClick={handleBack}
        aria-label="Go back"
        className={`absolute left-4 mt-5 p-2 rounded-lg shadow-sm transition hover:scale-105
    ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}
      >
        <ArrowLeft size={20} />
      </button>
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
        key={isMobile ? "mobile" : "desktop"}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1
            className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Dashboard
          </h1>
        </div>
        <div className="hidden md:block mb-6">
          <h1
            className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Dashboard
          </h1>
        </div>
        {loading || authLoading ? (
          <AgentDashboardSkeleton darkMode={darkMode} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}
                  >
                    Listings Overview
                  </h3>
                  <Home
                    size={24}
                    className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                  <StatCard
                    label="Total"
                    value={totalListings}
                    onClick={goToListings}
                    textCentered={true}
                    icon={<ListChecks size={20} />}
                  />
                  <StatCard
                    label="Under Offer"
                    value={underOfferListings}
                    onClick={goToUnderOfferListings}
                    textCentered={true}
                    icon={<Clock size={20} />}
                  />
                  <StatCard
                    label="Sold"
                    value={soldListings}
                    onClick={goToSoldListings}
                    textCentered={true}
                    icon={<CheckCircle size={20} />}
                  />
                  <StatCard
                    label="Pending"
                    value={pendingListings}
                    onClick={goToPendingListings}
                    textCentered={true}
                    icon={<CheckCircle size={20} />}
                  />
                </div>
              </Card>
              <Card className="lg:col-span-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}
                  >
                    Your Plan
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-full ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}
                  >
                    <Star className={`h-4 w-4 mr-2 ${getStarColor(tier)}`} />{" "}
                    {tierConfig.name}
                  </span>
                </div>
                <div className="space-y-3 flex-grow">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span
                        className={darkMode ? "text-gray-300" : "text-gray-600"}
                      >
                        Active Listings
                      </span>
                      <span>
                        {subscriptionStats.activeListings} /{" "}
                        {tierConfig.maxListings === Infinity
                          ? "∞"
                          : tierConfig.maxListings}
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-full h-2.5 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                    >
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{
                          width: `${Math.min((subscriptionStats.activeListings / tierConfig.maxListings) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span
                        className={darkMode ? "text-gray-300" : "text-gray-600"}
                      >
                        Featured Listings
                      </span>
                      <span>
                        {subscriptionStats.activeFeatured} /{" "}
                        {tierConfig.maxFeatured}
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-full h-2.5 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
                    >
                      <div
                        className="bg-purple-500 h-2.5 rounded-full"
                        style={{
                          width: `${Math.min((subscriptionStats.activeFeatured / tierConfig.maxFeatured) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                {tier !== "enterprise" ? (
                  <Link
                    to="/subscriptions"
                    className={`mt-4 w-full text-center py-2 px-4 rounded-lg font-semibold transition-transform duration-200 hover:scale-105 ${darkMode ? "bg-green-600 text-white hover:bg-green-500" : "bg-green-600 text-white hover:bg-green-700"}`}
                  >
                    Upgrade Plan
                  </Link>
                ) : (
                  <Link
                    to="/subscriptions"
                    className={`mt-4 w-full text-center py-2 px-4 rounded-lg font-semibold transition-transform duration-200 hover:scale-105 ${darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                  >
                    Manage Plan
                  </Link>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card onClick={goToInquiries} className="cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}
                  >
                    Inquiry Metrics
                  </h3>
                  <MessageSquare
                    size={24}
                    className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <StatCard
                    label="Inquiries"
                    value={totalClientInquiries}
                    textCentered={true}
                  />
                  <StatCard
                    label="Responses"
                    value={totalAgentResponses}
                    textCentered={true}
                  />
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className={`text-xl font-semibold ${darkMode ? "text-green-400" : "text-green-700"}`}
                  >
                    Analytics
                  </h2>
                  <BarChart2
                    size={24}
                    className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  />
                </div>
                {tier === "basic" && (
                  <div className="text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Shield size={32} className="mx-auto text-gray-400 mb-2" />
                    <h4 className="font-semibold text-lg">Basic Analytics</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      You have access to basic listing view counts.
                    </p>
                    <Link
                      to="/subscriptions"
                      className="font-bold text-green-600 dark:text-green-400 hover:underline"
                    >
                      Upgrade to Pro for More Insights
                    </Link>
                  </div>
                )}
                {tier === "pro" && (
                  <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
                    <TrendingUp
                      size={32}
                      className="mx-auto text-purple-500 mb-2"
                    />
                    <h4 className="font-semibold text-lg text-purple-800 dark:text-purple-300">
                      Moderate Analytics
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Track views, inquiries, and click-through rates.
                    </p>
                    <Link
                      to="/agent/analytics"
                      className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      View Your Analytics
                    </Link>
                  </div>
                )}
                {tier === "enterprise" && (
                  <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700">
                    <Briefcase
                      size={32}
                      className="mx-auto text-yellow-500 mb-2"
                    />
                    <h4 className="font-semibold text-lg text-yellow-800 dark:text-yellow-300">
                      Advanced Analytics
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Access heatmaps, interest tracking, and exportable
                      reports.
                    </p>
                    <Link
                      to="/agent/analytics"
                      className="font-bold text-yellow-600 dark:text-yellow-400 hover:underline"
                    >
                      Access Advanced Reports
                    </Link>
                  </div>
                )}
              </Card>
            </div>

            <Card>
              <h2
                className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
              >
                Recent Activity
              </h2>
              <ul
                className={`space-y-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {visibleActivities.length > 0 ? (
                  visibleActivities.map((activity, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className={`text-${activity.color}-500 flex-shrink-0`}
                        >
                          {activity.icon}
                        </span>
                        <span className="truncate">{activity.message}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full bg-${activity.color}-100 text-${activity.color}-600 flex-shrink-0`}
                        >
                          {activity.tag}
                        </span>
                      </div>
                      <span
                        className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"} flex-shrink-0 ml-2`}
                      >
                        {activity.formattedTime}
                      </span>
                    </li>
                  ))
                ) : (
                  <p
                    className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    No recent activity to display.
                  </p>
                )}
              </ul>
              {activities.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllActivities((prev) => !prev)}
                    className={`text-sm hover:underline ${darkMode ? "text-green-400" : "text-green-600"}`}
                  >
                    {showAllActivities ? "Show Less" : "Show More"}
                  </button>
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h2
                  className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
                >
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={goToAddListing}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200 ${darkMode ? "bg-green-700 hover:bg-green-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                  >
                    <Home size={20} /> Add New Listing
                  </button>
                  <button
                    onClick={goToClients}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200 ${darkMode ? "bg-blue-700 hover:bg-blue-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                  >
                    <Users size={20} /> Manage Clients
                  </button>
                  <button
                    onClick={goToSettings}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200 ${darkMode ? "bg-purple-700 hover:bg-purple-600 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                  >
                    <Settings size={20} /> Settings
                  </button>
                  <button
                    onClick={() =>
                      showMessage(
                        "Reporting feature under development!",
                        "info",
                      )
                    }
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200 ${darkMode ? "bg-yellow-700 hover:bg-yellow-600 text-white" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
                  >
                    <BarChart2 size={20} /> Generate Report
                  </button>
                </div>
              </Card>
              <Card>
                <h2
                  className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
                >
                  Financial Snapshot
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard
                    label="Commission (YTD)"
                    value="$X,XXX"
                    icon={<DollarSign size={20} />}
                  />
                  <StatCard
                    label="Pending"
                    value="$X,XXX"
                    icon={<DollarSign size={20} />}
                  />
                  <StatCard
                    label="Marketing Spend"
                    value="$X,XXX"
                    icon={<DollarSign size={20} />}
                  />
                </div>
                <p
                  className={`mt-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  *Financial data is illustrative. Integration coming soon.
                </p>
              </Card>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AgentDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import AgentSidebar from '../../components/agent/Sidebar';
import API_BASE_URL from '../../config';
import { User, Home, MessageSquare, Menu, X, Briefcase, DollarSign, BarChart2, Users, Settings, UserCog, ListChecks, UserPlus, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useMessage } from '../../context/MessageContext';

// Skeleton component for the Agent Dashboard
const AgentDashboardSkeleton = ({ darkMode }) => (
  <div className={`animate-pulse space-y-6`}>
    {/* Stat Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
      {/* Listings Overview Skeleton Card */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className={`h-6 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
          <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full">
          {[...Array(3)].map((_, j) => (
            <div key={j} className={`h-16 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
          ))}
        </div>
      </Card>

      {/* Inquiry Metrics Skeleton Card */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className={`h-6 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
          <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full">
          {[...Array(2)].map((_, j) => (
            <div key={j} className={`h-16 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
          ))}
        </div>
      </Card>
    </div>

    {/* Recent Activity Feed Skeleton */}
    <Card>
      <div className={`h-8 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div>
      <ul className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <li key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden w-full">
              <div className={`h-4 w-4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
              <div className={`h-4 w-1/4 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
            </div>
            <div className={`h-4 w-1/5 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} ml-2`}></div>
          </li>
        ))}
      </ul>
      <div className={`mt-4 h-6 w-1/4 rounded mx-auto ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
    </Card>

    {/* Additional Sections/Features Suggestions Skeleton */}
    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <div className={`h-8 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div>
        <ul className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <li key={i} className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></li>
          ))}
        </ul>
        <div className={`mt-4 h-6 w-1/2 rounded mx-auto ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      </Card>
      <Card>
        <div className={`h-8 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-12 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
          ))}
        </div>
      </Card>
    </div>

    {/* Financial Overview Skeleton */}
    <div className="mt-10">
      <Card>
        <div className={`h-8 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
          ))}
        </div>
        <div className={`mt-4 h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      </Card>
    </div>
  </div>
);


const AgentDashboard = () => {
  const [agent, setAgent] = useState(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();

  const { isCollapsed, setIsCollapsed, isMobile, setIsMobile, isSidebarOpen, setIsSidebarOpen } = useSidebarState();

  const [activeSection, setActiveSection] = useState('dashboard');

  // Agent-specific stats
  const [totalListings, setTotalListings] = useState('--');
  const [underOfferListings, setUnderOfferListings] = useState('--');
  const [soldListings, setSoldListings] = useState('--');
  const [totalClientInquiries, setTotalClientInquiries] = useState('--');
  const [totalAgentResponses, setTotalAgentResponses] = useState('--');
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loading, setLoading] = useState(true); // New loading state

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Navigation functions for agent-specific routes
  const goToListings = () => navigate('/agent/listings');
  const goToUnderOfferListings = () => navigate('/agent/listings', { state: { statusFilter: 'under offer' } });
  const goToSoldListings = () => navigate('/agent/listings', { state: { statusFilter: 'sold' } });
  const goToClients = () => navigate('/agent/clients');
  const goToSettings = () => navigate('/agent/settings');
  const goToAddListing = () => navigate('/agent/add-listing');
  const goToInquiries = () => navigate('/agent/inquiries');


  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true); // Start loading
      try {
        const { data: profile } = await axios.get(`${API_BASE_URL}/users/profile`, { headers });
        setAgent(profile);

        // Fetch individual stats for the agent
        const [listingsRes, inquiriesRes, responsesRes, activityRes, underOfferRes, soldRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/agent/dashboard/stats`, { headers }),
          axios.get(`${API_BASE_URL}/inquiries/agent/count/all-inquiries`, { headers }),
          axios.get(`${API_BASE_URL}/inquiries/agent/count/agent-responses`, { headers }),
          axios.get(`${API_BASE_URL}/agent/dashboard/activity`, { headers }),
          axios.get(`${API_BASE_URL}/agent/listings/under-offer/count`, { headers }),
          axios.get(`${API_BASE_URL}/agent/listings/sold/count`, { headers }),
        ]);

        setTotalListings(listingsRes.data.totalListings);
        setTotalClientInquiries(inquiriesRes.data.count);
        setTotalAgentResponses(responsesRes.data.count);
        setUnderOfferListings(underOfferRes.data.count);
        setSoldListings(soldRes.data.count);

        const activityData = activityRes.data.activities.map((a) => {
          let IconComponent = User;
          let tag = 'User';
          let color = 'gray';

          const msg = a.message?.toLowerCase() || '';
          const type = a.type?.toLowerCase() || '';

          if (type === 'inquiry' || msg.includes('inquiry')) {
            IconComponent = MessageSquare;
            tag = 'Inquiry';
            color = 'blue';
          } else if (type === 'listing' || msg.includes('listing') || msg.includes('property')) {
            IconComponent = Home;
            tag = 'Listing';
            color = 'green';
          } else {
            IconComponent = User;
            tag = 'User';
            color = 'green';
          }

          return {
            icon: <IconComponent size={16} />,
            tag,
            color,
            message: a.message || 'Activity update',
            formattedTime: formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }),
          };
        });

        setActivities(activityData);
      } catch (err) {
        console.error('Error fetching agent dashboard data:', err);
        if (err.response?.status === 401) navigate('/signin');
        showMessage('Failed to load dashboard data. Please try again.', 'error');
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchDashboardData();
  }, [navigate, showMessage]);

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;
  const visibleActivities = showAllActivities ? activities.slice(0, 10) : activities.slice(0, 5);

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
        key={isMobile ? 'mobile' : 'desktop'}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Dashboard</h1>
        </div>

        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Dashboard</h1>
        </div>

        {loading ? (
            <AgentDashboardSkeleton darkMode={darkMode} />
        ) : (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
                {/* NEW: Listings Overview Card for Agent */}
                <Card>
                <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Listings Overview</h3>
                    <Home size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                </div>
                <div className="grid grid-cols-3 gap-4 w-full">
                    <StatCard label="Total" value={totalListings} onClick={goToListings} textCentered={true} icon={<Home size={20} />} />
                    <StatCard label="Under Offer" value={underOfferListings} onClick={goToUnderOfferListings} textCentered={true} icon={<Clock size={20} />} />
                    <StatCard label="Sold" value={soldListings} onClick={goToSoldListings} textCentered={true} icon={<CheckCircle size={20} />} />
                </div>
                </Card>

                {/* Inquiry and Response Stats - Combined Card */}
                <Card onClick={goToInquiries} className="cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Inquiry Metrics</h3>
                    <MessageSquare size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                    <StatCard label="Inquiries" value={totalClientInquiries} textCentered={true} />
                    <StatCard label="Responses" value={totalAgentResponses} textCentered={true} />
                </div>
                </Card>
            </div>

            {/* Recent Activity Feed */}
            <Card>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Recent Activity</h2>
                <ul className={`space-y-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {visibleActivities.length > 0 ? (
                    visibleActivities.map((activity, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`text-${activity.color}-500 flex-shrink-0`}>{activity.icon}</span>
                        <span className="truncate">{activity.message}</span>
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full bg-${activity.color}-100 text-${activity.color}-600 flex-shrink-0`}
                        >
                            {activity.tag}
                        </span>
                        </div>
                        <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"} flex-shrink-0 ml-2`}>{activity.formattedTime}</span>
                    </li>
                    ))
                ) : (
                    <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>No recent activity to display.</p>
                )}
                </ul>
                {activities.length > 5 && (
                <div className="mt-4 text-center">
                    <button
                    onClick={() => setShowAllActivities(prev => !prev)}
                    className={`text-sm hover:underline ${darkMode ? "text-green-400" : "text-green-600"}`}
                    >
                    {showAllActivities ? 'Show Less' : 'Show More'}
                    </button>
                </div>
                )}
            </Card>

            {/* Additional Sections/Features Suggestions */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Performance Overview</h2>
                <ul className={`space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <li className="truncate"><strong>Listing Performance:</strong> Track views, inquiries, and conversion rates for your listings.</li>
                    <li className="truncate"><strong>Inquiry Response Rate:</strong> Monitor how quickly you respond to client inquiries.</li>
                    <li className="truncate"><strong>Client Satisfaction:</strong> Gather feedback from your clients (requires client feedback system).</li>
                </ul>
                <div className="mt-4 text-center">
                    <button
                    onClick={() => showMessage('Detailed reports coming soon!', 'info')}
                    className={`text-sm hover:underline ${darkMode ? "text-green-400" : "text-green-600"}`}
                    >
                    View Detailed Reports
                    </button>
                </div>
                </Card>

                <Card>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                    onClick={goToAddListing}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                        ${darkMode ? "bg-green-700 hover:bg-green-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                    >
                    <Home size={20} /> Add New Listing
                    </button>
                    <button
                    onClick={goToClients}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                        ${darkMode ? "bg-blue-700 hover:bg-blue-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                    >
                    <Users size={20} /> Manage Clients
                    </button>
                    <button
                    onClick={goToSettings}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                        ${darkMode ? "bg-purple-700 hover:bg-purple-600 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                    >
                    <Settings size={20} /> Settings
                    </button>
                    <button
                    onClick={() => showMessage('Reporting feature under development!', 'info')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                        ${darkMode ? "bg-yellow-700 hover:bg-yellow-600 text-white" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
                    >
                    <BarChart2 size={20} /> Generate Report
                    </button>
                </div>
                </Card>
            </div>

            {/* Financial Overview (Placeholder) - Agent specific, if applicable */}
            <div className="mt-10">
                <Card>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Financial Snapshot</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard label="Commission Earned (YTD)" value="$X,XXX" icon={<DollarSign size={20} />} />
                    <StatCard label="Pending Commission" value="$X,XXX" icon={<DollarSign size={20} />} />
                    <StatCard label="Marketing Spend" value="$X,XXX" icon={<DollarSign size={20} />} />
                </div>
                <p className={`mt-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    *Financial data is illustrative. Full integration with accounting systems coming soon.
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

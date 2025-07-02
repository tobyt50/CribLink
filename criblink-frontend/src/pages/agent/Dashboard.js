import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import AgentSidebar from '../../components/agent/Sidebar';
import API_BASE_URL from '../../config';
import { User, Home, MessageSquare, Menu, X } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook
import Card from '../../components/ui/Card'; // Import the Card component
import StatCard from '../../components/StatCard'; // Import Agent StatCard
import { useSidebarState } from '../../hooks/useSidebarState'; // Import useSidebarState hook

const AgentDashboard = () => {
  const [agent, setAgent] = useState(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context

  // Use the useSidebarState hook to manage sidebar state centrally
  const { isCollapsed, setIsCollapsed, isMobile, setIsMobile, isSidebarOpen, setIsSidebarOpen } = useSidebarState();

  // State for active section in the sidebar, consistent with AdminSidebar usage
  const [activeSection, setActiveSection] = useState('dashboard'); // Default active section for Agent Dashboard

  const [totalListings, setTotalListings] = useState('--'); // Separate state for total listings
  const [totalClientInquiries, setTotalClientInquiries] = useState('--'); // New state for client inquiries
  const [totalAgentResponses, setTotalAgentResponses] = useState('--');   // New state for agent responses
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Removed the local useEffect for window resize, as useSidebarState already handles this.
  // This removes the "setIsMobile is not a function" error.

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: profile } = await axios.get(`${API_BASE_URL}/users/profile`, { headers });
        setAgent(profile);

        // Fetch individual stats
        const [listingsRes, clientInquiriesRes, agentResponsesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/agent/dashboard/stats`, { headers }), // Assuming totalListings is from here
          axios.get(`${API_BASE_URL}/inquiries/agent/count/all-inquiries`, { headers }), // New API call
          axios.get(`${API_BASE_URL}/inquiries/agent/count/agent-responses`, { headers }),   // New API call
        ]);

        setTotalListings(listingsRes.data.totalListings);
        setTotalClientInquiries(clientInquiriesRes.data.count);
        setTotalAgentResponses(agentResponsesRes.data.count);

        // Fetch activity separately
        const activityRes = await axios.get(`${API_BASE_URL}/agent/dashboard/activity`, { headers });
        const activityData = activityRes.data.activities.map((a) => {
          let IconComponent = User; // Default: User icon component
          let tag = 'User'; // Default label: User
          let color = 'gray'; // Default color - will be overridden

          const msg = a.message?.toLowerCase() || '';
          const type = a.type?.toLowerCase() || '';

          if (type === 'inquiry' || msg.includes('inquiry')) {
            IconComponent = MessageSquare; // MessageSquare icon for Inquiries
            tag = 'Inquiry';
            color = 'blue'; // Blue for Inquiries
          } else if (type === 'listing' || msg.includes('listing') || msg.includes('property')) {
            IconComponent = Home; // Home icon for Listings
            tag = 'Listing';
            color = 'green'; // Green for Listings
          } else {
            // For all other types, assume User-related activity (including agent's own actions)
            IconComponent = User; // User icon for User
            tag = 'User';
            color = 'green'; // Changed to green to match listing styling
          }

          return {
            icon: <IconComponent size={16} />, // Render the icon component
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
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Define the main stats separately for clearer rendering logic
  const mainStats = [
    { label: 'Total Listings', value: totalListings, onClick: () => navigate('/agent/listings') },
    // You can add other primary stats here if needed, before the combined inquiry card
  ];

  // Adjust contentShift based on isCollapsed and isMobile states, consistent with other pages
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;
  const visibleActivities = showAllActivities ? activities.slice(0, 10) : activities.slice(0, 5);

  if (!agent) return <p className={`text-center mt-10 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Loading your dashboard...</p>;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0 min-h-screen flex flex-col`}>
      {/* Mobile Sidebar Toggle Button - consistent with other pages */}
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

      {/* AgentSidebar now receives collapsed, setCollapsed, activeSection, setActiveSection, isMobile, isSidebarOpen, setIsSidebarOpen */}
      <AgentSidebar
        collapsed={isMobile ? false : isCollapsed} // Sidebar is never collapsed in mobile view
        setCollapsed={isMobile ? () => {} : setIsCollapsed} // Disable setCollapsed on mobile
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile} // Pass isMobile prop
        isSidebarOpen={isSidebarOpen} // Pass isSidebarOpen prop
        setIsSidebarOpen={setIsSidebarOpen} // Pass setIsSidebarOpen prop
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
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Dashboard</h1>
        </div>

        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Dashboard</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Stats Cards - Adjusted grid layout for desktop responsiveness */}
          {/* Changed lg:grid-cols-4 to lg:grid-cols-2 to make each of the two primary cards equal width */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
            {/* Main stats */}
            {mainStats.map((stat, idx) => (
              <Card key={idx} onClick={stat.onClick} className="cursor-pointer col-span-1"> {/* Each spans 1 column */}
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-green-300" : "text-green-600"}`}>{stat.label}</h3>
                <p className={`text-4xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{stat.value}</p>
              </Card>
            ))}

            {/* Combined Inquiry Stats Card */}
            {/* Now spans 1 column to match the other main cards, creating a 2-column layout */}
            <Card
              onClick={() => navigate('/agent/inquiries')} // Added onClick for navigation
              className="cursor-pointer col-span-1" // Ensure it's clickable and spans one column
            >
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-green-300" : "text-green-600"}`}>Inquiry Stats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <StatCard label="Total Inquiries" value={totalClientInquiries} />
                <StatCard label="Total Responses" value={totalAgentResponses} />
              </div>
            </Card>
          </div>
          {/* Recent Activity */}
          <Card>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Recent Activity</h2>
            <ul className={`space-y-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {visibleActivities.map((activity, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-${activity.color}-500`}>{activity.icon}</span>
                    <span>{activity.message}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full bg-${activity.color}-100 text-${activity.color}-600`}
                    >
                      {activity.tag}
                    </span>
                  </div>
                  <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{activity.formattedTime}</span>
                </li>
              ))}
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
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AgentDashboard;

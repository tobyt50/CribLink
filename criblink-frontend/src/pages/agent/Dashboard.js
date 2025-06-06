import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import AgentSidebar from '../../components/agent/Sidebar';
import API_BASE_URL from '../../config';
import { User, Home, MessageSquare, Menu, X } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell'; // Import useTheme hook
import Card from '../../components/ui/Card'; // Import the Card component from the new path

const AgentDashboard = () => {
  const [agent, setAgent] = useState(null);
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context

  // State for sidebar collapse/expand, consistent with AdminSidebar usage
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for active section in the sidebar, consistent with AdminSidebar usage
  const [activeSection, setActiveSection] = useState('dashboard'); // Default active section for Agent Dashboard

  // State for mobile view and sidebar open/close, consistent with Inquiries.js and Listings.js
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const [stats, setStats] = useState([
    { label: 'Total Listings', value: '--' },
    { label: 'New Inquiries', value: '--' },
  ]);
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Effect to handle window resize for mobile responsiveness, consistent with other pages
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Close sidebar on mobile, open on desktop
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: profile } = await axios.get(`${API_BASE_URL}/users/profile`, { headers });
        setAgent(profile);

        const [statsRes, activityRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/agent/dashboard/stats`, { headers }),
          axios.get(`${API_BASE_URL}/agent/dashboard/activity`, { headers }),
        ]);

        setStats([
          { label: 'Total Listings', value: statsRes.data.totalListings, onClick: () => navigate('/agent/listings') },
          { label: 'New Inquiries', value: statsRes.data.totalInquiries, onClick: () => navigate('/agent/inquiries') },
        ]);

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
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Agent Dashboard</h1>
        </div>

        <div className="hidden md:block mb-6">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Agent Dashboard</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {stats.map((stat, idx) => (
              <Card key={idx} onClick={stat.onClick} className="cursor-pointer">
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-green-300" : "text-green-600"}`}>{stat.label}</h3>
                <p className={`text-4xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card> {/* Replaced div with Card component */}
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

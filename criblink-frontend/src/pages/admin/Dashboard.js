import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, Home, MessageSquare, X } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard'; // Import StatCard
import { useMessage } from '../../context/MessageContext';
import { useSidebarState } from '../../hooks/useSidebarState'; // Import the hook

const AdminDashboard = () => {
  // Use the useSidebarState hook for sidebar management
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();

  const [agentCount, setAgentCount] = useState(null);
  const [listingCount, setListingCount] = useState(null);
  const [totalClientInquiries, setTotalClientInquiries] = useState(null); // New state for client inquiries
  const [totalAgentResponses, setTotalAgentResponses] = useState(null);   // New state for agent responses
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const navigate = useNavigate();

  const goToListings = () => navigate('/admin/listings');
  const goToPendingListings = () =>
    navigate('/admin/listings', { state: { statusFilter: 'pending' } });
  const goToAgents = () =>
    navigate('/admin/users', {
      state: { roleFilter: 'agent', sortKey: 'date_joined', sortDirection: 'desc' },
    });

  // Effect for fetching Dashboard statistics (agent count, listings, inquiries, pending approvals)
  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found for fetchStats, skipping API calls.");
        setAgentCount(null);
        setListingCount(null);
        setTotalClientInquiries(null);
        setTotalAgentResponses(null);
        setPendingApprovals(null);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [agentRes, listingRes, clientInquiriesRes, agentResponsesRes, pendingRes] = await Promise.all([
          axios.get('/admin/agents/count', { headers }),
          axios.get('/admin/listings/count', { headers }),
          axios.get('/inquiries/agent/count/all-inquiries', { headers }), // Updated API call path
          axios.get('/inquiries/agent/count/agent-responses', { headers }),   // Updated API call path
          axios.get('/admin/listings/pending-approvals', { headers }),
        ]);
        setAgentCount(agentRes.data.count);
        setListingCount(listingRes.data.count);
        setTotalClientInquiries(clientInquiriesRes.data.count); // Update new state
        setTotalAgentResponses(agentResponsesRes.data.count);   // Update new state
        setPendingApprovals(pendingRes.data.count);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn("Authentication error during stats fetch (expected on logout).");
        } else {
            showMessage('Failed to load dashboard statistics.', 'error', 3000);
        }
      }
    };

    fetchStats();

    const handleAuthChange = () => {
        fetchStats();
    };
    window.addEventListener('authChange', handleAuthChange);

    return () => {
        window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Effect for fetching Recent Activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found for recent activity, skipping API call.");
        setActivities([]);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const response = await axios.get('/admin/activity/recent-activity', { headers });
        // Safely access response.data.activities and ensure it's an array
        const rawActivities = response.data?.activities || []; 

        const activityData = rawActivities.map(a => {
          let IconComponent = User;
          let tag = 'User';
          let color = 'gray';

          const message = a.message?.toLowerCase() || '';
          const type = a.type?.toLowerCase() || '';

          if (type === 'listing' || message.includes('listing')) {
            IconComponent = Home;
            tag = 'Listing';
            color = 'green';
          } else if (type === 'inquiry' || message.includes('inquiry')) {
            IconComponent = MessageSquare;
            tag = 'Inquiry';
            color = 'blue';
          }

          return {
            ...a,
            icon: <IconComponent size={16} />,
            tag,
            color,
            formattedTime: formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }),
          };
        });
        setActivities(activityData);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn("Authentication error during activity fetch (expected on logout).");
        } else {
            showMessage('Failed to load recent activity.', 'error', 3000);
        }
      }
    };

    fetchRecentActivity();

    const handleAuthChange = () => {
        fetchRecentActivity();
    };
    window.addEventListener('authChange', handleAuthChange);

    return () => {
        window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);


  const stats = [
    { label: 'Total Listings', value: listingCount ?? '...', onClick: goToListings },
    { label: 'Total Agents', value: agentCount ?? '...', onClick: goToAgents },
    // Removed the old 'Total Inquiries' card
  ];

  const visibleActivities = showAllActivities ? activities : activities.slice(0, 5);
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-0 -mt-6 px-4 md:px-0`}>
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

      {/* Sidebar */}
      <AdminSidebar
        collapsed={isMobile ? false : isCollapsed}
        setCollapsed={isMobile ? () => {} : setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <motion.div
        key={isMobile ? 'mobile' : 'desktop'}
        style={{ marginLeft: contentShift }}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3 }}
        initial={false}
        className="pt-6 px-4 md:px-8"
      >
        {/* Headers */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Dashboard</h1>
        </div>
        <div className="hidden md:block mb-4">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Dashboard</h1>
        </div>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {/* Changed grid-cols-1 to grid-cols-2 for mobile grid layout */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, idx) => (
              <Card key={idx} onClick={stat.onClick}>
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-green-300" : "text-green-600"}`}>{stat.label}</h3>
                <p className={`text-4xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{stat.value}</p>
              </Card>
            ))}
            {/* New StatCard for Inquiries and Responses - Placed before Pending Approvals */}
            <div className={`p-4 rounded-xl shadow text-center ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-green-300" : "text-green-600"}`}>Inquiry Stats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <StatCard label="Total Inquiries" value={totalClientInquiries} />
                <StatCard label="Total Responses" value={totalAgentResponses} />
              </div>
            </div>
            {/* Pending Approvals card - now comes after Inquiry Stats */}
            <Card onClick={goToPendingListings}>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-green-300" : "text-green-600"}`}>Pending Approvals</h3>
              <p className={`text-4xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{pendingApprovals ?? '...'}</p>
            </Card>
          </div>

          {/* Activity Feed */}
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

export default AdminDashboard;

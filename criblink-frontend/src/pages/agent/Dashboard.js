import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import AgentSidebar from '../../components/agent/Sidebar'; // Corrected import path for AgentSidebar
import StatCard from '../../components/admin/StatCard'; // Assuming StatCard is still from admin components
import API_BASE_URL from '../../config';
// Import icons from lucide-react
import { User, Home, MessageSquare } from 'lucide-react';

const AgentDashboard = () => {
  const [agent, setAgent] = useState(null);
  const navigate = useNavigate();

  // State for sidebar collapse/expand, consistent with AdminSidebar usage
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for active section in the sidebar, consistent with AdminSidebar usage
  const [activeSection, setActiveSection] = useState('dashboard'); // Default active section for Agent Dashboard

  const [stats, setStats] = useState([
    { label: 'Total Listings', value: '--' },
    { label: 'New Inquiries', value: '--' },
  ]);
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Removed the resize effect as AgentSidebar is now fixed and manages its own collapse state.

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
          { label: 'Total Listings', value: statsRes.data.totalListings },
          { label: 'New Inquiries', value: statsRes.data.totalInquiries },
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

  // Adjust contentShift based on isCollapsed state, consistent with AdminSidebar
  const contentShift = isCollapsed ? 80 : 256;
  const visibleActivities = showAllActivities ? activities.slice(0, 10) : activities.slice(0, 5);

  // Removed menuItems and currentPath props as AgentSidebar now manages its own links internally

  if (!agent) return <p className="text-center mt-10">Loading your dashboard...</p>;

  return (
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      {/* AgentSidebar now receives collapsed, setCollapsed, activeSection, setActiveSection */}
      <AgentSidebar
        collapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <motion.div
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 p-4 md:p-6" // Restored original padding
      >
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className="text-2xl font-extrabold text-green-700 text-center">Agent Dashboard</h1>
        </div>

        <div className="hidden md:block mb-6"> {/* Restored original mb-6 */}
          <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">Agent Dashboard</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} // Restored original y: 20
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {stats.map((stat, idx) => {
              let route = '/';
              if (stat.label === 'Total Listings') route = '/agent/listings';
              if (stat.label === 'New Inquiries') route = '/agent/inquiries';

              return (
                <div
                  key={idx}
                  onClick={() => navigate(route)}
                  className="cursor-pointer"
                >
                  <StatCard label={stat.label} value={stat.value} />
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-green-700 mb-4">Recent Activity</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {visibleActivities.map((activity, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-${activity.color}-500`}>{activity.icon}</span> {/* Apply color to icon */}
                    <span>{activity.message}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full bg-${activity.color}-100 text-${activity.color}-600`}
                    >
                      {activity.tag}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">{activity.formattedTime}</span>
                </li>
              ))}
            </ul>
            {activities.length > 5 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllActivities(prev => !prev)}
                  className="text-sm text-green-600 hover:underline"
                >
                  {showAllActivities ? 'Show Less' : 'Show More'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AgentDashboard;

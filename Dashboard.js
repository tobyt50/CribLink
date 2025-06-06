import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar'; // Assuming the path is correct
import StatCard from '../../components/admin/StatCard';
import { motion } from 'framer-motion';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
// Import icons from lucide-react
import { User, Home, MessageSquare } from 'lucide-react';

const AdminDashboard = () => {
  // State for sidebar collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State for active section in the sidebar
  const [activeSection, setActiveSection] = useState('dashboard'); // Default active section

  const [agentCount, setAgentCount] = useState(null);
  const [listingCount, setListingCount] = useState(null);
  const [inquiriesCount, setInquiriesCount] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const navigate = useNavigate();

  const goToListings = () => navigate('/admin/listings');
  const goToPendingListings = () =>
    navigate('/admin/listings', { state: { statusFilter: 'pending' } });
  const goToAgents = () =>
    navigate('/admin/users', {
      state: { roleFilter: 'agent', sortKey: 'date_joined', sortDirection: 'desc' },
    });
  const goToInquiries = () =>
    navigate('/admin/inquiries', {
      state: { sortKey: 'created_at', sortDirection: 'desc' },
    });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [agentRes, listingRes, inquiryRes, pendingRes] = await Promise.all([
          axios.get('/admin/agents/count', { headers }),
          axios.get('/admin/listings/count', { headers }),
          axios.get('/admin/inquiries/count', { headers }),
          axios.get('/admin/listings/pending-approvals', { headers }),
        ]);

        setAgentCount(agentRes.data.count);
        setListingCount(listingRes.data.count);
        setInquiriesCount(inquiryRes.data.count);
        setPendingApprovals(pendingRes.data.count);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await axios.get('/admin/activity/recent-activity', { headers });
        const activityData = response.data.activities.map(a => {
          let IconComponent = User; // Default: User icon component
          let tag = 'User'; // Default label: User
          let color = 'gray'; // Default color - will be overridden

          // Determine icon, tag, and color based on activity type and message content
          const message = a.message?.toLowerCase() || '';
          const type = a.type?.toLowerCase() || '';

          if (type === 'listing' || message.includes('listing') || message.includes('property')) {
            IconComponent = Home; // Home icon for Listings
            tag = 'Listing';
            color = 'green'; // Green for Listings
          } else if (type === 'inquiry' || message.includes('inquiry')) {
            IconComponent = MessageSquare; // MessageSquare icon for Inquiries
            tag = 'Inquiry';
            color = 'blue'; // Blue for Inquiries
          } else {
            // For all other types, assume User-related activity
            IconComponent = User; // User icon for User
            tag = 'User';
            color = 'green'; // Changed to green to match listing styling
          }


          return {
            ...a,
            icon: <IconComponent size={16} />, // Render the icon component
            tag,
            color,
            formattedTime: formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }),
          };
        });

        setActivities(activityData);
      } catch (err) {
        console.error('Failed to fetch recent activities:', err);
      }
    };

    fetchRecentActivity();
  }, []);

  const stats = [
    {
      label: 'Total Listings',
      value: listingCount !== null ? listingCount : '...',
      onClick: goToListings,
    },
    {
      label: 'Total Agents',
      value: agentCount !== null ? agentCount : '...',
      onClick: goToAgents,
    },
    {
      label: 'Total Inquiries',
      value: inquiriesCount !== null ? inquiriesCount : '...',
      onClick: goToInquiries,
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals !== null ? pendingApprovals : '...',
      onClick: goToPendingListings,
    },
  ];

  const visibleActivities = showAllActivities ? activities : activities.slice(0, 5);
  // Adjust contentShift based on isCollapsed state
  const contentShift = isCollapsed ? 80 : 256;

  return (
    <div className="bg-gray-50 pt-0 -mt-6 px-4 md:px-8">
      {/* AdminSidebar now receives collapsed, setCollapsed, activeSection, setActiveSection */}
      <AdminSidebar
        collapsed={isCollapsed}
        setCollapsed={setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <motion.div
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1 px-4 md:px-6 pt-6" // Added pt-14 to account for Header height
      >
        {/* Mobile-only H1 element */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className="text-2xl font-extrabold text-green-700 text-center">Admin Dashboard</h1>
        </div>

        <div className="hidden md:block mb-4">
          <h1 className="text-3xl font-extrabold text-green-700 mb-6 text-center">Admin Dashboard</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, idx) => (
              <div key={idx} onClick={stat.onClick} className="cursor-pointer">
                <StatCard label={stat.label} value={stat.value} />
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-green-700 mb-4">Recent Activity</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {visibleActivities.map((activity, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Use the determined icon */}
                    <span className={`text-${activity.color}-500`}>{activity.icon}</span> {/* Apply color to icon */}
                    <span>{activity.message}</span>
                    {/* Use the determined tag and color */}
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

export default AdminDashboard;

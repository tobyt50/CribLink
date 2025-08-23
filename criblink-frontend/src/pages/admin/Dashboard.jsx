import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, Home, MessageSquare, X, Briefcase, DollarSign, BarChart2, Users, Settings, FileText, Building, CheckCircle, ArrowLeft } from 'lucide-react'; // Added Building and FileText icons
import { useTheme } from '../../layouts/AppShell';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard';
import { useMessage } from '../../context/MessageContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import axiosInstance from '../../api/axiosInstance';

// Skeleton component for the Dashboard
const DashboardSkeleton = ({ darkMode }) => (
  <div className={`animate-pulse space-y-6`}>
    {/* Stat Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
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
      ))}
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
          {[...Array(4)].map((_, i) => (
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


const AdminDashboard = () => {
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const navigate = useNavigate();

  // System-wide stats
  const [totalUsersCount, setTotalUsersCount] = useState('--');
  const [agenciesCount, setAgenciesCount] = useState('--');
  const [agentsCount, setAgentsCount] = useState('--');
  const [clientsCount, setClientsCount] = useState('--'); 
  const [totalListingsCount, setTotalListingsCount] = useState('--');
  const [availableListingsCount, setAvailableListingsCount] = useState('--');
  const [pendingListingsCount, setPendingListingsCount] = useState('--');
  const [totalInquiriesCount, setTotalInquiriesCount] = useState('--');
  const [totalResponsesCount, setTotalResponsesCount] = useState('--');
  const [totalDocumentsCount, setTotalDocumentsCount] = useState('--'); // New stat
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loading, setLoading] = useState(true); // New loading state

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Navigation functions
  const goToUsers = () => navigate('/admin/users');
  const goToAgencies = () => navigate('/agencies'); // Assuming a general agencies page
  const goToAgents = () => navigate('/admin/users', { state: { roleFilter: 'agent' } });
  const goToClients = () => navigate('/admin/users', { state: { roleFilter: 'client' } });
  const goToListings = () => navigate('/admin/listings');
  const goToAvailableListings = () => navigate('/admin/listings', { state: { statusFilter: 'available' } });
  const goToPendingListings = () => navigate('/admin/listings', { state: { statusFilter: 'pending' } });
  const goToInquiries = () => navigate('/admin/inquiries'); // Assuming an admin inquiries page
  const goToDocuments = () => navigate('/documents');
  const goToAddListing = () => navigate('/admin/add-listing');
  const goToSettings = () => navigate('/admin/settings');
  const goToAgentPerformance = () => navigate('/admin/agent-performance');


  // Effect for fetching Dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true); // Start loading
      if (!token) {
        console.log("No token found for fetchStats, skipping API calls.");
        setTotalUsersCount('--');
        setAgenciesCount('--');
        setAgentsCount('--');
        setClientsCount('--');
        setTotalListingsCount('--');
        setAvailableListingsCount('--');
        setPendingListingsCount('--');
        setTotalInquiriesCount('--');
        setTotalResponsesCount('--');
        setTotalDocumentsCount('--');
        setLoading(false); // End loading if no token
        return;
      }

      try {
        const [
          usersRes,
          agenciesRes,
          agentsRes,
          clientsRes,
          listingsRes,
          availableListingsRes,
          pendingListingsRes,
          inquiriesRes,
          responsesRes,
          documentsRes
        ] = await Promise.all([
          axiosInstance.get(`/admin/users/count`, { headers }),
          axiosInstance.get(`/admin/agencies/count`, { headers }),
          axiosInstance.get(`/admin/agents/count`, { headers }),
          axiosInstance.get(`/admin/clients/count`, { headers }),
          axiosInstance.get(`/admin/listings/count`, { headers }),
          axiosInstance.get(`/admin/listings/available/count`, { headers }),
          axiosInstance.get(`/admin/listings/pending/count`, { headers }),
          axiosInstance.get(`/admin/inquiries/count`, { headers }), // Corrected path
          axiosInstance.get(`/admin/inquiries/responses/count`, { headers }), // Corrected path
          axiosInstance.get(`/admin/documents/count`, { headers })
        ]);

        setTotalUsersCount(usersRes.data.count);
        setAgenciesCount(agenciesRes.data.count);
        setAgentsCount(agentsRes.data.count);
        setClientsCount(clientsRes.data.count);
        setTotalListingsCount(listingsRes.data.count);
        setAvailableListingsCount(availableListingsRes.data.count);
        setPendingListingsCount(pendingListingsRes.data.count);
        setTotalInquiriesCount(inquiriesRes.data.count);
        setTotalResponsesCount(responsesRes.data.count);
        setTotalDocumentsCount(documentsRes.data.count);

      } catch (error) {
        console.error("Error fetching admin stats:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn("Authentication error during stats fetch (expected on logout).");
          showMessage('Session expired or unauthorized. Please log in again.', 'error', 3000);
          navigate('/signin');
        } else {
          showMessage('Failed to load dashboard statistics.', 'error', 3000);
        }
      } finally {
        setLoading(false); // End loading
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
  }, [navigate, showMessage, token]);

  // Effect for fetching Recent Activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!token) {
        console.log("No token found for recent activity, skipping API call.");
        setActivities([]);
        return;
      }

      try {
        const response = await axiosInstance.get(`/admin/activity/recent-activity`, { headers });

        const activityData = response.data.activities.map(a => {
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
          } else if (type === 'user_signup' || message.includes('signed up')) {
            IconComponent = User;
            tag = 'User';
            color = 'purple';
          } else if (type === 'agency_created' || message.includes('agency created')) {
            IconComponent = Building;
            tag = 'Agency';
            color = 'orange';
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
  }, [showMessage, token]);


  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;
  const visibleActivities = showAllActivities ? activities : activities.slice(0, 5);

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-4 md:px-0 min-h-screen flex flex-col`}>
     
      <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className={`absolute left-4 mt-5 p-2 rounded-lg shadow-sm transition hover:scale-105
            ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}
        >
          <ArrowLeft size={20} />
        </button>

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
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        {/* Headers */}
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Admin Dashboard</h1>
        </div>
        <div className="hidden md:block mb-4">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Admin Dashboard</h1>
        </div>

        {loading ? (
            <DashboardSkeleton darkMode={darkMode} />
        ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

                    {/* Total Users Card */}
                    <Card>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Total Users</h3>
                        <Users size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 w-full">
                        <StatCard label="Agencies" value={agenciesCount} onClick={goToAgencies} textCentered={true} icon={<Building size={20} />} />
                        <StatCard label="Agents" value={agentsCount} onClick={goToAgents} textCentered={true} icon={<Briefcase size={20} />} />
                        <StatCard label="Clients" value={clientsCount} onClick={goToClients} textCentered={true} icon={<User size={20} />} />
                    </div>
                    </Card>

                    {/* Listings Overview Card */}
                    <Card>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Listings Overview</h3>
                        <Home size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 w-full">
                        <StatCard label="Total" value={totalListingsCount} onClick={goToListings} textCentered={true} icon={<Home size={20} />} />
                        <StatCard label="Available" value={availableListingsCount} onClick={goToAvailableListings} textCentered={true} icon={<CheckCircle size={20} />} />
                        <StatCard label="Pending" value={pendingListingsCount} onClick={goToPendingListings} textCentered={true} icon={<DollarSign size={20} />} />
                    </div>
                    </Card>

                    {/* Inquiry Metrics Card */}
                    <Card onClick={goToInquiries} className="cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Inquiry Metrics</h3>
                        <MessageSquare size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <StatCard label="Inquiries" value={totalInquiriesCount} textCentered={true} />
                        <StatCard label="Responses" value={totalResponsesCount} textCentered={true} />
                    </div>
                    </Card>

                    {/* New Stat Card: Total Documents */}
                    <Card onClick={goToDocuments} className="cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Legal Documents</h3>
                        <FileText size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    {/* Removed h-full and added pt-2 to adjust vertical alignment */}
                    <div className="flex items-center justify-center">
                        <p className={`text-4xl font-bold pt-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{totalDocumentsCount}</p>
                    </div>
                    </Card>

                </div>

                {/* Recent Activity Feed */}
                <Card>
                    <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Recent Platform Activity</h2>
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
                        <li className="truncate"><strong>Top Performing Agencies:</strong> Identify agencies with most listings, sales, or inquiries.</li>
                        <li className="truncate"><strong>Listing Performance:</strong> Track views, inquiries, and conversion rates across the platform.</li>
                        <li className="truncate"><strong>User Engagement:</strong> Analyze active users, login frequency, and feature usage.</li>
                        <li className="truncate"><strong>System Health:</strong> Monitor uptime, error rates, and resource utilization.</li>
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
                        onClick={goToUsers}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                            ${darkMode ? "bg-blue-700 hover:bg-blue-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                        >
                        <Users size={20} /> Manage Users
                        </button>
                        <button
                        onClick={goToSettings}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                            ${darkMode ? "bg-purple-700 hover:bg-purple-600 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                        >
                        <Settings size={20} /> Platform Settings
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

                {/* Financial Overview (Placeholder) - System-wide */}
                <div className="mt-10">
                    <Card>
                    <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Financial Snapshot</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard label="Total Revenue (YTD)" value="$XXX,XXX" icon={<DollarSign size={20} />} />
                        <StatCard label="Platform Earnings" value="$XX,XXX" icon={<DollarSign size={20} />} />
                        <StatCard label="Operational Costs" value="$X,XXX" icon={<DollarSign size={20} />} />
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

export default AdminDashboard;

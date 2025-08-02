import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/Sidebar';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, Home, MessageSquare, X, Briefcase, DollarSign, BarChart2, Users, Settings, FileText, Building, CheckCircle, Clock } from 'lucide-react'; // Added Building and FileText icons
import { useTheme } from '../../layouts/AppShell';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard';
import { useMessage } from '../../context/MessageContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import axiosInstance from '../../api/axiosInstance';

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
  const [soldListingsCount, setSoldListingsCount] = useState('--');
  const [totalInquiriesCount, setTotalInquiriesCount] = useState('--');
  const [totalResponsesCount, setTotalResponsesCount] = useState('--');
  const [totalDocumentsCount, setTotalDocumentsCount] = useState('--'); // New stat
  const [activities, setActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Navigation functions
  const goToUsers = () => navigate('/admin/users');
  const goToAgencies = () => navigate('/agencies'); // Assuming a general agencies page
  const goToAgents = () => navigate('/admin/users', { state: { roleFilter: 'agent' } });
  const goToClients = () => navigate('/admin/users', { state: { roleFilter: 'client' } });
  const goToListings = () => navigate('/admin/listings');
  const goToAvailableListings = () => navigate('/admin/listings', { state: { statusFilter: 'available' } });
  const goToSoldListings = () => navigate('/admin/listings', { state: { statusFilter: 'sold' } });
  const goToInquiries = () => navigate('/admin/inquiries'); // Assuming an admin inquiries page
  const goToDocuments = () => navigate('/admin/documents');
  const goToAddListing = () => navigate('/admin/add-listing');
  const goToSettings = () => navigate('/admin/settings');
  const goToAgentPerformance = () => navigate('/admin/agent-performance');


  // Effect for fetching Dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        console.log("No token found for fetchStats, skipping API calls.");
        setTotalUsersCount('--');
        setAgenciesCount('--');
        setAgentsCount('--');
        setClientsCount('--');
        setTotalListingsCount('--');
        setAvailableListingsCount('--');
        setSoldListingsCount('--');
        setTotalInquiriesCount('--');
        setTotalResponsesCount('--');
        setTotalDocumentsCount('--');
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
          soldListingsRes,
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
          axiosInstance.get(`/admin/listings/sold/count`, { headers }),
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
        setSoldListingsCount(soldListingsRes.data.count);
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

        {/* Stat Cards */}
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
                <StatCard label="Sold" value={soldListingsCount} onClick={goToSoldListings} textCentered={true} icon={<DollarSign size={20} />} />
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
              <div className="flex items-center justify-center h-full">
                <p className={`text-4xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{totalDocumentsCount}</p>
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
      </motion.div>
    </div>
  );
};

export default AdminDashboard;

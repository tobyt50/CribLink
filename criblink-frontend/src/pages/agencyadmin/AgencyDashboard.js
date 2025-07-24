import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgencyAdminSidebar from '../../components/agencyadmin/Sidebar';
import axiosInstance from '../../api/axiosInstance';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, Home, MessageSquare, X, Briefcase, DollarSign, BarChart2, Users, Settings, UserCog } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard';
import { useMessage } from '../../context/MessageContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useAuth } from '../../context/AuthContext';

const AgencyDashboard = () => {
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [agencyName, setAgencyName] = useState('Your Agency');
  const [agentsCount, setAgentsCount] = useState(null);
  const [adminsCount, setAdminsCount] = useState(null);
  const [clientsCount, setClientsCount] = useState(null);
  const [listingsCount, setListingsCount] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const [clientInquiriesCount, setClientInquiriesCount] = useState(null);
  const [agentResponsesCount, setAgentResponsesCount] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Redirect if not agency_admin or agency_id is missing
  useEffect(() => {
    if (!user || user.role !== 'agency_admin' || !user.agency_id) {
      showMessage('Access Denied: You must be an agency administrator to view this page.', 'error');
      navigate('/signin');
    } else {
      if (user.agency) {
        setAgencyName(user.agency);
      }
    }
  }, [user, navigate, showMessage]);

  const agencyId = user?.agency_id;

  // Navigation functions
  const goToListings = () => navigate('/agency/listings');
  const goToPendingListings = () => navigate('/agency/listings', { state: { statusFilter: 'pending' } });

  // Updated navigation for members with role filters
  const goToMembersAdmins = () => navigate('/agency/members', { state: { roleFilter: 'agency_admin' } });
  const goToMembersAgents = () => navigate('/agency/members', { state: { roleFilter: 'agent' } });
  const goToClients = () => navigate('/agency/clients'); // Navigate to Clients.js

  // Effect for fetching Dashboard statistics
  useEffect(() => {
    const fetchAgencyStats = async () => {
      if (!agencyId) return;

      const token = localStorage.getItem('token');
      if (!token) {
        console.log("No token found for fetchAgencyStats, skipping API calls.");
        setAgentsCount(null);
        setAdminsCount(null);
        setClientsCount(null);
        setListingsCount(null);
        setPendingApprovals(null);
        setClientInquiriesCount(null);
        setAgentResponsesCount(null);
        setRecentActivities([]);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [
          agentsRes,
          adminsRes,
          clientsRes,
          listingsRes,
          pendingRes,
          inquiriesRes,
          responsesRes,
          activityRes,
          agencyDetailsRes
        ] = await Promise.all([
          axiosInstance.get(`/agency-stats/${agencyId}/agents/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/admins/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/clients/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/listings/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/listings/pending-approvals`, { headers }),
          axiosInstance.get(`/inquiries/agent/count/all-inquiries`, { headers }),
          axiosInstance.get(`/inquiries/agent/count/agent-responses`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/recent-activity`, { headers }),
          axiosInstance.get(`/agencies/${agencyId}`, { headers })
        ]);

        setAgentsCount(agentsRes.data.count);
        setAdminsCount(adminsRes.data.count);
        setClientsCount(clientsRes.data.count);
        setListingsCount(listingsRes.data.count);
        setPendingApprovals(pendingRes.data.count);
        setClientInquiriesCount(inquiriesRes.data.count);
        setAgentResponsesCount(responsesRes.data.count);
        setAgencyName(agencyDetailsRes.data.name);

        const activityData = activityRes.data.activities.map(a => {
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
          } else if (type === 'agent_join' || message.includes('agent joined')) {
            IconComponent = Briefcase;
            tag = 'Agent';
            color = 'purple';
          }

          return {
            ...a,
            icon: <IconComponent size={16} />,
            tag,
            color,
            formattedTime: formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }),
          };
        });
        setRecentActivities(activityData);

      } catch (error) {
        console.error("Error fetching agency admin stats:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn("Authentication error during stats fetch (expected on logout or unauthorized access).");
            showMessage('Session expired or unauthorized. Please log in again.', 'error', 3000);
            navigate('/signin');
        } else {
            showMessage('Failed to load agency dashboard statistics.', 'error', 3000);
        }
      }
    };

    fetchAgencyStats();

    const handleAuthChange = () => {
        fetchAgencyStats();
    };
    window.addEventListener('authChange', handleAuthChange);

    return () => {
        window.removeEventListener('authChange', handleAuthChange);
    };
  }, [agencyId, showMessage, navigate]);


  const stats = [
    { label: 'Listings', value: listingsCount ?? '...', onClick: goToListings, icon: <Home size={24} /> },
    { label: 'Pending Approvals', value: pendingApprovals ?? '...', onClick: goToPendingListings, icon: <MessageSquare size={24} /> },
  ];

  const visibleActivities = showAllActivities ? recentActivities : recentActivities.slice(0, 5);
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
      <AgencyAdminSidebar
        collapsed={isMobile ? false : isCollapsed}
        setCollapsed={isMobile ? () => {} : setIsCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        userRole="agency_admin"
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
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>
            {agencyName} Dashboard
          </h1>
        </div>
        <div className="hidden md:block mb-4">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>
            {agencyName} Dashboard
          </h1>
        </div>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Members Overview Card - Renamed to Total Members */}
            <Card> {/* Removed onClick from the main card */}
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Total Members</h3>
                <Users size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              </div>
              {/* Changed to 3 columns, centered text, and re-ordered */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {/* Admins */}
                <StatCard label="Admins" value={adminsCount} onClick={goToMembersAdmins} textCentered={true} />
                {/* Agents */}
                <StatCard label="Agents" value={agentsCount} onClick={goToMembersAgents} textCentered={true} />
                {/* Clients */}
                <StatCard label="Clients" value={clientsCount} onClick={goToClients} textCentered={true} />
              </div>
            </Card>

            {stats.map((stat, idx) => (
              <Card key={idx} onClick={stat.onClick}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>{stat.label}</h3>
                  {stat.icon && <span className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.icon}</span>}
                </div>
                <p className={`text-4xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{stat.value}</p>
              </Card>
            ))}
            {/* Inquiry and Response Stats - Combined Card */}
            <div className={`p-4 rounded-xl shadow text-center ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Inquiry Metrics</h3>
                <MessageSquare size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <StatCard label="Inquiries" value={clientInquiriesCount} textCentered={true} />
                <StatCard label="Responses" value={agentResponsesCount} textCentered={true} />
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <Card>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Recent Agency Activity</h2>
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
            {recentActivities.length > 5 && (
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
                <li className="truncate"><strong>Top Performing Agents:</strong> Identify agents with most listings, sales, or inquiries.</li>
                <li className="truncate"><strong>Listing Performance:</strong> Track views, inquiries, and conversion rates for listings.</li>
                <li className="truncate"><strong>Revenue Projections:</strong> Based on completed sales (requires finance integration).</li>
                <li className="truncate"><strong>Client Acquisition Trends:</strong> Analyze how new clients are joining.</li>
              </ul>
              <div className="mt-4 text-center">
                <button
                  onClick={() => showMessage('Feature coming soon!', 'info')}
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
                  onClick={() => navigate('/agent/add-listing')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                    ${darkMode ? "bg-green-700 hover:bg-green-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                >
                  <Home size={20} /> Add New Listing
                </button>
                <button
                  onClick={() => navigate('/agency/members')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                    ${darkMode ? "bg-blue-700 hover:bg-blue-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                >
                  <Users size={20} /> Manage Members
                </button>
                <button
                  onClick={() => navigate('/agency/settings')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                    ${darkMode ? "bg-purple-700 hover:bg-purple-600 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                >
                  <Settings size={20} /> Agency Settings
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

          {/* Financial Overview (Placeholder) */}
          <div className="mt-10">
            <Card>
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Financial Snapshot</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Revenue (YTD)" value="$XX,XXX" icon={<DollarSign size={20} />} />
                <StatCard label="Pending Commissions" value="$X,XXX" icon={<DollarSign size={20} />} />
                <StatCard label="Marketing Spend" value="$X,XXX" icon={<DollarSign size={20} />} />
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

export default AgencyDashboard;

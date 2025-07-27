import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientSidebar from '../../components/client/Sidebar'; // Assuming you have a client sidebar
import axiosInstance from '../../api/axiosInstance';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, Home, MessageSquare, X, Heart, Search, Phone, Mail, Star, Settings, UserPlus, Landmark, ArrowLeft, Hourglass, UserRoundCheck, CheckCircle, UserX, EllipsisVertical } from 'lucide-react'; // Added Star icon for recommended listings and Settings, plus icons for agent selection modal
import { useTheme } from '../../layouts/AppShell';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard'; // Re-using StatCard for simple stats
import { useMessage } from '../../context/MessageContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useAuth } from '../../context/AuthContext'; // To get client user details
import FindAgentModal from '../../components/client/FindAgentModal'; // NEW: Import the new modal component

const ClientDashboard = () => {
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get authenticated user details

  const [recentActivities, setRecentActivities] = useState([]);
  const [totalInquiries, setTotalInquiries] = useState('--');
  const [savedListingsCount, setSavedListingsCount] = useState('--');
  const [connectedAgents, setConnectedAgents] = useState([]); // Changed to an array for multiple agents
  const [recommendedListingsCount, setRecommendedListingsCount] = useState('--'); // New state for recommended listings
  const [showAllActivities, setShowAllActivities] = useState(false);

  const [isFindAgentModalOpen, setIsFindAgentModalOpen] = useState(false); // State for agent modal
  // Removed agent-related states that are now managed inside FindAgentModal:
  // allAgents, filteredAgents, agentSearchTerm, selectedAgentForConnection, selectedAgentConnectionStatus

  // Fetch token once from localStorage
  const token = localStorage.getItem('token');

  // Navigation functions
  const goToInquiries = () => navigate('/client/inquiries');
  const goToSavedListings = () => navigate('/favourites'); // Assuming /favourites is client's saved listings
  const goToSearch = () => navigate('/search');
  const goToAgentProfile = (agentId) => navigate(`/client/agent-profile/${agentId}`);
  const goToSettings = () => navigate('/client/settings');
  const goToRecommendedListings = () => {
    if (connectedAgents.length > 0) { // Check if any agent is connected
      // For simplicity, navigate to the first connected agent's profile, or a generic recommendations page
      // A more robust solution might be a dedicated recommendations page that aggregates from all agents
      navigate(`/client/agent-profile/${connectedAgents[0].user_id}`, { state: { scrollTo: 'recommended-listings' } });
    } else {
      showMessage('Connect with an agent to see recommended listings!', 'info');
    }
  };

  // The fetchAllAgents, handleFindAgentClick, handleAgentSearchChange, handleSelectAgentForConnection,
  // and handleSendConnectionRequest functions are now managed inside FindAgentModal.
  // We only need handleFindAgentClick to open the modal.
  const handleFindAgentClick = () => {
    setIsFindAgentModalOpen(true);
  };


  const fetchClientDashboardData = useCallback(async () => {
    if (!user || !token) {
      console.log("No user or token found, skipping client dashboard data fetch.");
      return;
    }
    // Define headers inside the useCallback to avoid re-creation on every render
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch client-specific stats
      const [inquiriesRes, savedListingsRes] = await Promise.all([
        // Corrected endpoint path to include /client-stats
        axiosInstance.get(`/client-stats/inquiries/client/count/all-inquiries`, { headers }),
        axiosInstance.get(`/client-stats/saved-listings/count`, { headers }), // Using new client-stats endpoint
      ]);

      setTotalInquiries(inquiriesRes.data.count);
      setSavedListingsCount(savedListingsRes.data.count);

      // Fetch recent activities for the client
      const activityRes = await axiosInstance.get(`/client-stats/activity/recent-activity`, { headers }); // Using new client-stats endpoint
      const formattedActivities = activityRes.data.activities.map(a => {
        let IconComponent = User;
        let tag = 'Activity';
        let color = 'gray';

        const message = a.message?.toLowerCase() || '';
        const type = a.type?.toLowerCase() || '';

        if (type === 'inquiry_update' || message.includes('inquiry')) {
          IconComponent = MessageSquare;
          tag = 'Inquiry';
          color = 'blue';
        } else if (type === 'listing_match' || message.includes('listing match')) {
          IconComponent = Home;
          tag = 'Match';
          color = 'green';
        } else if (type === 'agent_message' || message.includes('message from agent')) {
          IconComponent = User; // Or a specific agent icon if available
          tag = 'Agent Msg';
          color = 'purple';
        } else if (type === 'agent_connection' || message.includes('agent connected')) {
          IconComponent = User;
          tag = 'Connection';
          color = 'teal';
        }

        return {
          ...a,
          icon: <IconComponent size={16} />,
          tag,
          color,
          formattedTime: formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }),
        };
      });
      setRecentActivities(formattedActivities);

      // Fetch ALL connected agents details from clientController
      const agentConnectionRes = await axiosInstance.get(`/clients/${user.user_id}/connected-agent`, { headers });
      if (agentConnectionRes.data.agents && agentConnectionRes.data.agents.length > 0) {
        setConnectedAgents(agentConnectionRes.data.agents); // Set the array of agents

        // Calculate total recommended listings from all connected agents
        let totalRecs = 0;
        for (const agent of agentConnectionRes.data.agents) {
          try {
            const recommendedRes = await axiosInstance.get(`/client-stats/${user.user_id}/recommendations/agent/${agent.user_id}/count`, { headers });
            totalRecs += recommendedRes.data.count;
          } catch (recError) {
            console.warn(`Could not fetch recommendations for agent ${agent.user_id}:`, recError);
          }
        }
        setRecommendedListingsCount(totalRecs);
      } else {
        setConnectedAgents([]); // No agents connected
        setRecommendedListingsCount(0);
      }

    } catch (error) {
      console.error("Error fetching client dashboard data:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn("Authentication error during client dashboard fetch.");
        showMessage('Session expired or unauthorized. Please log in again.', 'error', 3000);
        navigate('/signin');
      } else {
        showMessage('Failed to load client dashboard data.', 'error', 3000);
      }
    }
  }, [navigate, showMessage, user, token]);

  useEffect(() => {
    fetchClientDashboardData();

    const handleAuthChange = () => {
      fetchClientDashboardData();
    };
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [fetchClientDashboardData]);


  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;
  const visibleActivities = showAllActivities ? recentActivities : recentActivities.slice(0, 5);

  const clientFirstName = user?.full_name?.split(' ')[0] || 'Client';

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
      <ClientSidebar
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
          <h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Client Dashboard</h1>
        </div>
        <div className="hidden md:block mb-4">
          <h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Client Dashboard</h1>
        </div>

        {/* Welcome Message - No Card Container */}
        <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>
          Welcome, {clientFirstName}! <span className={`${darkMode ? "text-gray-300" : "text-gray-700"} text-base font-normal`}>Here's a quick overview of your activity and connections.</span>
        </h2>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"> {/* Changed to 4 columns */}

            {/* My Inquiries */}
            <Card onClick={goToInquiries} className="cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>My Inquiries</h3>
                <MessageSquare size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              </div>
              <div className="flex items-center justify-center h-full">
                <p className={`text-4xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{totalInquiries}</p>
              </div>
            </Card>

            {/* Saved Listings */}
            <Card onClick={goToSavedListings} className="cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Saved Listings</h3>
                <Heart size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              </div>
              <div className="flex items-center justify-center h-full">
                <p className={`text-4xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{savedListingsCount}</p>
              </div>
            </Card>

            {/* Connected Agents */}
            <Card onClick={handleFindAgentClick} className="cursor-pointer"> {/* Now opens modal */}
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Connected Agents</h3> {/* Pluralized title */}
                <User size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              </div>
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className={`text-4xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{connectedAgents.length}</p> {/* Display count */}
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {connectedAgents.length === 1 ? 'agent' : 'agents'}
                </p>
                <button
                  onClick={handleFindAgentClick}
                  className={`mt-2 text-sm hover:underline ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                >
                  Manage Agents
                </button>
              </div>
            </Card>

            {/* Recommended Listings */}
            <Card onClick={goToRecommendedListings} className="cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Recommended Listings</h3>
                <Star size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              </div>
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className={`text-4xl font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{recommendedListingsCount}</p>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {connectedAgents.length > 0 ? `from ${connectedAgents.length} agent(s)` : 'Connect to see recommendations'}
                </p>
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

          {/* Quick Actions */}
          <div className="mt-10">
            <Card>
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Changed to 4 columns on large screens */}
                <button
                  onClick={goToSearch}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                    ${darkMode ? "bg-green-700 hover:bg-green-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}
                >
                  <Search size={20} /> Search for Listings
                </button>
                <button
                  onClick={goToInquiries}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                    ${darkMode ? "bg-blue-700 hover:bg-blue-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                >
                  <MessageSquare size={20} /> View My Inquiries
                </button>
                <button
                  onClick={goToSavedListings}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                    ${darkMode ? "bg-purple-700 hover:bg-purple-600 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                >
                  <Heart size={20} /> My Favourites
                </button>
                <button
                  onClick={goToSettings}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200
                    ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-500 hover:bg-gray-600 text-white"}`}
                >
                  <Settings size={20} /> Settings
                </button>
              </div>
            </Card>
          </div>

        </motion.div>
      </motion.div>

      {/* Agent Connection Modal */}
      <FindAgentModal
        isOpen={isFindAgentModalOpen}
        onClose={() => setIsFindAgentModalOpen(false)}
        connectedAgents={connectedAgents}
        fetchClientDashboardData={fetchClientDashboardData}
      />
    </div>
  );
};

export default ClientDashboard;

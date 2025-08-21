import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AgencyAdminSidebar from '../../components/agency/Sidebar';
import axiosInstance from '../../api/axiosInstance';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, Home, MessageSquare, X, Briefcase, DollarSign, BarChart2, Users, Settings, UserCog, ListChecks, UserPlus, CheckCircle, Clock, Star, TrendingUp, Shield } from 'lucide-react';
import { useTheme } from '../../layouts/AppShell';
import Card from '../../components/ui/Card';
import StatCard from '../../components/StatCard';
import { useMessage } from '../../context/MessageContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useAuth } from '../../context/AuthContext';
import { SUBSCRIPTION_TIERS } from '../../config/subscriptionConfig'; // NEW: Import subscription config

// Skeleton component for the Agency Dashboard (remains unchanged)
const AgencyDashboardSkeleton = ({ darkMode }) => (
    <div className={`animate-pulse space-y-6`}>
      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card>
          <div className="flex items-center justify-between mb-2"><div className={`h-6 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div><div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div></div>
          <div className="grid grid-cols-3 gap-4 w-full">{[...Array(3)].map((_, j) => (<div key={j} className={`h-16 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>))}</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-2"><div className={`h-6 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div><div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div></div>
          <div className="grid grid-cols-2 gap-4 w-full">{[...Array(2)].map((_, j) => (<div key={j} className={`h-16 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>))}</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-2"><div className={`h-6 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div><div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div></div>
          <div className="grid grid-cols-3 gap-4 w-full">{[...Array(3)].map((_, j) => (<div key={j} className={`h-16 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>))}</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-2"><div className={`h-6 w-3/4 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div><div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div></div>
          <div className="grid grid-cols-2 gap-4 w-full">{[...Array(2)].map((_, j) => (<div key={j} className={`h-16 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>))}</div>
        </Card>
      </div>
      {/* Recent Activity Feed Skeleton */}
      <Card>
        <div className={`h-8 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div>
        <ul className="space-y-2">{[...Array(5)].map((_, i) => (<li key={i} className="flex items-center justify-between"><div className="flex items-center gap-2 overflow-hidden w-full"><div className={`h-4 w-4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div><div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div><div className={`h-4 w-1/4 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></div><div className={`h-4 w-1/5 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} ml-2`}></div></li>))}</ul>
        <div className={`mt-4 h-6 w-1/4 rounded mx-auto ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
      </Card>
      {/* Additional Sections/Features Suggestions Skeleton */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6"><Card><div className={`h-8 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div><ul className="space-y-2">{[...Array(4)].map((_, i) => (<li key={i} className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></li>))}</ul><div className={`mt-4 h-6 w-1/2 rounded mx-auto ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div></Card><Card><div className={`h-8 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => (<div key={i} className={`h-12 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>))}</div></Card></div>
      {/* Financial Overview Skeleton */}
      <div className="mt-10"><Card><div className={`h-8 w-1/2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"} mb-4`}></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => (<div key={i} className={`h-24 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>))}</div><div className={`mt-4 h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div></Card></div>
    </div>
);


const AgencyDashboard = () => {
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();
  const [activeSection, setActiveSection] = useState('dashboard');
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user, loading: authLoading } = useAuth(); // NEW: Use auth context for user data
  const navigate = useNavigate();

  const [agencyName, setAgencyName] = useState('Your Agency');
  const [agentsCount, setAgentsCount] = useState(null);
  const [adminsCount, setAdminsCount] = useState(null);
  const [clientsCount, setClientsCount] = useState(null);
  const [listingsCount, setListingsCount] = useState(null);
  const [pendingListingsCount, setPendingListingsCount] = useState(null);
  const [pendingAgentRequestsCount, setPendingAgentRequestsCount] = useState(null);
  const [underOfferListingsCount, setUnderOfferListingsCount] = useState(null);
  const [soldListingsCount, setSoldListingsCount] = useState(null);
  const [clientInquiriesCount, setClientInquiriesCount] = useState(null);
  const [agentResponsesCount, setAgentResponsesCount] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loading, setLoading] = useState(true);

  // NEW: State for subscription-specific stats
  const [subscriptionStats, setSubscriptionStats] = useState({ activeListings: null, activeFeatured: null });

  // NEW: Get tier config from user subscription, now it's always available
  const tier = user?.subscription_type || 'basic';
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  
  // Your original useEffect for redirection (UNCHANGED)
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'agency_admin' || !user.agency_id)) {
      showMessage('Access Denied: You must be an agency administrator to view this page.', 'error');
      navigate('/signin');
    } else if (user?.agency) {
      setAgencyName(user.agency);
    }
  }, [user, authLoading, navigate, showMessage]);

  const agencyId = user?.agency_id;

  // Navigation functions (UNCHANGED)
  const goToListings = () => navigate('/agency/listings');
  const goToPendingListings = () => navigate('/agency/listings', { state: { statusFilter: 'pending' } });
  const goToPendingAgentRequests = () => navigate('/agency/members', { state: { showPendingRequests: true } });
  const goToUnderOfferListings = () => navigate('/agency/listings', { state: { statusFilter: 'under offer' } });
  const goToSoldListings = () => navigate('/agency/listings', { state: { statusFilter: 'sold' } });
  const goToMembersAdmins = () => navigate('/agency/members', { state: { roleFilter: 'agency_admin' } }); // Corrected role filter
  const goToMembersAgents = () => navigate('/agency/members', { state: { roleFilter: 'agent' } });
  const goToClients = () => navigate('/agency/clients');

  // Your original useEffect for fetching Dashboard statistics (UNCHANGED logic, ADDED one API call)
  useEffect(() => {
    const fetchAgencyStats = async () => {
      setLoading(true);
      if (!agencyId) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [
          agentsRes, adminsRes, clientsRes, listingsRes, pendingListingsRes,
          pendingAgentRequestsRes, underOfferRes, soldRes, inquiriesRes, responsesRes,
          activityRes, agencyDetailsRes, 
          listingStatsRes // NEW: Added API call for subscription stats
        ] = await Promise.all([
          axiosInstance.get(`/agency-stats/${agencyId}/agents/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/admins/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/clients/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/listings/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/listings/pending-approvals`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/pending-agent-requests/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/listings/under-offer/count`, { headers }),
          axiosInstance.get(`/agency-stats/${agencyId}/listings/sold/count`, { headers }),
          axiosInstance.get(`/inquiries/agent/count/all-inquiries`, { headers }), // Note: This might need to be agency-specific
          axiosInstance.get(`/inquiries/agent/count/agent-responses`, { headers }), // Note: This might need to be agency-specific
          axiosInstance.get(`/agency-stats/${agencyId}/recent-activity`, { headers }),
          axiosInstance.get(`/agencies/${agencyId}`, { headers }),
          axiosInstance.get(`/users/listing-stats`, { headers }) // NEW: Fetching subscription-related stats
        ]);

        // Setting all your original states (UNCHANGED)
        setAgentsCount(agentsRes.data.count);
        setAdminsCount(adminsRes.data.count);
        setClientsCount(clientsRes.data.count);
        setListingsCount(listingsRes.data.count);
        setPendingListingsCount(pendingListingsRes.data.count);
        setPendingAgentRequestsCount(pendingAgentRequestsRes.data.count);
        setUnderOfferListingsCount(underOfferRes.data.count);
        setSoldListingsCount(soldRes.data.count);
        setClientInquiriesCount(inquiriesRes.data.count);
        setAgentResponsesCount(responsesRes.data.count);
        setAgencyName(agencyDetailsRes.data.name);
        
        // NEW: Setting the new subscription stats state
        setSubscriptionStats({
            activeListings: listingStatsRes.data.activeListings,
            activeFeatured: listingStatsRes.data.activeFeatured
        });

        // Your original activity mapping logic (UNCHANGED)
        const activityData = activityRes.data.activities.map(a => {
          let IconComponent = User; let tag = 'User'; let color = 'gray';
          const message = a.message?.toLowerCase() || ''; const type = a.type?.toLowerCase() || '';
          if (type === 'listing' || message.includes('listing')) { IconComponent = Home; tag = 'Listing'; color = 'green'; }
          else if (type === 'inquiry' || message.includes('inquiry')) { IconComponent = MessageSquare; tag = 'Inquiry'; color = 'blue'; }
          else if (type === 'agent_join' || message.includes('agent joined')) { IconComponent = Briefcase; tag = 'Agent'; color = 'purple'; }
          return { ...a, icon: <IconComponent size={16} />, tag, color, formattedTime: formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }), };
        });
        setRecentActivities(activityData);

      } catch (error) {
        console.error("Error fetching agency admin stats:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            showMessage('Session expired or unauthorized. Please log in again.', 'error');
            navigate('/signin');
        } else {
            showMessage('Failed to load agency dashboard statistics.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    if (agencyId) {
        fetchAgencyStats();
    }

  }, [agencyId, showMessage, navigate, authLoading]); // Added authLoading dependency


  const visibleActivities = showAllActivities ? recentActivities : recentActivities.slice(0, 5);
  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256;

  // NEW: Helper function for star color
  const getStarColor = (subscription) => {
    if (subscription === 'pro') return 'text-purple-500';
    if (subscription === 'enterprise') return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-4 md:px-0 min-h-screen flex flex-col`}>
      {isMobile && (
        <motion.button onClick={() => setIsSidebarOpen(prev => !prev)} className={`fixed top-20 left-4 z-50 p-2 rounded-xl shadow-md h-10 w-10 flex items-center justify-center ${darkMode ? "bg-gray-800" : "bg-white"}`} initial={false} animate={{ rotate: isSidebarOpen ? 180 : 0, opacity: 1 }} transition={{ duration: 0.3 }}>
          <AnimatePresence mode="wait" initial={false}><motion.div key={isSidebarOpen ? 'close' : 'menu'} initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</motion.div></AnimatePresence>
        </motion.button>
      )}
      <AgencyAdminSidebar collapsed={isMobile ? false : isCollapsed} setCollapsed={isMobile ? () => {} : setIsCollapsed} activeSection={activeSection} setActiveSection={setActiveSection} isMobile={isMobile} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} userRole="agency_admin" />
      <motion.div key={isMobile ? 'mobile' : 'desktop'} style={{ marginLeft: contentShift }} animate={{ marginLeft: contentShift }} transition={{ duration: 0.3 }} initial={false} className="pt-6 px-4 md:px-8">
        <div className="md:hidden flex items-center justify-center mb-4"><h1 className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>{agencyName}</h1></div>
        <div className="hidden md:block mb-4"><h1 className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>{agencyName}</h1></div>

        {loading || authLoading ? (
            <AgencyDashboardSkeleton darkMode={darkMode} />
        ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

            {/* --- MODIFIED GRID LAYOUT --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* --- NEW: AGENCY SUBSCRIPTION STATUS CARD --- */}
                

                {/* Your original stat cards now take up the remaining space */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Agency At a Glance</h3>
                        <Briefcase size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                    <StatCard label="Total Listings" value={listingsCount} onClick={goToListings} textCentered={true} icon={<ListChecks size={20} />} />
                    <StatCard label="Pending Listings" value={pendingListingsCount} onClick={goToPendingListings} textCentered={true} icon={<Clock size={20} />} />
                        <StatCard label="Sold" value={soldListingsCount} onClick={goToSoldListings} textCentered={true} icon={<CheckCircle size={20} />} />
                    {/* <StatCard label="Under Offer" value={underOfferListingsCount} onClick={goToUnderOfferListings} textCentered={true} icon={<Clock size={20} />} /> */}
                    <StatCard label="Clients" value={clientsCount} onClick={goToClients} textCentered={true} icon={<UserPlus size={20} />} />
                    <StatCard label="Inquiries" value={clientInquiriesCount} textCentered={true} icon={<MessageSquare size={20} />} />
                        <StatCard label="Pending Agents" value={pendingAgentRequestsCount} onClick={goToPendingAgentRequests} textCentered={true} icon={<UserPlus size={20} />} />
                    
                    <StatCard label="Agents" value={agentsCount} onClick={goToMembersAgents} textCentered={true} icon={<Users size={20} />} />
                        <StatCard label="Admins" value={adminsCount} onClick={goToMembersAdmins} textCentered={true} icon={<UserCog size={20} />} />
                    
                    </div>
                </Card>
                <Card className="lg:col-span-1 flex flex-col">
    <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-semibold ${darkMode ? "text-green-300" : "text-green-600"}`}>Agency Plan</h3>
        <span className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-full ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
            <Star className={`h-4 w-4 mr-2 ${getStarColor(tier)}`} />
            {tierConfig.name}
        </span>
    </div>
    <div className="space-y-3 flex-grow">
        <div>
            <div className="flex justify-between text-sm font-medium mb-1">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Active Listings</span>
                <span>{subscriptionStats.activeListings} / {tierConfig.maxListings === Infinity ? '∞' : tierConfig.maxListings}</span>
            </div>
            <div className={`w-full rounded-full h-2.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min((subscriptionStats.activeListings / tierConfig.maxListings) * 100, 100)}%` }}></div>
            </div>
        </div>
        <div>
            <div className="flex justify-between text-sm font-medium mb-1">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Featured Listings</span>
                <span>{subscriptionStats.activeFeatured} / {tierConfig.maxFeatured}</span>
            </div>
            <div className={`w-full rounded-full h-2.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${Math.min((subscriptionStats.activeFeatured / tierConfig.maxFeatured) * 100, 100)}%` }}></div>
            </div>
        </div>
    </div>
    {tier !== 'enterprise' ? (
        <Link to="/subscriptions" className={`mt-4 w-full text-center py-2 px-4 rounded-lg font-semibold transition-transform duration-200 hover:scale-105 ${darkMode ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            Upgrade Agency Plan
        </Link>
    ) : (
        <Link to="/subscriptions" className={`mt-4 w-full text-center py-2 px-4 rounded-lg font-semibold transition-transform duration-200 hover:scale-105 ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            Manage Plan
        </Link>
    )}
</Card>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Recent Activity Feed (UNCHANGED) */}
                <Card>
                    <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Recent Agency Activity</h2>
                    <ul className={`space-y-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {visibleActivities.length > 0 ? (visibleActivities.map((activity, idx) => (<li key={idx} className="flex items-center justify-between"><div className="flex items-center gap-2 overflow-hidden"><span className={`text-${activity.color}-500 flex-shrink-0`}>{activity.icon}</span><span className="truncate">{activity.message}</span><span className={`text-xs px-2 py-0.5 rounded-full bg-${activity.color}-100 text-${activity.color}-600 flex-shrink-0`}>{activity.tag}</span></div><span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"} flex-shrink-0 ml-2`}>{activity.formattedTime}</span></li>))) : (<p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>No recent activity to display.</p>)}
                    </ul>
                    {recentActivities.length > 5 && ( <div className="mt-4 text-center"><button onClick={() => setShowAllActivities(prev => !prev)} className={`text-sm hover:underline ${darkMode ? "text-green-400" : "text-green-600"}`}>{showAllActivities ? 'Show Less' : 'Show More'}</button></div>)}
                </Card>

                {/* --- NEW: TIERED ANALYTICS CARD --- */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-xl font-semibold ${darkMode ? "text-green-400" : "text-green-700"}`}>Agency Analytics</h2>
                        <BarChart2 size={24} className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    {tier === 'basic' && (
                        <div className="text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                            <Shield size={32} className="mx-auto text-gray-400 mb-2" />
                            <h4 className="font-semibold text-lg">Basic Analytics</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">You have access to basic listing view counts for the agency.</p>
                            <Link to="/subscriptions" className="font-bold text-green-600 dark:text-green-400 hover:underline">Upgrade to Pro for More Insights</Link>
                        </div>
                    )}
                    {tier === 'pro' && (
                        <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
                            <TrendingUp size={32} className="mx-auto text-purple-500 mb-2" />
                            <h4 className="font-semibold text-lg text-purple-800 dark:text-purple-300">Moderate Analytics</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Track overall agency views, inquiries, and agent performance.</p>
                            <Link to="/agency/analytics" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">View Agency Analytics</Link>
                        </div>
                    )}
                    {tier === 'enterprise' && (
                        <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700">
                            <Briefcase size={32} className="mx-auto text-yellow-500 mb-2" />
                            <h4 className="font-semibold text-lg text-yellow-800 dark:text-yellow-300">Advanced Analytics</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Access market heatmaps, lead tracking, and exportable reports.</p>
                            <Link to="/agency/analytics" className="font-bold text-yellow-600 dark:text-yellow-400 hover:underline">Access Advanced Reports</Link>
                        </div>
                    )}
                </Card>
            </div>

            {/* All remaining sections (UNCHANGED) */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Performance Overview</h2>
                    <ul className={`space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}><li className="truncate"><strong>Top Performing Agents:</strong> Identify agents with most listings, sales, or inquiries.</li><li className="truncate"><strong>Listing Performance:</strong> Track views, inquiries, and conversion rates for listings.</li><li className="truncate"><strong>Revenue Projections:</strong> Based on completed sales (requires finance integration).</li><li className="truncate"><strong>Client Acquisition Trends:</strong> Analyze how new clients are joining.</li></ul>
                    <div className="mt-4 text-center"><button onClick={() => showMessage('Feature coming soon!', 'info')} className={`text-sm hover:underline ${darkMode ? "text-green-400" : "text-green-600"}`}>View Detailed Reports</button></div>
                </Card>
                <Card>
                    <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><button onClick={() => navigate('/agency/add-listing')} className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200 ${darkMode ? "bg-green-700 hover:bg-green-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}><Home size={20} /> Add New Listing</button><button onClick={() => navigate('/agency/members')} className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200 ${darkMode ? "bg-blue-700 hover:bg-blue-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}><Users size={20} /> Manage Members</button><button onClick={() => navigate('/agency/settings')} className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200 ${darkMode ? "bg-purple-700 hover:bg-purple-600 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}><Settings size={20} /> Agency Settings</button><button onClick={() => showMessage('Reporting feature under development!', 'info')} className={`flex items-center justify-center gap-2 p-3 rounded-lg shadow-md transition-all duration-200 ${darkMode ? "bg-yellow-700 hover:bg-yellow-600 text-white" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}><BarChart2 size={20} /> Generate Report</button></div>
                </Card>
            </div>
            <div className="mt-10">
                <Card>
                    <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-green-400" : "text-green-700"}`}>Financial Snapshot</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"><StatCard label="Revenue (YTD)" value="$XX,XXX" icon={<DollarSign size={20} />} /><StatCard label="Pending Commissions" value="$X,XXX" icon={<DollarSign size={20} />} /><StatCard label="Marketing Spend" value="$X,XXX" icon={<DollarSign size={20} />} /></div>
                    <p className={`mt-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>*Financial data is illustrative. Full integration with accounting systems coming soon.</p>
                </Card>
            </div>
            </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AgencyDashboard;
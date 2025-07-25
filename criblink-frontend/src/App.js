import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect } from 'react';
import socket from './socket';

// Wrappers
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ProtectedBaseRoute from "./components/ProtectedBaseRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MainLayout from "./layouts/MainLayout";
import AppShell from "./layouts/AppShell"; // AppShell provides ThemeContext
import ScrollToTop from "./components/ScrollToTop";

// Global Messaging
import { MessageProvider } from "./context/MessageContext";
import GlobalMessageToasts from "./components/GlobalMessageToasts";

// Confirmation Dialog
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import ConfirmDialog from "./components/ConfirmDialog";

// Axios Interceptor
import AxiosErrorInterceptor from './components/AxiosErrorInterceptor';
import { setLoadingFunctions } from './api/axiosInstance'; // Import the function to set loading functions

// Authentication Context
import { AuthProvider } from './context/AuthContext';

// Loading Context and Spinner
import { LoadingProvider, useLoading } from './context/LoadingContext'; // Import LoadingProvider and useLoading
import LoadingSpinner from './components/LoadingSpinner'; // Import LoadingSpinner

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminListings from './pages/admin/Listings';
import AdminStaff from './pages/admin/Staff';
import AdminUsers from './pages/admin/Users';
import AdminAnalytics from "./pages/admin/Analytics";
import AgentPerformance from './pages/admin/AgentPerformance';
import AdminSettings from './pages/admin/Settings';
import LegalDocumentsAdmin from "./pages/admin/LegalDocuments"; // Import Admin's LegalDocuments

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
import AgentListings from './pages/agent/Listings';
import Clients from './pages/agent/Clients';
import ClientProfile from './pages/agent/ClientProfile';
import AgentInquiries from './pages/agent/AgentInquiries';
import Archive from './pages/agent/Archive'; // Renamed from ArchivedClients to Archive
import AgentSettings from './pages/agent/Settings';
import LegalDocumentsAgent from "./pages/agent/LegalDocuments"; // NEW: Import Agent's LegalDocuments

// Client Pages
import ClientInquiries from "./pages/client/ClientInquiries";
import ClientSettings from "./pages/client/Settings";
import AgentProfile from "./pages/client/AgentProfile";

// Pages (Common, Public, or Specific)
import Home from "./pages/Home";
import AddListing from "./pages/AddListing";
import EditListing from './pages/EditListing';
import ListingDetails from "./pages/ListingDetails";
import Favourites from "./pages/Favourites";
import SearchPage from "./pages/SearchPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import SelectRole from "./pages/SelectRole";
import ManageProfile from "./pages/ManageProfile";
import General from './pages/profile/General';
import Security from './pages/profile/Security';
import Privacy from './pages/profile/Privacy';
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import ResetPassword from "./pages/ResetPassword";
import NotFoundPage from "./pages/NotFoundPage";
// NEW: Agencies Page
import Agencies from "./pages/Agencies";
// NEW: AgencyProfile Page
import AgencyProfile from "./pages/AgencyProfile"; // Import AgencyProfile

// NEW: Import AddLegalDocument component (shared between admin and agent)
import AddLegalDocument from "./pages/AddLegalDocument";

// NEW: Agency Admin Pages
import AgencyAdminDashboard from './pages/agencyadmin/AgencyDashboard'; // NEW: Import AgencyAdminDashboard
import AgencyAdminListings from './pages/agencyadmin/Listings'; // NEW: Import AgencyAdminListings
import Members from './pages/agencyadmin/Members'; // Renamed from Agents
// import AgencyAdminProperties from './pages/agencyadmin/Properties';
import AgencyAdminSettings from './pages/agencyadmin/Settings';
import AgencyAdminProfile from './pages/agencyadmin/AgencyAdminProfile'; // Import the new AgencyAdminProfile component
import AgencyInquiries from './pages/agencyadmin/AgencyInquiries'; // NEW: Import AgencyInquiries


// Define routes for each role
const listingRoutes = [
  { path: "add-listing", element: <AddListing /> },
];

const adminRoutes = [
  { path: "dashboard", element: <AdminDashboard /> },
  { path: "listings", element: <AdminListings /> },
  { path: "staff", element: <AdminStaff /> },
  { path: "users", element: <AdminUsers /> },
  { path: "analytics", element: <AdminAnalytics /> },
  { path: "agent-performance", element: <AgentPerformance /> },
  { path: "settings", element: <AdminSettings /> },
  { path: "add-document", element: <AddLegalDocument /> },
  { path: "documents", element: <LegalDocumentsAdmin /> }, // Admin's Legal Documents list
  ...listingRoutes
];

const agentRoutes = [
  { path: "dashboard", element: <AgentDashboard /> },
  { path: "listings", element: <AgentListings /> },
  { path: "clients", element: <Clients /> },
  { path: "client-profile/:clientId", element: <ClientProfile /> },
  { path: "inquiries", element: <AgentInquiries /> },
  { path: "archive", element: <Archive /> }, // Updated route to "archive"
  { path: "settings", element: <AgentSettings /> },
  { path: "add-document", element: <AddLegalDocument /> },
  { path: "documents", element: <LegalDocumentsAgent /> }, // NEW: Agent's Legal Documents list
  ...listingRoutes
];

const clientRoutes = [
  { path: "inquiries", element: <ClientInquiries /> },
  { path: "settings", element: <ClientSettings /> },
  { path: "agent-profile/:agentId", element: <AgentProfile /> },
];

// NEW: Agency Admin Routes
const agencyAdminRoutes = [
  { path: "dashboard", element: <AgencyAdminDashboard /> }, // NEW: Added AgencyAdminDashboard route
  { path: "listings", element: <AgencyAdminListings /> }, // NEW: Added AgencyAdminListings route
  { path: "members", element: <Members /> }, // Updated to Members
  { path: "clients", element: <Clients /> }, // NEW: Added Clients route for agency admin
  { path: "client-profile/:clientId", element: <ClientProfile /> }, // NEW: Added ClientProfile route for agency admin
  { path: "inquiries", element: <AgencyInquiries /> }, // NEW: Added AgencyInquiries route
  // { path: "properties", element: <AgencyAdminProperties /> },
  { path: "settings", element: <AgencyAdminSettings /> },
  { path: "add-listing", element: <AddListing /> }, // Added AddListing for agency admin
  { path: "edit-listing/:id", element: <EditListing /> }, // Added EditListing for agency admin
];


// AppContent is now a component that uses useLoading, and will be rendered inside LoadingProvider
function AppContent() {
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    // Set the loading functions for Axios instance
    setLoadingFunctions(showLoading, hideLoading);

    // Connect the socket when the component mounts
    if (!socket.connected) {
      socket.connect();
      console.log('App.js: Socket connecting globally...');
    }

    // Add listeners for global connection status for debugging
    socket.on('connect', () => {
      console.log('App.js: Global Socket connected successfully!');
    });

    socket.on('disconnect', (reason) => {
      console.log('App.js: Global Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('App.js: Global Socket connection error:', error);
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      if (socket.connected) {
        socket.disconnect();
        console.log('App.js: Global Socket disconnected on App unmount.');
      }
      // Remove listeners to prevent memory leaks
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [showLoading, hideLoading]); // Add showLoading and hideLoading to dependencies

  return (
    <> {/* No AppShell here, as it's now higher up in the App component */}
      <Header />
      <main className="pt-[96px] min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Routes>
          {/* Public & shared pages */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
            <Route path="*" element={<NotFoundPage />} />
            {/* NEW: Agency Profile page accessible to all users */}
            <Route path="/agencies/:id" element={<AgencyProfile />} />
            {/* NEW: Agencies page accessible to all users */}
            <Route path="/agencies" element={<Agencies />} />
          </Route>

          {/* Authenticated base user routes */}
          <Route element={<ProtectedBaseRoute />}>
            <Route path="profile" element={<ManageProfile />}>
              <Route index element={<Navigate to="general" replace />} />
              <Route path="general" element={<General />} />
              <Route path="security" element={<Security />} />
              <Route path="privacy" element={<Privacy />} />
            </Route>
            <Route path="favourites" element={<Favourites />} />
            {/* Removed direct edit-listing route here as it's now handled within role-specific routes */}
            {/* Agent Profile page accessible to clients, agency_admins, and agents */}
            <Route path="/agent-profile/:agentId" element={<RoleProtectedRoute allowedRole={["client", "agency_admin", "agent"]} />}>
              <Route index element={<AgentProfile />} />
            </Route>

            {/* NEW: Agency Admin Profile page accessible to agency_admin, agents, and admin */}
            <Route path="/agency-admin-profile/:adminId" element={<RoleProtectedRoute allowedRole={["agency_admin", "agent", "admin"]} />}>
              <Route index element={<AgencyAdminProfile />} />
            </Route>
          </Route>

          {/* Role-protected routes */}
          <Route path="/admin" element={<RoleProtectedRoute allowedRole="admin" />}>
            {adminRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>

          <Route path="/agent" element={<RoleProtectedRoute allowedRole="agent" />}>
            {agentRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>

          <Route path="/client" element={<RoleProtectedRoute allowedRole="client" />}>
            {clientRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>

          {/* NEW: Agency Admin Routes */}
          <Route path="/agency" element={<RoleProtectedRoute allowedRole="agency_admin" />}>
            {agencyAdminRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>

        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <MessageProvider>
          <ConfirmDialogProvider>
            <GlobalMessageToasts />
            <ConfirmDialog />
            <AxiosErrorInterceptor>
              {/* AppShell now wraps LoadingProvider to ensure ThemeContext is available */}
              <AppShell>
                <LoadingProvider>
                  <AppContent />
                  <LoadingSpinner /> {/* LoadingSpinner now has access to ThemeContext */}
                </LoadingProvider>
              </AppShell>
            </AxiosErrorInterceptor>
          </ConfirmDialogProvider>
        </MessageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

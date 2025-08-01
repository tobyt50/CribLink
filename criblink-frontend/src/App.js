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
// import AdminListings from './pages/admin/Listings'; // REMOVED: Centralized Listings
import AdminStaff from './pages/admin/Staff';
import AdminUsers from './pages/admin/Users';
import AdminAnalytics from "./pages/admin/Analytics";
import AgentPerformance from './pages/admin/AgentPerformance';
import AdminSettings from './pages/admin/Settings';
// REMOVED: import LegalDocumentsAdmin from "./pages/admin/LegalDocuments";

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
// import AgentListings from './pages/agent/Listings'; // REMOVED: Centralized Listings
import Clients from './pages/agent/Clients';
import ClientProfile from './pages/agent/ClientProfile';
import AgentInquiries from './pages/agent/AgentInquiries';
import Archive from './pages/agent/Archive'; // Renamed from ArchivedClients to Archive
import AgentSettings from './pages/agent/Settings';
// REMOVED: import LegalDocumentsAgent from "./pages/agent/LegalDocuments";

// Client Pages
import ClientDashboard from './pages/client/Dashboard'; // NEW: Import ClientDashboard
import ClientInquiries from "./pages/client/ClientInquiries";
import ClientSettings from "./pages/client/Settings";
import AgentProfile from "./pages/client/AgentProfile";
import Agents from './pages/client/Agents'; // NEW: Import Agents page for clients

// Pages (Common, Public, or Specific)
import Home from "./pages/Home";
import AddListing from "./pages/AddListing";
import EditListing from "./pages/EditListing";
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

// NEW: Import AddLegalDocument component (shared between admin and agency admin)
import AddLegalDocument from "./pages/AddLegalDocument";
// NEW: Import LegalDocuments component (shared between admin and agency admin)
import LegalDocuments from "./pages/LegalDocuments";

// NEW: Agency Admin Pages
import AgencyAdminDashboard from './pages/agencyadmin/AgencyDashboard'; // NEW: Import AgencyAdminDashboard
// import AgencyAdminListings from './pages/agencyadmin/Listings'; // REMOVED: Centralized Listings
import Members from './pages/agencyadmin/Members'; // Renamed from Agents
// import AgencyAdminProperties from './pages/agencyadmin/Properties';
import AgencyAdminSettings from './pages/agencyadmin/Settings';
import AgencyAdminProfile from './pages/agencyadmin/AgencyAdminProfile'; // Import the new AgencyAdminProfile component
import AgencyInquiries from './pages/agencyadmin/AgencyInquiries'; // NEW: Import AgencyInquiries

// CENTRALIZED LISTINGS PAGE
import Listings from './pages/Listings';


// Define routes for each role
const listingRoutes = [
  { path: "add-listing", element: <AddListing /> },
  { path: "edit-listing/:id", element: <EditListing /> }, // Added edit-listing here
];

const adminRoutes = [
  { path: "dashboard", element: <AdminDashboard /> },
  { path: "listings", element: <Listings /> }, // Point to centralized Listings
  { path: "staff", element: <AdminStaff /> },
  { path: "users", element: <AdminUsers /> },
  { path: "analytics", element: <AdminAnalytics /> },
  { path: "agent-performance", element: <AgentPerformance /> },
  { path: "settings", element: <AdminSettings /> },
  ...listingRoutes
];

const agentRoutes = [
  { path: "dashboard", element: <AgentDashboard /> },
  { path: "listings", element: <Listings /> }, // Point to centralized Listings
  { path: "clients", element: <Clients /> },
  { path: "client-profile/:clientId", element: <ClientProfile /> },
  { path: "inquiries", element: <AgentInquiries /> },
  { path: "archive", element: <Archive /> }, // Updated route to "archive"
  { path: "settings", element: <AgentSettings /> },
  ...listingRoutes
];

const clientRoutes = [
  { path: "dashboard", element: <ClientDashboard /> }, // NEW: Added ClientDashboard route
  { path: "inquiries", element: <ClientInquiries /> },
  { path: "settings", element: <ClientSettings /> },
  { path: "agent-profile/:agentId", element: <AgentProfile /> },
  { path: "agents", element: <Agents /> }, // NEW: Added Agents page for clients
];

// NEW: Agency Admin Routes
const agencyAdminRoutes = [
  { path: "dashboard", element: <AgencyAdminDashboard /> }, // NEW: Added AgencyAdminDashboard route
  { path: "listings", element: <Listings /> }, // Point to centralized Listings
  { path: "members", element: <Members /> }, // Updated to Members
  { path: "clients", element: <Clients /> }, // NEW: Added Clients route for agency admin
  { path: "client-profile/:clientId", element: <ClientProfile /> }, // NEW: Added ClientProfile route for agency admin
  { path: "inquiries", element: <AgencyInquiries /> }, // NEW: Import AgencyInquiries
  // { path: "properties", element: <AgencyAdminProperties /> },
  { path: "settings", element: <AgencyAdminSettings /> },
  ...listingRoutes // Add common listing routes
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

            {/* SHARED Legal Document Routes for Admin and Agency Admin */}
            <Route path="/documents" element={<RoleProtectedRoute allowedRole={["admin", "agency_admin"]} />}>
                <Route index element={<LegalDocuments />} />
                <Route path="add" element={<AddLegalDocument />} /> {/* Use a nested path like /documents/add */}
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

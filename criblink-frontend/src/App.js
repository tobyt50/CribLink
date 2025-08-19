import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { useEffect } from 'react';
import socket from './socket';

// Wrappers
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ProtectedBaseRoute from "./components/ProtectedBaseRoute";
import Header from "./components/Header";
import MainLayout from "./layouts/MainLayout";
import AppShell from "./layouts/AppShell";
import ScrollToTop from "./components/ScrollToTop";

// Global Messaging
import { MessageProvider } from "./context/MessageContext";
import GlobalMessageToasts from "./components/GlobalMessageToasts";

// Confirmation Dialog
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import ConfirmDialog from "./components/ConfirmDialog";

// Axios Interceptor
import AxiosErrorInterceptor from './components/AxiosErrorInterceptor';

// Authentication Context
import { AuthProvider } from './context/AuthContext';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStaff from './pages/admin/Staff';
import AdminUsers from './pages/admin/Users';
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from './pages/admin/Settings';

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
import Clients from './pages/agent/Clients';
import ClientProfile from './pages/agent/ClientProfile';
import AgentInquiries from './pages/agent/AgentInquiries';
import Archive from './pages/agent/Archive';
import AgentSettings from './pages/agent/Settings';

// Client Pages
import ClientDashboard from "./pages/client/Dashboard";
import ClientInquiries from "./pages/client/ClientInquiries";
import ClientSettings from "./pages/client/Settings";
import AgentProfile from "./pages/client/AgentProfile";
import Agents from "./pages/client/Agents";

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
import Agencies from "./pages/Agencies";
import AgencyProfile from "./pages/AgencyProfile";
import Subscriptions from "./pages/Subscriptions";
import Checkout from "./pages/Checkout";

// NEW: Import AddLegalDocument component (shared between admin and agency admin)
import AddLegalDocument from "./pages/AddLegalDocument";
// NEW: Import LegalDocuments component (shared between admin and agency admin)
import LegalDocuments from "./pages/LegalDocuments";

// NEW: Agency Admin Pages
import AgencyAdminDashboard from './pages/agencyadmin/AgencyDashboard';
import Members from './pages/agencyadmin/Members';
import AgencyAdminSettings from './pages/agencyadmin/Settings';
import AgencyAdminProfile from './pages/agencyadmin/AgencyAdminProfile';
import AgentPerformance from './pages/agencyadmin/AgentPerformance';
import AgencyInquiries from './pages/agencyadmin/AgencyInquiries';

// CENTRALIZED LISTINGS PAGE
import Listings from './pages/Listings';

function AppContent() {
  const location = useLocation();

  // Routes that get smaller header offset (50px instead of 96px)
  const smallerHeaderOffsetRoutes = ["/subscriptions", "/subscriptions/checkout", "/some-other-page"];
  // Compute padding class conditionally
  const headerPaddingClass = smallerHeaderOffsetRoutes.includes(location.pathname) ? "pt-[56px]" : "pt-[96px]";

  // Define routes for each role
  const listingRoutes = [
    { path: "add-listing", element: <AddListing /> },
    { path: "edit-listing/:id", element: <EditListing /> },
  ];

  const adminRoutes = [
    { path: "dashboard", element: <AdminDashboard /> },
    { path: "listings", element: <Listings /> },
    { path: "staff", element: <AdminStaff /> },
    { path: "users", element: <AdminUsers /> },
    { path: "analytics", element: <AdminAnalytics /> },
    { path: "settings", element: <AdminSettings /> },
    { path: "agencies/:agencyId/members", element: <Members /> },
    ...listingRoutes
  ];

  const agentRoutes = [
    { path: "dashboard", element: <AgentDashboard /> },
    { path: "listings", element: <Listings /> },
    { path: "clients", element: <Clients /> },
    { path: "client-profile/:clientId", element: <ClientProfile /> },
    { path: "inquiries", element: <AgentInquiries /> },
    { path: "archive", element: <Archive /> },
    { path: "settings", element: <AgentSettings /> },
    ...listingRoutes
  ];

  const clientRoutes = [
    { path: "dashboard", element: <ClientDashboard /> },
    { path: "inquiries", element: <ClientInquiries /> },
    { path: "settings", element: <ClientSettings /> },
    { path: "agent-profile/:agentId", element: <AgentProfile /> },
    { path: "agents", element: <Agents /> },
  ];

  const agencyAdminRoutes = [
    { path: "dashboard", element: <AgencyAdminDashboard /> },
    { path: "listings", element: <Listings /> },
    { path: "members", element: <Members /> },
    { path: "clients", element: <Clients /> },
    { path: "client-profile/:clientId", element: <ClientProfile /> },
    { path: "agent-performance", element: <AgentPerformance /> },
    { path: "inquiries", element: <AgencyInquiries /> },
    { path: "settings", element: <AgencyAdminSettings /> },
    ...listingRoutes
  ];

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
      console.log('App.js: Socket connecting globally...');
    }

    socket.on('connect', () => {
      console.log('App.js: Global Socket connected successfully!');
    });

    socket.on('disconnect', (reason) => {
      console.log('App.js: Global Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('App.js: Global Socket connection error:', error);
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
        console.log('App.js: Global Socket disconnected on App unmount.');
      }
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, []);

  return (
    <>
      <Header />
      <main className={`${headerPaddingClass} min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
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
            <Route path="/agencies/:id" element={<AgencyProfile />} />
            <Route path="/agencies" element={<Agencies />} />
            <Route path="/listings/agency/:agencyId" element={<Listings />} />
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
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="/subscriptions/checkout" element={<Checkout />} />

            <Route path="/client-profile/:clientId" element={<RoleProtectedRoute allowedRole={["agency_admin", "agent", "admin"]} />}>
              <Route index element={<ClientProfile />} />
            </Route>

            <Route path="/agent-profile/:agentId" element={<RoleProtectedRoute allowedRole={["client", "agency_admin", "agent", "admin"]} />}>
              <Route index element={<AgentProfile />} />
            </Route>

            <Route path="/agency-admin-profile/:adminId" element={<RoleProtectedRoute allowedRole={["agency_admin", "agent", "admin"]} />}>
              <Route index element={<AgencyAdminProfile />} />
            </Route>

            {/* Legal Document Routes */}
            <Route path="/documents" element={<RoleProtectedRoute allowedRole={["admin", "agency_admin"]} />}>
              <Route index element={<LegalDocuments />} />
              <Route path="add" element={<AddLegalDocument />} />
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

          <Route path="/agency" element={<RoleProtectedRoute allowedRole={["agency_admin", "admin"]} />}>
            {agencyAdminRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <MessageProvider>
          <ConfirmDialogProvider>
            <GlobalMessageToasts />
            <ConfirmDialog />
            <AxiosErrorInterceptor>
              <AppShell>
                <AppContent />
              </AppShell>
            </AxiosErrorInterceptor>
          </ConfirmDialogProvider>
        </MessageProvider>
      </AuthProvider>
    </Router>
  );
}

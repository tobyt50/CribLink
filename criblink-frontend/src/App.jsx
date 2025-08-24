import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import React, { useEffect } from "react";
import socket from "./socket";

// Wrappers
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ProtectedBaseRoute from "./components/ProtectedBaseRoute";
import Header from "./components/Header";
import MainLayout from "./layouts/MainLayout";
import AppShell from "./layouts/AppShell";
import ScrollToTop from "./components/ScrollToTop";

// Global Messaging & Contexts
import { MessageProvider } from "./context/MessageContext";
import GlobalMessageToasts from "./components/GlobalMessageToasts";
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import ConfirmDialog from "./components/ConfirmDialog";
import AxiosErrorInterceptor from "./components/AxiosErrorInterceptor";
import { AuthProvider } from "./context/AuthContext";

// --- NEW UNIFIED SETTINGS COMPONENT ---
import Settings from "./pages/settings/Settings";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStaff from "./pages/admin/Staff";
import AdminUsers from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";

// Agent Pages
import AgentDashboard from "./pages/agent/Dashboard";
import Clients from "./pages/agent/Clients";
import ClientProfile from "./pages/agent/ClientProfile";
import AgentInquiries from "./pages/agent/AgentInquiries";
import Archive from "./pages/agent/Archive";

// Client Pages
import ClientDashboard from "./pages/client/Dashboard";
import ClientInquiries from "./pages/client/ClientInquiries";
import AgentProfile from "./pages/client/AgentProfile";
import Agents from "./pages/client/Agents";

// Common/Public Pages
import Home from "./pages/Home";
import AddListing from "./pages/AddListing";
import EditListing from "./pages/EditListing";
import ListingDetails from "./pages/ListingDetails";
import Favourites from "./pages/Favourites";
import SearchPage from "./pages/SearchPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import SelectRole from "./pages/SelectRole";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import ResetPassword from "./pages/ResetPassword";
import NotFoundPage from "./pages/NotFoundPage";
import Agencies from "./pages/Agencies";
import AgencyProfile from "./pages/AgencyProfile";
import Subscriptions from "./pages/Subscriptions";
import Checkout from "./pages/Checkout";
import AddLegalDocument from "./pages/AddLegalDocument";
import LegalDocuments from "./pages/LegalDocuments";

// Agency Pages
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import AgencyMembers from "./pages/agency/AgencyMembers";
import AgencyAdminProfile from "./pages/agency/AgencyAdminProfile";
import AgentPerformance from "./pages/agency/AgentPerformance";
import AgencyInquiries from "./pages/agency/AgencyInquiries";
import AgencyAnalytics from "./pages/agency/AgencyAnalytics";

// CENTRALIZED LISTINGS PAGE
import Listings from "./pages/Listings";

function AppContent() {
  const location = useLocation();
  const smallerHeaderOffsetRoutes = [
    "/subscriptions",
    "/subscriptions/checkout",
  ];
  const headerPaddingClass = smallerHeaderOffsetRoutes.includes(
    location.pathname,
  )
    ? "pt-[56px]"
    : "pt-[96px]";

  // Define routes for each role (settings removed from here)
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
    { path: "agencies/:agencyId/members", element: <AgencyMembers /> },
    ...listingRoutes,
  ];

  const agentRoutes = [
    { path: "dashboard", element: <AgentDashboard /> },
    { path: "listings", element: <Listings /> },
    { path: "clients", element: <Clients /> },
    { path: "client-profile/:clientId", element: <ClientProfile /> },
    { path: "inquiries", element: <AgentInquiries /> },
    { path: "archive", element: <Archive /> },
    ...listingRoutes,
  ];

  const clientRoutes = [
    { path: "dashboard", element: <ClientDashboard /> },
    { path: "inquiries", element: <ClientInquiries /> },
    { path: "agent-profile/:agentId", element: <AgentProfile /> },
    { path: "agents", element: <Agents /> },
  ];

  const agencyRoutes = [
    { path: "dashboard", element: <AgencyDashboard /> },
    { path: "listings", element: <Listings /> },
    { path: "members", element: <AgencyMembers /> },
    { path: "clients", element: <Clients /> },
    { path: "client-profile/:clientId", element: <ClientProfile /> },
    { path: "agent-performance", element: <AgentPerformance /> },
    { path: "inquiries", element: <AgencyInquiries /> },
    { path: "analytics", element: <AgencyAnalytics /> },
    ...listingRoutes,
  ];

  useEffect(() => {
    // Socket connection logic remains the same
    if (!socket.connected) {
      socket.connect();
    }
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <>
      <Header />
      <main
        className={`${headerPaddingClass} min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}
      >
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
            <Route path="/agencies/:id" element={<AgencyProfile />} />
            <Route path="/agencies" element={<Agencies />} />
            <Route path="/listings/agency/:agencyId" element={<Listings />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Authenticated base user routes */}
          <Route element={<ProtectedBaseRoute />}>
            {/* --- UNIFIED SETTINGS ROUTE --- */}
            <Route path="settings" element={<Settings />} />

            {/* Other authenticated routes */}
            <Route path="favourites" element={<Favourites />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="/subscriptions/checkout" element={<Checkout />} />

            <Route
              path="/client-profile/:clientId"
              element={
                <RoleProtectedRoute
                  allowedRole={["agency_admin", "agent", "admin"]}
                />
              }
            >
              <Route index element={<ClientProfile />} />
            </Route>
            <Route
              path="/agent-profile/:agentId"
              element={
                <RoleProtectedRoute
                  allowedRole={["client", "agency_admin", "agent", "admin"]}
                />
              }
            >
              <Route index element={<AgentProfile />} />
            </Route>
            <Route
              path="/agency-admin-profile/:adminId"
              element={
                <RoleProtectedRoute
                  allowedRole={["agency_admin", "agent", "admin"]}
                />
              }
            >
              <Route index element={<AgencyAdminProfile />} />
            </Route>
            <Route
              path="/documents"
              element={
                <RoleProtectedRoute allowedRole={["admin", "agency_admin"]} />
              }
            >
              <Route index element={<LegalDocuments />} />
              <Route path="add" element={<AddLegalDocument />} />
            </Route>
          </Route>

          {/* Role-protected routes */}
          <Route
            path="/admin"
            element={<RoleProtectedRoute allowedRole="admin" />}
          >
            {adminRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
          <Route
            path="/agent"
            element={<RoleProtectedRoute allowedRole="agent" />}
          >
            {agentRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
          <Route
            path="/client"
            element={<RoleProtectedRoute allowedRole="client" />}
          >
            {clientRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
          <Route
            path="/agency"
            element={
              <RoleProtectedRoute allowedRole={["agency_admin", "admin"]} />
            }
          >
            {agencyRoutes.map(({ path, element }) => (
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

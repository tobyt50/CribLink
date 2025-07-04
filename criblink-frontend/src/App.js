import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect } from 'react'; // Import useEffect
import socket from './socket'; // Import your socket instance

// Wrappers
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ProtectedBaseRoute from "./components/ProtectedBaseRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
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
import AdminListings from './pages/admin/Listings';
import AdminStaff from './pages/admin/Staff';
import AdminUsers from './pages/admin/Users';
import AdminAnalytics from "./pages/admin/Analytics";
import AgentPerformance from './pages/admin/AgentPerformance';
import AdminSettings from "./pages/admin/Settings";

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
import AgentListings from './pages/agent/Listings';
import Clients from './pages/agent/Clients';
import ClientProfile from './pages/agent/ClientProfile';
import AgentInquiries from './pages/agent/AgentInquiries';
import ArchivedClients from './pages/agent/ArchivedClients';
import AgentSettings from './pages/agent/Settings';

// Client Pages
import ClientInquiries from "./pages/client/ClientInquiries";
import ClientSettings from "./pages/client/Settings";
import AgentProfile from "./pages/client/AgentProfile"; // Keep this import for the component

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
import Settings from './pages/profile/Settings';
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import ResetPassword from "./pages/ResetPassword";
import NotFoundPage from "./pages/NotFoundPage";

// --- Route Config Arrays ---
const listingRoutes = [
  { path: "add-listing", element: <AddListing /> },
  // Removed "edit-listing/:id" from here
];

const adminRoutes = [
  { path: "dashboard", element: <AdminDashboard /> },
  { path: "listings", element: <AdminListings /> },
  { path: "staff", element: <AdminStaff /> },
  { path: "users", element: <AdminUsers /> },
  { path: "analytics", element: <AdminAnalytics /> },
  { path: "agent-performance", element: <AgentPerformance /> },
  { path: "settings", element: <AdminSettings /> },
  ...listingRoutes // AddListing will still be under /admin/add-listing
];

const agentRoutes = [
  { path: "dashboard", element: <AgentDashboard /> },
  { path: "listings", element: <AgentListings /> },
  { path: "clients", element: <Clients /> },
  { path: "client-profile/:clientId", element: <ClientProfile /> },
  { path: "inquiries", element: <AgentInquiries /> },
  { path: "archived-clients", element: <ArchivedClients /> },
  { path: "settings", element: <AgentSettings /> },
  ...listingRoutes // AddListing will still be under /agent/add-listing
];

const clientRoutes = [
  { path: "inquiries", element: <ClientInquiries /> },
  { path: "settings", element: <ClientSettings /> },
  { path: "agent-profile/:agentId", element: <AgentProfile /> },
  // No listingRoutes here as clients don't add/edit listings
];

function App() {
  useEffect(() => {
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
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleanup on unmount


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
                    </Route>

                    {/* Authenticated base user routes */}
                    <Route element={<ProtectedBaseRoute />}>
                      <Route path="profile" element={<ManageProfile />}>
                        <Route index element={<Navigate to="general" replace />} />
                        <Route path="general" element={<General />} />
                        <Route path="security" element={<Security />} />
                        <Route path="privacy" element={<Privacy />} />
                        <Route path="settings" element={<Settings />} />
                      </Route>
                      <Route path="favourites" element={<Favourites />} />
                      {/* NEW: Top-level route for editing listings, protected by role */}
                      <Route path="edit-listing/:id" element={<RoleProtectedRoute allowedRole={["admin", "agent"]} />}>
                        <Route index element={<EditListing />} />
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
                  </Routes>
                </main>
              </AppShell>
            </AxiosErrorInterceptor>
          </ConfirmDialogProvider>
        </MessageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

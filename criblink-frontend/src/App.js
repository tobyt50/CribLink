import React from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Wrappers
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import ProtectedAgentRoute from "./components/agent/ProtectedAgentRoute";
import ProtectedClientRoute from "./components/client/ProtectedClientRoute";
import Header from "./components/Header";
import MainLayout from "./layouts/MainLayout";
import AppShell from "./layouts/AppShell";

// Global Messaging
import { MessageProvider } from "./context/MessageContext";
import GlobalMessageToasts from "./components/GlobalMessageToasts";

// Confirmation Dialog
import { ConfirmDialogProvider } from "./context/ConfirmDialogContext";
import ConfirmDialog from "./components/ConfirmDialog";

// Axios Interceptor
import AxiosErrorInterceptor from './components/AxiosErrorInterceptor';

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
import AgentInquiries from './pages/agent/Inquiries';
import ArchivedClients from './pages/agent/ArchivedClients';
import AgentSettings from './pages/agent/Settings';

// Client Pages
import ClientInquiries from "./pages/client/Inquiries";
import ClientSettings from "./pages/client/Settings";

// Pages
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
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Router>
      <MessageProvider>
        <ConfirmDialogProvider>
          <GlobalMessageToasts />
          <ConfirmDialog />
          <AxiosErrorInterceptor>
            <AppShell>
              <Header />
              <main className="pt-[96px] min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<ContactUs />} />
                  </Route>
                  {/* Major Routes */}
                  <Route path="/add-listing" element={<AddListing />} />
                  <Route path="/edit-listing/:id" element={<EditListing />} />
                  <Route path="/listings/:id" element={<ListingDetails />} />
                  <Route path="/favourites" element={<Favourites />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/select-role" element={<SelectRole />} />
                  <Route path="/profile" element={<ManageProfile />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedAdminRoute />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="listings" element={<AdminListings />} />
                    <Route path="staff" element={<AdminStaff />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="agent-performance" element={<AgentPerformance />} />
                    <Route path="settings" element={<AdminSettings/> } />
                  </Route>
                  {/* Agent Routes */}
                  <Route path="/agent" element={<ProtectedAgentRoute />}>
                    <Route path="dashboard" element={<AgentDashboard />} />
                    <Route path="listings" element={<AgentListings />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="client-profile/:clientId" element={<ClientProfile />} />
                    <Route path="inquiries" element={<AgentInquiries />} />
                    <Route path="archived-clients" element={<ArchivedClients />} />
                    <Route path="settings" element={<AgentSettings />} />
                  </Route>
                  {/* Client Routes */}
                  <Route path="/client" element={<ProtectedClientRoute />}>
                    <Route path="inquiries" element={<ClientInquiries />} />
                    <Route path="settings" element={<ClientSettings />} />
                  </Route>
                </Routes>
              </main>
            </AppShell>
          </AxiosErrorInterceptor>
        </ConfirmDialogProvider>
      </MessageProvider>
    </Router>
  );
}

export default App;

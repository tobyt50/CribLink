import React from "react";
import '@fortawesome/fontawesome-free/css/all.min.css'; // Ensure this package is installed via npm or yarn
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute"; // Verify this path
import Header from "./components/Header"; // Verify this path
import MainLayout from "./layouts/MainLayout"; // Verify this path
import AppShell from "./layouts/AppShell"; // ✅ Verify this path

import Home from "./pages/Home"; // Verify this path
import AddListing from "./pages/AddListing"; // Verify this path
import ListingDetails from "./pages/ListingDetails"; // Verify this path
import SearchPage from "./pages/SearchPage"; // Verify this path
import SignIn from "./pages/SignIn"; // Verify this path
import SignUp from "./pages/SignUp"; // Verify this path
import SelectRole from "./pages/SelectRole"; // Verify this path
import ManageProfile from "./pages/ManageProfile"; // Verify this path
import AboutUs from "./pages/AboutUs"; // Verify this path
import ContactUs from "./pages/ContactUs"; // Verify this path
import ResetPassword from "./pages/ResetPassword"; // Verify this path
import Favourites from "./pages/client/Favourites";

import AgentDashboard from './pages/agent/Dashboard'; // Verify this path
import AgentListings from './pages/agent/Listings'; // Verify this path
import Clients from './pages/agent/Clients'; // Verify this path
import ClientProfile from './pages/agent/ClientProfile'; // Verify this path
import Inquiries from './pages/agent/Inquiries';
import ArchivedClients from './pages/agent/ArchivedClients'; // Verify this path

import AdminDashboard from './pages/admin/Dashboard'; // Verify this path
import AdminListings from './pages/admin/Listings'; // Verify this path
import AdminStaff from './pages/admin/Staff'; // Verify this path
import AdminUsers from './pages/admin/Users'; // Verify this path
import AdminAnalytics from "./pages/admin/Analytics"; // Verify this path
import AgentPerformance from './pages/admin/AgentPerformance'; // Verify this path

import EditListing from './pages/EditListing'; // Verify this path

function App() {
  return (
    <Router>
      <AppShell> {/* ✅ wrap entire app in dark mode logic */}
        <Header /> {/* Header is global, so it stays here */}
        {/* The main content area. Its background and text colors are controlled by AppShell. */}
        <main className="pt-[96px] min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Routes>
            {/* Public layout - MainLayout renders Header and Footer for these routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
            </Route>

            {/* Other routes that might not need MainLayout's Header/Footer, or handle their own */}
            <Route path="/add-listing" element={<AddListing />} />
            <Route path="/edit-listing/:id" element={<EditListing />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/profile" element={<ManageProfile />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/client/favourites" element={<Favourites />} />

            {/* Agent Routes */}
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            <Route path="/agent/listings" element={<AgentListings />} />
            <Route path="/agent/clients" element={<Clients />} />
            <Route path="/agent/client-profile/:clientId" element={<ClientProfile />} />
            {/* The Inquiries component is now used for agent inquiries */}
            <Route path="/agent/inquiries" element={<Inquiries />} />
            <Route path="/agent/archived-clients" element={<ArchivedClients />} />

            {/* Admin Routes (Protected) */}
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="listings" element={<AdminListings />} />
              {/* Removed the AdminInquiries route */}
              <Route path="staff" element={<AdminStaff />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="agent-performance" element={<AgentPerformance />} /> {/* New: Route for Staff Performance */}
            </Route>
          </Routes>
        </main>
      </AppShell>
    </Router>
  );
}

export default App;

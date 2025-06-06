import React from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Header from "./components/Header";
import MainLayout from "./layouts/MainLayout";
import AppShell from "./layouts/AppShell"; // ✅

// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Header from "./components/Header";
import Home from "./pages/Home";
import AddListing from "./pages/AddListing";
import ListingDetails from "./pages/ListingDetails";
import SearchPage from "./pages/SearchPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import SelectRole from "./pages/SelectRole";
import ManageProfile from "./pages/ManageProfile";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import ResetPassword from "./pages/ResetPassword";

import AgentDashboard from './pages/agent/Dashboard';
import AgentListings from './pages/agent/Listings';
import Clients from './pages/agent/Clients';
import ClientProfile from './pages/agent/ClientProfile';
import RespondInquiry from './pages/agent/RespondInquiry';
import ArchivedClients from './pages/agent/ArchivedClients';

import AdminDashboard from './pages/admin/Dashboard';
import AdminListings from './pages/admin/Listings';
import AdminInquiries from './pages/admin/Inquiries';
import AdminStaff from './pages/admin/Staff';
import AdminUsers from './pages/admin/Users';
import AdminAnalytics from "./pages/admin/Analytics";

import EditListing from './pages/EditListing';

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

            {/* Agent Routes */}
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            <Route path="/agent/listings" element={<AgentListings />} />
            <Route path="/agent/clients" element={<Clients />} />
            <Route path="/agent/client-profile/:clientId" element={<ClientProfile />} />
            <Route path="/agent/respond-inquiry/:clientId" element={<RespondInquiry />} />
            <Route path="/agent/archived-clients" element={<ArchivedClients />} />

            {/* Admin Routes (Protected) */}
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="listings" element={<AdminListings />} />
              <Route path="inquiries" element={<AdminInquiries />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>
          </Routes>
        </main>
      </AppShell>
      <Header />
      <main className="pt-[96px] bg-gray-50 min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/add-listing" element={<AddListing />} />
          <Route path="/edit-listing/:id" element={<EditListing />} />
          <Route path="/listings/:id" element={<ListingDetails />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/profile" element={<ManageProfile />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Agent Routes */}
          <Route path="/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/agent/listings" element={<AgentListings />} />
          <Route path="/agent/clients" element={<Clients />} />
          <Route path="/agent/client-profile/:clientId" element={<ClientProfile />} />
          <Route path="/agent/respond-inquiry/:clientId" element={<RespondInquiry />} />
          <Route path="/agent/archived-clients" element={<ArchivedClients />} />

          {/* Admin Routes (Protected) */}
          <Route path="/admin" element={<ProtectedAdminRoute />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </main>
    </Router>
  );
}

export default App;

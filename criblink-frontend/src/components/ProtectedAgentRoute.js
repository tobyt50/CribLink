// src/components/ProtectedAgentRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedAgentRoute = () => {
  const token = localStorage.getItem("token");

  let user = null;
  if (token) {
    try {
      // Decode the token to get user information
      user = JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
      console.error("Invalid token", err);
      // If token is invalid, clear it and redirect to signin
      localStorage.removeItem("token");
      return <Navigate to="/signin" replace />;
    }
  }

  // Check if the user's role is 'agent' or 'admin'
  // Admins should also be able to access agent routes
  const isAgent = user?.role === "agent" || user?.role === "admin";

  // If the user is an agent or admin, render the child routes, otherwise redirect to signin
  return isAgent ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default ProtectedAgentRoute;

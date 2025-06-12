// src/components/ProtectedAgentRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedAgentRoute = () => {
  const token = localStorage.getItem("token");

  let user = null;
  if (token) {
    try {
      user = JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
      console.error("Invalid token", err);
      localStorage.removeItem("token");
      return <Navigate to="/signin" replace />;
    }
  }

  const isAgent = user?.role === "agent";

  return isAgent ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default ProtectedAgentRoute;

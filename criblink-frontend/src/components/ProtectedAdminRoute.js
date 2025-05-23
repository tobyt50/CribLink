// src/components/ProtectedAdminRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedAdminRoute = () => {
  const token = localStorage.getItem("token");

  let user = null;
  if (token) {
    try {
      user = JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  const isAdmin = user?.role === "admin";

  return isAdmin ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default ProtectedAdminRoute;

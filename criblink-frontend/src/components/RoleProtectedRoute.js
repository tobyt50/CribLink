import React, { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { getUserRoleFromToken, signOutUser } from '../utils/authUtils';
import { useMessage } from '../context/MessageContext'; // Import useMessage
import ProtectedBaseRoute from './ProtectedBaseRoute';

/**
 * RoleProtectedRoute
 * Replaces ProtectedAdminRoute, ProtectedAgentRoute, ProtectedClientRoute
 * * Props:
 * - allowedRole: "admin" | "agent" | "client"
 */
const RoleProtectedRoute = ({ allowedRole }) => {
  const navigate = useNavigate();
  // Changed showError to showMessage as per MessageContext.js
  const { showMessage } = useMessage(); 

  const token = localStorage.getItem("token");
  const userRole = getUserRoleFromToken(token);

  useEffect(() => {
    // Only show error and sign out if user is trying to access a restricted route
    // while having a token but the wrong role.
    if (token && userRole !== allowedRole) {
      // Use showMessage with type 'error'
      showMessage(`Access denied: You do not have ${allowedRole} privileges.`, 'error');
      signOutUser(navigate);
    }
  }, [userRole, navigate, token, showMessage, allowedRole]); // Dependency array updated to showMessage

  // If the user's role does not match the allowed role, redirect to signin
  if (userRole !== allowedRole) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <ProtectedBaseRoute>
      <Outlet />
    </ProtectedBaseRoute>
  );
};

export default RoleProtectedRoute;

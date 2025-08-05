import React, { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { getUserRoleFromToken, signOutUser } from '../utils/authUtils';
import { useMessage } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import ProtectedBaseRoute from './ProtectedBaseRoute'; // Keep this for nested routing if needed, but logic is now in parent

/**
 * RoleProtectedRoute
 * * Props:
 * - allowedRole: "admin" | "agent" | "client" | string[] (for multiple roles)
 */
const RoleProtectedRoute = ({ allowedRole }) => {
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const { user, loading, isAuthenticated } = useAuth(); // Get user, loading, isAuthenticated from AuthContext

  // Determine the user's role from the user object in AuthContext
  // The user object should contain the role after successful profile fetch
  const currentUserRole = user?.role;

  // Convert allowedRole to an array if it's a single string for consistent checking
  const allowedRolesArray = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  useEffect(() => {
    // This effect runs after authentication is loaded
    if (!loading) {
      // If not authenticated at all, ProtectedBaseRoute should handle the redirect.
      // This component focuses on role-specific access *after* base authentication.
      if (isAuthenticated && !allowedRolesArray.includes(currentUserRole)) {
        showMessage(`Access denied: You do not have the required privileges.`, 'error');
        signOutUser(navigate);
      }
    }
  }, [currentUserRole, allowedRolesArray, navigate, showMessage, loading, isAuthenticated]);

  // Removed the loading screen block.
  // The component will now immediately evaluate the authentication and role status.
  // If not authenticated (handled by ProtectedBaseRoute) or user role does not match allowed roles, redirect
  if (!isAuthenticated || !allowedRolesArray.includes(currentUserRole)) {
    return <Navigate to="/signin" replace />;
  }

  // If authenticated and role matches, render the child routes
  return <Outlet />;
};

export default RoleProtectedRoute;

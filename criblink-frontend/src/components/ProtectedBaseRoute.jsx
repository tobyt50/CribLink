import React, { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { isTokenValid, signOutUser } from '../utils/authUtils';
import { useMessage } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth

/**
 * ProtectedBaseRoute Component
 * This is a base component for any route that requires a user to be authenticated
 * (i.e., to have a valid, non-expired token), regardless of their specific role.
 * It encapsulates the core token validity check and handles automatic sign-out.
 */
const ProtectedBaseRoute = () => {
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const { isAuthenticated, loading } = useAuth(); // Get isAuthenticated and loading from AuthContext

  // Effect to handle sign-out if token becomes invalid AFTER initial load
  useEffect(() => {
    // This effect will only run if the component is already rendered (i.e., not during initial loading phase)
    // and if isAuthenticated changes to false.
    if (!loading && !isAuthenticated) {
      showMessage('Your session has expired or is invalid. Please sign in again.', 'error');
      signOutUser(navigate);
    }
  }, [isAuthenticated, loading, navigate, showMessage]);

  // If authentication status is still loading, return null to render nothing visually.
  // The component will still wait for 'loading' to become false before proceeding.
  if (loading) {
    return null;
  }

  // If not authenticated after loading, redirect to sign-in page
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedBaseRoute;

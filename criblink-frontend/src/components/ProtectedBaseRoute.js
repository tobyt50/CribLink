import React, { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { isTokenValid, signOutUser } from '../utils/authUtils'; // Path: src/components -> src/utils -> authUtils.js
import { useMessage } from '../context/MessageContext'; // Path: src/components -> src/context -> MessageContext.js

/**
 * ProtectedBaseRoute Component
 * This is a base component for any route that requires a user to be authenticated
 * (i.e., to have a valid, non-expired token), regardless of their specific role.
 * It encapsulates the core token validity check and handles automatic sign-out.
 */
const ProtectedBaseRoute = () => {
  const navigate = useNavigate();
  const { showMessage } = useMessage(); // Changed showError to showMessage

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !isTokenValid(token)) {
      // Token is missing, invalid, or expired
      showMessage('Your session has expired or is invalid. Please sign in again.'); // Changed showError to showMessage
      signOutUser(navigate);
      // Immediately navigate to prevent rendering children with invalid token
      return;
    }
    // If the token is valid, no action needed, children will be rendered by Outlet
  }, [navigate, showMessage]); // Changed showError to showMessage in dependencies

  // This check is for the initial render. The useEffect above will handle subsequent logic.
  const token = localStorage.getItem("token");
  const isAuthenticated = isTokenValid(token);

  // If not authenticated, redirect to sign-in page immediately.
  // The useEffect handles the error message and localStorage cleanup.
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedBaseRoute;

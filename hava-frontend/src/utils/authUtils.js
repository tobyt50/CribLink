import { jwtDecode } from "jwt-decode"; // Make sure you have 'jwt-decode' installed

/**
 * Checks if a JWT token is valid and not expired.
 * @param {string} token - The JWT token.
 * @returns {boolean} - True if the token is valid and not expired, false otherwise.
 */
export const isTokenValid = (token) => {
  if (!token) {
    return false;
  }
  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Current time in seconds

    // Check if the token is expired
    return decodedToken.exp > currentTime;
  } catch (error) {
    // Token is malformed or invalid
    console.error("Token validation error:", error);
    return false;
  }
};

/**
 * Gets the user role from a JWT token.
 * @param {string} token - The JWT token.
 * @returns {string|null} - The user's role or null if token is invalid.
 */
export const getUserRoleFromToken = (token) => {
  if (!token) {
    return null;
  }
  try {
    const decodedToken = jwtDecode(token);
    return decodedToken.role;
  } catch (error) {
    console.error("Error decoding token for role:", error);
    return null;
  }
};

/**
 * Clears authentication data from localStorage and redirects to login.
 * Dispatches a custom 'authChange' event to notify other components.
 * @param {Function} navigate - The navigate function from react-router-dom.
 */
export const signOutUser = (navigate) => {
  console.log(
    "Signing out user due to invalid/expired token or manual logout."
  );

  // Clear all auth-related data
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("authChange"));

  navigate("/signin"); // redirect to sign-in page
};


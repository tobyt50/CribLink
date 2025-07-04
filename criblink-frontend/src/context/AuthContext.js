// AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axiosInstance'; // Import axiosInstance to fetch full user profile

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Initial loading state is true

  // Function to fetch the full user profile from the backend
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/users/profile'); // Your user profile endpoint
      // Ensure the default_landing_page is set, as it might not be in the token
      const fetchedUser = {
        ...response.data,
        default_landing_page: response.data.default_landing_page || null,
      };
      setUser(fetchedUser);
      // Optionally, update localStorage 'user' with the full fetched data
      localStorage.setItem('user', JSON.stringify(fetchedUser));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // If fetching fails, clear user data to ensure a clean state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false); // Set loading to false after profile fetch attempt
    }
  }, []);

  // This function is now responsible for decoding the token AND triggering a full profile fetch
  const decodeAndSetUser = useCallback(async (token) => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp > currentTime) {
          // Token is valid, now fetch the complete user profile from the backend
          await fetchUserProfile();
        } else {
          console.log("Token expired during sync. Clearing user data.");
          localStorage.removeItem("token");
          localStorage.removeItem("user"); // Clear user from localStorage too
          setUser(null);
          setLoading(false); // Ensure loading is set to false even if token expired
        }
      } catch (error) {
        console.error("Invalid token during sync:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user"); // Clear user from localStorage too
        setUser(null);
        setLoading(false); // Ensure loading is set to false on error
      }
    } else {
      setUser(null);
      setLoading(false); // If no token, stop loading
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    decodeAndSetUser(token);

    const handleStorageChange = (event) => {
      // Listen for changes to 'token' or any storage clear event
      if (event.key === 'token' || !event.key) { // event.key === null for clear()
        decodeAndSetUser(localStorage.getItem('token'));
      }
    };

    const handleAuthChange = () => {
      // This custom event can be dispatched by other components (e.g., after login/logout)
      decodeAndSetUser(localStorage.getItem('token'));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [decodeAndSetUser]);

  const logout = useCallback(() => {
    console.log('Logging out user from AuthContext.');
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Ensure user is removed on logout
    setUser(null);
    setLoading(false); // Set loading to false on logout
    window.dispatchEvent(new Event('authChange')); // Dispatch custom event to notify other listeners
  }, []);

  // Function to allow other components to update the user state in context
  const updateUser = useCallback((newUserData) => {
    setUser(newUserData);
    // Optionally, update localStorage 'user' with the new data
    localStorage.setItem('user', JSON.stringify(newUserData));
  }, []);

  const authContextValue = {
    user,
    isAuthenticated: !!user,
    loading, // Expose the loading state
    logout,
    updateUser, // Expose updateUser function
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

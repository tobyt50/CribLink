// AuthContext
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axiosInstance'; // Import axiosInstance to fetch full user profile

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the full user profile from the backend.
   * This now includes all user details PLUS subscription information
   * (subscription_type, featured_priority) which is set into the global state.
   */
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/users/profile');
      
      // The response.data object now contains the user's subscription tier.
      // We set the entire object into state.
      const fetchedUser = {
        ...response.data,
        // Ensure default values are present if the API doesn't return them
        subscription_type: response.data.subscription_type || 'basic',
        featured_priority: response.data.featured_priority || 0,
        default_landing_page: response.data.default_landing_page || null,
      };

      setUser(fetchedUser);
      // Update localStorage to keep the full user profile in sync.
      localStorage.setItem('user', JSON.stringify(fetchedUser));

    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // On failure, perform a full logout to clean up stale data.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // This function decodes the token and triggers a full profile fetch.
  // No changes are needed here as its logic is sound.
  const decodeAndSetUser = useCallback(async (token) => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp > currentTime) {
          // Token is valid, so fetch the complete user profile.
          // This ensures we always have the latest data, including any subscription changes.
          await fetchUserProfile();
        } else {
          console.log("Token expired. Clearing user data.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // This useEffect hook handles initial auth state and listens for changes.
  // No changes are needed here.
  useEffect(() => {
    const token = localStorage.getItem("token");
    decodeAndSetUser(token);

    const handleStorageChange = (event) => {
      if (event.key === 'token' || event.key === null) {
        decodeAndSetUser(localStorage.getItem('token'));
      }
    };

    const handleAuthChange = () => {
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
    localStorage.removeItem('user');
    setUser(null);
    setLoading(false);
    window.dispatchEvent(new Event('authChange'));
  }, []);

  /**
   * Allows other components (e.g., Profile Update page) to update the user state.
   * The newUserData object should be the complete user object returned from the API,
   * which will include the latest subscription details.
   */
  const updateUser = useCallback((newUserData) => {
    // Ensure the incoming data is merged with existing state to prevent data loss
    // and explicitly include subscription fields.
    setUser(currentUser => ({
      ...currentUser,
      ...newUserData,
      subscription_type: newUserData.subscription_type || 'basic',
      featured_priority: newUserData.featured_priority !== undefined ? newUserData.featured_priority : 0,
    }));
    
    // Also update the user object in localStorage.
    localStorage.setItem('user', JSON.stringify(newUserData));
  }, []);

  // The context value now implicitly contains the user's subscription tier
  // through the 'user' object.
  const authContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// The useAuth hook remains the same. Any component calling it will get the
// user object which now contains subscription data.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Example of how a component would access the new data:
  // const { user } = useAuth();
  // const userTier = user.subscription_type; // 'basic', 'pro', etc.
  return context;
};
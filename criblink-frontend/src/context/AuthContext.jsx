// AuthContext
import { jwtDecode } from "jwt-decode";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import axiosInstance from "../api/axiosInstance"; // Import axiosInstance to fetch full user profile

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the full user profile from the backend using the token in localStorage.
   * This is the single source of truth for hydrating the user state during session restoration.
   */
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/users/profile");

      const fetchedUser = {
        ...response.data,
        subscription_type: response.data.subscription_type || "basic",
        featured_priority: response.data.featured_priority || 0,
        default_landing_page: response.data.default_landing_page || null,
      };

      setUser(fetchedUser); // Set the user state directly. No more localStorage for the user object.
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      localStorage.removeItem("token"); // The token is likely invalid, so clear it.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Orchestrates session restoration on initial load or tab change.
   * It decodes the token and, if valid, calls fetchUserProfile.
   */
  const decodeAndSetUser = useCallback(
    async (token) => {
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp > currentTime) {
            await fetchUserProfile();
          } else {
            console.log("Token expired. Clearing token.");
            localStorage.removeItem("token"); // Clean up expired token.
            setUser(null);
            setLoading(false);
          }
        } catch (error) {
          console.error("Invalid token:", error);
          localStorage.removeItem("token"); // Clean up invalid token.
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    },
    [fetchUserProfile],
  );

  // Handles initial auth state and listens for changes across tabs.
  useEffect(() => {
    const token = localStorage.getItem("token");
    decodeAndSetUser(token);

    const handleStorageChange = (event) => {
      // If the token changes in another tab, re-sync the session state.
      if (event.key === "token" || event.key === null) {
        decodeAndSetUser(localStorage.getItem("token"));
      }
    };

    const handleAuthChange = () => {
      decodeAndSetUser(localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, [decodeAndSetUser]);

  const logout = useCallback(() => {
    console.log("Logging out user from AuthContext.");
    localStorage.removeItem("token"); // Only the token needs to be removed.
    setUser(null);
    setLoading(false);
    window.dispatchEvent(new Event("authChange"));
  }, []);

  /**
   * Sets the user state immediately after a successful sign-in.
   * This avoids a redundant API call to fetch the profile we just received.
   */
  const login = useCallback((userData, token) => {
    console.log("AuthContext: Logging in and setting user data directly.");
    localStorage.setItem("token", token);
    setUser(userData); // Update state immediately from the sign-in response.
    setLoading(false);
  }, []);

  /**
   * Allows components (e.g., Profile Update, Role Change) to update the user state.
   * Accepts the complete user object and a new token from the API.
   */
  const updateUser = useCallback((newUserData, token) => {
    const completeUserObject = {
      ...newUserData,
      subscription_type: newUserData.subscription_type || "basic",
      featured_priority:
        newUserData.featured_priority !== undefined
          ? newUserData.featured_priority
          : 0,
    };

    setUser(completeUserObject); // Update the user state in memory.

    // If a new token was provided (essential after role changes), update it in storage.
    if (token) {
      localStorage.setItem("token", token);
    }
  }, []);

  const authContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    logout,
    login,
    updateUser,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// The useAuth hook remains the same.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
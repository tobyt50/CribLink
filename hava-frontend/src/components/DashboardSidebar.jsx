import React, { useState, useEffect, Suspense, lazy } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../layouts/AppShell";
import { useSidebarState } from "../hooks/useSidebarState";

// Lazy load all sidebar components to improve initial load time and code splitting.
const AdminSidebar = lazy(() => import("./admin/Sidebar.jsx"));
const AgencySidebar = lazy(() => import("./agency/Sidebar.jsx"));
const AgentSidebar = lazy(() => import("./agent/Sidebar.jsx"));
const ClientSidebar = lazy(() => import("./client/Sidebar.jsx"));

const LoadingSkeleton = ({ darkMode }) => (
  <div
    className={`fixed top-0 left-0 h-full w-64 z-50 ${darkMode ? "bg-gray-800" : "bg-white"}`}
  />
);

const DashboardSidebar = ({ isOpen, setIsOpen }) => {
  // Hooks are called unconditionally at the top.
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { isMobile } = useSidebarState();
  const [SidebarComponent, setSidebarComponent] = useState(null);

  useEffect(() => {
    if (user?.role) {
      // --- START OF MODIFICATION ---
      // The switch statement now includes all user roles.
      switch (user.role) {
        case "admin":
          setSidebarComponent(() => AdminSidebar);
          break;
        case "agency_admin":
          setSidebarComponent(() => AgencySidebar);
          break;
        case "agent":
          setSidebarComponent(() => AgentSidebar);
          break;
        case "client":
          setSidebarComponent(() => ClientSidebar);
          break;
        default:
          setSidebarComponent(null); // No sidebar for unknown roles
      }
      // --- END OF MODIFICATION ---
    } else {
      setSidebarComponent(null); // No user, no sidebar
    }
  }, [user]);

  // Conditional return happens AFTER all hooks, which is safe.
  if (!isMobile) {
    return null;
  }

  if (!SidebarComponent) {
    return null; // Don't render if role has no sidebar or user is logged out.
  }

  return (
    <Suspense fallback={<LoadingSkeleton darkMode={darkMode} />}>
      <SidebarComponent
        isMobile={true}
        isSidebarOpen={isOpen}
        setIsSidebarOpen={setIsOpen}
        // Pass default props for compatibility with all sidebar types
        collapsed={false}
        setCollapsed={() => {}}
        activeSection={""}
        setActiveSection={() => {}}
      />
    </Suspense>
  );
};

export default DashboardSidebar;

import {
  BarChart2,
  Bookmark,
  ChevronLeft,
  FileText,
  Home,
  LayoutGrid,
  Menu,
  Shield,
  Users
} from "lucide-react";
import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { useTheme } from "../../layouts/AppShell";

export const MENU_ITEMS = [
  { name: "Dashboard", to: "/admin/dashboard", icon: <Home />, key: "dashboard", description: "Key metrics & updates" },
  { name: "Users", to: "/admin/users", icon: <Users />, key: "users", description: "Manage platform users" },
  { name: "Staff", to: "/admin/staff", icon: <Shield />, key: "staff", description: "Roles & permissions" },
  { name: "Listings", to: "/admin/listings", icon: <LayoutGrid />, key: "listings", description: "Add or edit properties" },
  { name: "Legal Docs", to: "/documents", icon: <FileText />, key: "documents", description: "Manage documents" },
  { name: "Analytics", to: "/admin/analytics", icon: <BarChart2 />, key: "analytics", description: "Track performance" },
  { name: "Favourites", to: "/favourites", icon: <Bookmark />, key: "favourites", description: "Saved listings & agents" },
];

const AdminSidebar = ({
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
  isMobile = false,
  isSidebarOpen = true,
  setIsSidebarOpen = () => {},
}) => {
  const { darkMode } = useTheme();

  // Swipe gestures for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => isMobile && setIsSidebarOpen(false),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  // Edge swipe-to-open
  useEffect(() => {
    if (!isMobile) return;
    const handleTouchStart = (e) => {
      if (!isSidebarOpen && e.touches[0].clientX < 20) {
        document.addEventListener("touchmove", handleTouchMove);
        document.addEventListener("touchend", handleTouchEnd);
      }
    };
    const handleTouchMove = (e) => {
      if (e.changedTouches[0].clientX > 50) {
        setIsSidebarOpen(true);
        handleTouchEnd();
      }
    };
    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
    document.addEventListener("touchstart", handleTouchStart);
    return () => document.removeEventListener("touchstart", handleTouchStart);
  }, [isMobile, isSidebarOpen, setIsSidebarOpen]);

  const sidebarWidthClass = isMobile ? "w-80" : collapsed ? "w-20" : "w-64";

  const sidebarClasses = `
    transition-all duration-300 ease-in-out shadow-xl border-r
    flex flex-col items-start
    h-[calc(100vh-3.5rem)] fixed top-14 left-0 z-50
    ${sidebarWidthClass}
    ${isMobile ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full") : ""}
    ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}
  `;

  return (
    <>
      <div className={sidebarClasses} {...swipeHandlers}>
        {/* Mobile header */}
        {isMobile && (
          <div className={`flex items-center justify-between w-full p-4 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
            <h2 className={`text-lg font-semibold tracking-tight ${darkMode ? "text-green-300" : "text-green-700"}`}>
              Admin Menu
            </h2>
          </div>
        )}

        {/* Toggle Button */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            className={`flex items-center justify-center py-3 w-full border-b transition-colors ${
              darkMode ? "border-gray-800 hover:bg-gray-800" : "border-gray-100 hover:bg-gray-50"
            }`}
          >
            {collapsed ? (
              <Menu className={`${darkMode ? "text-gray-400" : "text-gray-600"}`} size={22} />
            ) : (
              <ChevronLeft className={`${darkMode ? "text-gray-400" : "text-gray-600"}`} size={22} />
            )}
          </button>
        )}

        {/* Navigation */}
        <nav className="flex flex-col w-full flex-grow overflow-y-auto py-3">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              onClick={() => {
                setActiveSection?.(item.key);
                if (isMobile) setIsSidebarOpen(false);
              }}
              className={({ isActive }) =>
                `group flex items-start gap-4 w-full px-6 py-3 transition-all rounded-lg
                ${
                  isActive || activeSection === item.key
                    ? darkMode
                      ? "bg-gray-800 text-green-300"
                      : "bg-green-50 text-green-700"
                    : darkMode
                      ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <span className="flex items-center justify-center mt-0.5">
                {React.cloneElement(item.icon, { size: 22, strokeWidth: 1.8 })}
              </span>
              {(isMobile || !collapsed) && (
                <div className="flex flex-col leading-tight">
                  <span className="text-base font-medium">{item.name}</span>
                  <span className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {item.description}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className={`fixed inset-0 z-40 md:hidden backdrop-blur-sm transition-colors ${
            darkMode ? "bg-gray-900/70" : "bg-black/30"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;

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
import { useTheme } from "../../layouts/AppShell";
// Import the swipe hook
import { useSwipeable } from "react-swipeable";

// Exporting MENU_ITEMS with added descriptions
export const MENU_ITEMS = [
  {
    name: "Dashboard",
    to: "/admin/dashboard",
    icon: <Home />,
    key: "dashboard",
    description: "View key metrics and updates.",
  },
  {
    name: "Users",
    to: "/admin/users",
    icon: <Users />,
    key: "users",
    description: "Manage all platform users.",
  },
  {
    name: "Staff",
    to: "/admin/staff",
    icon: <Shield />,
    key: "staff",
    description: "Administer staff and roles.",
  },
  {
    name: "Listings",
    to: "/admin/listings",
    icon: <LayoutGrid />,
    key: "listings",
    description: "Oversee, add, or edit property listings.",
  },
  {
    name: "Legal Docs",
    to: "/documents",
    icon: <FileText />,
    key: "documents",
    description: "Manage legal documents.",
  },
  {
    name: "Analytics",
    to: "/admin/analytics",
    icon: <BarChart2 />,
    key: "analytics",
    description: "Track site performance.",
  },
  {
    name: "Favourites",
    to: "/favourites",
    icon: <Bookmark />,
    key: "favourites",
    description: "View your saved listings, agencies, & agents.",
  },
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

  // --- Swipe Gesture Handlers ---
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => isMobile && setIsSidebarOpen(false),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  // Effect to handle swipe-to-open from the edge of the screen
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e) => {
      if (!isSidebarOpen && e.touches[0].clientX < 20) {
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
      }
    };

    const handleTouchMove = (e) => {
      if (e.changedTouches[0].clientX > 50) {
        setIsSidebarOpen(true);
        handleTouchEnd();
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isMobile, isSidebarOpen, setIsSidebarOpen]);


  const sidebarWidthClass = isMobile ? "w-80" : collapsed ? "w-20" : "w-80";

  const sidebarClasses = `
    transition-all duration-300 shadow-2xl border-r
    flex flex-col items-start
    h-[calc(100vh-3.5rem)] fixed top-14 left-0 z-50
    ${sidebarWidthClass}
    ${isMobile ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full") : ""}
    ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
  `;

  return (
    <>
      <div className={sidebarClasses} {...swipeHandlers}>
        {/* --- NEW: Mobile-Only Contextual Header --- */}
        {isMobile && (
          <div className={`flex items-center justify-between w-full p-2 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-green-300" : "text-green-800"}`}>
                Admin Menu
            </h2>
          </div>
        )}

        {/* --- Desktop-Only Toggle Button (Unchanged) --- */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            className={`flex flex-col items-center py-3 w-full border-b px-6 hover:bg-gray-100
              ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200"}`}
          >
            {collapsed ? (
              <>
                <Menu className={`${darkMode ? "text-gray-300" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Expand</span>
              </>
            ) : (
              <>
                <ChevronLeft className={`${darkMode ? "text-gray-300" : "text-gray-700"}`} size={24} />
                <span className={`mt-1 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Collapse</span>
              </>
            )}
          </button>
        )}

        {/* Navigation (Updated with descriptions) */}
        <nav className="flex flex-col w-full flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 py-2">
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <NavLink
                to={item.to}
                onClick={() => {
                  if (typeof setActiveSection === "function") setActiveSection(item.key);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center gap-4 w-full px-6 py-3 transition-all ${
                    isActive || activeSection === item.key
                      ? darkMode
                        ? "bg-gray-900 text-green-200 font-semibold border-l-4 border-green-400"
                        : "bg-green-100 text-green-800 font-semibold border-l-4 border-green-600"
                      : darkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }`
                }
              >
                <span>{React.cloneElement(item.icon, { size: 24 })}</span>
                {(isMobile || !collapsed) && (
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.description}
                    </span>
                  </div>
                )}
              </NavLink>
              {idx < MENU_ITEMS.length - 1 && (
                <hr className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`} />
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Backdrop on mobile (Unchanged) */}
      {isMobile && isSidebarOpen && (
        <div
          className={`fixed inset-0 z-40 md:hidden ${darkMode ? "bg-gray-900 bg-opacity-70" : "bg-black bg-opacity-20"}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;

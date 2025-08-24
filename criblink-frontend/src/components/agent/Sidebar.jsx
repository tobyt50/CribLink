import {
  Archive,
  BarChart2,
  Bookmark,
  ChevronLeft,
  Home,
  Inbox,
  LayoutGrid,
  Menu,
  Users
} from "lucide-react";
import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../layouts/AppShell";
// Import the swipe hook
import { useSwipeable } from "react-swipeable";

// Define the navigation links with descriptions
const MENU_ITEMS = [
  {
    name: "Dashboard",
    to: "/agent/dashboard",
    icon: <Home />,
    key: "dashboard",
    description: "View your personal stats."
  },
  {
    name: "Clients",
    to: "/agent/clients",
    icon: <Users />,
    key: "clients",
    description: "Manage your client relationships."
  },
  {
    name: "Listings",
    to: "/agent/listings",
    icon: <LayoutGrid />,
    key: "listings",
    description: "Create and manage your properties."
  },
  {
    name: "Inquiries",
    to: "/agent/inquiries",
    icon: <Inbox />,
    key: "inquiries",
    description: "Respond to client messages."
  },
  {
    name: "Analytics",
    to: "/agent/analytics",
    icon: <BarChart2 />,
    key: "analytics",
    description: "Track your listing performance."
  },
  {
    name: "Favourites",
    to: "/favourites",
    icon: <Bookmark />,
    key: "favourites",
    description: "See listings, clients, and agencies you have saved."
  },
  {
    name: "Archive",
    to: "/agent/archive",
    icon: <Archive />,
    key: "archive",
    description: "Access your archived items."
  },
];

const AgentSidebar = ({
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
  isMobile,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { darkMode } = useTheme();

  // --- Swipe Gesture Handlers ---
  // These handlers will be attached to the sidebar to close it on swipe left.
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => isMobile && setIsSidebarOpen(false),
    // NOTE: To open the sidebar with a swipe right, you would apply a similar
    // useSwipeable hook to your main content area or a dedicated handle.
    // onSwipedRight: () => isMobile && setIsSidebarOpen(true),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const sidebarWidthClass = isMobile ? "w-64" : collapsed ? "w-20" : "w-64";

  const sidebarClasses = `
    transition-all duration-300 shadow-2xl border-r
    flex flex-col items-start pb-10
    h-[calc(100vh-3.5rem)] fixed top-14 left-0 z-50
    ${sidebarWidthClass}
    ${isMobile ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full") : ""}
    ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
  `;

  // Effect to handle swipe-to-open from the edge of the screen
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e) => {
      // Only trigger if sidebar is closed and swipe is from the left edge
      if (!isSidebarOpen && e.touches[0].clientX < 20) {
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
      }
    };

    const handleTouchMove = (e) => {
      // If user swipes right, open the sidebar
      if (e.changedTouches[0].clientX > 50) {
        setIsSidebarOpen(true);
        handleTouchEnd(); // Clean up listeners once action is taken
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isSidebarOpen, setIsSidebarOpen]);


  return (
    <>
      {/* Attach swipe handlers to the sidebar container */}
      <div className={sidebarClasses} {...swipeHandlers}>
        {isMobile && (
          <div className={`flex items-center justify-between w-full p-2 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-green-300" : "text-green-800"}`}>
            My Workspace
            </h2>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            className={`flex flex-col items-center py-3 mb-6 w-full border-b px-6 hover:bg-gray-100
              ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200"}`}
          >
            {collapsed ? (
              <>
                <Menu
                  className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  size={24}
                />
                <span
                  className={`mt-1 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Expand
                </span>
              </>
            ) : (
              <>
                <ChevronLeft
                  className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  size={24}
                />
                <span
                  className={`mt-1 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Collapse
                </span>
              </>
            )}
          </button>
        )}

        <nav className="flex flex-col w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.key}>
              <NavLink
                to={item.to}
                onClick={() => {
                  if (typeof setActiveSection === "function") {
                    setActiveSection(item.key);
                  }
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
                <hr
                  className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`}
                />
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {isMobile && isSidebarOpen && (
        <div
          className={`fixed inset-0 z-40 md:hidden ${darkMode ? "bg-gray-900 bg-opacity-70" : "bg-black bg-opacity-20"}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default AgentSidebar;

import {
  Award,
  BarChart2,
  Bookmark,
  ChevronLeft,
  FileText,
  Home,
  LayoutGrid,
  Menu,
  MessageSquare,
  Shield,
  Users
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../layouts/AppShell";

// Define the menu items specifically for Agency Admin with descriptions
const MENU_ITEMS = [
  {
    name: "Dashboard",
    to: "/agency/dashboard",
    icon: <Home />,
    key: "dashboard",
    description: "Overview of agency activity.",
  },
  {
    name: "Listings",
    to: "/agency/listings",
    icon: <LayoutGrid />,
    key: "listings",
    description: "Manage all agency properties.",
  },
  {
    name: "Members",
    to: "/agency/members",
    icon: <Users />,
    key: "members",
    description: "View and manage agency agents and admins.",
  },
  {
    name: "Clients",
    to: "/agency/clients",
    icon: <Shield />,
    key: "clients",
    description: "Access client information.",
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
    to: "/agency/analytics",
    icon: <BarChart2 />,
    key: "analytics",
    description: "Track agency performance.",
  },
  {
    name: "Agent Performance",
    to: "/agency/agent-performance",
    icon: <Award />,
    key: "agent-performance",
    description: "Review agent metrics.",
  },
  {
    name: "Inquiries",
    to: "/agency/inquiries",
    icon: <MessageSquare />,
    key: "inquiries",
    description: "Handle client communications.",
  },
  {
    name: "Favourites",
    to: "/favourites",
    icon: <Bookmark />,
    key: "favourites",
    description: "View your saved listings, agents, & clients.",
  },
];

const AgencySidebar = ({
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
  isMobile = false,
  isSidebarOpen = true,
  setIsSidebarOpen = () => {},
}) => {
  const { darkMode } = useTheme();

  const sidebarWidthClass = isMobile ? "w-64" : collapsed ? "w-20" : "w-64";

  const sidebarClasses = `
    transition-all duration-300 shadow-2xl border-r
    flex flex-col items-start pb-10
    h-[calc(100vh-3.5rem)] fixed top-14 left-0 z-50
    ${sidebarWidthClass}
    ${isMobile ? (isSidebarOpen ? "translate-x-0" : "-translate-x-full") : ""}
    ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
  `;

  return (
    <>
      <div className={sidebarClasses}>
        {/* Mobile-Only Contextual Header */}
        {isMobile && (
          <div className={`flex items-center justify-between w-full p-2 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-green-300" : "text-green-800"}`}>
                Agency Management
            </h2>
          </div>
        )}
        {/* Toggle Button - only desktop */}
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

        {/* Navigation */}
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

      {/* Backdrop on mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className={`fixed inset-0 z-40 md:hidden ${darkMode ? "bg-gray-900 bg-opacity-70" : "bg-black bg-opacity-20"}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default AgencySidebar;
import {
  Bookmark,
  ChevronLeft,
  Home,
  Menu,
  MessageSquare,
  Users
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../../layouts/AppShell";

const MENU_ITEMS = [
  {
    name: "Dashboard",
    to: "/client/dashboard",
    icon: <Home />,
    key: "client-dashboard",
    description: "View key metrics and updates."
  },
  {
    name: "Favourites",
    to: "/favourites",
    icon: <Bookmark />,
    key: "client-favourites",
    description: "Access your saved listings, agents, and agencies."
  },
  {
    name: "Agents",
    to: "/client/agents",
    icon: <Users />,
    key: "client-agents",
    description: "Browse and connect with agents."
  },
  {
    name: "Inquiries",
    to: "/client/inquiries",
    icon: <MessageSquare />,
    key: "client-inquiries",
    description: "View your conversations."
  },
];

const ClientSidebar = ({
  isMobile = false,
  isSidebarOpen = true,
  setIsSidebarOpen = () => {},
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
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

export default ClientSidebar;
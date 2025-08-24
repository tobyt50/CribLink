import React from "react";
import {
  Menu,
  ChevronLeft,
  User,
  Shield,
  KeyRound,
  SlidersHorizontal,
  Building,
  Settings as SettingsIcon,
  Bell,
  Link as LinkIcon,
  ClipboardList,
  Server,
} from "lucide-react";
import { useTheme } from "../../../layouts/AppShell";

const categoryIcons = {
  profile: User,
  privacy: Shield,
  security: KeyRound,
  preferences: SlidersHorizontal,
  agency: Building,
  systemGeneral: SettingsIcon,
  systemNotifications: Bell,
  systemIntegrations: LinkIcon,
  systemModeration: ClipboardList,
  systemMaintenance: Server,
};

const SettingsSidebar = ({
  categories,
  activeCategory,
  setActiveCategory,
  collapsed,
  setCollapsed,
}) => {
  const { darkMode } = useTheme();
  const sidebarWidthClass = collapsed ? "w-20" : "w-64";

  // THE FIX IS HERE: Replaced h-screen with a calculated height
  const sidebarClasses = `
        transition-all duration-300 shadow-2xl border-r
        flex flex-col items-start
        fixed top-14 left-0 z-40 
        h-[calc(100vh-3.5rem)] 
        ${sidebarWidthClass}
        ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
    `;

  return (
    <aside className={sidebarClasses}>
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
        className={`flex flex-col items-center py-3 mb-2 w-full border-b px-6 transition-colors
                ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100"}`}
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

      {/* Navigation (This will now scroll correctly within the visible area) */}
      <nav className="flex-1 flex flex-col w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pb-4">
        {categories.map((category, idx) => {
          const Icon = categoryIcons[category.id] || SettingsIcon;
          const isActive = activeCategory === category.id;

          return (
            <React.Fragment key={category.id}>
              <button
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-4 w-full px-6 py-3 transition-all ${
                  isActive
                    ? darkMode
                      ? "bg-gray-900 text-green-200 font-semibold border-l-4 border-green-400"
                      : "bg-green-100 text-green-800 font-semibold border-l-4 border-green-600"
                    : darkMode
                      ? "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <span>{React.cloneElement(<Icon />, { size: 24 })}</span>
                {!collapsed && <span>{category.label}</span>}
              </button>
              {idx < categories.length - 1 && (
                <hr
                  className={`${darkMode ? "border-gray-700" : "border-gray-100"} mx-6`}
                />
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </aside>
  );
};

export default SettingsSidebar;

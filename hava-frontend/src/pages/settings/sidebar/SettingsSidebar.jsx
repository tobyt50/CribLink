import {
  Bell,
  Building,
  ChevronLeft,
  ClipboardList,
  KeyRound,
  Link as LinkIcon,
  Menu,
  Server,
  Settings as SettingsIcon,
  Shield,
  SlidersHorizontal,
  User,
} from "lucide-react";
import React from "react";
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
  const sidebarWidthClass = collapsed ? "w-20" : "w-64"; // Matched width

  const sidebarClasses = `
    transition-all duration-300 ease-in-out shadow-xl border-r
    flex flex-col items-start
    fixed top-14 left-0 z-40
    h-[calc(100vh-3.5rem)]
    ${sidebarWidthClass}
    ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}
  `;

  return (
    <aside className={sidebarClasses}>
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
        className={`flex items-center justify-center py-3 w-full border-b transition-colors ${
          darkMode
            ? "border-gray-800 hover:bg-gray-800"
            : "border-gray-100 hover:bg-gray-50"
        }`}
      >
        {collapsed ? (
          <Menu
            className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
            size={22}
          />
        ) : (
          <ChevronLeft
            className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}
            size={22}
          />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex flex-col w-full flex-grow overflow-y-auto py-3">
        {categories.map((category) => {
          const Icon = categoryIcons[category.id] || SettingsIcon;
          const isActive = activeCategory === category.id;

          return (
            <React.Fragment key={category.id}>
              <button
                onClick={() => setActiveCategory(category.id)}
                className={`group flex items-center gap-4 w-full px-6 py-3 transition-all rounded-lg
                  ${
                    isActive
                      ? darkMode
                        ? "bg-gray-800 text-green-300"
                        : "bg-green-50 text-green-700"
                      : darkMode
                        ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <span className="flex items-center justify-center">
                  {React.cloneElement(<Icon />, {
                    size: 22,
                    strokeWidth: 1.8,
                  })}
                </span>
                {!collapsed && (
                  <span className="text-base font-medium">{category.label}</span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    </aside>
  );
};

export default SettingsSidebar;
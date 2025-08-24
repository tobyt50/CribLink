import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Restored useLocation import
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../layouts/AppShell";

// Import Layout Components
import SettingsHub from "./hub/SettingsHub";
import SettingsSidebar from "./sidebar/SettingsSidebar";

// Import Settings Page Components
import AgencySettings from "./agency/AgencySettings";
import GeneralSystem from "./system/GeneralSystem";
import Integrations from "./system/Integrations";
import Moderation from "./system/Moderation";
import Notifications from "./system/Notifications";
import SystemMaintenance from "./system/SystemMaintenance";
import General from "./user/General";
import Preferences from "./user/Preferences";
import Privacy from "./user/Privacy";
import Security from "./user/Security";

// Import the sidebar state hook
import { useSidebarState } from "../../hooks/useSidebarState";

// Helper Hook for Media Query
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);
  return matches;
};

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Restored location hook
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isCollapsed, setIsCollapsed } = useSidebarState();
  const { darkMode } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  
  // Initialize mobileView and activeCategory with useState, to be set by useEffect
  const [activeCategory, setActiveCategory] = useState(null);
  const [mobileView, setMobileView] = useState("hub");

  const allCategories = {
    profile: {
      id: "profile",
      label: "Profile",
      component: General,
      description:
        "Manage your personal information, name, and contact details.",
      keywords: [
        "name",
        "contact",
        "photo",
        "picture",
        "bio",
        "social media",
        "agency",
      ],
    },
    privacy: {
      id: "privacy",
      label: "Privacy",
      component: Privacy,
      description:
        "Control your data, cookie preferences, and communication settings.",
      keywords: [
        "cookies",
        "data",
        "collection",
        "ads",
        "communication",
        "export",
      ],
    },
    security: {
      id: "security",
      label: "Security",
      component: Security,
      description: "Change your password, manage sessions, and enable 2FA.",
      keywords: [
        "password",
        "2fa",
        "two-factor",
        "sessions",
        "login",
        "deactivate",
        "logout",
      ],
    },
    preferences: {
      id: "preferences",
      label: "Preferences",
      component: Preferences,
      description:
        "Customize theme, language, notifications, and property alerts.",
      keywords: [
        "theme",
        "dark mode",
        "language",
        "sidebar",
        "notifications",
        "alerts",
        "view",
        "currency",
        "timezone",
      ],
    },
    agency: {
      id: "agency",
      label: "Agency Settings",
      component: AgencySettings,
      description:
        "Manage your agency's profile, members, and pending requests.",
      keywords: [
        "members",
        "agents",
        "requests",
        "join",
        "delete agency",
        "danger zone",
      ],
    },
    systemGeneral: {
      id: "systemGeneral",
      label: "General System",
      component: GeneralSystem,
      description:
        "Configure site-wide settings, branding, and default behaviors.",
      keywords: ["site name", "branding", "currency", "mapbox", "api key"],
    },
    systemNotifications: {
      id: "systemNotifications",
      label: "System Notifications",
      component: Notifications,
      description:
        "Manage system-level email templates and notification triggers.",
      keywords: ["email", "smtp", "server", "sms", "channels"],
    },
    systemIntegrations: {
      id: "systemIntegrations",
      label: "Integrations",
      component: Integrations,
      description: "Connect to third-party services like CRMs and analytics.",
      keywords: ["crm", "google analytics", "third-party", "api"],
    },
    systemModeration: {
      id: "systemModeration",
      label: "Content Moderation",
      component: Moderation,
      description:
        "Set rules for auto-approving listings and managing user comments.",
      keywords: ["approve", "listings", "comments", "user content"],
    },
    systemMaintenance: {
      id: "systemMaintenance",
      label: "System Maintenance",
      component: SystemMaintenance,
      description: "Perform backups, clear cache, and manage system health.",
      keywords: [
        "maintenance mode",
        "offline",
        "cache",
        "backup",
        "database",
        "logs",
      ],
    },
  };

  const getAvailableCategories = useCallback(() => {
    const {
      profile,
      privacy,
      security,
      preferences,
      agency,
      systemGeneral,
      systemNotifications,
      systemIntegrations,
      systemModeration,
      systemMaintenance,
    } = allCategories;
    const baseUser = [profile, privacy, security, preferences];
    switch (user?.role) {
      case "admin":
        return [
          ...baseUser,
          agency,
          systemGeneral,
          systemNotifications,
          systemIntegrations,
          systemModeration,
          systemMaintenance,
        ];
      case "agency_admin":
        return [...baseUser, agency];
      case "agent":
        return [...baseUser, agency];
      case "client":
        return [profile, privacy, security, preferences];
      default:
        return [];
    }
  }, [user?.role]);

  const availableCategories = useMemo(
    () => getAvailableCategories(),
    [getAvailableCategories],
  );

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return availableCategories;
    const lowercasedTerm = searchTerm.toLowerCase();
    return availableCategories.filter(
      (category) =>
        category.label.toLowerCase().includes(lowercasedTerm) ||
        category.description.toLowerCase().includes(lowercasedTerm) ||
        (category.keywords &&
          category.keywords.some((kw) =>
            kw.toLowerCase().includes(lowercasedTerm),
          )),
    );
  }, [searchTerm, availableCategories]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromUrl = params.get('category');
    
    const isValidCategory = categoryFromUrl && availableCategories.some(c => c.id === categoryFromUrl);

    if (isValidCategory) {
        setActiveCategory(categoryFromUrl);
        if (isMobile) {
            setMobileView('detail');
        }
    } else {
        const currentCategoryExists = filteredCategories.some(
          (c) => c.id === activeCategory,
        );
        if (!activeCategory || !currentCategoryExists) {
          setActiveCategory(
            filteredCategories.length > 0 ? filteredCategories[0].id : null,
          );
        }
    }
  }, [location.search, filteredCategories, availableCategories, isMobile, activeCategory]);

  const ActiveComponent = allCategories[activeCategory]?.component;

  const handleSelectCategory = (categoryId) => {
    setActiveCategory(categoryId);
    const params = new URLSearchParams(location.search);
    params.set("category", categoryId);
    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
    if (isMobile) setMobileView("detail");
  };
  

  const handleBackToHub = () => {
    setMobileView("hub");
    const params = new URLSearchParams(location.search);
    params.delete("category"); // clear the forced category
    navigate({
      pathname: location.pathname,
      search: params.toString(),
    });
  };

  const mainContentMargin = isCollapsed ? "ml-20" : "ml-64";

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading user data...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 -mt-12 flex">
      {isMobile ? (
        <div className="w-full">
          <AnimatePresence mode="wait">
            {mobileView === "hub" ? (
              <motion.div
                key="hub"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.1 }}
              >
                <SettingsHub
                  categories={filteredCategories}
                  onSelectCategory={handleSelectCategory}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.1 }}
                className="w-full min-h-screen p-4"
              >
                <div className="relative flex items-center justify-center mb-6 pt-2">
                  <button
                    onClick={handleBackToHub}
                    aria-label="Go back to settings hub"
                    className={`absolute left-0 p-2 rounded-lg shadow-sm transition hover:scale-105 ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h1 className="text-2xl font-extrabold text-green-700 dark:text-green-400">
                    {allCategories[activeCategory]?.label || "Settings"}
                  </h1>
                </div>
                <div className="px-2">
                  {ActiveComponent && <ActiveComponent />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <>
          <SettingsSidebar
            categories={filteredCategories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            collapsed={isCollapsed}
            setCollapsed={setIsCollapsed}
          />
          <main
            className={`flex-1 p-8 ${mainContentMargin} transition-all duration-300 overflow-auto`}
          >
            <div className="relative mb-6">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-1/3 h-11 py-3 pl-12 pr-4 border rounded-xl shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {ActiveComponent ? (
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ActiveComponent />
              </motion.div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
                {searchTerm
                  ? `No settings found for "${searchTerm}"`
                  : "Select a category to view its settings."}
              </p>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default Settings;

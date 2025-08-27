import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Building,
  ClipboardList,
  KeyRound,
  Link as LinkIcon,
  Search,
  Server,
  Settings as SettingsIcon,
  Shield,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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

const SettingsHub = ({
  categories,
  onSelectCategory,
  searchTerm,
  setSearchTerm,
}) => {
  const location = useLocation();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const handleBack = () => {
    const fromAuthPage =
      location.key === "default" || // direct load (no history)
      location.state?.fromAuth ||
      ["/signin", "/signup"].includes(document.referrer.split("/").pop());

    if (fromAuthPage) {
      // if last page was sign in/up, go to home or dashboard instead
      navigate("/");
    } else {
      navigate(-1);
    }
  };

  // Animation variants updated to match Agencies.jsx
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }, // Stagger effect
    },
  };

  const rowVariants = {
    hidden: { y: 20, opacity: 0 }, // Item animation
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div
      className={`min-h-screen px-4 pt-4 ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-800"}`}
    >
      {/* Header */}
      <header className="relative flex flex-col items-center text-center mb-4 max-w-5xl mx-auto">
        <button
          onClick={handleBack}
          aria-label="Go back"
          className={`absolute left-0 top-0 p-2 rounded-lg shadow-sm transition hover:scale-105
        ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-green-700 dark:text-green-400">
          Settings
        </h1>
      </header>

      {/* Search Bar */}
      <div className="relative max-w-5xl mx-auto mb-3">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search settings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full h-11 pl-10 pr-4 rounded-2xl border shadow-sm transition
            focus:outline-none focus:ring-2 focus:ring-green-500
            ${
              darkMode
                ? "bg-gray-900 border-gray-800 text-gray-100 placeholder-gray-500"
                : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
            }`}
        />
      </div>

      {/* Settings List */}
      {categories.length > 0 ? (
        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-800 shadow-sm"
        >
          {categories.map((category) => {
            const Icon = categoryIcons[category.id] || SettingsIcon;
            return (
              <motion.li
                key={category.id}
                variants={rowVariants}
                onClick={() => onSelectCategory(category.id)}
                className={`flex items-start gap-4 pl-0 pr-6 py-3 cursor-pointer transition
                  hover:bg-green-50 dark:hover:bg-gray-800/60`}
              >
                {/* Icon */}
                <div className="p-2 rounded-md bg-green-500/10 text-green-500 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold leading-snug group-hover:text-green-600 dark:group-hover:text-green-400">
                    {category.label}
                  </h2>
                  <p
                    className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {category.description}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      ) : (
        <div className="text-center mt-10">
          <p
            className={`text-base ${darkMode ? "text-gray-500" : "text-gray-600"}`}
          >
            No settings found for{" "}
            <span className="font-semibold">"{searchTerm}"</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsHub;

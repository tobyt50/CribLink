import {
    ArrowDownIcon,
    ArrowUpIcon,
    Squares2X2Icon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, FileText, LayoutList } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/admin/Sidebar"; // Import AdminSidebar
import AgencyAdminSidebar from "../components/agency/Sidebar";
import AgentSidebar from "../components/agent/Sidebar";
import ClientSidebar from "../components/client/Sidebar";
import ListingCard from "../components/ListingCard"; // Import the actual ListingCard
import API_BASE_URL from "../config";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import { useMessage } from "../context/MessageContext";
import { useSidebarState } from "../hooks/useSidebarState";
import { useTheme } from "../layouts/AppShell";

// Import the actual AgentCard, ClientCard, and AgencyCard components
import AgencyCard from "../components/AgencyCard"; // Correct path for AgencyCard
import ClientCard from "../components/agent/ClientCard"; // Correct path for ClientCard
import AgentCard from "../components/client/AgentCard"; // Correct path for AgentCard

// Reusable Dropdown Component (embedded directly in Favourites.js)
const Dropdown = ({
  options,
  value,
  onChange,
  placeholder,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        delayChildren: 0.05,
        staggerChildren: 0.02,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15, ease: "easeOut" },
    },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const selectedOptionLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10
                  ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
      >
        <span className="overflow-hidden truncate">{selectedOptionLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1  0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 overflow-hidden transform origin-top
                          ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                variants={itemVariants}
                whileHover={{ x: 5 }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200
                                  ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Skeleton for a general card (graphical view)
const CardSkeleton = ({ darkMode }) => (
  <div
    className={`rounded-xl shadow-lg p-4 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
  >
    <div
      className={`w-full h-32 rounded-lg ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}
    ></div>
    <div
      className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-2`}
    ></div>
    <div
      className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}
    ></div>
    <div className="flex justify-between items-center">
      <div
        className={`h-8 w-1/3 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
      ></div>
      <div
        className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
      ></div>
    </div>
  </div>
);

// Skeleton for a general table row
const TableRowSkeleton = ({ darkMode, numCols }) => (
  <tr
    className={`border-t animate-pulse ${darkMode ? "border-gray-700" : "border-gray-200"}`}
  >
    {[...Array(numCols)].map((_, i) => (
      <td key={i} className="px-1 py-2">
        <div
          className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}
        ></div>
      </td>
    ))}
  </tr>
);

const Favourites = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [favouriteListings, setFavouriteListings] = useState([]);
  const [favouriteAgents, setFavouriteAgents] = useState([]);
  const [favouriteAgencies, setFavouriteAgencies] = useState([]);
  const [favouriteClients, setFavouriteClients] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("created_at"); // Default sort key for listings
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("defaultListingsView") || "graphical",
  );
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [agencyId, setAgencyId] = useState(null);
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const {
    isMobile,
    isSidebarOpen,
    setIsSidebarOpen,
    isCollapsed,
    setIsCollapsed,
  } = useSidebarState();
  const [activeSection, setActiveSection] = useState("favourites");

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  const [page, setPage] = useState(1);
  // Dynamic tab state based on user role - moved up for proper initialization
  const [activeTab, setActiveTab] = useState(""); // Will be set dynamically

  const [itemsPerPage, setItemsPerPage] = useState(25); // Default to 25 items per page

  // Loading state
  const [loading, setLoading] = useState(true);

  // Update itemsPerPage based on the active tab and screen size
  useEffect(() => {
    if (activeTab === "listings") {
      // For listings: 20 items per page on mobile, 25 items per page on desktop
      setItemsPerPage(isMobile ? 20 : 25);
    } else {
      // For Agents, Clients, Agencies: 15 items per page (existing logic)
      setItemsPerPage(15);
    }
  }, [activeTab, isMobile]); // Depend on activeTab and isMobile

  const getTabsForRole = useCallback((role) => {
    if (role === "client" || role === "admin") {
      return [
        { id: "listings", label: "Listings" },
        { id: "agents", label: "Agents" },
        { id: "agencies", label: "Agencies" },
      ];
    } else if (role === "agent") {
      return [
        { id: "listings", label: "Listings" },
        { id: "clients", label: "Clients" },
        { id: "agencies", label: "Agencies" },
      ];
    } else if (role === "agency_admin") {
      return [
        { id: "listings", label: "Listings" },
        { id: "agents", label: "Agents" },
        { id: "clients", label: "Clients" },
      ];
    }
    return [{ id: "listings", label: "Listings" }]; // Default for guest or unknown roles
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target)
      ) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAuthenticatedUserInfo = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return { userId: null, role: "guest", agencyId: null };
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      return {
        userId: decoded.user_id,
        role: decoded.role,
        agencyId: decoded.agency_id,
      };
    } catch (error) {
      console.error("Error decoding token for authenticated user info:", error);
      return { userId: null, role: "guest", agencyId: null };
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          showMessage("You are not logged in. Please sign in.", "error");
          navigate("/signin");
          return;
        }

        const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data && data.user_id) {
          setCurrentUserId(data.user_id);
          const { userId, role, agencyId } = getAuthenticatedUserInfo();
          setUserRole(role);
          setAgencyId(agencyId);
          // Set initial active tab based on role
          const tabs = getTabsForRole(role);
          if (tabs.length > 0) {
            setActiveTab(tabs[0].id);
          }
        } else {
          showMessage("Invalid user data. Please sign in again.", "error");
          navigate("/signin");
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        showMessage("Failed to load user profile. Please sign in.", "error");
        navigate("/signin");
      }
    };
    fetchProfile();
  }, [navigate, showMessage, getAuthenticatedUserInfo, getTabsForRole]);

  const fetchFavourites = useCallback(async () => {
    if (!currentUserId || !userRole) {
      return;
    }
    setLoading(true); // Start loading

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch favourite listings
      const listingsRes = await axios.get(
        `${API_BASE_URL}/favourites/properties`,
        { headers },
      );
      setFavouriteListings(listingsRes.data.favourites || []);

      // Fetch favourite agents
      const agentsRes = await axios.get(`${API_BASE_URL}/favourites/agents`, {
        headers,
      });
      setFavouriteAgents(agentsRes.data.favourites || []);

      // Fetch favourite agencies
      const agenciesRes = await axios.get(
        `${API_BASE_URL}/favourites/agencies`,
        { headers },
      );
      setFavouriteAgencies(agenciesRes.data.favourites || []);

      // Fetch favourite clients (only for agents/agency_admins)
      if (userRole === "agent" || userRole === "agency_admin") {
        const clientsRes = await axios.get(
          `${API_BASE_URL}/favourites/clients`,
          { headers },
        );
        setFavouriteClients(clientsRes.data.favourites || []);
      } else {
        setFavouriteClients([]);
      }
    } catch (err) {
      console.error("Failed to fetch favourites:", err);
      showMessage("Failed to fetch favourites. Please try again.", "error");
    } finally {
      setLoading(false); // End loading
    }
  }, [currentUserId, userRole, showMessage]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

  // Effect to filter and sort data based on active tab
  useEffect(() => {
    let currentData = [];
    let currentSortKey = sortKey;

    switch (activeTab) {
      case "listings":
        currentData = [...favouriteListings];
        currentSortKey = sortKey === "created_at" ? "favourited_at" : sortKey; // Listings have favourited_at
        break;
      case "agents":
        currentData = [...favouriteAgents];
        currentSortKey = sortKey === "created_at" ? "full_name" : sortKey; // Agents sorted by name
        break;
      case "clients":
        currentData = [...favouriteClients]; // Assuming favouriteClients state exists
        currentSortKey = sortKey === "created_at" ? "full_name" : sortKey; // Clients sorted by name
        break;
      case "agencies":
        currentData = [...favouriteAgencies];
        currentSortKey = sortKey === "created_at" ? "name" : sortKey; // Agencies sorted by name
        break;
      default:
        currentData = [];
    }

    if (searchTerm) {
      currentData = currentData.filter((item) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        if (activeTab === "listings") {
          return (
            item.title.toLowerCase().includes(lowerSearchTerm) ||
            item.location.toLowerCase().includes(lowerSearchTerm) ||
            item.property_type.toLowerCase().includes(lowerSearchTerm)
          );
        } else if (activeTab === "agents" || activeTab === "clients") {
          return (
            item.full_name.toLowerCase().includes(lowerSearchTerm) ||
            item.email.toLowerCase().includes(lowerSearchTerm)
          );
        } else if (activeTab === "agencies") {
          return (
            item.name.toLowerCase().includes(lowerSearchTerm) ||
            item.email.toLowerCase().includes(lowerSearchTerm) ||
            item.address?.toLowerCase().includes(lowerSearchTerm)
          );
        }
        return false;
      });
    }

    currentData.sort((a, b) => {
      const aValue = a[currentSortKey];
      const bValue = b[currentSortKey];

      if (typeof aValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    setFilteredData(currentData);
    setPage(1); // Reset page on filter/sort change
  }, [
    searchTerm,
    favouriteListings,
    favouriteAgents,
    favouriteAgencies,
    favouriteClients,
    sortKey,
    sortDirection,
    activeTab,
    userRole,
  ]);

  const handleRemoveFavourite = async (type, id) => {
    showConfirm({
      title: `Remove ${type.charAt(0).toUpperCase() + type.slice(1)} from Favourites`,
      message: `Are you sure you want to remove this ${type} from your favourites?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          let endpoint = "";
          if (type === "listings") {
            endpoint = `${API_BASE_URL}/favourites/properties/${id}`;
          } else if (type === "agents") {
            endpoint = `${API_BASE_URL}/favourites/agents/${id}`;
          } else if (type === "clients") {
            endpoint = `${API_BASE_URL}/favourites/clients/${id}`;
          } else if (type === "agencies") {
            endpoint = `${API_BASE_URL}/favourites/agencies/${id}`;
          }

          if (endpoint) {
            await axios.delete(endpoint, {
              headers: { Authorization: `Bearer ${token}` },
            });
            showMessage(
              `${type.charAt(0).toUpperCase() + type.slice(1)} removed from favourites!`,
              "success",
            );
            fetchFavourites(); // Re-fetch data to update the list
          } else {
            showMessage("Invalid favourite type.", "error");
          }
        } catch (err) {
          console.error(`Failed to remove favourite ${type}:`, err);
          showMessage(
            `Failed to remove ${type} from favourites. Please try again.`,
            "error",
          );
        }
      },
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
    });
  };

  const handleSortClick = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (key) => {
    if (sortKey === key) {
      return sortDirection === "asc" ? (
        <ArrowUpIcon
          className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`}
        />
      ) : (
        <ArrowDownIcon
          className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`}
        />
      );
    }
    return (
      <ArrowDownIcon
        className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`}
      />
    );
  };

  const handleExportCsv = (scope) => {
    const dataToExport =
      scope === "current"
        ? filteredData
        : activeTab === "listings"
          ? favouriteListings
          : activeTab === "agents"
            ? favouriteAgents
            : activeTab === "clients"
              ? favouriteClients
              : favouriteAgencies;

    if (dataToExport.length === 0) {
      showMessage(`No data found for ${scope} export.`, "info");
      setIsExportDropdownOpen(false);
      return;
    }

    let headers = [];
    if (activeTab === "listings") {
      headers = [
        "property_id",
        "title",
        "location",
        "price",
        "property_type",
        "bedrooms",
        "bathrooms",
        "favourited_at",
      ];
    } else if (activeTab === "agents" || activeTab === "clients") {
      headers = [
        "user_id",
        "full_name",
        "email",
        "phone",
        "date_joined",
        "favourited_at",
      ];
    } else if (activeTab === "agencies") {
      headers = [
        "agency_id",
        "name",
        "email",
        "phone",
        "address",
        "favourited_at",
      ];
    }

    const csvRows = dataToExport.map((item) => {
      if (activeTab === "listings") {
        return [
          item.property_id,
          item.title,
          item.location,
          item.price,
          item.property_type,
          item.bedrooms || "N/A",
          item.bathrooms || "N/A",
          new Date(item.favourited_at).toLocaleDateString(),
        ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
      } else if (activeTab === "agents" || activeTab === "clients") {
        return [
          item.user_id,
          item.full_name,
          item.email,
          item.phone || "N/A",
          new Date(item.date_joined).toLocaleDateString(),
          new Date(item.favourited_at).toLocaleDateString(),
        ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
      } else if (activeTab === "agencies") {
        return [
          item.agency_id,
          item.name,
          item.email,
          item.phone || "N/A",
          item.address || "N/A",
          new Date(item.favourited_at).toLocaleDateString(),
        ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
      }
      return [];
    });

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `favourites_${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
    showMessage("Data exported successfully!", "success");
  };

  const contentShift = isMobile ? 0 : isCollapsed ? 80 : 256; // Sidebar width

  const handleViewProfile = (id) => {
    // Navigate to respective profile pages based on activeTab
    if (activeTab === "agents") {
      navigate(`/agents/${id}`);
    } else if (activeTab === "clients") {
      navigate(`/agent/client-profile/${id}`); // Assuming this path for client profiles
    } else if (activeTab === "agencies") {
      navigate(`/agencies/${id}`); // Assuming this path for agency profiles
    }
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/listings/${propertyId}`);
  };

  // Determine the base path for add/edit listing based on role
  const getRoleBasePath = useCallback(() => {
    if (userRole === "admin") return "/admin";
    if (userRole === "agency_admin") return "/agency";
    if (userRole === "agent") return "/agent";
    return ""; // Default or handle unauthorized access
  }, [userRole]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const renderContent = () => {
    if (loading) {
      if (viewMode === "graphical") {
        return (
          <div
            className={`grid gap-6 ${activeTab === "listings" ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"}`}
          >
            {[...Array(itemsPerPage)].map((_, i) => (
              <CardSkeleton key={i} darkMode={darkMode} />
            ))}
          </div>
        );
      } else {
        // Simple (Table) View
        let numCols;
        if (activeTab === "listings") numCols = 6;
        else if (activeTab === "agents" || activeTab === "clients") numCols = 5;
        else if (activeTab === "agencies") numCols = 5;
        else numCols = 5; // Default

        return (
          <div className="overflow-x-auto">
            <table
              className={`w-full text-sm table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              <thead>
                <tr
                  className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {activeTab === "listings" && (
                    <>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Title
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Location
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Price
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Type
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Favourited At
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Actions
                      </th>
                    </>
                  )}
                  {(activeTab === "agents" || activeTab === "clients") && (
                    <>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Name
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Email
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Phone
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Favourited At
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Actions
                      </th>
                    </>
                  )}
                  {activeTab === "agencies" && (
                    <>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Name
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Email
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Phone
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Favourited At
                      </th>
                      <th className="text-left py-2 px-1 whitespace-nowrap">
                        Actions
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody
                className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}
              >
                {[...Array(itemsPerPage)].map((_, i) => (
                  <TableRowSkeleton
                    key={i}
                    darkMode={darkMode}
                    numCols={numCols}
                  />
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    if (paginatedData.length === 0) {
      return (
        <div
          className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          No favourite {activeTab} found matching your criteria.
        </div>
      );
    }

    if (viewMode === "graphical") {
      return (
        // Apply 2 columns for 'listings' on all mobile sizes, and 5 columns on desktop
        // For 'agents', 'clients', 'agencies', maintain 1 column on smallest mobile, 2 on small, and 3 on medium/large screens
        <div
          className={`grid gap-6 ${activeTab === "listings" ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"}`}
        >
          {activeTab === "listings" &&
            paginatedData.map((item) => (
              <ListingCard
                key={item.property_id}
                listing={item}
                onFavouriteToggle={() =>
                  handleRemoveFavourite("listings", item.property_id)
                }
                isFavourited={true} // Always true as they are in favourites
                darkMode={darkMode}
                userRole={userRole} // Pass user role
                userId={currentUserId} // Pass current user ID
                userAgencyId={agencyId} // Pass agency ID
                getRoleBasePath={getRoleBasePath} // Pass the function
                onDeleteListing={() =>
                  handleRemoveFavourite("listings", item.property_id)
                } // Pass delete function
              />
            ))}
          {activeTab === "agents" &&
            paginatedData.map((item) => (
              <AgentCard
                key={item.user_id}
                agent={item}
                onViewProfile={handleViewProfile}
                onFavouriteToggle={() =>
                  handleRemoveFavourite("agents", item.user_id)
                }
                isFavourited={true}
                darkMode={darkMode}
                // Pass other necessary props for AgentCard if needed, e.g., connectionStatus
              />
            ))}
          {activeTab === "clients" &&
            paginatedData.map((item) => (
              <ClientCard
                key={item.user_id}
                client={item}
                onViewProfile={handleViewProfile}
                onFavouriteToggle={() =>
                  handleRemoveFavourite("clients", item.user_id)
                }
                isFavourited={true}
                darkMode={darkMode}
                userRole={userRole} // Pass userRole to ClientCard
                // Pass other necessary props for ClientCard if needed, e.g., editingNoteId, etc.
              />
            ))}
          {activeTab === "agencies" &&
            paginatedData.map((item) => (
              <AgencyCard
                key={item.agency_id}
                agency={item}
                onClick={handleViewProfile} // AgencyCard uses onClick for view profile
                onFavouriteToggle={() =>
                  handleRemoveFavourite("agencies", item.agency_id)
                }
                isFavourited={true}
                // Pass other necessary props for AgencyCard if needed, e.g., isCurrentUserAgent
              />
            ))}
        </div>
      );
    } else {
      // Simple (Table) View
      return (
        <div className="overflow-x-auto">
          <table
            className={`w-full text-sm table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            <thead>
              <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {activeTab === "listings" && (
                  <>
                    <th
                      onClick={() => handleSortClick("title")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Title {renderSortIcon("title")}
                    </th>
                    <th
                      onClick={() => handleSortClick("location")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Location {renderSortIcon("location")}
                    </th>
                    <th
                      onClick={() => handleSortClick("price")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Price {renderSortIcon("price")}
                    </th>
                    <th
                      onClick={() => handleSortClick("property_type")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Type {renderSortIcon("property_type")}
                    </th>
                    <th
                      onClick={() => handleSortClick("favourited_at")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Favourited At {renderSortIcon("favourited_at")}
                    </th>
                    <th className="text-left py-2 px-1 whitespace-nowrap">
                      Actions
                    </th>
                  </>
                )}
                {(activeTab === "agents" || activeTab === "clients") && (
                  <>
                    <th
                      onClick={() => handleSortClick("full_name")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Name {renderSortIcon("full_name")}
                    </th>
                    <th
                      onClick={() => handleSortClick("email")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Email {renderSortIcon("email")}
                    </th>
                    <th className="text-left py-2 px-1 whitespace-nowrap">
                      Phone
                    </th>
                    <th
                      onClick={() => handleSortClick("favourited_at")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Favourited At {renderSortIcon("favourited_at")}
                    </th>
                    <th className="text-left py-2 px-1 whitespace-nowrap">
                      Actions
                    </th>
                  </>
                )}
                {activeTab === "agencies" && (
                  <>
                    <th
                      onClick={() => handleSortClick("name")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Name {renderSortIcon("name")}
                    </th>
                    <th
                      onClick={() => handleSortClick("email")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Email {renderSortIcon("email")}
                    </th>
                    <th className="text-left py-2 px-1 whitespace-nowrap">
                      Phone
                    </th>
                    <th
                      onClick={() => handleSortClick("favourited_at")}
                      className="cursor-pointer text-left py-2 px-1 whitespace-nowrap"
                    >
                      Favourited At {renderSortIcon("favourited_at")}
                    </th>
                    <th className="text-left py-2 px-1 whitespace-nowrap">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody
              className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}
            >
              {paginatedData.map((item) => (
                <tr
                  key={item.property_id || item.user_id || item.agency_id}
                  className={`border-t cursor-pointer break-words ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"}`}
                  onClick={() => {
                    if (activeTab === "listings")
                      handleViewProperty(item.property_id);
                    else if (activeTab === "agents" || activeTab === "clients")
                      handleViewProfile(item.user_id);
                    else if (activeTab === "agencies")
                      handleViewProfile(item.agency_id);
                  }}
                >
                  {activeTab === "listings" && (
                    <>
                      <td className="px-1 py-2" title={item.title}>
                        {item.title}
                      </td>
                      <td className="px-1 py-2" title={item.location}>
                        {item.location}
                      </td>
                      <td className="px-1 py-2">
                        ${item.price?.toLocaleString()}
                      </td>
                      <td className="px-1 py-2">{item.property_type}</td>
                      <td className="px-1 py-2">
                        {new Date(item.favourited_at).toLocaleDateString()}
                      </td>
                      <td
                        className="px-1 py-2 flex gap-1 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            handleRemoveFavourite("listings", item.property_id)
                          }
                          className={`p-2 rounded-full ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                          title="Remove from Favourites"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </>
                  )}
                  {(activeTab === "agents" || activeTab === "clients") && (
                    <>
                      <td className="px-1 py-2" title={item.full_name}>
                        {item.full_name}
                      </td>
                      <td className="px-1 py-2" title={item.email}>
                        {item.email}
                      </td>
                      <td className="px-1 py-2" title={item.phone}>
                        {item.phone || "N/A"}
                      </td>
                      <td className="px-1 py-2">
                        {new Date(item.favourited_at).toLocaleDateString()}
                      </td>
                      <td
                        className="px-1 py-2 flex gap-1 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            handleRemoveFavourite(activeTab, item.user_id)
                          }
                          className={`p-2 rounded-full ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                          title="Remove from Favourites"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </>
                  )}
                  {activeTab === "agencies" && (
                    <>
                      <td className="px-1 py-2" title={item.name}>
                        {item.name}
                      </td>
                      <td className="px-1 py-2" title={item.email}>
                        {item.email}
                      </td>
                      <td className="px-1 py-2" title={item.phone}>
                        {item.phone || "N/A"}
                      </td>
                      <td className="px-1 py-2" title={item.address}>
                        {item.address || "N/A"}
                      </td>
                      <td
                        className="px-1 py-2 flex gap-1 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            handleRemoveFavourite("agencies", item.agency_id)
                          }
                          className={`p-2 rounded-full ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
                          title="Remove from Favourites"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div
      className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-0 md:px-0 min-h-screen flex flex-col`}
    >
      <button
        onClick={handleBack}
        aria-label="Go back"
        className={`absolute left-4 mt-5 p-2 rounded-lg shadow-sm transition hover:scale-105
    ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}
      >
        <ArrowLeft size={20} />
      </button>

      {userRole === "client" && (
        <ClientSidebar
          collapsed={isMobile ? false : isCollapsed}
          setCollapsed={isMobile ? () => {} : setIsCollapsed}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isMobile={isMobile}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}
      {userRole === "agent" && (
        <AgentSidebar
          collapsed={isMobile ? false : isCollapsed}
          setCollapsed={isMobile ? () => {} : setIsCollapsed}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isMobile={isMobile}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}
      {userRole === "agency_admin" && (
        <AgencyAdminSidebar
          collapsed={isMobile ? false : isCollapsed}
          setCollapsed={isMobile ? () => {} : setIsCollapsed}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isMobile={isMobile}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}
      {userRole === "admin" && ( // Conditional rendering for AdminSidebar
        <AdminSidebar
          collapsed={isMobile ? false : isCollapsed}
          setCollapsed={isMobile ? () => {} : setIsCollapsed}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isMobile={isMobile}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}

      <motion.div
        key={isMobile ? "mobile" : "desktop"}
        animate={{ marginLeft: contentShift }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        initial={false}
        className="pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0"
        style={{ minWidth: `calc(100% - ${contentShift}px)` }}
      >
        <div className="md:hidden flex items-center justify-center mb-4">
          <h1
            className={`text-2xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Favourites
          </h1>
        </div>

        <div className="hidden md:block mb-6">
          <h1
            className={`text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}
          >
            Favourites
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${isMobile ? "" : "rounded-3xl p-6 shadow"} space-y-4 max-w-full ${isMobile ? "" : darkMode ? "bg-gray-800" : "bg-white"}`}
        >
          {/* Desktop View: Search, Tabs, View Mode on one line */}
          <div className="hidden md:grid grid-cols-3 items-center gap-4 mb-6 max-w-[1344px] mx-auto">
            {/* Search Bar (Left) */}
            <div className="flex justify-start w-full">
              <input
                type="text"
                placeholder={`Search favourite ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full max-w-[28rem] px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
              />
            </div>

            {/* Tabs (Center) */}
            <div className="flex justify-center w-full max-w-[28rem] whitespace-nowrap">
              {getTabsForRole(userRole).map((tab, index, arr) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-[11px] text-sm font-semibold truncate transition-colors duration-200
                    ${activeTab === tab.id ? "bg-green-700 text-white shadow-lg" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
                            ${index === 0 ? "rounded-l-xl" : ""} ${index === arr.length - 1 ? "rounded-r-xl" : ""}
                            ${arr.length === 1 ? "rounded-xl" : ""}
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Mode Controls (Right) */}
            <div className="flex justify-end gap-2 items-center">
              <div
                className="relative inline-block text-left"
                ref={exportDropdownRef}
              >
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="inline-flex justify-center items-center gap-x-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600 h-10"
                  title="Export to CSV"
                >
                  Export to CSV <FileText className="ml-2 h-5 w-5" />
                </button>
                {isExportDropdownOpen && (
                  <div
                    className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-900"}`}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => handleExportCsv("current")}
                        className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}
                      >
                        Current View
                      </button>
                      <button
                        onClick={() => handleExportCsv("all")}
                        className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}
                      >
                        All{" "}
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setViewMode("simple");
                  localStorage.setItem("defaultListingsView", "simple");
                }}
                className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === "simple" ? "bg-green-700 text-white" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
              >
                <LayoutList className="h-6 w-6" />
              </button>
              <button
                onClick={() => {
                  setViewMode("graphical");
                  localStorage.setItem("defaultListingsView", "graphical");
                }}
                className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === "graphical" ? "bg-green-700 text-white" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
              >
                <Squares2X2Icon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile View: Search and View Mode on one line, Tabs below */}
          <div className="md:hidden flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              {/* Search Bar (Left) */}
              <input
                type="text"
                placeholder={`Search favourite ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"}`}
              />
              {/* View Mode Controls (Right) */}
              <div className="flex gap-2 items-center flex-shrink-0">
                <div
                  className="relative inline-block text-left"
                  ref={exportDropdownRef}
                >
                  <button
                    onClick={() =>
                      setIsExportDropdownOpen(!isExportDropdownOpen)
                    }
                    className="p-2 rounded-xl bg-green-500 text-white shadow-md h-10 w-10 flex items-center justify-center"
                    title="Export"
                  >
                    <FileText size={20} />
                  </button>
                  {isExportDropdownOpen && (
                    <div
                      className={`absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-900"}`}
                    >
                      <div className="py-1">
                        <button
                          onClick={() => handleExportCsv("current")}
                          className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}
                        >
                          Current View
                        </button>
                        <button
                          onClick={() => handleExportCsv("all")}
                          className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"} rounded-xl`}
                        >
                          All{" "}
                          {activeTab.charAt(0).toUpperCase() +
                            activeTab.slice(1)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setViewMode("simple");
                    localStorage.setItem("defaultListingsView", "simple");
                  }}
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === "simple" ? "bg-green-700 text-white" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
                >
                  <LayoutList className="h-6 w-6" />
                </button>
                <button
                  onClick={() => {
                    setViewMode("graphical");
                    localStorage.setItem("defaultListingsView", "graphical");
                  }}
                  className={`p-2 rounded-xl h-10 w-10 flex items-center justify-center ${viewMode === "graphical" ? "bg-green-700 text-white" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}
                >
                  <Squares2X2Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
            {/* Tabs (Below) */}
            <div className="flex justify-center">
              {getTabsForRole(userRole).map((tab, index, arr) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2 text-base font-semibold transition-colors duration-200 flex-1
                            ${activeTab === tab.id ? "bg-green-700 text-white shadow-lg" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
                            ${index === 0 ? "rounded-l-xl" : ""} ${index === arr.length - 1 ? "rounded-r-xl" : ""}
                            ${arr.length === 1 ? "rounded-xl" : ""}
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {renderContent()}

          {totalItems > 0 && !loading && (
            <div className="flex justify-center items-center space-x-4 mt-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
              >
                Prev
              </button>
              <span
                className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages || totalPages === 0}
                className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700"}`}
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Favourites;

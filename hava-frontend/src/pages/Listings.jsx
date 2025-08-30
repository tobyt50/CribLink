// src/pages/Listings.jsx (Refactored)
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminSidebar from "../components/admin/Sidebar";
import AgencyAdminSidebar from "../components/agency/Sidebar";
import AgentSidebar from "../components/agent/Sidebar";
import ListingCardSkeleton from "../components/listings/ListingCardSkeleton";
import ListingTableRowSkeleton from "../components/listings/ListingTableRowSkeleton";
import ListingsGrid from "../components/listings/ListingsGrid";
import ListingsHeader from "../components/listings/ListingsHeader";
import ListingsTable from "../components/listings/ListingsTable";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import { useMessage } from "../context/MessageContext";
import { useSidebarState } from "../hooks/useSidebarState";
import { useTheme } from "../layouts/AppShell";

const Listings = () => {
  // --- STATE MANAGEMENT ---
  // All state hooks remain in the main component to be passed down as props.
  const [listings, setListings] = useState([]); // Raw listings from API
  const [filteredAndSortedListings, setFilteredAndSortedListings] = useState([]); // For client-side sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("defaultListingsView") || "simple");
  const [sortKey, setSortKey] = useState("date_listed");
  const [sortDirection, setSortDirection] = useState("desc");
  const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState("");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState(page);
  const [totalListings, setTotalListings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userFavourites, setUserFavourites] = useState([]);
  const [agencyName, setAgencyName] = useState("");
  const limit = 20; // Items per page

  // --- HOOKS ---
  const navigate = useNavigate();
  const location = useLocation();
  const { agencyId } = useParams();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();
  const { user } = useAuth();
  const userRole = user?.role;
  const userId = user?.user_id;
  const userAgencyId = user?.agency_id;
  const { isMobile, isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed } = useSidebarState();

  // --- FILTERS & NAVIGATION STATE ---
  const [activeSection, setActiveSection] = useState("listings");
  const [statusFilter, setStatusFilter] = useState(() => location.state?.statusFilter || "all");
  const [agencyIdFilter, setAgencyIdFilter] = useState(agencyId || null);

  // --- EFFECTS ---
  // Effect to sync URL/location state with component filter state
  useEffect(() => {
    if (location.state?.statusFilter && location.state.statusFilter !== statusFilter) {
      setStatusFilter(location.state.statusFilter);
      setPage(1);
    }
    if (agencyId && agencyId !== agencyIdFilter) {
      setAgencyIdFilter(agencyId);
      setPage(1);
    } else if (!agencyId && agencyIdFilter) {
      setAgencyIdFilter(null);
      setPage(1);
    }
  }, [location.state?.statusFilter, statusFilter, agencyId, agencyIdFilter]);

  // --- DATA FETCHING ---
  const fetchUserFavourites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserFavourites([]);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/favourites/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserFavourites(response.data.favourites.map((fav) => fav.property_id));
    } catch (error) {
      console.error("Failed to fetch user favourites:", error);
      setUserFavourites([]);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (purchaseCategoryFilter && purchaseCategoryFilter.toLowerCase() !== "all") {
        params.append("purchase_category", purchaseCategoryFilter);
      }
      if (searchTerm) params.append("search", searchTerm);
      if (minPriceFilter) params.append("min_price", minPriceFilter);
      if (maxPriceFilter) params.append("max_price", maxPriceFilter);
      if (statusFilter && statusFilter.toLowerCase() !== "all statuses") {
        params.append("status", statusFilter);
      }
      if (agencyIdFilter) {
        params.append("agency_id", agencyIdFilter);
      } else if (userRole === "agent" && userId) {
        params.append("agent_id", userId);
      } else if (userRole === "agency_admin" && userAgencyId) {
        params.append("agency_id", userAgencyId);
      }
      params.append("page", page);
      params.append("limit", limit);

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE_URL}/listings?${params.toString()}`, { headers });

      setListings(response.data.listings || []);
      setTotalListings(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching listings:", err.response?.data || err.message);
      showMessage("Failed to fetch listings. Please try again.", "error");
      setListings([]);
      setFilteredAndSortedListings([]);
      setTotalListings(0);
      setTotalPages(1);
      if (err.response && err.response.status === 401) {
        navigate("/signin");
      }
    } finally {
      setLoading(false);
    }
  }, [
    purchaseCategoryFilter,
    searchTerm,
    minPriceFilter,
    maxPriceFilter,
    statusFilter,
    page,
    limit,
    userRole,
    userId,
    userAgencyId,
    agencyIdFilter,
    navigate,
    showMessage,
  ]);

  const fetchAgencyDetails = useCallback(async () => {
    if (!agencyIdFilter) {
      setAgencyName("");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_BASE_URL}/agencies/${agencyIdFilter}`, config);
      setAgencyName(response.data.name);
    } catch (error) {
      console.error("Failed to fetch agency details:", error);
      setAgencyName("");
    }
  }, [agencyIdFilter]);

  // Main data fetching effect
  useEffect(() => {
    fetchListings();
    fetchUserFavourites();
    fetchAgencyDetails();
  }, [fetchListings, fetchUserFavourites, fetchAgencyDetails]);

  // --- CLIENT-SIDE SORTING ---
  const applySorting = useCallback(() => {
    let sortedData = [...listings].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (sortKey === "price") {
        const numA = parseFloat(String(aValue).replace(/[^0-9.-]+/g, ""));
        const numB = parseFloat(String(bValue).replace(/[^0-9.-]+/g, ""));
        if (!isNaN(numA) && !isNaN(numB)) return sortDirection === "asc" ? numA - numB : numB - numA;
        if (!isNaN(numA)) return sortDirection === "asc" ? -1 : 1;
        if (!isNaN(numB)) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? -1 : 1;
      if (bValue == null) return sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    setFilteredAndSortedListings(sortedData);
  }, [listings, sortKey, sortDirection]);

  useEffect(() => {
    applySorting();
  }, [listings, sortKey, sortDirection, applySorting]);

  useEffect(() => {
    setPageInput(page);
  }, [page]);  

  // --- ACTION HANDLERS ---
  const handleFavouriteToggle = useCallback(
    async (propertyId, isCurrentlyFavourited) => {
      const token = localStorage.getItem("token");
      if (!token) {
        showMessage("Please log in to manage your favourites.", "error");
        navigate("/signin");
        return;
      }
      try {
        if (isCurrentlyFavourited) {
          await axios.delete(`${API_BASE_URL}/favourites/properties/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
          showMessage("Removed from favourites!", "success");
        } else {
          await axios.post(`${API_BASE_URL}/favourites/properties`, { property_id: propertyId }, { headers: { Authorization: `Bearer ${token}` } });
          showMessage("Added to favourites!", "success");
        }
        fetchUserFavourites();
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Failed to update favourites.";
        showMessage(errorMessage, "error");
      }
    },
    [fetchUserFavourites, showMessage, navigate]
  );
  
  const handleApproveListing = async (listingId) => {
    showConfirm({
      title: "Approve Listing",
      message: "Are you sure you want to approve this listing and make it available?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: "Available" }, { headers: { Authorization: `Bearer ${token}` } });
          showMessage("Listing approved successfully!", "success");
          fetchListings();
        } catch (error) {
          showMessage("Failed to approve listing. Please try again.", "error");
        }
      },
    });
  };

  const handleRejectListing = async (listingId) => {
    showConfirm({
      title: "Reject Listing",
      message: "Are you sure you want to reject this listing?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: "rejected" }, { headers: { Authorization: `Bearer ${token}` } });
          showMessage("Listing rejected successfully!", "success");
          fetchListings();
        } catch (error) {
          showMessage("Failed to reject listing. Please try again.", "error");
        }
      },
    });
  };

  const handleMarkAsSold = async (listingId) => {
    showConfirm({
      title: "Mark as Sold",
      message: "Are you sure you want to mark this listing as 'Sold'?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: "Sold" }, { headers: { Authorization: `Bearer ${token}` } });
          showMessage("Listing marked as Sold successfully!", "success");
          fetchListings();
        } catch (error) {
          showMessage("Failed to mark listing as sold. Please try again.", "error");
        }
      },
    });
  };

  const handleMarkAsFailed = async (listingId) => {
    showConfirm({
      title: "Mark as Available",
      message: "Are you sure you want to mark this listing as 'Available' (undo offer)?",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(`${API_BASE_URL}/listings/${listingId}`, { status: "Available" }, { headers: { Authorization: `Bearer ${token}` } });
          showMessage("Listing marked as Available successfully!", "success");
          fetchListings();
        } catch (error) {
          showMessage("Failed to mark listing as available. Please try again.", "error");
        }
      },
    });
  };
  
  const handleDeleteListing = async (listingId) => {
    showConfirm({
      title: "Delete Listing",
      message: "Are you sure you want to delete this listing permanently? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${API_BASE_URL}/listings/${listingId}`, { headers: { Authorization: `Bearer ${token}` } });
          showMessage("Listing deleted successfully!", "success");
          fetchListings();
        } catch (error) {
          showMessage("Failed to delete listing. Please try again.", "error");
        }
      },
    });
  };

  const handleExportCsv = async (scope) => {
    const dataToExport = scope === "current" ? filteredAndSortedListings : listings;
    if (dataToExport.length === 0) {
      showMessage(`No listing data found for ${scope} export.`, "info");
      return;
    }
    const headers = ["property_id", "purchase_category", "title", "location", "state", "price", "status", "user_id", "date_listed", "property_type", "bedrooms", "bathrooms", "living_rooms", "kitchens"];
    const csvRows = dataToExport.map((l) => headers.map(header => `"${String(l[header] || 'N/A').replace(/"/g, '""')}"`));
    const csvContent = [headers.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "property_listings.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMessage("Listings exported successfully!", "success");
  };

  // --- EVENT HANDLERS (passed to child components) ---
  const handleBack = () => navigate(-1);
  const handleSearchChange = (e) => { setSearchTerm(e.target.value); setPage(1); };
  const handleStatusChange = useCallback((value) => { setStatusFilter(value); setPage(1); }, []);
  const handlePurchaseCategoryChange = (value) => { setPurchaseCategoryFilter(value); setPage(1); };
  const handleMinPriceChange = (e) => { setMinPriceFilter(e.target.value); setPage(1); };
  const handleMaxPriceChange = (e) => { setMaxPriceFilter(e.target.value); setPage(1); };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  const handleCardClick = (listingId) => navigate(`/listings/${listingId}`);

  const handleSortClick = (key) => {
    const sortableColumns = ["property_id", "title", "location", "property_type", "price", "status", "date_listed", "purchase_category", "bedrooms", "bathrooms", "living_rooms", "kitchens"];
    if (!sortableColumns.includes(key)) return;
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // --- DERIVED STATE & HELPERS ---
  const canPerformActions = useMemo(() => {
    if (!user) return false;
    if (userRole === "admin") return true;
    if (agencyIdFilter) {
      return (userRole === "agency_admin" || userRole === "agent") && parseInt(userAgencyId) === parseInt(agencyIdFilter);
    }
    return userRole === "agency_admin" || userRole === "agent";
  }, [user, userRole, agencyIdFilter, userAgencyId]);

  const hasSidebar = useMemo(() => {
    if (!user) return false;
    if (agencyIdFilter) {
      return userRole === "agency_admin" && parseInt(userAgencyId) === parseInt(agencyIdFilter);
    }
    return ["admin", "agency_admin", "agent"].includes(userRole);
  }, [user, userRole, userAgencyId, agencyIdFilter]);
  
  const contentShift = isMobile || !hasSidebar ? 0 : isCollapsed ? 80 : 256;
  const statusOptions = [{ value: "all", label: "All statuses" }, { value: "available", label: "Available" }, { value: "sold", label: "Sold" }, { value: "under offer", label: "Under offer" }, { value: "pending", label: "Pending" }, { value: "rejected", label: "Rejected" }, { value: "featured", label: "Featured" }];
  const getRoleBasePath = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "agency_admin") return "/agency";
    if (userRole === "agent") return "/agent";
    return "";
  };

  // --- RENDER LOGIC ---
  const renderSidebar = () => {
    if (!hasSidebar) return null;
    const sidebarProps = {
      collapsed: isMobile ? false : isCollapsed,
      setCollapsed: isMobile ? () => {} : setIsCollapsed,
      activeSection,
      setActiveSection,
      isMobile,
      isSidebarOpen,
      setIsSidebarOpen,
    };
    if (userRole === "admin") return <AdminSidebar {...sidebarProps} />;
    if (userRole === "agency_admin") return <AgencyAdminSidebar {...sidebarProps} />;
    if (userRole === "agent") return <AgentSidebar {...sidebarProps} />;
    return null;
  };
  
  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} -mt-12 px-0 md:px-0 min-h-screen flex flex-col`}>
      <button onClick={handleBack} aria-label="Go back" className={`absolute left-4 mt-5 p-2 rounded-lg shadow-sm transition hover:scale-105 ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-700"}`}>
        <ArrowLeft size={20} />
      </button>
      {renderSidebar()}
      <motion.div
  key={isMobile ? "mobile" : "desktop"}
  animate={{ marginLeft: contentShift }}
  transition={{ duration: 0.3 }}
  initial={false}
  className={`pt-6 px-4 md:px-8 flex-1 overflow-auto min-w-0 ${!hasSidebar && !isMobile ? "max-w-7xl mx-auto" : ""}`}
  style={{ minWidth: `calc(100% - ${contentShift}px)` }}
>
        <h1 className={`text-2xl md:text-3xl font-extrabold text-center mb-4 md:mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>
          {agencyIdFilter && agencyName ? `${agencyName} Listings` : "Listings"}
        </h1>

        <main className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`${isMobile ? "" : "rounded-3xl p-6 shadow"} space-y-4 max-w-full ${isMobile ? "" : darkMode ? "bg-gray-800" : "bg-white"}`}>
            {/* The ListingsHeader component now handles all filters, search, and action buttons. */}
            <ListingsHeader
              isMobile={isMobile}
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              purchaseCategoryFilter={purchaseCategoryFilter}
              handlePurchaseCategoryChange={handlePurchaseCategoryChange}
              statusFilter={statusFilter}
              handleStatusChange={handleStatusChange}
              statusOptions={statusOptions}
              minPriceFilter={minPriceFilter}
              handleMinPriceChange={handleMinPriceChange}
              maxPriceFilter={maxPriceFilter}
              handleMaxPriceChange={handleMaxPriceChange}
              viewMode={viewMode}
              setViewMode={setViewMode}
              shouldShowAddExportButtons={canPerformActions}
              handleExportCsv={handleExportCsv}
              getRoleBasePath={getRoleBasePath}
            />

            {loading ? (
              viewMode === "graphical" ? (
                <motion.div layout className="grid grid-cols-2 gap-2 md:gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[...Array(limit)].map((_, i) => <ListingCardSkeleton key={i} darkMode={darkMode} />)}
                </motion.div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full mt-4 text-sm table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {/* Skeleton header for table view */}
                    <thead>
                      <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                         {["ID", "Title", "Location", "Type", "Price", "Status", "Date Listed", "Category", "Bed", "Bath", "Living", "Kitchen", canPerformActions ? "Actions" : null].filter(Boolean).map(h => <th key={h} className="py-2 px-2 whitespace-nowrap"><div className="flex items-center gap-1"><span className="truncate">{h}</span></div></th>)}
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
                      {[...Array(limit)].map((_, i) => <ListingTableRowSkeleton key={i} darkMode={darkMode} />)}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredAndSortedListings.length === 0 ? (
              <div className={`text-center py-8 col-span-full ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No listings found matching your criteria.
              </div>
            ) : viewMode === "graphical" ? (
              // The ListingsGrid component now handles rendering the graphical view.
              <ListingsGrid
                listings={filteredAndSortedListings}
                userFavourites={userFavourites}
                handleFavouriteToggle={handleFavouriteToggle}
                userRole={userRole}
                userId={userId}
                userAgencyId={userAgencyId}
                getRoleBasePath={getRoleBasePath}
                handleDeleteListing={handleDeleteListing}
                showActions={canPerformActions}
              />
            ) : (
              // The ListingsTable component now handles rendering the table view.
              <ListingsTable
                listings={filteredAndSortedListings}
                handleSortClick={handleSortClick}
                sortKey={sortKey}
                sortDirection={sortDirection}
                handleCardClick={handleCardClick}
                showActionsColumn={canPerformActions}
                getRoleBasePath={getRoleBasePath}
                handleApproveListing={handleApproveListing}
                handleRejectListing={handleRejectListing}
                handleDeleteListing={handleDeleteListing}
                handleMarkAsSold={handleMarkAsSold}
                handleMarkAsFailed={handleMarkAsFailed}
                darkMode={darkMode}
              />
            )}

{totalPages > 1 && !loading && (
  <div className="flex flex-wrap justify-center items-center gap-4 mt-10 pb-8">
    {/* PREV BUTTON */}
    <button
      onClick={() => handlePageChange(page - 1)}
      disabled={page === 1}
      className={`flex items-center gap-2 text-sm transition-transform duration-150 disabled:opacity-40 ${
        darkMode
          ? "text-gray-300 hover:text-white hover:scale-105"
          : "text-gray-700 hover:text-black hover:scale-105"
      }`}
    >
      <ChevronLeft size={18} /> Prev
    </button>

    {/* PAGE INFO & SKIP TO PAGE FORM */}
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pageInput >= 1 && pageInput <= totalPages) handlePageChange(Number(pageInput));
      }}
      className="flex items-center gap-2"
    >
      <span
        className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
      >
        Page
      </span>

      <div
        className={`flex items-center border rounded-full px-1 ${
          darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
        }`}
      >
        <input
          type="number"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          placeholder={page}
          min="1"
          max={totalPages}
          className={`w-8 text-center bg-transparent py-1 focus:outline-none appearance-none ${
            darkMode ? "text-gray-200" : "text-gray-800"
          }`}
        />
        <button
          type="submit"
          className={`ml-1 px-1.5 py-0.5 text-sm transition-transform duration-150 ${
            darkMode
              ? "text-gray-300 hover:text-white hover:scale-105"
              : "text-gray-700 hover:text-black hover:scale-105"
          }`}
        >
          Go
        </button>
      </div>
    </form>

    {/* NEXT BUTTON */}
    <button
      onClick={() => handlePageChange(page + 1)}
      disabled={page === totalPages}
      className={`flex items-center gap-2 text-sm transition-transform duration-150 disabled:opacity-40 ${
        darkMode
          ? "text-gray-300 hover:text-white hover:scale-105"
          : "text-gray-700 hover:text-black hover:scale-105"
      }`}
    >
      Next <ChevronRight size={18} />
    </button>
  </div>
)}

          </motion.div>
        </main>
      </motion.div>
    </div>
  );
};

export default Listings;
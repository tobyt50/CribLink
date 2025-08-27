import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import API_BASE_URL from "../config";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useTheme } from "../layouts/AppShell";
import { useMessage } from "../context/MessageContext";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import { useAuth } from "../context/AuthContext";
import socket from "../socket";

// Import new components
import ImageGallery from "../components/ListingDetails/ImageGallery";
import ListingOverview from "../components/ListingDetails/ListingOverview";
import PropertyFeatures from "../components/ListingDetails/PropertyFeatures";
import AgentContactCard from "../components/ListingDetails/AgentContactCard";
import LocationMap from "../components/ListingDetails/LocationMap";
import SimilarListingsCarousel from "../components/ListingDetails/SimilarListingsCarousel";
import ModalsContainer from "../components/ListingDetails/ModalsContainer"; // New component for modals

// Loading Skeleton Component for Listing Details
const ListingDetailsSkeleton = ({ darkMode }) => {
  const skeletonBgClass = darkMode ? "bg-gray-700" : "bg-gray-200";
  const skeletonPulseClass = "animate-pulse";

  return (
    <motion.div
      className={`min-h-screen pt-0 -mt-6 px-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:max-w-7xl lg:mx-auto">
        {/* Left Column Skeleton */}
        <motion.div
          className={`w-full lg:w-3/5 space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Title Skeleton */}
          <div
            className={`h-8 w-3/4 rounded-md ${skeletonBgClass} ${skeletonPulseClass} mt-0 mb-1`}
          ></div>

          {/* Image Gallery Skeleton */}
          <div
            className={`relative w-full h-80 md:h-96 rounded-xl overflow-hidden mb-4 shadow-md ${skeletonBgClass} ${skeletonPulseClass}`}
          ></div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`h-16 w-full rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
            ))}
          </div>

          {/* Listing Overview Skeleton */}
          <div
            className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}
          >
            <div className="flex gap-2 items-center flex-wrap">
              <div
                className={`h-6 w-24 rounded-full ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
              <div
                className={`h-6 w-24 rounded-full ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
              <div
                className={`h-8 w-10 rounded-full ${skeletonBgClass} ${skeletonPulseClass} ml-2`}
              ></div>
              <div
                className={`h-8 w-10 rounded-full ${skeletonBgClass} ${skeletonPulseClass} ml-2`}
              ></div>
            </div>
            <div
              className={`h-8 w-1/2 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
              <div
                className={`h-6 w-full rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
              <div
                className={`h-6 w-full rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
              <div
                className={`h-6 w-full rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
              <div
                className={`h-6 w-full rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
              <div
                className={`h-6 w-full rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
            </div>
          </div>

          {/* Property Features Skeleton */}
          <div
            className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}
          >
            <div
              className={`h-8 w-48 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-6 w-24 rounded-full ${skeletonBgClass} ${skeletonPulseClass}`}
                ></div>
              ))}
            </div>
            <div
              className={`h-8 w-48 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-6 w-full rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
                ></div>
              ))}
            </div>
          </div>

          {/* Description Skeleton */}
          <div className="space-y-2">
            <div
              className={`h-8 w-32 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
            <div
              className={`h-4 w-full rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
            <div
              className={`h-4 w-11/12 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
            <div
              className={`h-4 w-5/6 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
          </div>
        </motion.div>

        {/* Right Column Skeleton */}
        <motion.div
          className="w-full lg:w-2/5 space-y-8 p-4 md:p-0"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Agent Contact Card Skeleton */}
          <div
            className={`space-y-4 p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div
              className={`h-8 w-48 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 rounded-full ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
              <div className="flex flex-col space-y-2">
                <div
                  className={`h-6 w-32 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
                ></div>
                <div
                  className={`h-4 w-24 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
                ></div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`h-16 w-24 rounded-xl ${skeletonBgClass} ${skeletonPulseClass}`}
                ></div>
              ))}
            </div>
          </div>

          {/* Location Map Skeleton */}
          <div
            className={`space-y-4 p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <div
              className={`h-8 w-48 rounded-md ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div
                className={`flex-1 block w-full h-48 rounded-xl ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
              <div
                className={`flex-1 block w-full h-48 rounded-xl ${skeletonBgClass} ${skeletonPulseClass}`}
              ></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Similar Listings Carousel Skeleton */}
      <div
        className={`max-w-7xl mx-auto mt-12 space-y-6 p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <div
          className={`h-8 w-64 rounded-md mx-auto ${skeletonBgClass} ${skeletonPulseClass}`}
        ></div>
        <div className="flex overflow-x-hidden gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`flex-shrink-0 w-64 h-80 rounded-xl ${skeletonBgClass} ${skeletonPulseClass}`}
            ></div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ListingDetails = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [images, setImages] = useState([]);
  const [mainIndex, setMainIndex] = useState(0);
  const [direction, setDirection] = useState(0); // For image swiping animation
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [agentInfo, setAgentInfo] = useState(null);
  const [similarListings, setSimilarListings] = useState([]);
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { showConfirm } = useConfirmDialog();

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [userFavourites, setUserFavourites] = useState([]);

  const [isFavorited, setIsFavorited] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("none");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [agentClients, setAgentClients] = useState([]);

  const [isClientInquiryModalOpen, setIsClientInquiryModalOpen] =
    useState(false);
  const [conversationForClientModal, setConversationForClientModal] =
    useState(null);
  const [openedConversationId, setOpenedConversationId] = useState(null);

  const [loading, setLoading] = useState(true); // Added loading state

  const isLandProperty = listing?.property_type?.toLowerCase() === "land";

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserRole("guest");
        setUserId(null);
        return;
      }

      try {
        const { data } = await axiosInstance.get(
          `${API_BASE_URL}/users/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (data) {
          setUserRole(data.role);
          setUserId(data.user_id);
          setClientName(data.full_name || "");
          setClientEmail(data.email || "");
          setClientPhone(data.phone || "");
        } else {
          setUserRole("guest");
          setUserId(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Error fetching user profile in ListingDetails:", error);
        let errorMessage = "Failed to load user profile. Please try again.";
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        showMessage(errorMessage, "error");
        setUserRole("guest");
        setUserId(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };
    fetchUser();
  }, [showMessage]);

  const fetchAgentClients = useCallback(async () => {
    if (userRole === "agent" && userId) {
      try {
        const token = localStorage.getItem("token");
        const response = await axiosInstance.get(
          `${API_BASE_URL}/clients/agent/${userId}/clients`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setAgentClients(response.data);
      } catch (error) {
        console.error("Error fetching agent's clients:", error);
        showMessage("Failed to load your clients list.", "error");
        setAgentClients([]);
      }
    } else {
      setAgentClients([]);
    }
  }, [userRole, userId, showMessage]);

  const fetchUserFavourites = useCallback(async () => {
    if (!isAuthenticated) {
      setUserFavourites([]);
      return;
    }
    try {
      const response = await axiosInstance.get(`/favourites/properties`);
      setUserFavourites(response.data.favourites.map((fav) => fav.property_id));
    } catch (error) {
      console.error("Failed to fetch user favourites:", error);
      setUserFavourites([]); // Set to empty on error
    }
  }, [isAuthenticated]);

  const fetchListing = useCallback(async () => {
    if (!id || userRole === "") return;

    setLoading(true); // Set loading to true at the start of fetch
    try {
      const { data } = await axiosInstance.get(
        `${API_BASE_URL}/listings/${id}`,
      );
      setListing(data);

      const mainImage = data.image_url ? [data.image_url] : [];
      const gallery = data.gallery_images || [];
      setImages([...mainImage, ...gallery]);

      if (data.agent_name || data.agent_email || data.agent_phone) {
        setAgentInfo({
          id: data.agent_id,
          name: data.agent_name || "N/A",
          email: data.agent_email || "N/A",
          phone: data.agent_phone || "N/A",
          agency: data.agent_agency || "N/A",
          profilePic: `https://placehold.co/100x100/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=${(
            data.agent_name || "JD"
          )
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()}`,
        });
      } else {
        setAgentInfo(null);
      }

      const allListingsResponse = await axiosInstance.get(
        `${API_BASE_URL}/listings`,
      );
      const allListings = allListingsResponse.data.listings;

      const filteredSimilar = allListings.filter(
        (item) => item.property_id !== data.property_id,
      );
      setSimilarListings(filteredSimilar);
    } catch (error) {
      console.error(
        "Error fetching listing details or similar listings:",
        error,
      );
      let errorMessage = "Failed to load listing details.";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, "error");
      setListing(null);
      setSimilarListings([]);
      setAgentInfo(null);
    } finally {
      setLoading(false); // Set loading to false after fetch completes
    }
  }, [id, darkMode, showMessage, userRole]);

  const fetchConnectionStatus = useCallback(async () => {
    if (userRole === "client" && userId && agentInfo && agentInfo.id) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setConnectionStatus("none");
          return;
        }
        const response = await axiosInstance.get(
          `${API_BASE_URL}/clients/${userId}/connection-requests/status/${agentInfo.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setConnectionStatus(response.data.status);
      } catch (error) {
        console.error(
          "Error fetching connection status:",
          error.response?.data || error.message,
        );
        setConnectionStatus("none");
      }
    } else if (userRole === "guest" || userRole === "agent" || !agentInfo) {
      setConnectionStatus("none");
    }
  }, [userRole, userId, agentInfo, API_BASE_URL]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  useEffect(() => {
    if (!authLoading) {
      // Only run when the auth state is resolved
      fetchUserFavourites();
    }
  }, [authLoading, fetchUserFavourites]);

  useEffect(() => {
    if (userRole && userId && agentInfo && agentInfo.id) {
      fetchConnectionStatus();
    }
  }, [userRole, userId, agentInfo, fetchConnectionStatus]);

  useEffect(() => {
    if (userRole === "agent" && userId) {
      fetchAgentClients();
    }
  }, [userRole, userId, fetchAgentClients]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (userId && listing && userRole !== "guest") {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsFavorited(false);
          return;
        }
        try {
          const response = await axiosInstance.get(
            `${API_BASE_URL}/favourites/properties/status/${listing.property_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          setIsFavorited(response.data.isFavorited);
        } catch (error) {
          console.error("Error checking favorite status:", error);
          let errorMessage = "Failed to check favorite status.";
          if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          showMessage(errorMessage, "error");
          setIsFavorited(false);
        }
      } else {
        setIsFavorited(false);
      }
    };
    checkFavoriteStatus();
  }, [userId, listing, userRole, showMessage]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowPreview(false);
        setShowOptionsMenu(false);
        setIsShareModalOpen(false);
        setIsClientInquiryModalOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (
        showPreview &&
        previewRef.current &&
        !previewRef.current.contains(e.target)
      ) {
        setShowPreview(false);
      }
      if (
        showOptionsMenu &&
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(e.target)
      ) {
        setShowOptionsMenu(false);
      }
      if (isShareModalOpen && !e.target.closest(".relative.max-w-md")) {
        setIsShareModalOpen(false);
      }
    };

    if (
      showPreview ||
      showOptionsMenu ||
      isShareModalOpen ||
      isClientInquiryModalOpen
    ) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    showPreview,
    showOptionsMenu,
    isShareModalOpen,
    isClientInquiryModalOpen,
  ]);

  const formatPrice = (price, category) => {
    if (price == null) return "Price not available";
    const formatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
    switch (category) {
      case "Rent":
        return `${formatted} / Year`;
      case "Short Let":
        return `${formatted} / Night`;
      case "Long Let":
        return `${formatted} / Month`;
      default:
        return formatted;
    }
  };

  const getStatusLabel = (status) => {
    const statusText = (status || "").toLowerCase();
    switch (statusText) {
      case "available":
        return "✅ Available";
      case "sold":
        return "🔴 Sold";
      case "under offer":
        return "🤝 Under offer";
      case "pending":
        return "⏳ Pending";
      case "approved":
        return "👍 Approved";
      case "rejected":
        return "❌ Rejected";
      case "featured":
        return "⭐ Featured";
      default:
        return "❓ Unknown";
    }
  };

  const getStatusColor = (status) => {
    const statusText = (status || "").toLowerCase();
    switch (statusText) {
      case "sold":
        return "bg-red-600";
      case "available":
        return "bg-green-600";
      case "pending":
        return "bg-green-400";
      case "featured":
        return "bg-amber-500";
      case "under offer":
        return "bg-gray-500";
      case "approved":
        return "bg-purple-500";
      case "rejected":
        return "bg-red-800";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryLabel = (cat) => {
    const categoryText = (cat || "").toLowerCase();
    switch (categoryText) {
      case "sale":
        return "💰 For Sale";
      case "rent":
        return "🏠 For Rent";
      case "lease":
        return "📜 For Lease";
      case "short let":
        return "🏖️ Short Let";
      case "long let":
        return "🗓️ Long Let";
      default:
        return "🏡 Property";
    }
  };

  const paginateImage = (newDirection) => {
    setDirection(newDirection);
    setMainIndex(
      (prev) => (prev + newDirection + images.length) % images.length,
    );
  };

  const handleThumbClick = (index) => {
    setMainIndex(index);
  };

  const handleImageClick = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  const handleToggleFavorite = async () => {
    if (!userId || !listing || userRole === "guest") {
      showMessage("Please log in to add to favorites.", "info");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showMessage("Authentication token not found. Please log in.", "error");
      return;
    }

    try {
      if (isFavorited) {
        await axiosInstance.delete(
          `${API_BASE_URL}/favourites/properties/${listing.property_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setIsFavorited(false);
        showMessage("Removed from favorites!", "info");
      } else {
        await axiosInstance.post(
          `${API_BASE_URL}/favourites/properties`,
          { property_id: listing.property_id },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setIsFavorited(true);
        showMessage("Added to favorites!", "success");
      }
    } catch (err) {
      console.error(
        "Error toggling favorite status:",
        err.response?.data || err.message,
      );
      let errorMessage = "Failed to update favorite status. Please try again.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      showMessage(errorMessage, "error");
    }
  };

  const handleSendConnectionRequest = async () => {
    if (userRole !== "client" || !userId || !agentInfo || !agentInfo.id) {
      showMessage(
        "Please log in as a client to send connection requests.",
        "info",
      );
      return;
    }
    if (userId === agentInfo.id) {
      showMessage(
        "You cannot send a connection request to yourself.",
        "warning",
      );
      return;
    }

    if (
      connectionStatus === "pending_sent" ||
      connectionStatus === "pending_received" ||
      connectionStatus === "connected"
    ) {
      showMessage(
        `A connection request is already ${connectionStatus.replace("_", " ")}.`,
        "info",
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const message = `Hello, I'm interested in connecting with you regarding property ID ${listing.property_id || "N/A"}.`;
      const response = await axiosInstance.post(
        `${API_BASE_URL}/clients/${userId}/connection-requests/send-to-agent/${agentInfo.id}`,
        { message: message },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.status === 201 || response.status === 200) {
        showMessage(response.data.message, "success");
        setConnectionStatus(response.data.status || "pending_sent");
      }
    } catch (error) {
      console.error(
        "Error sending connection request:",
        error.response?.data || error.message,
      );
      showMessage(
        `Failed to send connection request: ${error.response?.data?.message || "Please try again."}`,
        "error",
      );
      fetchConnectionStatus();
    }
  };

  const handleDisconnectFromAgent = async () => {
    if (
      userRole !== "client" ||
      !userId ||
      !agentInfo ||
      !agentInfo.id ||
      connectionStatus !== "connected"
    ) {
      showMessage("You are not connected to this agent.", "info");
      return;
    }

    showConfirm({
      title: "Disconnect from Agent",
      message: `Are you sure you want to disconnect from ${agentInfo.name}? You can send a new request later.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await axiosInstance.put(
            `${API_BASE_URL}/clients/${userId}/connection-requests/disconnect/${agentInfo.id}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (response.status === 200) {
            showMessage("Disconnected from agent successfully.", "success");
            setConnectionStatus("none");
            setShowOptionsMenu(false);
          } else {
            showMessage(
              "Failed to disconnect from agent. Please try again.",
              "error",
            );
          }
        } catch (error) {
          console.error(
            "Error disconnecting from agent:",
            error.response?.data || error.message,
          );
          showMessage(
            `Failed to disconnect: ${error.response?.data?.message || "Please try again."}`,
            "error",
          );
          fetchConnectionStatus();
        }
      },
      confirmLabel: "Disconnect",
      cancelLabel: "Cancel",
    });
  };

  const handleViewProperty = useCallback(
    (propertyId) => {
      navigate(`/listings/${propertyId}`);
    },
    [navigate],
  );

  const fetchConversationForClientAndAgent = useCallback(async () => {
    if (!userId || !agentInfo || !agentInfo.id) {
      console.log(
        "Client ID or Agent ID not available for conversation fetch.",
      );
      return null;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/inquiries/agent/${agentInfo.id}/client/${userId}/conversation`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.conversation) {
          const conv = data.conversation;
          const formattedMessages = conv.messages.map((msg) => {
            const rawTimestamp = msg.timestamp || msg.created_at;
            const parsed = Date.parse(rawTimestamp);
            return {
              ...msg,
              sender: msg.sender_id === conv.client_id ? "Client" : "Agent",
              read: msg.read,
              timestamp: isNaN(parsed) ? null : new Date(parsed).toISOString(),
            };
          });

          return {
            id: conv.id,
            client_id: conv.client_id,
            agent_id: conv.agent_id,
            property_id: conv.property_id,
            clientName: conv.clientName || clientName,
            clientEmail: conv.clientEmail || clientEmail,
            clientPhone: conv.clientPhone || clientPhone,
            agentName: conv.agentName || agentInfo.name,
            agentEmail: conv.agentEmail || agentInfo.email,
            propertyTitle: conv.propertyTitle || listing.title,
            messages: formattedMessages,
            lastMessage: conv.last_message,
            lastMessageTimestamp: conv.last_message_timestamp,
            is_agent_responded: conv.is_agent_responded,
            unreadCount: conv.unread_messages_count,
          };
        }
        return null;
      } else if (res.status === 404) {
        return null;
      } else {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to fetch client conversation:", err);
      showMessage("Failed to load client conversation.", "error");
      return null;
    }
  }, [
    userId,
    agentInfo,
    clientName,
    clientEmail,
    clientPhone,
    listing?.title,
    showMessage,
  ]);

  const handleOpenChat = useCallback(async () => {
    if (!listing || !agentInfo) {
      showMessage("Listing or agent information is not available yet.", "info");
      return;
    }
    if (userRole === "guest") {
      setConversationForClientModal({
        isGuest: true,
        property_id: listing.property_id,
        agent_id: agentInfo.id,
        propertyTitle: listing.title,
        agentName: agentInfo.name,
        messages: [],
      });
      setIsClientInquiryModalOpen(true);
      return;
    }

    if (userRole !== "client" || !userId) {
      showMessage("You must be logged in as a client to start a chat.", "info");
      return;
    }

    let conversationToOpen = await fetchConversationForClientAndAgent();

    if (!conversationToOpen) {
      try {
        const token = localStorage.getItem("token");
        const createRes = await axiosInstance.post(
          `${API_BASE_URL}/inquiries/`,
          {
            client_id: userId,
            agent_id: agentInfo.id,
            property_id: listing.property_id,
            message_content: "::shell::",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (createRes.status === 201) {
          conversationToOpen = await fetchConversationForClientAndAgent();
          if (!conversationToOpen) {
            showMessage(
              "Failed to retrieve new conversation details.",
              "error",
            );
            return;
          }
          showMessage("New conversation started!", "success");
        } else {
          showMessage(
            `Failed to start new conversation: ${createRes.data.message || createRes.statusText}`,
            "error",
          );
          return;
        }
      } catch (err) {
        console.error(
          "Error creating new property inquiry:",
          err.response?.data || err.message,
        );
        showMessage(
          `Failed to start new conversation: ${err.response?.data?.error || "Please try again."}`,
          "error",
        );
        return;
      }
    }

    console.log("🧾 Chat conversation being opened:", conversationToOpen);
    setConversationForClientModal({ ...conversationToOpen });
    setIsClientInquiryModalOpen(true);
    setOpenedConversationId(conversationToOpen.id);

    if (conversationToOpen.unreadCount > 0) {
      const token = localStorage.getItem("token");
      try {
        await axiosInstance.put(
          `${API_BASE_URL}/inquiries/client/mark-read/${conversationToOpen.id}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        socket.emit("message_read", {
          conversationId: conversationToOpen.id,
          userId: userId,
          role: "client",
        });
        setConversationForClientModal((prev) =>
          prev ? { ...prev, unreadCount: 0 } : null,
        );
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
        showMessage("Failed to mark messages as read.", "error");
      }
    }
  }, [
    listing,
    agentInfo,
    userRole,
    userId,
    clientName,
    clientEmail,
    clientPhone,
    showMessage,
    fetchConversationForClientAndAgent,
  ]);

  const handleDeleteInquiry = useCallback(async () => {
    if (!conversationForClientModal) return;
    showConfirm({
      title: "Delete Conversation",
      message: `Are you sure you want to delete this conversation with ${conversationForClientModal.agentName}? This is irreversible.`,
      onConfirm: async () => {
        const token = localStorage.getItem("token");
        try {
          const res = await axiosInstance.delete(
            `${API_BASE_URL}/inquiries/client/delete-conversation/${conversationForClientModal.id}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (res.status === 200) {
            showMessage("Conversation deleted.", "success");
            setIsClientInquiryModalOpen(false);
            setConversationForClientModal(null);
            setOpenedConversationId(null);
          } else {
            showMessage("Failed to delete conversation.", "error");
          }
        } catch (error) {
          console.error(
            "Error deleting conversation:",
            error.response?.data || error.message,
          );
          showMessage(
            `Failed to delete conversation: ${error.response?.data?.message || "Please try again."}`,
            "error",
          );
        }
      },
    });
  }, [conversationForClientModal, showConfirm, showMessage]);

  const handleSendMessageToConversation = useCallback(
    async (conversationId, messageText, guestDetails = null) => {
      const token = localStorage.getItem("token");
      let payload;
      let endpoint;
      let headers = { "Content-Type": "application/json" };

      if (userRole === "guest" && guestDetails) {
        if (!conversationId) {
          endpoint = `${API_BASE_URL}/inquiries`;
          payload = {
            property_id: listing.property_id,
            agent_id: agentInfo.id,
            name: guestDetails.name,
            email: guestDetails.email,
            phone: guestDetails.phone,
            message_content: messageText,
          };
        } else {
          endpoint = `${API_BASE_URL}/inquiries/message`;
          payload = {
            conversation_id: conversationId,
            property_id: listing.property_id,
            message_content: messageText,
            recipient_id: agentInfo.id,
            message_type: "client_reply",
          };
        }
      } else if (userRole === "client") {
        endpoint = `${API_BASE_URL}/inquiries/message`;
        payload = {
          conversation_id: conversationId,
          property_id: listing.property_id,
          message_content: messageText,
          recipient_id: agentInfo.id,
          message_type: "client_reply",
        };
      } else {
        showMessage("Unauthorized action.", "error");
        return;
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      try {
        const response = await axiosInstance.post(endpoint, payload, {
          headers,
        });

        if (response.status === 201 || response.status === 200) {
          showMessage("Message sent!", "success");
          if (
            userRole === "guest" &&
            !conversationId &&
            response.data.conversation_id
          ) {
            const updatedConversation =
              await fetchConversationForClientAndAgent();
            if (updatedConversation) {
              setConversationForClientModal(updatedConversation);
              setOpenedConversationId(updatedConversation.id);
            }
          } else {
            const updatedConversation =
              await fetchConversationForClientAndAgent();
            if (updatedConversation) {
              setConversationForClientModal(updatedConversation);
            }
          }
        } else {
          showMessage(
            `Failed to send message: ${response.data.message || response.statusText}`,
            "error",
          );
        }
      } catch (error) {
        console.error(
          "Error sending message:",
          error.response?.data || error.message,
        );
        showMessage(
          `Failed to send message: ${error.response?.data?.error || "Please try again."}`,
          "error",
        );
      }
    },
    [
      userRole,
      userId,
      listing,
      agentInfo,
      showMessage,
      fetchConversationForClientAndAgent,
    ],
  );

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (conversationForClientModal?.id && userId) {
      socket.emit("join_conversation", conversationForClientModal.id);
    }

    const handleNewMessage = async (newMessage) => {
      if (
        !conversationForClientModal ||
        newMessage.conversationId !== conversationForClientModal.id
      ) {
        return;
      }

      const updatedConversation = await fetchConversationForClientAndAgent();
      if (updatedConversation) {
        setConversationForClientModal(updatedConversation);
      }

      const expectedAgentId = Number(
        newMessage.agentId ||
          newMessage.agent_id ||
          conversationForClientModal.agent_id,
      );
      const senderId = Number(newMessage.senderId);
      const isFromAgent = senderId === expectedAgentId;

      if (
        isFromAgent &&
        openedConversationId === conversationForClientModal.id
      ) {
        const token = localStorage.getItem("token");
        if (token && userId) {
          axiosInstance
            .put(
              `${API_BASE_URL}/inquiries/client/mark-read/${conversationForClientModal.id}`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            )
            .then((res) => {
              if (res.status === 200) {
                socket.emit("message_read", {
                  conversationId: conversationForClientModal.id,
                  userId: userId,
                  role: "client",
                });
              }
            })
            .catch((err) =>
              console.error("Error marking message as read via socket:", err),
            );
        }
      }
    };

    const handleReadAck = async ({ conversationId, readerId, role }) => {
      if (
        conversationId === conversationForClientModal?.id &&
        role === "agent"
      ) {
        const updatedConversation = await fetchConversationForClientAndAgent();
        if (updatedConversation) {
          setConversationForClientModal(updatedConversation);
        }
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_read_ack", handleReadAck);

    return () => {
      if (conversationForClientModal?.id && userId) {
        socket.emit("leave_conversation", conversationForClientModal.id);
      }
      socket.off("new_message", handleNewMessage);
      socket.off("message_read_ack", handleReadAck);
    };
  }, [
    conversationForClientModal,
    openedConversationId,
    userId,
    fetchConversationForClientAndAgent,
  ]);

  if (loading) {
    // Use the loading state to conditionally render the skeleton
    return <ListingDetailsSkeleton darkMode={darkMode} />;
  }

  if (!listing)
    return (
      <div
        className={`p-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
      >
        Listing not found or an error occurred.
      </div>
    );

  return (
    <motion.div
      className={`min-h-screen pt-0 -mt-6 px-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:max-w-7xl lg:mx-auto">
        <motion.div
          className={`w-full lg:w-3/5 space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex justify-between items-center flex-wrap mt-0 mb-1">
            <h1
              className={`text-2xl md:text-2xl font-extrabold ${darkMode ? "text-green-400" : "text-green-800"}`}
            >
              {listing.title}
            </h1>
          </div>

          {images.length > 0 && (
            <ImageGallery
              images={images}
              mainIndex={mainIndex}
              direction={direction}
              paginateImage={paginateImage}
              handleThumbClick={handleThumbClick}
              handleImageClick={handleImageClick}
              showPreview={showPreview}
              closePreview={closePreview}
              previewRef={previewRef}
              darkMode={darkMode}
            />
          )}
          <ListingOverview
            listing={listing}
            darkMode={darkMode}
            formatPrice={formatPrice}
            getStatusLabel={getStatusLabel}
            getStatusColor={getStatusColor}
            getCategoryLabel={getCategoryLabel}
            isFavorited={isFavorited}
            handleToggleFavorite={handleToggleFavorite}
            userRole={userRole}
            userId={userId}
            setIsShareModalOpen={setIsShareModalOpen}
            navigate={navigate}
          />

          <PropertyFeatures
            listing={listing}
            darkMode={darkMode}
            isLandProperty={isLandProperty}
          />

          {listing.description && (
            <div className="space-y-2">
              <h2
                className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}
              >
                Description
              </h2>
              <p
                className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}
              >
                {listing.description}
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          className="w-full lg:w-2/5 space-y-8 p-4 md:p-0"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {agentInfo && (
            <AgentContactCard
              agentInfo={agentInfo}
              darkMode={darkMode}
              userRole={userRole}
              userId={userId}
              connectionStatus={connectionStatus}
              handleSendConnectionRequest={handleSendConnectionRequest}
              handleDisconnectFromAgent={handleDisconnectFromAgent}
              handleOpenChat={handleOpenChat}
              navigate={navigate}
              showOptionsMenu={showOptionsMenu}
              setShowOptionsMenu={setShowOptionsMenu}
              optionsMenuRef={optionsMenuRef}
            />
          )}
          <LocationMap listing={listing} darkMode={darkMode} />
        </motion.div>
      </div>

      {similarListings.length > 0 && (
        <SimilarListingsCarousel
          similarListings={similarListings}
          darkMode={darkMode}
          userFavourites={userFavourites} // Pass the state array
          onFavoriteToggle={handleToggleFavorite}
        />
      )}

      <ModalsContainer
        isShareModalOpen={isShareModalOpen}
        setIsShareModalOpen={setIsShareModalOpen}
        listing={listing}
        agentClients={agentClients}
        darkMode={darkMode}
        currentAgentId={userId}
        userRole={userRole}
        isClientInquiryModalOpen={isClientInquiryModalOpen}
        conversationForClientModal={conversationForClientModal}
        setIsClientInquiryModalOpen={setIsClientInquiryModalOpen}
        setConversationForClientModal={setConversationForClientModal}
        setOpenedConversationId={setOpenedConversationId}
        handleViewProperty={handleViewProperty}
        handleDeleteInquiry={handleDeleteInquiry}
        handleSendMessageToConversation={handleSendMessageToConversation}
      />
    </motion.div>
  );
};

export default ListingDetails;

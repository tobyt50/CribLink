import React, { useState, useEffect, useRef, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTheme } from "../layouts/AppShell";
import {
  ChevronDown,
  X as CloseIcon,
  Lock,
  StarIcon as StarIconSolid,
} from "lucide-react";
import { useMessage } from "../context/MessageContext";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import { useAuth } from "../context/AuthContext";
import { SUBSCRIPTION_TIERS } from "../config/subscriptionConfig";

// Dropdown component remains exactly the same.
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
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
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
      {" "}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
      >
        {" "}
        <span className="overflow-hidden truncate">
          {selectedOptionLabel}
        </span>{" "}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {" "}
          <ChevronDown
            className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`}
          />{" "}
        </motion.div>{" "}
      </button>{" "}
      <AnimatePresence>
        {" "}
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 transform origin-top max-h-60 overflow-y-auto ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {" "}
            {options.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                variants={itemVariants}
                whileHover={{ x: 5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200 ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
              >
                {" "}
                {option.label}{" "}
              </motion.button>
            ))}{" "}
          </motion.div>
        )}{" "}
      </AnimatePresence>{" "}
    </div>
  );
};

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showConfirm } = useConfirmDialog();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user, loading: authLoading } = useAuth();

  // State
  const [initialState, setInitialState] = useState(null);
  const [tempState, setTempState] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImageURLs, setNewImageURLs] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [thumbnailIdentifier, setThumbnailIdentifier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeFeatured: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const previewRef = useRef(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const tier = useMemo(() => user?.subscription_type || "basic", [user]);
  const tierConfig = useMemo(
    () => SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS["basic"],
    [tier],
  );
  const isLandProperty = tempState?.propertyType === "Land";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      showMessage("You must be logged in to edit listings.", "error");
      navigate("/signin");
      return;
    }

    const fetchListingData = async () => {
      setLoading(true);
      try {
        const [listingRes, statsRes] = await Promise.all([
          axiosInstance.get(`/listings/${id}`),
          axiosInstance.get("/users/listing-stats"), // ✅ keep subscription stats
        ]);

        const data = listingRes.data;
        const fetchedState = {
          purchaseCategory: data.purchase_category || "",
          title: data.title || "",
          location: data.location || "",
          stateValue: data.state || "",
          propertyType: data.property_type || "",
          bedrooms: String(data.bedrooms || ""),
          bathrooms: String(data.bathrooms || ""),
          price: String(data.price || ""),
          description: data.description || "",
          squareFootage: String(data.square_footage || ""),
          lotSize: data.lot_size || "",
          yearBuilt: String(data.year_built || ""),
          heatingType: data.heating_type || "",
          coolingType: data.cooling_type || "",
          parking: data.parking || "",
          amenities: data.amenities || "",
          landSize: data.land_size || "",
          zoningType: data.zoning_type || "",
          titleType: data.title_type || "",
          isFeatured: data.is_featured || false,
          statusValue: data.status || "",
        };

        setTempState(fetchedState);
        setInitialState(fetchedState);

        // ✅ include main image + gallery
        const allGalleryImages = [
          ...(data.image_url
            ? [
                {
                  url: data.image_url,
                  identifier: data.image_url,
                  type: "main",
                },
              ]
            : []),
          ...(data.gallery_images
            ? data.gallery_images.map((url) => ({
                url,
                identifier: url,
                type: "existing",
              }))
            : []),
        ];

        setExistingImages(allGalleryImages);
        setThumbnailIdentifier(
          data.image_url || allGalleryImages[0]?.identifier || null,
        );

        // ✅ now stats is used again
        setStats(statsRes.data);
      } catch (error) {
        showMessage("Failed to load listing data.", "error");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [id, user, authLoading, showMessage, navigate]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setShowPreview(false);
    };
    const handleClickOutside = (e) => {
      if (
        showPreview &&
        previewRef.current &&
        !previewRef.current.contains(e.target)
      ) {
        setShowPreview(false);
      }
    };
    if (showPreview) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPreview]);

  const allImagesForDisplay = useMemo(
    () => [
      ...existingImages,
      ...newImages.map((img) => ({
        url: img.base64,
        identifier: img.originalname,
        type: "newFile",
      })),
      ...newImageURLs.map((url) => ({ url, identifier: url, type: "newUrl" })),
    ],
    [existingImages, newImages, newImageURLs],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const currentImageCount = allImagesForDisplay.length;
      if (currentImageCount >= tierConfig.maxImages) {
        showMessage(
          `Your '${tierConfig.name}' plan allows a maximum of ${tierConfig.maxImages} images.`,
          "error",
        );
        return;
      }
      const filesToAdd = acceptedFiles.slice(
        0,
        tierConfig.maxImages - currentImageCount,
      );
      filesToAdd.forEach((file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          setNewImages((prev) => [
            ...prev,
            { base64: reader.result, originalname: file.name },
          ]);
          if (!thumbnailIdentifier) setThumbnailIdentifier(file.name);
        };
      });
    },
    accept: { "image/*": [] },
  });

  useEffect(() => {
    if (!showPreview) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setPreviewIndex(
          (prev) =>
            (prev - 1 + allImagesForDisplay.length) %
            allImagesForDisplay.length,
        );
      } else if (e.key === "ArrowRight") {
        setPreviewIndex((prev) => (prev + 1) % allImagesForDisplay.length);
      } else if (e.key === "Escape") {
        setShowPreview(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPreview, allImagesForDisplay.length]);

  const handleAddImageUrl = () => {
    if (allImagesForDisplay.length >= tierConfig.maxImages) {
      showMessage(
        `Your '${tierConfig.name}' plan allows a maximum of ${tierConfig.maxImages} images.`,
        "error",
      );
      return;
    }
    if (imageUrlInput.trim()) {
      const newUrl = imageUrlInput.trim();
      setNewImageURLs((prev) => [...prev, newUrl]);
      if (!thumbnailIdentifier) setThumbnailIdentifier(newUrl);
      setImageUrlInput("");
    } else {
      showMessage("Please enter a valid image URL.", "error");
    }
  };

  const handleRemoveImage = (identifierToRemove, type) => {
    if (type === "main") {
      showMessage(
        "You cannot remove the main image directly. Set another thumbnail instead.",
        "error",
      );
      return;
    }
    if (type === "existing")
      setExistingImages((prev) =>
        prev.filter((img) => img.identifier !== identifierToRemove),
      );
    else if (type === "newFile")
      setNewImages((prev) =>
        prev.filter((img) => img.originalname !== identifierToRemove),
      );
    else
      setNewImageURLs((prev) =>
        prev.filter((url) => url !== identifierToRemove),
      );

    if (thumbnailIdentifier === identifierToRemove) {
      const nextBestThumbnail = allImagesForDisplay.find(
        (img) => img.identifier !== identifierToRemove,
      );
      setThumbnailIdentifier(nextBestThumbnail?.identifier || null);
    }
  };

  const handleTempStateChange = (field, value) => {
    let newState = { ...tempState, [field]: value };
    if (field === "statusValue" && ["sold", "rented"].includes(value)) {
      newState.isFeatured = false;
    }
    if (
      field === "isFeatured" &&
      value &&
      ["sold", "rented"].includes(tempState.statusValue)
    ) {
      showMessage("A sold or rented property cannot be featured.", "error");
      return;
    }
    setTempState(newState);
  };

  // --- START OF FIX ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !thumbnailIdentifier ||
      !allImagesForDisplay.some((img) => img.identifier === thumbnailIdentifier)
    ) {
      showMessage("Please select a valid thumbnail image.", "error");
      return;
    }
    if (allImagesForDisplay.length < 2) {
      showMessage("Please upload or add at least 2 images.", "error");
      return;
    }

    // Directly use tempState to build the payload. Do NOT call individual state setters.
    const payload = {
      purchase_category: tempState.purchaseCategory,
      title: tempState.title,
      location: tempState.location,
      state: tempState.stateValue,
      property_type: tempState.propertyType,
      bedrooms: isLandProperty ? null : tempState.bedrooms,
      bathrooms: isLandProperty ? null : tempState.bathrooms,
      price: tempState.price,
      description: tempState.description,
      square_footage: isLandProperty ? null : tempState.squareFootage,
      lot_size: tempState.lotSize,
      year_built: isLandProperty ? null : tempState.yearBuilt,
      heating_type: tempState.heatingType,
      cooling_type: tempState.coolingType,
      parking: tempState.parking,
      amenities: tempState.amenities,
      land_size: isLandProperty ? tempState.landSize : null,
      zoning_type: isLandProperty ? tempState.zoningType : null,
      title_type: tempState.titleType,
      status: tempState.statusValue,
      is_featured: tempState.isFeatured, // Pass the latest featured status
      mainImageIdentifier: thumbnailIdentifier,
      existingImageUrlsToKeep: existingImages.map((img) => img.url),
      newImageUrls: newImageURLs,
      newImagesBase64: newImages.map((img) => img.base64),
      newImagesOriginalNames: newImages.map((img) => img.originalname),
    };

    // The specific is_featured logic for roles is now handled on the backend,
    // but keeping it here as a fallback doesn't hurt.
    if (
      ["agent", "agency_admin"].includes(user.role) &&
      tempState.statusValue === "sold"
    ) {
      payload.is_featured = false;
    }

    try {
      const { data } = await axiosInstance.put(`/listings/${id}`, payload);
      showMessage("Listing updated successfully!", "success");
      navigate(`/listings/${data.property_id || id}`);
    } catch (error) {
      console.error(
        "Error updating listing:",
        error.response?.data || error.message,
      );
      showMessage(
        error.response?.data?.message || "Failed to update listing.",
        "error",
      );
    }
  };
  // --- END OF FIX ---

  const handleExit = () => {
    if (JSON.stringify(initialState) !== JSON.stringify(tempState)) {
      showConfirm({
        message:
          "Are you sure you want to exit? Any unsaved changes will be lost.",
        onConfirm: () => navigate(-1),
      });
    } else {
      navigate(-1);
    }
  };

  const isFeatureDisabled = useMemo(() => {
    if (!tempState || !user) return true;
    if (["sold", "rented"].includes(tempState.statusValue)) return true;
    if (tempState.isFeatured) return false;
    if (user.role === "admin") return false;
    if (tierConfig.maxFeatured === 0) return true;
    return stats.activeFeatured >= tierConfig.maxFeatured;
  }, [tempState, user, tierConfig, stats]);

  const featureTooltip = useMemo(() => {
    if (!tempState) return "";
    if (["sold", "rented"].includes(tempState.statusValue))
      return "A sold or rented property cannot be featured.";
    if (isFeatureDisabled && !tempState.isFeatured) {
      if (tierConfig.maxFeatured === 0)
        return `Your '${tierConfig.name}' plan does not allow featuring listings.`;
      if (stats.activeFeatured >= tierConfig.maxFeatured)
        return `You have reached your limit of ${tierConfig.maxFeatured} featured listings for your plan.`;
    }
    return "Feature this listing to increase its visibility.";
  }, [tempState, isFeatureDisabled, tierConfig, stats]);

  const getStarColor = (subscription) => {
    switch (subscription) {
      case "pro":
        return "text-purple-500";
      case "enterprise":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const nigerianStates = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
    "Abuja",
  ].sort();
  const purchaseCategoryOptions = [
    { value: "Rent", label: "Rent" },
    { value: "Sale", label: "Sale" },
    { value: "Lease", label: "Lease" },
    { value: "Short Let", label: "Short Let" },
    { value: "Long Let", label: "Long Let" },
  ];
  const stateOptions = [
    { value: "", label: "Select State" },
    ...nigerianStates.map((state) => ({ value: state, label: state })),
  ];
  const propertyTypeOptions = [
    { value: "", label: "Select Property Type" },
    { value: "Duplex", label: "Duplex" },
    { value: "Bungalow", label: "Bungalow" },
    { value: "Apartment", label: "Apartment" },
    { value: "Penthouse", label: "Penthouse" },
    { value: "Detached House", label: "Detached House" },
    { value: "Semi-Detached House", label: "Semi-Detached House" },
    { value: "Condo", label: "Condo" },
    { value: "Land", label: "Land" },
  ];
  const bedroomOptions = [
    { value: "", label: "Any Bedrooms" },
    ...[1, 2, 3, 4, 5].map((num) => ({
      value: String(num),
      label: `${num} Bedroom(s)`,
    })),
  ];
  const bathroomOptions = [
    { value: "", label: "Any Bathrooms" },
    ...[1, 2, 3, 4, 5].map((num) => ({
      value: String(num),
      label: `${num} Bathroom(s)`,
    })),
  ];
  const statusOptions =
    user?.role === "admin"
      ? [
          { value: "available", label: "Available" },
          { value: "pending", label: "Pending" },
          { value: "rejected", label: "Rejected" },
          { value: "sold", label: "Sold" },
          { value: "under offer", label: "Under Offer" },
        ]
      : [
          { value: "available", label: "Available" },
          { value: "sold", label: "Sold" },
          { value: "under offer", label: "Under Offer" },
        ];
  const zoningTypeOptions = [
    { value: "", label: "Select Zoning Type" },
    { value: "Residential", label: "Residential" },
    { value: "Commercial", label: "Commercial" },
    { value: "Industrial", label: "Industrial" },
    { value: "Agricultural", label: "Agricultural" },
    { value: "Mixed-Use", label: "Mixed-Use" },
    { value: "Other", label: "Other" },
  ];
  const titleTypeOptions = [
    { value: "", label: "Select Title Type" },
    { value: "C of O", label: "Certificate of Occupancy (C of O)" },
    { value: "Gazette", label: "Gazette" },
    { value: "Deed of Assignment", label: "Deed of Assignment" },
    { value: "Governor's Consent", label: "Governor's Consent" },
    { value: "Survey Plan", label: "Survey Plan" },
    { value: "Excision", label: "Excision" },
    { value: "Other", label: "Other" },
  ];
  const heatingTypeOptions = [
    { value: "", label: "Select Heating Type" },
    { value: "Central Heating", label: "Central Heating" },
    { value: "Electric", label: "Electric" },
    { value: "Gas", label: "Gas" },
    { value: "Solar", label: "Solar" },
    { value: "None", label: "None" },
  ];
  const coolingTypeOptions = [
    { value: "", label: "Select Cooling Type" },
    { value: "Central AC", label: "Central AC" },
    { value: "Window Unit", label: "Window Unit" },
    { value: "Split System", label: "Split System" },
    { value: "None", label: "None" },
  ];

  const uniformInputClass = (isTextArea = false) =>
    `w-full py-1 px-4 border rounded-xl shadow-sm transition-all duration-200 ${darkMode ? "bg-gray-700 text-white border-gray-600 hover:border-green-500 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 focus:ring-green-400" : "bg-white text-gray-800 border-gray-300 hover:border-green-500 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 focus:ring-green-600"} ${isTextArea ? "min-h-[8rem]" : "h-10"}`;
  const labelClass = `block text-sm font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`;
  const sectionTitleClass = `text-lg font-bold mb-4 border-b pb-2 ${darkMode ? "text-gray-100 border-gray-700" : "text-gray-800 border-gray-300"}`;

  if (loading || authLoading || !tempState)
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        Loading...
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-2 pb-10`}
    >
      <motion.form
        onSubmit={handleSubmit}
        className={`max-w-4xl mx-auto p-8 rounded-3xl shadow-2xl relative space-y-8 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}`}
      >
        <div className="mb-6">
          <div className="flex flex-col md:grid md:grid-cols-3 md:items-center">
            <div className="order-2 md:order-1 flex items-center gap-2 mt-2 md:mt-0">
              {user?.subscription_type && user.role !== "admin" && (
                <>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}
                  >
                    <StarIconSolid
                      className={`h-3.5 w-3.5 mr-1.5 ${getStarColor(user.subscription_type)}`}
                    />
                    {tierConfig.name} Plan
                  </span>
                  {user.subscription_type !== "enterprise" && (
                    <Link
                      to="/subscriptions"
                      className="text-xs font-semibold text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                    >
                      View Plans
                    </Link>
                  )}
                </>
              )}
            </div>
            <h1
              className={`order-1 md:order-2 md:col-start-2 text-2xl md:text-3xl font-extrabold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}
            >
              Edit Property
            </h1>
            <div className="hidden md:block md:order-3"></div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExit}
          className="absolute -top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 z-10"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <h2 className={sectionTitleClass}>Core Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label htmlFor="purchaseCategory" className={labelClass}>
                Purchase Category <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={purchaseCategoryOptions}
                value={tempState.purchaseCategory}
                onChange={(v) => handleTempStateChange("purchaseCategory", v)}
                placeholder="Select a category"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="title" className={labelClass}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={tempState.title}
                onChange={(e) => handleTempStateChange("title", e.target.value)}
                placeholder="e.g., Beautiful 3-Bedroom Duplex"
                className={uniformInputClass()}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="propertyType" className={labelClass}>
                Property Type <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={propertyTypeOptions}
                value={tempState.propertyType}
                onChange={(v) => handleTempStateChange("propertyType", v)}
                placeholder="Select property type"
              />
            </div>
            {!isLandProperty && (
              <>
                <div>
                  <label htmlFor="bedrooms" className={labelClass}>
                    Bedrooms <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={bedroomOptions}
                    value={tempState.bedrooms}
                    onChange={(v) => handleTempStateChange("bedrooms", v)}
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label htmlFor="bathrooms" className={labelClass}>
                    Bathrooms <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={bathroomOptions}
                    value={tempState.bathrooms}
                    onChange={(v) => handleTempStateChange("bathrooms", v)}
                    placeholder="Any"
                  />
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="location" className={labelClass}>
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                value={tempState.location}
                onChange={(e) =>
                  handleTempStateChange("location", e.target.value)
                }
                placeholder="e.g., Lekki Phase 1, Lagos"
                className={uniformInputClass()}
                required
              />
            </div>
            <div>
              <label htmlFor="stateValue" className={labelClass}>
                State <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={stateOptions}
                value={tempState.stateValue}
                onChange={(v) => handleTempStateChange("stateValue", v)}
                placeholder="Select a state"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className={labelClass}>
                Price (NGN) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                value={tempState.price}
                onChange={(e) => handleTempStateChange("price", e.target.value)}
                placeholder="e.g., 50000000"
                className={uniformInputClass()}
                required
              />
            </div>
            {user && (
              <div>
                <label htmlFor="statusValue" className={labelClass}>
                  Status
                </label>
                <Dropdown
                  options={statusOptions}
                  value={tempState.statusValue}
                  onChange={(v) => handleTempStateChange("statusValue", v)}
                  placeholder="Select status"
                />
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className={sectionTitleClass}>Images</h2>
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border border-dashed rounded-2xl py-6 px-4 text-center cursor-pointer transition-all duration-300 ${darkMode ? "border-gray-600 hover:border-green-500 text-gray-400" : "border-gray-300 hover:border-green-500 text-gray-500"}`}
            >
              <input {...getInputProps()} />
              <p>Drag 'n' drop, or click to add more images</p>
              <p className="text-xs mt-1">
                (Maximum {tierConfig.maxImages} total images on your '
                {tierConfig.name}' plan. Currently {allImagesForDisplay.length}
                .)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Or paste an image URL here..."
                className={uniformInputClass()}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className={`bg-green-600 text-white py-2 px-6 rounded-2xl transition-colors duration-200 hover:bg-green-700 font-bold whitespace-nowrap`}
              >
                Add URL
              </button>
            </div>
            {allImagesForDisplay.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {allImagesForDisplay.map((item, index) => (
                    <motion.div
                      key={item.identifier || index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group overflow-hidden rounded-2xl shadow-lg border"
                    >
                      {/* Image - clicking opens preview */}
                      <img
                        src={item.url}
                        alt={`Listing ${index + 1}`}
                        className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => {
                          setPreviewIndex(index);
                          setShowPreview(true);
                        }}
                      />

                      {/* Remove button */}
                      <div
                        className="absolute top-2 right-2 bg-red-600 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          handleRemoveImage(item.identifier, item.type)
                        }
                      >
                        <CloseIcon className="h-4 w-4 text-white" />
                      </div>

                      {/* Thumbnail toggle (localized button) */}
                      <div
                        onClick={() => setThumbnailIdentifier(item.identifier)}
                        className={`absolute bottom-0 left-0 right-0 p-2 text-center text-xs font-semibold cursor-pointer ${
                          item.identifier === thumbnailIdentifier
                            ? "bg-green-700 text-white"
                            : "bg-white/80 text-gray-800 backdrop-blur-sm hover:bg-green-600 hover:text-white"
                        }`}
                      >
                        {item.identifier === thumbnailIdentifier
                          ? "Thumbnail"
                          : "Set as Thumbnail"}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Fullscreen Preview Modal */}
                <AnimatePresence>
                  {showPreview && allImagesForDisplay.length > 0 && (
                    <motion.div
                      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Image container (resizes to image naturally) */}
                      <div ref={previewRef} className="relative">
                        {/* Swipeable image */}
                        <motion.img
                          key={allImagesForDisplay[previewIndex].url}
                          src={allImagesForDisplay[previewIndex].url}
                          alt="Preview"
                          className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl"
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          onDragEnd={(e, info) => {
                            if (info.offset.x < -100) {
                              setPreviewIndex(
                                (prev) =>
                                  (prev + 1) % allImagesForDisplay.length,
                              );
                            } else if (info.offset.x > 100) {
                              setPreviewIndex(
                                (prev) =>
                                  (prev - 1 + allImagesForDisplay.length) %
                                  allImagesForDisplay.length,
                              );
                            }
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />

                        {/* Left arrow */}
                        {allImagesForDisplay.length > 1 && (
                          <button
                            type="button"
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white opacity-40 hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewIndex(
                                (prev) =>
                                  (prev - 1 + allImagesForDisplay.length) %
                                  allImagesForDisplay.length,
                              );
                            }}
                          >
                            <span className="text-[8rem] leading-none select-none">
                              ‹
                            </span>
                          </button>
                        )}

                        {/* Right arrow */}
                        {allImagesForDisplay.length > 1 && (
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white opacity-40 hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewIndex(
                                (prev) =>
                                  (prev + 1) % allImagesForDisplay.length,
                              );
                            }}
                          >
                            <span className="text-[8rem] leading-none select-none">
                              ›
                            </span>
                          </button>
                        )}

                        {/* Close button (top-right corner of image) */}
                        <button
                          type="button"
                          onClick={() => setShowPreview(false)}
                          className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 z-30"
                        >
                          <CloseIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className={sectionTitleClass}>Optional Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <textarea
                id="description"
                value={tempState.description}
                onChange={(e) =>
                  handleTempStateChange("description", e.target.value)
                }
                className={uniformInputClass(true)}
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="squareFootage" className={labelClass}>
                  Square Footage
                </label>
                <input
                  type="number"
                  id="squareFootage"
                  value={tempState.squareFootage}
                  onChange={(e) =>
                    handleTempStateChange("squareFootage", e.target.value)
                  }
                  className={uniformInputClass()}
                />
              </div>
              <div>
                <label htmlFor="yearBuilt" className={labelClass}>
                  Year Built
                </label>
                <input
                  type="number"
                  id="yearBuilt"
                  value={tempState.yearBuilt}
                  onChange={(e) =>
                    handleTempStateChange("yearBuilt", e.target.value)
                  }
                  className={uniformInputClass()}
                />
              </div>
              <div>
                <label htmlFor="lotSize" className={labelClass}>
                  Lot Size
                </label>
                <input
                  type="text"
                  id="lotSize"
                  value={tempState.lotSize}
                  onChange={(e) =>
                    handleTempStateChange("lotSize", e.target.value)
                  }
                  className={uniformInputClass()}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="parking" className={labelClass}>
                  Parking
                </label>
                <input
                  type="text"
                  id="parking"
                  value={tempState.parking}
                  onChange={(e) =>
                    handleTempStateChange("parking", e.target.value)
                  }
                  className={uniformInputClass()}
                />
              </div>
              {!isLandProperty && (
                <>
                  <div>
                    <label htmlFor="heatingType" className={labelClass}>
                      Heating Type
                    </label>
                    <Dropdown
                      options={heatingTypeOptions}
                      value={tempState.heatingType}
                      onChange={(v) => handleTempStateChange("heatingType", v)}
                    />
                  </div>
                  <div>
                    <label htmlFor="coolingType" className={labelClass}>
                      Cooling Type
                    </label>
                    <Dropdown
                      options={coolingTypeOptions}
                      value={tempState.coolingType}
                      onChange={(v) => handleTempStateChange("coolingType", v)}
                    />
                  </div>
                </>
              )}
              {isLandProperty && (
                <>
                  <div>
                    <label htmlFor="landSize" className={labelClass}>
                      Land Size
                    </label>
                    <input
                      type="text"
                      id="landSize"
                      value={tempState.landSize}
                      onChange={(e) =>
                        handleTempStateChange("landSize", e.target.value)
                      }
                      className={uniformInputClass()}
                    />
                  </div>
                  <div>
                    <label htmlFor="zoningType" className={labelClass}>
                      Zoning Type
                    </label>
                    <Dropdown
                      options={zoningTypeOptions}
                      value={tempState.zoningType}
                      onChange={(v) => handleTempStateChange("zoningType", v)}
                    />
                  </div>
                </>
              )}
            </div>
            <div>
              <label htmlFor="amenities" className={labelClass}>
                Amenities
              </label>
              <input
                type="text"
                id="amenities"
                value={tempState.amenities}
                onChange={(e) =>
                  handleTempStateChange("amenities", e.target.value)
                }
                className={uniformInputClass()}
              />
            </div>
            {isLandProperty && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="titleType" className={labelClass}>
                    Title Type
                  </label>
                  <Dropdown
                    options={titleTypeOptions}
                    value={tempState.titleType}
                    onChange={(v) => handleTempStateChange("titleType", v)}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className={sectionTitleClass}>Premium Options</h2>
          <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : ""}`}>
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center gap-3 ${isFeatureDisabled && !tempState.isFeatured ? "opacity-50 cursor-not-allowed" : ""}`}
                title={featureTooltip}
              >
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={tempState.isFeatured}
                  onChange={(e) =>
                    handleTempStateChange("isFeatured", e.target.checked)
                  }
                  disabled={isFeatureDisabled && !tempState.isFeatured}
                  className={`h-5 w-5 rounded-md focus:ring-green-500 border transition-all duration-200 ${isFeatureDisabled && !tempState.isFeatured ? "cursor-not-allowed" : "cursor-pointer"} ${darkMode ? "bg-gray-700 border-gray-600 checked:bg-green-600" : "border-gray-300 checked:bg-green-600"}`}
                />
                <label
                  htmlFor="is_featured"
                  className={`font-bold flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"} ${isFeatureDisabled && !tempState.isFeatured ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  Mark as Featured Listing
                  {isFeatureDisabled && !tempState.isFeatured && (
                    <Lock className="h-4 w-4 text-yellow-500" />
                  )}
                </label>
              </div>
              {isFeatureDisabled &&
                !tempState.isFeatured &&
                user?.role !== "admin" &&
                tierConfig.maxFeatured === 0 && (
                  <Link
                    to="/subscriptions"
                    className="text-xs font-semibold text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                  >
                    View Plans
                  </Link>
                )}
            </div>
            {isFeatureDisabled && !tempState.isFeatured && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-8">
                {featureTooltip}
              </p>
            )}
          </div>
        </motion.div>

        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="w-full md:w-1/3 bg-green-700 text-white py-3 px-6 rounded-2xl hover:bg-green-800 text-sm transition-all duration-300 shadow-md"
          >
            Update Listing
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default EditListing;

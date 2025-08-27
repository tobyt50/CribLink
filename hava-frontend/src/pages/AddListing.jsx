import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  X as CloseIcon,
  Lock,
  StarIcon as StarIconSolid,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { SUBSCRIPTION_TIERS } from "../config/subscriptionConfig";
import { useAuth } from "../context/AuthContext";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import { useMessage } from "../context/MessageContext";
import { useTheme } from "../layouts/AppShell";

// The Dropdown component remains the same.
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
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Current selection: ${selectedOptionLabel}. Open to change selection.`}
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-600"}`}
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
                onClick={() => {
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

const AddListing = () => {
  const navigate = useNavigate();
  const { showConfirm } = useConfirmDialog();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();
  const { user, loading: authLoading } = useAuth();

  // Component state
  const [purchaseCategory, setPurchaseCategory] = useState("Rent");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [livingRooms, setLivingRooms] = useState("");
  const [kitchens, setKitchens] = useState("");
  const [price, setPrice] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [newImageURLs, setNewImageURLs] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [thumbnailIdentifier, setThumbnailIdentifier] = useState(null);
  const [description, setDescription] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [heatingType, setHeatingType] = useState("");
  const [coolingType, setCoolingType] = useState("");
  const [parking, setParking] = useState("");
  const [amenities, setAmenities] = useState("");
  const [landSize, setLandSize] = useState("");
  const [zoningType, setZoningType] = useState("");
  const [titleType, setTitleType] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [statusValue, setStatusValue] = useState("");
  const isLandProperty = propertyType === "Land";
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewRef = useRef(null);

  // Subscription-related state
  const [stats, setStats] = useState({ activeListings: 0, activeFeatured: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [formDisabledMessage, setFormDisabledMessage] = useState("");

  const tier = useMemo(() => user?.subscription_type || "basic", [user]);
  const tierConfig = useMemo(
    () => SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS["basic"],
    [tier],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      showMessage("You must be logged in to create a listing.", "error");
      navigate("/signin");
      return;
    }

    setStatusValue(user.role === "admin" ? "available" : "pending");

    const fetchStats = async () => {
      setPageLoading(true);
      try {
        const response = await axiosInstance.get("/users/listing-stats");
        const { activeListings, activeFeatured } = response.data;
        setStats({ activeListings, activeFeatured });

        if (activeListings >= tierConfig.maxListings) {
          setFormDisabledMessage(
            `You have reached your limit of ${tierConfig.maxListings} active listings for the '${tierConfig.name}' plan. Please upgrade to add more, or manage your existing listings.`,
          );
        }
      } catch (error) {
        showMessage(
          "Could not load your current listing stats. Please try again.",
          "error",
        );
        setFormDisabledMessage(
          "Could not verify your plan limits. Please refresh the page.",
        );
      } finally {
        setPageLoading(false);
      }
    };
    fetchStats();
  }, [user, authLoading, navigate, showMessage, tierConfig]);

  const allImagesForDisplay = useMemo(
    () => [
      ...newImages.map((img) => ({
        url: img.base64,
        identifier: img.originalname,
        type: "newFile",
      })),
      ...newImageURLs.map((url) => ({ url, identifier: url, type: "newUrl" })),
    ],
    [newImages, newImageURLs],
  );

  // Keyboard navigation for preview modal
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
          setThumbnailIdentifier((prev) => prev || file.name);
        };
      });
    },
    accept: { "image/*": [] },
  });

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
      setThumbnailIdentifier((prev) => prev || newUrl);
      setImageUrlInput("");
    } else {
      showMessage("Please enter a valid image URL.", "error");
    }
  };

  const handleRemoveImage = (identifierToRemove, type) => {
    if (type === "newFile")
      setNewImages((prev) =>
        prev.filter((img) => img.originalname !== identifierToRemove),
      );
    else
      setNewImageURLs((prev) =>
        prev.filter((url) => url !== identifierToRemove),
      );
    if (thumbnailIdentifier === identifierToRemove) {
      const nextThumbnail = allImagesForDisplay.find(
        (img) => img.identifier !== identifierToRemove,
      );
      setThumbnailIdentifier(nextThumbnail ? nextThumbnail.identifier : null);
    }
  };

  const setAsThumbnail = (identifier) => {
    setThumbnailIdentifier(identifier);
    showMessage("Thumbnail set.", "success");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !thumbnailIdentifier ||
      !allImagesForDisplay.some((img) => img.identifier === thumbnailIdentifier)
    ) {
      showMessage("Please select a valid thumbnail image.", "error");
      return;
    }
    if (allImagesForDisplay.length < 1) {
      showMessage("Please upload or add at least 1 image.", "error");
      return;
    }

    const payload = {
      purchase_category: purchaseCategory,
      title,
      location,
      state: stateValue,
      property_type: propertyType,
      bedrooms: isLandProperty ? null : bedrooms,
      bathrooms: isLandProperty ? null : bathrooms,
      living_rooms: isLandProperty ? null : livingRooms,
      kitchens: isLandProperty ? null : kitchens,
      price,
      description,
      square_footage: isLandProperty ? null : squareFootage,
      lot_size: lotSize,
      year_built: isLandProperty ? null : yearBuilt,
      heating_type: isLandProperty ? null : heatingType,
      cooling_type: isLandProperty ? null : coolingType,
      parking: isLandProperty ? null : parking,
      amenities,
      land_size: isLandProperty ? landSize : null,
      zoning_type: isLandProperty ? zoningType : null,
      title_type: isLandProperty ? titleType : null,
      is_featured: isFeatured,
      status: statusValue,
      mainImageBase64:
        newImages.find((img) => img.originalname === thumbnailIdentifier)
          ?.base64 || null,
      mainImageOriginalName:
        newImages.find((img) => img.originalname === thumbnailIdentifier)
          ?.originalname || null,
      mainImageURL: newImageURLs.includes(thumbnailIdentifier)
        ? thumbnailIdentifier
        : null,
      galleryImagesBase64: newImages
        .filter((img) => img.originalname !== thumbnailIdentifier)
        .map((img) => img.base64),
      galleryImagesOriginalNames: newImages
        .filter((img) => img.originalname !== thumbnailIdentifier)
        .map((img) => img.originalname),
      galleryImageURLs: newImageURLs.filter(
        (url) => url !== thumbnailIdentifier,
      ),
    };

    try {
      const { data } = await axiosInstance.post("/listings", payload);
      showMessage("Listing created successfully!", "success");
      navigate(`/listings/${data.property_id}`);
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Failed to create listing.",
        "error",
      );
    }
  };

  const handleExit = () => {
    const isDirty =
      Object.values({ title, location, price, description }).some(
        (val) => val,
      ) ||
      newImages.length > 0 ||
      newImageURLs.length > 0;
    if (isDirty) {
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
    if (user?.role === "admin") return false;
    if (tierConfig.maxFeatured === 0) return true;
    return stats.activeFeatured >= tierConfig.maxFeatured;
  }, [user, tierConfig, stats]);

  const featureTooltip = useMemo(() => {
    if (isFeatureDisabled) {
      if (tierConfig.maxFeatured === 0)
        return `Your '${tierConfig.name}' plan does not allow featuring listings.`;
      if (stats.activeFeatured >= tierConfig.maxFeatured)
        return `You have reached your limit of ${tierConfig.maxFeatured} featured listings for your plan.`;
    }
    return "Feature this listing to increase its visibility.";
  }, [isFeatureDisabled, tierConfig, stats]);

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

  const uniformInputClass = (isTextArea = false) =>
    `w-full py-1 px-4 border rounded-xl shadow-sm transition-all duration-200 ${darkMode ? "bg-gray-700 text-white border-gray-600 hover:border-green-500 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 focus:ring-green-400" : "bg-white text-gray-800 border-gray-300 hover:border-green-500 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 focus:ring-green-600"} ${isTextArea ? "min-h-[8rem]" : "h-10"}`;
  const labelClass = `block text-sm font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`;
  const sectionTitleClass = `text-lg font-bold mb-4 border-b pb-2 ${darkMode ? "text-gray-100 border-gray-700" : "text-gray-800 border-gray-300"}`;

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
    { value: "", label: "None" },
    ...[1, 2, 3, 4, 5].map((num) => ({
      value: String(num),
      label: `${num} Bedroom(s)`,
    })),
  ];
  const bathroomOptions = [
    { value: "", label: "None" },
    ...[1, 2, 3, 4, 5].map((num) => ({
      value: String(num),
      label: `${num} Bathroom(s)`,
    })),
  ];
  const livingRoomOptions = [
    { value: "", label: "None" },
    ...[1, 2, 3, 4, 5].map((num) => ({
      value: String(num),
      label: `${num} Living Room(s)`,
    })),
  ];
  
  const kitchenOptions = [
    { value: "", label: "None" },
    ...[1, 2, 3, 4, 5].map((num) => ({
      value: String(num),
      label: `${num} Kitchen(s)`,
    })),
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

  if (authLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-2 pb-10`}
    >
      <motion.form
        onSubmit={handleSubmit}
        className={`max-w-4xl mx-auto p-8 rounded-3xl shadow-2xl relative ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}`}
      >
        <button
          type="button"
          onClick={handleExit}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 z-10"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
        <fieldset disabled={!!formDisabledMessage} className="space-y-8">
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
                Add New Property
              </h1>
              {/* This div is just a placeholder for the grid structure, the button is positioned relative to the form */}
              <div className="hidden md:block md:order-3"></div>
            </div>
            {formDisabledMessage && (
              <div className="w-full p-4 mt-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <span>{formDisabledMessage}</span>
              </div>
            )}
          </div>

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
                  value={purchaseCategory}
                  onChange={setPurchaseCategory}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Beautiful 3-Bedroom Duplex"
                  className={uniformInputClass()}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
  {/* Property type spans 2/6 = 1/3 */}
  <div className="md:col-span-2">
    <label htmlFor="propertyType" className={labelClass}>
      Property Type
    </label>
    <Dropdown
      options={propertyTypeOptions}
      value={propertyType}
      onChange={setPropertyType}
      placeholder="None"
    />
  </div>

  {/* Bedrooms, Bathrooms, Living Rooms, Kitchens share 4/6 = 2/3 */}
  {!isLandProperty && (
    <>
      <div className="md:col-span-1">
        <label htmlFor="bedrooms" className={labelClass}>
          Bedrooms
        </label>
        <Dropdown
          options={bedroomOptions}
          value={bedrooms}
          onChange={setBedrooms}
          placeholder="None"
        />
      </div>

      <div className="md:col-span-1">
        <label htmlFor="bathrooms" className={labelClass}>
          Bathrooms
        </label>
        <Dropdown
          options={bathroomOptions}
          value={bathrooms}
          onChange={setBathrooms}
          placeholder="None"
        />
      </div>

      <div className="md:col-span-1">
        <label htmlFor="livingRooms" className={labelClass}>
          Living Rooms
        </label>
        <Dropdown
          options={livingRoomOptions}
          value={livingRooms}
          onChange={setLivingRooms}
          placeholder="None"
        />
      </div>

      <div className="md:col-span-1">
        <label htmlFor="kitchens" className={labelClass}>
          Kitchens
        </label>
        <Dropdown
          options={kitchenOptions}
          value={kitchens}
          onChange={setKitchens}
          placeholder="None"
        />
      </div>
    </>
  )}
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Price */}
  <div>
    <label htmlFor="price" className={labelClass}>
      Price (NGN) <span className="text-red-500">*</span>
    </label>
    <input
      type="number"
      id="price"
      value={price}
      onChange={(e) => setPrice(e.target.value)}
      placeholder="e.g., 50000000"
      className={uniformInputClass()}
      required
    />
  </div>

  {/* Location */}
  <div>
    <label htmlFor="location" className={labelClass}>
      Location <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      id="location"
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      placeholder="e.g., Lekki Phase 1, Lagos"
      className={uniformInputClass()}
      required
    />
  </div>

  {/* State */}
  <div>
    <label htmlFor="stateValue" className={labelClass}>
      State <span className="text-red-500">*</span>
    </label>
    <Dropdown
      options={stateOptions}
      value={stateValue}
      onChange={setStateValue}
      placeholder="None"
    />
  </div>
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
                <p>Drag 'n' drop some files here, or click to select files</p>
                <p className="text-xs mt-1">
                  (Maximum {tierConfig.maxImages} images allowed on the '
                  {tierConfig.name}' plan)
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
              {/* Uploaded Images Grid */}
              {allImagesForDisplay.length > 0 && (
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
                        className="absolute top-2 right-2 bg-red-600 rounded-full p-1 cursor-pointer transition-colors hover:bg-red-700"
                        onClick={() =>
                          handleRemoveImage(item.identifier, item.type)
                        }
                      >
                        <CloseIcon className="h-4 w-4 text-white" />
                      </div>

                      {/* Thumbnail toggle */}
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
              )}

              <AnimatePresence>
                {showPreview && allImagesForDisplay.length > 0 && (
                  <motion.div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
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
                              (prev) => (prev + 1) % allImagesForDisplay.length,
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
                              (prev) => (prev + 1) % allImagesForDisplay.length,
                            );
                          }}
                        >
                          <span className="text-[8rem] leading-none select-none">
                            ›
                          </span>
                        </button>
                      )}

                      {/* Close button */}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed description of the property..."
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
                    value={squareFootage}
                    onChange={(e) => setSquareFootage(e.target.value)}
                    placeholder="e.g., 2000"
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
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    placeholder="e.g., 2010"
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
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                    placeholder="e.g., 500 sq meters"
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
                    value={parking}
                    onChange={(e) => setParking(e.target.value)}
                    placeholder="e.g., 2-car garage"
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
                        value={heatingType}
                        onChange={setHeatingType}
                        placeholder="Select heating type"
                      />
                    </div>
                    <div>
                      <label htmlFor="coolingType" className={labelClass}>
                        Cooling Type
                      </label>
                      <Dropdown
                        options={coolingTypeOptions}
                        value={coolingType}
                        onChange={setCoolingType}
                        placeholder="Select cooling type"
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
                        value={landSize}
                        onChange={(e) => setLandSize(e.target.value)}
                        placeholder="e.g., 600 sqm"
                        className={uniformInputClass()}
                      />
                    </div>
                    <div>
                      <label htmlFor="zoningType" className={labelClass}>
                        Zoning Type
                      </label>
                      <Dropdown
                        options={zoningTypeOptions}
                        value={zoningType}
                        onChange={setZoningType}
                        placeholder="Select zoning type"
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
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                  placeholder="e.g., Pool, Gym, Security"
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
                      value={titleType}
                      onChange={setTitleType}
                      placeholder="Select title type"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {user && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className={sectionTitleClass}>Premium Options</h2>
              <div
                className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-3 ${isFeatureDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={featureTooltip}
                  >
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={isFeatured}
                      onChange={(e) =>
                        !isFeatureDisabled && setIsFeatured(e.target.checked)
                      }
                      disabled={isFeatureDisabled}
                      className={`h-5 w-5 rounded-md focus:ring-green-500 border transition-all duration-200 ${isFeatureDisabled ? "cursor-not-allowed" : "cursor-pointer"} ${darkMode ? "bg-gray-700 border-gray-600 checked:bg-green-600" : "border-gray-300 checked:bg-green-600"}`}
                    />
                    <label
                      htmlFor="is_featured"
                      className={`font-bold flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-700"} ${isFeatureDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      Mark as Featured Listing
                      {isFeatureDisabled && (
                        <Lock className="h-4 w-4 text-yellow-500" />
                      )}
                    </label>
                  </div>
                  {isFeatureDisabled &&
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
                {isFeatureDisabled && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-8">
                    {featureTooltip}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="w-full md:w-1/3 bg-green-700 text-white py-3 px-6 rounded-2xl hover:bg-green-800 text-sm transition-all duration-300 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Listing
            </button>
          </div>
        </fieldset>
      </motion.form>
    </motion.div>
  );
};

export default AddListing;

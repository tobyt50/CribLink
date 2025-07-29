import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../layouts/AppShell";

// Note: The ListingCard component receives `onFavoriteToggle` and `isFavorited` props
// when used in the Favourites page. These are used here to control the favorite button's behavior and appearance.
function ListingCard({ listing: initialListing, onFavoriteToggle, isFavorited = false }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const cardRef = useRef(null);

  const [compactMode, setCompactMode] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // State to track hover for the button

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        setCompactMode(width < 700);
        setIsNarrow(width < 200);
      }
    });

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const listing = { ...initialListing, rating: initialListing.rating || 4.27 }; // Use actual rating if available, otherwise default

  // Determine if the property is land
  const isLandProperty = listing.property_type?.toLowerCase() === 'land';

  const allImages = listing.gallery_images?.length
    ? [listing.image_url, ...listing.gallery_images]
    : listing.image_url
    ? [listing.image_url]
    : [];

  const [mainIndex, setMainIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setMainIndex((prev) =>
      (prev + newDirection + allImages.length) % allImages.length
    );
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Sale": return "💰 Sale";
      case "Rent": return "🏠 Rent";
      case "Lease": return "📜 Lease";
      case "Short Let": return "🏖️ Short Let";
      case "Long Let": return "🗓️ Long Let";
      default: return "🏡";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "available": return "✅ Available";
      case "sold": return "🔴 Sold";
      case "under offer": return "🤝 Under Offer";
      case "pending": return "⏳ Pending";
      case "approved": "👍 Approved";
      case "rejected": return "❌ Rejected";
      case "featured": return "⭐ Featured";
      default: return "❓";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "sold": return "bg-red-600";
      case "available": return "bg-green-600";
      case "pending": return "bg-green-400";
      case "featured": return "bg-amber-500";
      case "rejected": return "bg-red-800"
      default: return "bg-gray-500";
    }
  };

  const formatAbbreviatedPrice = (price) => {
    if (price >= 1e12) return (price / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (price >= 1e9) return (price / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (price >= 1e6) return (price / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (price >= 1e3) return (price / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return price?.toString();
  };

  const formatPrice = (price, category) => {
    if (price == null) return "price not available";

    const abbrev = `₦${formatAbbreviatedPrice(price)}`;
    const full = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);

    if (isNarrow) {
      const shortSuffix = { Rent: "/yr", "Short Let": "/n", "Long Let": "/mo" };
      return abbrev + (shortSuffix[category] || "");
    } else {
      const longSuffix = { Rent: "/year", "Short Let": "/night", "Long Let": "/month" };
      return full + (longSuffix[category] || "");
    }
  };

  const handleClick = () => navigate(`/listings/${listing.property_id}`);

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent card click from triggering
    if (onFavoriteToggle) {
      onFavoriteToggle(listing.property_id, isFavorited);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400 }}
      className={`w-full max-w-md mx-auto flex flex-col overflow-hidden rounded-2xl border shadow-md hover:shadow-xl cursor-pointer ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"
      }`}
    >
      {/* Main Image - swipeable */}
      <div className={`relative w-full ${compactMode ? "aspect-[3/2.4]" : "aspect-[3/2]"} overflow-hidden`}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={mainIndex}
            src={allImages[mainIndex]}
            alt={`Main ${mainIndex}`}
            className="absolute w-full h-full object-cover select-none"
            custom={direction}
            initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 300 : -300, opacity: 0 }}
            transition={{ duration: 0.4 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.x < -50) paginate(1);
              else if (info.offset.x > 50) paginate(-1);
            }}
            style={{ touchAction: "pan-y" }}
            draggable={false}
          />
        </AnimatePresence>

        {/* Tags */}
        {listing.purchase_category && (
          <div className="absolute top-0 left-0 rounded-br-2xl z-10 px-2 py-0.5 font-semibold text-white text-[0.65rem] sm:text-xs bg-green-600 max-w-[70%] truncate">
            {getCategoryIcon(listing.purchase_category)}
          </div>
        )}
        {listing.status && (
          <div className={`absolute top-0 right-0 rounded-bl-2xl z-10 px-2 py-0.5 font-semibold text-white text-[0.65rem] sm:text-xs ${getStatusColor(listing.status)} max-w-[70%] truncate`}>
            {getStatusIcon(listing.status)}
          </div>
        )}
      </div>

      {/* Thumbnails - scrollable, hidden on narrow */}
      {!isNarrow && allImages.length > 1 && (
        <div className="flex overflow-x-auto px-2 pt-2 pb-1 gap-2 no-scrollbar">
          {allImages.map((img, idx) => (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setMainIndex(idx);
              }}
              className={`flex-shrink-0 h-10 w-16 rounded overflow-hidden border-2 ${
                idx === mainIndex ? "border-green-500" : "border-transparent"
              }`}
            >
              <img
                src={img}
                alt={`Thumb ${idx}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      )}

      {/* Details */}
      <div className={`px-4 ${compactMode ? "pt-1 pb-1 gap-1" : "pt-2 pb-2 gap-2"} flex flex-col text-sm`}> {/* Reduced pb-5 to pb-2, and pb-2 to pb-1 for compact */}
        <h3 className={`font-bold truncate ${darkMode ? "text-green-400" : "text-green-700"}`} title={listing.title}>
          {listing.title}
        </h3>

        <div className={`flex justify-between text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          <div className="flex flex-col gap-0.5 overflow-hidden max-w-[60%]">
            <p className="truncate" title={`${listing.location}, ${listing.location}`}>📍 {listing.location}, {listing.state}</p>
            <p className="truncate" title={listing.property_type}>🏘️ {listing.property_type}</p>
          </div>
          <div className="flex flex-col gap-0.5 text-right min-w-[40%]">
            {/* Conditionally display bedrooms and bathrooms */}
            {!isLandProperty && listing.bedrooms != null && (
              <p className="whitespace-nowrap">
                🛏️ {listing.bedrooms} {isNarrow ? "Beds" : `Bedroom${listing.bedrooms !== 1 ? "s" : ""}`}
              </p>
            )}
            {!isLandProperty && listing.bathrooms != null && (
              <p className="whitespace-nowrap">
                🛁 {listing.bathrooms} {isNarrow ? "Baths" : `Bathroom${listing.bathrooms !== 1 ? "s" : ""}`}
              </p>
            )}
            {/* Display land-specific attributes if available */}
            {isLandProperty && listing.land_size && (
              <p className="whitespace-nowrap">
                � {listing.land_size}
              </p>
            )}
            {isLandProperty && listing.zoning_type && (
              <p className="whitespace-nowrap">
                 zoning: {listing.zoning_type}
              </p>
            )}
            {isLandProperty && listing.title_type && (
              <p className="whitespace-nowrap">
                title: {listing.title_type}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-1"> {/* Reduced pt-2 to pt-1 */}
          <p className={`font-bold truncate ${darkMode ? "text-green-400" : "text-green-700"}`} title={formatPrice(listing.price, listing.purchase_category)}>
            {formatPrice(listing.price, listing.purchase_category)}
          </p>
          <div className="flex items-center gap-[4px] ml-auto">
  {listing.rating && (
    <span className={`flex items-center text-[0.6rem] gap-[1px] ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
      <span className="text-[0.6rem] relative top-[0.5px]">⭐</span>
      <span className="relative top-[0.5px]">{listing.rating.toFixed(1)}</span>
    </span>
  )}
  <button
    onClick={handleFavoriteClick}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    className="transition-colors p-2 -m-2"
    title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 transition-all duration-200"
      viewBox="0 0 20 20"
      fill={
        isFavorited || isHovered
          ? (darkMode ? "rgb(96, 165, 250)" : "rgb(59, 130, 246)")
          : "none"
      }
      stroke={
        isFavorited || isHovered
          ? "none"
          : "rgb(156, 163, 175)"
      }
      strokeWidth={isFavorited || isHovered ? "0" : "1"}
    >
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
    </svg>
  </button>
</div>


        </div>
      </div>
    </motion.div>
  );
}

export default ListingCard;

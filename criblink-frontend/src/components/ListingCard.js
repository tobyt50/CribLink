import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../layouts/AppShell";

function ListingCard({ listing: initialListing }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const cardRef = useRef(null);

  const [compactMode, setCompactMode] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

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

  const listing = { ...initialListing, rating: 4.27 };

  const allImages = listing.gallery_images?.length
    ? [listing.image_url, ...listing.gallery_images]
    : listing.image_url
    ? [listing.image_url]
    : [];

  const [mainIndex, setMainIndex] = useState(0);
  const previewImages = allImages.slice(1, 6);
  const extraCount = allImages.length > 6 ? allImages.length - 5 : 0;

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
      case "approved": return "👍 Approved";
      case "rejected": return "❌ Rejected";
      case "featured": return "⭐ Featured";
      default: return "❓";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "sold": return "bg-red-600";
      case "available": return "bg-green-600";
      case "pending": return "bg-yellow-500";
      case "featured": return "bg-amber-500";
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
    const shortSuffix = { Rent: "/yr", "Short Let": "/n", "Long Let": "/mo" };
    const longSuffix = { Rent: "/year", "Short Let": "/night", "Long Let": "/month" };
    return compactMode
      ? abbrev + (shortSuffix[category] || "")
      : full + (longSuffix[category] || "");
  };

  const handleClick = () => navigate(`/listings/${listing.property_id}`);
  const handlePrev = (e) => {
    e.stopPropagation();
    setMainIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  const handleNext = (e) => {
    e.stopPropagation();
    setMainIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
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
      {/* Main Image */}
      <div className="relative w-full aspect-[3/2] overflow-hidden">
        <img
          src={allImages[mainIndex]}
          alt={listing.title}
          className="w-full h-full object-cover"
        />

        {/* Category Tag */}
        {listing.purchase_category && (
          <div className="absolute top-0 left-0 rounded-br-2xl z-10 px-2 py-0.5 font-semibold text-white text-[0.65rem] sm:text-xs bg-green-600 max-w-[70%] truncate">
            {getCategoryIcon(listing.purchase_category)}
          </div>
        )}

        {/* Status Tag */}
        {listing.status && (
          <div className={`absolute top-0 right-0 rounded-bl-2xl z-10 px-2 py-0.5 font-semibold text-white text-[0.65rem] sm:text-xs ${getStatusColor(listing.status)} max-w-[70%] truncate`}>
            {getStatusIcon(listing.status)}
          </div>
        )}

        {allImages.length > 1 && (
          <>
            <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-50 z-10">←</button>
            <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-50 z-10">→</button>
          </>
        )}
      </div>

      {/* Other Images */}
      <div className="flex px-2 pt-2 pb-0 gap-1 min-h-[44px]">
        {previewImages.length > 0
          ? previewImages.map((img, i) => (
              <img key={i} src={img} alt={`Preview ${i}`} className="h-10 w-full object-cover rounded-sm" />
            ))
          : [...Array(5)].map((_, i) => (
              <div key={i} className={`h-10 w-full rounded-sm ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            ))}
        {extraCount > 0 && (
          <div className="h-10 flex items-center justify-center text-xs font-bold rounded-sm bg-gray-300 text-gray-700">
            +{extraCount}
          </div>
        )}
      </div>

      {/* Details */}
      <div className={`px-4 ${compactMode ? "pt-2 pb-3" : "pt-1 pb-5"} flex flex-col gap-2 text-sm`}>
        <h3 className={`font-bold truncate ${darkMode ? "text-green-400" : "text-green-700"}`} title={listing.title}>
          {listing.title}
        </h3>

        <div className={`flex justify-between text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          <div className="flex flex-col gap-1 overflow-hidden max-w-[60%]">
            <p className="truncate" title={`${listing.location}, ${listing.state}`}>📍 {listing.location}, {listing.state}</p>
            <p className="truncate" title={listing.property_type}>🏘️ {listing.property_type}</p>
          </div>
          <div className="flex flex-col gap-1 text-right min-w-[40%]">
            <p className="whitespace-nowrap">
              🛏️ {listing.bedrooms}{" "}
              {isNarrow
                ? "Beds"
                : `Bedroom${listing.bedrooms !== 1 ? "s" : ""}`}
            </p>
            <p className="whitespace-nowrap">
              🛁 {listing.bathrooms}{" "}
              {isNarrow
                ? "Baths"
                : `Bathroom${listing.bathrooms !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <p className={`font-bold truncate ${darkMode ? "text-green-400" : "text-green-700"}`} title={formatPrice(listing.price, listing.purchase_category)}>
            {formatPrice(listing.price, listing.purchase_category)}
          </p>
          {listing.rating && (
            <p className={`text-xs ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
              ⭐ {listing.rating.toFixed(1)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ListingCard;

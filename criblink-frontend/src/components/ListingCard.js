// ListingCard.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../layouts/AppShell";
import { Pencil, Trash2 } from "lucide-react";


function ListingCard({ listing: initialListing, onFavoriteToggle, isFavorited = false, userRole = 'guest', userId = null, userAgencyId = null, getRoleBasePath, onDeleteListing }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const cardRef = useRef(null);
  const tagLeftRef = useRef(null); // Ref for the left tag
  const tagRightRef = useRef(null); // Ref for the right tag

  const [compactMode, setCompactMode] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownSide, setDropdownSide] = useState('right'); // 'left' or 'right'
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the dropdown exists AND the click is NOT inside the dropdown
      // AND the click is NOT on the left tag
      // AND the click is NOT on the right tag, then close the dropdown.
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        tagLeftRef.current && !tagLeftRef.current.contains(event.target) && // Check if click is on left tag
        tagRightRef.current && !tagRightRef.current.contains(event.target)    // Check if click is on right tag
      ) {
        setShowDropdown(false);
        // setHighlightField(null); // Clear highlight when dropdown closes - removed
      }
    };

    if (showDropdown) {
      // Using requestAnimationFrame to ensure the event listener is added
      // after the current event loop, preventing immediate re-closure.
      requestAnimationFrame(() => {
        document.addEventListener("mousedown", handleClickOutside);
      });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]); // Dependency array includes showDropdown to re-run effect when its state changes

  const listing = { ...initialListing, rating: initialListing.rating || 4.27 };

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
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(listing.property_id, isFavorited);
    }
  };

  const canEdit = () => {
    if (!initialListing) return false;
    if (userRole === 'admin') return true;
    if (userRole === 'agency_admin' && initialListing.agency_id === userAgencyId) return true;
    if (userRole === 'agent' && initialListing.agent_id === userId) return true;
    return false;
  };

  // Modified handleEdit to pass the field to open the dropdown for
  const handleEdit = (e, fieldToOpen = null) => {
    e.stopPropagation();
    setShowDropdown(false);
    const basePath = typeof getRoleBasePath === 'function' ? getRoleBasePath() : '';
    // Pass the fieldToOpen as a query parameter
    navigate(`${basePath}/edit-listing/${listing.property_id}${fieldToOpen ? `?open=${fieldToOpen}` : ''}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (onDeleteListing) {
      onDeleteListing(listing.property_id);
    }
  };

  const handleTagClick = (e, side) => {
    e.stopPropagation();
    if (canEdit()) {
      if (showDropdown && dropdownSide === side) {
        setShowDropdown(false);
      } else {
        setDropdownSide(side);
        setShowDropdown(true);
      }
    }
  };

  const menuVariants = {
    hidden: (side) => ({
      opacity: 0,
      x: side === 'left' ? '-100%' : '100%',
    }),
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        delayChildren: 0.05,
        staggerChildren: 0.02,
      },
    },
    exit: (side) => ({
      opacity: 0,
      x: side === 'left' ? '-100%' : '100%',
      transition: { duration: 0.15, ease: "easeOut" }
    }),
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400 }}
      className={`w-full max-w-md mx-auto flex flex-col overflow-hidden rounded-2xl border shadow-md hover:shadow-xl cursor-pointer relative ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"
      }`}
    >
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
          <div
          ref={tagLeftRef}
          className="absolute top-0 left-0 rounded-br-2xl z-10 px-2 py-0.5 font-semibold text-white text-[0.65rem] sm:text-xs bg-green-600/70 max-w-[70%] truncate"
          onClick={(e) => handleTagClick(e, 'left')}
        >
          {getCategoryIcon(listing.purchase_category)}
        </div>        
        
        
        )}
        {listing.status && (
          <div
            ref={tagRightRef} // Attach ref here
            className={`absolute top-0 right-0 rounded-bl-2xl z-10 px-2 py-0.5 font-semibold text-white text-[0.65rem] sm:text-xs ${getStatusColor(listing.status)} max-w-[70%] truncate`}
            onClick={(e) => handleTagClick(e, 'right')} // Pass 'right' for status
          >
            {getStatusIcon(listing.status)}
          </div>
        )}
      </div>

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

      <div className={`px-4 ${compactMode ? "pt-1 pb-1 gap-1" : "pt-2 pb-2 gap-2"} flex flex-col text-sm`}>
        <h3 className={`font-bold truncate ${darkMode ? "text-green-400" : "text-green-700"}`} title={listing.title}>
          {listing.title}
        </h3>

        <div className={`flex justify-between text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          <div className="flex flex-col gap-0.5 overflow-hidden max-w-[60%]">
            <p className="truncate" title={`${listing.location}, ${listing.location}`}>📍 {listing.location}, {listing.state}</p>
            <p className="truncate" title={listing.property_type}>🏘️ {listing.property_type}</p>
          </div>
          <div className="flex flex-col gap-0.5 text-right min-w-[40%]">
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
            {isLandProperty && listing.land_size && (
              <p className="whitespace-nowrap">
                 {listing.land_size}
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

        <div className="flex justify-between items-center pt-1">
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

      {/* Edit/Delete Side Menu */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            // Pass dropdownSide as custom prop for variants
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={dropdownSide}
            // Dynamic positioning based on dropdownSide and content width
            className={`absolute top-5 z-50 border shadow-xl py-1 overflow-hidden h-fit
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
              ${dropdownSide === 'left' ? 'left-0 origin-left rounded-r-xl' : 'right-0 origin-right rounded-l-xl'}
              w-fit max-w-xs
              ${dropdownSide === 'left' ? 'rounded-tl-none rounded-bl-none' : 'rounded-tr-none rounded-br-none'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              variants={itemVariants}
              whileHover={{ x: 5 }}
              // Modified onClick to pass the specific field to open in EditListing
              onClick={(e) => handleEdit(e, dropdownSide === 'left' ? 'purchaseCategory' : 'status')}
              className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
            >
              <Pencil size={16} /> Edit
            </motion.button>
            <motion.button
              variants={itemVariants}
              whileHover={{ x: 5 }}
              onClick={handleDelete}
              className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 font-medium transition-colors duration-200 ${darkMode ? "hover:bg-red-900" : "hover:bg-red-50"}`}
            >
              <Trash2 size={16} /> Delete
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ListingCard;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Import motion
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook

function ListingCard({ listing: initialListing }) { // Renamed listing to initialListing
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context

  // Create a new listing object with a dummy rating for demonstration
  const listing = {
    ...initialListing,
    rating: 4.27 // Dummy rating added here
  };

  const allImages = listing.gallery_images?.length > 0
    ? [listing.image_url, ...listing.gallery_images]
    : listing.image_url
    ? [listing.image_url]
    : [];

  const [mainIndex, setMainIndex] = useState(0);
  const previewImages = allImages.slice(1, 6);
  const extraCount = allImages.length > 6 ? allImages.length - 5 : 0;

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Sale': return '💰 For Sale';
      case 'Rent': return '🏠 For Rent';
      case 'Lease': return '📜 For Lease';
      case 'Short Let': return '🏖️ Short Let';
      case 'Long Let': return '🗓️ Long Let';
      default: return '🏡';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return '✅ Available';
      case 'sold': return '🔴 Sold';
      case 'under offer': return '🤝 Under Offer';
      case 'pending': return '⏳ Pending';
      case 'approved': return '👍 Approved';
      case 'rejected': return '❌ Rejected';
      case 'featured': return '⭐ Featured';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'sold': return 'bg-red-600';
      case 'available': return 'bg-green-600';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price, category) => {
    if (price == null) return 'Price not available';
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
    switch (category) {
      case 'Rent': return `${formatted} / Year`;
      case 'Short Let': return `${formatted} / Night`;
      case 'Long Let': return `${formatted} / Month`;
      default: return formatted;
    }
  };

  const handleClick = () => {
    navigate(`/listings/${listing.property_id}`);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setMainIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setMainIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    // Outer container for the card, allowing it to take full width of grid column
    <div className="flex flex-col w-full">
      {/* The main card container */}
      <motion.div
        onClick={handleClick}
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400 }}
        className={`relative w-full rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col cursor-pointer
          ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-green-200"}`}
      >
        {/* Main Image + Overlay Labels */}
        {/* Adjusted image height for mobile (h-48) to make space for the new info area */}
        <div className={`relative w-full h-48 sm:h-64 overflow-hidden rounded-t-2xl ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
          <img
            src={allImages[mainIndex]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />

          {/* Category - top left (reduced size for mobile) */}
          {listing.purchase_category && (
            <div className="absolute top-0 left-0 bg-green-600 text-white text-xs sm:text-sm font-semibold px-1 py-0.5 sm:px-2 sm:py-1 rounded-br-md z-10">
              {getCategoryIcon(listing.purchase_category)}
            </div>
          )}

          {/* Status - top right (reduced size for mobile) */}
          {listing.status && (
            <div className={`absolute top-0 right-0 ${getStatusColor(listing.status)} text-white text-xs sm:text-sm font-semibold px-1 py-0.5 sm:px-2 sm:py-1 rounded-bl-md z-10`}>
              {getStatusIcon(listing.status)}
            </div>
          )}

          {/* Arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-50 z-10"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-50 z-10"
              >
                →
              </button>
            </>
          )}
        </div>

        {/* NEW: Small fixed-height area for mobile view only, just under the image */}
        <div className={`sm:hidden p-2 flex flex-col justify-center h-24 flex-shrink-0 ${darkMode ? "bg-gray-700 text-gray-300" : "bg-white text-gray-700"}`}>
            {/* Title with hover reveal */}
            <h3 className={`text-sm font-bold truncate mb-1 ${darkMode ? "text-green-400" : "text-green-700"}`}
                title={listing.title}>
                {listing.title}
            </h3>
            {/* Location, Beds, and Baths on the same line */}
            <div className="flex items-center text-xs mb-1">
                <p className="truncate" title={`${listing.location}, ${listing.state}`}>
                    📍 {listing.location}, {listing.state}
                </p>
                {listing.bedrooms && <p className="ml-2">🛏️ {listing.bedrooms}</p>}
                {listing.bathrooms && <p className="ml-2">🛁 {listing.bathrooms}</p>}
            </div>
            {/* Price and Rating at the bottom */}
            <div className="flex justify-between items-center text-sm">
                {/* Price on the left with hover reveal */}
                <p className={`font-bold truncate ${darkMode ? "text-green-400" : "text-green-700"}`}
                   title={formatPrice(listing.price, listing.purchase_category)}>
                    {formatPrice(listing.price, listing.purchase_category)}
                </p>
                {/* Rating on the right */}
                {listing.rating && (
                    <p className={`text-xs ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                        ⭐ {listing.rating.toFixed(1)}
                    </p>
                )}
            </div>
        </div>


        {/* Preview Images - hidden on small screens, visible on sm and up */}
        {previewImages.length > 0 && (
          <div className="hidden sm:grid grid-cols-6 gap-1 px-2 py-2">
            {previewImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Preview ${i + 1}`}
                className="h-12 w-full object-cover rounded-sm"
              />
            ))}
            {extraCount > 0 && (
              <div
                onClick={handleClick}
                className={`h-12 flex items-center justify-center text-sm font-semibold rounded-sm ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-300 text-gray-700 hover:bg-gray-400"}`}
              >
                +{extraCount}
              </div>
            )}
          </div>
        )}

        {/* Card Body - hidden on small screens, visible on sm and up */}
        <div className="hidden sm:flex p-4 flex-grow flex-col">
          <h2 className={`text-base font-bold mb-2 truncate ${darkMode ? "text-green-400" : "text-green-700"}`}>
            {listing.title}
          </h2>

          <div className={`flex flex-wrap items-start justify-between gap-y-2 mb-4 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            <div className="flex flex-col space-y-1">
              <p className="flex items-center">📍 {listing.location}, {listing.state}</p>
              <p className="flex items-center">🏡 {listing.property_type}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <p className="flex items-center">🛏️ {listing.bedrooms} Bedrooms</p>
              <p className="flex items-center">🛁 {listing.bathrooms} Bathrooms</p>
            </div>
          </div>

          {/* Price and Rating at the bottom */}
          <div className="flex justify-between items-center text-sm mt-auto">
            <p className={`font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>
              {formatPrice(listing.price, listing.purchase_category)}
            </p>
            {listing.rating && (
                <p className={`${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                    ⭐ {listing.rating.toFixed(1)}
                </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ListingCard;

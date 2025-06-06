import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Import motion
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook

function ListingCard({ listing }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // Use the dark mode context

function ListingCard({ listing }) {
  const navigate = useNavigate();

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
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400 }}
      className={`relative max-w-md rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full cursor-pointer
        ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-green-200"}`}
    >
      {/* Main Image + Overlay Labels */}
      <div className={`relative w-full h-64 overflow-hidden rounded-t-2xl ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
    <motion.div // Changed to motion.div
      className="relative max-w-md bg-white border border-green-200 rounded-2xl shadow-md transition-shadow duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
      onClick={handleClick}
      // Enhanced Hover animation with a more noticeable bounce and settle size
      whileHover={{
        scale: [1, 1.03, 1.02], // Scale up to 1.03, then settle slightly down to 1.02
        y: [0, -5, -3],       // Lift up, then settle slightly down
        boxShadow: [
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // initial shadow-md
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", // shadow-xl at peak
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"  // shadow-lg at settle
        ]
      }}
      transition={{ duration: 0.3, ease: "easeOut" }} // Smooth transition for hover
    >
      {/* Main Image + Overlay Labels */}
      <div className="relative w-full h-64 bg-gray-100 overflow-hidden rounded-t-2xl">
        <img
          src={allImages[mainIndex]}
          alt={listing.title}
          className="w-full h-full object-cover"
        />

        {/* Category - top left */}
        {listing.purchase_category && (
          <div className="absolute top-0 left-0 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-br-md z-10">
            {getCategoryIcon(listing.purchase_category)}
          </div>
        )}

        {/* Status - top right */}
        {listing.status && (
          <div className={`absolute top-0 right-0 ${getStatusColor(listing.status)} text-white text-xs font-semibold px-2 py-1 rounded-bl-md z-10`}>
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

      {/* Preview Images */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-6 gap-1 px-2 py-2">
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
              className="h-12 flex items-center justify-center bg-gray-300 text-gray-700 text-sm font-semibold rounded-sm hover:bg-gray-400"
            >
              +{extraCount}
            </div>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 flex-grow flex flex-col">
        <h2 className={`text-base font-bold mb-2 truncate ${darkMode ? "text-green-400" : "text-green-700"}`}>{listing.title}</h2>

        <div className={`flex flex-wrap items-start justify-between gap-y-2 mb-4 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        <h2 className="text-base font-bold text-green-700 mb-2 truncate">{listing.title}</h2>

        <div className="flex flex-wrap items-start justify-between gap-y-2 mb-4 text-sm text-gray-700">
          <div className="flex flex-col space-y-1">
            <p className="flex items-center">📍 {listing.location}, {listing.state}</p>
            <p className="flex items-center">🏡 {listing.property_type}</p>
          </div>
          <div className="flex flex-col space-y-1">
            <p className="flex items-center">🛏️ {listing.bedrooms} Bedrooms</p>
            <p className="flex items-center">🛁 {listing.bathrooms} Bathrooms</p>
          </div>
        </div>

        <p className={`text-sm font-bold mt-auto ${darkMode ? "text-green-400" : "text-green-700"}`}>
        <p className="text-sm font-bold text-green-700 mt-auto">
          {formatPrice(listing.price, listing.purchase_category)}
        </p>
      </div>
    </motion.div>
  );
}

export default ListingCard;

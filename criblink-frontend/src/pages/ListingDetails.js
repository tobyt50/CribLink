import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import ListingCard from '../components/ListingCard'; // Import ListingCard
<<<<<<< HEAD
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook
=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

const App = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [images, setImages] = useState([]);
  const [mainIndex, setMainIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [agentInfo, setAgentInfo] = useState(null);
  const [similarListings, setSimilarListings] = useState([]); // New state for similar listings
<<<<<<< HEAD
  const { darkMode } = useTheme(); // Use the dark mode context
=======
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

  useEffect(() => {
    const fetchUser = async () => {
      try {
<<<<<<< HEAD
        const token = localStorage.localStorage.getItem('token');
=======
        const token = localStorage.getItem('token');
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
        if (!token) return;

        const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data) {
          setUserRole(data.role);
          setUserId(data.user_id);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUser();
  }, []);


  useEffect(() => {
    const fetchListingAndSimilar = async () => {
      try {
        // Fetch the main listing
        const { data } = await axios.get(`${API_BASE_URL}/listings/${id}`);
        setListing(data);

        const mainImage = data.image_url ? [data.image_url] : [];
        const gallery = data.gallery_images || [];
        setImages([...mainImage, ...gallery]);

        // Populate agent details
        if (data.agent_name || data.agent_email || data.agent_phone) {
          setAgentInfo({
            name: data.agent_name || 'N/A',
            email: data.agent_email || 'N/A',
            phone: data.agent_phone || 'N/A',
<<<<<<< HEAD
            profilePic: `https://placehold.co/100x100/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=${(data.agent_name || 'JD').split(' ').map(n => n[0]).join('').toUpperCase()}`
=======
            profilePic: `https://placehold.co/100x100/E0F2F1/047857?text=${(data.agent_name || 'JD').split(' ').map(n => n[0]).join('').toUpperCase()}`
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          });
        }

        // Fetch all listings to find similar ones
        const allListingsResponse = await axios.get(`${API_BASE_URL}/listings`);
<<<<<<< HEAD
        // Access the 'listings' array from the response data
        const allListings = allListingsResponse.data.listings;
=======
        const allListings = allListingsResponse.data;
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

        // Filter for similar listings (excluding the current one)
        const filteredSimilar = allListings.filter(
          (item) =>
            item.property_id !== data.property_id
<<<<<<< HEAD
            // Commented out similarity logic for debugging purposes:
=======
            // Commented out similarity logic for testing purposes:
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
            // && item.property_type === data.property_type
            // && item.purchase_category === data.purchase_category
            // && item.state === data.state
        );
<<<<<<< HEAD
        // Take up to 3 random similar listings (or any 3 if similarity logic is commented out)
        // To ensure randomness for debug, you might shuffle the array before slicing,
        // but for simply displaying "any 3", slicing after filtering out the current one is sufficient.
=======
        // Take up to 3 similar listings
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
        setSimilarListings(filteredSimilar.slice(0, 3));

      } catch (err) {
        console.error('Error fetching listing or similar listings:', err);
      }
    };
    fetchListingAndSimilar();
<<<<<<< HEAD
  }, [id, darkMode]); // Added darkMode to dependency array for agentInfo profilePic
=======
  }, [id]);
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e

  // Escape key and outside click to close preview
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowPreview(false);
      }
    };

    const handleClickOutside = (e) => {
      if (previewRef.current && !previewRef.current.contains(e.target)) {
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

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'Sale': return '💰 For Sale';
      case 'Rent': return '🏠 For Rent';
      case 'Lease': return '📜 For Lease';
      case 'Short Let': return '🏖️ Short Let';
      case 'Long Let': return '🗓️ Long Let';
      default: return '🏡';
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'available': return 'bg-green-600';
      case 'sold': return 'bg-red-600';
      case 'pending': return 'bg-yellow-500';
      case 'featured': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handlePrev = () => {
    setMainIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setMainIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
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

  const handleCopyLink = () => {
<<<<<<< HEAD
    navigator.clipboard.writeText(window.location.href).then(() => {
        console.log('Link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        // Fallback for older browsers or if clipboard API is not available/permitted
        const el = document.createElement('textarea');
        el.value = window.location.href;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        console.log('Link copied via fallback method!');
    });
  };


  if (!listing) return <div className={`p-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading listing...</div>;

  return (
    <motion.div
      className={`min-h-screen py-10 px-6 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
=======
    document.execCommand('copy'); // Use document.execCommand for clipboard access in iframes
    console.log('Link copied to clipboard!');
  };


  if (!listing) return <div className="p-6 text-center text-gray-500">Loading listing...</div>;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-10 px-6 md:px-12"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* LEFT SIDE - Main Content */}
        <motion.div
<<<<<<< HEAD
          className={`w-full lg:w-3/5 rounded-2xl shadow-xl p-6 space-y-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}
=======
          className="w-full lg:w-3/5 bg-white rounded-2xl shadow-xl p-6 space-y-8"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Image Viewer */}
          {images.length > 0 && (
            <div>
<<<<<<< HEAD
              <div className={`relative w-full h-96 rounded-xl overflow-hidden mb-4 shadow-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
=======
              <div className="relative w-full h-96 rounded-xl overflow-hidden bg-gray-100 mb-4 shadow-md">
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
                <img
                  src={images[mainIndex]}
                  alt={`Main ${mainIndex}`}
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                  onClick={handleImageClick}
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <span className="sr-only">Previous image</span>←
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <span className="sr-only">Next image</span>→
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-6 gap-2">
                {images.slice(0, 6).map((img, i) => (
                  <motion.img
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.2 }}
                    key={i}
                    src={img}
                    alt={`Thumb ${i}`}
                    className={`h-16 w-full object-cover rounded-md cursor-pointer border-2 transition-all duration-200 ${i === mainIndex ? 'border-green-600 ring-2 ring-green-400' : 'border-transparent'
                      }`}
                    onClick={() => handleThumbClick(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Listing Overview */}
<<<<<<< HEAD
          <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
            <div className="flex justify-between items-start flex-wrap">
              <h1 className={`text-2xl md:text-3xl font-extrabold ${darkMode ? "text-green-400" : "text-green-800"}`}>
=======
          <div className="space-y-4 border-b pb-6 border-gray-200">
            <div className="flex justify-between items-start flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-green-800">
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
                {listing.title}
              </h1>
              <div className="flex gap-2 mt-2">
                <span className="bg-green-600 text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                  {getCategoryLabel(listing.purchase_category)}
                </span>
                <span className={`text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm ${getStatusColor(listing.status)}`}>
                  {listing.status?.toUpperCase()}
                </span>
              </div>
            </div>

<<<<<<< HEAD
            <p className={`text-xl md:text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>
              {formatPrice(listing.price, listing.purchase_category)}
            </p>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
=======
            <p className="text-xl md:text-2xl font-bold text-green-700">
              {formatPrice(listing.price, listing.purchase_category)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base text-gray-700">
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
              <p><strong>📍 Location:</strong> {listing.location}, {listing.state}</p>
              <p><strong>🏡 Property Type:</strong> {listing.property_type}</p>
              <p><strong>🛏️ Bedrooms:</strong> {listing.bedrooms}</p>
              <p><strong>🛁 Bathrooms:</strong> {listing.bathrooms}</p>
              <p><strong>📅 Listed:</strong> {new Date(listing.date_listed).toLocaleDateString()}</p>
            </div>

            {(userRole === 'admin' || (userRole === 'agent' && userId === listing.agent_id)) && (
              <button
                onClick={() => navigate(`/edit-listing/${listing.property_id}`)}
                className="mt-6 bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition-colors duration-300 shadow-md"
              >
                ✏️ Edit Listing
              </button>
            )}
          </div>

          {/* Amenities - Moved before Key Features */}
          {listing.amenities && (
<<<<<<< HEAD
            <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.split(',').map((amenity, index) => (
                  <span key={index} className={`text-sm font-medium px-3 py-1 rounded-full shadow-sm ${darkMode ? "bg-green-700 text-green-200" : "bg-green-100 text-green-800"}`}>
=======
            <div className="space-y-4 border-b pb-6 border-gray-200">
              <h2 className="text-xl font-bold text-green-700">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.split(',').map((amenity, index) => (
                  <span key={index} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
                    {amenity.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Other Property Details (Key Features) */}
<<<<<<< HEAD
          <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Key Features</h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
=======
          <div className="space-y-4 border-b pb-6 border-gray-200">
            <h2 className="text-xl font-bold text-green-700">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base text-gray-700">
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
              {listing.square_footage && (
                <p><strong>📐 Square Footage:</strong> {listing.square_footage} sqft</p>
              )}
              {listing.lot_size && (
                <p><strong>🌳 Lot Size:</strong> {listing.lot_size} acres</p>
              )}
              {listing.year_built && (
                <p><strong>🏗️ Year Built:</strong> {listing.year_built}</p>
              )}
              {listing.heating_type && (
                <p><strong>🔥 Heating:</strong> {listing.heating_type}</p>
              )}
              {listing.cooling_type && (
                <p><strong>❄️ Cooling:</strong> {listing.cooling_type}</p>
              )}
              {listing.parking && (
                <p><strong>🚗 Parking:</strong> {listing.parking}</p>
              )}
            </div>
          </div>

          {/* Property Description */}
          {listing.description && (
<<<<<<< HEAD
            <div className="space-y-2">
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Description</h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>{listing.description}</p>
=======
            <div className="space-y-2 border-b pb-6 border-gray-200">
              <h2 className="text-xl font-bold text-green-700">Description</h2>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
            </div>
          )}
        </motion.div>

        {/* RIGHT SIDE - Contact, Share, Map */}
        <motion.div
          className="w-full lg:w-2/5 space-y-8"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Contact Agent Card */}
          {agentInfo && (
<<<<<<< HEAD
            <div className={`rounded-2xl shadow-xl p-6 space-y-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Contact Agent</h2>
=======
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-green-700">Contact Agent</h2>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
              <div className="flex items-center space-x-4">
                <img
                  src={agentInfo.profilePic}
                  alt={agentInfo.name}
<<<<<<< HEAD
                  className={`w-16 h-16 rounded-full object-cover border-2 shadow-sm ${darkMode ? "border-green-700" : "border-green-300"}`}
                />
                <div>
                  <p className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agentInfo.name}</p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Property Agent</p>
=======
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-300 shadow-sm"
                />
                <div>
                  <p className="text-lg font-semibold text-gray-800">{agentInfo.name}</p>
                  <p className="text-sm text-gray-600">Property Agent</p>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
                </div>
              </div>
              <div className="space-y-2">
                {agentInfo.email !== 'N/A' && (
                  <a
                    href={`mailto:${agentInfo.email}`}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors duration-300 shadow-md justify-center"
                  >
                    📧 Email Agent
                  </a>
                )}
                {agentInfo.phone !== 'N/A' && (
                  <a
                    href={`tel:${agentInfo.phone}`}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors duration-300 shadow-md justify-center"
                  >
                    📞 Call Agent
                  </a>
                )}
              </div>
            </div>
          )}


          {/* Share This Listing */}
<<<<<<< HEAD
          <div className={`rounded-2xl shadow-xl p-6 space-y-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Share This Listing</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors duration-300 shadow-sm ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800"}`}
=======
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-green-700">Share This Listing</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors duration-300 shadow-sm"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
              >
                🔗 Copy Link
              </button>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors duration-300 shadow-sm"
              >
                📘 Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${window.location.href}&text=Check out this amazing property! ${listing.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition-colors duration-300 shadow-sm"
              >
                🐦 Twitter
              </a>
            </div>
          </div>

          {/* Location Map (Placeholder) */}
<<<<<<< HEAD
          <div className={`rounded-2xl shadow-xl p-6 space-y-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Location Map</h2>
=======
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-green-700">Location Map</h2>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
            <a
              href={`http://maps.google.com/?q=${listing.location}, ${listing.state}`}
              target="_blank"
              rel="noopener noreferrer"
<<<<<<< HEAD
              className={`block w-full h-48 rounded-xl overflow-hidden shadow-inner relative group ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            >
              <img
                src={`https://placehold.co/600x400/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=Map+of+${listing.location}`}
=======
              className="block w-full h-48 bg-gray-200 rounded-xl overflow-hidden shadow-inner relative group"
            >
              <img
                src={`https://placehold.co/600x400/E0F2F1/047857?text=Map+of+${listing.location}`}
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
                alt="Map Placeholder"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-opacity duration-300">
                <span className="text-white text-lg font-semibold">View on Google Maps</span>
              </div>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Similar Listings */}
      {similarListings.length > 0 && (
        <motion.div
<<<<<<< HEAD
          className={`max-w-7xl mx-auto mt-12 rounded-2xl shadow-xl p-6 space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
=======
          className="max-w-7xl mx-auto mt-12 bg-white rounded-2xl shadow-xl p-6 space-y-6"
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
<<<<<<< HEAD
          <h2 className={`text-2xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Similar Listings You Might Like</h2>
=======
          <h2 className="text-2xl font-bold text-green-700 text-center">Similar Listings You Might Like</h2>
>>>>>>> dd9ece3b45b6f7e418258a154428618e314c087e
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarListings.map((similarListing) => (
              <ListingCard key={similarListing.property_id} listing={similarListing} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={previewRef}
              className="relative w-[95vw] h-[90vh] bg-black rounded-xl flex items-center justify-center overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={images[mainIndex]}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
              />

              {/* Close button */}
              <button
                onClick={closePreview}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-black text-xl font-bold px-3 py-1 rounded-full shadow-lg"
              >
                ✕
              </button>

              {/* Arrows inside modal */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 p-3 rounded-full"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl font-bold bg-black bg-opacity-40 hover:bg-opacity-60 p-3 rounded-full"
                  >
                    →
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default App;

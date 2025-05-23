import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import ListingCard from '../components/ListingCard'; // Import ListingCard

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
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
            profilePic: `https://placehold.co/100x100/E0F2F1/047857?text=${(data.agent_name || 'JD').split(' ').map(n => n[0]).join('').toUpperCase()}`
          });
        }

        // Fetch all listings to find similar ones
        const allListingsResponse = await axios.get(`${API_BASE_URL}/listings`);
        const allListings = allListingsResponse.data;

        // Filter for similar listings (excluding the current one)
        const filteredSimilar = allListings.filter(
          (item) =>
            item.property_id !== data.property_id
            // Commented out similarity logic for testing purposes:
            // && item.property_type === data.property_type
            // && item.purchase_category === data.purchase_category
            // && item.state === data.state
        );
        // Take up to 3 similar listings
        setSimilarListings(filteredSimilar.slice(0, 3));

      } catch (err) {
        console.error('Error fetching listing or similar listings:', err);
      }
    };
    fetchListingAndSimilar();
  }, [id]);

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
    document.execCommand('copy'); // Use document.execCommand for clipboard access in iframes
    console.log('Link copied to clipboard!');
  };


  if (!listing) return <div className="p-6 text-center text-gray-500">Loading listing...</div>;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-10 px-6 md:px-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* LEFT SIDE - Main Content */}
        <motion.div
          className="w-full lg:w-3/5 bg-white rounded-2xl shadow-xl p-6 space-y-8"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Image Viewer */}
          {images.length > 0 && (
            <div>
              <div className="relative w-full h-96 rounded-xl overflow-hidden bg-gray-100 mb-4 shadow-md">
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
          <div className="space-y-4 border-b pb-6 border-gray-200">
            <div className="flex justify-between items-start flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-green-800">
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

            <p className="text-xl md:text-2xl font-bold text-green-700">
              {formatPrice(listing.price, listing.purchase_category)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base text-gray-700">
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
            <div className="space-y-4 border-b pb-6 border-gray-200">
              <h2 className="text-xl font-bold text-green-700">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.split(',').map((amenity, index) => (
                  <span key={index} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                    {amenity.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Other Property Details (Key Features) */}
          <div className="space-y-4 border-b pb-6 border-gray-200">
            <h2 className="text-xl font-bold text-green-700">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base text-gray-700">
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
            <div className="space-y-2 border-b pb-6 border-gray-200">
              <h2 className="text-xl font-bold text-green-700">Description</h2>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
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
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-green-700">Contact Agent</h2>
              <div className="flex items-center space-x-4">
                <img
                  src={agentInfo.profilePic}
                  alt={agentInfo.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-300 shadow-sm"
                />
                <div>
                  <p className="text-lg font-semibold text-gray-800">{agentInfo.name}</p>
                  <p className="text-sm text-gray-600">Property Agent</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-green-700">Share This Listing</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors duration-300 shadow-sm"
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
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-green-700">Location Map</h2>
            <a
              href={`http://maps.google.com/?q=${listing.location}, ${listing.state}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-48 bg-gray-200 rounded-xl overflow-hidden shadow-inner relative group"
            >
              <img
                src={`https://placehold.co/600x400/E0F2F1/047857?text=Map+of+${listing.location}`}
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
          className="max-w-7xl mx-auto mt-12 bg-white rounded-2xl shadow-xl p-6 space-y-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-green-700 text-center">Similar Listings You Might Like</h2>
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

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom'; // Corrected import: changed 'react-router-router-dom' to 'react-router-dom'
import { jwtDecode } from 'jwt-decode';
import ListingCard from '../components/ListingCard'; // Import ListingCard
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook
import { X, Bookmark } from 'lucide-react'; // Import X and Bookmark icon for the modal close button and favourite button
import ClientInquiryModal from '../components/ClientInquiryModal'; // Import the dedicated ClientInquiryModal

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
  const [clientName, setClientName] = useState(''); // State for authenticated client's name
  const [clientEmail, setClientEmail] = useState(''); // State for authenticated client's email
  const [clientPhone, setClientPhone] = useState(''); // State for authenticated client's phone
  const [agentInfo, setAgentInfo] = useState(null);
  const [similarListings, setSimilarListings] = useState([]); // New state for similar listings
  const { darkMode } = useTheme(); // Use the dark mode context

  // State for client inquiry modal visibility and status
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState(null); // 'success', 'error', or null for ClientInquiryModal

  // State for favourite status
  const [isFavorited, setIsFavorited] = useState(false);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUserRole('guest'); // Set role as guest if no token
          return;
        }

        const { data } = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data) {
          setUserRole(data.role);
          setUserId(data.user_id);
          // Set client details if authenticated
          setClientName(data.full_name || '');
          setClientEmail(data.email || '');
          setClientPhone(data.phone || '');
        } else {
          setUserRole('guest'); // Fallback to guest if data is not received
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setUserRole('guest'); // Assume guest if there's an error fetching profile (e.g., invalid token)
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
            profilePic: `https://placehold.co/100x100/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=${(data.agent_name || 'JD').split(' ').map(n => n[0]).join('').toUpperCase()}`
          });
        }

        // Fetch all listings to find similar ones
        const allListingsResponse = await axios.get(`${API_BASE_URL}/listings`);
        const allListings = allListingsResponse.data.listings;

        // Filter for similar listings (excluding the current one)
        const filteredSimilar = allListings.filter(
          (item) =>
            item.property_id !== data.property_id
            // && item.property_type === data.property_type
            // && item.purchase_category === data.purchase_category
            // && item.state === data.state
        );
        setSimilarListings(filteredSimilar.slice(0, 3));

      } catch (err) {
        console.error('Error fetching listing or similar listings:', err);
      }
    };
    fetchListingAndSimilar();
  }, [id, darkMode]);

  // Effect to check favorite status
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (userId && listing && userRole !== 'guest') {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_BASE_URL}/favourites/status/${listing.property_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsFavorited(response.data.isFavorited);
        } catch (err) {
          console.error('Error checking favorite status:', err);
          setIsFavorited(false); // Assume not favorited on error
        }
      } else {
        setIsFavorited(false); // Not favorited if no user or guest
      }
    };
    checkFavoriteStatus();
  }, [userId, listing, userRole]); // Re-run when userId or listing changes

  // Escape key and outside click to close preview/modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowPreview(false);
        setIsInquiryModalOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (showPreview && previewRef.current && !previewRef.current.contains(e.target)) {
        setShowPreview(false);
      }
    };

    if (showPreview) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }
    if (isInquiryModalOpen) {
      document.addEventListener("keydown", handleEscape);
    }


    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPreview, isInquiryModalOpen]);

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
    navigator.clipboard.writeText(window.location.href).then(() => {
        console.log('Link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        const el = document.createElement('textarea');
        el.value = window.location.href;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        console.log('Link copied via fallback method!');
    });
  };

  // Handler for sending inquiry (used by ClientInquiryModal)
  const handleSendInquiry = async (inquiryData, setModalInquiryStatus) => { // Added setModalInquiryStatus
    if (!listing || !listing.agent_id) {
      console.error('Agent ID not found for this listing.');
      setModalInquiryStatus('error'); // Use the modal's internal status setter
      return;
    }

    let inquiryPayload = {
      agent_id: listing.agent_id,
      property_id: listing.property_id,
      message: inquiryData.message,
    };

    let token = localStorage.getItem('token');
    let currentClientId = userId;

    if (userRole === 'client' && currentClientId) {
      inquiryPayload = {
        ...inquiryPayload,
        client_id: currentClientId, // Use integer ID
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
      };
    } else {
      if (!inquiryData.name || !inquiryData.email) {
        setModalInquiryStatus('error');
        console.error('Name and Email are required for guest inquiries.');
        return;
      }
      inquiryPayload = {
        ...inquiryPayload,
        client_id: null,
        name: inquiryData.name,
        email: inquiryData.email,
        phone: inquiryData.phone,
      };
      token = null; // No token for guests
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(`${API_BASE_URL}/agent/inquiries`, inquiryPayload, {
        headers: headers,
      });

      if (response.status === 201) {
        setModalInquiryStatus('success'); // Use the modal's internal status setter
        setTimeout(() => {
          setIsInquiryModalOpen(false);
          setModalInquiryStatus(null); // Reset status after modal closes
        }, 3000);
      } else {
        setModalInquiryStatus('error'); // Use the modal's internal status setter
      }
    } catch (err) {
      console.error('Error sending inquiry:', err);
      setModalInquiryStatus('error'); // Use the modal's internal status setter
    }
  };

  // Handle toggling favorite status
  const handleToggleFavorite = async () => {
    if (!userId || !listing || userRole === 'guest') {
      console.warn('User not authenticated or not a client/agent/admin to favorite.');
      // Potentially show a message asking guest to log in
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token not found.");
        return;
    }

    try {
      if (isFavorited) {
        // Remove from favorites
        await axios.delete(`${API_BASE_URL}/favourites/${listing.property_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorited(false);
        console.log('Removed from favorites!');
      } else {
        // Add to favorites
        await axios.post(`${API_BASE_URL}/favourites`, { property_id: listing.property_id }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorited(true);
        console.log('Added to favorites!');
      }
    } catch (err) {
      console.error('Error toggling favorite status:', err.response?.data || err.message);
    }
  };


  if (!listing) return <div className={`p-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Loading listing...</div>;

  return (
    <motion.div
      className={`min-h-screen py-10 px-6 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* LEFT SIDE - Main Content */}
        <motion.div
          className={`w-full lg:w-3/5 rounded-2xl shadow-xl p-6 space-y-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Image Viewer */}
          {images.length > 0 && (
            <div>
              <div className={`relative w-full h-96 rounded-xl overflow-hidden mb-4 shadow-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
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
          <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
            <div className="flex justify-between items-center flex-wrap"> {/* Changed items-start to items-center and added justify-between */}
              <h1 className={`text-2xl md:text-3xl font-extrabold ${darkMode ? "text-green-400" : "text-green-800"}`}>
                {listing.title}
              </h1>
              <div className="flex gap-2 items-center mt-2 md:mt-0"> {/* Added items-center and removed mt-2 for larger screens */}
                <span className="bg-green-600 text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                  {getCategoryLabel(listing.purchase_category)}
                </span>
                <span className={`text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm ${getStatusColor(listing.status)}`}>
                  {listing.status?.toUpperCase()}
                </span>
                {/* Favorite button (Instagram save icon) */}
                {userRole !== 'guest' && ( // Only show if user is logged in
                    <button
                        onClick={handleToggleFavorite}
                        className={`p-2 rounded-full shadow-md transition-all duration-200 ml-2 ${ // Added ml-2 for spacing
                            isFavorited
                                ? 'bg-blue-500 text-white hover:bg-blue-600' // Blue for saved
                                : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                        }`}
                        title={isFavorited ? "Remove from Saved" : "Save to Favourites"}
                    >
                        <Bookmark size={20} fill={isFavorited ? "currentColor" : "none"} />
                    </button>
                )}
              </div>
            </div>

            <p className={`text-xl md:text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>
              {formatPrice(listing.price, listing.purchase_category)}
            </p>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
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
            <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.split(',').map((amenity, index) => (
                  <span key={index} className={`text-sm font-medium px-3 py-1 rounded-full shadow-sm ${darkMode ? "bg-green-700 text-green-200" : "bg-green-100 text-green-800"}`}>
                    {amenity.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Other Property Details (Key Features) */}
          <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Key Features</h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
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
            <div className="space-y-2">
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Description</h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>{listing.description}</p>
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
            <div className={`rounded-2xl shadow-xl p-6 space-y-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Contact Agent</h2>
              <div className="flex items-center space-x-4">
                <img
                  src={agentInfo.profilePic}
                  alt={agentInfo.name}
                  className={`w-16 h-16 rounded-full object-cover border-2 shadow-sm ${darkMode ? "border-green-700" : "border-green-300"}`}
                />
                <div>
                  <p className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{agentInfo.name}</p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Property Agent</p>
                </div>
              </div>
              <div className="space-y-2">
                {/* Always show Call Agent if phone is available and user is authenticated */}
                {agentInfo.phone !== 'N/A' && userRole !== 'guest' && (
                  <a
                    href={`tel:${agentInfo.phone}`}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors duration-300 shadow-md justify-center w-full"
                  >
                    📞 Call Agent
                  </a>
                )}

                {/* Show Inquire Now for clients and guests, Email Agent for agents/admins viewing others' listings */}
                {userRole === 'client' || userRole === 'guest' ? (
                  <button
                    onClick={() => setIsInquiryModalOpen(true)}
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors duration-300 shadow-md justify-center w-full"
                  >
                    📝 Inquire Now
                  </button>
                ) : (
                  agentInfo.email !== 'N/A' && (
                    <a
                      href={`mailto:${agentInfo.email}`}
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors duration-300 shadow-md justify-center w-full"
                    >
                      📧 Email Agent
                    </a>
                  )
                )}
              </div>
            </div>
          )}


          {/* Share This Listing */}
          <div className={`rounded-2xl shadow-xl p-6 space-y-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Share This Listing</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-300 transition-colors duration-300 shadow-sm ${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800"}`}
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
          <div className={`rounded-2xl shadow-xl p-6 space-y-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Location Map</h2>
            <a
              href={`http://maps.google.com/?q=${listing.location}, ${listing.state}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full h-48 rounded-xl overflow-hidden shadow-inner relative group ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
            >
              <img
                src={`https://placehold.co/600x400/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=Map+of+${listing.location}`}
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
          className={`max-w-7xl mx-auto mt-12 rounded-2xl shadow-xl p-6 space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className={`text-2xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}>Similar Listings You Might Like</h2>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inquiry Modal (for clients/guests) */}
      <AnimatePresence>
        {isInquiryModalOpen && (
          <ClientInquiryModal
            isOpen={isInquiryModalOpen}
            onClose={() => {
              setIsInquiryModalOpen(false);
              setInquiryStatus(null); // Reset status on close
            }}
            onSubmit={handleSendInquiry}
            listingTitle={listing.title}
            darkMode={darkMode}
            userRole={userRole}
            clientName={clientName}
            clientEmail={clientEmail}
            clientPhone={clientPhone}
            inquiryStatus={inquiryStatus} // Pass status to ClientInquiryModal
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default App;

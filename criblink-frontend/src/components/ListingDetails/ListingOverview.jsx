import React from 'react';
import { Bookmark, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ListingOverview = ({
  listing,
  darkMode,
  formatPrice,
  getStatusLabel,
  getStatusColor,
  getCategoryLabel,
  isFavorited,
  handleToggleFavorite,
  userRole,
  userId,
  setIsShareModalOpen,
  navigate
}) => {
  const isLandProperty = listing?.property_type?.toLowerCase() === 'land';

  // Determine the status to display. Show "Featured" if is_featured is true,
  // unless the status is "Sold", "Pending", or "Rejected".
  const excludedStatuses = ["Sold", "Pending", "Rejected"];
  const displayStatus = listing.is_featured && !excludedStatuses.includes(listing.status)
    ? "Featured"
    : listing.status;

  const handleEditClick = () => {
    let basePath = '';
    if (userRole === 'admin') {
      basePath = '/admin';
    } else if (userRole === 'agent') {
      basePath = '/agent';
    }
    navigate(`${basePath}/edit-listing/${listing.property_id}`);
  };

  return (
    <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
      
      <div className="flex gap-2 items-center flex-wrap">
        <span className={`text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm ${getStatusColor(displayStatus)}`}>
          {getStatusLabel(displayStatus)}
        </span>
        <span className="bg-green-400 text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
          {getCategoryLabel(listing.purchase_category)}
        </span>
        {userRole !== 'guest' && (
            <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-full shadow-md transition-all duration-200 ml-2 ${
                    isFavorited
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                }`}
                title={isFavorited ? "Remove from Saved" : "Save to Favourites"}
            >
                <Bookmark size={20} fill={isFavorited ? "currentColor" : "none"} />
            </button>
        )}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className={`p-2 rounded-full shadow-md transition-all duration-200 ml-2 ${
              darkMode ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
          title="Share Listing"
        >
          <Share2 size={20} />
        </button>
      </div>
      <p className={`text-xl md:text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>
        {formatPrice(listing.price, listing.purchase_category)}
      </p>

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        <p><strong>📍 Location:</strong> {listing.location}, {listing.state}</p>
        <p><strong>🏡 Property Type:</strong> {listing.property_type}</p>
        {!isLandProperty && listing.bedrooms != null && (
          <p><strong>🛏️ Bedrooms:</strong> {listing.bedrooms}</p>
        )}
        {!isLandProperty && listing.bathrooms != null && (
          <p><strong>🛁 Bathrooms:</strong> {listing.bathrooms}</p>
        )}
        <p><strong>📅 Listed:</strong> {new Date(listing.date_listed).toLocaleDateString()}</p>
      </div>

      {(userRole === 'admin' || (userRole === 'agent' && userId === listing.agent_id)) && (
        <button
          onClick={handleEditClick}
          className="mt-6 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors duration-300 shadow-md"
        >
          ✏️ Edit Listing
        </button>
      )}
    </div>
  );
};

export default ListingOverview;

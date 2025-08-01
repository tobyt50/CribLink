import React from 'react';

const PropertyFeatures = ({ listing, darkMode, isLandProperty }) => {
  return (
    <>
      {!isLandProperty && listing.amenities && (
        <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
          <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.split(',').map((amenity, index) => (
              <span key={index} className={`text-sm font-medium px-3 py-1 rounded-full shadow-sm ${darkMode ? "bg-green-700" : "bg-green-100 text-green-800"}`}>
                {amenity.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={`space-y-4 pb-6 ${darkMode ? "border-gray-700" : "border-gray-200"} border-b`}>
        <h2 className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}>Key Features</h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-base ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          {!isLandProperty && listing.square_footage && (
            <p><strong>📐 Square Footage:</strong> {listing.square_footage} sqft</p>
          )}
          {listing.lot_size && (
            <p><strong>🌳 Lot Size:</strong> {listing.lot_size} acres</p>
          )}
          {!isLandProperty && listing.year_built && (
            <p><strong>🏗️ Year Built:</strong> {listing.year_built}</p>
          )}
          {!isLandProperty && listing.heating_type && (
            <p><strong>🔥 Heating:</strong> {listing.heating_type}</p>
          )}
          {!isLandProperty && listing.cooling_type && (
            <p><strong>❄️ Cooling:</strong> {listing.cooling_type}</p>
          )}
          {!isLandProperty && listing.parking && (
            <p><strong>🚗 Parking:</strong> {listing.parking}</p>
          )}
          {isLandProperty && listing.land_size && (
            <p><strong>📐 Land Size:</strong> {listing.land_size} sqft/acres</p>
          )}
          {isLandProperty && listing.zoning_type && (
            <p><strong>🗺️ Zoning:</strong> {listing.zoning_type}</p>
          )}
          {isLandProperty && listing.title_type && (
            <p><strong>📜 Title Type:</strong> {listing.title_type}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default PropertyFeatures;

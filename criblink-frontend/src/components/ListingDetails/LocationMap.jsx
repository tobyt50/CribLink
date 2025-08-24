import React from "react";

const LocationMap = ({ listing, darkMode }) => {
  // Construct a robust location string for queries
  const locationString = `${listing.location}, ${listing.city || ""}, ${listing.state || ""}, ${listing.country || ""}`;

  // Google Maps URL (for general viewing)
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationString)}`;

  // Google Earth URL (for a search query)
  const googleEarthUrl = `https://earth.google.com/web/search/${encodeURIComponent(locationString)}`;

  return (
    <div
      className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
    >
      <h2
        className={`text-xl font-bold ${darkMode ? "text-green-400" : "text-green-700"}`}
      >
        Location Map
      </h2>

      <div className="flex flex-col sm:flex-row gap-4">
        {" "}
        {/* Flex container for buttons */}
        {/* Google Maps Button */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 block w-full h-48 rounded-xl overflow-hidden shadow-inner relative group ${darkMode ? "bg-gray-700" : "bg-gray-200"} flex items-center justify-center text-center p-4 transition-all duration-300 hover:scale-105`}
        >
          <img
            src={`https://placehold.co/600x400/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=Google+Maps`}
            alt="Google Maps Placeholder"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 opacity-70 group-hover:opacity-100"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-opacity duration-300 rounded-xl">
            <span className="text-white text-lg font-semibold z-10">
              View on Google Maps
            </span>
          </div>
        </a>
        {/* Google Earth Button */}
        <a
          href={googleEarthUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 block w-full h-48 rounded-xl overflow-hidden shadow-inner relative group ${darkMode ? "bg-gray-700" : "bg-gray-200"} flex items-center justify-center text-center p-4 transition-all duration-300 hover:scale-105`}
        >
          <img
            src={`https://placehold.co/600x400/${darkMode ? "2D3748" : "E0F2F1"}/${darkMode ? "A0AEC0" : "047857"}?text=Google+Earth`}
            alt="Google Earth Placeholder"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 opacity-70 group-hover:opacity-100"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-opacity duration-300 rounded-xl">
            <span className="text-white text-lg font-semibold z-10">
              View on Google Earth
            </span>
          </div>
        </a>
      </div>
    </div>
  );
};

export default LocationMap;

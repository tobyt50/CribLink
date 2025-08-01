import React from 'react';

const LocationMap = ({ listing, darkMode }) => {
  return (
    <div className={`space-y-4 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}>
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
  );
};

export default LocationMap;

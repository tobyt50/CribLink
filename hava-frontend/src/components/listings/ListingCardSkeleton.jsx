// src/components/listings/ListingCardSkeleton.jsx
const ListingCardSkeleton = ({ darkMode }) => (
    <div className={`rounded-xl shadow-lg p-4 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
      <div className={`w-full h-32 rounded-lg ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
      <div className={`h-4 w-3/4 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-2`}></div>
      <div className={`h-3 w-1/2 rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"} mb-3`}></div>
      <div className="flex justify-between items-center">
        <div className={`h-8 w-1/3 rounded-xl ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
        <div className={`h-8 w-8 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
      </div>
    </div>
  );
  
  export default ListingCardSkeleton;
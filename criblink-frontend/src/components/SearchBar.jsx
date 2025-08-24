import React from "react";
import { Search } from "lucide-react"; // Import the Search icon from lucide-react

function SearchBar({ searchTerm, setSearchTerm, handleSearch }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <form onSubmit={handleSearch} className="flex w-full relative">
        {" "}
        {/* Added relative for icon positioning */}
        <div className="relative w-full">
          {" "}
          {/* Wrapper for input and icon */}
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />{" "}
          {/* Search icon */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 pl-10 w-full border rounded-full" // Changed rounded-lg to rounded-full
            placeholder="Search by keyword, location, or type..."
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 ml-2 rounded-full hover:bg-green-700" // Changed rounded-lg to rounded-full
        >
          Search
        </button>
      </form>
    </div>
  );
}

export default SearchBar;

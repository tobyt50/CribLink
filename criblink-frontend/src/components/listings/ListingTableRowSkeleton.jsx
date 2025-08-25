// src/components/listings/ListingTableRowSkeleton.jsx
const ListingTableRowSkeleton = ({ darkMode }) => (
    <tr className={`border-t animate-pulse ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
      {[...Array(13)].map((_, i) => (
        <td key={i} className="py-2 px-2">
          <div className={`h-4 w-full rounded ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}></div>
        </td>
      ))}
    </tr>
  );
  
  export default ListingTableRowSkeleton;
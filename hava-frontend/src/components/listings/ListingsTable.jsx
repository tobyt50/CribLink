// src/components/listings/ListingsTable.jsx
import { useNavigate } from "react-router-dom";
// Import icons
import { ArrowDownIcon, ArrowUpIcon, ArrowUturnLeftIcon, CheckCircleIcon, CurrencyDollarIcon, PencilIcon, TrashIcon, XCircleIcon } from "@heroicons/react/24/outline";

const ListingsTable = ({
  listings,
  handleSortClick,
  sortKey,
  sortDirection,
  handleCardClick,
  showActionsColumn,
  getRoleBasePath,
  handleApproveListing,
  handleRejectListing,
  handleDeleteListing,
  handleMarkAsSold,
  handleMarkAsFailed,
  darkMode,
}) => {
  const navigate = useNavigate();

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const renderSortIcon = (key) => {
    const sortableColumns = ["property_id", "title", "location", "property_type", "price", "status", "date_listed", "purchase_category", "bedrooms", "bathrooms", "living_rooms", "kitchens"];
    if (!sortableColumns.includes(key)) return null;

    if (sortKey === key) {
      return sortDirection === "asc" ? <ArrowUpIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} /> : <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-green-400" : "text-green-700"}`} />;
    }
    return <ArrowDownIcon className={`h-4 w-4 ml-1 inline ${darkMode ? "text-gray-400" : "text-gray-400"}`} />;
  };

  const columns = [
    { key: "property_id", label: "ID", width: "90px" },
    { key: "title", label: "Title", width: "120px" },
    { key: "location", label: "Location", width: "120px" },
    { key: "property_type", label: "Type", width: "90px" },
    { key: "price", label: "Price", width: "120px" },
    { key: "status", label: "Status", width: "80px" },
    { key: "date_listed", label: "Date Listed", width: "120px" },
    { key: "purchase_category", label: "Category", width: "100px" },
    { key: "bedrooms", label: "Bedrooms", width: "70px" },
    { key: "bathrooms", label: "Bathrooms", width: "70px" },
    { key: "living_rooms", label: "Living", width: "70px" },
    { key: "kitchens", label: "Kitchens", width: "70px" },
  ];
  if (showActionsColumn) {
    columns.push({ key: "actions", label: "Actions", width: "auto" });
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full mt-4 text-sm table-auto ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        <thead>
          <tr className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {columns.map(({ key, label, width }) => (
              <th
                key={key}
                onClick={key !== "actions" ? () => handleSortClick(key) : undefined}
                className={`py-2 px-2 whitespace-nowrap ${key !== "actions" ? "cursor-pointer hover:text-green-700" : ""}`}
                style={{ width }}
              >
                <div className="flex items-center gap-1">
                  <span className="truncate">{label}</span>
                  {renderSortIcon(key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${darkMode ? "divide-gray-700" : "divide-gray-200"} divide-y`}>
          {listings.map((listing) => (
            <tr key={listing.property_id} onClick={() => handleCardClick(listing.property_id)} className={`transition-colors duration-200 cursor-pointer max-w-full break-words ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
              {columns.map(({ key, width }) => {
                let content;
                let title = listing[key] ? String(listing[key]) : "";
                switch (key) {
                  case "price":
                    content = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(listing.price);
                    title = content;
                    break;
                  case "date_listed":
                    content = listing.date_listed ? new Date(listing.date_listed).toLocaleDateString() : "N/A";
                    title = content;
                    break;
                  case "status":
                    const statusText = listing.is_featured ? "Featured" : capitalizeFirstLetter(listing.status);
                    const statusClass = listing.is_featured ? "text-yellow-500" :
                                        listing.status?.toLowerCase() === "available" ? "text-green-600" :
                                        listing.status?.toLowerCase() === "sold" ? "text-red-600" :
                                        listing.status?.toLowerCase() === "under offer" ? "text-yellow-600" :
                                        listing.status?.toLowerCase() === "pending" ? "text-blue-600" :
                                        listing.status?.toLowerCase() === "rejected" ? "text-purple-600" : "text-gray-600";
                    content = <span className={`font-semibold ${statusClass}`}>{statusText}</span>;
                    title = statusText;
                    break;
                  case "actions":
                    if (!showActionsColumn) return null;
                    const stopPropagation = (e) => e.stopPropagation();
                    
                    const status = listing.status?.toLowerCase();
                    if (status === "pending") {
                      content = (
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { stopPropagation(e); handleApproveListing(listing.property_id); }} className="text-green-600 hover:text-green-800 p-1" title="Approve"><CheckCircleIcon className="h-6 w-6" /></button>
                          <button onClick={(e) => { stopPropagation(e); handleRejectListing(listing.property_id); }} className="text-red-600 hover:text-red-800 p-1" title="Reject"><XCircleIcon className="h-6 w-6" /></button>
                        </div>
                      );
                    } else if (status === "rejected") {
                      content = (
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { stopPropagation(e); handleApproveListing(listing.property_id); }} className="text-green-600 hover:text-green-800 p-1" title="Approve"><CheckCircleIcon className="h-6 w-6" /></button>
                          <button onClick={(e) => { stopPropagation(e); handleDeleteListing(listing.property_id); }} className="text-red-600 hover:text-red-800 p-1" title="Delete"><TrashIcon className="h-6 w-6" /></button>
                        </div>
                      );
                    } else if (status === "under offer") {
                      content = (
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { stopPropagation(e); handleMarkAsSold(listing.property_id); }} className="text-green-600 hover:text-green-800 p-1" title="Mark Sold"><CurrencyDollarIcon className="h-6 w-6" /></button>
                          <button onClick={(e) => { stopPropagation(e); handleMarkAsFailed(listing.property_id); }} className="text-gray-600 hover:text-gray-800 p-1" title="Mark Failed"><ArrowUturnLeftIcon className="h-6 w-6" /></button>
                        </div>
                      );
                    } else {
                      content = (
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { stopPropagation(e); navigate(`${getRoleBasePath()}/edit-listing/${listing.property_id}`); }} className="text-green-600 hover:text-green-800 p-1" title="Edit"><PencilIcon className="h-5 w-5" /></button>
                          <button onClick={(e) => { stopPropagation(e); handleDeleteListing(listing.property_id); }} className="text-red-600 hover:text-red-800 p-1" title="Delete"><TrashIcon className="h-6 w-6" /></button>
                        </div>
                      );
                    }
                    break;
                  default:
                    content = listing[key] || "N/A";
                }
                
                return (
                  <td key={key} className="py-2 px-2 truncate" style={{ maxWidth: width }} title={title}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListingsTable;
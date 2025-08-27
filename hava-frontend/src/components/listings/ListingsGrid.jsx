// src/components/listings/ListingsGrid.jsx
import { motion } from "framer-motion";
import ListingCard from "../ListingCard"; // Assuming this path is correct

const ListingsGrid = ({
  listings,
  userFavourites,
  handleFavoriteToggle,
  userRole,
  userId,
  userAgencyId,
  getRoleBasePath,
  handleDeleteListing,
  showActions,
}) => {
  return (
    <motion.div
      layout
      className="grid grid-cols-2 gap-2 md:gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {listings.map((listing) => (
        <div key={listing.property_id}>
          <ListingCard
            listing={listing}
            isFavorited={userFavourites.includes(listing.property_id)}
            onFavoriteToggle={handleFavoriteToggle}
            userRole={userRole}
            userId={userId}
            userAgencyId={userAgencyId}
            getRoleBasePath={getRoleBasePath}
            onDeleteListing={handleDeleteListing}
            showActions={showActions}
          />
        </div>
      ))}
    </motion.div>
  );
};

export default ListingsGrid;
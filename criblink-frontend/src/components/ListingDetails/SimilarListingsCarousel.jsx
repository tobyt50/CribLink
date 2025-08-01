import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ListingCard from '../ListingCard'; // Assuming ListingCard is in the same directory or adjust path
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';

const SimilarListingsCarousel = ({
  similarListings,
  darkMode,
  similarListingStartIndex,
  currentListingsPerPage,
  handlePrevSimilar,
  handleNextSimilar,
  handleTouchStartSimilar,
  handleTouchMoveSimilar,
  handleTouchEndSimilar,
  similarCarouselRef
}) => {
  const displayedSimilarListings = similarListings.slice(
    similarListingStartIndex,
    similarListingStartIndex + currentListingsPerPage
  );

  return (
    <motion.div
      className={`max-w-7xl mx-auto mt-12 space-y-6 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      ref={similarCarouselRef}
      onTouchStart={handleTouchStartSimilar}
      onTouchMove={handleTouchMoveSimilar}
      onTouchEnd={handleTouchEndSimilar}
    >
      <h2 className={`text-xl md:text-2xl font-bold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Similar Listings You Might Like</h2>
      <div className="flex flex-col items-center w-full">
        <div className="relative w-full overflow-hidden min-h-[650px] md:min-h-[350px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`similar-page-${similarListingStartIndex}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="grid grid-cols-2 md:grid-cols-5 gap-6 w-full absolute inset-0"
            >
              {displayedSimilarListings.map((similarListing) => (
                <div key={similarListing.property_id} className="w-full">
                  <ListingCard key={similarListing.property_id} listing={similarListing} darkMode={darkMode} />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center mt-4 space-x-4">
          <button
            onClick={handlePrevSimilar}
            disabled={similarListingStartIndex === 0}
            className={`p-2 rounded-full shadow-md transition-all duration-200
              ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
              ${similarListingStartIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowLeftCircleIcon className="h-8 w-8" />
          </button>

          <button
            onClick={handleNextSimilar}
            disabled={similarListingStartIndex >= similarListings.length - currentListingsPerPage}
            className={`p-2 rounded-full shadow-md transition-all duration-200
              ${darkMode ? "bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-opacity-100 hover:bg-gray-600" : "bg-white bg-opacity-70 text-gray-700 hover:bg-opacity-100 hover:bg-gray-100"}
              ${similarListingStartIndex >= similarListings.length - currentListingsPerPage ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowRightCircleIcon className="h-8 w-8" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SimilarListingsCarousel;

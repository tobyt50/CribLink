import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ListingCard from '../ListingCard'; // Assuming ListingCard is in the same directory or adjust path
// Removed ArrowLeftCircleIcon, ArrowRightCircleIcon as navigation buttons are removed

const SimilarListingsCarousel = ({
  similarListings,
  darkMode,
}) => {
  // Ref for the carousel container to control scrolling
  const similarCarouselRef = useRef(null);
  // Ref to hold the interval ID for auto-swiping
  const autoSwipeSimilarIntervalRef = useRef(null);
  // Ref to ensure initial scroll happens only once
  const initialScrollSet = useRef(false);

  // Define how many similar items are visible at once on different screen sizes
  // This is now handled by Tailwind classes on the individual ListingCard wrappers.
  // The logic for partial view on mobile is applied directly in JSX.

  // Function to scroll the similar listings carousel with continuous loop
  const scrollSimilar = useCallback((direction) => {
    if (similarCarouselRef.current && similarListings.length > 0) {
      const carousel = similarCarouselRef.current;
      const currentScrollLeft = carousel.scrollLeft;

      // Get the first item to calculate its width including margins
      const itemElement = carousel.querySelector('.similar-card-item');
      if (!itemElement) return;

      const itemStyle = window.getComputedStyle(itemElement);
      const itemMarginLeft = parseFloat(itemStyle.marginLeft);
      const itemMarginRight = parseFloat(itemStyle.marginRight);
      const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;

      const numOriginalItems = similarListings.length;
      // Calculate the total width of one set of original items
      const totalOriginalListWidth = numOriginalItems * itemWidthWithMargins;

      let newScrollTarget = currentScrollLeft;

      if (direction === 'next') {
        newScrollTarget += itemWidthWithMargins;
        // If we've scrolled past the end of the second set (into the third set)
        if (newScrollTarget >= 2 * totalOriginalListWidth) {
          // Instantly snap back to the equivalent position in the second set
          carousel.scrollLeft = currentScrollLeft - totalOriginalListWidth;
          newScrollTarget = carousel.scrollLeft + itemWidthWithMargins; // Adjust target based on new snapped position
        }
      } else { // 'prev'
        newScrollTarget -= itemWidthWithMargins;
        // If we've scrolled before the beginning of the second set (into the first set)
        if (newScrollTarget < totalOriginalListWidth) {
          // Instantly snap forward to the equivalent position in the second set
          carousel.scrollLeft = currentScrollLeft + totalOriginalListWidth;
          newScrollTarget = carousel.scrollLeft - itemWidthWithMargins; // Adjust target based on new snapped position
        }
      }

      carousel.scrollTo({
        left: newScrollTarget,
        behavior: 'smooth',
      });
    }
  }, [similarListings.length]); // Dependency added: similarListings.length

  // Effect to set initial scroll position to the middle set of duplicated items
  useEffect(() => {
    if (similarCarouselRef.current && similarListings.length > 0 && !initialScrollSet.current) {
      const carousel = similarCarouselRef.current;
      const itemElement = carousel.querySelector('.similar-card-item');
      if (itemElement) {
        const itemStyle = window.getComputedStyle(itemElement);
        const itemMarginLeft = parseFloat(itemStyle.marginLeft);
        const itemMarginRight = parseFloat(itemStyle.marginRight);
        const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;

        const numOriginalItems = similarListings.length;
        const totalOriginalListWidth = numOriginalItems * itemWidthWithMargins;

        // Scroll to the beginning of the second set of items
        carousel.scrollLeft = totalOriginalListWidth;
        initialScrollSet.current = true; // Mark as set
      }
    }
  }, [similarListings.length]); // Re-run if the number of similar listings changes

  // Effect for auto-swiping similar listings
  useEffect(() => {
    // Clear any existing interval to prevent multiple intervals running
    if (autoSwipeSimilarIntervalRef.current) {
      clearInterval(autoSwipeSimilarIntervalRef.current);
    }

    // Only enable auto-swipe if there are items to scroll
    if (similarListings.length > 0) {
      autoSwipeSimilarIntervalRef.current = setInterval(() => {
        scrollSimilar('next');
      }, 3000); // Auto-swipe every 3 seconds for a faster animation
    }

    // Cleanup function: clear interval when component unmounts or dependencies change
    return () => {
      if (autoSwipeSimilarIntervalRef.current) {
        clearInterval(autoSwipeSimilarIntervalRef.current);
      }
    };
  }, [similarListings.length, scrollSimilar]); // Dependencies for useEffect

  // Touch handlers to stop/restart auto-swipe on manual interaction
  const handleTouchStartSimilar = useCallback(() => {
    if (autoSwipeSimilarIntervalRef.current) {
      clearInterval(autoSwipeSimilarIntervalRef.current);
    }
  }, []);

  const handleTouchEndSimilar = useCallback(() => {
    // Restart auto-swipe after a short delay if no further interaction
    // This will be handled by the useEffect for auto-swipe when dependencies change or component mounts
    // For now, simply let the useEffect re-evaluate and set the interval if needed.
  }, []);


  return (
    <motion.div
      // Apply dark mode background and shadow classes
      className={`max-w-7xl mx-auto mt-12 space-y-6 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      // Attach touch handlers to the main motion.div for the entire carousel area
      onTouchStart={handleTouchStartSimilar}
      onTouchEnd={handleTouchEndSimilar}
    >
      <h2 className={`text-xl md:text-2xl font-bold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Similar Listings You Might Like</h2>
      <div className="relative">
        {/* CSS to hide scrollbar */}
        <style>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          .no-scrollbar::-webkit-scrollbar {
              display: none;
          }
          /* Hide scrollbar for IE, Edge and Firefox */
          .no-scrollbar {
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
          }
        `}</style>
        <div
          ref={similarCarouselRef}
          // Apply mobile-specific padding, then reset for larger screens
          className="flex overflow-x-scroll snap-x snap-mandatory pb-4 -mb-4 no-scrollbar pl-[25vw] pr-[25vw] md:pl-0 md:pr-0"
        >
          {/* Duplicate listings three times to create a continuous loop effect */}
          {[...similarListings, ...similarListings, ...similarListings].map((similarListing, index) => (
            <div
              key={`similar-${similarListing.property_id}-${index}`} // Unique key for duplicated items
              // Mobile: w-[50vw] px-2 for partial view and consistent sizing
              // Desktop (md and lg): w-1/2 and w-1/4 for previous layout
              className="flex-shrink-0 snap-center w-[50vw] px-2 md:w-1/2 lg:w-1/4 similar-card-item"
            >
              <ListingCard listing={similarListing} darkMode={darkMode} />
            </div>
          ))}
        </div>
        {/* Navigation buttons are removed as per the Home.js featured section */}
      </div>
    </motion.div>
  );
};

export default SimilarListingsCarousel;

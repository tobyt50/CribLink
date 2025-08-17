import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ListingCard from '../ListingCard'; // Corrected path assuming it's in the same components folder
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from '../../layouts/AppShell';

const SimilarListingsCarousel = ({
  similarListings,
  userFavourites = [], // CORRECTED: Expect an array of favorite IDs, default to empty array
  onFavoriteToggle,
  userRole,
  userId,
  userAgencyId,
  getRoleBasePath,
  onDeleteListing,
}) => {
  const { darkMode } = useTheme();
  const similarCarouselRef = useRef(null);
  const autoSwipeSimilarIntervalRef = useRef(null);
  const initialScrollSet = useRef(false);

  const isCarousel = similarListings.length > 1;

  const animateScroll = (element, to, duration = 800, onComplete) => {
    const start = element.scrollLeft;
    const change = to - start;
    const startTime = performance.now();
    const spring = (t) => 1 - Math.cos(t * 4.5 * Math.PI) * Math.exp(-t * 6);
    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      element.scrollLeft = start + change * spring(progress);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    requestAnimationFrame(animate);
  };

  const scrollSimilar = useCallback((direction) => {
      if (!isCarousel || !similarCarouselRef.current) return;
      const carousel = similarCarouselRef.current;
      const itemElement = carousel.querySelector(".similar-card-item");
      if (!itemElement) return;

      const itemStyle = window.getComputedStyle(itemElement);
      const itemMarginLeft = parseFloat(itemStyle.marginLeft);
      const itemMarginRight = parseFloat(itemStyle.marginRight);
      const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;
      const numOriginalItems = similarListings.length;
      const totalOriginalListWidth = numOriginalItems * itemWidthWithMargins;

      let newScrollTarget = carousel.scrollLeft + (direction === "next" ? itemWidthWithMargins : -itemWidthWithMargins);

      animateScroll(carousel, newScrollTarget, 800, () => {
        if (carousel.scrollLeft >= 2 * totalOriginalListWidth) {
          carousel.scrollLeft -= totalOriginalListWidth;
        } else if (carousel.scrollLeft < totalOriginalListWidth) {
          carousel.scrollLeft += totalOriginalListWidth;
        }
      });
    },
    [similarListings.length, isCarousel]
  );

  useEffect(() => {
    const handleResize = () => {
      if (!similarCarouselRef.current || !isCarousel) return;
      const carousel = similarCarouselRef.current;
      const itemElement = carousel.querySelector(".similar-card-item");
      if (!itemElement) return;
      const itemStyle = window.getComputedStyle(itemElement);
      const itemMarginLeft = parseFloat(itemStyle.marginLeft);
      const itemMarginRight = parseFloat(itemStyle.marginRight);
      const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;
      const numOriginalItems = similarListings.length;
      carousel.scrollLeft = numOriginalItems * itemWidthWithMargins;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [similarListings.length, isCarousel]);

  useEffect(() => {
    if (isCarousel && similarCarouselRef.current && !initialScrollSet.current) {
      const carousel = similarCarouselRef.current;
      const itemElement = carousel.querySelector('.similar-card-item');
      if (itemElement) {
        const itemStyle = window.getComputedStyle(itemElement);
        const itemMarginLeft = parseFloat(itemStyle.marginLeft);
        const itemMarginRight = parseFloat(itemStyle.marginRight);
        const itemWidthWithMargins = itemElement.offsetWidth + itemMarginLeft + itemMarginRight;
        const numOriginalItems = similarListings.length;
        carousel.scrollLeft = numOriginalItems * itemWidthWithMargins;
        initialScrollSet.current = true;
      }
    }
  }, [similarListings.length, isCarousel]);

  useEffect(() => {
    if (autoSwipeSimilarIntervalRef.current) clearInterval(autoSwipeSimilarIntervalRef.current);
    if (isCarousel) {
      autoSwipeSimilarIntervalRef.current = setInterval(() => {
        scrollSimilar('next');
      }, 2500);
    }
    return () => {
      if (autoSwipeSimilarIntervalRef.current) clearInterval(autoSwipeSimilarIntervalRef.current);
    };
  }, [isCarousel, scrollSimilar]);

  const handleTouchStart = useCallback(() => {
    if (autoSwipeSimilarIntervalRef.current) clearInterval(autoSwipeSimilarIntervalRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isCarousel) {
      autoSwipeSimilarIntervalRef.current = setInterval(() => scrollSimilar('next'), 2500);
    }
  }, [isCarousel, scrollSimilar]);

  if (!similarListings || similarListings.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`max-w-7xl mx-auto mt-12 space-y-6 p-0 lg:rounded-2xl lg:shadow-xl lg:p-6 ${darkMode ? "lg:bg-gray-800" : "lg:bg-white"}`}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      onTouchStart={isCarousel ? handleTouchStart : undefined}
      onTouchEnd={isCarousel ? handleTouchEnd : undefined}
    >
      <h2 className={`text-xl md:text-2xl font-bold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>
        Similar Listings You Might Like
      </h2>
      <div className="relative">
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        
        <div
          ref={similarCarouselRef}
          className={`flex pb-4 -mb-4 ${isCarousel ? 'overflow-x-scroll no-scrollbar' : 'justify-center'}`}
        >
          {(isCarousel ? [...similarListings, ...similarListings, ...similarListings] : similarListings).map((similarListing, index) => (
            <div
              key={`similar-${similarListing.property_id}-${index}`}
              className={`flex-shrink-0 ${isCarousel ? 'snap-start w-[45%] px-2 md:w-1/3 lg:w-1/5 similar-card-item' : 'w-full max-w-sm px-2'}`}
            >
              <ListingCard
                listing={similarListing}
                // CORRECTED: Perform the check here using the passed array
                isFavorited={userFavourites.includes(similarListing.property_id)}
                onFavoriteToggle={onFavoriteToggle}
                userRole={userRole}
                userId={userId}
                userAgencyId={userAgencyId}
                getRoleBasePath={getRoleBasePath}
                onDeleteListing={onDeleteListing}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SimilarListingsCarousel;
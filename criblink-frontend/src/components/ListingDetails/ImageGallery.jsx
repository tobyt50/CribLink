import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
} from '@heroicons/react/24/outline';

const ImageGallery = ({
  images,
  mainIndex,
  direction,
  paginateImage,
  handleThumbClick,
  handleImageClick,
  showPreview,
  closePreview,
  previewRef,
  darkMode
}) => {
  return (
    <>
      
      <div className={`relative w-full h-80 md:h-96 rounded-xl overflow-hidden mb-4 shadow-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={mainIndex}
            src={images[mainIndex]}
            alt={`Main ${mainIndex}`}
            className="absolute w-full h-full object-cover cursor-pointer select-none"
            onClick={handleImageClick}
            custom={direction}
            initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 300 : -300, opacity: 0 }}
            transition={{ duration: 0.4 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.x < -50) paginateImage(1);
              else if (info.offset.x > 50) paginateImage(-1);
            }}
            style={{ touchAction: "pan-y" }}
            draggable={false}
          />
        </AnimatePresence>
        {images.length > 1 && (
          <>
            <button
              onClick={() => paginateImage(-1)}
              className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <span className="sr-only">Previous image</span>←
            </button>
            <button
              onClick={() => paginateImage(1)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <span className="sr-only">Next image</span>→
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {images.slice(0, 6).map((img, i) => (
          <motion.img
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.2 }}
            key={i}
            src={img}
            alt={`Thumb ${i}`}
            className={`h-16 w-full object-cover rounded-md cursor-pointer border-2 transition-all duration-200 ${i === mainIndex ? 'border-green-600 ring-2 ring-green-400' : 'border-transparent'
              }`}
            onClick={() => handleThumbClick(i)}
          />
        ))}
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            onClick={closePreview}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          >
            <div
              ref={previewRef}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-full flex items-center justify-center"
            >
              <img
                src={images[mainIndex]}
                alt="Enlarged preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => paginateImage(-1)}
                    className="absolute left-0 top-0 bottom-0 flex items-center w-12 text-white text-5xl bg-transparent hover:bg-black hover:bg-opacity-30 transition-all duration-200 rounded-lg"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => paginateImage(1)}
                    className="absolute right-0 top-0 bottom-0 flex items-center w-12 text-white text-5xl bg-transparent hover:bg-black hover:bg-opacity-30 transition-all duration-200 rounded-lg"
                  >
                    →
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;

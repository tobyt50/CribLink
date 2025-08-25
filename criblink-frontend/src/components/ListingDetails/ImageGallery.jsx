import { AnimatePresence, motion } from "framer-motion";

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
  darkMode,
}) => {
  return (
    <>
      <div
        className={`relative w-full h-80 md:h-96 rounded-xl overflow-hidden mb-4 shadow-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
      >
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
            {/* Left arrow */}
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white opacity-70 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                paginateImage(-1);
              }}
            >
              <span className="text-8xl leading-none select-none">‹</span>
            </button>

            {/* Right arrow */}
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white opacity-70 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                paginateImage(1);
              }}
            >
              <span className="text-8xl leading-none select-none">›</span>
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
            className={`h-16 w-full object-cover rounded-md cursor-pointer border-2 transition-all duration-200 ${
              i === mainIndex
                ? "border-green-600 ring-2 ring-green-400"
                : "border-transparent"
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
                  {/* Left arrow */}
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white opacity-40 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      paginateImage(-1);
                    }}
                  >
                    <span className="text-[8rem] leading-none select-none">
                      ‹
                    </span>
                  </button>

                  {/* Right arrow */}
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white opacity-40 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      paginateImage(1);
                    }}
                  >
                    <span className="text-[8rem] leading-none select-none">
                      ›
                    </span>
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
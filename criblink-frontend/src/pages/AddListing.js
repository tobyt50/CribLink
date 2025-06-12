// src/pages/AddListing.js
import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance'; // Use axiosInstance
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import API_BASE_URL from '../config'; // Assuming API_BASE_URL is defined here
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook
import { ChevronDown } from 'lucide-react'; // Import ChevronDown icon for the dropdown
import { useMessage } from '../context/MessageContext'; // Import useMessage hook
// Removed: import { useApiErrorHandler } from '../utils/handleApiError'; // No longer needed

// Reusable Dropdown Component (embedded directly here for self-containment)
const Dropdown = ({ options, value, onChange, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme(); // Use the dark mode context within the dropdown

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        delayChildren: 0.05,
        staggerChildren: 0.02,
      },
    },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: "easeOut" } },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const selectedOptionLabel = options.find(option => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        // Unified styling for the dropdown button to match input fields
        className={`flex items-center justify-between w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
          ${darkMode
            ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400"
            : "bg-white border-gray-300 text-gray-700 hover:border-green-500 focus:ring-green-600"
          }`}
      >
        <span>{selectedOptionLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-gray-500"}`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            // Added max-h-60 for confined height and overflow-y-auto for scrollability
            className={`absolute left-0 right-0 mt-2 border rounded-xl shadow-xl py-1 z-50 transform origin-top max-h-60 overflow-y-auto
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                variants={itemVariants}
                whileHover={{ x: 5 }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-200
                  ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-green-50 hover:text-green-700"}`}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const AddListing = () => { // Renamed from App to AddListing for clarity
  const navigate = useNavigate(); // Initialize useNavigate
  const [purchaseCategory, setPurchaseCategory] = useState('Rent');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [stateValue, setStateValue] = useState(''); // State to hold the selected state
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]); // Files from dropzone
  const [imageURLs, setImageURLs] = useState([]); // URLs added via input
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [thumbnailIndex, setThumbnailIndex] = useState(null);

  // New state variables for property_details - these will be optional
  const [description, setDescription] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [heatingType, setHeatingType] = useState('');
  const [coolingType, setCoolingType] = useState('');
  const [parking, setParking] = useState('');
  const [amenities, setAmenities] = useState('');

  const { darkMode } = useTheme(); // Use the dark mode context
  const { showMessage } = useMessage(); // Initialize useMessage
  // Removed: const handleApiError = useApiErrorHandler(); // No longer needed

  // Combine all images for easier handling
  const allImages = [...images, ...imageURLs];

  // Array of Nigerian States including Abuja
  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
    "Abuja" // Added Abuja here
  ].sort(); // Sort alphabetically

  // Options for Dropdowns
  const purchaseCategoryOptions = [
    { value: "Rent", label: "Rent" },
    { value: "Sale", label: "Sale" },
    { value: "Lease", label: "Lease" },
    { value: "Short Let", label: "Short Let" },
    { value: "Long Let", label: "Long Let" }
  ];

  const stateOptions = [{ value: "", label: "Select State" }, ...nigerianStates.map(state => ({ value: state, label: state }))];

  const propertyTypeOptions = [
    { value: "", label: "Select Property Type" },
    { value: "Duplex", label: "Duplex" },
    { value: "Bungalow", label: "Bungalow" },
    { value: "Apartment", label: "Apartment" },
    { value: "Penthouse", label: "Penthouse" },
    { value: "Detached House", label: "Detached House" },
    { value: "Semi-Detached House", label: "Semi-Detached House" },
    { value: "Condo", label: "Condo" },
  ];

  const bedroomOptions = [
    { value: "", label: "Any Bedrooms" },
    ...[1, 2, 3, 4, 5].map((num) => ({ value: String(num), label: `${num} Bedroom(s)` })),
  ];

  const bathroomOptions = [
    { value: "", label: "Any Bathrooms" },
    ...[1, 2, 3, 4, 5].map((num) => ({ value: String(num), label: `${num} Bathroom(s)` })),
  ];


  const onDrop = (acceptedFiles) => {
    setImages(prev => [...prev, ...acceptedFiles]);
    // If no thumbnail is set, set the first newly added image as thumbnail
    if (thumbnailIndex === null && allImages.length === 0 && acceptedFiles.length > 0) {
      setThumbnailIndex(0); // Index in the combined array
    }
  };

  // Updated accept syntax for useDropzone
  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImageURLs(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
      // If no thumbnail is set, set the first newly added URL as thumbnail
      if (thumbnailIndex === null && allImages.length === 0 && imageURLs.length === 0) {
        setThumbnailIndex(images.length); // Index in the combined array
      }
    } else {
      showMessage('Please enter a valid image URL.', 'error');
    }
  };

  const handleRemoveImage = (indexToRemove, type) => {
    let newImagesArray = [...images];
    let newImageURLsArray = [...imageURLs];
    let currentThumbnailIndex = thumbnailIndex;

    if (type === 'file') {
      newImagesArray.splice(indexToRemove, 1);
      setImages(newImagesArray);
      // If the removed image was the thumbnail and it was a file
      if (currentThumbnailIndex !== null && currentThumbnailIndex < images.length && currentThumbnailIndex === indexToRemove) {
        setThumbnailIndex(null); // Clear thumbnail
      } else if (currentThumbnailIndex !== null && currentThumbnailIndex >= images.length) {
        // If the removed image was a file and the thumbnail was a URL after it
        // The URL's index in the combined array shifts left by 1
        setThumbnailIndex(currentThumbnailIndex - 1);
      }
    } else { // type === 'url'
      newImageURLsArray.splice(indexToRemove, 1);
      setImageURLs(newImageURLsArray);
      // If the removed image was the thumbnail and it was a URL
      if (currentThumbnailIndex !== null && currentThumbnailIndex >= images.length && (currentThumbnailIndex - images.length) === indexToRemove) {
        setThumbnailIndex(null); // Clear thumbnail
      }
    }

    // After removing, if no thumbnail is set and there are still images, set the first one as thumbnail
    const remainingImages = [...newImagesArray, ...newImageURLsArray];
    if (thumbnailIndex === null && remainingImages.length > 0) {
      setThumbnailIndex(0);
    } else if (thumbnailIndex !== null && remainingImages.length === 0) {
      setThumbnailIndex(null); // No images left, clear thumbnail
    }
  };


  const moveImage = (fromIndex, toIndex) => {
    const allImagesCombined = [...images, ...imageURLs];
    // Ensure indices are within bounds
    if (fromIndex < 0 || fromIndex >= allImagesCombined.length || toIndex < 0 || toIndex >= allImagesCombined.length) {
      return;
    }

    const movingImage = allImagesCombined.splice(fromIndex, 1)[0];
    allImagesCombined.splice(toIndex, 0, movingImage);

    // Separate back into files and URLs
    const newFiles = allImagesCombined.filter(item => item instanceof File);
    const newURLs = allImagesCombined.filter(item => typeof item === 'string');

    setImages(newFiles);
    setImageURLs(newURLs);

    // Update thumbnail index if the thumbnail was moved
    if (thumbnailIndex === fromIndex) {
      setThumbnailIndex(toIndex);
    } else if (thumbnailIndex !== null) {
      // If the thumbnail was not the image being moved, its index might still change
      // if the moved image passed its position.
      // This requires more complex logic to track the thumbnail identity,
      // not just its index. For simplicity, we'll re-find the thumbnail
      // in the new combined array if the thumbnail was not the one moved.
      const currentThumbnail = allImages[thumbnailIndex]; // Get the actual thumbnail item before move
      const newThumbnailIndex = allImagesCombined.findIndex(item => item === currentThumbnail);
      setThumbnailIndex(newThumbnailIndex !== -1 ? newThumbnailIndex : null);
    }
  };

  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleClose = () => {
    navigate(-1); // Go back to the previous page
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Combine all images for final check and sending
    const allImagesCombined = [...images, ...imageURLs];

    // Validate required fields
    if (!purchaseCategory || !title || !location || !stateValue || !propertyType || !bedrooms || !bathrooms || !price) {
      showMessage('Please fill in all required fields (Purchase Category, Title, Location, State, Property Type, Bedrooms, Bathrooms, Price).', 'error');
      return;
    }

    // Validate at least two images are uploaded
    if (allImagesCombined.length < 2) {
      showMessage('Please upload at least two images for your listing.', 'error');
      return;
    }

    // Ensure a thumbnail is selected
    if (thumbnailIndex === null || thumbnailIndex >= allImagesCombined.length) {
      showMessage('Please set a thumbnail image for your listing.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('purchase_category', purchaseCategory);
    formData.append('title', title);
    formData.append('location', location);
    formData.append('state', stateValue); // Use stateValue from the dropdown
    formData.append('property_type', propertyType);
    formData.append('bedrooms', bedrooms);
    formData.append('bathrooms', bathrooms);
    formData.append('price', price);
    formData.append('status', 'Pending'); // Assuming new listings are pending approval

    // Append property_details to formData (these are now optional)
    if (description) formData.append('description', description);
    if (squareFootage) formData.append('square_footage', squareFootage);
    if (lotSize) formData.append('lot_size', lotSize);
    if (yearBuilt) formData.append('year_built', yearBuilt);
    if (heatingType) formData.append('heating_type', heatingType);
    if (coolingType) formData.append('cooling_type', coolingType);
    if (parking) formData.append('parking', parking);
    if (amenities) formData.append('amenities', amenities);


    const thumbnail = allImagesCombined[thumbnailIndex];


    // Set the main image (thumbnail)
    if (thumbnail instanceof File) {
      formData.append('mainImage', thumbnail); // Append the file if it's a new upload
    } else {
      formData.append('mainImageURL', thumbnail); // Send the URL if it's an existing or new URL
    }

    // Set gallery images (skip the thumbnail)
    allImagesCombined.forEach((img, index) => {
      if (index === thumbnailIndex) return; // Skip the thumbnail
      if (img instanceof File) {
        formData.append('galleryImages', img); // Append files
      } else {
        formData.append('galleryImageURLs', img); // Send URLs
      }
    });

    // Retrieve the JWT token from local storage (or wherever you store it after login)
    const token = localStorage.getItem('token'); // Assuming you store the token in localStorage

    if (!token) {
      showMessage('Authentication token not found. Please sign in to add a listing.', 'error');
      navigate('/signin'); // Optionally navigate to login page
      return;
    }

    try {
      await axiosInstance.post(`${API_BASE_URL}/listings`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
          'Authorization': `Bearer ${token}` // Include the JWT token
        }
      });

      showMessage('Listing added successfully!', 'success', 3000); // Show success message
      // Reset form fields after successful submission
      setPurchaseCategory('Rent');
      setTitle('');
      setLocation('');
      setStateValue(''); // Reset state dropdown
      setPropertyType('');
      setBedrooms('');
      setBathrooms('');
      setPrice('');
      setImages([]);
      setImageURLs([]);
      setThumbnailIndex(null);
      // Reset property_details fields
      setDescription('');
      setSquareFootage('');
      setLotSize('');
      setYearBuilt('');
      setHeatingType('');
      setCoolingType('');
      setParking('');
      setAmenities('');
      // Optionally navigate to the listings page
      navigate('/admin/listings');
    } catch (error) {
      let errorMessage = 'Failed to add listing. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      showMessage(errorMessage, 'error');
    }
  };


  // Unified styling for input fields to match SearchFilters.js
  const formElementStyles = `py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
    ${darkMode
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;


  return (
    // Add overflow-x-hidden to prevent horizontal scrollbars
    <div className={`flex items-center justify-center min-h-screen p-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"} overflow-x-hidden`}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`rounded-2xl shadow-2xl w-full max-w-2xl p-8 space-y-6 relative ${darkMode ? "bg-gray-800" : "bg-white"}`} // Added relative for positioning close button
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        <motion.h2
          className={`text-2xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          Add Listing
        </motion.h2>

        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Purchase Category</label>
            <Dropdown
              placeholder="Select Purchase Category"
              options={purchaseCategoryOptions}
              value={purchaseCategory}
              onChange={setPurchaseCategory}
              className="w-full"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Title</label>
            <input
              type="text"
              value={title}
              // Modified onChange handler to capitalize the first letter
              onChange={(e) => setTitle(capitalizeFirstLetter(e.target.value))}
              className={`block w-full ${formElementStyles}`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Location</label>
            <input
              type="text"
              value={location}
              // Modified onChange handler to capitalize the first letter
              onChange={(e) => setLocation(capitalizeFirstLetter(e.target.value))}
              className={`block w-full ${formElementStyles}`}
              required
            />
          </div>

          {/* State Dropdown */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>State</label>
            <Dropdown
              placeholder="Select State"
              options={stateOptions}
              value={stateValue}
              onChange={setStateValue}
              className="w-full"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Property Type</label>
            <Dropdown
              placeholder="Select Property Type"
              options={propertyTypeOptions}
              value={propertyType}
              onChange={setPropertyType}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Bedrooms</label>
              <Dropdown
                placeholder="Any Bedrooms"
                options={bedroomOptions}
                value={bedrooms}
                onChange={setBedrooms}
                className="w-full"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Bathrooms</label>
              <Dropdown
                placeholder="Any Bathrooms"
                options={bathroomOptions}
                value={bathrooms}
                onChange={setBathrooms}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
              {purchaseCategory === 'Rent' ? 'Price (₦ / Year)' :
                purchaseCategory === 'Sale' ? 'Price (₦)' :
                  purchaseCategory === 'Lease' ? 'Price (₦ / Lease)' :
                    purchaseCategory === 'Short Let' ? 'Price (₦ / Night)' :
                      'Price (₦ / Month)'}
            </label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={`block w-full ${formElementStyles}`} required />
          </div>

          {/* New fields for property_details (now optional) */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`block w-full ${formElementStyles}`}
              rows="4"
              placeholder="Detailed description of the property..."
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Square Footage (Optional)</label>
              <input
                type="number"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
                className={`block w-full ${formElementStyles}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Lot Size (sqft or acres) (Optional)</label>
              <input
                type="number"
                step="0.01"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className={`block w-full ${formElementStyles}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Year Built (Optional)</label>
            <input
              type="number"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
              className={`block w-full ${formElementStyles}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Heating Type (Optional)</label>
              <input
                type="text"
                value={heatingType}
                onChange={(e) => setHeatingType(e.target.value)}
                className={`block w-full ${formElementStyles}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Cooling Type (Optional)</label>
              <input
                type="text"
                value={coolingType}
                onChange={(e) => setCoolingType(e.target.value)}
                className={`block w-full ${formElementStyles}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Parking (Optional)</label>
            <input
              type="text"
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              className={`block w-full ${formElementStyles}`}
              placeholder="e.g., Garage, Street, Driveway"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Amenities (comma-separated) (Optional)</label>
            <textarea
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              className={`block w-full ${formElementStyles}`}
              rows="3"
              placeholder="e.g., Pool, Gym, Balcony, Garden"
            ></textarea>
          </div>

          <div {...getRootProps()} className={`p-6 border-dashed border-2 rounded-2xl cursor-pointer text-center transition-all duration-200 ${
            darkMode
              ? "border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500 focus:ring-green-400"
              : "border-gray-300 bg-gray-50 text-gray-600 hover:border-green-500 focus:ring-green-600"
          }`}>
            <input {...getInputProps()} />
            Drag & drop or click to select images
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Or Add Image URL</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className={`flex-grow block w-full ${formElementStyles}`}
                placeholder="https://example.com/image.jpg"
              />
              <button type="button" onClick={handleAddImageUrl} className="bg-green-600 text-white px-4 py-2 rounded-2xl hover:bg-green-700 text-sm transition-all duration-200">Add</button>
            </div>
          </div>

          {(allImages.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {allImages.map((item, index) => (
                <motion.div
                  key={item instanceof File ? item.name : item} // Use file name or URL as key
                  className={`border p-2 rounded-2xl relative transition-all duration-200 ${index === thumbnailIndex ? 'border-green-500 ring-2 ring-green-500' : ''} ${
                    darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                  }`} // Highlight thumbnail
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <img
                    src={item instanceof File ? URL.createObjectURL(item) : item}
                    alt={`Upload ${index}`}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(item instanceof File ? images.findIndex(f => f === item) : imageURLs.findIndex(url => url === item), item instanceof File ? 'file' : 'url')}
                    className="absolute top-1 right-1 text-red-600 bg-white rounded-full p-1 shadow transition-all duration-200" // Styled remove button, added transition
                  >✕</button>
                  <button
                    type="button"
                    onClick={() => setThumbnailIndex(index)}
                    className={`text-xs underline mt-1 block transition-all duration-200 ${darkMode ? "text-green-400" : "text-green-700"}`}
                  >{thumbnailIndex === index ? 'Thumbnail (Selected)' : 'Set as Thumbnail'}</button>
                  {/* Add move buttons if needed - requires more complex state management */}
                </motion.div>
              ))}
            </div>
          )}

          <button type="submit" className="w-full bg-green-700 text-white py-3 px-6 rounded-2xl hover:bg-green-800 text-sm transition-all duration-200">
            Submit Listing
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
};

export default AddListing; // Export as AddListing

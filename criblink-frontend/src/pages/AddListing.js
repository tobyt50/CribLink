// src/pages/AddListing.js
import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { useTheme } from '../layouts/AppShell';
import { ChevronDown } from 'lucide-react';
import { useMessage } from '../context/MessageContext';

const Dropdown = ({ options, value, onChange, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme();

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


const AddListing = () => {
  const navigate = useNavigate();
  const [purchaseCategory, setPurchaseCategory] = useState('Rent');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]); // Array of { file: File, base64: string, originalname: string } for new uploads
  const [imageURLs, setImageURLs] = useState([]); // URLs added via input
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [thumbnailIdentifier, setThumbnailIdentifier] = useState(null); // Can be a URL or the originalname of a new file

  const [description, setDescription] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [heatingType, setHeatingType] = useState('');
  const [coolingType, setCoolingType] = useState('');
  const [parking, setParking] = useState('');
  const [amenities, setAmenities] = useState('');

  // New states for land properties
  const [landSize, setLandSize] = useState('');
  const [zoningType, setZoningType] = useState('');
  const [titleType, setTitleType] = useState(''); // Made non-conditional

  const { darkMode } = useTheme();
  const { showMessage } = useMessage();

  // Determine if the current property type is 'Land'
  const isLandProperty = propertyType === 'Land';

  // Combine all images for easier handling and display
  const allImagesForDisplay = [
    ...images.map(img => ({ url: img.base64, identifier: img.originalname, type: 'file' })),
    ...imageURLs.map(url => ({ url: url, identifier: url, type: 'url' }))
  ];

  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
    "Abuja"
  ].sort();

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
    { value: "Land", label: "Land" }, // Added Land option
  ];

  const bedroomOptions = [
    { value: "", label: "Any Bedrooms" },
    ...[1, 2, 3, 4, 5].map((num) => ({ value: String(num), label: `${num} Bedroom(s)` })),
  ];

  const bathroomOptions = [
    { value: "", label: "Any Bathrooms" },
    ...[1, 2, 3, 4, 5].map((num) => ({ value: String(num), label: `${num} Bathroom(s)` })),
  ];

  const zoningTypeOptions = [
    { value: "", label: "Select Zoning Type" },
    { value: "Residential", label: "Residential" },
    { value: "Commercial", label: "Commercial" },
    { value: "Industrial", label: "Industrial" },
    { value: "Agricultural", label: "Agricultural" },
    { value: "Mixed-Use", label: "Mixed-Use" },
    { value: "Other", label: "Other" },
  ];

  const titleTypeOptions = [
    { value: "", label: "Select Title Type" },
    { value: "C of O", label: "Certificate of Occupancy (C of O)" },
    { value: "Gazette", label: "Gazette" },
    { value: "Deed of Assignment", label: "Deed of Assignment" },
    { value: "Governor's Consent", label: "Governor's Consent" },
    { value: "Survey Plan", label: "Survey Plan" },
    { value: "Excision", label: "Excision" },
    { value: "Other", label: "Other" },
  ];


  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImages(prev => [...prev, { file, base64: reader.result, originalname: file.name }]);
        // Set the first new file as thumbnail if no thumbnail is set yet
        if (thumbnailIdentifier === null && allImagesForDisplay.length === 0) {
          setThumbnailIdentifier(file.name);
        }
      };
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      const newUrl = imageUrlInput.trim();
      setImageURLs(prev => [...prev, newUrl]);
      setImageUrlInput('');
      // Set the first new URL as thumbnail if no thumbnail is set yet
      if (thumbnailIdentifier === null && allImagesForDisplay.length === 0) {
        setThumbnailIdentifier(newUrl);
      }
    } else {
      showMessage('Please enter a valid image URL.', 'error');
    }
  };

  const handleRemoveImage = (identifierToRemove, type) => {
    let newImagesArray = [...images];
    let newImageURLsArray = [...imageURLs];

    if (type === 'file') {
      newImagesArray = newImagesArray.filter(img => img.originalname !== identifierToRemove);
      setImages(newImagesArray);
    } else { // type === 'url'
      newImageURLsArray = newImageURLsArray.filter(url => url !== identifierToRemove);
      setImageURLs(newImageURLsArray);
    }

    // If the removed image was the thumbnail, clear the thumbnail
    if (thumbnailIdentifier === identifierToRemove) {
      setThumbnailIdentifier(null);
    }

    // Re-evaluate thumbnail if it was cleared and there are still images
    const remainingImages = [
      ...newImagesArray.map(img => ({ url: img.base64, identifier: img.originalname, type: 'file' })),
      ...newImageURLsArray.map(url => ({ url: url, identifier: url, type: 'url' }))
    ];

    if (thumbnailIdentifier === null && remainingImages.length > 0) {
      setThumbnailIdentifier(remainingImages[0].identifier);
    }
  };

  const setAsThumbnail = (identifier) => {
    setThumbnailIdentifier(identifier);
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for common fields
    if (!purchaseCategory || !title || !location || !stateValue || !propertyType || !price) {
      showMessage('Please fill in all required fields (Purchase Category, Title, Location, State, Property Type, Price).', 'error');
      return;
    }

    // Conditional validation for bedrooms/bathrooms
    if (!isLandProperty && (!bedrooms || !bathrooms)) {
      showMessage('Please fill in Bedrooms and Bathrooms for non-land properties.', 'error');
      return;
    }

    if (allImagesForDisplay.length < 2) {
      showMessage('Please upload at least two images for your listing.', 'error');
      return;
    }

    if (thumbnailIdentifier === null) {
      showMessage('Please set a thumbnail image for your listing.', 'error');
      return;
    }

    const payload = {
      purchase_category: purchaseCategory,
      title,
      location,
      state: stateValue,
      property_type: propertyType,
      price,
      status: 'Pending',
      description,
      mainImageBase64: null,
      mainImageOriginalName: null,
      galleryImagesBase64: [],
      galleryImagesOriginalNames: [],
      galleryImageURLs: [],
      title_type: titleType, // Always include title_type
    };

    // Conditionally add property-specific fields
    if (!isLandProperty) {
      payload.bedrooms = bedrooms;
      payload.bathrooms = bathrooms;
      payload.square_footage = squareFootage;
      payload.year_built = yearBuilt;
      payload.heating_type = heatingType;
      payload.cooling_type = coolingType;
      payload.parking = parking;
      payload.amenities = amenities;
      // lot_size can apply to both, so it's not conditional here
      payload.lot_size = lotSize;
    } else {
      // For land properties, include land-specific fields
      payload.land_size = landSize;
      payload.zoning_type = zoningType;
      // Ensure non-applicable fields are explicitly null or undefined for land
      payload.bedrooms = null;
      payload.bathrooms = null;
      payload.square_footage = null;
      payload.year_built = null;
      payload.heating_type = null;
      payload.cooling_type = null;
      payload.parking = null;
      payload.amenities = null;
      // lot_size is still relevant for land, so it's included
      payload.lot_size = lotSize;
    }


    // Separate main image from gallery images
    const thumbnailItem = allImagesForDisplay.find(item => item.identifier === thumbnailIdentifier);

    if (thumbnailItem) {
      if (thumbnailItem.type === 'file') {
        const fullImageObject = images.find(img => img.originalname === thumbnailItem.identifier);
        payload.mainImageBase64 = fullImageObject.base64;
        payload.mainImageOriginalName = fullImageObject.originalname;
      } else { // type === 'url'
        payload.mainImageURL = thumbnailItem.url;
      }
    }

    allImagesForDisplay.forEach(item => {
      if (item.identifier !== thumbnailIdentifier) { // Only add to gallery if not the thumbnail
        if (item.type === 'file') {
          const fullImageObject = images.find(img => img.originalname === item.identifier);
          payload.galleryImagesBase64.push(fullImageObject.base64);
          payload.galleryImagesOriginalNames.push(fullImageObject.originalname);
        } else { // type === 'url'
          payload.galleryImageURLs.push(item.url);
        }
      }
    });

    const token = localStorage.getItem('token');

    if (!token) {
      showMessage('Authentication token not found. Please sign in to add a listing.', 'error');
      navigate('/signin');
      return;
    }

    try {
      await axiosInstance.post(`${API_BASE_URL}/listings`, payload, {
        headers: {
          'Content-Type': 'application/json', // Sending JSON with base64
          'Authorization': `Bearer ${token}`
        }
      });

      showMessage('Listing added successfully!', 'success', 3000);
      // Clear form fields
      setPurchaseCategory('Rent');
      setTitle('');
      setLocation('');
      setStateValue('');
      setPropertyType('');
      setBedrooms('');
      setBathrooms('');
      setPrice('');
      setImages([]);
      setImageURLs([]);
      setThumbnailIdentifier(null);
      setDescription('');
      setSquareFootage('');
      setLotSize('');
      setYearBuilt('');
      setHeatingType('');
      setCoolingType('');
      setParking('');
      setAmenities('');
      setLandSize('');
      setZoningType('');
      setTitleType('');

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

  const formElementStyles = `py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200
    ${darkMode
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
    }`;

  return (
    <div className={`flex items-center justify-center min-h-screen p-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"} overflow-x-hidden`}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`rounded-2xl shadow-2xl w-full max-w-2xl p-8 space-y-6 relative ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
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
              onChange={(e) => setLocation(capitalizeFirstLetter(e.target.value))}
              className={`block w-full ${formElementStyles}`}
              required
            />
          </div>

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

          {/* Conditional fields for non-land properties */}
          {!isLandProperty && (
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
          )}

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

          {/* Conditional fields for non-land properties */}
          {!isLandProperty && (
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
          )}

          {/* Land-specific fields */}
          {isLandProperty && (
            <>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Land Size (sqft or acres) (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  className={`block w-full ${formElementStyles}`}
                  placeholder="e.g., 5000 sqft or 1.5 acres"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Zoning Type (Optional)</label>
                <Dropdown
                  placeholder="Select Zoning Type"
                  options={zoningTypeOptions}
                  value={zoningType}
                  onChange={setZoningType}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Title Type field - now always visible */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Title Type (Optional)</label>
            <Dropdown
              placeholder="Select Title Type"
              options={titleTypeOptions}
              value={titleType}
              onChange={setTitleType}
              className="w-full"
            />
          </div>

          {!isLandProperty && (
            <>
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
            </>
          )}


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

          {(allImagesForDisplay.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {allImagesForDisplay.map((item, index) => (
                <motion.div
                  key={item.identifier}
                  className={`border p-2 rounded-2xl relative transition-all duration-200 ${item.identifier === thumbnailIdentifier ? 'border-green-500 ring-2 ring-green-500' : ''} ${
                    darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                  }`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <img
                    src={item.url}
                    alt={`Upload ${index}`}
                    className="w-full h-32 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(item.identifier, item.type)}
                    className="absolute top-1 right-1 text-red-600 bg-white rounded-full p-1 shadow transition-all duration-200"
                  >✕</button>
                  <button
                    type="button"
                    onClick={() => setAsThumbnail(item.identifier)}
                    className={`text-xs underline mt-1 block transition-all duration-200 ${darkMode ? "text-green-400" : "text-green-700"}`}
                  >{item.identifier === thumbnailIdentifier ? 'Thumbnail (Selected)' : 'Set as Thumbnail'}</button>
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

export default AddListing;


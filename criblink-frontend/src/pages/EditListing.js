import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { useTheme } from '../layouts/AppShell';
import { ChevronDown } from 'lucide-react'; // Import ChevronDown icon for the dropdown

// Reusable Dropdown Component (embedded directly here for self-containment)
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


const App = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [purchaseCategory, setPurchaseCategory] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');

  const [description, setDescription] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [heatingType, setHeatingType] = useState('');
  const [coolingType, setCoolingType] = useState('');
  const [parking, setParking] = useState('');
  const [amenities, setAmenities] = useState('');

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [newImageURLs, setNewImageURLs] = useState([]);

  const [thumbnailIdentifier, setThumbnailIdentifier] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/listings/${id}`);
        const fetchedListing = response.data;

        if (!fetchedListing) {
          setError('Listing not found.');
          setLoading(false);
          return;
        }

        setListing(fetchedListing);

        setPurchaseCategory(fetchedListing.purchase_category || '');
        setTitle(fetchedListing.title || '');
        setLocation(fetchedListing.location || '');
        setStateValue(fetchedListing.state || '');
        setPropertyType(fetchedListing.property_type || '');
        setBedrooms(fetchedListing.bedrooms || '');
        setBathrooms(fetchedListing.bathrooms || '');
        setPrice(fetchedListing.price || '');
        setStatus(fetchedListing.status || '');

        setDescription(fetchedListing.description || '');
        setSquareFootage(fetchedListing.square_footage || '');
        setLotSize(fetchedListing.lot_size || '');
        setYearBuilt(fetchedListing.year_built || '');
        setHeatingType(fetchedListing.heating_type || '');
        setCoolingType(fetchedListing.cooling_type || '');
        setParking(fetchedListing.parking || '');
        setAmenities(fetchedListing.amenities || '');

        const initialExistingImages = [];
        if (fetchedListing.image_url) {
          initialExistingImages.push({ url: fetchedListing.image_url });
          setThumbnailIdentifier(fetchedListing.image_url);
        }
        if (fetchedListing.gallery_images && Array.isArray(fetchedListing.gallery_images)) {
          fetchedListing.gallery_images.forEach(url => {
            if (url !== fetchedListing.image_url) {
              initialExistingImages.push({ url: url });
            }
          });
        }
        setExistingImages(initialExistingImages);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('Failed to fetch listing.');
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    } else {
      setLoading(false);
      setError('No listing ID provided.');
    }

  }, [id]);

  const onDrop = (acceptedFiles) => {
    setNewImages(prev => [...prev, ...acceptedFiles]);
    if (thumbnailIdentifier === null && acceptedFiles.length > 0) {
      setThumbnailIdentifier(acceptedFiles[0].name);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: 'image/*' });

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      const newUrl = imageUrlInput.trim();
      setNewImageURLs(prev => [...prev, newUrl]);
      setImageUrlInput('');
      if (thumbnailIdentifier === null) {
        setThumbnailIdentifier(newUrl);
      }
    }
  };

  const handleRemoveImage = (identifier, type) => {
    let updatedThumbnailIdentifier = thumbnailIdentifier;

    if (type === 'existing') {
      setExistingImages(prev => prev.filter(img => img.url !== identifier));
    } else if (type === 'newFile') {
      setNewImages(prev => prev.filter(file => file.name !== identifier));
    } else if (type === 'newUrl') {
      setNewImageURLs(prev => prev.filter(url => url !== identifier));
    }

    if (updatedThumbnailIdentifier === identifier) {
      updatedThumbnailIdentifier = null;
    }

    const remainingImages = [
      ...existingImages.filter(img => img.url !== identifier),
      ...newImages.filter(file => file.name !== identifier),
      ...newImageURLs.filter(url => url !== identifier)
    ];

    if (updatedThumbnailIdentifier === null && remainingImages.length > 0) {
      if (remainingImages[0].url) {
        updatedThumbnailIdentifier = remainingImages[0].url;
      } else if (remainingImages[0].file) {
        updatedThumbnailIdentifier = remainingImages[0].file.name;
      }
    }
    setThumbnailIdentifier(updatedThumbnailIdentifier);
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

    const allImagesCombined = [
      ...existingImages.map(img => ({ ...img, source: 'existing' })),
      ...newImages.map(file => ({ url: URL.createObjectURL(file), file, source: 'newFile' })),
      ...newImageURLs.map(url => ({ url, source: 'newUrl' }))
    ];

    if (!title || !location || !price || !status || !propertyType || !bedrooms || !bathrooms || !purchaseCategory) {
      console.error('Please fill in all required fields.');
      return;
    }

    if (allImagesCombined.length < 2) {
      console.error('Please ensure at least two images are uploaded.');
      return;
    }

    if (thumbnailIdentifier === null) {
      console.error('Please set a thumbnail image.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('location', location);
    formData.append('state', stateValue);
    formData.append('property_type', propertyType);
    formData.append('bedrooms', bedrooms);
    formData.append('bathrooms', bathrooms);
    formData.append('price', price);
    formData.append('status', status);
    formData.append('purchase_category', purchaseCategory);

    if (description) formData.append('description', description);
    if (squareFootage) formData.append('square_footage', squareFootage);
    if (lotSize) formData.append('lot_size', lotSize);
    if (yearBuilt) formData.append('year_built', yearBuilt);
    if (heatingType) formData.append('heating_type', heatingType);
    if (coolingType) formData.append('cooling_type', coolingType);
    if (parking) formData.append('parking', parking);
    if (amenities) formData.append('amenities', amenities);

    const existingImageUrlsToKeep = existingImages.map(img => img.url);
    formData.append('existingImageUrlsToKeep', JSON.stringify(existingImageUrlsToKeep));

    formData.append('newImageUrls', JSON.stringify(newImageURLs));

    newImages.forEach(file => {
      formData.append('newImages', file);
    });

    formData.append('mainImageIdentifier', thumbnailIdentifier);

    const token = localStorage.getItem('token');

    if (!token) {
      console.error('Authentication token not found. Please sign in.');
      return;
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/listings/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        console.log('Listing updated successfully!');
        navigate('/admin/listings');
      } else {
        console.error(`Failed to update listing. Server returned status: ${response.status}`);
      }

    } catch (error) {
      console.error('Error updating listing:', error.response?.data || error.message);
      console.error('Failed to update listing.');
    }
  };

  // Options for Dropdowns
  const purchaseCategoryOptions = [
    { value: "Sale", label: "Sale" },
    { value: "Rent", label: "Rent" },
    { value: "Lease", label: "Lease" },
    { value: "Short Let", label: "Short Let" },
    { value: "Long Let", label: "Long Let" }
  ];

  const statusOptions = [
    { value: "", label: "Select Status" },
    { value: "available", label: "Available" },
    { value: "sold", label: "Sold" },
    { value: "under offer", label: "Under Offer" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "featured", label: "Featured" },
  ];

  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
    "Abuja"
  ].sort();

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

  const inputStyles = `py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
    darkMode
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
  }`;


  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <p className={`text-lg ${darkMode ? "text-green-400" : "text-green-700"}`}>Loading listing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <p className={`text-lg ${darkMode ? "text-red-400" : "text-red-600"}`}>Error: {error}</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Listing not found.</p>
      </div>
    );
  }

  const allImagesForDisplay = [
    ...existingImages.map(img => ({ ...img, source: 'existing' })),
    ...newImages.map(file => ({ url: URL.createObjectURL(file), file, source: 'newFile' })),
    ...newImageURLs.map(url => ({ url, source: 'newUrl' }))
  ];

  const getImageIdentifier = (item) => {
    if (item.source === 'existing' || item.source === 'newUrl') {
      return item.url;
    } else if (item.source === 'newFile') {
      return item.file.name;
    }
    return null;
  };


  return (
    <div className={`flex items-center justify-center min-h-screen p-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"} overflow-x-hidden`}>
      <main className="space-y-6 w-full max-w-2xl">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`rounded-2xl shadow-2xl w-full p-8 space-y-6 relative ${darkMode ? "bg-gray-800" : "bg-white"}`}
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
            Edit Listing: {listing.title}
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
                placeholder="Select Category"
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
                className={`block w-full ${inputStyles}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(capitalizeFirstLetter(e.target.value))}
                className={`block w-full ${inputStyles}`}
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
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={`block w-full ${inputStyles}`} required />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Status (Optional)</label>
              <Dropdown
                placeholder="Select Status"
                options={statusOptions}
                value={status}
                onChange={setStatus}
                className="w-full"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`block w-full ${inputStyles}`}
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
                  className={`block w-full ${inputStyles}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Lot Size (sqft or acres) (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  className={`block w-full ${inputStyles}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Year Built (Optional)</label>
              <input
                type="number"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                className={`block w-full ${inputStyles}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Heating Type (Optional)</label>
                <input
                  type="text"
                  value={heatingType}
                  onChange={(e) => setHeatingType(e.target.value)}
                  className={`block w-full ${inputStyles}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Cooling Type (Optional)</label>
                <input
                  type="text"
                  value={coolingType}
                  onChange={(e) => setCoolingType(e.target.value)}
                  className={`block w-full ${inputStyles}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Parking (Optional)</label>
              <input
                type="text"
                value={parking}
                onChange={(e) => setParking(e.target.value)}
                className={`block w-full ${inputStyles}`}
                placeholder="e.g., Garage, Street, Driveway"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>Amenities (comma-separated) (Optional)</label>
              <textarea
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                className={`block w-full ${inputStyles}`}
                rows="3"
                placeholder="e.g., Pool, Gym, Balcony, Garden"
              ></textarea>
            </div>


            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Images</label>

              <div {...getRootProps()} className={`p-6 border-dashed border-2 rounded-xl cursor-pointer text-center mb-4 transition-all duration-200 ${
                darkMode
                  ? "border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500 focus:ring-green-400"
                  : "border-gray-300 bg-gray-50 text-gray-600 hover:border-green-500 focus:ring-green-600"
              }`}>
                <input {...getInputProps()} />
                Drag & drop or click to add new images
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className={`flex-grow block w-full py-2 px-4 border rounded-xl shadow-sm focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-600"
                  }`}
                  placeholder="Or add new image URL: https://example.com/image.jpg"
                />
                <button type="button" onClick={handleAddImageUrl} className="bg-green-600 text-white px-4 py-2 rounded-2xl hover:bg-green-700 text-sm transition-all duration-200">Add URL</button>
              </div>

              {(allImagesForDisplay.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {allImagesForDisplay.map((item, index) => {
                    const identifier = getImageIdentifier(item);
                    const isThumbnail = identifier === thumbnailIdentifier;
                    return (
                      <motion.div
                        key={identifier || index}
                        className={`border p-2 rounded-2xl relative transition-all duration-200 ${isThumbnail ? 'border-green-500 ring-2 ring-green-500' : ''} ${
                          darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                        }`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <img
                          src={item.url}
                          alt={`Listing Image ${index}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(identifier, item.source)}
                          className="absolute top-1 right-1 text-red-600 bg-white rounded-full p-1 shadow transition-all duration-200"
                        >✕</button>
                        <button
                          type="button"
                          onClick={() => setAsThumbnail(identifier)}
                          className={`text-xs underline mt-1 block transition-all duration-200 ${darkMode ? "text-green-400" : "text-green-700"}`}
                        >{isThumbnail ? 'Thumbnail (Selected)' : 'Set as Thumbnail'}</button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-green-700 text-white py-3 px-6 rounded-2xl hover:bg-green-800 text-sm transition-all duration-200">
              Update Listing
            </button>
          </motion.div>
        </motion.form>
      </main>
    </div>
  );
};

export default App;

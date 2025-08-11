import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../layouts/AppShell';
import { ChevronDown, X as CloseIcon } from 'lucide-react';
import { useMessage } from '../context/MessageContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';

const Dropdown = ({ options, value, onChange, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
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
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 500, damping: 30, delayChildren: 0.05, staggerChildren: 0.02 } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: "easeOut" } },
  };

  const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  const selectedOptionLabel = options.find(option => option.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Current selection: ${selectedOptionLabel}. Open to change selection.`}
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10
          ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-600"}`}
      >
        <span className="overflow-hidden truncate">{selectedOptionLabel}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
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
                type="button"
                variants={itemVariants}
                whileHover={{ x: 5 }}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
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
  const { showConfirm } = useConfirmDialog();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();

  const [purchaseCategory, setPurchaseCategory] = useState('Rent');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [price, setPrice] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [newImageURLs, setNewImageURLs] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [thumbnailIdentifier, setThumbnailIdentifier] = useState(null);
  const [description, setDescription] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [heatingType, setHeatingType] = useState('');
  const [coolingType, setCoolingType] = useState('');
  const [parking, setParking] = useState('');
  const [amenities, setAmenities] = useState('');
  const [landSize, setLandSize] = useState('');
  const [zoningType, setZoningType] = useState('');
  const [titleType, setTitleType] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [statusValue, setStatusValue] = useState('');
  const [userRole, setUserRole] = useState(null);
  const isLandProperty = propertyType === 'Land';

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data } = await axiosInstance.get('/users/profile');
        setUserRole(data.role);
      } catch (error) {
        setUserRole('visitor');
      }
    };
    fetchUserRole();
  }, []);

  // Set the default status based on the user's role.
  useEffect(() => {
    if (userRole === 'admin') {
      setStatusValue('available');
    } else if (userRole === 'agency_admin' || userRole === 'agent') {
      setStatusValue('pending');
    }
  }, [userRole]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach(file => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          setNewImages(prev => [...prev, { base64: reader.result, originalname: file.name }]);
          setThumbnailIdentifier(prev => prev || file.name);
        };
      });
    },
    accept: { 'image/*': [] }
  });

  const allImagesForDisplay = [
    ...newImages.map(img => ({ url: img.base64, identifier: img.originalname, type: 'newFile' })),
    ...newImageURLs.map(url => ({ url, identifier: url, type: 'newUrl' }))
  ];

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      const newUrl = imageUrlInput.trim();
      setNewImageURLs(prev => [...prev, newUrl]);
      setThumbnailIdentifier(prev => prev || newUrl);
      setImageUrlInput('');
    } else {
      showMessage('Please enter a valid image URL.', 'error');
    }
  };

  const handleRemoveImage = (identifierToRemove, type) => {
    if (type === 'newFile') {
      setNewImages(prev => prev.filter(img => img.originalname !== identifierToRemove));
    } else {
      setNewImageURLs(prev => prev.filter(url => url !== identifierToRemove));
    }
    if (thumbnailIdentifier === identifierToRemove) {
      const nextThumbnail = allImagesForDisplay.find(img => img.identifier !== identifierToRemove);
      setThumbnailIdentifier(nextThumbnail ? nextThumbnail.identifier : null);
    }
  };

  const setAsThumbnail = (identifier) => {
    setThumbnailIdentifier(identifier);
    showMessage('Thumbnail set.', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValidThumbnail = allImagesForDisplay.some(img => img.identifier === thumbnailIdentifier);
    if (!thumbnailIdentifier || !isValidThumbnail) {
      showMessage('Please select a valid thumbnail image.', 'error');
      return;
    }
    if (allImagesForDisplay.length < 2) {
      showMessage('Please upload or add at least 2 images.', 'error');
      return;
    }

    const payload = {
      purchase_category: purchaseCategory,
      title,
      location,
      state: stateValue,
      property_type: propertyType,
      bedrooms: isLandProperty ? null : bedrooms,
      bathrooms: isLandProperty ? null : bathrooms,
      price,
      description,
      square_footage: isLandProperty ? null : squareFootage,
      lot_size: lotSize,
      year_built: isLandProperty ? null : yearBuilt,
      heating_type: isLandProperty ? null : heatingType,
      cooling_type: isLandProperty ? null : coolingType,
      parking: isLandProperty ? null : parking,
      amenities: isLandProperty ? null : amenities,
      land_size: isLandProperty ? landSize : null,
      zoning_type: isLandProperty ? zoningType : null,
      title_type: titleType,
      is_featured: isFeatured,
      status: statusValue,
      mainImageBase64: newImages.find(img => img.originalname === thumbnailIdentifier)?.base64 || null,
      mainImageOriginalName: newImages.find(img => img.originalname === thumbnailIdentifier)?.originalname || null,
      mainImageURL: newImageURLs.includes(thumbnailIdentifier) ? thumbnailIdentifier : null,
      galleryImagesBase64: newImages.filter(img => img.originalname !== thumbnailIdentifier).map(img => img.base64),
      galleryImagesOriginalNames: newImages.filter(img => img.originalname !== thumbnailIdentifier).map(img => img.originalname),
      galleryImageURLs: newImageURLs.filter(url => url !== thumbnailIdentifier)
    };

    try {
      const { data } = await axiosInstance.post('/listings', payload);
      showMessage('Listing created successfully!', 'success');
      navigate(`/listings/${data.property_id}`);
    } catch (error) {
      showMessage(error.response?.data?.error || 'Failed to create listing.', 'error');
    }
  };

  const handleExit = () => {
    const currentState = {
      purchaseCategory, title, location, stateValue, propertyType, bedrooms, bathrooms, price, description,
      squareFootage, lotSize, yearBuilt, heatingType, coolingType, parking, amenities, landSize, zoningType,
      titleType, isFeatured, statusValue, newImages, newImageURLs, thumbnailIdentifier
    };
    if (Object.values(currentState).some(val => val !== '' && val !== null && (Array.isArray(val) && val.length !== 0))) {
      showConfirm({
        message: 'Are you sure you want to exit? Any unsaved changes will be lost.',
        onConfirm: () => navigate(-1),
        onCancel: () => {}
      });
    } else {
      navigate(-1);
    }
  };

  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "Abuja"
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
    { value: "Land", label: "Land" },
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
  const heatingTypeOptions = [
    { value: "", label: "Select Heating Type" },
    { value: "Central Heating", label: "Central Heating" },
    { value: "Electric", label: "Electric" },
    { value: "Gas", label: "Gas" },
    { value: "Solar", label: "Solar" },
    { value: "None", label: "None" },
  ];
  const coolingTypeOptions = [
    { value: "", label: "Select Cooling Type" },
    { value: "Central AC", label: "Central AC" },
    { value: "Window Unit", label: "Window Unit" },
    { value: "Split System", label: "Split System" },
    { value: "None", label: "None" },
  ];

  const uniformInputClass = (isTextArea = false) => `w-full py-1 px-4 border rounded-xl shadow-sm transition-all duration-200
  ${darkMode
    ? "bg-gray-700 text-white border-gray-600 hover:border-green-500 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 focus:ring-green-400"
    : "bg-white text-gray-800 border-gray-300 hover:border-green-500 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 focus:ring-green-600"}
  ${isTextArea ? 'min-h-[8rem]' : 'h-10'}`;
  const labelClass = `block text-sm font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`;
  const sectionTitleClass = `text-lg font-bold mb-4 border-b pb-2 ${darkMode ? "text-gray-100 border-gray-700" : "text-gray-800 border-gray-300"}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-2 pb-10`}
    >
      <motion.form
        onSubmit={handleSubmit}
        className={`max-w-4xl mx-auto p-8 rounded-3xl shadow-2xl space-y-8 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}`}
      >
        <div className="relative">
          <button
            type="button"
            onClick={handleExit}
            className="absolute -top-4 -right-4 p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 z-10"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
          <h1 className={`text-2xl md:text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>
            Add New Property Listing
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <h2 className={sectionTitleClass}>Core Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label htmlFor="purchaseCategory" className={labelClass}>
                Purchase Category <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={purchaseCategoryOptions}
                value={purchaseCategory}
                onChange={setPurchaseCategory}
                placeholder="Select a category"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="title" className={labelClass}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Beautiful 3-Bedroom Duplex"
                className={uniformInputClass()}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="propertyType" className={labelClass}>
                Property Type <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={propertyTypeOptions}
                value={propertyType}
                onChange={setPropertyType}
                placeholder="Select property type"
              />
            </div>
            {!isLandProperty && (
              <>
                <div>
                  <label htmlFor="bedrooms" className={labelClass}>
                    Bedrooms <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={bedroomOptions}
                    value={bedrooms}
                    onChange={setBedrooms}
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label htmlFor="bathrooms" className={labelClass}>
                    Bathrooms <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={bathroomOptions}
                    value={bathrooms}
                    onChange={setBathrooms}
                    placeholder="Any"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="location" className={labelClass}>
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Lekki Phase 1, Lagos"
                className={uniformInputClass()}
                required
              />
            </div>
            <div>
              <label htmlFor="stateValue" className={labelClass}>
                State <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={stateOptions}
                value={stateValue}
                onChange={setStateValue}
                placeholder="Select a state"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className={labelClass}>
                Price (NGN) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 50000000"
                className={uniformInputClass()}
                required
              />
            </div>
            {/* The status dropdown is no longer needed here as it's set automatically */}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className={sectionTitleClass}>Images</h2>
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border border-dashed rounded-2xl py-6 px-4 text-center cursor-pointer transition-all duration-300
                ${darkMode ? "border-gray-600 hover:border-green-500 text-gray-400" : "border-gray-300 hover:border-green-500 text-gray-500"}`}
            >
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
              <p className="text-xs mt-1">(Minimum 2 images required)</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Or paste an image URL here..."
                className={uniformInputClass()}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className={`bg-green-600 text-white py-2 px-6 rounded-2xl transition-colors duration-200 hover:bg-green-700 font-bold whitespace-nowrap`}
              >
                Add URL
              </button>
            </div>
            {allImagesForDisplay.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {allImagesForDisplay.map((item, index) => (
                  <motion.div
                    key={item.identifier || index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group overflow-hidden rounded-2xl shadow-lg border"
                  >
                    <img
                      src={item.url}
                      alt={`Listing Image ${index + 1}`}
                      className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      className="absolute top-2 right-2 bg-red-600 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(item.identifier, item.type)}
                    >
                      <CloseIcon className="h-4 w-4 text-white" />
                    </div>
                    <div
                      className={`absolute bottom-0 left-0 right-0 p-2 text-center text-xs font-semibold
                        ${item.identifier === thumbnailIdentifier ? "bg-green-700 text-white" : "bg-white/80 text-gray-800 backdrop-blur-sm"}`}
                    >
                      {item.identifier === thumbnailIdentifier ? 'Thumbnail (Selected)' : 'Set as Thumbnail'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAsThumbnail(item.identifier)}
                      className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100"
                    ></button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className={sectionTitleClass}>Optional Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of the property..."
                className={uniformInputClass(true)}
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="squareFootage" className={labelClass}>Square Footage</label>
                <input
                  type="number"
                  id="squareFootage"
                  value={squareFootage}
                  onChange={(e) => setSquareFootage(e.target.value)}
                  placeholder="e.g., 2000"
                  className={uniformInputClass()}
                />
              </div>
              <div>
                <label htmlFor="yearBuilt" className={labelClass}>Year Built</label>
                <input
                  type="number"
                  id="yearBuilt"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="e.g., 2010"
                  className={uniformInputClass()}
                />
              </div>
              <div>
                <label htmlFor="lotSize" className={labelClass}>Lot Size</label>
                <input
                  type="text"
                  id="lotSize"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  placeholder="e.g., 500 sq meters"
                  className={uniformInputClass()}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="parking" className={labelClass}>Parking</label>
                <input
                  type="text"
                  id="parking"
                  value={parking}
                  onChange={(e) => setParking(e.target.value)}
                  placeholder="e.g., 2-car garage"
                  className={uniformInputClass()}
                />
              </div>
              {!isLandProperty && (
                <>
                  <div>
                    <label htmlFor="heatingType" className={labelClass}>Heating Type</label>
                    <Dropdown
                      options={heatingTypeOptions}
                      value={heatingType}
                      onChange={setHeatingType}
                      placeholder="Select heating type"
                    />
                  </div>
                  <div>
                    <label htmlFor="coolingType" className={labelClass}>Cooling Type</label>
                    <Dropdown
                      options={coolingTypeOptions}
                      value={coolingType}
                      onChange={setCoolingType}
                      placeholder="Select cooling type"
                    />
                  </div>
                </>
              )}
              {isLandProperty && (
                <>
                  <div>
                    <label htmlFor="landSize" className={labelClass}>Land Size</label>
                    <input
                      type="text"
                      id="landSize"
                      value={landSize}
                      onChange={(e) => setLandSize(e.target.value)}
                      placeholder="e.g., 600 sqm"
                      className={uniformInputClass()}
                    />
                  </div>
                  <div>
                    <label htmlFor="zoningType" className={labelClass}>Zoning Type</label>
                    <Dropdown
                      options={zoningTypeOptions}
                      value={zoningType}
                      onChange={setZoningType}
                      placeholder="Select zoning type"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <label htmlFor="amenities" className={labelClass}>Amenities</label>
              <input
                type="text"
                id="amenities"
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                placeholder="e.g., Pool, Gym, Security"
                className={uniformInputClass()}
              />
            </div>

            {isLandProperty && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="titleType" className={labelClass}>Title Type</label>
                  <Dropdown
                    options={titleTypeOptions}
                    value={titleType}
                    onChange={setTitleType}
                    placeholder="Select title type"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {(userRole === 'admin' || userRole === 'agency_admin') && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className={sectionTitleClass}>Admin Options</h2>
            <div className="flex justify-center items-center space-x-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className={`h-5 w-5 rounded-md focus:ring-green-500 border
                  ${darkMode ? "bg-gray-800 border-gray-600 checked:bg-green-600" : "border-gray-300 checked:bg-green-600"}`}
              />
              <label htmlFor="is_featured" className={`${labelClass} mb-0 font-bold`}>
                Mark as Featured Listing (Admin Only)
              </label>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            className="w-full md:w-1/3 bg-green-700 text-white py-3 px-6 rounded-2xl hover:bg-green-800 text-sm transition-all duration-300 shadow-md"
          >
            Add Listing
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default AddListing;

import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
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
        className={`flex items-center justify-between w-full py-1 px-4 border rounded-xl focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 transition-all duration-200 h-10
          ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 focus:ring-green-400" : "bg-white border-gray-300 text-gray-500 hover:border-green-500 focus:ring-green-600"}`}
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
                onClick={(e) => {
                  e.stopPropagation();
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

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showConfirm } = useConfirmDialog();
  const { darkMode } = useTheme();
  const { showMessage } = useMessage();

  const [initialState, setInitialState] = useState(null);
  const [purchaseCategory, setPurchaseCategory] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [price, setPrice] = useState('');
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
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImageURLs, setNewImageURLs] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [thumbnailIdentifier, setThumbnailIdentifier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);

  const [tempState, setTempState] = useState({
    purchaseCategory: '',
    title: '',
    location: '',
    stateValue: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    price: '',
    description: '',
    squareFootage: '',
    lotSize: '',
    yearBuilt: '',
    heatingType: '',
    coolingType: '',
    parking: '',
    amenities: '',
    landSize: '',
    zoningType: '',
    titleType: '',
    isFeatured: false,
    statusValue: '',
  });

  const isLandProperty = tempState.propertyType === 'Land';

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data } = await axiosInstance.get('/users/profile');
        setUserRole(data.role);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setUserRole('visitor');
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole === 'admin') {
      setStatusOptions([
        { value: "available", label: "Available" },
        { value: "pending", label: "Pending" },
        { value: "rejected", label: "Rejected" },
      ]);
    } else if (userRole === 'agency_admin' || userRole === 'agent') {
      setStatusOptions([
        { value: "sold", label: "Sold" },
        { value: "under offer", label: "Under Offer" },
      ]);
    } else {
      setStatusOptions([]);
    }
  }, [userRole]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data } = await axiosInstance.get(`/listings/${id}`);

        const fetchedState = {
          purchaseCategory: data.purchase_category || '',
          title: data.title || '',
          location: data.location || '',
          stateValue: data.state || '',
          propertyType: data.property_type || '',
          bedrooms: data.bedrooms || '',
          bathrooms: data.bathrooms || '',
          price: data.price || '',
          description: data.description || '',
          squareFootage: data.square_footage || '',
          lotSize: data.lot_size || '',
          yearBuilt: data.year_built || '',
          heatingType: data.heating_type || '',
          coolingType: data.cooling_type || '',
          parking: data.parking || '',
          amenities: data.amenities || '',
          landSize: data.land_size || '',
          zoningType: data.zoning_type || '',
          titleType: data.title_type || '',
          isFeatured: data.is_featured || false,
          statusValue: data.status || '',
          existingImages: data.gallery_images || [],
          newImages: [],
          newImageURLs: [],
        };

        setPurchaseCategory(fetchedState.purchaseCategory);
        setTitle(fetchedState.title);
        setLocation(fetchedState.location);
        setStateValue(fetchedState.stateValue);
        setPropertyType(fetchedState.propertyType);
        setBedrooms(String(fetchedState.bedrooms));
        setBathrooms(String(fetchedState.bathrooms));
        setPrice(String(fetchedState.price));
        setDescription(fetchedState.description);
        setSquareFootage(String(fetchedState.squareFootage));
        setLotSize(fetchedState.lotSize);
        setYearBuilt(String(fetchedState.yearBuilt));
        setHeatingType(fetchedState.heatingType);
        setCoolingType(fetchedState.coolingType);
        setParking(fetchedState.parking);
        setAmenities(fetchedState.amenities);
        setLandSize(fetchedState.landSize);
        setZoningType(fetchedState.zoningType);
        setTitleType(fetchedState.titleType);
        setIsFeatured(fetchedState.isFeatured);
        setStatusValue(fetchedState.statusValue);
        setExistingImages(data.gallery_images ? data.gallery_images.map(url => ({ url, identifier: url, type: 'existing' })) : []);

        const initialThumbnail = data.image_url || (data.gallery_images && data.gallery_images.length > 0 ? data.gallery_images[0] : null);
        setThumbnailIdentifier(initialThumbnail);
        setInitialState({ ...fetchedState, thumbnailIdentifier: initialThumbnail });

        setTempState({
          purchaseCategory: fetchedState.purchaseCategory,
          title: fetchedState.title,
          location: fetchedState.location,
          stateValue: fetchedState.stateValue,
          propertyType: fetchedState.propertyType,
          bedrooms: String(fetchedState.bedrooms),
          bathrooms: String(fetchedState.bathrooms),
          price: String(fetchedState.price),
          description: fetchedState.description,
          squareFootage: String(fetchedState.squareFootage),
          lotSize: fetchedState.lotSize,
          yearBuilt: String(fetchedState.yearBuilt),
          heatingType: fetchedState.heatingType,
          coolingType: fetchedState.coolingType,
          parking: fetchedState.parking,
          amenities: fetchedState.amenities,
          landSize: fetchedState.landSize,
          zoningType: fetchedState.zoningType,
          titleType: fetchedState.titleType,
          isFeatured: fetchedState.isFeatured,
          statusValue: fetchedState.statusValue,
        });

      } catch (error) {
        console.error('Failed to fetch listing:', error);
        showMessage('Failed to load listing data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, showMessage]);

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
    ...existingImages,
    ...newImages.map(img => ({ url: img.base64, identifier: img.originalname, type: 'newFile' })),
    ...newImageURLs.map(url => ({ url, identifier: url, type: 'newUrl' }))
  ];

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setNewImageURLs(prev => [...prev, imageUrlInput.trim()]);
      setThumbnailIdentifier(prev => prev || imageUrlInput.trim());
      setImageUrlInput('');
    } else {
      showMessage('Please enter a valid image URL.', 'error');
    }
  };

  const handleRemoveImage = (identifierToRemove, type) => {
    if (type === 'existing') {
      setExistingImages(prev => prev.filter(img => img.identifier !== identifierToRemove));
    } else if (type === 'newFile') {
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

  const handleTempStateChange = (field, value) => {
    let newState = { ...tempState, [field]: value };

    if (field === 'statusValue' && value === 'sold') {
      newState.isFeatured = false;
    }

    if (field === 'isFeatured' && value && tempState.statusValue === 'sold') {
      showMessage('A sold property cannot be featured.', 'error');
      return;
    }

    setTempState(newState);
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

    setPurchaseCategory(tempState.purchaseCategory);
    setTitle(tempState.title);
    setLocation(tempState.location);
    setStateValue(tempState.stateValue);
    setPropertyType(tempState.propertyType);
    setBedrooms(tempState.bedrooms);
    setBathrooms(tempState.bathrooms);
    setPrice(tempState.price);
    setDescription(tempState.description);
    setSquareFootage(tempState.squareFootage);
    setLotSize(tempState.lotSize);
    setYearBuilt(tempState.yearBuilt);
    setHeatingType(tempState.heatingType);
    setCoolingType(tempState.coolingType);
    setParking(tempState.parking);
    setAmenities(tempState.amenities);
    setLandSize(tempState.landSize);
    setZoningType(tempState.zoningType);
    setTitleType(tempState.titleType);
    setIsFeatured(tempState.isFeatured);
    setStatusValue(tempState.statusValue);

    const payload = {
      purchase_category: tempState.purchaseCategory,
      title: tempState.title,
      location: tempState.location,
      state: tempState.stateValue,
      property_type: tempState.propertyType,
      bedrooms: isLandProperty ? null : tempState.bedrooms,
      bathrooms: isLandProperty ? null : tempState.bathrooms,
      price: tempState.price,
      description: tempState.description,
      square_footage: isLandProperty ? null : tempState.squareFootage,
      lot_size: tempState.lotSize,
      year_built: isLandProperty ? null : tempState.yearBuilt,
      heating_type: tempState.heatingType,
      cooling_type: tempState.coolingType,
      parking: tempState.parking,
      amenities: tempState.amenities,
      land_size: isLandProperty ? tempState.landSize : null,
      zoning_type: isLandProperty ? tempState.zoningType : null,
      title_type: tempState.titleType,
      status: tempState.statusValue,
      mainImageIdentifier: thumbnailIdentifier,
      existingImageUrlsToKeep: existingImages.map(img => img.url),
      newImageUrls: newImageURLs,
      newImagesBase64: newImages.map(img => img.base64),
      newImagesOriginalNames: newImages.map(img => img.originalname)
    };

    if (['agent', 'agency_admin'].includes(userRole) && tempState.statusValue === 'sold') {
      payload.is_featured = false;
    } else if (userRole === 'admin') {
      payload.is_featured = tempState.isFeatured;
    }

    try {
      const { data } = await axiosInstance.put(`/listings/${id}`, payload);
      showMessage('Listing updated successfully!', 'success');
      navigate(`/listings/${data.property_id || id}`);
    } catch (error) {
      console.error('Error updating listing:', error.response?.data || error.message);
      showMessage(error.response?.data?.error || 'Failed to update listing.', 'error');
    }
  };

  const handleExit = () => {
    const currentState = {
      ...tempState,
      existingImages: existingImages.map(i => i.url),
      newImages,
      newImageURLs,
      thumbnailIdentifier
    };
    if (JSON.stringify(initialState) !== JSON.stringify(currentState)) {
      showConfirm({
        message: 'Are you sure you want to exit? Any unsaved changes will be lost.',
        onConfirm: () => navigate(-1),
        onCancel: () => {}
      });
    } else {
      navigate(-1);
    }
  };

  const nigerianStates = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "Abuja"].sort();
  const purchaseCategoryOptions = [
    { value: "Rent", label: "Rent" }, { value: "Sale", label: "Sale" }, { value: "Lease", label: "Lease" },
    { value: "Short Let", label: "Short Let" }, { value: "Long Let", label: "Long Let" }
  ];
  const stateOptions = [{ value: "", label: "Select State" }, ...nigerianStates.map(state => ({ value: state, label: state }))];
  const propertyTypeOptions = [
    { value: "", label: "Select Property Type" }, { value: "Duplex", label: "Duplex" }, { value: "Bungalow", label: "Bungalow" },
    { value: "Apartment", label: "Apartment" }, { value: "Penthouse", label: "Penthouse" }, { value: "Detached House", label: "Detached House" },
    { value: "Semi-Detached House", label: "Semi-Detached House" }, { value: "Condo", label: "Condo" }, { value: "Land", label: "Land" }
  ];
  const bedroomOptions = [{ value: "", label: "Any Bedrooms" }, ...[1, 2, 3, 4, 5].map(num => ({ value: String(num), label: `${num} Bedroom(s)` }))];
  const bathroomOptions = [{ value: "", label: "Any Bathrooms" }, ...[1, 2, 3, 4, 5].map(num => ({ value: String(num), label: `${num} Bathroom(s)` }))];
  const zoningTypeOptions = [
    { value: "", label: "Select Zoning Type" }, { value: "Residential", label: "Residential" }, { value: "Commercial", label: "Commercial" },
    { value: "Industrial", label: "Industrial" }, { value: "Agricultural", label: "Agricultural" }, { value: "Mixed-Use", label: "Mixed-Use" },
    { value: "Other", label: "Other" }
  ];
  const titleTypeOptions = [
    { value: "", label: "Select Title Type" }, { value: "C of O", label: "Certificate of Occupancy (C of O)" },
    { value: "Gazette", label: "Gazette" }, { value: "Deed of Assignment", label: "Deed of Assignment" },
    { value: "Governor's Consent", label: "Governor's Consent" }, { value: "Survey Plan", label: "Survey Plan" },
    { value: "Excision", label: "Excision" }, { value: "Other", label: "Other" }
  ];
  const heatingTypeOptions = [
    { value: "", label: "Select Heating Type" }, { value: "Central Heating", label: "Central Heating" },
    { value: "Electric", label: "Electric" }, { value: "Gas", label: "Gas" }, { value: "Solar", label: "Solar" },
    { value: "None", label: "None" }
  ];
  const coolingTypeOptions = [
    { value: "", label: "Select Cooling Type" }, { value: "Central AC", label: "Central AC" }, { value: "Window Unit", label: "Window Unit" },
    { value: "Split System", label: "Split System" }, { value: "None", label: "None" }
  ];

  const uniformInputClass = (isTextArea = false) => `w-full py-1 px-4 border rounded-xl shadow-sm transition-all duration-200
  ${darkMode
    ? "bg-gray-700 text-white border-gray-600 hover:border-green-500 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 focus:ring-green-400"
    : "bg-white text-gray-800 border-gray-300 hover:border-green-500 focus:outline-none focus:border-transparent focus:ring-1 focus:ring-offset-0 focus:ring-600"}
  ${isTextArea ? 'min-h-[8rem]' : 'h-10'}`;
  const labelClass = `block text-sm font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`;
  const sectionTitleClass = `text-lg font-bold mb-4 border-b pb-2 ${darkMode ? "text-gray-100 border-gray-700" : "text-gray-800 border-gray-300"}`;

  if (loading) return <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`relative min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-2 pb-10`}>
      <motion.form onSubmit={handleSubmit} className={`max-w-4xl mx-auto p-8 rounded-3xl shadow-2xl space-y-8 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-900"}`}>
        <div className="relative">
          <button type="button" onClick={handleExit} className="absolute -top-4 -right-4 p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 z-10">
            <CloseIcon className="h-5 w-5" />
          </button>
          <h1 className={`text-2xl md:text-3xl font-extrabold text-center mb-6 ${darkMode ? "text-green-400" : "text-green-700"}`}>Edit Property Listing</h1>
        </div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          <h2 className={sectionTitleClass}>Core Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label htmlFor="purchaseCategory" className={labelClass}>Purchase Category <span className="text-red-500">*</span></label>
              <Dropdown options={purchaseCategoryOptions} value={tempState.purchaseCategory} onChange={(value) => handleTempStateChange('purchaseCategory', value)} placeholder="Select a category" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="title" className={labelClass}>Title <span className="text-red-500">*</span></label>
              <input type="text" id="title" value={tempState.title} onChange={(e) => handleTempStateChange('title', e.target.value)} placeholder="e.g., Beautiful 3-Bedroom Duplex" className={uniformInputClass()} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="propertyType" className={labelClass}>Property Type <span className="text-red-500">*</span></label>
              <Dropdown options={propertyTypeOptions} value={tempState.propertyType} onChange={(value) => handleTempStateChange('propertyType', value)} placeholder="Select property type" />
            </div>
            {!isLandProperty && (
              <>
                <div>
                  <label htmlFor="bedrooms" className={labelClass}>Bedrooms <span className="text-red-500">*</span></label>
                  <Dropdown options={bedroomOptions} value={tempState.bedrooms} onChange={(value) => handleTempStateChange('bedrooms', value)} placeholder="Any" />
                </div>
                <div>
                  <label htmlFor="bathrooms" className={labelClass}>Bathrooms <span className="text-red-500">*</span></label>
                  <Dropdown options={bathroomOptions} value={tempState.bathrooms} onChange={(value) => handleTempStateChange('bathrooms', value)} placeholder="Any" />
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="location" className={labelClass}>Location <span className="text-red-500">*</span></label>
              <input type="text" id="location" value={tempState.location} onChange={(e) => handleTempStateChange('location', e.target.value)} placeholder="e.g., Lekki Phase 1, Lagos" className={uniformInputClass()} required />
            </div>
            <div>
              <label htmlFor="stateValue" className={labelClass}>State <span className="text-red-500">*</span></label>
              <Dropdown options={stateOptions} value={tempState.stateValue} onChange={(value) => handleTempStateChange('stateValue', value)} placeholder="Select a state" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className={labelClass}>Price (NGN) <span className="text-red-500">*</span></label>
              <input type="number" id="price" value={tempState.price} onChange={(e) => handleTempStateChange('price', e.target.value)} placeholder="e.g., 50000000" className={uniformInputClass()} required />
            </div>
            {['admin', 'agency_admin', 'agent'].includes(userRole) && statusOptions.length > 0 && (
              <div>
                <label htmlFor="statusValue" className={labelClass}>Status</label>
                <Dropdown options={statusOptions} value={tempState.statusValue} onChange={(value) => handleTempStateChange('statusValue', value)} placeholder="Select status" />
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <h2 className={sectionTitleClass}>Images</h2>
          <div className="space-y-4">
            <div {...getRootProps()} className={`border border-dashed rounded-2xl py-6 px-4 text-center cursor-pointer transition-all duration-300 ${darkMode ? "border-gray-600 hover:border-green-500 text-gray-400" : "border-gray-300 hover:border-green-500 text-gray-500"}`}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
              <p className="text-xs mt-1">(Minimum 2 images required)</p>
            </div>
            <div className="flex items-center space-x-2">
              <input type="text" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="Or paste an image URL here..." className={uniformInputClass()} />
              <button type="button" onClick={handleAddImageUrl} className={`bg-green-600 text-white py-2 px-6 rounded-2xl transition-colors duration-200 hover:bg-green-700 font-bold whitespace-nowrap`}>Add URL</button>
            </div>
            {allImagesForDisplay.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {allImagesForDisplay.map((item, index) => (
                  <motion.div key={item.identifier || index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative group overflow-hidden rounded-2xl shadow-lg border">
                    <img src={item.url} alt={`Listing Image ${index + 1}`} className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveImage(item.identifier, item.type)}>
                      <CloseIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 p-2 text-center text-xs font-semibold ${item.identifier === thumbnailIdentifier ? "bg-green-700 text-white" : "bg-white/80 text-gray-800 backdrop-blur-sm"}`}>
                      {item.identifier === thumbnailIdentifier ? 'Thumbnail (Selected)' : 'Set as Thumbnail'}
                    </div>
                    <button type="button" onClick={() => setAsThumbnail(item.identifier)} className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100"></button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
          <h2 className={sectionTitleClass}>Optional Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
              <textarea id="description" value={tempState.description} onChange={(e) => handleTempStateChange('description', e.target.value)} placeholder="Provide a detailed description of the property..." className={uniformInputClass(true)}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="squareFootage" className={labelClass}>Square Footage</label>
                <input type="number" id="squareFootage" value={tempState.squareFootage} onChange={(e) => handleTempStateChange('squareFootage', e.target.value)} placeholder="e.g., 2000" className={uniformInputClass()} />
              </div>
              <div>
                <label htmlFor="yearBuilt" className={labelClass}>Year Built</label>
                <input type="number" id="yearBuilt" value={tempState.yearBuilt} onChange={(e) => handleTempStateChange('yearBuilt', e.target.value)} placeholder="e.g., 2010" className={uniformInputClass()} />
              </div>
              <div>
                <label htmlFor="lotSize" className={labelClass}>Lot Size</label>
                <input type="text" id="lotSize" value={tempState.lotSize} onChange={(e) => handleTempStateChange('lotSize', e.target.value)} placeholder="e.g., 500 sq meters" className={uniformInputClass()} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="parking" className={labelClass}>Parking</label>
                <input type="text" id="parking" value={tempState.parking} onChange={(e) => handleTempStateChange('parking', e.target.value)} placeholder="e.g., 2-car garage" className={uniformInputClass()} />
              </div>
              {!isLandProperty && (
                <>
                  <div>
                    <label htmlFor="heatingType" className={labelClass}>Heating Type</label>
                    <Dropdown options={heatingTypeOptions} value={tempState.heatingType} onChange={(value) => handleTempStateChange('heatingType', value)} placeholder="Select heating type" />
                </div>
                  <div>
                    <label htmlFor="coolingType" className={labelClass}>Cooling Type</label>
                    <Dropdown options={coolingTypeOptions} value={tempState.coolingType} onChange={(value) => handleTempStateChange('coolingType', value)} placeholder="Select cooling type" />
                  </div>
                </>
              )}
              {isLandProperty && (
                <>
                  <div>
                    <label htmlFor="landSize" className={labelClass}>Land Size</label>
                    <input type="text" id="landSize" value={tempState.landSize} onChange={(e) => handleTempStateChange('landSize', e.target.value)} placeholder="e.g., 600 sqm" className={uniformInputClass()} />
                  </div>
                  <div>
                    <label htmlFor="zoningType" className={labelClass}>Zoning Type</label>
                    <Dropdown options={zoningTypeOptions} value={tempState.zoningType} onChange={(value) => handleTempStateChange('zoningType', value)} placeholder="Select zoning type" />
                  </div>
                </>
              )}
            </div>
            <div>
              <label htmlFor="amenities" className={labelClass}>Amenities</label>
              <input type="text" id="amenities" value={tempState.amenities} onChange={(e) => handleTempStateChange('amenities', e.target.value)} placeholder="e.g., Pool, Gym, Security" className={uniformInputClass()} />
            </div>
            {isLandProperty && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="titleType" className={labelClass}>Title Type</label>
                  <Dropdown options={titleTypeOptions} value={tempState.titleType} onChange={(value) => handleTempStateChange('titleType', value)} placeholder="Select title type" />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {userRole === 'admin' && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
            <h2 className={sectionTitleClass}>Admin Options</h2>
            <div className="flex justify-center items-center space-x-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={tempState.isFeatured}
                onChange={(e) => handleTempStateChange('isFeatured', e.target.checked)}
                className={`h-5 w-5 rounded-md focus:ring-green-500 border ${darkMode ? "bg-gray-800 border-gray-600 checked:bg-green-600" : "border-gray-300 checked:bg-green-600"}`}
              />
              <label htmlFor="is_featured" className={`${labelClass} mb-0 font-bold`}>Mark as Featured Listing (Admin Only)</label>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center">
          <button type="submit" className="w-full md:w-1/3 bg-green-700 text-white py-3 px-6 rounded-2xl hover:bg-green-800 text-sm transition-all duration-300 shadow-md">Update Listing</button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default EditListing;
// src/pages/AddListing.js
import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config'; // Assuming API_BASE_URL is defined here
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook

const App = () => {
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

  // New state variables for property_details
  const [description, setDescription] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [heatingType, setHeatingType] = useState('');
  const [coolingType, setCoolingType] = useState('');
  const [parking, setParking] = useState('');
  const [amenities, setAmenities] = useState('');

  const { darkMode } = useTheme(); // Use the dark mode context

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

  const onDrop = (acceptedFiles) => {
    setImages(prev => [...prev, ...acceptedFiles]);
    // If no thumbnail is set, set the first newly added image as thumbnail
    if (thumbnailIndex === null && allImages.length === 0 && acceptedFiles.length > 0) {
      setThumbnailIndex(0); // Index in the combined array
    } else if (thumbnailIndex !== null && allImages.length > 0 && acceptedFiles.length > 0) {
        // If thumbnail was set before adding new files, its index might shift
        // Need to recalculate thumbnail index based on new images added before it
        // For simplicity, we'll just keep the current thumbnail index if it's valid
        // A more robust solution would involve finding the old thumbnail in the new array
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: 'image/*' });

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImageURLs(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
       // If no thumbnail is set, set the first newly added URL as thumbnail
      if (thumbnailIndex === null && allImages.length === 0 && imageURLs.length === 0) {
          setThumbnailIndex(images.length); // Index in the combined array
      }
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
      if (thumbnailIndex === null && (newImagesArray.length > 0 || newImageURLsArray.length > 0)) {
           setThumbnailIndex(0);
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


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Combine all images for final check and sending
    const allImagesCombined = [...images, ...imageURLs];

    if (allImagesCombined.length === 0) {
      // Use a custom message box instead of alert
      // For simplicity, I'll use a console log here, but in a real app,
      // you'd render a modal or a toast notification.
      console.error('Please upload at least one image.');
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

    // Append property_details to formData
    formData.append('description', description);
    formData.append('square_footage', squareFootage);
    formData.append('lot_size', lotSize);
    formData.append('year_built', yearBuilt);
    formData.append('heating_type', heatingType);
    formData.append('cooling_type', coolingType);
    formData.append('parking', parking);
    formData.append('amenities', amenities);


    // Ensure a thumbnail is selected
    if (thumbnailIndex === null || thumbnailIndex >= allImagesCombined.length) {
         console.error('Please set a thumbnail image.');
         return;
    }
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
        console.error('Authentication token not found. Please sign in.');
        // Optionally navigate to login page
        // navigate('/signin');
        return;
    }


    try {
      // Include the Authorization header with the Bearer token
      await axios.post(`${API_BASE_URL}/listings`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data', // Important for file uploads
            'Authorization': `Bearer ${token}` // Include the JWT token
        }
      });

      console.log('Listing added successfully!');
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
       // navigate('/admin/listings');

    } catch (error) {
      console.error('Error adding listing:', error.response?.data || error.message);
      // Use a custom message box instead of alert
      // For simplicity, I'll use a console log here, but in a real app,
      // you'd render a modal or a toast notification.
      console.error('Failed to add listing.');
    }
  };


  const inputStyles = `mt-1 block w-full py-3 px-4 rounded-xl shadow-outer text-sm ${
    darkMode
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
      : "bg-green-50 border-green-200 text-gray-800 placeholder-green-400"
  }`;


  return (
    <div className={`flex items-center justify-center min-h-screen p-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
  const inputStyles = "mt-1 block w-full py-3 px-4 bg-green-50 border border-green-200 text-gray-800 rounded-xl shadow-outer text-sm placeholder-green-400";


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 md:p-6">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`rounded-2xl shadow-2xl w-full max-w-2xl p-8 space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <motion.h2
          className={`text-2xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 space-y-6"
      >
        <motion.h2
          className="text-2xl font-bold text-green-700 text-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          Add Property Listing
        </motion.h2>

        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Purchase Category</label>
            <label className="block text-sm font-medium text-gray-700">Purchase Category</label>
            <select value={purchaseCategory} onChange={(e) => setPurchaseCategory(e.target.value)} className={inputStyles}>
              <option value="Rent">Rent</option>
              <option value="Sale">Sale</option>
              <option value="Lease">Lease</option>
              <option value="Short Let">Short Let</option>
              <option value="Long Let">Long Let</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Title</label>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              // Modified onChange handler to capitalize the first letter
              onChange={(e) => setTitle(capitalizeFirstLetter(e.target.value))}
              className={inputStyles}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Location</label>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              // Modified onChange handler to capitalize the first letter
              onChange={(e) => setLocation(capitalizeFirstLetter(e.target.value))}
              className={inputStyles}
              required
            />
          </div>

          {/* State Dropdown */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>State</label>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <select
              value={stateValue}
              onChange={(e) => setStateValue(e.target.value)}
              className={inputStyles} // Apply existing input styles
              required
            >
              <option value="">Select State</option> {/* Default option */}
              {/* Map over Nigerian states to create options */}
              {nigerianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Property Type</label>
            <label className="block text-sm font-medium text-gray-700">Property Type</label>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputStyles} required>
              <option value="">Select Property Type</option>
              <option value="Duplex">Duplex</option>
              <option value="Bungalow">Bungalow</option>
              <option value="Apartment">Apartment</option>
              <option value="Penthouse">Penthouse</option>
              <option value="Detached House">Detached House</option>
              <option value="Semi-Detached House">Semi-Detached House</option>
              <option value="Condo">Condo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Bedrooms</label>
              <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputStyles} required />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Bathrooms</label>
              <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
              <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputStyles} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
              <input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputStyles} required />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            <label className="block text-sm font-medium text-gray-700">
              {purchaseCategory === 'Rent' ? 'Price (₦ / Year)' :
                purchaseCategory === 'Sale' ? 'Price (₦)' :
                  purchaseCategory === 'Lease' ? 'Price (₦ / Lease)' :
                    purchaseCategory === 'Short Let' ? 'Price (₦ / Night)' :
                      'Price (₦ / Month)'}
            </label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputStyles} required />
          </div>

          {/* New fields for property_details */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Description</label>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputStyles}
              rows="4"
              placeholder="Detailed description of the property..."
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Square Footage</label>
              <label className="block text-sm font-medium text-gray-700">Square Footage</label>
              <input
                type="number"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
                className={inputStyles}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Lot Size (sqft or acres)</label>
              <label className="block text-sm font-medium text-gray-700">Lot Size (sqft or acres)</label>
              <input
                type="number"
                step="0.01"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className={inputStyles}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Year Built</label>
            <label className="block text-sm font-medium text-gray-700">Year Built</label>
            <input
              type="number"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
              className={inputStyles}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Heating Type</label>
              <label className="block text-sm font-medium text-gray-700">Heating Type</label>
              <input
                type="text"
                value={heatingType}
                onChange={(e) => setHeatingType(e.target.value)}
                className={inputStyles}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Cooling Type</label>
              <label className="block text-sm font-medium text-gray-700">Cooling Type</label>
              <input
                type="text"
                value={coolingType}
                onChange={(e) => setCoolingType(e.target.value)}
                className={inputStyles}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Parking</label>
            <label className="block text-sm font-medium text-gray-700">Parking</label>
            <input
              type="text"
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              className={inputStyles}
              placeholder="e.g., Garage, Street, Driveway"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Amenities (comma-separated)</label>
            <label className="block text-sm font-medium text-gray-700">Amenities (comma-separated)</label>
            <textarea
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              className={inputStyles}
              rows="3"
              placeholder="e.g., Pool, Gym, Balcony, Garden"
            ></textarea>
          </div>

          <div {...getRootProps()} className={`p-6 border-dashed border-2 rounded-2xl cursor-pointer text-center ${
            darkMode
              ? "border-gray-600 bg-gray-700 text-gray-300"
              : "border-gray-300 bg-gray-50 text-gray-600"
          }`}>
          <div {...getRootProps()} className="p-6 border-dashed border-2 border-gray-300 rounded-2xl cursor-pointer bg-gray-50 text-sm text-gray-600 text-center">
            <input {...getInputProps()} />
            Drag & drop or click to select images
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Or Add Image URL</label>
            <label className="block text-sm font-medium text-gray-700">Or Add Image URL</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className={`flex-grow py-3 px-4 border rounded-2xl text-sm ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                className="flex-grow py-3 px-4 border border-gray-300 rounded-2xl text-sm"
                placeholder="https://example.com/image.jpg"
              />
              <button type="button" onClick={handleAddImageUrl} className="bg-green-600 text-white px-4 py-2 rounded-2xl hover:bg-green-700 text-sm">Add</button>
            </div>
          </div>

          {(allImages.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {allImages.map((item, index) => (
                <motion.div
                  key={item instanceof File ? item.name : item} // Use file name or URL as key
                  className={`border p-2 rounded-2xl relative ${index === thumbnailIndex ? 'border-green-500 ring-2 ring-green-500' : ''} ${
                    darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                  }`} // Highlight thumbnail
                  className={`border p-2 rounded-2xl relative ${index === thumbnailIndex ? 'border-green-500 ring-2 ring-green-500' : ''}`} // Highlight thumbnail
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
                    className="absolute top-1 right-1 text-red-600 bg-white rounded-full p-1 shadow" // Styled remove button
                  >✕</button>
                  <button
                    type="button"
                    onClick={() => setThumbnailIndex(index)}
                    className={`text-xs underline mt-1 block ${darkMode ? "text-green-400" : "text-green-700"}`}
                    className="text-xs text-green-700 underline mt-1 block"
                  >{thumbnailIndex === index ? 'Thumbnail (Selected)' : 'Set as Thumbnail'}</button>
                  {/* Add move buttons if needed - requires more complex state management */}
                </motion.div>
              ))}
            </div>
          )}

          <button type="submit" className="w-full bg-green-700 text-white py-3 px-6 rounded-2xl hover:bg-green-800 text-sm">
            Submit Listing
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
};

export default App;

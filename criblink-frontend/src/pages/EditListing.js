// src/pages/admin/EditListing.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate
import API_BASE_URL from '../config'; // Assuming API_BASE_URL is defined
import { useTheme } from '../layouts/AppShell'; // Import useTheme hook

const App = () => {
    const { id } = useParams(); // Get the listing ID from the URL
    const navigate = useNavigate(); // Initialize useNavigate
    const { darkMode } = useTheme(); // Use the dark mode context

    const [listing, setListing] = useState(null); // State to hold the fetched listing data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states, initialized from fetched listing data
    const [purchaseCategory, setPurchaseCategory] = useState('');
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [stateValue, setStateValue] = useState(''); // Assuming 'state' is stored as stateValue
    const [propertyType, setPropertyType] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [bathrooms, setBathrooms] = useState('');
    const [price, setPrice] = useState('');
    const [status, setStatus] = useState(''); // Add status state

    // New state variables for property_details
    const [description, setDescription] = useState('');
    const [squareFootage, setSquareFootage] = useState('');
    const [lotSize, setLotSize] = useState('');
    const [yearBuilt, setYearBuilt] = useState('');
    const [heatingType, setHeatingType] = useState('');
    const [coolingType, setCoolingType] = useState('');
    const [parking, setParking] = useState('');
    const [amenities, setAmenities] = useState('');

    // Image handling states
    const [existingImages, setExistingImages] = useState([]); // Array of existing image objects { url }
    const [newImages, setNewImages] = useState([]); // Array of new File objects from dropzone
    const [imageUrlInput, setImageUrlInput] = useState(''); // For adding new images via URL
    const [newImageURLs, setNewImageURLs] = useState([]); // Array of new image URLs added via input

    // State to track the currently selected thumbnail by its identifier (URL or filename)
    const [thumbnailIdentifier, setThumbnailIdentifier] = useState(null);

    // Effect to fetch the listing data when the component mounts or ID changes
    useEffect(() => {
        const fetchListing = async () => {
            setLoading(true); // Set loading to true before fetching
            setError(null); // Clear any previous errors
            try {
                // Fetch listing data from the backend using the ID from the URL
                const response = await axios.get(`${API_BASE_URL}/listings/${id}`);
                const fetchedListing = response.data;

                // Check if listing data was returned
                if (!fetchedListing) {
                     setError('Listing not found.');
                     setLoading(false);
                     return;
                }

                setListing(fetchedListing);

                // Populate form states with fetched data
                setPurchaseCategory(fetchedListing.purchase_category || '');
                setTitle(fetchedListing.title || '');
                setLocation(fetchedListing.location || '');
                setStateValue(fetchedListing.state || ''); // Assuming 'state' is the column name in your DB
                setPropertyType(fetchedListing.property_type || '');
                setBedrooms(fetchedListing.bedrooms || '');
                setBathrooms(fetchedListing.bathrooms || '');
                setPrice(fetchedListing.price || '');
                setStatus(fetchedListing.status || ''); // Populate status

                // Populate property_details states
                setDescription(fetchedListing.description || '');
                setSquareFootage(fetchedListing.square_footage || '');
                setLotSize(fetchedListing.lot_size || '');
                setYearBuilt(fetchedListing.year_built || '');
                setHeatingType(fetchedListing.heating_type || '');
                setCoolingType(fetchedListing.cooling_type || '');
                setParking(fetchedListing.parking || '');
                setAmenities(fetchedListing.amenities || '');

                // Populate existing images state
                const initialExistingImages = [];
                 // Assuming image_url is the main image URL and gallery_images is an array of URLs
                if (fetchedListing.image_url) {
                     initialExistingImages.push({ url: fetchedListing.image_url });
                     // Set the initial thumbnail identifier to the main image URL
                     setThumbnailIdentifier(fetchedListing.image_url);
                }
                 // Assuming gallery_images is stored in a gallery_images column as an array of URLs
                 // You might need to adjust this based on your actual database schema
                if (fetchedListing.gallery_images && Array.isArray(fetchedListing.gallery_images)) {
                     fetchedListing.gallery_images.forEach(url => {
                         // Avoid adding the main image again if it's also in gallery_images
                         if (url !== fetchedListing.image_url) {
                             initialExistingImages.push({ url: url });
                         }
                     });
                }
                setExistingImages(initialExistingImages);


                setLoading(false); // Set loading to false after successful fetch
            } catch (err) {
                console.error('Error fetching listing:', err);
                setError('Failed to fetch listing.'); // Set error message
                setLoading(false); // Set loading to false
            }
        };

        // Only attempt to fetch if a listing ID is present in the URL
        if (id) {
            fetchListing();
        } else {
             // If no ID is provided in the URL
             setLoading(false);
             setError('No listing ID provided.');
        }

    }, [id]); // Dependency array includes 'id' so effect reruns if ID changes

    // Dropzone configuration for handling file uploads
    const onDrop = (acceptedFiles) => {
        // Add new files to the newImages state
        setNewImages(prev => [...prev, ...acceptedFiles]);
        // If no thumbnail is currently set, set the first newly added file as thumbnail
        if (thumbnailIdentifier === null && acceptedFiles.length > 0) {
             setThumbnailIdentifier(acceptedFiles[0].name); // Use filename as identifier for new files
        }
    };

    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: 'image/*' }); // Accept only image files

    // Handler for adding image URLs from input
    const handleAddImageUrl = () => {
        if (imageUrlInput.trim()) {
            const newUrl = imageUrlInput.trim();
            // Add the trimmed URL to the newImageURLs state
            setNewImageURLs(prev => [...prev, newUrl]);
            // Clear the input field
            setImageUrlInput('');
            // If no thumbnail is currently set, set the newly added URL as thumbnail
            if (thumbnailIdentifier === null) {
                 setThumbnailIdentifier(newUrl); // Use URL as identifier for URLs
            }
        }
    };

    // Handler for removing images (existing, new file, or new URL)
    const handleRemoveImage = (identifier, type) => {
        if (type === 'existing') {
            // Remove existing image by URL identifier
            setExistingImages(prev => prev.filter(img => img.url !== identifier));
        } else if (type === 'newFile') {
            // Remove new file by filename identifier
            setNewImages(prev => prev.filter(file => file.name !== identifier));
        } else if (type === 'newUrl') {
             // Remove new URL by URL identifier
             setNewImageURLs(prev => prev.filter(url => url !== identifier));
        }

        // If the removed image was the thumbnail, clear the thumbnail identifier
        if (thumbnailIdentifier === identifier) {
             setThumbnailIdentifier(null);
        }
         // TODO: Implement logic to re-assign thumbnail if the removed one was the thumbnail
         // A simple approach is to set the first remaining image as the thumbnail if the removed one was the thumbnail.
         // This would require checking the combined list after removal.
    };

     // Function to set a specific image as the thumbnail
     const setAsThumbnail = (identifier) => {
         // Set the thumbnail identifier to the identifier of the clicked image
         setThumbnailIdentifier(identifier);
     };


    // Helper function to capitalize the first letter of a string
    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };


    // Handler for form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission

        // Basic validation to ensure required fields are filled
        if (!title || !location || !price || !status || !propertyType || !bedrooms || !bathrooms || !purchaseCategory) {
            console.error('Please fill in all required fields.');
            return;
        }

        // Ensure a thumbnail is selected
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
        formData.append('status', status); // Add status to form data
        formData.append('purchase_category', purchaseCategory);

        // Append property_details to formData
        formData.append('description', description);
        formData.append('square_footage', squareFootage);
        formData.append('lot_size', lotSize);
        formData.append('year_built', yearBuilt);
        formData.append('heating_type', heatingType);
        formData.append('cooling_type', coolingType);
        formData.append('parking', parking);
        formData.append('amenities', amenities);

        // Handle images in FormData for the backend
        // Send a list of existing image URLs that should be KEPT in the database
        const existingImageUrlsToKeep = existingImages.map(img => img.url);
        formData.append('existingImageUrlsToKeep', JSON.stringify(existingImageUrlsToKeep));

        // Send new image URLs added via input
        formData.append('newImageUrls', JSON.stringify(newImageURLs));

        // Append new image files from the dropzone
        newImages.forEach(file => {
            formData.append('newImages', file); // Append each new file under the key 'newImages'
        });

         // Identify the main image to send to the backend using the stored identifier
         formData.append('mainImageIdentifier', thumbnailIdentifier);


        // Retrieve the JWT token from local storage (or wherever you store it after login)
        const token = localStorage.getItem('token'); // Assuming you store the token in localStorage

        if (!token) {
            console.error('Authentication token not found. Please sign in.');
            // Optionally redirect to login page
            // navigate('/signin');
            return;
        }


        try {
            // Send PUT or PATCH request to update the listing at the specific ID endpoint
            // Your backend updateListing function will NEED to be updated to parse this FormData,
            // handle existing images (delete those not in existingImageUrlsToKeep),
            // process new file uploads ('newImages'), handle new URLs ('newImageUrls'),
            // and update the main image URL based on 'mainImageIdentifier'.
            const response = await axios.put(`${API_BASE_URL}/listings/${id}`, formData, {
                 headers: {
                    'Content-Type': 'multipart/form-data', // Important for sending files
                    // Include authorization header if your backend requires it:
                    'Authorization': `Bearer ${token}` // Include the JWT token
                 }
            });

            // Check for a successful response status code (e.g., 200 OK)
            if (response.status === 200) {
                 console.log('Listing updated successfully!');
                 navigate('/admin/listings'); // Redirect back to the listings page after successful update
            } else {
                 // Handle unexpected status codes from the backend
                 console.error(`Failed to update listing. Server returned status: ${response.status}`);
            }

        } catch (error) {
            // Log the error and show an alert to the user
            console.error('Error updating listing:', error.response?.data || error.message);
            console.error('Failed to update listing.');
        }
    };

    // Hardcoded categories for the dropdown (consider fetching dynamically from backend)
     const purchaseCategories = ["Sale", "Rent", "Lease", "Short Let", "Long Let"];
     // Hardcoded status options for the dropdown (match with your backend/database)
     const statusOptions = ["available", "sold", "under offer", "pending", "approved", "rejected", "featured"];


    // Tailwind CSS classes for consistent input styling
    const inputStyles = `mt-1 block w-full py-3 px-4 rounded-xl shadow-outer text-sm ${
      darkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
        : "bg-green-50 border-green-200 text-gray-800 placeholder-green-400"
    }`;


    // Render loading state while fetching listing data
    if (loading) {
        return (
             <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                 <p className={`text-lg ${darkMode ? "text-green-400" : "text-green-700"}`}>Loading listing...</p>
             </div>
        );
    }

    // Render error state if fetching failed or no ID was provided
    if (error) {
        return (
            <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                 <p className={`text-lg ${darkMode ? "text-red-400" : "text-red-600"}`}>Error: {error}</p>
            </div>
        );
    }

    // Render "Listing not found" if fetch was successful but no data was returned
    if (!listing) {
         // This case should ideally be caught by the error state if fetch returns 404
         // but as a fallback check
         return (
              <div className={`flex justify-center items-center min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                 <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Listing not found.</p>
             </div>
         );
    }


    // Combine all images for rendering and manipulation
    // Use a structure that allows identifying the original source (existing, new file, new URL)
    const allImagesForDisplay = [
        ...existingImages.map(img => ({ ...img, source: 'existing' })),
        ...newImages.map(file => ({ url: URL.createObjectURL(file), file, source: 'newFile' })), // Create temporary URL for rendering new files
        ...newImageURLs.map(url => ({ url, source: 'newUrl' }))
    ];

    // Helper to get identifier for a given image item
    const getImageIdentifier = (item) => {
        if (item.source === 'existing' || item.source === 'newUrl') {
            return item.url;
        } else if (item.source === 'newFile') {
            return item.file.name;
        }
        return null; // Should not happen
    };


    return (
        <div className={`flex items-center justify-center min-h-screen p-4 md:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
            {/* Main content area for the edit form */}
            <main className="space-y-6 w-full max-w-2xl">
                {/* Animated form container */}
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className={`rounded-2xl shadow-2xl w-full p-8 space-y-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} // Removed mx-auto as it's now handled by parent flex
                >
                    {/* Animated form title */}
                    <motion.h2
                        className={`text-2xl font-bold text-center ${darkMode ? "text-green-400" : "text-green-700"}`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        Edit Listing: {listing.title} {/* Display current listing title */}
                    </motion.h2>

                    {/* Section for form fields */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                         {/* Purchase Category Dropdown */}
                         <div>
                            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Purchase Category</label>
                            <select value={purchaseCategory} onChange={(e) => setPurchaseCategory(e.target.value)} className={inputStyles}>
                                {/* Hardcoded categories - consider fetching dynamically */}
                                <option value="">Select Category</option>
                                 {purchaseCategories.map(category => (
                                     <option key={category} value={category}>{category}</option>
                                 ))}
                            </select>
                        </div>

                        {/* Title Input */}
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Title</label>
                            <input
                              type="text"
                              value={title}
                              // Modified onChange handler to capitalize the first letter
                              onChange={(e) => setTitle(capitalizeFirstLetter(e.target.value))}
                              className={inputStyles}
                              required
                            />
                        </div>

                        {/* Location Input */}
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Location</label>
                            <input
                              type="text"
                              value={location}
                              // Modified onChange handler to capitalize the first letter
                              onChange={(e) => setLocation(capitalizeFirstLetter(e.target.value))}
                              className={inputStyles}
                              required
                            />
                        </div>

                        {/* State Input */}
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>State</label>
                            <input
                              type="text"
                              value={stateValue}
                              // Modified onChange handler to capitalize the first letter
                              onChange={(e) => setStateValue(capitalizeFirstLetter(e.target.value))}
                              className={inputStyles}
                              required
                            />
                        </div>

                        {/* Property Type Dropdown */}
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Property Type</label>
                            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputStyles} required>
                                <option value="">Select Property Type</option>
                                 {/* Hardcoded property types - consider fetching dynamically */}
                                <option value="Duplex">Duplex</option>
                                <option value="Bungalow">Bungalow</option>
                                <option value="Apartment">Apartment</option>
                                <option value="Penthouse">Penthouse</option>
                                <option value="Detached House">Detached House</option>
                                <option value="Semi-Detached House">Semi-Detached House</option>
                                <option value="Condo">Condo</option>
                            </select>
                        </div>

                        {/* Bedrooms and Bathrooms Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Bedrooms</label>
                                <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputStyles} required />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Bathrooms</label>
                                <input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputStyles} required />
                            </div>
                        </div>

                        {/* Price Input with dynamic label */}
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                {purchaseCategory === 'Rent' ? 'Price (₦ / Year)' :
                                    purchaseCategory === 'Sale' ? 'Price (₦)' :
                                        purchaseCategory === 'Lease' ? 'Price (₦ / Lease)' :
                                            purchaseCategory === 'Short Let' ? 'Price (₦ / Night)' :
                                                'Price (₦ / Month)'} {/* Default label */}
                            </label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputStyles} required />
                        </div>

                         {/* Status Dropdown */}
                         <div>
                            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputStyles} required>
                                <option value="">Select Status</option>
                                {statusOptions.map(option => (
                                    <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        {/* New fields for property_details */}
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Description</label>
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
                                <input
                                    type="number"
                                    value={squareFootage}
                                    onChange={(e) => setSquareFootage(e.target.value)}
                                    className={inputStyles}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Lot Size (sqft or acres)</label>
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
                                <input
                                    type="text"
                                    value={heatingType}
                                    onChange={(e) => setHeatingType(e.target.value)}
                                    className={inputStyles}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Cooling Type</label>
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
                            <textarea
                                value={amenities}
                                onChange={(e) => setAmenities(e.target.value)}
                                className={inputStyles}
                                rows="3"
                                placeholder="e.g., Pool, Gym, Balcony, Garden"
                            ></textarea>
                        </div>


                        {/* Image Upload/Management Section */}
                         <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Images</label>

                            {/* Dropzone area for adding new images */}
                            <div {...getRootProps()} className={`p-6 border-dashed border-2 rounded-xl cursor-pointer text-center mb-4 ${
                              darkMode
                                ? "border-gray-600 bg-gray-700 text-gray-300"
                                : "border-gray-300 bg-gray-50 text-gray-600"
                            }`}>
                                <input {...getInputProps()} />
                                Drag & drop or click to add new images
                            </div>

                            {/* Input field for adding new images via URL */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    className={`flex-grow py-3 px-4 border rounded-xl text-sm ${
                                      darkMode
                                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                        : "bg-white border-gray-300 text-gray-900"
                                    }`}
                                    placeholder="Or add new image URL: https://example.com/image.jpg"
                                />
                                {/* Button to trigger adding the URL */}
                                <button type="button" onClick={handleAddImageUrl} className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 text-sm">Add URL</button>
                            </div>

                            {/* Display existing and new images */}
                            {(allImagesForDisplay.length > 0) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Map over all combined images to display them */}
                                    {allImagesForDisplay.map((item, index) => {
                                         const identifier = getImageIdentifier(item);
                                         const isThumbnail = identifier === thumbnailIdentifier;
                                         return (
                                            <motion.div
                                                key={identifier || index} // Use identifier as key, fallback to index
                                                // Highlight the thumbnail image
                                                className={`border p-2 rounded-xl relative ${isThumbnail ? 'border-green-500 ring-2 ring-green-500' : ''} ${
                                                  darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                                                }`}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <img
                                                    // Use temporary URL for new files, actual URL for existing/new URLs
                                                    src={item.url} // allImagesForDisplay items have a 'url' property
                                                    alt={`Listing Image ${index}`}
                                                    className="w-full h-32 object-cover rounded-lg" // Adjusted rounded corners
                                                />
                                                {/* Button to remove the image */}
                                                <button
                                                    type="button"
                                                    // Pass the identifier and source type to handleRemoveImage
                                                    onClick={() => handleRemoveImage(identifier, item.source)}
                                                    className="absolute top-1 right-1 text-red-600 bg-white rounded-full p-1 shadow" // Styled remove button
                                                >✕</button>
                                                {/* Button to set this image as the thumbnail */}
                                                <button
                                                    type="button"
                                                    onClick={() => setAsThumbnail(identifier)} // Pass the identifier
                                                    className={`text-xs underline mt-1 block ${darkMode ? "text-green-400" : "text-green-700"}`}
                                                >{isThumbnail ? 'Thumbnail (Selected)' : 'Set as Thumbnail'}</button>
                                                 {/* TODO: Add move buttons if needed - requires more complex state management */}
                                            </motion.div>
                                         );
                                    })}
                                </div>
                            )}
                         </div>


                        {/* Submit Button */}
                        <button type="submit" className="w-full bg-green-700 text-white py-3 px-6 rounded-xl hover:bg-green-800 text-sm">
                            Update Listing
                        </button>
                    </motion.div>
                </motion.form>
            </main>
        </div>
    );
};

export default EditListing;

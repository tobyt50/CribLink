const { pool } = require('../db');
const path = require('path'); // Import path module for file paths
const fs = require('fs').promises; // Import fs for file operations (using promises)
const logActivity = require('../utils/logActivity');

// Define the directory where uploaded images will be stored
// MAKE SURE this directory exists and is served statically by your Express app.
// Example: If your Express app serves static files from a 'public' folder,
// and this controller is in 'controllers', this path is relative to the controller.
// Adjust this path based on your project structure.
const uploadDir = path.join(__dirname, '../public/uploads/listings');

// Helper function to save a file and return its public URL
const saveFileAndGetUrl = async (file) => {
    if (!file) return null;

    try {
        // Ensure upload directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        // Create a unique filename
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`; // Replace spaces for safer filenames
        const filePath = path.join(uploadDir, fileName);

        // Write the file to the upload directory
        // In a real application, consider using streams for large files
        await fs.writeFile(filePath, file.buffer);

        // Return the public URL for the file
        // Assumes your server is configured to serve /uploads/listings statically
        // e.g., app.use('/uploads/listings', express.static(uploadDir));
        return `/uploads/listings/${fileName}`;
    } catch (error) {
        console.error('Error saving file:', error);
        throw new Error('Failed to save image file.'); // Re-throw to be caught by the main handler
    }
};

// Helper function to delete a file given its URL
const deleteFileByUrl = async (fileUrl) => {
    // Only attempt to delete files that look like local uploads
    if (!fileUrl || !fileUrl.startsWith('/uploads/listings/')) {
        // console.warn(`Attempted to delete non-local or invalid URL: ${fileUrl}`);
        return; // Do not attempt to delete external URLs
    }

    const fileName = path.basename(fileUrl);
    const filePath = path.join(uploadDir, fileName);

    try {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
    } catch (error) {
        // Ignore error if file doesn't exist (e.g., already deleted or path mismatch)
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting file ${filePath}:`, error);
        }
    }
};


// Get all property listings with optional filters
exports.getAllListings = async (req, res) => {
    try {
        // Extract agent_id from the query parameters
        const { purchase_category, search, min_price, max_price, agent_id } = req.query;
        // Select main listing details from property_listings
        let query = 'SELECT pl.property_id, pl.title, pl.state, pl.location, pl.price, pl.status, pl.agent_id, pl.date_listed, pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.image_url FROM property_listings pl';
        let conditions = [];
        let values = [];

        // Add agent_id filter if it exists in the query parameters
        if (agent_id) {
            conditions.push(`pl.agent_id = $${values.length + 1}`);
            values.push(agent_id);
        }

        if (purchase_category) {
            conditions.push(`pl.purchase_category ILIKE $${values.length + 1}`);
            values.push(purchase_category);
        }

        if (min_price) {
            conditions.push(`pl.price >= $${values.length + 1}`);
            values.push(min_price);
        }

        if (max_price) {
            conditions.push(`pl.price <= $${values.length + 1}`);
            values.push(max_price);
        }

        if (search && search.trim() !== '') {
            const keyword = `%${search.trim()}%`;
            const baseIndex = values.length + 1;

            conditions.push(`(\
                pl.title ILIKE $${baseIndex} OR\
                pl.location ILIKE $${baseIndex + 1} OR\
                pl.state ILIKE $${baseIndex + 2} OR\
                pl.property_type ILIKE $${baseIndex + 3}\
            )`);
            values.push(keyword, keyword, keyword, keyword);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Add an ORDER BY clause for consistent results, e.g., by date_listed descending
        query += ' ORDER BY pl.date_listed DESC';


        const result = await pool.query(query, values);

        // For each listing, fetch its gallery images from the property_images table
        const listingsWithGallery = await Promise.all(result.rows.map(async (listing) => {
            const galleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id', [listing.property_id]);
            listing.gallery_images = galleryResult.rows.map(row => row.image_url);
            return listing;
        }));


        res.status(200).json(listingsWithGallery);
    } catch (err) {
        console.error('Error fetching listings:', err);
        res.status(500).json({ error: 'Internal server error fetching listings' });
    }
};

// New endpoint to get distinct purchase categories
exports.getPurchaseCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT purchase_category FROM property_listings WHERE purchase_category IS NOT NULL AND purchase_category != \'\' ORDER BY purchase_category');
        const categories = result.rows.map(row => row.purchase_category);
        const allCategories = ["All", ...categories];
        res.status(200).json(allCategories);
    } catch (err) {
        console.error('Error fetching purchase categories:', err);
        res.status(500).json({ error: 'Internal server error fetching categories' });
    }
};


// Create a new listing
exports.createListing = async (req, res) => {
    // Expecting data from FormData, processed by upload.fields middleware
    const {
        title,
        location,
        state, // Assuming 'state' is sent from frontend
        price,
        status, // Status should probably default to 'pending' or similar on creation
        property_type,
        bedrooms,
        bathrooms,
        purchase_category,
        mainImageURL, // URL if main image is from URL input
        galleryImageURLs, // URLs if gallery images are from URL input (can be string or array)
        // New fields for property_details
        description,
        square_footage,
        lot_size,
        year_built,
        heating_type,
        cooling_type,
        parking,
        amenities
    } = req.body;

    // Uploaded files are available in req.files
    const mainImageFile = req.files && req.files['mainImage'] ? req.files['mainImage'][0] : null;
    const galleryFiles = req.files && req.files['galleryImages'] ? req.files['galleryImages'] : [];

    const agent_id = req.user.user_id; // Get agent_id from authenticated user
    const date_listed = new Date(); // Set date_listed to current date

    let mainImageUrlToSave = mainImageURL; // Start with URL if provided
    // Ensure galleryImageURLs is treated as an array
    const initialGalleryUrls = Array.isArray(galleryImageURLs) ? galleryImageURLs : (galleryImageURLs ? [galleryImageURLs] : []);
    const galleryUrlsToSave = [...initialGalleryUrls];


    try {
        // Start a database transaction
        await pool.query('BEGIN');

        // 1. Handle main image upload if it's a file
        if (mainImageFile) {
            mainImageUrlToSave = await saveFileAndGetUrl(mainImageFile);
        }

        // Ensure a main image URL exists before inserting the listing
        if (!mainImageUrlToSave) {
            await pool.query('ROLLBACK'); // Rollback transaction
            return res.status(400).json({ message: 'Main image is required' });
        }

        // 2. Insert listing into the property_listings table
        const listingResult = await pool.query(
            `INSERT INTO property_listings (title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, purchase_category, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING property_id`, // Return the newly created property_id
            [title, location, state, price, status || 'pending', agent_id, date_listed, property_type, bedrooms, bathrooms, purchase_category, mainImageUrlToSave]
        );

        const newListingId = listingResult.rows[0].property_id;

        // 3. Insert into property_details table if details are provided
        if (description || square_footage || lot_size || year_built || heating_type || cooling_type || parking || amenities) {
            await pool.query(
                `INSERT INTO property_details (property_id, description, square_footage, lot_size, year_built, heating_type, cooling_type, parking, amenities)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [newListingId, description, square_footage, lot_size, year_built, heating_type, cooling_type, parking, amenities]
            );
        }


        // 4. Handle gallery image uploads (files) and URLs, insert into property_images
        for (const file of galleryFiles) {
            const url = await saveFileAndGetUrl(file);
            if (url) {
                // Insert into property_images table
                await pool.query('INSERT INTO property_images (property_id, image_url) VALUES ($1, $2)', [newListingId, url]);
            }
        }

        // Handle gallery image URLs provided directly
        for (const url of initialGalleryUrls) {
            if (url) {
                // Insert into property_images table
                await pool.query('INSERT INTO property_images (property_id, image_url) VALUES ($1, $2)', [newListingId, url]);
            }
        }


        // Commit the transaction
        await pool.query('COMMIT');

        // Fetch the newly created listing with its gallery images and details for the response
        const createdListingResult = await pool.query(
            `SELECT
                pl.property_id, pl.title, pl.location, pl.state, pl.price, pl.status, pl.agent_id, pl.date_listed, pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.image_url,
                pd.description, pd.square_footage, pd.lot_size, pd.year_built, pd.heating_type, pd.cooling_type, pd.parking, pd.amenities,
                u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone
            FROM property_listings pl
            LEFT JOIN property_details pd ON pl.property_id = pd.property_id
            LEFT JOIN users u ON pl.agent_id = u.user_id
            WHERE pl.property_id = $1`,
            [newListingId]
        );
        const galleryImages = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id', [newListingId]);

        const responseListing = createdListingResult.rows[0];
        responseListing.gallery_images = galleryImages.rows.map(row => row.image_url);

        await logActivity(
            `Listing "${title}" created`,
            req.user,
            'listing'
          );          

        res.status(201).json(responseListing);

    } catch (err) {
        await pool.query('ROLLBACK'); // Rollback transaction in case of error
        console.error('Error creating listing:', err);
        // TODO: Implement cleanup for uploaded files if DB insert fails after file save
        res.status(500).json({ error: 'Internal server error creating listing' });
    }
};


// Get a single listing by ID
exports.getListingById = async (req, res) => {
    const { id } = req.params;

    try {
        // Select main listing details from property_listings and LEFT JOIN with property_details
        const listingResult = await pool.query(
            `SELECT
                pl.property_id, pl.title, pl.location, pl.state, pl.price, pl.status, pl.agent_id, pl.date_listed, pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.image_url,
                pd.description, pd.square_footage, pd.lot_size, pd.year_built, pd.heating_type, pd.cooling_type, pd.parking, pd.amenities,
                u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone
            FROM property_listings pl
            LEFT JOIN property_details pd ON pl.property_id = pd.property_id
            LEFT JOIN users u ON pl.agent_id = u.user_id
            WHERE pl.property_id = $1`,
            [id]
        );

        if (listingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const listing = listingResult.rows[0];

        // Fetch gallery images from the property_images table
        const galleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id', [id]);
        listing.gallery_images = galleryResult.rows.map(row => row.image_url);


        res.status(200).json(listing);
    } catch (err) {
        console.error('Error fetching listing by ID:', err);
        res.status(500).json({ error: 'Internal server error fetching listing' });
    }
};

// Update listing
exports.updateListing = async (req, res) => {
    const { id } = req.params;
    // Expecting data from FormData, processed by upload.fields middleware
    // Make all fields optional by providing default undefined or checking presence
    const {
        title,
        location,
        state,
        price,
        status, // Status is now an optional field for updates
        property_type,
        bedrooms,
        bathrooms,
        purchase_category,
        existingImageUrlsToKeep, // JSON string of URLs to keep
        newImageUrls, // JSON string of new URLs
        mainImageIdentifier, // Identifier of the selected thumbnail (can be URL or temporary file identifier)
        // New fields for property_details
        description,
        square_footage,
        lot_size,
        year_built,
        heating_type,
        cooling_type,
        parking,
        amenities
    } = req.body;

    // Uploaded files are available in req.files
    const mainImageFile = req.files && req.files['mainImageFile'] ? req.files['mainImageFile'][0] : null;
    const newGalleryFiles = req.files && req.files['newImages'] ? req.files['newImages'] : [];

    // Parse JSON strings from frontend, handle potential undefined/null
    const existingUrls = Array.isArray(existingImageUrlsToKeep) ? existingImageUrlsToKeep : (existingImageUrlsToKeep ? JSON.parse(existingImageUrlsToKeep) : []);
    const newUrls = Array.isArray(newImageUrls) ? newImageUrls : (newImageUrls ? JSON.parse(newImageUrls) : []);


    try {
        // Start a database transaction
        await pool.query('BEGIN');

        // Fetch the current listing data to compare images and get current main image URL
        const currentListingResult = await pool.query('SELECT image_url FROM property_listings WHERE property_id = $1 FOR UPDATE', [id]); // Use FOR UPDATE to lock the row
        if (currentListingResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found' });
        }
        const currentMainImageUrl = currentListingResult.rows[0].image_url;

        const currentGalleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1', [id]);
        const currentGalleryImages = currentGalleryResult.rows.map(row => row.image_url);

        // Build the SET clause for the UPDATE query dynamically for property_listings
        let updates = [];
        let values = [];
        let valueIndex = 1;

        // Add fields to update ONLY if they are present in the request body
        if (title !== undefined) { updates.push(`title = $${valueIndex++}`); values.push(title); }
        if (location !== undefined) { updates.push(`location = $${valueIndex++}`); values.push(location); }
        if (state !== undefined) { updates.push(`state = $${valueIndex++}`); values.push(state); }
        if (price !== undefined) { updates.push(`price = $${valueIndex++}`); values.push(price); }
        if (status !== undefined) { updates.push(`status = $${valueIndex++}`); values.push(status); } // Allow status updates
        if (property_type !== undefined) { updates.push(`property_type = $${valueIndex++}`); values.push(property_type); }
        if (bedrooms !== undefined) { updates.push(`bedrooms = $${valueIndex++}`); values.push(bedrooms); }
        if (bathrooms !== undefined) { updates.push(`bathrooms = $${valueIndex++}`); values.push(bathrooms); }
        if (purchase_category !== undefined) { updates.push(`purchase_category = $${valueIndex++}`); values.push(purchase_category); }


        // --- Handle Image Updates Conditionally ---
        // Only process image updates if related fields are provided in the request
        const imageUpdateRequested = mainImageFile || mainImageIdentifier !== undefined || newGalleryFiles.length > 0 || newUrls.length > 0 || existingUrls !== undefined;

        if (imageUpdateRequested) {
            // 1. Determine the new main image URL and handle old main image deletion
            let newMainImageUrl = null;
            let oldMainImageToDelete = null;

            if (mainImageFile) {
                // If a new main image file was uploaded, save it
                newMainImageUrl = await saveFileAndGetUrl(mainImageFile);
                // If the old main image was a local file, mark it for deletion
                if (currentMainImageUrl && currentMainImageUrl.startsWith('/uploads/listings/')) {
                    oldMainImageToDelete = currentMainImageUrl;
                }
            } else if (mainImageIdentifier !== undefined) { // Allow setting main image to an existing one, a new URL, or potentially null/empty
                newMainImageUrl = mainImageIdentifier === '' ? null : mainImageIdentifier; // Treat empty string as clearing main image
                // If the old main image was a local file and is different from the new main image, mark it for deletion
                if (currentMainImageUrl && currentMainImageUrl.startsWith('/uploads/listings/') && currentMainImageUrl !== newMainImageUrl) {
                    oldMainImageToDelete = currentMainImageUrl;
                }
            } else {
                // If no main image file or identifier is provided, keep the current main image
                newMainImageUrl = currentMainImageUrl;
            }

            // Add main image URL to updates if it has changed or if an image update was requested
            if (newMainImageUrl !== currentMainImageUrl || imageUpdateRequested) {
                updates.push(`image_url = $${valueIndex++}`); values.push(newMainImageUrl);
            }


            // 2. Determine the new set of gallery image URLs and identify gallery images to delete
            let updatedGalleryUrls = [];
            const galleryImagesToDelete = [];

            // Collect all potential new gallery URLs from existing kept, new URLs, and new files
            const potentialNewGalleryUrls = [
                ...currentGalleryImages.filter(url => existingUrls.includes(url)), // Existing URLs to keep
                ...newUrls // New URLs from input
            ];

            // Add new gallery files
            for (const file of newGalleryFiles) {
                const url = await saveFileAndGetUrl(file);
                if (url) {
                    potentialNewGalleryUrls.push(url);
                }
            }

            // Filter out the new main image if it's also in the gallery list
            updatedGalleryUrls = potentialNewGalleryUrls.filter(url => url !== newMainImageUrl);

            // Identify existing gallery images that are NOT in the updated set and are local files
            currentGalleryImages.forEach(url => {
                if (!updatedGalleryUrls.includes(url) && url && url.startsWith('/uploads/listings/')) {
                    galleryImagesToDelete.push(url);
                }
            });


            // 3. Delete old image files from the file system
            if (oldMainImageToDelete) {
                await deleteFileByUrl(oldMainImageToDelete);
            }
            for (const url of galleryImagesToDelete) {
                await deleteFileByUrl(url);
            }

            // 4. Update the property_images table: Delete existing gallery images for this listing
            await pool.query('DELETE FROM property_images WHERE property_id = $1', [id]);

            // 5. Insert the updated set of gallery images into the property_images table
            for (const url of updatedGalleryUrls) {
                await pool.query('INSERT INTO property_images (property_id, image_url) VALUES ($1, $2)', [id, url]);
            }
        }
        // --- End Conditional Image Handling ---

        // Update property_listings table
        if (updates.length > 0) {
            const query = `UPDATE property_listings SET ${updates.join(', ')} WHERE property_id = $${valueIndex++} RETURNING *`;
            values.push(id);
            await pool.query(query, values);
        }

        // Handle property_details update/insert
        const propertyDetailsFields = {
            description, square_footage, lot_size, year_built,
            heating_type, cooling_type, parking, amenities
        };

        const existingPropertyDetails = await pool.query('SELECT property_details_id FROM property_details WHERE property_id = $1', [id]);

        if (existingPropertyDetails.rows.length > 0) {
            // Update existing property_details
            let detailUpdates = [];
            let detailValues = [];
            let detailValueIndex = 1;

            for (const key in propertyDetailsFields) {
                if (propertyDetailsFields[key] !== undefined) {
                    detailUpdates.push(`${key} = $${detailValueIndex++}`);
                    detailValues.push(propertyDetailsFields[key]);
                }
            }

            if (detailUpdates.length > 0) {
                const detailQuery = `UPDATE property_details SET ${detailUpdates.join(', ')}, last_updated = NOW() WHERE property_id = $${detailValueIndex++}`;
                detailValues.push(id);
                await pool.query(detailQuery, detailValues);
            }
        } else {
            // Insert new property_details if any detail field is provided
            const providedDetails = Object.keys(propertyDetailsFields).filter(key => propertyDetailsFields[key] !== undefined);
            if (providedDetails.length > 0) {
                const columns = ['property_id', ...providedDetails];
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                const valuesToInsert = [id, ...providedDetails.map(key => propertyDetailsFields[key])];

                await pool.query(
                    `INSERT INTO property_details (${columns.join(', ')}) VALUES (${placeholders})`,
                    valuesToInsert
                );
            }
        }


        if (updates.length === 0 && Object.keys(propertyDetailsFields).every(key => propertyDetailsFields[key] === undefined)) {
            // If no fields were provided for update (including status and property_details), return a message
            await pool.query('ROLLBACK');
            return res.status(400).json({ message: 'No valid fields provided for update' });
        }


        // Commit the transaction
        await pool.query('COMMIT');

        await logActivity(
            `Listing "${title || 'ID ' + id}" updated${status ? ` (status: ${status})` : ''}`,
            req.user,
            'listing'
          );

        // Fetch the updated listing with its gallery images and details for the response
        const updatedListingResult = await pool.query(
            `SELECT
                pl.property_id, pl.title, pl.location, pl.state, pl.price, pl.status, pl.agent_id, pl.date_listed, pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.image_url,
                pd.description, pd.square_footage, pd.lot_size, pd.year_built, pd.heating_type, pd.cooling_type, pd.parking, pd.amenities,
                u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone
            FROM property_listings pl
            LEFT JOIN property_details pd ON pl.property_id = pd.property_id
            LEFT JOIN users u ON pl.agent_id = u.user_id
            WHERE pl.property_id = $1`,
            [id]
        );
        const updatedGalleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id', [id]);

        const responseListing = updatedListingResult.rows[0];
        responseListing.gallery_images = updatedGalleryResult.rows.map(row => row.image_url);


        res.status(200).json(responseListing);

    } catch (err) {
        await pool.query('ROLLBACK'); // Rollback transaction in case of error
        console.error('Error updating listing:', err);
        // TODO: Implement rollback/cleanup for newly uploaded files if DB update fails after file save
        res.status(500).json({ error: 'Internal server error updating listing', details: err.message });
    }
};

// Delete listing
exports.deleteListing = async (req, res) => {
    const { id } = req.params;

    try {
        // Start a database transaction
        await pool.query('BEGIN');

        // Fetch the listing first to get image URLs for deletion
        const listingResult = await pool.query('SELECT image_url FROM property_listings WHERE property_id = $1', [id]);
        const listing = listingResult.rows[0];

        if (!listing) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Optional: Add authorization check here to ensure only authorized users can delete
        // For example, check if req.user.role is 'admin' or if req.user.user_id matches listing.agent_id

        // Fetch gallery images associated with the listing
        const galleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1', [id]);
        const galleryImages = galleryResult.rows.map(row => row.image_url);

        // Delete image files associated with the listing (main and gallery)
        const imagesToDelete = [];
        if (listing.image_url && listing.image_url.startsWith('/uploads/listings/')) {
            imagesToDelete.push(listing.image_url);
        }
        galleryImages.forEach(url => {
            if (url && url.startsWith('/uploads/listings/')) {
                imagesToDelete.push(url);
            }
        });

        for (const url of imagesToDelete) {
            await deleteFileByUrl(url);
        }

        // Delete gallery image records from property_images table
        await pool.query('DELETE FROM property_images WHERE property_id = $1', [id]);
        // The CASCADE constraint on property_details will handle deletion from that table automatically
        // when the property_listings entry is deleted.

        // Delete listing from the property_listings table
        const deleteResult = await pool.query('DELETE FROM property_listings WHERE property_id = $1 RETURNING *', [id]);

        if (deleteResult.rows.length === 0) {
            // This case should be rare after the initial check, but included for safety
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found after deletion attempt' });
        }

        // Commit the transaction
        await pool.query('COMMIT');

        await logActivity(
            `Listing "${id}" deleted`,
            req.user,
            'listing'
          );

        res.status(200).json({ message: 'Listing deleted successfully' });
    } catch (err) {
        await pool.query('ROLLBACK'); // Rollback transaction in case of error
        console.error('Error deleting listing:', err);
        res.status(500).json({ error: 'Internal server error deleting listing' });
    }
};

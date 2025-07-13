const { pool } = require('../db');
const logActivity = require('../utils/logActivity');
const { uploadToCloudinary, deleteFromCloudinary, getCloudinaryPublicId } = require('../utils/cloudinary'); // Import Cloudinary utilities

exports.getAllListings = async (req, res) => {
  try {
    const {
      purchase_category,
      search,
      min_price,
      max_price,
      page,
      limit,
      status,
      agent_id,
      sortBy,
      // Add new advanced filter parameters here
      location,
      property_type,
      bedrooms,
      bathrooms
    } = req.query;

    const userRole = req.user ? req.user.role : 'guest';
    const userId = req.user ? req.user.user_id : null;

    let baseQuery = 'FROM property_listings pl';
    let conditions = [];
    let values = [];
    let valueIndex = 1;

    const normalizedStatus = status?.toLowerCase();

    // 1. Enforce specific status (e.g. Featured) across all roles if provided
    if (status && normalizedStatus !== 'all' && normalizedStatus !== 'all statuses') {
      conditions.push(`pl.status ILIKE $${valueIndex++}`);
      values.push(status);
    } else {
      // 2. Role-based default filtering
      if (userRole === 'client' || userRole === 'visitor' || userRole === 'guest') {
        conditions.push(`pl.status ILIKE ANY($${valueIndex++})`);
        values.push(['available', 'featured', 'sold', 'under offer']);
      } else if (userRole === 'agent') {
        conditions.push(`(pl.status ILIKE ANY($${valueIndex++}) OR pl.agent_id = $${valueIndex++})`);
        values.push(['available', 'featured', 'sold', 'under offer'], userId);

        if (agent_id && String(agent_id) === String(userId)) {
          conditions.push(`pl.agent_id = $${valueIndex++}`);
          values.push(agent_id);
        }
      }
      // Admin has full access if no status is specified (no filtering needed)
    }

    // 3. Additional filters
    if (purchase_category && purchase_category.toLowerCase() !== 'all') {
      conditions.push(`pl.purchase_category ILIKE $${valueIndex++}`);
      values.push(purchase_category);
    }

    if (min_price) {
      conditions.push(`pl.price >= $${valueIndex++}`);
      values.push(min_price);
    }

    if (max_price) {
      conditions.push(`pl.price <= $${valueIndex++}`);
      values.push(max_price);
    }

    // Add new conditions for advanced filters
    if (location) {
      conditions.push(`pl.location ILIKE $${valueIndex++}`);
      values.push(`%${location}%`);
    }

    if (property_type) {
      conditions.push(`pl.property_type ILIKE $${valueIndex++}`);
      values.push(`%${property_type}%`);
    }

    if (bedrooms) {
      conditions.push(`pl.bedrooms = $${valueIndex++}`);
      values.push(parseInt(bedrooms)); // Assuming bedrooms is an integer
    }

    if (bathrooms) {
      conditions.push(`pl.bathrooms = $${valueIndex++}`);
      values.push(parseInt(bathrooms)); // Assuming bathrooms is an integer
    }

    if (search && search.trim() !== '') {
      const keyword = `%${search.trim()}%`;
      conditions.push(`(
        pl.title ILIKE $${valueIndex} OR
        pl.location ILIKE $${valueIndex + 1} OR
        pl.state ILIKE $${valueIndex + 2} OR
        pl.property_type ILIKE $${valueIndex + 3}
      )`);
      values.push(keyword, keyword, keyword, keyword);
      valueIndex += 4;
    }

    // 4. Where clause
    let whereClause = '';
    if (conditions.length > 0) {
      whereClause = ' WHERE ' + conditions.join(' AND ');
    }

    // 5. Pagination and Sorting
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let orderByClause = 'ORDER BY pl.date_listed DESC';
    if (sortBy === 'date_listed_asc') {
      orderByClause = 'ORDER BY pl.date_listed ASC';
    } else if (sortBy === 'price_desc') {
      orderByClause = 'ORDER BY pl.price DESC';
    } else if (sortBy === 'price_asc') {
      orderByClause = 'ORDER BY pl.price ASC';
    }

    // 6. Query building
    const query = `SELECT pl.* ${baseQuery} ${whereClause} ${orderByClause} LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
    values.push(limitNum, offset);

    const countQuery = `SELECT COUNT(*) ${baseQuery} ${whereClause}`;
    const countValues = values.slice(0, values.length - 2);

    const [listingsResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues)
    ]);

    const totalListings = parseInt(countResult.rows[0].count);

    const listingsWithGallery = await Promise.all(
      listingsResult.rows.map(async (listing) => {
        const galleryResult = await pool.query(
          'SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id',
          [listing.property_id]
        );
        listing.gallery_images = galleryResult.rows.map((row) => row.image_url);
        return listing;
      })
    );

    res.status(200).json({
      listings: listingsWithGallery,
      total: totalListings,
      totalPages: Math.ceil(totalListings / limitNum),
      currentPage: pageNum
    });
  } catch (err) {
    console.error('Error fetching listings:', err);
    res
      .status(500)
      .json({ error: 'Internal server error fetching listings', details: err.message });
  }
};


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

exports.createListing = async (req, res) => {
    const {
        title,
        location,
        state,
        price,
        status,
        property_type,
        bedrooms,
        bathrooms,
        purchase_category,
        description,
        square_footage,
        lot_size,
        year_built,
        heating_type,
        cooling_type,
        parking,
        amenities,
        mainImageBase64, // Base64 string for a new main image upload
        mainImageOriginalName, // Original name for a new main image upload
        mainImageURL, // URL for an existing image to be set as main
        galleryImagesBase64, // Array of base64 strings for new gallery images
        galleryImagesOriginalNames, // Array of original names for new gallery images
        galleryImageURLs // Array of existing URLs for gallery images
    } = req.body;

    const agent_id = req.user ? req.user.user_id : null;
    if (!agent_id) {
        return res.status(401).json({ message: 'Authentication required to create a listing.' });
    }

    const date_listed = new Date();
    let mainImageUrlToSave = null;
    let mainImagePublicIdToSave = null;
    const initialGalleryUrls = Array.isArray(galleryImageURLs) ? galleryImageURLs : (galleryImageURLs ? [galleryImageURLs] : []);

    try {
        await pool.query('BEGIN');

        // Determine main image URL and public ID
        if (mainImageBase64 && mainImageOriginalName) {
            // New image uploaded as base64
            const uploadResult = await uploadToCloudinary(Buffer.from(mainImageBase64.split(',')[1], 'base64'), mainImageOriginalName, 'listings');
            mainImageUrlToSave = uploadResult.url;
            mainImagePublicIdToSave = uploadResult.publicId;
        } else if (mainImageURL) {
            // Existing image URL provided as main image
            mainImageUrlToSave = mainImageURL;
            mainImagePublicIdToSave = getCloudinaryPublicId(mainImageURL);
        }
        // If neither is provided, mainImageUrlToSave and mainImagePublicIdToSave remain null, making the main image optional.

        const listingResult = await pool.query(
            `INSERT INTO property_listings (title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, purchase_category, image_url, image_public_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING property_id`,
            [title, location, state, price, status || 'pending', agent_id, date_listed, property_type, bedrooms, bathrooms, purchase_category, mainImageUrlToSave, mainImagePublicIdToSave]
        );

        const newListingId = listingResult.rows[0].property_id;

        // Insert into property_details only if any optional detail field is provided and not empty/null
        const propertyDetailsFields = {
            description, square_footage, lot_size, year_built,
            heating_type, cooling_type, parking, amenities
        };

        // Filter out fields that are undefined, null, or empty strings
        const providedDetails = Object.keys(propertyDetailsFields).filter(key =>
            propertyDetailsFields[key] !== undefined &&
            propertyDetailsFields[key] !== null &&
            propertyDetailsFields[key] !== '' // Treat empty strings as not provided for optional fields upon creation
        );

        if (providedDetails.length > 0) {
            const columns = ['property_id', ...providedDetails];
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const valuesToInsert = [newListingId, ...providedDetails.map(key => propertyDetailsFields[key])];

            await pool.query(
                `INSERT INTO property_details (${columns.join(', ')}) VALUES (${placeholders})`,
                valuesToInsert
            );
        }

        // Upload new gallery images to Cloudinary
        if (galleryImagesBase64 && Array.isArray(galleryImagesBase64)) {
            for (let i = 0; i < galleryImagesBase64.length; i++) {
                const base64 = galleryImagesBase64[i];
                const originalname = galleryImagesOriginalNames[i];
                const uploadResult = await uploadToCloudinary(Buffer.from(base64.split(',')[1], 'base64'), originalname, 'listings');
                if (uploadResult.url) {
                    await pool.query('INSERT INTO property_images (property_id, image_url, public_id) VALUES ($1, $2, $3)', [newListingId, uploadResult.url, uploadResult.publicId]);
                }
            }
        }

        // Insert existing gallery URLs (if any were passed from the frontend)
        for (const url of initialGalleryUrls) {
            if (url) { // Ensure URL is not empty
                const publicId = getCloudinaryPublicId(url); // Derive public_id from URL
                await pool.query('INSERT INTO property_images (property_id, image_url, public_id) VALUES ($1, $2, $3)', [newListingId, url, publicId]);
            }
        }

        await pool.query('COMMIT');

        const createdListingResult = await pool.query(
            `SELECT
                pl.property_id, pl.title, pl.location, pl.state, pl.price, pl.status, pl.agent_id, pl.date_listed, pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.image_url, pl.image_public_id,
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
        await pool.query('ROLLBACK');
        console.error('Error creating listing:', err);
        res.status(500).json({ error: 'Internal server error creating listing', details: err.message });
    }
};

exports.getListingById = async (req, res) => {
    const { id } = req.params;

    try {
        const listingResult = await pool.query(
            `SELECT
                pl.property_id, pl.title, pl.location, pl.state, pl.price, pl.status, pl.agent_id, pl.date_listed, pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.image_url, pl.image_public_id,
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

        const galleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id', [id]);
        listing.gallery_images = galleryResult.rows.map(row => row.image_url);

        res.status(200).json(listing);
    } catch (err) {
        console.error('Error fetching listing by ID:', err);
        res.status(500).json({ error: 'Internal server error fetching listing' });
    }
};

exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const {
        title,
        location,
        state,
        price,
        status,
        property_type,
        bedrooms,
        bathrooms,
        purchase_category,
        existingImageUrlsToKeep, // URLs of existing images to retain
        newImageUrls, // New URLs added by user
        mainImageIdentifier, // Identifier for the main image (URL or new base64 temp ID)
        description,
        square_footage,
        lot_size,
        year_built,
        heating_type,
        cooling_type,
        parking,
        amenities,
        newImagesBase64, // New: array of base64 strings for new files
        newImagesOriginalNames // New: array of original names for new files
    } = req.body;

    const existingUrls = Array.isArray(existingImageUrlsToKeep) ? existingImageUrlsToKeep : (existingImageUrlsToKeep ? JSON.parse(existingImageUrlsToKeep) : []);
    const newUrls = Array.isArray(newImageUrls) ? newImageUrls : (newImageUrls ? JSON.parse(newImageUrls) : []);
    const newFilesBase64 = Array.isArray(newImagesBase64) ? newImagesBase64 : [];
    const newFilesOriginalNames = Array.isArray(newImagesOriginalNames) ? newFilesOriginalNames : [];

    try {
        await pool.query('BEGIN');

        const currentListingResult = await pool.query('SELECT image_url, image_public_id FROM property_listings WHERE property_id = $1 FOR UPDATE', [id]);
        if (currentListingResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found' });
        }
        const { image_url: currentMainImageUrl, image_public_id: currentMainImagePublicId } = currentListingResult.rows[0];

        const currentGalleryResult = await pool.query('SELECT image_url, public_id FROM property_images WHERE property_id = $1', [id]);
        const currentGalleryImages = currentGalleryResult.rows.map(row => ({ url: row.image_url, publicId: row.public_id }));

        let updates = [];
        let values = [];
        let valueIndex = 1;

        // Add fields to update if they are explicitly provided in the request body
        if (title !== undefined) { updates.push(`title = $${valueIndex++}`); values.push(title); }
        if (location !== undefined) { updates.push(`location = $${valueIndex++}`); values.push(location); }
        if (state !== undefined) { updates.push(`state = $${valueIndex++}`); values.push(state); }
        if (price !== undefined) { updates.push(`price = $${valueIndex++}`); values.push(price); }
        if (status !== undefined) { updates.push(`status = $${valueIndex++}`); values.push(status); }
        if (property_type !== undefined) { updates.push(`property_type = $${valueIndex++}`); values.push(property_type); }
        if (bedrooms !== undefined) { updates.push(`bedrooms = $${valueIndex++}`); values.push(bedrooms); }
        if (bathrooms !== undefined) { updates.push(`bathrooms = $${valueIndex++}`); values.push(bathrooms); }
        if (purchase_category !== undefined) { updates.push(`purchase_category = $${valueIndex++}`); values.push(purchase_category); }

        // --- Image Handling Logic ---
        let newMainImageUrl = currentMainImageUrl;
        let newMainImagePublicId = currentMainImagePublicId;

        // Determine the new main image
        if (mainImageIdentifier !== undefined) { // Check if identifier was sent at all
            if (mainImageIdentifier === null || mainImageIdentifier === '') {
                // Explicitly set to no main image
                newMainImageUrl = null;
                newMainImagePublicId = null;
            } else {
                // Check if mainImageIdentifier is a new base64 image
                const newImageFileIndex = newFilesOriginalNames.indexOf(mainImageIdentifier);
                if (newImageFileIndex !== -1) {
                    const uploadResult = await uploadToCloudinary(Buffer.from(newFilesBase64[newImageFileIndex].split(',')[1], 'base64'), newFilesOriginalNames[newImageFileIndex], 'listings');
                    newMainImageUrl = uploadResult.url;
                    newMainImagePublicId = uploadResult.publicId;
                } else {
                    // It's an existing URL or a new URL provided directly
                    newMainImageUrl = mainImageIdentifier;
                    newMainImagePublicId = getCloudinaryPublicId(mainImageIdentifier);
                }
            }
        }

        // If main image URL changed, update it and delete the old one from Cloudinary
        if (newMainImageUrl !== currentMainImageUrl) {
            updates.push(`image_url = $${valueIndex++}`);
            values.push(newMainImageUrl);
            updates.push(`image_public_id = $${valueIndex++}`);
            values.push(newMainImagePublicId);

            if (currentMainImagePublicId) {
                await deleteFromCloudinary(currentMainImagePublicId);
            }
        }

        // Process gallery images
        let updatedGalleryUrls = [];
        let updatedGalleryPublicIds = [];
        const imagesToDeleteFromCloudinary = [];

        // Add existing images that are kept
        currentGalleryImages.forEach(img => {
            if (existingUrls.includes(img.url) && img.url !== newMainImageUrl) { // Ensure it's not the new main image
                updatedGalleryUrls.push(img.url);
                updatedGalleryPublicIds.push(img.publicId);
            } else if (!existingUrls.includes(img.url) && img.publicId) {
                // If an existing gallery image is NOT in the 'to keep' list, mark for deletion
                imagesToDeleteFromCloudinary.push(img.publicId);
            }
        });

        // Add new URLs
        newUrls.forEach(url => {
            if (url !== newMainImageUrl) { // Ensure it's not the new main image
                updatedGalleryUrls.push(url);
                updatedGalleryPublicIds.push(getCloudinaryPublicId(url));
            }
        });

        // Upload and add new files
        for (let i = 0; i < newFilesBase64.length; i++) {
            const base64 = newFilesBase64[i];
            const originalname = newFilesOriginalNames[i];
            const uploadResult = await uploadToCloudinary(Buffer.from(base64.split(',')[1], 'base64'), originalname, 'listings');
            if (uploadResult.url && uploadResult.url !== newMainImageUrl) {
                updatedGalleryUrls.push(uploadResult.url);
                updatedGalleryPublicIds.push(uploadResult.publicId);
            } else if (uploadResult.publicId && uploadResult.url === newMainImageUrl) {
                // If a newly uploaded image became the main image, ensure it's not added to gallery
                // and its publicId is not marked for deletion from gallery.
                // This case is handled by the main image logic.
            }
        }

        // Perform deletions from Cloudinary for removed gallery images
        for (const publicId of imagesToDeleteFromCloudinary) {
            await deleteFromCloudinary(publicId);
        }

        // Clear existing gallery images from DB and insert the updated set
        await pool.query('DELETE FROM property_images WHERE property_id = $1', [id]);
        for (let i = 0; i < updatedGalleryUrls.length; i++) {
            await pool.query('INSERT INTO property_images (property_id, image_url, public_id) VALUES ($1, $2, $3)', [id, updatedGalleryUrls[i], updatedGalleryPublicIds[i]]);
        }


        if (updates.length > 0) {
            const query = `UPDATE property_listings SET ${updates.join(', ')} WHERE property_id = $${valueIndex++} RETURNING *`;
            values.push(id);
            await pool.query(query, values);
        }

        const propertyDetailsFields = {
            description, square_footage, lot_size, year_built,
            heating_type, cooling_type, parking, amenities
        };

        const existingPropertyDetails = await pool.query('SELECT property_details_id FROM property_details WHERE property_id = $1', [id]);

        if (existingPropertyDetails.rows.length > 0) {
            let detailUpdates = [];
            let detailValues = [];
            let detailValueIndex = 1;

            for (const key in propertyDetailsFields) {
                // Update if the field is explicitly provided (not undefined)
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
            // If property_details record does not exist, insert it if any optional field is provided and not empty/null
            const providedDetails = Object.keys(propertyDetailsFields).filter(key =>
                propertyDetailsFields[key] !== undefined &&
                propertyDetailsFields[key] !== null &&
                propertyDetailsFields[key] !== ''
            );
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

        // This check needs to be more nuanced if mainImageIdentifier can be null/empty to clear an image
        // The condition `imagesToDeleteFromCloudinary.length === 0 && newFilesBase64.length === 0 && newUrls.length === 0`
        // effectively means no image changes. If mainImageIdentifier changes from a URL to null, that's a valid change.
        // The `updates.length === 0` would catch changes to main image.
        // So, the original check is mostly fine, but the image part of it might be slightly misleading.
        // However, if the frontend sends a payload with no changes, this will prevent an empty update.
        if (updates.length === 0 && Object.keys(propertyDetailsFields).every(key => propertyDetailsFields[key] === undefined) && imagesToDeleteFromCloudinary.length === 0 && newFilesBase64.length === 0 && newUrls.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ message: 'No valid fields provided for update' });
        }


        await pool.query('COMMIT');

        await logActivity(
            `Listing "${title || 'ID ' + id}" updated${status ? ` (status: ${status})` : ''}`,
            req.user,
            'listing'
          );

        const updatedListingResult = await pool.query(
            `SELECT
                pl.property_id, pl.title, pl.location, pl.state, pl.price, pl.status, pl.agent_id, pl.date_listed, pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.image_url, pl.image_public_id,
                pd.description, pd.square_footage, pd.lot_size, pd.year_built, pd.heating_type, pd.cooling_type, pd.parking, pd.amenities,
                u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone
            FROM property_listings pl
            LEFT JOIN property_details pd ON pl.property_id = pd.property_id
            LEFT JOIN users u ON pl.agent_id = u.user_id
            WHERE pl.property_id = $1`,
            [id]
        );
        const galleryImages = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id', [id]);

        const responseListing = updatedListingResult.rows[0];
        responseListing.gallery_images = galleryImages.rows.map(row => row.image_url);

        res.status(200).json(responseListing);

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error updating listing:', err);
        res.status(500).json({ error: 'Internal server error updating listing', details: err.message });
    }
};

exports.deleteListing = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('BEGIN');

        const listingResult = await pool.query('SELECT image_url, image_public_id FROM property_listings WHERE property_id = $1', [id]);
        const listing = listingResult.rows[0];

        if (!listing) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found' });
        }

        const galleryResult = await pool.query('SELECT image_url, public_id FROM property_images WHERE property_id = $1', [id]);
        const galleryImages = galleryResult.rows.map(row => ({ url: row.image_url, publicId: row.public_id }));

        const publicIdsToDelete = [];
        if (listing.image_public_id) {
            publicIdsToDelete.push(listing.image_public_id);
        }
        galleryImages.forEach(img => {
            if (img.publicId) {
                publicIdsToDelete.push(img.publicId);
            }
        });

        for (const publicId of publicIdsToDelete) {
            await deleteFromCloudinary(publicId);
        }

        await pool.query('DELETE FROM property_images WHERE property_id = $1', [id]);
        const deleteResult = await pool.query('DELETE FROM property_listings WHERE property_id = $1 RETURNING *', [id]);

        if (deleteResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found after deletion attempt' });
        }

        await pool.query('COMMIT');

        await logActivity(
            `Listing "${id}" deleted`,
            req.user,
            'listing'
          );

        res.status(200).json({ message: 'Listing deleted successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error deleting listing:', err);
        res.status(500).json({ error: 'Internal server error deleting listing' });
    }
};

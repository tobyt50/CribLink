const { pool } = require('../db');
const path = require('path');
const fs = require('fs').promises;
const logActivity = require('../utils/logActivity');

const uploadDir = path.join(__dirname, '../public/uploads/listings');

const saveFileAndGetUrl = async (file) => {
    if (!file) return null;
    try {
        await fs.mkdir(uploadDir, { recursive: true });
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, file.buffer);
        return `/uploads/listings/${fileName}`;
    } catch (error) {
        console.error('Error saving file:', error);
        throw new Error('Failed to save image file.');
    }
};

const deleteFileByUrl = async (fileUrl) => {
    if (!fileUrl || !fileUrl.startsWith('/uploads/listings/')) {
        return;
    }
    const fileName = path.basename(fileUrl);
    const filePath = path.join(uploadDir, fileName);
    try {
        await fs.unlink(filePath);
        // console.log(`Deleted file: ${filePath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting file ${filePath}:`, error);
        }
    }
};

exports.getAllListings = async (req, res) => {
    // console.log('[getAllListings] Function started.');
    // console.log('[getAllListings] req.user:', req.user);

    try {
        const { purchase_category, search, min_price, max_price, page, limit, status, agent_id, sortBy } = req.query; // Destructure sortBy
        // console.log('[getAllListings] Query parameters:', { purchase_category, search, min_price, max_price, page, limit, status, agent_id, sortBy });

        const userRole = req.user ? req.user.role : 'guest';
        const userId = req.user ? req.user.user_id : null;

        // console.log(`[getAllListings] Determined userRole: ${userRole}, userId: ${userId}`);

        let baseQuery = 'FROM property_listings pl';
        let conditions = [];
        let values = [];
        let valueIndex = 1;

        // Apply role-based filtering
        if (userRole === 'client' || userRole === 'visitor' || userRole === 'guest') {
            conditions.push(`pl.status ILIKE $${valueIndex++}`);
            values.push('available');
            // console.log('[getAllListings] Condition: Filtering for available listings (client/visitor/guest) using ILIKE.');
        } else if (userRole === 'agent') {
            if (agent_id && String(agent_id) === String(userId)) {
                conditions.push(`pl.agent_id = $${valueIndex++}`);
                values.push(agent_id);
                // console.log(`[getAllListings] Condition: Filtering for agent (${agent_id}): only agent's own listings.`);

                if (status && status.toLowerCase() !== 'all' && status.toLowerCase() !== 'all statuses') {
                    conditions.push(`pl.status ILIKE $${valueIndex++}`);
                    values.push(status);
                    // console.log(`[getAllListings] Filter: Agent-specific status filter: ${status}.`);
                }
            } else {
                conditions.push(`(pl.status ILIKE $${valueIndex++} OR pl.agent_id = $${valueIndex++})`);
                values.push('available', userId);
                // console.log(`[getAllListings] Condition: Filtering for agent (${userId}): available OR agent's own listings (for Home.js).`);
            }
        } else if (userRole === 'admin') {
            if (status && status.toLowerCase() !== 'all' && status.toLowerCase() !== 'all statuses') {
                conditions.push(`pl.status ILIKE $${valueIndex++}`);
                values.push(status);
                // console.log(`[getAllListings] Condition: Admin user with explicit status filter: ${status}.`);
            } else {
                // console.log('[getAllListings] Condition: Admin user, showing all listings (no status filter applied).');
            }
        }

        // Add other filters (purchase_category, search, min_price, max_price)
        if (purchase_category && purchase_category.toLowerCase() !== 'all') {
            conditions.push(`pl.purchase_category ILIKE $${valueIndex++}`);
            values.push(purchase_category);
            // console.log(`[getAllListings] Filter: Added purchase_category: ${purchase_category}`);
        }

        if (min_price) {
            conditions.push(`pl.price >= $${valueIndex++}`);
            values.push(min_price);
            // console.log(`[getAllListings] Filter: Added min_price: ${min_price}`);
        }

        if (max_price) {
            conditions.push(`pl.price <= $${valueIndex++}`);
            values.push(max_price);
            // console.log(`[getAllListings] Filter: Added max_price: ${max_price}`);
        }

        if (search && search.trim() !== '') {
            const keyword = `%${search.trim()}%`;
            conditions.push(`(\
                pl.title ILIKE $${valueIndex} OR\
                pl.location ILIKE $${valueIndex + 1} OR\
                pl.state ILIKE $${valueIndex + 2} OR\
                pl.property_type ILIKE $${valueIndex + 3}\
            )`);
            values.push(keyword, keyword, keyword, keyword);
            valueIndex += 4;
            // console.log(`[getAllListings] Filter: Added search term: ${search}`);
        }

        let whereClause = '';
        if (conditions.length > 0) {
            whereClause = ' WHERE ' + conditions.join(' AND ');
            // console.log('[getAllListings] Conditions applied to main and count queries.');
        } else {
            // console.log('[getAllListings] No specific conditions applied, fetching all based on role.');
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offset = (pageNum - 1) * limitNum;

        // Determine sorting order
        let orderByClause = 'ORDER BY pl.date_listed DESC'; // Default sort
        if (sortBy === 'date_listed_asc') {
            orderByClause = 'ORDER BY pl.date_listed ASC';
        }
        // console.log(`[getAllListings] Sorting order: ${orderByClause}`);

        let query = `SELECT pl.* ${baseQuery} ${whereClause} ${orderByClause} LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
        values.push(limitNum, offset);

        const countQuery = `SELECT COUNT(*) ${baseQuery} ${whereClause}`;
        const countValues = values.slice(0, values.length - 2);

        // console.log('[getAllListings] Final SQL Query:', query);
        // console.log('[getAllListings] Query Values:', values);
        // console.log('[getAllListings] Final Count Query:', countQuery);
        // console.log('[getAllListings] Count Query Values:', countValues);

        const [listingsResult, countResult] = await Promise.all([
            pool.query(query, values),
            pool.query(countQuery, countValues)
        ]);

        const totalListings = parseInt(countResult.rows[0].count);
        // console.log(`[getAllListings] Database query executed. Total rows: ${totalListings}, Fetched rows: ${listingsResult.rows.length}`);

        const listingsWithGallery = await Promise.all(listingsResult.rows.map(async (listing) => {
            const galleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id', [listing.property_id]);
            listing.gallery_images = galleryResult.rows.map(row => row.image_url);
            return listing;
        }));

        // console.log(`[getAllListings] Fetched ${listingsWithGallery.length} listings with gallery images.`);
        res.status(200).json({
            listings: listingsWithGallery,
            total: totalListings,
            totalPages: Math.ceil(totalListings / limitNum),
            currentPage: pageNum
        });
        // console.log('[getAllListings] Response sent successfully.');

    } catch (err) {
        console.error('Error fetching listings:', err);
        res.status(500).json({ error: 'Internal server error fetching listings', details: err.message });
        // console.log('[getAllListings] Error response sent.');
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
        mainImageURL,
        galleryImageURLs,
        description,
        square_footage,
        lot_size,
        year_built,
        heating_type,
        cooling_type,
        parking,
        amenities
    } = req.body;

    const mainImageFile = req.files && req.files['mainImage'] ? req.files['mainImage'][0] : null;
    const galleryFiles = req.files && req.files['galleryImages'] ? req.files['galleryImages'] : [];

    const agent_id = req.user ? req.user.user_id : null;
    if (!agent_id) {
        return res.status(401).json({ message: 'Authentication required to create a listing.' });
    }

    const date_listed = new Date();
    let mainImageUrlToSave = mainImageURL;
    const initialGalleryUrls = Array.isArray(galleryImageURLs) ? galleryImageURLs : (galleryImageURLs ? [galleryImageURLs] : []);

    try {
        await pool.query('BEGIN');

        if (mainImageFile) {
            mainImageUrlToSave = await saveFileAndGetUrl(mainImageFile);
        }

        if (!mainImageUrlToSave) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ message: 'Main image is required' });
        }

        const listingResult = await pool.query(
            `INSERT INTO property_listings (title, location, state, price, status, agent_id, date_listed, property_type, bedrooms, bathrooms, purchase_category, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING property_id`,
            [title, location, state, price, status || 'pending', agent_id, date_listed, property_type, bedrooms, bathrooms, purchase_category, mainImageUrlToSave]
        );

        const newListingId = listingResult.rows[0].property_id;

        if (description || square_footage || lot_size || year_built || heating_type || cooling_type || parking || amenities) {
            await pool.query(
                `INSERT INTO property_details (property_id, description, square_footage, lot_size, year_built, heating_type, cooling_type, parking, amenities)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [newListingId, description, square_footage, lot_size, year_built, heating_type, cooling_type, parking, amenities]
            );
        }

        for (const file of galleryFiles) {
            const url = await saveFileAndGetUrl(file);
            if (url) {
                await pool.query('INSERT INTO property_images (property_id, image_url) VALUES ($1, $2)', [newListingId, url]);
            }
        }

        for (const url of initialGalleryUrls) {
            if (url) {
                await pool.query('INSERT INTO property_images (property_id, image_url) VALUES ($1, $2)', [newListingId, url]);
            }
        }

        await pool.query('COMMIT');

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
        await pool.query('ROLLBACK');
        console.error('Error creating listing:', err);
        res.status(500).json({ error: 'Internal server error creating listing' });
    }
};

exports.getListingById = async (req, res) => {
    const { id } = req.params;

    try {
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
        existingImageUrlsToKeep,
        newImageUrls,
        mainImageIdentifier,
        description,
        square_footage,
        lot_size,
        year_built,
        heating_type,
        cooling_type,
        parking,
        amenities
    } = req.body;

    const mainImageFile = req.files && req.files['mainImageFile'] ? req.files['mainImageFile'][0] : null;
    const newGalleryFiles = req.files && req.files['newImages'] ? req.files['newImages'] : [];

    const existingUrls = Array.isArray(existingImageUrlsToKeep) ? existingImageUrlsToKeep : (existingImageUrlsToKeep ? JSON.parse(existingImageUrlsToKeep) : []);
    const newUrls = Array.isArray(newImageUrls) ? newImageUrls : (newImageUrls ? JSON.parse(newImageUrls) : []);

    try {
        await pool.query('BEGIN');

        const currentListingResult = await pool.query('SELECT image_url FROM property_listings WHERE property_id = $1 FOR UPDATE', [id]);
        if (currentListingResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found' });
        }
        const currentMainImageUrl = currentListingResult.rows[0].image_url;

        const currentGalleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1', [id]);
        const currentGalleryImages = currentGalleryResult.rows.map(row => row.image_url);

        let updates = [];
        let values = [];
        let valueIndex = 1;

        if (title !== undefined) { updates.push(`title = $${valueIndex++}`); values.push(title); }
        if (location !== undefined) { updates.push(`location = $${valueIndex++}`); values.push(location); }
        if (state !== undefined) { updates.push(`state = $${valueIndex++}`); values.push(state); }
        if (price !== undefined) { updates.push(`price = $${valueIndex++}`); values.push(price); }
        if (status !== undefined) { updates.push(`status = $${valueIndex++}`); values.push(status); }
        if (property_type !== undefined) { updates.push(`property_type = $${valueIndex++}`); values.push(property_type); }
        if (bedrooms !== undefined) { updates.push(`bedrooms = $${valueIndex++}`); values.push(bedrooms); }
        if (bathrooms !== undefined) { updates.push(`bathrooms = $${valueIndex++}`); values.push(bathrooms); }
        if (purchase_category !== undefined) { updates.push(`purchase_category = $${valueIndex++}`); values.push(purchase_category); }

        const imageUpdateRequested = mainImageFile || mainImageIdentifier !== undefined || newGalleryFiles.length > 0 || newUrls.length > 0 || existingUrls !== undefined;

        if (imageUpdateRequested) {
            let newMainImageUrl = null;
            let oldMainImageToDelete = null;

            if (mainImageFile) {
                newMainImageUrl = await saveFileAndGetUrl(mainImageFile);
                if (currentMainImageUrl && currentMainImageUrl.startsWith('/uploads/listings/')) {
                    oldMainImageToDelete = currentMainImageUrl;
                }
            } else if (mainImageIdentifier !== undefined) {
                newMainImageUrl = mainImageIdentifier === '' ? null : mainImageIdentifier;
                if (currentMainImageUrl && currentMainImageUrl.startsWith('/uploads/listings/') && currentMainImageUrl !== newMainImageUrl) {
                    oldMainImageToDelete = currentMainImageUrl;
                }
            } else {
                newMainImageUrl = currentMainImageUrl;
            }

            if (newMainImageUrl !== currentMainImageUrl || imageUpdateRequested) {
                updates.push(`image_url = $${valueIndex++}`); values.push(newMainImageUrl);
            }

            let updatedGalleryUrls = [];
            const galleryImagesToDelete = [];

            const potentialNewGalleryUrls = [
                ...currentGalleryImages.filter(url => existingUrls.includes(url)),
                ...newUrls
            ];

            for (const file of newGalleryFiles) {
                const url = await saveFileAndGetUrl(file);
                if (url) {
                    potentialNewGalleryUrls.push(url);
                }
            }

            updatedGalleryUrls = potentialNewGalleryUrls.filter(url => url !== newMainImageUrl);

            currentGalleryImages.forEach(url => {
                if (!updatedGalleryUrls.includes(url) && url && url.startsWith('/uploads/listings/')) {
                    galleryImagesToDelete.push(url);
                }
            });

            if (oldMainImageToDelete) {
                await deleteFileByUrl(oldMainImageToDelete);
            }
            for (const url of galleryImagesToDelete) {
                await deleteFileByUrl(url);
            }

            await pool.query('DELETE FROM property_images WHERE property_id = $1', [id]);

            for (const url of updatedGalleryUrls) {
                await pool.query('INSERT INTO property_images (property_id, image_url) VALUES ($1, $2)', [id, url]);
            }
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
                pl.property_id, pl.title, pl.location, pl.state, pl.price, pl.status, pl.agent_id, pl.date_listed, pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.image_url,
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

        const listingResult = await pool.query('SELECT image_url FROM property_listings WHERE property_id = $1', [id]);
        const listing = listingResult.rows[0];

        if (!listing) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found' });
        }

        const galleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1', [id]);
        const galleryImages = galleryResult.rows.map(row => row.image_url);

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

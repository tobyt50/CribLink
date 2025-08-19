const { pool } = require('../db');
const logActivity = require('../utils/logActivity');
const { uploadToCloudinary, deleteFromCloudinary, getCloudinaryPublicId } = require('../utils/cloudinary'); // Import Cloudinary utilities
const SUBSCRIPTION_TIERS = require('../config/subscriptionConfig');
const nigeriaLocations = require('../config/nigeriaLocations.json');

// Helper function to attach gallery images to a listing object
const attachGalleryImages = async (listing) => {
  const galleryResult = await pool.query(
    'SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id',
    [listing.property_id]
  );
  listing.gallery_images = galleryResult.rows.map((row) => row.image_url);
  return listing;
};

// Helper function to attach gallery images to an array of listings
const attachGalleryImagesToList = async (listings) => {
  return await Promise.all(listings.map(attachGalleryImages));
};

exports.getAllListings = async (req, res) => {
  try {
    const {
      purchase_category, search, min_price, max_price, page, limit, status,
      agent_id, sortBy, location, state, property_type, bedrooms, bathrooms,
      land_size, zoning_type, title_type, agency_id: queryAgencyId
    } = req.query;

    const userRole = req.user ? req.user.role : 'guest';
    const userId = req.user ? req.user.user_id : null;
    const userAgencyId = req.user ? req.user.agency_id : null;

    let baseQuery = `
      FROM property_listings pl
      LEFT JOIN property_details pd ON pl.property_id = pd.property_id
      LEFT JOIN users u ON pl.agent_id = u.user_id
      LEFT JOIN agencies a ON pl.agency_id = a.agency_id
    `;
    let conditions = [];
    let values = [];
    let valueIndex = 1;

    // --- Status handling ---
    const normalizedStatus = status?.toLowerCase();
    if (status && normalizedStatus !== 'all' && normalizedStatus !== 'all statuses') {
        if (normalizedStatus === 'featured') {
          conditions.push(`pl.is_featured = TRUE AND pl.featured_expires_at > NOW()`);
        } else {
          conditions.push(`pl.status ILIKE $${valueIndex++}`);
          values.push(status);
        }
      } else {
        if (userRole === 'client' || userRole === 'guest') {
          // 🔒 Only show available listings to clients/guests
          conditions.push(`pl.status ILIKE $${valueIndex++}`);
          values.push('available');
        } else if (userRole === 'agent') {
          conditions.push(`(pl.status ILIKE ANY($${valueIndex++}) OR pl.agent_id = $${valueIndex++})`);
          values.push(['available', 'sold', 'under offer'], userId);
        } else if (userRole === 'agency_admin' && userAgencyId) {
          conditions.push(`((pl.agency_id = $${valueIndex++}) OR (pl.agency_id != $${valueIndex++} AND pl.status ILIKE ANY($${valueIndex++})))`);
          values.push(userAgencyId, userAgencyId, ['available', 'sold', 'under offer']);
        }
      }
      

    if (req.query.context === "home" && !status && !search) {
      conditions.push(`NOT (pl.is_featured = TRUE AND pl.featured_expires_at > NOW())`);
    }

    if (userRole !== 'agency_admin' && queryAgencyId) {
      conditions.push(`pl.agency_id = $${valueIndex++}`);
      values.push(queryAgencyId);
    }
    if (agent_id) { conditions.push(`pl.agent_id = $${valueIndex++}`); values.push(agent_id); }
    if (purchase_category && purchase_category.toLowerCase() !== 'all') { conditions.push(`pl.purchase_category ILIKE $${valueIndex++}`); values.push(purchase_category); }
    if (min_price) { conditions.push(`pl.price >= $${valueIndex++}`); values.push(min_price); }
    if (max_price) { conditions.push(`pl.price <= $${valueIndex++}`); values.push(max_price); }
    if (location) { conditions.push(`pl.location ILIKE $${valueIndex++}`); values.push(`%${location}%`); }
    if (state) {
      conditions.push(`pl.state ILIKE $${valueIndex++}`);
      values.push(state);
    }

    // --- Property type / bedrooms ---
    if (property_type && bedrooms && property_type.toLowerCase() === 'apartment' && parseInt(bedrooms) === 1) {
      conditions.push(`(pl.property_type ILIKE ANY($${valueIndex++}))`);
      values.push(['Apartment', 'Self-Contain']);
      conditions.push(`pl.bedrooms = $${valueIndex++}`);
      values.push(1);
    } else if (property_type) {
      conditions.push(`pl.property_type ILIKE $${valueIndex++}`);
      values.push(`%${property_type}%`);
    }

    if (bedrooms && (!property_type || property_type.toLowerCase() !== 'land')) {
      if (!(property_type && property_type.toLowerCase() === 'apartment' && parseInt(bedrooms) === 1)) {
        conditions.push(`pl.bedrooms = $${valueIndex++}`);
        values.push(parseInt(bedrooms));
      }
    }

    if (bathrooms && property_type?.toLowerCase() !== 'land') { conditions.push(`pl.bathrooms = $${valueIndex++}`); values.push(parseInt(bathrooms)); }
    if (land_size) { conditions.push(`pd.land_size >= $${valueIndex++}`); values.push(parseFloat(land_size)); }
    if (zoning_type) { conditions.push(`pd.zoning_type ILIKE $${valueIndex++}`); values.push(`%${zoning_type}%`); }
    if (title_type) { conditions.push(`pd.title_type ILIKE $${valueIndex++}`); values.push(`%${title_type}%`); }

    // --- 🔎 Smart Search with Nigeria JSON ---
    let rankSelect = '';
    if (search && search.trim() !== '') {
      let remainingSearch = search.trim().toLowerCase();
      let detectedState = null;
      let detectedCity = null;

      // --- Detect state ---
      for (const st of nigeriaLocations.states) {
        if (remainingSearch.includes(st.toLowerCase())) {
          detectedState = st;
          remainingSearch = remainingSearch.replace(new RegExp(st, "i"), "").trim();
          break;
        }
      }

      // --- Detect city ---
      if (!detectedState) {
        for (const [city, mappedState] of Object.entries(nigeriaLocations.cityToState)) {
          if (remainingSearch.includes(city.toLowerCase())) {
            detectedCity = city;
            detectedState = mappedState;
            remainingSearch = remainingSearch.replace(new RegExp(city, "i"), "").trim();
            break;
          }
        }
      }

      // Apply strict state filter if found
      if (detectedState) {
        conditions.push(`pl.state ILIKE $${valueIndex++}`);
        values.push(`%${detectedState}%`);
      }

      // Build search vector
      if (remainingSearch) {
        const searchVector = `
          setweight(to_tsvector('english', coalesce(pl.title,'')), 'A') ||
          setweight(to_tsvector('english', coalesce(pl.location,'')), 'B') ||
          setweight(to_tsvector('english', coalesce(pl.state,'')), 'B') ||
          setweight(to_tsvector('english', coalesce(pl.property_type,'')), 'B') ||
          setweight(to_tsvector('english', coalesce(pd.description,'')), 'C')
        `;
        const tsQuery = `plainto_tsquery('english', $${valueIndex++})`;

        conditions.push(`(
          ${searchVector} @@ ${tsQuery}
          OR similarity(pl.title, $${valueIndex}) > 0.3
          OR similarity(pl.location, $${valueIndex}) > 0.3
          OR similarity(pl.state, $${valueIndex}) > 0.3
          OR similarity(pl.property_type, $${valueIndex}) > 0.3
          OR similarity(pd.description, $${valueIndex}) > 0.3
        )`);
        values.push(remainingSearch, remainingSearch);

        // --- Ranking with city boost ---
        rankSelect = `,
          ts_rank(${searchVector}, ${tsQuery}, 1)
            + GREATEST(
                similarity(pl.title, $${valueIndex}),
                similarity(pl.location, $${valueIndex}),
                similarity(pl.state, $${valueIndex}),
                similarity(pl.property_type, $${valueIndex}),
                similarity(pd.description, $${valueIndex})
              )
            ${detectedCity ? `+ (CASE WHEN pl.location ILIKE '%${detectedCity}%' THEN 2 ELSE 0 END)` : ''}
          AS rank
        `;
        valueIndex++;
      }
    }

    // --- Where clause ---
    let whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    // --- Pagination ---
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // --- Ordering ---
    let orderByClause = '';
    const effectivePriority = `COALESCE(a.featured_priority, u.featured_priority, 0)`;

    const defaultSort = `
      ORDER BY
          CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END,
          ${effectivePriority} DESC,
          pl.date_listed DESC
    `;

    if (search && search.trim() !== '') {
      orderByClause = `
        ORDER BY
            rank DESC,
            CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END,
            ${effectivePriority} DESC,
            pl.date_listed DESC
      `;
    } else if (sortBy === 'price_asc' || sortBy === 'price_desc') {
      const direction = sortBy === 'price_asc' ? 'ASC' : 'DESC';
      orderByClause = `
        ORDER BY
            CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END,
            pl.price ${direction}
      `;
    } else if (sortBy === 'date_listed_asc') {
      orderByClause = `
        ORDER BY
            CASE WHEN pl.is_featured = TRUE AND pl.featured_expires_at > NOW() THEN 0 ELSE 1 END,
            pl.date_listed ASC
      `;
    } else {
      orderByClause = defaultSort;
    }

    // --- Final queries ---
    const query = `
      SELECT pl.*, pd.description, pd.square_footage, pd.lot_size, pd.year_built, pd.heating_type, pd.cooling_type, pd.parking, pd.amenities, pd.land_size, pd.zoning_type, pd.title_type,
      ${effectivePriority} AS effective_priority
      ${rankSelect}
      ${baseQuery}
      ${whereClause}
      ${orderByClause}
      LIMIT $${valueIndex++} OFFSET $${valueIndex++}
    `;
    values.push(limitNum, offset);

    const countQuery = `SELECT COUNT(*) ${baseQuery} ${whereClause}`;
    const countValues = values.slice(0, values.length - 2);

    const [listingsResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues)
    ]);

    const totalListings = parseInt(countResult.rows[0].count);
    const listingsWithGallery = await attachGalleryImagesToList(listingsResult.rows);

    res.status(200).json({
      listings: listingsWithGallery,
      total: totalListings,
      totalPages: Math.ceil(totalListings / limitNum),
      currentPage: pageNum
    });
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(500).json({ error: 'Internal server error fetching listings', details: err.message });
  }
};

exports.getFeaturedListings = async (req, res) => {
  // NEW: Read the optional 'limit' query parameter
  const { limit } = req.query;
  const limitValue = parseInt(limit, 10);

  try {
      let query = `
          SELECT
              pl.*,
              pd.description, pd.square_footage, pd.lot_size, pd.year_built, pd.heating_type, pd.cooling_type, pd.parking, pd.amenities, pd.land_size, pd.zoning_type, pd.title_type,
              u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone,
              COALESCE(a.featured_priority, u.featured_priority, 0) AS effective_priority
          FROM property_listings pl
          LEFT JOIN property_details pd ON pl.property_id = pd.property_id
          LEFT JOIN users u ON pl.agent_id = u.user_id
          LEFT JOIN agencies a ON pl.agency_id = a.agency_id
          WHERE pl.is_featured = TRUE AND pl.featured_expires_at > NOW()
      `;

      // NEW: Dynamically adjust the ORDER BY and add a LIMIT clause if a valid limit is provided
      if (limitValue && limitValue > 0) {
          // For the homepage carousel: Prioritize by tier, then randomize within that priority
          // to ensure a fresh set of listings is shown on each visit.
          query += ` ORDER BY effective_priority DESC, RANDOM() LIMIT ${limitValue}`;
      } else {
          // For the dedicated "View All Featured" page: Strictly order by priority.
          query += ` ORDER BY effective_priority DESC, pl.featured_expires_at ASC`;
      }

      const result = await pool.query(query);
      const listingsWithGallery = await attachGalleryImagesToList(result.rows);

      res.status(200).json({ listings: listingsWithGallery });
  } catch (err) {
      console.error('Error fetching featured listings:', err);
      res.status(500).json({ error: 'Internal server error fetching featured listings', details: err.message });
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
      title, location, state, price, status, property_type, bedrooms, bathrooms, purchase_category,
      description, square_footage, lot_size, year_built, heating_type, cooling_type, parking, amenities,
      land_size, zoning_type, title_type,
      mainImageBase664, // for backward compatibility
      mainImageBase64, mainImageOriginalName, mainImageURL,
      galleryImagesBase64, galleryImagesOriginalNames, galleryImageURLs,
      is_featured
  } = req.body;

  const user = req.user;
  if (!user) {
      return res.status(401).json({ message: 'Authentication required to create a listing.' });
  }

  // Ensure arrays
  const safeGalleryImagesBase64 = Array.isArray(galleryImagesBase64) ? galleryImagesBase64 : (galleryImagesBase64 ? [galleryImagesBase64] : []);
  const safeGalleryImagesOriginalNames = Array.isArray(galleryImagesOriginalNames) ? galleryImagesOriginalNames : (galleryImagesOriginalNames ? [galleryImagesOriginalNames] : []);
  const safeGalleryImageURLs = Array.isArray(galleryImageURLs) ? galleryImageURLs : (galleryImageURLs ? [galleryImageURLs] : []);

  const tier = user.subscription_type || 'basic';
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const listingLimitScope = user.role === 'agency_admin' ? 'agency_id' : 'agent_id';
  const scopeId = user.role === 'agency_admin' ? user.agency_id : user.user_id;

  try {
      await pool.query('BEGIN');

      // --- SUBSCRIPTION ENFORCEMENT CHECKS ---
      // 1. Check Maximum Listing Limit
      const activeListingsResult = await pool.query(
          `SELECT COUNT(*) FROM property_listings WHERE ${listingLimitScope} = $1 AND status NOT IN ('sold', 'pending', 'rented')`,
          [scopeId]
      );
      if (parseInt(activeListingsResult.rows[0].count, 10) >= tierConfig.maxListings) {
          await pool.query('ROLLBACK');
          return res.status(403).json({ message: `Your '${tier}' plan allows a maximum of ${tierConfig.maxListings} active listings. Please upgrade to add more.` });
      }

      // 2. Check Image Limit
      const totalImages = (mainImageBase664 || mainImageBase64 || mainImageURL ? 1 : 0) + safeGalleryImagesBase64.length + safeGalleryImageURLs.length;
      if (totalImages > tierConfig.maxImages) {
          await pool.query('ROLLBACK');
          return res.status(403).json({ message: `Your '${tier}' plan allows a maximum of ${tierConfig.maxImages} images per listing.` });
      }

      // 3. Handle 'is_featured' on creation
      let featuredValue = false;
      let featuredExpiry = null;
      if (is_featured) {
          if (tierConfig.maxFeatured === 0) {
              await pool.query('ROLLBACK');
              return res.status(403).json({ message: `Your '${tier}' plan does not allow featuring listings.` });
          }
          const activeFeaturedResult = await pool.query(
              `SELECT COUNT(*) FROM property_listings WHERE ${listingLimitScope} = $1 AND is_featured = TRUE AND featured_expires_at > NOW()`,
              [scopeId]
          );
          if (parseInt(activeFeaturedResult.rows[0].count, 10) >= tierConfig.maxFeatured) {
              await pool.query('ROLLBACK');
              return res.status(403).json({ message: `You have reached the maximum of ${tierConfig.maxFeatured} featured listings for your '${tier}' plan.` });
          }
          featuredValue = true;
          featuredExpiry = new Date();
          featuredExpiry.setDate(featuredExpiry.getDate() + tierConfig.featuredDays);
      }

      // --- IMAGE HANDLING ---
      let mainImageUrlToSave = mainImageURL || null;
      let mainImagePublicIdToSave = mainImageURL ? getCloudinaryPublicId(mainImageURL) : null;

      // Prefer mainImageBase64, but fallback to mainImageBase664 for compatibility
      const base64ToUse = mainImageBase64 || mainImageBase664;
      if (base64ToUse && mainImageOriginalName) {
          const uploadResult = await uploadToCloudinary(base64ToUse, mainImageOriginalName, 'listings');
          mainImageUrlToSave = uploadResult.url;
          mainImagePublicIdToSave = uploadResult.publicId;
      }

      // --- LISTING INSERT ---
      const listingResult = await pool.query(
          `INSERT INTO property_listings (title, location, state, price, status, agent_id, agency_id, date_listed, property_type, bedrooms, bathrooms, purchase_category, image_url, image_public_id, is_featured, featured_expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11, $12, $13, $14, $15) RETURNING property_id`,
          [
              title, location, state, price, status || 'pending', user.user_id, user.agency_id, property_type,
              property_type?.toLowerCase() === 'land' ? null : bedrooms,
              property_type?.toLowerCase() === 'land' ? null : bathrooms,
              purchase_category, mainImageUrlToSave, mainImagePublicIdToSave,
              featuredValue, featuredExpiry
          ]
      );
      const newListingId = listingResult.rows[0].property_id;

      // --- PROPERTY DETAILS ---
      const propertyDetailsFields = { description, lot_size, square_footage, year_built, heating_type, cooling_type, parking, amenities, land_size, zoning_type, title_type };
      const providedDetails = Object.keys(propertyDetailsFields).filter(key => propertyDetailsFields[key] !== undefined && propertyDetailsFields[key] !== null && propertyDetailsFields[key] !== '');
      if (providedDetails.length > 0) {
          const columns = ['property_id', ...providedDetails];
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const valuesToInsert = [newListingId, ...providedDetails.map(key => propertyDetailsFields[key])];
          await pool.query(`INSERT INTO property_details (${columns.join(', ')}) VALUES (${placeholders})`, valuesToInsert);
      }

      // --- GALLERY IMAGE UPLOADS ---
      for (let i = 0; i < safeGalleryImagesBase64.length; i++) {
          const base64 = safeGalleryImagesBase64[i];
          const originalname = safeGalleryImagesOriginalNames[i];
          const uploadResult = await uploadToCloudinary(base64, originalname, 'listings');
          if (uploadResult.url) {
              await pool.query('INSERT INTO property_images (property_id, image_url, public_id) VALUES ($1, $2, $3)', [newListingId, uploadResult.url, uploadResult.publicId]);
          }
      }

      // --- EXISTING GALLERY URL INSERTS ---
      for (const url of safeGalleryImageURLs) {
          if (url) {
              await pool.query('INSERT INTO property_images (property_id, image_url, public_id) VALUES ($1, $2, $3)', [newListingId, url, getCloudinaryPublicId(url)]);
          }
      }

      await pool.query('COMMIT');

      // --- FETCH FULL LISTING WITH GALLERY ---
      const createdListingResult = await pool.query(
          `SELECT pl.*, pd.*, u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone 
           FROM property_listings pl 
           LEFT JOIN property_details pd ON pl.property_id = pd.property_id 
           LEFT JOIN users u ON pl.agent_id = u.user_id 
           WHERE pl.property_id = $1`,
          [newListingId]
      );
      const responseListing = await attachGalleryImages(createdListingResult.rows[0]);

      await logActivity(`Listing "${title}" created`, user.user_id, 'listing_create');
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
      `SELECT pl.property_id, pl.title, pl.location, pl.state, pl.price, pl.status, pl.agent_id, pl.date_listed, pl.property_type, pl.bedrooms, pl.bathrooms, pl.purchase_category, pl.image_url, pl.image_public_id, pl.agency_id, pl.is_featured, pd.description, pd.square_footage, pd.lot_size, pd.year_built, pd.heating_type, pd.cooling_type, pd.parking, pd.amenities, pd.land_size, pd.zoning_type, pd.title_type, u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone FROM property_listings pl LEFT JOIN property_details pd ON pl.property_id = pd.property_id LEFT JOIN users u ON pl.agent_id = u.user_id WHERE pl.property_id = $1`,
      [id]
    );
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const listing = await attachGalleryImages(listingResult.rows[0]);

    res.status(200).json(listing);
  } catch (err) {
    console.error('Error fetching listing by ID:', err);
    res.status(500).json({ error: 'Internal server error fetching listing' });
  }
};

exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const {
      is_featured,
      newImagesBase64 = [],
      newImagesOriginalNames = [],
      existingImageUrlsToKeep = [],
      mainImageIdentifier,
      ...updateData
  } = req.body;

  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Authentication required.' });

  const tier = user.subscription_type || 'basic';
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const listingLimitScope = user.role === 'agency_admin' ? 'agency_id' : 'agent_id';
  const scopeId = user.role === 'agency_admin' ? user.agency_id : user.user_id;

  try {
      await pool.query('BEGIN');

      // --- GET CURRENT LISTING ---
      const listingResult = await pool.query(
          'SELECT agent_id, agency_id, is_featured, image_url, image_public_id FROM property_listings WHERE property_id = $1 FOR UPDATE',
          [id]
      );
      if (listingResult.rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ message: 'Listing not found.' });
      }
      const currentListing = listingResult.rows[0];

      // --- PERMISSION CHECK ---
      if (!(user.user_id === currentListing.agent_id || (user.role === 'agency_admin' && user.agency_id === currentListing.agency_id) || user.role === 'admin')) {
          await pool.query('ROLLBACK');
          return res.status(403).json({ message: 'You do not have permission to update this listing.' });
      }

      const updates = [];
      let values = [];
      let valueIndex = 1;

      // --- FEATURED STATUS ---
      if (is_featured !== undefined && is_featured !== currentListing.is_featured) {
          if (is_featured) {
              if (tierConfig.maxFeatured === 0) {
                  await pool.query('ROLLBACK');
                  return res.status(403).json({ message: `Your '${tier}' plan does not allow featuring listings.` });
              }
              const activeFeaturedResult = await pool.query(
                  `SELECT COUNT(*) FROM property_listings WHERE ${listingLimitScope} = $1 AND is_featured = TRUE AND featured_expires_at > NOW()`,
                  [scopeId]
              );
              if (parseInt(activeFeaturedResult.rows[0].count, 10) >= tierConfig.maxFeatured) {
                  await pool.query('ROLLBACK');
                  return res.status(403).json({ message: `You have reached the maximum of ${tierConfig.maxFeatured} featured listings for your '${tier}' plan.` });
              }
              updates.push(`is_featured = $${valueIndex++}`, `featured_expires_at = $${valueIndex++}`);
              values.push(true, new Date(Date.now() + tierConfig.featuredDays * 24 * 60 * 60 * 1000));
          } else {
              updates.push(`is_featured = $${valueIndex++}`, `featured_expires_at = $${valueIndex++}`);
              values.push(false, null);
          }
      }

      // --- GET CURRENT GALLERY ---
      const currentGalleryResult = await pool.query(
          'SELECT image_url, public_id FROM property_images WHERE property_id = $1',
          [id]
      );
      const currentGalleryImages = currentGalleryResult.rows.map(row => ({
          url: row.image_url,
          publicId: row.public_id
      }));

      // --- IMAGE LIMIT CHECK ---
      const totalImagesAfterUpdate =
          existingImageUrlsToKeep.length + newImagesBase64.length + (mainImageIdentifier && !existingImageUrlsToKeep.includes(mainImageIdentifier) ? 1 : 0);

      if (totalImagesAfterUpdate > tierConfig.maxImages) {
          await pool.query('ROLLBACK');
          return res.status(403).json({ message: `Your '${tier}' plan allows a maximum of ${tierConfig.maxImages} images per listing.` });
      }

      // --- DELETE REMOVED GALLERY IMAGES ---
      const urlsToDelete = currentGalleryImages.filter(img => !existingImageUrlsToKeep.includes(img.url));
      for (const img of urlsToDelete) {
          if (img.publicId) {
              await deleteFromCloudinary(img.publicId);
          }
          await pool.query('DELETE FROM property_images WHERE public_id = $1', [img.publicId]);
      }

      // --- UPLOAD NEW GALLERY IMAGES ---
      for (let i = 0; i < newImagesBase64.length; i++) {
          const base64 = newImagesBase64[i];
          const originalname = newImagesOriginalNames[i] || 'gallery_image';
          const uploadResult = await uploadToCloudinary(base64, originalname, 'listings');
          if (uploadResult.url) {
              await pool.query('INSERT INTO property_images (property_id, image_url, public_id) VALUES ($1, $2, $3)', [id, uploadResult.url, uploadResult.publicId]);
          }
      }

      // --- MAIN IMAGE HANDLING (Function A's logic) ---
      if (mainImageIdentifier) {
          let newMainImageUrl = null;
          let newMainImagePublicId = null;

          const isNewImage = mainImageIdentifier.startsWith('data:');
          if (isNewImage) {
              const uploadResult = await uploadToCloudinary(mainImageIdentifier, 'main_image', 'listings');
              newMainImageUrl = uploadResult.url;
              newMainImagePublicId = uploadResult.publicId;
          } else {
              newMainImageUrl = mainImageIdentifier;
              newMainImagePublicId = getCloudinaryPublicId(newMainImageUrl);
          }

          const oldMainImageIsStillInGallery = existingImageUrlsToKeep.includes(currentListing.image_url);
          if (currentListing.image_public_id && currentListing.image_url !== newMainImageUrl && !oldMainImageIsStillInGallery) {
              await deleteFromCloudinary(currentListing.image_public_id);
          }

          updates.push(`image_url = $${valueIndex++}`, `image_public_id = $${valueIndex++}`);
          values.push(newMainImageUrl, newMainImagePublicId);
      }

      // --- UPDATE LISTING FIELDS ---
      const listingFields = {
          title: updateData.title,
          location: updateData.location,
          state: updateData.state,
          price: updateData.price,
          status: updateData.status,
          property_type: updateData.property_type,
          bedrooms: updateData.bedrooms,
          bathrooms: updateData.bathrooms,
          purchase_category: updateData.purchase_category
      };
      for (const [key, value] of Object.entries(listingFields)) {
          if (value !== undefined) {
              updates.push(`${key} = $${valueIndex++}`);
              values.push(value);
          }
      }
      if (updates.length > 0) {
          values.push(id);
          await pool.query(`UPDATE property_listings SET ${updates.join(', ')} WHERE property_id = $${valueIndex}`, values);
      }

      // --- UPDATE PROPERTY DETAILS ---
      const detailFields = {
          description: updateData.description,
          square_footage: updateData.square_footage,
          lot_size: updateData.lot_size,
          year_built: updateData.year_built,
          heating_type: updateData.heating_type,
          cooling_type: updateData.cooling_type,
          parking: updateData.parking,
          amenities: updateData.amenities,
          land_size: updateData.land_size,
          zoning_type: updateData.zoning_type,
          title_type: updateData.title_type
      };
      const providedDetails = Object.keys(detailFields).filter(key => detailFields[key] !== undefined);
      if (providedDetails.length > 0) {
          const detailUpdates = providedDetails.map((key, i) => `${key} = $${i + 2}`).join(', ');
          const detailValues = providedDetails.map(key => detailFields[key]);
          await pool.query(`UPDATE property_details SET ${detailUpdates} WHERE property_id = $1`, [id, ...detailValues]);
      }

      await pool.query('COMMIT');

      // --- FETCH UPDATED LISTING ---
      const updatedListingResult = await pool.query(
          `SELECT pl.*, pd.*, u.full_name AS agent_name, u.email AS agent_email, u.phone AS agent_phone
           FROM property_listings pl
           LEFT JOIN property_details pd ON pl.property_id = pd.property_id
           LEFT JOIN users u ON pl.agent_id = u.user_id
           WHERE pl.property_id = $1`,
          [id]
      );
      const responseListing = await attachGalleryImages(updatedListingResult.rows[0]);

      await logActivity(`Listing "${id}" updated`, user.user_id, 'listing_update');
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

        // Fetch listing and all associated gallery images
        const listingResult = await pool.query('SELECT image_url, image_public_id FROM property_listings WHERE property_id = $1', [id]);
        if (listingResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Listing not found' });
        }
        const listing = listingResult.rows[0];

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

        // Delete from property_details first due to foreign key constraint
        await pool.query('DELETE FROM property_details WHERE property_id = $1', [id]);
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

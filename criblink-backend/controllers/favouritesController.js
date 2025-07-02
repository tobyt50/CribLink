const { pool } = require('../db');
const logActivity = require('../utils/logActivity');

// Add a listing to user's favourites
exports.addFavourite = async (req, res) => {
    const { property_id } = req.body;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(401).json({ message: 'Authentication required to add a favourite.' });
    }
    if (!property_id) {
        return res.status(400).json({ message: 'Property ID is required.' });
    }

    try {
        // Check if the property exists
        const propertyExists = await pool.query('SELECT 1 FROM property_listings WHERE property_id = $1', [property_id]);
        if (propertyExists.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found.' });
        }

        // Check if already favourited
        const existingFavourite = await pool.query(
            'SELECT * FROM user_favourites WHERE user_id = $1 AND property_id = $2',
            [user_id, property_id]
        );

        if (existingFavourite.rows.length > 0) {
            return res.status(409).json({ message: 'Listing already in favourites.' });
        }

        await pool.query(
            'INSERT INTO user_favourites (user_id, property_id) VALUES ($1, $2)',
            [user_id, property_id]
        );

        await logActivity(
            `Listing "${property_id}" added to favourites`,
            req.user,
            'favourite'
        );

        res.status(201).json({ message: 'Listing added to favourites successfully.' });
    } catch (err) {
        console.error('Error adding favourite:', err);
        res.status(500).json({ error: 'Internal server error adding favourite.' });
    }
};

// Remove a listing from user's favourites
exports.removeFavourite = async (req, res) => {
    const { property_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(401).json({ message: 'Authentication required to remove a favourite.' });
    }

    try {
        const deleteResult = await pool.query(
            'DELETE FROM user_favourites WHERE user_id = $1 AND property_id = $2 RETURNING *',
            [user_id, property_id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Favourite not found or already removed.' });
        }

        await logActivity(
            `Listing "${property_id}" removed from favourites`,
            req.user,
            'favourite'
        );

        res.status(200).json({ message: 'Listing removed from favourites successfully.' });
    } catch (err) {
        console.error('Error removing favourite:', err);
        res.status(500).json({ error: 'Internal server error removing favourite.' });
    }
};

// Get all favourite listings for a user
exports.getFavourites = async (req, res) => {
    const requestedUserId = req.headers['x-target-user-id']; // Read custom header
    const currentUserId = req.user ? req.user.user_id : null;
    const currentUserRole = req.user ? req.user.role : null;

    let targetUserId = currentUserId; // Default to current authenticated user

    console.log("Favourites Controller - Incoming Request:");
    console.log("  requestedUserId (from header):", requestedUserId);
    console.log("  currentUserId (from token):", currentUserId);
    console.log("  currentUserRole (from token):", currentUserRole);

    // Logic to allow agents to view client favourites if requestedUserId is present
    if (requestedUserId && currentUserRole === 'agent') {
        // First, check if the target client has enabled 'share_favourites_with_agents'
        try {
            const clientPrivacyRes = await pool.query(
                `SELECT share_favourites_with_agents FROM users WHERE user_id = $1`,
                [requestedUserId]
            );

            console.log("  Client Privacy Check Result:", clientPrivacyRes.rows);

            if (clientPrivacyRes.rows.length > 0 && clientPrivacyRes.rows[0].share_favourites_with_agents) {
                targetUserId = requestedUserId; // Client allows sharing, so use their ID
                console.log("  Client allows sharing. targetUserId set to:", targetUserId);
            } else {
                // Client does not allow sharing, or client not found
                console.log("  Client does NOT allow sharing, or client not found.");
                return res.status(403).json({ message: 'Client has chosen not to share their favourite listings.' });
            }
        } catch (error) {
            console.error('Error checking client privacy setting:', error);
            return res.status(500).json({ error: 'Internal server error checking client privacy setting.' });
        }
    } else if (!currentUserId) {
        console.log("  No currentUserId. Authentication required.");
        return res.status(401).json({ message: 'Authentication required to view favourites.' });
    }

    console.log("  Final targetUserId for query:", targetUserId);

    try {
        const result = await pool.query(
            `SELECT
                pl.property_id,
                pl.title,
                pl.location,
                pl.state,
                pl.price,
                pl.status,
                pl.property_type,
                pl.bedrooms,
                pl.bathrooms,
                pl.purchase_category,
                pl.image_url,
                pl.date_listed,
                pd.description,
                pd.square_footage,
                pd.lot_size,
                pd.year_built,
                pd.heating_type,
                pd.cooling_type,
                pd.parking,
                pd.amenities,
                uf.created_at AS favourited_at
            FROM user_favourites uf
            JOIN property_listings pl ON uf.property_id = pl.property_id
            LEFT JOIN property_details pd ON pl.property_id = pd.property_id
            WHERE uf.user_id = $1
            ORDER BY uf.created_at DESC`,
            [targetUserId] // Use the determined targetUserId
        );

        console.log("  SQL Query Result Rows Length:", result.rows.length); // Debugging log

        const favouritesWithGallery = await Promise.all(result.rows.map(async (listing) => {
            const galleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id', [listing.property_id]);
            listing.gallery_images = galleryResult.rows.map(row => row.image_url);
            return listing;
        }));

        res.status(200).json({ favourites: favouritesWithGallery });
    } catch (err) {
        console.error('Error fetching favourites:', err);
        res.status(500).json({ error: 'Internal server error fetching favourites.' });
    }
};

// Check if a listing is favourited by the user
exports.getFavouriteStatus = async (req, res) => {
    const { property_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        // If not authenticated, it's not favourited by this user
        return res.status(200).json({ isFavorited: false });
    }

    try {
        const result = await pool.query(
            'SELECT 1 FROM user_favourites WHERE user_id = $1 AND property_id = $2',
            [user_id, property_id]
        );
        res.status(200).json({ isFavorited: result.rows.length > 0 });
    } catch (err) {
        console.error('Error checking favourite status:', err);
        res.status(500).json({ error: 'Internal server error checking favourite status.' });
    }
};

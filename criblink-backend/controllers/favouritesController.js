const { pool } = require('../db');
const logActivity = require('../utils/logActivity');

// --- Property Favourites ---

// Add a listing to user's favourites
exports.addFavouriteProperty = async (req, res) => {
    const { property_id } = req.body;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(401).json({ message: 'Authentication required to add a favourite property.' });
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
            'SELECT * FROM user_favourites_properties WHERE user_id = $1 AND property_id = $2',
            [user_id, property_id]
        );

        if (existingFavourite.rows.length > 0) {
            return res.status(409).json({ message: 'Listing already in favourites.' });
        }

        await pool.query(
            'INSERT INTO user_favourites_properties (user_id, property_id) VALUES ($1, $2)',
            [user_id, property_id]
        );

        await logActivity(
            `Listing "${property_id}" added to favourites`,
            req.user,
            'favourite_property'
        );

        res.status(201).json({ message: 'Listing added to favourites successfully.' });
    } catch (err) {
        console.error('Error adding favourite property:', err);
        res.status(500).json({ error: 'Internal server error adding favourite property.' });
    }
};

// Remove a listing from user's favourites
exports.removeFavouriteProperty = async (req, res) => {
    const { property_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(401).json({ message: 'Authentication required to remove a favourite property.' });
    }

    try {
        const deleteResult = await pool.query(
            'DELETE FROM user_favourites_properties WHERE user_id = $1 AND property_id = $2 RETURNING *',
            [user_id, property_id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Favourite property not found or already removed.' });
        }

        await logActivity(
            `Listing "${property_id}" removed from favourites`,
            req.user,
            'favourite_property'
        );

        res.status(200).json({ message: 'Listing removed from favourites successfully.' });
    } catch (err) {
        console.error('Error removing favourite property:', err);
        res.status(500).json({ error: 'Internal server error removing favourite property.' });
    }
};

// Get all favourite listings for a user
exports.getFavouriteProperties = async (req, res) => {
    const requestedUserId = req.headers['x-target-user-id']; // Read custom header
    const currentUserId = req.user ? req.user.user_id : null;
    const currentUserRole = req.user ? req.user.role : null;

    let targetUserId = currentUserId; // Default to current authenticated user

    // Logic to allow agents to view client favourites if requestedUserId is present
    if (requestedUserId && currentUserRole === 'agent') {
        // First, check if the target client has enabled 'share_favourites_with_agents'
        try {
            const clientPrivacyRes = await pool.query(
                `SELECT share_favourites_with_agents FROM users WHERE user_id = $1`,
                [requestedUserId]
            );

            if (clientPrivacyRes.rows.length > 0 && clientPrivacyRes.rows[0].share_favourites_with_agents) {
                targetUserId = requestedUserId; // Client allows sharing, so use their ID
            } else {
                // Client does not allow sharing, or client not found
                return res.status(403).json({ message: 'Client has chosen not to share their favourite listings.' });
            }
        } catch (error) {
            console.error('Error checking client privacy setting for properties:', error);
            return res.status(500).json({ error: 'Internal server error checking client privacy setting.' });
        }
    } else if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required to view favourites.' });
    }

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
                ufp.created_at AS favourited_at
            FROM user_favourites_properties ufp
            JOIN property_listings pl ON ufp.property_id = pl.property_id
            LEFT JOIN property_details pd ON pl.property_id = pd.property_id
            WHERE ufp.user_id = $1
            ORDER BY ufp.created_at DESC`,
            [targetUserId] // Use the determined targetUserId
        );

        const favouritesWithGallery = await Promise.all(result.rows.map(async (listing) => {
            const galleryResult = await pool.query('SELECT image_url FROM property_images WHERE property_id = $1 ORDER BY image_id', [listing.property_id]);
            listing.gallery_images = galleryResult.rows.map(row => row.image_url);
            return listing;
        }));

        res.status(200).json({ favourites: favouritesWithGallery });
    } catch (err) {
        console.error('Error fetching favourite properties:', err);
        res.status(500).json({ error: 'Internal server error fetching favourite properties.' });
    }
};

// Check if a listing is favourited by the user
exports.getFavouritePropertyStatus = async (req, res) => {
    const { property_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(200).json({ isFavorited: false });
    }

    try {
        const result = await pool.query(
            'SELECT 1 FROM user_favourites_properties WHERE user_id = $1 AND property_id = $2',
            [user_id, property_id]
        );
        res.status(200).json({ isFavorited: result.rows.length > 0 });
    } catch (err) {
        console.error('Error checking favourite property status:', err);
        res.status(500).json({ error: 'Internal server error checking favourite property status.' });
    }
};

// --- Agent Favourites ---

exports.addFavouriteAgent = async (req, res) => {
    const { agent_id } = req.body;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(401).json({ message: 'Authentication required to add a favourite agent.' });
    }
    if (!agent_id) {
        return res.status(400).json({ message: 'Agent ID is required.' });
    }

    try {
        const agentExists = await pool.query('SELECT 1 FROM users WHERE user_id = $1 AND role = \'agent\'', [agent_id]);
        if (agentExists.rows.length === 0) {
            return res.status(404).json({ message: 'Agent not found.' });
        }

        const existingFavourite = await pool.query(
            'SELECT * FROM user_favourites_agents WHERE user_id = $1 AND agent_id = $2',
            [user_id, agent_id]
        );

        if (existingFavourite.rows.length > 0) {
            return res.status(409).json({ message: 'Agent already in favourites.' });
        }

        await pool.query(
            'INSERT INTO user_favourites_agents (user_id, agent_id) VALUES ($1, $2)',
            [user_id, agent_id]
        );

        await logActivity(
            `Agent "${agent_id}" added to favourites`,
            req.user,
            'favourite_agent'
        );

        res.status(201).json({ message: 'Agent added to favourites successfully.' });
    } catch (err) {
        console.error('Error adding favourite agent:', err);
        res.status(500).json({ error: 'Internal server error adding favourite agent.' });
    }
};

exports.removeFavouriteAgent = async (req, res) => {
    const { agent_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(401).json({ message: 'Authentication required to remove a favourite agent.' });
    }

    try {
        const deleteResult = await pool.query(
            'DELETE FROM user_favourites_agents WHERE user_id = $1 AND agent_id = $2 RETURNING *',
            [user_id, agent_id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Favourite agent not found or already removed.' });
        }

        await logActivity(
            `Agent "${agent_id}" removed from favourites`,
            req.user,
            'favourite_agent'
        );

        res.status(200).json({ message: 'Agent removed from favourites successfully.' });
    } catch (err) {
        console.error('Error removing favourite agent:', err);
        res.status(500).json({ error: 'Internal server error removing favourite agent.' });
    }
};

exports.getFavouriteAgents = async (req, res) => {
    const requestedUserId = req.headers['x-target-user-id'];
    const currentUserId = req.user ? req.user.user_id : null;
    const currentUserRole = req.user ? req.user.role : null;

    let targetUserId = currentUserId;

    if (requestedUserId && currentUserRole === 'agent') { // Agents can't view other agents' favourites
        return res.status(403).json({ message: 'Forbidden: You cannot view other users\' favourite agents.' });
    } else if (requestedUserId && currentUserRole === 'admin') { // Admin can view any user's favourites
        targetUserId = requestedUserId;
    } else if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required to view favourite agents.' });
    }

    try {
        const result = await pool.query(
            `SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.profile_picture_url,
                u.date_joined,
                u.status,
                u.agency_id,
                ufa.created_at AS favourited_at,
                a.name AS agency_name,
                a.logo_url AS agency_logo_url
            FROM user_favourites_agents ufa
            JOIN users u ON ufa.agent_id = u.user_id
            LEFT JOIN agencies a ON u.agency_id = a.agency_id
            WHERE ufa.user_id = $1
            ORDER BY ufa.created_at DESC`,
            [targetUserId]
        );
        res.status(200).json({ favourites: result.rows });
    } catch (err) {
        console.error('Error fetching favourite agents:', err);
        res.status(500).json({ error: 'Internal server error fetching favourite agents.' });
    }
};

exports.getFavouriteAgentStatus = async (req, res) => {
    const { agent_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(200).json({ isFavorited: false });
    }

    try {
        const result = await pool.query(
            'SELECT 1 FROM user_favourites_agents WHERE user_id = $1 AND agent_id = $2',
            [user_id, agent_id]
        );
        res.status(200).json({ isFavorited: result.rows.length > 0 });
    } catch (err) {
        console.error('Error checking favourite agent status:', err);
        res.status(500).json({ error: 'Internal server error checking favourite agent status.' });
    }
};

// --- Client Favourites (primarily for agents/agency_admins to favorite clients) ---

exports.addFavouriteClient = async (req, res) => {
    const { client_id } = req.body;
    const user_id = req.user ? req.user.user_id : null; // This is the agent/agency_admin ID
    const user_role = req.user ? req.user.role : null;

    if (!user_id || (user_role !== 'agent' && user_role !== 'agency_admin')) {
        return res.status(403).json({ message: 'Only agents and agency administrators can favourite clients.' });
    }
    if (!client_id) {
        return res.status(400).json({ message: 'Client ID is required.' });
    }

    try {
        const clientExists = await pool.query('SELECT 1 FROM users WHERE user_id = $1 AND role = \'client\'', [client_id]);
        if (clientExists.rows.length === 0) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        // Ensure the agent/agency_admin has a relationship with this client (if applicable)
        // This is a business logic decision. For now, allowing to favorite any client.
        // If strict, add a check like:
        // const relationship = await pool.query('SELECT 1 FROM agent_clients WHERE agent_id = $1 AND client_id = $2 AND request_status = \'accepted\'', [user_id, client_id]);
        // if (relationship.rows.length === 0) { return res.status(403).json({ message: 'You can only favourite clients you are connected with.' }); }

        const existingFavourite = await pool.query(
            'SELECT * FROM user_favourites_clients WHERE user_id = $1 AND client_id = $2',
            [user_id, client_id]
        );

        if (existingFavourite.rows.length > 0) {
            return res.status(409).json({ message: 'Client already in favourites.' });
        }

        await pool.query(
            'INSERT INTO user_favourites_clients (user_id, client_id) VALUES ($1, $2)',
            [user_id, client_id]
        );

        await logActivity(
            `Client "${client_id}" added to favourites by ${user_role}`,
            req.user,
            'favourite_client'
        );

        res.status(201).json({ message: 'Client added to favourites successfully.' });
    } catch (err) {
        console.error('Error adding favourite client:', err);
        res.status(500).json({ error: 'Internal server error adding favourite client.' });
    }
};

exports.removeFavouriteClient = async (req, res) => {
    const { client_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;
    const user_role = req.user ? req.user.role : null;

    if (!user_id || (user_role !== 'agent' && user_role !== 'agency_admin')) {
        return res.status(403).json({ message: 'Only agents and agency administrators can remove favourite clients.' });
    }

    try {
        const deleteResult = await pool.query(
            'DELETE FROM user_favourites_clients WHERE user_id = $1 AND client_id = $2 RETURNING *',
            [user_id, client_id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Favourite client not found or already removed.' });
        }

        await logActivity(
            `Client "${client_id}" removed from favourites by ${user_role}`,
            req.user,
            'favourite_client'
        );

        res.status(200).json({ message: 'Client removed from favourites successfully.' });
    } catch (err) {
        console.error('Error removing favourite client:', err);
        res.status(500).json({ error: 'Internal server error removing favourite client.' });
    }
};

exports.getFavouriteClients = async (req, res) => {
    const user_id = req.user ? req.user.user_id : null;
    const user_role = req.user ? req.user.role : null;

    if (!user_id || (user_role !== 'agent' && user_role !== 'agency_admin')) {
        return res.status(403).json({ message: 'Only agents and agency administrators can view favourite clients.' });
    }

    try {
        const result = await pool.query(
            `SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.profile_picture_url,
                u.date_joined,
                u.status,
                ufc.created_at AS favourited_at
            FROM user_favourites_clients ufc
            JOIN users u ON ufc.client_id = u.user_id
            WHERE ufc.user_id = $1
            ORDER BY ufc.created_at DESC`,
            [user_id]
        );
        res.status(200).json({ favourites: result.rows });
    } catch (err) {
        console.error('Error fetching favourite clients:', err);
        res.status(500).json({ error: 'Internal server error fetching favourite clients.' });
    }
};

exports.getFavouriteClientStatus = async (req, res) => {
    const { client_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;
    const user_role = req.user ? req.user.role : null;

    if (!user_id || (user_role !== 'agent' && user_role !== 'agency_admin')) {
        return res.status(200).json({ isFavorited: false }); // Not authorized to favourite clients, so status is always false
    }

    try {
        const result = await pool.query(
            'SELECT 1 FROM user_favourites_clients WHERE user_id = $1 AND client_id = $2',
            [user_id, client_id]
        );
        res.status(200).json({ isFavorited: result.rows.length > 0 });
    } catch (err) {
        console.error('Error checking favourite client status:', err);
        res.status(500).json({ error: 'Internal server error checking favourite client status.' });
    }
};

// --- Agency Favourites ---

exports.addFavouriteAgency = async (req, res) => {
    const { agency_id } = req.body;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(401).json({ message: 'Authentication required to add a favourite agency.' });
    }
    if (!agency_id) {
        return res.status(400).json({ message: 'Agency ID is required.' });
    }

    try {
        const agencyExists = await pool.query('SELECT 1 FROM agencies WHERE agency_id = $1', [agency_id]);
        if (agencyExists.rows.length === 0) {
            return res.status(404).json({ message: 'Agency not found.' });
        }

        const existingFavourite = await pool.query(
            'SELECT * FROM user_favourites_agencies WHERE user_id = $1 AND agency_id = $2',
            [user_id, agency_id]
        );

        if (existingFavourite.rows.length > 0) {
            return res.status(409).json({ message: 'Agency already in favourites.' });
        }

        await pool.query(
            'INSERT INTO user_favourites_agencies (user_id, agency_id) VALUES ($1, $2)',
            [user_id, agency_id]
        );

        await logActivity(
            `Agency "${agency_id}" added to favourites`,
            req.user,
            'favourite_agency'
        );

        res.status(201).json({ message: 'Agency added to favourites successfully.' });
    } catch (err) {
        console.error('Error adding favourite agency:', err);
        res.status(500).json({ error: 'Internal server error adding favourite agency.' });
    }
};

exports.removeFavouriteAgency = async (req, res) => {
    const { agency_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(401).json({ message: 'Authentication required to remove a favourite agency.' });
    }

    try {
        const deleteResult = await pool.query(
            'DELETE FROM user_favourites_agencies WHERE user_id = $1 AND agency_id = $2 RETURNING *',
            [user_id, agency_id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ message: 'Favourite agency not found or already removed.' });
        }

        await logActivity(
            `Agency "${agency_id}" removed from favourites`,
            req.user,
            'favourite_agency'
        );

        res.status(200).json({ message: 'Agency removed from favourites successfully.' });
    } catch (err) {
        console.error('Error removing favourite agency:', err);
        res.status(500).json({ error: 'Internal server error removing favourite agency.' });
    }
};

exports.getFavouriteAgencies = async (req, res) => {
    const requestedUserId = req.headers['x-target-user-id'];
    const currentUserId = req.user ? req.user.user_id : null;
    const currentUserRole = req.user ? req.user.role : null;

    let targetUserId = currentUserId;

    if (requestedUserId && currentUserRole === 'agency_admin') { // Agency admins can't view other agency's favourites
        return res.status(403).json({ message: 'Forbidden: You cannot view other users\' favourite agencies.' });
    } else if (requestedUserId && currentUserRole === 'admin') { // Admin can view any user's favourites
        targetUserId = requestedUserId;
    } else if (!currentUserId) {
        return res.status(401).json({ message: 'Authentication required to view favourite agencies.' });
    }

    try {
        const result = await pool.query(
            `SELECT
                a.agency_id,
                a.name,
                a.email,
                a.phone,
                a.website,
                a.logo_url,
                a.description,
                a.address,
                ufa.created_at AS favourited_at
            FROM user_favourites_agencies ufa
            JOIN agencies a ON ufa.agency_id = a.agency_id
            WHERE ufa.user_id = $1
            ORDER BY ufa.created_at DESC`,
            [targetUserId]
        );
        res.status(200).json({ favourites: result.rows });
    } catch (err) {
        console.error('Error fetching favourite agencies:', err);
        res.status(500).json({ error: 'Internal server error fetching favourite agencies.' });
    }
};

exports.getFavouriteAgencyStatus = async (req, res) => {
    const { agency_id } = req.params;
    const user_id = req.user ? req.user.user_id : null;

    if (!user_id) {
        return res.status(200).json({ isFavorited: false });
    }

    try {
        const result = await pool.query(
            'SELECT 1 FROM user_favourites_agencies WHERE user_id = $1 AND agency_id = $2',
            [user_id, agency_id]
        );
        res.status(200).json({ isFavorited: result.rows.length > 0 });
    } catch (err) {
        console.error('Error checking favourite agency status:', err);
        res.status(500).json({ error: 'Internal server error checking favourite agency status.' });
    }
};

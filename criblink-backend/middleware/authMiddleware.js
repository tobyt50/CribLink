const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'lionel_messi_10_is_the_goat!';

/**
 * Middleware to authenticate a user using a JWT token.
 * Attaches the decoded user info to `req.user` if valid.
 * This middleware *requires* a valid token and will respond with 401/403 if not.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

    if (!token) {
        console.log('[authenticateToken] Token missing.');
        return res.status(401).json({ message: 'Token missing' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        console.log('[authenticateToken] Token verified. Decoded user payload:', req.user);
        next();
    } catch (err) {
        console.error('[authenticateToken] Invalid or expired token. Error:', err.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

/**
 * Middleware for role-based access control.
 * Accepts allowed roles as parameters (e.g. 'admin', 'agent', 'agency_admin').
 * Rejects the request if the user’s role is not permitted.
 *
 * For 'agency_admin', it also checks if the user's agency_id matches the requested agencyId
 * if the route parameter 'agencyId' is present and the user is an 'agency_admin'.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('[authorizeRoles] Checking authorization...');
        console.log('[authorizeRoles] User present in req:', !!req.user);
        console.log('[authorizeRoles] User role from req.user:', req.user ? req.user.role : 'N/A');
        console.log('[authorizeRoles] Allowed roles for this route:', allowedRoles);

        const flattenedAllowedRoles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
        console.log('[authorizeRoles] Flattened allowed roles:', flattenedAllowedRoles);

        if (!req.user || !flattenedAllowedRoles.includes(req.user.role)) {
            console.warn('[authorizeRoles] Access denied: insufficient privileges for user role:', req.user ? req.user.role : 'N/A');
            return res.status(403).json({ message: 'Access denied: insufficient privileges' });
        }

        // NEW: Specific check for 'agency_admin' role for agency-specific routes
        // This ensures an agency_admin can only manage their own agency's resources.
        if (req.user.role === 'agency_admin' && req.params.agencyId) {
            // Ensure the agency_admin is managing their own agency
            // req.user.agency_id comes from the JWT payload
            // req.params.agencyId comes from the URL (e.g., /api/agencies/:agencyId/members)
            if (parseInt(req.params.agencyId) !== req.user.agency_id) {
                console.warn(`[authorizeRoles] Agency Admin ${req.user.userId} attempted to access agency ${req.params.agencyId} but belongs to ${req.user.agency_id}.`);
                return res.status(403).json({ message: 'Access denied: You can only manage your own agency.' });
            }
        }

        console.log('[authorizeRoles] Authorization granted.');
        next();
    };
};

/**
 * Middleware to optionally authenticate a user using a JWT token.
 * If a valid token is present, it attaches the decoded user info to `req.user`.
 * If no token is present or the token is invalid, it *does not* send an error response,
 * but simply calls `next()`, leaving `req.user` as undefined.
 * This is suitable for routes that are publicly accessible but offer enhanced features for logged-in users.
 */
const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('[optionalAuthenticateToken] No token provided. Proceeding as guest.');
        return next(); // No token, proceed to next middleware/route handler
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        console.log('[optionalAuthenticateToken] Token verified. User:', req.user.user_id, 'Role:', req.user.role);
        next(); // Token valid, proceed with user info
    } catch (err) {
        console.warn('[optionalAuthenticateToken] Invalid or expired token. Proceeding as guest. Error:', err.message);
        // Do NOT send a 403 here; just log and proceed as if no token was provided.
        next();
    }
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    optionalAuthenticateToken
};

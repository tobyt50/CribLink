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
        return res.status(401).json({ message: 'Token missing' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

/**
 * Middleware for role-based access control.
 * Accepts allowed roles as parameters (e.g. 'admin', 'agent').
 * Rejects the request if the user’s role is not permitted.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: insufficient privileges' });
        }
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
        // console.log('[optionalAuthenticateToken] No token provided. Proceeding as guest.');
        return next(); // No token, proceed to next middleware/route handler
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        // console.log('[optionalAuthenticateToken] Token verified. User:', req.user.user_id, 'Role:', req.user.role);
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
    optionalAuthenticateToken // Export the new middleware
};

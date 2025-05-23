const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'lionel_messi_10_is_the_goat!';

/**
 * Middleware to authenticate a user using a JWT token.
 * Attaches the decoded user info to `req.user` if valid.
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

module.exports = {
    authenticateToken,
    authorizeRoles,
};
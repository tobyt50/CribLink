const jwt = require("jsonwebtoken");
const db = require("../db"); // Assuming this is your Knex or PG instance
const SECRET_KEY = process.env.JWT_SECRET || "lionel_messi_10_is_the_goat!";

/**
 * Middleware to authenticate a user using a JWT token.
 * Attaches the decoded user info and their subscription details to `req.user`.
 * This middleware *requires* a valid token and will respond with 401/403 if not.
 *
 * --- UPDATED FOR SUBSCRIPTION SYSTEM ---
 * Now fetches user/agency subscription details from the database upon successful
 * token verification and attaches a complete user profile to `req.user`.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    // 1. Verify the token first
    const decodedToken = jwt.verify(token, SECRET_KEY);

    // 2. Fetch the LATEST user and subscription data from the database
    // This query is now updated with logic to handle the 'admin' role specifically.
    const userResult = await db.query(
      `SELECT 
                u.user_id, 
                u.email, 
                u.role, 
                u.agency_id,
                -- UPDATED LOGIC: Enforce subscription tiers based on role
                CASE 
                    WHEN u.role = 'admin' THEN 'enterprise' -- Admins always get the top tier
                    WHEN u.role = 'agency_admin' AND a.subscription_type IS NOT NULL THEN a.subscription_type
                    ELSE COALESCE(u.subscription_type, 'basic') -- Fallback for all others to 'basic' if null
                END AS subscription_type,
                CASE 
                    WHEN u.role = 'admin' THEN 10 -- Admins always get the highest priority
                    WHEN u.role = 'agency_admin' AND a.featured_priority IS NOT NULL THEN a.featured_priority
                    ELSE COALESCE(u.featured_priority, 0) -- Fallback for all others
                END AS featured_priority
             FROM users u
             LEFT JOIN agencies a ON u.agency_id = a.agency_id
             WHERE u.user_id = $1`,
      [decodedToken.user_id],
    );

    if (userResult.rows.length === 0) {
      console.warn(
        `[authenticateToken] User with ID ${decodedToken.user_id} from valid token not found in DB.`,
      );
      return res.status(403).json({ message: "User not found" });
    }

    const fullUser = userResult.rows[0];

    // Attach the full, up-to-date user profile to the request
    req.user = {
      ...decodedToken, // Keep original token payload (like session_id)
      ...fullUser, // Add/overwrite with fresh data from DB
    };

    console.log(
      "[authenticateToken] Token verified. User payload with subscription:",
      req.user,
    );

    // --- Session Status Check (existing logic is good) ---
    if (req.user.session_id) {
      const sessionResult = await db.query(
        `SELECT status FROM user_sessions WHERE session_id = $1 AND user_id = $2`,
        [req.user.session_id, req.user.user_id],
      );

      if (
        sessionResult.rows.length === 0 ||
        sessionResult.rows[0].status !== "active"
      ) {
        console.warn(
          `[authenticateToken] Session ID ${req.user.session_id} for user ${req.user.user_id} is inactive or not found.`,
        );
        return res
          .status(403)
          .json({
            message: "Session revoked or inactive. Please log in again.",
            code: "SESSION_REVOKED",
          });
      }
    } else {
      console.warn(
        "[authenticateToken] JWT payload missing session_id. Proceeding without session check.",
      );
    }

    next();
  } catch (err) {
    console.error(
      "[authenticateToken] Invalid or expired token. Error:",
      err.message,
    );
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// --- NO CHANGES NEEDED FOR authorizeRoles and optionalAuthenticateToken ---
// Your existing implementations for these will work perfectly with the updated req.user object.

/**
 * Middleware for role-based access control.
 * (No changes needed here)
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const flattenedAllowedRoles = Array.isArray(allowedRoles[0])
      ? allowedRoles[0]
      : allowedRoles;

    if (!req.user || !flattenedAllowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient privileges" });
    }

    if (req.user.role === "agency_admin" && req.params.agencyId) {
      if (parseInt(req.params.agencyId) !== req.user.agency_id) {
        return res
          .status(403)
          .json({
            message: "Access denied: You can only manage your own agency.",
          });
      }
    }

    next();
  };
};

/**
 * Middleware to optionally authenticate a user using a JWT token.
 * (No changes needed here, but it could be enhanced similarly if guest/authed features depended on it)
 */
const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    // For consistency, you could also fetch full user data here, but it's less critical
    // for optional authentication. The current implementation is fine.
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // You could enhance this with a DB call if needed
    next();
  } catch (err) {
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuthenticateToken,
};

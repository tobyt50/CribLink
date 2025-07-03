const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/logActivity');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { uploadToCloudinary, deleteFromCloudinary, getCloudinaryPublicId } = require('../utils/cloudinary'); // Import Cloudinary utilities

// Removed: const multer = require('multer'); // No longer needed
// Removed: const storage = multer.memoryStorage(); // No longer needed
// Removed: const upload = multer(...); // No longer needed
// Removed: exports.uploadMiddleware = upload; // No longer needed

const SECRET_KEY = process.env.JWT_KEY || 'lionel_messi_10_is_the_goat!';

// Configure Nodemailer (replace with your actual email service details)
const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., 'gmail', 'outlook'
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS // Your email password or app-specific password
    }
});

exports.signupUser = async (req, res) => {
    const { full_name, username, email, password, role, phone, agency, bio, location } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const validRoles = ['client', 'agent'];
        const safeRole = validRoles.includes(role) ? role : 'client';

        let queryText = `INSERT INTO users (full_name, username, email, password_hash, role`;
        let queryValues = [full_name, username, email, hashedPassword, safeRole];
        let valuePlaceholders = [`$1`, `$2`, `$3`, `$4`, `$5`];
        let paramIndex = 6;

        if (phone !== undefined) {
            queryText += `, phone`;
            valuePlaceholders.push(`$${paramIndex++}`);
            queryValues.push(phone);
        }
        if (agency !== undefined) {
            queryText += `, agency`;
            valuePlaceholders.push(`$${paramIndex++}`);
            queryValues.push(agency);
        }
        if (bio !== undefined) {
            queryText += `, bio`;
            valuePlaceholders.push(`$${paramIndex++}`);
            queryValues.push(bio);
        }
        if (location !== undefined) {
            queryText += `, location`;
            valuePlaceholders.push(`$${paramIndex++}`);
            queryValues.push(location);
        }
        queryText += `, share_favourites_with_agents`;
        valuePlaceholders.push(`$${paramIndex++}`);
        queryValues.push(false);
        queryText += `, share_property_preferences_with_agents`;
        valuePlaceholders.push(`$${paramIndex++}`);
        queryValues.push(false);

        queryText += `) VALUES (${valuePlaceholders.join(', ')}) RETURNING *`;

        const result = await db.query(queryText, queryValues);
        const newUser = result.rows[0];

        if (newUser.role === 'agent' || newUser.role === 'admin') {
            await logActivity(
                `New ${newUser.role} "${newUser.full_name}" registered`,
                newUser,
                newUser.role
              );
        }

        const token = jwt.sign({
            user_id: newUser.user_id,
            name: newUser.full_name,
            email: newUser.email,
            role: newUser.role
        }, SECRET_KEY, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered',
            token,
            user: {
                user_id: newUser.user_id,
                full_name: newUser.full_name,
                role: newUser.role,
                email: newUser.email,
                phone: newUser.phone,
                agency: newUser.agency,
                username: newUser.username,
                bio: newUser.bio,
                location: newUser.location,
                profile_picture_url: newUser.profile_picture_url,
                date_joined: newUser.date_joined,
                is_2fa_enabled: newUser.is_2fa_enabled,
                data_collection_opt_out: newUser.data_collection_opt_out,
                personalized_ads: newUser.personalized_ads,
                cookie_preferences: newUser.cookie_preferences,
                communication_email_updates: newUser.communication_email_updates,
                communication_marketing: newUser.communication_marketing,
                communication_newsletter: newUser.communication_newsletter,
                notifications_settings: newUser.notifications_settings,
                timezone: newUser.timezone,
                currency: newUser.currency,
                default_landing_page: newUser.default_landing_page,
                notification_email: newUser.notification_email,
                preferred_communication_channel: newUser.preferred_communication_channel,
                social_links: newUser.social_links,
                share_favourites_with_agents: newUser.share_favourites_with_agents,
                share_property_preferences_with_agents: newUser.share_property_preferences_with_agents
            }
        });
    } catch (err) {
        if (err.code === '23505') {
            if (err.constraint === 'users_email_key') {
                return res.status(400).json({ message: 'This email is already registered.' });
            }
            if (err.constraint === 'users_username_key') {
                return res.status(400).json({ message: 'This username is already taken.' });
            }
        }
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Registration failed unexpectedly.', error: err.message });
    }
};

exports.signinUser = async (req, res) => {
    const { email, password, device_info, location_info, ip_address } = req.body;

    let loginStatus = 'Failed';
    let user = null;

    try {
        const result = await db.query(
            `SELECT user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, profile_picture_public_id, status,
                    is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences,
                    communication_email_updates, communication_marketing, communication_newsletter,
                    notifications_settings, timezone, currency, default_landing_page, notification_email,
                    preferred_communication_channel, social_links, share_favourites_with_agents,
                    share_property_preferences_with_agents
             FROM users WHERE email = $1`,
            [email]
        );
        user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            if (user) {
                await db.query(
                    `INSERT INTO user_login_history (user_id, device, location, ip_address, status, message)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [user.user_id, device_info || 'Unknown', location_info || 'Unknown', ip_address || 'Unknown', 'Failed', 'Invalid password']
                );
            }
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.status === 'banned') {
            loginStatus = 'Failed';
            await logActivity(`Attempted sign-in by banned user: ${user.full_name} (${user.email})`, user, 'auth_banned');
            await db.query(
                `INSERT INTO user_login_history (user_id, device, location, ip_address, status, message)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [user.user_id, device_info || 'Unknown', location_info || 'Unknown', ip_address || 'Unknown', loginStatus, 'Account banned']
            );
            return res.status(403).json({ message: 'Your account has been banned.' });
        }
        if (user.status === 'deactivated') {
            loginStatus = 'Failed';
            await logActivity(`Attempted sign-in by deactivated user: ${user.full_name} (${user.email})`, user, 'auth_deactivated');
            await db.query(
                `INSERT INTO user_login_history (user_id, device, location, ip_address, status, message)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [user.user_id, device_info || 'Unknown', location_info || 'Unknown', ip_address || 'Unknown', loginStatus, 'Account deactivated']
            );
            return res.status(403).json({ message: 'Your account is deactivated. Please reactivate it to sign in.' });
        }

        await db.query(
            `UPDATE user_sessions SET is_current = FALSE WHERE user_id = $1`,
            [user.user_id]
        );

        const sessionResult = await db.query(
            `INSERT INTO user_sessions (user_id, device, location, ip_address, is_current)
             VALUES ($1, $2, $3, $4, TRUE) RETURNING session_id`,
            [user.user_id, device_info || 'Unknown', location_info || 'Unknown', ip_address || 'Unknown']
        );
        const newSessionId = sessionResult.rows[0].session_id;

        loginStatus = 'Success';
        await db.query(
            `INSERT INTO user_login_history (user_id, device, location, ip_address, status, message)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.user_id, device_info || 'Unknown', location_info || 'Unknown', ip_address || 'Unknown', loginStatus, 'Successful login']
        );

        const token = jwt.sign({
            user_id: user.user_id,
            name: user.full_name,
            email: user.email,
            role: user.role,
            status: user.status,
            session_id: newSessionId
        }, SECRET_KEY, { expiresIn: '7d' });

        await logActivity(`Sign in by ${user.role}: ${user.full_name}`, user, 'auth');

        res.json({
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                role: user.role,
                email: user.email,
                status: user.status,
                phone: user.phone,
                agency: user.agency,
                username: user.username,
                bio: user.bio,
                location: user.location,
                profile_picture_url: user.profile_picture_url,
                date_joined: user.date_joined,
                is_2fa_enabled: user.is_2fa_enabled,
                data_collection_opt_out: user.data_collection_opt_out,
                personalized_ads: user.personalized_ads,
                cookie_preferences: user.cookie_preferences,
                communication_email_updates: user.communication_email_updates,
                communication_marketing: user.communication_marketing,
                communication_newsletter: user.communication_newsletter,
                notifications_settings: user.notifications_settings,
                timezone: user.timezone,
                currency: user.currency,
                default_landing_page: user.default_landing_page,
                notification_email: user.notification_email,
                preferred_communication_channel: user.preferred_communication_channel,
                social_links: user.social_links,
                share_favourites_with_agents: user.share_favourites_with_agents,
                share_property_preferences_with_agents: user.share_property_preferences_with_agents
            }
        });
    } catch (err) {
        console.error('Login failed:', err);
        if (user && user.user_id) {
            await db.query(
                `INSERT INTO user_login_history (user_id, device, location, ip_address, status, message)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [user.user_id, device_info || 'Unknown', location_info || 'Unknown', ip_address || 'Unknown', 'Failed', `Server error: ${err.message}`]
            );
        } else {
            console.warn('Attempted to log a failed login for an unknown user or database error without a user_id.');
        }
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT user_id, full_name, username, email, role, date_joined, phone, agency, bio, location, profile_picture_url, profile_picture_public_id, status,
                    is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences,
                    communication_email_updates, communication_marketing, communication_newsletter,
                    notifications_settings, timezone, currency, default_landing_page, notification_email,
                    preferred_communication_channel, social_links, share_favourites_with_agents,
                    share_property_preferences_with_agents
             FROM users WHERE user_id = $1`,
            [req.user.user_id]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ message: 'User profile not found.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const {
        full_name, email, password, current_password_check, phone, agency, username, bio, location,
        is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences,
        communication_email_updates, communication_marketing, communication_newsletter,
        notifications_settings, timezone, currency, default_landing_page, notification_email,
        preferred_communication_channel, social_links, status,
        share_favourites_with_agents,
        share_property_preferences_with_agents
    } = req.body;
    const userId = req.user.user_id;

    try {
        const fields = [];
        const values = [];
        let idx = 1;

        if (full_name !== undefined) {
            fields.push(`full_name = $${idx++}`);
            values.push(full_name);
        }
        if (username !== undefined) {
            fields.push(`username = $${idx++}`);
            values.push(username);
        }
        if (phone !== undefined) {
            fields.push(`phone = $${idx++}`);
            values.push(phone);
        }
        if (agency !== undefined) {
            fields.push(`agency = $${idx++}`);
            values.push(agency);
        }
        if (bio !== undefined) {
            fields.push(`bio = $${idx++}`);
            values.push(bio);
        }
        if (location !== undefined) {
            fields.push(`location = $${idx++}`);
            values.push(location);
        }
        if (is_2fa_enabled !== undefined) {
            fields.push(`is_2fa_enabled = $${idx++}`);
            values.push(is_2fa_enabled);
        }
        if (data_collection_opt_out !== undefined) {
            fields.push(`data_collection_opt_out = $${idx++}`);
            values.push(data_collection_opt_out);
        }
        if (personalized_ads !== undefined) {
            fields.push(`personalized_ads = $${idx++}`);
            values.push(personalized_ads);
        }
        if (cookie_preferences !== undefined) {
            fields.push(`cookie_preferences = $${idx++}`);
            values.push(JSON.stringify(cookie_preferences));
        }
        if (communication_email_updates !== undefined) {
            fields.push(`communication_email_updates = $${idx++}`);
            values.push(communication_email_updates);
        }
        if (communication_marketing !== undefined) {
            fields.push(`communication_marketing = $${idx++}`);
            values.push(communication_marketing);
        }
        if (communication_newsletter !== undefined) {
            fields.push(`communication_newsletter = $${idx++}`);
            values.push(communication_newsletter);
        }
        if (notifications_settings !== undefined) {
            fields.push(`notifications_settings = $${idx++}`);
            values.push(JSON.stringify(notifications_settings));
        }
        if (timezone !== undefined) {
            fields.push(`timezone = $${idx++}`);
            values.push(timezone);
        }
        if (currency !== undefined) {
            fields.push(`currency = $${idx++}`);
            values.push(currency);
        }
        if (default_landing_page !== undefined) {
            fields.push(`default_landing_page = $${idx++}`);
            values.push(default_landing_page);
        }
        if (notification_email !== undefined) {
            fields.push(`notification_email = $${idx++}`);
            values.push(notification_email);
        }
        if (preferred_communication_channel !== undefined) {
            fields.push(`preferred_communication_channel = $${idx++}`);
            values.push(preferred_communication_channel);
        }
        if (social_links !== undefined) {
            fields.push(`social_links = $${idx++}`);
            values.push(JSON.stringify(social_links));
        }
        if (status !== undefined) {
            fields.push(`status = $${idx++}`);
            values.push(status);
        }
        if (share_favourites_with_agents !== undefined) {
            fields.push(`share_favourites_with_agents = $${idx++}`);
            values.push(share_favourites_with_agents);
        }
        if (share_property_preferences_with_agents !== undefined) {
            fields.push(`share_property_preferences_with_agents = $${idx++}`);
            values.push(share_property_preferences_with_agents);
        }

        if (password) {
            if (!current_password_check) {
                return res.status(400).json({ message: 'Current password is required to change password.' });
            }

            const userResult = await db.query('SELECT password_hash FROM users WHERE user_id = $1', [userId]);
            const user = userResult.rows[0];

            if (!user || !(await bcrypt.compare(current_password_check, user.password_hash))) {
                return res.status(401).json({ message: 'Incorrect current password.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push(`password_hash = $${idx++}`);
            values.push(hashedPassword);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        values.push(userId);

        const query = `UPDATE users SET ${fields.join(", ")} WHERE user_id = $${idx} RETURNING *`;
        const updatedUserResult = await db.query(query, values);

        if (updatedUserResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        res.json({ message: "Profile updated successfully!", user: updatedUserResult.rows[0] });

        await logActivity(`${req.user.name} updated their profile`, req.user, 'user');
    } catch (err) {
        if (err.code === '23505' && err.constraint === 'users_username_key') {
            return res.status(400).json({ message: 'Username already exists' });
        }
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        console.error('Update profile error:', err);
        res.status(500).json({ message: "Failed to update profile", error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const result = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000);

        await db.query(
            `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE user_id = $3`,
            [resetToken, resetTokenExpires, user.user_id]
        );

        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset. Please click this link to reset your password:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>
                   <p>This link will expire in 1 hour.</p>`
        };

        await transporter.sendMail(mailOptions);

        await logActivity(`Password reset link sent to ${user.email}`, user, 'auth_reset');

        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Failed to send password reset email.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const result = await db.query(
            `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()`,
            [token]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
            `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE user_id = $2`,
            [hashedPassword, user.user_id]
        );

        await logActivity(`Password reset for user: ${user.full_name}`, user, 'auth_reset_success');

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Failed to reset password.' });
    }
};

/**
 * Handles the upload and update of a user's profile picture URL using Cloudinary.
 * Expects `profile_picture_base64` (data URI) and `originalname` in `req.body`.
 */
exports.uploadProfilePicture = async (req, res) => {
    const userId = req.user.user_id;
    const { profile_picture_base64, originalname } = req.body; // Expect base64 data and original filename

    if (!profile_picture_base64 || !originalname) {
        return res.status(400).json({ message: 'No image data or original name provided.' });
    }

    try {
        // Fetch current user's profile picture details to delete the old one from Cloudinary
        const currentUserResult = await db.query('SELECT profile_picture_url, profile_picture_public_id FROM users WHERE user_id = $1', [userId]);
        const currentProfile = currentUserResult.rows[0];

        // If an old image exists and has a public_id, delete it from Cloudinary
        if (currentProfile && currentProfile.profile_picture_public_id) {
            await deleteFromCloudinary(currentProfile.profile_picture_public_id);
        }

        // Upload new image to Cloudinary
        // `Buffer.from(profile_picture_base64.split(',')[1], 'base64')` extracts the base64 data part
        const uploadResult = await uploadToCloudinary(Buffer.from(profile_picture_base64.split(',')[1], 'base64'), originalname, 'profile_pictures');
        const { url, publicId } = uploadResult;

        // Update user's profile_picture_url and profile_picture_public_id in the database
        const result = await db.query(
            `UPDATE users SET profile_picture_url = $1, profile_picture_public_id = $2 WHERE user_id = $3 RETURNING profile_picture_url, profile_picture_public_id`,
            [url, publicId, userId]
        );

        await logActivity(`${req.user.name} uploaded a new profile picture`, req.user, 'user_profile_picture');

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profile_picture_url: result.rows[0].profile_picture_url,
            profile_picture_public_id: result.rows[0].profile_picture_public_id
        });
    } catch (error) {
        console.error('Error uploading profile picture to Cloudinary:', error);
        res.status(500).json({ message: 'Failed to upload profile picture.', error: error.message });
    }
};

/**
 * Deletes a user's profile picture from Cloudinary and sets the URL to NULL in the database.
 */
exports.deleteProfilePicture = async (req, res) => {
    const userId = req.user.user_id;

    try {
        // Fetch current user's profile picture details to get the public_id
        const currentUserResult = await db.query('SELECT profile_picture_public_id FROM users WHERE user_id = $1', [userId]);
        const currentProfile = currentUserResult.rows[0];

        // If a public_id exists, delete the image from Cloudinary
        if (currentProfile && currentProfile.profile_picture_public_id) {
            await deleteFromCloudinary(currentProfile.profile_picture_public_id);
        }

        // Update the database to set profile_picture_url and public_id to NULL
        await db.query(
            `UPDATE users SET profile_picture_url = NULL, profile_picture_public_id = NULL WHERE user_id = $1`,
            [userId]
        );

        await logActivity(`${req.user.name} deleted their profile picture`, req.user, 'user_profile_picture');

        res.status(200).json({ message: 'Profile picture deleted successfully.' });
    } catch (error) {
        console.error('Error deleting profile picture from Cloudinary:', error);
        res.status(500).json({ message: 'Failed to delete profile picture.', error: error.message });
    }
};

/**
 * Updates a user's profile picture URL directly (e.g., if re-linking to an existing image).
 * This function is for updating the URL without uploading a new file.
 * It will also attempt to derive and store the public_id from the new URL.
 */
exports.updateProfilePictureUrl = async (req, res) => {
    const { profile_picture_url } = req.body;
    const userId = req.user.user_id;

    if (!profile_picture_url) {
        return res.status(400).json({ message: 'Profile picture URL is required.' });
    }

    try {
        // Fetch current user's profile picture details to delete the old one from Cloudinary
        const currentUserResult = await db.query('SELECT profile_picture_public_id FROM users WHERE user_id = $1', [userId]);
        const currentProfile = currentUserResult.rows[0];

        // If an old image exists and has a public_id, delete it from Cloudinary
        if (currentProfile && currentProfile.profile_picture_public_id) {
            await deleteFromCloudinary(currentProfile.profile_picture_public_id);
        }

        // Derive the public ID from the new URL
        const publicId = getCloudinaryPublicId(profile_picture_url);

        await db.query(
            `UPDATE users SET profile_picture_url = $1, profile_picture_public_id = $2 WHERE user_id = $3`,
            [profile_picture_url, publicId, userId]
        );

        await logActivity(`${req.user.name} updated their profile picture URL`, req.user, 'user_profile_picture');

        res.status(200).json({ message: 'Profile picture URL updated successfully.' });
    } catch (error) {
        console.error('Error updating profile picture URL:', error);
        res.status(500).json({ message: 'Failed to update profile picture URL.', error: error.message });
    }
};

// --- User Session Management ---

exports.getActiveSessions = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await db.query(
            `SELECT session_id, device, location, ip_address, last_activity, is_current, created_at
             FROM user_sessions WHERE user_id = $1 ORDER BY is_current DESC, last_activity DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching active sessions:', err);
        res.status(500).json({ message: 'Failed to fetch active sessions.', error: err.message });
    }
};

exports.revokeSession = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.user_id;
    const currentSessionId = req.user.session_id;

    if (parseInt(sessionId) === currentSessionId) {
        return res.status(400).json({ message: 'Cannot revoke current session through this endpoint. Please log out instead.' });
    }

    try {
        const result = await db.query(
            `DELETE FROM user_sessions WHERE session_id = $1 AND user_id = $2 RETURNING session_id`,
            [sessionId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found or not authorized to revoke.' });
        }

        await logActivity(`${req.user.name} revoked a session (ID: ${sessionId})`, req.user, 'security_session');
        res.status(200).json({ message: 'Session revoked successfully.' });
    } catch (err) {
        console.error('Error revoking session:', err);
        res.status(500).json({ message: 'Failed to revoke session.', error: err.message });
    }
};

// --- User Login History ---

exports.getLoginHistory = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await db.query(
            `SELECT history_id, device, location, ip_address, login_time, status, message
             FROM user_login_history WHERE user_id = $1 ORDER BY login_time DESC LIMIT 50`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching login history:', err);
        res.status(500).json({ message: 'Failed to fetch login history.', error: err.message });
    }
};

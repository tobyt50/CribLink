const db = require('../db'); // This should be your PostgreSQL connection pool
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/logActivity');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { uploadToCloudinary, deleteFromCloudinary, getCloudinaryPublicId } = require('../utils/cloudinary'); // Import Cloudinary utilities

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
    // Destructure all fields that can be sent from SignUp.js, including optional ones
    const { full_name, username, email, password, role, phone_number, agency_name, bio, location } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const validRoles = ['client', 'agent', 'agency_admin']; // NEW: Added 'agency_admin'
        const safeRole = validRoles.includes(role) ? role : 'client';

        let queryText = `INSERT INTO users (full_name, username, email, password_hash, role`;
        let queryValues = [full_name, username, email, hashedPassword, safeRole];
        let valuePlaceholders = [`$1`, `$2`, `$3`, `$4`, `$5`];
        let paramIndex = 6;

        if (phone_number !== undefined) {
            queryText += `, phone`;
            valuePlaceholders.push(`$${paramIndex++}`);
            queryValues.push(phone_number);
        }
        if (agency_name !== undefined) {
            queryText += `, agency`;
            valuePlaceholders.push(`$${paramIndex++}`);
            queryValues.push(agency_name);
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
        // NEW: Handle agency_id if provided during signup (e.g., for direct assignment by admin)
        // This part needs to be carefully managed. If an agency_id is provided at signup,
        // it implies the user is being directly assigned, not requesting to join or creating.
        // For self-signup, agency_id should typically be null initially for agents.
        // Leaving it as is for now based on previous context, but flagging for review if issues arise.
        if (req.body.agency_id !== undefined && req.body.agency_id !== null) {
            queryText += `, agency_id`;
            valuePlaceholders.push(`$${paramIndex++}`);
            queryValues.push(req.body.agency_id);
        }

        // Add default values for new user settings
        queryText += `, share_favourites_with_agents, share_property_preferences_with_agents`;
        valuePlaceholders.push(`$${paramIndex++}`, `$${paramIndex++}`);
        queryValues.push(false, false);


        queryText += `) VALUES (${valuePlaceholders.join(', ')}) RETURNING user_id, full_name, email, role, date_joined, last_login, status, profile_picture_url, bio, location, phone, agency, agency_id, username, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, notifications_settings, timezone, currency, default_landing_page, notification_email, preferred_communication_channel, social_links, share_favourites_with_agents, share_property_preferences_with_agents`; // NEW: Return agency_id and other fields

        const result = await db.query(queryText, queryValues);
        const newUser = result.rows[0];

        // Log the activity
        await logActivity(`User ${newUser.full_name} signed up as ${newUser.role}`, newUser.user_id, 'user_signup');

        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: newUser.user_id,
                name: newUser.full_name,
                email: newUser.email,
                role: newUser.role,
                agency_id: newUser.agency_id, // Include agency_id in token
                status: newUser.status
            },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully!',
            token,
            user: {
                user_id: newUser.user_id,
                full_name: newUser.full_name,
                email: newUser.email,
                role: newUser.role,
                date_joined: newUser.date_joined,
                last_login: newUser.last_login,
                status: newUser.status,
                profile_picture_url: newUser.profile_picture_url,
                bio: newUser.bio,
                location: newUser.location,
                phone: newUser.phone,
                agency: newUser.agency,
                agency_id: newUser.agency_id, // Include agency_id in response
                username: newUser.username,
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
            },
        });
    } catch (err) {
        console.error('Error during signup:', err);
        if (err.code === '23505') {
            // Duplicate email or username
            if (err.constraint === 'users_email_key') {
                return res.status(409).json({ message: 'This email is already registered.' });
            }
            if (err.constraint === 'users_username_key') {
                return res.status(409).json({ message: 'This username is already taken.' });
            }
        }
        res.status(500).json({ message: 'Failed to register user.', error: err.message });
    }
};

exports.signinUser = async (req, res) => {
    const { email, password, device_info, location_info, ip_address } = req.body;

    let loginStatus = 'Failed';
    let user = null;

    try {
        const result = await db.query(
            `SELECT user_id, full_name, username, email, password_hash, role, date_joined, phone, agency, bio, location, profile_picture_url, profile_picture_public_id, status, agency_id,
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
            session_id: newSessionId,
            agency_id: user.agency_id
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
                agency_id: user.agency_id,
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
        console.error('Sign in error:', err);
        res.status(500).json({ message: 'Sign in failed unexpectedly.', error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // req.user is populated by authenticateToken middleware
        const userId = req.user.user_id;

        const result = await db.query(
            `SELECT user_id, full_name, username, email, role, date_joined, last_login, status,
                    profile_picture_url, bio, location, phone, social_links, agency, agency_id, default_landing_page,
                    is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences,
                    communication_email_updates, communication_marketing, communication_newsletter,
                    notifications_settings, timezone, currency, notification_email,
                    preferred_communication_channel, share_favourites_with_agents,
                    share_property_preferences_with_agents
             FROM users WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Failed to fetch profile.', error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.user_id;
    const {
        full_name,
        username,
        bio,
        location,
        phone,
        social_links,
        default_landing_page,
        // Existing settings fields
        is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences,
        communication_email_updates, communication_marketing, communication_newsletter,
        notifications_settings, timezone, currency, notification_email,
        preferred_communication_channel, share_favourites_with_agents,
        share_property_preferences_with_agents,
        // Password change fields
        password, current_password_check
    } = req.body;

    try {
        const fieldsToUpdate = [];
        const values = [];
        let paramIndex = 1;

        if (full_name !== undefined) {
            fieldsToUpdate.push(`full_name = $${paramIndex++}`);
            values.push(full_name);
        }
        if (username !== undefined) {
            fieldsToUpdate.push(`username = $${paramIndex++}`);
            values.push(username);
        }
        if (bio !== undefined) {
            fieldsToUpdate.push(`bio = $${paramIndex++}`);
            values.push(bio);
        }
        if (location !== undefined) {
            fieldsToUpdate.push(`location = $${paramIndex++}`);
            values.push(location);
        }
        if (phone !== undefined) {
            fieldsToUpdate.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }
        if (social_links !== undefined) {
            fieldsToUpdate.push(`social_links = $${paramIndex++}`);
            values.push(JSON.stringify(social_links)); // Store as JSON string
        }
        if (default_landing_page !== undefined) {
            fieldsToUpdate.push(`default_landing_page = $${paramIndex++}`);
            values.push(default_landing_page);
        }
        // Existing settings fields
        if (is_2fa_enabled !== undefined) { fieldsToUpdate.push(`is_2fa_enabled = $${paramIndex++}`); values.push(is_2fa_enabled); }
        if (data_collection_opt_out !== undefined) { fieldsToUpdate.push(`data_collection_opt_out = $${paramIndex++}`); values.push(data_collection_opt_out); }
        if (personalized_ads !== undefined) { fieldsToUpdate.push(`personalized_ads = $${paramIndex++}`); values.push(personalized_ads); }
        if (cookie_preferences !== undefined) { fieldsToUpdate.push(`cookie_preferences = $${paramIndex++}`); values.push(JSON.stringify(cookie_preferences)); }
        if (communication_email_updates !== undefined) { fieldsToUpdate.push(`communication_email_updates = $${paramIndex++}`); values.push(communication_email_updates); }
        if (communication_marketing !== undefined) { fieldsToUpdate.push(`communication_marketing = $${paramIndex++}`); values.push(communication_marketing); }
        if (communication_newsletter !== undefined) { fieldsToUpdate.push(`communication_newsletter = $${paramIndex++}`); values.push(communication_newsletter); }
        if (notifications_settings !== undefined) { fieldsToUpdate.push(`notifications_settings = $${paramIndex++}`); values.push(JSON.stringify(notifications_settings)); }
        if (timezone !== undefined) { fieldsToUpdate.push(`timezone = $${paramIndex++}`); values.push(timezone); }
        if (currency !== undefined) { fieldsToUpdate.push(`currency = $${paramIndex++}`); values.push(currency); }
        if (notification_email !== undefined) { fieldsToUpdate.push(`notification_email = $${paramIndex++}`); values.push(notification_email); }
        if (preferred_communication_channel !== undefined) { fieldsToUpdate.push(`preferred_communication_channel = $${paramIndex++}`); values.push(preferred_communication_channel); }
        if (share_favourites_with_agents !== undefined) { fieldsToUpdate.push(`share_favourites_with_agents = $${paramIndex++}`); values.push(share_favourites_with_agents); }
        if (share_property_preferences_with_agents !== undefined) { fieldsToUpdate.push(`share_property_preferences_with_agents = $${paramIndex++}`); values.push(share_property_preferences_with_agents); }


        // Password change logic
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
            fieldsToUpdate.push(`password_hash = $${paramIndex++}`);
            values.push(hashedPassword);
        }

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        values.push(userId); // Add user_id for the WHERE clause

        const queryText = `UPDATE users SET ${fieldsToUpdate.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex} RETURNING user_id, full_name, username, email, role, date_joined, last_login, status, profile_picture_url, bio, location, phone, social_links, agency, agency_id, default_landing_page, is_2fa_enabled, data_collection_opt_out, personalized_ads, cookie_preferences, communication_email_updates, communication_marketing, communication_newsletter, notifications_settings, timezone, currency, notification_email, preferred_communication_channel, share_favourites_with_agents, share_property_preferences_with_agents`; // Ensure all fields are returned, including agency_id

        const result = await db.query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const updatedUser = result.rows[0];

        // Log the activity
        await logActivity(`User ${updatedUser.full_name} updated their profile`, updatedUser.user_id, 'profile_update');

        // Generate a new JWT token with updated user information
        const token = jwt.sign(
            {
                user_id: updatedUser.user_id,
                name: updatedUser.full_name,
                email: updatedUser.email,
                role: updatedUser.role,
                agency_id: updatedUser.agency_id, // Ensure agency_id is in the new token
                status: updatedUser.status,
                session_id: req.user.session_id, // Preserve current session ID
            },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Profile updated successfully!',
            user: {
                user_id: updatedUser.user_id,
                full_name: updatedUser.full_name,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                date_joined: updatedUser.date_joined,
                last_login: updatedUser.last_login,
                status: updatedUser.status,
                profile_picture_url: updatedUser.profile_picture_url,
                bio: updatedUser.bio,
                location: updatedUser.location,
                phone: updatedUser.phone,
                social_links: updatedUser.social_links,
                agency: updatedUser.agency,
                agency_id: updatedUser.agency_id, // Include agency_id in response
                default_landing_page: updatedUser.default_landing_page,
                is_2fa_enabled: updatedUser.is_2fa_enabled,
                data_collection_opt_out: updatedUser.data_collection_opt_out,
                personalized_ads: updatedUser.personalized_ads,
                cookie_preferences: updatedUser.cookie_preferences,
                communication_email_updates: updatedUser.communication_email_updates,
                communication_marketing: updatedUser.communication_marketing,
                communication_newsletter: updatedUser.communication_newsletter,
                notifications_settings: updatedUser.notifications_settings,
                timezone: updatedUser.timezone,
                currency: updatedUser.currency,
                notification_email: updatedUser.notification_email,
                preferred_communication_channel: updatedUser.preferred_communication_channel,
                share_favourites_with_agents: updatedUser.share_favourites_with_agents,
                share_property_preferences_with_agents: updatedUser.share_property_preferences_with_agents
            },
            token,
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        res.status(500).json({ message: 'Failed to update profile.', error: err.message });
    }
};


exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const result = await db.query('SELECT user_id, email FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User with that email does not exist.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = Date.now() + 3600000; // 1 hour

        await db.query(
            'UPDATE users SET password_reset_token = $1, password_reset_expires = TO_TIMESTAMP($2 / 1000) WHERE user_id = $3',
            [resetToken, passwordResetExpires, user.user_id]
        );

        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Failed to send password reset email.' });
            }
            res.status(200).json({ message: 'Password reset link sent to your email.' });
        });
    } catch (err) {
        console.error('Error in forgot password:', err);
        res.status(500).json({ message: 'Failed to process password reset request.', error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const result = await db.query(
            'SELECT user_id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
            [token]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
            'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE user_id = $2',
            [hashedPassword, user.user_id]
        );

        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (err) {
        console.error('Error in reset password:', err);
        res.status(500).json({ message: 'Failed to reset password.', error: err.message });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    const userId = req.user.user_id;
    const { profile_picture_base64, profile_picture_originalname } = req.body;

    if (!profile_picture_base64) {
        return res.status(400).json({ message: 'No image data provided.' });
    }

    try {
        // Fetch current user to get existing public_id if any
        const userResult = await db.query('SELECT profile_picture_public_id FROM users WHERE user_id = $1', [userId]);
        const oldPublicId = userResult.rows[0]?.profile_picture_public_id;

        // Upload new image
        // The uploadToCloudinary utility now handles the base64 string directly
        const uploadRes = await uploadToCloudinary(profile_picture_base64, profile_picture_originalname, 'criblink/profile_pictures');

        // Delete old image if it exists
        if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }

        // Update user record with new image URL and public ID
        const result = await db.query(
            'UPDATE users SET profile_picture_url = $1, profile_picture_public_id = $2 WHERE user_id = $3 RETURNING profile_picture_url',
            [uploadRes.url, uploadRes.publicId, userId] // Changed from secure_url and public_id to url and publicId
        );

        await logActivity(`User ${req.user.full_name} updated their profile picture`, userId, 'profile_picture_update');

        res.status(200).json({
            message: 'Profile picture uploaded successfully!',
            profile_picture_url: result.rows[0].profile_picture_url,
        });
    } catch (err) {
        console.error('Error uploading profile picture:', err);
        res.status(500).json({ message: 'Failed to upload profile picture.', error: err.message });
    }
};

exports.deleteProfilePicture = async (req, res) => {
    const userId = req.user.user_id;

    try {
        // Fetch current user to get existing public_id
        const userResult = await db.query('SELECT profile_picture_public_id FROM users WHERE user_id = $1', [userId]);
        const publicId = userResult.rows[0]?.profile_picture_public_id;

        if (!publicId) {
            return res.status(404).json({ message: 'No profile picture found to delete.' });
        }

        // Delete from Cloudinary
        await deleteFromCloudinary(publicId);

        // Update user record to clear picture URL and public ID
        await db.query(
            'UPDATE users SET profile_picture_url = NULL, profile_picture_public_id = NULL WHERE user_id = $1',
            [userId]
        );

        await logActivity(`User ${req.user.full_name} deleted their profile picture`, userId, 'profile_picture_delete');

        res.status(200).json({ message: 'Profile picture deleted successfully.' });
    } catch (err) {
        console.error('Error deleting profile picture:', err);
        res.status(500).json({ message: 'Failed to delete profile picture.', error: err.message });
    }
};

exports.updateProfilePictureUrl = async (req, res) => {
    const userId = req.user.user_id;
    const { url } = req.body;

    try {
        // If there was an old Cloudinary image, delete it first
        const userResult = await db.query('SELECT profile_picture_public_id FROM users WHERE user_id = $1', [userId]);
        const oldPublicId = userResult.rows[0]?.profile_picture_public_id;
        if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }

        // Update the URL in the database. Public ID will be null if setting an external URL.
        await db.query(
            'UPDATE users SET profile_picture_url = $1, profile_picture_public_id = NULL WHERE user_id = $2',
            [url, userId]
        );

        await logActivity(`User ${req.user.full_name} updated their profile picture URL`, userId, 'profile_picture_update');

        res.status(200).json({ message: 'Profile picture URL updated successfully.' });
    } catch (err) {
        console.error('Error updating profile picture URL:', err);
        res.status(500).json({ message: 'Failed to update profile picture URL.', error: err.message });
    }
};

// --- Session Management ---

exports.getActiveSessions = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await db.query(
            `SELECT session_id, device, location, ip_address, login_time
             FROM user_sessions WHERE user_id = $1 AND status = 'active' ORDER BY login_time DESC`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching active sessions:', err);
        res.status(500).json({ message: 'Failed to fetch active sessions.', error: err.message });
    }
};

exports.revokeSession = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.user_id;
    const currentSessionId = req.user.session_id;

    if (sessionId === currentSessionId) {
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
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching login history:', err);
        res.status(500).json({ message: 'Failed to fetch login history.', error: err.message });
    }
};

// --- NEW: Revert Agency Admin to Agent ---
exports.revertToAgent = async (req, res) => {
    const userId = req.user.user_id;
    const userRole = req.user.role;

    let client;
    try {
        client = await db.pool.connect();
        await client.query('BEGIN');

        // 1. Verify user is an agency_admin
        if (userRole !== 'agency_admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Forbidden: You are not an agency admin.' });
        }

        // 2. Get the agency_id they are currently admin of
        const userAgencyResult = await client.query('SELECT agency_id FROM users WHERE user_id = $1', [userId]);
        const agencyId = userAgencyResult.rows[0]?.agency_id;

        if (!agencyId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'You are not currently associated with an agency as an admin.' });
        }

        // 3. Check if the user is the designated agency_admin_id for their agency AND if there are no other admins in agency_members.
        // This prevents an agency from being left without an admin if the primary admin steps down.
        const agencyAdminCheck = await client.query(
            'SELECT agency_admin_id FROM agencies WHERE agency_id = $1',
            [agencyId]
        );
        const agencyInfo = agencyAdminCheck.rows[0];

        if (agencyInfo && agencyInfo.agency_admin_id === userId) {
            const otherAdmins = await client.query(
                `SELECT COUNT(*) FROM agency_members WHERE agency_id = $1 AND role = 'admin' AND agent_id != $2 AND request_status = 'accepted'`,
                [agencyId, userId]
            );

            if (parseInt(otherAdmins.rows[0].count) === 0) { // Corrected variable name from otherAdadmins to otherAdmins
                await client.query('ROLLBACK');
                return res.status(400).json({
                    message: 'You are the sole agency administrator. Please transfer agency ownership to another agent before stepping down, or delete the agency if it is no longer needed.'
                });
            }
        }

        // 4. Update user's role and remove agency affiliation in 'users' table
        const updatedUserResult = await client.query(
            `UPDATE users SET role = 'agent', agency_id = NULL, agency = NULL, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
            [userId]
        );
        const updatedUser = updatedUserResult.rows[0];

        // 5. Remove the user's entry from 'agency_members' (completely disconnect them from the agency)
        await client.query(
            `DELETE FROM agency_members WHERE agent_id = $1 AND agency_id = $2`,
            [userId, agencyId]
        );

        await client.query('COMMIT');

        // Generate a new token with the updated role
        const newToken = jwt.sign({
            user_id: userId,
            name: req.user.name, // Keep existing name
            email: req.user.email, // Keep existing email
            role: 'agent', // New role
            agency_id: null, // No longer affiliated
            status: req.user.status,
            session_id: req.user.session_id
        }, SECRET_KEY, { expiresIn: '7d' });

        await logActivity(`${req.user.name} reverted from agency admin to agent`, req.user, 'user_role_change');

        res.status(200).json({
            message: 'Successfully reverted to agent role.',
            user: {
                ...req.user, // Spread existing user info
                role: 'agent',
                agency_id: null,
                agency: null
            },
            token: newToken
        });

    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error reverting agency admin to agent:', err);
        res.status(500).json({ message: 'Failed to revert role.', error: err.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

// NEW: Endpoint to get a user's agency membership status
exports.getUserAgencyStatus = async (req, res) => {
    const { userId } = req.params;
    const performingUserId = req.user.user_id;

    // Authorization: A user can only check their own status
    if (parseInt(userId) !== performingUserId) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own agency status.' });
    }

    try {
        // First, check the user's primary agency_id from the users table
        const userResult = await db.query('SELECT agency_id, role FROM users WHERE user_id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const { agency_id: userAgencyId, role: userRole } = userResult.rows[0];

        if (userRole === 'agency_admin' && userAgencyId) {
            // Agency admin is always 'connected' to their agency
            return res.status(200).json({ status: 'connected', agency_id: userAgencyId });
        }

        if (userAgencyId) {
            // If user has an agency_id, check their status in agency_members
            const memberStatusResult = await db.query(
                `SELECT request_status, agency_id FROM agency_members WHERE agent_id = $1 AND agency_id = $2`,
                [userId, userAgencyId]
            );

            if (memberStatusResult.rows.length > 0) {
                return res.status(200).json({ status: memberStatusResult.rows[0].request_status, agency_id: memberStatusResult.rows[0].agency_id });
            } else {
                // This case ideally shouldn't happen if data is consistent:
                // user has agency_id but no corresponding entry in agency_members.
                // Treat as 'none' or 'disconnected'
                return res.status(200).json({ status: 'none', agency_id: null });
            }
        } else {
            // If user has no agency_id in their profile, check for any pending requests
            const pendingRequestResult = await db.query(
                `SELECT request_status, agency_id FROM agency_members WHERE agent_id = $1 AND request_status = 'pending'`,
                [userId]
            );
            if (pendingRequestResult.rows.length > 0) {
                return res.status(200).json({ status: 'pending', agency_id: pendingRequestResult.rows[0].agency_id });
            } else {
                return res.status(200).json({ status: 'none', agency_id: null });
            }
        }
    } catch (err) {
        console.error('Error fetching user agency status:', err);
        res.status(500).json({ message: 'Failed to fetch user agency status.', error: err.message });
    }
};

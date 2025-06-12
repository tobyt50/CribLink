const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/logActivity');
const crypto = require('crypto'); // For generating tokens
const nodemailer = require('nodemailer'); // For sending emails
const multer = require('multer'); // For handling file uploads
// In a real application, you would integrate with a cloud storage solution like
// Google Cloud Storage (@google-cloud/storage) or AWS S3 (aws-sdk).
// For this example, we'll simulate the storage and URL generation.

const SECRET_KEY = process.env.JWT_KEY || 'lionel_messi_10_is_the_goat!';

// Configure Nodemailer (replace with your actual email service details)
const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., 'gmail', 'outlook'
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS // Your email password or app-specific password
    }
});

// Configure Multer for file uploads
// Store files in memory. In production, consider diskStorage or cloud storage directly.
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single('profile_picture'); // 'profile_picture' is the expected field name in the form data

// Middleware to use Multer for file uploads (exported for route use)
exports.uploadMiddleware = upload;

exports.signupUser = async (req, res) => {
    // Destructure all potential fields from req.body
    const { full_name, email, password, role, phone_number, agency_name } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const validRoles = ['client', 'agent'];
        const safeRole = validRoles.includes(role) ? role : 'client';

        let queryText = `INSERT INTO users (full_name, email, password_hash, role`;
        let queryValues = [full_name, email, hashedPassword, safeRole];
        let valuePlaceholders = [`$1`, `$2`, `$3`, `$4`];
        let paramIndex = 5;

        // Conditionally add phone and agency fields to the query if role is 'agent'
        if (safeRole === 'agent') {
            queryText += `, phone, agency`;
            valuePlaceholders.push(`$${paramIndex++}`, `$${paramIndex++}`);
            queryValues.push(phone_number, agency_name);
        }

        queryText += `) VALUES (${valuePlaceholders.join(', ')}) RETURNING *`;

        const result = await db.query(queryText, queryValues);
        const newUser = result.rows[0];

        // Log activity if agent or admin signs up
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
        }, SECRET_KEY, { expiresIn: '1h' });

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
                profile_picture_url: newUser.profile_picture_url // Include profile picture URL
            }
        });
    } catch (err) {
        if (err.code === '23505') {
            if (err.constraint === 'users_email_key') {
                return res.status(400).json({ message: 'This email is already registered.' });
            }
            if (err.constraint === 'users_pkey') {
                return res.status(400).json({ message: 'A registration error occurred. Please try again or contact support if the problem persists.' });
            }
            // Add other unique constraints here if needed
            // Example: if (err.constraint === 'users_username_key') { ... }
        }
        console.error('Registration error:', err); // Log the full error for server-side debugging
        res.status(500).json({ message: 'Registration failed unexpectedly.', error: err.message });
    }
};


exports.signinUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if the user is banned
        if (user.status === 'banned') {
            // Log the attempt by a banned user for security purposes
            await logActivity(`Attempted sign-in by banned user: ${user.full_name} (${user.email})`, user, 'auth_banned');
            return res.status(403).json({ message: 'Your account has been banned.' });
        }

        const token = jwt.sign({
            user_id: user.user_id,
            name: user.full_name,
            email: user.email,
            role: user.role,
            status: user.status // Include status in the token payload
        }, SECRET_KEY, { expiresIn: '1h' });

        await logActivity(`Sign in by ${user.role}: ${user.full_name}`, user, 'auth');

        res.json({
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                role: user.role,
                email: user.email,
                status: user.status, // Include status in the returned user object
                phone: user.phone, // Include phone number
                agency: user.agency, // Include agency name
                username: user.username, // Include username
                bio: user.bio, // Include bio
                location: user.location, // Include location
                profile_picture_url: user.profile_picture_url // Include profile picture URL
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // Select all relevant fields for the user profile, including phone, agency, username, bio, location, and profile_picture_url
        const result = await db.query(
            `SELECT user_id, full_name, email, role, date_joined, phone, agency, username, bio, location, profile_picture_url FROM users WHERE user_id = $1`,
            [req.user.user_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    // Include phone, agency, username, bio, and location in the destructuring
    const { full_name, email, password, current_password_check, phone, agency, username, bio, location } = req.body; // Added current_password_check
    const userId = req.user.user_id;

    try {
        const fields = [];
        const values = [];
        let idx = 1;

        if (full_name) {
            fields.push(`full_name = $${idx++}`);
            values.push(full_name);
        }
        // Email update logic (usually requires verification, omitted for brevity here)
        // if (email) {
        //     fields.push(`email = $${idx++}`);
        //     values.push(email);
        // }

        // Password update logic - requires current_password_check
        if (password) {
            const userResult = await db.query('SELECT password_hash FROM users WHERE user_id = $1', [userId]);
            const user = userResult.rows[0];

            if (!user || !(await bcrypt.compare(current_password_check, user.password_hash))) {
                return res.status(401).json({ message: 'Incorrect current password.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push(`password_hash = $${idx++}`);
            values.push(hashedPassword);
        }
        // Add phone and agency to update fields
        if (phone) {
            fields.push(`phone = $${idx++}`);
            values.push(phone);
        }
        if (agency) {
            fields.push(`agency = $${idx++}`);
            values.push(agency);
        }
        // Add username, bio, and location to update fields
        if (username) {
            fields.push(`username = $${idx++}`);
            values.push(username);
        }
        if (bio) {
            fields.push(`bio = $${idx++}`);
            values.push(bio);
        }
        if (location) {
            fields.push(`location = $${idx++}`);
            values.push(location);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        values.push(userId);

        const query = `UPDATE users SET ${fields.join(", ")} WHERE user_id = $${idx}`;
        await db.query(query, values);

        res.json({ message: "Profile updated" });

        await logActivity(`${req.user.name} updated their profile`, req.user, 'user');
    } catch (err) {
        if (err.code === '23505' && err.constraint === 'users_username_key') {
            return res.status(400).json({ message: 'Username already exists' });
        }
        console.error('Update profile error:', err);
        res.status(500).json({ message: "Failed to update profile", error: err.message });
    }
};

// New function to handle forgot password request
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const result = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
        const user = result.rows[0];

        if (!user) {
            // For security, send a generic success message even if the email isn't found
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        // Set token expiry to 1 hour from now
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        // Store the token and its expiry in the database
        await db.query(
            `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE user_id = $3`,
            [resetToken, resetTokenExpires, user.user_id]
        );

        // Construct the reset URL (replace with your frontend's reset password page URL)
        const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`; // Assuming your frontend runs on port 3000

        // Send email
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

// New function to handle password reset
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

        // Update password and clear reset token fields
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

// --- Profile Picture Functions ---

/**
 * Handles the upload and update of a user's profile picture URL.
 * Assumes multer.single('profile_picture') has processed the file and it's available in req.file.
 */
exports.uploadProfilePicture = async (req, res) => {
    const userId = req.user.user_id; // User ID from authenticated token

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    // In a real application, you would upload req.file.buffer to cloud storage (e.g., GCS, S3)
    // and get a public URL in return.
    // For this example, we'll simulate a URL.
    const imageUrl = `https://placehold.co/128x128/E0F7FA/004D40?text=User+${userId}`; // Placeholder URL

    // Example of a more dynamic placeholder for development:
    // const imageUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${req.user.name}&backgroundColor=10b981,004d40&backgroundType=gradientLinear&radius=50`;

    try {
        const result = await db.query(
            `UPDATE users SET profile_picture_url = $1 WHERE user_id = $2 RETURNING profile_picture_url`,
            [imageUrl, userId]
        );

        await logActivity(`${req.user.name} uploaded a new profile picture`, req.user, 'user_profile_picture');

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profile_picture_url: result.rows[0].profile_picture_url
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Failed to upload profile picture.', error: error.message });
    }
};

/**
 * Deletes a user's profile picture by setting the URL to NULL.
 */
exports.deleteProfilePicture = async (req, res) => {
    const userId = req.user.user_id;

    try {
        // In a real application, you might also delete the actual image file from cloud storage here
        // based on the stored URL before updating the database.

        await db.query(
            `UPDATE users SET profile_picture_url = NULL WHERE user_id = $1`,
            [userId]
        );

        await logActivity(`${req.user.name} deleted their profile picture`, req.user, 'user_profile_picture');

        res.status(200).json({ message: 'Profile picture deleted successfully.' });
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        res.status(500).json({ message: 'Failed to delete profile picture.', error: error.message });
    }
};

/**
 * Updates a user's profile picture URL directly (e.g., if re-linking to an existing image).
 * This is an alternative to uploadProfilePicture if no new file is being uploaded.
 */
exports.updateProfilePictureUrl = async (req, res) => {
    const { profile_picture_url } = req.body;
    const userId = req.user.user_id;

    if (!profile_picture_url) {
        return res.status(400).json({ message: 'Profile picture URL is required.' });
    }

    try {
        await db.query(
            `UPDATE users SET profile_picture_url = $1 WHERE user_id = $2`,
            [profile_picture_url, userId]
        );

        await logActivity(`${req.user.name} updated their profile picture URL`, req.user, 'user_profile_picture');

        res.status(200).json({ message: 'Profile picture URL updated successfully.' });
    } catch (error) {
        console.error('Error updating profile picture URL:', error);
        res.status(500).json({ message: 'Failed to update profile picture URL.', error: error.message });
    }
};

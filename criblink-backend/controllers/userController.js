const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/logActivity');
const crypto = require('crypto'); // For generating tokens
const nodemailer = require('nodemailer'); // For sending emails

const SECRET_KEY = process.env.JWT_KEY || 'lionel_messi_10_is_the_goat!'; // Using process.env.JWT_KEY as a more standard name

// Configure Nodemailer (replace with your actual email service details)
const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., 'gmail', 'outlook'
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS // Your email password or app-specific password
    }
});

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

        // ✅ Log activity if agent or admin signs up
        if (newUser.role === 'agent' || newUser.role === 'admin') {
            await logActivity(
                `New ${newUser.role} "${newUser.full_name}" registered`,
                newUser,
                newUser.role // now dynamic: 'agent', 'admin', or 'client'
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
                phone: newUser.phone, // Include phone number
                agency: newUser.agency, // Include agency name
                username: newUser.username, // Include username
                bio: newUser.bio, // Include bio
                location: newUser.location // Include location
            }
        });
    } catch (err) {
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Registration failed', error: err.message });
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
                location: user.location // Include location
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // Select all relevant fields for the user profile, including phone, agency, username, bio, and location
        const result = await db.query(
            `SELECT user_id, full_name, email, role, date_joined, phone, agency, username, bio, location FROM users WHERE user_id = $1`,
            [req.user.user_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
};

// Add in userController.js
exports.updateProfile = async (req, res) => {
    // Include phone, agency, username, bio, and location in the destructuring
    const { full_name, email, password, phone, agency, username, bio, location } = req.body;
    const userId = req.user.user_id;
  
    try {
      const fields = [];
      const values = [];
      let idx = 1;
  
      if (full_name) {
        fields.push(`full_name = $${idx++}`);
        values.push(full_name);
      }
      if (email) {
        fields.push(`email = $${idx++}`);
        values.push(email);
      }
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        fields.push(`password_hash = $${idx++}`);
        values.push(hashed);
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

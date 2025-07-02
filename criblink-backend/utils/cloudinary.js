// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const DataUriParser = require('datauri/parser');
const parser = new DataUriParser();

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The buffer of the file to upload.
 * @param {string} originalname - The original name of the file (for extension inference).
 * @param {string} folder - The folder name in Cloudinary to store the image.
 * @returns {Promise<{url: string, publicId: string}>} - A promise that resolves to the secure URL and public ID of the uploaded image.
 * @throws {Error} If the upload to Cloudinary fails.
 */
const uploadToCloudinary = async (fileBuffer, originalname, folder) => {
    try {
        // Convert buffer to data URI format (e.g., data:image/png;base64,...)
        const fileUri = parser.format(originalname, fileBuffer).content;

        // Upload the data URI to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(fileUri, {
            folder: folder, // Specify the folder for organization
            resource_type: 'image' // Ensure it's treated as an image
        });

        // Return the secure URL and public ID from the upload result
        return { url: uploadResult.secure_url, publicId: uploadResult.public_id };
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Failed to upload image to cloud storage.');
    }
};

/**
 * Deletes an image from Cloudinary using its public ID.
 * @param {string} publicId - The public ID of the image to delete.
 * @returns {Promise<void>} - A promise that resolves when the image is deleted.
 */
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) {
        // If no publicId is provided, there's nothing to delete, so just return.
        return;
    }
    try {
        // Destroy the image on Cloudinary using its public ID
        await cloudinary.uploader.destroy(publicId);
        // console.log(`Deleted Cloudinary image: ${publicId}`); // Optional: log successful deletion
    } catch (error) {
        console.error(`Error deleting Cloudinary image ${publicId}:`, error);
        // Do not re-throw the error here, as deletion might fail if the image
        // is already gone from Cloudinary, and we don't want to halt the application
        // for a non-critical deletion failure. Just log it.
    }
};

/**
 * Extracts the Cloudinary public ID from a Cloudinary image URL.
 * This is crucial for deleting specific images from Cloudinary.
 * @param {string} url - The full Cloudinary URL of the image.
 * @returns {string|null} The public ID of the image, or null if not found.
 */
const getCloudinaryPublicId = (url) => {
    // Cloudinary URLs typically have a format like:
    // https://res.cloudinary.com/<cloud_name>/image/upload/<version>/<public_id>.<extension>
    // We need to extract the <public_id> part, which might include folders.

    // Split the URL by '/'
    const parts = url.split('/');
    // Find the index of 'upload' in the URL parts
    const uploadIndex = parts.indexOf('upload');

    // Ensure 'upload' is found and there are parts after it
    if (uploadIndex > -1 && parts.length > uploadIndex + 1) {
        // Get the segment of the URL that contains the version and public ID
        const publicIdWithExtension = parts.slice(uploadIndex + 1).join('/');

        // Remove the version number (e.g., 'v1234567890/') if present.
        // The regex /v\d+\// matches 'v' followed by one or more digits and a slash.
        const publicIdWithoutVersion = publicIdWithExtension.replace(/v\d+\//, '');

        // Remove the file extension (e.g., '.jpg', '.png')
        // The substring(0, lastIndexOf('.')) method gets everything before the last dot.
        return publicIdWithoutVersion.substring(0, publicIdWithoutVersion.lastIndexOf('.'));
    }
    return null; // Return null if the public ID cannot be extracted
};

// Export the functions for use in other modules
module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary,
    getCloudinaryPublicId
};

// utils/cloudinary.js
const cloudinary = require("cloudinary").v2;
const DataUriParser = require("datauri/parser");
const parser = new DataUriParser();
const path = require("path"); // Added for path.parse

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file (provided as base64 string) to Cloudinary.
 * @param {string} fileBase64 - The base64 string of the file to upload (e.g., "data:image/png;base64,...").
 * @param {string} originalname - The original name of the file (for extension inference and filename).
 * @param {string} folder - The folder name in Cloudinary to store the file.
 * @param {string} [resourceType='image'] - The type of resource to upload ('image', 'video', 'raw', 'auto').
 * @param {string} [explicitPublicId=null] - Optional: An explicit public ID to use. If not provided, Cloudinary will derive it.
 * @returns {Promise<{url: string, publicId: string}>} - A promise that resolves to the secure URL and public ID of the uploaded file.
 * @throws {Error} If the upload to Cloudinary fails.
 */
const uploadToCloudinary = async (
  fileBase64,
  originalname,
  folder,
  resourceType = "image",
  explicitPublicId = null,
) => {
  try {
    // Ensure fileBase64 is a valid string and contains the data URI prefix
    if (
      !fileBase64 ||
      typeof fileBase64 !== "string" ||
      !fileBase64.includes(";base64,")
    ) {
      throw new Error(
        "Invalid or malformed base64 string provided. It must be a data URI.",
      );
    }

    // Extract the base64 data part (remove "data:mime/type;base64,")
    const base64Data = fileBase64.split(",")[1];
    if (!base64Data) {
      throw new Error(
        "Invalid base64 string provided: missing data part after comma.",
      );
    }
    const fileBuffer = Buffer.from(base64Data, "base64");

    // Ensure originalname is a string. Provide a fallback if it's not.
    const safeOriginalname =
      typeof originalname === "string" && originalname.length > 0
        ? originalname
        : "untitled.png"; // Default filename to prevent mimer error

    // Convert buffer to data URI format (e.g., data:image/png;base64,...)
    const fileUri = parser.format(safeOriginalname, fileBuffer).content;

    // Determine public_id options based on resourceType and explicitPublicId
    let publicIdOption = {};
    if (explicitPublicId) {
      // If an explicit publicId is given, use it. This is typically for 'raw' files where full filename is desired.
      publicIdOption = { public_id: explicitPublicId };
    } else if (resourceType === "image" || resourceType === "video") {
      // For images/videos, use the original filename (without extension) as public_id by default,
      // and let Cloudinary manage the extension.
      publicIdOption = { use_filename: true, unique_filename: false };
    } else if (resourceType === "raw") {
      // For 'raw' files without an explicitPublicId, use the full original filename including extension.
      const fileBaseName = path.parse(safeOriginalname).name;
      const fileExtension = path.extname(safeOriginalname);
      publicIdOption = { public_id: `${fileBaseName}${fileExtension}` };
    } else {
      // For 'auto' or other types without explicitPublicId, default to using filename.
      publicIdOption = { use_filename: true, unique_filename: false };
    }

    // Upload the data URI to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(fileUri, {
      folder,
      resource_type: resourceType,
      ...publicIdOption, // Spread the determined public_id options
    });

    // Return the secure URL and public ID from the upload result
    return { url: uploadResult.secure_url, publicId: uploadResult.public_id };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    // Re-throw a more generic error message to the caller
    throw new Error("Failed to upload file to cloud storage.");
  }
};

/**
 * Deletes an image from Cloudinary using its public ID.
 * @param {string} publicId - The public ID of the image to delete.
 * @returns {Promise<void>} - A promise that resolves when the image is deleted.
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    // Determine resource type for deletion based on publicId (heuristic: check for common image extensions)
    // This is a simplification; ideally, you'd store resource_type in your DB.
    // For now, if it has a common image extension, assume 'image', else 'raw'.
    const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff|webp|svg)$/i.test(publicId);
    const resourceType = isImage ? "image" : "raw"; // Default to raw if not clearly an image

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType, // Use determined resource type for deletion
    });
    console.log("✅ Cloudinary deletion result:", result);
  } catch (error) {
    console.error(`❌ Error deleting Cloudinary file ${publicId}:`, error);
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
  const parts = url.split("/");
  // Find the index of 'upload' in the URL parts
  const uploadIndex = parts.indexOf("upload");

  // Ensure 'upload' is found and there are parts after it
  if (uploadIndex > -1 && parts.length > uploadIndex + 1) {
    // Get the segment of the URL that contains the version and public ID
    const publicIdWithExtension = parts.slice(uploadIndex + 1).join("/");

    // Remove the version number (e.g., 'v1234567890/') if present.
    // The regex /v\\d+\\// matches 'v' followed by one or more digits and a slash.
    const publicIdWithoutVersion = publicIdWithExtension.replace(
      new RegExp("v\\d+\\/"),
      "",
    );

    // Remove the file extension (e.g., '.jpg', '.png')
    // The substring(0, lastIndexOf('.')) method gets everything before the last dot.
    return publicIdWithoutVersion.substring(
      0,
      publicIdWithoutVersion.lastIndexOf("."),
    );
  }
  return null; // Return null if the public ID cannot be extracted
};

// Export the functions for use in other modules
module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryPublicId,
};

const multer = require('multer');
const path = require('path');

// Configure Multer to store files in memory.
// This is crucial when using cloud storage like Cloudinary,
// as you'll send the file buffer directly to the cloud service.
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only JPEG, JPG, PNG, and WEBP images are allowed.'));
    }
};

// Initialize multer with memory storage and file filter
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Increased limit to 10MB for larger images
});

module.exports = upload;

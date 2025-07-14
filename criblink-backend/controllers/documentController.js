const db = require('../db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary'); // Import deleteFromCloudinary

exports.uploadLegalDocument = async (req, res) => {
  try {
    // Destructure all fields from the request body, including fileBase64 and fileName
    const { title, client_name, property_id, document_type, status, completion_date, fileBase64, fileName } = req.body;

    // Basic validation for required fields
    if (!title || !document_type || !fileBase64 || !fileName) {
      return res.status(400).json({ message: 'Missing required document fields or file data.' });
    }

    let documentUrl = null;
    let publicId = null;

    // If a fileBase64 is provided, upload it to Cloudinary
    if (fileBase64 && fileName) {
      try {
        // Extract the base64 data part (remove "data:mime/type;base64,")
        const base64Data = fileBase64.split(',')[1];
        const fileBuffer = Buffer.from(base64Data, 'base64');

        // Upload to Cloudinary, specifying 'raw' resource type for legal documents
        const uploadResult = await uploadToCloudinary(
          fileBuffer,
          fileName,
          'criblink/legal_documents', // Dedicated folder for legal documents
          'raw' // Important: Treat as a raw file, not an image
        );
        documentUrl = uploadResult.url;
        publicId = uploadResult.publicId;
      } catch (uploadError) {
        console.error('Cloudinary Upload Error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload document to cloud storage.' });
      }
    }

    // Insert document metadata and Cloudinary details into the database
    await db.query(
      `INSERT INTO legal_documents (title, client_name, property_id, document_type, status, upload_date, completion_date, document_url, public_id)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)`,
      [title, client_name, property_id, document_type, status, completion_date, documentUrl, publicId]
    );

    res.status(201).json({ message: 'Legal document uploaded successfully.' });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload legal document.' });
  }
};

exports.getLegalDocuments = async (req, res) => {
  try {
    const { search, document_type, status, page = 1, limit = 10 } = req.query;
    let query = `SELECT * FROM legal_documents WHERE 1=1`;
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR client_name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    if (document_type && document_type.toLowerCase() !== 'all') {
      query += ` AND document_type = $${paramIndex}`;
      queryParams.push(document_type);
      paramIndex++;
    }
    if (status && status.toLowerCase() !== 'all' && status.toLowerCase() !== 'all statuses') {
      query += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Add ordering (e.g., by upload_date descending)
    query += ` ORDER BY upload_date DESC`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count for pagination metadata
    let countQuery = `SELECT COUNT(*) FROM legal_documents WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR client_name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    if (document_type && document_type.toLowerCase() !== 'all') {
      countQuery += ` AND document_type = $${countParamIndex}`;
      countParams.push(document_type);
      countParamIndex++;
    }
    if (status && status.toLowerCase() !== 'all' && status.toLowerCase() !== 'all statuses') {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    const totalResult = await db.query(countQuery, countParams);
    const totalDocuments = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      documents: result.rows,
      total: totalDocuments,
      totalPages: totalPages,
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    res.status(500).json({ message: 'Failed to fetch legal documents.' });
  }
};

exports.deleteLegalDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { publicId } = req.body; // Expect publicId from frontend for Cloudinary deletion

    // First, retrieve the document to ensure it exists and get its public_id if not provided
    const docResult = await db.query(`SELECT public_id FROM legal_documents WHERE document_id = $1`, [id]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ message: 'Legal document not found.' });
    }
    const documentPublicId = publicId || docResult.rows[0].public_id;

    // Delete from Cloudinary if a public ID exists
    if (documentPublicId) {
      await deleteFromCloudinary(documentPublicId);
    }

    // Then, delete from the database
    await db.query(`DELETE FROM legal_documents WHERE document_id = $1`, [id]);

    res.status(200).json({ message: 'Legal document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting legal document:', error);
    res.status(500).json({ message: 'Failed to delete legal document.' });
  }
};

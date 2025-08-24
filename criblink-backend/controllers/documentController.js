const db = require("../db");
const path = require("path");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary"); // Import deleteFromCloudinary
const slugify = require("slugify"); // Ensure slugify is imported

exports.uploadLegalDocument = async (req, res) => {
  try {
    // Destructure all fields from the request body, including fileBase64 and fileName
    const {
      title,
      client_name,
      property_id,
      document_type,
      status,
      completion_date,
      fileBase64,
      fileName,
    } = req.body;
    // Get user_id and agency_id from the authenticated user
    const agent_id = req.user.user_id;
    const agency_id = req.user.agency_id || null; // agency_id will be null for system admins

    // Basic validation for required fields
    if (!title || !document_type || !fileBase64 || !fileName) {
      return res
        .status(400)
        .json({ message: "Missing required document fields or file data." });
    }

    let documentUrl = null;
    let publicId = null;

    // If a fileBase64 is provided, upload it to Cloudinary
    if (fileBase64 && fileName) {
      try {
        const fileExtension = path.extname(fileName);
        const fileBaseName = path.parse(fileName).name;
        const safeFileBaseName = slugify(fileBaseName, {
          lower: false,
          strict: true,
        });
        const fullPublicId = `${safeFileBaseName}${fileExtension}`;

        const uploadResult = await uploadToCloudinary(
          fileBase64, // Corrected from fileBase66 to fileBase64
          fileName,
          "criblink/legal_documents",
          "raw",
          fullPublicId,
        );
        console.log("✅ Cloudinary saved publicId:", uploadResult.publicId);
        documentUrl = uploadResult.url;
        publicId = uploadResult.publicId;
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);
        return res
          .status(500)
          .json({ message: "Failed to upload document to cloud storage." });
      }
    }

    // Insert document metadata and Cloudinary details into the database
    // NEW: Added agent_id and agency_id to the insert query
    await db.query(
      `INSERT INTO legal_documents (title, client_name, property_id, document_type, status, upload_date, completion_date, document_url, public_id, agent_id, agency_id)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10)`,
      [
        title,
        client_name,
        property_id,
        document_type,
        status,
        completion_date,
        documentUrl,
        publicId,
        agent_id,
        agency_id,
      ],
    );

    res.status(201).json({ message: "Legal document uploaded successfully." });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Failed to upload legal document." });
  }
};

exports.getLegalDocuments = async (req, res) => {
  try {
    const { search, document_type, status, page = 1, limit = 10 } = req.query; // Removed agent_id, agency_id from destructuring
    const userRole = req.user.role;
    const userAgencyId = req.user.agency_id; // Agency ID of the authenticated user

    let query = `
      SELECT
          ld.*,
          u.full_name AS agent_name,
          a.name AS agency_name -- Corrected from a.agency_name to a.name
      FROM
          legal_documents ld
      LEFT JOIN
          users u ON ld.agent_id = u.user_id
      LEFT JOIN
          agencies a ON ld.agency_id = a.agency_id
      WHERE
          1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    // Role-based filtering
    if (userRole === "agency_admin" && userAgencyId) {
      query += ` AND ld.agency_id = $${paramIndex}`;
      queryParams.push(userAgencyId);
      paramIndex++;
    }

    // General search term (title, client_name, agent_name, agency_name, property_id)
    if (search) {
      query += ` AND (
          ld.title ILIKE $${paramIndex} OR
          ld.client_name ILIKE $${paramIndex + 1} OR
          CAST(ld.property_id AS TEXT) ILIKE $${paramIndex + 2} OR -- Search by property_id
          u.full_name ILIKE $${paramIndex + 3} OR -- Search by agent name
          a.name ILIKE $${paramIndex + 4} -- Search by agency name
      )`;
      const searchTermLike = `%${search}%`;
      // Push the search term for each ILIKE clause with distinct parameter indices
      queryParams.push(
        searchTermLike,
        searchTermLike,
        searchTermLike,
        searchTermLike,
        searchTermLike,
      );
      paramIndex += 5; // Increment by 5 for five parameters
    }

    // Specific filters
    if (document_type && document_type.toLowerCase() !== "all") {
      query += ` AND ld.document_type = $${paramIndex}`;
      queryParams.push(document_type);
      paramIndex++;
    }
    if (
      status &&
      status.toLowerCase() !== "all" &&
      status.toLowerCase() !== "all statuses"
    ) {
      query += ` AND ld.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Removed Admin-specific search filters (agent_id, agency_id) as they are now part of general search

    // Add ordering (e.g., by upload_date descending)
    query += ` ORDER BY ld.upload_date DESC`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    // Get total count for pagination metadata
    let countQuery = `
      SELECT COUNT(*)
      FROM legal_documents ld
      LEFT JOIN users u ON ld.agent_id = u.user_id
      LEFT JOIN agencies a ON ld.agency_id = a.agency_id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    // Role-based filtering for count
    if (userRole === "agency_admin" && userAgencyId) {
      countQuery += ` AND ld.agency_id = $${countParamIndex}`;
      countParams.push(userAgencyId);
      countParamIndex++;
    }

    // General search term for count
    if (search) {
      countQuery += ` AND (
          ld.title ILIKE $${countParamIndex} OR
          ld.client_name ILIKE $${countParamIndex + 1} OR
          CAST(ld.property_id AS TEXT) ILIKE $${countParamIndex + 2} OR
          u.full_name ILIKE $${countParamIndex + 3} OR
          a.name ILIKE $${countParamIndex + 4}
      )`;
      const searchTermLike = `%${search}%`;
      // Push the search term for each ILIKE clause with distinct parameter indices
      countParams.push(
        searchTermLike,
        searchTermLike,
        searchTermLike,
        searchTermLike,
        searchTermLike,
      );
      countParamIndex += 5;
    }

    // Specific filters for count
    if (document_type && document_type.toLowerCase() !== "all") {
      countQuery += ` AND ld.document_type = $${countParamIndex}`;
      countParams.push(document_type);
      countParamIndex++;
    }
    if (
      status &&
      status.toLowerCase() !== "all" &&
      status.toLowerCase() !== "all statuses"
    ) {
      countQuery += ` AND ld.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    // Removed Admin-specific search filters for count

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
    console.error("Error fetching legal documents:", error);
    res.status(500).json({ message: "Failed to fetch legal documents." });
  }
};

exports.deleteLegalDocument = async (req, res) => {
  try {
    console.log("🔥 DELETE request received for doc ID:", req.params.id);
    console.log("🧾 publicId received:", req.body.publicId);

    const { id } = req.params;
    const { publicId } = req.body;
    const userRole = req.user.role;
    const userId = req.user.user_id;
    const userAgencyId = req.user.agency_id;

    // 1. Retrieve public_id and document's agent_id/agency_id from DB
    const result = await db.query(
      `SELECT public_id, agent_id, agency_id FROM legal_documents WHERE document_id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Legal document not found." });
    }
    const documentInfo = result.rows[0];
    const documentPublicId = publicId || documentInfo.public_id;
    const documentAgentId = documentInfo.agent_id;
    const documentAgencyId = documentInfo.agency_id;

    // Authorization check:
    // Admin can delete any document.
    // Agency Admin can only delete documents belonging to their agency.
    if (userRole === "agency_admin") {
      if (!userAgencyId || documentAgencyId !== userAgencyId) {
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You can only delete documents associated with your agency.",
          });
      }
    } else if (userRole !== "admin") {
      // This case should ideally not be hit if authorizeRoles is set correctly, but as a fallback
      return res
        .status(403)
        .json({
          message:
            "Forbidden: You do not have permission to delete legal documents.",
        });
    }

    // 2. Delete from Cloudinary
    if (documentPublicId) {
      await deleteFromCloudinary(documentPublicId);
    }

    // 3. Delete from PostgreSQL
    await db.query(`DELETE FROM legal_documents WHERE document_id = $1`, [id]);

    res.status(200).json({ message: "Legal document deleted successfully." });
  } catch (error) {
    console.error("Error deleting legal document:", error);
    res.status(500).json({ message: "Failed to delete legal document." });
  }
};

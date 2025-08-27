// controllers/settingsController.js
const pool = require("../db"); // Your database connection pool
const logActivity = require("../utils/logActivity"); // Assuming this utility exists

// @desc    Get all admin settings
// @route   GET /api/admin/settings
// @access  Admin
const getAdminSettings = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM admin_settings WHERE id = 1",
    );
    if (result.rows.length === 0) {
      // If no settings exist (e.g., first run after schema creation), insert defaults
      await pool.query(`
                INSERT INTO admin_settings (
                    id, default_list_view, sidebar_permanently_expanded, email_notifications, sms_notifications,
                    in_app_notifications, sender_email, smtp_host, require_2fa, min_password_length,
                    crm_integration_enabled, analytics_id, auto_approve_listings, enable_comments,
                    maintenance_mode, database_backup_scheduled
                ) VALUES (
                    1, 'simple', FALSE, TRUE, FALSE,
                    TRUE, 'admin@example.com', 'smtp.example.com', FALSE, 8,
                    FALSE, '', FALSE, TRUE,
                    FALSE, FALSE
                ) ON CONFLICT (id) DO NOTHING;
            `);
      // Then fetch the newly inserted defaults
      const newResult = await pool.query(
        "SELECT * FROM admin_settings WHERE id = 1",
      );
      return res.status(200).json(newResult.rows[0]);
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching admin settings." });
  }
};

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Admin
const updateAdminSettings = async (req, res) => {
  const {
    default_list_view,
    sidebar_permanently_expanded,
    email_notifications,
    sms_notifications,
    in_app_notifications,
    sender_email,
    smtp_host,
    require_2fa,
    min_password_length,
    crm_integration_enabled,
    analytics_id,
    auto_approve_listings,
    enable_comments,
    maintenance_mode,
    database_backup_scheduled,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE admin_settings SET
                default_list_view = COALESCE($1, default_list_view),
                sidebar_permanently_expanded = COALESCE($2, sidebar_permanently_expanded),
                email_notifications = COALESCE($3, email_notifications),
                sms_notifications = COALESCE($4, sms_notifications),
                in_app_notifications = COALESCE($5, in_app_notifications),
                sender_email = COALESCE($6, sender_email),
                smtp_host = COALESCE($7, smtp_host),
                require_2fa = COALESCE($8, require_2fa),
                min_password_length = COALESCE($9, min_password_length),
                crm_integration_enabled = COALESCE($10, crm_integration_enabled),
                analytics_id = COALESCE($11, analytics_id),
                auto_approve_listings = COALESCE($12, auto_approve_listings),
                enable_comments = COALESCE($13, enable_comments),
                maintenance_mode = COALESCE($14, maintenance_mode),
                database_backup_scheduled = COALESCE($15, database_backup_scheduled),
                last_updated = CURRENT_TIMESTAMP
            WHERE id = 1 RETURNING *`,
      [
        default_list_view,
        sidebar_permanently_expanded,
        email_notifications,
        sms_notifications,
        in_app_notifications,
        sender_email,
        smtp_host,
        require_2fa,
        min_password_length,
        crm_integration_enabled,
        analytics_id,
        auto_approve_listings,
        enable_comments,
        maintenance_mode,
        database_backup_scheduled,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Admin settings not found." });
    }
    // Log activity only if req.user is available
    if (req.user) {
      await logActivity(
        `${req.user.full_name} updated admin settings.`,
        req.user,
        "admin_settings_update",
      );
    }
    res
      .status(200)
      .json({
        message: "Admin settings updated successfully.",
        settings: result.rows[0],
      });
  } catch (error) {
    console.error("Error updating admin settings:", error);
    res
      .status(500)
      .json({ message: "Server error while updating admin settings." });
  }
};

// @desc    Simulate clearing cache
// @route   POST /api/admin/clear-cache
// @access  Admin
const clearApplicationCache = async (req, res) => {
  try {
    console.log("Simulating cache clear...");
    // Log activity only if req.user is available
    if (req.user) {
      await logActivity(
        `${req.user.full_name} cleared application cache.`,
        req.user,
        "application_cache_clear",
      );
    }
    res
      .status(200)
      .json({ message: "Application cache cleared successfully (simulated)." });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({ message: "Server error while clearing cache." });
  }
};

// @desc    Simulate database backup
// @route   POST /api/admin/backup-database
// @access  Admin
const backupDatabase = async (req, res) => {
  try {
    console.log("Simulating database backup...");
    // Log activity only if req.user is available
    if (req.user) {
      await logActivity(
        `${req.user.full_name} initiated a database backup.`,
        req.user,
        "database_backup",
      );
    }
    res.status(200).json({ message: "Database backup initiated (simulated)." });
  } catch (error) {
    console.error("Error performing database backup:", error);
    res
      .status(500)
      .json({ message: "Server error while performing database backup." });
  }
};

// @desc    Simulate viewing error logs
// @route   GET /api/admin/error-logs
// @access  Admin
const viewErrorLogs = async (req, res) => {
  try {
    const simulatedLogs = [
      {
        timestamp: new Date(),
        level: "ERROR",
        message: "Failed to connect to external CRM service.",
        code: "CRM-001",
      },
      {
        timestamp: new Date(Date.now() - 3600000),
        level: "WARN",
        message: "High load detected on API endpoint /listings.",
        code: "PERF-002",
      },
      {
        timestamp: new Date(Date.now() - 7200000),
        level: "ERROR",
        message: "Database connection pool exhausted.",
        code: "DB-003",
      },
    ];
    // Log activity only if req.user is available
    if (req.user) {
      await logActivity(
        `${req.user.full_name} viewed error logs.`,
        req.user,
        "view_error_logs",
      );
    }
    res
      .status(200)
      .json({
        message: "Simulated error logs retrieved successfully.",
        logs: simulatedLogs,
      });
  } catch (error) {
    console.error("Error viewing error logs:", error);
    res.status(500).json({ message: "Server error while viewing error logs." });
  }
};

// --- Agent Settings ---

// @desc    Get agent-specific settings
// @route   GET /api/agent/settings
// @access  Agent (authenticated user)
const getAgentSettings = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const result = await pool.query(
      "SELECT * FROM agent_settings WHERE user_id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      // If no settings exist for the agent, insert defaults and return them
      const defaultSettings = {
        user_id: userId,
        two_factor_enabled: false,
        email_notifications: true,
        in_app_notifications: true,
        new_inquiry_alert: true,
        ticket_update_alert: true,
        is_available: true,
        default_signature: "",
        auto_assign_inquiries: false,
        theme: "system",
        default_list_view: "simple",
        sidebar_permanently_expanded: false,
        language: "en",
      };

      await pool.query(
        `INSERT INTO agent_settings (
                    user_id, two_factor_enabled, email_notifications, in_app_notifications,
                    new_inquiry_alert, ticket_update_alert, is_available, default_signature,
                    auto_assign_inquiries, theme, default_list_view, sidebar_permanently_expanded, language
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (user_id) DO NOTHING RETURNING *`,
        Object.values(defaultSettings),
      );
      return res.status(200).json(defaultSettings); // Return default settings
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching agent settings:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching agent settings." });
  }
};

// @desc    Update agent-specific settings
// @route   PUT /api/agent/settings
// @access  Agent (authenticated user)
const updateAgentSettings = async (req, res) => {
  const userId = req.user.user_id;
  const {
    two_factor_enabled,
    email_notifications,
    in_app_notifications,
    new_inquiry_alert,
    ticket_update_alert,
    is_available,
    default_signature,
    auto_assign_inquiries,
    theme,
    default_list_view,
    sidebar_permanently_expanded,
    language,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO agent_settings (
                user_id, two_factor_enabled, email_notifications, in_app_notifications,
                new_inquiry_alert, ticket_update_alert, is_available, default_signature,
                auto_assign_inquiries, theme, default_list_view, sidebar_permanently_expanded, language
            ) VALUES ($1, COALESCE($2, FALSE), COALESCE($3, TRUE), COALESCE($4, TRUE),
                      COALESCE($5, TRUE), COALESCE($6, TRUE), COALESCE($7, TRUE), COALESCE($8, ''),
                      COALESCE($9, FALSE), COALESCE($10, 'system'), COALESCE($11, 'simple'),
                      COALESCE($12, FALSE), COALESCE($13, 'en'))
            ON CONFLICT (user_id) DO UPDATE SET
                two_factor_enabled = COALESCE($2, agent_settings.two_factor_enabled),
                email_notifications = COALESCE($3, agent_settings.email_notifications),
                in_app_notifications = COALESCE($4, agent_settings.in_app_notifications),
                new_inquiry_alert = COALESCE($5, agent_settings.new_inquiry_alert),
                ticket_update_alert = COALESCE($6, agent_settings.ticket_update_alert),
                is_available = COALESCE($7, agent_settings.is_available),
                default_signature = COALESCE($8, agent_settings.default_signature),
                auto_assign_inquiries = COALESCE($9, agent_settings.auto_assign_inquiries),
                theme = COALESCE($10, agent_settings.theme),
                default_list_view = COALESCE($11, agent_settings.default_list_view),
                sidebar_permanently_expanded = COALESCE($12, agent_settings.sidebar_permanently_expanded),
                language = COALESCE($13, agent_settings.language),
                last_updated = CURRENT_TIMESTAMP
            RETURNING *`,
      [
        userId, // $1
        two_factor_enabled, // $2
        email_notifications, // $3
        in_app_notifications, // $4
        new_inquiry_alert, // $5
        ticket_update_alert, // $6
        is_available, // $7
        default_signature, // $8
        auto_assign_inquiries, // $9
        theme, // $10
        default_list_view, // $11
        sidebar_permanently_expanded, // $12
        language, // $13
      ],
    );

    if (result.rows.length === 0) {
      return res
        .status(500)
        .json({ message: "Failed to update or insert agent settings." });
    }
    // Log activity only if req.user is available
    if (req.user) {
      await logActivity(
        `${req.user.full_name} updated their agent settings.`,
        req.user,
        "agent_settings_update",
      );
    }
    res
      .status(200)
      .json({
        message: "Agent settings updated successfully.",
        settings: result.rows[0],
      });
  } catch (error) {
    console.error("Error updating/inserting agent settings:", error);
    res
      .status(500)
      .json({ message: "Server error while updating agent settings." });
  }
};

// --- Client Settings ---

// @desc    Get client-specific settings
// @route   GET /api/client/settings
// @access  Client (authenticated user)
const getClientSettings = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const result = await pool.query(
      "SELECT * FROM client_settings WHERE user_id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      // If no settings exist for the client, insert defaults and return them
      const defaultSettings = {
        user_id: userId,
        email_notifications: true,
        in_app_notifications: true,
        new_listing_alert: true,
        price_drop_alert: true,
        favourite_update_alert: true,
        preferred_property_type: "any",
        preferred_location: "any",
        max_price_alert: 100000000,
        theme: "system",
        default_list_view: "graphical",
        language: "en",
        sidebar_permanently_expanded: false,
      };

      await pool.query(
        `INSERT INTO client_settings (
                    user_id, email_notifications, in_app_notifications, new_listing_alert,
                    price_drop_alert, favourite_update_alert, preferred_property_type,
                    preferred_location, max_price_alert, theme, default_list_view,
                    language, sidebar_permanently_expanded
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (user_id) DO NOTHING RETURNING *`,
        Object.values(defaultSettings),
      );
      return res.status(200).json(defaultSettings); // Return default settings
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching client settings:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching client settings." });
  }
};

// @desc    Update client-specific settings
// @route   PUT /api/client/settings
// @access  Client (authenticated user)
const updateClientSettings = async (req, res) => {
  const userId = req.user.user_id;
  const {
    email_notifications,
    in_app_notifications,
    new_listing_alert,
    price_drop_alert,
    favourite_update_alert,
    preferred_property_type,
    preferred_location,
    max_price_alert,
    theme,
    default_list_view,
    language,
    sidebar_permanently_expanded,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO client_settings (
                user_id, email_notifications, in_app_notifications, new_listing_alert,
                price_drop_alert, favourite_update_alert, preferred_property_type,
                preferred_location, max_price_alert, theme, default_list_view,
                language, sidebar_permanently_expanded
            ) VALUES ($1, COALESCE($2, TRUE), COALESCE($3, TRUE), COALESCE($4, TRUE),
                      COALESCE($5, TRUE), COALESCE($6, TRUE), COALESCE($7, 'any'),
                      COALESCE($8, 'any'), COALESCE($9, 100000000), COALESCE($10, 'system'),
                      COALESCE($11, 'graphical'), COALESCE($12, 'en'), COALESCE($13, FALSE))
            ON CONFLICT (user_id) DO UPDATE SET
                email_notifications = COALESCE($2, client_settings.email_notifications),
                in_app_notifications = COALESCE($3, client_settings.in_app_notifications),
                new_listing_alert = COALESCE($4, client_settings.new_listing_alert),
                price_drop_alert = COALESCE($5, client_settings.price_drop_alert),
                favourite_update_alert = COALESCE($6, client_settings.favourite_update_alert),
                preferred_property_type = COALESCE($7, client_settings.preferred_property_type),
                preferred_location = COALESCE($8, client_settings.preferred_location),
                max_price_alert = COALESCE($9, client_settings.max_price_alert),
                theme = COALESCE($10, client_settings.theme),
                default_list_view = COALESCE($11, client_settings.default_list_view),
                language = COALESCE($12, client_settings.language),
                sidebar_permanently_expanded = COALESCE($13, client_settings.sidebar_permanently_expanded),
                last_updated = CURRENT_TIMESTAMP
            RETURNING *`,
      [
        userId, // $1
        email_notifications, // $2
        in_app_notifications, // $3
        new_listing_alert, // $4
        price_drop_alert, // $5
        favourite_update_alert, // $6
        preferred_property_type, // $7
        preferred_location, // $8
        max_price_alert, // $9
        theme, // $10
        default_list_view, // $11
        language, // $12
        sidebar_permanently_expanded, // $13
      ],
    );

    if (result.rows.length === 0) {
      return res
        .status(500)
        .json({ message: "Failed to update or insert client settings." });
    }
    // Log activity only if req.user is available
    if (req.user) {
      await logActivity(
        `${req.user.full_name} updated their client settings.`,
        req.user,
        "client_settings_update",
      );
    }
    res
      .status(200)
      .json({
        message: "Client settings updated successfully.",
        settings: result.rows[0],
      });
  } catch (error) {
    console.error("Error updating/inserting client settings:", error);
    res
      .status(500)
      .json({ message: "Server error while updating client settings." });
  }
};

module.exports = {
  getAdminSettings,
  updateAdminSettings,
  clearApplicationCache, // Ensure this is exported
  backupDatabase,
  viewErrorLogs,
  getClientSettings,
  updateClientSettings,
  getAgentSettings,
  updateAgentSettings,
};

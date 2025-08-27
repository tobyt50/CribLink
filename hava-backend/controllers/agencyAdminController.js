const db = require("../db"); // Assuming your database connection is here
// const logActivity = require('../utils/logActivity'); // If you have an activity logging utility

exports.getAgencyAdminProfile = async (req, res) => {
  const { adminId } = req.params;
  console.log(
    "[agencyAdminController.getAgencyAdminProfile] Entering function. req.user:",
    req.user,
  );

  // Ensure the requesting user is authorized to view this admin's profile
  // For now, we'll allow any authenticated user to view, but you might want to restrict this
  // e.g., only the admin themselves, or other agency admins, or platform admins.
  if (!req.user) {
    console.warn(
      "[agencyAdminController.getAgencyAdminProfile] Unauthorized: No user authenticated.",
    );
    return res
      .status(401)
      .json({ message: "Unauthorized: Authentication required." });
  }

  try {
    // 1. Fetch agency admin's user details
    const userResult = await db.query(
      `SELECT user_id, full_name, email, phone, profile_picture_url, date_joined, last_login, status AS user_status,
                    agency_id, bio, location
             FROM users WHERE user_id = $1 AND role = 'agency_admin'`,
      [adminId],
    );

    if (userResult.rows.length === 0) {
      console.warn(
        "[agencyAdminController.getAgencyAdminProfile] Agency Admin not found or user is not an agency admin for ID:",
        adminId,
      );
      return res
        .status(404)
        .json({ message: "Agency Administrator not found." });
    }
    const adminDetails = userResult.rows[0];

    // 2. Fetch agency details using agency_id
    let agencyDetails = {};
    if (adminDetails.agency_id) {
      const agencyRes = await db.query(
        `SELECT agency_id, name AS agency_name, logo_url, address AS location, created_at AS date_founded
                 FROM agencies WHERE agency_id = $1`, // Removed 'status' as it doesn't exist in agencies table
        [adminDetails.agency_id],
      );
      if (agencyRes.rows.length > 0) {
        agencyDetails = agencyRes.rows[0];
        // Manually add a default status if needed for the frontend display
        agencyDetails.status = "active"; // Assuming agencies are active by default if no status column exists
      }
    }

    // 3. Fetch Agent Management Overview data
    let agentManagement = {
      total_agents: 0,
      recent_agent_join_requests: [],
      last_agent_invited: null,
      actions_performed: [], // This would typically come from an audit log
    };
    if (adminDetails.agency_id) {
      // Total Agents in this agency
      const totalAgentsRes = await db.query(
        `SELECT COUNT(user_id) AS total_agents FROM users WHERE agency_id = $1 AND role = 'agent'`,
        [adminDetails.agency_id],
      );
      agentManagement.total_agents = parseInt(
        totalAgentsRes.rows[0].total_agents || 0,
      );

      // Recent Agent Join Requests (assuming 'agent_client_requests' or similar for agency joins)
      // This query assumes agency join requests are stored in agent_client_requests where receiver_id is agency_admin's user_id
      const recentRequestsRes = await db.query(
        `SELECT acr.request_id, u.user_id AS agent_id, u.full_name AS agent_name, acr.status, acr.created_at AS requested_at
                 FROM agent_client_requests acr
                 JOIN users u ON acr.sender_id = u.user_id
                 WHERE acr.receiver_id = $1 AND acr.receiver_role = 'agency_admin' AND acr.status = 'pending'
                 ORDER BY acr.created_at DESC LIMIT 5`, // Fetch last 5 pending requests
        [adminDetails.user_id], // Assuming receiver_id is the agency admin's user_id for direct requests
      );
      agentManagement.recent_agent_join_requests = recentRequestsRes.rows;

      // Last Agent Invited (This would need an 'activity_log' or 'invitations' table)
      // For now, let's mock it or fetch from users table if 'invited_by' field exists
      const lastInvitedRes = await db.query(
        `SELECT u.full_name, u.date_joined
                 FROM users u
                 WHERE u.agency_id = $1 AND u.role = 'agent'
                 ORDER BY u.date_joined DESC LIMIT 1`,
        [adminDetails.agency_id],
      );
      if (lastInvitedRes.rows.length > 0) {
        agentManagement.last_agent_invited = lastInvitedRes.rows[0];
      }

      // Actions performed by this admin (requires an audit log table)
      // Mocking for now:
      agentManagement.actions_performed = [
        {
          id: 1,
          description: "Approved new member John Doe",
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          description: "Published 3 new listings",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }

    // 4. Fetch Listings Management Overview data
    let listingsManagement = {
      total_listings: 0,
      published_listings: 0,
      unpublished_listings: 0,
      recently_modified_listings: [],
      top_performing_listings: [],
    };
    if (adminDetails.agency_id) {
      // Total Listings for the agency
      const totalListingsRes = await db.query(
        `SELECT COUNT(pl.property_id) AS total_listings,
                        COUNT(CASE WHEN pl.status = 'published' THEN 1 END) AS published_listings,
                        COUNT(CASE WHEN pl.status != 'published' THEN 1 END) AS unpublished_listings
                 FROM property_listings pl
                 JOIN users u ON pl.agent_id = u.user_id
                 WHERE u.agency_id = $1`,
        [adminDetails.agency_id],
      );
      if (totalListingsRes.rows.length > 0) {
        listingsManagement.total_listings = parseInt(
          totalListingsRes.rows[0].total_listings || 0,
        );
        listingsManagement.published_listings = parseInt(
          totalListingsRes.rows[0].published_listings || 0,
        );
        listingsManagement.unpublished_listings = parseInt(
          totalListingsRes.rows[0].unpublished_listings || 0,
        );
      }

      // Recently Modified Listings (requires 'updated_at' column in property_listings)
      const recentlyModifiedRes = await db.query(
        `SELECT pl.property_id, pl.title, pl.updated_at
                 FROM property_listings pl
                 JOIN users u ON pl.agent_id = u.user_id
                 WHERE u.agency_id = $1
                 ORDER BY pl.updated_at DESC LIMIT 3`,
        [adminDetails.agency_id],
      );
      listingsManagement.recently_modified_listings = recentlyModifiedRes.rows;

      // Top-performing Listings (requires analytics data, mocking for now)
      // In a real scenario, this would involve joining with inquiry or view count tables
      listingsManagement.top_performing_listings = [
        {
          property_id: "top-1",
          title: "Luxury Villa in Ikoyi",
          inquiries: 15,
          views: 500,
        },
        {
          property_id: "top-2",
          title: "Spacious Apartment VI",
          inquiries: 12,
          views: 450,
        },
      ];
    }

    // Combine all data
    const combinedAdminData = {
      ...adminDetails,
      agency_info: agencyDetails,
      agent_management: agentManagement,
      listings_management: listingsManagement,
    };

    res.status(200).json(combinedAdminData);
  } catch (err) {
    console.error(
      "[agencyAdminController.getAgencyAdminProfile] Error fetching agency admin profile details:",
      err,
    );
    res
      .status(500)
      .json({
        message: "Failed to fetch agency administrator profile details.",
        error: err.message,
      });
  }
};

// controllers/analyticsController.js
const pool = require('../db'); // Assuming your db connection is exported as 'pool'
const logActivity = require('../utils/logActivity'); // Assuming you have a logActivity utility

// Helper function to get date range for SQL queries
const getDateRange = (range) => {
    let startDate = new Date();
    let endDate = new Date(); // Today

    switch (range) {
        case 'last7days':
            startDate.setDate(endDate.getDate() - 6); // Last 7 days including today
            break;
        case 'last30days':
            startDate.setDate(endDate.getDate() - 29); // Last 30 days including today
            break;
        case 'last90days':
            startDate.setDate(endDate.getDate() - 89); // Last 90 days including today
            break;
        case 'ytd':
            startDate = new Date(endDate.getFullYear(), 0, 1); // January 1st of current year
            break;
        case 'custom':
            // For custom range, you would typically expect start_date and end_date from query params
            // For now, we'll default to last 30 days if custom is selected without specific dates
            startDate.setDate(endDate.getDate() - 29);
            break;
        default:
            startDate.setDate(endDate.getDate() - 29); // Default to last 30 days
    }

    // Format dates to 'YYYY-MM-DD' for SQL comparison
    const format = (date) => date.toISOString().split('T')[0];
    return { startDate: format(startDate), endDate: format(endDate) };
};

// 1. Get Total Users Count
exports.getTotalUsersCount = async (req, res) => {
    try {
        const result = await pool.query(`SELECT COUNT(*) FROM users`);
        res.json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error('Error fetching total users count:', err);
        res.status(500).json({ error: 'Internal server error fetching total users count' });
    }
};

// 2. Get Revenue from Sold Listings
exports.getRevenueSoldListings = async (req, res) => {
    const { startDate, endDate } = getDateRange(req.query.range);
    try {
        const result = await pool.query(
            `SELECT SUM(price) AS total_revenue
             FROM property_listings
             WHERE status = 'sold' AND date_listed BETWEEN $1 AND $2`,
            [startDate, endDate]
        );
        const totalRevenue = result.rows[0].total_revenue || 0;
        res.json({ total_revenue: parseFloat(totalRevenue) });
    } catch (err) {
        console.error('Error fetching revenue from sold listings:', err);
        res.status(500).json({ error: 'Internal server error fetching revenue from sold listings' });
    }
};

// 3. Get Total Deals Closed (from agent_performance)
exports.getTotalDealsClosed = async (req, res) => {
    // Note: agent_performance table might not have a date column for filtering by range directly.
    // If it does, you'd add date filtering here. For now, it sums all deals closed.
    try {
        const result = await pool.query(
            `SELECT SUM(deals_closed) AS total_deals FROM agent_performance`
        );
        const totalDeals = result.rows[0].total_deals || 0;
        res.json({ total_deals: parseInt(totalDeals, 10) });
    } catch (err) {
        console.error('Error fetching total deals closed:', err);
        res.status(500).json({ error: 'Internal server error fetching total deals closed' });
    }
};

// 4. Listing Status Distribution
exports.getListingStatusDistribution = async (req, res) => {
    const { startDate, endDate } = getDateRange(req.query.range);
    try {
        const result = await pool.query(
            `SELECT status, COUNT(*) AS count
             FROM property_listings
             WHERE date_listed BETWEEN $1 AND $2
             GROUP BY status
             ORDER BY count DESC`,
            [startDate, endDate]
        );
        res.json(result.rows.map(row => ({ status: row.status, count: parseInt(row.count, 10) })));
    } catch (err) {
        console.error('Error fetching listing status distribution:', err);
        res.status(500).json({ error: 'Internal server error fetching listing status distribution' });
    }
};

// 5. Listings Added Over Time
exports.getListingsOverTime = async (req, res) => {
    const { startDate, endDate } = getDateRange(req.query.range);
    try {
        const result = await pool.query(
            `SELECT DATE(date_listed) AS date, COUNT(*) AS count
             FROM property_listings
             WHERE date_listed BETWEEN $1 AND $2
             GROUP BY DATE(date_listed)
             ORDER BY date ASC`,
            [startDate, endDate]
        );
        res.json(result.rows.map(row => ({ date: row.date, count: parseInt(row.count, 10) })));
    } catch (err) {
        console.error('Error fetching listings over time:', err);
        res.status(500).json({ error: 'Internal server error fetching listings over time' });
    }
};

// 6. User Registration Trends
exports.getUserRegistrationTrends = async (req, res) => {
    const { startDate, endDate } = getDateRange(req.query.range);
    try {
        const result = await pool.query(
            `SELECT DATE(date_joined) AS date, COUNT(*) AS count
             FROM users
             WHERE date_joined BETWEEN $1 AND $2
             GROUP BY DATE(date_joined)
             ORDER BY date ASC`,
            [startDate, endDate]
        );
        res.json(result.rows.map(row => ({ date: row.date, count: parseInt(row.count, 10) })));
    } catch (err) {
        console.error('Error fetching user registration trends:', err);
        res.status(500).json({ error: 'Internal server error fetching user registration trends' });
    }
};

// 7. Inquiry Trends
exports.getInquiryTrends = async (req, res) => {
    const { startDate, endDate } = getDateRange(req.query.range);
    try {
        const result = await pool.query(
            `SELECT DATE(created_at) AS date, COUNT(*) AS count
             FROM inquiries
             WHERE created_at BETWEEN $1 AND $2
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [startDate, endDate]
        );
        res.json(result.rows.map(row => ({ date: row.date, count: parseInt(row.count, 10) })));
    } catch (err) {
        console.error('Error fetching inquiry trends:', err);
        res.status(500).json({ error: 'Internal server error fetching inquiry trends' });
    }
};

// 8. Property Type Distribution
exports.getPropertyTypeDistribution = async (req, res) => {
    const { startDate, endDate } = getDateRange(req.query.range);
    try {
        const result = await pool.query(
            `SELECT property_type AS type, COUNT(*) AS count
             FROM property_listings
             WHERE property_type IS NOT NULL AND property_type != '' AND date_listed BETWEEN $1 AND $2
             GROUP BY property_type
             ORDER BY count DESC`,
            [startDate, endDate]
        );
        res.json(result.rows.map(row => ({ type: row.type, count: parseInt(row.count, 10) })));
    } catch (err) {
        console.error('Error fetching property type distribution:', err);
        res.status(500).json({ error: 'Internal server error fetching property type distribution' });
    }
};

// 9. Listing Price Distribution
exports.getListingPriceDistribution = async (req, res) => {
    const { startDate, endDate } = getDateRange(req.query.range);
    try {
        // Define price ranges (adjust as needed)
        const priceRanges = [
            { label: '₦0 - ₦1M', min: 0, max: 1000000 },
            { label: '₦1M - ₦5M', min: 1000001, max: 5000000 },
            { label: '₦5M - ₦10M', min: 5000001, max: 10000000 },
            { label: '₦10M - ₦50M', min: 10000001, max: 50000000 },
            { label: '₦50M - ₦100M', min: 50000001, max: 100000000 },
            { label: '₦100M+', min: 100000001, max: null } // Max is inclusive
        ];

        let results = [];
        for (const range of priceRanges) {
            let queryText = `SELECT COUNT(*) AS count FROM property_listings WHERE date_listed BETWEEN $1 AND $2 AND price >= $3`;
            let queryValues = [startDate, endDate, range.min];

            if (range.max !== null) {
                queryText += ` AND price <= $4`;
                queryValues.push(range.max);
            }

            const res = await pool.query(queryText, queryValues);
            results.push({ range: range.label, count: parseInt(res.rows[0].count, 10) });
        }
        res.json(results);
    } catch (err) {
        console.error('Error fetching listing price distribution:', err);
        res.status(500).json({ error: 'Internal server error fetching listing price distribution' });
    }
};

// 10. Top Locations by Listings
exports.getTopLocations = async (req, res) => {
    const { startDate, endDate } = getDateRange(req.query.range);
    try {
        const result = await pool.query(
            `SELECT location, COUNT(*) AS count
             FROM property_listings
             WHERE location IS NOT NULL AND location != '' AND date_listed BETWEEN $1 AND $2
             GROUP BY location
             ORDER BY count DESC
             LIMIT 10`, // Limit to top 10 locations
            [startDate, endDate]
        );
        res.json(result.rows.map(row => ({ location: row.location, count: parseInt(row.count, 10) })));
    } catch (err) {
        console.error('Error fetching top locations:', err);
        res.status(500).json({ error: 'Internal server error fetching top locations' });
    }
};

// 11. Agent Performance Data
exports.getAgentPerformanceMetrics = async (req, res) => {
    // Note: If agent_performance table had a date column, you'd filter by that.
    // For now, it fetches all agent performance data.
    try {
        const result = await pool.query(
            `SELECT user_id, full_name, deals_closed, revenue, avg_rating, properties_assigned
             FROM agent_performance
             ORDER BY deals_closed DESC` // Order by deals closed for a default view
        );
        res.json(result.rows.map(row => ({
            user_id: row.user_id,
            full_name: row.full_name,
            deals_closed: parseInt(row.deals_closed, 10),
            revenue: parseFloat(row.revenue),
            avg_rating: parseFloat(row.avg_rating),
            properties_assigned: parseInt(row.properties_assigned, 10)
        })));
    } catch (err) {
        console.error('Error fetching agent performance metrics:', err);
        res.status(500).json({ error: 'Internal server error fetching agent performance metrics' });
    }
};

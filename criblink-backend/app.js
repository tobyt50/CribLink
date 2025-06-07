const cors = require("cors");
const express = require('express');
const app = express();

app.use(cors());

const clientRoutes = require('./routes/clientRoutes');
const documentRoutes = require('./routes/documentRoutes');
const financeRoutes = require('./routes/financeRoutes');
const listingsRoutes = require('./routes/listingsRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const adminUserRoutes = require('./routes/admin/users');
const adminStaffRoutes = require('./routes/admin/staff');
const adminInquiriesRoutes = require('./routes/admin/inquiries');
const adminActivityRoutes = require('./routes/admin/activity');
const adminAnalyticsRoutes = require('./routes/admin/analytics');
const adminStatsRoutes = require('./routes/admin/adminStatsRoutes');
const agentStatsRoutes = require('./routes/agentStatsRoutes');
// Updated import path for staffPerformanceRoutes
const agentPerformanceRoutes = require('./routes/admin/agentPerformanceRoutes');

require('dotenv').config();

app.use(express.json());
app.use('/clients', clientRoutes);
app.use('/docs', documentRoutes);
app.use('/finances', financeRoutes);
app.use('/tickets', ticketRoutes);
app.use('/admin', require('./routes/admin/users'));
app.use('/admin', adminUserRoutes);
app.use('/admin', adminStaffRoutes);
app.use('/admin/inquiries', adminInquiriesRoutes);
app.use('/admin/activity', adminActivityRoutes);
app.use('/admin', adminStatsRoutes);
app.use('/admin/analytics', adminAnalyticsRoutes);
app.use('/agent', agentStatsRoutes);
app.use('/users', userRoutes);
app.use('/listings', listingsRoutes);
// Mount staffPerformanceRoutes under /admin/staff.
// This means routes in staffPerformanceRoutes.js like '/performance' will be accessible at '/admin/staff/performance'
app.use('/admin/agent', agentPerformanceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

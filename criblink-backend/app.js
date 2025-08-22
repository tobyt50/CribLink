const cors = require("cors");
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const db = require('./db/index'); // Assumes knex instance exported as default
const expireFeaturedListings = require('./jobs/expireFeatured');

const app = express();
const server = http.createServer(app);

const healthRoutes = require('./routes/healthRoutes'); // Health check routes

// 🚀 Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// 🌐 Share io globally so it can be accessed in controllers
app.set('io', io);

// 🧠 Socket events
io.on('connection', (socket) => {
  console.log(`📡 Socket connected: ${socket.id}`);

  // Event to join a specific conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`📥 Socket ${socket.id} joined room ${conversationId}`);
  });

  // Event to handle when a user has read messages
  socket.on('message_read', ({ conversationId, userId, role }) => {
    console.log(`👁️ User ${userId} (${role}) read messages in conversation ${conversationId}`);
    // Broadcast to the room that messages have been read
    io.to(conversationId).emit('message_read_ack', { conversationId, readerId: userId, role });
  });

  // Event to leave a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`📤 Socket ${socket.id} left room ${conversationId}`);
  });

  // Event for sending a message
  socket.on('send_message', (messageData) => {
    console.log(`✉️ Broadcasting message to room: ${messageData.conversationId}`);
    io.to(messageData.conversationId).emit('new_message', messageData);
  });


  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// 📂 Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add db to req
app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use('/health', healthRoutes);

// 📦 Route imports
const clientRoutes = require('./routes/clientRoutes');
const clientStatsRoutes = require('./routes/clientStatsRoutes');
const documentRoutes = require('./routes/documentRoutes');
const financeRoutes = require('./routes/financeRoutes');
const listingsRoutes = require('./routes/listingsRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const adminUserRoutes = require('./routes/admin/users');
const adminStaffRoutes = require('./routes/admin/staff');
const inquiriesRoutes = require('./routes/inquiriesRoutes');
const adminActivityRoutes = require('./routes/admin/activity');
const adminStatsRoutes = require('./routes/admin/adminStatsRoutes');
const adminAnalyticsRoutes = require('./routes/admin/analytics');
const agentStatsRoutes = require('./routes/agentStatsRoutes');
const agentPerformanceRoutes = require('./routes/agentPerformanceRoutes');
const favouritesRoutes = require('./routes/favouritesRoutes');
const adminSettingsRoutes = require('./routes/admin/settings');
const agentSettingsRoutes = require('./routes/agentSettings');
const clientSettingsRoutes = require('./routes/clientSettings');
const agentRoutes = require('./routes/agentRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const agencyAdminRoutes = require('./routes/agencyAdminRoutes');
const agencyStatsRoutes = require('./routes/agencyStatsRoutes');
const utilsRoutes = require('./routes/utilsRoutes'); // NEW: Import utility routes
const paymentRoutes = require('./routes/paymentRoutes');

// 🚏 Route mounting
app.use('/api/clients', clientRoutes);
app.use('/api/client-stats', clientStatsRoutes);
app.use('/api/docs', documentRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin', adminStaffRoutes);
app.use('/api/admin/activity', adminActivityRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/agent', agentStatsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/agent-performance', agentPerformanceRoutes); 
app.use('/api/favourites', favouritesRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/agent/settings', agentSettingsRoutes);
app.use('/api/client/settings', clientSettingsRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/agency-admins', agencyAdminRoutes);
app.use('/api/agency-stats', agencyStatsRoutes);
app.use('/api/utils', utilsRoutes); // NEW: Mount utility routes
app.use('/api/payments', paymentRoutes);

// Serve static files from the React app (if applicable, usually in production)
// app.use(express.static(path.join(__dirname, '../../criblink-frontend/build')));

// The "catchall" handler
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../criblink-frontend/build/index.html'));
// });

// Schedule daily featured expiry
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily job: expiring featured listings...');
  try {
    await expireFeaturedListings();
    console.log('✅ Expired featured listings successfully');
  } catch (err) {
    console.error('❌ Error expiring featured listings:', err);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
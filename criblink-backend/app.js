const cors = require("cors");
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

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
  // The backend controller (`inquiriesController`) will emit the 'new_message' event
  // after successfully saving the message to the database. This ensures all clients
  // receive the confirmed message from the single source of truth.
  socket.on('send_message', (messageData) => {
    console.log(`✉️ Broadcasting message to room: ${messageData.conversationId}`);
    // The message is emitted to the room. The `inquiriesController` handles the primary 'new_message' emit.
    // This can be used for things like "typing..." indicators in the future.
    io.to(messageData.conversationId).emit('new_message', messageData);
  });


  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// 📂 Middleware
app.use(cors());
// Increased payload limit for JSON and URL-encoded bodies to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Removed: app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // No longer needed for local storage

// 📦 Route imports
const clientRoutes = require('./routes/clientRoutes');
const clientStatsRoutes = require('./routes/clientStatsRoutes'); // NEW: Import client stats routes
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
const agentPerformanceRoutes = require('./routes/admin/agentPerformanceRoutes');
const favouritesRoutes = require('./routes/favouritesRoutes');
const adminSettingsRoutes = require('./routes/admin/settings');
const agentSettingsRoutes = require('./routes/agentSettings');
const clientSettingsRoutes = require('./routes/clientSettings');
const agentRoutes = require('./routes/agentRoutes');
const agencyRoutes = require('./routes/agencyRoutes'); // NEW: Import agency routes
const agencyAdminRoutes = require('./routes/agencyAdminRoutes'); // NEW: Import agency admin routes
const agencyStatsRoutes = require('./routes/agencyStatsRoutes'); // NEW: Import agency stats routes


// 🚏 Route mounting
app.use('/clients', clientRoutes);
app.use('/client-stats', clientStatsRoutes); // NEW: Mount client stats routes
app.use('/docs', documentRoutes);
app.use('/finances', financeRoutes);
app.use('/tickets', ticketRoutes);
app.use('/admin', adminUserRoutes);
app.use('/admin', adminStaffRoutes);
app.use('/admin/activity', adminActivityRoutes);
app.use('/admin', adminStatsRoutes);
app.use('/admin/analytics', adminAnalyticsRoutes);
app.use('/agent', agentStatsRoutes);
app.use('/users', userRoutes);
app.use('/listings', listingsRoutes);
app.use('/admin/agent', agentPerformanceRoutes);
app.use('/favourites', favouritesRoutes);
app.use('/admin/settings', adminSettingsRoutes);
app.use('/agent/settings', agentSettingsRoutes);
app.use('/client/settings', clientSettingsRoutes);
app.use('/agents', agentRoutes);
app.use('/inquiries', inquiriesRoutes);
app.use('/agencies', agencyRoutes); // NEW: Mount agency routes
app.use('/agency-admins', agencyAdminRoutes); // NEW: Mount agency admin routes
app.use('/agency-stats', agencyStatsRoutes); // NEW: Mount agency stats routes


// Serve static files from the React app (if applicable, usually in production)
// app.use(express.static(path.join(__dirname, '../../criblink-frontend/build')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../criblink-frontend/build/index.html'));
// });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

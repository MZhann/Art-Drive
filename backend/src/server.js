const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const jobRoutes = require('./routes/job.routes');
const reviewRoutes = require('./routes/review.routes');
const chatRoutes = require('./routes/chat.routes');
const notificationRoutes = require('./routes/notification.routes');

// Import seed
const seedAdmin = require('./seeds/adminSeed');

// Import services
const { startTournamentNotifier } = require('./services/tournamentNotifier');
const { initNotificationService } = require('./services/notificationService');

// Import chat model for socket persistence
const ChatMessage = require('./models/ChatMessage.model');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Sanitize FRONTEND_URL — strip trailing slash to prevent CORS mismatch
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Initialize Socket.IO for real-time features
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-User-Id', 'X-Dev-User-Role']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ArtDrive API is running',
    authMode: process.env.AUTH_MODE || 'PROD',
    timestamp: new Date().toISOString()
  });
});

// Initialize notification service with Socket.IO
initNotificationService(io);

// Track online users in global chat
const chatUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // --- User notification room (join by userId for real-time notifications) ---
  socket.on('authenticate', (userId) => {
    if (userId) {
      socket.userId = userId;
      socket.join(`user-${userId}`);
    }
  });

  // --- Tournament sockets ---
  socket.on('join-tournament', (tournamentId) => {
    socket.join(`tournament-${tournamentId}`);
  });

  socket.on('vote', (data) => {
    io.to(`tournament-${data.tournamentId}`).emit('vote-update', data);
  });

  // --- Global Chat ---
  socket.on('join-global-chat', (userData) => {
    socket.join('global-chat');
    chatUsers.set(socket.id, userData || { id: socket.id });
    io.to('global-chat').emit('chat-user-count', chatUsers.size);
  });

  socket.on('leave-global-chat', () => {
    chatUsers.delete(socket.id);
    io.to('global-chat').emit('chat-user-count', chatUsers.size);
  });

  socket.on('chat-message', async (data) => {
    try {
      if (!data.userId || !data.text || !data.text.trim()) return;

      const message = await ChatMessage.create({
        user: data.userId,
        text: data.text.trim()
      });

      const populated = await ChatMessage.findById(message._id)
        .populate('user', 'username fullName avatar role');

      io.to('global-chat').emit('new-chat-message', populated);
    } catch (err) {
      console.error('Chat message error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    if (chatUsers.has(socket.id)) {
      chatUsers.delete(socket.id);
      io.to('global-chat').emit('chat-user-count', chatUsers.size);
    }
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/artdrive';

async function startServer() {
  let mongoUri = MONGODB_URI;

  try {
    // Try connecting to the configured MongoDB
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to MongoDB');
    await seedAdmin();
    startTournamentNotifier();
  } catch (err) {
    // In production, fail fast — don't try in-memory
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Failed to connect to MongoDB:', err.message);
      console.error('Set MONGODB_URI environment variable to a valid MongoDB connection string.');
      process.exit(1);
    }

    console.log('⚠️  Local MongoDB not available, starting in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to In-Memory MongoDB');
      console.log('📝 Note: Data will NOT persist between restarts. Install MongoDB locally for persistent storage.');
      await seedAdmin();
      startTournamentNotifier();
    } catch (memErr) {
      console.error('❌ Failed to start in-memory MongoDB:', memErr.message);
      console.error('Please install MongoDB locally or provide a MongoDB Atlas URI in .env');
      process.exit(1);
    }
  }

  const HOST = '0.0.0.0';
  server.listen(PORT, HOST, () => {
    console.log(`🚀 ArtDrive server running on ${HOST}:${PORT}`);
    console.log(`📡 Auth Mode: ${process.env.AUTH_MODE || 'PROD'}`);
    console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  });
}

startServer();

module.exports = { app, io };

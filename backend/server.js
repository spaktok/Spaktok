require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Pool } = require('pg');
const redis = require('redis');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const streamingRoutes = require('./routes/streaming');
const battleGiftingRoutes = require('./routes/battle_gifting');
const paymentRoutes = require('./routes/payment');
const agoraRoutes = require('./routes/agora');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(cors());

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, '../frontend')));

// ? MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://spaktok-mongo:27017/spaktok', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('? MongoDB connected'))
.catch(err => console.error('? MongoDB error:', err));

// ? PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB
});

pool.connect()
.then(() => console.log('? PostgreSQL connected'))
.catch(err => console.error('? PostgreSQL error:', err));

// ? Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://spaktok-redis:6379'
});

redisClient.connect()
.then(() => console.log('? Redis connected'))
.catch(err => console.error('? Redis error:', err));

// Routes
app.use('/streaming', streamingRoutes);
app.use('/battle-gifting', battleGiftingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/auth', authRoutes);

// ? API routes
app.get('/', (req, res) => {
  res.send('?? Backend is working correctly!');
});

// WebSocket for chat
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log(`📨 Received: ${message}`);
    // Broadcast message to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Server running at http://localhost:${PORT}`);
});

// Export for testing
module.exports = { app, server };

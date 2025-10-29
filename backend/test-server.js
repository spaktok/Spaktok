const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(cors());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: '🔥 Backend server is healthy!'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Spaktok Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      agora: '/api/agora/*',
      streaming: '/streaming',
      payment: '/api/payment'
    }
  });
});

// Agora token endpoint (mock)
app.post('/api/agora/token', (req, res) => {
  res.json({
    token: 'test_token_' + Date.now(),
    channel: req.body.channelName || 'test_channel',
    uid: req.body.uid || 0,
    ttl: 43200,
    message: '✅ Mock Agora token generated'
  });
});

// WebSocket chat
wss.on('connection', (ws) => {
  console.log('📱 Client connected');
  ws.send(JSON.stringify({ type: 'connection', message: 'Connected to WebSocket server' }));

  ws.on('message', (message) => {
    console.log(`📨 Received: ${message}`);
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'message', data: message }));
      }
    });
  });

  ws.on('close', () => {
    console.log('👋 Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test Server running at http://localhost:${PORT}`);
  console.log(`✅ WebSocket available at ws://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});

module.exports = { app, server };
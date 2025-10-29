const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:3000');

ws.on('open', () => {
  console.log('✅ WebSocket connected to ws://127.0.0.1:3000');
  
  // Send a test message
  setTimeout(() => {
    ws.send(JSON.stringify({ message: 'Hello from WebSocket client!' }));
    console.log('📤 Sent test message');
  }, 500);

  // Send another message
  setTimeout(() => {
    ws.send('Direct message test');
    console.log('📤 Sent direct message');
  }, 1000);

  // Close after 3 seconds
  setTimeout(() => {
    ws.close();
    console.log('👋 WebSocket closed');
    process.exit(0);
  }, 3000);
});

ws.on('message', (data) => {
  console.log(`📨 Received from server: ${data}`);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('⏱️ WebSocket connection closed');
});
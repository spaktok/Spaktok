/*
 * Durable Object: WebRTC Signaling Server
 * 
 * Handles real-time WebRTC signaling for live streaming
 * Replaces Agora RTC with P2P WebRTC at near-zero cost
 */

export class WebRTCSignaling {
  state: DurableObjectState;
  sessions: Map<string, any>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (request.method === 'POST') {
      const body = await request.json() as { userId: string; signal: any };
      
      // Store signal for other peers
      this.sessions.set(body.userId, {
        signal: body.signal,
        timestamp: Date.now(),
      });

      // Broadcast to all other peers
      const peers = Array.from(this.sessions.entries())
        .filter(([id]) => id !== body.userId)
        .map(([id, data]) => ({ id, signal: data.signal }));

      return new Response(JSON.stringify({ success: true, peers }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'GET') {
      // Get all active peers
      const peers = Array.from(this.sessions.entries()).map(([id, data]) => ({
        id,
        signal: data.signal,
        timestamp: data.timestamp,
      }));

      return new Response(JSON.stringify({ peers }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }

  // Cleanup old sessions every hour
  async alarm() {
    const now = Date.now();
    for (const [id, data] of this.sessions.entries()) {
      if (now - data.timestamp > 3600000) {
        this.sessions.delete(id);
      }
    }
    
    // Set next alarm
    await this.state.storage.setAlarm(Date.now() + 3600000);
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    return new Response('WebRTC Signaling Durable Object', { status: 200 });
  },
};

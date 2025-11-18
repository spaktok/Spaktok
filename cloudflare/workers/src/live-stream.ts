/*
 * Durable Object: Live Stream State Manager
 * 
 * Manages live stream sessions, viewer count, chat messages
 * Replaces Firebase Realtime Database for live features
 */

export class LiveStream {
  state: DurableObjectState;
  streamId: string;
  host: string | null;
  viewers: Set<string>;
  chatMessages: Array<{ userId: string; message: string; timestamp: number }>;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.streamId = '';
    this.host = null;
    this.viewers = new Set();
    this.chatMessages = [];
    
    // Load state from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<any>('state');
      if (stored) {
        this.streamId = stored.streamId || '';
        this.host = stored.host || null;
        this.viewers = new Set(stored.viewers || []);
        this.chatMessages = stored.chatMessages || [];
      }
    });
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/start' && request.method === 'POST') {
      const body = await request.json() as { streamId: string; hostId: string };
      this.streamId = body.streamId;
      this.host = body.hostId;
      this.viewers.clear();
      this.chatMessages = [];
      await this.saveState();
      
      return this.json({ success: true, streamId: this.streamId, host: this.host });
    }

    if (path === '/join' && request.method === 'POST') {
      const body = await request.json() as { userId: string };
      this.viewers.add(body.userId);
      await this.saveState();
      
      return this.json({ success: true, viewerCount: this.viewers.size });
    }

    if (path === '/leave' && request.method === 'POST') {
      const body = await request.json() as { userId: string };
      this.viewers.delete(body.userId);
      await this.saveState();
      
      return this.json({ success: true, viewerCount: this.viewers.size });
    }

    if (path === '/chat' && request.method === 'POST') {
      const body = await request.json() as { userId: string; message: string };
      const chatMessage = {
        userId: body.userId,
        message: body.message,
        timestamp: Date.now(),
      };
      
      this.chatMessages.push(chatMessage);
      
      // Keep only last 100 messages
      if (this.chatMessages.length > 100) {
        this.chatMessages = this.chatMessages.slice(-100);
      }
      
      await this.saveState();
      
      return this.json({ success: true, message: chatMessage });
    }

    if (path === '/state' && request.method === 'GET') {
      return this.json({
        streamId: this.streamId,
        host: this.host,
        viewerCount: this.viewers.size,
        recentMessages: this.chatMessages.slice(-20),
      });
    }

    if (path === '/end' && request.method === 'POST') {
      const body = await request.json() as { hostId: string };
      if (body.hostId === this.host) {
        this.host = null;
        this.viewers.clear();
        await this.saveState();
        return this.json({ success: true, ended: true });
      }
      return this.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return new Response('Not found', { status: 404 });
  }

  private json(data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  }

  private async saveState() {
    await this.state.storage.put('state', {
      streamId: this.streamId,
      host: this.host,
      viewers: Array.from(this.viewers),
      chatMessages: this.chatMessages,
    });
  }

  // Cleanup on alarm
  async alarm() {
    // Check if stream has been inactive for 2 hours
    if (this.host === null && this.viewers.size === 0) {
      await this.state.storage.deleteAll();
    } else {
      // Set next alarm
      await this.state.storage.setAlarm(Date.now() + 7200000); // 2 hours
    }
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    return new Response('Live Stream Durable Object', { status: 200 });
  },
};

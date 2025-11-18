// Cloudflare Queue consumer for Spaktok events
// Processes chat events, live notifications, and gift transactions asynchronously

interface Env {
  D1_DB: D1Database;
  KV_CACHE: KVNamespace;
  R2: R2Bucket;
}

interface EventMessage {
  type: string;
  ts: number;
  payload: any;
}

async function processGiftSend(msg: EventMessage, env: Env) {
  const { giftId, senderId, receiverId, context, contextId, priceCoins } = msg.payload;
  // Debit sender coins (D1), credit receiver, log gift
  const sender = await env.D1_DB.prepare('SELECT coins FROM users WHERE id = ?').bind(senderId).first();
  if (!sender || (sender.coins as number) < priceCoins) {
    console.error('Insufficient coins for sender:', senderId);
    return;
  }
  await env.D1_DB.batch([
    env.D1_DB.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').bind(priceCoins, senderId),
    env.D1_DB.prepare('UPDATE users SET received_gifts = received_gifts + 1 WHERE id = ?').bind(receiverId),
    env.D1_DB.prepare(`
      INSERT INTO gifts (id, gift_id, sender_id, receiver_id, context, context_id, price_coins, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(`gift_${Date.now()}`, giftId, senderId, receiverId, context, contextId || '', priceCoins, Date.now()),
  ]);
  console.log('Gift processed:', giftId, senderId, '->', receiverId);
}

async function processChatEvent(msg: EventMessage, env: Env) {
  const { chatId, userId, message } = msg.payload;
  // Cache recent chat messages in KV or log to D1
  const cacheKey = `chat:${chatId}:recent`;
  const cached = await env.KV_CACHE.get(cacheKey);
  const messages = cached ? JSON.parse(cached) : [];
  messages.push({ userId, message, ts: msg.ts });
  if (messages.length > 50) messages.shift(); // Keep last 50
  await env.KV_CACHE.put(cacheKey, JSON.stringify(messages), { expirationTtl: 3600 });
  console.log('Chat event cached:', chatId, userId);
}

async function processLiveNotification(msg: EventMessage, env: Env) {
  const { userId, notificationType, data } = msg.payload;
  // Send push notification (placeholder - integrate with Firebase Cloud Messaging or similar)
  console.log('Live notification queued:', userId, notificationType, data);
  // Store notification in D1 or send to external push service
}

const eventHandlers: Record<string, (msg: EventMessage, env: Env) => Promise<void>> = {
  'gift.send': processGiftSend,
  'chat.message': processChatEvent,
  'live.notification': processLiveNotification,
};

export default {
  async queue(batch: MessageBatch<EventMessage>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const handler = eventHandlers[msg.body.type];
      if (handler) {
        try {
          await handler(msg.body, env);
          msg.ack();
        } catch (e: any) {
          console.error('Event processing error:', msg.body.type, e?.message);
          msg.retry();
        }
      } else {
        console.warn('Unknown event type:', msg.body.type);
        msg.ack();
      }
    }
  },
};

// Cloudflare D1 helpers for Spaktok
// Use D1 for fast SQL queries at the edge (users, gifts, sessions)

export async function getUser(db: D1Database, userId: string): Promise<any | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  return result || null;
}

export async function upsertUser(db: D1Database, user: any): Promise<void> {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO users (id, username, display_name, avatar_url, coins, received_gifts, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      coins = excluded.coins,
      received_gifts = excluded.received_gifts,
      updated_at = excluded.updated_at
  `).bind(
    user.id,
    user.username,
    user.displayName || '',
    user.avatarUrl || '',
    user.coins || 0,
    user.receivedGifts || 0,
    user.createdAt || now,
    now
  ).run();
}

export async function getRecentGifts(db: D1Database, receiverId: string, limit: number = 10): Promise<any[]> {
  const result = await db.prepare('SELECT * FROM gifts WHERE receiver_id = ? ORDER BY created_at DESC LIMIT ?')
    .bind(receiverId, limit)
    .all();
  return result.results || [];
}

export async function insertGift(db: D1Database, gift: any): Promise<void> {
  await db.prepare(`
    INSERT INTO gifts (id, gift_id, sender_id, receiver_id, context, context_id, price_coins, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    gift.id,
    gift.giftId,
    gift.senderId,
    gift.receiverId,
    gift.context,
    gift.contextId || '',
    gift.priceCoins,
    gift.createdAt || Date.now()
  ).run();
}

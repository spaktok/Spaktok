// Cloudflare KV helpers for Spaktok
// Use KV for caching, session storage, and fast key-value lookups

export async function getCache(kv: KVNamespace, key: string): Promise<string | null> {
  return kv.get(key);
}

export async function setCache(kv: KVNamespace, key: string, value: string, ttl?: number): Promise<void> {
  await kv.put(key, value, ttl ? { expirationTtl: ttl } : undefined);
}

export async function deleteCache(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}

// Session helpers (example: store user sessions in KV)
export async function getSession(kv: KVNamespace, sessionId: string): Promise<Record<string, any> | null> {
  const data = await kv.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function setSession(kv: KVNamespace, sessionId: string, data: Record<string, any>, ttl: number = 3600): Promise<void> {
  await kv.put(`session:${sessionId}`, JSON.stringify(data), { expirationTtl: ttl });
}

export async function deleteSession(kv: KVNamespace, sessionId: string): Promise<void> {
  await kv.delete(`session:${sessionId}`);
}

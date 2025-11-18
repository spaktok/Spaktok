// Minimal Worker type shims to satisfy TypeScript without relying on global ambient types
// This avoids build breaks when @cloudflare/workers-types aren’t resolved.

declare type R2Bucket = any;

declare interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
}

declare type D1Database = any;

declare interface Queue {
  send(body: unknown): Promise<void>;
}

declare interface MessageBatch<T = unknown> {
  messages: Array<{ body: T; ack(): void; retry(): void }>;
}

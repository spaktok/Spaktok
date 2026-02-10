export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after max attempts
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
};

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  isLimited(key: string): boolean {
    const record = this.attempts.get(key);

    if (!record) {
      return false;
    }

    // Check if blocked
    if (record.blockedUntil && Date.now() < record.blockedUntil) {
      return true;
    }

    // Check if window has expired
    if (Date.now() - record.firstAttempt > this.config.windowMs) {
      this.attempts.delete(key);
      return false;
    }

    return record.count >= this.config.maxAttempts;
  }

  recordAttempt(key: string): void {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return;
    }

    // Reset if window expired
    if (now - record.firstAttempt > this.config.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return;
    }

    record.count++;
    record.lastAttempt = now;

    // Block if max attempts exceeded
    if (record.count >= this.config.maxAttempts) {
      record.blockedUntil = now + this.config.blockDurationMs;
    }
  }

  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key);
    if (!record) {
      return this.config.maxAttempts;
    }

    if (Date.now() - record.firstAttempt > this.config.windowMs) {
      return this.config.maxAttempts;
    }

    return Math.max(0, this.config.maxAttempts - record.count);
  }

  getBlockedUntil(key: string): number | null {
    const record = this.attempts.get(key);
    if (!record || !record.blockedUntil) {
      return null;
    }

    if (Date.now() < record.blockedUntil) {
      return record.blockedUntil;
    }

    return null;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  resetAll(): void {
    this.attempts.clear();
  }
}

// Create global instances for login and registration attempts
export const loginRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
});

export const registerRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 60 * 60 * 1000, // 1 hour
});

export const apiRateLimiter = new RateLimiter({
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 5 * 60 * 1000, // 5 minutes
});

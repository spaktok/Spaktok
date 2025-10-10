const Redis = require("ioredis");

/**
 * SPAKTOK CACHE SERVICE - PHASE 1
 * Ultra-fast caching layer for 1B+ users
 * 
 * Features:
 * - Automatic cache invalidation
 * - Cache warming for popular content
 * - Distributed caching support
 * - Performance monitoring
 */

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false
    });

    this.redis.on("connect", () => console.log("✅ Cache Service: Redis connected"));
    this.redis.on("error", (err) => console.error("❌ Cache Service: Redis error:", err));
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached value or null
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300)
   */
  async set(key, value, ttl = 300) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      this.stats.sets++;
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  async delete(key) {
    try {
      await this.redis.del(key);
      this.stats.deletes++;
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern - Key pattern (e.g., "user:*")
   */
  async deletePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.stats.deletes += keys.length;
      }
      return keys.length;
    } catch (error) {
      console.error(`Cache deletePattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment counter
   * @param {string} key - Counter key
   * @param {number} amount - Amount to increment (default: 1)
   */
  async increment(key, amount = 1) {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get or set cache value
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Function to fetch data if not cached
   * @param {number} ttl - Time to live in seconds
   */
  async getOrSet(key, fetchFunction, ttl = 300) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      const value = await fetchFunction();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Cache warming - preload popular content
   * @param {Array} items - Array of {key, value, ttl} objects
   */
  async warmCache(items) {
    try {
      const pipeline = this.redis.pipeline();
      items.forEach(({ key, value, ttl = 300 }) => {
        pipeline.setex(key, ttl, JSON.stringify(value));
      });
      await pipeline.exec();
      console.log(`✅ Cache warmed with ${items.length} items`);
      return true;
    } catch (error) {
      console.error("Cache warming error:", error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalRequests: this.stats.hits + this.stats.misses
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Flush all cache
   */
  async flushAll() {
    try {
      await this.redis.flushall();
      console.log("✅ Cache flushed");
      return true;
    } catch (error) {
      console.error("Cache flush error:", error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    await this.redis.quit();
    console.log("✅ Cache Service: Redis connection closed");
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;

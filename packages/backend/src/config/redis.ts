import Redis from 'ioredis';
import { config } from './env';
import logger from '../utils/logger';

const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (error) => {
  logger.error('Redis client error', { error: error.message });
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting');
});

// ─── Cache Utilities ─────────────────────────────────────────────────────────

/**
 * Get a cached value by key.
 * Returns parsed JSON or null if not found.
 */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Redis GET error', { key, error });
    return null;
  }
}

/**
 * Set a cached value with optional TTL (in seconds).
 * Default TTL is 3600 seconds (1 hour).
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = 3600
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await redisClient.set(key, serialized, 'EX', ttl);
  } catch (error) {
    logger.error('Redis SET error', { key, error });
  }
}

/**
 * Delete a cached value by key.
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Redis DEL error', { key, error });
  }
}

/**
 * Invalidate all keys matching a given pattern.
 * Uses SCAN to avoid blocking the Redis server.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
    } while (cursor !== '0');
  } catch (error) {
    logger.error('Redis invalidatePattern error', { pattern, error });
  }
}

export { redisClient };
export default redisClient;

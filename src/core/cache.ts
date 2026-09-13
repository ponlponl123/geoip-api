import { redis } from "./redis";

interface CacheEntry {
  val: string;
  exp: number;
}

export class Cache {
  private mem = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly defaultTtl: number; // 7 days in seconds = 604,800

  constructor(maxSize = 10_000, defaultTtl = 604_800) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  private isRedisActive(): boolean {
    return process.env.REDIS_ENABLED !== "false" && redis.redis.status !== "end";
  }

  public async get(key: string): Promise<string | null> {
    if (this.isRedisActive()) {
      try {
        const res = await redis.redis.get(key);
        if (res !== null) return res;
      } catch {
        // Fallback to in-memory on Redis error
      }
    }

    const entry = this.mem.get(key);
    if (!entry) return null;

    if (Date.now() > entry.exp) {
      this.mem.delete(key);
      return null;
    }

    // Refresh LRU order
    this.mem.delete(key);
    this.mem.set(key, entry);
    return entry.val;
  }

  public async set(key: string, val: string, ttlSeconds = this.defaultTtl): Promise<void> {
    if (this.isRedisActive()) {
      try {
        await redis.redis.set(key, val, "EX", ttlSeconds);
      } catch {
        // Fallback to in-memory on Redis error
      }
    }

    if (this.mem.size >= this.maxSize) {
      const oldest = this.mem.keys().next().value;
      if (oldest) this.mem.delete(oldest);
    }

    this.mem.set(key, {
      val,
      exp: Date.now() + ttlSeconds * 1000,
    });
  }

  public async del(key: string): Promise<void> {
    if (this.isRedisActive()) {
      try {
        await redis.redis.del(key);
      } catch {}
    }
    this.mem.delete(key);
  }

  public clear(): void {
    this.mem.clear();
  }
}

export const cache = new Cache();
export default Cache;

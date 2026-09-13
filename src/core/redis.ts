import fs from "fs";
import Redis, { type RedisOptions, type SentinelAddress } from "ioredis";

export class RedisClient {
  public redis: Redis;

  constructor() {
    const {
      REDIS_URL,
      REDIS_HOST = "127.0.0.1",
      REDIS_PORT = "6379",
      REDIS_PASSWORD,
      REDIS_DB = "0",
      REDIS_KEY_PREFIX,
      REDIS_SENTINEL_NAME = "mymaster",
      REDIS_SENTINELS,
      REDIS_SENTINEL_PASSWORD,
      REDIS_NAT_MAP,
      REDIS_TLS,
      REDIS_TLS_CA,
      REDIS_TLS_CERT,
      REDIS_TLS_KEY,
      REDIS_TLS_REJECT_UNAUTHORIZED,
    } = process.env;

    const read = (p?: string) => (p && fs.existsSync(p) ? fs.readFileSync(p) : p);
    const tls = REDIS_TLS === "true" || REDIS_TLS_CA || REDIS_TLS_CERT ? {
      rejectUnauthorized: REDIS_TLS_REJECT_UNAUTHORIZED !== "false",
      ...(REDIS_TLS_CA && { ca: read(REDIS_TLS_CA) }),
      ...(REDIS_TLS_CERT && { cert: read(REDIS_TLS_CERT) }),
      ...(REDIS_TLS_KEY && { key: read(REDIS_TLS_KEY) }),
    } : undefined;

    const sentinels: SentinelAddress[] | undefined = REDIS_SENTINELS
      ? REDIS_SENTINELS.split(",").map((s) => {
          const [host, port] = s.trim().split(":");
          return { host, port: Number(port) || 26379 };
        })
      : undefined;

    const natMap: Record<string, { host: string; port: number }> | undefined = REDIS_NAT_MAP
      ? REDIS_NAT_MAP.startsWith("{")
        ? JSON.parse(REDIS_NAT_MAP)
        : Object.fromEntries(
            REDIS_NAT_MAP.split(",").map((entry) => {
              const [internal, external] = entry.trim().split("=");
              const [host, port] = (external || "").split(":");
              return [internal, { host: host || "127.0.0.1", port: Number(port) || 6379 }];
            })
          )
      : undefined;

    const opts: RedisOptions = {
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => (times > 10 ? null : Math.min(times * 200, 3000)),
      ...(REDIS_KEY_PREFIX && { keyPrefix: REDIS_KEY_PREFIX }),
      ...(tls && { tls }),
      ...(natMap && { natMap }),
      ...(sentinels
        ? {
            name: REDIS_SENTINEL_NAME,
            sentinels,
            sentinelPassword: REDIS_SENTINEL_PASSWORD,
          }
        : {
            host: REDIS_HOST,
            port: Number(REDIS_PORT),
            password: REDIS_PASSWORD,
            db: Number(REDIS_DB),
          }),
    };

    this.redis = REDIS_URL ? new Redis(REDIS_URL, opts) : new Redis(opts);
  }

  public async connect(): Promise<void> {
    if (this.redis.status === "wait") {
      await this.redis.connect();
    }
  }
}

export const redis = new RedisClient();
export default RedisClient;

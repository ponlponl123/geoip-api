# geoip-api

Fast, lightweight IP parsing and identification service built on Bun and Hono.

Zero external dependencies for parsing. Uses direct bitwise arithmetic and RFC 5952 canonical normalization, clocking ~3M ops/sec in benchmarks.

## What it does

- Extracts client IP across common proxy headers (`CF-Connecting-IP`, `X-Forwarded-For`, etc.)
- Parses both IPv4 and IPv6 without regex overhead
- Identifies IP roles: Loopback, Link-Local, Private (RFC 1918 / ULA), Multicast, Broadcast, Gateway, and Network addresses
- Strips ports, brackets, and handles IPv4-mapped IPv6 (`::ffff:x.x.x.x`)
- **7-Day Caching**: Caches GeoIP lookup results for 7 days (`604800s`) to avoid redundant lookups
- **Dual-Tier Cache**: Supports Redis out of the box, with automatic fallback to an in-memory LRU cache if Redis is unavailable or disabled
- Runs as a standalone HTTP API or compiles to a self-contained single binary

## Getting Started

```bash
# copy environment file
cp .env.example .env.development.local

# install dependencies
bun install

# start dev server (hot reload)
bun dev

# run unit tests
bun test

# run benchmark suite
bun run bench
```

## Environments

```bash
bun run local     # local dev (.env.development.local)
bun run staging   # staging (.env.staging.local)
bun run prod      # production (.env.production.local)
```

## Caching Strategy

GeoIP data is cached for **7 days** to minimize latency and avoid repeated upstream queries:
- **Redis (Primary)**: Shared, distributed cache across instances (`REDIS_URL` or `REDIS_HOST`). Supports Sentinels and TLS.
- **In-Memory (Fallback)**: Built-in O(1) LRU Map cache for zero-setup local deployments without Redis, or as an automatic failover when Redis is unreachable.

## Production Build

Compile into a standalone native binary with no runtime dependencies:

```bash
bun run build
./bin/index
```

## API Reference

### 1. Client IP Info (`GET /`)
Extracts and inspects the client's IP from proxy headers or connection info.

**Response:** `text/plain`
```text
Hello, World!
Your IP: 1.1.1.1
{
  "version": 4,
  "address": "1.1.1.1",
  "family": "IPv4",
  "isCanonical": true,
  "isMulticast": false,
  "isLoopback": false,
  "isLinkLocal": false,
  "isPrivate": false,
  "isPublic": true,
  "isReserved": false,
  "isUnicast": true,
  "isBroadcast": false,
  "isUnknown": false,
  "reservedRole": null,
  "type": "GLOBAL"
}
```

---

### 2. Inspect Any IP (`GET /:ip`)
Parses, normalizes, and validates any given IPv4 or IPv6 address.

**Example:** `GET /192.168.1.1`  
**Response:** `200 OK` (application/json)
```json
{
  "version": 4,
  "address": "192.168.1.1",
  "family": "IPv4",
  "isCanonical": true,
  "isMulticast": false,
  "isLoopback": false,
  "isLinkLocal": false,
  "isPrivate": true,
  "isPublic": false,
  "isReserved": false,
  "isUnicast": true,
  "isBroadcast": false,
  "isUnknown": false,
  "reservedRole": null,
  "type": "PRIVATE"
}
```

---

### 3. GeoIP Lookup (`GET /geo/:ip?`)
Resolves geographic location, ISP, and ASN data for public IPs with 7-day caching.

- **Client GeoIP**: `GET /geo` (resolves requester IP)
- **Target GeoIP**: `GET /geo/1.1.1.1`

> [!NOTE]
> **Non-Public IP Gateway Guard**: Private/loopback addresses (e.g. `::1`, `10.0.0.1`, `192.168.1.1`) abort upstream queries immediately and return a `302 Redirect` to `/` or `/:ip`.

**Example:** `GET /geo/1.1.1.1`  
**Response:** `200 OK` (application/json)
```json
{
  "ip": "1.1.1.1",
  "ip_version": 4,
  "continent": { "name": "Oceania", "code": "OC" },
  "country": { "name": "Australia", "code": "AU" },
  "region": { "name": "Queensland", "code": "QLD" },
  "city": "Brisbane",
  "latitude": -27.4698,
  "longitude": 153.0251,
  "timezone": "Australia/Brisbane",
  "asn": {
    "asn": "AS13335",
    "name": "Cloudflare, Inc."
  }
}
```

## Benchmark

Tested with Bun 1.3+ on a mix of valid/invalid IPv4 and IPv6 patterns:

```
Total calls  : 2,400,000
Throughput   : ~3,000,000 ops/sec
Zero allocations on error / fast paths
```

> [!NOTE]
> Tested on Intel Core i9-13900HX
> ```
> $ bun src/utils/ipParser.bench.ts
> 
> ⚡ Benchmark Results:
> - Samples       : 12 patterns
> - Total calls   : 2,400,000
> - Time elapsed  : 795.64ms
> - Throughput    : 3,016,424 ops/sec
> ```

## License

MIT
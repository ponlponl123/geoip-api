import type { GeoIPResponse } from "../types/geoip";
import { cache } from "./cache";
import { logger } from "./logger";
import { parseIP } from "../utils/ipParser";
import {
  parseCountryIs,
  parseFreeIpApi,
  parseHackerTarget,
  parseIpApi,
  parseIpInfo,
} from "../utils/geoipParsers";

export class GeoIPService {
  private async safeFetch(name: string, url: string, targetIp: string, customHeaders?: Record<string, string>, timeoutMs = 2500): Promise<any> {
    const start = performance.now();
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": "geoip-api/1.0", ...customHeaders },
      });
      const dur = performance.now() - start;
      logger.outgoing(name, targetIp, dur, res.status);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      const dur = performance.now() - start;
      logger.outgoing(name, targetIp, dur, "TIMEOUT/ERR");
      return null;
    }
  }

  public async lookup(targetIp: string): Promise<GeoIPResponse | null> {
    const parsedIp = parseIP(targetIp);
    if (!parsedIp.isPublic) return null;
    const ip = parsedIp.address || targetIp.trim();

    // 1. Cache hit check (7 days TTL)
    const cacheKey = `geoip:${ip}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as GeoIPResponse;
      } catch {}
    }

    // 2. Sequential fallback execution (no parallel calls to preserve quota)
    const token = process.env.IPINFO_TOKEN;
    const providers: Array<() => Promise<GeoIPResponse | null>> = [
      ...(token
        ? [
            async () => {
              const d = await this.safeFetch(
                "ipinfo.io",
                `https://ipinfo.io/${ip}`,
                ip,
                { Authorization: `Bearer ${token}` },
              );
              return parseIpInfo(d, ip);
            },
          ]
        : []),
      async () => {
        const d = await this.safeFetch("freeipapi.com", `https://freeipapi.com/api/json/${ip}`, ip);
        return parseFreeIpApi(d, ip);
      },
      async () => {
        const d = await this.safeFetch(
          "ip-api.com",
          `http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,mobile,proxy,hosting,query`,
          ip,
        );
        return parseIpApi(d, ip);
      },
      async () => {
        const d = await this.safeFetch("country.is", `https://api.country.is/${ip}`, ip);
        return parseCountryIs(d, ip);
      },
      async () => {
        const d = await this.safeFetch("hackertarget.com", `https://api.hackertarget.com/geoip/?q=${ip}&output=json`, ip);
        return parseHackerTarget(d, ip);
      },
    ];

    for (const fetcher of providers) {
      try {
        const result = await fetcher();
        if (result && (result.country || result.city || result.asn)) {
          if (!result.ip_version && parsedIp.version) {
            result.ip_version = parsedIp.version;
          }
          await cache.set(cacheKey, JSON.stringify(result));
          return result;
        }
      } catch {
        // Fall through to next provider on failure
      }
    }

    return null;
  }
}

export const geoip = new GeoIPService();
export default GeoIPService;

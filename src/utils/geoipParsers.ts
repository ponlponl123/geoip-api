import type { GeoIPResponse } from "../types/geoip";

export function parseFreeIpApi(d: any, fallbackIp: string): GeoIPResponse | null {
  if (!d || (!d.countryName && !d.countryCode)) return null;
  return {
    ip: d.ipAddress || fallbackIp,
    country: (d.countryName || d.countryCode) ? { name: d.countryName || undefined, code: d.countryCode || undefined } : undefined,
    region: (d.regionName || d.regionCode) ? { name: d.regionName || undefined, code: d.regionCode || undefined } : undefined,
    city: d.cityName || undefined,
    latitude: typeof d.latitude === "number" ? d.latitude : undefined,
    longitude: typeof d.longitude === "number" ? d.longitude : undefined,
    timezone: d.timeZones?.[0] || undefined,
    postal_code: d.zipCode || undefined,
    continent: (d.continent || d.continentCode) ? { name: d.continent || undefined, code: d.continentCode || undefined } : undefined,
    asn: (d.asn || d.asnOrganization) ? { asn: d.asn ? `AS${d.asn}` : undefined, name: d.asnOrganization || undefined } : undefined,
    is_proxy: typeof d.isProxy === "boolean" ? d.isProxy : undefined,
  };
}

export function parseHackerTarget(d: any, fallbackIp: string): GeoIPResponse | null {
  if (!d || (!d.country && !d.city)) return null;
  return {
    ip: d.ip || fallbackIp,
    country: d.country ? { name: d.country } : undefined,
    region: d.state ? { name: d.state } : undefined,
    city: d.city || undefined,
    latitude: d.latitude ? Number(d.latitude) : undefined,
    longitude: d.longitude ? Number(d.longitude) : undefined,
  };
}

export function parseCountryIs(d: any, fallbackIp: string): GeoIPResponse | null {
  if (!d || !d.country) return null;
  return {
    ip: d.ip || fallbackIp,
    country: { code: d.country },
    region: d.subdivision ? { code: d.subdivision } : undefined,
    city: d.city || undefined,
    continent: d.continent ? { code: d.continent } : undefined,
    postal_code: d.postal || undefined,
    latitude: typeof d.location?.latitude === "number" ? d.location.latitude : undefined,
    longitude: typeof d.location?.longitude === "number" ? d.location.longitude : undefined,
    timezone: d.location?.time_zone || undefined,
    asn: (d.asn?.number || d.asn?.organization) ? {
      asn: d.asn.number ? `AS${d.asn.number}` : undefined,
      name: d.asn.organization || undefined,
    } : undefined,
  };
}

export function parseIpApi(d: any, fallbackIp: string): GeoIPResponse | null {
  if (!d || d.status !== "success") return null;
  const asnMatch = d.as ? d.as.match(/^AS\d+/i) : null;
  return {
    ip: d.query || fallbackIp,
    country: (d.country || d.countryCode) ? { name: d.country || undefined, code: d.countryCode || undefined } : undefined,
    region: (d.regionName || d.region) ? { name: d.regionName || undefined, code: d.region || undefined } : undefined,
    city: d.city || undefined,
    latitude: typeof d.lat === "number" ? d.lat : undefined,
    longitude: typeof d.lon === "number" ? d.lon : undefined,
    timezone: d.timezone || undefined,
    postal_code: d.zip || undefined,
    continent: (d.continent || d.continentCode) ? { name: d.continent || undefined, code: d.continentCode || undefined } : undefined,
    asn: (d.as || d.org || d.asname) ? {
      asn: asnMatch ? asnMatch[0] : (d.as || undefined),
      name: d.org || d.asname || undefined,
    } : undefined,
    is_mobile: typeof d.mobile === "boolean" ? d.mobile : undefined,
    is_proxy: typeof d.proxy === "boolean" ? d.proxy : undefined,
    is_hosting: typeof d.hosting === "boolean" ? d.hosting : undefined,
  };
}

export function parseIpInfo(d: any, fallbackIp: string): GeoIPResponse | null {
  if (!d || (!d.country && !d.country_code && !d.geo)) return null;
  const geo = d.geo;
  const as = d.as;
  const anon = d.anonymous;
  const locParts = typeof d.loc === "string" ? d.loc.split(",") : [];

  const countryName = geo?.country || d.country || undefined;
  const countryCode = geo?.country_code || d.country_code || undefined;
  const regionName = geo?.region || d.region || undefined;
  const regionCode = geo?.region_code || d.region_code || undefined;
  const continentName = geo?.continent || d.continent || undefined;
  const continentCode = geo?.continent_code || d.continent_code || undefined;

  return {
    ip: d.ip || fallbackIp,
    country: (countryName || countryCode) ? { name: countryName, code: countryCode } : undefined,
    region: (regionName || regionCode) ? { name: regionName, code: regionCode } : undefined,
    city: geo?.city || d.city || undefined,
    latitude: geo?.latitude ?? (locParts[0] ? Number(locParts[0]) : undefined),
    longitude: geo?.longitude ?? (locParts[1] ? Number(locParts[1]) : undefined),
    timezone: geo?.timezone || d.timezone || undefined,
    postal_code: geo?.postal_code || d.postal || undefined,
    continent: (continentName || continentCode) ? { name: continentName, code: continentCode } : undefined,
    asn: (as || d.asn || d.as_name) ? {
      asn: as?.asn || d.asn || undefined,
      name: as?.name || d.as_name || undefined,
      domain: as?.domain || d.as_domain || undefined,
      type: as?.type || undefined,
      last_changed: as?.last_changed || undefined,
    } : undefined,
    is_anonymous: typeof d.is_anonymous === "boolean" ? d.is_anonymous : undefined,
    is_anycast: typeof d.is_anycast === "boolean" ? d.is_anycast : undefined,
    is_hosting: typeof d.is_hosting === "boolean" ? d.is_hosting : undefined,
    is_mobile: typeof d.is_mobile === "boolean" ? d.is_mobile : undefined,
    is_satellite: typeof d.is_satellite === "boolean" ? d.is_satellite : undefined,
    is_proxy: typeof anon?.is_proxy === "boolean" ? anon.is_proxy : undefined,
    is_relay: typeof anon?.is_relay === "boolean" ? anon.is_relay : undefined,
    is_tor: typeof anon?.is_tor === "boolean" ? anon.is_tor : undefined,
    is_vpn: typeof anon?.is_vpn === "boolean" ? anon.is_vpn : undefined,
    is_res_proxy: typeof anon?.is_res_proxy === "boolean" ? anon.is_res_proxy : undefined,
  };
}

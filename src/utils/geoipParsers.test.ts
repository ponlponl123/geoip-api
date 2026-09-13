import { describe, expect, it } from "bun:test";
import {
  parseCountryIs,
  parseFreeIpApi,
  parseHackerTarget,
  parseIpApi,
  parseIpInfo,
} from "./geoipParsers";

describe("GeoIP Parsers", () => {
  it("parses freeipapi.com response", () => {
    const raw = {
      ipVersion: 4,
      ipAddress: "8.8.8.8",
      latitude: 37.386,
      longitude: -122.0838,
      countryName: "United States",
      countryCode: "US",
      cityName: "Mountain View",
      regionName: "California",
      continent: "North America",
      continentCode: "NA",
      timeZones: ["America/Los_Angeles"],
      zipCode: "94035",
      asn: "15169",
      asnOrganization: "GOOGLE",
      isProxy: false,
    };

    const res = parseFreeIpApi(raw, "8.8.8.8")!;
    expect(res.ip).toBe("8.8.8.8");
    expect(res.country?.name).toBe("United States");
    expect(res.country?.code).toBe("US");
    expect(res.city).toBe("Mountain View");
    expect(res.region?.name).toBe("California");
    expect(res.continent?.code).toBe("NA");
    expect(res.timezone).toBe("America/Los_Angeles");
    expect(res.postal_code).toBe("94035");
    expect(res.asn?.asn).toBe("AS15169");
    expect(res.is_proxy).toBe(false);
  });

  it("parses hackertarget.com response", () => {
    const raw = {
      city: "Berkeley",
      country: "United States",
      ip: "9.9.9.9",
      latitude: 37.8767,
      longitude: -122.2676,
      state: "California",
    };

    const res = parseHackerTarget(raw, "9.9.9.9")!;
    expect(res.ip).toBe("9.9.9.9");
    expect(res.city).toBe("Berkeley");
    expect(res.country?.name).toBe("United States");
    expect(res.region?.name).toBe("California");
    expect(res.latitude).toBe(37.8767);
  });

  it("parses country.is response", () => {
    const raw = {
      ip: "77.1.2.3",
      country: "DE",
      city: "Hamburg",
      continent: "EU",
      subdivision: "HH",
      postal: "22041",
      location: {
        latitude: 53.5774,
        longitude: 10.0785,
        time_zone: "Europe/Berlin",
      },
      asn: {
        number: 6805,
        organization: "Telefonica Germany",
      },
    };

    const res = parseCountryIs(raw, "77.1.2.3")!;
    expect(res.ip).toBe("77.1.2.3");
    expect(res.country?.code).toBe("DE");
    expect(res.region?.code).toBe("HH");
    expect(res.city).toBe("Hamburg");
    expect(res.postal_code).toBe("22041");
    expect(res.asn?.asn).toBe("AS6805");
    expect(res.timezone).toBe("Europe/Berlin");
  });

  it("parses ip-api.com response", () => {
    const raw = {
      query: "8.8.4.4",
      status: "success",
      continent: "North America",
      continentCode: "NA",
      country: "United States",
      countryCode: "US",
      region: "CA",
      regionName: "California",
      city: "Mountain View",
      zip: "94035",
      lat: 37.386,
      lon: -122.0838,
      timezone: "America/Los_Angeles",
      as: "AS15169 Google LLC",
      org: "Google LLC",
      mobile: false,
      proxy: false,
      hosting: true,
    };

    const res = parseIpApi(raw, "8.8.4.4")!;
    expect(res.ip).toBe("8.8.4.4");
    expect(res.country?.name).toBe("United States");
    expect(res.country?.code).toBe("US");
    expect(res.asn?.asn).toBe("AS15169");
    expect(res.is_proxy).toBe(false);
    expect(res.is_hosting).toBe(true);
  });

  it("parses ipinfo.io response across tiers", () => {
    const rawEnterprise = {
      ip: "1.1.1.1",
      hostname: "one.one.one.one",
      geo: {
        city: "Brisbane",
        region: "Queensland",
        region_code: "QLD",
        country: "Australia",
        country_code: "AU",
        continent: "Oceania",
        continent_code: "OC",
        latitude: -27.4679,
        longitude: 153.0281,
        timezone: "Australia/Brisbane",
        postal_code: "9010",
      },
      as: {
        asn: "AS13335",
        name: "Cloudflare, Inc.",
        domain: "cloudflare.com",
        type: "hosting",
        last_changed: "2021-05-01",
      },
      is_anonymous: false,
      is_anycast: true,
      is_hosting: true,
      is_mobile: false,
      is_satellite: false,
      anonymous: {
        is_proxy: false,
        is_relay: false,
        is_tor: false,
        is_vpn: false,
        is_res_proxy: false,
      },
    };

    const res = parseIpInfo(rawEnterprise, "1.1.1.1")!;
    expect(res.ip).toBe("1.1.1.1");
    expect(res.country?.name).toBe("Australia");
    expect(res.country?.code).toBe("AU");
    expect(res.region?.name).toBe("Queensland");
    expect(res.region?.code).toBe("QLD");
    expect(res.city).toBe("Brisbane");
    expect(res.latitude).toBe(-27.4679);
    expect(res.longitude).toBe(153.0281);
    expect(res.timezone).toBe("Australia/Brisbane");
    expect(res.postal_code).toBe("9010");
    expect(res.continent?.name).toBe("Oceania");
    expect(res.asn?.asn).toBe("AS13335");
    expect(res.is_anycast).toBe(true);
    expect(res.is_proxy).toBe(false);
    expect(res.is_vpn).toBe(false);
  });
});

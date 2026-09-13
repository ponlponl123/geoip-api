import { describe, expect, it } from "bun:test";
import { ipParser, parseIP } from "./ipParser";

describe("parseIP / ipParser", () => {
    describe("IPv4", () => {
        it("identifies loopback", () => {
            const res = parseIP("127.0.0.1");
            expect(res.version).toBe(4);
            expect(res.family).toBe("IPv4");
            expect(res.isLoopback).toBe(true);
            expect(res.isReserved).toBe(true);
            expect(res.reservedRole).toBe("LOOPBACK");
            expect(res.type).toBe("LOOPBACK");
            expect(res.isCanonical).toBe(true);
        });

        it("identifies private RFC1918 blocks", () => {
            for (const ip of ["10.0.0.1", "172.16.0.1", "172.31.255.1", "192.168.1.1"]) {
                const res = parseIP(ip);
                expect(res.isPrivate).toBe(true);
                expect(res.isPublic).toBe(false);
                expect(res.type).toBe("PRIVATE");
            }
        });

        it("identifies public IP", () => {
            const res = parseIP("8.8.8.8");
            expect(res.isPublic).toBe(true);
            expect(res.isPrivate).toBe(false);
            expect(res.isUnicast).toBe(true);
            expect(res.type).toBe("GLOBAL");
            expect(res.reservedRole).toBeNull();
        });

        it("identifies broadcast", () => {
            const limited = parseIP("255.255.255.255");
            expect(limited.isBroadcast).toBe(true);
            expect(limited.reservedRole).toBe("BROADCAST");
            expect(limited.type).toBe("BROADCAST");

            const subnet = parseIP("192.168.1.255");
            expect(subnet.isBroadcast).toBe(true);
            expect(subnet.reservedRole).toBe("BROADCAST");
        });

        it("identifies gateway and network address", () => {
            const gw = parseIP("0.0.0.0");
            expect(gw.reservedRole).toBe("DEFAULT GATEWAY");
            expect(gw.isReserved).toBe(true);

            const net = parseIP("192.168.1.0");
            expect(net.reservedRole).toBe("NETWORK ADDRESS");
            expect(net.isReserved).toBe(true);
        });

        it("identifies link-local & multicast", () => {
            const link = parseIP("169.254.1.2");
            expect(link.isLinkLocal).toBe(true);
            expect(link.reservedRole).toBe("LINK LOCAL");
            expect(link.type).toBe("LINK LOCAL");

            const multi = parseIP("224.0.0.1");
            expect(multi.isMulticast).toBe(true);
            expect(multi.type).toBe("MULTICAST");
            expect(multi.isUnicast).toBe(false);
        });

        it("handles ports, commas, and canonical detection", () => {
            const withPort = parseIP("1.2.3.4:8080");
            expect(withPort.address).toBe("1.2.3.4");

            const xff = parseIP("1.2.3.4, 10.0.0.1");
            expect(xff.address).toBe("1.2.3.4");

            const nonCanonical = parseIP("192.168.01.1");
            expect(nonCanonical.isCanonical).toBe(false);
            expect(nonCanonical.address).toBe("192.168.1.1");
        });
    });

    describe("IPv6", () => {
        it("identifies loopback ::1", () => {
            const res = parseIP("::1");
            expect(res.version).toBe(6);
            expect(res.family).toBe("IPv6");
            expect(res.isLoopback).toBe(true);
            expect(res.reservedRole).toBe("LOOPBACK");
            expect(res.type).toBe("LOOPBACK");
            expect(res.isCanonical).toBe(true);
        });

        it("identifies unspecified ::", () => {
            const res = parseIP("::");
            expect(res.reservedRole).toBe("DEFAULT GATEWAY");
            expect(res.isUnicast).toBe(false);
        });

        it("identifies link-local & private ULA", () => {
            const link = parseIP("fe80::1");
            expect(link.isLinkLocal).toBe(true);
            expect(link.reservedRole).toBe("LINK LOCAL");
            expect(link.type).toBe("LINK LOCAL");

            const ula = parseIP("fc00::1");
            expect(ula.isPrivate).toBe(true);
            expect(ula.type).toBe("PRIVATE");
        });

        it("identifies multicast", () => {
            const multi = parseIP("ff02::1");
            expect(multi.isMulticast).toBe(true);
            expect(multi.type).toBe("MULTICAST");
            expect(multi.isUnicast).toBe(false);
        });

        it("identifies public and canonical RFC5952", () => {
            const pub = parseIP("2607:f8b0:4005:805::200e");
            expect(pub.isPublic).toBe(true);
            expect(pub.type).toBe("GLOBAL");
            expect(pub.isCanonical).toBe(true);

            const nonCanon = parseIP("2001:0db8:0000:0000:0000:0000:0000:0001");
            expect(nonCanon.address).toBe("2001:db8::1");
            expect(nonCanon.isCanonical).toBe(false);
        });

        it("handles IPv4-mapped IPv6", () => {
            const mapped = parseIP("::ffff:192.168.1.1");
            expect(mapped.version).toBe(4);
            expect(mapped.address).toBe("192.168.1.1");
            expect(mapped.isPrivate).toBe(true);
            expect(mapped.isCanonical).toBe(false);
        });
    });

    describe("Invalid & context", () => {
        it("handles invalid IP", () => {
            for (const inv of ["", "invalid", "999.1.1.1", "::g", null, undefined]) {
                const res = parseIP(inv);
                expect(res.isUnknown).toBe(true);
                expect(res.version).toBe(0);
                expect(res.type).toBe("UNKNOWN");
            }
        });

        it("handles ipParser with string", () => {
            const res = ipParser("8.8.8.8");
            expect(res.isPublic).toBe(true);
        });
    });
});

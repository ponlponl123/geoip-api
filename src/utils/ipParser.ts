import type { Context } from "hono";
import { ipFromContext } from "./ipFromContext";
import type { IPReservedRoleEnum, IPType, IPTypeEnum } from "../types/ip";

export const UNKNOWN_IP: IPType = Object.freeze({
    version: 0,
    address: "",
    family: "",
    isCanonical: false,
    isMulticast: false,
    isLoopback: false,
    isLinkLocal: false,
    isPrivate: false,
    isPublic: false,
    isReserved: false,
    isUnicast: false,
    isBroadcast: false,
    isUnknown: true,
    reservedRole: null,
    type: "UNKNOWN",
});

export function parseIP(raw?: string | null): IPType {
    if (!raw) return { ...UNKNOWN_IP };

    let ip = raw.trim();
    if (!ip) return { ...UNKNOWN_IP };

    const comma = ip.indexOf(",");
    if (comma !== -1) ip = ip.slice(0, comma).trim();

    let isV4Mapped = false;
    if (ip.startsWith("::ffff:")) {
        const potentialV4 = ip.slice(7);
        if (potentialV4.includes(".")) {
            ip = potentialV4;
            isV4Mapped = true;
        }
    }

    if (ip.startsWith("[") && ip.includes("]")) {
        ip = ip.slice(1, ip.indexOf("]"));
    }

    if (ip.includes(".")) {
        const colon = ip.indexOf(":");
        if (colon !== -1 && !ip.includes("::")) ip = ip.slice(0, colon);

        const parts = ip.split(".");
        if (parts.length === 4) {
            let canonical = !isV4Mapped && raw.trim() === ip;
            const bytes = [0, 0, 0, 0];
            let valid = true;

            for (let i = 0; i < 4; i++) {
                const p = parts[i];
                if (!p || p.length > 3) { valid = false; break; }
                if (p.length > 1 && p.charCodeAt(0) === 48) canonical = false;
                let val = 0;
                for (let j = 0; j < p.length; j++) {
                    const code = p.charCodeAt(j);
                    if (code < 48 || code > 57) { valid = false; break; }
                    val = val * 10 + (code - 48);
                }
                if (val > 255) { valid = false; break; }
                bytes[i] = val;
            }

            if (valid) {
                const [b0, b1, b2, b3] = bytes;
                const canonicalAddr = `${b0}.${b1}.${b2}.${b3}`;
                if (canonical && ip !== canonicalAddr) canonical = false;

                const isLoopback = b0 === 127;
                const isLinkLocal = b0 === 169 && b1 === 254;
                const isBroadcast = (b0 === 255 && b1 === 255 && b2 === 255 && b3 === 255) || b3 === 255;
                const isMulticast = b0 >= 224 && b0 <= 239;
                const isPrivate = b0 === 10 ||
                    (b0 === 172 && b1 >= 16 && b1 <= 31) ||
                    (b0 === 192 && b1 === 168);
                const isDefaultGateway = b0 === 0 && b1 === 0 && b2 === 0 && b3 === 0;
                const isNetworkAddress = !isDefaultGateway && b3 === 0;

                const isReservedSpecial = b0 === 0 ||
                    (b0 === 100 && (b1 & 192) === 64) ||
                    (b0 === 192 && b1 === 0 && (b2 === 0 || b2 === 2)) ||
                    (b0 === 198 && (b1 & 254) === 18) ||
                    (b0 === 198 && b1 === 51 && b2 === 100) ||
                    (b0 === 203 && b1 === 0 && b2 === 113) ||
                    b0 >= 240;

                let reservedRole: IPReservedRoleEnum | null = null;
                if (isLoopback) reservedRole = "LOOPBACK";
                else if (isLinkLocal) reservedRole = "LINK LOCAL";
                else if (isBroadcast) reservedRole = "BROADCAST";
                else if (isDefaultGateway) reservedRole = "DEFAULT GATEWAY";
                else if (isNetworkAddress) reservedRole = "NETWORK ADDRESS";

                const isReserved = reservedRole !== null || isReservedSpecial;
                const isPublic = !isPrivate && !isLoopback && !isLinkLocal && !isMulticast && !isBroadcast && !isReserved;
                const isUnicast = !isMulticast && !isBroadcast && !isDefaultGateway;

                let type: IPTypeEnum = "UNKNOWN";
                if (isLoopback) type = "LOOPBACK";
                else if (isLinkLocal) type = "LINK LOCAL";
                else if (isBroadcast) type = "BROADCAST";
                else if (isMulticast) type = "MULTICAST";
                else if (isPrivate) type = "PRIVATE";
                else if (isPublic) type = "GLOBAL";

                return {
                    version: 4,
                    address: canonicalAddr,
                    family: "IPv4",
                    isCanonical: canonical,
                    isMulticast,
                    isLoopback,
                    isLinkLocal,
                    isPrivate,
                    isPublic,
                    isReserved,
                    isUnicast,
                    isBroadcast,
                    isUnknown: false,
                    reservedRole,
                    type,
                };
            }
        }
    }

    if (ip.includes(":")) {
        const doubleColon = ip.indexOf("::");
        let head = ip;
        let tail = "";
        if (doubleColon !== -1) {
            head = ip.slice(0, doubleColon);
            tail = ip.slice(doubleColon + 2);
            if (tail.includes("::")) return { ...UNKNOWN_IP };
        }

        const headParts = head ? head.split(":") : [];
        const tailParts = tail ? tail.split(":") : [];
        const totalParts = headParts.length + tailParts.length;

        if (doubleColon === -1 ? totalParts !== 8 : totalParts > 7) {
            return { ...UNKNOWN_IP };
        }

        const words = new Uint16Array(8);
        let valid = true;

        for (let i = 0; i < headParts.length; i++) {
            const h = headParts[i];
            if (!h || h.length > 4) { valid = false; break; }
            const v = parseInt(h, 16);
            if (Number.isNaN(v)) { valid = false; break; }
            words[i] = v;
        }

        if (valid) {
            const tailStart = 8 - tailParts.length;
            for (let i = 0; i < tailParts.length; i++) {
                const t = tailParts[i];
                if (!t || t.length > 4) { valid = false; break; }
                const v = parseInt(t, 16);
                if (Number.isNaN(v)) { valid = false; break; }
                words[tailStart + i] = v;
            }
        }

        if (valid) {
            let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
            for (let i = 0; i < 8; i++) {
                if (words[i] === 0) {
                    if (curStart === -1) { curStart = i; curLen = 1; }
                    else curLen++;
                    if (curLen > bestLen) { bestStart = curStart; bestLen = curLen; }
                } else {
                    curStart = -1; curLen = 0;
                }
            }

            let canonicalAddr = "";
            if (bestLen > 1) {
                const pre: string[] = [];
                for (let i = 0; i < bestStart; i++) pre.push(words[i].toString(16));
                const post: string[] = [];
                for (let i = bestStart + bestLen; i < 8; i++) post.push(words[i].toString(16));
                canonicalAddr = `${pre.join(":")}::${post.join(":")}`;
                if (canonicalAddr === ":::") canonicalAddr = "::";
            } else {
                const all: string[] = [];
                for (let i = 0; i < 8; i++) all.push(words[i].toString(16));
                canonicalAddr = all.join(":");
            }

            const w0 = words[0];
            const isUnspecified = words.every((w) => w === 0);
            const isLoopback = words.slice(0, 7).every((w) => w === 0) && words[7] === 1;
            const isMulticast = (w0 & 0xff00) === 0xff00;
            const isLinkLocal = (w0 & 0xffc0) === 0xfe80;
            const isPrivate = (w0 & 0xfe00) === 0xfc00;
            const isDoc = w0 === 0x2001 && words[1] === 0x0db8;
            const isDefaultGateway = isUnspecified;

            let reservedRole: IPReservedRoleEnum | null = null;
            if (isLoopback) reservedRole = "LOOPBACK";
            else if (isLinkLocal) reservedRole = "LINK LOCAL";
            else if (isDefaultGateway) reservedRole = "DEFAULT GATEWAY";

            const isReserved = reservedRole !== null || isDoc || isMulticast;
            const isPublic = !isPrivate && !isLoopback && !isLinkLocal && !isMulticast && !isReserved;
            const isUnicast = !isMulticast && !isUnspecified;

            let type: IPTypeEnum = "UNKNOWN";
            if (isLoopback) type = "LOOPBACK";
            else if (isLinkLocal) type = "LINK LOCAL";
            else if (isMulticast) type = "MULTICAST";
            else if (isPrivate) type = "PRIVATE";
            else if (isPublic) type = "GLOBAL";

            const isCanonical = raw.trim() === canonicalAddr;

            return {
                version: 6,
                address: canonicalAddr,
                family: "IPv6",
                isCanonical,
                isMulticast,
                isLoopback,
                isLinkLocal,
                isPrivate,
                isPublic,
                isReserved,
                isUnicast,
                isBroadcast: false,
                isUnknown: false,
                reservedRole,
                type,
            };
        }
    }

    return { ...UNKNOWN_IP };
}

export function ipParser(c: Context | string | null | undefined): IPType {
    const ip = typeof c === "string" ? c : c ? ipFromContext(c) : null;
    return parseIP(ip);
}

import type { Context } from "hono";
import type { IPReservedRoleEnum, IPType, IPTypeEnum } from "../types/ip";
import { ipFromContext } from "../utils/ipFromContext";
import { parseIP } from "../utils/ipParser";

export class IP implements IPType {
    public readonly version: number;
    public readonly address: string;
    public readonly family: string;
    public readonly isCanonical: boolean;
    public readonly isMulticast: boolean;
    public readonly isLoopback: boolean;
    public readonly isLinkLocal: boolean;
    public readonly isPrivate: boolean;
    public readonly isPublic: boolean;
    public readonly isReserved: boolean;
    public readonly isUnicast: boolean;
    public readonly isBroadcast: boolean;
    public readonly isUnknown: boolean;
    public readonly reservedRole?: IPReservedRoleEnum | null;
    public readonly type: IPTypeEnum;

    constructor(input?: Context | string | null) {
        const raw = typeof input === "string" ? input : input ? ipFromContext(input) : null;
        const p = parseIP(raw);

        this.version = p.version;
        this.address = p.address;
        this.family = p.family;
        this.isCanonical = p.isCanonical;
        this.isMulticast = p.isMulticast;
        this.isLoopback = p.isLoopback;
        this.isLinkLocal = p.isLinkLocal;
        this.isPrivate = p.isPrivate;
        this.isPublic = p.isPublic;
        this.isReserved = p.isReserved;
        this.isUnicast = p.isUnicast;
        this.isBroadcast = p.isBroadcast;
        this.isUnknown = p.isUnknown;
        this.reservedRole = p.reservedRole ?? null;
        this.type = p.type;
    }

    public static parse(raw?: string | null): IP {
        return new IP(raw);
    }

    public static from(c: Context): IP {
        return new IP(c);
    }

    public toJSON(): IPType {
        return {
            version: this.version,
            address: this.address,
            family: this.family,
            isCanonical: this.isCanonical,
            isMulticast: this.isMulticast,
            isLoopback: this.isLoopback,
            isLinkLocal: this.isLinkLocal,
            isPrivate: this.isPrivate,
            isPublic: this.isPublic,
            isReserved: this.isReserved,
            isUnicast: this.isUnicast,
            isBroadcast: this.isBroadcast,
            isUnknown: this.isUnknown,
            reservedRole: this.reservedRole ?? null,
            type: this.type,
        };
    }

    public toString(): string {
        return this.address;
    }
}

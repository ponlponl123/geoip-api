import { describe, expect, it } from "bun:test";
import { ipFromContext } from "./ipFromContext";
import type { Context } from "hono";

function mockContext(headers: Record<string, string> = {}): Context {
    return {
        req: {
            header: (name: string) => headers[name.toLowerCase()] ?? headers[name] ?? null,
        },
    } as unknown as Context;
}

describe("ipFromContext", () => {
    it("extracts cf-connecting-ip as priority header", () => {
        const c = mockContext({
            "cf-connecting-ip": "1.1.1.1",
            "x-forwarded-for": "8.8.8.8",
        });
        expect(ipFromContext(c)).toBe("1.1.1.1");
    });

    it("falls back to x-forwarded-for when cf-connecting-ip is missing", () => {
        const c = mockContext({
            "x-forwarded-for": "8.8.8.8",
        });
        expect(ipFromContext(c)).toBe("8.8.8.8");
    });

    it("falls back to x-real-ip when preceding headers missing", () => {
        const c = mockContext({
            "x-real-ip": "9.9.9.9",
        });
        expect(ipFromContext(c)).toBe("9.9.9.9");
    });

    it("returns null when no proxy headers or conn info present", () => {
        const c = mockContext({});
        expect(ipFromContext(c)).toBeNull();
    });
});

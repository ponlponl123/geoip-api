import { Hono } from "hono/tiny";
import { geoip } from "./core/geoip";
import { logger } from "./core/logger";
import { ipParser, parseIP } from "./utils/ipParser";
import { ipFromContext } from "./utils/ipFromContext";

const app = new Hono();

app.use("*", async (c, next) => {
    const start = performance.now();
    const clientIp = ipFromContext(c) || "";
    await next();
    logger.traffic(c.req.method, c.req.path, c.res.status, performance.now() - start, clientIp);
});

app.get("/", (c) => {
    const ip = ipParser(c);
    return c.text(
        [
            "Hello, World!\n",
            `Your IP: ${ip.address}`,
            JSON.stringify(ip, null, 2),
        ].join("\n"),
    );
});

app.get("/geo/:ip?", async (c) => {
    try {
        const raw = c.req.param("ip");
        const ip = raw ? parseIP(raw) : ipParser(c);
        if (!ip.isPublic) {
            return c.redirect(raw ? `/${ip.address}` : "/");
        }
        const geo = await geoip.lookup(ip.address);
        return c.json(geo);
    } catch {
        return c.text("Error", 500);
    }
});

app.get("/:ip", (c) => {
    try {
        const ip = c.req.param("ip");
        return c.json(parseIP(ip));
    } catch {
        return c.text("Error", 500);
    }
});

export default {
    port: parseInt(Bun.env.PORT || "4002"),
    fetch: app.fetch,
};
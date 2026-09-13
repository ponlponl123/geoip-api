import { Hono } from "hono/tiny";
import { ipFromContext } from "./utils/ipFromContext";
import { IP } from "./core/ip";

const app = new Hono();

app.get("/", (c) => {
    const ip = new IP(c);
    return c.text(
        [
            "Hello, World!\n",
            `Your IP: ${ip.address}`,
            JSON.stringify(ip, null, 2),
        ].join("\n"),
    );
});

export default {
    port: 4002,
    fetch: app.fetch,
};